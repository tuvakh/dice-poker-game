import { useEffect, useState } from "react";
import { createTournament } from "../../api/tournaments.js";
import { getAllGameCategories } from "../../api/gameCategories.js";
import Spinner from "../../components/Spinner.jsx";

export default function AdminTournamentCreate(){
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [date, setDate] = useState("");
    const [breaks, setBreaks] = useState(0);
    const [numberOfRounds, setNumberOfRounds] = useState(3);
    const [gameCategory, setGameCategory] = useState("");
    const [gameCategories, setGameCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;
        getAllGameCategories()
            .then(result => {
                if (!cancelled) {
                    const categories = Array.isArray(result)
                        ? result
                        : (result.gameCategories || result.categoryList || []);
                    setGameCategories(categories);
                    setGameCategory(categories[0]?._id || "");
                }
            })
            .catch(err => {
                if (!cancelled) setError(err.message);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => { cancelled = true; };
    }, []);

    async function handleSubmit(e) {
        e.preventDefault();
        setSubmitting(true);
        setMessage("");
        setError("");

        try {
            const created = await createTournament({
                title,
                description,
                date,
                breaks: Number(breaks),
                numberOfRounds: Number(numberOfRounds),
                gameCategory
            });
            setMessage(`Tournament created: ${created.title || title}`);
            setTitle("");
            setDescription("");
            setDate("");
            setBreaks(0);
            setNumberOfRounds(3);
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) return <Spinner />;

    return (
        <div>
            <h1>Create Tournament</h1>
            <p>Admin tournament creation</p>

            {message && <p className="status status--success">{message}</p>}
            {error && <p className="status status--error">{error}</p>}

            <form onSubmit={handleSubmit} className="admin__form">
                <label>
                    Title
                    <input aria-label="Tournament title" value={title} onChange={e => setTitle(e.target.value)} required />
                </label>

                <label>
                    Description
                    <textarea aria-label="Tournament description" value={description} onChange={e => setDescription(e.target.value)} required />
                </label>

                <label>
                    Date
                    <input aria-label="Tournament date" type="datetime-local" value={date} onChange={e => setDate(e.target.value)} required />
                </label>

                <label>
                    Breaks
                    <input aria-label="Tournament breaks" type="number" min="0" value={breaks} onChange={e => setBreaks(e.target.value)} />
                </label>

                <label>
                    Number of Rounds
                    <select aria-label="Number of rounds" value={numberOfRounds} onChange={e => setNumberOfRounds(e.target.value)}>
                        <option value={3}>3</option>
                        <option value={5}>5</option>
                        <option value={7}>7</option>
                    </select>
                </label>

                <label>
                    Game Category
                    <select aria-label="Game category" value={gameCategory} onChange={e => setGameCategory(e.target.value)} required>
                        {(gameCategories || []).length === 0 ? (
                            <option value="">No categories available</option>
                        ) : (
                            (gameCategories || []).map(category => (
                                <option key={category._id} value={category._id}>
                                    {category.numberOfRounds} rounds - {category.gameRules} - {category.timeController}s
                                </option>
                            ))
                        )}
                    </select>
                </label>

                <button className="btn btn--primary" type="submit" disabled={submitting}>
                    {submitting ? "Creating..." : "Create Tournament"}
                </button>
            </form>
        </div>
    );
}
