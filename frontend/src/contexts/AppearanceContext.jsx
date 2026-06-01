import { createContext, useContext, useState, useEffect, useRef } from "react";
import { updateUser } from "../api/users";
import { useAuth } from "./AuthContext";

// This context lets any component in the app read or change appearance settings
// without having to pass them down as props through every parent component
const AppearanceContext = createContext(null);

// These are the settings every new visitor starts with before they change anything
const defaults = {
    theme: "light",
    boardColor: "#ffffff",
    soundEnabled: true,
    lobbyCount: 5
};

// AppearanceProvider wraps the whole app and makes preferences available everywhere
export function AppearanceProvider({ children }) {
    const { user, updateUserData } = useAuth();

    const saveTimeout = useRef(null);
    const globalAcRef = useRef(null);

    // Try to load saved preferences from localStorage when the app first opens
    // If it's the users first visit (nothing saved), use the defaults above
    const [preferences, setPreferences] = useState(() => {
        const saved = localStorage.getItem("preferences");
        return saved ? JSON.parse(saved) : defaults;
    });

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", preferences.theme);
    }, [preferences.theme]);

    // Global click sound for any raw <button> that isn't already handled by the Button component
    // Button component marks itself with data-sound-handled so this skips it (no double sound)
    useEffect(() => {
        function handleGlobalClick(e) {
            const btn = e.target.closest("button");
            if (!btn || btn.dataset.soundHandled !== undefined) return;
            if (!JSON.parse(localStorage.getItem("preferences") || "{}").soundEnabled) return;
            try {
                if (!globalAcRef.current) {
                    globalAcRef.current = new (window.AudioContext || window.webkitAudioContext)();
                }
                const ac = globalAcRef.current;
                if (ac.state === "suspended") ac.resume();
                const osc = ac.createOscillator();
                const gain = ac.createGain();
                osc.connect(gain);
                gain.connect(ac.destination);
                osc.frequency.setValueAtTime(440, ac.currentTime);
                osc.frequency.exponentialRampToValueAtTime(220, ac.currentTime + 0.08);
                gain.gain.setValueAtTime(0.18, ac.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.08);
                osc.start(ac.currentTime);
                osc.stop(ac.currentTime + 0.08);
            } catch { /* AudioContext blocked — ignore */ }
        }
        document.addEventListener("click", handleGlobalClick);
        return () => document.removeEventListener("click", handleGlobalClick);
    }, []);

    // When a user logs in, load their saved preferences from the backend
    // and merge them on top of whatever is currently in localStorage
    // user?.preferences uses ?. so it doesn't crash if user is null (not logged in)
    useEffect(() => {
        if (user?.preferences) {
            setPreferences(prev => ({ ...prev, ...user.preferences }));
        }
    }, [user]);

    // Called whenever the user changes a setting
    // We use "prev =>" here so that if this gets called many times quickly (like dragging the slider),
    // each call always has the latest value instead of an outdated one
    function updatePreferences(newPrefs) {
        setPreferences(prev => {
            const updated = { ...prev, ...newPrefs };
            // Save to localStorage straight away so the setting survives a page refresh
            localStorage.setItem("preferences", JSON.stringify(updated));
            return updated;
        });

        // Only save to the backend if the user is logged in
        if (user) {
            // Wait 500ms before saving to the backend
            // If the user keeps changing the setting with the slider, it cancel the previous timer and start a new one
            // This way it only send one API call when they stop, not one for every tiny movement
            clearTimeout(saveTimeout.current);
            saveTimeout.current = setTimeout(async () => {
                // We read from localStorage here instead of state because React state might not have updated yet by the time this runs
                const latest = JSON.parse(localStorage.getItem("preferences"));
                await updateUser(user.userId, { preferences: latest });
                updateUserData({ preferences: latest });
            }, 500);
        }
    }

    return (
        // Make preferences and updatePreferences available to any component that calls useAppearance()
        <AppearanceContext.Provider value={{ preferences, updatePreferences }}>
            {children}
        </AppearanceContext.Provider>
    );
}

// Custom hook: components call useAppearance() instead of the longer useContext(AppearanceContext)
export function useAppearance() {
    return useContext(AppearanceContext);
}
