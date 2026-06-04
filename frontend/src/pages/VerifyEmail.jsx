import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { verifyEmail as apiVerifyEmail } from "../api/users.js";

export default function VerifyEmail() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('code');
    const navigate = useNavigate();

    const [status, setStatus] = useState(token ? 'verifying' : 'error');
    const [message, setMessage] = useState(token ? null : 'No verification token provided.');

    useEffect(() => {
        if (!token) {
            return;
        }

        let redirectTimer;
        apiVerifyEmail(token)
            .then(() => {
                setStatus('success');
                setMessage('Your email has been verified successfully! Redirecting to login...');
                redirectTimer = setTimeout(() => navigate('/login'), 2500);
            })
            .catch(err => {
                setStatus('error');
                setMessage(err.message || 'Verification failed.');
            });

        return () => {
            if (redirectTimer) clearTimeout(redirectTimer);
        };
    }, [token, navigate]);

    return (
        <section>
            <h1>Email verification</h1>
            {status === 'verifying' && <p className="status">Verifying your email…</p>}
            {status === 'success' && <p className="status status--success">{message}</p>}
            {status === 'error' && <p className="status status--error">{message}</p>}
        </section>
    );
}