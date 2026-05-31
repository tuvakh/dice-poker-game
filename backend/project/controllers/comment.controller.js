// This controller only handles the HTTP request and response, while the actual logic lives in the service files.
// matchedData(req) gives us the fields that passed validation, instead of raw data from the request.

import { matchedData } from 'express-validator';
import commentServices from '../services/comment.service.js';
import { broadcastMatchComment, broadcastTournamentComment } from '../webSockets/gameSocket.js';

// Returns all comments, optionally filtered by targetId, targetType, search, and page
export async function getAllComments(req, res, next) {
    try {
        const { page, limit, targetId, targetType, search } = matchedData(req);
        const result = await commentServices.getAllComments({ page, limit, targetId, targetType, search });
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
}

// Creates a new comment and broadcasts it via WebSocket to all current viewers
// Only registered users can post comments (enforced in comment.routes.js with requireUser)
export async function createComment(req, res, next) {
    try {
        const commentData = matchedData(req);
        const result = await commentServices.createComment(commentData);
        // Broadcast after save succeeds — avoids sending a WS event for a comment that failed
        if (commentData.targetType === 'match') broadcastMatchComment(commentData.targetId, result);
        if (commentData.targetType === 'tournament') broadcastTournamentComment(commentData.targetId, result);
        res.status(201).json(result);
    } catch (error) {
        next(error);
    }
}

// Deletes a comment by commentId — admin only (enforced in comment.routes.js with requireAdmin)
export async function deleteComment(req, res, next) {
    try {
        const { commentId } = matchedData(req);
        const result = await commentServices.deleteComment(commentId);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
}

export default { getAllComments, createComment, deleteComment };
