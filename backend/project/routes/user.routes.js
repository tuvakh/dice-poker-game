import express from "express";
import userController from "../controllers/user.controller.js";
import userValidator from "../validators/user.validator.js";
import { validate } from "../validators/validate.js";
import { requireAdmin, requireUser } from "../middleware/role.js";
import { upload } from "../middleware/upload.js";

const userApiRouter = express.Router();

userApiRouter.post('/users', userValidator.validateCreateUser(), validate, userController.createUser);
userApiRouter.post('/users/login', userValidator.validateLogin(), validate, userController.loginUser);
userApiRouter.post('/users/refresh', userController.refreshToken);
userApiRouter.post('/users/forgot-password', userValidator.validateForgotPassword(), validate, userController.forgotPassword);
userApiRouter.post('/users/reset-password', userValidator.validateResetPassword(), validate, userController.resetPassword);
userApiRouter.post('/users/verify-email', userValidator.validateVerifyEmail(), validate, userController.verifyEmail);
userApiRouter.post('/users/resend-verification', userValidator.validateResendVerification(), validate, userController.resendVerification);
userApiRouter.post('/users/logout', userController.logoutUser);

userApiRouter.get('/users', userValidator.validateGetAllUsers(), validate, requireAdmin, userController.getAllUsers);
userApiRouter.get('/users/:userId', userValidator.validateUserId(), validate, userController.getUser);

userApiRouter.put('/users/:userId', userValidator.validateUserId(), upload.single("profileImage"), userValidator.validateUpdateUser(), validate, requireUser, userController.updateUser);
userApiRouter.put('/users/:userId/ban', userValidator.validateUserId(), validate, requireAdmin, userController.banUser);
userApiRouter.put('/users/:userId/unban', userValidator.validateUserId(), validate, requireAdmin, userController.unbanUser);
userApiRouter.put('/users/:userId/role', userValidator.validateUserId(), userValidator.validateChangeRole(), validate, requireAdmin, userController.changeRole);

export default userApiRouter;