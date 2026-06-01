// Adapted from oblig1 for multiplayer server-driven gameplay.
// Game logic (rolling, scoring, turns) has moved to the backend.
// This component only renders state it receives and dispatches user actions upward.

class DicePokerBoard extends HTMLElement {
    constructor() {
        super();
        // Shadow DOM isolates this component's styles and structure from the rest of the page
        this.attachShadow({ mode: 'open' });

        // The logged-in user's ID — used to decide whose dice are interactive
        this.currentUserId = null;

        // Lookup table: userId → array of 5 dice-poker-die elements for that player
        this.diceElements = {};
    }

    // Called by the browser when the element enters the DOM
    connectedCallback() {
        // Renders the board shell once. Players and their dice are added later via addPlayer()
        this.shadowRoot.innerHTML = `
        <style>
            :host { display: block; padding: 1rem; width: 100%; }

            .players {
                display: flex;
                flex-direction: row;
                flex-wrap: wrap;
                gap: 1.5rem;
                justify-content: center;
                width: 100%;
            }

            .player {
                border-radius: 0.8rem;
                padding: 1rem;
                display: flex;
                flex-direction: column;
                align-items: center;
            }

            .player-name {
                font-weight: bold;
                font-size: 1rem;
                margin-bottom: 0.75rem;
                text-align: center;
            }

            .dice {
                display: flex;
                gap: 0.4rem;
                justify-content: center;
            }

            button {
                padding: 0.5rem 1.2rem;
                cursor: pointer;
                border-radius: 0.5rem;
                border: 2px solid #85b5a8;
                background: white;
                font-weight: bold;
                font-size: 0.95rem;
                transition: background 0.15s;
            }

            button:hover:not(:disabled) {
                background: #d4efe8;
            }

            button:disabled {
                opacity: 0.4;
                cursor: not-allowed;
            }

            .hand-result {
                margin-top: 0.6rem;
                font-weight: bold;
                text-align: center;
                font-size: 0.95rem;
            }

            .hand-result.winner {
                color: #2a8c4a;
                font-size: 1.05rem;
            }
        </style>

        <div class="players" id="players"></div>
        `;

        // Block hold-toggle events from opponents' dice
        // capture:true intercepts before the die reacts
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

    // Creates a section with 5 dice for a player, called once per player when the game starts
    addPlayer(userId, name) {
        // Avoid duplicating a player if addPlayer is called again (e.g., on rejoin)
        if (this.diceElements[userId]) return;

        const playersContainer = this.shadowRoot.getElementById('players');

        const section = document.createElement('section');
        // data-user-id is stored on the section so showResult can find it by userId later
        section.dataset.userId = userId;
        section.innerHTML = `
            <div class="player">
                <div class="player-name">${name}</div>
                <div class="dice"></div>
            </div>
        `;

        // Create and register 5 dice for this player
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

    // Updates each die's face
    // resetHeld:true is passed at round start to unhold all dice
    setDice(userId, faces, animate = false) {
        const dice = this.diceElements[userId];
        if (!dice) return;

        faces.forEach((face, i) => {
            dice[i].setAttribute('face', face);
            if (animate) dice[i].roll();
        });
    }

    // Enables/disables the current player's dice and buttons, and always locks opponents' dice
    setInteractive(userId, canInteract) {
        const dice = this.diceElements[userId];
        if (dice) {
            dice.forEach((die) => {
                die.style.pointerEvents = canInteract ? 'auto' : 'none';
                die.style.opacity = '1';
            });
        }

        // Dim and disable all opponents' dice regardless of canInteract
        for (const [otherId, otherDice] of Object.entries(this.diceElements)) {
            if (otherId !== userId) {
                otherDice.forEach((die) => {
                    die.style.pointerEvents = 'none';
                    die.style.opacity = '0.4';
                });
            }
        }
    }

    // Marks an opponent's dice as held visually
    // We show holds but never reveal their face values
    setHeld(userId, heldArray) {
        const dice = this.diceElements[userId];
        if (!dice) return;
        heldArray.forEach((isHeld, index) => {
            dice[index].setAttribute('held', isHeld ? 'true' : 'false');
        });
    }

    // Clears held state on every player's dice — called at the start of each round
    resetAllHeld() {
        for (const diceArray of Object.values(this.diceElements)) {
            diceArray.forEach((die) => die.setAttribute('held', 'false'));
        }
    }

    // Shows the hand type label next to a player's dice, created lazily if it doesn't exist yet
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

    // Removes all hand result labels — called at the start of a new round
    clearResults() {
        this.shadowRoot.querySelectorAll('.hand-result').forEach((result) => result.remove());
    }

    // Reads which dice are held and fires dp:roll-again
    // Game.jsx forwards this to the server
    handleRollAgain() {
        const held = this.diceElements[this.currentUserId].map((die) => die.getAttribute('held') === 'true');
        this.dispatch('dp:roll-again', { held });
    }

    // Fires dp:done-rolling
    // guard prevents firing before all dice have loaded (face === '?')
    handleDoneRolling() {
        const dice = this.diceElements[this.currentUserId];
        const hasUnrevealedDice = dice?.some((die) => die.getAttribute('face') === '?');
        if (hasUnrevealedDice) return;

        // Disable interaction immediately so the player can't change holds after confirming
        this.setInteractive(this.currentUserId, false);
        const held = this.diceElements[this.currentUserId].map((die) => die.getAttribute('held') === 'true');
        this.dispatch('dp:done-rolling', { held });
    }

    // Fires a custom event with bubbles:true and composed:true so Game.jsx can catch it across the shadow DOM
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
