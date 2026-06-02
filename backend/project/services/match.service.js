// This service handles match creation, retrieval, and result recording, including ELO updates.

import { Match } from '../models/Match.js';
import { User } from '../models/User.js';
import { GameCategory } from '../models/GameCategory.js';
import { Tournament } from '../models/Tournament.js';
import { CustomError } from '../utils/customError.js';
import { TOURNAMENT_WIN_BONUS } from '../config/constants.js';

async function lockWager(playerIds, coinWager) {
    if (coinWager <= 0) return;

    const uniquePlayerIds = [...new Set(playerIds.map((playerId) => playerId.toString()))];
    if (uniquePlayerIds.length < 2) {
        throw new CustomError('Coin wager requires at least two registered players', 400, 'BAD_REQUEST');
    }

    const players = await User.find({ _id: { $in: uniquePlayerIds } });
    if (players.length !== uniquePlayerIds.length) {
        throw new CustomError('Could not lock wager: one or more players were not found', 404, 'NOT_FOUND');
    }

    for (const player of players) {
        if (!Number.isFinite(player.coins)) {
            player.coins = 0;
        }
        if (player.coins < coinWager) {
            throw new CustomError(`${player.username} does not have enough coins for this wager`, 400, 'BAD_REQUEST');
        }
    }

    for (const player of players) {
        player.coins -= coinWager;
        await player.save();
    }
}

