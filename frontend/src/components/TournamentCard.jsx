//Chanya
import { Link } from "react-router";

// Displays a single tournament as a clickable card
// trophy and gameCategory are populated from the backend so they arrive as objects
export default function TournamentCard({ tournament, onClick }) {
    return (
        <Link
            to={`/tournament/${tournament.tournamentId}`}
            className="tournament-card"
            onClick={onClick}
        >
            <span className={`tournament-card__status tournament-card__status--${tournament.status}`}>
                {tournament.status}
            </span>
            <p className="tournament-card__name">{tournament.title}</p>
            <div className="tournament-card__meta">
                {tournament.date && (
                    <span>
                        📅{" "}
                        {new Date(tournament.date).toLocaleDateString("en-GB", {
                            day: "numeric", month: "short", year: "numeric",
                        })}
                    </span>
                )}
                <span>
                    👥 {tournament.participants?.length ?? 0} participant{(tournament.participants?.length ?? 0) !== 1 ? "s" : ""}
                </span>
                {tournament.numberOfRounds != null && (
                    <span>🔁 {tournament.numberOfRounds} round{tournament.numberOfRounds !== 1 ? "s" : ""}</span>
                )}
                {/* Game variant is populated by the backend — shows the rules and time control */}
                {tournament.gameCategory && (
                    <span>🎲 {tournament.gameCategory.gameRules === "straights_allowed" ? "Straights" : "No straights"} · {tournament.gameCategory.timeController}s</span>
                )}
                {/* Trophy: image from /public/<filename> next to the trophy title */}
                {tournament.trophy && (
                    <span>
                        {tournament.trophy.image && (
                            <img src={`/${tournament.trophy.image}`} alt={tournament.trophy.title ?? "Trophy"} style={{ width: 20, height: 20, objectFit: "contain", verticalAlign: "middle", marginRight: 4 }} />
                        )}
                        {tournament.trophy.title}
                    </span>
                )}
            </div>
        </Link>
    );
}
