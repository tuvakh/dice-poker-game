// This model represents one of the 18 possible game variants based on:
// numberOfRounds (3/5/7)
// gameRules (is straights allowed or not)
// and timeController (10/30/90 seconds).

import mongoose from "mongoose";

import { 
    GAME_RULES, 
    NUMBER_OF_ROUNDS, 
    TIME_CONTROLLERS 
} from '../config/constants.js';

const gameCategorySchema = new mongoose.Schema({
    // gameCategoryId is a random numeric public-facing ID used in URLs instead of MongoDB's internal _id
    gameCategoryId: {
        type: Number,
        unique: true
    },
    // numberOfRounds defines how many rounds the game lasts
    numberOfRounds: {
        type: Number,
        enum: NUMBER_OF_ROUNDS,
        required: true
    },
    // gameRules defines whether straights are allowed or not, in this game variant
    gameRules: {
        type: String,
        enum: GAME_RULES,
        required: true
    },
    // timeController defines total seconds each player has across all rounds
    timeController: {
        type: Number,
        enum: TIME_CONTROLLERS,
        required: true
    }
});

// The pre("validate") hook generates a gameCategoryId before the first save, if one doesn't exist yet
gameCategorySchema.pre("validate", function(){
    if (!this.gameCategoryId) {
        this.gameCategoryId = Math.round(Math.random() * Number.MAX_SAFE_INTEGER);
    }
});

// This creates the Game Category model from the schema and exports it so it can be used in services
export const GameCategory = mongoose.model("GameCategory", gameCategorySchema);