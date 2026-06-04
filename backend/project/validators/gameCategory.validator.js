import { param } from "express-validator";

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
