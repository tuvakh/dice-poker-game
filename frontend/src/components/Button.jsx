import { useSoundEffects } from "../hooks/useSoundEffects";

export default function Button({ children, variant = "primary", onClick, type = "button", className = "", disabled = false }) {
    const { playClick } = useSoundEffects();

    function handleClick(event) {
        playClick();
        if (onClick) onClick(event);
    }

    return (
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
