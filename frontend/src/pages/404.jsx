import { Link } from "react-router-dom";
import Button from "../components/Button.jsx";

export default function NotFound() {
    return (
        <div>
            <h1>404</h1>
            <h2>Page Not Found</h2>
            <p>
                Sorry, the page you're looking for doesn't exist.
            </p>
            <Button>
                <Link to="/">
                    Back to Home
                </Link>
            </Button>
        </div>
    );
}