import { useRef } from "react";
import { useAppearance } from "../contexts/AppearanceContext";

export function useSoundEffects() {
    const { preferences } = useAppearance();
    const ctxRef = useRef(null);
    const clickBufferRef = useRef(null);

    // Returns the shared AudioContext, creating it once on first use
    function getCtx() {
        if (!ctxRef.current) {
            ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
        }
        return ctxRef.current;
    }

    // Plays dbl-click.mp3 from /sounds/. The decoded buffer is cached after the first fetch.
    async function playClick() {
        if (!preferences.soundEnabled) return;
        const ac = getCtx();
        if (ac.state === "suspended") await ac.resume();
        if (!clickBufferRef.current) {
            const response = await fetch("/sounds/dbl-click.mp3");
            const arrayBuffer = await response.arrayBuffer();
            clickBufferRef.current = await ac.decodeAudioData(arrayBuffer);
        }
        const source = ac.createBufferSource();
        source.buffer = clickBufferRef.current;
        source.connect(ac.destination);
        source.start();
    }

    const joinBufferRef = useRef(null);

    async function playJoin() {
        if (!preferences.soundEnabled) return;
        const ac = getCtx();
        if (ac.state === "suspended") await ac.resume();
        if (!joinBufferRef.current) {
            const response = await fetch("/sounds/pling.mp3");
            const arrayBuffer = await response.arrayBuffer();
            joinBufferRef.current = await ac.decodeAudioData(arrayBuffer);
        }
        const source = ac.createBufferSource();
        source.buffer = joinBufferRef.current;
        source.connect(ac.destination);
        source.start();
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

    const roundEndBufferRef = useRef(null);

    async function playRoundEnd() {
        if (!preferences.soundEnabled) return;
        const ac = getCtx();
        if (ac.state === "suspended") await ac.resume();
        if (!roundEndBufferRef.current) {
            const response = await fetch("/sounds/finish-level-sfx.mp3");
            const arrayBuffer = await response.arrayBuffer();
            roundEndBufferRef.current = await ac.decodeAudioData(arrayBuffer);
        }
        const source = ac.createBufferSource();
        source.buffer = roundEndBufferRef.current;
        source.connect(ac.destination);
        source.start();
    }

    return { playClick, playJoin, playRoll, playHold, playRoundEnd };
}
