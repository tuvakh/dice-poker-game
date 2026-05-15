// This validation structure is the same example that where shown in the lectures! 
// I have added my own comments to show that I understand it

// This is a shared validation middleware
// It runs after express-validator chains in every route.
// It collects all validation errors and returns a 400 response if any exist.
// If validation passes, next() is called to continue to the controller.

// This is used in every route instead of repeating the same error-checking logic everywhere.

import { validationResult } from "express-validator";

export function validate(req, res, next){
    // validationResult collects all errors from the validator chain that ran before this middleware
    const errors = validationResult(req);
    // errors.isEmpty() returns true if there are no validation errors
    if(!errors.isEmpty()){
        // errors.array() returns a formatted list of all validation errors
        return res.status(400).json({ errors: errors.array()});
    }
    next();
}