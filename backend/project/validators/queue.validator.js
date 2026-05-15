// This validator file validate incoming data for matchmaking queue endpoints.

import { body } from 'express-validator';

export function validateJoinQueue() {
    return [
        // userId is optional to support anonymous players
        // if userId is provided it must be a valid MongoDB ObjectId 
        body("userId")
            .optional()
            .isMongoId()
            .withMessage("userId must be a valid ID"),
        // gameCategoryId is required so the player is matched with someone in the same game variant
        body("gameCategoryId")
            .notEmpty()
            .withMessage("gameCategoryId is required")
            .isMongoId()
            .withMessage("gameCategoryId must be a valid ID")
    ];
}

export function validateLeaveQueue() {
    return [
        // userId is required to identify which player to remove from the queue
        // anonymous players cannot leave the queue since they have no userId
        body("userId")
            .notEmpty()
            .withMessage("userId is required")
            .isMongoId()
            .withMessage("userId must be a valid ID")
    ];
}

export default { 
    validateJoinQueue, 
    validateLeaveQueue 
};
