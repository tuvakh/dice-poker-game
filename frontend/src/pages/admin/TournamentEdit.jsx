import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { getTournament, updateTournament } from "../../api/tournaments.js";
import { getAllGameCategories } from "../../api/gameCategories.js";
import { createTrophy } from "../../api/trophies.js";
import Spinner from "../../components/Spinner.jsx";

// Admin form for editing an existing tournament; redirects away if the tournament is already ongoing or finished
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
    const [newTrophyTitle, setNewTrophyTitle] = useState("");
    const [newTrophyFile, setNewTrophyFile] = useState(null);
    const [newTrophyPreview, setNewTrophyPreview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;
        // Fetch tournament and categories in parallel to minimise loading time
        Promise.all([
            getTournament(id),
            getAllGameCategories(),
        ]).then(([tournament, catResult]) => {
            if (cancelled) return;
            // Editing an ongoing or finished tournament would break active matches — redirect instead
            if (["ongoing", "finished"].includes(tournament.status)) {
                navigate(`/tournament/${id}`, { replace: true });
                return;
            }
            // API can return either an array or an object with a named list property
            const categories = Array.isArray(catResult)
                ? catResult
                : (catResult.gameCategories || catResult.categoryList || []);
            setGameCategories(categories);

            setTitle(tournament.title ?? "");
            setDescription(tournament.description ?? "");
            // datetime-local inputs require "YYYY-MM-DDTHH:mm" — the ISO string includes seconds and timezone which must be stripped
            if (tournament.date) {
                const dateObj = new Date(tournament.date);
                const pad = number => String(number).padStart(2, "0");
                setDate(`${dateObj.getFullYear()}-${pad(dateObj.getMonth() + 1)}-${pad(dateObj.getDate())}T${pad(dateObj.getHours())}:${pad(dateObj.getMinutes())}`);
            }
            setBreaks(tournament.breaks ?? 0);
            setNumberOfRounds(tournament.numberOfRounds ?? 3);
            // gameCategory and trophy may be populated objects or bare IDs depending on query depth
            setGameCategory(tournament.gameCategory?._id ?? tournament.gameCategory ?? "");
            setTrophy(tournament.trophy?._id ?? tournament.trophy ?? "");
        }).catch(err => {
            if (!cancelled) setError(err.message ?? "Could not load tournament.");
        }).finally(() => {
            if (!cancelled) setLoading(false);
        });
        return () => { cancelled = true; };
    }, [id, navigate]);

    // Creates a local object URL for the image preview; the real upload happens on form submit
    function handleTrophyFileChange(event) {
        const file = event.target.files[0];
        if (!file) return;
        setNewTrophyFile(file);
        setNewTrophyPreview(URL.createObjectURL(file));
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setSubmitting(true);
        setMessage(null);
        setError(null);
        try {
            // If a new trophy image was provided, create it first and use the new ID; otherwise keep the existing trophy
            let trophyId = trophy;
            if (newTrophyFile && newTrophyTitle.trim()) {
                const created = await createTrophy({ title: newTrophyTitle.trim(), image: newTrophyFile });
                trophyId = created._id;
            }
            await updateTournament(id, {
                title,
                description,
                date,
                breaks: Number(breaks),
                numberOfRounds: Number(numberOfRounds),
                gameCategory,
                ...(trophyId && { trophy: trophyId })
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
                        // Subtracts the timezone offset so the min is current local time, not UTC
                        min={new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}
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
                            gameCategories.map(category => (
                                <option key={category._id} value={category._id}>
                                    {category.numberOfRounds} rounds - {category.gameRules} - {category.timeController}s
                                </option>
                            ))
                        )}
                    </select>
                </div>

                <div className="trophy-upload">
                    <h3 className="trophy-upload__heading">Trophy (optional)</h3>
                    <div className="trophy-upload__form">
                        <input
                            className="tournament-create-form__input"
                            type="text"
                            placeholder="Trophy title"
                            value={newTrophyTitle}
                            onChange={event => setNewTrophyTitle(event.target.value)}
                        />
                        <label className="trophy-upload__file-label">
                            {newTrophyPreview
                                ? <img className="trophy-upload__preview" src={newTrophyPreview} alt="preview" />
                                : <span className="trophy-upload__placeholder">Choose image</span>
                            }
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleTrophyFileChange}
                                style={{ display: "none" }}
                            />
                        </label>
                    </div>
                </div>

                <button className="tournament-create-form__submit" type="submit" disabled={submitting}>
                    {submitting ? "Saving..." : "Save Changes"}
                </button>
            </form>
        </div>
    );
}
