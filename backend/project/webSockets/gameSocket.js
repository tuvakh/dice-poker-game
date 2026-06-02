// Manages real-time game communication over WebSocket.
// Game state is stored in-memory per match and cleaned up on game end.

import { WebSocketServer } from 'ws';
import { evaluateHand, compareHands, calculateEloDeltas } from '../utils/handEvaluator.js';
import { User } from '../models/User.js';
import { Match } from '../models/Match.js';
import { REVEAL_DELAY_MS } from '../config/constants.js';
import { verifyToken } from '../utils/jwt.js';

// objectIdToRoom maps a match's MongoDB _id → the Set of clients in that game room (used for comment broadcasts)
// tournamentRooms maps a tournament's MongoDB _id → clients watching that tournament
const objectIdToRoom = new Map();
const tournamentRooms = new Map();

// Sends a new comment to all clients currently watching a room (match or tournament)
function broadcastCommentToRoom(roomMap, objectId, comment) {
    const room = roomMap.get(String(objectId));
    if (!room) return;
    const payload = JSON.stringify({ type: 'new-comment', comment });
    // readyState === 1 means the WebSocket connection is currently open
    room.forEach((client) => {
        if (client.readyState === 1) client.send(payload);
    });
}

// Called by the comment controller after a match comment is saved to the database
export function broadcastMatchComment(matchObjectId, comment) {
    broadcastCommentToRoom(objectIdToRoom, matchObjectId, comment);
}

// Called by the comment controller after a tournament comment is saved to the database
export function broadcastTournamentComment(tournamentObjectId, comment) {
    broadcastCommentToRoom(tournamentRooms, tournamentObjectId, comment);
}

