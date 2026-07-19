import { Link } from "react-router-dom";

export default function NotFound() {
    return (
        <div className="not-found">
            <h1>404</h1>
            <h2>Page Not Found</h2>
            <p>
                Sorry, the page you're looking for doesn't exist.
            </p>
            <Link to="/" className="button button--primary not-found__btn">
                Back to Home
            </Link>
        </div>
    );
}