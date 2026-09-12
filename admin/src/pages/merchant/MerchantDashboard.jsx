import { useState, useEffect } from 'react'
import { NavLink, useNavigate, useOutletContext } from 'react-router-dom'
import { toast } from "react-hot-toast"
import API from '../../api.js';
import AccountRestrictedSupportModal from '../../components/AccountRestrictedSupportModal.jsx';

// Helper to safely retrieve merchant data from localStorage
const getStoredMerchant = () => {
    try {
        const raw = localStorage.getItem("merchant_data") || localStorage.getItem("mer_data")
        if (raw && raw !== "null" && raw !== "undefined") {
            const parsed = JSON.parse(raw)
            return parsed?.merchant_data || parsed?.data || parsed?.user || parsed || {}
        }
    } catch (e) {
        console.error("Error parsing merchant_data in MerchantDashboard:", e)
    }
    return {}
}

const formatDate = (isoString) => {
    if (!isoString) return '-'
    try {
        const date = new Date(isoString)
        if (Number.isNaN(date.getTime())) return ''
        return date.toLocaleDateString('en-US', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        })
    } catch {
        return ''
    }
}

const formatTime = (isoString) => {
    if (!isoString) return '-'
    try {
        const date = new Date(isoString)
        if (Number.isNaN(date.getTime())) return isoString
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        })
    } catch {
        return isoString
    }
}

const getPaymentLabel = (type) => {
    const val = String(type || '').trim().toLowerCase()
    if (val === '1' || val === 'cash') {
        return (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <i className="fas fa-money-bill-wave" style={{ color: '#16A34A' }} />
                <span>Cash</span>
            </span>
        )
    }
    if (val === '2' || val === 'online' || val === 'upi') {
        return (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <i className="fas fa-globe" style={{ color: '#0284C7' }} />
                <span>Online / UPI</span>
            </span>
        )
    }
    if (val === '3' || val === 'card') {
        return (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <i className="fas fa-credit-card" style={{ color: '#9333EA' }} />
                <span>Card</span>
            </span>
        )
    }
    return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <i className="fas fa-wallet" style={{ color: '#64748B' }} />
            <span>{type || 'Cash'}</span>
        </span>
    )
}

