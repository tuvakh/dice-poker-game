import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import { getAllMatches } from "../api/matches";

import Hero from "../components/Hero.jsx";
import GameCard from "../components/GameCard.jsx";
import Spinner from "../components/Spinner.jsx";

import lobbyHero from "../assets/lobby-hero.png"

// How far a user's Elo can be from the game's desired Elo and still be allowed to join
const ELO_RANGE = 200;

// The lobby page shows all the waiting games this user is allowed to join
export default function Lobby() {
    const { user } = useAuth();
    const [lobbyGames, setLobbyGames] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // This fetch 100 games at once so it have enough to filter down from
    useEffect(() => {
        getAllMatches({ status: "waiting", limit: 100 })
            .then(data => setLobbyGames(data.matchList))
            .catch(() => setError("Failed to load games. Please try again."))
            .finally(() => setLoading(false));
    }, []);

    // Decide which games to show based on who is viewing
    // Not logged in: only show games that allow anonymous players
    // Logged in: hide games the user already joined, and hide games where their Elo is out of range
    const filteredGames = user === null
        ? lobbyGames.filter(match => match.allowAnonymous === true)
        : lobbyGames.filter(match => {
            const alreadyIn = match.players.some(player => player._id === user._id);
            // If the game has no Elo requirement, anyone can join, so eloOk defaults to true
            const eloOk = !match.desiredOpponentElo ||
                Math.abs(match.desiredOpponentElo - user.eloRating) <= ELO_RANGE;
            return !alreadyIn && eloOk;
        });

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