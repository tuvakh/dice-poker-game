import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getAllTournaments, getTournament, joinTournament, leaveTournament } from "../api/tournaments.js";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useSoundEffects } from "../hooks/useSoundEffects.js";
import Hero from "../components/Hero.jsx";
import Spinner from "../components/Spinner.jsx";
import Button from "../components/Button.jsx";

// TODO: replace with a dedicated tournament hero image
import tournamentHero from "../assets/lobby-hero.png";

const STATUS_TABS = [
    { value: "",         label: "All" },
    { value: "upcoming", label: "Upcoming" },
    { value: "ongoing",  label: "Ongoing" },
    { value: "finished", label: "Finished" },
];

// ── Tournament list ───────────────────────────────────────────────────────────
function TournamentList() {
    const [statusFilter, setStatusFilter] = useState("");
    const [tournaments, setTournaments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { playClick } = useSoundEffects();

    useEffect(() => {
        setLoading(true);
        setError(null);
        const params = statusFilter ? { status: statusFilter } : {};
        getAllTournaments(params)
            .then(data => setTournaments(data.tournamentList ?? []))
            .catch(() => setError("Could not load tournaments. Please try again."))
            .finally(() => setLoading(false));
    }, [statusFilter]);

    return (
        <>
            <Hero title="Tournaments" heroImg={tournamentHero}>
                <p>Compete against other players in organised tournaments.</p>
            </Hero>

            <section>
                <div className="tournament-tabs">
                    {STATUS_TABS.map(tab => (
                        <button
                            key={tab.value}
                            className={`tournament-tabs__btn${statusFilter === tab.value ? " tournament-tabs__btn--active" : ""}`}
                            onClick={() => { playClick(); setStatusFilter(tab.value); }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <h2>
                    {statusFilter
                        ? statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)
                        : "All"} tournaments
                </h2>

                {loading && <Spinner />}
                {error && <p className="status status--error">{error}</p>}
                {!loading && !error && tournaments.length === 0 && (
                    <p>No tournaments found.</p>
                )}

                {!loading && !error && tournaments.length > 0 && (
                    <div className="cards-grid">
                        {tournaments.map(t => (
                            <Link
                                key={t._id}
                                to={`/tournament/${t.tournamentId}`}
                                className="tournament-card"
                                onClick={playClick}
                            >
                                <span className={`tournament-card__status tournament-card__status--${t.status}`}>
                                    {t.status}
                                </span>
                                <p className="tournament-card__name">{t.title}</p>
                                <div className="tournament-card__meta">
                                    {t.date && (
                                        <span>
                                            📅{" "}
                                            {new Date(t.date).toLocaleDateString("en-GB", {
                                                day: "numeric", month: "short", year: "numeric",
                                            })}
                                        </span>
                                    )}
                                    <span>
                                        👥 {t.participants?.length ?? 0} participant{(t.participants?.length ?? 0) !== 1 ? "s" : ""}
                                    </span>
                                    {t.numberOfRounds != null && (
                                        <span>🔁 {t.numberOfRounds} round{t.numberOfRounds !== 1 ? "s" : ""}</span>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </section>
        </>
    );
}

// ── Tournament detail ─────────────────────────────────────────────────────────
function TournamentDetail({ id }) {
    const { user } = useAuth();
    const { playClick, playJoin } = useSoundEffects();
    const [tournament, setTournament] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [joining, setJoining] = useState(false);
    const [joinError, setJoinError] = useState(null);
    const [joined, setJoined] = useState(false);
    const [leaving, setLeaving] = useState(false);
    const [leaveError, setLeaveError] = useState(null);

    useEffect(() => {
        setLoading(true);
        setError(null);
        getTournament(id)
            .then(data => setTournament(data))
            .catch(() => setError("Could not load this tournament."))
            .finally(() => setLoading(false));
    }, [id]);

    async function handleJoin() {
        if (!user) return;
        setJoining(true);
        setJoinError(null);
        try {
            await joinTournament(id, user._id);
            setJoined(true);
            playJoin();
            setTournament(prev => prev
                ? { ...prev, participants: [...(prev.participants ?? []), { _id: user._id, username: user.username }] }
                : prev
            );
        } catch (err) {
            setJoinError(err.message ?? "Could not join tournament.");
        } finally {
            setJoining(false);
        }
    }

    async function handleLeave() {
        if (!user) return;
        setLeaving(true);
        setLeaveError(null);
        try {
            await leaveTournament(id, user._id);
            setJoined(false);
            setTournament(prev => prev
                ? { ...prev, participants: prev.participants.filter(p => (p._id ?? p)?.toString() !== user._id?.toString()) }
                : prev
            );
        } catch (err) {
            setLeaveError(err.message ?? "Could not leave tournament.");
        } finally {
            setLeaving(false);
        }
    }

    if (loading) return <Spinner />;
    if (error) return <p className="status status--error">{error}</p>;
    if (!tournament) return null;

    const date = tournament.date
        ? new Date(tournament.date).toLocaleString("en-GB", {
            weekday: "long", day: "numeric", month: "long",
            year: "numeric", hour: "2-digit", minute: "2-digit",
          })
        : "TBA";

    const participantCount = tournament.participants?.length ?? 0;
    const alreadyIn = user && tournament.participants?.some(
        p => (p._id ?? p)?.toString() === user._id?.toString()
    );

    return (
        <>
            <Hero title={tournament.title} heroImg={tournamentHero}>
                {/* TODO: replace with a dedicated tournament hero image */}
                <span className={`tournament-card__status tournament-card__status--${tournament.status}`}>
                    {tournament.status}
                </span>
            </Hero>

            <section className="tournament-detail">
                <Link to="/tournament" className="back-link" onClick={playClick}>
                    ← All tournaments
                </Link>

                {/* Join */}
                {tournament.status === "upcoming" && !joined && !alreadyIn && (
                    <div className="tournament-detail__join-area">
                        {user ? (
                            <Button onClick={handleJoin} disabled={joining}>
                                {joining ? "Joining…" : "Join Tournament"}
                            </Button>
                        ) : (
                            <p><Link to="/login">Log in</Link> to join this tournament.</p>
                        )}
                    </div>
                )}
                {(joined || alreadyIn) && tournament.status === "upcoming" && (
                    <div className="tournament-detail__join-area">
                        <p className="status status--success">You&apos;re registered!</p>
                        <Button onClick={handleLeave} disabled={leaving} variant="danger">
                            {leaving ? "Leaving…" : "Leave Tournament"}
                        </Button>
                    </div>
                )}
                {joinError && <p className="status status--error">{joinError}</p>}
                {leaveError && <p className="status status--error">{leaveError}</p>}

                {/* Info */}
                <div className="tournament-detail__info-grid">
                    <div className="tournament-detail__info-box">
                        <span>Date</span>
                        <strong>{date}</strong>
                    </div>
                    {tournament.numberOfRounds != null && (
                        <div className="tournament-detail__info-box">
                            <span>Rounds</span>
                            <strong>{tournament.numberOfRounds}</strong>
                        </div>
                    )}
                    {tournament.breaks != null && (
                        <div className="tournament-detail__info-box">
                            <span>Break</span>
                            <strong>{tournament.breaks} min</strong>
                        </div>
                    )}
                    <div className="tournament-detail__info-box">
                        <span>Participants</span>
                        <strong>{participantCount}</strong>
                    </div>
                </div>

                {tournament.description && (
                    <>
                        <h2>Description</h2>
                        <p>{tournament.description}</p>
                    </>
                )}

                {/* Trophy */}
                {(tournament.trophy?.title || tournament.trophy?.imageUrl) && (
                    <>
                        <h2>🏆 Trophy</h2>
                        <div className="tournament-detail__trophy">
                            {tournament.trophy.imageUrl && (
                                <img
                                    src={tournament.trophy.imageUrl}
                                    alt={tournament.trophy.title ?? "Trophy"}
                                    className="tournament-detail__trophy-img"
                                />
                            )}
                            {tournament.trophy.title && <p>{tournament.trophy.title}</p>}
                        </div>
                    </>
                )}

                {/* Participants */}
                <h2>Participants ({participantCount})</h2>
                {participantCount === 0 ? (
                    <p>No participants yet — be the first!</p>
                ) : (
                    <ul className="tournament-detail__players">
                        {tournament.participants.map(p => (
                            <li key={p._id ?? p} className="tournament-detail__player-item">
                                {p.username ?? p}
                            </li>
                        ))}
                    </ul>
                )}

                {/* Bracket */}
                {tournament.rounds?.length > 0 && (
                    <>
                        <h2>Bracket</h2>
                        <div className="bracket">
                            <div className="bracket__rounds">
                                {tournament.rounds.map((round, rIdx) => (
                                    <div key={rIdx} className="bracket__round">
                                        <p className="bracket__round-label">Round {rIdx + 1}</p>
                                        {round.map((entry, mIdx) => {
                                            const match = entry?.matchId ?? entry;
                                            const players = match?.players ?? [];
                                            const winner = match?.winner;
                                            return (
                                                <div key={mIdx} className="bracket__match">
                                                    {players.length === 0 ? (
                                                        <p className="bracket__match-player bracket__match-player--tbd">TBD</p>
                                                    ) : (
                                                        players.map((pl, pIdx) => (
                                                            <p
                                                                key={pIdx}
                                                                className={`bracket__match-player${
                                                                    winner && (pl._id ?? pl)?.toString() === (winner._id ?? winner)?.toString()
                                                                        ? " bracket__match-player--winner"
                                                                        : ""
                                                                }`}
                                                            >
                                                                {pl.username ?? pl}
                                                            </p>
                                                        ))
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </section>
        </>
    );
}

// Routes: /tournament → list, /tournament/:id → detail
export default function Tournament() {
    const { id } = useParams();
    if (id) return <TournamentDetail id={id} />;
    return <TournamentList />;
}
