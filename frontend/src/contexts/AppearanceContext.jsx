import { createContext, useContext, useState, useEffect, useRef } from "react";
import { updateUser } from "../api/users";
import { useAuth } from "./AuthContext";

const AppearanceContext = createContext(null);

const defaults = {
    theme: "light",
    boardColor: "#abc6ba",
    soundEnabled: true,
    lobbyCount: 5
};

export function AppearanceProvider({ children }) {
    const { user, updateUserData } = useAuth();

    const saveTimeout = useRef(null);
    const globalAcRef = useRef(null);

    const [preferences, setPreferences] = useState(() => {
        const saved = localStorage.getItem("preferences");
        return saved ? JSON.parse(saved) : defaults;
    });

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", preferences.theme);
    }, [preferences.theme]);

    useEffect(() => {
        function handleGlobalClick(event) {
            const button = event.target.closest("button");
            if (!button || button.dataset.soundHandled !== undefined) return;
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
            } catch {}
        }
        document.addEventListener("click", handleGlobalClick);
        return () => document.removeEventListener("click", handleGlobalClick);
    }, []);

    useEffect(() => {
        if (user?.preferences) {
            setPreferences(prev => ({ ...prev, ...user.preferences }));
        }
    }, [user]);

    function updatePreferences(newPrefs) {
        setPreferences(prev => {
            const updated = { ...prev, ...newPrefs };
            localStorage.setItem("preferences", JSON.stringify(updated));
            return updated;
        });

        if (user) {

            updateUserData({ preferences: { ...preferences, ...newPrefs } });

            clearTimeout(saveTimeout.current);
            saveTimeout.current = setTimeout(async () => {
                const stored = JSON.parse(localStorage.getItem("preferences"));
                await updateUser(user.userId, { preferences: stored });
            }, 500);
        }
    }

    return (
        <AppearanceContext.Provider value={{ preferences, updatePreferences }}>
            {children}
        </AppearanceContext.Provider>
    );
}

export function useAppearance() {
    return useContext(AppearanceContext);
}
