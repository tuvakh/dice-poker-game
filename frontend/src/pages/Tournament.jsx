import { useState, useEffect } from "react";
import { getAllTournaments } from "../api/tournaments.js";
import { useSoundEffects } from "../hooks/useSoundEffects.js";
import TournamentCard from "../components/TournamentCard.jsx";

import Hero from "../components/Hero.jsx";
import Spinner from "../components/Spinner.jsx";

// TODO: replace with a dedicated tournament hero image
import tournamentHero from "../assets/lobby-hero.png";

const STATUS_TABS = [
    { value: "",         label: "All" },
    { value: "upcoming", label: "Upcoming" },
    { value: "ongoing",  label: "Ongoing" },
    { value: "finished", label: "Finished" },
];

const SORT_OPTIONS = [
    { value: "date-desc",    label: "Date (newest first)" },
    { value: "date-asc",     label: "Date (oldest first)" },
    { value: "title-asc",    label: "Title (A–Z)" },
    { value: "title-desc",   label: "Title (Z–A)" },
    { value: "players-desc", label: "Players (most first)" },
    { value: "players-asc",  label: "Players (fewest first)" },
];

// ── Tournament list ───────────────────────────────────────────────────────────
export default function Tournament() {
    const [statusFilter, setStatusFilter] = useState("");
    const [tournaments, setTournaments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState("date-desc");
    const { playClick } = useSoundEffects();

    useEffect(() => {
        setLoading(true);
        setError(null);
        const params = statusFilter ? { status: statusFilter } : {};
        getAllTournaments(params)
            .then(data => setTournaments(data.tournamentList ?? []))
            .catch(() => setError("Could not load tournaments. Please try again."))
            .finally(() => setLoading(false));
    }, [statusFilter]);

    const visibleTournaments = useMemo(() => {
        let list = [...tournaments];

        if (searchQuery.length >= 3) {
            const query = searchQuery.toLowerCase();
            list = list.filter(tournament =>
                tournament.title.toLowerCase().includes(query)
            );
        }

        list.sort((tournamentA, tournamentB) => {
            switch (sortBy) {
                case "date-asc":    return new Date(tournamentA.date) - new Date(tournamentB.date);
                case "date-desc":   return new Date(tournamentB.date) - new Date(tournamentA.date);
                case "title-asc":   return tournamentA.title.localeCompare(tournamentB.title);
                case "title-desc":  return tournamentB.title.localeCompare(tournamentA.title);
                case "players-asc": return (tournamentA.participants?.length ?? 0) - (tournamentB.participants?.length ?? 0);
                case "players-desc":return (tournamentB.participants?.length ?? 0) - (tournamentA.participants?.length ?? 0);
                default:            return 0;
            }
        });

        return list;
    }, [tournaments, searchQuery, sortBy]);

    return (
        <>
            <Hero title="Tournaments" heroImg={tournamentHero}>
                <p>Compete against other players in organised tournaments.</p>
            </Hero>

            <section>
                <div className="tournament-tabs">
                    {STATUS_TABS.map(tab => (
                        <button
                            key={tab.value}
                            className={`tournament-tabs__btn${statusFilter === tab.value ? " tournament-tabs__btn--active" : ""}`}
                            onClick={() => { playClick(); setStatusFilter(tab.value); }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

<div className="tournament-controls">
                    <input
                        type="text"
                        className="tournament-controls__search"
                        placeholder="Search by title…"
                        value={searchQuery}
                        onChange={event => setSearchQuery(event.target.value)}
                    />
                    <select
                        className="tournament-controls__sort"
                        value={sortBy}
                        onChange={event => setSortBy(event.target.value)}
                    >
                        {SORT_OPTIONS.map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                    </select>
                </div>

                <h2>
                    {statusFilter
                        ? statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)
                        : "All"} tournaments
                </h2>

                {loading && <Spinner />}
                {error && <p className="status status--error">{error}</p>}
                {!loading && !error && tournaments.length === 0 && (
                    <p>No tournaments found.</p>
                )}

                {!loading && !error && tournaments.length > 0 && (
                    <div className="cards-grid">
                        {visibleTournaments.map(tournament => (
                            <TournamentCard key={tournament._id} tournament={tournament} onClick={playClick} />
                        ))}
                    </div>
                )}
            </section>
        </>
    );
}