import CommentItem from "./CommentItem";

// Renders a list of comments, or a friendly message if there are none yet
export default function CommentList({ comments }) {
    return (
        <div className="comments-list">
            {/* If the array is empty, show a placeholder instead of a blank space */}
            {comments.length === 0
                ? <p className="comments-list__no-comment">No comments yet. Be the first!</p>
                : comments.map(comment => (
                    <CommentItem key={comment.commentId} comment={comment} />
                ))
            }
        </div>
    );
}