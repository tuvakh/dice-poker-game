import { matchedData } from 'express-validator';
import commentServices from '../services/comment.service.js';
import { broadcastMatchComment, broadcastTournamentComment } from '../webSockets/gameSocket.js';

export async function getAllComments(req, res, next) {
    try {
        const { page, limit, targetId, targetType, search } = matchedData(req);
        const result = await commentServices.getAllComments({ page, limit, targetId, targetType, search });
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
}

export async function createComment(req, res, next) {
    try {
        const commentData = matchedData(req);
        commentData.userId = req.mongoId;
        const result = await commentServices.createComment(commentData);
        if (commentData.targetType === 'match') broadcastMatchComment(commentData.targetId, result);
        if (commentData.targetType === 'tournament') broadcastTournamentComment(commentData.targetId, result);
        res.status(201).json(result);
    } catch (error) {
        next(error);
    }
}

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
