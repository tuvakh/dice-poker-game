// This controller only handles the HTTP request and response, while the actual logic lives in the service files.
// matchedData(req) gives us the fields that passed validation, instead of raw data from the request.

import { matchedData } from 'express-validator';
import commentServices from '../services/comment.service.js';
import { broadcastMatchComment, broadcastTournamentComment } from '../webSockets/gameSocket.js';

// This function makes it possible to get all comments
// with optional filtering by targetId, targetType, search term, and pagination
export async function getAllComments(req, res, next) {
    try {
        const { page, limit, targetId, targetType, search } = matchedData(req);
        const result = await commentServices.getAllComments({ page, limit, targetId, targetType, search });

        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
}

// This function makes it possible to create a new comment
// Only registered users can create comments (this is enforced in comment.routes.js with requireUser)
export async function createComment(req, res, next) {
    try {
        const commentData = matchedData(req);
        const result = await commentServices.createComment(commentData);
        if (commentData.targetType === 'match') {
            broadcastMatchComment(commentData.targetId, result);
        }
        if (commentData.targetType === 'tournament') {
            broadcastTournamentComment(commentData.targetId, result);
        }
        res.status(201).json(result);
    } catch (error) {
        next(error);
    }
}

// This function makes it possible to delete a comment by commentId
// Only admin users can delete comments (this is enforced in comment.routes.js with requireAdmin)
export async function deleteComment(req, res, next) {
    try {
        const { commentId } = matchedData(req);
        const result = await commentServices.deleteComment(commentId);
        res.status(200).json(result);
        // next(error) forwards the error (if any) to middleware/error.js
    } catch (error) {
        next(error);
    }
}

// This exports the functions as a default objects, so routes can import them in one line
export default {
    getAllComments,
    createComment,
    deleteComment
};
