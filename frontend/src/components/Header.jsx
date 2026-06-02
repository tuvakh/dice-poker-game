import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "./Navbar";
import Greeting from "./Greeting.jsx";
import Appearance from "./Appearance";
import logo from "../assets/logo.png";

// Renders the site header with logo, navigation, greeting, and appearance settings
export default function Header() {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <header className="header">
            <div className="header__logo">
                <Link to="/">
                    <img src={logo} alt="Spanish Poker Dice logo" />
                </Link>
            </div>
            <Navbar menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
            <div className="header__user">
                <Greeting />
                <Appearance />
            </div>
            <button
                className={`header__hamburger${menuOpen ? " header__hamburger--open" : ""}`}
                onClick={() => setMenuOpen(prev => !prev)}
                aria-label="Toggle menu"
                aria-expanded={menuOpen}
            >
                <span /><span /><span />
            </button>
        </header>
    );
}
