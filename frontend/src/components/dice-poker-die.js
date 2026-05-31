// Adapted from oblig1. Renders a single die and handles hold toggling.
// The face value is now set externally by the server via setAttribute('face', value).
// roll() only triggers the shake animation — it no longer generates a random face.

// One shared AudioContext for all die sounds — created lazily on first user interaction
// because browsers block audio until the user has clicked or pressed something.
let _audioCtx = null;
function getAudioCtx() {
    if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (_audioCtx.state === 'suspended') _audioCtx.resume();
    return _audioCtx;
}

// Checks the soundEnabled flag stored in localStorage by AppearanceContext
function isSoundEnabled() {
    try {
        return JSON.parse(localStorage.getItem('preferences') || '{}').soundEnabled !== false;
    } catch { return true; }
}

// Debounce timestamp — all 5 dice roll at once so we only want one sound per roll event.
// If playDieRollSound is called again within 200ms, it does nothing.
let _lastRollSound = 0;

// Soft triangle-wave "tik" — triangle is gentler than sine and sounds like a light tap.
// Only one sound fires per roll event thanks to the debounce above.
function playDieRollSound() {
    if (!isSoundEnabled()) return;
    const now = Date.now();
    if (now - _lastRollSound < 200) return;
    _lastRollSound = now;
    const ac = getAudioCtx();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.type = 'triangle';
    osc.frequency.value = 1000;
    gain.gain.setValueAtTime(0.08, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.1);
    osc.start(ac.currentTime);
    osc.stop(ac.currentTime + 0.1);
}

// Higher-pitched sine blip — distinguishable from the roll sound so hold feels different.
function playDieHoldSound() {
    if (!isSoundEnabled()) return;
    const ac = getAudioCtx();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.type = 'sine';
    osc.frequency.value = 1400;
    gain.gain.setValueAtTime(0.07, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.06);
    osc.start(ac.currentTime);
    osc.stop(ac.currentTime + 0.06);
}

class DicePokerDie extends HTMLElement {
    // Tells the browser which attributes to watch — changes fire attributeChangedCallback
    static get observedAttributes() {
        return ['face', 'held', 'owner', 'die-id'];
    }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        // Default values before any attributes are set
        this._face = '7';
        this._held = false;
        this._owner = 'player1';
        this._dieId = '1';

        this.refs = { faceEl: null, dieEl: null };
    }

    connectedCallback() {
        // Read any attributes set before the element was added to the DOM
        if (this.hasAttribute('face')) this._face = this.getAttribute('face');
        if (this.hasAttribute('held')) this._held = this.getAttribute('held') === 'true';
        if (this.hasAttribute('owner')) this._owner = this.getAttribute('owner');
        if (this.hasAttribute('die-id')) this._dieId = this.getAttribute('die-id');

        // Shadow DOM isolates styles so they don't leak into the rest of the page
        this.shadowRoot.innerHTML = `
            <style>
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

                .die{
                    background-color: var(--die-bg-color);
                    border-radius: var(--border-radius);
                    aspect-ratio: 1 / 1;
                    width: clamp(45px, 7vw, 75px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 2.5rem;
                    cursor: pointer;
                }

                .die.held{
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

    // Fires when an observed attribute changes — keeps internal state in sync
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;

        if (name === 'face') this._face = newValue;
        if (name === 'held') this._held = newValue === 'true';
        if (name === 'owner') this._owner = newValue;
        if (name === 'die-id') this._dieId = newValue;

        this.updateUI();
    }

    // Getters and setters keep the internal state and the HTML attribute in sync
    get face() { return this._face; }
    set face(value) {
        if (this._face === value) return;
        this._face = value;
        this.setAttribute('face', value);
        this.updateUI();
    }

    // Held needs change detection 
    // Toggling it triggers a repaint and fires events
    get held() { return this._held; }
    set held(value) {
        const next = Boolean(value);
        if (this._held === next) return;
        this._held = next;
        this.setAttribute('held', next ? 'true' : 'false');
        this.updateUI();
    }

    // Owner identifies which player this die belongs to. It's set once on creation
    get owner() { return this._owner; }
    set owner(value) {
        this._owner = value;
        this.setAttribute('owner', value);
    }

    // dieId is the die's position in the hand (0–4). It's set once on creation
    get dieId() { return this._dieId; }
    set dieId(value) {
        this._dieId = value;
        this.setAttribute('die-id', value);
    }

    // Updates the visual state — face value and held outline
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

    // Toggles held state, plays a soft tap sound, and notifies the board so it can send the update to the server
    toggleHeld() {
        if (this._face === '?') return;

        playDieHoldSound();
        this.held = !this._held;

        this.dispatchEvent(
            new CustomEvent('dp:die-held-changed', {
                detail: {
                    dieId: this._dieId,
                    held: this._held,
                    owner: this._owner
                },
                bubbles: true,
                composed: true
            })
        );
    }

    // Triggers a slot-machine spin animation: the face cycles through random values before
    // landing on the real result. This is similar to the oblig 1 roll animation.
    // _face and the attribute are never changed during the spin — only the displayed text
    // is updated directly so there are no side effects on the game state.
    // Held dice are skipped — they don't move so they shouldn't make noise or spin.
    roll() {
        if (this.getAttribute('held') === 'true') return;

        playDieRollSound();
        this.setAttribute('rolling', 'true');

        // Spanish poker dice faces — the same values the server can send
        const FACES = ['A', 'K', 'Q', 'J', '10', '9'];

        // Save the real final face so we can snap back to it after the spin
        const finalFace = this._face;

        // Cycle through random faces every 50ms for 300ms, then reveal the real value
        let elapsed = 0;
        const spinInterval = setInterval(() => {
            elapsed += 50;
            if (elapsed >= 300) {
                clearInterval(spinInterval);
                // Snap back to the real face and restore correct colour
                if (this.refs.faceEl) this.updateUI();
            } else {
                // Show a random face during the spin without touching _face or the attribute
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