// This controller only handles the HTTP request and response, while the actual logic lives in the service files.
// matchedData(req) gives us the fields that passed validation, instead of raw data from the request.

import { matchedData } from "express-validator";
import tournamentServices from "../services/tournament.service.js";

// This function returns all tournaments
// The list is paginated and filterable by status (upcoming, ongoing, finished, cancelled)
export async function getAllTournaments(req, res, next){
    try {
        const { page, limit, status } = matchedData(req);
        const result = await tournamentServices.getAllTournaments({ page, limit, status });

        res.status(200).json(result)
    } catch (error) {
        next(error);
    }
}

// This function returns a single tournament by its tournamentId, including rounds and standings
export async function getTournament(req, res, next){
    try {
        const { tournamentId } = matchedData(req);
        const result = await tournamentServices.getTournament(tournamentId);
        res.status(200).json(result)
    } catch (error) {
        next(error);
    }
}

// This function creates a new tournament
// Only admin users can do this (enforced in routes with requireAdmin)
export async function createTournament(req, res, next){
    try {
        const tournamentData = matchedData(req);
        const result = await tournamentServices.createTournament(tournamentData);
        res.status(201).json(result);
    } catch (error) {
        next(error);
    }
}

// This function makes it possible for users to join tournaments
// userId comes from the verified JWT token, not the request body
export async function joinTournament(req, res, next){
    try {
        const { tournamentId } = matchedData(req);
        const result = await tournamentServices.joinTournament(tournamentId, req.mongoId);
        res.status(201).json(result);
    } catch (error) {
        next(error);
    }
}

// This function allows a user to leave a tournament at any point (unless it's finished or cancelled)
// userId comes from the verified JWT token, not the request body
export async function leaveTournament(req, res, next){
    try {
        const { tournamentId } = matchedData(req);
        const result = await tournamentServices.leaveTournament(tournamentId, req.mongoId);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
}

// Randomly pairs ALL participants into matches for the next round.
// Points-based format — all participants play every round, winner determined by total wins.
export async function startNextRound(req, res, next){
    try {
        const { tournamentId } = matchedData(req);
        const result = await tournamentServices.startNextRound(tournamentId);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
}

// Updates editable fields of a tournament (admin only)
export async function updateTournament(req, res, next){
    try {
        const { tournamentId, ...updates } = matchedData(req);
        const result = await tournamentServices.updateTournament(tournamentId, updates);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
}

// Permanently removes a tournament from the database (admin only)
export async function deleteTournament(req, res, next){
    try {
        const { tournamentId } = matchedData(req);
        const result = await tournamentServices.deleteTournament(tournamentId);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
}

// Marks a tournament as cancelled without deleting it (admin only)
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
