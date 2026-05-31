import { useRef } from "react";
import { useAppearance } from "../contexts/AppearanceContext";

// All sounds are generated with the Web Audio API — no audio files needed.
// The AudioContext is created lazily on first use because browsers block it
// until the user has interacted with the page.
export function useSoundEffects() {
    const { preferences } = useAppearance();
    const ctxRef = useRef(null);

    // Returns the shared AudioContext, creating it once on first use
    function getCtx() {
        if (!ctxRef.current) {
            ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
        }
        return ctxRef.current;
    }

    // Short descending tone used for UI button clicks and round starts
    // An oscillator sweeps from 440 Hz down to 220 Hz over 80ms
    function playClick() {
        if (!preferences.soundEnabled) return;
        const ac = getCtx();
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.connect(gain);
        gain.connect(ac.destination);
        osc.frequency.setValueAtTime(440, ac.currentTime);
        osc.frequency.exponentialRampToValueAtTime(220, ac.currentTime + 0.08);
        gain.gain.setValueAtTime(0.25, ac.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.08);
        osc.start(ac.currentTime);
        osc.stop(ac.currentTime + 0.08);
    }

    // Ascending three-note chord used when the room fills up and when the game ends
    // Three oscillators play C, E, G staggered 100ms apart to create a fanfare
    function playJoin() {
        if (!preferences.soundEnabled) return;
        const ac = getCtx();
        [523.25, 659.25, 783.99].forEach((freq, i) => {
            const osc = ac.createOscillator();
            const gain = ac.createGain();
            osc.connect(gain);
            gain.connect(ac.destination);
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.18, ac.currentTime + i * 0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + i * 0.1 + 0.25);
            osc.start(ac.currentTime + i * 0.1);
            osc.stop(ac.currentTime + i * 0.1 + 0.25);
        });
    }

    // Dice roll sound played when new dice arrive from the server after a roll.
    // A buffer of random values (white noise) is run through a bandpass filter
    // centred at 1200 Hz so it sounds like dice clattering, not pure static.
    function playRoll() {
        if (!preferences.soundEnabled) return;
        const ac = getCtx();
        const bufferSize = Math.floor(ac.sampleRate * 0.12);
        const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const source = ac.createBufferSource();
        source.buffer = buffer;
        const filter = ac.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1200;
        filter.Q.value = 0.8;
        const gain = ac.createGain();
        source.connect(filter);
        filter.connect(gain);
        gain.connect(ac.destination);
        gain.gain.setValueAtTime(0.4, ac.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.12);
        source.start();
        source.stop(ac.currentTime + 0.12);
    }

    // Die hold click played when the player selects which dice to keep before re-rolling.
    // A very short high-pitched sine blip at 880 Hz (50ms) feels like a soft tap on a die.
    function playHold() {
        if (!preferences.soundEnabled) return;
        const ac = getCtx();
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.connect(gain);
        gain.connect(ac.destination);
        osc.type = 'sine';
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.15, ac.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.05);
        osc.start(ac.currentTime);
        osc.stop(ac.currentTime + 0.05);
    }

    // Round end sound played when a round finishes and hands are revealed.
    // Three descending notes C -> Ab -> F staggered 120ms apart signal the round is over.
    function playRoundEnd() {
        if (!preferences.soundEnabled) return;
        const ac = getCtx();
        [523.25, 415.30, 349.23].forEach((freq, i) => {
            const osc = ac.createOscillator();
            const gain = ac.createGain();
            osc.connect(gain);
            gain.connect(ac.destination);
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.18, ac.currentTime + i * 0.12);
            gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + i * 0.12 + 0.25);
            osc.start(ac.currentTime + i * 0.12);
            osc.stop(ac.currentTime + i * 0.12 + 0.25);
        });
    }

    return { playClick, playJoin, playRoll, playHold, playRoundEnd };
}
