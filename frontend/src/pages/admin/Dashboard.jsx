import "./_Admin.scss";
import { useEffect, useState } from "react";
import { getAdminStats } from "../../api/admin.js";
import Spinner from "../../components/Spinner.jsx";

export default function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;
        getAdminStats()
            .then(res => { if (!cancelled) setStats(res); })
            .catch(err => { if (!cancelled) setError(err.message); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, []);

    if (loading) return <Spinner />;
    if (error) return <p className="status status--error">{error}</p>;

    return (
        <div className="admin__dashboard">
            <header className="admin__header">
                <h1>Admin Dashboard</h1>
                <p className="admin__subtitle">Overview of site statistics and quick actions</p>
            </header>

            <section className="admin__stats">
                <div className="stat-card">
                    <div className="stat-card__value">{stats.totalUsers}</div>
                    <div className="stat-card__label">Total Users</div>
                </div>
                <div className="stat-card">
                    <div className="stat-card__value">{stats.activeMatches24h}</div>
                    <div className="stat-card__label">Active Matches (24h)</div>
                </div>
                <div className="stat-card">
                    <div className="stat-card__value">{stats.newSignups7d}</div>
                    <div className="stat-card__label">New Signups (7d)</div>
                </div>
                <div className="stat-card">
                    <div className="stat-card__value">{stats.pendingReports}</div>
                    <div className="stat-card__label">Pending Reports</div>
                </div>
            </section>

            {stats.recentIncidents?.length > 0 && (
                <section className="admin__incidents">
                    <h2>Security Incidents</h2>
                    <table className="admin__users">
                        <thead>
                            <tr>
                                <th>Type</th>
                                <th>IP</th>
                                <th>User Agent</th>
                                <th>Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.recentIncidents.map((incident, index) => (
                                <tr key={index}>
                                    <td>{incident.type}</td>
                                    <td>{incident.ip}</td>
                                    <td>{incident.userAgent}</td>
                                    <td>{new Date(incident.timestamp).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>
            )}
        </div>
    );
}
