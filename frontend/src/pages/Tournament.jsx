import { useMemo, useState, useEffect } from "react";
import { getAllTournaments } from "../api/tournaments.js";
import { useSoundEffects } from "../hooks/useSoundEffects.js";
import TournamentCard from "../components/TournamentCard.jsx";

import Hero from "../components/Hero.jsx";
import Spinner from "../components/Spinner.jsx";
import Button from "../components/Button.jsx";

const STATUS_TABS = [
    { value: "",         label: "All" },
    { value: "upcoming", label: "Upcoming" },
    { value: "ongoing",  label: "Ongoing" },
    { value: "finished", label: "Finished" },
];

// All sorting is done client-side so the backend does not need extra sort params
const SORT_OPTIONS = [
    { value: "date-desc",    label: "Date (newest first)" },
    { value: "date-asc",     label: "Date (oldest first)" },
    { value: "title-asc",    label: "Title (A–Z)" },
    { value: "title-desc",   label: "Title (Z–A)" },
    { value: "players-desc", label: "Players (most first)" },
    { value: "players-asc",  label: "Players (fewest first)" },
];

// Tournament list page: shows all tournaments with status tabs, search, sort, and load-more
export default function Tournament() {
    const [statusFilter, setStatusFilter] = useState("");
    const [tournaments, setTournaments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState("date-desc");
    const [visibleCount, setVisibleCount] = useState(6);
    const { playClick } = useSoundEffects();

    useEffect(() => {
        setLoading(true);
        setError(null);
        // Reset visible count when the status tab changes so the user starts fresh
        setVisibleCount(6);
        const params = statusFilter ? { status: statusFilter } : {};
        getAllTournaments(params)
            .then(data => setTournaments(data.tournamentList ?? []))
            .catch(() => setError("Could not load tournaments. Please try again."))
            .finally(() => setLoading(false));
    }, [statusFilter]);

    // visibleTournaments is re-computed only when tournaments, searchQuery, or sortBy changes
    // Search only activates at 3+ characters (requirement says "at least 3")
    const visibleTournaments = useMemo(() => {
        let list = [...tournaments];

        if (searchQuery.length >= 3) {
            const query = searchQuery.toLowerCase();
            list = list.filter(tournament =>
                tournament.title.toLowerCase().includes(query)
            );
        }

        // Sort the filtered list
        // localeCompare handles accented characters correctly for title sort
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
            <Hero title="Tournaments" heroImg="/tournament-hero.webp">
                <p>Compete against other players in organised tournaments.</p>
            </Hero>

            <section>
                <div className="tournament-tabs">
                    {STATUS_TABS.map(tab => (
                        <Button
                            key={tab.value}
                            type="button"
                            className={`tournament-tabs__btn${statusFilter === tab.value ? " tournament-tabs__btn--active" : ""}`}
                            onClick={() => { playClick(); setStatusFilter(tab.value); }}
                        >
                            {tab.label}
                        </Button>
                    ))}
                </div>
                
                {/* Search input and sort dropdown - controls the visibleTournaments list above */}
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

                <h2>{STATUS_TABS.find(tab => tab.value === statusFilter)?.label ?? "All"} tournaments</h2>

                {loading && <Spinner />}
                {error && <p className="status status--error">{error}</p>}
                {!loading && !error && tournaments.length === 0 && (
                    <p>No tournaments found.</p>
                )}

                {!loading && !error && tournaments.length > 0 && (
                    <div className="cards-grid">
                        {/* Show only the first visibleCount tournaments, more are loaded on button click */}
                        {visibleTournaments.slice(0, visibleCount).map(tournament => (
                            <TournamentCard key={tournament._id} tournament={tournament} onClick={playClick} />
                        ))}
                    </div>
                )}
                {/* Load more button appears only when there are more tournaments to show */}
                {!loading && !error && visibleCount < visibleTournaments.length && (
                    <Button type="button" onClick={() => setVisibleCount(prev => prev + 6)}>
                        Load more
                    </Button>
                )}
            </section>
        </>
    );
}