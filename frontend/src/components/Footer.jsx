import { Link } from "react-router-dom";
import Copyright from "./Copyright.jsx";
import logo from "../assets/logo.png";

// Renders the site footer with links to static info pages and the copyright notice
export default function Footer() {
    return (
        <footer className="footer">
            <img className="footer__logo" src={logo} alt="Spanish Poker Dice logo" />
            <nav className="footer__nav">
                <ul>
                    <li><Link to="/aboutUs">About Us</Link></li>
                    <li><Link to="/privacy">Privacy</Link></li>
                    <li><Link to="/terms">Terms</Link></li>
                </ul>
            </nav>

            <Copyright />
        </footer>
    );
}
