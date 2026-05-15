// This controller only handles the HTTP request and response, while the actual logic lives in the service files.
// matchedData(req) gives us the fields that passed validation, instead of raw data from the request.

import { matchedData } from "express-validator";
import matchServices from "../services/match.service.js";

// This function returns a list of all matches
// It's paginated and filterable by status, game category, or player
export async function getAllMatches(req, res, next){
    try {
        const { page, limit, status, gameCategoryId, userId } = matchedData(req);
        const result = await matchServices.getAllMatches({ page, limit, status, gameCategoryId, userId });
                
        res.status(200).json(result)  
    // next(error) forwards the error (if any) to middleware/error.js        
    } catch (error) {
        next(error);
    }
}

// This function returns one single match by its matchId
// Players and gameCategory is populated, so the response includes names and details instead of just IDs
export async function getMatch(req, res, next){
    try {
        const { matchId } = matchedData(req);
        const result = await matchServices.getMatch(matchId);
        res.status(200).json(result)  
    // next(error) forwards the error (if any) to middleware/error.js        
    } catch (error) {
        next(error);
    }
}

// This function creates a new match between two players, in a given game category
export async function createMatch(req, res, next){
    try {
        const matchData = matchedData(req);
        const result = await matchServices.createMatch(matchData);
        res.status(201).json(result); 
    // next(error) forwards the error (if any) to middleware/error.js         
    } catch (error) {
        next(error);
    }
}

// This function records the result of a finished match
// The matchId is separated from the rest of the body, so only the result data gets passed to the service, not the id
export async function recordMatch(req, res, next){
    try {
        const { matchId, ...matchData } = matchedData(req);
        const result = await matchServices.recordMatch(matchId, matchData);
        res.status(200).json(result);  
    // next(error) forwards the error (if any) to middleware/error.js      
    } catch (error) {
        next(error);
    }
}

// This function adds a user to an existing waiting match
export async function joinMatch(req, res, next) {
    try {
        const { matchId, userId } = matchedData(req);
        const result = await matchServices.joinMatch(matchId, userId);
        res.status(200).json(result);
    // next(error) forwards the error (if any) to middleware/error.js      
    } catch (error) {
        next(error);
    }
}


// This exports the functions as a default objects, so routes can import them in one line
export default {
    getAllMatches,
    getMatch,
    createMatch,
    recordMatch,
    joinMatch
};