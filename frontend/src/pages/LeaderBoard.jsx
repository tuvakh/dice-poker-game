import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import Hero from "../components/Hero.jsx";
import Spinner from "../components/Spinner.jsx";
import ProfileImage from "../components/ProfileImage.jsx";

import { getRankings } from "../api/leaderboards.js";
import { getAllGameCategories } from "../api/gameCategories.js";

import heroImage from "../assets/home-hero.png";
import "./_LeaderBoard.scss";

const SORT_OPTIONS = [
    { value: "elo", label: "ELO" },
    { value: "wins", label: "Wins" },
    { value: "winPercentage", label: "Win %" },
    { value: "matches", label: "Matches" }
];

function formatCategory(category) {
    if (!category) return "All categories";
    return `${category.numberOfRounds} rounds · ${category.gameRules === "straights_allowed" ? "straights allowed" : "no straights"} · ${category.timeController}s`;
}

export default function LeaderBoard() {
    const [sortBy, setSortBy] = useState("elo");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [categories, setCategories] = useState([]);
    const [rankings, setRankings] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        getAllGameCategories()
            .then(data => setCategories(Array.isArray(data) ? data : data.gameCategoryList ?? []))
            .catch(() => setCategories([]));
    }, []);

    useEffect(() => {
        let active = true;

        async function loadRankings() {
            setLoading(true);
            setError(null);

            try {
                const data = await getRankings({
                    page,
                    limit: 10,
                    sortBy,
                    category: selectedCategory || undefined
                });

                if (!active) return;

                setRankings(data.userList ?? []);
                setTotalPages(data.totalPages ?? 1);
            } catch {
                if (!active) return;
                setError("Could not load the leaderboard. Please try again.");
            } finally {
                if (active) setLoading(false);
            }
        }

        loadRankings();

        return () => {
            active = false;
        };
    }, [page, sortBy, selectedCategory]);

    function handleSortChange(value) {
        setSortBy(value);
        setPage(1);
    }

    function handleCategoryChange(event) {
        setSelectedCategory(event.target.value);
        setPage(1);
    }

    const selectedCategoryInfo = categories.find(category => category._id === selectedCategory);

    return (
        <>
            <Hero title="Leaderboard" heroImg={heroImage}>
                <p>See who dominates the table by ELO, wins, win rate, or total matches.</p>
            </Hero>

            <section className="leaderboard-page">
                <div className="leaderboard-page__panel">
                    <div className="leaderboard-page__controls">
                        <div className="leaderboard-page__sort-group" role="tablist" aria-label="Leaderboard sort options">
                            {SORT_OPTIONS.map(option => (
                                <button
                                    key={option.value}
                                    type="button"
                                    className={`leaderboard-page__sort-btn${sortBy === option.value ? " leaderboard-page__sort-btn--active" : ""}`}
                                    onClick={() => handleSortChange(option.value)}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>

                        <label className="leaderboard-page__filter">
                            <span>Category</span>
                            <select value={selectedCategory} onChange={handleCategoryChange}>
                                <option value="">All categories</option>
                                {categories.map(category => (
                                    <option key={category._id} value={category._id}>
                                        {formatCategory(category)}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>

                    <div className="leaderboard-page__summary">
                        <div>
                            <p className="leaderboard-page__eyebrow">Ranking by</p>
                            <h2>{SORT_OPTIONS.find(option => option.value === sortBy)?.label ?? "ELO"}</h2>
                        </div>
                        <p>{selectedCategoryInfo ? formatCategory(selectedCategoryInfo) : "All categories"}</p>
                    </div>

                    {loading && <Spinner />}
                    {error && <p className="status status--error">{error}</p>}

                    {!loading && !error && rankings.length === 0 && (
                        <p className="leaderboard-page__empty">No players match the current filters.</p>
                    )}

                    {!loading && !error && rankings.length > 0 && (
                        <ol className="leaderboard-list">
                            {rankings.map((player, index) => {
                                const position = ((page - 1) * 10) + index + 1;
                                return (
                                    <li key={player._id} className="leaderboard-list__item">
                                        <span className="leaderboard-list__rank">#{position}</span>
                                        <Link to={`/user/${player.userId}`} className="leaderboard-list__player">
                                            {player.profileImage ? (
                                                <ProfileImage src={player.profileImage} username={player.username} size="small" />
                                            ) : (
                                                <span className="leaderboard-list__avatar">
                                                    {player.username?.[0]?.toUpperCase() ?? "?"}
                                                </span>
                                            )}
                                            <span className="leaderboard-list__name-wrap">
                                                <strong>{player.username}</strong>
                                            </span>
                                        </Link>
                                        <div className="leaderboard-list__stats">
                                            <span><strong>{player.eloRating ?? 0}</strong><small>ELO</small></span>
                                            <span><strong>{player.wins ?? 0}</strong><small>Wins</small></span>
                                            <span><strong>{player.totalMatches ?? 0}</strong><small>Matches</small></span>
                                            <span><strong>{player.winPercentage ?? 0}%</strong><small>Win rate</small></span>
                                        </div>
                                    </li>
                                );
                            })}
                        </ol>
                    )}

                    <div className="leaderboard-page__pagination">
                        <button type="button" onClick={() => setPage(current => Math.max(1, current - 1))} disabled={page <= 1}>
                            Previous
                        </button>
                        <span>
                            Page {page} of {totalPages}
                        </span>
                        <button type="button" onClick={() => setPage(current => Math.min(totalPages, current + 1))} disabled={page >= totalPages}>
                            Next
                        </button>
                    </div>
                </div>
            </section>
        </>
    );
}
