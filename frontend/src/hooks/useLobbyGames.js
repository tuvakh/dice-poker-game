
const ELO_RANGE = 200;

export function filterLobbyMatches(matches, user) {
    if (!user) return matches;

    return matches.filter(match => {
        const alreadyIn = match.players.some(player => player?._id === user._id);
        const eloOk = !match.desiredOpponentElo ||
            Math.abs(match.desiredOpponentElo - user.eloRating) <= ELO_RANGE;
        return !alreadyIn && eloOk;
    });
}
