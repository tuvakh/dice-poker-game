import mongoose from "mongoose";

import { 
    GAME_RULES, 
    NUMBER_OF_ROUNDS, 
    TIME_CONTROLLERS 
} from '../config/constants.js';

const gameCategorySchema = new mongoose.Schema({
    gameCategoryId: {
        type: Number,
        unique: true
    },
    numberOfRounds: {
        type: Number,
        enum: NUMBER_OF_ROUNDS,
        required: true
    },
    gameRules: {
        type: String,
        enum: GAME_RULES,
        required: true
    },
    timeController: {
        type: Number,
        enum: TIME_CONTROLLERS,
        required: true
    }
});

gameCategorySchema.pre("validate", function(){
    if (!this.gameCategoryId) {
        this.gameCategoryId = Math.round(Math.random() * Number.MAX_SAFE_INTEGER);
    }
});

export const GameCategory = mongoose.model("GameCategory", gameCategorySchema);