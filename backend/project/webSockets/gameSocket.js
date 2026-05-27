import { WebSocketServer } from 'ws';
import { evaluateHand, compareHands } from '../utils/handEvaluator.js';
// This function is called once from server.js after the HTTP server starts.
// It attaches WebSocket handling to the same port as Express.
export default function attachWebSocket(server) {
    // Creates the WebSocket server, sharing the existing HTTP server.
    // This means ws:// connections on port 3000 are handled here,
    // while http:// requests on the same port still go to Express.
    const wss = new WebSocketServer({ server });

    // rooms is a Map where each key is a matchId and each value is a Set of
    // WebSocket connections currently in that game.
    // Example: rooms.get("12345") → Set { ws1, ws2, ws3 }
    const rooms = new Map();
    const gameStates = new Map();
    const clients = new Map();

    // This fires every time a new browser connects via WebSocket.
    // ws is the individual connection for that one client.
    wss.on('connection', (ws) => {
        // This fires every time that client sends a message.
        // data arrives as a raw string, so we parse it into an object.
        ws.on('message', (data) => {
            const message = JSON.parse(data);

            // The client tells us what kind of event this is via message.type.
            // For now the only type we handle is "join".
            if (message.type === 'join') {
                const { matchId, userId } = message;

                // If no room exists for this game yet, create one with an empty Set.
                if (!rooms.has(matchId)) {
                    rooms.set(matchId, new Set());
                }

                // Add this client's connection to the room for that game.
                rooms.get(matchId).add(ws);
                clients.set(ws, { matchId, userId });

                if (!gameStates.has(matchId)) {
                    gameStates.set(matchId, {
                        phase: 'rolling',
                        round: 1,
                        totalRounds: message.totalRounds,
                        pot: 0,
                        highestBet: 0,
                        players: {}
                    });
                }

                const state = gameStates.get(matchId);

                state.players[userId] = {
                    dice: [null, null, null, null, null],
                    held: [false, false, false, false, false],
                    rollsLeft: 3,
                    doneRolling: false,
                    stack: 0,
                    bet: 0,
                    folded: false
                };

                const requiredPlayers = message.requiredPlayers;
                const joinedCount = Object.keys(state.players).length;

                if (joinedCount === requiredPlayers) {
                    startGame(matchId, state);
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

                // Update held dice from the client's message
                player.held = message.held;

                // Re-roll only the dice that aren't held
                player.dice = player.dice.map((face, i) => (player.held[i] ? face : rollDice()[i]));

                player.rollsLeft -= 1;

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
                    rollsLeft: player.rollsLeft
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

                // Tell everyone this player is done
                broadcast(matchId, {
                    type: 'player-done-rolling',
                    userId
                });

                // Check if ALL players are done rolling
                const allDone = Object.values(state.players).every((p) => p.doneRolling);

                if (allDone) {
                    startBetting(matchId, state);
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
                advanceBetting(matchId, state);
            }
        });

        ws.on('close', () => {
            const client = clients.get(ws);
            if (client) {
                const { matchId } = client;
                const room = rooms.get(matchId);
                if (room) {
                    room.delete(ws);
                    if (room.size === 0) rooms.delete(matchId);
                }
                clients.delete(ws);
            }
        });
    });

    // Sends a message to every client currently in a given game room.
    // data is a plain object — it gets converted to a JSON string before sending.
    function broadcast(matchId, data) {
        const room = rooms.get(matchId);
        // If the room doesn't exist yet, do nothing.
        if (!room) return;
        const message = JSON.stringify(data);
        for (const client of room) {
            client.send(message);
        }
    }

    function startGame(matchId, state) {
        state.phase = 'rolling';

        // Roll dice for every player
        for (const [userId, player] of Object.entries(state.players)) {
            player.dice = rollDice();
            player.rollsLeft = 3;
            player.doneRolling = false;
        }

        // Send each player only their own dice
        broadcastToEach(matchId, state);
    }

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

        broadcast(matchId, {
            type: 'betting-start',
            currentBettor: state.currentBettor,
            pot: state.pot
        });
    }
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
                const activePlayers = Object.values(state.players).filter((p) => !p.folded);
                const allMatched = activePlayers.every((p) => p.bet === state.highestBet);

                if (allMatched) {
                    revealAndScore(matchId, state);
                    return;
                }

                state.currentBettor = nextId;
                broadcast(matchId, { type: 'next-bettor', currentBettor: nextId });
                return;
            }
        }

        // If we get here, everyone folded — reveal anyway
        revealAndScore(matchId, state);
    }

    function revealAndScore(matchId, state) {
        // Evaluate each player's hand
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

        // Split the pot equally among winners
        const share = Math.floor(state.pot / winners.length);
        for (const userId of winners) {
            state.players[userId].stack += share;
        }

        // Reveal everyone's dice to all players
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

        if (state.round > state.totalRounds) {
            endGame(matchId, state);
        } else {
            // Start next round — re-roll for everyone
            startGame(matchId, state);
        }
    }

    function endGame(matchId, state) {
        // Calculate final standings by stack size
        const standings = Object.entries(state.players)
            .map(([userId, player]) => ({ userId, stack: player.stack }))
            .sort((a, b) => b.stack - a.stack);

        broadcast(matchId, {
            type: 'game-end',
            standings
        });

        // Clean up the game state
        gameStates.delete(matchId);
    }

    // Generates 5 random Spanish Poker Dice faces
    function rollDice() {
        const faces = ['7', '8', 'J', 'Q', 'K', 'A'];
        return Array.from({ length: 5 }, () => faces[Math.floor(Math.random() * faces.length)]);
    }

    // Sends each player their own dice, and tells them others exist but hides their dice
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
                    players: Object.keys(state.players)
                })
            );
        }
    }
}
