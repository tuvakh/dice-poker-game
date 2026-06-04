import { body } from "express-validator";
import { MIN_TITLE_LENGTH, MAX_TITLE_LENGTH } from "../config/constants.js";

function validateCreateTrophy() {
    return [
        body("title")
            .trim()
            .notEmpty()
            .withMessage("Title is required")
            .isLength({ min: MIN_TITLE_LENGTH, max: MAX_TITLE_LENGTH })
            .withMessage(`Title must be between ${MIN_TITLE_LENGTH} and ${MAX_TITLE_LENGTH} characters`),
        body("tournamentId")
            .optional()
            .isMongoId()
            .withMessage("tournamentId must be a valid MongoDB ID")
    ];
}

export default { 
    validateCreateTrophy 
};
