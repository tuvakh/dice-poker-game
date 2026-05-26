// This controller only handles the HTTP request and response, while the actual logic lives in the service files.
// matchedData(req) gives us the fields that passed validation, instead of raw data from the request.

import { matchedData } from "express-validator";
import tournamentServices from "../services/tournament.service.js";

// This function returns all tournaments
// The list is paginated and filterable by status (upcoming, ongoing, finished)
export async function getAllTournaments(req, res, next){
    try {
        const { page, limit, status } = matchedData(req);
        const result = await tournamentServices.getAllTournaments({ page, limit, status });
                
        res.status(200).json(result)    
    // next(error) forwards the error (if any) to middleware/error.js      
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
    // next(error) forwards the error (if any) to middleware/error.js         
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
    // next(error) forwards the error (if any) to middleware/error.js         
    } catch (error) {
        next(error);
    }
}

// This function makes it possible for users to join tournaments
// Only registered users can join tournaments
export async function joinTournament(req, res, next){
    try {
        const { tournamentId, userId } = matchedData(req);
        const result = await tournamentServices.joinTournament(tournamentId, userId);
        res.status(201).json(result);
    // next(error) forwards the error (if any) to middleware/error.js        
    } catch (error) {
        next(error);
    }
}

// This function allows a user to leave an upcoming tournament
export async function leaveTournament(req, res, next){
    try {
        const { tournamentId, userId } = matchedData(req);
        const result = await tournamentServices.leaveTournament(tournamentId, userId);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
}

// This function advances the tournament, by randomly pairing remaining participants into matches for the next knockout round.
// I made this restricted to admins as part of tournament management.
export async function knockoutRounds(req, res, next){
    try {
        const { tournamentId } = matchedData(req);
        const result = await tournamentServices.knockoutRounds(tournamentId);
        res.status(200).json(result);  
    // next(error) forwards the error (if any) to middleware/error.js      
    } catch (error) {
        next(error);
    }
}

// This exports the functions as a default objects, so routes can import them in one line
export default {
    getAllTournaments,
    getTournament,
    createTournament,
    joinTournament,
    leaveTournament,
    knockoutRounds
};