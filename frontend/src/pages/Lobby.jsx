import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import { getAllMatches } from "../api/matches";

import Hero from "../components/Hero.jsx";
import GameCard from "../components/GameCard.jsx";
import Spinner from "../components/Spinner.jsx";

import lobbyHero from "../assets/lobby-hero.png"

import { filterLobbyMatches } from "../hooks/useLobbyGames.js";
import { usePolling } from "../hooks/usePolling.js";

// The lobby page shows all the waiting games this user is allowed to join
export default function Lobby() {
    const { user } = useAuth();
    const [lobbyGames, setLobbyGames] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // This fetch 100 games at once so it have enough to filter down from
    function fetchGames() {
        getAllMatches({ status: "waiting", limit: 100 })
            .then(data => setLobbyGames(data.matchList))
            .catch(() => setError("Failed to load games. Please try again."))
            .finally(() => setLoading(false));
    }

    usePolling(fetchGames, 10000);

    // Decide which games to show based on who is viewing
    const filteredGames = filterLobbyMatches(lobbyGames, user);

    if (loading) return <Spinner />;
    if (error) return <p className="status status--error">{error}</p>;

    return (
        <>
            <Hero title="Lobby" heroImg={lobbyHero}>
                <p>Someone out there is waiting for you</p>
                <p>Browse available games and jump in!</p>
            </Hero>
            <section>
                <h2>Available games</h2>
                <p>Click a game to join and get started.</p>
                <div className="cards-grid">
                    {filteredGames.length === 0
                        ? <p>No games available right now. Why not create one?</p>
                        : filteredGames.map((match, i) => <GameCard key={match.matchId} match={match} />)
                    }
                </div>
            </section>
        </>
    )
}