// Manages real-time game communication over WebSocket.
// Game state is stored in-memory per match and cleaned up on game end.

import { WebSocketServer } from 'ws';
import { evaluateHand, compareHands } from '../utils/handEvaluator.js';
import { User } from '../models/User.js';
import { Match } from '../models/Match.js';
import { REVEAL_DELAY_MS } from '../config/constants.js';

// Called once from server.js — attaches WebSocket to the same port as Express
export default function attachWebSocket(server) {
    // Creates the WebSocket server, sharing the existing HTTP server.
    const wss = new WebSocketServer({ server });

    // rooms is a Map where each key is a matchId and each value is a Set of WebSocket connections currently in that game.
    const rooms = new Map();
    const gameStates = new Map();
    const clients = new Map();
    const rollingTimers = new Map();

    // This fires every time a new browser connects via WebSocket.
    wss.on('connection', (ws) => {
        // This fires every time that client sends a message.
        ws.on('message', (data) => {
            const message = JSON.parse(data);

            // The client tells us what kind of event this is via message.type.
            if (message.type === 'join') {
                const { matchId, userId } = message;

                if (!rooms.has(matchId)) rooms.set(matchId, new Set());
                rooms.get(matchId).add(ws);
                clients.set(ws, { matchId, userId });

                // Create game state on first join
                if (!gameStates.has(matchId)) {
                    gameStates.set(matchId, {
                        phase: 'waiting',
                        round: 1,
                        totalRounds: message.totalRounds,
                        timeController: message.timeController,
                        coinWager: message.coinWager ?? 0,
                        requiredPlayers: message.requiredPlayers,
                        pot: 0,
                        highestBet: 0,
                        players: {}
                    });
                }

                const state = gameStates.get(matchId);
                const isRejoin = !!state.players[userId];

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
                        rollStartTime: null
                    };

                    const joinedCount = Object.keys(state.players).length;
                    if (joinedCount === message.requiredPlayers) {
                        broadcast(matchId, { type: 'all-joined' });
                    }
                } else {
                    state.players[userId].disconnected = false;

                    // Rejoin — send back their current state
                    restorePlayerState(ws, userId, state);

                    // Restart their timer if they're still rolling
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

                // Update held dice from the client's message
                player.held = message.held;

                const elapsed = player.rollStartTime ? Date.now() - player.rollStartTime : 0;
                player.timeRemaining = Math.max(0, player.timeRemaining - elapsed);
                player.rollStartTime = Date.now();

                // Re-roll only the dice that aren't held
                player.dice = player.dice.map((face, i) => (player.held[i] ? face : rollDice()[i]));
                player.rollsLeft -= 1;

                // Reset timer — player is still rolling
                clearRollingTimer(matchId, userId);
                const timer = setTimeout(() => autoCompleteRoll(matchId, userId), player.timeRemaining);
                rollingTimers.set(`${matchId}-${userId}`, timer);

                // Send the updated dice back to this player only
                ws.send(
                    JSON.stringify({
                        type: 'roll-result',
                        yourDice: player.dice,
                        rollsLeft: player.rollsLeft
                    })
                );

                // Tell everyone else this player re-rolled (but not their dice values)
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

                // Tell everyone this player is done
                broadcast(matchId, {
                    type: 'player-done-rolling',
                    userId
                });

                // Check if ALL players are done rolling
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
                    if (amount <= 0 || amount > player.stack) return;
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

                // Move to the next bettor
                state.bettorsActed.add(userId);
                advanceBetting(matchId, state);
            }
        });

        // Clean up when a client disconnects
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

                // Rolling phase: timer handles auto-completion — allows rejoin before it fires

                // Betting phase: auto-match if it was their turn
                if (state.phase === 'betting' && state.currentBettor === userId) {
                    const player = state.players[userId];
                    if (player) {
                        const toMatch = state.highestBet - player.bet;
                        player.bet = state.highestBet;
                        player.stack -= toMatch;
                        state.pot += toMatch;
                        broadcast(matchId, { type: 'player-matched', userId, pot: state.pot });
                        advanceBetting(matchId, state);
                    }
                }

                if (state.phase === 'betting' && state.currentBettor !== userId) {
                    const player = state.players[userId];
                    if (player) player.disconnected = true;
                }
            }
        });
    });

    // Sends a message to all clients in a room
    function broadcast(matchId, data) {
        const room = rooms.get(matchId);
        // If the room doesn't exist yet, do nothing.
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

    function autoCompleteRoll(matchId, userId) {
        const state = gameStates.get(matchId);
        if (!state || state.phase !== 'rolling') return;

        const player = state.players[userId];
        if (!player || player.doneRolling) return;

        // Force-roll all dice with no holds
        player.dice = rollDice();
        player.held = [false, false, false, false, false];
        player.timeRemaining = 0;
        player.rollStartTime = null;
        player.doneRolling = true;

        // Send the forced roll to the timed-out player if still connected
        for (const [ws, client] of clients) {
            if (client.matchId === matchId && client.userId === userId) {
                ws.send(JSON.stringify({ type: 'roll-result', yourDice: player.dice, rollsLeft: 0 }));
            }
        }

        broadcast(matchId, { type: 'player-done-rolling', userId });

        const allDone = Object.values(state.players).every((gamePlayer) => gamePlayer.doneRolling);
        if (allDone) startBetting(matchId, state);
    }

    // Rolls dice for all players and sends each player only their own dice
    function startGame(matchId, state) {
        state.phase = 'rolling';

        // Roll dice for every player
        for (const [userId, player] of Object.entries(state.players)) {
            player.dice = ['?', '?', '?', '?', '?'];
            player.held = [false, false, false, false, false];
            player.rollsLeft = 3;
            player.doneRolling = false;
            player.rollStartTime = Date.now();
        }

        // Send each player only their own dice
        broadcastToEach(matchId, state);

        // Start a countdown for each player
        for (const userId of Object.keys(state.players)) {
            clearRollingTimer(matchId, userId);
            const timer = setTimeout(() => autoCompleteRoll(matchId, userId), state.players[userId].timeRemaining);
            rollingTimers.set(`${matchId}-${userId}`, timer);
        }
    }

    // Resets bets and starts the betting phase
    function startBetting(matchId, state) {
        state.phase = 'betting';
        state.pot = 0;
        state.highestBet = 0;

        // Reset each player's bet for this round
        for (const player of Object.values(state.players)) {
            player.bet = 0;
            player.folded = false;
        }

        // Betting order is just the list of player IDs
        const bettingOrder = Object.keys(state.players);
        state.bettingOrder = bettingOrder;
        state.currentBettor = bettingOrder[0];
        state.bettorsActed = new Set();

        const stacks = Object.fromEntries(Object.entries(state.players).map(([uid, player]) => [uid, player.stack]));

        broadcast(matchId, {
            type: 'betting-start',
            currentBettor: state.currentBettor,
            pot: state.pot,
            stacks
        });
    }

    // Moves to the next bettor, or triggers reveal if all active players have matched
    function advanceBetting(matchId, state) {
        const order = state.bettingOrder;
        const currentIndex = order.indexOf(state.currentBettor);

        // Find the next player who hasn't folded
        for (let i = 1; i <= order.length; i++) {
            const nextIndex = (currentIndex + i) % order.length;
            const nextId = order[nextIndex];
            const nextPlayer = state.players[nextId];

            if (!nextPlayer.folded) {
                // Check if everyone who hasn't folded has matched the highest bet
                const activePlayers = Object.values(state.players).filter((gamePlayer) => !gamePlayer.folded);
                const allMatched = activePlayers.every((gamePlayer) => gamePlayer.bet === state.highestBet);

                const activePlayerIds = Object.keys(state.players).filter((id) => !state.players[id].folded);
                const allActivePlayed = activePlayerIds.every((id) => state.bettorsActed.has(id));
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
                    broadcast(matchId, { type: 'player-matched', userId: nextId, pot: state.pot });
                    advanceBetting(matchId, state);
                    return;
                }

                const stacks = Object.fromEntries(Object.entries(state.players).map(([uid, player]) => [uid, player.stack]));

                broadcast(matchId, { type: 'next-bettor', currentBettor: nextId, stacks });

                return;
            }
        }

        // If we get here, everyone folded — reveal anyway
        revealAndScore(matchId, state);
    }

    // Evaluates hands, finds winner(s), splits pot, and moves to next round or ends game
    function revealAndScore(matchId, state) {
        const results = {};

        for (const [userId, player] of Object.entries(state.players)) {
            if (!player.folded) {
                results[userId] = evaluateHand(player.dice);
            }
        }

        // Find all winners (there may be more than one in a draw)
        const winners = [];
        for (const userId of Object.keys(results)) {
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

        // Split pot equally among winners
        const share = Math.floor(state.pot / winners.length);
        for (const userId of winners) {
            state.players[userId].stack += share;
        }

        // Reveal all dice to all players
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

    function restorePlayerState(ws, userId, state) {
        if (state.phase === 'waiting') {
            const joinedCount = Object.keys(state.players).length;
            if (joinedCount >= state.requiredPlayers) {
                ws.send(JSON.stringify({ type: 'all-joined' }));
            }
            return;
        }

        const player = state.players[userId];

        // Game hasn't started yet — broadcastToEach will send proper dice when it does
        if (!player.dice || player.dice.includes(null)) return;

        // Re-send game-started so the board re-initialises with their current dice
        ws.send(
            JSON.stringify({
                type: 'game-started',
                yourDice: player.dice ?? [],
                rollsLeft: player.rollsLeft,
                players: Object.keys(state.players)
            })
        );

        // If betting is in progress, send the current betting state too
        if (state.phase === 'betting') {
            ws.send(
                JSON.stringify({
                    type: 'betting-start',
                    currentBettor: state.currentBettor,
                    pot: state.pot
                })
            );
        }
    }

    // Broadcasts final standings and cleans up game state
    async function endGame(matchId, state) {
        const standings = Object.entries(state.players)
            .map(([userId, player]) => ({ userId, stack: player.stack }))
            .sort((playerA, playerB) => playerB.stack - playerA.stack);

        broadcast(matchId, { type: 'game-end', standings });

        try {
            // Fetch all players from DB so we have their current ELO
            const userIds = standings.map((entry) => entry.userId);
            const users = await User.find({ _id: { $in: userIds } });

            // Pair-based ELO: for every pair, higher stack = win
            const eloK = 32;
            const eloDeltas = {};
            userIds.forEach((id) => {
                eloDeltas[id] = 0;
            });

            for (let i = 0; i < standings.length; i++) {
                for (let j = i + 1; j < standings.length; j++) {
                    const entryA = standings[i];
                    const entryB = standings[j];
                    const userA = users.find((dbUser) => String(dbUser._id) === entryA.userId);
                    const userB = users.find((dbUser) => String(dbUser._id) === entryB.userId);
                    if (!userA || !userB) continue;

                    const expectedScoreA = 1 / (1 + Math.pow(10, (userB.eloRating - userA.eloRating) / 400));
                    const actualScoreA = entryA.stack === entryB.stack ? 0.5 : 1; // A is higher in standings

                    eloDeltas[entryA.userId] += eloK * (actualScoreA - expectedScoreA);
                    eloDeltas[entryB.userId] += eloK * (1 - actualScoreA - (1 - expectedScoreA));
                }
            }

            // Pick the right per-time-control ELO field
            const eloField =
                state.timeController === 10
                    ? 'eloRating10s'
                    : state.timeController === 30
                      ? 'eloRating30s'
                      : state.timeController === 90
                        ? 'eloRating90s'
                        : null;

            // Update each player's coins and ELO
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

            // Mark the match as finished in MongoDB
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

        gameStates.delete(matchId);
    }

    // Generates 5 random Spanish Poker Dice faces
    function rollDice() {
        const faces = ['7', '8', 'J', 'Q', 'K', 'A'];
        return Array.from({ length: 5 }, () => faces[Math.floor(Math.random() * faces.length)]);
    }

    // Sends each player only their own dice — other players' dice stay hidden
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
}
