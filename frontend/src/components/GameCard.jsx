import { useNavigate } from "react-router-dom";
import PlayerInfo from "./PlayerInfo";
import GameVariantBadge from "./GameVariantBadge";

// Displays a single game card used in the lobby, top games list, and user profile
// variant ("topGames" / "recentGames" / undefined) controls the style and CTA label; spectate swaps "Join" for "Spectate"
export default function GameCard({ match, index, variant, spectate }) {
    // useNavigate lets us redirect the user to a page programmatically (on click)
    const navigate = useNavigate();

    // If no match data was passed in, render nothing
    if (!match) return null;

    // Fall back to 2 if maxPlayers is missing from the match object
    const requiredPlayers = match.maxPlayers ?? 2;
    const currentPlayers = match.players.length;

    // Boolean flags derived from props and match data, used to conditionally render parts of the card
    const isTopGames = variant === "topGames";
    const isRecentGames = variant === "recentGames";
    const isWaitingGame = match.status === "waiting";

    return (
        // Clicking anywhere on the card navigates to the game page
        <div
            className={`game-card${isTopGames ? " game-card--top-games" : ""}${isRecentGames ? " game-card--recent-games" : ""}`}
            onClick={() => navigate(`/game/${match.matchId}`)}
        >
            {/* Rank badge only shown in the top games list; index is 0-based so we add 1 */}
            {isTopGames && <span className="game-card__rank">#{index + 1}</span>}

            <GameVariantBadge category={match.gameCategory} />

            <h3 className="game-card__title">
                {/* Loop through players and put a "vs" label between each one */}
                {match.players.map((player, i) => (
                    <span className="game-card__usernames" key={player._id}>
                        {i > 0 && <span className="game-card__vs">vs</span>}
                        {/* inline=true lays the player name and Elo side by side instead of stacked */}
                        <PlayerInfo user={player} showImage inline={isTopGames || isRecentGames || match.players.length === 1} />
                    </span>
                ))}
            </h3>

            {/* Waiting games show the player count so users can see how many spots are left */}
            {/* All other variants show a text link whose label depends on context */}
            {isWaitingGame && !isTopGames && !isRecentGames ? (
                <p className="game-card__waiting">
                    <span className="game-card__waiting-count">{currentPlayers}/{requiredPlayers} players</span>
                </p>
            ) : (
                // Nested ternary picks the right label based on which variant this card is in
                <p className="game-card__fake-link">
                    {isTopGames ? "Watch game" : isRecentGames ? "View game" : spectate ? "Spectate" : "Join game"}
                </p>
            )}
        </div>
    );
}
