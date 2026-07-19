import { createContext, useContext, useState, useEffect } from "react";
import { loginUser, createUser, getUser } from "../api/users";
import { BASE_URL } from "../api/config";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        const saved = sessionStorage.getItem("user");
        return saved ? JSON.parse(saved) : null;
    });

    const [bannedMessage, setBannedMessage] = useState(null);

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
    }, [user?.userId, bannedMessage]);


    async function login(username, password) {
        const loggedInUser = await loginUser({ username, password });
        setUser(loggedInUser);
        sessionStorage.setItem("user", JSON.stringify(loggedInUser));
    }

    function logout() {
        setUser(null);
        sessionStorage.removeItem("user");
        setBannedMessage(null);
        fetch(`${BASE_URL}/users/logout`, { method: 'POST', credentials: 'include' }).catch(() => {});
    }

    async function register(data) {
        const registrationResult = await createUser(data);
        const payload = registrationResult && registrationResult.newUser ? registrationResult : { newUser: registrationResult };
        const created = payload.newUser;

        if (created?.emailVerified) {
            setUser(created);
            sessionStorage.setItem("user", JSON.stringify(created));
            return { user: created };
        }

        return { user: created, token: payload.token };
    }

    function updateUserData(updates) {
        setUser(prev => {
            if (!prev) return prev;
            const updated = { ...prev, ...updates };
            sessionStorage.setItem("user", JSON.stringify(updated));
            return updated;
        });
    }

    function handleBan(message) {
        setBannedMessage(message);
    }

    return (
        <AuthContext.Provider value={{ user, login, logout, register, updateUserData, bannedMessage, handleBan }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
