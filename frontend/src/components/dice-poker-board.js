
class DicePokerBoard extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        this.currentUserId = null;

        this.diceElements = {};
    }

    connectedCallback() {
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

    addPlayer(userId, name) {
        if (this.diceElements[userId]) return;

        const playersContainer = this.shadowRoot.getElementById('players');

        const section = document.createElement('section');
        section.dataset.userId = userId;
        section.innerHTML = `
            <div class="player">
                <div class="player-name">${name}</div>
                <div class="dice"></div>
            </div>
        `;

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

    setDice(userId, faces, animate = false) {
        const dice = this.diceElements[userId];
        if (!dice) return;

        faces.forEach((face, i) => {
            dice[i].setAttribute('face', face);
            if (animate) dice[i].roll();
        });
    }

    setInteractive(userId, canInteract) {
        const dice = this.diceElements[userId];
        if (dice) {
            dice.forEach((die) => {
                die.style.pointerEvents = canInteract ? 'auto' : 'none';
                die.style.opacity = '1';
            });
        }

        for (const [otherId, otherDice] of Object.entries(this.diceElements)) {
            if (otherId !== userId) {
                otherDice.forEach((die) => {
                    die.style.pointerEvents = 'none';
                    die.style.opacity = '0.4';
                });
            }
        }
    }

    setHeld(userId, heldArray) {
        const dice = this.diceElements[userId];
        if (!dice) return;
        heldArray.forEach((isHeld, index) => {
            dice[index].setAttribute('held', isHeld ? 'true' : 'false');
        });
    }

    resetAllHeld() {
        for (const diceArray of Object.values(this.diceElements)) {
            diceArray.forEach((die) => die.setAttribute('held', 'false'));
        }
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

    clearResults() {
        this.shadowRoot.querySelectorAll('.hand-result, .player-left-notice').forEach((el) => el.remove());
    }


    handleRollAgain() {
        const held = this.diceElements[this.currentUserId].map((die) => die.getAttribute('held') === 'true');
        this.dispatch('dp:roll-again', { held });
    }

    handleDoneRolling() {
        const dice = this.diceElements[this.currentUserId];
        const hasUnrevealedDice = dice?.some((die) => die.getAttribute('face') === '?');
        if (hasUnrevealedDice) return;

        this.setInteractive(this.currentUserId, false);
        const held = this.diceElements[this.currentUserId].map((die) => die.getAttribute('held') === 'true');
        this.dispatch('dp:done-rolling', { held });
    }

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
