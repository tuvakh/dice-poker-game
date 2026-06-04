import { Match } from '../models/Match.js';

export async function getActivity(){
    const ongoingMatches = await Match.countDocuments({ status: "ongoing" });

    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentMatches = await Match.find({ startedAt: { $gte: oneWeekAgo } });
    const activeUsers = new Set(recentMatches.flatMap(match => match.players.map(player => player.toString()))).size;

    const gamesPlayedLastWeek = recentMatches.filter(match => match.status === 'finished').length;

    const last10Matches = await Match.find({ status: "finished" }).sort({ endedAt: -1 }).limit(10);

    return {
        ongoingMatches,
        activeUsers,
        gamesPlayedLastWeek,
        last10Matches
    };
}

export default {
    getActivity
};