import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { getTournament, updateTournament } from "../../api/tournaments.js";
import { getAllGameCategories } from "../../api/gameCategories.js";
import { getAllTrophies } from "../../api/trophies.js";
import Spinner from "../../components/Spinner.jsx";
import "./_TournamentCreate.scss";

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
                const d = new Date(tournament.date);
                const pad = n => String(n).padStart(2, "0");
                setDate(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`);
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

    async function handleSubmit(e) {
        e.preventDefault();
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
                        onChange={e => setTitle(e.target.value)}
                        required
                    />
                </div>

                <div className="tournament-create-form__field">
                    <label className="tournament-create-form__label" htmlFor="te-description">Description</label>
                    <textarea
                        id="te-description"
                        className="tournament-create-form__textarea"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
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
                        onChange={e => setDate(e.target.value)}
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
                        onChange={e => setBreaks(e.target.value)}
                    />
                </div>

                <div className="tournament-create-form__field">
                    <label className="tournament-create-form__label" htmlFor="te-rounds">Number of Rounds</label>
                    <select
                        id="te-rounds"
                        className="tournament-create-form__select"
                        value={numberOfRounds}
                        onChange={e => setNumberOfRounds(e.target.value)}
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
                        onChange={e => setGameCategory(e.target.value)}
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
                        {trophies.map(t => (
                            <button
                                type="button"
                                key={t._id}
                                className={`trophy-option${trophy === t._id ? " trophy-option--selected" : ""}`}
                                onClick={() => setTrophy(t._id)}
                            >
                                <img
                                    className="trophy-option__img"
                                    src={`/${t.image}`}
                                    alt={t.title}
                                    onError={e => { e.target.replaceWith(Object.assign(document.createElement("span"), { className: "trophy-option__icon", textContent: "🏆" })); }}
                                />
                                <span className="trophy-option__title">{t.title}</span>
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
