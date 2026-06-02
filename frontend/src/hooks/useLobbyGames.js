// Filters lobby matches for the current user: hides games they already joined and games outside their Elo range
// Not a React hook despite the filename — it is a plain utility function with no state or effects

// How far a user's Elo can be from the game's desired Elo and still be allowed to join
const ELO_RANGE = 200;

export function filterLobbyMatches(matches, user) {
    // Guests see all matches since they can only spectate anyway
    if (!user) return matches;

    return matches.filter(match => {
        const alreadyIn = match.players.some(player => player?._id === user._id);
        // If the game has no Elo preference set, anyone can join regardless of rating
        const eloOk = !match.desiredOpponentElo ||
            Math.abs(match.desiredOpponentElo - user.eloRating) <= ELO_RANGE;
        return !alreadyIn && eloOk;
    });
}
