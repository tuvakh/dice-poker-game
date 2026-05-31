# Tuva's Tasks — What Was Done and How

This document explains everything I was responsible for in the exam project.
It's written so teammates can understand it too, for the oral exam.

---

## 1. Game Board & Mechanics (Web Components)

**Requirement:** Build the game board using Web Components.

**Files:**
- `frontend/src/components/dice-poker-board.js`
- `frontend/src/components/dice-poker-die.js`
- `backend/project/utils/handEvaluator.js`
- `backend/project/models/GameCategory.js`
- `backend/project/config/constants.js`

**What I did:**

The game board is built as a Web Component (`<dice-poker-board>`), which contains multiple `<dice-poker-die>` components — one per die per player.
Web Components are framework-agnostic custom HTML elements. They manage their own internal DOM (Shadow DOM or light DOM), fire custom events, and are registered with `customElements.define()`. React doesn't know about them natively — we use a `ref` to interact with them from `Game.jsx`.

The board exposes methods like `addPlayer()`, `setDice()`, `setInteractive()`, `setHeld()`, `showResult()`, `clearResults()`, and `resetAllHeld()`. React calls these directly through the ref. The board fires two custom events back to React: `dp:roll-again` (when a player holds dice and wants to re-roll) and `dp:done-rolling` (when the player is done).

The `handEvaluator.js` utility runs on the **backend** and evaluates Spanish Poker Dice hands. It was ported from the Oblig 1 board logic. It returns a hand type (Repóker, Póker, Full, Escalera, Trío, Doble Pareja, Pareja, Carta Alta), a rank (lower = better), and tiebreaker values. `compareHands()` compares two evaluated hands and returns 1, -1, or 0. `calculateEloDeltas()` is also in this file — it's called from `gameSocket.js` at game end.

`GameCategory` is the model for game variants. Each variant is a combination of:
- `numberOfRounds`: 3, 5, or 7
- `gameRules`: `straights_allowed` or `no_straights`
- `timeController`: 10, 30, or 90 seconds (total for all rounds, not per round)

This gives 18 possible variants, all seeded into the database.

---

## 2. Real-Time Gameplay (WebSockets)

**Requirement:** Rolls generated on backend, sent to frontend. Frontend only communicates held dice. Backend enforces time, evaluates winner, handles betting.

**Files:**
- `backend/project/webSockets/gameSocket.js`
- `frontend/src/pages/Game.jsx`
- `frontend/src/components/BettingControls.jsx`

**What I did:**

The entire real-time game loop lives in `gameSocket.js`. It attaches a WebSocket server to the same HTTP port as Express. All game state is stored in-memory in `Map`s (one per match) and cleaned up when the game ends.

**Game flow:**
1. Both players connect and send `join`. When enough players have joined, server broadcasts `all-joined`.
2. Both players click Ready → server calls `startGame`, rolls dice, sends each player **only their own dice** via `game-started`.
3. During rolling, the player sends `hold` messages (which dice to keep). The server re-rolls the non-held dice and sends back `roll-result`. A per-player countdown timer runs on the backend — if it expires, `autoCompleteRoll` fires and forces a roll with no holds.
4. When all players are done rolling, `startBetting` is called.
5. In betting, one player at a time acts: fold, match (check), or raise (bet more coins). The server tracks `currentBettor`, `bettorsActed`, `highestBet`, and `pot`. `advanceBetting` moves to the next non-folded player, or triggers `revealAndScore` when everyone has matched. The betting UI is in `BettingControls.jsx` — it shows the fold/match/raise controls when it's the current player's turn, or a waiting message otherwise.
6. `revealAndScore` evaluates all hands, finds the winner(s), splits the pot, and either starts the next round or calls `endGame`.
7. `endGame` updates coins and ELO in the database and broadcasts `game-end` with final standings.

**Player disconnect / abandonment:**
If a player leaves mid-game:
- During **rolling**: their rolling timer is cancelled and `autoCompleteRoll` fires immediately — they get random dice with no holds, and the remaining player doesn't have to wait.
- During **betting**: if it was their turn, the server auto-matches the pot for them and calls `advanceBetting`.
- A disconnected player is flagged as `disconnected: true` in game state. They can't win rounds — `revealAndScore` filters them out of eligible winners.
- If a player **refreshes**, `restorePlayerState` sends them back to where the game was (rolling or betting phase, current dice, remaining time, stack sizes).

**ELO:**
Calculated pairwise at game end — every pair of players is compared: higher final stack = win, lower = loss. Each pair runs the standard ELO formula and the delta is summed. Three separate ELO fields exist (10s, 30s, 90s time controls).

---

## 3. Comments Using WebSockets

**Requirement:** New comments appear to all users in real time without page reload.

**Files:**
- `backend/project/webSockets/gameSocket.js` (exports `broadcastMatchComment` and `broadcastTournamentComment`)
- `backend/project/controllers/comment.controller.js` (calls the broadcast after saving)
- `frontend/src/pages/Game.jsx`
- `frontend/src/pages/TournamentPage.jsx`

