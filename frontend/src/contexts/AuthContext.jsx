import { createContext, useContext, useState } from "react";
import { loginUser, createUser } from "../api/users";

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

    // Sends the username and password to the backend, then saves the returned user to state and localStorage
    // localStorage keeps the user logged in even if they refresh the page
    async function login(username, password) {
        const loggedInUser = await loginUser({ username, password });
        setUser(loggedInUser);
        localStorage.setItem("user", JSON.stringify(loggedInUser));
    }

    // Creates a new account and immediately logs the user in
    async function register(data) {
        const newUser = await createUser(data);
        setUser(newUser);
        localStorage.setItem("user", JSON.stringify(newUser));
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

    // Logs out by clearing the user from both state and localStorage
    function logout() {
        setUser(null);
        localStorage.removeItem("user");
    }

    return (
        // Make user and all auth functions available to any component that calls useAuth()
        <AuthContext.Provider value={{ user, login, logout, register, updateUserData }}>
            {children}
        </AuthContext.Provider>
    );
}

// Custom hook: components call useAuth() instead of the longer useContext(AuthContext)
export function useAuth() {
    return useContext(AuthContext);
}
