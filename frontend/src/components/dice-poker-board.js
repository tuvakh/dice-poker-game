// Adapted from oblig1 for multiplayer server-driven gameplay.
// Game logic (rolling, scoring, turns) has moved to the backend.
// This component only renders state it receives and dispatches user actions upward.

class DicePokerBoard extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        // The current user's ID — only they can interact with their own dice
        this.currentUserId = null;

        // Map of userId → array of dice-poker-die elements
        this.diceElements = {};

        // Whether the current user is done rolling
        this.doneRolling = false;
    }

    connectedCallback() {
        // Renders the initial empty shell — players are added dynamically via addPlayer()
        this.shadowRoot.innerHTML = `
        <style>
            :host { display: block; padding: 1rem; }
            .players { display: flex; flex-wrap: wrap; gap: 1rem; }
            .player-section { flex: 1; min-width: 200px; }
            .player-name { font-weight: bold; margin-bottom: 0.5rem; }
            .dice { display: flex; gap: 0.5rem; flex-wrap: wrap; }
            .controls { margin-top: 1rem; display: flex; gap: 0.5rem; }
            button { padding: 0.5rem 1rem; cursor: pointer; }
            button:disabled { opacity: 0.5; cursor: not-allowed; }
            .hand-result { margin-top: 0.5rem; font-weight: bold; }
            .hand-result.winner { color: green; }
        </style>

        <div class="players" id="players"></div>
        <div class="controls">
            <button id="btn-roll" disabled>Roll Again</button>
            <button id="btn-done" disabled>Done Rolling</button>
        </div>
        `;

        this.shadowRoot.getElementById('btn-roll').addEventListener('click', () => this.handleRollAgain());
        this.shadowRoot.getElementById('btn-done').addEventListener('click', () => this.handleDoneRolling());

        this.addEventListener(
            'dp:die-held-changed',
            (event) => {
                if (event.detail.owner !== this.currentUserId) {
                    event.target.setAttribute('held', 'false');
                }
            },
            { capture: true }
        );
    }

    // Collects held dice and dispatches to Game.jsx so it can send 'hold' to the server
    handleRollAgain() {
        const held = this.diceElements[this.currentUserId].map((die) => die.getAttribute('held') === 'true');
        this.dispatch('dp:roll-again', { held });
    }

    // Called by Game.jsx when a new player joins, and creates their dice section
    addPlayer(userId, name) {
        // Skip if this player has already been added
        if (this.diceElements[userId]) return;

        const playersContainer = this.shadowRoot.getElementById('players');

        // Create the player section
        const section = document.createElement('section');
        section.dataset.userId = userId;
        section.innerHTML = `
            <div class="player">
                <div class="player-name">${name}</div>
                <div class="dice"></div>
            </div>
        `;

        // Create 5 dice for this player
        const diceContainer = section.querySelector('.dice');
        this.diceElements[userId] = [];

        for (let i = 0; i < 5; i++) {
            const die = document.createElement('dice-poker-die');
            die.setAttribute('owner', userId);
            die.setAttribute('die-id', String(i));
            die.setAttribute('face', '?');
            die.setAttribute('held', 'false');
            diceContainer.appendChild(die);
            this.diceElements[userId].push(die);
        }

        playersContainer.appendChild(section);
    }

    // Called by Game.jsx when the server sends new dice values after a roll
    setDice(userId, faces, resetHeld = false) {
        const dice = this.diceElements[userId];
        if (!dice) return;

        faces.forEach((face, i) => {
            dice[i].setAttribute('face', face);
            if (resetHeld) dice[i].setAttribute('held', 'false');
            dice[i].roll();
        });
    }

    // Enables or disables dice interaction
    // Only the current player can hold their own dice
    setInteractive(userId, canInteract) {
        const dice = this.diceElements[userId];
        if (dice) {
            dice.forEach((die) => {
                die.style.pointerEvents = canInteract ? 'auto' : 'none';
                die.style.opacity = '1';
            });
        }

        // Opponent dice: non-interactive and visually disabled
        for (const [otherId, otherDice] of Object.entries(this.diceElements)) {
            if (otherId !== userId) {
                otherDice.forEach((die) => {
                    die.style.pointerEvents = 'none';
                    die.style.opacity = '0.4';
                });
            }
        }

        const btnRoll = this.shadowRoot.getElementById('btn-roll');
        const btnDone = this.shadowRoot.getElementById('btn-done');
        if (btnRoll) btnRoll.disabled = !canInteract;
        if (btnDone) btnDone.disabled = !canInteract;
    }

    // Shows which of another player's dice are held (without revealing face values)
    setHeld(userId, heldArray) {
        const dice = this.diceElements[userId];
        if (!dice) return;
        heldArray.forEach((isHeld, index) => {
            dice[index].setAttribute('held', isHeld ? 'true' : 'false');
        });
    }

    // Resets held state on all players' dice — called at the start of each round
    resetAllHeld() {
        for (const diceArray of Object.values(this.diceElements)) {
            diceArray.forEach((die) => die.setAttribute('held', 'false'));
        }
    }

    // Fires when the player clicks Done Rolling, and dispatches the held dice up to Game.jsx
    handleDoneRolling() {
        const dice = this.diceElements[this.currentUserId];
        const hasUnrevealedDice = dice?.some(die => die.getAttribute('face') === '?');
        if (hasUnrevealedDice) return;

        this.doneRolling = true;
        this.setInteractive(this.currentUserId, false);
        const held = this.diceElements[this.currentUserId].map((die) => die.getAttribute('held') === 'true');
        this.dispatch('dp:done-rolling', { held });
    }

    showResult(userId, handType, isWinner) {
        const section = this.shadowRoot.querySelector(`[data-user-id="${userId}"]`);
        if (!section) return;

        let resultEl = section.querySelector('.hand-result');
        if (!resultEl) {
            resultEl = document.createElement('p');
            resultEl.className = 'hand-result';
            section.querySelector('.player').appendChild(resultEl);
        }

        resultEl.textContent = isWinner ? `🏆 ${handType}` : handType;
        resultEl.classList.toggle('winner', isWinner);
    }

    clearResults() {
        this.shadowRoot.querySelectorAll('.hand-result').forEach((result) => result.remove());
    }

    // Bubbles a CustomEvent up through the DOM so Game.jsx can listen to it
    dispatch(type, detail) {
        this.dispatchEvent(
            new CustomEvent(type, {
                detail,
                bubbles: true,
                composed: true
            })
        );
    }
}

customElements.define('dice-poker-board', DicePokerBoard);
