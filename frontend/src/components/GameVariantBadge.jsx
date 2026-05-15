// Displays a small badge summarising the game variant
// Used on GameCard and Game so players can see what kind of game it is at a glance
export default function GameVariantBadge({ category }) {
    // If no category is provided, render nothing
    if (!category) return null;

    return (
        <span className="game-variant-badge">
            Best of {category.numberOfRounds} · {category.gameRules === "straights_allowed" ? "Straights" : "No straights"} · {category.timeController}s
        </span>
    );
}
