import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";

import Hero from "../components/Hero.jsx";
import Button from "../components/Button.jsx";
import GameCard from "../components/GameCard.jsx";
import TournamentCard from "../components/TournamentCard.jsx";
import Spinner from "../components/Spinner.jsx";

import { getActivity } from "../api/activity.js";
import { getAllMatches } from "../api/matches.js";
import { getAllTournaments } from "../api/tournaments.js";
import { useAppearance } from "../contexts/AppearanceContext.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import { filterLobbyMatches } from "../hooks/useLobbyGames.js";

import homeHero from "../assets/home-hero.png";

function sortByAverageElo(matches) {
    return matches
        .map(match => ({
            ...match,
            avgElo: match.players.reduce((sum, player) => sum + (player.eloRating ?? 0), 0) / (match.players.length || 1)
        }))
        .sort((a, b) => b.avgElo - a.avgElo);
}

function getIdleDelaySetter(setReady) {
    if (typeof window === "undefined") return () => {};

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

        async function load() {
            try {
                const lobbyLimit = preferences.lobbyCount;
                const [waitingData, ongoingData, tournamentData, activityData] = await Promise.all([
                    getAllMatches({ status: "waiting", limit: lobbyLimit }),
                    getAllMatches({ status: "ongoing", limit: 5 }),
                    getAllTournaments({ status: "upcoming", limit: 5 }),
                    // .catch(() => null) so a missing/failing activity endpoint doesn't crash the whole page
                    getActivity().catch(() => null)
                ]);

                if (cancelled) return;

                setLobbyGames(waitingData.matchList);
                setTournaments(tournamentData.tournamentList.slice(0, 5));
                setActivity(activityData);

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

        return () => {
            cancelled = true;
        };
    }, [ready, preferences.lobbyCount]);

    if (!ready) return null;
    if (loading) return <Spinner />;
    if (error) return <p className="status status--error">{error}</p>;

    const availableGames = filterLobbyMatches(lobbyGames, user);
    const filteredGames = availableGames.slice(0, preferences.lobbyCount);

    return (
        <>
            <Hero title="Spanish Dice Poker" heroImg={homeHero}>
                <p>Challenge players from around the world in the classic dice game. Roll your hand, hold your best dice, and outplay your opponent.</p>
                {user && (
                    <Button onClick={() => navigate("/createGame")}>
                        Create game
                    </Button>
                )}
                <Link to="/aboutGame">Learn how to play</Link>
            </Hero>

            {activity && (
                <section className="home-details__section home-activity">
                    <h2>Platform activity</h2>
                    <div className="home-activity__stats">
                        <div className="home-activity__stat">
                            <span className="home-activity__number">{activity.ongoingMatches}</span>
                            <span>games live right now</span>
                        </div>
                        <div className="home-activity__stat">
                            <span className="home-activity__number">{activity.activeUsers}</span>
                            <span>players active this week</span>
                        </div>
                    </div>
                </section>
            )}

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
                <div class="cards-grid">
                    {tournaments.map(tournament => <TournamentCard key={tournament.tournamentId} tournament={tournament} />)}
                </div>
            </section>
        </>
    );
}
