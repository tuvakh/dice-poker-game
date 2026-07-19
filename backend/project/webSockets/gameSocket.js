import { WebSocketServer } from 'ws';
import { evaluateHand, compareHands, calculateEloDeltas } from '../utils/handEvaluator.js';
import { User } from '../models/User.js';
import { Match } from '../models/Match.js';
import { REVEAL_DELAY_MS } from '../config/constants.js';
import { verifyToken } from '../utils/jwt.js';

const objectIdToRoom = new Map();
const tournamentRooms = new Map();

function broadcastCommentToRoom(roomMap, objectId, comment) {
    const room = roomMap.get(String(objectId));
    if (!room) return;
    const payload = JSON.stringify({ type: 'new-comment', comment });

    room.forEach((client) => {
        if (client.readyState === 1) client.send(payload);
    });
}

export function broadcastMatchComment(matchObjectId, comment) {
    broadcastCommentToRoom(objectIdToRoom, matchObjectId, comment);
}

export function broadcastTournamentComment(tournamentObjectId, comment) {
    broadcastCommentToRoom(tournamentRooms, tournamentObjectId, comment);
}

export default function attachWebSocket(server) {
    const wss = new WebSocketServer({ server });
    
    const rooms = new Map();
    const gameStates = new Map();
    const clients = new Map();
    const rollingTimers = new Map();
    const readyTimers = new Map();
    const tournamentClients = new Map();

    wss.on('connection', (ws, req) => {
        const cookieHeader = req.headers.cookie || '';
        const cookieMatch = cookieHeader.match(/(?:^|;\s*)accessToken=([^;]+)/);
        const token = cookieMatch ? decodeURIComponent(cookieMatch[1]) : null;
        const decoded = token ? verifyToken(token) : null;

        ws.verifiedUserId = decoded?._id ?? null;

        ws.on('message', (data) => {
            let message;
            try {
                message = JSON.parse(data);
            } catch {
                return;
            }

            if (message.type === 'join') {
                const userId = ws.verifiedUserId;
                if (!userId) {
                    ws.send(JSON.stringify({ type: 'error', message: 'Authentication required to join a game' }));
                    return;
                }

                const { matchId } = message;

                if (!rooms.has(matchId)) rooms.set(matchId, new Set());
                rooms.get(matchId).add(ws);

                if (message.matchObjectId) {
                    objectIdToRoom.set(String(message.matchObjectId), rooms.get(matchId));
                }

                clients.set(ws, { matchId, userId });

                if (!gameStates.has(matchId)) {
                    gameStates.set(matchId, {
                        phase: 'waiting',
                        round: 1,
                        totalRounds: message.totalRounds,
                        timeController: message.timeController,
                        gameRules: message.gameRules ?? 'straights_allowed',
                        coinWager: message.coinWager ?? 0,
                        requiredPlayers: message.requiredPlayers,
                        pot: 0,
                        highestBet: 0,
                        players: {}
                    });
                }

                const state = gameStates.get(matchId);
                const isRejoin = !!state.players[userId];

                if (!isRejoin && Object.keys(state.players).length >= state.requiredPlayers) {
                    ws.send(JSON.stringify({ type: 'error', message: 'This game is already full' }));
                    return;
                }

                if (!isRejoin) {
                    state.players[userId] = {
                        dice: [null, null, null, null, null],
                        held: [false, false, false, false, false],
                        rollsLeft: 3,
                        doneRolling: false,
                        ready: false,
                        stack: state.coinWager,
                        bet: 0,
                        folded: false,
                        disconnected: false,
                        timeRemaining: state.timeController * 1000,
                        rollStartTime: null,
                        roundWins: 0
                    };

                    const joinedCount = Object.keys(state.players).length;
                    if (joinedCount === message.requiredPlayers) {
                        broadcast(matchId, { type: 'all-joined' });

                        const readyTimer = setTimeout(() => {
                            broadcast(matchId, { type: 'ready-timeout' });
                            Match.findOneAndDelete({ matchId: Number(matchId) }).catch(() => {});
                            gameStates.delete(matchId);
                            rooms.delete(matchId);
                        }, 60000);
                        readyTimers.set(matchId, readyTimer);
                    }
                } else {
                    state.players[userId].disconnected = false;

                    restorePlayerState(ws, userId, state);

                    if (state.phase === 'rolling' && !state.players[userId].doneRolling) {
                        clearRollingTimer(matchId, userId);
                        state.players[userId].rollStartTime = Date.now();
                        const timer = setTimeout(() => autoCompleteRoll(matchId, userId), state.players[userId].timeRemaining);
                        rollingTimers.set(`${matchId}-${userId}`, timer);
                    }
                }
            }

            if (message.type === 'hold') {
                const client = clients.get(ws);
                if (!client) return;

                const { matchId, userId } = client;
                const state = gameStates.get(matchId);
                if (!state || state.phase !== 'rolling') return;

                const player = state.players[userId];
                if (!player || player.doneRolling || player.rollsLeft <= 0) return;

                if (!Array.isArray(message.held) || message.held.length !== 5) return;

                player.held = message.held;

                const elapsed = player.rollStartTime ? Date.now() - player.rollStartTime : 0;
                
                player.timeRemaining = Math.max(0, player.timeRemaining - elapsed);
                player.rollStartTime = Date.now();

                player.dice = player.dice.map((face, i) => (player.held[i] ? face : rollDice()[i]));
                player.rollsLeft -= 1;

                clearRollingTimer(matchId, userId);
                const timer = setTimeout(() => autoCompleteRoll(matchId, userId), player.timeRemaining);
                rollingTimers.set(`${matchId}-${userId}`, timer);

                ws.send(
                    JSON.stringify({
                        type: 'roll-result',
                        yourDice: player.dice,
                        rollsLeft: player.rollsLeft
                    })
                );

                broadcast(matchId, {
                    type: 'player-rolled',
                    userId,
                    rollsLeft: player.rollsLeft,
                    held: player.held
                });
            }

            if (message.type === 'done-rolling') {
                const client = clients.get(ws);
                if (!client) return;

                const { matchId, userId } = client;
                const state = gameStates.get(matchId);
                if (!state || state.phase !== 'rolling') return;

                const player = state.players[userId];
                if (!player) return;

                player.doneRolling = true;

                const elapsed = player.rollStartTime ? Date.now() - player.rollStartTime : 0;
                player.timeRemaining = Math.max(0, player.timeRemaining - elapsed);

                clearRollingTimer(matchId, userId);

                broadcast(matchId, {
                    type: 'player-done-rolling',
                    userId
                });

                const allDone = Object.values(state.players).every((gamePlayer) => gamePlayer.doneRolling);

                if (allDone) {
                    startBetting(matchId, state);
                }
            }

            if (message.type === 'ready') {
                const client = clients.get(ws);
                if (!client) return;

                const { matchId, userId } = client;
                const state = gameStates.get(matchId);
                if (!state || state.phase !== 'waiting') return;

                const player = state.players[userId];
                if (!player) return;

                player.ready = true;

                const allReady = Object.values(state.players).every((gamePlayer) => gamePlayer.ready);
                if (allReady) {
                    clearTimeout(readyTimers.get(matchId));
                    readyTimers.delete(matchId);
                    startGame(matchId, state);
                }
            }

            if (message.type === 'bet') {
                const client = clients.get(ws);
                if (!client) return;

                const { matchId, userId } = client;
                const state = gameStates.get(matchId);
                if (!state || state.phase !== 'betting') return;
                if (state.currentBettor !== userId) return;

                const { action, amount } = message;
                const player = state.players[userId];

                if (action === 'fold') {
                    player.folded = true;
                    broadcast(matchId, { type: 'player-folded', userId });
                }

                if (action === 'bet' || action === 'raise') {
                    if (!Number.isFinite(amount) || amount <= 0 || amount > player.stack || amount <= state.highestBet) return;
                    player.bet = amount;
                    player.stack -= amount;
                    state.pot += amount;
                    if (amount > state.highestBet) state.highestBet = amount;
                    broadcast(matchId, { type: 'player-bet', userId, amount, pot: state.pot });
                }

                if (action === 'match') {
                    const toMatch = state.highestBet - player.bet;
                    player.bet = state.highestBet;
                    player.stack -= toMatch;
                    state.pot += toMatch;
                    broadcast(matchId, { type: 'player-matched', userId, pot: state.pot });
                }

                state.bettorsActed.add(userId);
                advanceBetting(matchId, state);
            }

            if (message.type === 'join-tournament') {
                const key = String(message.tournamentObjectId);
                if (!tournamentRooms.has(key)) tournamentRooms.set(key, new Set());
                tournamentRooms.get(key).add(ws);
                tournamentClients.set(ws, key);
            }
        });

        ws.on('close', () => {
            const client = clients.get(ws);
            if (client) {
                const { matchId, userId } = client;
                const room = rooms.get(matchId);
                if (room) {
                    room.delete(ws);
                    if (room.size === 0) rooms.delete(matchId);
                }
                clients.delete(ws);

                const state = gameStates.get(matchId);
                if (!state) return;

                if (state.phase === 'waiting') {
                    state.forfeitBy = userId;
                    delete state.players[userId];
                    broadcast(matchId, { type: 'player-disconnected', userId });
                    endGame(matchId, state);
                } else {
                    state.players[userId].disconnected = true;
                    broadcast(matchId, { type: 'player-disconnected', userId });

                    if (state.phase === 'betting' && state.currentBettor === userId) {
                        const player = state.players[userId];
                        const toMatch = state.highestBet - player.bet;
                        player.bet = state.highestBet;
                        player.stack -= toMatch;
                        state.pot += toMatch;
                        state.bettorsActed.add(userId);
                        broadcast(matchId, { type: 'player-matched', userId, pot: state.pot });
                        advanceBetting(matchId, state);
                    }

                    if (state.phase === 'rolling' && !state.players[userId].doneRolling) {
                        clearRollingTimer(matchId, userId);
                        autoCompleteRoll(matchId, userId);
                    }
                }
            }

            const tournamentKey = tournamentClients.get(ws);
            if (tournamentKey) {
                const room = tournamentRooms.get(tournamentKey);
                if (room) {
                    room.delete(ws);
                    if (room.size === 0) tournamentRooms.delete(tournamentKey);
                }
                tournamentClients.delete(ws);
            }
        });
    });

    function broadcast(matchId, data) {
        const room = rooms.get(matchId);
        if (!room) return;
        const message = JSON.stringify(data);
        for (const client of room) {
            client.send(message);
        }
    }

    function clearRollingTimer(matchId, userId) {
        const key = `${matchId}-${userId}`;
        clearTimeout(rollingTimers.get(key));
        rollingTimers.delete(key);
    }

    function rollDice() {
        const faces = ['7', '8', 'J', 'Q', 'K', 'A'];
        return Array.from({ length: 5 }, () => faces[Math.floor(Math.random() * faces.length)]);
    }

    function getStacks(players) {
        return Object.fromEntries(Object.entries(players).map(([userId, player]) => [userId, player.stack]));
    }

    function broadcastToEach(matchId, state) {
        for (const [ws, client] of clients) {
            if (client.matchId !== matchId) continue;
            const player = state.players[client.userId];
            if (!player) continue;

            ws.send(
                JSON.stringify({
                    type: 'game-started',
                    yourDice: player.dice,
                    rollsLeft: player.rollsLeft,
                    players: Object.keys(state.players),
                    timeRemaining: Math.ceil(player.timeRemaining / 1000)
                })
            );
        }
    }

    function autoCompleteRoll(matchId, userId) {
        const state = gameStates.get(matchId);
        if (!state || state.phase !== 'rolling') return;

        const player = state.players[userId];
        if (!player || player.doneRolling) return;

        player.dice = rollDice();
        player.held = [false, false, false, false, false];
        player.timeRemaining = 0;
        player.rollStartTime = null;
        player.doneRolling = true;

        for (const [ws, client] of clients) {
            if (client.matchId === matchId && client.userId === userId) {
                ws.send(JSON.stringify({ type: 'roll-result', yourDice: player.dice, rollsLeft: 0 }));
            }
        }

        broadcast(matchId, { type: 'player-done-rolling', userId });

        const allDone = Object.values(state.players).every((gamePlayer) => gamePlayer.doneRolling);
        if (allDone) startBetting(matchId, state);
    }

    function restorePlayerState(ws, userId, state) {
        if (state.phase === 'waiting') {
            const joinedCount = Object.keys(state.players).length;
            if (joinedCount >= state.requiredPlayers) {
                ws.send(JSON.stringify({ type: 'all-joined' }));
            }
            return;
        }

        const player = state.players[userId];

        if (!player.dice || player.dice.includes(null)) return;

        ws.send(
            JSON.stringify({
                type: 'game-started',
                yourDice: player.dice,
                rollsLeft: player.rollsLeft,
                players: Object.keys(state.players),
                timeRemaining: Math.ceil(player.timeRemaining / 1000)
            })
        );

        if (state.phase === 'betting') {
            const stacks = getStacks(state.players);
            ws.send(
                JSON.stringify({
                    type: 'betting-start',
                    currentBettor: state.currentBettor,
                    pot: state.pot,
                    stacks
                })
            );
        }
    }

    function startGame(matchId, state) {
        state.phase = 'rolling';

        for (const player of Object.values(state.players)) {
            player.dice = ['?', '?', '?', '?', '?'];
            player.held = [false, false, false, false, false];
            player.rollsLeft = 3;
            player.doneRolling = false;
            player.rollStartTime = Date.now();
        }

        broadcastToEach(matchId, state);

        for (const userId of Object.keys(state.players)) {
            clearRollingTimer(matchId, userId);
            const timer = setTimeout(() => autoCompleteRoll(matchId, userId), state.players[userId].timeRemaining);
            rollingTimers.set(`${matchId}-${userId}`, timer);
        }
    }

    function startBetting(matchId, state) {
        state.phase = 'betting';
        state.pot = 0;
        state.highestBet = 0;

        for (const player of Object.values(state.players)) {
            player.bet = 0;
            player.folded = false;
        }

        const bettingOrder = Object.keys(state.players);
        state.bettingOrder = bettingOrder;
        state.currentBettor = bettingOrder[0];
        state.bettorsActed = new Set();

        const stacks = getStacks(state.players);

        broadcast(matchId, {
            type: 'betting-start',
            currentBettor: state.currentBettor,
            pot: state.pot,
            stacks
        });

        if (state.players[state.currentBettor]?.disconnected) {
            const player = state.players[state.currentBettor];
            const toMatch = state.highestBet - player.bet;
            player.bet = state.highestBet;
            player.stack -= toMatch;
            state.bettorsActed.add(state.currentBettor);
            broadcast(matchId, { type: 'player-matched', userId: state.currentBettor, pot: state.pot });
            advanceBetting(matchId, state);
        }
    }

    function advanceBetting(matchId, state) {
        const order = state.bettingOrder;
        const currentIndex = order.indexOf(state.currentBettor);

        for (let i = 1; i <= order.length; i++) {
            const nextIndex = (currentIndex + i) % order.length;
            const nextId = order[nextIndex];
            const nextPlayer = state.players[nextId];

            if (!nextPlayer.folded) {
                const activePlayers = Object.values(state.players).filter((gamePlayer) => !gamePlayer.folded);
                const allMatched = activePlayers.every((gamePlayer) => gamePlayer.bet === state.highestBet);

                const activePlayerIds = Object.keys(state.players).filter((playerId) => !state.players[playerId].folded);
                const allActivePlayed = activePlayerIds.every((playerId) => state.bettorsActed.has(playerId));
                if (allMatched && allActivePlayed) {
                    revealAndScore(matchId, state);
                    return;
                }

                state.currentBettor = nextId;

                if (state.players[nextId].disconnected) {
                    const disconnectedPlayer = state.players[nextId];
                    const toMatch = state.highestBet - disconnectedPlayer.bet;
                    disconnectedPlayer.bet = state.highestBet;
                    disconnectedPlayer.stack -= toMatch;
                    state.pot += toMatch;
                    state.bettorsActed.add(nextId);
                    broadcast(matchId, { type: 'player-matched', userId: nextId, pot: state.pot });
                    advanceBetting(matchId, state);
                    return;
                }

                const stacks = getStacks(state.players);

                broadcast(matchId, { type: 'next-bettor', currentBettor: nextId, stacks });

                return;
            }
        }

        revealAndScore(matchId, state);
    }

    function revealAndScore(matchId, state) {
        const results = {};

        for (const [userId, player] of Object.entries(state.players)) {
            if (!player.folded) {
                results[userId] = evaluateHand(player.dice, state.gameRules !== 'no_straights');
            }
        }

        const eligibleIds = Object.keys(results).filter((userId) => !state.players[userId].disconnected);
        const competeIds = eligibleIds.length > 0 ? eligibleIds : Object.keys(results);

        const winners = [];
        for (const userId of competeIds) {
            if (winners.length === 0) {
                winners.push(userId);
                continue;
            }
            const comparison = compareHands(results[userId], results[winners[0]]);
            if (comparison > 0) {
                winners.length = 0;
                winners.push(userId);
            } else if (comparison === 0) {
                winners.push(userId);
            }
        }

        const share = Math.floor(state.pot / winners.length);
        for (const userId of winners) {
            state.players[userId].stack += share;
            state.players[userId].roundWins += 1;
        }

        const reveal = {};
        for (const [userId, player] of Object.entries(state.players)) {
            reveal[userId] = player.dice;
        }

        broadcast(matchId, {
            type: 'round-end',
            reveal,
            winners,
            pot: state.pot,
            hands: results
        });

        state.pot = 0;
        state.round += 1;

        setTimeout(() => {
            if (state.round > state.totalRounds) {
                endGame(matchId, state);
            } else {
                startGame(matchId, state);
            }
        }, REVEAL_DELAY_MS);
    }

    async function endGame(matchId, state) {
        gameStates.delete(matchId);

        const standings = Object.entries(state.players)
            .map(([userId, player]) => ({ userId, stack: player.stack, roundWins: player.roundWins }))
            .sort((playerA, playerB) => {
                if (playerB.stack !== playerA.stack) return playerB.stack - playerA.stack;
                return playerB.roundWins - playerA.roundWins;
            });

        try {
            const userIds = standings.map((entry) => entry.userId);
            const users = await User.find({ _id: { $in: userIds } });

            const eloDeltas = calculateEloDeltas(standings, users);

            const eloFields = { 10: 'eloRating10s', 30: 'eloRating30s', 90: 'eloRating90s' };
            const eloField = eloFields[state.timeController] ?? null;

            for (const { userId, stack } of standings) {
                const delta = Math.round(eloDeltas[userId]);
                await User.findByIdAndUpdate(userId, {
                    $inc: {
                        coins: stack,
                        eloRating: delta,
                        ...(eloField ? { [eloField]: delta } : {})
                    }
                });
            }

            await Match.findOneAndUpdate(
                { matchId: Number(matchId) },
                {
                    status: 'finished',
                    endedAt: new Date(),
                    winner: standings[0].userId,
                    outcome: standings.map((entry) => entry.stack).join('-'),
                    eloChanges: standings.map((entry) => ({
                        userId: entry.userId,
                        delta: Math.round(eloDeltas[entry.userId])
                    }))
                }
            );
        } catch (err) {
            console.error('Error updating database at game end:', err);
        }

        for (const userId of Object.keys(state.players)) {
            clearRollingTimer(matchId, userId);
        }

        broadcast(matchId, { type: 'game-end', standings, forfeitBy: state.forfeitBy ?? null });
    }
}
