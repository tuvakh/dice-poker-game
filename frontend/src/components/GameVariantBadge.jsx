// Displays a small badge summarising the game variant 
// category is a populated gameCategory object from the backend that contains numberOfRounds, gameRules, and timeController
export default function GameVariantBadge({ category }) {
    // If the parent didn't pass a category (e.g. data not loaded yet), render nothing
    if (!category) return null;

    return (
        <span className="game-variant-badge">
            {/* Ternary checks the gameRules string and shows a human-readable label instead */}
            Best of {category.numberOfRounds} · {category.gameRules === "straights_allowed" ? "Straights" : "No straights"} · {category.timeController}s
        </span>
    );
}