**What I did:**

When a comment is saved via the REST API, the comment controller calls either `broadcastMatchComment` or `broadcastTournamentComment` depending on the `targetType`. Both functions use a shared helper `broadcastCommentToRoom` that sends a `new-comment` WebSocket message to all clients in the relevant room.

Game rooms and tournament rooms are kept in separate Maps (`objectIdToRoom` and `tournamentRooms`). Clients join a tournament room by sending `{ type: 'join-tournament', tournamentObjectId }` over the WebSocket. Clients join game rooms by sending the normal `join` message. On the frontend, `handleServerMessage` listens for `new-comment` and appends the comment to local state — no re-fetch needed.

---

## 4. Anonymous Users Can Only Spectate

**Requirement:** Anonymous users can view games but cannot play.

**Files:**
- `frontend/src/pages/Game.jsx`

**What I did:**

The auto-join `useEffect` checks `if (!user) return` before trying to join. If no user is logged in, they are never added as a player. The game board area shows a "Want to join? Log in first." message instead of the waiting overlay. A spectator banner at the top of the page invites them to log in or register. They can still view the board and read comments, but all interactive controls are hidden.

---

## 5. Leaving a Game Before It Starts

**Requirement:** A player should be able to leave a game while it is still in the waiting state.

**Files:**
- `frontend/src/pages/Game.jsx`

**What I did:**

A "Cancel game" / "Leave game" button is shown while the match status is `waiting`. Clicking it calls the `leaveMatch` REST endpoint and navigates back to home. If the game is already `ongoing`, the button instead closes the WebSocket connection (triggering the disconnect/forfeit flow on the server) and navigates home.

A cleanup `useEffect` with an empty dependency array also calls `leaveMatch` when the component unmounts while the game is still waiting — this handles browser back-button and tab-close scenarios.

---

## 6. More Game Variants

**Requirement:** Extend variants to cover straights allowed/not, 3/5/7 rounds, and 10/30/90 second total time.

**Files:**
- `backend/project/models/GameCategory.js`
- `backend/project/config/constants.js`
- `backend/project/seed/gameCategories/gameCategory.seed.js`
- `frontend/src/components/RoundsSelector.jsx`
- `frontend/src/components/TimeControlSelector.jsx`
- `frontend/src/components/GameRulesSelector.jsx`
- `frontend/src/pages/CreateGame.jsx`

**What I did:**

The `GameCategory` model stores the three dimensions of a game variant. Constants define the allowed values (`NUMBER_OF_ROUNDS = [3, 5, 7]`, `TIME_CONTROLLERS = [10, 30, 90]`, `GAME_RULES = ['straights_allowed', 'no_straights']`). The seed script creates all 18 combinations on startup.

On the frontend, `CreateGame.jsx` lets the user pick from these dimensions using selector components. The chosen `gameCategory` ID is stored on the match when it's created.

---

## 7. Upcoming Tournaments — Sort & Search on List Page

**Requirement:** Tournament list page should be sortable (by date, title, # of players) and searchable (by title, at least 3 characters).

**Files:**
- `frontend/src/pages/Tournament.jsx`
- `frontend/src/pages/_Tournament.scss`

**What I did:**

All filtering and sorting is done client-side with `useMemo`. After fetching the tournament list once (re-fetched only when the status tab changes), `visibleTournaments` is computed from the raw list by:
1. Filtering by `searchQuery` — only applied when 3 or more characters are typed (requirement says "at least 3")
2. Sorting by the selected `sortBy` option (date newest/oldest, title A–Z/Z–A, players most/fewest)

No backend changes were needed. The controls (search input + sort select) sit in a `.tournament-controls` bar between the status tabs and the results grid.

---

## 8. Extra: Back Button / Leave Button in Game

**Requirement:** (Extra task) Give the player a way to leave or go back from the game page.

**Files:**
- `frontend/src/pages/Game.jsx`

**What I did:**

A "Leave game" button is always visible during an ongoing game for players. For waiting games it says "Cancel game" if the player is alone or "Leave game" if others have joined. The button is hidden from spectators. See task 5 for the leave logic.

---

## Key Technical Decisions

- **Server-side dice rolls**: All dice are rolled on the backend. The frontend only sends which dice to hold. This prevents cheating.
- **In-memory game state**: Game state (phase, dice, timers, bets) is stored in Node.js Maps, not in MongoDB, for speed. It's written to MongoDB only at game end.
- **WebSocket shares the HTTP port**: `new WebSocketServer({ server })` attaches to the existing Express server. No separate port needed.
- **Time is "total time"**: Each player's `timeRemaining` counts down across all their rolls in all rounds — it's not reset per round. This matches the requirement of "10/30/90 seconds in total, for all rounds."
- **Web Components + React ref**: The board is a Web Component; React controls it via a `ref` and `useEffect` event listeners. They communicate via custom DOM events (`dp:roll-again`, `dp:done-rolling`).
