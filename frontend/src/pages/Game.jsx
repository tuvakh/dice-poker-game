import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router";

import { getMatch, leaveMatch, joinMatch } from "../api/matches.js";
import { getAllComments } from "../api/comments.js";
import { getUser } from '../api/users.js';

import { usePolling } from "../hooks/usePolling.js";

import { useAuth } from "../contexts/AuthContext.jsx";
import { useAppearance } from "../contexts/AppearanceContext.jsx";
import { useSoundEffects } from "../hooks/useSoundEffects.js"; 

import Spinner from "../components/Spinner.jsx";
import BettingControls from "../components/BettingControls.jsx";
import CommentList from "../components/CommentList";
import CommentForm from "../components/CommentForm";
import PlayerInfo from "../components/PlayerInfo";
import '../components/dice-poker-board.js';
import '../components/dice-poker-die.js';

// The individual game page shows players, game board, and comments sidebar
export default function Game() {
    const navigate = useNavigate();
    const { id } = useParams();
    const { user, updateUserData } = useAuth();
    const { preferences } = useAppearance();
    const { playClick, playJoin, playHold, playRoundEnd } = useSoundEffects();

    // Match data fetched from the backend and comments loaded for the sidebar
    const [match, setMatch] = useState(null);
    const [comments, setComments] = useState([]);
    const [error, setError] = useState(null);

    // Refs persist across renders without triggering re-renders
    // hasJoined prevents the auto-join effect from running twice
    // wsRef holds the WebSocket connection so other handlers can send messages
    // boardRef points at the dice-poker-board web component
    // matchRef is a live copy of match used inside WebSocket callbacks that close over stale state
    // timerRef holds the countdown interval so we can clear it when the round ends
    const hasJoined = useRef(false);
    const wsRef = useRef(null);
    const boardRef = useRef(null);
    const matchRef = useRef(null);
    const timerRef = useRef(null);

    // gamePhase tracks which screen to show: null, 'ready', 'rolling', 'betting', 'ended', 'cancelled'
    // readySent prevents showing the Ready button again after the player clicks it
    // timeLeft counts down the rolling timer displayed to the player
    // bettingState holds the current pot, highest bet, and whose turn it is
    const [gamePhase, setGamePhase] = useState(null);
    const [readySent, setReadySent] = useState(false);
    const [timeLeft, setTimeLeft] = useState(null);
    const [bettingState, setBettingState] = useState(null);

    // standings is the final score list shown after the game ends
    // forfeitBy is the userId of a player who disconnected mid-game, triggering a forfeit
    // playerLeftNotice is a non-critical notice shown while the game is still running
    const [standings, setStandings] = useState(null);
    const [forfeitBy, setForfeitBy] = useState(null);
    const [playerLeftNotice, setPlayerLeftNotice] = useState(null);

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

    // Sends 'ready' to the server and prevents the ready button from showing again
    function handleReady() {
        wsRef.current?.send(JSON.stringify({ type: 'ready' }));
        setReadySent(true);
    }

    // Sends a betting action (fold / match / bet) to the server
    function sendBet(action, amount = 0) {
        wsRef.current?.send(JSON.stringify({ type: 'bet', action, amount }));
    }

    // Closes the WebSocket if the game is ongoing (triggers forfeit), or calls the REST leave endpoint if still waiting
    const handleLeave = async () => {
        if (!user || !match) return;
        if (match.status === 'ongoing') {
            wsRef.current?.close();
            navigate('/');
            return;
        }
        try {
            await leaveMatch(match.matchId, user._id);
            navigate('/');
        } catch (err) {
            setError(err.message);
        }
    };

    // Routes incoming WebSocket messages to the right board action
    function handleServerMessage(message) {
        const board = boardRef.current;

        // Someone didn't click ready in time: cancel the game
        if (message.type === 'ready-timeout') {
            setGamePhase('cancelled');
        }

        // All required players have joined: show the Ready button
        if (message.type === 'all-joined') {
            setGamePhase('ready');
            playJoin(); // Chanya
        }

        // A player disconnected mid-game: show a notice so the remaining player knows
        if (message.type === 'player-disconnected') {
            setPlayerLeftNotice(message.userId);
        }

        // A new round started: start the countdown timer and initialise the board
        if (message.type === 'game-started') {
            setGamePhase('rolling');
            playClick(); // Chanya
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

                // message.players is the server's authoritative list — loop it to add each player to the board
                message.players.forEach(playerId => {
                    const playerData = currentPlayers.find(player => player?._id === playerId);
                    board.addPlayer(playerId, playerData?.username ?? playerId);
                    if (playerId !== user?._id) {
                        board.setDice(playerId, ['?', '?', '?', '?', '?'], true);
                    }
                });

                board.currentUserId = user?._id;
                board.setDice(user?._id, message.yourDice, true);
                board.setInteractive(user?._id, true);
                board.clearResults();
                board.resetAllHeld();
            }
        }

        // Server re-rolled our non-held dice: update our board (die component plays its own sound)
        if (message.type === 'roll-result') {
            if (board) {
                board.setDice(user?._id, message.yourDice);
            }
        }

        // Another player re-rolled: show which of their dice are held (not the actual faces)
        if (message.type === 'player-rolled') {
            if (board && message.userId !== user?._id && message.held) {
                board.setHeld(message.userId, message.held);
            }
        }

        // We clicked Done Rolling: disable our dice and stop the timer
        if (message.type === 'player-done-rolling') {
            if (message.userId === user?._id) {
                boardRef.current?.setInteractive(user._id, false);
                clearInterval(timerRef.current);
                setTimeLeft(null);
            }
        }

        // Rolling is over for everyone: switch to betting phase
        if (message.type === 'betting-start') {
            setGamePhase('betting');
            clearInterval(timerRef.current);
            setTimeLeft(null);
            setBettingState({ currentBettor: message.currentBettor, pot: message.pot, highestBet: 0, yourStack: message.stacks?.[user?._id] ?? 0 });
        }

        // It's now a different player's turn to bet
        if (message.type === 'next-bettor') {
            setBettingState(prev => ({ ...prev, currentBettor: message.currentBettor, yourStack: message.stacks?.[user?._id] ?? prev.yourStack }));
        }

        // Someone placed a bet: update the pot and highest bet
        if (message.type === 'player-bet') {
            setBettingState(prev => ({ ...prev, pot: message.pot, highestBet: Math.max(prev.highestBet, message.amount) }));
        }

        // Someone matched the current bet: update the pot
        if (message.type === 'player-matched') {
            setBettingState(prev => ({ ...prev, pot: message.pot }));
        }

        // Round finished: play the end sound, reveal all dice and show hand results
        if (message.type === 'round-end') {
            playRoundEnd();
            setGamePhase(null);

            if (board) {
                for (const [userId, faces] of Object.entries(message.reveal)) {
                    board.setDice(userId, faces);
                }
                for (const [userId, hand] of Object.entries(message.hands)) {
                    board.showResult(userId, hand.handType, message.winners.includes(userId));
                }
            }
        }

        // A new comment was posted: append it without re-fetching
        if (message.type === 'new-comment') {
            setComments(prev => [...prev, message.comment]);
        }

        // Game over: show standings and refresh coins/ELO
        if (message.type === 'game-end') {
            setGamePhase('ended');
            playJoin(); // Chanya
            setStandings(message.standings);
            if (user) {
                getUser(user.userId).then(freshUser => updateUserData({
                    coins: freshUser.coins,
                    eloRating: freshUser.eloRating
                }));
            }
            if (message.forfeitBy) setForfeitBy(message.forfeitBy);
        }
    }

    // Poll the match every 5 seconds to check if someone joined
    usePolling(fetchMatch, 5000);

    // Auto-join the match once if the logged-in user isn't already a player
    useEffect(() => {
        if (!match || hasJoined.current || !user) return;

        const isPlayer = match.players.some(player => player?._id === user._id);

        if (!isPlayer && match.status === "waiting") {
            hasJoined.current = true;
            joinMatch(match.matchId, user._id).finally(fetchMatch);
        }
    }, [match]);

    // Refetch comments whenever the match updates
    useEffect(() => {
        fetchComments();
    }, [match]);

    // Opens the WebSocket connection once the match status becomes 'ongoing', and runs exactly once
    // The cleanup (return) closes the socket when the component unmounts or status changes
    useEffect(() => {
        if (!match || match.status !== 'ongoing') return;

        // Refresh coin balance immediately when entering an ongoing wager game
        if (match.coinWager > 0 && user) {
            getUser(user.userId).then(freshUser => updateUserData({
                coins: freshUser.coins,
                eloRating: freshUser.eloRating
            }));
        }

        // Connect to the WebSocket server
        const ws = new WebSocket('ws://localhost:3000');
        wsRef.current = ws;

        ws.onopen = () => {
            const requiredPlayers = match.maxPlayers ?? 2;

            // Join the game room
            ws.send(JSON.stringify({
                type: 'join',
                matchId: String(match.matchId),
                matchObjectId: match._id,
                userId: user?._id,
                requiredPlayers,
                totalRounds: match.gameCategory?.numberOfRounds ?? 3,
                timeController: match.gameCategory?.timeController ?? 10,
                coinWager: match.coinWager ?? 0,
                gameRules: match.gameCategory?.gameRules ?? 'straights_allowed'
            }));
        };

        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            handleServerMessage(message);
        };

        // Close the connection when leaving the page
        return () => ws.close();
    }, [match?.status]);

    // Re-registers board event listeners every time gamePhase changes
    useEffect(() => {
        const board = boardRef.current;
        if (!board) return;

        function onDoneRolling() {
            wsRef.current?.send(JSON.stringify({ type: 'done-rolling' }));
        }

        // dp:roll-again fires when the player picks which dice to hold and clicks roll
        // playHold gives a soft click so the player knows their hold was registered
        function onRollAgain(event) {
            playHold();
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

    // Empty dependency array means this only runs on unmount. It catches browser back-button and tab-close
    // Calls leaveMatch so the player slot is freed if they navigate away before the game starts
    useEffect(() => {
        return () => {
            if (matchRef.current?.status === 'waiting' && user) {
                leaveMatch(matchRef.current.matchId, user._id).catch(() => { });
            }
        };
    }, []);

    if (error) return <p className="status status--error">{error}</p>;
    if (!match) return <Spinner />;

    return (
        <>
            {!user && (
                <div className="spectator-banner">
                    <p>You&apos;re spectating. <Link to="/login">Log in</Link> or <Link to="/register">register</Link> to play.</p>
                </div>
            )}
            <div className="game">
                <div className="game__main">
                    <div className="game__players">
                        {match.players.filter(Boolean).map(player => (
                            <PlayerInfo key={player._id} user={player} showImage />
                        ))}
                    </div>
                    <div className="game__game-board" style={{ backgroundColor: preferences.boardColor }}>
                        {match.status === "waiting" && (
                            <div className="game__waiting-overlay">
                                {user ? (
                                    <>
                                        <p>Waiting for other players to join...</p>
                                        <p className="game__waiting-count">{match.players.length}/{match.maxPlayers ?? 2} players</p>
                                        {match.players.some(player => player?._id === user._id) && (
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

                        {match.status === "ongoing" && gamePhase !== 'ended' && !forfeitBy && (
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
                                {user && match.players.some(player => player?._id === user._id) && (
                                    <button onClick={handleLeave}>Leave game</button>
                                )}
                                {playerLeftNotice && (
                                    <p className="status status--error">
                                        {match.players.find(player => player?._id === playerLeftNotice)?.username ?? 'Opponent'} left — their moves are now automatic
                                    </p>
                                )}

                            </>
                        )}


                        {match.status === "finished" && !gamePhase && (
                            <div className="game__ended">
                                <h2>Game over</h2>
                                {match.outcome && <p>Result: {match.outcome}</p>}
                            </div>
                        )}

                        {(gamePhase === 'ended' || gamePhase === 'cancelled' || forfeitBy) && (
                            <div className="game__ended">
                                <h2>Game over</h2>
                                {gamePhase === 'cancelled' && <p>Not all players were ready in time.</p>}
                                {forfeitBy && (
                                    <p>{match.players.find(player => player?._id === forfeitBy)?.username ?? 'Opponent'} left the game</p>
                                )}
                                {standings && (
                                    <ol className="game__standings">
                                        {standings.map((entry, i) => {
                                            const playerName = match.players.find(matchPlayer => matchPlayer?._id === entry.userId)?.username;
                                            return (
                                                <li key={entry.userId}>
                                                    {i === 0 && '🏆 '}{playerName} — {entry.stack} coins
                                                </li>
                                            );
                                        })}
                                    </ol>
                                )}
                                <button onClick={() => navigate('/')}>Back to home</button>
                            </div>
                        )}
                    </div>

                    {gamePhase === 'betting' && bettingState && !forfeitBy && (
                        <div className="game__betting">
                            <p className="game__pot">Pot: {bettingState.pot} coins</p>
                            <BettingControls
                                bettingState={bettingState}
                                userId={user?._id}
                                coinWager={match.coinWager}
                                onBet={sendBet}
                            />
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
            </div >
        </>
    );
}
