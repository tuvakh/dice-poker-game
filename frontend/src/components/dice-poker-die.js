// Adapted from oblig1. Renders a single die and handles hold toggling.
// The face value is set externally by the server via setAttribute('face', value).
// roll() only triggers the shake animation, it no longer generates a random face.

// Reads the soundEnabled flag stored in localStorage by AppearanceContext
function isSoundEnabled() {
    try {
        return JSON.parse(localStorage.getItem('preferences') || '{}').soundEnabled !== false;
    } catch { return true; }
}

// All 5 dice roll at once, so we debounce to fire only one sound per roll event (ignores calls within 200ms)
let _lastRollSound = 0;

// Sound files live in /public/sounds/ -- swap the files there to change the sounds
function playDieRollSound() {
    if (!isSoundEnabled()) return;
    // Debounce: all 5 dice roll at once, only fire one sound per roll event
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
    // Tells the browser which attributes to watch; changes to these fire attributeChangedCallback
    static get observedAttributes() {
        return ['face', 'held', 'owner', 'die-id'];
    }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        // Default values before any attributes are set by the parent
        this._face = '7';
        this._held = false;
        this._owner = 'player1';
        this._dieId = '1';

        this.refs = { faceEl: null, dieEl: null };
    }

    connectedCallback() {
        // Read any attributes that were set before the element was added to the DOM
        if (this.hasAttribute('face')) this._face = this.getAttribute('face');
        if (this.hasAttribute('held')) this._held = this.getAttribute('held') === 'true';
        if (this.hasAttribute('owner')) this._owner = this.getAttribute('owner');
        if (this.hasAttribute('die-id')) this._dieId = this.getAttribute('die-id');

        // Shadow DOM isolates these styles so they don't leak into the rest of the page
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

        // Clicking a die toggles its held state
        this.refs.dieEl.addEventListener('click', () => this.toggleHeld());

        this.updateUI();
    }

    // Fires when an observed attribute changes; keeps internal state in sync with the HTML attribute
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;

        if (name === 'face') this._face = newValue;
        if (name === 'held') this._held = newValue === 'true';
        if (name === 'owner') this._owner = newValue;
        if (name === 'die-id') this._dieId = newValue;

        this.updateUI();
    }

    // Getters and setters keep internal state and the HTML attribute in sync with each other
    get face() { return this._face; }
    set face(value) {
        if (this._face === value) return;
        this._face = value;
        this.setAttribute('face', value);
        this.updateUI();
    }

    // Toggling held triggers a repaint and fires a custom event up to the game board
    get held() { return this._held; }
    set held(value) {
        const next = Boolean(value);
        if (this._held === next) return;
        this._held = next;
        this.setAttribute('held', next ? 'true' : 'false');
        this.updateUI();
    }

    // owner and dieId are set once on creation and identify which player and slot this die belongs to
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

    // Updates the visual state: face value, held outline, and face colour
    updateUI() {
        if (!this.refs.faceEl || !this.refs.dieEl) return;

        this.refs.faceEl.textContent = this._face;
        this.refs.dieEl.classList.toggle('held', this._held);

        // A, K, and 8 are red in Spanish playing cards (hearts/diamonds suit association)
        const isRed = this._face === 'A' || this._face === 'K' || this._face === '8';
        this.refs.faceEl.style.color = isRed
            ? 'var(--die-face-color-red)'
            : 'var(--die-face-color-black)';
    }

    // Toggles held, plays a sound, and fires a custom event so the board can send the update to the server
    toggleHeld() {
        // '?' means the face is not yet revealed, so holding is not allowed
        if (this._face === '?') return;

        playDieHoldSound();
        this.held = !this._held;

        // bubbles:true and composed:true let the event cross the shadow DOM boundary to the React component
        this.dispatchEvent(
            new CustomEvent('dp:die-held-changed', {
                detail: { dieId: this._dieId, held: this._held, owner: this._owner },
                bubbles: true,
                composed: true
            })
        );
    }

    // Plays the shake animation and cycles through random faces before snapping to the real value
    // _face and the attribute are never changed during the spin so there are no side effects on game state
    roll() {
        if (this.getAttribute('held') === 'true') return;

        playDieRollSound();
        this.setAttribute('rolling', 'true');

        // Spanish poker dice faces, the same values the server can send
        const FACES = ['A', 'K', 'Q', 'J', '10', '9'];

        // Cycle through random faces every 50ms for 300ms, then snap back to the real face
        let elapsed = 0;
        const spinInterval = setInterval(() => {
            elapsed += 50;
            if (elapsed >= 300) {
                clearInterval(spinInterval);
                if (this.refs.faceEl) this.updateUI();
            } else {
                // Write directly to the DOM element to avoid triggering any state side effects
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

        // Remove the rolling attribute slightly after the spin ends to let the animation finish
        setTimeout(() => this.removeAttribute('rolling'), 350);
    }
}

customElements.define('dice-poker-die', DicePokerDie);
