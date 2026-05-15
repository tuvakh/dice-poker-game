// This validator file validate incoming data for user endpoints using express-validator.

import { param, body, query } from "express-validator";
import { MIN_AGE, MIN_PASSWORD_LENGTH, MAX_PASSWORD_LENGTH } from "../config/constants.js";

// This function validates the numeric userId route parameter
// .bail() stops the chain if invalid
// .toInt() converts the string param to a number
export function validateUserId(){
    return [
        param("userId")
            .isInt({ min: 1, max: Number.MAX_SAFE_INTEGER })
            .withMessage("User IDs are supposed to be integers larger than 0")
            .bail() // if the check before this (in the validation chain) fail, we quit (aka, do not run the check below in the validation chain)
            .toInt() // all follow up fuctions will receive "uid" as a number - integer to be specific
    ];
}

// All query params in this function are optional
export function validateGetAllUsers(){
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

// This function validates all required fields for registration
export function validateCreateUser(){
    return [
        // .escape() on username and email replaces special characters to prevent XSS
        body("username")
            .trim()
            .escape() // replaces all XSS-related characters with their HTML equivalents
            .isAlphanumeric().withMessage("Only alphanumeric characters allowed in Username")
            .isLength({ min: 3 }).withMessage("Username has to be longer than 3 characters")
            .bail(),
        // password length is validated here, not in the model, since the model stores the hash
        body("password")
            .trim()
            .isLength({ min: MIN_PASSWORD_LENGTH, max: MAX_PASSWORD_LENGTH })
            .withMessage(`Password must be between ${MIN_PASSWORD_LENGTH} and ${MAX_PASSWORD_LENGTH} characters`),
        body("email")
            .trim()
            .escape()
            .isEmail().withMessage("Not a valid email.")
            .bail(),
        // age must meet the minimum age requirement imported from constants.js
        body("age")
            .isInt({ min: MIN_AGE }).withMessage(`You must be at least ${MIN_AGE} years to play`)
            .bail()
    ];
}

// This function only checks that email format is valid and password is not empty
// The actual password check happens in the user.service using checkPassword()
export function validateLogin(){
    return [
        body("username")
            .trim()
            .notEmpty().withMessage("Username is required"),
        body("password")
            .trim()
            .notEmpty().withMessage("Password is required")
    ];
}

// All fields are optional since users can update one field at a time
// Username is not included since it cannot be changed after registration
export function validateUpdateUser(){
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
        // theme must be 'light' or 'dark'
        body("preferences.theme")
            .optional()
            .isIn(['light', 'dark']).withMessage("Theme must be 'light' or 'dark'"),
        // boardColor must be a valid hex color string
        body("preferences.boardColor")
            .optional()
            .trim()
            .isHexColor().withMessage("Board color must be a valid hex color"),
        // soundEnabled must be a boolean
        body("preferences.soundEnabled")
            .optional()
            .isBoolean(),
        // lobbyCount must be an integer between 1 and 20
        body("preferences.lobbyCount")
            .optional()
            .isInt({ min: 1, max: 20 }).withMessage("Lobby count must be between 1 and 20")
            .toInt()
    ];
}

export default {
    validateUserId,
    validateGetAllUsers,
    validateCreateUser,
    validateLogin,
    validateUpdateUser
};
