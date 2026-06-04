import { param, body, query } from "express-validator";
import { TOURNAMENT_STATUS } from "../config/constants.js";

function validateTournamentId(){
    return [
        param("tournamentId")
            .isInt({ min: 1, max: Number.MAX_SAFE_INTEGER })
            .withMessage("Tournament IDs are supposed to be integers larger than 0")
            .bail()
            .toInt()
    ];
}

function validateGetAllTournaments(){
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
            .isIn(TOURNAMENT_STATUS)
            .withMessage("status must be 'upcoming', 'ongoing', 'finished' or 'cancelled'")
    ];
}

function validateCreateTournament(){
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
        body("breaks")
            .optional()
            .isInt()
            .withMessage("breaks must be an integer"),
        body("numberOfRounds")
            .notEmpty()
            .isInt()
            .withMessage("numberOfRounds must be an integer"),
        body("gameCategory")
            .notEmpty()
            .withMessage(`Game category is required`)
            .isMongoId()
            .withMessage("gameCategory must be a valid MongoDB ID"),
        body("eloMin")
            .optional()
            .isInt({ min: 0 })
            .withMessage("eloMin must be a non-negative integer")
            .toInt(),
        body("eloMax")
            .optional()
            .isInt({ min: 0 })
            .withMessage("eloMax must be a non-negative integer")
            .toInt(),
        body("buyIn")
            .optional()
            .isInt({ min: 0 })
            .withMessage("buyIn must be a non-negative integer")
            .toInt(),
        body("trophy")
            .optional()
            .isMongoId()
            .withMessage("trophy must be a valid MongoDB ID")
    ]
};

function validateJoinTournament(){
    return [
        param("tournamentId")
            .isInt({ min: 1 })
            .withMessage("Tournament IDs are supposed to be integers larger than 0")
            .toInt()
    ];
}

function validateLeaveTournament(){
    return [
        param("tournamentId")
            .isInt({ min: 1 })
            .withMessage("Tournament IDs are supposed to be integers larger than 0")
            .toInt()
    ];
}

function validateStartNextRound(){
    return [
        param("tournamentId")
            .isInt({ min: 1 })
            .withMessage("Tournament IDs are supposed to be integers larger than 0")
            .toInt()
    ];
}

function validateUpdateTournament(){
    return [
        param("tournamentId")
            .isInt({ min: 1 })
            .withMessage("Tournament IDs are supposed to be integers larger than 0")
            .toInt(),
        body("title").optional().notEmpty().withMessage("Title cannot be empty, be funny"),
        body("description").optional().notEmpty().withMessage("Description cannot be empty, how are thy supposed to know what they are signing up for?"),
        body("date").optional().notEmpty().withMessage("Date cannot be empty, go out there and find someone nice"),
        body("breaks").optional().isInt({ min: 0 }).withMessage("breaks must be a non-negative integer, are you a meanie?").toInt(),
        body("numberOfRounds").optional().isInt({ min: 1 }).withMessage("numberOfRounds must be a positive integer").toInt(),
        body("gameCategory").optional().isMongoId().withMessage("gameCategory must be a valid MongoDB ID"),
        body("eloMin").optional().isInt({ min: 0 }).withMessage("eloMin must be a non-negative integer").toInt(),
        body("eloMax").optional().isInt({ min: 0 }).withMessage("eloMax must be a non-negative integer").toInt(),
        body("buyIn").optional().isInt({ min: 0 }).withMessage("buyIn must be a non-negative integer").toInt(),
        body("trophy").optional().isMongoId().withMessage("trophy must be a valid MongoDB ID")
    ];
}

export default {
    validateTournamentId,
    validateGetTournament: validateTournamentId,
    validateGetAllTournaments,
    validateCreateTournament,
    validateJoinTournament,
    validateLeaveTournament,
    validateStartNextRound,
    validateUpdateTournament
};
