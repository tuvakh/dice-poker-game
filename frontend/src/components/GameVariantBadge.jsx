
export default function GameVariantBadge({ category }) {
    if (!category) return null;

    return (
        <span className="game-variant-badge">
            Best of {category.numberOfRounds} · {category.gameRules === "straights_allowed" ? "Straights" : "No straights"} · {category.timeController}s
        </span>
    );
}
