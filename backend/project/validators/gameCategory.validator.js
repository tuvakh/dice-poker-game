// This validator file validates the gameCategoryId route parameter.

import { param } from "express-validator";

// This function ensures the ID is a positive integer before querying the database
// .bail() stops the chain early if validation fails, preventing .toInt() from running on invalid input
// .toInt() converts the string URL parameter to a number so the service receives the correct type
function validateGameCategoryId(){
    return [
        param("gameCategoryId")
            .isInt({ min: 1, max: Number.MAX_SAFE_INTEGER })
            .withMessage("Game Category IDs are supposed to be integers larger than 0")
            .bail()
            .toInt()
    ];
}

export default {
    validateGameCategoryId
};
