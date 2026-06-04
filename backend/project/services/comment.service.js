import { Comment } from '../models/Comment.js';
import { CustomError } from '../utils/customError.js';
import { Match } from '../models/Match.js';
import { Tournament } from '../models/Tournament.js';

export async function getAllComments({ page = 1, limit = 10, targetId, targetType, search }){
   const filter = {};
   
    if (targetId) filter.targetId = targetId;
    if (targetType) filter.targetType = targetType;
    if (search) filter.comment = { $regex: search, $options: "i" };

    const commentList = await Comment.find(filter)
        .populate('userId', 'username profileImage')
        .skip((page - 1) * limit)
        .limit(limit);
    
    const totalComments = await Comment.countDocuments(filter);

    return { 
        commentList, 
        totalComments, 
        page, 
        limit, 
        totalPages: Math.ceil(totalComments / limit)};
}

export async function createComment(commentData){
    const { targetId, targetType, comment, userId } = commentData;

    const target = targetType === "match" 
        ? await Match.findById(targetId) 
        : await Tournament.findById(targetId);
    if (!target) throw new CustomError("We looked everywhere, but that match or tournament doesn't exist!", 404, "NOT_FOUND");

    const newComment = await Comment.create({ targetId, targetType, comment, userId });
    await newComment.populate('userId', 'username profileImage');
    return newComment;
}

export async function deleteComment(commentId){
    const comment = await Comment.findOne({ commentId });
    if(!comment){
        throw new CustomError("No comment. Literally! We can't find the comment you are looking for", 404, "NOT_FOUND");
    }

    await comment.deleteOne();
    return { message: "Comment deleted successfully" };
}

export default {
    getAllComments,
    createComment,
    deleteComment
};