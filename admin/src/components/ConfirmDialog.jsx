import React from 'react'

const ConfirmDialog = ({
    open,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    onConfirm,
    onClose,
    loading = false
}) => {
    if (!open) {
        return null
    }

    return (
        <div className="modal active">
            <div className="modal-backdrop" onClick={loading ? undefined : onClose}></div>
            <div className="modal-content" style={{ maxWidth: 440, width: '100%' }}>
                <div className="modal-header" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 className="modal-title">{title}</h3>
                    <button
                        type="button"
                        className="btn btn-clear"
                        onClick={onClose}
                        disabled={loading}
                    >
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                <div className="modal-body" style={{ padding: '18px 18px 24px' }}>
                    <p style={{ margin: 0, lineHeight: 1.6, color: '#3a3a3a' }}>{message}</p>
                </div>

                <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '0 18px 18px' }}>
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={onClose}
                        disabled={loading}
                    >
                        {cancelText}
                    </button>
                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={onConfirm}
                        disabled={loading}
                    >
                        {loading ? 'Processing...' : confirmText}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ConfirmDialog
