import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";

import Hero from "../components/Hero.jsx";
import Button from "../components/Button.jsx";
import GameCard from "../components/GameCard.jsx";
import TournamentCard from "../components/TournamentCard.jsx";
import Spinner from "../components/Spinner.jsx";

import { getActivity } from "../api/activity.js";
import "./_Home.scss";
import { getAllMatches } from "../api/matches.js";
import { getAllTournaments } from "../api/tournaments.js";
import { useAppearance } from "../contexts/AppearanceContext.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";

import { filterLobbyMatches } from "../hooks/useLobbyGames.js";
import { usePolling } from "../hooks/usePolling.js";


// Ranks matches by the average ELO of their players so the highest-rated games surface first
function sortByAverageElo(matches) {
    return matches
        .map(match => ({
            ...match,
            avgElo: match.players.reduce((sum, player) => sum + (player.eloRating ?? 0), 0) / (match.players.length || 1)
        }))
        .sort((matchA, matchB) => matchB.avgElo - matchA.avgElo);
}

// Defers the data fetch until the browser is idle so the initial paint isn't blocked by API calls.
// Falls back to setTimeout(0) in environments that don't support requestIdleCallback.
function getIdleDelaySetter(setReady) {
    if (typeof window === "undefined") return () => { };

    if (typeof window.requestIdleCallback === "function") {
        const idleId = window.requestIdleCallback(() => setReady(true));
        return () => window.cancelIdleCallback(idleId);
    }

    const timeoutId = window.setTimeout(() => setReady(true), 0);
    return () => window.clearTimeout(timeoutId);
}

// The homepage introduces the platform and shows the lobby preview, top 5 games, and tournaments
export default function Home() {
    const navigate = useNavigate();
    const { preferences } = useAppearance();
    const { user } = useAuth();
    const [ready, setReady] = useState(false);
    const [lobbyGames, setLobbyGames] = useState([]);
    const [topGames, setTopGames] = useState([]);
    const [tournaments, setTournaments] = useState([]);
    const [activity, setActivity] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => getIdleDelaySetter(setReady), []);

    useEffect(() => {
        if (!ready) return;

        let cancelled = false;

        // All four requests fire in parallel to avoid a waterfall; activity failure is non-fatal
        async function load() {
            try {
                const [waitingData, ongoingData, tournamentData, activityData] = await Promise.all([
                    getAllMatches({ status: "waiting", limit: preferences.lobbyCount }),
                    getAllMatches({ status: "ongoing", limit: 5 }),
                    getAllTournaments({ status: "upcoming", limit: 5 }),
                    getActivity().catch(() => null)
                ]);

                if (cancelled) return;

                setLobbyGames(waitingData.matchList);
                setTournaments(tournamentData.tournamentList.slice(0, 5));
                setActivity(activityData);

                // Fill the top 5 slots with ongoing games first; backfill with finished games if fewer than 5 are live
                const topOngoing = sortByAverageElo(ongoingData.matchList);
                const remaining = 5 - topOngoing.length;
                const topFinished = remaining > 0
                    ? sortByAverageElo((await getAllMatches({ status: "finished", limit: remaining })).matchList).slice(0, remaining)
                    : [];

                if (cancelled) return;

                setTopGames([...topOngoing, ...topFinished].slice(0, 5));
            } catch {
                if (!cancelled) setError("Failed to load data. Please try again.");
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        load();
        return () => { cancelled = true; };
    }, [ready, preferences.lobbyCount]);

    usePolling((signal) => {
        if (!ready) return;
        getAllMatches({ status: "waiting", limit: preferences.lobbyCount }, signal)
            .then(data => setLobbyGames(data.matchList))
            .catch(err => { if (err?.name !== "AbortError") setError("Failed to load games."); });
    }, 8000, ready);

    if (!ready) return null;
    if (loading) return <Spinner />;
    if (error) return <p className="status status--error">{error}</p>;

    const availableGames = filterLobbyMatches(lobbyGames, user);
    const filteredGames = availableGames.slice(0, preferences.lobbyCount);

    return (
        <>
            <Hero title="Spanish Dice Poker" heroImg="/home-hero.webp">
                <p>Challenge players from around the world in the classic dice game. Roll your hand, hold your best dice, and outplay your opponent.</p>
                {user && (
                    <Button onClick={() => navigate("/createGame")}>
                        Create game
                    </Button>
                )}
                <Link to="/aboutGame">Learn how to play</Link>
            </Hero>

            <section className="home-details__section">
                <h2>Games available for joining</h2>
                <p>Pick a game and jump straight in, there are currently {filteredGames.length} available!</p>
                <div className="cards-grid">
                    {filteredGames.map((match) => <GameCard key={match.matchId} match={match} />)}
                </div>
            </section>

            <section className="home-details__section">
                <h2>Top 5 ongoing games</h2>
                <p>Watch the highest-rated players in action!</p>
                <div className="cards-grid">
                    {topGames.map((match, i) => <GameCard key={match.matchId} match={match} index={i} variant="topGames" />)}
                </div>
            </section>

            <section className="home-details__section tournaments-preview">
                <h2>Upcoming tournaments</h2>
                <p>Sign up before they fill up!</p>
                <div className="cards-grid">
                    {tournaments.map(tournament => <TournamentCard key={tournament.tournamentId} tournament={tournament} />)}
                </div>
            </section>

            {activity && (
                <section className="home-details__section home-activity">
                    <h2>Platform activity</h2>
                    <div className="home-activity__stats">
                        <div className="home-activity__stat">
                            <span className="home-activity__label">Games live right now</span>
                            <span className="home-activity__number">{activity.ongoingMatches}</span>
                        </div>
                        <div className="home-activity__stat">
                            <span className="home-activity__label">Players active this week</span>
                            <span className="home-activity__number">{activity.activeUsers}</span>
                        </div>
                    </div>
                </section>
            )}
        </>
    );
}
