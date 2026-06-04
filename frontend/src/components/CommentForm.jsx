import { useState } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import { createComment } from "../api/comments.js";
import Button from "./Button.jsx";
import FormField from "./FormField.jsx";

export default function CommentForm({ targetId, targetType, onCommentAdded }) {
    const { user } = useAuth();
    const [text, setText] = useState("");
    const [error, setError] = useState(null);
    const [fieldErrors, setFieldErrors] = useState({});

    async function handleSubmit(event) {
        event.preventDefault();
        setError(null);
        setFieldErrors({});

        try {
            await createComment({ comment: text, targetId, targetType });
            setText("");
            if (onCommentAdded) onCommentAdded();
        } catch (err) {
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
