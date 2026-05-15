// This validator file validate incoming data for match endpoints using express-validator.

import { param, body, query } from "express-validator";
import { MATCH_STATUS } from "../config/constants.js";

// This function validates the numeric matchId route parameter
// .bail() stops the chain if invalid
// .toInt() converts the string param to a number
export function validateMatchId(){
    return [
        param("matchId")
            .isInt({ min: 1, max: Number.MAX_SAFE_INTEGER })
            .withMessage("Match IDs are supposed to be integers larger than 0")
            .bail() 
            .toInt() 
    ];
}

// All query params in this function are optional for filtering and pagination
export function validateGetAllMatches(){
    return [
        query("page")
            .optional()
            .isInt({ min: 1 })
            .withMessage("Page must be a positive integer")
            .toInt(),
        query("limit")
            .optional()
            .isInt({ min: 1, max: 100 })
            .withMessage("Limit must be between 1 and 100")
            .toInt(),
        // status must be one of the allowed values imported from constants.js
        query("status")
            .optional()
            .isIn(MATCH_STATUS)
            .withMessage("status must be 'waiting', 'ongoing' or 'finished'"),
        // gameCategoryId and userId must be valid MongoDB ObjectIds
        query("gameCategoryId")
            .optional()
            .isMongoId()
            .withMessage("gameCategoryId must be a valid MongoDB ObjectId"),
        query("userId")
            .optional()
            .notEmpty().withMessage("userId cannot be empty")
    ];
}

export function validateCreateMatch(){
    return [
        // gameCategoryId is required and must be a valid MongoDB ObjectId
        body("gameCategoryId")
            .notEmpty()
            .withMessage(`gameCategoryId is required`)
            .isMongoId()
            .withMessage("gameCategoryId must be a valid MongoDB ObjectId"),
        // players is optional for anonymous creators (empty array allowed)
        body("players")
            .isArray({ min: 0, max: 2 })
            .withMessage("Match requires 0 to 2 players"),
        // allowAnonymous lets the creator decide if anonymous users can join the game
        body("allowAnonymous")
            .optional()
            .isBoolean().withMessage("allowAnonymous must be a boolean"),
        // desiredOpponentElo lets the creator set a preferred opponent Elo rating
        body("desiredOpponentElo")
            .optional()
            .isInt({ min: 0 }).withMessage("desiredOpponentElo must be a positive integer")
            .toInt(),
        body("coinWager")
            .optional()
            .isInt({ min: 0 })
            .withMessage("Wager cant be less than 0")
            .toInt()
    ]
};


export function validateRecordMatch(){
    return [
        param("matchId")
            .isInt({ min: 1 })
            .withMessage("Match IDs are supposed to be integers larger than 0")
            .toInt(),
        // winner is optional to support anonymous matches
        body("winner")
            .optional()
            .isMongoId()
            .withMessage("winner must be a valid MongoDB ObjectId"),
        // outcome is required to describe the result (e.g. "3-1")
        body("outcome")
            .notEmpty()
            .withMessage("Outcome is required")
    ];
}

export function validateJoinMatch() {
    return [
        param("matchId")
            .isInt({ min: 1 })
            .withMessage("matchId must be a positive integer")
            .toInt(),
        body("userId")
            .optional()
            .isMongoId().withMessage("userId must be a valid MongoDB ObjectId")
    ];
}


export default {
    validateMatchId,
    // validateGetMatch reuses validateMatchId since only the ID is needed to fetch a match
    validateGetMatch: validateMatchId,
    validateGetAllMatches,
    validateCreateMatch,
    validateRecordMatch,
    validateJoinMatch
};
