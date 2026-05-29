import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router";

import { getMatch, leaveMatch, joinMatch } from "../api/matches.js";
import { getAllComments } from "../api/comments.js";
import { usePolling } from "../hooks/usePolling.js";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useAppearance } from "../contexts/AppearanceContext.jsx";
import Spinner from "../components/Spinner.jsx";

import CommentList from "../components/CommentList";
import CommentForm from "../components/CommentForm";
import PlayerInfo from "../components/PlayerInfo";
import '../components/dice-poker-board.js';
import '../components/dice-poker-die.js';


// The individual game page shows players, game board, and comments sidebar
export default function Game() {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const { preferences } = useAppearance();
    const [match, setMatch] = useState(null);
    const [comments, setComments] = useState([]);
    const [error, setError] = useState(null);
    const hasJoined = useRef(false);
    const wsRef = useRef(null);
    const boardRef = useRef(null);
    const matchRef = useRef(null);
    const [gamePhase, setGamePhase] = useState(null);
    const [bettingState, setBettingState] = useState(null);
    const [standings, setStandings] = useState(null);
    const [betAmount, setBetAmount] = useState(1);
    const [timeLeft, setTimeLeft] = useState(null);
    const timerRef = useRef(null);
    const [readySent, setReadySent] = useState(false);

    // Fetches the latest match data from the backend
    async function fetchMatch() {
        try {
            const data = await getMatch(id);
            setMatch(data);
            matchRef.current = data;
            setError(null); // clear error if a retry succeeds
        } catch {
            setError("Failed to load game. Please try again.");
        }
    }

    // Fetches all comments for this match
    async function fetchComments() {
        if (!match?._id) return;
        try {
            const data = await getAllComments({ targetId: match._id, targetType: "match" });
            setComments(data.commentList);
        } catch {
            // keep existing comments on failed fetch
        }
    }

    function handleReady() {
        wsRef.current?.send(JSON.stringify({ type: 'ready' }));
        setReadySent(true);
    }

    function sendBet(action, amount = 0) {
        wsRef.current?.send(JSON.stringify({ type: 'bet', action, amount }));
    }

    async function handleLeave() {
        try {
            await leaveMatch(match.matchId, user._id);
            navigate('/');
        } catch (err) {
            setError(err.message);
        }
    }


    // Poll the match every 15 seconds to check if someone joined
    usePolling(fetchMatch, 5000);

    // Refetch comments whenever the match updates
    useEffect(() => {
        fetchComments();
    }, [match]);

    // Auto-join the match once if the user isn't already a player
    useEffect(() => {
        if (!match || hasJoined.current) return;

        const isPlayer = user && match.players.some(player => player._id === user._id);

        if (!isPlayer && match.status === "waiting" && user) {
            hasJoined.current = true;
            joinMatch(match.matchId, user._id).finally(fetchMatch);
        }
    }, [match]);

    // Routes incoming WebSocket messages to the right board action
    function handleServerMessage(message) {
        const board = boardRef.current;

        if (message.type === 'all-joined') {
            setGamePhase('ready');
        }

        if (message.type === 'game-started') {
            setGamePhase('rolling');
            clearInterval(timerRef.current);
            setTimeLeft(message.timeRemaining);
            timerRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            if (board) {
                const currentPlayers = matchRef.current?.players ?? match.players;

                const allPlayerIds = new Set([
                    ...currentPlayers.map(player => player._id),
                    ...message.players
                ]);

                allPlayerIds.forEach(playerId => {
                    const playerData = currentPlayers.find(player => player._id === playerId);
                    board.addPlayer(playerId, playerData?.username ?? playerId);
                    if (playerId !== user?._id) {
                        board.setDice(playerId, ['?', '?', '?', '?', '?'], true);
                    }
                });

                board.currentUserId = user?._id;
                board.setDice(user?._id, message.yourDice, true);
                board.resetAllHeld();
                board.setInteractive(user?._id, true);
                board.clearResults();
                board.resetAllHeld();
            }
        }

        if (message.type === 'roll-result') {
            if (board) {
                board.setDice(user?._id, message.yourDice);
            }
        }

        if (message.type === 'player-rolled') {
            if (board && message.userId !== user?._id && message.held) {
                board.setHeld(message.userId, message.held);
            }
        }


        if (message.type === 'player-done-rolling') {
            if (message.userId === user?._id) {
                boardRef.current?.setInteractive(user._id, false);
                clearInterval(timerRef.current);
                setTimeLeft(null);
            }
        }

        if (message.type === 'betting-start') {
            setGamePhase('betting');
            clearInterval(timerRef.current);
            setTimeLeft(null);
            setBettingState({ currentBettor: message.currentBettor, pot: message.pot, highestBet: 0, yourStack: message.stacks?.[user?._id] ?? 0 });
        }

        if (message.type === 'next-bettor') {
            setBettingState(prev => ({ ...prev, currentBettor: message.currentBettor, yourStack: message.stacks?.[user?._id] ?? prev.yourStack }));
        }

        if (message.type === 'player-bet') {
            setBettingState(prev => ({ ...prev, pot: message.pot, highestBet: Math.max(prev.highestBet, message.amount) }));
        }

        if (message.type === 'player-matched') {
            setBettingState(prev => ({ ...prev, pot: message.pot }));
        }

        if (message.type === 'player-folded') {
            // noted — board could show folded state later
        }


        if (message.type === 'round-end') {
            setGamePhase(null);

            // Show reveal: set everyone's dice visible
            if (board) {
                for (const [userId, faces] of Object.entries(message.reveal)) {
                    board.setDice(userId, faces);
                }
                for (const [userId, hand] of Object.entries(message.hands)) {
                    board.showResult(userId, hand.handType, message.winners.includes(userId));
                }
            }
        }

        if (message.type === 'game-end') {
            setGamePhase('ended');
            setStandings(message.standings);
        }
    }

    useEffect(() => {
        if (!match || match.status !== 'ongoing') return;

        // Connect to the WebSocket server
        const ws = new WebSocket('ws://localhost:3000');
        wsRef.current = ws;

        ws.onopen = () => {
            const requiredPlayers = match.maxPlayers ?? 2;

            // Join the game room
            ws.send(JSON.stringify({
                type: 'join',
                matchId: String(match.matchId),
                userId: user?._id,
                requiredPlayers,
                totalRounds: match.gameCategory?.numberOfRounds ?? 3,
                timeController: match.gameCategory?.timeController ?? 10,
                coinWager: match.coinWager ?? 0
            }));
        };

        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            handleServerMessage(message);
        };

        // Close the connection when leaving the page
        return () => ws.close();
    }, [match?.status]);

    useEffect(() => {
        const board = boardRef.current;
        if (!board) return;

        function onDoneRolling() {
            wsRef.current?.send(JSON.stringify({ type: 'done-rolling' }));
        }

        function onRollAgain(event) {
            wsRef.current?.send(JSON.stringify({
                type: 'hold',
                held: event.detail.held
            }));
        }

        board.addEventListener('dp:done-rolling', onDoneRolling);
        board.addEventListener('dp:roll-again', onRollAgain);

        return () => {
            board.removeEventListener('dp:done-rolling', onDoneRolling);
            board.removeEventListener('dp:roll-again', onRollAgain);
        };
    }, [gamePhase]);

    if (error) return <p className="status status--error">{error}</p>;
    if (!match) return <Spinner />;

    return (
        <>
            <div className="game">
                <div className="game__main">
                    <div className="game__players">
                        {match.players.map(player => (
                            <PlayerInfo key={player._id} user={player} showImage />
                        ))}
                    </div>
                    <div className="game__game-board" style={{ backgroundColor: preferences.boardColor }}>
                        {match.status === "waiting" && (
                            <div className="game__waiting-overlay">
                                {user ? (
                                    <>
                                        <p>Waiting for other players to join...</p>
                                        {match.players.some(player => player._id === user._id) && (
                                            <button onClick={handleLeave}>
                                                {match.players.length === 1 ? 'Cancel game' : 'Leave game'}
                                            </button>
                                        )}
                                    </>
                                ) : (
                                    <p>Want to join? <Link to="/login">Log in</Link> first.</p>
                                )}
                            </div>
                        )}

                        {match.status === "ongoing" && gamePhase !== 'ended' && (
                            <>
                                {gamePhase === 'rolling' && timeLeft !== null && (
                                    <p className="game__timer">⏱ {timeLeft}s</p>
                                )}
                                {gamePhase === 'ready' && (
                                    <div className="game__ready-overlay">
                                        {readySent
                                            ? <p>Waiting for opponent...</p>
                                            : <button onClick={handleReady}>Ready</button>
                                        }
                                    </div>
                                )}
                                <dice-poker-board ref={boardRef}></dice-poker-board>
                            </>
                        )}

                        {match.status === "finished" && !gamePhase && (
                            <div className="game__ended">
                                <h2>Game over</h2>
                                {match.outcome && <p>Result: {match.outcome}</p>}
                            </div>
                        )}

                        {gamePhase === 'ended' && standings && (
                            <div className="game__ended">
                                <h2>Game over</h2>
                                <ol className="game__standings">
                                    {standings.map((entry, i) => {
                                        const player = match.players.find(matchPlayer => matchPlayer._id === entry.userId);
                                        const name = player?.username;
                                        return (
                                            <li key={entry.userId}>
                                                {i === 0 && '🏆 '}{name} — {entry.stack} coins
                                            </li>
                                        );
                                    })}
                                </ol>
                            </div>
                        )}
                    </div>

                    {gamePhase === 'betting' && bettingState && (
                        <div className="game__betting">
                            <p className="game__pot">Pot: {bettingState.pot} coins</p>
                            {bettingState.currentBettor === user?._id ? (
                                <div className="game__bet-actions">
                                    <p>Your turn</p>
                                    <button onClick={() => sendBet('fold')}>Fold</button>
                                    <button onClick={() => sendBet('match')}>
                                        {bettingState.highestBet === 0 ? 'Check' : `Match (${bettingState.highestBet})`}
                                    </button>
                                    {match.coinWager > 0 && bettingState.yourStack > 0 && (
                                        <div className="game__bet-input">
                                            <input
                                                type="number"
                                                min={bettingState.highestBet + 1}
                                                max={bettingState.yourStack}
                                                value={betAmount}
                                                onChange={event => setBetAmount(Number(event.target.value))}
                                            />
                                            <button onClick={() => sendBet('bet', betAmount)}>Bet</button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <p>Waiting for opponent to bet...</p>
                            )}
                        </div>
                    )}




                    {match.gameCategory && (
                        <p className="game__variant">
                            Best of {match.gameCategory.numberOfRounds} · {match.gameCategory.gameRules} · {match.gameCategory.timeController}s total time
                        </p>
                    )}
                </div>
                <aside className="game__comments">
                    <CommentList comments={comments} />
                    {user
                        ? <CommentForm targetId={match._id} targetType="match" onCommentAdded={fetchComments} />
                        : <>
                            <p className="greeting--game">You need to log in to leave a comment</p>
                            <div className="greeting greeting--game">
                                <Link className="greeting__button" to="/login">Login</Link>
                                <Link className="greeting__button" to="/register">Register</Link>
                            </div>
                        </>
                    }
                </aside>
            </div>
        </>
    );
}