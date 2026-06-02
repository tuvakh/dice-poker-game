import jwt from 'jsonwebtoken';

// Fail hard at startup if JWT_SECRET is missing — a missing secret would silently sign tokens with a known fallback
if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET environment variable is not set');
const SECRET_KEY = process.env.JWT_SECRET;
const ACCESS_TOKEN_EXPIRY = '1h'; // Short-lived access token (1 hour)
const REFRESH_TOKEN_EXPIRY = '30d'; // Long-lived refresh token (30 days)

/**
 * Generate an access token (short-lived, for API requests)
 * @param {Object} user - User object with userId and role
 * @param {string} [ip] - Client IP recorded at login, compared on every request to detect session hijacking
 * @returns {string} JWT access token
 */
export function generateAccessToken(user, ip) {
    const payload = {
        userId: user.userId,
        _id: user._id.toString(),
        username: user.username,
        role: user.role || 'user', // 'admin' or 'user'
        ip: ip ?? null,
        type: 'access' // Token type identifier
    };
    return jwt.sign(payload, SECRET_KEY, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

/**
 * Generate a refresh token (long-lived, for getting new access tokens)
 * @param {Object} user - User object with userId and role
 * @returns {string} JWT refresh token
 */
export function generateRefreshToken(user) {
    const payload = {
        userId: user.userId,
        type: 'refresh' // Token type identifier
    };
    return jwt.sign(payload, SECRET_KEY, { expiresIn: REFRESH_TOKEN_EXPIRY });
}

/**
 * Verify a JWT token and return the decoded payload
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token payload or null if invalid
 */
export function verifyToken(token) {
    try {
        return jwt.verify(token, SECRET_KEY);
    } catch (error) {
        return null;
    }
}

/**
 * Get role from decoded token
 * @param {Object} decoded - Decoded JWT payload
 * @returns {string} Role ('admin', 'user', or 'anonymous')
 */
export function getRoleFromToken(decoded) {
    if (!decoded) return 'anonymous';
    return decoded.role === 'admin' ? 'admin' : 'user';
}
