// This service handles user registration, login, profile retrieval, updates, and banning.

import { User } from '../models/User.js';
import { Match } from '../models/Match.js';
import { checkPassword } from "../utils/hash.js";
import { CustomError } from '../utils/customError.js';
import { applyMonthlyCoinGrant } from '../utils/coins.js';
import crypto from 'crypto';

export async function getAllUsers({ page = 1, limit = 10, search = ""}){
	// Only search by username if a search term was provided
    // otherwise return all users
    const searchUsers = search ? { username: { $regex: search, $options: "i" } } : {};

    const userList = await User.find(searchUsers)
        // This exclude password from the response so it's never exposed to the client
        .select("-password")
        .skip((page - 1) * limit)
        .limit(limit);
    
    const totalUsers = await User.countDocuments(searchUsers);

    return { 
        userList, 
        totalUsers, 
        page, 
        limit, 
        totalPages: Math.ceil(totalUsers / limit)};
}

export async function getUser(userId){
    // populate() replaces trophy ObjectIds with the full trophy objects including image and title
	 const user = await User.findOne({ userId }).select("-password").populate('trophies');;
     if(!user){
		throw new CustomError(`A user with the id ${userId}? Never heard of them!`, 404, "NOT_FOUND");
	}

    // Lazy monthly grant: users receive missing monthly rewards when they log in or open profile.
    await applyMonthlyCoinGrant(user);

    // This fetches the 10 most recent matches this user played (excluding lobby waiting games)
    const recentGames = await Match.find({ players: user._id, status: { $ne: "waiting" } })
        .populate('players', 'username userId eloRating profileImage')
        .populate('gameCategory')
        .sort({ startedAt: -1 })
        .limit(10);

    const totalGames = await Match.countDocuments({ players: user._id });

    // This calculate the date 7 days ago to find matches played this week
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const recentMatches = await Match.find({
        players: user._id,
        startedAt: { $gte: oneWeekAgo },
        status: "finished"
    });

    // This sum up the ELO deltas from all finished matches this week to get the weekly rating change
    const weeklyEloChange = recentMatches.reduce((total, match) => {
        const change = match.eloChanges?.find(c => c.userId.toString() === user._id.toString());
        return total + (change?.delta || 0);
    }, 0);

    // This spreads the user object and add the computed fields before returning
    return { ...user.toObject(), recentGames, totalGames, ratingChange: weeklyEloChange };
}

function generateEmailVerificationToken() {
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // Token expires in 7 days
    return { token, expires };
}

export async function createUser(userObj){
    const { username, email, password, age, role } = userObj;

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
        throw new CustomError(`Sorry, ${username} is already taken.. Time to get creative!`, 409, "CONFLICT");
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
        throw new CustomError(`A user with the email ${email} is already registered — did you forget your password?`, 409, "CONFLICT");
    }

    const { token, expires } = generateEmailVerificationToken();

    const newUser = await User.create({
        username,
        password,
        email,
        age,
        role,
        emailVerified: false,
        emailVerificationToken: token,
        emailVerificationExpires: expires
    });

    return { newUser, token };
}
export async function loginUser(username, password){
    // Case-insensitive search so "TUVA", "tuva", and "Tuva" all find the same account
    const user = await User.findOne({ username: { $regex: `^${username}$`, $options: "i" } });
	if(!user){
        throw new CustomError(`We don't know anyone with the username ${username}!`, 404, "NOT_FOUND");
    }
    // prevent banned users from logging in
    if (user.banned) throw new CustomError("This account has been banned. Time to reflect on your choices!", 403, "FORBIDDEN");

    // checkPassword hashes the input and compares it to the stored hash
    const correctPassword = checkPassword(password, user.password);
	if(!correctPassword){
        throw new CustomError("Nope, that's not the right password. Try again!", 401, "UNAUTHORIZED");
    }

    // Grant monthly reward on successful login.
    await applyMonthlyCoinGrant(user);

    // This removes the password from the user object before returning
    // This avoids exposing it in the response
    user.password = undefined;
    return user;
}

export async function updateUser(userId, updateObj){
	const user = await User.findOne({ userId }).select("-password");
	if(!user){
        throw new CustomError(`A user with the id ${userId}? Never heard of them!`, 404, "NOT_FOUND");
    }

    // Object.assign copies all update fields onto the user document
    Object.assign(user, updateObj);
    await user.save(); 
    
    return user;
}

// Handles user banning
export async function banUser(userId){
    const user = await User.findOneAndUpdate({ userId }, { banned: true }, { new: true });
	if(!user){
        throw new CustomError(`A user with the id ${userId}? Never heard of them!`, 404, "NOT_FOUND");
    }
 
    // This sets the password to undefined so it's not included in the response
    user.password = undefined;
    return user;
}

export default {
    getAllUsers,
	getUser,
    createUser,
    loginUser,
    updateUser,
    banUser
};