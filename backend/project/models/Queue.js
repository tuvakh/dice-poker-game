// This model represents a player waiting in queue to be matched against an opponent.
// Both registered and anonymous players wait here
// but registered users gets opponents based on ELO rating (for skill-based matching),
// while anonymous players gets to play with other anonymous users (they have no userId or ELO rating)

import mongoose from "mongoose";

const queueSchema = new mongoose.Schema({
    // userId is sparse+unique
    // Unique prevents a registered user from joining the queue twice
    // Sparse means the unique index only applies to non-null values,
    // this is necessary to allow anonymous users to enter, because they have userId: null
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        unique: true,
        sparse: true
    },
    // gameCategoryId links the queue entry to the game variant the player wants to play
    gameCategoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "GameCategory",
        required: true
    },
    // eloRating is stored here so the matchmaking algorithm can compare players without extra database lookups
    eloRating: {
        type: Number
    },
    // joinedAt is used to calculate how long a player has been waiting,
    // This determines how much the ELO range is relaxed over time
    joinedAt: {
        type: Date,
        default: Date.now
    }
});

// This creates the Queue model from the schema and exports it so it can be used in services
export const Queue = mongoose.model("Queue", queueSchema);
