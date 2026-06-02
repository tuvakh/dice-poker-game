import { Link } from "react-router";

// Clickable card that links to a tournament's detail page
// gameCategory and trophy arrive as populated objects because Mongoose populates them from their collections
export default function TournamentCard({ tournament, onClick }) {
    return (
        // Link acts like an <a> tag but handles client-side navigation without a full page reload
        <Link to={`/tournament/${tournament.tournamentId}`} className="tournament-card" onClick={onClick}>

            {/* Status badge — CSS class changes color based on the value (upcoming / ongoing / finished) */}
            <span className={`tournament-card__status tournament-card__status--${tournament.status}`}>
                {tournament.status}
            </span>

            <p className="tournament-card__name">{tournament.title}</p>

            <div className="tournament-card__meta">
                {/* Only render date if one exists on the tournament */}
                {tournament.date && (
                    <span>
                        📅{" "}
                        {new Date(tournament.date).toLocaleDateString("en-GB", {
                            day: "numeric", month: "short", year: "numeric",
                        })}
                    </span>
                )}

                {/* ?? 0 means "use 0 if participants is null or undefined" */}
                <span>
                    👥 {tournament.participants?.length ?? 0} participant{(tournament.participants?.length ?? 0) !== 1 ? "s" : ""}
                </span>

                {/* != null catches both null and undefined */}
                {tournament.numberOfRounds != null && (
                    <span>🔁 {tournament.numberOfRounds} round{tournament.numberOfRounds !== 1 ? "s" : ""}</span>
                )}

                {/* gameCategory is a populated object. Check it exists before reading its fields */}
                {tournament.gameCategory && (
                    <span>🎲 {tournament.gameCategory.gameRules === "straights_allowed" ? "Straights" : "No straights"} · {tournament.gameCategory.timeController}s</span>
                )}

                {tournament.createdBy?.username && (
                    <span>🏅 by {tournament.createdBy.username}</span>
                )}

                {/* trophy is a populated object. Show image and title if available */}
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
