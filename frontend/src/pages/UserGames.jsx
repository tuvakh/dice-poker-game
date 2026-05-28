import { useParams, Link } from "react-router-dom";
import { getAllMatches } from "../api/matches.js";
import { useFetch } from "../hooks/useFetch.js";

import GameCard from "../components/GameCard.jsx";
import Spinner from "../components/Spinner.jsx";

// Shows all games ever played by a specific user 
export default function UserGames() {
    // the id comes from the URL 
    const { id } = useParams();
    const { data, loading, error } = useFetch(() => getAllMatches({ userId: id }), [id]);

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
        </section>
        </>
    );
}
