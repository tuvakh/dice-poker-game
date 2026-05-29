import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";

import Button from "../components/Button.jsx";
import FormField from "../components/FormField.jsx";

// The user types their username and password and clicks Login
// If it works, they get sent to the homepage. 
// If not, an error message shows up.
export default function Login (){
    const navigate = useNavigate();
    const location = useLocation();
    const { login, handleBan } = useAuth();

    // These hold what the user is currently typing in each input
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    // error shows a general message
    // fieldErrors shows a message under a specific input 
    const [error, setError] = useState(null);
    const [fieldErrors, setFieldErrors] = useState({});
    const infoMessage = location.state?.message ?? "";

    async function handleSubmit(event) {
        // Prevent the browser from reloading the page when the form is submitted
        event.preventDefault();
        // Clear old errors so they don't show while the new request is in progress
        setError(null);
        setFieldErrors({});
        try {
            await login(username, password);
            navigate("/");
        } catch (err) {
            // Check if the error is due to banned account
            if (err.message.includes("banned") || err.code === "FORBIDDEN") {
                handleBan(err.message);
            } else {
                if (err.fieldErrors) setFieldErrors(err.fieldErrors);
                else setError(err.message);
            }
        }
    }

    return (
        <section>
            <form className="form" onSubmit={handleSubmit}>
                <h1>Login</h1>
                <FormField label="Username" error={fieldErrors.username}>
                    <input
                        value={username}
                        onChange={event => setUsername(event.target.value)}
                        type="text"
                    />
                </FormField>
                <FormField label="Password" error={fieldErrors.password}>
                    <input
                        value={password}
                        onChange={event => setPassword(event.target.value)}
                        type="password"
                    />
                </FormField>
                {infoMessage && <p className="status status--info">{infoMessage}</p>}
                {error && <p className="status status--error">{error}</p>}
                <div className="login">
                    <Button type="submit">Login</Button>
                    <Link to="/forgot-password">Forgot password?</Link>
                </div>
            </form>
        </section>
    );
}
