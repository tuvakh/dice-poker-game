
function isSoundEnabled() {
    try {
        return JSON.parse(localStorage.getItem('preferences') || '{}').soundEnabled !== false;
    } catch { return true; }
}

let _lastRollSound = 0;

function playDieRollSound() {
    if (!isSoundEnabled()) return;
    const now = Date.now();
    if (now - _lastRollSound < 200) return;
    _lastRollSound = now;
    new Audio('/sounds/die-roll.wav').play().catch(() => {});
}

function playDieHoldSound() {
    if (!isSoundEnabled()) return;
    new Audio('/sounds/die-hold.mp3').play().catch(() => {});
}

class DicePokerDie extends HTMLElement {
    static get observedAttributes() {
        return ['face', 'held', 'owner', 'die-id'];
    }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        this._face = '7';
        this._held = false;
        this._owner = 'player1';
        this._dieId = '1';

        this.refs = { faceEl: null, dieEl: null };
    }

    connectedCallback() {
        if (this.hasAttribute('face')) this._face = this.getAttribute('face');
        if (this.hasAttribute('held')) this._held = this.getAttribute('held') === 'true';
        if (this.hasAttribute('owner')) this._owner = this.getAttribute('owner');
        if (this.hasAttribute('die-id')) this._dieId = this.getAttribute('die-id');

        this.shadowRoot.innerHTML = `
            <style>
                :host([rolling="true"]) {
                    animation: rollShake 0.35s ease;
                }

                @keyframes rollShake {
                    0%   { transform: rotate(0deg); }
                    25%  { transform: rotate(10deg); }
                    50%  { transform: rotate(-10deg); }
                    75%  { transform: rotate(6deg); }
                    100% { transform: rotate(0deg); }
                }

                .die {
                    background-color: var(--die-bg-color);
                    border-radius: var(--border-radius);
                    border: 2px solid var(--button-border-color);
                    aspect-ratio: 1 / 1;
                    width: clamp(45px, 7vw, 75px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 2.5rem;
                    cursor: pointer;
                }

                .die.held {
                    outline: 3px solid var(--die-held-color);
                }
            </style>

            <div class="die">
                <span></span>
            </div>
        `;

        this.refs.dieEl = this.shadowRoot.querySelector('.die');
        this.refs.faceEl = this.shadowRoot.querySelector('span');

        this.refs.dieEl.addEventListener('click', () => this.toggleHeld());

        this.updateUI();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;

        if (name === 'face') this._face = newValue;
        if (name === 'held') this._held = newValue === 'true';
        if (name === 'owner') this._owner = newValue;
        if (name === 'die-id') this._dieId = newValue;

        this.updateUI();
    }

    get face() { return this._face; }
    set face(value) {
        if (this._face === value) return;
        this._face = value;
        this.setAttribute('face', value);
        this.updateUI();
    }

    get held() { return this._held; }
    set held(value) {
        const next = Boolean(value);
        if (this._held === next) return;
        this._held = next;
        this.setAttribute('held', next ? 'true' : 'false');
        this.updateUI();
    }

    get owner() { return this._owner; }
    set owner(value) {
        this._owner = value;
        this.setAttribute('owner', value);
    }

    get dieId() { return this._dieId; }
    set dieId(value) {
        this._dieId = value;
        this.setAttribute('die-id', value);
    }

    updateUI() {
        if (!this.refs.faceEl || !this.refs.dieEl) return;

        this.refs.faceEl.textContent = this._face;
        this.refs.dieEl.classList.toggle('held', this._held);

        const isRed = this._face === 'A' || this._face === 'K' || this._face === '8';
        this.refs.faceEl.style.color = isRed
            ? 'var(--die-face-color-red)'
            : 'var(--die-face-color-black)';
    }

    toggleHeld() {
        if (this._face === '?') return;

        playDieHoldSound();
        this.held = !this._held;

        this.dispatchEvent(
            new CustomEvent('dp:die-held-changed', {
                detail: { dieId: this._dieId, held: this._held, owner: this._owner },
                bubbles: true,
                composed: true
            })
        );
    }

    roll() {
        if (this.getAttribute('held') === 'true') return;

        playDieRollSound();
        this.setAttribute('rolling', 'true');

        const FACES = ['A', 'K', 'Q', 'J', '10', '9'];

        let elapsed = 0;
        const spinInterval = setInterval(() => {
            elapsed += 50;
            if (elapsed >= 300) {
                clearInterval(spinInterval);
                if (this.refs.faceEl) this.updateUI();
            } else {
                const randomFace = FACES[Math.floor(Math.random() * FACES.length)];
                if (this.refs.faceEl) {
                    this.refs.faceEl.textContent = randomFace;
                    const isRed = randomFace === 'A' || randomFace === 'K' || randomFace === '8';
                    this.refs.faceEl.style.color = isRed
                        ? 'var(--die-face-color-red)'
                        : 'var(--die-face-color-black)';
                }
            }
        }, 50);

        setTimeout(() => this.removeAttribute('rolling'), 350);
    }
}

customElements.define('dice-poker-die', DicePokerDie);
