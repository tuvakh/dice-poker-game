// This controller only handles the HTTP request and response, while the actual logic lives in the service files.
// matchedData(req) gives us the fields that passed validation, instead of raw data from the request.

import { matchedData } from "express-validator";
import userServices from "../services/user.service.js";

// This function returns all users with optional search
// Only admins ca reach this list
export async function getAllUsers(req, res, next){
	try {
        const { page, limit, search } = matchedData(req);
        const result = await userServices.getAllUsers({ page, limit, search });
        res.status(200).json(result)
    // next(error) forwards the error (if any) to middleware/error.js          
    } catch (error) {
        next(error)
    }
}

// This function returns one user's profile by userId
// Including recent games, weekly ELO change and trophies
export async function getUser(req, res, next){
    try {
        const { userId } = matchedData(req);
        const result = await userServices.getUser(userId);
        res.status(200).json(result)  
    // next(error) forwards the error (if any) to middleware/error.js        
    } catch (error) {
        next(error);
    }
}

// This function makes it possible to create a new user
// It checks for duplicate username and email before creating
export async function createUser(req, res, next){
    try {
        const userData = matchedData(req);
        const result = await userServices.createUser(userData);
        res.status(201).json(result);  
    // next(error) forwards the error (if any) to middleware/error.js        
    } catch (error) {
        next(error)
    }
}

// This function logs a user in by username and password
// It returns the user object without the password field
// If the email or password is wrong, it returns an error
export async function loginUser(req, res, next){
    try {
        const { username, password } = matchedData(req);
        const result = await userServices.loginUser(username, password);
        res.status(200).json(result)  
    // next(error) forwards the error (if any) to middleware/error.js        
    } catch (error) {
        next(error)
    }
}

// This function update a user's profile
// You can change the email, password or age
// userId is separated from the update data, so only the changed fields get passed to the service, not the id
export async function updateUser(req, res, next){
    try {
        const { userId, ...updateData } = matchedData(req);
        if (req.file) {
            // Convert the uploaded file buffer to a data URL and save to DB
            const mime = req.file.mimetype || 'application/octet-stream';
            const base64 = req.file.buffer.toString('base64');
            updateData.profileImage = `data:${mime};base64,${base64}`;
        }
        const result = await userServices.updateUser(userId, updateData);
        res.status(200).json(result) 
    // next(error) forwards the error (if any) to middleware/error.js         
    } catch (error) {
        next(error)
    }
}

// This function bans a user. 
// If a user is banned, the banned files switches to true
// Only admins can ban users.
export async function banUser(req, res, next){
    try {
        const { userId } = matchedData(req);
        const result = await userServices.banUser(userId);
        res.status(200).json(result)  
    // next(error) forwards the error (if any) to middleware/error.js        
    } catch (error) {
        next(error)
    }
}

// This exports the functions as a default objects, so routes can import them in one line
export default {
	getAllUsers,
    getUser,
	createUser,
    loginUser,
    updateUser,
    banUser
};