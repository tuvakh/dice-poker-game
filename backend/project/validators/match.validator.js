// This validator file validate incoming data for match endpoints using express-validator.

import { param, body, query } from "express-validator";
import { MATCH_STATUS } from "../config/constants.js";

// This function validates the numeric matchId route parameter
// .bail() stops the chain if invalid
// .toInt() converts the string param to a number
function validateMatchId(){
    return [
        param("matchId")
            .isInt({ min: 1, max: Number.MAX_SAFE_INTEGER })
            .withMessage("Match IDs are supposed to be integers larger than 0")
            .bail() 
            .toInt() 
    ];
}

// All query params in this function are optional for filtering and pagination
function validateGetAllMatches(){
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

function validateCreateMatch(){
    return [
        // gameCategoryId is required and must be a valid MongoDB ObjectId
        body("gameCategoryId")
            .notEmpty()
            .withMessage(`gameCategoryId is required`)
            .isMongoId()
            .withMessage("gameCategoryId must be a valid MongoDB ObjectId"),
        // players can start empty if the creator joins first
        body("players")
            .isArray({ min: 0, max: 5 })
            .withMessage("Match requires 0 to 5 players"),
        body("maxPlayers")
            .optional()
            .isInt({ min: 2, max: 5 })
            .withMessage("maxPlayers must be between 2 and 5")
            .toInt(),
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


function validateRecordMatch(){
    return [
        param("matchId")
            .isInt({ min: 1 })
            .withMessage("Match IDs are supposed to be integers larger than 0")
            .toInt(),
        // winner is optional
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

// userId is not accepted from the body — it is injected from the verified JWT in the controller
function validateJoinMatch() {
    return [
        param("matchId")
            .isInt({ min: 1 })
            .withMessage("matchId must be a positive integer")
            .toInt()
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
