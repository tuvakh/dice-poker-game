// Reusable wrapper that puts a label above an input and shows a validation error below it
// children is whatever input you pass in (e.g. <input>, <select>, or a <textarea>)
// inline adds a modifier class for side-by-side label+input layouts (used on checkbox lines)
export default function FormField({ label, error, children, inline=false }) {
    return (
        <div className={`form-field${inline ? " form-field--inline" : ""}`}>
            <label>{label}</label>
            {children}
            {error && <span className="form-field__error">{error}</span>}
        </div>
    );
}
