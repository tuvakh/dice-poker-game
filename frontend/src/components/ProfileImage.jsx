import { BASE_URL } from "../api/config.js";

// Displays a user's profile image
// Accepts server-relative paths ("/uploads/.."), absolute URLs, or data: URLs stored in localStorage
export default function ProfileImage ({ src, username, size="medium" }) {
    let fullSrc;
    if (!src) {
        fullSrc = "/default-img.jpg";
    } else if (typeof src === 'string' && src.startsWith('data:')) {
        // already a data URL saved in localStorage or selected by the user
        fullSrc = src;
    } else if (typeof src === 'string' && (src.startsWith('http://') || src.startsWith('https://'))) {
        fullSrc = src;
    } else if (typeof src === 'string' && src.startsWith('/')) {
        fullSrc = `${BASE_URL}${src}`;
    } else {
        // Fallback: use as-is
        fullSrc = src;
    }

    return (
        <img
            src={fullSrc}
            alt={username}
            className={`player-info__image player-info__image--${size}`}
        />
    );
}
