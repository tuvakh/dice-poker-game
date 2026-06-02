// This service handles user registration, login, profile retrieval, updates, and banning.

import { User } from '../models/User.js';
import { Match } from '../models/Match.js';
import { checkPassword, hashPassword } from '../utils/hash.js';
import { CustomError } from '../utils/customError.js';
import { applyWeeklyCoinGrant } from '../utils/coins.js';
import { verifyToken } from '../utils/jwt.js';
import crypto from 'crypto';
import { sendPasswordResetEmail, sendVerificationEmail } from '../utils/mailer.js';

export async function getAllUsers({ page = 1, limit = 10, search = '' }) {
    // Only search by username if a search term was provided
    // otherwise return all users
    const searchUsers = search ? { username: { $regex: search, $options: 'i' } } : {};

    const userList = await User.find(searchUsers)
        // This exclude password from the response so it's never exposed to the client
        .select('-password')
        .skip((page - 1) * limit)
        .limit(limit);

    const totalUsers = await User.countDocuments(searchUsers);

    return {
        userList,
        totalUsers,
        page,
        limit,
        totalPages: Math.ceil(totalUsers / limit)
    };
}

export async function getUser(userId) {
    // populate() replaces trophy ObjectIds with the full trophy objects including image and title
    const user = await User.findOne({ userId }).select('-password').populate('trophies');
    if (!user) {
        throw new CustomError(`A user with the id ${userId}? Never heard of them!`, 404, 'NOT_FOUND');
    }

    // Lazy weekly grant: users receive missing weekly rewards when they log in or open profile.
    await applyWeeklyCoinGrant(user);

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const monthMatches = await Match.find({
        players: user._id,
        status: 'finished',
        endedAt: { $gte: thirtyDaysAgo }
    });
    const monthWins = monthMatches.filter((match) => match.winner?.toString() === user._id.toString()).length;
    const monthLosses = monthMatches.length - monthWins;

    const totalGames = await Match.countDocuments({ players: user._id });

    // This calculate the date 7 days ago to find matches played this week
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const recentMatches = await Match.find({
        players: user._id,
        startedAt: { $gte: oneWeekAgo },
        status: 'finished'
    });

    // This sum up the ELO deltas from all finished matches this week to get the weekly rating change
    const weeklyEloChange = recentMatches.reduce((total, match) => {
        const change = match.eloChanges?.find((c) => c.userId.toString() === user._id.toString());
        return total + (change?.delta || 0);
    }, 0);

    // This spreads the user object and add the computed fields before returning
    return { ...user.toObject(), totalGames, ratingChange: weeklyEloChange, monthWins, monthLosses };
}

function generateEmailVerificationToken() {
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 1000 * 60 * 15); // Token expires in 15 minutes
    return { token, expires };
}

function generatePasswordResetToken() {
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 1000 * 60 * 15); // Token expires in 15 minutes
    return { token, expires };
}

export async function createUser(userObj) {
    const { username, email, password, age, role } = userObj;

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
        throw new CustomError(`Sorry, ${username} is already taken.. Time to get creative!`, 409, 'CONFLICT');
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
        throw new CustomError(`A user with the email ${email} is already registered — did you forget your password?`, 409, 'CONFLICT');
    }

    const hasValidVerificationToken =
        existingEmail &&
        existingEmail.emailVerificationToken &&
        existingEmail.emailVerificationTokenExpires &&
        existingEmail.emailVerificationTokenExpires > new Date();
    const tokenData = hasValidVerificationToken
        ? { token: existingEmail.emailVerificationToken, expires: existingEmail.emailVerificationTokenExpires }
        : generateEmailVerificationToken();

    const newUser = await User.create({
        username,
        password,
        email,
        age,
        role,
        emailVerified: false,
        emailVerificationToken: tokenData.token,
        emailVerificationTokenExpires: tokenData.expires,
        emailVerificationTokens: [{ token: tokenData.token, expires: tokenData.expires }]
    });

    try {
        await sendVerificationEmail(email, tokenData.token);
        console.log('Verification email sent to:', email);
    } catch (err) {
        console.error('Failed to send verification email:', err);
    }
    return { newUser, token: tokenData.token };
}

export async function verifyEmailToken(token) {
    if (!token) {
        throw new CustomError('Verification token is required', 400, 'BAD_REQUEST');
    }

    const user = await User.findOne({
        $or: [
            {
                emailVerificationToken: token,
                emailVerificationTokenExpires: { $gt: new Date() }
            },
            {
                emailVerificationTokens: {
                    $elemMatch: {
                        token,
                        expires: { $gt: new Date() }
                    }
                }
            }
        ]
    });

    if (!user) {
        throw new CustomError('Invalid or expired verification token', 404, 'NOT_FOUND');
    }

    user.emailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationTokenExpires = null;
    user.emailVerificationTokens = [];
    await user.save();

    user.password = undefined;
    return user;
}

export async function requestPasswordReset(email) {
    const user = await User.findOne({ email });

    if (!user) {
        throw new CustomError('No account found with that email address.', 404, 'NOT_FOUND');
    }

    const tokenData = generatePasswordResetToken();

    const updatedUser = await User.findOneAndUpdate(
        {
            email,
            $or: [
                { passwordResetTokenExpires: { $exists: false } },
                { passwordResetTokenExpires: null },
                { passwordResetTokenExpires: { $lte: new Date() } }
            ]
        },
        {
            $set: {
                passwordResetToken: tokenData.token,
                passwordResetTokenExpires: tokenData.expires
            },
            $push: {
                passwordResetTokens: {
                    token: tokenData.token,
                    expires: tokenData.expires
                }
            }
        },
        { new: true }
    );

    if (!updatedUser) {
        return { message: `Reset link sent to ${email}.` };
    }

    try {
        await sendPasswordResetEmail(email, tokenData.token);
        console.log('Password reset email sent to:', email);
    } catch (err) {
        console.error('Failed to send password reset email:', err);
    }

    return { message: `Reset link sent to ${email}.` };
}

