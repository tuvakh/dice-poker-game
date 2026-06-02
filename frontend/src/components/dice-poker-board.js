// Adapted from oblig1 for multiplayer server-driven gameplay.
// Game logic (rolling, scoring, turns) has moved to the backend.
// This component only renders state it receives and dispatches user actions upward.

class DicePokerBoard extends HTMLElement {
    constructor() {
        super();
        // Shadow DOM isolates this component's styles and structure from the rest of the page
        this.attachShadow({ mode: 'open' });

        // The logged-in user's ID, used to decide whose dice are interactive
        this.currentUserId = null;

        // Lookup table: userId -> array of 5 dice-poker-die elements for that player
        this.diceElements = {};
    }

    // Called by the browser when the element enters the DOM
    connectedCallback() {
        // Renders the board shell once; players and their dice are added later via addPlayer()
        this.shadowRoot.innerHTML = `
        <style>
            :host {
                display: block;
                padding: 1rem;
                width: 100%;
                color: #fff;
            }

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

            .player-left-notice {
                margin-top: 0.6rem;
                font-weight: bold;
                text-align: center;
                font-size: 0.95rem;
            }

            .player-name {
                font-weight: bold;
                font-size: 1rem;
                margin-block: var(--small-space);
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
                font-size: 1.05rem;
            }
        </style>

        <div class="players" id="players"></div>
        `;

        // Intercept hold-toggle events from opponents' dice before they reach the die element
        // capture:true means this listener runs before the die's own click handler
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

    // Creates a section with 5 dice for a player; called once per player when the game starts
    addPlayer(userId, name) {
        // Avoid duplicating a player if addPlayer is called again (e.g. on rejoin)
        if (this.diceElements[userId]) return;

        const playersContainer = this.shadowRoot.getElementById('players');

        const section = document.createElement('section');
        // data-user-id lets showResult and showPlayerLeft find this section by userId later
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
            // '?' means unrevealed; the face is set by the server once rolls come in
            die.setAttribute('face', '?');
            die.setAttribute('held', 'false');
            diceContainer.appendChild(die);
            this.diceElements[userId].push(die);
        }

        playersContainer.appendChild(section);
    }

    // Updates each die's face value; if animate is true, triggers the shake+spin animation
    setDice(userId, faces, animate = false) {
        const dice = this.diceElements[userId];
        if (!dice) return;

        faces.forEach((face, i) => {
            dice[i].setAttribute('face', face);
            if (animate) dice[i].roll();
        });
    }

    // Enables/disables the current player's dice; always locks and dims opponents' dice
    setInteractive(userId, canInteract) {
        const dice = this.diceElements[userId];
        if (dice) {
            dice.forEach((die) => {
                die.style.pointerEvents = canInteract ? 'auto' : 'none';
                die.style.opacity = '1';
            });
        }

        // Dim all opponents' dice regardless of canInteract
        for (const [otherId, otherDice] of Object.entries(this.diceElements)) {
            if (otherId !== userId) {
                otherDice.forEach((die) => {
                    die.style.pointerEvents = 'none';
                    die.style.opacity = '0.4';
                });
            }
        }
    }

    // Marks a player's dice as held visually; used to show opponents' holds without revealing their faces
    setHeld(userId, heldArray) {
        const dice = this.diceElements[userId];
        if (!dice) return;
        heldArray.forEach((isHeld, index) => {
            dice[index].setAttribute('held', isHeld ? 'true' : 'false');
        });
    }

    // Clears held state on every player's dice; called at the start of each new round
    resetAllHeld() {
        for (const diceArray of Object.values(this.diceElements)) {
            diceArray.forEach((die) => die.setAttribute('held', 'false'));
        }
    }

    // showResult and showPlayerLeft both lazily create a label under a player's dice if it doesn't exist yet

    // Shows the hand type label (e.g. "Full House") and highlights the winner
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

    // Shows a notice under a player's dice when they have left the game
    showPlayerLeft(userId) {
        const section = this.shadowRoot.querySelector(`[data-user-id="${userId}"]`);
        if (!section) return;

        let noticeEl = section.querySelector('.player-left-notice');
        if (!noticeEl) {
            noticeEl = document.createElement('p');
            noticeEl.className = 'player-left-notice';
            section.querySelector('.player').appendChild(noticeEl);
        }

        noticeEl.textContent = '⚠️ This user left. Their turn is now automatic';
    }

    // Removes all result and notice labels; called at the start of a new round
    clearResults() {
        this.shadowRoot.querySelectorAll('.hand-result, .player-left-notice').forEach((el) => el.remove());
    }

    // handleRollAgain and handleDoneRolling are the two player action handlers; both read held state and dispatch upward

    // Reads which dice are held and fires dp:roll-again so Game.jsx can forward it to the server
    handleRollAgain() {
        const held = this.diceElements[this.currentUserId].map((die) => die.getAttribute('held') === 'true');
        this.dispatch('dp:roll-again', { held });
    }

    // Fires dp:done-rolling; guards against firing before all dice have been revealed
    handleDoneRolling() {
        const dice = this.diceElements[this.currentUserId];
        const hasUnrevealedDice = dice?.some((die) => die.getAttribute('face') === '?');
        if (hasUnrevealedDice) return;

        // Lock interaction immediately so the player cannot change holds after confirming
        this.setInteractive(this.currentUserId, false);
        const held = this.diceElements[this.currentUserId].map((die) => die.getAttribute('held') === 'true');
        this.dispatch('dp:done-rolling', { held });
    }

    // Helper that fires any custom event upward; bubbles and composed let it cross the shadow DOM boundary to Game.jsx
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
