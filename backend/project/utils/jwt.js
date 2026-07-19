import jwt from 'jsonwebtoken';

if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET environment variable is not set');
const SECRET_KEY = process.env.JWT_SECRET;
const ACCESS_TOKEN_EXPIRY = '1h'; 
const REFRESH_TOKEN_EXPIRY = '30d';

export function generateAccessToken(user, ip) {
    const payload = {
        userId: user.userId,
        _id: user._id.toString(),
        username: user.username,
        role: user.role || 'user',
        ip: ip ?? null,
        type: 'access' 
    };
    return jwt.sign(payload, SECRET_KEY, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

export function generateRefreshToken(user) {
    const payload = {
        userId: user.userId,
        type: 'refresh'
    };
    return jwt.sign(payload, SECRET_KEY, { expiresIn: REFRESH_TOKEN_EXPIRY });
}

export function verifyToken(token) {
    try {
        return jwt.verify(token, SECRET_KEY);
    } catch (error) {
        return null;
    }
}

export function getRoleFromToken(decoded) {
    if (!decoded) return 'anonymous';
    return decoded.role === 'admin' ? 'admin' : 'user';
}
