import { useEffect, useState } from 'react'

const DecisionDialog = ({
    open,
    title,
    message,
    details,
    onClose,
    onSubmit,
    loading = false,
    initialDecision = 'accept',
    initialReason = ''
}) => {
    const [decision, setDecision] = useState(initialDecision)
    const [reason, setReason] = useState(initialReason)
    const [error, setError] = useState('')

    useEffect(() => {
        if (open) {
            setDecision(initialDecision)
            setReason(initialReason)
            setError('')
        }
    }, [open, initialDecision, initialReason])

    const handleSubmit = async () => {
        if (decision === 'reject' && !reason.trim()) {
            setError('Reason is required when rejecting a coupon.')
            return
        }

        setError('')

        if (onSubmit) {
            await onSubmit({
                decision,
                reason: reason.trim()
            })
        }
    }

    const actionLabel = decision === 'accept' ? 'Accept' : 'Reject'

    if (!open) {
        return null
    }

    return (
        <div className="modal active">
            <div className="modal-backdrop" onClick={loading ? undefined : onClose} />
            <div
                className="modal-content"
                style={{
                    maxWidth: 560,
                    width: '100%',
                    borderRadius: 18,
                    overflow: 'hidden',
                    boxShadow: '0 30px 80px rgba(12, 35, 66, 0.16)'
                }}
            >
                <div
                    className="modal-header"
                    style={{
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '22px 24px',
                        borderBottom: '1px solid rgba(0, 0, 0, 0.08)'
                    }}
                >
                    <div>
                        <h3 className="modal-title" style={{ margin: 0, fontSize: '1.2rem' }}>
                            {title}
                        </h3>
                        {details ? (
                            <p style={{ margin: '8px 0 0', color: 'var(--text-muted)', fontSize: '0.94rem' }}>
                                {details}
                            </p>
                        ) : null}
                    </div>
                    <button type="button" className="btn btn-clear" onClick={onClose} disabled={loading}>
                        <i className="fas fa-times" />
                    </button>
                </div>

                <div className="modal-body" style={{ padding: '24px' }}>
                    <p style={{ margin: 0, lineHeight: 1.8, color: 'var(--text-muted)', fontSize: '0.97rem' }}>
                        {message || 'Choose whether to accept or reject.'}
                    </p>

                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: 12,
                            marginTop: 22
                        }}
                    >
                        <button
                            type="button"
                            className={decision === 'accept' ? 'btn btn-primary' : 'btn btn-secondary'}
                            onClick={() => setDecision('accept')}
                            disabled={loading}
                            style={{
                                minHeight: 50,
                                borderRadius: 12,
                                fontWeight: 600,
                                boxShadow: decision === 'accept' ? 'inset 0 0 0 1px rgba(255,255,255,0.12)' : 'none'
                            }}
                        >
                            Accept
                        </button>

                        <button
                            type="button"
                            className={decision === 'reject' ? 'btn btn-primary' : 'btn btn-secondary'}
                            onClick={() => setDecision('reject')}
                            disabled={loading}
                            style={{
                                minHeight: 50,
                                borderRadius: 12,
                                fontWeight: 600,
                                boxShadow: decision === 'reject' ? 'inset 0 0 0 1px rgba(255,255,255,0.12)' : 'none'
                            }}
                        >
                            Reject
                        </button>
                    </div>

                    {decision === 'reject' && (
                        <div style={{ marginTop: 22 }}>
                            <label
                                htmlFor="coupon-reject-reason"
                                style={{
                                    display: 'block',
                                    marginBottom: 10,
                                    fontWeight: 600,
                                    color: 'var(--text-headline)'
                                }}
                            >
                                Rejection Reason
                            </label>
                            <textarea
                                id="coupon-reject-reason"
                                value={reason}
                                onChange={(event) => setReason(event.target.value)}
                                rows={5}
                                placeholder="Provide the reason for rejecting this coupon"
                                disabled={loading}
                                style={{
                                    width: '100%',
                                    minHeight: 130,
                                    padding: '14px 16px',
                                    border: '1px solid rgba(0, 0, 0, 0.12)',
                                    borderRadius: 14,
                                    resize: 'vertical',
                                    fontSize: '0.95rem',
                                    lineHeight: 1.6,
                                    background: 'var(--bg-input)'
                                }}
                            />
                            {error ? (
                                <p style={{ margin: '12px 0 0', color: '#d93025', fontSize: '0.92rem' }}>
                                    {error}
                                </p>
                            ) : null}
                        </div>
                    )}
                </div>

                <div
                    className="modal-footer"
                    style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: 12,
                        padding: '18px 24px 24px'
                    }}
                >
                    <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handleSubmit}
                        disabled={loading}
                        style={{ minWidth: 140 }}
                    >
                        {loading ? 'Processing...' : `Confirm ${actionLabel}`}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default DecisionDialog
