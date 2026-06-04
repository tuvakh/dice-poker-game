import { useAuth } from "../contexts/AuthContext.jsx";
import "./_BanModal.scss";

export default function BanModal({ message }) {
    const { logout } = useAuth();

    return (
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
