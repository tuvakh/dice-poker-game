import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import { getAllMatches } from "../api/matches";
import { getAllGameCategories } from "../api/gameCategories";

import Hero from "../components/Hero.jsx";
import GameCard from "../components/GameCard.jsx";
import Spinner from "../components/Spinner.jsx";
import Button from "../components/Button.jsx";

import lobbyHero from "../assets/lobby-hero.png"

// How far a user's Elo can be from the game's desired Elo and still be allowed to join
const ELO_RANGE = 200;

// The lobby page shows all the waiting games this user is allowed to join
export default function Lobby() {
    const { user } = useAuth();
    const [lobbyGames, setLobbyGames] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [categories, setCategories] = useState([]);

    const [selectedRounds, setSelectedRounds] = useState("");
    const [selectedStraights, setSelectedStraights] = useState("");
    const [selectedSeconds, setSelectedSeconds] = useState("");

    // Category formatting removed (category dropdown no longer used)

    // This fetch 100 games at once so it have enough to filter down from
    useEffect(() => {
        getAllMatches({ status: "waiting", limit: 100 })
            .then(data => setLobbyGames(data.matchList))
            .catch(() => setError("Failed to load games. Please try again."))
            .finally(() => setLoading(false));
    }, []);

    // Load game categories for filter dropdown
    useEffect(() => {
        let mounted = true;
        getAllGameCategories()
            .then(result => {
                const list = Array.isArray(result) ? result : (result.gameCategories || result.categoryList || []);
                if (mounted) setCategories(list);
            })
            .catch(() => {})
        return () => { mounted = false };
    }, []);

    // Decide which games to show based on who is viewing
    // Logged in: hide games the user already joined, and hide games where their Elo is out of range
    // Not logged in: show all waiting games (anonymous play is being phased out)
    const baseFiltered = lobbyGames.filter(match => {
        if (!user) return true;
        const alreadyIn = match.players.some(player => player._id === user._id);
        // If the game has no Elo requirement, anyone can join, so eloOk defaults to true
        const eloOk = !match.desiredOpponentElo || Math.abs(match.desiredOpponentElo - user.eloRating) <= ELO_RANGE;
        return !alreadyIn && eloOk;
    });

    // Derive helper maps for category lookup and available filter options
    const categoryById = categories.reduce((acc, c) => {
        acc[c._id || c.id] = c;
        return acc;
    }, {});

    const roundsOptions = Array.from(new Set(categories.map(c => c.numberOfRounds))).sort((a, b) => a - b);
    const secondsOptions = Array.from(new Set(categories.map(c => c.timeController))).sort((a, b) => a - b);

    // Apply UI filters on top of baseFiltered
    const filteredGames = baseFiltered.filter(match => {
        // Resolve category object (match.gameCategory may be populated object or id)
        const matchCat = match.gameCategory && (typeof match.gameCategory === 'object' ? match.gameCategory : categoryById[match.gameCategory]);


        // rounds filter
        if (selectedRounds) {
            if (!matchCat || Number(matchCat.numberOfRounds) !== Number(selectedRounds)) return false;
        }

        // straights filter
        if (selectedStraights) {
            const hasStraights = matchCat?.gameRules === "straights_allowed";
            if (selectedStraights === "allowed" && !hasStraights) return false;
            if (selectedStraights === "no" && hasStraights) return false;
        }

        // seconds filter
        if (selectedSeconds) {
            if (!matchCat || Number(matchCat.timeController) !== Number(selectedSeconds)) return false;
        }

        return true;
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
            <div className="lobby__filter-bar">
                <div className="lobby__filter-item">
                    <label>Rounds:</label>
                    <div className="lobby__buttons">
                        {roundsOptions.map(r => (
                            <Button
                                key={r}
                                type="button"
                                className={`btn--chip${String(selectedRounds) === String(r) ? ' btn--chip--active' : ''}`}
                                onClick={() => setSelectedRounds(String(selectedRounds) === String(r) ? "" : String(r))}
                            >
                                {r}
                            </Button>
                        ))}
                    </div>
                </div>

                <div className="lobby__filter-item">
                    <label>Straights:</label>
                    <div className="lobby__buttons">
                        <Button type="button" className={`btn--chip${selectedStraights === 'allowed' ? ' btn--chip--active' : ''}`} onClick={() => setSelectedStraights(selectedStraights === 'allowed' ? '' : 'allowed')}>Allowed</Button>
                        <Button type="button" className={`btn--chip${selectedStraights === 'no' ? ' btn--chip--active' : ''}`} onClick={() => setSelectedStraights(selectedStraights === 'no' ? '' : 'no')}>No</Button>
                    </div>
                </div>

                <div className="lobby__filter-item">
                    <label>Seconds:</label>
                    <div className="lobby__buttons">
                        {secondsOptions.map(s => (
                            <Button
                                key={s}
                                type="button"
                                className={`btn--chip${String(selectedSeconds) === String(s) ? ' btn--chip--active' : ''}`}
                                onClick={() => setSelectedSeconds(String(selectedSeconds) === String(s) ? "" : String(s))}
                            >
                                {s}s
                            </Button>
                        ))}
                    </div>
                </div>
            </div>
            <p>Click a game to join and get started.</p>
            <div className="cards-grid">
                {filteredGames.length === 0
                    ? <p>No games available right now. Why not create one?</p>
                    : filteredGames.map(match => <GameCard key={match.matchId} match={match} />)
                }
            </div>
        </section>
      </>
    )
}