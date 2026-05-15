// In this validator file, all query params are optional, allowing flexible filtering and sorting.
// Enum values are imported from constants.js to keep them consistent with the model and service.

import { query } from "express-validator";

import { 
    GAME_RULES, 
    LEADERBOARD_SORT_OPTIONS, 
    NUMBER_OF_ROUNDS, 
    TIME_CONTROLLERS 
} from "../config/constants.js";

export function validateGetRankings(){
    return [
        // page and limit control pagination — toInt() converts the string query param to a number
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
        // sortBy determines the ranking order
        query("sortBy")
            .optional()
            .isIn(LEADERBOARD_SORT_OPTIONS)
            .withMessage("sortBy must be one of: wins, winPercentage, matches, elo"),
        // category is a direct gameCategoryId filter
        query("category")
            .optional()
            .trim()
            .escape(),
        // numberOfRounds, gameRules and timeController are alternative filters to category
        // the service will look up the matching category based on these values
        query("numberOfRounds")
            .optional()
            .toInt()
            .isIn(NUMBER_OF_ROUNDS)
            .withMessage("numberOfRounds must be 3, 5, or 7"),
        query("gameRules")
            .optional()
            .isIn(GAME_RULES)
            .withMessage("gameRules must be 'straights_allowed' or 'straights_not_allowed'"),
        query("timeController")
            .optional()
            .toInt()
            .isIn(TIME_CONTROLLERS)
            .withMessage("timeController must be 5, 10, or 15"),
    ];
}

export default { 
    validateGetRankings 
};
