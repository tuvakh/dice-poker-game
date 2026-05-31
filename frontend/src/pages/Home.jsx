import { useNavigate, Link } from "react-router-dom";

import Hero from "../components/Hero.jsx";
import Button from "../components/Button.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";

import homeHero from "../assets/home-hero.png";
import HomeDetails from "./home/HomeDetails.jsx";

// The homepage introduces the platform and shows the lobby preview, top 5 games, and tournaments
export default function Home() {
    const navigate = useNavigate();
    const { user } = useAuth();

    return (
        <>
            <Hero title="Spanish Dice Poker" heroImg={homeHero}>
                <p>Challenge players from around the world in the classic dice game. Roll your hand, hold your best dice, and outplay your opponent.</p>
                {user && (
                    <Button onClick={() => navigate("/createGame")}>
                        Create game
                    </Button>
                )}
                <Link to="/aboutGame">Learn how to play</Link>
            </Hero>

                <HomeDetails user={user} />
        </>
    );
}
