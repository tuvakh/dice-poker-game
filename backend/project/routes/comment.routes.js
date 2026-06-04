import express from "express";
import commentController from "../controllers/comment.controller.js";
import commentValidator from "../validators/comment.validator.js";
import { validate } from "../validators/validate.js";
import { requireAdmin, requireUser } from "../middleware/role.js";

const commentApiRouter = express.Router();

commentApiRouter.post('/comments', requireUser, commentValidator.validateCreateComment(), validate, commentController.createComment);
commentApiRouter.delete('/comments/:commentId', requireAdmin, commentValidator.validateDeleteComment(), validate, commentController.deleteComment);
commentApiRouter.get('/comments', commentValidator.validateGetAllComments(), validate, commentController.getAllComments);

export default commentApiRouter;