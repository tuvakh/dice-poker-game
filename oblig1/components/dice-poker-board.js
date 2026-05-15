class DicePokerBoard extends HTMLElement {
    static get observedAttributes() {
        return ['player1', 'player2', 'bestof', 'include-straight'];
    }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        this.gameStarted = false;

        this.playerNames = { player1: 'Player 1', player2: 'Player 2' };
        this.bestOf = 3;
        this.includeStraight = true;

        this.roundNr = 1;
        this.activePlayer = 'player1';
        this.remainingRolls = 0;

        this.score = { player1: 0, player2: 0 };
        this.roundDecided = false;
        this.matchDecided = false;

        this.dice = { player1: [], player2: [] };
        this.diceWrap = { player1: null, player2: null };
        this.btnStart = null;
        this.btnRoll = null;
        this.btnEndTurn = null;
        this.btnNextRound = null;
        this.btnRestart = null;

        this.player1El = null;
        this.player2El = null;
        this.player1Section = null;
        this.player2Section = null;

        this.onDieHeldChanged = (event) => {
            const owner = event.detail.owner;

            if (owner !== this.activePlayer || this.roundDecided) {
                const dieEl = event.target;
                dieEl.setAttribute('held', 'false');
            }
        };
    }

    connectedCallback() {
        if (this.hasAttribute('player1')) this.playerNames.player1 = this.getAttribute('player1');
        if (this.hasAttribute('player2')) this.playerNames.player2 = this.getAttribute('player2');

        if (this.hasAttribute('bestof')) {
            const n = Number(this.getAttribute('bestof'));
            if (n === 3 || n === 5 || n === 7) this.bestOf = n;
        }

        if (this.hasAttribute('include-straight')) {
            this.includeStraight = this.getAttribute('include-straight') !== 'false';
        }

        this.renderLayout();
        this.createDice();
        this.wireEvents();
        this.resetGameState();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;

        if (name === 'player1' && newValue) this.playerNames.player1 = newValue;
        if (name === 'player2' && newValue) this.playerNames.player2 = newValue;

        if (name === 'bestof') {
            const n = Number(newValue);
            if (n === 3 || n === 5 || n === 7) this.bestOf = n;
        }

        if (name === 'include-straight') {
            this.includeStraight = newValue !== 'false';
        }

        if (this.isConnected) this.renderNames();
    }

    renderLayout() {
        this.shadowRoot.innerHTML = `
        <style>
            :host { 
                background-color: var(--box-bg-color); 
            }

            .container {
                margin: 1rem auto;
                padding: 1rem;
                background-color: var(--board-bg-color); 
                border: 2px solid var(--border-color); 
            }

            .player, .board {
                display: flex;
                flex-direction: column;
                justify-items: center;
                padding: 1rem;
            }
            
            .startBtn {
                width: min(320px, 40%);
                margin: 0.5rem auto 0;
                background-color: var(--startbtn-bg-color); 
                font-size: 1.3rem;
            }

            section.inactive { 
                opacity: 0.5; 
            }

            .dice { 
                display: flex; 
                gap: 0.5rem; 
                flex-wrap: wrap; 
                justify-content: center;
                margin-top: 0.3rem;
            }

            button { 
                margin-block: 1rem;
                padding: 0.6rem 0.8rem; 
                border: 1px solid #fff; 
                background-color: transparent; 
                color: white; 
                font-size: 1rem;
            }

            button:disabled { 
                opacity: 0.5; 
                cursor: not-allowed; 
            }

            .button-box {
                display: flex;
                justify-content: center;
                gap: 0.5rem;
                flex-wrap: wrap;
            }

            .player1, .player2 { 
                color: var(--playerName-color); 
                font-weight: 700; 
            }
            @media (max-width: 480px) {
                button {
                    flex-basis: 100%;
                    margin: 0;
                }
            }
        </style>

        <div class="container">
            <div class="board">
                <section data-player="player1">
                    <div class="player">
                        <div><span class="player1"></span></div>
                        <div class="dice"></div>
                    </div>
                </section>

                <button type="button" class="startBtn">Start game</button>

                <section data-player="player2">
                    <div class="player">
                        <div><span class="player2"></span></div>
                        <div class="dice"></div>
                    </div>
                </section>
            </div>

            <div class="button-box">
                <button type="button">Roll</button>
                <button type="button">End Turn</button>
                <button type="button">Start Next Round</button>
                <button type="button">Restart Match</button>
            </div>
        </div>
        `;

        this.player1Section = this.shadowRoot.querySelector('[data-player="player1"]');
        this.player2Section = this.shadowRoot.querySelector('[data-player="player2"]');

        this.player1El = this.shadowRoot.querySelector('[data-player="player1"] .player1');
        this.player2El = this.shadowRoot.querySelector('[data-player="player2"] .player2');

        this.diceWrap.player1 = this.shadowRoot.querySelector('[data-player="player1"] .dice');
        this.diceWrap.player2 = this.shadowRoot.querySelector('[data-player="player2"] .dice');

        const buttons = this.shadowRoot.querySelectorAll('.container button');
        
        this.btnStart = buttons[0];
        this.btnRoll = buttons[1];
        this.btnEndTurn = buttons[2];
        this.btnNextRound = buttons[3];
        this.btnRestart = buttons[4];

        this.renderNames();
    }

    renderNames() {
        if (this.player1El) this.player1El.textContent = this.playerNames.player1;
        if (this.player2El) this.player2El.textContent = this.playerNames.player2;
    }

    createDice() {
        this.dice.player1 = [];
        this.dice.player2 = [];

        for (let i = 1; i <= 5; i += 1) {
            const dice1 = document.createElement('dice-poker-die');
            dice1.setAttribute('owner', 'player1');
            dice1.setAttribute('die-id', String(i));
            dice1.setAttribute('face', '7');
            dice1.setAttribute('held', 'false');
            this.diceWrap.player1.appendChild(dice1);
            this.dice.player1.push(dice1);

            const dice2 = document.createElement('dice-poker-die');
            dice2.setAttribute('owner', 'player2');
            dice2.setAttribute('die-id', String(i));
            dice2.setAttribute('face', '7');
            dice2.setAttribute('held', 'false');
            this.diceWrap.player2.appendChild(dice2);
            this.dice.player2.push(dice2);
        }
    }

    wireEvents() {
        this.addEventListener('dp:die-held-changed', this.onDieHeldChanged, { capture: true });

        this.btnStart.addEventListener('click', () => this.startGame());
        this.btnRoll.addEventListener('click', () => this.rollActivePlayer());
        this.btnEndTurn.addEventListener('click', () => this.endTurn());
        this.btnNextRound.addEventListener('click', () => this.beginNextRound());
        this.btnRestart.addEventListener('click', () => this.restartMatch());
    }

    resetGameState() {
        this.gameStarted = false;
        this.roundNr = 1;
        this.activePlayer = 'player1';
        this.remainingRolls = 0;

        this.roundDecided = false;
        this.matchDecided = false;

        this.resetDice();

        this.updateUI();
    }

    startGame() {
        if (this.gameStarted) return;
        this.restartMatch();
    }

    restartMatch() {
        this.gameStarted = true;

        this.score.player1 = 0;
        this.score.player2 = 0;
        this.roundNr = 1;
        this.roundDecided = false;
        this.matchDecided = false;

        this.dispatch('dp:match-reset', {
            scoreline: { player1: 0, player2: 0 }
        });

        this.startNewRound();
    }

    startNewRound() {
        if (this.matchDecided) return;

        this.roundDecided = false;

        this.resetDice();

        this.activePlayer = 'player1';
        this.remainingRolls = 3;

        this.dispatch('dp:round-start', { round: this.roundNr });
        this.updateUI();

        this.dispatch('dp:turn-changed', { player: this.activePlayer, remainingRolls: this.remainingRolls });
        this.rollActivePlayer();
    }

    beginNextRound() {
        if (this.matchDecided) return;
            this.roundNr += 1;
            this.startNewRound();
    }

    rollActivePlayer() {
        if (this.roundDecided) return;
        if (this.remainingRolls <= 0) return;

        const dice = this.dice[this.activePlayer];

        for (const die of dice) {
            die.roll();
        }

        this.remainingRolls -= 1;

        this.dispatch('dp:turn-changed', { player: this.activePlayer, remainingRolls: this.remainingRolls });

        const faces = dice.map((die) => die.getAttribute('face'));
        const held = dice.map((die) => die.getAttribute('held') === 'true');

        this.dispatch('dp:roll-executed', { player: this.activePlayer, faces, held });

        this.updateUI();
    }

    endTurn() {
        if (this.roundDecided) return;

        for (const die of this.dice[this.activePlayer]) {
            die.setAttribute('held', 'false');
        }

        if (this.activePlayer === 'player1') {
            this.activePlayer = 'player2';
            this.remainingRolls = 3;
            this.updateUI();
            this.dispatch('dp:turn-changed', { player: this.activePlayer, remainingRolls: this.remainingRolls });
            
            this.rollActivePlayer();
            return;
        }

        if (this.activePlayer === 'player2') {
            this.decideRoundWinner();
        }
    }

    decideRoundWinner() {
        const player1Faces = this.dice.player1.map((die) => die.getAttribute('face'));
        const player2Faces = this.dice.player2.map((die) => die.getAttribute('face'));

        const player1hand = this.evaluateHand(player1Faces);
        const player2hand = this.evaluateHand(player2Faces);

        const result = this.compareHands(player1hand, player2hand);
        const winner = result >= 0 ? 'player1' : 'player2';

        this.score[winner] += 1;
        this.roundDecided = true;

        const roundSummary =
            `${this.playerNames.player1} has: ${player1hand.handType}\n` +
            `${this.playerNames.player2} has: ${player2hand.handType}.\n\n` +
            `${this.playerNames[winner]} wins this round.`;

        this.dispatch('dp:round-decided', {
            winner,
            hands: {
                player1: { faces: player1Faces, handType: player1hand.handType },
                player2: { faces: player2Faces, handType: player2hand.handType }
            },
            roundSummary,
            scoreline: { player1: this.score.player1, player2: this.score.player2 }
        });

        const winsNeeded = Math.ceil(this.bestOf / 2);
        const matchOver = this.score.player1 >= winsNeeded || this.score.player2 >= winsNeeded;

        if (matchOver) {
            const champion = this.score.player1 >= winsNeeded ? 'player1' : 'player2';
            this.matchDecided = true;

            this.dispatch('dp:match-decided', {
                champion,
                scoreline: { player1: this.score.player1, player2: this.score.player2 }
            });
        }

        this.updateUI();
    }

    updateUI() {
        if (!this.gameStarted) {
            this.player1Section.classList.add('inactive');
            this.player2Section.classList.add('inactive');

            this.btnStart.disabled = false;
            this.btnRoll.disabled = true;
            this.btnEndTurn.disabled = true;
            this.btnNextRound.disabled = true;
            this.btnRestart.disabled = true;
            return;
        }

        this.player1Section.classList.toggle('inactive', this.activePlayer !== 'player1');
        this.player2Section.classList.toggle('inactive', this.activePlayer !== 'player2');

        this.btnRoll.disabled = this.matchDecided || this.roundDecided || this.remainingRolls <= 0;
        this.btnEndTurn.disabled = this.matchDecided || this.roundDecided;
        this.btnNextRound.disabled = this.matchDecided || !this.roundDecided;
        this.btnRestart.disabled = false;

        this.btnStart.disabled = true;
    }

    resetDice() {
        for (const player of ['player1', 'player2']) {
            for (const die of this.dice[player]) {
                die.setAttribute('held', 'false');
                die.setAttribute('face', '7');
            }
        }
    }
    
    faceValue(face) {
        if (face === 'A') return 6;
        if (face === 'K') return 5;
        if (face === 'Q') return 4;
        if (face === 'J') return 3;
        if (face === '8') return 2;
        return 1;
    }

    evaluateHand(faces) {
        const counts = {};
        for (const face of faces) counts[face] = (counts[face] || 0) + 1;

        const entries = Object.entries(counts);

        entries.sort(([faceA, countA], [faceB, countB]) => {
            if (countB !== countA) return countB - countA;
            return this.faceValue(faceB) - this.faceValue(faceA);
        });

        const facesPattern = entries.map((entry) => entry[1]);
        const uniqueFaces = entries.length;
        const allDifferentFaces = uniqueFaces === 5;

        const validStraights = ['78JQK', '8JQKA'];
         
        const sortedFaces = [...faces].sort(
            (faceA, faceB) => this.faceValue(faceA) - this.faceValue(faceB)
        );

        const sortedFacesString = sortedFaces.join('');
        
        const isStraight =
            allDifferentFaces &&
            this.includeStraight &&
            validStraights.includes(sortedFacesString);

        const sortedValuesDescending = [...faces]
            .sort((faceA, faceB) => this.faceValue(faceB) - this.faceValue(faceA))
            .map((face) => this.faceValue(face));

        if (facesPattern[0] === 5) {
            const fiveOfAKind = this.faceValue(entries[0][0]);

            return { 
                handType: 'Repóker', 
                rank: 1, 
                tie: [fiveOfAKind] 
            };
        }

        if (facesPattern[0] === 4) {
            const fourOfAKind = this.faceValue(entries[0][0]);
            const tieBreaker = this.faceValue(entries[1][0]);

            return { 
                handType: 'Póker', 
                rank: 2, 
                tie: [fourOfAKind, tieBreaker] 
            };
        }

        if (facesPattern[0] === 3 && facesPattern[1] === 2) {
            const threeOfAKind = this.faceValue(entries[0][0]);
            const pair = this.faceValue(entries[1][0]);

            return { handType: 'Full', rank: 3, tie: [threeOfAKind, pair] };
        }

        if (isStraight) {
            const highestFaceValue = this.faceValue(
                sortedFaces[sortedFaces.length - 1]
            );
            return {
                handType: 'Escalera',
                rank: 4,
                tie: [highestFaceValue]
            };
        }

        if (facesPattern[0] === 3) {
            const threeOfAKind = this.faceValue(entries[0][0]);
            const tieBreakers = entries
                .slice(1)
                .map((entry) => this.faceValue(entry[0]))
                .sort((valueA, valueB) => valueB - valueA);
            return { handType: 'Trío', rank: 5, tie: [threeOfAKind, ...tieBreakers] };
        }

        if (facesPattern[0] === 2 && facesPattern[1] === 2) {
            const firstPair = this.faceValue(entries[0][0]);
            const secondPair = this.faceValue(entries[1][0]);
            const highPair = Math.max(firstPair, secondPair);
            const lowPair = Math.min(firstPair, secondPair);
            const tieBreaker = this.faceValue(entries[2][0]);
            return { handType: 'Doble Pareja', rank: 6, tie: [highPair, lowPair, tieBreaker] };
        }

        if (facesPattern[0] === 2) {
            const pair = this.faceValue(entries[0][0]);
            const tieBreakers = entries
                .slice(1)
                .map((entry) => this.faceValue(entry[0]))
                .sort((valueA, valueB) => valueB - valueA);
            return { handType: 'Pareja', rank: 7, tie: [pair, ...tieBreakers] };
        }

        return { handType: 'Carta Alta', rank: 8, tie: sortedValuesDescending };
    }

    compareHands(player1hand, player2hand) {
        if (player1hand.rank !== player2hand.rank) return player1hand.rank < player2hand.rank ? 1 : -1;

        const player1Tie = player1hand.tie;
        const player2Tie = player2hand.tie;
        const maxLength = Math.max(player1Tie.length, player2Tie.length);

        for (let i = 0; i < maxLength; i += 1) {
            const player1TieValue = player1Tie[i] || 0;
            const player2TieValue = player2Tie[i] || 0;
            if (player1TieValue !== player2TieValue) return player1TieValue > player2TieValue ? 1 : -1;
        }

        return 0;
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
