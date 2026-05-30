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

// ── Tournament list ───────────────────────────────────────────────────────────
export default function Tournament() {
    const [statusFilter, setStatusFilter] = useState("");
    const [tournaments, setTournaments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
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
                        {tournaments.map(tournament => (
                            <TournamentCard key={tournament._id} tournament={tournament} onClick={playClick} />
                        ))}
                    </div>
                )}
            </section>
        </>
    );
}