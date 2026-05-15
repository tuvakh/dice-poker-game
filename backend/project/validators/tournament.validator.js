// This validator file validate incoming data for tournament endpoints using express-validator.

import { param, body, query } from "express-validator";
import { TOURNAMENT_STATUS } from "../config/constants.js";

// This function validates the numeric tournamentId route parameter
// .bail() stops the chain if invalid
// .toInt() converts the string param to a number
export function validateTournamentId(){
    return [
        param("tournamentId")
            .isInt({ min: 1, max: Number.MAX_SAFE_INTEGER })
            .withMessage("Tournament IDs are supposed to be integers larger than 0")
            .bail() 
            .toInt() 
    ];
}

// All query params in this function are optional
export function validateGetAllTournaments(){
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
            .isIn(TOURNAMENT_STATUS)
            .withMessage("status must be 'upcoming', 'ongoing' or 'finished'")
    ];
}

export function validateCreateTournament(){
    return [
        body("title")
            .notEmpty()
            .withMessage(`Title is required`),
        body("description")
            .notEmpty()
            .withMessage(`Description is required`),
        body("date")
            .notEmpty()
            .withMessage(`Date is required`),
        // breaks is optional. Not all tournaments need breaks between rounds
        body("breaks")
            .optional()
            .isInt()
            .withMessage("breaks must be an integer"),
        body("numberOfRounds")
            .notEmpty()
            .isInt()
            .withMessage("numberOfRounds must be an integer"),
        // gameCategory must be a valid MongoDB ObjectId to reference an existing game category
        body("gameCategory")
            .notEmpty()
            .withMessage(`Game category is required`)
            .isMongoId()
            .withMessage("gameCategory must be a valid MongoDB ID")
    ]
};

// This function validates both the route param and the request body
export function validateJoinTournament(){
    return [
        param("tournamentId")
            .isInt({ min: 1 })
            .withMessage("Tournament IDs are supposed to be integers larger than 0")
            .toInt(),
        // userId must be a valid MongoDB ObjectId to identify the user joining
        body("userId")
            .notEmpty()
            .withMessage("UserId is required")
            .isMongoId()
            .withMessage("userId must be a valid MongoDB ID")
    ];
}

export function validateKnockoutRounds(){
    return [
        param("tournamentId")
            .isInt({ min: 1 })
            .withMessage("Tournament IDs are supposed to be integers larger than 0")
            .toInt()
    ];      
}

export default {
    validateTournamentId,
    // validateGetTournament reuses validateTournamentId since only the ID is needed to fetch a tournament
    validateGetTournament: validateTournamentId,
    validateGetAllTournaments,
    validateCreateTournament,
    validateJoinTournament,
    validateKnockoutRounds
};
