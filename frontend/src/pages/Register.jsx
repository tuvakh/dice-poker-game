import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { useAuth } from "../contexts/AuthContext.jsx";
import { resendVerificationEmail } from "../api/users.js";

import Button from "../components/Button.jsx";
import FormField from "../components/FormField.jsx";

const RESEND_COOLDOWN = 30;

// Registration page — success shows a "check your inbox" message rather than auto-logging in (email verification required)
export default function Register() {
    const { register } = useAuth();

    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [passwordRepeat, setPasswordRepeat] = useState("");
    const [dateOfBirth, setDateOfBirth] = useState("");
    const [agreeToTerms, setAgreeToTerms] = useState(false);

    // fieldErrors maps field names to messages shown under each input; error is a fallback for general failures
    const [error, setError] = useState(null);
    const [fieldErrors, setFieldErrors] = useState({});
    const [successMessage, setSuccessMessage] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [resendMessage, setResendMessage] = useState(null);
    const [isResending, setIsResending] = useState(false);
    const [cooldown, setCooldown] = useState(0);
    // submittingRef prevents a double-submit if the user clicks faster than the state update cycle
    const submittingRef = useRef(false);

    useEffect(() => {
        if (cooldown <= 0) return;
        const id = setTimeout(() => setCooldown(c => c - 1), 1000);
        return () => clearTimeout(id);
    }, [cooldown]);

    async function handleSubmit(event) {
        event.preventDefault();
        if (submittingRef.current) return;
        setError(null);
        setFieldErrors({});
        setSuccessMessage(null);

        if (password !== passwordRepeat) {
            setFieldErrors({ passwordRepeat: "Passwords do not match" });
            return;
        }

        if (!agreeToTerms) {
            setError("You must agree to the terms and conditions");
            return;
        }

        submittingRef.current = true;
        setIsSubmitting(true);

        try {
            // Backend stores age as a number, so we derive it from the date of birth here
            const age = new Date().getFullYear() - new Date(dateOfBirth).getFullYear();
            await register({email, username, password, age});
            setSuccessMessage("Check your inbox and click the verification link before logging in.");
            setCooldown(RESEND_COOLDOWN);
        } catch (err) {
            if (err.fieldErrors) setFieldErrors(err.fieldErrors);
            else setError(err.message);
        } finally {
            submittingRef.current = false;
            setIsSubmitting(false);
        }
    }

    async function handleResend() {
        setResendMessage(null);
        setIsResending(true);
        try {
            const result = await resendVerificationEmail(email);
            setResendMessage(result.message || "Verification email resent.");
            setCooldown(RESEND_COOLDOWN);
        } catch (err) {
            setResendMessage(err.message);
        } finally {
            setIsResending(false);
        }
    }

    return (
        <section>
            <form className="form" onSubmit={handleSubmit}>
                <h1>Register</h1>

                <FormField label="Username" error={fieldErrors.username}>
                    <input
                        value={username}
                        onChange={event => setUsername(event.target.value)}
                        type="text"
                    />
                </FormField>

                <FormField label="Email" error={fieldErrors.email}>
                    <input
                        value={email}
                        onChange={event => setEmail(event.target.value)}
                        type="email"
                    />
                </FormField>

                <FormField label="Password" error={fieldErrors.password}>
                    <input
                        value={password}
                        onChange={event => setPassword(event.target.value)}
                        type="password"
                    />
                </FormField>

                <FormField label="Repeat password" error={fieldErrors.passwordRepeat}>
                    <input
                        value={passwordRepeat}
                        onChange={event => setPasswordRepeat(event.target.value)}
                        type="password"
                    />
                </FormField>

                <FormField label="Date of Birth" error={fieldErrors.age}>
                    <input
                        value={dateOfBirth}
                        onChange={event => setDateOfBirth(event.target.value)}
                        type="date"
                    />
                </FormField>

                <FormField label={<>I agree to the <Link to="/terms">terms and conditions</Link></>} inline>
                    <input
                        aria-label="I agree to terms and conditions"
                        type="checkbox"
                        checked={agreeToTerms}
                        onChange={event => setAgreeToTerms(event.target.checked)}
                    />
                </FormField>

                {error && <p className="status status--error">{error}</p>}
                {successMessage && <p className="status status--success">{successMessage}</p>}
                {resendMessage && <p className="status status--success">{resendMessage}</p>}

                {!successMessage ? (
                    <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Registering..." : "Register"}</Button>
                ) : (
                    <Button
                        type="button"
                        disabled={isResending || cooldown > 0}
                        onClick={handleResend}
                    >
                        {isResending ? "Sending..." : cooldown > 0 ? `Resend in ${cooldown}s` : "Resend verification email"}
                    </Button>
                )}
            </form>
        </section>
    );
}
