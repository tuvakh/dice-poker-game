import { createContext, useContext, useState, useEffect } from "react";
import { loginUser, createUser, getUser } from "../api/users";
import { BASE_URL } from "../api/config";

// Holds the logged-in user and exposes auth functions to the whole app via useAuth()
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    // Restore the user from sessionStorage on page refresh; null means not logged in
    const [user, setUser] = useState(() => {
        const saved = sessionStorage.getItem("user");
        return saved ? JSON.parse(saved) : null;
    });

    // Non-null string means the user is banned; triggers the BanModal overlay
    const [bannedMessage, setBannedMessage] = useState(null);

    // Polls the backend every 30 seconds to check if the logged-in user has been banned or deleted
    // isMounted prevents state updates if the component unmounts before the async call returns
    useEffect(() => {
        if (!user?.userId) return;

        let isMounted = true;

        const checkUserStatus = async () => {
            try {
                const freshUser = await getUser(user.userId);
                if (!isMounted) return;
                if (freshUser?.banned && !bannedMessage) {
                    setBannedMessage("Your account has been banned. Time to reflect on your choices!");
                }
            } catch (error) {
                // Auto-logout if the user no longer exists (e.g. database was reseeded)
                if (error?.message?.toLowerCase().includes("not found") || error?.status === 404) {
                    if (isMounted) logout();
                }
            }
        };

        checkUserStatus();
        const interval = setInterval(checkUserStatus, 30000);

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    // handleBan is intentionally excluded from deps — it's recreated every render and would reset the interval
    }, [user?.userId, bannedMessage]);

    // login, logout, register are the core auth functions

    async function login(username, password) {
        const loggedInUser = await loginUser({ username, password });
        setUser(loggedInUser);
        // sessionStorage keeps the user logged in across page refreshes (cleared when the tab closes)
        sessionStorage.setItem("user", JSON.stringify(loggedInUser));
    }

    function logout() {
        setUser(null);
        sessionStorage.removeItem("user");
        setBannedMessage(null);
        // Tell the backend to clear the refresh token cookie
        fetch(`${BASE_URL}/users/logout`, { method: 'POST', credentials: 'include' }).catch(() => {});
    }

    // Creates a new account; if email verification is required, returns a token for the verify page
    async function register(data) {
        const registrationResult = await createUser(data);
        // Backend returns either the user directly or { newUser, token } when verification is needed
        const payload = registrationResult && registrationResult.newUser ? registrationResult : { newUser: registrationResult };
        const created = payload.newUser;

        if (created?.emailVerified) {
            setUser(created);
            sessionStorage.setItem("user", JSON.stringify(created));
            return { user: created };
        }

        // Not verified yet — return the token so the Register page can redirect to the verify UI
        return { user: created, token: payload.token };
    }

    // Merges partial updates into the stored user without a full re-login (used for profile and preferences)
    function updateUserData(updates) {
        setUser(prev => {
            if (!prev) return prev;
            const updated = { ...prev, ...updates };
            sessionStorage.setItem("user", JSON.stringify(updated));
            return updated;
        });
    }

    // Exposed so other components (e.g. API interceptors) can trigger the ban modal directly
    function handleBan(message) {
        setBannedMessage(message);
    }

    return (
        <AuthContext.Provider value={{ user, login, logout, register, updateUserData, bannedMessage, handleBan }}>
            {children}
        </AuthContext.Provider>
    );
}

// Custom hook — shorthand for useContext(AuthContext)
export function useAuth() {
    return useContext(AuthContext);
}
