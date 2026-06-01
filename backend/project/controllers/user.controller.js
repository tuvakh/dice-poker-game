// This controller only handles the HTTP request and response, while the actual logic lives in the service files.
// matchedData(req) gives us the fields that passed validation, instead of raw data from the request.

import { matchedData } from "express-validator";
import userServices from "../services/user.service.js";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt.js";

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
// Also generates JWT access and refresh tokens stored in HTTP-only cookies
export async function loginUser(req, res, next){
    try {
        const { username, password } = matchedData(req);
        const result = await userServices.loginUser(username, password);
        
        // Generate access token (1 hour) and refresh token (30 days)
        const accessToken = generateAccessToken(result);
        const refreshToken = generateRefreshToken(result);
        
        // Save refresh token to database for revocation/validation
        await userServices.saveRefreshToken(result.userId, refreshToken);
        
        // Set HTTP-only cookies with both tokens
        // Access token - short-lived, used for API requests
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Lax',
            maxAge: 60 * 60 * 1000 // 1 hour in milliseconds
        });
        
        // Refresh token - long-lived, used to get new access tokens
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Lax',
            maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days in milliseconds
        });
        
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

// Unban user (admin only)
export async function unbanUser(req, res, next){
    try {
        const { userId } = matchedData(req);
        const result = await userServices.unbanUser(userId);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
}

// Change user's role (admin only)
export async function changeRole(req, res, next){
    try {
        const { userId, role } = matchedData(req);
        const result = await userServices.changeUserRole(userId, role);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
}

// Verifies a user's email using a token sent in the request body
export async function verifyEmail(req, res, next) {
    try {
        const { token } = matchedData(req);
        const result = await userServices.verifyEmailToken(token);
        res.status(200).json({ message: 'Email verified', user: result });
    } catch (error) {
        next(error);
    }
}

// Sends a password reset email if the account exists
export async function forgotPassword(req, res, next) {
    try {
        const { email } = matchedData(req);
        const result = await userServices.requestPasswordReset(email);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
}

// Resets the password using the code from the email link
export async function resetPassword(req, res, next) {
    try {
        const { code, password } = matchedData(req);
        const result = await userServices.resetPassword(code, password);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
}

// Refresh the access token using the refresh token
// Called when access token has expired but refresh token is still valid
export async function refreshToken(req, res, next) {
    try {
        const refreshTokenFromCookie = req.cookies.refreshToken;
        
        if (!refreshTokenFromCookie) {
            return res.status(401).json({ error: 'UNAUTHORIZED', message: 'No refresh token found' });
        }
        
        const decoded = userServices.verifyRefreshToken(refreshTokenFromCookie);
        if (!decoded) {
            return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Invalid or expired refresh token' });
        }
        
        // Get fresh user data
        const user = await userServices.getUser(decoded.userId);
        
        // Generate new access token
        const newAccessToken = generateAccessToken(user);
        
        // Set new access token cookie
        res.cookie('accessToken', newAccessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Lax',
            maxAge: 60 * 60 * 1000 // 1 hour
        });
        
        res.status(200).json({ message: 'Access token refreshed' });
    } catch (error) {
        next(error);
    }
}

// This exports the functions as a default objects, so routes can import them in one line
export default {
	getAllUsers,
    getUser,
	createUser,
    loginUser,
    updateUser,
    banUser,
    unbanUser,
    changeRole,
    verifyEmail,
    forgotPassword,
    resetPassword,
    refreshToken
};