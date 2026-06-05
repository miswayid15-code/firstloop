import { useEffect, useState } from 'react'

const DecisionDialog = ({
    open,
    title,
    message,
    couponCode,
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
            <div className="modal-content" style={{ maxWidth: 520, width: '100%' }}>
                <div className="modal-header" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 className="modal-title">{title}</h3>
                    <button type="button" className="btn btn-clear" onClick={onClose} disabled={loading}>
                        <i className="fas fa-times" />
                    </button>
                </div>

                <div className="modal-body" style={{ padding: '18px 18px 0' }}>
                    <p style={{ margin: 0, lineHeight: 1.6, color: '#3a3a3a' }}>
                        {message || (couponCode
                            ? `Coupon code: ${couponCode}`
                            : 'Choose whether to accept or reject this coupon.')}
                    </p>

                    <div style={{ display: 'flex', gap: 12, marginTop: 18 }}>
                        <button
                            type="button"
                            className={decision === 'accept' ? 'btn btn-primary' : 'btn btn-secondary'}
                            onClick={() => setDecision('accept')}
                            disabled={loading}
                            style={{ flex: 1 }}
                        >
                            Accept
                        </button>

                        <button
                            type="button"
                            className={decision === 'reject' ? 'btn btn-primary' : 'btn btn-secondary'}
                            onClick={() => setDecision('reject')}
                            disabled={loading}
                            style={{ flex: 1 }}
                        >
                            Reject
                        </button>
                    </div>

                    {decision === 'reject' && (
                        <div style={{ marginTop: 18 }}>
                            <label htmlFor="coupon-reject-reason" style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
                                Rejection Reason
                            </label>
                            <textarea
                                id="coupon-reject-reason"
                                value={reason}
                                onChange={(event) => setReason(event.target.value)}
                                rows={4}
                                placeholder="Provide the reason for rejecting this coupon"
                                disabled={loading}
                                style={{
                                    width: '100%',
                                    minHeight: 110,
                                    padding: '12px 14px',
                                    border: '1px solid var(--border)',
                                    borderRadius: 8,
                                    resize: 'vertical',
                                    fontSize: '0.95rem'
                                }}
                            />
                            {error ? (
                                <p style={{ margin: '10px 0 0', color: '#d93025', fontSize: '0.92rem' }}>
                                    {error}
                                </p>
                            ) : null}
                        </div>
                    )}
                </div>

                <div
                    className="modal-footer"
                    style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '18px' }}
                >
                    <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? 'Processing...' : `Confirm ${actionLabel}`}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default DecisionDialog
