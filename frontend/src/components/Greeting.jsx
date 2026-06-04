import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import ProfileImage from "./ProfileImage.jsx";

export default function Greeting() {
    const { user } = useAuth();

    if (user) {
        return (
            <div className="greeting">
                <Link className="greeting__image" to={`/user/${user.userId}`}>
                    <ProfileImage src={user.profileImage} username={user.username} size="small" />
                    <span>Hello, {user.username}</span>
                </Link>
                <span className="greeting__coins">Coins: {user.coins ?? 0}</span>
            </div>
        );
    }

    return (
        <div className="greeting">
            <Link className="greeting__button" to="/login">Login</Link>
            <Link className="greeting__button" to="/register">Register</Link>
        </div>
    );
}
