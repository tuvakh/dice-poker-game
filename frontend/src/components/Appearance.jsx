import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import Button from "./Button.jsx"
import FormField from "./FormField.jsx"
import { useAppearance } from "../contexts/AppearanceContext.jsx"
import { useAuth } from "../contexts/AuthContext.jsx"

// The available board background colors the user can pick from
const BOARD_COLORS = {
    light: ["#abc6ba", "#e6a9c5", "#aec0db", "#d4ab8f", "#b4b4b4"],
    dark: ["#2d6a4f", "#85123e", "#0f294d", "#b24f08", "#1c1b1b"],
};

// Appearance settings panel allows users to customize theme, board color, sound, and lobby display count
// Settings gets stored in localStorage and the user's backend profile if logged in
export default function Appearance() {
    const [isOpen, setIsOpen] = useState(false);
    const { preferences, updatePreferences } = useAppearance();
    const colors = BOARD_COLORS[preferences.theme] ?? BOARD_COLORS.dark;
    const { user, logout } = useAuth();
    const containerRef = useRef(null);

    // Attaches click-outside and scroll listeners only when the panel is open
    // The scroll listener uses { once: true } so it auto-removes after firing once
    useEffect(() => {
        function handleClickOutside(event) {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            document.addEventListener("scroll", () => setIsOpen(false), { capture: true, once: true });
        }
        // Cleanup removes the mousedown listener when the panel closes or the component unmounts
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    return (
        <div className="appearance" ref={containerRef}>
            <button className="appearance__toggle" onClick={() => setIsOpen(prev => !prev)}>⚙</button>
            {isOpen && (
                <div className="appearance__panel">
                    {/* Toggles between light and dark theme */}
                    <Button onClick={() => {
                        const newTheme = preferences.theme === "light" ? "dark" : "light";
                        updatePreferences({ theme: newTheme, boardColor: BOARD_COLORS[newTheme][0] });
                    }}>
                        {preferences.theme === "light" ? "Dark mode" : "Light mode"}
                    </Button>

                    {/* Renders a color swatch for each board color option*/}
                    {colors.map(color => (
                        <button
                            className="color-btn"
                            key={color}
                            style={{ backgroundColor: color, outline: preferences.boardColor === color ? "1px solid white" : "none" }}
                            onClick={() => updatePreferences({ boardColor: color })}
                        />
                    ))}

                    {/* Toggles sound effects on and off */}
                    <Button onClick={() => updatePreferences({ soundEnabled: !preferences.soundEnabled })}>
                        Sound: {preferences.soundEnabled ? "On" : "Off"}
                    </Button>

                    {/* Controls how many games are shown in the lobby at once (1–15) */}
                    <FormField label={`Lobby games: ${preferences.lobbyCount}`}>
                        <input
                            type="range"
                            className="appearance__range"
                            min="1"
                            max="15"
                            value={preferences.lobbyCount}
                            onChange={event => updatePreferences({ lobbyCount: parseInt(event.target.value) })}
                        />
                    </FormField>

                    {user && (
                        <div className="appearance__logout">
                            <Link to="/" onClick={logout} className="button button--primary">Log out</Link>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}