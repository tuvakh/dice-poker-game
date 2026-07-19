export default function TrophyBadge({ trophy }) {
    if (!trophy) return null;

    return (
        <div className="trophy-badge">
            <img
                className="trophy-img"
                src={trophy.image?.startsWith('data:') ? trophy.image : `/${trophy.image}`}
                alt={trophy.title}
            />
        </div>
    );
}
