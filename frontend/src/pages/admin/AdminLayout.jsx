import { Outlet, Link } from "react-router";
import { useAuth } from "../../contexts/AuthContext.jsx";
import logo from "../../assets/logo.png";
import Button from "../../components/Button.jsx";

// Shared shell for all /admin/* routes: sidebar nav + main content area rendered via <Outlet />
export default function AdminLayout() {
    const { logout } = useAuth();

    return (
        <section className="admin">
            <aside className="admin__nav">
                <div className="admin__logo">
                    <Link to="/">
                        <img src={logo} alt="Spanish Poker Dice logo" />
                    </Link>
                </div>    
                <nav>
                    <ul>
                        <li><Link to="/admin">Dashboard</Link></li>
                        <li><Link to="/admin/users">Users</Link></li>
                        <li><Link to="/admin/comments">Comments</Link></li>
                        <li><Link to="/admin/tournaments/create">Create Tournament</Link></li>
                    </ul>
                </nav>
                <div className="admin__logout">
                    <Button onClick={logout}>Log out</Button>
                </div>
            </aside>
            <main className="admin__content">
                <Outlet />
            </main>
        </section>
    );
}
