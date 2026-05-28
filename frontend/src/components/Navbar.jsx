import { NavLink } from "react-router-dom";
import { useSoundEffects } from "../hooks/useSoundEffects";

// All nav links are defined here in one place so it's easy to add or remove pages
const navItems = [
  { label: "Home", path: "/"},
  { label: "Lobby", path: "/lobby" },
  { label: "Tournaments", path: "/tournament" },
  { label: "About the game", path: "/aboutGame" },
];

// Renders the main navigation menu
export default function Navbar() {
  const { playClick } = useSoundEffects();

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
        </ul>
      </nav>
  );
}
