## Changes to dice-poker-board.js

Changed basically everything

This component was originally built for Oblig 1 as a fully self-contained 2-player local game. It handled rolling dice, evaluating hands, deciding winners, and managing turns entirely on the client side.

For the exam project, the component has been heavily adapted to work in a multiplayer, server-driven architecture.

The game logic — rolling, hand evaluation, winner decision, and turn management — has been removed from this component entirely. It now lives on the backend in gameSocket.js and handEvaluator.js.

The hardcoded 2-player layout is replaced with a dynamic system. Players are added via addPlayer(), supporting 2–5 players. Dice faces are no longer generated randomly on the client — they are received from the server over WebSocket and set via setDice().

The old buttons (Roll, End Turn, Start Next Round, Restart) are replaced with Done Rolling and betting controls (bet, match, fold, raise), since the server now controls the game flow.

The component now only dispatches events upward — dp:done-rolling and dp:bet — which the React wrapper in Game.jsx listens to and forwards to the server over WebSocket.