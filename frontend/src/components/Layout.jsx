import { Outlet, useLocation } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";

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
