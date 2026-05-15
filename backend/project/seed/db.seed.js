// This is the min seed file
// It connects to the database and runs all seed functions in the correct order before it disconnects. 

// You run it with: npm run seed (defined in package.json).

import { connectDB, disconnectDB } from "../config/db.config.js";
import { User } from "../models/User.js";

import seedUsers from "./users/user.seed.js";
import seedGameCategories from "./gameCategories/gameCategory.seed.js";
import seedTrophies from "./trophies/trophy.seed.js";
import seedTournaments from "./tournaments/tournament.seed.js";
import seedMatches from "./matches/match.seed.js";
import seedComments from "./comments/comment.seed.js";

await connectDB();
try {
    const users = await seedUsers();
    const categories = await seedGameCategories();
    const trophies = await seedTrophies();
    const tournaments = await seedTournaments(users, categories, trophies);
    const matches = await seedMatches(users, categories);
    await seedComments(users, tournaments, matches);

    // Award all trophies to dragonslayer (users[0])
    await User.findByIdAndUpdate(users[0]._id, {
        $push: { trophies: { $each: trophies.map(t => t._id) } }
    });
    console.log("Awarded all trophies to dragonslayer");
    
// This ensures the DB connection is always closed, even if seeding fails.
} finally {
    await disconnectDB();
}