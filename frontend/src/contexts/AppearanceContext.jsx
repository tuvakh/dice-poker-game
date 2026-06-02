import { createContext, useContext, useState, useEffect, useRef } from "react";
import { updateUser } from "../api/users";
import { useAuth } from "./AuthContext";

// Provides appearance preferences (theme, board color, sound, lobby count) to the whole app
// Any component can read or update them via useAppearance() without prop drilling
const AppearanceContext = createContext(null);

// Default preferences for new visitors who have nothing saved yet
const defaults = {
    theme: "light",
    boardColor: "#ffffff",
    soundEnabled: true,
    lobbyCount: 5
};

export function AppearanceProvider({ children }) {
    const { user, updateUserData } = useAuth();

    // Ref for debouncing the API save so we don't hit the backend on every keystroke/slider tick
    const saveTimeout = useRef(null);
    // Shared AudioContext for the global click sound; kept across renders to avoid re-creating it
    const globalAcRef = useRef(null);

    // Load saved preferences from localStorage on first render; fall back to defaults if nothing is saved
    const [preferences, setPreferences] = useState(() => {
        const saved = localStorage.getItem("preferences");
        return saved ? JSON.parse(saved) : defaults;
    });

    // Apply the theme to the <html> element as a data-attribute; CSS variables react to this
    useEffect(() => {
        document.documentElement.setAttribute("data-theme", preferences.theme);
    }, [preferences.theme]);

    // Plays a click sound on any raw <button> not already handled by the Button component
    // Button marks itself with data-sound-handled so this listener skips it (avoids double sounds)
    useEffect(() => {
        function handleGlobalClick(event) {
            const btn = event.target.closest("button");
            if (!btn || btn.dataset.soundHandled !== undefined) return;
            if (!JSON.parse(localStorage.getItem("preferences") || "{}").soundEnabled) return;
            try {
                if (!globalAcRef.current) {
                    globalAcRef.current = new (window.AudioContext || window.webkitAudioContext)();
                }
                const audioCtx = globalAcRef.current;
                if (audioCtx.state === "suspended") audioCtx.resume();
                const oscillator = audioCtx.createOscillator();
                const gainNode = audioCtx.createGain();
                oscillator.connect(gainNode);
                gainNode.connect(audioCtx.destination);
                oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(220, audioCtx.currentTime + 0.08);
                gainNode.gain.setValueAtTime(0.18, audioCtx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
                oscillator.start(audioCtx.currentTime);
                oscillator.stop(audioCtx.currentTime + 0.08);
            } catch { /* AudioContext blocked by browser — ignore */ }
        }
        document.addEventListener("click", handleGlobalClick);
        return () => document.removeEventListener("click", handleGlobalClick);
    }, []);

    // When a user logs in, merge their backend preferences on top of the local ones
    useEffect(() => {
        if (user?.preferences) {
            setPreferences(prev => ({ ...prev, ...user.preferences }));
        }
    }, [user]);

    // Updates a setting: saves to localStorage immediately and syncs to the backend after 500ms
    // Uses "prev =>" so rapid calls (e.g. dragging the slider) always read the latest state
    function updatePreferences(newPrefs) {
        setPreferences(prev => {
            const updated = { ...prev, ...newPrefs };
            localStorage.setItem("preferences", JSON.stringify(updated));
            return updated;
        });

        if (user) {
            // updateUserData updates React state immediately so the UI feels instant
            updateUserData({ preferences: { ...preferences, ...newPrefs } });

            // Debounce: cancel any pending save and wait 500ms before hitting the API
            // Re-reads from localStorage so the save reflects any extra changes made during the delay
            clearTimeout(saveTimeout.current);
            saveTimeout.current = setTimeout(async () => {
                const stored = JSON.parse(localStorage.getItem("preferences"));
                await updateUser(user.userId, { preferences: stored });
            }, 500);
        }
    }

    return (
        // Any component that calls useAppearance() gets preferences and updatePreferences from here
        <AppearanceContext.Provider value={{ preferences, updatePreferences }}>
            {children}
        </AppearanceContext.Provider>
    );
}

// Custom hook — shorthand for useContext(AppearanceContext)
export function useAppearance() {
    return useContext(AppearanceContext);
}
