import { useSoundEffects } from "../hooks/useSoundEffects";

// Reusable button that plays a click sound on every press; variant controls the CSS style
export default function Button({ children, variant = "primary", onClick, type = "button", className = "", disabled = false }) {
    const { playClick } = useSoundEffects();

    function handleClick(event) {
        playClick();
        // Guard: not all buttons have an onClick (e.g. type="submit" buttons let the form handle submission)
        if (onClick) onClick(event);
    }

    return (
        // type defaults to "button" to avoid accidentally submitting a parent form
        // data-sound-handled flags this element so other listeners know the sound has already been played
        <button
            data-sound-handled
            className={`button button--${variant} ${className}`}
            onClick={handleClick}
            type={type}
            disabled={disabled}
        >
            {children}
        </button>
    );
}
