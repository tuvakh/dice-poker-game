import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useSoundEffects } from "../hooks/useSoundEffects.js";
import { getAllGameCategories } from "../api/gameCategories.js";
import { joinQueue, leaveQueue, getAllMatches } from "../api/matches.js";
import RoundsSelector from "../components/RoundsSelector.jsx";
import GameRulesSelector from "../components/GameRulesSelector.jsx";
import TimeControlSelector from "../components/TimeControlSelector.jsx";
import Spinner from "../components/Spinner.jsx";
import Button from "../components/Button.jsx";

// Matchmaking states
const STATE = {
    IDLE: "idle",
    SEARCHING: "searching",
    MATCHED: "matched",
};

// The queue page lets logged-in users find a match automatically based on ELO
export default function Queue() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { playClick, playJoin } = useSoundEffects();

    const [categories, setCategories] = useState([]);
    const [formData, setFormData] = useState({
        numberOfRounds: 3,
        gameRules: "straights_allowed",
        timeController: null,
    });
    const [queueState, setQueueState] = useState(STATE.IDLE);
    const [joining, setJoining] = useState(false);
    const [waitSeconds, setWaitSeconds] = useState(0);
    const [error, setError] = useState(null);

    const pollRef = useRef(null);
    const timerRef = useRef(null);

    // Load categories on mount so we know which timeController values actually exist
    useEffect(() => {
        getAllGameCategories().then(data => {
            setCategories(data);
            if (data.length > 0) {
                const first = data[0];
                setFormData({
                    numberOfRounds: first.numberOfRounds,
                    gameRules: first.gameRules,
                    timeController: first.timeController,
                });
            }
        });
    }, []);

    function handleChange(field, value) {
        setFormData(prev => ({ ...prev, [field]: value }));
    }

    // Clean up polling and timer on unmount or when leaving queue
    function clearTimers() {
        if (pollRef.current) clearInterval(pollRef.current);
        if (timerRef.current) clearInterval(timerRef.current);
    }

    useEffect(() => {
        return clearTimers;
    }, []);

    async function handleFindMatch() {
        setError(null);
        setJoining(true);
        playClick();

        try {
            const category = categories.find(c =>
                c.numberOfRounds === formData.numberOfRounds &&
                c.gameRules === formData.gameRules &&
                c.timeController === formData.timeController
            );
            if (!category) {
                setError("Could not find a matching game variant. Please try different settings.");
                setJoining(false);
                return;
            }

            const result = await joinQueue(user._id, category._id);

            if (result.status === "matched") {
                playJoin();
                setQueueState(STATE.MATCHED);
                navigate(`/game/${result.match.matchId}`);
                return;
            }

            // Status "waiting" — snapshot existing match IDs so we only navigate to a NEW match
            const existingData = await getAllMatches({ userId: user._id, status: "waiting" });
            const existingIds = new Set(existingData.matchList.map(m => m.matchId));

            setQueueState(STATE.SEARCHING);
            setWaitSeconds(0);

            timerRef.current = setInterval(() => {
                setWaitSeconds(s => s + 1);
            }, 1000);

            pollRef.current = setInterval(async () => {
                try {
                    const data = await getAllMatches({ userId: user._id, status: "waiting" });
                    // Only navigate to a match that didn't exist before we joined the queue
                    const newMatch = data.matchList.find(m => !existingIds.has(m.matchId));
                    if (newMatch) {
                        clearTimers();
                        playJoin();
                        setQueueState(STATE.MATCHED);
                        navigate(`/game/${newMatch.matchId}`);
                    }
                } catch {
                    // keep polling on transient errors
                }
            }, 3000);

        } catch (err) {
            setError(err.message ?? "Could not join queue. Please try again.");
        } finally {
            setJoining(false);
        }
    }

    async function handleCancel() {
        clearTimers();
        setQueueState(STATE.IDLE);
        setWaitSeconds(0);
        setError(null);
        playClick();
        try {
            await leaveQueue(user._id);
        } catch {
            // ignore — queue entry may have already been matched and removed
        }
    }

    // Anonymous users can only spectate
    if (!user) {
        return (
            <section className="queue-page">
                <h1>Find a Match</h1>
                <p>You need to be logged in to use matchmaking.</p>
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

            <h1>Find a Match</h1>
            <p>Choose your game settings and we&apos;ll find you the best opponent.</p>

            {queueState === STATE.IDLE && (
                categories.length === 0
                    ? <Spinner />
                    : <form className="form" onSubmit={e => { e.preventDefault(); handleFindMatch(); }}>
                        <div className="form__inputs">
                            <RoundsSelector onChange={handleChange} />
                            <GameRulesSelector onChange={handleChange} />
                            <TimeControlSelector onChange={handleChange} />
                        </div>
                        {error && <p className="status status--error">{error}</p>}
                        <Button type="submit" disabled={joining}>
                            {joining ? "Finding…" : "Find Match"}
                        </Button>
                    </form>
            )}

            {queueState === STATE.SEARCHING && (
                <div className="queue-searching">
                    <Spinner />
                    <p className="queue-searching__label">Searching for an opponent… {waitSeconds}s</p>
                    <p className="queue-searching__hint">
                        ELO range widens the longer you wait — you&apos;ll always find someone eventually.
                    </p>
                    <Button variant="danger" onClick={handleCancel}>Cancel</Button>
                </div>
            )}
        </section>
    );
}
