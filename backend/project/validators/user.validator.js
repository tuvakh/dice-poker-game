import { param, body, query } from "express-validator";
import { MIN_AGE, MIN_PASSWORD_LENGTH, MAX_PASSWORD_LENGTH } from "../config/constants.js";

function validateUserId(){
    return [
        param("userId")
            .isInt({ min: 1, max: Number.MAX_SAFE_INTEGER })
            .withMessage("User IDs are supposed to be integers larger than 0")
            .bail() 
            .toInt() 
    ];
}

function validateGetAllUsers(){
    return [
        query("page")
            .optional()
            .isInt({ min: 1 })
            .withMessage("Page must be a positive integer")
            .toInt(),
        query("limit")
            .optional()
            .isInt({ min: 1, max: 100 })
            .withMessage("Limit must be between 1 and 100")
            .toInt(),
        query("search")
            .optional()
            .trim()
            .escape()
    ];
}

function validateCreateUser(){
    return [
        body("username")
            .trim()
            .escape()
            .isAlphanumeric().withMessage("Only alphanumeric characters allowed in Username, sorry we are boring.")
            .isLength({ min: 3 }).withMessage("Username has to be longer than 3 characters")
            .bail(),
        body("password")
            .trim()
            .isLength({ min: MIN_PASSWORD_LENGTH, max: MAX_PASSWORD_LENGTH })
            .withMessage(`Password must be between ${MIN_PASSWORD_LENGTH} and ${MAX_PASSWORD_LENGTH} characters`),
        body("email")
            .trim()
            .escape()
            .isEmail().withMessage("Not a valid email.")
            .bail(),
        body("age")
            .isInt({ min: MIN_AGE }).withMessage(`You must be at least ${MIN_AGE} years to play, go play outside instead.`)
            .bail()
    ];
}

function validateLogin(){
    return [
        body("username")
            .trim()
            .notEmpty().withMessage("Username is required"),
        body("password")
            .trim()
            .notEmpty().withMessage("Password is required")
    ];
}

function validateForgotPassword() {
    return [
        body('email')
            .trim()
            .escape()
            .isEmail().withMessage('Not a valid email.')
            .bail()
    ];
}

function validateResetPassword() {
    return [
        body('code')
            .trim()
            .notEmpty().withMessage('Reset code is required'),
        body('password')
            .trim()
            .isLength({ min: MIN_PASSWORD_LENGTH, max: MAX_PASSWORD_LENGTH })
            .withMessage(`Password must be between ${MIN_PASSWORD_LENGTH} and ${MAX_PASSWORD_LENGTH} characters`)
    ];
}

function validateUpdateUser(){
    return [
        body("password")
            .optional()
            .trim()
            .isLength({ min: MIN_PASSWORD_LENGTH, max: MAX_PASSWORD_LENGTH })
            .withMessage(`Password must be between ${MIN_PASSWORD_LENGTH} and ${MAX_PASSWORD_LENGTH} characters`),
        body("email")
            .optional()
            .trim()
            .escape()
            .isEmail().withMessage("Not a valid email.")
            .bail(),
        body("age")
            .optional()
            .isInt({ min: MIN_AGE }).withMessage(`You must be at least ${MIN_AGE} years old`)
            .bail(),
        body("aboutMe")
            .optional()
            .trim()
            .isLength({ max: 160 }).withMessage("Description cannot exceed 160 characters"),
        body("profileImage")
            .optional()
            .trim(),
        body("preferences.theme")
            .optional()
            .isIn(['light', 'dark']).withMessage("Theme must be 'light' or 'dark'"),
        body("preferences.boardColor")
            .optional()
            .trim()
            .isHexColor().withMessage("Board color must be a valid hex color"),
        body("preferences.soundEnabled")
            .optional()
            .isBoolean(),
        body("preferences.lobbyCount")
            .optional()
            .isInt({ min: 1, max: 20 }).withMessage("Lobby count must be between 1 and 20")
            .toInt()
    ];
}

function validateChangeRole(){
    return [
        body('role')
            .notEmpty()
            .isIn(['user','admin']).withMessage('Role must be user or admin')
    ];
}

function validateVerifyEmail(){
    return [
        body('token')
            .trim()
            .notEmpty().withMessage('Verification token is required')
    ];
}

function validateResendVerification() {
    return [
        body('email')
            .trim()
            .escape()
            .isEmail().withMessage('Not a valid email.')
            .bail()
    ];
}

export default {
    validateUserId,
    validateGetAllUsers,
    validateCreateUser,
    validateLogin,
    validateUpdateUser,
    validateChangeRole,
    validateVerifyEmail,
    validateForgotPassword,
    validateResetPassword,
    validateResendVerification
};
