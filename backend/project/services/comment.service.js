// This service handles fetching, creating, and deleting comments.

import { Comment } from '../models/Comment.js';
import { CustomError } from '../utils/customError.js';
import { Match } from '../models/Match.js';
import { Tournament } from '../models/Tournament.js';

// getAllComments returns a paginated list of comments, which is filterable by targetId, targetType and search term
export async function getAllComments({ page = 1, limit = 10, targetId, targetType, search }){
   const filter = {};
   
    // this builds a filter object based on which query params were provided
    if (targetId) filter.targetId = targetId;
    if (targetType) filter.targetType = targetType;
    // $regex allows partial text search
    // $options: "i" makes it case-insensitive
    if (search) filter.comment = { $regex: search, $options: "i" };

    // skip() skips documents from previous pages
    // limit() caps the results per page
    const commentList = await Comment.find(filter)
        .populate('userId', 'username profileImage')
        .skip((page - 1) * limit)
        .limit(limit);
    
    // This counts total matching documents so the frontend knows how many pages there are
    const totalComments = await Comment.countDocuments(filter);

    return { 
        commentList, 
        totalComments, 
        page, 
        limit, 
        totalPages: Math.ceil(totalComments / limit)};
}

// createComment first checks that the target (match or tournament) actually exists
// before creating the comment, to avoid comments pointing to non-existent resources
export async function createComment(commentData){
    const { targetId, targetType, comment, userId } = commentData;

    // This checks if the target is a match or tournament
    const target = targetType === "match" 
        ? await Match.findById(targetId) 
        : await Tournament.findById(targetId);
    if (!target) throw new CustomError("We looked everywhere, but that match or tournament doesn't exist!", 404, "NOT_FOUND");

    const newComment = await Comment.create({ targetId, targetType, comment, userId });
    await newComment.populate('userId', 'username profileImage');
    return newComment;
}

// deleteComment finds the comment by its numeric commentId and deletes it
export async function deleteComment(commentId){
    // This finds the specific comment through its commentId
    const comment = await Comment.findOne({ commentId });
    if(!comment){
        throw new CustomError("No comment. Literally! We can't find the comment you are looking for", 404, "NOT_FOUND");
    }

    // deleteOne() removes the comment from the collection
    await comment.deleteOne();
    return { message: "Comment deleted successfully" };
}

export default {
    getAllComments,
    createComment,
    deleteComment
};