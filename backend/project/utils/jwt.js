import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const ACCESS_TOKEN_EXPIRY = '1h'; // Short-lived access token (1 hour)
const REFRESH_TOKEN_EXPIRY = '30d'; // Long-lived refresh token (30 days)

/**
 * Generate an access token (short-lived, for API requests)
 * @param {Object} user - User object with userId and role
 * @returns {string} JWT access token
 */
export function generateAccessToken(user) {
    const payload = {
        userId: user.userId,
        username: user.username,
        role: user.role || 'user', // 'admin' or 'user'
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
        const decoded = jwt.verify(token, SECRET_KEY);
        return decoded;
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
