// Authentication middleware that verifies JWT tokens from HTTP-only cookies
// Uses access tokens for API requests, refresh tokens to get new access tokens

import { verifyToken, getRoleFromToken } from "../utils/jwt.js";

// This function verifies JWT access token from cookies on every request
// It defaults to "anonymous" if no valid token is found
export function setUserRole(req, res, next) {
    const accessToken = req.cookies.accessToken;
    
    if (accessToken) {
        const decoded = verifyToken(accessToken);
        if (decoded) {
            req.userRole = getRoleFromToken(decoded);
            req.userId = decoded.userId;
            req.username = decoded.username;
            return next();
        }
    }
    
    // No valid access token found
    req.userRole = "anonymous";
    req.userId = null;
    next();
}

// This function blocks anyone who is not an admin, with a 403 Forbidden response
export function requireAdmin(req, res, next) {
    if (req.userRole !== "admin") {
        return res.status(403).json({ error: "FORBIDDEN", message: "Nice try, but you need to be an admin to do this" });
    }
    next();
}

// This function allows both "user" and "admin", since admins can do everything registered users can
// Gives a 403 Forbidden response if you're not logged in
export function requireUser(req, res, next) {
    if (req.userRole !== "user" && req.userRole !== "admin") {
        return res.status(403).json({ error: "FORBIDDEN", message: "Who are you? You need to be logged in to do this" });
    }
    next();
}