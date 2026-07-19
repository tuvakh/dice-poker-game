import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";

export default function AdminRoute({ children }) {
    const { user } = useAuth();

    if (!user || user.role !== 'admin') {
        return <Navigate to="/" replace />;
    }

    return children;
}
