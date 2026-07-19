import { useNavigate } from "react-router-dom";
import PlayerInfo from "./PlayerInfo";
import GameVariantBadge from "./GameVariantBadge";

export default function GameCard({ match, index, variant, spectate }) {
    const navigate = useNavigate();

    if (!match) return null;

    const requiredPlayers = match.maxPlayers ?? 2;
    const currentPlayers = match.players.length;

    const isTopGames = variant === "topGames";
    const isRecentGames = variant === "recentGames";
    const isWaitingGame = match.status === "waiting";

    return (
        <div
            className={`game-card${isTopGames ? " game-card--top-games" : ""}${isRecentGames ? " game-card--recent-games" : ""}`}
            onClick={() => navigate(`/game/${match.matchId}`)}
        >
            {isTopGames && <span className="game-card__rank">#{index + 1}</span>}

            <GameVariantBadge category={match.gameCategory} />

            <h3 className="game-card__title">
                {match.players.map((player, i) => (
                    <span className="game-card__usernames" key={player._id}>
                        {i > 0 && <span className="game-card__vs">vs</span>}
                        <PlayerInfo user={player} showImage inline={isTopGames || isRecentGames || match.players.length === 1} />
                    </span>
                ))}
            </h3>

            {isWaitingGame && !isTopGames && !isRecentGames ? (
                <p className="game-card__waiting">
                    <span className="game-card__waiting-count">{currentPlayers}/{requiredPlayers} players</span>
                </p>
            ) : (
                <p className="game-card__fake-link">
                    {isTopGames ? "Watch game" : isRecentGames ? "View game" : spectate ? "Spectate" : "Join game"}
                </p>
            )}
        </div>
    );
}
