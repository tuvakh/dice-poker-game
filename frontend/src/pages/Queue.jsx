import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import { getAllGameCategories } from "../api/gameCategories.js";
import { getAllMatches, createMatch } from "../api/matches.js";
import { usePolling } from "../hooks/usePolling.js";
import GameCard from "../components/GameCard.jsx";
import Spinner from "../components/Spinner.jsx";
import Button from "../components/Button.jsx";

// The queue page lets users find a room automatically or browse and pick one manually
export default function Queue() {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [categories, setCategories] = useState([]);
    const [selectedRounds, setSelectedRounds] = useState(null);
    const [selectedRules, setSelectedRules] = useState(null);
    const [selectedTime, setSelectedTime] = useState(null);
    const [rooms, setRooms] = useState([]);
    const [roomsLoading, setRoomsLoading] = useState(true);
    const [joining, setJoining] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        getAllGameCategories().then(data => {
            setCategories(data);
            if (data.length > 0) {
                setSelectedRounds(data[0].numberOfRounds);
                setSelectedRules(data[0].gameRules);
                setSelectedTime(data[0].timeController);
            }
        });
    }, []);

    function fetchRooms() {
        getAllMatches({ status: "waiting", limit: 50 })
            .then(data => setRooms(data.matchList))
            .catch(() => {})
            .finally(() => setRoomsLoading(false));
    }

    usePolling(fetchRooms, 8000);

    // Unique filter options derived from loaded categories
    const roundsOptions = Array.from(new Set(categories.map(c => c.numberOfRounds))).sort((a, b) => a - b);
    const rulesOptions = Array.from(new Set(categories.map(c => c.gameRules)));
    const timeOptions = Array.from(new Set(categories.map(c => c.timeController))).sort((a, b) => a - b);

    // Find the category that matches the current filter selection
    function getSelectedCategory() {
        return categories.find(c =>
            c.numberOfRounds === selectedRounds &&
            c.gameRules === selectedRules &&
            c.timeController === selectedTime
        );
    }

    // Filter rooms client-side to match the selected settings
    const categoryById = categories.reduce((acc, c) => { acc[c._id || c.id] = c; return acc; }, {});
    const filteredRooms = rooms.filter(match => {
        const cat = match.gameCategory && (
            typeof match.gameCategory === "object" ? match.gameCategory : categoryById[match.gameCategory]
        );
        if (!cat) return false;
        if (selectedRounds !== null && cat.numberOfRounds !== selectedRounds) return false;
        if (selectedRules !== null && cat.gameRules !== selectedRules) return false;
        if (selectedTime !== null && cat.timeController !== selectedTime) return false;
        return true;
    });

    // Finds an open room matching the filters, or creates a new one, then navigates there
    async function handleFindRoom() {
        setError(null);
        setJoining(true);
        try {
            const category = getSelectedCategory();
            if (!category) {
                setError("No game variant matches your settings. Try a different combination.");
                return;
            }

            // Look for a waiting room the user hasn't joined yet
            const data = await getAllMatches({ status: "waiting", gameCategoryId: category._id, limit: 10 });
            const openRoom = data.matchList.find(m =>
                !m.players.some(p => p._id === user._id)
            );

            if (openRoom) {
                navigate(`/game/${openRoom.matchId}`);
                return;
            }

            // No open room found — create a new one and wait there
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

    if (!user) {
        return (
            <section className="queue-page">
                <h1>Find a Match</h1>
                <p>You need to be logged in to join or create a room.</p>
                <div className="greeting">
                    <Link className="greeting__button" to="/login">Login</Link>
                    <Link className="greeting__button" to="/register">Register</Link>
                </div>
            </section>
        );
    }

    return (
        <section className="queue-page">
            <Link to="/" className="back-link queue-page__back">← Back</Link>

            <div className="queue-page__find">
                <div className="queue-page__find-text">
                    <h1>Find a Match</h1>
                    <p>Pick your settings and we&apos;ll drop you into an open room — or create a new one if none exist.</p>
                </div>

                {categories.length === 0 ? <Spinner /> : (
                    <>
                        <div className="queue-page__filters">
                            <div className="queue-page__filter-group">
                                <span className="queue-page__filter-label">Rounds</span>
                                <div className="queue-page__chips">
                                    {roundsOptions.map(r => (
                                        <Button
                                            key={r}
                                            type="button"
                                            className={`btn--chip${selectedRounds === r ? " btn--chip--active" : ""}`}
                                            onClick={() => setSelectedRounds(r)}
                                        >
                                            {r}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            <div className="queue-page__filter-group">
                                <span className="queue-page__filter-label">Straights</span>
                                <div className="queue-page__chips">
                                    {rulesOptions.map(r => (
                                        <Button
                                            key={r}
                                            type="button"
                                            className={`btn--chip${selectedRules === r ? " btn--chip--active" : ""}`}
                                            onClick={() => setSelectedRules(r)}
                                        >
                                            {r === "straights_allowed" ? "Allowed" : "No straights"}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            <div className="queue-page__filter-group">
                                <span className="queue-page__filter-label">Time</span>
                                <div className="queue-page__chips">
                                    {timeOptions.map(t => (
                                        <Button
                                            key={t}
                                            type="button"
                                            className={`btn--chip${selectedTime === t ? " btn--chip--active" : ""}`}
                                            onClick={() => setSelectedTime(t)}
                                        >
                                            {t}s
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {error && <p className="status status--error">{error}</p>}

                        <Button onClick={handleFindRoom} disabled={joining}>
                            {joining ? "Finding room…" : "Find a Room"}
                        </Button>
                    </>
                )}
            </div>

            <div className="queue-page__rooms">
                <div className="queue-page__rooms-header">
                    <h2>Open Rooms</h2>
                    <Link to="/createGame" className="queue-page__create-link">+ Create a Room</Link>
                </div>

                {roomsLoading ? (
                    <Spinner />
                ) : filteredRooms.length === 0 ? (
                    <p className="queue-page__empty">No open rooms match your settings right now.</p>
                ) : (
                    <div className="cards-grid">
                        {filteredRooms.map(match => (
                            <GameCard key={match.matchId} match={match} />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
