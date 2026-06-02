import { Link } from "react-router-dom";
import Button from "../components/Button.jsx";

// Rendered by the router for any path that doesn't match a defined route
export default function NotFound() {
    return (
        <div className="not-found">
            <h1>404</h1>
            <h2>Page Not Found</h2>
            <p>
                Sorry, the page you're looking for doesn't exist.
            </p>
            <Button className="not-found__btn">
                <Link to="/">
                    Back to Home
                </Link>
            </Button>
        </div>
    );
}