// Renders the trophy image earned by a user for winning a tournament
export default function TrophyBadge({ trophy }) {
    // If no trophy was passed in, render nothing
    if (!trophy) return null;

    return (
        <div className="trophy-badge">
            {/* trophy.image can be a base64 data URL (starts with "data:") or a file path like "/uploads/trophy.png"
                The ternary picks the right format so the browser can load it either way */}
            <img
                className="trophy-img"
                src={trophy.image?.startsWith('data:') ? trophy.image : `/${trophy.image}`}
                alt={trophy.title}
            />
        </div>
    );
}
