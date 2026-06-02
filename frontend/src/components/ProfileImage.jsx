import { BASE_URL } from "../api/config.js";

// Renders a user's profile image, handling three different src formats
// size controls which CSS modifier class is applied (e.g. "small", "medium")
export default function ProfileImage({ src, username, size = "medium" }) {
    let fullSrc;

    if (!src) {
        // No image stored. Falls back to the default placeholder
        fullSrc = "/default-img.jpg";
    } else if (src.startsWith('data:')) {
        // Base64 data URL (e.g. a preview before the user has saved their new image)
        fullSrc = src;
    } else if (src.startsWith('http://') || src.startsWith('https://')) {
        // Already a full external URL — use as-is
        fullSrc = src;
    } else if (src.startsWith('/')) {
        // Server-relative path (e.g. "/uploads/abc.jpg")
        fullSrc = `${BASE_URL}${src}`;
    } else {
        fullSrc = src;
    }

    return (
        // The size prop maps to a BEM modifier class for CSS sizing rules
        <img
            src={fullSrc}
            alt={username}
            className={`player-info__image player-info__image--${size}`}
        />
    );
}
