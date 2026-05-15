// This service handles match creation, retrieval, and result recording, including ELO updates.

import { Match } from '../models/Match.js';
import { User } from '../models/User.js';
import { GameCategory } from '../models/GameCategory.js';
import { Tournament } from '../models/Tournament.js';
import { CustomError } from '../utils/customError.js';

async function lockWager(playerIds, coinWager) {
    if (coinWager <= 0) return;

    const uniquePlayerIds = [...new Set(playerIds.map(playerId => playerId.toString()))];
    if (uniquePlayerIds.length !== 2) {
        throw new CustomError("Coin wager requires exactly two registered players", 400, "BAD_REQUEST");
    }

    const players = await User.find({ _id: { $in: uniquePlayerIds } });
    if (players.length !== 2) {
        throw new CustomError("Could not lock wager: one or more players were not found", 404, "NOT_FOUND");
    }

    for (const player of players) {
        if (!Number.isFinite(player.coins)) {
            player.coins = 0;
        }
        if (player.coins < coinWager) {
            throw new CustomError(`${player.username} does not have enough coins for this wager`, 400, "BAD_REQUEST");
        }
    }

    for (const player of players) {
        player.coins -= coinWager;
        await player.save();
    }
}

export async function getAllMatches({ page = 1, limit = 10, status, gameCategoryId, userId }){
    const filter = {};

    // This builds a filter based on which query params were provided
    if (status) filter.status = status;
    if (gameCategoryId) filter.gameCategory = gameCategoryId;
    // Look up the user's MongoDB _id from their custom userId, then filter by it
    if (userId) {
        const user = await User.findOne({ userId });
        if (user) filter.players = user._id;
    }

    // populate() replaces ObjectId references with the actual documents from their collections
    // Only the selected fields are returned for players to avoid exposing sensitive data
    const matchList = await Match.find(filter)
        .populate('players', 'username userId eloRating')
        .populate('gameCategory')
        .skip((page - 1) * limit)
        .limit(limit);
    
    const totalMatches = await Match.countDocuments(filter);

    return { 
        matchList, 
        totalMatches, 
        page, 
        limit, 
        totalPages: Math.ceil(totalMatches / limit)};
}

export async function getMatch(matchId){
     const match = await Match.findOne({ matchId })
        .populate('players', 'username userId eloRating')
        .populate('gameCategory');
     if(!match){
        throw new CustomError(`A match with id ${matchId}? That game never happened`, 404, "NOT_FOUND");
    }

    return match;
}

export async function createMatch(matchData){
    const { gameCategoryId, players, isAnonymous, allowAnonymous, desiredOpponentElo, coinWager = 0 } = matchData;
 
    // This prevents a player from being matched against themselves
    if (players.length === 2 && players[0].toString() === players[1].toString()) {
        throw new CustomError("Silly you! You cannot play against yourself", 400, "BAD_REQUEST");
    }

    if (coinWager > 0 && (isAnonymous || players.length === 0)) {
        throw new CustomError("Coin wagers are only available for registered-player matches", 400, "BAD_REQUEST");
    }

    if (coinWager > 0 && players.length === 2) {
        await lockWager(players, coinWager);
    }
    
    const newMatch = await Match.create({
        gameCategory: gameCategoryId,
        players: players,
        isAnonymous: isAnonymous ?? false,
        allowAnonymous: allowAnonymous ?? false,
        desiredOpponentElo: desiredOpponentElo ?? null,
        coinWager: coinWager ?? 0,
        wagerLocked: coinWager > 0 && players.length >= 2,
        status: players.length >= 2 ? 'ongoing' : 'waiting'
    });
    return newMatch;
}

