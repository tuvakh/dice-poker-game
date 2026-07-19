import { matchedData } from "express-validator";
import tournamentServices from "../services/tournament.service.js";

export async function getAllTournaments(req, res, next){
    try {
        const { page, limit, status } = matchedData(req);
        const result = await tournamentServices.getAllTournaments({ page, limit, status });

        res.status(200).json(result)
    } catch (error) {
        next(error);
    }
}

export async function getTournament(req, res, next){
    try {
        const { tournamentId } = matchedData(req);
        const result = await tournamentServices.getTournament(tournamentId);
        res.status(200).json(result)
    } catch (error) {
        next(error);
    }
}

export async function createTournament(req, res, next){
    try {
        const tournamentData = matchedData(req);
        const result = await tournamentServices.createTournament({ ...tournamentData, createdBy: req.userId });
        res.status(201).json(result);
    } catch (error) {
        next(error);
    }
}

export async function joinTournament(req, res, next){
    try {
        const { tournamentId } = matchedData(req);
        const result = await tournamentServices.joinTournament(tournamentId, req.mongoId);
        res.status(201).json(result);
    } catch (error) {
        next(error);
    }
}

export async function leaveTournament(req, res, next){
    try {
        const { tournamentId } = matchedData(req);
        const result = await tournamentServices.leaveTournament(tournamentId, req.mongoId);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
}

export async function startNextRound(req, res, next){
    try {
        const { tournamentId } = matchedData(req);
        const result = await tournamentServices.startNextRound(tournamentId);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
}

export async function updateTournament(req, res, next){
    try {
        const { tournamentId, ...updates } = matchedData(req);
        const result = await tournamentServices.updateTournament(tournamentId, updates);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
}

export async function deleteTournament(req, res, next){
    try {
        const { tournamentId } = matchedData(req);
        const result = await tournamentServices.deleteTournament(tournamentId);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
}

export async function cancelTournament(req, res, next){
    try {
        const { tournamentId } = matchedData(req);
        const result = await tournamentServices.cancelTournament(tournamentId);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
}

export default {
    getAllTournaments,
    getTournament,
    createTournament,
    updateTournament,
    joinTournament,
    leaveTournament,
    startNextRound,
    deleteTournament,
    cancelTournament
};
