//Chanya
// tournmanet will take rounds instead of every body playing at the same time.
// Individual tournament detail page
import { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { getTournament, joinTournament, leaveTournament, deleteTournament, cancelTournament } from "../api/tournaments.js";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useSoundEffects } from "../hooks/useSoundEffects.js";
import { getAllComments } from "../api/comments.js";

import CommentList from "../components/CommentList.jsx";
import CommentForm from "../components/CommentForm.jsx";
import Spinner from "../components/Spinner.jsx";
import Button from "../components/Button.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";

export default function TournamentPage() {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const { playClick, playJoin } = useSoundEffects();
    const [tournament, setTournament] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [joining, setJoining] = useState(false);
    const [joinError, setJoinError] = useState(null);
    const [joined, setJoined] = useState(false);
    const [leaving, setLeaving] = useState(false);
    const [leaveError, setLeaveError] = useState(null);
    const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const wsRef = useRef(null);
    const [comments, setComments] = useState([]);

    // countdown state: seconds remaining until the next round is expected to start
    const [countdownSecs, setCountdownSecs] = useState(null);

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

    // Countdown to next round: runs when a round is done but more rounds remain.
    // Calculates expected start time from the latest match endedAt + break minutes.
    useEffect(() => {
        if (!tournament || tournament.status !== 'ongoing') return;

        const rounds = tournament.rounds ?? [];
        const latestRound = rounds[rounds.length - 1];
        if (!latestRound) return;

        // Check all matches in the latest round are finished
        const allDone = latestRound.every(m => m?.status === 'finished');
        const roundsLeft = (tournament.numberOfRounds ?? 0) - rounds.length;

        if (!allDone || roundsLeft <= 0) {
            setCountdownSecs(null);
            return;
        }

        // Find the most recent endedAt across all matches in the latest round
        const latestEndedAt = latestRound.reduce((maxTime, m) => {
            const t = m?.endedAt ? new Date(m.endedAt).getTime() : 0;
            return t > maxTime ? t : maxTime;
        }, 0);

        if (!latestEndedAt) {
            setCountdownSecs(null);
            return;
        }

        // Next round expected at: last match end + break minutes
        const nextRoundAt = latestEndedAt + (tournament.breaks ?? 0) * 60 * 1000;

        // Tick every second and update the displayed countdown
        const tick = () => {
            const remaining = Math.max(0, Math.floor((nextRoundAt - Date.now()) / 1000));
            setCountdownSecs(remaining);
        };
        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [tournament]);

    async function handleJoin() {
        if (!user) return;
        setJoining(true);
        setJoinError(null);
        try {
            await joinTournament(id, user._id);
            setJoined(true);
            playJoin();
            // Optimistic update: add the user to the local participants list without re-fetching
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
            // Optimistic update: remove the user from the local participants list
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

    // Admin: permanently delete the tournament and go back to the list
    async function handleDelete() {
        try {
            await deleteTournament(id);
            navigate('/tournament');
        } catch (err) {
            setError(err.message ?? "Could not delete tournament.");
        }
    }

    // Admin: mark the tournament as cancelled so players know it will not run
    async function handleCancel() {
        try {
            const updated = await cancelTournament(id);
            setTournament(prev => ({ ...prev, status: updated.status }));
        } catch (err) {
            setError(err.message ?? "Could not cancel tournament.");
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

    // alreadyIn checks the fetched data so returning visitors who were already registered see the right UI
    // joined is set when the user joins in this browser session (optimistic)
    const alreadyIn = user && tournament.participants?.some(
        p => (p._id ?? p)?.toString() === user._id?.toString()
    );

    // Players can leave as long as the tournament has not finished or been cancelled
    const canLeave = (joined || alreadyIn) && !["finished", "cancelled"].includes(tournament.status);

    return (
        <section className="tournament-detail">
            <Link to="/tournament" className="back-link" onClick={playClick}>
                &#8592; All tournaments
            </Link>
            <h1>{tournament.title}</h1>
            <span className={`tournament-card__status tournament-card__status--${tournament.status}`}>
                {tournament.status}
            </span>

            {/* Join button: only visible for upcoming tournaments to users who are not yet registered */}
            {tournament.status === "upcoming" && !joined && !alreadyIn && (
                <div className="tournament-detail__join-area">
                    {user ? (
                        <Button onClick={handleJoin} disabled={joining}>
                            {joining ? "Joining..." : "Join Tournament"}
                        </Button>
                    ) : (
                        <p><Link to="/login">Log in</Link> to join this tournament.</p>
                    )}
                </div>
            )}

            {/* Leave button: visible whenever the player is registered and the tournament is not over */}
            {canLeave && (
                <div className="tournament-detail__join-area">
                    <p className="status status--success">You&apos;re registered!</p>
                    <Button onClick={() => setShowLeaveConfirm(true)} disabled={leaving} variant="danger">
                        {leaving ? "Leaving..." : "Leave Tournament"}
                    </Button>
                </div>
            )}
            {joinError && <p className="status status--error">{joinError}</p>}
            {leaveError && <p className="status status--error">{leaveError}</p>}

            {/* Leave confirmation popup */}
            {showLeaveConfirm && (
                <ConfirmDialog
                    message="Are you sure you want to leave this tournament?"
                    onConfirm={() => { setShowLeaveConfirm(false); handleLeave(); }}
                    onCancel={() => setShowLeaveConfirm(false)}
                />
            )}

            {/* Admin controls: delete and cancel are only shown to admin users */}
            {user?.role === 'admin' && !["finished", "cancelled"].includes(tournament.status) && (
                <div className="tournament-detail__admin">
                    <Button onClick={() => setShowCancelConfirm(true)} variant="danger">Cancel tournament</Button>
                    <Button onClick={() => setShowDeleteConfirm(true)} variant="danger">Delete tournament</Button>
                </div>
            )}

            {showCancelConfirm && (
                <ConfirmDialog
                    message="Cancel this tournament? Players will be notified it won't run."
                    onConfirm={() => { setShowCancelConfirm(false); handleCancel(); }}
                    onCancel={() => setShowCancelConfirm(false)}
                />
            )}
            {showDeleteConfirm && (
                <ConfirmDialog
                    message="Permanently delete this tournament? This cannot be undone."
                    onConfirm={() => { setShowDeleteConfirm(false); handleDelete(); }}
                    onCancel={() => setShowDeleteConfirm(false)}
                />
            )}

            {/* Tournament info grid: shows key details at a glance */}
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
                {/* eloMin and eloMax restrict which players can join based on their rating */}
                {tournament.eloMin != null && (
                    <div className="tournament-detail__info-box">
                        <span>Min Elo</span>
                        <strong>{tournament.eloMin}</strong>
                    </div>
                )}
                {tournament.eloMax != null && (
                    <div className="tournament-detail__info-box">
                        <span>Max Elo</span>
                        <strong>{tournament.eloMax}</strong>
                    </div>
                )}
                {/* buyIn is how many coins each participant must spend to enter */}
                {tournament.buyIn > 0 && (
                    <div className="tournament-detail__info-box">
                        <span>Buy-in</span>
                        <strong>{tournament.buyIn} coins</strong>
                    </div>
                )}
                {tournament.gameCategory && (
                    <div className="tournament-detail__info-box">
                        <span>Game variant</span>
                        <strong>
                            {tournament.gameCategory.gameRules === "straights_allowed" ? "Straights" : "No straights"} · {tournament.gameCategory.timeController}s
                        </strong>
                    </div>
                )}
            </div>

            {tournament.description && (
                <>
                    <h2>Description</h2>
                    <p>{tournament.description}</p>
                </>
            )}

            {/* Trophy section: only shows if a trophy is linked to this tournament.
                Images are stored as filenames (e.g. "spring-trophy.png") in the Trophy model.
                They live in /frontend/public/ so the browser can reach them at /<filename> */}
            {(tournament.trophy?.title || tournament.trophy?.image) && (
                <>
                    <h2>Trophy</h2>
                    <div className="tournament-detail__trophy">
                        {tournament.trophy.image && (
                            <img
                                src={`/${tournament.trophy.image}`}
                                alt={tournament.trophy.title ?? "Trophy"}
                                className="tournament-detail__trophy-img"
                            />
                        )}
                        {tournament.trophy.title && <p>{tournament.trophy.title}</p>}
                    </div>
                </>
            )}

            {/* Countdown: shown when the current round is done but there are more rounds to play */}
            {countdownSecs !== null && (
                <div className="tournament-detail__countdown">
                    <p>
                        {countdownSecs > 0
                            ? `Next round in ${Math.floor(countdownSecs / 60)}m ${countdownSecs % 60}s`
                            : "Next round starting soon — waiting for the admin to begin."
                        }
                    </p>
                </div>
            )}

            {/* Participants list */}
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

            {/* Bracket: rounds is a 2D array where rounds[roundIndex][matchIndex] holds a match.
                All players participate every round (points-based format).
                The bracket links directly to each game so players can jump in. */}
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
                                        // Wrap with a link so players can navigate directly to their game
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