export async function recordMatch(matchId, matchData){
    const match = await Match.findOne({ matchId });
    if(!match){
        throw new CustomError(`A match with id ${matchId}? That game never happened`, 404, "NOT_FOUND");
    }

    // Object.assign copies all properties from matchData onto the match document
    Object.assign(match, matchData);

    match.status = "finished";

    // !match.isAnonymous skips ELO updates and winner validation for anonymous matches 
    // since they have no user accounts
    if (!match.isAnonymous) {
        // This checks the winner is actually one of the two players in this match
        const isValidWinner = match.players.map(player => player.toString()).includes(match.winner.toString());
        if (!isValidWinner) {
            throw new CustomError("Your so silly! You can't win a match you weren't even in!", 400, "BAD_REQUEST");
        }

        // ELO rating updates using the Elo algorithm (https://www.geeksforgeeks.org/dsa/elo-rating-algorithm/)
        // K=32 controls how much ratings change per match
        // Expected score is the probability of winning based on rating difference
        // Actual score is 1 for win, 0 for loss
        const K = 32;

        const player1 = await User.findById(match.players[0]);
        const player2 = await User.findById(match.players[1]);

        // Checks if both players still exists
        if (!player1 || !player2) {
            throw new CustomError("Oops! One or more players have left the building!", 404, "NOT_FOUND");
        }

        // Determine which Elo field to update based on the game category's time controller
        const gameCategory = await GameCategory.findById(match.gameCategory);
        const eloField = gameCategory ? `eloRating${gameCategory.timeController}s` : 'eloRating';

        // expected scores
        const expected1 = 1 / (1 + Math.pow(10, (player2[eloField] - player1[eloField]) / 400));
        const expected2 = 1 / (1 + Math.pow(10, (player1[eloField] - player2[eloField]) / 400));

        // actual scores (1 = win, 0 = loss)
        const score1 = match.winner.toString() === player1._id.toString() ? 1 : 0;
        const score2 = 1 - score1;

        // new ratings
        const newRating1 = Math.round(player1[eloField] + K * (score1 - expected1));
        const newRating2 = Math.round(player2[eloField] + K * (score2 - expected2));

        // This store the ELO delta for each player, so weekly rating change can be calculated in the user profile
        match.eloChanges = [
            { userId: player1._id, delta: newRating1 - player1[eloField] },
            { userId: player2._id, delta: newRating2 - player2[eloField] }
        ];

        // update the time-control-specific rating
        player1[eloField] = newRating1;
        await player1.save();

        player2[eloField] = newRating2;
        await player2.save();
        
        if (match.tournamentId) {
            // $elemMatch searches inside nested arrays, and finds the tournament that contains this match in its rounds
            const tournament = await Tournament.findOne({ 
                'rounds': { $elemMatch: { $elemMatch: { matchId: match._id } } }
            });
            
            if (tournament && tournament.status !== "finished") {
                // check if this was the last match (only 1 match in the latest round)
                const lastRound = tournament.rounds[tournament.rounds.length - 1];
                // if only 1 match in the last round, this is the final
                // Then marks tournament as finished and award trophy
                if (lastRound && lastRound.length === 1) {
                    // this is the final match - award trophy to winner
                    tournament.status = "finished";
                    await tournament.save();
                    
                    if (match.winner && tournament.trophy) {
                        // $push adds the trophy to the winner's trophies array without overwriting existing trophies
                        await User.findByIdAndUpdate(match.winner, {
                            $push: { trophies: tournament.trophy }
                        });
                    }
                }
            }
        }

        if (match.coinWager > 0 && match.wagerLocked && !match.wagerPaidOut) {
            const winner = await User.findById(match.winner);
            if (!winner) {
                throw new CustomError("Winner account could not be found for coin payout", 404, "NOT_FOUND");
            }

            winner.coins += match.coinWager * 2;
            await winner.save();
            match.wagerPaidOut = true;
        }
    }

    await match.save();

    return match;
}

// This function adds a user to an existing waiting match
export async function joinMatch(matchId, userId) {
    const match = await Match.findOne({ matchId });
    if (!match) {
        throw new CustomError(`Match ${matchId} not found`, 404, "NOT_FOUND");
    }
    // Only matches with status 'waiting' can be joined
    if (match.status !== 'waiting') {
        throw new CustomError("This match is not open to join", 400, "BAD_REQUEST");
    }
    // Prevents the same user from joining twice
    if (match.players.map(p => p.toString()).includes(userId)) {
        throw new CustomError("You are already in this match", 400, "BAD_REQUEST");
    }
    // Anonymous users cannot join games that don't allow them
    if (!match.allowAnonymous && !userId) {
        throw new CustomError("This game requires a registered account to join", 403, "FORBIDDEN");
    }
    if (!userId && match.coinWager > 0) {
        throw new CustomError("Anonymous players cannot join wagered matches", 403, "FORBIDDEN");
    }

    if (userId) {
        match.players.push(userId);
    } else {
        match.anonymousCount++;
    }

    // Start the match once 2 players have joined
    if (match.players.length + match.anonymousCount >= 2) {
        if (match.coinWager > 0 && !match.wagerLocked) {
            await lockWager(match.players, match.coinWager);
            match.wagerLocked = true;
        }
        match.status = 'ongoing';
    }

    await match.save();
    return match;
}


export default {
    getAllMatches,
    getMatch,
    createMatch,
    recordMatch,
    joinMatch
};