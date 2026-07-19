import PlayerInfo from "./PlayerInfo";

export default function CommentItem({ comment }) {
    return (
        <div className="comment-item">
            <PlayerInfo user={comment.userId} showImage inline />
            <p>{new Date(comment.createdAt).toLocaleString()}</p>
            <p>{comment.comment}</p>
        </div>
    );
}
