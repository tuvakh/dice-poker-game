import ProfileImage from "./ProfileImage";
import { FaStar } from "react-icons/fa";

// Displays a player's profile image, username, and Elo rating
export default function PlayerInfo ({ user, showImage = false, inline = false }) {
    // If no user is provided, render nothing
    if (!user) return null;
    
    return (
        <div className={`player-info${inline ? " player-info--inline" : ""}`}>
            {showImage && <ProfileImage src={user.profileImage} alt={user.username} size="small" />}
            <span className="player-info__username">{user.username}</span>
            {user.eloRating && <span className="player-info__elo"><FaStar />{user.eloRating}</span>}
        </div>
    );
}