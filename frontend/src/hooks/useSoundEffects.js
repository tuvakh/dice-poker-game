import { useRef } from "react";
import { useAppearance } from "../contexts/AppearanceContext";

// Shared sound effects hook — uses Web Audio API so no audio files needed
export function useSoundEffects() {
    const { preferences } = useAppearance();
    const ctxRef = useRef(null);

    function getCtx() {
        if (!ctxRef.current) {
            ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
        }
        return ctxRef.current;
    }

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

    return { playClick, playJoin };
}
