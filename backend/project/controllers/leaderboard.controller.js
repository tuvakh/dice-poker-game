// This controller only handles the HTTP request and response, while the actual logic lives in the service files.
// matchedData(req) gives us the fields that passed validation, instead of raw data from the request.

import { matchedData } from "express-validator";
import leaderboardService from "../services/leaderboard.service.js";

// This function returns a ranked list of users
// It's sortable by wins, winPercentage, or total matches.
// The list can be filtered by game category, or by individual category parameters (numberOfRounds, gameRules, timeController).
export async function getRankings(req, res, next){
    try {
        const { page, limit, sortBy, category, numberOfRounds, gameRules, timeController } = matchedData(req);
        const result = await leaderboardService.getRankings({ page, limit, sortBy, category, numberOfRounds, gameRules, timeController });
        
        res.status(200).json(result) 
    // next(error) forwards the error (if any) to middleware/error.js         
    } catch (error) {
        next(error);
    }
}

// This exports the function as a default object, so routes can import it in one line
export default {
    getRankings
};