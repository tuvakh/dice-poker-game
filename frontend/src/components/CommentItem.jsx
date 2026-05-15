import PlayerInfo from "./PlayerInfo";

// Displays a single comment with the author's avatar + username, when it was posted, and the comment text
export default function CommentItem({ comment }) {
    return (
        <div className="comment-item">
            {/* showImage adds the avatar, inline puts avatar and name on the same line */}
            <PlayerInfo user={comment.userId} showImage inline />
            {/* Convert the raw date string from the backend into a readable local format */}
            <p>{new Date(comment.createdAt).toLocaleString()}</p>
            <p>{comment.comment}</p>
        </div>
    );
}