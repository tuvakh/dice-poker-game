import { useNavigate, Link } from "react-router-dom";

import Hero from "../components/Hero.jsx";
import Button from "../components/Button.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";

import homeHero from "../assets/home-hero.png";
import HomeDetails from "./home/HomeDetails.jsx";

// The homepage introduces the platform and shows the lobby preview, top 5 games, and tournaments
export default function Home() {
    const navigate = useNavigate();
    const { user } = useAuth();

<<<<<<< HEAD
    const [lobbyGames, setLobbyGames] = useState([]);
    const [topGames, setTopGames] = useState([]);
    const [tournaments, setTournaments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    // Chanya: activity stats fetched from the /activities endpoint
    const [activity, setActivity] = useState(null);

    useEffect(() => {
        async function load() {
            try {
                // This fetch all four data sources at the same time using Promise.all
                const [waitingData, ongoingData, finishedData, tournamentData] = await Promise.all([
                    getAllMatches({ status: "waiting", limit: 10 }),
                    getAllMatches({ status: "ongoing", limit: 5 }),
                    getAllMatches({ status: "finished", limit: 5 }),
                    getAllTournaments({ status: 'upcoming', limit: 5 })
                ]);


                setLobbyGames(waitingData.matchList);
                setTournaments(tournamentData.tournamentList.slice(0, 5));
                setActivity(activityData); // Chanya

                // This is a helper function that calculates the average Elo of all players in a match
                // and sorts matches so the highest-Elo games come first
                const byAvgElo = matches => matches
                    .map(match => ({
                        ...match,
                        // Add up all player Elos and divide by number of players
                        // || 1 prevents dividing by zero if a match has no players yet
                        avgElo: match.players.reduce((sum, player) => sum + (player.eloRating ?? 0), 0) / (match.players.length || 1)
                    }))
                    .sort((a, b) => b.avgElo - a.avgElo);

                // Fill the top 5 with ongoing games first
                // If there are fewer than 5 ongoing game, pad with the most recent finished games to always show 5 cards
                const topOngoing = byAvgElo(ongoingData.matchList);
                const remaining = 5 - topOngoing.length;
                const topFinished = remaining > 0 ? byAvgElo(finishedData.matchList).slice(0, remaining) : [];
                setTopGames([...topOngoing, ...topFinished].slice(0, 5));
            } catch {
                setError("Failed to load data. Please try again.");
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    // Decide which games to show based on who is viewing
    const availableGames = filterLobbyMatches(lobbyGames, user);

    const filteredGames = availableGames.slice(0, preferences.lobbyCount);

    if (loading) return <Spinner />;
    if (error) return <p className="status status--error">{error}</p>;

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

            {/* Chanya: Platform activity stats pulled from the /activities endpoint */}
            {activity && (
                <section className="home-activity">
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

            {/* Lobby preview: shows waiting games the user can join */}
            <section>
                <h2>Games available for joining</h2>
                <p>Pick a game and jump straight in, there are currently {filteredGames.length} available!</p>

                <div className="cards-grid">
                    {filteredGames.map((match) => <GameCard key={match.matchId} match={match} />)}
                </div>
            </section>

            {/* Top 5 ongoing games with the highest average Elo */}
            <section>
                <h2>Top 5 ongoing games</h2>
                <p>Watch the highest-rated players in action!</p>
                <div className="cards-grid">
                    {topGames.map((match, i) => <GameCard key={match.matchId} match={match} index={i} variant="topGames" />)}
                </div>
            </section>
            {/* Tournament preview: shows the 5 upcoming tournaments*/}
            <section className="tournaments-preview">
                <h2>Upcoming tournaments</h2>
                <p>Sign up before they fill up!</p>
                <div className="cards-grid">
                    {tournaments.map(tournament => <TournamentCard key={tournament.tournamentId} tournament={tournament} />)}
                </div>
            </section>
        </>
    );
}
