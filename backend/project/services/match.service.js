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

    if (status) filter.status = status;
    if (gameCategoryId) filter.gameCategory = gameCategoryId;

    if (userId) {
        const user = await User.findOne({ userId });
        if (user) filter.players = user._id;
    }

    const matchList = await Match.find(filter)
        .populate('players', 'username userId eloRating profileImage')
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
    const match = await Match.findOne({ matchId }).populate('players', 'username userId eloRating profileImage').populate('gameCategory');
    if (!match) {
        throw new CustomError(`A match with id ${matchId}? That game never happened`, 404, 'NOT_FOUND');
    }

    return match;
}

export async function createMatch(matchData) {
    const { gameCategoryId, players, desiredOpponentElo, coinWager = 0, maxPlayers = 2 } = matchData;

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

    Object.assign(match, matchData);

    match.status = 'finished';

    const isValidWinner = match.players.map((player) => player.toString()).includes(match.winner.toString());
    if (!isValidWinner) {
        throw new CustomError("Your so silly! You can't win a match you weren't even in!", 400, 'BAD_REQUEST');
    }

    const eloKFactor = 32;

    const player1 = await User.findById(match.players[0]);
    const player2 = await User.findById(match.players[1]);

    if (!player1 || !player2) {
        throw new CustomError('Oops! One or more players have left the building!', 404, 'NOT_FOUND');
    }

    const gameCategory = await GameCategory.findById(match.gameCategory);
    const eloField = gameCategory ? `eloRating${gameCategory.timeController}s` : 'eloRating';

    const expected1 = 1 / (1 + Math.pow(10, (player2[eloField] - player1[eloField]) / 400));
    const expected2 = 1 / (1 + Math.pow(10, (player1[eloField] - player2[eloField]) / 400));

    const score1 = match.winner.toString() === player1._id.toString() ? 1 : 0;
    const score2 = 1 - score1;

    const newRating1 = Math.round(player1[eloField] + eloKFactor * (score1 - expected1));
    const newRating2 = Math.round(player2[eloField] + eloKFactor * (score2 - expected2));

    match.eloChanges = [
        { userId: player1._id, delta: newRating1 - player1[eloField] },
        { userId: player2._id, delta: newRating2 - player2[eloField] }
    ];

    player1[eloField] = newRating1;
    player1.eloRating = newRating1;
    await player1.save();

    player2[eloField] = newRating2;
    player2.eloRating = newRating2;
    await player2.save();

    if (match.tournamentId) {
        const tournament = await Tournament.findOne({
            rounds: { $elemMatch: { $elemMatch: { matchId: match._id } } }
        });

        if (tournament && !['finished', 'cancelled'].includes(tournament.status)) {
            const allMatchIds = tournament.rounds.flat().map(entry => entry.matchId);
            const unfinishedCount = await Match.countDocuments({
                _id: { $in: allMatchIds },
                status: { $ne: 'finished' }
            });
            const allRoundsPlayed = tournament.rounds.length >= tournament.numberOfRounds;

            if (unfinishedCount === 0 && allRoundsPlayed) {
                const allMatches = await Match.find({ _id: { $in: allMatchIds } });
                const winCounts = {};
                for (const match of allMatches) {
                    if (match.winner) {
                        const winnerId = match.winner.toString();
                        winCounts[winnerId] = (winCounts[winnerId] || 0) + 1;
                    }
                }

                const sorted = Object.entries(winCounts).sort((entryA, entryB) => entryB[1] - entryA[1]);
                const winnerId = sorted[0]?.[0];

                tournament.status = 'finished';
                await tournament.save();

                if (winnerId && tournament.trophy) {
                    await User.findByIdAndUpdate(winnerId, {
                        $push: { trophies: tournament.trophy }
                    });
                }

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

export async function joinMatch(matchId, userId) {
    const match = await Match.findOne({ matchId });
    if (!match) {
        throw new CustomError(`Match ${matchId} not found`, 404, 'NOT_FOUND');
    }
    if (match.status !== 'waiting') {
        throw new CustomError('This match is not open to join', 400, 'BAD_REQUEST');
    }
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
