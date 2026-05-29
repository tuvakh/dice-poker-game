// This service handles tournament creation, joining, and knockout round progression.

import { Tournament } from '../models/Tournament.js';
import { Match } from '../models/Match.js';
import { User } from '../models/User.js';
import { CustomError } from '../utils/customError.js';

export async function getAllTournaments({ page = 1, limit = 10, status }){
    const filter = {};

    // only add status to the filter if it was provided
    // otherwise return all tournaments
    if (status) filter.status = status;

    const tournamentList = await Tournament.find(filter)
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
     const tournament = await Tournament.findOne({ tournamentId }).populate('participants', 'username');
     if(!tournament){
        throw new CustomError(`A tournament with the id ${tournamentId} doesn't exist.. Maybe it was cancelled? :(`, 404, "NOT_FOUND");
    }

    // This populates match details for each round
    const populatedRounds = await Promise.all(
        tournament.rounds.map(async (round) => {
            return Promise.all(
                round.map(async (entry) => {
                    // It only selects the fields needed for the standings display, not the full match object
                    return await Match.findById(entry.matchId).select("players winner outcome status matchId");
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

    // This spread tournament into a plain object and replace the rounds array with the populated version
    return { ...tournament.toObject(), rounds: populatedRounds, standings };
}

export async function leaveTournament(tournamentId, userId){
    const tournament = await Tournament.findOne({ tournamentId });
    if(!tournament){
        throw new CustomError(`A tournament with the id ${tournamentId} doesn't exist.`, 404, "NOT_FOUND");
    }
    if(tournament.status !== "upcoming"){
        throw new CustomError("You can only leave upcoming tournaments.", 400, "BAD_REQUEST");
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

    // This prevents users from joining a finished tournament
    if (tournament.status === "finished") {
        throw new CustomError("This tournament is already done.. You missed it!", 400, "BAD_REQUEST");
    }

    // .equals() is used here instead of === because participants are MongoDB ObjectIds, not plain strings
    if (tournament.participants.some(player => player.equals(userId))){
        throw new CustomError("You're already in this tournament, no need to join twice!", 409, "CONFLICT");
    }

    tournament.participants.push(userId);
    await tournament.save();
    return tournament;
}

export async function knockoutRounds(tournamentId){
    const tournament = await Tournament.findOne({ tournamentId });
    if(!tournament){
        throw new CustomError(`A tournament with id the ${tournamentId} don't exist.. Maybe it was cancelled? :(`, 404, "NOT_FOUND");
    }

    let participants;
    
    // If it's the first round, use all participants as starting players
    if (tournament.rounds.length === 0) {
        participants = [...tournament.participants];
    } else {
        const lastRound = tournament.rounds[tournament.rounds.length - 1];
        const lastRoundMatches = await Match.find({ 
            _id: { $in: lastRound.map(round => round.matchId) },
            status: "finished"
        });
        // otherwise, only the winners of the last round advance to the next round
        participants = lastRoundMatches.map(match => match.winner).filter(Boolean);
    }

    if (tournament.rounds.length === 0 && tournament.participants.length === 0) {
        throw new CustomError("A tournament with no players? That's just an empty room!", 400, "BAD_REQUEST");
    }

    if (tournament.rounds.length > 0) {
    const lastRound = tournament.rounds[tournament.rounds.length - 1];
    // $ne means "not equal". It counts matches that are not finished yet
    const unfinished = await Match.countDocuments({
        _id: { $in: lastRound.map(round => round.matchId) },
        status: { $ne: "finished" }
    });
    if (unfinished > 0) {
        throw new CustomError("Not so fast! Everyone needs to finish their matches before the next round begins", 400, "BAD_REQUEST");
    }
}

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
                tournamentId: tournament._id
            });
            roundMatches.push({ matchId: match._id });
        }
        // if no pair (odd number), participant advances automatically
    }

    // change status from upcoming to ongoing when the first round starts
    if (tournament.status === "upcoming") tournament.status = "ongoing";

    tournament.rounds.push(roundMatches);
    
    await tournament.save();
    
    return tournament;
}

export default {
    getAllTournaments,
    getTournament,
    createTournament,
    joinTournament,
    leaveTournament,
    knockoutRounds
};