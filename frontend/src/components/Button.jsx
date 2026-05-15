// Reusable button component with a variant prop for styling 
export default function Button({ children, variant="primary", onClick, type="button", className = "" }) {
    return (
        <button className={`button button--${variant} ${className}`} onClick={onClick} type={type}> 
            {children} 
        </button>
    )
}