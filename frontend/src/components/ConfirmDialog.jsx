import { useEffect } from "react";
import { createPortal } from "react-dom";
import "./_ConfirmDialog.scss";

export default function ConfirmDialog({ message, onConfirm, onCancel, confirmLabel = "Yes, leave" }) {
    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = ""; };
    }, []);

    return createPortal(
        <div className="confirm-dialog__overlay" onClick={onCancel}>
            <div className="confirm-dialog__box" onClick={event => event.stopPropagation()}>
                <p className="confirm-dialog__message">{message}</p>
                <div className="confirm-dialog__actions">
                    <button className="confirm-dialog__btn confirm-dialog__btn--cancel" onClick={onCancel}>
                        Cancel
                    </button>
                    <button className="confirm-dialog__btn confirm-dialog__btn--confirm" onClick={onConfirm}>
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>, document.body
    );
}
