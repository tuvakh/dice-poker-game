// This model represents a single match between two players.
// It stores the result, ELO changes, and whether the match is part of a tournament or not.

import mongoose from "mongoose";

import { 
    MATCH_STATUS 
} from "../config/constants.js";

const matchSchema = new mongoose.Schema({
    // matchId is a random numeric public-facing ID used in URLs instead of MongoDB's internal _id
    matchId: {
        type: Number,
        unique: true
    },
    // startedAt is automatically set to now when the match is created
    startedAt: { 
        type: Date,
        default: Date.now 
    },
    // endedAt is set manually when the match result is recorded
    endedAt: { 
        type: Date
    },
    // players is an array of two User references
    // This is populated with full user objects when queried
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
    // rolls and holds store the dice actions during the game as arrays
    rolls: {
        type: Array
    },
    holds: {
        type: Array
    },
    // winner references the winning player
    // This is only set when the match is recorded as finished
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
    // gameCategory links this match to one of the 18 game variants
    gameCategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'GameCategory',
        required: true
    },
    // tournamentId is only set if this match is part of a tournament knockout round
    tournamentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tournament'
    },
    // outcome stores the final score as a string
    outcome: {
        type: String
    },
    // eloChanges stores the rating for each player after the match,
    // This is used to calculate weekly rating change in user profiles
    eloChanges: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        delta: { type: Number }
    }],
    // desiredOpponentElo is the creator's preferred opponent Elo rating, used for lobby filtering
    desiredOpponentElo: {
        type: Number,
        default: null
    },
    // coinWager is the stake per player for this match
    coinWager: {
        type: Number,
        min: 0,
        default: 0
    },
    // wagerLocked marks that both players' stakes were reserved
    wagerLocked: {
        type: Boolean,
        default: false
    },
    // wagerPaidOut prevents duplicate payouts if record endpoint is called twice
    wagerPaidOut: {
        type: Boolean,
        default: false
    }
});

// The pre("validate") hook generates a matchId before the first save, if one doesn't exist yet
matchSchema.pre("validate", function(){
    if (!this.matchId) {
        this.matchId = Math.round(Math.random() * Number.MAX_SAFE_INTEGER);
    }
});

// This creates the Match model from the schema and exports it so it can be used in services
export const Match = mongoose.model("Match", matchSchema);