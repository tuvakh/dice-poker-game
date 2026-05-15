// This validator file validate incoming data for trophy creation.

import { body } from "express-validator";
import { MIN_TITLE_LENGTH, MAX_TITLE_LENGTH } from "../config/constants.js";

function validateCreateTrophy() {
    return [
        // title is required and must be within the length limits from constants.js
        body("title")
            .trim()
            .notEmpty()
            .withMessage("Title is required")
            .isLength({ min: MIN_TITLE_LENGTH, max: MAX_TITLE_LENGTH })
            .withMessage(`Title must be between ${MIN_TITLE_LENGTH} and ${MAX_TITLE_LENGTH} characters`),
        // tournamentId is optional, because a trophy can exist without being linked to a tournament
        body("tournamentId")
            .optional()
            .isMongoId()
            .withMessage("tournamentId must be a valid MongoDB ID")
    ];
}
// the image file is not validated here since multer handles file uploads separately in the route


export default { 
    validateCreateTrophy 
};
