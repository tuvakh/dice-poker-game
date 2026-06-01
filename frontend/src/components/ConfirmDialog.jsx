import { useEffect } from "react";
import { createPortal } from "react-dom";
import "./_ConfirmDialog.scss";

// Simple confirmation popup used for leave/cancel actions.
// Rendered via a Portal directly onto document.body so the fixed overlay
// is never clipped by a parent element with overflow:hidden or position:relative.
export default function ConfirmDialog({ message, onConfirm, onCancel }) {
    // Lock body scroll while the dialog is open, restore it when it closes
    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = ""; };
    }, []);

    return createPortal(
        <div className="confirm-dialog__overlay" onClick={onCancel}>
            {/* stopPropagation stops a click inside the box from closing it */}
            <div className="confirm-dialog__box" onClick={e => e.stopPropagation()}>
                <p className="confirm-dialog__message">{message}</p>
                <div className="confirm-dialog__actions">
                    <button className="confirm-dialog__btn confirm-dialog__btn--cancel" onClick={onCancel}>
                        Cancel
                    </button>
                    <button className="confirm-dialog__btn confirm-dialog__btn--confirm" onClick={onConfirm}>
                        Yes, leave
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
