// This validator validate incoming data for comment endpoints using express-validator.

import { param, body, query } from "express-validator";
import { COMMENT_TARGET } from "../config/constants.js";

// This function validates the numeric commentId route parameter
// .bail() stops the chain if the ID is invalid, so .toInt() is not called on an invalid value
// .toInt() converts the string param to a number so the service receives the correct type
export function validateCommentId(){
    return [
        param("commentId")
            .isInt({ min: 1, max: Number.MAX_SAFE_INTEGER })
            .withMessage("Comment IDs are supposed to be integers larger than 0")
            .bail()
            .toInt()
    ]
}

// All query params in this function are optional for filtering and pagination
export function validateGetAllComments(){
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

// This function validates the body fields required to create a comment
// targetId and userId must be valid MongoDB ObjectIds so they can reference documents
// targetType must be one of the allowed values imported from constants.js
export function validateCreateComment(){
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
            .withMessage(`comment is required`),
        body("userId")
            .notEmpty()
            .withMessage(`userId is required`)
            .isMongoId()
            .withMessage("userId must be a valid MongoDB ObjectId")
    ]
}

export default {
    validateCommentId,
    validateGetAllComments,
    validateCreateComment,
    validateDeleteComment: validateCommentId
};
