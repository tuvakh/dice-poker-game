import { useNavigate, Link } from "react-router-dom";
import PlayerInfo from "./PlayerInfo";
import GameVariantBadge from "./GameVariantBadge";
import Button from "./Button";

// Displays a single match card used in the lobby, top games list, and user profile
// variant controls the visual style and link label
// index shows on top games to show the range 1-5
export default function GameCard({ match, index, variant, spectate }) {
    const navigate = useNavigate();

    if (!match) return null;

    const allPlayers = [
        ...match.players
    ];

    const isTopGames = variant === "topGames";
    const isRecentGames = variant === "recentGames";

    return (
        // The whole card is clickable and navigates to the game detail page
        <div className={`game-card${isTopGames ? " game-card--top-games" : ""} game-card${isRecentGames ? " game-card--recent-games" : ""}`} onClick={() => navigate(`/game/${match.matchId}`)}>
            {/* Rank badge only shown in the top games list */}
            {isTopGames && <span className="game-card__rank">#{index + 1}</span>}
            <GameVariantBadge category={match.gameCategory} />
            <h3 className="game-card__title">
                {/* Render each player separated by a "vs" label */}
                {allPlayers.map((player, i) => (
                    <span className="game-card__usernames" key={player._id}>
                        {i > 0 && <span className="game-card__vs">vs</span>}
                        {/* inline collapses avatar and name onto one line in compact contexts */}
                        <PlayerInfo user={player} inline={isTopGames || isRecentGames || allPlayers.length === 1} />
                    </span>
                ))}
            </h3>
            {/* The call-to-action label changes depending on the context */}
            <p className="game-card__fake-link">{isTopGames ? "Watch game" : isRecentGames ? "View game" : spectate ? "Spectate" : "Join game"}</p>
        </div>
    )
}