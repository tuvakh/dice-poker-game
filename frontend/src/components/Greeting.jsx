import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import ProfileImage from "./ProfileImage.jsx";

// Shows a greeting with avatar and username for logged-in users, or login/register links for guests
export default function Greeting() {
    // useAuth reads from AuthContext
    const { user } = useAuth();

    // Early return: if there is a logged-in user, render the logged-in version and stop here
    if (user) {
        return (
            <div className="greeting">
                {/* Avatar and username link to the user's own profile page */}
                <Link className="greeting__image" to={`/user/${user.userId}`}>
                    <ProfileImage src={user.profileImage} username={user.username} size="small" />
                    <span>Hello, {user.username}</span>
                </Link>
                {/* ?? 0 means "show 0 if coins is null or undefined" */}
                <span className="greeting__coins">Coins: {user.coins ?? 0}</span>
            </div>
        );
    }

    // If user is null (not logged in), render login and register links instead
    return (
        <div className="greeting">
            <Link className="greeting__button" to="/login">Login</Link>
            <Link className="greeting__button" to="/register">Register</Link>
        </div>
    );
}
