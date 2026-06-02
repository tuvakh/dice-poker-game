import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { getTournament, updateTournament } from "../../api/tournaments.js";
import { getAllGameCategories } from "../../api/gameCategories.js";
import { getAllTrophies } from "../../api/trophies.js";
import Spinner from "../../components/Spinner.jsx";

export default function AdminTournamentEdit() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [date, setDate] = useState("");
    const [breaks, setBreaks] = useState(0);
    const [numberOfRounds, setNumberOfRounds] = useState(3);
    const [gameCategory, setGameCategory] = useState("");
    const [trophy, setTrophy] = useState("");
    const [gameCategories, setGameCategories] = useState([]);
    const [trophies, setTrophies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;
        Promise.all([
            getTournament(id),
            getAllGameCategories(),
            getAllTrophies().catch(() => [])
        ]).then(([tournament, catResult, trophyResult]) => {
            if (cancelled) return;
            const categories = Array.isArray(catResult)
                ? catResult
                : (catResult.gameCategories || catResult.categoryList || []);
            setGameCategories(categories);
            setTrophies(Array.isArray(trophyResult) ? trophyResult : []);

            // Pre-populate form with existing tournament data
            setTitle(tournament.title ?? "");
            setDescription(tournament.description ?? "");
            // Convert ISO date string to datetime-local format (YYYY-MM-DDTHH:mm)
            if (tournament.date) {
                const dateObj = new Date(tournament.date);
                const pad = number => String(number).padStart(2, "0");
                setDate(`${dateObj.getFullYear()}-${pad(dateObj.getMonth() + 1)}-${pad(dateObj.getDate())}T${pad(dateObj.getHours())}:${pad(dateObj.getMinutes())}`);
            }
            setBreaks(tournament.breaks ?? 0);
            setNumberOfRounds(tournament.numberOfRounds ?? 3);
            setGameCategory(tournament.gameCategory?._id ?? tournament.gameCategory ?? "");
            setTrophy(tournament.trophy?._id ?? tournament.trophy ?? "");
        }).catch(err => {
            if (!cancelled) setError(err.message ?? "Could not load tournament.");
        }).finally(() => {
            if (!cancelled) setLoading(false);
        });
        return () => { cancelled = true; };
    }, [id]);

    async function handleSubmit(event) {
        event.preventDefault();
        setSubmitting(true);
        setMessage("");
        setError("");
        try {
            await updateTournament(id, {
                title,
                description,
                date,
                breaks: Number(breaks),
                numberOfRounds: Number(numberOfRounds),
                gameCategory,
                ...(trophy ? { trophy } : {})
            });
            setMessage("Tournament updated!");
        } catch (err) {
            setError(err.message ?? "Could not update tournament.");
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) return <Spinner />;

    return (
        <div>
            <h1>Edit Tournament</h1>
            <button className="tournament-create-form__submit" style={{ marginBottom: 8 }} onClick={() => navigate(-1)}>
                &larr; Back
            </button>

            {message && <p className="status status--success">{message}</p>}
            {error && <p className="status status--error">{error}</p>}

            <form onSubmit={handleSubmit} className="tournament-create-form">
                <div className="tournament-create-form__field">
                    <label className="tournament-create-form__label" htmlFor="te-title">Title</label>
                    <input
                        id="te-title"
                        className="tournament-create-form__input"
                        value={title}
                        onChange={event => setTitle(event.target.value)}
                        required
                    />
                </div>

                <div className="tournament-create-form__field">
                    <label className="tournament-create-form__label" htmlFor="te-description">Description</label>
                    <textarea
                        id="te-description"
                        className="tournament-create-form__textarea"
                        value={description}
                        onChange={event => setDescription(event.target.value)}
                        required
                    />
                </div>

                <div className="tournament-create-form__field">
                    <label className="tournament-create-form__label" htmlFor="te-date">Date</label>
                    <input
                        id="te-date"
                        className="tournament-create-form__input"
                        type="datetime-local"
                        value={date}
                        onChange={event => setDate(event.target.value)}
                        required
                    />
                </div>

                <div className="tournament-create-form__field">
                    <label className="tournament-create-form__label" htmlFor="te-breaks">Breaks (minutes)</label>
                    <input
                        id="te-breaks"
                        className="tournament-create-form__input"
                        type="number"
                        min="0"
                        value={breaks}
                        onChange={event => setBreaks(event.target.value)}
                    />
                </div>

                <div className="tournament-create-form__field">
                    <label className="tournament-create-form__label" htmlFor="te-rounds">Number of Rounds</label>
                    <select
                        id="te-rounds"
                        className="tournament-create-form__select"
                        value={numberOfRounds}
                        onChange={event => setNumberOfRounds(event.target.value)}
                    >
                        <option value={3}>3</option>
                        <option value={5}>5</option>
                        <option value={7}>7</option>
                    </select>
                </div>

                <div className="tournament-create-form__field">
                    <label className="tournament-create-form__label" htmlFor="te-category">Game Category</label>
                    <select
                        id="te-category"
                        className="tournament-create-form__select"
                        value={gameCategory}
                        onChange={event => setGameCategory(event.target.value)}
                        required
                    >
                        {gameCategories.length === 0 ? (
                            <option value="">No categories available</option>
                        ) : (
                            gameCategories.map(cat => (
                                <option key={cat._id} value={cat._id}>
                                    {cat.numberOfRounds} rounds - {cat.gameRules} - {cat.timeController}s
                                </option>
                            ))
                        )}
                    </select>
                </div>

                <div className="tournament-create-form__field">
                    <span className="tournament-create-form__label">Trophy (optional)</span>
                    <div className="trophy-picker">
                        <button
                            type="button"
                            className={`trophy-option trophy-option--none${trophy === "" ? " trophy-option--selected" : ""}`}
                            onClick={() => setTrophy("")}
                        >
                            <span className="trophy-option__icon">🚫</span>
                            <span className="trophy-option__title">No trophy</span>
                        </button>
                        {trophies.map(trophy => (
                            <button
                                type="button"
                                key={trophy._id}
                                className={`trophy-option${trophy === trophy._id ? " trophy-option--selected" : ""}`}
                                onClick={() => setTrophy(trophy._id)}
                            >
                                <img
                                    className="trophy-option__img"
                                    src={`/${trophy.image}`}
                                    alt={trophy.title}
                                    onError={event => { event.target.replaceWith(Object.assign(document.createElement("span"), { className: "trophy-option__icon", textContent: "🏆" })); }}
                                />
                                <span className="trophy-option__title">{trophy.title}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <button className="tournament-create-form__submit" type="submit" disabled={submitting}>
                    {submitting ? "Saving..." : "Save Changes"}
                </button>
            </form>
        </div>
    );
}
