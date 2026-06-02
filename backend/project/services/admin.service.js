import { User } from "../models/User.js";
import { Match } from "../models/Match.js";
import { Security } from "../models/Security.js";

export async function getStats() {
    // Total users
    const totalUsers = await User.countDocuments({});

    // Active matches within last 24 hours (startedAt)
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const activeMatches24h = await Match.countDocuments({ startedAt: { $gte: since24h } });

    // New signups last 7 days
    const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const newSignups7d = await User.countDocuments({ createdAt: { $gte: since7d } });

    const recentIncidents = await Security.find()
    .sort({ timestamp: -1 })
    .limit(20)
    .lean();

    return {
        totalUsers,
        activeMatches24h,
        newSignups7d,
        recentIncidents
    };
}

export default { getStats };
