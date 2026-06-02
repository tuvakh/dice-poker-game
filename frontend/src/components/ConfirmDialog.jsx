import { useEffect } from "react";
import { createPortal } from "react-dom";
import "./_ConfirmDialog.scss";

// Confirmation popup for leave/cancel actions
// Uses a Portal so the fixed overlay is never clipped by a parent with overflow:hidden
export default function ConfirmDialog({ message, onConfirm, onCancel, confirmLabel = "Yes, leave" }) {
    // Lock body scroll while the dialog is open; the cleanup function restores it when it closes
    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = ""; };
    }, []);

    // createPortal renders this directly onto document.body instead of where the component sits in the tree
    return createPortal(
        // Clicking the overlay (outside the box) cancels the dialog
        <div className="confirm-dialog__overlay" onClick={onCancel}>
            {/* stopPropagation prevents a click inside the box from bubbling up and triggering onCancel */}
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
