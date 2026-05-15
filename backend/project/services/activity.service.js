// This service computes platform statistics for the activity endpoint.
// Anonymous matches are excluded

// activeUsers collects all unique player IDs from matches in the last 7 days using a Set
// to deduplicate players who have played multiple matches this week

// last10Matches returns the 10 most recently finished non-anonymous matches

import { Match } from '../models/Match.js';

export async function getActivity(){
    // ongoingMatches counts all non-anonymous matches currently being played
    const ongoingMatches = await Match.countDocuments({ status: "ongoing", isAnonymous: false });
    
    // oneWeekAgo calculates the date 7 days ago by subtracting milliseconds: 7 days * 24 hours * 60 minutes * 60 seconds * 1000ms
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    // $gte means "greater than or equal to" 
    // It finds all matches that started after oneWeekAgo
    const recentMatches = await Match.find({ startedAt: { $gte: oneWeekAgo }, isAnonymous: false });
    // activeUsers collects all unique player IDs from matches in the last 7 days 
    // using a Set to deduplicate players who have played multiple matches this week
    const activeUsers = new Set(recentMatches.flatMap(match => match.players.map(player => player.toString()))).size;

    // last10Matches returns the 10 most recently finished non-anonymous matches
    const last10Matches = await Match.find({ status: "finished", isAnonymous: false }).sort({ endedAt: -1 }).limit(10);

    return {
        ongoingMatches, 
        activeUsers, 
        last10Matches
    };
}

export default {
    getActivity
};