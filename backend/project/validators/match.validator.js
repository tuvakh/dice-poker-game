import { param, body, query } from "express-validator";
import { MATCH_STATUS } from "../config/constants.js";

function validateMatchId(){
    return [
        param("matchId")
            .isInt({ min: 1, max: Number.MAX_SAFE_INTEGER })
            .withMessage("Match IDs are supposed to be integers larger than 0")
            .bail() 
            .toInt() 
    ];
}

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
        query("status")
            .optional()
            .isIn(MATCH_STATUS)
            .withMessage("status must be 'waiting', 'ongoing' or 'finished'"),
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
        body("gameCategoryId")
            .notEmpty()
            .withMessage(`gameCategoryId is required`)
            .isMongoId()
            .withMessage("gameCategoryId must be a valid MongoDB ObjectId"),
        body("players")
            .isArray({ min: 0, max: 5 })
            .withMessage("Match requires 0 to 5 players"),
        body("maxPlayers")
            .optional()
            .isInt({ min: 2, max: 5 })
            .withMessage("maxPlayers must be between 2 and 5")
            .toInt(),
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
        body("winner")
            .optional()
            .isMongoId()
            .withMessage("winner must be a valid MongoDB ObjectId"),
        body("outcome")
            .notEmpty()
            .withMessage("Outcome is required")
    ];
}

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
    validateGetMatch: validateMatchId,
    validateGetAllMatches,
    validateCreateMatch,
    validateRecordMatch,
    validateJoinMatch
};
