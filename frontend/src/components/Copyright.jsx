// Displays the platform name, copyright symbol, and year range
// The end year updates automatically each year
export default function Copyright (){
    return (
        <div className="copyright">
            <p>Spanish dice poker © 2024-{new Date().getFullYear()}</p>
        </div>
    );
}
