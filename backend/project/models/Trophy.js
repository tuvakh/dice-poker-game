// This model represents a trophy that can be awarded to the winner of a tournament.
// The trophy has a title and an image file, and is linked to the tournament it belongs to.

import mongoose from "mongoose";

import {
    MIN_TITLE_LENGTH,
    MAX_TITLE_LENGTH,
} from "../config/constants.js";

const trophySchema = new mongoose.Schema({
    // trophyId is a random numeric public-facing ID used in URLs instead of MongoDB's internal _id
    trophyId: {
        type: Number,
        unique: true
    },
    title: {
        type: String,
        minLength:[MIN_TITLE_LENGTH, `The trophy title have to be minimum ${MIN_TITLE_LENGTH} characters`],
        maxLength: [MAX_TITLE_LENGTH, `The trophy title can't be longer than ${MAX_TITLE_LENGTH} characters`],
        required: true
    },
    // image stores the filename of the uploaded trophy image
    image: {
        type: String,
        required: true
    },
    // tournamentId links the trophy to a specific tournament
    // When the final match of that tournament is recorded, the trophy is awarded to the winner
    tournamentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tournament'
    }
});

// The pre("validate") hook generates a trophyId before the first save if one doesn't exist yet
trophySchema.pre("validate", function(){
    if (!this.trophyId) {
        this.trophyId = Math.round(Math.random() * Number.MAX_SAFE_INTEGER);
    }
});

// This creates the Trophy model from the schema and exports it so it can be used in services
export const Trophy = mongoose.model("Trophy", trophySchema);