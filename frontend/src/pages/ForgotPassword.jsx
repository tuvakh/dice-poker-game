import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { forgotPassword as requestPasswordReset } from "../api/users";

import Button from "../components/Button.jsx";
import FormField from "../components/FormField.jsx";

const RESEND_COOLDOWN = 30;

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [error, setError] = useState(null);
    const [message, setMessage] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [sent, setSent] = useState(false);
    const [cooldown, setCooldown] = useState(0);
    const submittingRef = useRef(false);

    useEffect(() => {
        if (cooldown <= 0) return;
        const id = setTimeout(() => setCooldown(count => count - 1), 1000);
        return () => clearTimeout(id);
    }, [cooldown]);

    async function sendRequest() {
        if (submittingRef.current) return;
        setError(null);
        submittingRef.current = true;
        setIsSubmitting(true);

        try {
            const result = await requestPasswordReset(email);
            setMessage(result.message || "If that email exists, a reset link has been sent.");
            setSent(true);
            setCooldown(RESEND_COOLDOWN);
        } catch (err) {
            setError(err.message);
        } finally {
            submittingRef.current = false;
            setIsSubmitting(false);
        }
    }

    function handleSubmit(event) {
        event.preventDefault();
        setMessage(null);
        sendRequest();
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
                {!sent ? (
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Sending..." : "Send reset link"}
                    </Button>
                ) : (
                    <Button
                        type="button"
                        disabled={isSubmitting || cooldown > 0}
                        onClick={() => { setMessage(null); sendRequest(); }}
                    >
                        {isSubmitting ? "Sending..." : cooldown > 0 ? `Resend in ${cooldown}s` : "Resend email"}
                    </Button>
                )}
                <p>
                    <Link to="/login">Back to login</Link>
                </p>
            </form>
        </section>
    );
}