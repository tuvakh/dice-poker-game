// This model stores comments left by registered users on matches or tournaments.
// Each comment is linked to a match or tournament

import mongoose from "mongoose";

import {
    MIN_COMMENT_LENGTH,
    MAX_COMMENT_LENGTH,
    COMMENT_TARGET
} from "../config/constants.js";

const commentSchema = new mongoose.Schema({
    // commentId is a random numeric public-facing ID, used in URLs instead of MongoDB's internal _id
    commentId: {
        type: Number,
        unique: true
    },
    // targetId and targetType work together to link a comment to either a match or a tournament.
    // This way I don't need separate comment collections for each
    // targetId is indexed so MongoDB can find comments for a specific match or tournament faster.
    targetId: {
        type: mongoose.Schema.Types.ObjectId,
        index: true,
        required: true
    },
    targetType: {
        type: String,
        enum: COMMENT_TARGET,
        required: true
    },
    // comment has a fixed min and max length
    comment: {
        type: String,
        trim: true,
        minLength: [MIN_COMMENT_LENGTH, `Comments must be at least ${MIN_COMMENT_LENGTH} characters`],
        maxLength: [MAX_COMMENT_LENGTH, `Calm down, your comment can't be longer than ${MAX_COMMENT_LENGTH} characters`],
        required: true
    },
    // ref: "User" allows Mongoose to populate the full user object when needed
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    // createdAt is automatically set to the current date and time when the comment is created
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// This pre("validate") hook runs before each save and generates a commentId, if one doesn't exist yet
commentSchema.pre("validate", function(){
    if (!this.commentId) {
        this.commentId = Math.round(Math.random() * Number.MAX_SAFE_INTEGER);
    }
});

// This creates the Comment model from the schema and exports it so it can be used in services
export const Comment = mongoose.model("Comment", commentSchema);