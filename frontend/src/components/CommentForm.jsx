import { useState } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import { createComment } from "../api/comments.js";
import Button from "./Button.jsx";
import FormField from "./FormField.jsx";

// Form for submitting a new comment; targetId and targetType tell the backend what the comment belongs to
export default function CommentForm({ targetId, targetType, onCommentAdded }) {
    const { user } = useAuth();
    const [text, setText] = useState("");
    // error is a general API message; fieldErrors holds per-field validation errors from the backend
    const [error, setError] = useState(null);
    const [fieldErrors, setFieldErrors] = useState({});

    async function handleSubmit(event) {
        // Prevents the browser's default form submit which would reload the page
        event.preventDefault();
        setError(null);
        setFieldErrors({});

        try {
            await createComment({ userId: user._id, comment: text, targetId, targetType });
            setText("");
            // Guard: parent doesn't always pass a callback, but when it does, call it to re-fetch comments
            if (onCommentAdded) onCommentAdded();
        } catch (err) {
            // Field-level errors (e.g. comment too short) go to fieldErrors; anything else goes to error
            if (err.fieldErrors) setFieldErrors(err.fieldErrors);
            else setError(err.message);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="comments-form">
            <FormField label="Write comment" error={fieldErrors.comment}>
                <input value={text} placeholder="Something you want to say?" onChange={event => setText(event.target.value)} />
            </FormField>
            {error && <p className="status status--error">{error}</p>}
            <Button type="submit">Add comment</Button>
        </form>
    );
}
