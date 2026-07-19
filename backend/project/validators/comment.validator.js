import { param, body, query } from "express-validator";
import { COMMENT_TARGET } from "../config/constants.js";

function validateCommentId(){
    return [
        param("commentId")
            .isInt({ min: 1, max: Number.MAX_SAFE_INTEGER })
            .withMessage("Comment IDs are supposed to be integers larger than 0")
            .bail()
            .toInt()
    ]
}

function validateGetAllComments(){
    return [
        query("page")
            .optional()
            .isInt({ min: 1 })
            .withMessage("The amount of pages must be a positive integer")
            .toInt(),
        query("limit")
            .optional()
            .isInt({ min: 1, max: 100 })
            .withMessage("Limit must be between 1 and 100")
            .toInt(),
        query("targetId")
            .optional()
            .isMongoId()
            .withMessage("targetId must be a valid MongoDB ObjectId"),
        query("targetType")
            .optional()
            .isIn(["match", "tournament"])
            .withMessage("targetType must be 'match' or 'tournament'"),
        query("search")
            .optional()
            .trim()
            .escape()
    ]
}

function validateCreateComment(){
    return [
        body("targetId")
            .notEmpty()
            .withMessage(`targetId is required`)
            .isMongoId()
            .withMessage("targetId must be a valid MongoDB ObjectId"),
        body("targetType")
            .notEmpty()
            .withMessage(`targetType is required`)
            .isIn(COMMENT_TARGET)
            .withMessage("targetType must be 'match' or 'tournament'"),
        body("comment")
            .notEmpty()
            .withMessage(`comment is required`)
    ]
}

export default {
    validateCommentId,
    validateGetAllComments,
    validateCreateComment,
    validateDeleteComment: validateCommentId
};
