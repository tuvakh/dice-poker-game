import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAppearance } from "../contexts/AppearanceContext.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import Button from "./Button.jsx";
import FormField from "./FormField.jsx";

const BOARD_COLORS = {
    light: ["#abc6ba", "#e6a9c5", "#aec0db", "#d4ab8f", "#b4b4b4"],
    dark: ["#2d6a4f", "#85123e", "#0f294d", "#b24f08", "#1c1b1b"],
};

export default function Appearance() {
    const [isOpen, setIsOpen] = useState(false);
    const { preferences, updatePreferences } = useAppearance();
    const { user, logout } = useAuth();

    const containerRef = useRef(null);
    const colors = BOARD_COLORS[preferences.theme] ?? BOARD_COLORS.dark;

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
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    return (
        <div className="appearance" ref={containerRef}>
            <button className="appearance__toggle" onClick={() => setIsOpen(prev => !prev)}>⚙</button>
            {isOpen && (
                <div className="appearance__panel">
                    <Button onClick={() => {
                        const newTheme = preferences.theme === "light" ? "dark" : "light";
                        updatePreferences({ theme: newTheme, boardColor: BOARD_COLORS[newTheme][0] });
                    }}>
                        {preferences.theme === "light" ? "Dark mode" : "Light mode"}
                    </Button>

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
