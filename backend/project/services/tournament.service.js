import { Tournament } from '../models/Tournament.js';
import { Match } from '../models/Match.js';
import { User } from '../models/User.js';
import { CustomError } from '../utils/customError.js';

export async function getAllTournaments({ page = 1, limit = 10, status }){
    const filter = {};

    if (status) filter.status = status;

    const tournamentList = await Tournament.find(filter)
        .populate('trophy', 'title image')
        .populate('gameCategory', 'numberOfRounds gameRules timeController')
        .populate('createdBy', 'username')
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
        .populate('gameCategory')
        .populate('createdBy', 'username');

     if(!tournament){
        throw new CustomError(`A tournament with the id ${tournamentId} doesn't exist. Maybe it was cancelled? :(`, 404, "NOT_FOUND");
    }

    const populatedRounds = await Promise.all(
        tournament.rounds.map(async (round) => {
            return Promise.all(
                round.map(async (entry) => {
                    return await Match.findById(entry.matchId)
                        .select("players winner outcome status matchId endedAt")
                        .populate('players', 'username _id')
                        .populate('winner', 'username _id');
                })
            );
        })
    );

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
    if(["finished", "cancelled"].includes(tournament.status)){
        throw new CustomError("This tournament is already done — you can't leave now.", 400, "BAD_REQUEST");
    }
    const before = tournament.participants.length;
    tournament.participants = tournament.participants.filter(participant => !participant.equals(userId));
    if(tournament.participants.length === before){
        throw new CustomError("You are not a participant in this tournament.", 404, "NOT_FOUND");
    }
    await tournament.save();
    return tournament;
}

export async function createTournament(tournamentData){
    if (tournamentData.createdBy) {
        const creator = await User.findOne({ userId: tournamentData.createdBy }).select('_id');
        tournamentData.createdBy = creator?._id ?? undefined;
    }
    const newTournament = await Tournament.create(tournamentData);
    return newTournament;
}

export async function joinTournament(tournamentId, userId){
    const tournament = await Tournament.findOne({ tournamentId });
    if(!tournament){
        throw new CustomError(`A tournament with the id ${tournamentId} doesn't exist. Maybe it was cancelled? :(`, 404, "NOT_FOUND");
    }

    if (["finished", "cancelled"].includes(tournament.status)) {
        throw new CustomError("This tournament is done or cancelled. You missed it!", 400, "BAD_REQUEST");
    }

    if (tournament.participants.some(player => player.equals(userId))){
        throw new CustomError("You're already in this tournament, no need to join twice!", 409, "CONFLICT");
    }

    tournament.participants.push(userId);
    await tournament.save();
    return tournament;
}

export async function startNextRound(tournamentId){
    const tournament = await Tournament.findOne({ tournamentId });
    if(!tournament){
        throw new CustomError(`A tournament with the id ${tournamentId} doesn't exist. Maybe it was cancelled? :(`, 404, "NOT_FOUND");
    }

    if (tournament.rounds.length >= tournament.numberOfRounds) {
        throw new CustomError("All rounds have already been played!", 400, "BAD_REQUEST");
    }

    if (tournament.participants.length === 0) {
        throw new CustomError("A tournament with no players? That's just an empty room!", 400, "BAD_REQUEST");
    }

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

    const participants = [...tournament.participants];

    for (let i = participants.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [participants[i], participants[j]] = [participants[j], participants[i]];
    }

    const roundMatches = [];
    for (let i = 0; i < participants.length; i += 2) {
        if (participants[i + 1]) {
            const match = await Match.create({
                players: [participants[i], participants[i + 1]],
                gameCategory: tournament.gameCategory,
                tournamentId: tournament._id,
                status: 'ongoing'
            });
            roundMatches.push({ matchId: match._id });
        }
    }

    if (tournament.status === "upcoming") tournament.status = "ongoing";

    tournament.rounds.push(roundMatches);
    await tournament.save();
    return getTournament(tournament.tournamentId);
}

export async function updateTournament(tournamentId, updates){
    const tournament = await Tournament.findOne({ tournamentId });
    if(!tournament){
        throw new CustomError(`A tournament with id ${tournamentId} doesn't exist.`, 404, "NOT_FOUND");
    }
    if (["ongoing", "finished"].includes(tournament.status)) {
        throw new CustomError("You can't edit a tournament that has already started or finished.", 400, "BAD_REQUEST");
    }
    const allowed = ["title", "description", "date", "breaks", "numberOfRounds", "gameCategory", "eloMin", "eloMax", "buyIn", "trophy"];
    for (const key of allowed) {
        if (updates[key] !== undefined) tournament[key] = updates[key];
    }
    await tournament.save();
    return tournament;
}

export async function deleteTournament(tournamentId){
    const tournament = await Tournament.findOneAndDelete({ tournamentId });
    if(!tournament){
        throw new CustomError(`A tournament with id ${tournamentId} doesn't exist.`, 404, "NOT_FOUND");
    }
    return tournament;
}

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
    startNextRound,
    updateTournament,
    deleteTournament,
    cancelTournament
};
