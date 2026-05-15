import { useAuth } from "../contexts/AuthContext.jsx";
import { useState } from "react";
import { createComment } from "../api/comments.js";

import Button from "./Button.jsx";
import FormField from "./FormField.jsx";

// Form for submitting a new comment on a match or tournament
// targetId and targetType tell the backend what the comment belongs to (e.g. match or tournament)
// onCommentAdded is a callback the parent uses to refresh the comment list after a successful post
export default function CommentForm({ targetId, targetType, onCommentAdded }) {
    const { user } = useAuth();
    const [text, setText] = useState("");

    // error holds a general API error message
    // fieldErrors holds per-field validation errors
    const [error, setError] = useState(null);
    const [fieldErrors, setFieldErrors] = useState({});

    async function handleSubmit(event) {
        event.preventDefault();
        // Clear previous errors before each submission attempt
        setError(null);
        setFieldErrors({});

        try {
            // Post the new comment to the backend with the current user's id
            await createComment({
                userId: user._id,
                comment: text,
                targetId,
                targetType
            });
            // Reset the input field after a successful post
            setText("");
            // Tell the parent to re-fetch comments so the new one appears immediately
            if (onCommentAdded) onCommentAdded();
        } catch (err) {
            // Field-level errors (e.g. comment too short) go to fieldErrors, the rest to error
            if (err.fieldErrors) setFieldErrors(err.fieldErrors);
            else setError(err.message);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="comments-form">
            <FormField label="Write comment" error={fieldErrors.comment}>
                <input value={text} placeholder="Something you want to say?" onChange={event => setText(event.target.value)}/>
            </FormField>
            {error && <p className="status status--error">{error}</p>}
            <Button type="submit">Add comment</Button>
        </form>
    );
}