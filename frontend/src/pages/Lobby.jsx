import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router";
import { useAuth } from "../contexts/AuthContext.jsx";
import { createMatch, getAllMatches } from "../api/matches";
import { getAllGameCategories } from "../api/gameCategories";

import Hero from "../components/Hero.jsx";
import GameCard from "../components/GameCard.jsx";
import Spinner from "../components/Spinner.jsx";
import Button from "../components/Button.jsx";

import lobbyHero from "../assets/lobby-hero.png"

import { filterLobbyMatches } from "../hooks/useLobbyGames.js";
import { usePolling } from "../hooks/usePolling.js";

// The lobby page shows all the waiting games this user is allowed to join
export default function Lobby() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [lobbyGames, setLobbyGames] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [fetchError, setFetchError] = useState(null);

    const [categories, setCategories] = useState([]);

    const [selectedRounds, setSelectedRounds] = useState("");
    const [selectedStraights, setSelectedStraights] = useState("");
    const [selectedSeconds, setSelectedSeconds] = useState("");

    const [joining, setJoining] = useState(false);

    const [visibleCount, setVisibleCount] = useState(6);

    // This fetch 100 games at once so it has enough to filter down from
    function fetchGames() {
        getAllMatches({ status: "waiting", limit: 100 })
            .then(data => setLobbyGames(data.matchList))
            .catch(() => setFetchError("Failed to load games. Please try again."))
            .finally(() => setLoading(false));
    }

    usePolling(fetchGames, 3000);

    // Load game categories for filter dropdown
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
        // Resolve category object (match.gameCategory may be populated object or id)
        const matchCategory = typeof match.gameCategory === 'object' ? match.gameCategory : null;

        // rounds filter
        if (selectedRounds) {
            if (!matchCategory || Number(matchCategory.numberOfRounds) !== Number(selectedRounds)) return false;
        }

        // straights filter
        if (selectedStraights) {
            const hasStraights = matchCategory?.gameRules === "straights_allowed";
            if (selectedStraights === "allowed" && !hasStraights) return false;
            if (selectedStraights === "no" && hasStraights) return false;
        }

        // seconds filter
        if (selectedSeconds) {
            if (!matchCategory || Number(matchCategory.timeController) !== Number(selectedSeconds)) return false;
        }

        return true;
    });

    const visibleGames = filteredGames.slice(0, visibleCount);

    useEffect(() => {
        setVisibleCount(6);
    }, [selectedRounds, selectedStraights, selectedSeconds]);


    function getSelectedCategory() {
        return categories.find(category => {
            if (selectedRounds && category.numberOfRounds !== Number(selectedRounds)) return false;
            if (selectedStraights === "allowed" && category.gameRules !== "straights_allowed") return false;
            if (selectedStraights === "no" && category.gameRules === "straights_allowed") return false;
            if (selectedSeconds && category.timeController !== Number(selectedSeconds)) return false;
            return true;
        });
    }

    // Finds an waiting game matching the filters, or creates a new one, then navigates there
    async function handleFindGame() {
        setError(null);
        setJoining(true);
        try {
            const category = getSelectedCategory();
            if (!category) {
                setError("No game variant matches your settings. Try a different combination.");
                return;
            }

            // Look for a waiting game the user hasn't joined yet
            const data = await getAllMatches({ status: "waiting", gameCategoryId: category._id, limit: 10 });
            const waitingGame = data.matchList.find(waitingMatch =>
                !waitingMatch.players.some(player => player?._id === user._id)
            );

            if (waitingGame) {
                navigate(`/game/${waitingGame.matchId}`);
                return;
            }

            // No waiting game found — create a new one and wait there
            const newMatch = await createMatch({
                gameCategoryId: category._id,
                players: [user._id],
            });
            navigate(`/game/${newMatch.matchId}`);
        } catch (err) {
            setError(err.message ?? "Something went wrong. Please try again.");
        } finally {
            setJoining(false);
        }
    }

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
                        <p>Pick your settings and we&apos;ll find a suitable game you can join — or create a new one if none exist.</p>
                    </div>

                    {categories.length === 0 ? <Spinner /> : (
                        <>
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

                            {error && <p className="status status--error">{error}</p>}

                            {user && (
                                <Button onClick={handleFindGame} disabled={joining}>
                                    {joining ? "Finding game…" : "Find a Game"}
                                </Button>
                            )}
                        </>
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
