// Reusable label + input + error wrapper; inline adds a side-by-side layout (used on checkboxes)
export default function FormField({ label, error, children, inline = false }) {
    return (
        <div className={`form-field${inline ? " form-field--inline" : ""}`}>
            <label>{label}</label>
            {children}
            {error && <span className="form-field__error">{error}</span>}
        </div>
    );
}
