// This service computes player rankings based on match statistics.

import { User } from '../models/User.js';
import { Match } from '../models/Match.js';
import { GameCategory } from '../models/GameCategory.js';

export async function getRankings({ page = 1, limit = 10, sortBy, category, numberOfRounds, gameRules, timeController }){
    // This fetches all users to allow sorting by computed fields (wins, winPercentage) that aren't stored in the database
    // For large datasets this should be replaced with a MongoDB aggregation pipeline
    const users = await User.find().select("-password");

    // This builds a filter to only count matches in the requested game category
    const matchFilter = {};
    if (category) {
        // if a specific category ID is provided, it's used directly
        matchFilter.gameCategory = category;
    } else if (numberOfRounds || gameRules || timeController) {
        // otherwise, find the category that matches the provided parameters
        const categoryFilter = {};
        if (numberOfRounds) categoryFilter.numberOfRounds = numberOfRounds;
        if (gameRules) categoryFilter.gameRules = gameRules;
        if (timeController) categoryFilter.timeController = timeController;
        // Then look up the matching category in the database
        const foundCategory = await GameCategory.findOne(categoryFilter);
        // and only apply the filter if a matching category was found
        if (foundCategory) matchFilter.gameCategory = foundCategory._id;
    }

    // Count the total matches and wins for each user, and then calculates win percentage
    const usersWithStats = await Promise.all(users.map(async (user) => {
        // This combines the user filter with the category filter
        const userMatchFilter = { players: user._id, ...matchFilter };
        
        const totalMatches = await Match.countDocuments(userMatchFilter);
        // This counts only matches where this user is the winner
        const wins = await Match.countDocuments({ ...userMatchFilter, winner: user._id });
        // This avoids division by zero if the user has no matches
        const winPercentage = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;

        return {
            ...user.toObject(),
            totalMatches,
            wins,
            winPercentage
        };
    }));

    // This sorts the full list in JavaScript, since the stats are computed, not stored in MongoDB
    // userB - userA gives descending order (highest value first)
    if (sortBy === "wins") usersWithStats.sort((userA, userB) => userB.wins - userA.wins);
    else if (sortBy === "winPercentage") usersWithStats.sort((userA, userB) => userB.winPercentage - userA.winPercentage);
    else if (sortBy === "matches") usersWithStats.sort((userA, userB) => userB.totalMatches - userA.totalMatches);
    // The default sort is by ELO rating if no sortBy is provided
    else usersWithStats.sort((userA, userB) => userB.eloRating - userA.eloRating);

    // Then I paginate manually after sorting, since the sorting happened in JavaScript
    const total = usersWithStats.length;
    const paginated = usersWithStats.slice((page - 1) * limit, page * limit);

    return { 
        userList: paginated, 
        total, 
        page, 
        limit, 
        totalPages: Math.ceil(total / limit) 
    };
}

export default {
    getRankings
};