export async function resetPassword(code, password) {
    const user = await User.findOne({
        $or: [
            {
                passwordResetToken: code,
                passwordResetTokenExpires: { $gt: new Date() }
            },
            {
                passwordResetTokens: {
                    $elemMatch: {
                        token: code,
                        expires: { $gt: new Date() }
                    }
                }
            }
        ]
    });

    if (!user) {
        throw new CustomError('Invalid or expired reset code', 404, 'NOT_FOUND');
    }

    user.password = password; // Set to plaintext - will be hashed by pre-validate hook
    user.passwordResetToken = null;
    user.passwordResetTokenExpires = null;
    user.passwordResetTokens = [];

    await user.save(); // This triggers the pre-validate hook that hashes the password

    user.password = undefined;
    return { message: 'Password reset successfully' };
}

export async function loginUser(username, password) {
    // Case-insensitive search so "TUVA", "tuva", and "Tuva" all find the same account
    const user = await User.findOne({ username: { $regex: `^${username}$`, $options: 'i' } });
    if (!user) {
        throw new CustomError(`We don't know anyone with the username ${username}!`, 404, 'NOT_FOUND');
    }
    // prevent banned users from logging in
    if (user.banned) throw new CustomError('This account has been banned. Time to reflect on your choices!', 403, 'FORBIDDEN');

    // checkPassword hashes the input with the user's salt and compares it to the stored hash
    const correctPassword = await checkPassword(password, user.password);

    if (!correctPassword) {
        throw new CustomError("Nope, that's not the right password. Try again!", 401, 'UNAUTHORIZED');
    }

    // Grant weekly reward on successful login.
    await applyWeeklyCoinGrant(user);

    // This removes the password from the user object before returning
    // This avoids exposing it in the response
    user.password = undefined;
    return user;
}

export async function updateUser(userId, updateObj) {
    // Hash password before update if provided, since findOneAndUpdate bypasses the pre-save hook
    if (updateObj.password) {
        updateObj.password = await hashPassword(updateObj.password);
    }

    const user = await User.findOneAndUpdate(
        { userId },
        { $set: updateObj },
        { new: true, runValidators: false }
    ).select('-password');

    if (!user) {
        throw new CustomError(`A user with the id ${userId}? Never heard of them!`, 404, 'NOT_FOUND');
    }

    return user;
}

// Handles user banning
export async function banUser(userId) {
    const user = await User.findOneAndUpdate({ userId }, { banned: true }, { new: true });
    if (!user) {
        throw new CustomError(`A user with the id ${userId}? Never heard of them!`, 404, 'NOT_FOUND');
    }

    // This sets the password to undefined so it's not included in the response
    user.password = undefined;
    return user;
}

// Unban a user (admin only)
export async function unbanUser(userId) {
    const user = await User.findOneAndUpdate({ userId }, { banned: false }, { new: true });
    if (!user) {
        throw new CustomError(`A user with the id ${userId}? Never heard of them!`, 404, 'NOT_FOUND');
    }
    user.password = undefined;
    return user;
}

// Change a user's role (admin only)
export async function changeUserRole(userId, role) {
    if (!['user', 'admin'].includes(role)) {
        throw new CustomError('Invalid role', 400, 'BAD_REQUEST');
    }
    const user = await User.findOneAndUpdate({ userId }, { role }, { new: true }).select('-password');
    if (!user) {
        throw new CustomError(`A user with the id ${userId}? Never heard of them!`, 404, 'NOT_FOUND');
    }
    return user;
}

// Save refresh token to database (for logout/revocation/validation)
export async function saveRefreshToken(userId, token) {
    const user = await User.findOne({ userId });
    if (!user) {
        throw new CustomError(`A user with the id ${userId}? Never heard of them!`, 404, 'NOT_FOUND');
    }
    user.refreshToken = token;
    await user.save();
    return user;
}

// Verify refresh token - checks both JWT validity and storage in DB
export async function verifyRefreshToken(token) {
    // First verify it's a valid JWT
    const decoded = verifyToken(token);
    if (!decoded || decoded.type !== 'refresh') {
        return null;
    }
    
    // Then check it matches the stored token (ensures logout/revocation works)
    const user = await User.findOne({ userId: decoded.userId });
    if (!user || user.refreshToken !== token) {
        return null;
    }
    
    return decoded;
}

export async function resendVerification(email) {
    const user = await User.findOne({ email });
    // Return a neutral message whether the user exists or not to prevent enumeration
    if (!user || user.emailVerified) {
        return { message: 'If that email is pending verification, a new link has been sent.' };
    }
    await resendVerificationEmail(user);
    return { message: 'If that email is pending verification, a new link has been sent.' };
}

export default {
    getAllUsers,
    getUser,
    createUser,
    loginUser,
    updateUser,
    banUser,
    unbanUser,
    changeUserRole,
    saveRefreshToken,
    verifyRefreshToken,
    verifyEmailToken,
    requestPasswordReset,
    resetPassword,
    resendVerification
};
