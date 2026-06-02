import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { createTournament } from "../../api/tournaments.js";
import { createTrophy } from "../../api/trophies.js";
import { getAllGameCategories } from "../../api/gameCategories.js";
import Spinner from "../../components/Spinner.jsx";

export default function AdminTournamentCreate() {
    const navigate = useNavigate();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [date, setDate] = useState("");
    const [breaks, setBreaks] = useState(0);
    const [numberOfRounds, setNumberOfRounds] = useState(3);
    const [gameCategory, setGameCategory] = useState("");
    const [gameCategories, setGameCategories] = useState([]);
    const [eloMin, setEloMin] = useState("");
    const [eloMax, setEloMax] = useState("");
    const [buyIn, setBuyIn] = useState(0);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const [newTrophyTitle, setNewTrophyTitle] = useState("");
    const [newTrophyFile, setNewTrophyFile] = useState(null);
    const [newTrophyPreview, setNewTrophyPreview] = useState(null);

    // Load game categories on mount so the dropdown is populated before the admin starts filling the form
    useEffect(() => {
        let cancelled = false;
        getAllGameCategories()
            .then(catResult => {
                if (!cancelled) {
                    const categories = Array.isArray(catResult)
                        ? catResult
                        : (catResult.gameCategories || catResult.categoryList || []);
                    setGameCategories(categories);
                    setGameCategory(categories[0]?._id || "");
                }
            })
            .catch(err => { if (!cancelled) setError(err.message); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, []);


    async function handleSubmit(event) {
        event.preventDefault();
        setSubmitting(true);
        setError("");

        try {
            // If the admin uploaded a new trophy image, create the trophy first and attach its ID to the tournament
            let trophyId = "";
            if (newTrophyFile && newTrophyTitle.trim()) {
                const created = await createTrophy({ title: newTrophyTitle.trim(), image: newTrophyFile });
                trophyId = created._id;
            }

            const created = await createTournament({
                title,
                description,
                date,
                breaks: Number(breaks),
                numberOfRounds: Number(numberOfRounds),
                gameCategory,
                ...(trophyId && { trophy: trophyId }),
                ...(eloMin !== "" && { eloMin: Number(eloMin) }),
                ...(eloMax !== "" && { eloMax: Number(eloMax) }),
                ...(Number(buyIn) > 0 && { buyIn: Number(buyIn) }),
            });
            navigate(`/tournament/${created.tournamentId}`);
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    }

    function handleTrophyFileChange(event) {
        const file = event.target.files[0];
        if (!file) return;
        setNewTrophyFile(file);
        setNewTrophyPreview(URL.createObjectURL(file));
    }

    if (loading) return <Spinner />;

    return (
        <div>
            <h1>Create Tournament</h1>
            <p>Admin tournament creation</p>

            {error && <p className="status status--error">{error}</p>}

            <form onSubmit={handleSubmit} className="tournament-create-form">
                <div className="tournament-create-form__field">
                    <label className="tournament-create-form__label" htmlFor="tc-title">Title</label>
                    <input
                        id="tc-title"
                        className="tournament-create-form__input"
                        value={title}
                        onChange={event => setTitle(event.target.value)}
                        required
                    />
                </div>

                <div className="tournament-create-form__field">
                    <label className="tournament-create-form__label" htmlFor="tc-description">Description</label>
                    <textarea
                        id="tc-description"
                        className="tournament-create-form__textarea"
                        value={description}
                        onChange={event => setDescription(event.target.value)}
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
                        onChange={event => setDate(event.target.value)}
                        min={new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}
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
                        onChange={event => setBreaks(event.target.value)}
                    />
                </div>

                <div className="tournament-create-form__field">
                    <label className="tournament-create-form__label" htmlFor="tc-elomin">Min Elo (optional)</label>
                    <input
                        id="tc-elomin"
                        className="tournament-create-form__input"
                        type="number"
                        min="1000"
                        placeholder="Leave blank for open"
                        value={eloMin}
                        onChange={event => setEloMin(event.target.value)}
                    />
                </div>

                <div className="tournament-create-form__field">
                    <label className="tournament-create-form__label" htmlFor="tc-elomax">Max Elo (optional)</label>
                    <input
                        id="tc-elomax"
                        className="tournament-create-form__input"
                        type="number"
                        min="0"
                        placeholder="Leave blank for open"
                        value={eloMax}
                        onChange={event => setEloMax(event.target.value)}
                    />
                </div>

                <div className="tournament-create-form__field">
                    <label className="tournament-create-form__label" htmlFor="tc-buyin">Buy-in (coins)</label>
                    <input
                        id="tc-buyin"
                        className="tournament-create-form__input"
                        type="number"
                        min="0"
                        value={buyIn}
                        onChange={event => setBuyIn(event.target.value)}
                    />
                </div>

                <div className="tournament-create-form__field">
                    <label className="tournament-create-form__label" htmlFor="tc-rounds">Number of Rounds</label>
                    <select
                        id="tc-rounds"
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
                    <label className="tournament-create-form__label" htmlFor="tc-category">Game Category</label>
                    <select
                        id="tc-category"
                        className="tournament-create-form__select"
                        value={gameCategory}
                        onChange={event => setGameCategory(event.target.value)}
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
                    {submitting ? "Creating..." : "Create Tournament"}
                </button>
            </form>
        </div>
    );
}
