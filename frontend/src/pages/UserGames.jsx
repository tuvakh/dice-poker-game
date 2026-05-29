import { useParams, Link } from "react-router-dom";
import { useState } from "react";
import { getAllMatches } from "../api/matches.js";
import { useFetch } from "../hooks/useFetch.js";

import GameCard from "../components/GameCard.jsx";
import Spinner from "../components/Spinner.jsx";

// Shows all games ever played by a specific user 
export default function UserGames() {
    // the id comes from the URL 
    const { id } = useParams();
    // Paginate results: 10 games per page
    const [page, setPage] = useState(1);
    const limit = 10;
    const { data, loading, error } = useFetch(() => getAllMatches({ userId: id, limit, page }), [id, page]);

    if (loading) return <Spinner />;
    if (error) return <p className="status status--error">{error}</p>;

    return (
        <>
        <section className="myGames">
            {/* Back link to user profile */}
            <Link to={`/user/${id}`} className="back-link back-link--allGames">← Back</Link>

            <h1>All games</h1>
            <p>View all games played by this user</p>

            <div className="allGames">
                {data.matchList.map((match, i) => (
                    <GameCard key={match.matchId} match={match} index={i} variant="recentGames" />
                ))}
            </div>

            {/* Pagination controls */}
            {data.totalPages > 1 && (
                <div className="pagination">
                    <button className="btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Prev</button>
                    <span className="pagination__info">Page {page} of {data.totalPages}</span>
                    <button className="btn" onClick={() => setPage(p => Math.min(data.totalPages, p + 1))} disabled={page === data.totalPages}>Next</button>
                </div>
            )}
        </section>
        </>
    );
}
