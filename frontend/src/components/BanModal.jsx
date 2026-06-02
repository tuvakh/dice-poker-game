import { useAuth } from "../contexts/AuthContext.jsx";
import "./_BanModal.scss";

// Shown when a banned user tries to use the platform; cannot be dismissed, only logged out
export default function BanModal({ message }) {
    // logout clears the session and redirects the user to the login page
    const { logout } = useAuth();

    return (
        // No onClick on the overlay — banned users cannot click away from this modal
        <div className="ban-modal__overlay">
            <div className="ban-modal__content">
                <div className="ban-modal__icon">🚫</div>
                <h2 className="ban-modal__title">Account Banned</h2>
                <p className="ban-modal__message">{message}</p>
                <button className="ban-modal__button" onClick={() => logout()}>
                    Log Out
                </button>
            </div>
        </div>
    );
}
