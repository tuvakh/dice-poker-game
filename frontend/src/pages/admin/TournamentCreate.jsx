import { useEffect, useState } from "react";
import { createTournament } from "../../api/tournaments.js";
import { getAllGameCategories } from "../../api/gameCategories.js";
import { getAllTrophies, createTrophy } from "../../api/trophies.js";
import Spinner from "../../components/Spinner.jsx";
import "./_TournamentCreate.scss";

export default function AdminTournamentCreate(){
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [date, setDate] = useState("");
    const [breaks, setBreaks] = useState(0);
    const [numberOfRounds, setNumberOfRounds] = useState(3);
    const [gameCategory, setGameCategory] = useState("");
    const [gameCategories, setGameCategories] = useState([]);
    const [trophies, setTrophies] = useState([]);
    const [trophy, setTrophy] = useState("");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const [newTrophyTitle, setNewTrophyTitle] = useState("");
    const [newTrophyFile, setNewTrophyFile] = useState(null);
    const [newTrophyPreview, setNewTrophyPreview] = useState(null);
    const [uploadingTrophy, setUploadingTrophy] = useState(false);
    const [uploadMessage, setUploadMessage] = useState("");

    useEffect(() => {
        let cancelled = false;
        Promise.all([
            getAllGameCategories(),
            getAllTrophies().catch(() => [])
        ]).then(([catResult, trophyResult]) => {
                if (!cancelled) {
                    const categories = Array.isArray(catResult)
                        ? catResult
                        : (catResult.gameCategories || catResult.categoryList || []);
                    setGameCategories(categories);
                    setGameCategory(categories[0]?._id || "");
                    setTrophies(Array.isArray(trophyResult) ? trophyResult : []);
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
                gameCategory,
                ...(trophy && { trophy })
            });
            setMessage(`Tournament created: ${created.title || title}`);
            setTitle("");
            setDescription("");
            setDate("");
            setBreaks(0);
            setNumberOfRounds(3);
            setTrophy("");
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    }

    function handleTrophyFileChange(e) {
        const file = e.target.files[0];
        if (!file) return;
        setNewTrophyFile(file);
        setNewTrophyPreview(URL.createObjectURL(file));
    }

    async function handleTrophyUpload(e) {
        e.preventDefault();
        if (!newTrophyFile || !newTrophyTitle.trim()) return;
        setUploadingTrophy(true);
        setUploadMessage("");
        try {
            const created = await createTrophy({ title: newTrophyTitle.trim(), image: newTrophyFile });
            setTrophies(prev => [...prev, created]);
            setTrophy(created._id);
            setNewTrophyTitle("");
            setNewTrophyFile(null);
            setNewTrophyPreview(null);
            setUploadMessage(`Trophy "${created.title}" uploaded and selected!`);
        } catch (err) {
            setUploadMessage(`Upload failed: ${err.message}`);
        } finally {
            setUploadingTrophy(false);
        }
    }

    if (loading) return <Spinner />;

    return (
        <div>
            <h1>Create Tournament</h1>
            <p>Admin tournament creation</p>

            {message && <p className="status status--success">{message}</p>}
            {error && <p className="status status--error">{error}</p>}

            <form onSubmit={handleSubmit} className="tournament-create-form">
                <div className="tournament-create-form__field">
                    <label className="tournament-create-form__label" htmlFor="tc-title">Title</label>
                    <input
                        id="tc-title"
                        className="tournament-create-form__input"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        required
                    />
                </div>

                <div className="tournament-create-form__field">
                    <label className="tournament-create-form__label" htmlFor="tc-description">Description</label>
                    <textarea
                        id="tc-description"
                        className="tournament-create-form__textarea"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        required
                    />
                </div>

                <div className="tournament-create-form__field">
                    <label className="tournament-create-form__label" htmlFor="tc-date">Date</label>
                    <input
                        id="tc-date"
                        className="tournament-create-form__input"
                        type="datetime-local"
                        value={date}
                        onChange={e => setDate(e.target.value)}
                        required
                    />
                </div>

                <div className="tournament-create-form__field">
                    <label className="tournament-create-form__label" htmlFor="tc-breaks">Breaks (minutes)</label>
                    <input
                        id="tc-breaks"
                        className="tournament-create-form__input"
                        type="number"
                        min="0"
                        value={breaks}
                        onChange={e => setBreaks(e.target.value)}
                    />
                </div>

                <div className="tournament-create-form__field">
                    <label className="tournament-create-form__label" htmlFor="tc-rounds">Number of Rounds</label>
                    <select
                        id="tc-rounds"
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
                    <label className="tournament-create-form__label" htmlFor="tc-category">Game Category</label>
                    <select
                        id="tc-category"
                        className="tournament-create-form__select"
                        value={gameCategory}
                        onChange={e => setGameCategory(e.target.value)}
                        required
                    >
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
                                    onError={e => { e.target.replaceWith(Object.assign(document.createElement("span"), { className: "trophy-option__icon", textContent: "🏆" })); }}
                                />
                                <span className="trophy-option__title">{trophy.title}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="trophy-upload">
                    <h3 className="trophy-upload__heading">Upload Trophy</h3>
                    <form className="trophy-upload__form" onSubmit={handleTrophyUpload}>
                        <input
                            className="tournament-create-form__input"
                            type="text"
                            placeholder="Trophy title"
                            value={newTrophyTitle}
                            onChange={e => setNewTrophyTitle(e.target.value)}
                            required
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
                        <button
                            className="tournament-create-form__submit"
                            type="submit"
                            disabled={uploadingTrophy || !newTrophyFile || !newTrophyTitle.trim()}
                        >
                            {uploadingTrophy ? "Uploading..." : "Upload & select"}
                        </button>
                    </form>
                    {uploadMessage && <p className="trophy-upload__msg">{uploadMessage}</p>}
                </div>

                <button className="tournament-create-form__submit" type="submit" disabled={submitting}>
                    {submitting ? "Creating..." : "Create Tournament"}
                </button>
            </form>
        </div>
    );
}
