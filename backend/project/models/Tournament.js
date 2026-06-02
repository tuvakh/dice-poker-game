// This model represents a tournament with participants, rounds, and a trophy.

import mongoose from "mongoose";

import {
    MIN_TITLE_LENGTH,
    MAX_TITLE_LENGTH,
    MIN_DESCRIPTION_LENGTH,
    MAX_DESCRIPTION_LENGTH,
    TOURNAMENT_STATUS
} from "../config/constants.js";

const tournamentSchema = new mongoose.Schema({
    // tournamentId is a random numeric public-facing ID used in URLs instead of MongoDB's internal _id
    tournamentId: {
        type: Number,
        unique: true
    },
    // title and description have min and max lengths
    title: {
        type: String,
        minLength:[MIN_TITLE_LENGTH, `The tournament title have to be minimum ${MIN_TITLE_LENGTH} characters`],
        maxLength: [MAX_TITLE_LENGTH, `The tournament title can't be longer than ${MAX_TITLE_LENGTH} characters`],
        required: true
    },
    description: {
        type: String,
        minLength:[MIN_DESCRIPTION_LENGTH, `The tournament description have to be minimum ${MIN_DESCRIPTION_LENGTH} characters`],
        maxLength: [MAX_DESCRIPTION_LENGTH, `The tournament description can't be longer than ${MAX_DESCRIPTION_LENGTH} characters`],
        required: true
    },
    // date is the scheduled start date of the tournament
    date: {
        type: Date,
        required: true
    },
    // breaks is the number of minutes between each round
    breaks: {
        type: Number,
        required: true
    },
    // numberOfRounds is the maximum number of rounds in the tournament
    numberOfRounds: {
        type: Number,
        required: true,
        default: 1
    },
    // gameCategory links the tournament to the game variant being played
    gameCategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'GameCategory',
        required: true
    },
    // participants is a list of users who have joined the tournament
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    // status tracks whether the tournament is upcoming, ongoing, or finished
    status: {
        type: String,
        enum: TOURNAMENT_STATUS,
        required: true,
        default: 'upcoming'
    },
    // trophy is linked when a trophy is created with this tournament's ID
    // It is automatically awarded to the winner of the tournament when the final match is recorded
    trophy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Trophy'
    },
    // eloMin is the minimum Elo rating required to join this tournament
    eloMin: {
        type: Number,
        default: null
    },
    // eloMax is the maximum Elo rating allowed to join this tournament
    eloMax: {
        type: Number,
        default: null
    },
    // buyIn is the coin cost to enter — winner takes all at the end
    buyIn: {
        type: Number,
        min: 0,
        default: 0
    },
    // rounds is an array of arrays
    // Each inner array represents one round, and contains the matches played in that round. 
    // When a round is finished, the winners are paired up against each other, and a new inner array is added for the next round.
    rounds: [[{
        matchId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Match'
        }
    }]]
});

// The pre("validate") hook generates a tournamentId before the first save, if one doesn't exist yet
tournamentSchema.pre("validate", function(){
    if (!this.tournamentId) {
        this.tournamentId = Math.round(Math.random() * Number.MAX_SAFE_INTEGER);
    }
});

// This creates the Tournament model from the schema and exports it so it can be used in services
export const Tournament = mongoose.model("Tournament", tournamentSchema);