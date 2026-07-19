import mongoose from "mongoose";

import {
    MIN_COMMENT_LENGTH,
    MAX_COMMENT_LENGTH,
    COMMENT_TARGET
} from "../config/constants.js";

const commentSchema = new mongoose.Schema({
    commentId: {
        type: Number,
        unique: true
    },
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
    comment: {
        type: String,
        trim: true,
        minLength: [MIN_COMMENT_LENGTH, `Comments must be at least ${MIN_COMMENT_LENGTH} characters`],
        maxLength: [MAX_COMMENT_LENGTH, `Calm down, your comment can't be longer than ${MAX_COMMENT_LENGTH} characters`],
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

commentSchema.pre("validate", function(){
    if (!this.commentId) {
        this.commentId = Math.round(Math.random() * Number.MAX_SAFE_INTEGER);
    }
});

export const Comment = mongoose.model("Comment", commentSchema);