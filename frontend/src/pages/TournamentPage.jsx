import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { getTournament, joinTournament, leaveTournament, deleteTournament, cancelTournament, startRound } from "../api/tournaments.js";
import { useAuth } from "../contexts/AuthContext.jsx";
import { getAllComments } from "../api/comments.js";
import { useSoundEffects } from "../hooks/useSoundEffects.js";
import Spinner from "../components/Spinner.jsx";
import Button from "../components/Button.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import CommentList from "../components/CommentList.jsx";
import CommentForm from "../components/CommentForm.jsx";

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
    const redirectedRef = useRef(false);
    const autoStartedRef = useRef(false); 
    const nextRoundFiredRef = useRef(false); 
    const [comments, setComments] = useState([]);

    const [countdownSecs, setCountdownSecs] = useState(null);

    useEffect(() => {
        setLoading(true);
        setError(null);
        getTournament(id)
            .then(data => setTournament(data))
            .catch(() => setError("Could not load this tournament."))
            .finally(() => setLoading(false));
    }, [id]);

    useEffect(() => {
        if (!tournament?._id) return;
        getAllComments({ targetId: tournament._id, targetType: 'tournament' })
            .then(data => setComments(data.commentList ?? []))
            .catch(() => { });
    }, [tournament?._id]);

    useEffect(() => {
        if (!tournament?._id) return;
        const WS_URL = import.meta.env.VITE_WS_URL;
        const ws = new WebSocket(WS_URL);
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

    useEffect(() => {
        if (!tournament || tournament.status !== 'ongoing') return;

        const rounds = tournament.rounds ?? [];
        const latestRound = rounds[rounds.length - 1];
        if (!latestRound) return;

        const allDone = latestRound.every(match => match?.status === 'finished');
        const roundsLeft = (tournament.numberOfRounds ?? 0) - rounds.length;

        if (!allDone || roundsLeft <= 0) {
            setCountdownSecs(null);
            return;
        }

        const latestEndedAt = latestRound.reduce((maxTime, match) => {
            const endTime = match?.endedAt ? new Date(match.endedAt).getTime() : 0;
            return endTime > maxTime ? endTime : maxTime;
        }, 0);

        if (!latestEndedAt) {
            setCountdownSecs(null);
            return;
        }

        const nextRoundAt = latestEndedAt + (tournament.breaks ?? 0) * 60 * 1000;

        const tick = () => {
            const remaining = Math.max(0, Math.floor((nextRoundAt - Date.now()) / 1000));
            setCountdownSecs(remaining);
            if (remaining === 0 && !nextRoundFiredRef.current) {
                nextRoundFiredRef.current = true;
                startRound(id)
                    .then(updated => setTournament(updated))
                    .catch(() => {
                        nextRoundFiredRef.current = false;
                        getTournament(id).then(updated => setTournament(updated)).catch(() => { });
                    });
            }
        };
        tick();
        const interval = setInterval(tick, 1000);
        return () => {
            clearInterval(interval);
            nextRoundFiredRef.current = false;
        };
    }, [tournament]);

    useEffect(() => {
        if (!tournament || tournament.status !== 'upcoming') return;
        const interval = setInterval(() => {
            getTournament(id).then(data => setTournament(data)).catch(() => { });
        }, 5000);
        return () => clearInterval(interval);
    }, [tournament?.status, id]);


    useEffect(() => {
        if (!tournament || !user) return;
        if (tournament.status !== 'upcoming') return; 
        if ((tournament.participants?.length ?? 0) < 2) return;
        if (autoStartedRef.current) return;

        const target = tournament.date ? new Date(tournament.date).getTime() : null;
        if (!target) return;

        const fire = () => {
            autoStartedRef.current = true;
            startRound(id)
                .then(updated => setTournament(updated))
                .catch(() => {
                    autoStartedRef.current = false;
                    getTournament(id).then(updated => setTournament(updated)).catch(() => { });
                });
        };

        const remaining = target - Date.now();
        if (remaining <= 0) {
            fire();
        } else {
            const timer = setTimeout(fire, remaining);
            return () => clearTimeout(timer);
        }
    }, [tournament?.tournamentId, tournament?.status, tournament?.participants?.length, user, id]);

    useEffect(() => {
        if (!tournament || !user) return;
        if (redirectedRef.current) return;
        const rounds = tournament.rounds ?? [];
        if (rounds.length === 0) return;
        const latestRound = rounds[rounds.length - 1];
        for (const match of latestRound) {
            if (!match || match.status === 'finished') continue;
            const players = match.players ?? [];
            const isPlayer = players.some(player =>
                (player.username && player.username === user.username) ||
                (player._id ?? player)?.toString() === (user.userId ?? user._id)?.toString()
            );
            if (isPlayer && match.matchId) {
                redirectedRef.current = true;
                navigate(`/game/${match.matchId}`, { state: { tournamentId: tournament.tournamentId } });
                return;
            }
        }
    }, [tournament, user, navigate]);

    async function handleJoin() {
        if (!user) return;
        setJoining(true);
        setJoinError(null);
        try {
            await joinTournament(id);
            playJoin();
            const updated = await getTournament(id);
            setTournament(updated);
            setJoined(true);
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
            await leaveTournament(id);
            setJoined(false);
            setTournament(prev => prev
                ? { ...prev, participants: prev.participants.filter(participant => (participant._id ?? participant)?.toString() !== user._id?.toString()) }
                : prev
            );
        } catch (err) {
            setLeaveError(err.message ?? "Could not leave tournament.");
        } finally {
            setLeaving(false);
        }
    }

    async function handleDelete() {
        try {
            await deleteTournament(id);
            navigate('/tournament');
        } catch (err) {
            setError(err.message ?? "Could not delete tournament.");
        }
    }

    async function handleStartRound() {
        try {
            const updated = await startRound(id);
            setTournament(updated);
        } catch (err) {
            setError(err.message ?? "Could not start next round.");
        }
    }

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

    const winMap = {};
    for (const roundData of (tournament.standings ?? [])) {
        for (const winner of (roundData.winners ?? [])) {
            const winnerId = (winner._id ?? winner)?.toString();
            if (!winnerId) continue;
            if (!winMap[winnerId]) winMap[winnerId] = { username: winner.username ?? '?', wins: 0 };
            winMap[winnerId].wins++;
        }
    }
    for (const participant of (tournament.participants ?? [])) {
        const participantId = (participant._id ?? participant)?.toString();
        if (participantId && !winMap[participantId]) winMap[participantId] = { username: participant.username ?? '?', wins: 0 };
    }
    const standingsList = Object.values(winMap).sort((entryA, entryB) => entryB.wins - entryA.wins);

    const alreadyIn = user && tournament.participants?.some(participant =>
        participant.username && participant.username === user.username
    );

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

            {showLeaveConfirm && (
                <ConfirmDialog
                    message="Are you sure you want to leave this tournament?"
                    onConfirm={() => { setShowLeaveConfirm(false); handleLeave(); }}
                    onCancel={() => setShowLeaveConfirm(false)}
                />
            )}

            {user?.role === 'admin' && tournament.status !== 'finished' && (
                <div className="tournament-detail__admin">
                    {tournament.status !== 'cancelled' && (
                        <>
                            {tournament.status === 'upcoming' && (
                                <Button onClick={() => navigate(`/admin/tournaments/${tournament.tournamentId}/edit`)}>Edit tournament</Button>
                            )}
                            {tournament.status === 'ongoing' && (tournament.rounds?.length ?? 0) < (tournament.numberOfRounds ?? 0) && (
                                <Button onClick={handleStartRound}>Start next round</Button>
                            )}
                            <Button onClick={() => setShowCancelConfirm(true)} variant="danger">Cancel tournament</Button>
                        </>
                    )}
                    <Button onClick={() => setShowDeleteConfirm(true)} variant="danger">Delete tournament</Button>
                </div>
            )}

            {showCancelConfirm && (
                <ConfirmDialog
                    message="Cancel this tournament? Players will be notified it won't run."
                    confirmLabel="Yes, cancel"
                    onConfirm={() => { setShowCancelConfirm(false); handleCancel(); }}
                    onCancel={() => setShowCancelConfirm(false)}
                />
            )}
            {showDeleteConfirm && (
                <ConfirmDialog
                    message="Permanently delete this tournament? This cannot be undone."
                    confirmLabel="Yes, delete"
                    onConfirm={() => { setShowDeleteConfirm(false); handleDelete(); }}
                    onCancel={() => setShowDeleteConfirm(false)}
                />
            )}

            <div className="tournament-detail__info-grid">
                <div className="tournament-detail__info-box">
                    <span>Date</span>
                    <strong>{date}</strong>
                </div>
                {tournament.createdBy?.username && (
                    <div className="tournament-detail__info-box">
                        <span>Created by</span>
                        <strong>{tournament.createdBy.username}</strong>
                    </div>
                )}
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

            {(tournament.trophy?.title || tournament.trophy?.image) && (
                <>
                    <h2>Trophy</h2>
                    <div className="tournament-detail__trophy">
                        {tournament.trophy.image && (
                            <img
                                src={tournament.trophy.image?.startsWith('data:') ? tournament.trophy.image : `/${tournament.trophy.image}`}
                                alt={tournament.trophy.title ?? "Trophy"}
                                className="tournament-detail__trophy-img"
                            />
                        )}
                        {tournament.trophy.title && <p>{tournament.trophy.title}</p>}
                    </div>
                </>
            )}

            {countdownSecs !== null && (
                <div className="tournament-detail__countdown">
                    <p>
                        {countdownSecs > 0
                            ? `Next round in ${Math.floor(countdownSecs / 60)}m ${countdownSecs % 60}s`
                            : "Next round starting…"
                        }
                    </p>
                </div>
            )}

            <h2>Participants ({participantCount})</h2>
            {participantCount === 0 ? (
                <p>No participants yet — be the first!</p>
            ) : (
                <ul className="tournament-detail__players">
                    {tournament.participants.map(participant => (
                        <li key={participant._id ?? participant} className="tournament-detail__player-item">
                            {participant.username ?? participant}
                        </li>
                    ))}
                </ul>
            )}

            {["ongoing", "finished"].includes(tournament.status) && standingsList.length > 0 && (
                <>
                    <h2>Standings</h2>
                    <ol className="tournament-detail__standings">
                        {standingsList.map((entry, i) => (
                            <li key={i} className={`tournament-detail__standings-row${i === 0 ? " tournament-detail__standings-row--leader" : ""}`}>
                                <span className="tournament-detail__standings-rank">#{i + 1}</span>
                                <span className="tournament-detail__standings-name">{entry.username}</span>
                                <span className="tournament-detail__standings-wins">{entry.wins} win{entry.wins !== 1 ? "s" : ""}</span>
                            </li>
                        ))}
                    </ol>
                </>
            )}

            {tournament.rounds?.length > 0 && (
                <>
                    <h2>Bracket</h2>
                    <div className="bracket">
                        <div className="bracket__rounds">
                            {tournament.rounds.map((round, roundIndex) => (
                                <div key={roundIndex} className="bracket__round">
                                    <p className="bracket__round-label">Round {roundIndex + 1}</p>
                                    {round.map((match, matchIndex) => {
                                        const players = match?.players ?? [];
                                        const winner = match?.winner;
                                        const matchId = match?.matchId;
                                        const card = (
                                            <div key={matchIndex} className={`bracket__match${matchId ? " bracket__match--clickable" : ""}`}>
                                                {match?.status && (
                                                    <span className={`bracket__match-status bracket__match-status--${match.status}`}>
                                                        {match.status}
                                                    </span>
                                                )}
                                                {players.length === 0 ? (
                                                    <p className="bracket__match-player bracket__match-player--tbd">TBD</p>
                                                ) : (
                                                    players.map((player, playerIndex) => (
                                                        <p
                                                            key={playerIndex}
                                                            className={`bracket__match-player${winner && (player._id ?? player)?.toString() === (winner._id ?? winner)?.toString()
                                                                ? " bracket__match-player--winner"
                                                                : ""
                                                                }`}
                                                        >
                                                            {player.username ?? player}
                                                        </p>
                                                    ))
                                                )}
                                            </div>
                                        );
                                        return matchId
                                            ? <Link key={matchIndex} to={`/game/${matchId}`} onClick={playClick} style={{ textDecoration: "none" }}>{card}</Link>
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
                        .then(data => setComments(data.commentList ?? []))
                        .catch(() => { })
                }
            />
        </section>
    );
}
