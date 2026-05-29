// This service handles matchmaking for registered players

import { Queue } from '../models/Queue.js';
import { User } from '../models/User.js';
import { createMatch } from './match.service.js';
import { CustomError } from '../utils/customError.js';

export async function joinQueue({ userId, gameCategoryId }) {
    // This checks if this user is already in the queue, to prevent duplicate entries
    const existing = await Queue.findOne({ userId });
    if (existing) {
        throw new CustomError("Slow down! You're already in the queue, just be patient", 409, "CONFLICT");
    }

    // This fetch the user to get their current ELO rating for matchmaking
    const user = await User.findById(userId);
    if (!user) {
        throw new CustomError("We searched everywhere, but that user doesn't exist!", 404, "NOT_FOUND");
    }

    // This gets all the other players waiting for the same game category
    const players = await Queue.find({ 
        gameCategoryId,
        userId: { $ne: userId }
    });

    const now = Date.now();

    for (const player of players) {
        // This calculate how long this player has been waiting in milliseconds
        const waitedMs = now - new Date(player.joinedAt).getTime();
        const waitedSecs = waitedMs / 1000;

        // ELO range relaxes over time, which means that the longer a player waits, the wider the acceptable ELO difference gets
        let eloRange;
        // under 30 seconds: must be within 100 ELO
        if (waitedSecs < 30) eloRange = 100;
        // 30-60 seconds: within 200 ELO  
        else if (waitedSecs < 60) eloRange = 200;
        // over 60 seconds: match with anyone
        else eloRange = Infinity;

        // check if this waiting player is within the ELO range
        const eloDiff = Math.abs(user.eloRating - player.eloRating);

        if (eloDiff <= eloRange) {
            // This removes the matched player from the queue and create a match
            await Queue.deleteOne({ _id: player._id });
            const match = await createMatch({
                gameCategoryId,
                players: [userId, player.userId]
            });
            return { status: "matched", match };
        }
    }

    // If no suitable opponent found right away, add this player to the queue to wait
    await Queue.create({ userId, gameCategoryId, eloRating: user.eloRating });
    return { status: "waiting" };
}

export async function leaveQueue(userId) {
    // findOneAndDelete finds and removes the player's queue entry in one operation
    const entry = await Queue.findOneAndDelete({ userId });
    if (!entry) {
        throw new CustomError("You can't leave a queue you never joined!", 404, "NOT_FOUND");
    }
    return { message: "Left queue successfully" };
}

export default { joinQueue, leaveQueue };
