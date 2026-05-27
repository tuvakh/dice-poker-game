// Reusable button component with a variant prop for styling
import { useSoundEffects } from "../hooks/useSoundEffects";

export default function Button({ children, variant="primary", onClick, type="button", className = "", disabled = false }) {
    const { playClick } = useSoundEffects();

    function handleClick(e) {
        playClick();
        if (onClick) onClick(e);
    }

    return (
        <button className={`button button--${variant} ${className}`} onClick={handleClick} type={type} disabled={disabled}>
            {children}
        </button>
    )
}