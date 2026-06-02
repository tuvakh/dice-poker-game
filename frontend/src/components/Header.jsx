import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "./Navbar";
import Greeting from "./Greeting.jsx";
import Appearance from "./Appearance";
import logo from "../assets/logo.png";

// Renders the site header: logo, nav, greeting, appearance settings, and hamburger menu
export default function Header() {
    // menuOpen tracks whether the mobile hamburger menu is expanded or collapsed
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <header className="header">
            {/* Logo links back to the homepage */}
            <div className="header__logo">
                <Link to="/"><img src={logo} alt="Spanish Poker Dice logo" /></Link>
            </div>

            {/* menuOpen and setMenuOpen are passed down so Navbar can close itself when a link is clicked */}
            <Navbar menuOpen={menuOpen} setMenuOpen={setMenuOpen} />

            {/* On desktop, Greeting and Appearance sit in the header. On mobile they move inside the Navbar */}
            <div className="header__user">
                <Greeting />
                <Appearance />
            </div>

            {/* Hamburger button — the three empty <span>s are styled in CSS to look like the three lines */}
            {/* aria-label and aria-expanded are accessibility attributes for screen readers */}
            <button
                className={`header__hamburger${menuOpen ? " header__hamburger--open" : ""}`}
                onClick={() => setMenuOpen(prev => !prev)}
                aria-label="Toggle menu"
                aria-expanded={menuOpen}
            >
                {/* prev => !prev is the safe way to toggle: always flips from the latest state value */}
                <span /><span /><span />
            </button>
        </header>
    );
}
