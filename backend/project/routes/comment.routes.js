// This routes defines who can post, view, and delete comments.
// Each route runs validators first, then checks the role, and then calls the controller.

import express from "express";
import commentController from "../controllers/comment.controller.js";
import commentValidator from "../validators/comment.validator.js";
import { validate } from "../validators/validate.js";
import { requireAdmin, requireUser } from "../middleware/role.js";

const commentApiRouter = express.Router();

// This allows registered users to create comments
// Anonymous users cannot leave comments
commentApiRouter.post('/comments', requireUser, commentValidator.validateCreateComment(), validate, commentController.createComment);

// Admins can delete any comments they want
commentApiRouter.delete('/comments/:commentId', requireAdmin, commentValidator.validateDeleteComment(), validate, commentController.deleteComment);

// Public — used to load comments on game and tournament pages; also used by the admin comment moderation page
commentApiRouter.get('/comments', commentValidator.validateGetAllComments(), validate, commentController.getAllComments);

export default commentApiRouter;