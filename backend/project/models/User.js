import mongoose from "mongoose";
import { hashPassword } from "../utils/hash.js";

import {
    MIN_USERNAME_LENGTH,
    MAX_USERNAME_LENGTH,
    MIN_AGE,
    USER_ROLE
} from "../config/constants.js";

const userSchema = new mongoose.Schema({
    userId: {
        type: Number,
        unique: true
    },
    username: {
        type: String,
        trim: true,
        minLength: [MIN_USERNAME_LENGTH, `Your username have to be minimum ${MIN_USERNAME_LENGTH} characters`],
        maxLength: [MAX_USERNAME_LENGTH, `Your username can't be longer than ${MAX_USERNAME_LENGTH} characters`],
        match: [/^\w+$/, "Username can only contain alphanumeric characters"],
        unique: true,
        required: true
    },
    email: {
        type: String,
        unique: true,
        required: true
    },
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
    age: {
        type: Number,
        min: [MIN_AGE, `You need to be older than ${MIN_AGE} to play`],
        required: true
    },
    eloRating: {
        type: Number,
        default: 1000,
        required: true
    },
    eloRating10s: { type: Number, default: 1000 },
    eloRating30s: { type: Number, default: 1000 },
    eloRating90s: { type: Number, default: 1000 },
    coins: {
        type: Number,
        min: 0,
        default: 100,
        required: true
    },
  
    lastWeeklyCoinGrantAt: {
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
    trophies: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Trophy'
    }],
    banned: {
        type: Boolean,
        default: false
    },
    refreshToken: {
        type: String,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    profileImage: {
        type: String,
        default: null
    },
    aboutMe: {
        type: String,
        default: ""
    },
    preferences: {
        theme: { type: String, enum: ['light', 'dark'], default: 'light' },
        boardColor: { type: String, default: '#abc6ba' },
        soundEnabled: { type: Boolean, default: true },
        lobbyCount: { type: Number, min: 1, max: 20, default: 5 }
    }

});

userSchema.pre('validate', async function () {
    if (!this.userId) {
        this.userId = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
    }
    if (this.isModified('password')) {
        this.password = await hashPassword(this.password);
    }
});

export const User = mongoose.model("User", userSchema);