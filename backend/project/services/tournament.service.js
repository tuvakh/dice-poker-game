// Chanya
// This service handles tournament creation, joining, and round progression.

import { Tournament } from '../models/Tournament.js';
import { Match } from '../models/Match.js';
import { CustomError } from '../utils/customError.js';

export async function getAllTournaments({ page = 1, limit = 10, status }){
    const filter = {};

    // only add status to the filter if it was provided
    // otherwise return all tournaments
    if (status) filter.status = status;

    const tournamentList = await Tournament.find(filter)
        .populate('trophy', 'title imageUrl')
        .populate('gameCategory', 'numberOfRounds gameRules timeController')
        .skip((page - 1) * limit)
        .limit(limit);

    const totalTournaments = await Tournament.countDocuments(filter);

    return {
        tournamentList,
        totalTournaments,
        page,
        limit,
        totalPages: Math.ceil(totalTournaments / limit)};
}

export async function getTournament(tournamentId){
    const tournament = await Tournament.findOne({ tournamentId })
        .populate('participants', 'username')
        .populate('trophy')
        .populate('gameCategory');

     if(!tournament){
        throw new CustomError(`A tournament with the id ${tournamentId} doesn't exist.. Maybe it was cancelled? :(`, 404, "NOT_FOUND");
    }

    // This populates match details for each round
    // endedAt is included so the frontend can calculate a countdown to the next round
    const populatedRounds = await Promise.all(
        tournament.rounds.map(async (round) => {
            return Promise.all(
                round.map(async (entry) => {
                    return await Match.findById(entry.matchId).select("players winner outcome status matchId endedAt");
                })
            );
        })
    );

    // This builds standings by extracting the winner from each match in each round
    // filter(Boolean) removes null values in case a match has no winner yet
    const standings = populatedRounds.map((round, index) => ({
        round: index + 1,
        winners: round.map(match => match?.winner).filter(Boolean)
    }));

    return { ...tournament.toObject(), rounds: populatedRounds, standings };
}

export async function leaveTournament(tournamentId, userId){
    const tournament = await Tournament.findOne({ tournamentId });
    if(!tournament){
        throw new CustomError(`A tournament with the id ${tournamentId} doesn't exist.`, 404, "NOT_FOUND");
    }
    // Players can leave at any point unless the tournament is already finished or cancelled
    if(["finished", "cancelled"].includes(tournament.status)){
        throw new CustomError("This tournament is already done — you can't leave now.", 400, "BAD_REQUEST");
    }
    const before = tournament.participants.length;
    tournament.participants = tournament.participants.filter(p => !p.equals(userId));
    if(tournament.participants.length === before){
        throw new CustomError("You are not a participant in this tournament.", 404, "NOT_FOUND");
    }
    await tournament.save();
    return tournament;
}

export async function createTournament(tournamentData){
    const newTournament = await Tournament.create(tournamentData);
    return newTournament;
}

export async function joinTournament(tournamentId, userId){
    const tournament = await Tournament.findOne({ tournamentId });
    if(!tournament){
        throw new CustomError(`A tournament with the id ${tournamentId} doesn't exist.. Maybe it was cancelled? :(`, 404, "NOT_FOUND");
    }

    // Prevent joining a finished or cancelled tournament
    if (["finished", "cancelled"].includes(tournament.status)) {
        throw new CustomError("This tournament is done or cancelled. You missed it!", 400, "BAD_REQUEST");
    }

    // .equals() is used here instead of === because participants are MongoDB ObjectIds, not plain strings
    if (tournament.participants.some(player => player.equals(userId))){
        throw new CustomError("You're already in this tournament, no need to join twice!", 409, "CONFLICT");
    }

    tournament.participants.push(userId);
    await tournament.save();
    return tournament;
}

// Points-based format: ALL participants play every round.
// Winner is determined by total wins accumulated across all rounds (not knockout).
export async function knockoutRounds(tournamentId){
    const tournament = await Tournament.findOne({ tournamentId });
    if(!tournament){
        throw new CustomError(`A tournament with id the ${tournamentId} don't exist.. Maybe it was cancelled? :(`, 404, "NOT_FOUND");
    }

    // Block if we've already run all the rounds
    if (tournament.rounds.length >= tournament.numberOfRounds) {
        throw new CustomError("All rounds have already been played!", 400, "BAD_REQUEST");
    }

    if (tournament.participants.length === 0) {
        throw new CustomError("A tournament with no players? That's just an empty room!", 400, "BAD_REQUEST");
    }

    // Require previous round to be fully finished before starting a new one
    if (tournament.rounds.length > 0) {
        const lastRound = tournament.rounds[tournament.rounds.length - 1];
        const unfinished = await Match.countDocuments({
            _id: { $in: lastRound.map(round => round.matchId) },
            status: { $ne: "finished" }
        });
        if (unfinished > 0) {
            throw new CustomError("Not so fast! Everyone needs to finish their matches before the next round begins", 400, "BAD_REQUEST");
        }
    }

    // Points-based: ALL participants play every round, not just the winners
    const participants = [...tournament.participants];

    // shuffle participants randomly for fair pairing
    for (let i = participants.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [participants[i], participants[j]] = [participants[j], participants[i]];
    }

    // pair participants and create matches
    const roundMatches = [];
    for (let i = 0; i < participants.length; i += 2) {
        if (participants[i + 1]) {
            // create match for this pair
            const match = await Match.create({
                players: [participants[i], participants[i + 1]],
                gameCategory: tournament.gameCategory,
                tournamentId: tournament._id,
                status: 'ongoing'
            });
            roundMatches.push({ matchId: match._id });
        }
        // if odd number of players, last player gets a bye (sits this round out)
    }

    // change status from upcoming to ongoing when the first round starts
    if (tournament.status === "upcoming") tournament.status = "ongoing";

    tournament.rounds.push(roundMatches);
    await tournament.save();
    return tournament;
}

// Permanently removes a tournament from the database (admin only)
export async function deleteTournament(tournamentId){
    const tournament = await Tournament.findOneAndDelete({ tournamentId });
    if(!tournament){
        throw new CustomError(`A tournament with id ${tournamentId} doesn't exist.`, 404, "NOT_FOUND");
    }
    return tournament;
}

// Marks a tournament as cancelled without deleting it (admin only)
export async function cancelTournament(tournamentId){
    const tournament = await Tournament.findOne({ tournamentId });
    if(!tournament){
        throw new CustomError(`A tournament with id ${tournamentId} doesn't exist.`, 404, "NOT_FOUND");
    }
    if (tournament.status === "finished") {
        throw new CustomError("You can't cancel a tournament that's already finished.", 400, "BAD_REQUEST");
    }
    if (tournament.status === "cancelled") {
        throw new CustomError("This tournament is already cancelled.", 400, "BAD_REQUEST");
    }
    tournament.status = "cancelled";
    await tournament.save();
    return tournament;
}

export default {
    getAllTournaments,
    getTournament,
    createTournament,
    joinTournament,
    leaveTournament,
    knockoutRounds,
    deleteTournament,
    cancelTournament
};
