import { NavLink } from "react-router-dom";
import { useSoundEffects } from "../hooks/useSoundEffects";
import { useAuth } from "../contexts/AuthContext.jsx";
import Greeting from "./Greeting.jsx";
import Appearance from "./Appearance";

// All nav links defined in one place — add or remove pages here
const navItems = [
    { label: "Home", path: "/" },
    { label: "Lobby", path: "/lobby" },
    { label: "Tournaments", path: "/tournament" },
    { label: "About the game", path: "/aboutGame" },
];

// menuOpen and setMenuOpen come from the parent (Header) and control the hamburger menu on mobile
export default function Navbar({ menuOpen, setMenuOpen }) {
    // playClick plays a click sound if the user has sounds enabled in Appearance settings
    const { playClick } = useSoundEffects();
    // user comes from AuthContext — contains the logged-in user's data, or null if not logged in
    const { user } = useAuth();

    // Called when any nav link is clicked: plays the sound and closes the mobile menu
    function handleNavClick() {
        playClick();
        setMenuOpen(false);
    }

    return (
        <nav className="navbar">
            {/* --open class is added when the hamburger menu is toggled on mobile */}
            <ul className={`navbar__list${menuOpen ? " navbar__list--open" : ""}`}>

                {/* Render a link for each item in the navItems array above */}
                {navItems.map((item) => (
                    // key={item.path} is required by React when rendering a list. It helps React track which item is which
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

                {/* Only admins see this link. ?. means "only read .role if user is not null" */}
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

                {/* On mobile, the login/greeting and appearance controls move inside the open menu */}
                <li className="navbar__item navbar__item--mobile-user">
                    <Greeting />
                    <Appearance />
                </li>
            </ul>
        </nav>
    );
}
