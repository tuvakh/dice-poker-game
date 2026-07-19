import { BASE_URL } from "../api/config.js";

export default function ProfileImage({ src, username, size = "medium" }) {
    let fullSrc;

    if (!src) {
        fullSrc = "/default-img.jpg";
    } else if (src.startsWith('data:')) {
        fullSrc = src;
    } else if (src.startsWith('http://') || src.startsWith('https://')) {
        fullSrc = src;
    } else if (src.startsWith('/')) {
        fullSrc = `${BASE_URL}${src}`;
    } else {
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
