import { Link } from "react-router";
import Navbar from "./Navbar";
import Greeting from "./Greeting.jsx";
import Appearance from "./Appearance";
import logo from "../assets/logo.png";

// Renders the site header with logo, navigation, greeting, and appearance settings
export default function Header (){
    return (
        <header className="header">
            <div className="header__logo">
                <Link to="/">
                    <img src={logo} alt="Spanish Poker Dice logo"/>
                </Link>
            </div>
            <Navbar/>
            <div className="header__user">
                <Greeting/>
                <Appearance/>
            </div>
        </header>
    );
}