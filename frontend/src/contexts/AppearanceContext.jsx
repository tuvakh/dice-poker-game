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

    // useRef stores the debounce timer
    // I used ref instead of state because changing the timer shouldn't cause the component to re-render
    const saveTimeout = useRef(null);

    // Try to load saved preferences from localStorage when the app first opens
    // If it's the users first visit (nothing saved), use the defaults above
    const [preferences, setPreferences] = useState(() => {
        const saved = localStorage.getItem("preferences");
        return saved ? JSON.parse(saved) : defaults;
    });

    // Whenever the theme changes, apply it to the <html> element
    // My CSS uses [data-theme="dark"] to switch colors, so this is what triggers that
    useEffect(() => {
        document.documentElement.setAttribute("data-theme", preferences.theme);
    }, [preferences.theme]);

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
