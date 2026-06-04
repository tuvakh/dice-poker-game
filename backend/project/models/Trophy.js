import mongoose from "mongoose";

import {
    MIN_TITLE_LENGTH,
    MAX_TITLE_LENGTH,
} from "../config/constants.js";

const trophySchema = new mongoose.Schema({
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
    image: {
        type: String,
        required: true
    },
    tournamentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tournament'
    }
});

trophySchema.pre("validate", function(){
    if (!this.trophyId) {
        this.trophyId = Math.round(Math.random() * Number.MAX_SAFE_INTEGER);
    }
});

export const Trophy = mongoose.model("Trophy", trophySchema);