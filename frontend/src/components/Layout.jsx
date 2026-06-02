import { Outlet, useLocation } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";

// Wraps every page with a shared Header and Footer
// Outlet is a React Router placeholder. It renders whichever child route is currently active
export default function Layout() {
    // useLocation gives us the current URL so we can check which page we're on
    const { pathname } = useLocation();

    // Admin pages should not show the public Header or Footer (per exam spec)
    const isAdmin = pathname.startsWith("/admin");

    return (
        <div className="body">
            {!isAdmin && <Header />}
            {/* The active page component renders here */}
            <main className="main"><Outlet /></main>
            {!isAdmin && <Footer />}
        </div>
    );
}
