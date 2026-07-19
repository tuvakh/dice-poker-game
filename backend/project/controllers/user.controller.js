import { matchedData } from 'express-validator';
import userServices from '../services/user.service.js';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.js';

export async function getAllUsers(req, res, next) {
    try {
        const { page, limit, search } = matchedData(req);
        const result = await userServices.getAllUsers({ page, limit, search });
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
}

export async function getUser(req, res, next) {
    try {
        const { userId } = matchedData(req);
        const result = await userServices.getUser(userId);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
}

export async function createUser(req, res, next) {
    try {
        const userData = matchedData(req);
        const result = await userServices.createUser(userData);
        res.status(201).json(result);
    } catch (error) {
        next(error);
    }
}

export async function loginUser(req, res, next) {
    try {
        const { username, password } = matchedData(req);
        const result = await userServices.loginUser(username, password);

        const accessToken = generateAccessToken(result, req.ip);
        const refreshToken = generateRefreshToken(result);

        await userServices.saveRefreshToken(result.userId, refreshToken);

        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Lax',
            maxAge: 60 * 60 * 1000 
        });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Lax',
            maxAge: 30 * 24 * 60 * 60 * 1000 
        });

        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
}

export async function updateUser(req, res, next) {
    try {
        const { userId, ...updateData } = matchedData(req);
        if (req.file) {
            const mime = req.file.mimetype || 'application/octet-stream';
            const base64 = req.file.buffer.toString('base64');
            updateData.profileImage = `data:${mime};base64,${base64}`;
        }
        const result = await userServices.updateUser(userId, updateData);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
}

export async function banUser(req, res, next) {
    try {
        const { userId } = matchedData(req);
        const result = await userServices.banUser(userId);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
}

export async function unbanUser(req, res, next) {
    try {
        const { userId } = matchedData(req);
        const result = await userServices.unbanUser(userId);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
}

export async function changeRole(req, res, next) {
    try {
        const { userId, role } = matchedData(req);
        const result = await userServices.changeUserRole(userId, role);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
}

export async function verifyEmail(req, res, next) {
    try {
        const { token } = matchedData(req);
        const result = await userServices.verifyEmailToken(token);
        res.status(200).json({ message: 'Email verified', user: result });
    } catch (error) {
        next(error);
    }
}

export async function forgotPassword(req, res, next) {
    try {
        const { email } = matchedData(req);
        const result = await userServices.requestPasswordReset(email);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
}

export async function resetPassword(req, res, next) {
    try {
        const { code, password } = matchedData(req);
        const result = await userServices.resetPassword(code, password);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
}

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

        const user = await userServices.getUser(decoded.userId);

        const newAccessToken = generateAccessToken(user, req.ip);

        res.cookie('accessToken', newAccessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Lax',
            maxAge: 60 * 60 * 1000 
        });

        res.status(200).json({ message: 'Access token refreshed' });
    } catch (error) {
        next(error);
    }
}

export async function logoutUser(req, res) {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.status(200).json({ message: 'Logged out' });
}

export async function resendVerification(req, res, next) {
    try {
        const { email } = matchedData(req);
        const result = await userServices.resendVerification(email);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
}

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
    refreshToken,
    logoutUser,
    resendVerification
};
