import CommentItem from "./CommentItem";
import { useRef, useEffect } from "react";

// Renders a scrollable list of comments, or a placeholder message if there are none
export default function CommentList({ comments }) {
    // ref to the scrollable container so we can control its scroll position
    const listRef = useRef(null);
    // tracks the comment count from the previous render to detect when a new one arrives
    const prevLengthRef = useRef(0);

    // Auto-scrolls to the bottom only when a new comment is added (not on initial load)
    // Comparing lengths means this does nothing if comments are removed or the list first renders
    useEffect(() => {
        if (comments.length > prevLengthRef.current && listRef.current) {
            listRef.current.scrollTop = listRef.current.scrollHeight;
        }
        prevLengthRef.current = comments.length;
    }, [comments]);

    return (
        <div className="comments-list" ref={listRef}>
            {comments.length === 0
                ? <p className="comments-list__no-comment">No comments yet. Be the first!</p>
                // key={comment._id} is MongoDB's unique ID, used by React to track list items
                : comments.map(comment => <CommentItem key={comment._id} comment={comment} />)
            }
        </div>
    );
}
