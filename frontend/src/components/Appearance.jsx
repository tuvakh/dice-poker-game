import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAppearance } from "../contexts/AppearanceContext.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import Button from "./Button.jsx";
import FormField from "./FormField.jsx";

// Board color options split by theme; when the theme changes, the palette switches too
const BOARD_COLORS = {
    light: ["#abc6ba", "#e6a9c5", "#aec0db", "#d4ab8f", "#b4b4b4"],
    dark: ["#2d6a4f", "#85123e", "#0f294d", "#b24f08", "#1c1b1b"],
};

// Dropdown panel for customising theme, board color, sound, and lobby game count
// Settings are saved to localStorage and synced to the user's backend profile if logged in
export default function Appearance() {
    const [isOpen, setIsOpen] = useState(false);
    const { preferences, updatePreferences } = useAppearance();
    const { user, logout } = useAuth();

    // containerRef points to the outer div so we can detect clicks outside the panel
    const containerRef = useRef(null);
    // Fall back to dark palette if the theme value in preferences is unrecognised
    const colors = BOARD_COLORS[preferences.theme] ?? BOARD_COLORS.dark;

    // Closes the panel when the user clicks outside it or scrolls the page
    useEffect(() => {
        function handleClickOutside(event) {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            // capture:true fires before child handlers; once:true auto-removes the listener after the first scroll
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
                    {/* Switching theme also resets boardColor to the first color in the new palette */}
                    <Button onClick={() => {
                        const newTheme = preferences.theme === "light" ? "dark" : "light";
                        updatePreferences({ theme: newTheme, boardColor: BOARD_COLORS[newTheme][0] });
                    }}>
                        {preferences.theme === "light" ? "Dark mode" : "Light mode"}
                    </Button>

                    {/* Color swatches; the selected one gets a white outline to show it's active */}
                    {colors.map(color => (
                        <button
                            className="color-btn"
                            key={color}
                            style={{ backgroundColor: color, outline: preferences.boardColor === color ? "1px solid white" : "none" }}
                            onClick={() => updatePreferences({ boardColor: color })}
                        />
                    ))}

                    <Button onClick={() => updatePreferences({ soundEnabled: !preferences.soundEnabled })}>
                        Sound: {preferences.soundEnabled ? "On" : "Off"}
                    </Button>

                    {/* Range slider for how many games show in the lobby (1-15) */}
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

                    {/* Link styled as a button — navigates home and calls logout at the same time */}
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
