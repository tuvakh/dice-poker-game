import { Link } from "react-router";

export default function TournamentCard({ tournament, onClick }) {
    return (
        <Link to={`/tournament/${tournament.tournamentId}`} className="tournament-card" onClick={onClick}>

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

                {tournament.gameCategory && (
                    <span>🎲 {tournament.gameCategory.gameRules === "straights_allowed" ? "Straights" : "No straights"} · {tournament.gameCategory.timeController}s</span>
                )}

                {tournament.createdBy?.username && (
                    <span>🏅 by {tournament.createdBy.username}</span>
                )}

                {tournament.trophy && (
                    <span>
                        {tournament.trophy.image && (
                            <img src={tournament.trophy.image} alt={tournament.trophy.title ?? "Trophy"} style={{ width: 20, height: 20, objectFit: "contain", verticalAlign: "middle", marginRight: 4 }} />
                        )}
                        {tournament.trophy.title}
                    </span>
                )}
            </div>
        </Link>
    );
}
