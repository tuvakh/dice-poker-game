import { useAppearance } from "../contexts/AppearanceContext";

// Hook that exposes sound-playing functions; all sounds respect the soundEnabled preference
export function useSoundEffects() {
    const { preferences } = useAppearance();

    // Plays a sound file from /public/sounds/; browser cache means repeated plays don't re-download
    function play(path) {
        if (!preferences.soundEnabled) return;
        new Audio(path).play().catch(() => {});
    }

    return {
        playClick:    () => play("/sounds/dbl-click.mp3"),
        playJoin:     () => play("/sounds/pling.mp3"),
        playRoll:     () => play("/sounds/die-roll.wav"),
        playHold:     () => play("/sounds/die-hold.mp3"),
        playRoundEnd: () => play("/sounds/finish-level-sfx.mp3"),
    };
}