export async function getAllMatches({ page = 1, limit = 10, status, gameCategoryId, userId }) {
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
        .sort({ _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

    const totalMatches = await Match.countDocuments(filter);

    return {
        matchList,
        totalMatches,
        page,
        limit,
        totalPages: Math.ceil(totalMatches / limit)
    };
}

export async function getMatch(matchId) {
    const match = await Match.findOne({ matchId }).populate('players', 'username userId eloRating').populate('gameCategory');
    if (!match) {
        throw new CustomError(`A match with id ${matchId}? That game never happened`, 404, 'NOT_FOUND');
    }

    return match;
}

export async function createMatch(matchData) {
    const { gameCategoryId, players, desiredOpponentElo, coinWager = 0, maxPlayers = 2 } = matchData;

    // This prevents a player from being matched against themselves
    if (players.length === 2 && players[0].toString() === players[1].toString()) {
        throw new CustomError('Silly you! You cannot play against yourself', 400, 'BAD_REQUEST');
    }

    if (coinWager > 0 && players.length === 0) {
        throw new CustomError('Coin wagers are only available for registered-player matches', 400, 'BAD_REQUEST');
    }

    if (coinWager > 0 && players.length >= maxPlayers) {
        await lockWager(players, coinWager);
    }

    const newMatch = await Match.create({
        gameCategory: gameCategoryId,
        players: players,
        maxPlayers: maxPlayers,
        desiredOpponentElo: desiredOpponentElo ?? null,
        coinWager: coinWager ?? 0,
        wagerLocked: coinWager > 0 && players.length >= maxPlayers,
        status: players.length >= maxPlayers ? 'ongoing' : 'waiting'
    });

    return newMatch;
}

export async function recordMatch(matchId, matchData) {
    const match = await Match.findOne({ matchId });
    if (!match) {
        throw new CustomError(`A match with id ${matchId}? That game never happened`, 404, 'NOT_FOUND');
    }

    // Object.assign copies all properties from matchData onto the match document
    Object.assign(match, matchData);

    match.status = 'finished';

    // This checks the winner is actually one of the two players in this match
    const isValidWinner = match.players.map((player) => player.toString()).includes(match.winner.toString());
    if (!isValidWinner) {
        throw new CustomError("Your so silly! You can't win a match you weren't even in!", 400, 'BAD_REQUEST');
    }

    // ELO rating updates using the Elo algorithm (https://www.geeksforgeeks.org/dsa/elo-rating-algorithm/)
    // eloK=32 controls how much ratings change per match
    // Expected score is the probability of winning based on rating difference
    // Actual score is 1 for win, 0 for loss
    const eloK = 32;

    const player1 = await User.findById(match.players[0]);
    const player2 = await User.findById(match.players[1]);

    // Checks if both players still exists
    if (!player1 || !player2) {
        throw new CustomError('Oops! One or more players have left the building!', 404, 'NOT_FOUND');
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
    const newRating1 = Math.round(player1[eloField] + eloK * (score1 - expected1));
    const newRating2 = Math.round(player2[eloField] + eloK * (score2 - expected2));

    // This store the ELO delta for each player, so weekly rating change can be calculated in the user profile
    match.eloChanges = [
        { userId: player1._id, delta: newRating1 - player1[eloField] },
        { userId: player2._id, delta: newRating2 - player2[eloField] }
    ];

    // update the time-control-specific rating
    player1[eloField] = newRating1;
    player1.eloRating = newRating1;
    await player1.save();

    player2[eloField] = newRating2;
    player2.eloRating = newRating2;
    await player2.save();

    if (match.tournamentId) {
        // $elemMatch searches inside nested arrays, and finds the tournament that contains this match in its rounds
        const tournament = await Tournament.findOne({
            rounds: { $elemMatch: { $elemMatch: { matchId: match._id } } }
        });

        if (tournament && !['finished', 'cancelled'].includes(tournament.status)) {
            // Points-based format: all participants play every round.
            // Tournament ends when all rounds have been played AND every match in every round is finished.
            const allMatchIds = tournament.rounds.flat().map(entry => entry.matchId);
            const unfinishedCount = await Match.countDocuments({
                _id: { $in: allMatchIds },
                status: { $ne: 'finished' }
            });
            const allRoundsPlayed = tournament.rounds.length >= tournament.numberOfRounds;

            if (unfinishedCount === 0 && allRoundsPlayed) {
                // Count wins per participant across all rounds to find the overall winner
                const allMatches = await Match.find({ _id: { $in: allMatchIds } });
                const winCounts = {};
                for (const m of allMatches) {
                    if (m.winner) {
                        const wId = m.winner.toString();
                        winCounts[wId] = (winCounts[wId] || 0) + 1;
                    }
                }
                // Sort by win count descending, pick the top player
                const sorted = Object.entries(winCounts).sort((a, b) => b[1] - a[1]);
                const winnerId = sorted[0]?.[0];

                tournament.status = 'finished';
                await tournament.save();

                if (winnerId && tournament.trophy) {
                    // $push adds the trophy to the winner's trophies array without overwriting existing trophies
                    await User.findByIdAndUpdate(winnerId, {
                        $push: { trophies: tournament.trophy }
                    });
                }
                // Coin bonus for winning the tournament
                if (winnerId) {
                    await User.findByIdAndUpdate(winnerId, { $inc: { coins: TOURNAMENT_WIN_BONUS } });
                }
            }
        }
    }

    if (match.coinWager > 0 && match.wagerLocked && !match.wagerPaidOut) {
        const winner = await User.findById(match.winner);
        if (!winner) {
            throw new CustomError('Winner account could not be found for coin payout', 404, 'NOT_FOUND');
        }

        winner.coins += match.coinWager * 2;
        await winner.save();
        match.wagerPaidOut = true;
    }

    await match.save();

    return match;
}

// This function adds a user to an existing waiting match
export async function joinMatch(matchId, userId) {
    const match = await Match.findOne({ matchId });
    if (!match) {
        throw new CustomError(`Match ${matchId} not found`, 404, 'NOT_FOUND');
    }
    // Only matches with status 'waiting' can be joined
    if (match.status !== 'waiting') {
        throw new CustomError('This match is not open to join', 400, 'BAD_REQUEST');
    }
    // Prevents the same user from joining twice
    if (match.players.map((player) => player.toString()).includes(userId)) {
        throw new CustomError('You are already in this match', 400, 'BAD_REQUEST');
    }
    if (!userId) {
        throw new CustomError('This game requires a registered account to join', 403, 'FORBIDDEN');
    }

    match.players.push(userId);

    if (match.players.length >= match.maxPlayers) {
        if (match.coinWager > 0 && !match.wagerLocked) {
            await lockWager(match.players, match.coinWager);
            match.wagerLocked = true;
        }
        match.status = 'ongoing';
    }

    await match.save();
    return match;
}

export async function leaveMatch(matchId, userId) {
    const match = await Match.findOne({ matchId });
    if (!match) {
        throw new CustomError(`Match ${matchId} not found`, 404, 'NOT_FOUND');
    }
    if (match.status !== 'waiting') {
        throw new CustomError("You can only leave a match that hasn't started yet", 400, 'BAD_REQUEST');
    }
    if (!userId) {
        throw new CustomError('Anonymous users cannot leave a match', 400, 'BAD_REQUEST');
    }

    const isPlayer = match.players.map((player) => player.toString()).includes(userId);
    if (!isPlayer) {
        throw new CustomError('You are not in this match', 400, 'BAD_REQUEST');
    }

    match.players = match.players.filter((player) => player.toString() !== userId);

    // No players left — delete the match entirely
    if (match.players.length === 0) {
        await Match.deleteOne({ matchId });
        return { deleted: true };
    }

    await match.save();
    return match;
}

export default {
    getAllMatches,
    getMatch,
    createMatch,
    recordMatch,
    joinMatch,
    leaveMatch
};
