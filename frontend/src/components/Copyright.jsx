// Shows the copyright notice; the end year is computed dynamically so it never goes stale
export default function Copyright() {
    return (
        <div className="copyright">
            <p>Spanish dice poker © 2024-{new Date().getFullYear()}</p>
        </div>
    );
}
