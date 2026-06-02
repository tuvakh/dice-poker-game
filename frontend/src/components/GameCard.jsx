import { useNavigate } from "react-router-dom";
import PlayerInfo from "./PlayerInfo";
import GameVariantBadge from "./GameVariantBadge";

// Displays a single match card used in the lobby, top games list, and user profile.
// variant controls the visual style and link label; index is shown as a rank in the top games list.
export default function GameCard({ match, index, variant, spectate }) {
    const navigate = useNavigate();

    if (!match) return null;

    const allPlayers = [...match.players];
    const requiredPlayers = match.maxPlayers ?? 2;
    const currentPlayers = allPlayers.length;

    const isTopGames = variant === "topGames";
    const isRecentGames = variant === "recentGames";
    const isWaitingGame = match.status === "waiting";

    return (
        <div className={`game-card${isTopGames ? " game-card--top-games" : ""} game-card${isRecentGames ? " game-card--recent-games" : ""}`} onClick={() => navigate(`/game/${match.matchId}`)}>
            {isTopGames && <span className="game-card__rank">#{index + 1}</span>}
            <GameVariantBadge category={match.gameCategory} />
            <h3 className="game-card__title">
                {allPlayers.map((player, i) => (
                    <span className="game-card__usernames" key={player._id}>
                        {i > 0 && <span className="game-card__vs">vs</span>}
                        <PlayerInfo user={player} inline={isTopGames || isRecentGames || allPlayers.length === 1} />
                    </span>
                ))}
            </h3>
            {/* Waiting games show the player count instead of a CTA link so users know how many spots remain */}
            {isWaitingGame && !isTopGames && !isRecentGames ? (
                <p className="game-card__waiting">
                    <span className="game-card__waiting-count">{currentPlayers}/{requiredPlayers} players</span>
                </p>
            ) : (
                <p className="game-card__fake-link">{isTopGames ? "Watch game" : isRecentGames ? "View game" : spectate ? "Spectate" : "Join game"}</p>
            )}
        </div>
    )
}