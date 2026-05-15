import { Outlet } from "react-router";
import Header from "./Header";
import Footer from "./Footer";

// Layout wraps all pages with a shared Header and Footer
// Outlet renders the current page's content between them
export default function Layout() {
	return (
		<div className="body">
			<Header/>
            <main className="main"><Outlet /></main>
			<Footer/>
		</div>
	);
}