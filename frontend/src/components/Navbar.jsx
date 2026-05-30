import { NavLink } from "react-router-dom";
import { useSoundEffects } from "../hooks/useSoundEffects";
import { useAuth } from "../contexts/AuthContext.jsx";

// All nav links are defined here in one place so it's easy to add or remove pages
const navItems = [
  { label: "Home", path: "/"},
  { label: "Lobby", path: "/lobby" },
  { label: "Leaderboard", path: "/leaderboard" },
  { label: "Tournaments", path: "/tournament" },
  { label: "About the game", path: "/aboutGame" },
];

// Renders the main navigation menu
export default function Navbar() {
  const { playClick } = useSoundEffects();
  const { user } = useAuth();

  return (
      <nav className="navbar">
        <ul className="navbar__list">
          {/* Loop through navItems to render each link */}
          {navItems.map((item) => (
            <li key={item.path} className="navbar__item">
              {/* isActive gets true when the current URL matches this link's path */}
              <NavLink to={item.path} className={({ isActive }) => isActive ? "navbar__item--active" : "" } onClick={playClick}>
                {item.label}
              </NavLink>
            </li>
          ))}
          {/* Show admin link only for admin users */}
          {user && user.role === 'admin' && (
            <li className="navbar__item">
              <NavLink to="/admin" className={({ isActive }) => isActive ? "navbar__item--active" : "" } onClick={playClick}>
                Admin
              </NavLink>
            </li>
          )}
        </ul>
      </nav>
  );
}
