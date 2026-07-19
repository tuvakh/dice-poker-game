import mongoose from "mongoose";

import { 
    MATCH_STATUS 
} from "../config/constants.js";

const matchSchema = new mongoose.Schema({
    matchId: {
        type: Number,
        unique: true
    },
    startedAt: { 
        type: Date,
        default: Date.now 
    },
    endedAt: { 
        type: Date
    },
    players: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }],
    maxPlayers: { 
        type: Number, 
        min: 2, 
        max: 5, 
        default: 2 
    },
    rolls: {
        type: Array
    },
    holds: {
        type: Array
    },
    winner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    status: {
        type: String,
        enum: MATCH_STATUS,
        default: 'ongoing',
        required: true
    },
    gameCategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'GameCategory',
        required: true
    },
    tournamentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tournament'
    },
    outcome: {
        type: String
    },
    eloChanges: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        delta: { type: Number }
    }],
    desiredOpponentElo: {
        type: Number,
        default: null
    },
    coinWager: {
        type: Number,
        min: 0,
        default: 0
    },
    wagerLocked: {
        type: Boolean,
        default: false
    },
    wagerPaidOut: {
        type: Boolean,
        default: false
    }
});

matchSchema.pre("validate", function(){
    if (!this.matchId) {
        this.matchId = Math.round(Math.random() * Number.MAX_SAFE_INTEGER);
    }
});

export const Match = mongoose.model("Match", matchSchema);