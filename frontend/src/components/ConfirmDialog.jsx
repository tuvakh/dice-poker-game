import "./_ConfirmDialog.scss";

// Simple confirmation popup used for leave/cancel actions.
// Pass message, onConfirm, and onCancel — the parent controls whether it shows.
export default function ConfirmDialog({ message, onConfirm, onCancel }) {
    return (
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
        </div>
    );
}
