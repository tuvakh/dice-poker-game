import { useState, useEffect } from "react";
import { Link } from "react-router";
import { useAuth } from "../contexts/AuthContext.jsx";
import { getAllMatches } from "../api/matches";
import { getAllGameCategories } from "../api/gameCategories";

import Hero from "../components/Hero.jsx";
import GameCard from "../components/GameCard.jsx";
import Spinner from "../components/Spinner.jsx";
import Button from "../components/Button.jsx";

import lobbyHero from "../assets/lobby-hero.webp"

import { filterLobbyMatches } from "../hooks/useLobbyGames.js";
import { usePolling } from "../hooks/usePolling.js";

// The lobby page shows all the waiting games this user is allowed to join
export default function Lobby() {
    const { user } = useAuth();
    const [lobbyGames, setLobbyGames] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(null);

    const [categories, setCategories] = useState([]);

    const [selectedRounds, setSelectedRounds] = useState("");
    const [selectedStraights, setSelectedStraights] = useState("");
    const [selectedSeconds, setSelectedSeconds] = useState("");

    const [visibleCount, setVisibleCount] = useState(6);

    // Fetches waiting games — signal from usePolling cancels the request on cleanup
    function fetchGames(signal) {
        getAllMatches({ status: "waiting", limit: 30 }, signal)
            .then(data => setLobbyGames(data.matchList))
            .catch(err => {
                if (err?.name === "AbortError") return;
                setFetchError("Failed to load games. Please try again.");
            })
            .finally(() => setLoading(false));
    }

    usePolling(fetchGames, 8000);

    // Load game categories for filter chips
    useEffect(() => {
        let mounted = true;
        getAllGameCategories()
            .then(result => {
                const list = Array.isArray(result) ? result : (result.gameCategories || result.categoryList || []);
                if (mounted) setCategories(list);
            })
            .catch(() => { })
        return () => { mounted = false };
    }, []);

    // Logged in: hide games the user already joined, and hide games where their Elo is out of range
    const baseFiltered = filterLobbyMatches(lobbyGames, user);

    const roundsOptions = Array.from(new Set(categories.map(category => category.numberOfRounds))).sort((roundA, roundB) => roundA - roundB);
    const secondsOptions = Array.from(new Set(categories.map(category => category.timeController))).sort((secondsA, secondsB) => secondsA - secondsB);

    // Apply UI filters on top of baseFiltered
    const filteredGames = baseFiltered.filter(match => {
        const matchCategory = typeof match.gameCategory === 'object' ? match.gameCategory : null;

        if (selectedRounds && (!matchCategory || Number(matchCategory.numberOfRounds) !== Number(selectedRounds))) return false;

        if (selectedStraights) {
            const hasStraights = matchCategory?.gameRules === "straights_allowed";
            if (selectedStraights === "allowed" && !hasStraights) return false;
            if (selectedStraights === "no" && hasStraights) return false;
        }

        if (selectedSeconds && (!matchCategory || Number(matchCategory.timeController) !== Number(selectedSeconds))) return false;

        return true;
    });

    const visibleGames = filteredGames.slice(0, visibleCount);

    useEffect(() => {
        setVisibleCount(6);
    }, [selectedRounds, selectedStraights, selectedSeconds]);

    if (loading) return <Spinner />;
    if (fetchError) return <p className="status status--error">{fetchError}</p>;

    return (
        <>
            <Hero title="Lobby" heroImg={lobbyHero}>
                <p>Someone out there is waiting for you</p>
                <p>Browse available games and jump in!</p>
            </Hero>
            <section>
                <div className="lobby__find">
                    <div className="lobby__find-text">
                        <h1>Find a Match</h1>
                        <p>Pick your settings to filter available games — or create a new one.</p>
                    </div>

                    {categories.length === 0 ? <Spinner /> : (
                        <div className="lobby__filters">
                            <div className="lobby__filter-group">
                                <span className="lobby__filter-label">Rounds</span>
                                <div className="lobby__chips">
                                    {roundsOptions.map(round => (
                                        <Button
                                            key={round}
                                            type="button"
                                            className={`btn--chip${String(selectedRounds) === String(round) ? " btn--chip--active" : ""}`}
                                            onClick={() => setSelectedRounds(String(selectedRounds) === String(round) ? "" : String(round))}
                                        >
                                            {round}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            <div className="lobby__filter-group">
                                <span className="lobby__filter-label">Straights</span>
                                <div className="lobby__chips">
                                    <Button type="button" className={`btn--chip${selectedStraights === 'allowed' ? ' btn--chip--active' : ''}`} onClick={() => setSelectedStraights(selectedStraights === 'allowed' ? '' : 'allowed')}>Allowed</Button>
                                    <Button type="button" className={`btn--chip${selectedStraights === 'no' ? ' btn--chip--active' : ''}`} onClick={() => setSelectedStraights(selectedStraights === 'no' ? '' : 'no')}>No straights</Button>
                                </div>
                            </div>

                            <div className="lobby__filter-group">
                                <span className="lobby__filter-label">Seconds</span>
                                <div className="lobby__chips">
                                    {secondsOptions.map(seconds => (
                                        <Button
                                            key={seconds}
                                            type="button"
                                            className={`btn--chip${String(selectedSeconds) === String(seconds) ? " btn--chip--active" : ""}`}
                                            onClick={() => setSelectedSeconds(String(selectedSeconds) === String(seconds) ? "" : String(seconds))}
                                        >
                                            {seconds}s
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="lobby__rooms-header">
                    <h2>Available games</h2>
                    <Link to="/createGame" className="lobby__create-link">+ Create a game</Link>
                </div>
                <p>Click a game to join and get started.</p>
                <div className="cards-grid">
                    {visibleGames.length === 0
                        ? <p>No games available right now. Why not create one?</p>
                        : visibleGames.map(match => <GameCard key={match.matchId} match={match} />)
                    }
                </div>
                {visibleCount < filteredGames.length && (
                    <Button type="button" className="lobby__load-more" onClick={() => setVisibleCount(prev => prev + 6)}>
                        Load more
                    </Button>
                )}
            </section>
        </>
    )
}
