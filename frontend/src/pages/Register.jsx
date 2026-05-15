import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../contexts/AuthContext.jsx";

import Button from "../components/Button.jsx";
import FormField from "../components/FormField.jsx";

// The registration page collects user details and creates a new account
export default function Register (){
    const navigate = useNavigate();
    const { register } = useAuth();
    
    // Form field states
    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [passwordRepeat, setPasswordRepeat] = useState("");
    const [dateOfBirth, setDateOfBirth] = useState("");
    const [agreeToTerms, setAgreeToTerms] = useState(false);
    
    // error shows a general message
    // fieldErrors shows a message under a specific input 
    const [error, setError] = useState(null); 
    const [fieldErrors, setFieldErrors] = useState({});

    async function handleSubmit(event) {
        event.preventDefault();
        // Clear previous errors
        setError(null);
        setFieldErrors({});

        // Validate that both password fields match before submitting
        if (password !== passwordRepeat) {
            setFieldErrors({ passwordRepeat: "Passwords do not match" });
            return;
        }
        
        // Ensure user has agreed to terms and conditions
        if (!agreeToTerms) {
            setError("You must agree to the terms and conditions");
            return;
        }

        try {
            // Calculate age from date of birth since the backend stores age as a number
            const age = new Date().getFullYear() - new Date(dateOfBirth).getFullYear();
            await register({email, username, password, age});
            navigate("/");
        } catch (err) {
            // Handle field-specific errors from backend validation
            if (err.fieldErrors) setFieldErrors(err.fieldErrors);
            // Handle general error messages
            else setError(err.message);
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
                
                <FormField label="I agree to terms and conditions" inline>
                    <input type="checkbox" checked={agreeToTerms} onChange={event => setAgreeToTerms(event.target.checked)} />
                </FormField>
                
                {error && <p className="status status--error">{error}</p>}
                
                <Button type="submit">Register</Button>
            </form>
        </section>
    );
}
