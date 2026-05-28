import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import ProfileImage from "./ProfileImage.jsx";

// Shows a greeting for logged-in users, or login/register links for anonymous users
export default function Greeting() {
    const { user, logout } = useAuth();

    // Logged-in: show avatar linking to profile, username greeting, and logout button
    if (user) {
        return (
            <div className="greeting">
                <Link className="greeting__image" to={`/user/${user.userId}`}>
                    <ProfileImage src={user.profileImage} username={user.username} size="small" />
                    <span>Hello, {user.username}</span>
               </Link>
                <span className="greeting__coins">Coins: {user.coins ?? 0}</span>
                <Link className="greeting__button" to="/" onClick={logout}>Log out</Link>
            </div>
        );
    }

    // Anonymous: show links to login and registration pages
    return (
        <div className="greeting">
            <Link className="greeting__button" to="/login">Login</Link>
            <Link className="greeting__button" to="/register">Register</Link>
        </div>
    );
}
