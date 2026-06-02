import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword as requestPasswordReset } from "../api/users";

import Button from "../components/Button.jsx";
import FormField from "../components/FormField.jsx";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [error, setError] = useState(null);
    const [message, setMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    // submittingRef prevents a second submission if the user clicks faster than the state update cycle
    const submittingRef = useRef(false);

    // Always shows a neutral success message whether or not the account exists
    // to prevent email enumeration (an attacker fishing for valid addresses)
    async function handleSubmit(event) {
        event.preventDefault();
        if (submittingRef.current) return;
        setError(null);
        setMessage("");
        submittingRef.current = true;
        setIsSubmitting(true);

        try {
            const result = await requestPasswordReset(email);
            setMessage(result.message || "If that email exists, a reset link has been sent.");
        } catch (err) {
            setError(err.message);
        } finally {
            submittingRef.current = false;
            setIsSubmitting(false);
        }
    }

    return (
        <section>
            <form className="form" onSubmit={handleSubmit}>
                <h1>Forgot password</h1>
                <p className="status">Enter your email and we will send a reset link if the account exists.</p>
                <FormField label="Email">
                    <input
                        value={email}
                        onChange={event => setEmail(event.target.value)}
                        type="email"
                    />
                </FormField>
                {message && <p className="status status--success">{message}</p>}
                {error && <p className="status status--error">{error}</p>}
                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Sending..." : "Send reset link"}</Button>
                <p>
                    <Link to="/login">Back to login</Link>
                </p>
            </form>
        </section>
    );
}