export default function MerchantDashboard() {
    const navigate = useNavigate()
    const outletCtx = useOutletContext()
    const isAccountActive = (outletCtx && outletCtx.isAccountActive !== undefined) ? outletCtx.isAccountActive : true
    const [dashboard, setDashboard] = useState(null)
    const [loading, setLoading] = useState(false)
    const [merchant, setMerchant] = useState(getStoredMerchant)
    const [supportModalOpen, setSupportModalOpen] = useState(false)

    const fetchDashboard = async (currentMerchant = merchant) => {
        try {
            setLoading(true)
            const merchantId = currentMerchant?.id || currentMerchant?.merchant_id || currentMerchant?.user_id || localStorage.getItem("mer_user_id")
            const payload = {}
            if (merchantId) payload.merchant_id = merchantId

            const response = await API.post("firstloop/merchant/dashboard", payload)

            if (response.data?.status === 1 || response.data?.status === "1" || response.data?.success) {
                const dashData = (response.data?.data && typeof response.data.data === 'object')
                    ? response.data.data
                    : response.data
                setDashboard(dashData || {})
            } else {
                toast.error(
                    response.data?.message ||
                    "Failed to fetch dashboard"
                )
            }
        } catch (error) {
            console.error("Dashboard Fetch Error:", error)
            toast.error(
                error.response?.data?.message ||
                "Something went wrong"
            )
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        const stored = getStoredMerchant()
        setMerchant(stored)

        const token = localStorage.getItem("mer_access_token") || localStorage.getItem("merchant_token") || localStorage.getItem("access_token")
        const rawData = localStorage.getItem("merchant_data") || localStorage.getItem("mer_data")

        if (!token && !rawData) {
            toast.error("Please login to access Merchant Dashboard")
            navigate('/merchant/login', { replace: true })
            return
        }

        fetchDashboard(stored)
    }, [])

    const todayReports = Array.isArray(dashboard?.today_report) ? dashboard.today_report : []
    const displayName = dashboard?.name || merchant?.business_name || merchant?.user_name || merchant?.name || merchant?.email || 'Merchant'

    return (
        <div style={{ paddingBottom: 40 }}>
            {/* WELCOME BANNER HEADER */}
            <div
                style={{
                    background: 'var(--firstloop-gradient-primary)',
                    borderRadius: 20,
                    padding: '24px 28px',
                    color: '#FFFFFF',
                    marginBottom: 28,
                    boxShadow: '0 12px 28px -6px rgba(14, 136, 184, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 20
                }}
            >
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
                        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem', fontWeight: 800, margin: 0 }}>
                            Welcome back, {displayName}!
                        </h1>
                        {merchant?.email && (
                            <span style={{ background: 'rgba(255, 255, 255, 0.2)', padding: '2px 8px', borderRadius: 6, fontSize: '0.72rem', fontWeight: 600 }}>
                                {merchant.email}
                            </span>
                        )}
                    </div>
                    <p style={{ fontSize: '0.88rem', opacity: 0.95, marginTop: 4, maxWidth: 600, margin: 0 }}>
                        Here is your live loyalty performance, stamp card issuance, membership tier activity, and branch operational status.
                    </p>
                </div>

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                    <button
                        type="button"
                        onClick={() => fetchDashboard(merchant)}
                        disabled={loading}
                        style={{
                            background: 'rgba(255, 255, 255, 0.2)',
                            color: '#FFFFFF',
                            padding: '10px 16px',
                            borderRadius: 12,
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            border: '1px solid rgba(255, 255, 255, 0.35)',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6
                        }}
                        title="Refresh Live Statistics"
                    >
                        <i className={`fas fa-sync-alt ${loading ? 'fa-spin' : ''}`} />
                        <span>Refresh</span>
                    </button>

                    {isAccountActive ? (
                        <>
                            <button
                                type="button"
                                onClick={() => navigate('/merchant/cards')}
                                style={{
                                    background: '#FFFFFF',
                                    color: 'var(--firstloop-primary)',
                                    padding: '10px 18px',
                                    borderRadius: 12,
                                    fontWeight: 700,
                                    fontSize: '0.85rem',
                                    border: 'none',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                }}
                            >
                                <i className="fas fa-plus-circle" />
                                <span>Manage Cards</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => navigate('/merchant/branches')}
                                style={{
                                    background: 'rgba(255, 255, 255, 0.2)',
                                    color: '#FFFFFF',
                                    padding: '10px 18px',
                                    borderRadius: 12,
                                    fontWeight: 700,
                                    fontSize: '0.85rem',
                                    border: '1px solid rgba(255, 255, 255, 0.4)',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 8
                                }}
                            >
                                <i className="fas fa-store" />
                                <span>View Branches</span>
                            </button>
                        </>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setSupportModalOpen(true)}
                            style={{
                                background: '#DC2626',
                                color: '#FFFFFF',
                                padding: '10px 18px',
                                borderRadius: 12,
                                fontWeight: 800,
                                fontSize: '0.85rem',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 8,
                                boxShadow: '0 4px 12px rgba(220, 38, 38, 0.35)'
                            }}
                        >
                            <i className="fas fa-headset" />
                            <span>Contact Support</span>
                        </button>
                    )}
                </div>
            </div>

            {/* TOP KPI STAT METRICS GRID */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 18, marginBottom: 28 }}>
                <div
                    className="card"
                    onClick={isAccountActive ? () => navigate('/merchant/branches') : undefined}
                    style={{
                        padding: 18,
                        borderRadius: 16,
                        border: '1px solid rgba(14, 136, 184, 0.15)',
                        background: '#FFFFFF',
                        cursor: isAccountActive ? 'pointer' : 'default',
                        transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                    }}
                    onMouseEnter={(e) => { if (isAccountActive) e.currentTarget.style.transform = 'translateY(-2px)' }}
                    onMouseLeave={(e) => { if (isAccountActive) e.currentTarget.style.transform = 'translateY(0)' }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Active Branches</span>
                        <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--firstloop-primary-light)', color: 'var(--firstloop-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <i className="fas fa-store" />
                        </div>
                    </div>
                    <div
                        style={{
                            fontSize: '1.6rem',
                            fontWeight: 800,
                            color: 'var(--text-primary)',
                            marginTop: 8
                        }}
                    >
                        {loading ? <i className="fas fa-spinner fa-spin" style={{ fontSize: '1.2rem' }} /> : `${dashboard?.active_br ?? 0} Locations`}
                    </div>
                    {isAccountActive && (
                        <small style={{ fontSize: '0.72rem', color: 'var(--firstloop-primary)', fontWeight: 700, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span>Manage Branches &rarr;</span>
                        </small>
                    )}
                </div>

                <div
                    className="card"
                    onClick={isAccountActive ? () => navigate('/merchant/customers') : undefined}
                    style={{
                        padding: 18,
                        borderRadius: 16,
                        border: '1px solid rgba(14, 136, 184, 0.15)',
                        background: '#FFFFFF',
                        cursor: isAccountActive ? 'pointer' : 'default',
                        transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                    }}
                    onMouseEnter={(e) => { if (isAccountActive) e.currentTarget.style.transform = 'translateY(-2px)' }}
                    onMouseLeave={(e) => { if (isAccountActive) e.currentTarget.style.transform = 'translateY(0)' }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Enrolled Customers</span>
                        <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(16, 185, 129, 0.1)', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <i className="fas fa-users" />
                        </div>
                    </div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: 8 }}>
                        {loading ? <i className="fas fa-spinner fa-spin" style={{ fontSize: '1.2rem' }} /> : `${dashboard?.active_cus ?? 0} Members`}
                    </div>
                    {isAccountActive && (
                        <small style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 700, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span>View Customer List &rarr;</span>
                        </small>
                    )}
                </div>

                <div
                    className="card"
                    onClick={isAccountActive ? () => navigate('/merchant/cards') : undefined}
                    style={{
                        padding: 18,
                        borderRadius: 16,
                        border: '1px solid rgba(14, 136, 184, 0.15)',
                        background: '#FFFFFF',
                        cursor: isAccountActive ? 'pointer' : 'default',
                        transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                    }}
                    onMouseEnter={(e) => { if (isAccountActive) e.currentTarget.style.transform = 'translateY(-2px)' }}
                    onMouseLeave={(e) => { if (isAccountActive) e.currentTarget.style.transform = 'translateY(0)' }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Active Stamp Cards</span>
                        <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(239, 0, 3, 0.1)', color: '#EF0003', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <i className="fas fa-stamp" />
                        </div>
                    </div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: 8 }}>
                        {loading ? <i className="fas fa-spinner fa-spin" style={{ fontSize: '1.2rem' }} /> : `${dashboard?.active_st_cr ?? 0} Active Passes`}
                    </div>
                    {isAccountActive && (
                        <small style={{ fontSize: '0.72rem', color: '#EF0003', fontWeight: 700, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span>Manage Stamp Cards &rarr;</span>
                        </small>
                    )}
                </div>

                <div
                    className="card"
                    onClick={isAccountActive ? () => navigate('/merchant/cards') : undefined}
                    style={{
                        padding: 18,
                        borderRadius: 16,
                        border: '1px solid rgba(14, 136, 184, 0.15)',
                        background: '#FFFFFF',
                        cursor: isAccountActive ? 'pointer' : 'default',
                        transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                    }}
                    onMouseEnter={(e) => { if (isAccountActive) e.currentTarget.style.transform = 'translateY(-2px)' }}
                    onMouseLeave={(e) => { if (isAccountActive) e.currentTarget.style.transform = 'translateY(0)' }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Membership Tiers</span>
                        <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(245, 158, 11, 0.1)', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <i className="fas fa-crown" />
                        </div>
                    </div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: 8 }}>
                        {loading ? <i className="fas fa-spinner fa-spin" style={{ fontSize: '1.2rem' }} /> : `${dashboard?.active_mem_cr ?? 0} Tiers`}
                    </div>
                    {isAccountActive && (
                        <small style={{ fontSize: '0.72rem', color: '#D97706', fontWeight: 700, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span>Manage Memberships &rarr;</span>
                        </small>
                    )}
                </div>
            </div>

            {/* RECENT CUSTOMER STAMP & REDEMPTION TRANSACTIONS */}
            <div className="card" style={{ padding: 20, borderRadius: 18, border: '1px solid rgba(14, 136, 184, 0.12)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                                Today's Customer Check-Ins & Redemptions
                            </h3>
                            <span style={{ fontSize: '0.78rem', background: 'rgba(16, 185, 129, 0.12)', color: '#059669', fontWeight: 800, padding: '3px 10px', borderRadius: 8 }}>
                                {todayReports.length} Check-Ins Today
                            </span>
                        </div>
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 2, marginBottom: 0 }}>
                            Real-time stream of customer stamp entries, membership check-ins, and payments across all branches.
                        </p>
                    </div>

                    {isAccountActive && (
                        <NavLink to="/merchant/reports" className="btn btn-sm" style={{ background: 'var(--firstloop-primary-light)', color: 'var(--firstloop-primary)', fontWeight: 700, fontSize: '0.82rem', borderRadius: 8, padding: '6px 12px', textDecoration: 'none' }}>
                            View Full Reports &rarr;
                        </NavLink>
                    )}
                </div>

                <div className="table-responsive">
                    <table className="table table-custom align-middle mb-0" style={{ fontSize: '0.85rem' }}>
                        <thead>
                            <tr style={{ background: 'rgba(14, 136, 184, 0.05)' }}>
                                <th>Date & Time</th>
                                <th>Customer</th>
                                <th>Branch</th>
                                <th>Card Pass Issued</th>
                                <th>Payment Method</th>
                                <th>Amount</th>
                                <th style={{ textAlign: 'right' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {todayReports.length > 0 ? (
                                todayReports.map((tx, idx) => {
                                    const isStamp = tx.card_type === 1 || String(tx.card_type).toLowerCase() === 'stamp'
                                    const phoneFormatted = tx.phone
                                        ? `${tx.country_code ? `+${String(tx.country_code).replace('+', '')} ` : ''}${tx.phone}`
                                        : (tx.email || '-')
                                    const amountFormatted = tx.amount != null && tx.amount !== ''
                                        ? `₹${parseFloat(tx.amount).toFixed(2)}`
                                        : '₹0.00'

                                    return (
                                        <tr key={tx.id || `tx-${idx}`}>
                                            <td style={{ whiteSpace: 'nowrap' }}>
                                                <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.84rem' }}>
                                                    {formatDate(tx.time)}
                                                </div>
                                                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                                                    <i className="far fa-clock" style={{ fontSize: '0.7rem' }} />
                                                    <span>{formatTime(tx.time)}</span>
                                                </div>
                                            </td>
                                            <td
                                                onClick={isAccountActive ? () => navigate('/merchant/customers') : undefined}
                                                style={{ cursor: isAccountActive ? 'pointer' : 'default' }}
                                                title={isAccountActive ? "View in Customer List" : undefined}
                                            >
                                                <strong style={{ fontWeight: 700, color: isAccountActive ? 'var(--firstloop-primary)' : 'inherit', display: 'block' }}>
                                                    {tx.name || 'Customer'}
                                                </strong>
                                                <small style={{ color: 'var(--text-muted)' }}>{phoneFormatted}</small>
                                            </td>
                                            <td>
                                                <span
                                                    className="badge"
                                                    onClick={isAccountActive ? (e) => {
                                                        e.stopPropagation()
                                                        navigate(tx.branch_id ? `/merchant/branches/${tx.branch_id}` : '/merchant/branches')
                                                    } : undefined}
                                                    style={{
                                                        background: '#F1F5F9',
                                                        color: '#475569',
                                                        fontWeight: 700,
                                                        padding: '4px 8px',
                                                        borderRadius: 6,
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: 4,
                                                        cursor: isAccountActive ? 'pointer' : 'default'
                                                    }}
                                                    title={isAccountActive ? "View Branch Details" : undefined}
                                                >
                                                    <i className="fas fa-map-marker-alt" style={{ color: 'var(--firstloop-primary)' }} />
                                                    {tx.branch_name || 'Branch'}
                                                </span>
                                            </td>
                                            <td>
                                                {isStamp ? (
                                                    <span
                                                        className="badge"
                                                        onClick={isAccountActive ? (e) => {
                                                            e.stopPropagation()
                                                            navigate('/merchant/cards')
                                                        } : undefined}
                                                        style={{
                                                            background: 'var(--firstloop-primary-light)',
                                                            color: 'var(--firstloop-primary)',
                                                            fontWeight: 700,
                                                            padding: '6px 10px',
                                                            borderRadius: 8,
                                                            cursor: isAccountActive ? 'pointer' : 'default'
                                                        }}
                                                        title={isAccountActive ? "Manage Stamp Cards" : undefined}
                                                    >
                                                        <i className="fas fa-stamp" style={{ marginRight: 4 }} />
                                                        {tx.card_name || 'Stamp Card'}
                                                    </span>
                                                ) : (
                                                    <span
                                                        className="badge"
                                                        onClick={isAccountActive ? (e) => {
                                                            e.stopPropagation()
                                                            navigate('/merchant/cards')
                                                        } : undefined}
                                                        style={{
                                                            background: 'rgba(245, 158, 11, 0.15)',
                                                            color: '#D97706',
                                                            fontWeight: 700,
                                                            padding: '6px 10px',
                                                            borderRadius: 8,
                                                            cursor: isAccountActive ? 'pointer' : 'default'
                                                        }}
                                                        title={isAccountActive ? "Manage Membership Cards" : undefined}
                                                    >
                                                        <i className="fas fa-crown" style={{ marginRight: 4 }} />
                                                        {tx.card_name || 'VIP Membership'}
                                                    </span>
                                                )}
                                            </td>
                                            <td style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                                                {getPaymentLabel(tx.payment_type)}
                                            </td>
                                            <td style={{ fontWeight: 800, color: 'var(--text-primary)' }}>
                                                {amountFormatted}
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <span className="badge" style={{ background: 'var(--status-success-bg)', color: 'var(--status-success)', fontWeight: 700, padding: '6px 12px', borderRadius: 8 }}>
                                                    <i className="fas fa-check-circle" style={{ marginRight: 4 }} />
                                                    {tx.status || 'Completed'}
                                                </span>
                                            </td>
                                        </tr>
                                    )
                                })
                            ) : (
                                <tr>
                                    <td colSpan={7} style={{ textAlign: 'center', padding: '36px 20px', color: 'var(--text-muted)' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                                            <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', color: '#94A3B8' }}>
                                                <i className="fas fa-receipt" />
                                            </div>
                                            <strong style={{ fontSize: '0.95rem', color: '#475569' }}>No check-in activity logged today</strong>
                                            <span style={{ fontSize: '0.82rem', color: '#94A3B8' }}>Customer stamp visits and membership check-ins will appear here in real-time.</span>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Support Popup Modal */}
            <AccountRestrictedSupportModal
                isOpen={supportModalOpen}
                onClose={() => setSupportModalOpen(false)}
                userType={1}
                accountMessage={outletCtx?.accountMessage}
            />
        </div>
    )
}

