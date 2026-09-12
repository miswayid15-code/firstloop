import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import API from '../api.js'

/**
 * AccountRestrictedSupportModal
 * Reusable modal for restricted/inactive accounts (Merchant, Receptionist, Salesperson)
 * to submit support request tickets via `api/create_support`.
 *
 * Payload:
 * {
 *   "name": "...",
 *   "phone": "...",
 *   "email": "...",
 *   "description": "...",
 *   "type": 1, // 1 for merchant, 2 for receptionist, 4 for salesperson
 *   "submit_type": 1
 * }
 */
export default function AccountRestrictedSupportModal({
    isOpen,
    onClose,
    userType = 1,
    initialData = {},
    accountMessage = ''
}) {
    const roleTitle = userType === 1 ? 'Merchant' : userType === 2 ? 'Receptionist' : 'Sales Partner'

    const [form, setForm] = useState({
        name: '',
        phone: '',
        email: '',
        description: ''
    })
    const [loading, setLoading] = useState(false)
    const [submitted, setSubmitted] = useState(false)

    // Pre-populate form when modal opens
    useEffect(() => {
        if (!isOpen) {
            setSubmitted(false)
            return
        }

        let fallbackName = ''
        let fallbackPhone = ''
        let fallbackEmail = ''

        try {
            if (userType === 1) {
                const raw = localStorage.getItem('merchant_data') || localStorage.getItem('mer_data')
                if (raw) {
                    const parsed = JSON.parse(raw)
                    const m = parsed?.merchant_data || parsed?.data || parsed?.user || parsed || {}
                    fallbackName = m.business_name || m.user_name || m.name || ''
                    fallbackPhone = m.phone || m.mobile || ''
                    fallbackEmail = m.email || ''
                }
            } else if (userType === 2) {
                const raw = localStorage.getItem('receptionist_data') || localStorage.getItem('rec_data')
                if (raw) {
                    const parsed = JSON.parse(raw)
                    const r = parsed?.data || parsed?.user || parsed || {}
                    fallbackName = r.user_name || r.name || ''
                    fallbackPhone = r.phone || r.mobile || ''
                    fallbackEmail = r.email || ''
                }
            } else if (userType === 4) {
                const raw = localStorage.getItem('saleperson_data')
                if (raw) {
                    const s = JSON.parse(raw) || {}
                    fallbackName = s.name || ''
                    fallbackPhone = s.phone || s.mobile || ''
                    fallbackEmail = s.email || ''
                }
            }
        } catch (e) {
            console.error('Error pre-filling support modal:', e)
        }

        const defaultDesc = accountMessage
            ? `My account is restricted (${accountMessage}). Please assist me in reactivating my account access.`
            : 'My account is currently restricted/inactive. Please assist me in reactivating my account access.'

        setForm({
            name: initialData.name || fallbackName || '',
            phone: initialData.phone || fallbackPhone || '',
            email: initialData.email || fallbackEmail || '',
            description: initialData.description || defaultDesc
        })
        setSubmitted(false)
    }, [isOpen, userType, accountMessage])

    if (!isOpen) return null

    const handleChange = (e) => {
        const { name, value } = e.target
        setForm((prev) => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!form.name.trim()) {
            toast.error('Please enter your name')
            return
        }
        if (!form.phone.trim() && !form.email.trim()) {
            toast.error('Please provide a phone number or email address')
            return
        }
        if (!form.description.trim()) {
            toast.error('Please provide a description for the support team')
            return
        }

        setLoading(true)
        try {
            const payload = {
                name: form.name.trim(),
                phone: form.phone.trim(),
                email: form.email.trim(),
                description: form.description.trim(),
                type: Number(userType), // role type: 1 for merchant, 2 for receptionist, 4 for salesperson
                submit_type: 1
            }

            let response = null
            try {
                response = await API.post('api/create_support', payload)
            } catch (err1) {
                response = await API.post('create_support', payload)
            }

            if (response?.data?.status === 1 || response?.data?.status === '1' || response?.data?.success) {
                toast.success(response.data?.message || 'Support ticket submitted successfully! Our team will contact you.')
                setSubmitted(true)
                setTimeout(() => {
                    if (onClose) onClose()
                }, 2000)
            } else {
                toast.error(response?.data?.message || 'Failed to submit support request. Please try again.')
            }
        } catch (error) {
            console.error('Support submission error:', error)
            const errMsg = error.response?.data?.message || error.message || 'Something went wrong while contacting support.'
            toast.error(errMsg)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9999,
                background: 'rgba(15, 23, 42, 0.75)',
                backdropFilter: 'blur(6px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 16
            }}
            onClick={(e) => {
                if (e.target === e.currentTarget && !loading) onClose()
            }}
        >
            <div
                style={{
                    background: '#FFFFFF',
                    borderRadius: 20,
                    width: '100%',
                    maxWidth: 520,
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    overflow: 'hidden',
                    animation: 'modalSlideUp 0.25s ease-out'
                }}
            >
                <style>{`
                    @keyframes modalSlideUp {
                        from { opacity: 0; transform: translateY(16px) scale(0.98); }
                        to { opacity: 1; transform: translateY(0) scale(1); }
                    }
                `}</style>

                {/* MODAL HEADER */}
                <div
                    style={{
                        background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
                        padding: '22px 26px',
                        color: '#FFFFFF',
                        position: 'relative'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div
                            style={{
                                width: 44,
                                height: 44,
                                borderRadius: 12,
                                background: 'rgba(239, 68, 68, 0.2)',
                                border: '1px solid rgba(239, 68, 68, 0.4)',
                                color: '#EF4444',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.25rem',
                                flexShrink: 0
                            }}
                        >
                            <i className="fas fa-headset" />
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF' }}>
                                    Contact Account Support
                                </h3>
                                <span
                                    style={{
                                        fontSize: '0.68rem',
                                        fontWeight: 800,
                                        background: 'rgba(239, 68, 68, 0.2)',
                                        color: '#F87171',
                                        padding: '2px 8px',
                                        borderRadius: 6,
                                        textTransform: 'uppercase'
                                    }}
                                >
                                    Restricted Account
                                </span>
                            </div>
                            <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#94A3B8' }}>
                                Submit a request to the platform administration to restore full {roleTitle} privileges.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        style={{
                            position: 'absolute',
                            top: 20,
                            right: 20,
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: 'none',
                            color: '#94A3B8',
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = '#FFF'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)' }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = '#94A3B8'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)' }}
                    >
                        <i className="fas fa-times" />
                    </button>
                </div>

                {/* MODAL BODY */}
                <div style={{ padding: '24px 26px' }}>
                    {submitted ? (
                        <div style={{ textAlign: 'center', padding: '30px 10px' }}>
                            <div
                                style={{
                                    width: 60,
                                    height: 60,
                                    borderRadius: '50%',
                                    background: 'rgba(16, 185, 129, 0.12)',
                                    color: '#10B981',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '1.8rem',
                                    marginBottom: 16
                                }}
                            >
                                <i className="fas fa-check-circle" />
                            </div>
                            <h4 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0F172A' }}>
                                Support Request Received!
                            </h4>
                            <p style={{ margin: '8px 0 0', fontSize: '0.88rem', color: '#64748B', maxWidth: 360, marginInline: 'auto' }}>
                                Your support ticket has been registered. Our admin team will review your account status and get back to you shortly.
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            {accountMessage && (
                                <div
                                    style={{
                                        background: '#FEF2F2',
                                        border: '1px solid #FECACA',
                                        borderRadius: 10,
                                        padding: '10px 14px',
                                        marginBottom: 18,
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: 10,
                                        fontSize: '0.82rem',
                                        color: '#B91C1C'
                                    }}
                                >
                                    <i className="fas fa-info-circle" style={{ marginTop: 2, flexShrink: 0 }} />
                                    <span>
                                        <strong>Notice:</strong> {accountMessage}
                                    </span>
                                </div>
                            )}

                            {/* NAME */}
                            <div style={{ marginBottom: 14 }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                                    Full Name <span style={{ color: '#EF4444' }}>*</span>
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={form.name}
                                    onChange={handleChange}
                                    required
                                    placeholder="Enter your name"
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        borderRadius: 10,
                                        border: '1px solid #CBD5E1',
                                        fontSize: '0.9rem',
                                        outline: 'none',
                                        color: '#0F172A'
                                    }}
                                />
                            </div>

                            {/* PHONE & EMAIL ROW */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                                        Phone Number <span style={{ color: '#EF4444' }}>*</span>
                                    </label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={form.phone}
                                        onChange={handleChange}
                                        placeholder="e.g. 86099763"
                                        style={{
                                            width: '100%',
                                            padding: '10px 14px',
                                            borderRadius: 10,
                                            border: '1px solid #CBD5E1',
                                            fontSize: '0.9rem',
                                            outline: 'none',
                                            color: '#0F172A'
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                                        Email Address <span style={{ color: '#EF4444' }}>*</span>
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={form.email}
                                        onChange={handleChange}
                                        placeholder="e.g. user@email.com"
                                        style={{
                                            width: '100%',
                                            padding: '10px 14px',
                                            borderRadius: 10,
                                            border: '1px solid #CBD5E1',
                                            fontSize: '0.9rem',
                                            outline: 'none',
                                            color: '#0F172A'
                                        }}
                                    />
                                </div>
                            </div>

                            {/* DESCRIPTION */}
                            <div style={{ marginBottom: 20 }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                                    Describe Your Issue / Request <span style={{ color: '#EF4444' }}>*</span>
                                </label>
                                <textarea
                                    name="description"
                                    value={form.description}
                                    onChange={handleChange}
                                    rows={4}
                                    required
                                    placeholder="Explain why your account needs reactivation or details about your subscription/status..."
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        borderRadius: 10,
                                        border: '1px solid #CBD5E1',
                                        fontSize: '0.9rem',
                                        outline: 'none',
                                        color: '#0F172A',
                                        resize: 'vertical'
                                    }}
                                />
                            </div>

                            {/* ACTION BUTTONS */}
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, alignItems: 'center' }}>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    disabled={loading}
                                    style={{
                                        padding: '10px 18px',
                                        borderRadius: 10,
                                        background: '#F1F5F9',
                                        border: '1px solid #E2E8F0',
                                        color: '#475569',
                                        fontWeight: 700,
                                        fontSize: '0.88rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    style={{
                                        padding: '10px 22px',
                                        borderRadius: 10,
                                        background: 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)',
                                        border: 'none',
                                        color: '#FFFFFF',
                                        fontWeight: 800,
                                        fontSize: '0.88rem',
                                        cursor: loading ? 'not-allowed' : 'pointer',
                                        boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        opacity: loading ? 0.75 : 1
                                    }}
                                >
                                    {loading ? (
                                        <>
                                            <i className="fas fa-spinner fa-spin" />
                                            <span>Submitting...</span>
                                        </>
                                    ) : (
                                        <>
                                            <i className="fas fa-paper-plane" />
                                            <span>Submit Support Request</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    )
}
