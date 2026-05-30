import { Link } from "react-router-dom";

// Displays a single tournament as a clickable card
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
            </div>
        </Link>
    );
}
