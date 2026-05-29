import { Outlet, Link } from "react-router-dom";
import "./_Admin.scss";

export default function AdminLayout() {
    return (
        <section className="admin">
            <aside className="admin__nav">
                <h2>Admin</h2>
                <nav>
                    <ul>
                        <li><Link to="/admin">Dashboard</Link></li>
                        <li><Link to="/admin/users">Users</Link></li>
                        <li><Link to="/admin/comments">Comments</Link></li>
                        <li><Link to="/admin/tournaments/create">Create Tournament</Link></li>
                    </ul>
                </nav>
            </aside>
            <main className="admin__content">
                <Outlet />
            </main>
        </section>
    );
}
