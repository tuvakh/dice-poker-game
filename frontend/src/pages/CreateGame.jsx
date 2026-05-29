import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import RoundsSelector from "../components/RoundsSelector.jsx";
import GameRulesSelector from "../components/GameRulesSelector.jsx";
import TimeControlSelector from "../components/TimeControlSelector.jsx";

import { getAllGameCategories } from "../api/gameCategories.js";
import { createMatch } from "../api/matches.js";
import Button from "../components/Button.jsx";
import FormField from "../components/FormField.jsx";

// The create Game page lets the user picks their game settings and submits to create a new match
export default function CreateGame() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [error, setError] = useState(null);

    // All the form values starts with sensible defaults
    // When a selector changes, only that field gets updated
    const [formData, setFormData] = useState({
        numberOfRounds: 3,
        gameRules: "straights_allowed",
        timeController: 10,
        desiredOpponentElo: "",
        coinWager: "",
        numberOfPlayers: 2
    });

    // This gets called by each selector component when the user picks something
    function handleChange(field, value) {
        setFormData(prev => ({ ...prev, [field]: value }));
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setError(null);

        try {
            // The backend stores game variants as pre-defined categories
            // This fetch them all and find the one that matches what the user selected
            const categories = await getAllGameCategories();
            const category = categories.find(category =>
                category.numberOfRounds === formData.numberOfRounds &&
                category.gameRules === formData.gameRules &&
                category.timeController === formData.timeController
            );

            // When creating a match, logged-in users join as a named player
            const match = await createMatch({
                gameCategoryId: category._id,
                players: [user._id],
                coinWager: user ? (formData.coinWager ? Number(formData.coinWager) : 0) : 0,
                maxPlayers: formData.numberOfPlayers,
                ...(Number(formData.desiredOpponentElo) > 0 ? { desiredOpponentElo: Number(formData.desiredOpponentElo) } : {})
            });

            // Send the user straight to their new game
            navigate(`/game/${match.matchId}`);
        } catch (err) {
            setError(err.message);
        }
    }

    if (!user) {
        return (
            <section className="create-game">
                <Link to="/" className="back-link">← Back</Link>
                <p>You need to be logged in to create a game.</p>
                <Link to="/login">Login</Link>
            </section>
        );
    }

    return (
        <section className="create-game">
            <Link to="/" className="back-link">← Back</Link>

            <form className="form" onSubmit={handleSubmit}>
                <h1>Create game</h1>
                <div className="form__inputs">
                    <RoundsSelector onChange={handleChange} />
                    <GameRulesSelector onChange={handleChange} />
                    <TimeControlSelector onChange={handleChange} />
                </div>

                <FormField label="Number of players">
                    <select
                        value={formData.numberOfPlayers}
                        onChange={event => handleChange("desiredOpponentElo", event.target.value)}
                    >
                        <option value={2}>2 players</option>
                        <option value={3}>3 players</option>
                        <option value={4}>4 players</option>
                        <option value={5}>5 players</option>
                    </select>
                </FormField>

                {/* Two fields side by side */}
                <div className="form__inputs">
                    <FormField label="Desired opponent Elo">
                        <input
                            type="number"
                            min="1000"
                            value={formData.desiredOpponentElo}
                            onChange={event => handleChange("desiredOpponentElo", parseInt(event.target.value))}
                            placeholder="Leave empty for any Elo"
                        />
                    </FormField>
                    {user && (
                        <FormField label={`Coin wager (you have ${user.coins ?? 0})`}>
                            <input
                                type="number"
                                min="0"
                                max={user.coins}
                                value={formData.coinWager}
                                onChange={event => handleChange("coinWager", event.target.value)}
                                placeholder="0"
                            />
                        </FormField>
                    )}
                </div>
                {error && <p className="status status--error">{error}</p>}

                <Button type="submit">Create game</Button>
            </form>
        </section>
    );
}
