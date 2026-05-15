class DicePokerMonitor extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        this.roundNr = 0;
        this.activePlayer = '';
        this.remainingRolls = 0;
        this.lastRoll = '';
        this.score = { player1: 0, player2: 0 };
        this.message = '';

        this.playerNames = { player1: 'Player 1', player2: 'Player 2' };
        
        this.skipTurnMessages = 0;

        this.bestOf = 3;
        this.winsNeeded = 2;

        this.textlines = null;

        this.eventTarget = null;
        
        this.onRoundStart = (event) => this.handleRoundStart(event);
        this.onTurnChanged = (event) => this.handleTurnChanged(event);
        this.onRollExecuted = (event) => this.handleRollExecuted(event);
        this.onRoundDecided = (event) => this.handleRoundDecided(event);
        this.onMatchDecided = (event) => this.handleMatchDecided(event);
        this.onMatchReset = () => this.handleMatchReset();
    }

    connectedCallback() {
        this.shadowRoot.innerHTML = `
        <style>
            :host { 
                background-color: var(--box-bg-color); 
            }
            section {
                padding-top: 1rem;
            }
            .box {
                display: flex;
                flex-wrap: wrap;
                justify-content: space-around;
                padding-bottom: 1rem;
            }
            
            .seperate {
                display: flex;
                flex-direction: column;
            }
            .seperate div {
                text-align: center;
            }
            
            .title { 
                font-weight: 800; 
                text-transform: uppercase;
                text-align: center;
            }
            .info {
                font-size: 1.1rem;
                white-space: pre-line;
            }
            .message {
                text-align: center;
                font-size: 1.2rem;
                white-space: pre-line;
            }
            @media (max-width: 480px) {
                .seperate {
                    flex-basis: 100%;
                }
            }
        </style>

        <section>
            <h1 class="title"></h1>

            <div class="box">
                <div class="seperate">
                    <p class="title">Round:</p>
                    <div class="roundNr info"></div>
                </div>

                <div class="seperate">
                    <p class="title">Turn:</p>
                    <div class="activePlayer info"></div>
                </div>    

                <div class="seperate">
                    <p class="title">Last Roll:</p>
                    <div class="lastRoll info"></div>
                </div>

                <div class="seperate">
                    <p class="title">Score:</p>
                    <div class="score info"></div>
                </div>
            </div>

            <p class="title msg">Message</p>
            <div class="message"></div>
        </section>
        `;

        const title = this.shadowRoot.querySelector('h1.title');
        const roundNr = this.shadowRoot.querySelector('.roundNr');
        const activePlayer = this.shadowRoot.querySelector('.activePlayer');
        const lastRoll = this.shadowRoot.querySelector('.lastRoll');
        const score = this.shadowRoot.querySelector('.score');
        const message = this.shadowRoot.querySelector('.message');

        this.textlines = { title, roundNr, activePlayer, lastRoll, score, message };

        this.eventTarget = this.parentElement;

        const board = document.querySelector('dice-poker-board');
        if (board) {
            const player1Name = board.getAttribute('player1');
            const player2Name = board.getAttribute('player2');

            if (player1Name) this.playerNames.player1 = player1Name;
            if (player2Name) this.playerNames.player2 = player2Name;

            const bestOfAttr = Number(board.getAttribute('bestof'));
            if (bestOfAttr === 3 || bestOfAttr === 5 || bestOfAttr === 7) {
                this.bestOf = bestOfAttr;
            } else {
                this.bestOf = 3;
            }

            this.winsNeeded = Math.ceil(this.bestOf / 2);
        }

        if (this.eventTarget) {
            this.eventTarget.addEventListener('dp:round-start', this.onRoundStart);
            this.eventTarget.addEventListener('dp:turn-changed', this.onTurnChanged);
            this.eventTarget.addEventListener('dp:roll-executed', this.onRollExecuted);
            this.eventTarget.addEventListener('dp:round-decided', this.onRoundDecided);
            this.eventTarget.addEventListener('dp:match-decided', this.onMatchDecided);
            this.eventTarget.addEventListener('dp:match-reset', this.onMatchReset);
        }

        this.updateUI();
    }

    disconnectedCallback() {
        if (!this.eventTarget) return;

        this.eventTarget.removeEventListener('dp:round-start', this.onRoundStart);
        this.eventTarget.removeEventListener('dp:turn-changed', this.onTurnChanged);
        this.eventTarget.removeEventListener('dp:roll-executed', this.onRollExecuted);
        this.eventTarget.removeEventListener('dp:round-decided', this.onRoundDecided);
        this.eventTarget.removeEventListener('dp:match-decided', this.onMatchDecided);
        this.eventTarget.removeEventListener('dp:match-reset', this.onMatchReset);

        this.eventTarget = null;
    }

    handleRoundStart(event) {
        this.roundNr = event.detail.round;
        this.message = `Match started. ${this.playerNames.player1} begins`;

        this.updateUI();
    }

    handleTurnChanged(event) {
        this.activePlayer = event.detail.player;
        this.remainingRolls = event.detail.remainingRolls;

        if (this.skipTurnMessages > 0) {
            this.skipTurnMessages -= 1;
        } else {
            this.message = `${this.playerNames[this.activePlayer]} is playing`;
        }
        
        this.updateUI();
    }

    handleRollExecuted(event) {
        const player = event.detail.player;
        const faces = event.detail.faces || [];

        this.lastRoll = `${faces.join('-')}`;

        this.updateUI();
    }

    handleRoundDecided(event) {
        const winner = event.detail.winner;
        const roundSummary = event.detail.roundSummary;

        this.message = roundSummary ? roundSummary : `Round winner: ${this.playerNames[winner]}!`;

        const scoreline = event.detail.scoreline;
        if (scoreline && typeof scoreline.player1 === 'number' && typeof scoreline.player2 === 'number') {
            this.score = { player1: scoreline.player1, player2: scoreline.player2 };
        }

        this.updateUI();
    }

    handleMatchDecided(event) {
        const championName = event.detail.champion;
        const scoreline = event.detail.scoreline;

        if (scoreline && typeof scoreline.player1 === 'number' && typeof scoreline.player2 === 'number') {
            this.score = { player1: scoreline.player1, player2: scoreline.player2 };
        }

        this.message =
            `Match decided:\n` +
            `${this.playerNames[championName]} wins ${this.score.player1}-${this.score.player2}.`;

        this.updateUI();
    }

    handleMatchReset() {
        this.roundNr = 0;
        this.activePlayer = '';
        this.remainingRolls = 0;
        this.lastRoll = '';
        this.score = { player1: 0, player2: 0 };

        this.skipTurnMessages = 2;

        this.updateUI();
    }

    updateUI() {
        if (!this.textlines) return;

        this.textlines.title.textContent = 'Dice Poker Monitor';
        this.textlines.roundNr.textContent = 
            `${this.roundNr}\n`+
            `(Best of ${this.bestOf} (first to ${this.winsNeeded}))`;

        this.textlines.activePlayer.textContent = `${this.playerNames[this.activePlayer] || this.activePlayer} (remaining rolls: ${this.remainingRolls})`;
        this.textlines.lastRoll.textContent = `${this.lastRoll}`;
        this.textlines.score.textContent = `P1: ${this.score.player1} - P2: ${this.score.player2}.`;
        this.textlines.message.textContent = `${this.message}`;
    }
}

customElements.define('dice-poker-monitor', DicePokerMonitor);