// Called once from server.js — attaches WebSocket to the same port as Express
export default function attachWebSocket(server) {
    // Creates the WebSocket server, sharing the existing HTTP server.
    const wss = new WebSocketServer({ server });

    // rooms: matchId → Set of active WebSocket connections in that game
    // gameStates: matchId → all in-memory game state (phase, dice, bets, timers, stacks)
    // clients: ws → { matchId, userId } — reverse lookup to identify who sent a message
    // rollingTimers: "matchId-userId" → timer that fires autoCompleteRoll when a player's time runs out
    // readyTimers: matchId → 60-second timeout that cancels the game if players don't ready up in time
    // tournamentClients: ws → tournamentObjectId — so we can remove the client from the tournament room on disconnect
    const rooms = new Map();
    const gameStates = new Map();
    const clients = new Map();
    const rollingTimers = new Map();
    const readyTimers = new Map();
    const tournamentClients = new Map();

    // This fires every time a new browser connects via WebSocket.
    // The access token cookie is verified here so game actions can't be spoofed.
    wss.on('connection', (ws, req) => {
        const cookieHeader = req.headers.cookie || '';
        const cookieMatch = cookieHeader.match(/(?:^|;\s*)accessToken=([^;]+)/);
        const token = cookieMatch ? decodeURIComponent(cookieMatch[1]) : null;
        const decoded = token ? verifyToken(token) : null;
        // _id is the MongoDB ObjectId stored in the token payload (added in jwt.js)
        ws.verifiedUserId = decoded?._id ?? null;

        // This fires every time that client sends a message.
        ws.on('message', (data) => {
            let message;
            try {
                message = JSON.parse(data);
            } catch {
                return;
            }

            // The client tells us what kind of event this is via message.type.
            if (message.type === 'join') {
                // userId comes from the verified JWT, not the message — prevents impersonation
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

                // Create game state on first join
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

                // Reject new joins once the game is already full
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

                        // Cancel the game if not all players click Ready within 60 seconds
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

            // Player clicked Roll Again: re-roll non-held dice and reset their timer
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

                // Subtract time used since the last roll — timeRemaining is total time across all rolls in all rounds
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

            // Player clicked Done Rolling: stop their timer and check if all are done
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

            // Player clicked Ready: start the game once all players are ready
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

            // Player took a betting action: fold, match, or raise
            if (message.type === 'bet') {
                const client = clients.get(ws);
                if (!client) return;

                const { matchId, userId } = client;
                const state = gameStates.get(matchId);
                if (!state || state.phase !== 'betting') return;
                if (state.currentBettor !== userId) return;

                const { action, amount } = message;
                const player = state.players[userId];

                // Player folds: out of this round
                if (action === 'fold') {
                    player.folded = true;
                    broadcast(matchId, { type: 'player-folded', userId });
                }

                // Player bets: must be higher than the current highest bet
                if (action === 'bet' || action === 'raise') {
                    if (!Number.isFinite(amount) || amount <= 0 || amount > player.stack || amount <= state.highestBet) return;
                    player.bet = amount;
                    player.stack -= amount;
                    state.pot += amount;
                    if (amount > state.highestBet) state.highestBet = amount;
                    broadcast(matchId, { type: 'player-bet', userId, amount, pot: state.pot });
                }

                // Player matches: pays exactly the difference to equal the highest bet
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

            // Client wants real-time comment updates for a tournament page
            if (message.type === 'join-tournament') {
                const key = String(message.tournamentObjectId);
                if (!tournamentRooms.has(key)) tournamentRooms.set(key, new Set());
                tournamentRooms.get(key).add(ws);
                tournamentClients.set(ws, key);
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

                if (state.phase === 'waiting') {
                    // Game hasn't started — can't continue without all players
                    state.forfeitBy = userId;
                    delete state.players[userId];
                    broadcast(matchId, { type: 'player-disconnected', userId });
                    endGame(matchId, state);
                } else {
                    // Game is in progress — mark disconnected and let it continue
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

    // Cancels a player's rolling countdown and removes it from the map
    function clearRollingTimer(matchId, userId) {
        const key = `${matchId}-${userId}`;
        clearTimeout(rollingTimers.get(key));
        rollingTimers.delete(key);
    }

    // Generates 5 random Spanish Poker Dice faces
    function rollDice() {
        const faces = ['7', '8', 'J', 'Q', 'K', 'A'];
        return Array.from({ length: 5 }, () => faces[Math.floor(Math.random() * faces.length)]);
    }

    // Builds a { userId: stack } map to send coin totals to all clients
    function getStacks(players) {
        return Object.fromEntries(Object.entries(players).map(([uid, player]) => [uid, player.stack]));
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

    // Called when a player's timer runs out or they disconnect during rolling — rolls all dice with no holds
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

    // Sends the current game state back to a player who reconnected mid-game
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
                players: Object.keys(state.players),
                timeRemaining: Math.ceil(player.timeRemaining / 1000)
            })
        );

        // If betting is in progress, send the current betting state too
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

    // Rolls dice for all players and sends each player only their own dice
    function startGame(matchId, state) {
        state.phase = 'rolling';

        // Roll dice for every player
        for (const [userId, player] of Object.entries(state.players)) {
            // Start with '?' so the client sees blank dice until the player clicks Roll Again at least once
            // This also prevents clicking Done Rolling before any real faces have been revealed
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
        // bettorsActed tracks who has placed or matched a bet this round
        // Both allMatched and allActivePlayed must be true before betting ends — prevents ending early
        // if the first player raises before the second player has had a chance to respond
        state.bettorsActed = new Set();

        const stacks = getStacks(state.players);

        broadcast(matchId, {
            type: 'betting-start',
            currentBettor: state.currentBettor,
            pot: state.pot,
            stacks
        });

        // If the opening bettor is already disconnected, advance past them automatically
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
                // Both conditions must hold: every active player has matched the highest bet (allMatched)
                // AND every active player has acted at least once (allActivePlayed)
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

        // If we get here, everyone folded — reveal anyway
        revealAndScore(matchId, state);
    }

    // Evaluates hands, finds winner(s), splits pot, and moves to next round or ends game
    function revealAndScore(matchId, state) {
        const results = {};

        for (const [userId, player] of Object.entries(state.players)) {
            if (!player.folded) {
                results[userId] = evaluateHand(player.dice, state.gameRules !== 'no_straights');
            }
        }

        // Find all winners (there may be more than one in a draw)
        // Disconnected players can't win — only connected players compete for the pot
        // If everyone left is disconnected, fall back to all non-folded so the pot isn't lost
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

        // Split pot equally among winners, and record a round win for each
        const share = Math.floor(state.pot / winners.length);
        for (const userId of winners) {
            state.players[userId].stack += share;
            state.players[userId].roundWins += 1;
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

        // Wait before starting the next round so players can see the result
        setTimeout(() => {
            if (state.round > state.totalRounds) {
                endGame(matchId, state);
            } else {
                startGame(matchId, state);
            }
        }, REVEAL_DELAY_MS);
    }

    // Broadcasts final standings and cleans up game state
    async function endGame(matchId, state) {
        gameStates.delete(matchId);

        const standings = Object.entries(state.players)
            .map(([userId, player]) => ({ userId, stack: player.stack, roundWins: player.roundWins }))
            .sort((playerA, playerB) => {
                if (playerB.stack !== playerA.stack) return playerB.stack - playerA.stack;
                return playerB.roundWins - playerA.roundWins;
            });

        try {
            // Fetch all players from DB so we have their current ELO
            const userIds = standings.map((entry) => entry.userId);
            const users = await User.find({ _id: { $in: userIds } });

            // Pair-based ELO: for every pair, higher stack = win
            const eloDeltas = calculateEloDeltas(standings, users);

            // Map each time control to its ELO field name in the database
            const eloFields = { 10: 'eloRating10s', 30: 'eloRating30s', 90: 'eloRating90s' };
            const eloField = eloFields[state.timeController] ?? null;

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

        // Broadcast only after DB writes are done
        broadcast(matchId, { type: 'game-end', standings, forfeitBy: state.forfeitBy ?? null });
    }
}
