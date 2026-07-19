import mongoose from "mongoose";

import {
    MIN_TITLE_LENGTH,
    MAX_TITLE_LENGTH,
    MIN_DESCRIPTION_LENGTH,
    MAX_DESCRIPTION_LENGTH,
    TOURNAMENT_STATUS
} from "../config/constants.js";

const tournamentSchema = new mongoose.Schema({
    tournamentId: {
        type: Number,
        unique: true
    },
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
    date: {
        type: Date,
        required: true
    },
    breaks: {
        type: Number,
        required: true
    },
    numberOfRounds: {
        type: Number,
        required: true,
        default: 1
    },
    gameCategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'GameCategory',
        required: true
    },
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    status: {
        type: String,
        enum: TOURNAMENT_STATUS,
        required: true,
        default: 'upcoming'
    },
    trophy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Trophy'
    },
    eloMin: {
        type: Number,
        default: null
    },
    eloMax: {
        type: Number,
        default: null
    },
    buyIn: {
        type: Number,
        min: 0,
        default: 0
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    rounds: [[{
        matchId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Match'
        }
    }]]
});

tournamentSchema.pre("validate", function(){
    if (!this.tournamentId) {
        this.tournamentId = Math.round(Math.random() * Number.MAX_SAFE_INTEGER);
    }
});

export const Tournament = mongoose.model("Tournament", tournamentSchema);