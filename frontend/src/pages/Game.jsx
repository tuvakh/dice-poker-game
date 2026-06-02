import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router";

import { getMatch, leaveMatch, joinMatch } from "../api/matches.js";
import { getAllComments } from "../api/comments.js";
import { getUser } from '../api/users.js';

import { usePolling } from "../hooks/usePolling.js";

import { useAuth } from "../contexts/AuthContext.jsx";
import { useAppearance } from "../contexts/AppearanceContext.jsx";
import { useSoundEffects } from "../hooks/useSoundEffects.js";

import Button from "../components/Button.jsx";
import Spinner from "../components/Spinner.jsx";
import BettingControls from "../components/BettingControls.jsx";
import CommentList from "../components/CommentList";
import CommentForm from "../components/CommentForm";
import PlayerInfo from "../components/PlayerInfo";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import '../components/dice-poker-board.js';
import '../components/dice-poker-die.js';

// The individual game page shows players, game board, and comments sidebar
export default function Game() {
    const navigate = useNavigate();
    const location = useLocation();
    const { id } = useParams();
    const { user, updateUserData } = useAuth();
    // tournamentId is passed via navigation state when coming from a tournament page
    const tournamentId = location.state?.tournamentId ?? null;
    const { preferences } = useAppearance();
    const { playClick, playJoin, playHold } = useSoundEffects();

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
    const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

    const [readyTimeLeft, setReadyTimeLeft] = useState(null);
    const [timedOut, setTimedOut] = useState(false);
    const [canRoll, setCanRoll] = useState(false);
    const [roundResult, setRoundResult] = useState(null);
    const readyTimerRef = useRef(null);
    const [rollCount, setRollCount] = useState(0);

    const [betTimeLeft, setBetTimeLeft] = useState(null);
    const betTimerRef = useRef(null);
    const [betTimedOut, setBetTimedOut] = useState(false);

    // Fetches the latest match data from the backend
    // signal comes from usePolling's AbortController so cancelled requests don't update state
    async function fetchMatch(signal) {
        try {
            const data = await getMatch(id, signal);
            setMatch(data);
            matchRef.current = data;
            setError(null);
        } catch (err) {
            if (err?.name === "AbortError") return;
            setError("Failed to load game. Please try again.");
        }
    }

    // Fetches all comments for this match.
    // Uses matchRef.current instead of match so the setInterval closure never goes stale.
    async function fetchComments() {
        const matchId = matchRef.current?._id;
        if (!matchId) return;
        try {
            const data = await getAllComments({ targetId: matchId, targetType: "match", limit: 100 });
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
        clearInterval(betTimerRef.current);
        setBetTimeLeft(null);
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

    function startBetTimer() {
        clearInterval(betTimerRef.current);
        setBetTimeLeft(10);
        setBetTimedOut(false);
        let countdown = 10;
        betTimerRef.current = setInterval(() => {
            countdown -= 1;
            setBetTimeLeft(countdown);
            if (countdown <= 0) {
                clearInterval(betTimerRef.current);
                setBetTimedOut(true);
                sendBet('match');
            }
        }, 1000);
    }

    // Routes incoming WebSocket messages to the right board action
    function handleServerMessage(message) {
        const board = boardRef.current;

        // Someone didn't click ready in time: cancel the game
        if (message.type === 'ready-timeout') {
            clearInterval(readyTimerRef.current);
            setReadyTimeLeft(null);
            setGamePhase('cancelled');
        }

        // All required players have joined: show the Ready button
        if (message.type === 'all-joined') {
            setGamePhase('ready');
            setReadyTimeLeft(30);
            readyTimerRef.current = setInterval(() => {
                setReadyTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(readyTimerRef.current);
                        setGamePhase('cancelled');
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }

        // A player disconnected mid-game: show a notice so the remaining player knows
        if (message.type === 'player-disconnected') {
            setPlayerLeftNotice(message.userId);
            boardRef.current?.showPlayerLeft(message.userId);
        }

        // A new round started: start the countdown timer and initialise the board
        if (message.type === 'game-started') {
            clearInterval(readyTimerRef.current);
            setReadyTimeLeft(null);
            setRoundResult(null);
            setCanRoll(true);
            setRollCount(0);
            setTimedOut(false);
            setGamePhase('rolling');
            playClick();
            clearInterval(timerRef.current);
            setTimeLeft(message.timeRemaining);
            timerRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current);
                        setTimedOut(true);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            if (board) {
                const currentPlayers = matchRef.current?.players ?? match.players;

                // message.players is the server's authoritative list — loop it to add each player to the board
                message.players.forEach(playerId => {
                    const playerData = currentPlayers.find(player => String(player?._id ?? player) === String(playerId));
                    board.addPlayer(playerId, playerData?.username ?? playerId);
                    if (playerId !== user?._id) {
                        board.setDice(playerId, ['?', '?', '?', '?', '?']);
                    }
                });

                board.currentUserId = user?._id;
                board.setDice(user?._id, message.yourDice);
                board.setInteractive(user?._id, true);
                board.clearResults();
                board.resetAllHeld();
            }
        }

        // Server re-rolled our non-held dice: update our board (die component plays its own sound)
        if (message.type === 'roll-result') {
            if (board) {
                board.setDice(user?._id, message.yourDice, true);
            }
            setRollCount(prev => {
                if (prev + 1 >= 3) boardRef.current?.handleDoneRolling();
                return prev + 1;
            });
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
                setCanRoll(false);
            }
        }

        // Rolling is over for everyone: switch to betting phase
        if (message.type === 'betting-start') {
            setGamePhase('betting');
            clearInterval(timerRef.current);
            setTimeLeft(null);
            setBettingState({ currentBettor: message.currentBettor, pot: message.pot, highestBet: 0, yourStack: message.stacks?.[user?._id] ?? 0 });
            if (message.currentBettor === user?._id) startBetTimer();
        }

        // Someone placed a bet: update the pot and highest bet
        if (message.type === 'next-bettor') {
            setBettingState(prev => ({ ...prev, currentBettor: message.currentBettor, yourStack: message.stacks?.[user?._id] ?? prev.yourStack }));
            if (message.currentBettor === user?._id) {
                startBetTimer();
            } else {
                clearInterval(betTimerRef.current);
                setBetTimeLeft(null);
            }
        }

        // Someone matched the current bet: update the pot
        if (message.type === 'player-matched') {
            setBettingState(prev => ({ ...prev, pot: message.pot }));
        }

        // Round finished: play the end sound, reveal all dice and show hand results
        if (message.type === 'round-end') {
            clearInterval(betTimerRef.current);
            setBetTimeLeft(null);
            setRoundResult(message.winners.includes(user?._id) ? 'won' : 'lost');
            setCanRoll(false);
            setGamePhase(null);
            setBetTimedOut(false);

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
            playJoin();
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

    // Poll only while waiting — once WebSocket takes over for ongoing games, stop polling
    usePolling(fetchMatch, 5000, match?.status !== "ongoing");

    // Auto-join the match once if the logged-in user isn't already a player
    useEffect(() => {
        if (!match || hasJoined.current || !user) return;

        const isPlayer = match.players.some(player => player?._id === user._id);

        if (!isPlayer && match.status === "waiting") {
            hasJoined.current = true;
            joinMatch(match.matchId, user._id).finally(fetchMatch);
        }
    }, [match]);

    // Poll comments on their own 5-second cycle, independent of match polling or WebSocket status
    useEffect(() => {
        if (!match?._id) return;
        fetchComments();
        const timer = setInterval(fetchComments, 5000);
        return () => clearInterval(timer);
    }, [match?._id]);

    // Opens the WebSocket connection once the match status becomes 'ongoing', and runs exactly once
    // The cleanup (return) closes the socket when the component unmounts or status changes
    useEffect(() => {
        if (!match || match.status !== 'ongoing') return;
        if (!user || !match.players.some(player => String(player?._id ?? player) === String(user._id))) return;

        // Refresh coin balance immediately when entering an ongoing wager game
        if (match.coinWager > 0) {
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

    const displayPot = bettingState?.pot ?? match?.coinWager ?? 0;
    const isPreGame = match?.status === 'ongoing' && gamePhase === null && !roundResult && !forfeitBy;
    const sortedStandings = standings ? [...standings].sort((standingA, standingB) => {
        if (standingB.stack !== standingA.stack) return standingB.stack - standingA.stack;
        return (standingB.roundWins ?? 0) - (standingA.roundWins ?? 0);
    }) : [];
    const topStanding = sortedStandings[0];
    const isTie = sortedStandings.filter(entry => entry.stack === topStanding?.stack && (entry.roundWins ?? 0) === (topStanding?.roundWins ?? 0)).length > 1;
    const isWinner = topStanding?.userId === user?._id;

    if (error) return <p className="status status--error">{error}</p>;
    if (!match) return <Spinner />;

    const isPlayer = !!user && match.players.some(player => player?._id === user._id);

    return (
        <>
            {!user && (
                <div className="spectator-banner">
                    <p>You&apos;re spectating. <Link to="/login">Log in</Link> or <Link to="/register">register</Link> to play.</p>
                </div>
            )}
            <div className="game">
                <div className="game__main">
                    {/* Player cards only shown while waiting */}
                    {(match.status === 'waiting' || gamePhase === 'ready' || isPreGame) && (
                        <div className="game__players">
                            {match.players.filter(Boolean).map(player =>
                                <PlayerInfo key={player._id} user={player} showImage inline />
                            )}
                        </div>
                    )}

                    {!isPreGame && match.status !== 'waiting' && match.gameCategory && gamePhase !== 'ended' && gamePhase !== 'cancelled' && (
                        <div className="game__info-bar game__info-bar--standalone">
                            <span>{match.gameCategory.timeController}s · {match.gameCategory.numberOfRounds} rounds · {match.gameCategory.gameRules === 'straights_allowed' ? 'Straights allowed' : 'No straights'}</span>
                            <strong>Pot: {displayPot} {displayPot === 1 ? 'coin' : 'coins'}</strong>
                        </div>
                    )}

                    <div className="game__game-board" style={{ backgroundColor: preferences.boardColor }}>
                        {/* Info bar inside the box only when waiting */}
                        {(match.status === 'waiting' || isPreGame) && match.gameCategory && (
                            <div className="game__info-bar">
                                <span>{match.gameCategory.timeController}s · {match.gameCategory.numberOfRounds} rounds · {match.gameCategory.gameRules === 'straights_allowed' ? 'Straights allowed' : 'No straights'}</span>
                                <strong>Pot: {displayPot} {displayPot === 1 ? 'coin' : 'coins'}</strong>
                            </div>
                        )}

                        {isPreGame && (
                            <div className="game__waiting-overlay">
                                <p>Starting game...</p>
                            </div>
                        )}

                        {match.status === 'waiting' && (
                            <div className="game__waiting-overlay">
                                {user ? (
                                    <>
                                        <p>Waiting for {(match.maxPlayers ?? 2) - match.players.length} more opponents....</p>
                                        {isPlayer && (
                                            <Button onClick={handleLeave}>
                                                {match.players.length === 1 ? 'Cancel game' : 'Leave game'}
                                            </Button>
                                        )}
                                    </>
                                ) : (
                                    <p>Want to join? <Link to="/login">Log in</Link> first.</p>
                                )}
                            </div>
                        )}

                        {match.status === 'ongoing' && gamePhase !== 'ended' && !forfeitBy && (
                            <>
                                {gamePhase === 'rolling' && timeLeft !== null && (
                                    <p className="game__timer">⏱ {timeLeft}s</p>
                                )}
                                {gamePhase === 'ready' && (
                                    <div className="game__ready-overlay">
                                        {readyTimeLeft !== null && (
                                            <span className="game__ready-timer">{readyTimeLeft}s</span>
                                        )}
                                        <h2 className="game__ready-title">READY?</h2>
                                        <div className="game__ready-buttons">
                                            <Button
                                                className={`game__ready-yes${readySent ? ' game__ready-yes--confirmed' : ''}`}
                                                onClick={handleReady}
                                                disabled={readySent}
                                            >
                                                YES!
                                            </Button>
                                            <Button variant="plain" onClick={handleLeave}>Leave game</Button>
                                        </div>
                                        {readySent && (
                                            <p className="game__ready-waiting">Waiting for opponents to be ready...</p>
                                        )}
                                    </div>
                                )}
                                <dice-poker-board ref={boardRef}></dice-poker-board>
                            </>
                        )}

                        {match.status === 'finished' && !gamePhase && (
                            <div className="game__ended">
                                <h2>Game over</h2>
                            </div>
                        )}

                        {(gamePhase === 'ended' || gamePhase === 'cancelled' || forfeitBy) && (
                            <div className="game__ended">
                                {standings ? (
                                    <>
                                        <h2 className="game__ended-title">
                                            {isTie ? "IT'S A TIE!" : isWinner ? 'YOU WON!' : 'YOU LOST!'}
                                        </h2>

                                        <ol className="game__standings">
                                            {sortedStandings.map((entry, i) => {
                                                const playerName = match.players.find(player => player?._id === entry.userId)?.username ?? 'Unknown';
                                                const isMe = entry.userId === user?._id;
                                                const isTopEntry = entry.stack === topStanding?.stack && (entry.roundWins ?? 0) === (topStanding?.roundWins ?? 0);
                                                const coinDisplay = entry.stack >= 0
                                                    ? `+${entry.stack} coin${entry.stack !== 1 ? 's' : ''}`
                                                    : `-${Math.abs(entry.stack)} coin${Math.abs(entry.stack) !== 1 ? 's' : ''}`;
                                                return (
                                                    <li key={entry.userId} className={isMe ? 'game__standings-me' : ''}>
                                                        {i + 1}. {isTopEntry && !isTie && '🎉 '}{playerName} {coinDisplay}
                                                    </li>
                                                );
                                            })}

                                        </ol>
                                    </>
                                ) : (
                                    gamePhase === 'cancelled' && <p>Not all players were ready in time.</p>
                                )}
                                {tournamentId && (
                                    <Button onClick={() => navigate(`/tournament/${tournamentId}`)}>Back to tournament</Button>
                                )}
                                <Button onClick={() => navigate('/')}>Back to homepage</Button>
                            </div>
                        )}
                    </div>

                    {roundResult && gamePhase !== 'ended' && (
                        <p className={`game__round-result game__round-result--${roundResult}`}>
                            You {roundResult} this round!
                        </p>
                    )}

                    {gamePhase === 'rolling' && (
                        <div className="game__roll-controls">
                            {!canRoll && (
                                <p className="game__ready-waiting">
                                    {timedOut
                                        ? "You've used up the time limit. Waiting for opponents to finish..."
                                        : "Waiting for opponents to finish..."
                                    }
                                </p>
                            )}
                            <div className="game__roll-buttons">
                                {isPlayer && (
                                    <>
                                        <Button variant="plain" disabled={!canRoll} onClick={() => boardRef.current?.handleRollAgain()}>Roll</Button>
                                        <Button variant="plain" disabled={!canRoll} onClick={() => boardRef.current?.handleDoneRolling()}>Done rolling</Button>
                                        <Button variant="plain" onClick={() => setShowLeaveConfirm(true)}>Leave game</Button>
                                    </>
                                )}
                            </div>
                        </div>
                    )}


                    {gamePhase === 'betting' && bettingState && !forfeitBy && (
                        <div className="game__bet-controls">
                            <BettingControls
                                bettingState={bettingState}
                                userId={user?._id}
                                coinWager={match.coinWager}
                                onBet={sendBet}
                                betTimeLeft={betTimeLeft}
                                betTimedOut={betTimedOut}
                            />
                            {isPlayer && (
                                <Button variant="plain" onClick={() => setShowLeaveConfirm(true)}>Leave game</Button>
                            )}
                        </div>
                    )}

                    {match.status === 'ongoing' && gamePhase === null && !isPreGame && !forfeitBy && isPlayer && (
                        <Button variant="plain" className="game__leave-btn" onClick={() => setShowLeaveConfirm(true)}>Leave game</Button>
                    )}
                </div>

                <aside className="game__comments">
                    <CommentList comments={comments} />
                    {user
                        ? <CommentForm targetId={match._id} targetType="match" />
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

            {/* Leave game confirmation popup */}
            {showLeaveConfirm && (
                <ConfirmDialog
                    message={match?.status === 'ongoing'
                        ? "Leaving an ongoing game counts as a forfeit. Are you sure?"
                        : "Are you sure you want to leave this game?"}
                    onConfirm={() => { setShowLeaveConfirm(false); handleLeave(); }}
                    onCancel={() => setShowLeaveConfirm(false)}
                />
            )}
        </>
    );
}
