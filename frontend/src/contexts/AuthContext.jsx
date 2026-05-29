import { createContext, useContext, useState, useEffect } from "react";
import { loginUser, createUser, getUser } from "../api/users";

// This context holds the logged-in user and auth functions (login, logout, register)
const AuthContext = createContext(null);

// AuthProvider wraps the whole app so every page knows who is logged in
export function AuthProvider({ children }) {
    // Check if a user was already saved in localStorage
    // If so, start with them logged in, otherwise start as not logged in
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem("user");
        return saved ? JSON.parse(saved) : null;
    });

    // State for showing the ban modal
    const [bannedMessage, setBannedMessage] = useState(null);

    // Logs out by clearing the user from both state and localStorage
    function logout() {
        setUser(null);
        localStorage.removeItem("user");
        setBannedMessage(null);
    }

    // Handles user ban: show message
    function handleBan(message) {
        setBannedMessage(message);
    }

    // Periodically check if the logged-in user is still active (not banned)
    // Runs every 30 seconds while user is logged in
    useEffect(() => {
        if (!user?.userId) return;

        let isMounted = true;
        const checkUserStatus = async () => {
            try {
                const freshUser = await getUser(user.userId);
                if (!isMounted) return;

                // Check if user was banned since login
                if (freshUser?.banned && !bannedMessage) {
                    handleBan("Your account has been banned. Time to reflect on your choices!");
                }
            } catch (error) {
                // If we can't fetch the user, they might be deleted or there's network error
                // Don't logout, just ignore it
                console.error("Ban check failed:", error);
            }
        };

        // Check immediately on mount
        checkUserStatus();

        // Then check every 30 seconds
        const interval = setInterval(checkUserStatus, 30000);

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [user?.userId, bannedMessage, handleBan]);

    // Sends the username and password to the backend, then saves the returned user to state and localStorage
    // localStorage keeps the user logged in even if they refresh the page
    async function login(username, password) {
        const loggedInUser = await loginUser({ username, password });
        setUser(loggedInUser);
        localStorage.setItem("user", JSON.stringify(loggedInUser));
    }

    // Creates a new account and immediately logs the user in
    async function register(data) {
        // The backend returns either the created user directly or
        // an object { newUser, token } when email verification is required.
        const resp = await createUser(data);
        const payload = resp && resp.newUser ? resp : { newUser: resp };
        const created = payload.newUser;

        // If the account is already verified, log them in.
        if (created?.emailVerified) {
            setUser(created);
            localStorage.setItem("user", JSON.stringify(created));
            return { user: created };
        }

        // Otherwise return the token so the caller (Register page) can redirect
        // the user to the verification UI instead of auto-logging in.
        return { user: created, token: payload.token };
    }

    // Merges new data into the existing user object without logging out and back in
    // Used for example when saving appearance preferences or updating the profile
    function updateUserData(updates) {
        setUser(prev => {
            const updated = { ...prev, ...updates };
            localStorage.setItem("user", JSON.stringify(updated));
            return updated;
        });
    }

    return (
        // Make user and all auth functions available to any component that calls useAuth()
        <AuthContext.Provider value={{ user, login, logout, register, updateUserData, bannedMessage, handleBan }}>
            {children}
        </AuthContext.Provider>
    );
}

// Custom hook: components call useAuth() instead of the longer useContext(AuthContext)
export function useAuth() {
    return useContext(AuthContext);
}
