import PlayerInfo from "./PlayerInfo";

// Displays a single comment: author info, timestamp, and text
export default function CommentItem({ comment }) {
    return (
        <div className="comment-item">
            {/* showImage adds the avatar; inline puts the avatar and name on the same line */}
            <PlayerInfo user={comment.userId} showImage inline />
            {/* toLocaleString converts the raw ISO date string into the user's local date and time format */}
            <p>{new Date(comment.createdAt).toLocaleString()}</p>
            <p>{comment.comment}</p>
        </div>
    );
}
