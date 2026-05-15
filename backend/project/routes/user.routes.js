// These routes handles registration, login, profile management, and admin actions.

import express from "express";
import userController from "../controllers/user.controller.js";
import userValidator from "../validators/user.validator.js";
import { validate } from "../validators/validate.js";
import { requireAdmin, requireUser } from "../middleware/role.js";
import { upload } from "../middleware/upload.js";

const userApiRouter = express.Router();

// Anyone can create a user
userApiRouter.post('/users', userValidator.validateCreateUser(), validate, userController.createUser);
// This returns the user object without password on success
userApiRouter.post('/users/login', userValidator.validateLogin(), validate, userController.loginUser);

// Only admins can get a paginated and searchable list of all users
userApiRouter.get('/users', userValidator.validateGetAllUsers(), validate, requireAdmin, userController.getAllUsers);
// Anyone can get a user's profile, with recent games and weekly ELO change
userApiRouter.get('/users/:userId', userValidator.validateUserId(), validate, userController.getUser);

// Only registered users can update their profile with email, password and age
userApiRouter.put('/users/:userId', userValidator.validateUserId(), upload.single("profileImage"), userValidator.validateUpdateUser(), validate, requireUser, userController.updateUser);
// Only admins can ban users
userApiRouter.put('/users/:userId/ban', userValidator.validateUserId(), validate, requireAdmin, userController.banUser);

export default userApiRouter;