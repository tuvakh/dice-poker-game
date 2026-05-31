// ── Tournament details ─────────────────────────────────────────────────────────
import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router";
import { getTournament, joinTournament, leaveTournament } from "../api/tournaments.js";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useSoundEffects } from "../hooks/useSoundEffects.js";
import { getAllComments } from "../api/comments.js";

import CommentList from "../components/CommentList.jsx";
import CommentForm from "../components/CommentForm.jsx";
import Spinner from "../components/Spinner.jsx";
import Button from "../components/Button.jsx";

export default function TournamentPage() {
    const { id } = useParams();
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
    const wsRef = useRef(null);
    const [comments, setComments] = useState([]);

    // Fetches tournament data when the page loads or the URL id changes
    useEffect(() => {
        setLoading(true);
        setError(null);
        getTournament(id)
            .then(data => setTournament(data))
            .catch(() => setError("Could not load this tournament."))
            .finally(() => setLoading(false));
    }, [id]);

    // Fetch comments once the tournament's _id is known
    useEffect(() => {
        if (!tournament?._id) return;
        getAllComments({ targetId: tournament._id, targetType: 'tournament' })
            .then(data => setComments(data.commentList))
            .catch(() => { });
    }, [tournament?._id]);

    // Open a WebSocket room so new comments appear in real time
    useEffect(() => {
        if (!tournament?._id) return;
        const ws = new WebSocket('ws://localhost:3000');
        wsRef.current = ws;
        ws.onopen = () => {
            ws.send(JSON.stringify({ type: 'join-tournament', tournamentObjectId: tournament._id }));
        };
        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            if (message.type === 'new-comment') {
                setComments(prev => [...prev, message.comment]);
            }
        };
        return () => ws.close();
    }, [tournament?._id]);


    async function handleJoin() {
        if (!user) return;
        setJoining(true);
        setJoinError(null);
        try {
            await joinTournament(id, user._id);
            setJoined(true);
            playJoin();
            // Add the user to the participants list locally without re-fetching
            // (Optimistic update)
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
            // Remove the user from the participants list locally without re-fetching
            // (Optimistic update)
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

    // joined is set when the user joins in this browser session
    // alreadyIn is computed from the tournament data for returning visitors who were already registered
    const alreadyIn = user && tournament.participants?.some(
        p => (p._id ?? p)?.toString() === user._id?.toString()
    );

    return (
        <section className="tournament-detail">
            <Link to="/tournament" className="back-link" onClick={playClick}>
                ← All tournaments
            </Link>
            <h1>{tournament.title}</h1>
            <span className={`tournament-card__status tournament-card__status--${tournament.status}`}>
                {tournament.status}
            </span>

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

            {/* Bracket - Rounds is a 2D array: rounds[roundIndex][matchIndex], each entry holds a match */}
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
                                        const matchId = match?.matchId;
                                        const card = (
                                            <div key={mIdx} className={`bracket__match${matchId ? " bracket__match--clickable" : ""}`}>
                                                {match?.status && (
                                                    <span className={`bracket__match-status bracket__match-status--${match.status}`}>
                                                        {match.status}
                                                    </span>
                                                )}
                                                {players.length === 0 ? (
                                                    <p className="bracket__match-player bracket__match-player--tbd">TBD</p>
                                                ) : (
                                                    players.map((pl, pIdx) => (
                                                        <p
                                                            key={pIdx}
                                                            className={`bracket__match-player${winner && (pl._id ?? pl)?.toString() === (winner._id ?? winner)?.toString()
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
                                        return matchId
                                            ? <Link key={mIdx} to={`/game/${matchId}`} onClick={playClick} style={{ textDecoration: "none" }}>{card}</Link>
                                            : card;
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}

            <h2>Comments</h2>
            <CommentList comments={comments} />
            <CommentForm
                targetId={tournament._id}
                targetType="tournament"
                onCommentAdded={() =>
                    getAllComments({ targetId: tournament._id, targetType: 'tournament' })
                        .then(data => setComments(data.commentList))
                        .catch(() => { })
                }
            />
        </section>
    );
}