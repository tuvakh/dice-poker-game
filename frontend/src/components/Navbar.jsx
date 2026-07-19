import { NavLink } from "react-router-dom";
import { useSoundEffects } from "../hooks/useSoundEffects";
import { useAuth } from "../contexts/AuthContext.jsx";
import Greeting from "./Greeting.jsx";
import Appearance from "./Appearance";

const navItems = [
    { label: "Home", path: "/" },
    { label: "Lobby", path: "/lobby" },
    { label: "Tournaments", path: "/tournament" },
    { label: "About the game", path: "/aboutGame" },
];

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

                {navItems.map((item) => (
                    <li key={item.path} className="navbar__item">
                        <NavLink
                            to={item.path}
                            className={({ isActive }) => isActive ? "navbar__item--active" : ""}
                            onClick={handleNavClick}
                        >
                            {item.label}
                        </NavLink>
                    </li>
                ))}

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

                <li className="navbar__item navbar__item--mobile-user">
                    <Greeting />
                    <Appearance />
                </li>
            </ul>
        </nav>
    );
}
