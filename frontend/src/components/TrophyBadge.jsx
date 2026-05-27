import { BASE_URL } from "../api/config.js";

// Displays a single trophy image earned by a user for winning a tournament
// trophy.image is just the filename, so we build the full URL using BASE_URL
export default function TrophyBadge({ trophy }) {
    // If no trophy was passed in, render nothing
    if (!trophy) return null;

    return (
        <div className="trophy-badge">
            <img className="trophy-img" src={`/trophies/${trophy.image}`} alt={trophy.title} />
        </div>
    );
}
