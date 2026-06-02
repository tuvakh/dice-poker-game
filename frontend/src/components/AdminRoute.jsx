import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";

// Wraps admin pages: redirects non-admins to the homepage, renders the page for admins
export default function AdminRoute({ children }) {
    const { user } = useAuth();

    // Catches both logged-out users (user is null) and logged-in non-admins
    if (!user || user.role !== 'admin') {
        // replace:true replaces the current history entry so the user can't click Back to get to the admin page
        return <Navigate to="/" replace />;
    }

    // children is whatever page component was wrapped in <AdminRoute> in the router
    return children;
}
