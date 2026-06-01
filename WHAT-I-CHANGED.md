## Changes to dice-poker-board.js

This component was originally built for Oblig 1 as a fully self-contained 2-player local game. It handled rolling dice, evaluating hands, deciding winners, and managing turns entirely on the client side.

For the exam project, the component has been heavily adapted to work in a multiplayer, server-driven architecture.

**Game logic removed** — rolling, hand evaluation, winner decision, and turn management no longer live here. They live on the backend in `gameSocket.js` and `handEvaluator.js`.

**Dynamic players** — the hardcoded 2-player layout is replaced with a dynamic system. Players are added via `addPlayer()`, supporting 2–5 players.

**Server-driven dice** — dice faces are no longer generated randomly on the client. They are received from the server over WebSocket and set via `setDice()`.

**Buttons removed from the component** — the Roll Again and Done Rolling buttons have been moved out of the shadow DOM and into `Game.jsx`. The methods `handleRollAgain()` and `handleDoneRolling()` still exist on the component and are called directly via a React ref. This allows the buttons to be positioned outside the board box in the page layout.

**Events** — the component fires two custom events upward: `dp:roll-again` (with which dice are held) and `dp:done-rolling`. Game.jsx listens for these and forwards them to the server over WebSocket.

---

## Changes to dice-poker-die.js

**`roll()` no longer picks a random face** — in Oblig 1, `roll()` randomly selected a new face value. In the exam version, the face is always set by the server before `roll()` is called. `roll()` now only triggers the shake animation.

**Red/black face colouring** — A, K, and 8 are coloured red in `updateUI()` using CSS variables. The other faces (Q, J, 7) are black. This matches the Spanish Poker Dice convention.
