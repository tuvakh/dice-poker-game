// This model represents a registered user on the platform.

import mongoose from "mongoose";
import { hashPassword } from "../utils/hash.js";

import {
    MIN_USERNAME_LENGTH,
    MAX_USERNAME_LENGTH,
    MIN_AGE,
    USER_ROLE
} from "../config/constants.js";

const userSchema = new mongoose.Schema({
    // userId is a random numeric public-facing ID used in URLs instead of MongoDB's internal _id
    userId: {
        type: Number,
        unique: true
    },
    // username must be unique
    // trim removes whitespace from both ends of the username before saving
    // match uses a regex to ensure the username only contains letters, numbers and underscores
    username: {
        type: String,
        trim: true,
        minLength: [MIN_USERNAME_LENGTH, `Your username have to be minimum ${MIN_USERNAME_LENGTH} characters`],
        maxLength: [MAX_USERNAME_LENGTH, `Your username can't be longer than ${MAX_USERNAME_LENGTH} characters`],
        match: [/^\w+$/, "Username can only contain alphanumeric characters"],
        unique: true,
        required: true
    },
    // email must be unique
    email: {
        type: String,
        unique: true,
        required: true
    },
    // The password is stored as an MD5 hash
    password: {
        type: String,
        trim: true,
        required: true
    },

     emailVerified: {
        type: Boolean,
        default: false,
        required: true
    },

    emailVerificationToken: {
        type: String,
        default: null
    },

    emailVerificationTokenExpires: {
        type: Date,
        default: null
    },
    emailVerificationTokens: [{
        token: { type: String, required: true },
        expires: { type: Date, required: true }
    }],
    passwordResetToken: {
        type: String,
        default: null
    },

    passwordResetTokenExpires: {
        type: Date,
        default: null
    },
    passwordResetTokens: [{
        token: { type: String, required: true },
        expires: { type: Date, required: true }
    }],
    // age has a minimum value of MIN_AGE (18)
    age: {
        type: Number,
        min: [MIN_AGE, `You need to be older than ${MIN_AGE} to play`],
        required: true
    },
    // eloRating starts at 1000 for all new users and updates automatically after each match
    eloRating: {
        type: Number,
        default: 1000,
        required: true
    },
    // Per-time-control Elo ratings (10s, 30s, 90s)
    eloRating10s: { type: Number, default: 1000 },
    eloRating30s: { type: Number, default: 1000 },
    eloRating90s: { type: Number, default: 1000 },
    // coins are used for wagers and monthly rewards
    coins: {
        type: Number,
        min: 0,
        default: 100,
        required: true
    },
  
    lastMonthlyCoinGrantAt: {
        type: Date,
        default: Date.now,
        required: true
    },
    role: {
        type: String,
        enum: USER_ROLE,
        required: true,
        default: 'user'
    },
    // trophies is an array of Trophy references
    // These are populated with full trophy objects when queried
    trophies: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Trophy'
    }],
    // banned defaults to false
    // It can be set to true by admins that blocks an user from the platform
    banned: {
        type: Boolean,
        default: false
    },
    // createdAt is automatically set to the current date and time when the user is created
    createdAt: {
        type: Date,
        default: Date.now
    },
    // String stores the file path/URL, not the image itself
    profileImage: {
        type: String,
        default: null
    },
    // Short bio shown on the user's profile page
    aboutMe: {
        type: String,
        default: ""
    },
    // preferences stores the user's appearance settings, saved to the backend for registered users
    preferences: {
        theme: { type: String, enum: ['light', 'dark'], default: 'light' },
        boardColor: { type: String, default: '#ffffff' },
        soundEnabled: { type: Boolean, default: true },
        lobbyCount: { type: Number, min: 1, max: 20, default: 5 }
    }

});
// The pre("validate") hook runs before each save.
// It generates a userId if one doesn't exist yet
// and it hashes the password if it has been modified, to avoid storing plaintext passwords
userSchema.pre("validate", function(){
    if (!this.userId) {
        this.userId = Math.round(Math.random() * Number.MAX_SAFE_INTEGER);
    }
    // isModified("password") prevents double-hashing if the user updates other fields
    if(this.isModified("password")){
        this.password = hashPassword(this.password);
    }
});

// This creates the User model from the schema and exports it so it can be used in services
export const User = mongoose.model("User", userSchema);