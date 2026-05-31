import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { getAllGameCategories } from "../api/gameCategories.js";
import { createMatch } from "../api/matches.js";
import { useAuth } from "../contexts/AuthContext.jsx";

import RoundsSelector from "../components/RoundsSelector.jsx";
import GameRulesSelector from "../components/GameRulesSelector.jsx";
import TimeControlSelector from "../components/TimeControlSelector.jsx";
import Button from "../components/Button.jsx";
import FormField from "../components/FormField.jsx";

// The create game page lets the user pick their game settings and submit to create a new match
export default function CreateGame() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [error, setError] = useState(null);

    // All form values start with sensible defaults — each selector only updates its own field
    const [formData, setFormData] = useState({
        numberOfRounds: 3,
        gameRules: "straights_allowed",
        timeController: 10,
        desiredOpponentElo: "",
        coinWager: 0,
        numberOfPlayers: 2
    });

    // Not logged in: show a message instead of the form
    if (!user) {
        return (
            <section className="create-game">
                <Link to="/" className="back-link">← Back</Link>
                <p>You need to be logged in to create a game.</p>
                <Link to="/login">Login</Link>
            </section>
        );
    }

    // Called by each selector component when the user changes a setting
    function handleChange(field, value) {
        setFormData(prev => ({ ...prev, [field]: value }));
    }

    // Finds the matching game category and creates a new match with the selected settings
    async function handleSubmit(event) {
        event.preventDefault();
        setError(null);

        try {
            // Fetch all game categories and find the one matching the user's selection
            const categories = await getAllGameCategories();
            const category = categories.find(category =>
                category.numberOfRounds === formData.numberOfRounds &&
                category.gameRules === formData.gameRules &&
                category.timeController === formData.timeController
            );

            const match = await createMatch({
                gameCategoryId: category._id,
                players: [user._id],
                coinWager: formData.coinWager,
                maxPlayers: formData.numberOfPlayers,
                // desiredOpponentElo is optional — only included if the user entered a positive number
                ...(Number(formData.desiredOpponentElo) > 0 ? { desiredOpponentElo: Number(formData.desiredOpponentElo) } : {})
            });

            navigate(`/game/${match.matchId}`);
        } catch (err) {
            setError(err.message);
        }
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
                        onChange={event => handleChange("numberOfPlayers", Number(event.target.value))}
                    >
                        <option value={2}>2 players</option>
                        <option value={3}>3 players</option>
                        <option value={5}>5 players</option>
                    </select>
                </FormField>

                {/* Two optional fields side by side */}
                <div className="form__inputs">
                    <FormField label="Desired opponent Elo">
                        <input
                            type="number"
                            min="1000"
                            value={formData.desiredOpponentElo}
                            onChange={event => handleChange("desiredOpponentElo", event.target.value)}
                            placeholder="Leave empty for any Elo"
                        />
                    </FormField>
                    <FormField label={`Buy-in (you have ${user.coins ?? 0})`}>
                        <select
                            value={formData.coinWager}
                            onChange={event => handleChange("coinWager", Number(event.target.value))}
                        >
                            <option value={0}>No buy-in</option>
                            <option value={1}>1 coin</option>
                            <option value={10}>10 coins</option>
                            <option value={50}>50 coins</option>
                        </select>
                    </FormField>
                </div>

                {error && <p className="status status--error">{error}</p>}
                <Button type="submit">Create game</Button>
            </form>
        </section>
    );
}
