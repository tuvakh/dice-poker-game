// Filters waiting matches based on who is viewing
// Logged in: hides games already joined, and games where Elo is out of range
// Not logged in: returns all matches (spectating is always allowed)

// How far a user's Elo can be from the game's desired Elo and still be allowed to join
const ELO_RANGE = 200;

export function filterLobbyMatches(matches, user) {
    if (!user) return matches;
    return matches.filter(match => {
        const alreadyIn = match.players.some(player => player._id === user._id);
        const eloOk = !match.desiredOpponentElo ||
            Math.abs(match.desiredOpponentElo - user.eloRating) <= ELO_RANGE;
        return !alreadyIn && eloOk;
    });
}
