import { useAppearance } from "../contexts/AppearanceContext";

export function useSoundEffects() {
    const { preferences } = useAppearance();

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
