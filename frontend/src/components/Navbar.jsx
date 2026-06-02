import { NavLink } from "react-router-dom";
import { useSoundEffects } from "../hooks/useSoundEffects";
import { useAuth } from "../contexts/AuthContext.jsx";
import Greeting from "./Greeting.jsx";
import Appearance from "./Appearance";

// All nav links are defined here in one place so it's easy to add or remove pages
const navItems = [
    { label: "Home", path: "/" },
    { label: "Lobby", path: "/lobby" },
    { label: "Tournaments", path: "/tournament" },
    { label: "About the game", path: "/aboutGame" },
];

// Renders the main navigation menu
export default function Navbar({ menuOpen, setMenuOpen }) {
    const { playClick } = useSoundEffects();
    const { user } = useAuth();

    function handleNavClick() {
        playClick();
        setMenuOpen(false);
    }

    return (
        <nav className="navbar">
            <ul className={`navbar__list${menuOpen ? " navbar__list--open" : ""}`}>
                {/* Loop through navItems to render each link */}
                {navItems.map((item) => (
                    <li key={item.path} className="navbar__item">
                        {/* isActive gets true when the current URL matches this link's path */}
                        <NavLink
                            to={item.path}
                            className={({ isActive }) => isActive ? "navbar__item--active" : ""}
                            onClick={handleNavClick}
                        >
                            {item.label}
                        </NavLink>
                    </li>
                ))}
                {/* Show admin link only for admin users */}
                {user?.role === 'admin' && (
                    <li className="navbar__item">
                        <NavLink
                            to="/admin"
                            className={({ isActive }) => isActive ? "navbar__item--active" : ""}
                            onClick={handleNavClick}
                        >
                            Admin
                        </NavLink>
                    </li>
                )}
                {/* Login/logout and appearance shown inside menu on mobile */}
                <li className="navbar__item navbar__item--mobile-user">
                    <Greeting />
                    <Appearance />
                </li>
            </ul>
        </nav>
    );
}
