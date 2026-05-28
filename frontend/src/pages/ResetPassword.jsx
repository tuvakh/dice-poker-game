import { useRef, useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import { resetPassword as apiResetPassword } from "../api/users";

import Button from "../components/Button.jsx";
import FormField from "../components/FormField.jsx";

export default function ResetPassword() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { logout } = useAuth();
    const code = searchParams.get('code');

    const [password, setPassword] = useState("");
    const [passwordRepeat, setPasswordRepeat] = useState("");
    const [error, setError] = useState(null);
    const [message, setMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const submittingRef = useRef(false);

    // Debug: Log the URL code on page load
    useEffect(() => {
        console.log("ResetPassword page loaded");
        console.log("URL search params:", searchParams.toString());
        console.log("Extracted code:", code);
        console.log("Code length:", code?.length || 0);
        console.log("Code is valid:", !!code && code.length > 0);
    }, [code, searchParams]);

    async function handleSubmit(event) {
        event.preventDefault();
        if (submittingRef.current) return;
        setError(null);
        setMessage("");

        console.log("=== RESET FORM SUBMISSION ===");
        console.log("Code from URL:", code);
        console.log("Password:", password ? "***" : "(empty)");
        console.log("Password repeat:", passwordRepeat ? "***" : "(empty)");

        // Validate inputs before locking form
        if (!code) {
            setError("Missing reset code. Please use the link from your email.");
            console.error("Missing code in URL");
            return;
        }

        if (!password || !passwordRepeat) {
            setError("Please enter your new password twice.");
            return;
        }

        if (password.length < 8) {
            setError("Password must be at least 8 characters long.");
            return;
        }

        if (password !== passwordRepeat) {
            setError("Passwords do not match.");
            return;
        }

        try {
            submittingRef.current = true;
            setIsSubmitting(true);
            console.log("Sending reset request with code:", code);
            const result = await apiResetPassword(code, password);
            console.log("Reset successful:", result);
            setMessage(result.message || "Password reset successfully. Redirecting to login...");
            console.log("Password reset successful, logging out old session");
            logout(); // Clear old cached user so new password works
            setTimeout(() => navigate('/login'), 2000);
        } catch (err) {
            console.error("Password reset error:", err.message);
            setError(err.message);
        } finally {
            submittingRef.current = false;
            setIsSubmitting(false);
        }
    }

    return (
        <section>
            <form className="form" onSubmit={handleSubmit}>
                <h1>Reset password</h1>
                {!code && (
                    <p className="status status--error">
                        ⚠️ No reset code found in URL. Make sure you clicked the link from your email.
                    </p>
                )}
                <FormField label="New password">
                    <input
                        value={password}
                        onChange={event => setPassword(event.target.value)}
                        type="password"
                    />
                </FormField>
                <FormField label="Repeat new password">
                    <input
                        value={passwordRepeat}
                        onChange={event => setPasswordRepeat(event.target.value)}
                        type="password"
                    />
                </FormField>
                {message && <p className="status status--success">{message}</p>}
                {error && <p className="status status--error">{error}</p>}
                <Button type="submit" disabled={isSubmitting || !code}>
                    {isSubmitting ? "Resetting..." : "Reset password"}
                </Button>
                <p>
                    <Link to="/login">Back to login</Link>
                </p>
            </form>
        </section>
    );
}