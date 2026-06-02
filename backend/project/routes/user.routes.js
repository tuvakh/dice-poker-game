// These routes handle registration, login, profile management, and admin actions.

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
// Refresh access token using refresh token
userApiRouter.post('/users/refresh', userController.refreshToken);
// Forgot password: request reset email
userApiRouter.post('/users/forgot-password', userValidator.validateForgotPassword(), validate, userController.forgotPassword);
// Reset password: uses code from email link
userApiRouter.post('/users/reset-password', userValidator.validateResetPassword(), validate, userController.resetPassword);
// Verify email using token sent to user's inbox
userApiRouter.post('/users/verify-email', userValidator.validateVerifyEmail(), validate, userController.verifyEmail);
// Resend the verification email to a given address
userApiRouter.post('/users/resend-verification', userValidator.validateResendVerification(), validate, userController.resendVerification);
// Clears JWT cookies so the browser can no longer authenticate with old tokens
userApiRouter.post('/users/logout', userController.logoutUser);

// Only admins can get a paginated and searchable list of all users
userApiRouter.get('/users', userValidator.validateGetAllUsers(), validate, requireAdmin, userController.getAllUsers);
// Anyone can get a user's profile, with recent games and weekly ELO change
userApiRouter.get('/users/:userId', userValidator.validateUserId(), validate, userController.getUser);

// Only registered users can update their profile with email, password and age
userApiRouter.put('/users/:userId', userValidator.validateUserId(), upload.single("profileImage"), userValidator.validateUpdateUser(), validate, requireUser, userController.updateUser);
// Only admins can ban users
userApiRouter.put('/users/:userId/ban', userValidator.validateUserId(), validate, requireAdmin, userController.banUser);

// Unban user
userApiRouter.put('/users/:userId/unban', userValidator.validateUserId(), validate, requireAdmin, userController.unbanUser);

// Change role (admin only)
userApiRouter.put('/users/:userId/role', userValidator.validateUserId(), userValidator.validateChangeRole(), validate, requireAdmin, userController.changeRole);

export default userApiRouter;