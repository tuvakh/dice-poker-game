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

function refreshUserStats(userId, updateUserData) {
    getUser(userId).then(freshUser => updateUserData({
        coins: freshUser.coins,
        eloRating: freshUser.eloRating
    }));
}

export default function Game() {
    const navigate = useNavigate();
    const location = useLocation();
    const { id } = useParams();
    const { user, updateUserData } = useAuth();
    const tournamentId = location.state?.tournamentId ?? null;
    const { preferences } = useAppearance();
    const { playClick, playJoin, playHold, playRoundEnd } = useSoundEffects();

    const [match, setMatch] = useState(null);
    const [comments, setComments] = useState([]);
    const [error, setError] = useState(null);

    const hasJoined = useRef(false);
    const wsRef = useRef(null);
    const boardRef = useRef(null);
    const matchRef = useRef(null);
    const timerRef = useRef(null);

    const [gamePhase, setGamePhase] = useState(null);
    const [readySent, setReadySent] = useState(false);
    const [timeLeft, setTimeLeft] = useState(null);
    const [bettingState, setBettingState] = useState(null);

    const [standings, setStandings] = useState(null);
    const [forfeitBy, setForfeitBy] = useState(null);
    const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

    const [readyTimeLeft, setReadyTimeLeft] = useState(null);
    const [timedOut, setTimedOut] = useState(false);
    const [canRoll, setCanRoll] = useState(false);
    const [roundResult, setRoundResult] = useState(null);
    const readyTimerRef = useRef(null);
    const rollCountRef = useRef(0);

    const [betTimeLeft, setBetTimeLeft] = useState(null);
    const betTimerRef = useRef(null);
    const [betTimedOut, setBetTimedOut] = useState(false);

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


    async function fetchComments() {
        const matchId = matchRef.current?._id;
        if (!matchId) return;
        try {
            const data = await getAllComments({ targetId: matchId, targetType: "match", limit: 100 });
            setComments(data.commentList);
        } catch {}
    }

    function handleReady() {
        wsRef.current?.send(JSON.stringify({ type: 'ready' }));
        setReadySent(true);
    }

    function sendBet(action, amount = 0) {
        clearInterval(betTimerRef.current);
        setBetTimeLeft(null);
        wsRef.current?.send(JSON.stringify({ type: 'bet', action, amount }));
    }

    const handleLeave = async () => {
        if (!user || !match) return;
        if (match.status === 'ongoing') {
            wsRef.current?.close();
            navigate('/');
            return;
        }
        try {
            await leaveMatch(match.matchId);
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

    function handleServerMessage(message) {
        const board = boardRef.current;

        if (message.type === 'ready-timeout') {
            clearInterval(readyTimerRef.current);
            setReadyTimeLeft(null);
            setGamePhase('cancelled');
        }

        if (message.type === 'all-joined') {
            playJoin();
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

        if (message.type === 'player-disconnected') {
            boardRef.current?.showPlayerLeft(message.userId);
        }

        if (message.type === 'game-started') {
            clearInterval(readyTimerRef.current);
            setReadyTimeLeft(null);
            setRoundResult(null);
            setCanRoll(true);
            rollCountRef.current = 0;
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

        if (message.type === 'roll-result') {
            if (board) {
                board.setDice(user?._id, message.yourDice, true);
            }
            rollCountRef.current += 1;
            if (rollCountRef.current >= 3) boardRef.current?.handleDoneRolling();
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
                setCanRoll(false);
            }
        }

        if (message.type === 'betting-start') {
            setGamePhase('betting');
            clearInterval(timerRef.current);
            setTimeLeft(null);
            setBettingState({ currentBettor: message.currentBettor, pot: message.pot, highestBet: 0, yourStack: message.stacks?.[user?._id] ?? match?.coinWager ?? 0 });
            if (message.currentBettor === user?._id) startBetTimer();
        }

        if (message.type === 'next-bettor') {
            setBettingState(prev => ({ ...prev, currentBettor: message.currentBettor, yourStack: message.stacks?.[user?._id] ?? prev.yourStack }));
            if (message.currentBettor === user?._id) {
                startBetTimer();
            } else {
                clearInterval(betTimerRef.current);
                setBetTimeLeft(null);
            }
        }

        if (message.type === 'player-bet') {
            setBettingState(prev => ({ ...prev, pot: message.pot, highestBet: message.amount }));
        }

        if (message.type === 'player-matched') {
            setBettingState(prev => ({ ...prev, pot: message.pot }));
        }

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

        if (message.type === 'new-comment') {
            setComments(prev => [...prev, message.comment]);
        }

        if (message.type === 'game-end') {
            setGamePhase('ended');
            playRoundEnd();
            setStandings(message.standings);
            if (user) refreshUserStats(user.userId, updateUserData);
            if (message.forfeitBy) setForfeitBy(message.forfeitBy);
        }
    }

    usePolling(fetchMatch, 5000, match?.status !== "ongoing");

    useEffect(() => {
        if (!match || hasJoined.current || !user) return;

        const isPlayer = match.players.some(player => player?._id === user._id);

        if (!isPlayer && match.status === "waiting") {
            hasJoined.current = true;
            joinMatch(match.matchId).finally(fetchMatch);
        }
    }, [match]);

    useEffect(() => {
        if (!match?._id) return;
        fetchComments();
        const timer = setInterval(fetchComments, 5000);
        return () => clearInterval(timer);
    }, [match?._id]);

    useEffect(() => {
        if (!match || match.status !== 'ongoing') return;
        if (!user || !match.players.some(player => String(player?._id ?? player) === String(user._id))) return;

        if (match.coinWager > 0) refreshUserStats(user.userId, updateUserData);

        const ws = new WebSocket(
            import.meta.env.VITE_WS_URL
        );
        wsRef.current = ws;

        ws.onopen = () => {
            const requiredPlayers = match.maxPlayers ?? 2;

            ws.send(JSON.stringify({
                type: 'join',
                matchId: String(match.matchId),
                matchObjectId: match._id,
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

        return () => ws.close();
    }, [match?.status]);

    useEffect(() => {
        const board = boardRef.current;
        if (!board) return;

        function onDoneRolling() {
            wsRef.current?.send(JSON.stringify({ type: 'done-rolling' }));
        }

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

    useEffect(() => {
        return () => {
            if (matchRef.current?.status === 'waiting' && user) {
                leaveMatch(matchRef.current.matchId).catch(() => { });
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
    const infoBarContent = match.gameCategory && (
        <>
            <span>{match.gameCategory.timeController}s · {match.gameCategory.numberOfRounds} rounds · {match.gameCategory.gameRules === 'straights_allowed' ? 'Straights allowed' : 'No straights'}</span>
            <strong>Pot: {displayPot} {displayPot === 1 ? 'coin' : 'coins'}</strong>
        </>
    );

    return (
        <>
            {!user && match.status === 'ongoing' && (
                <div className="spectator-banner">
                    <p>You&apos;re spectating. <Link to="/login">Log in</Link> or <Link to="/register">register</Link> to play.</p>
                </div>
            )}
            <div className="game">
                <div className="game__main">
                    {(match.status === 'waiting' || gamePhase === 'ready' || isPreGame) && (
                        <div className="game__players">
                            {match.players.filter(Boolean).map(player =>
                                <PlayerInfo key={player._id} user={player} showImage inline />
                            )}
                        </div>
                    )}

                    {!isPreGame && match.status !== 'waiting' && match.gameCategory && gamePhase !== 'ended' && gamePhase !== 'cancelled' && (
                        <div className="game__info-bar game__info-bar--standalone">
                            {infoBarContent}
                        </div>
                    )}

                    <div className="game__game-board" style={{ backgroundColor: preferences.boardColor }}>
                        {(match.status === 'waiting' || isPreGame) && match.gameCategory && (
                            <div className="game__info-bar">
                                {infoBarContent}
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
                                {tournamentId ? (
                                    <Button onClick={() => navigate(`/tournament/${tournamentId}`)}>Back to tournament</Button>
                                ) : (
                                    <Button onClick={() => navigate('/')}>Back to homepage</Button>
                                )}
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
