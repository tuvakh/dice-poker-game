import ProfileImage from "./ProfileImage";
import { FaStar } from "react-icons/fa";

// Shows a player's profile image (optional), username, and Elo rating
// showImage and inline default to false
export default function PlayerInfo ({ user, showImage = false, inline = false }) {
    // Bail early if no user data was passed in
    if (!user) return null;

    return (
        // Adds --inline modifier class when the parent wants a horizontal layout
        <div className={`player-info${inline ? " player-info--inline" : ""}`}>
            {/* Only renders the image if the parent passed showImage={true} */}
            {showImage && <ProfileImage src={user.profileImage} alt={user.username} size="small" />}
            <span className="player-info__username">{user.username}</span>
            {/* Guard in case eloRating is missing from the data */}
            {user.eloRating && <span className="player-info__elo"><FaStar />{user.eloRating}</span>}
        </div>
    );
}
