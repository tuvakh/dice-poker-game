import { Outlet, useLocation } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";

// Layout wraps all pages with a shared Header and Footer
// Outlet renders the current page's content between them
export default function Layout() {
    const { pathname } = useLocation();
    const isAdmin = pathname.startsWith("/admin");

	return (
        <div className="body">
            {!isAdmin && <Header />}
            <main className="main"><Outlet /></main>
            {!isAdmin && <Footer />}
        </div>
    );
}