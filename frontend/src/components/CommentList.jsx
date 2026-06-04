import CommentItem from "./CommentItem";
import { useRef, useEffect } from "react";

export default function CommentList({ comments }) {
    const listRef = useRef(null);
    const prevLengthRef = useRef(0);

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
                : comments.map(comment => <CommentItem key={comment._id} comment={comment} />)
            }
        </div>
    );
}
