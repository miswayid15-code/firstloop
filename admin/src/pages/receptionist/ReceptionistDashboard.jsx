import { useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { toast } from "react-hot-toast"
import API from '../../api.js'

// Helper to safely retrieve receptionist data from localStorage
const getStoredReceptionist = () => {
    try {
        const raw = localStorage.getItem("receptionist_data") || localStorage.getItem("rec_data")
        if (raw && raw !== "null" && raw !== "undefined") {
            const parsed = JSON.parse(raw)
            const rec = parsed?.data || parsed?.user || parsed || {}
            // Populate fallback fields if present in separate localStorage keys
            if (!rec.user_id && localStorage.getItem("rec_user_id")) {
                rec.user_id = localStorage.getItem("rec_user_id")
            }
            if (!rec.user_repId && localStorage.getItem("rec_user_repId")) {
                rec.user_repId = localStorage.getItem("rec_user_repId")
            }
            return rec
        }
    } catch (e) {
        console.error("Error parsing receptionist_data from localStorage:", e)
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

export default function ReceptionistDashboard() {
    const navigate = useNavigate()
    const [dashboard, setDashboard] = useState({})
    const [loading, setLoading] = useState(false)
    const [receptionist, setReceptionist] = useState(getStoredReceptionist)

    const fetchDashboard = async (currentRec = receptionist) => {
        try {
            setLoading(true)
            const brId = currentRec?.user_branch_id || currentRec?.branch_id || currentRec?.user_branchId || localStorage.getItem("rec_branch_id")
            const userId = currentRec?.user_id || currentRec?.id || localStorage.getItem("rec_user_id")
            
            const payload = {}
            if (brId) payload.br_id = brId
            if (userId) payload.user_id = userId

            const response = await API.post('firstloop/reception/dashboard', payload)
            if (response.data?.status == 1 || response.data?.status === "1" || response.data?.success) {
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
            console.error("Error fetching receptionist dashboard:", error)
            toast.error(
                error.response?.data?.message ||
                "Something went wrong"
            )
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        const stored = getStoredReceptionist()
        setReceptionist(stored)

        const token = localStorage.getItem("rec_access_token") || localStorage.getItem("receptionist_token") || localStorage.getItem("access_token")
        const rawData = localStorage.getItem("receptionist_data") || localStorage.getItem("rec_data")

        if (!token && !rawData) {
            toast.error("Please login to access Receptionist Dashboard")
            navigate('/receptionist/login', { replace: true })
            return
        }

        fetchDashboard(stored)
    }, [])

    const todayReports = Array.isArray(dashboard?.today_report) ? dashboard.today_report : []

    return (
        <div style={{ paddingBottom: 40 }}>
            {/* Header Banner */}
            <div className="flex-between mb-4" style={{ flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.45rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                        Receptionist Counter Dashboard
                    </h2>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span>Welcome back, <strong>{receptionist?.user_name || receptionist?.name || receptionist?.rep_name || dashboard?.name || "Receptionist"}</strong></span>
                        {(receptionist?.user_repId || receptionist?.repId) && (
                            <span className="badge" style={{ background: 'rgba(14, 136, 184, 0.12)', color: 'var(--firstloop-primary)', fontWeight: 800, padding: '3px 8px', borderRadius: 6, fontSize: '0.72rem' }}>
                                ID: {receptionist?.user_repId || receptionist?.repId}
                            </span>
                        )}
                        {(receptionist?.user_branch || receptionist?.branch_name || receptionist?.user_branch_name || dashboard?.branch_name) && (
                            <span
                                className="badge"
                                onClick={() => {
                                    const bId = receptionist?.user_branch_id || receptionist?.branch_id || dashboard?.branch_id || localStorage.getItem("rec_branch_id");
                                    if (bId) navigate(`/receptionist/view-fl-branch/${bId}`);
                                }}
                                style={{
                                    background: '#F1F5F9',
                                    color: '#64748B',
                                    fontWeight: 700,
                                    padding: '3px 8px',
                                    borderRadius: 6,
                                    fontSize: '0.72rem',
                                    cursor: (receptionist?.user_branch_id || receptionist?.branch_id || dashboard?.branch_id || localStorage.getItem("rec_branch_id")) ? 'pointer' : 'default'
                                }}
                                title="View Branch Profile"
                            >
                                <i className="fas fa-map-marker-alt" style={{ marginRight: 4, color: 'var(--firstloop-primary)' }} />
                                {receptionist?.user_branch || receptionist?.branch_name || receptionist?.user_branch_name || dashboard?.branch_name}
                            </span>
                        )}
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    <button
                        type="button"
                        className="btn btn-sm btn-light"
                        onClick={() => fetchDashboard(receptionist)}
                        disabled={loading}
                        style={{ padding: '9px 14px', borderRadius: 10, fontWeight: 700, fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                        title="Refresh Dashboard"
                    >
                        <i className={`fas fa-sync-alt ${loading ? 'fa-spin' : ''}`} style={{ color: 'var(--firstloop-primary)' }} />
                        <span className="d-none d-sm-inline">Refresh</span>
                    </button>

                    <button
                        type="button"
                        className="btn firstloop-btn-primary"
                        onClick={() => navigate('/receptionist/checkin?mode=qr')}
                        style={{ padding: '10px 18px', borderRadius: 12, fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 8 }}
                    >
                        <i className="fas fa-qrcode" style={{ fontSize: '1.1rem' }} />
                        <span>Scan QR Code</span>
                    </button>

                    <button
                        type="button"
                        className="btn firstloop-btn-secondary"
                        onClick={() => navigate('/receptionist/checkin?mode=phone')}
                        style={{ padding: '10px 18px', borderRadius: 12, fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 8 }}
                    >
                        <i className="fas fa-phone-alt" />
                        <span>Phone Search</span>
                    </button>
                </div>
            </div>

            {/* KEY STATISTICS OVERVIEW CARDS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 28 }}>
                {/* 1. Active Customers */}
                <div
                    className="card"
                    onClick={() => navigate('/receptionist/customers')}
                    style={{
                        borderRadius: 18,
                        padding: 22,
                        background: '#FFFFFF',
                        border: '1px solid rgba(14, 136, 184, 0.15)',
                        boxShadow: '0 8px 24px -4px rgba(14, 136, 184, 0.08)',
                        cursor: 'pointer',
                        transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            BRANCH CUSTOMERS
                        </span>
                        <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--firstloop-primary-light)', color: 'var(--firstloop-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 800 }}>
                            <i className="fas fa-users" />
                        </div>
                    </div>
                    <h3 style={{ fontSize: '2rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                        {loading ? <i className="fas fa-spinner fa-spin" style={{ fontSize: '1.4rem' }} /> : (dashboard?.total_cus ?? 0)}
                    </h3>
                    <div style={{ fontSize: '0.78rem', color: 'var(--firstloop-primary)', fontWeight: 700, marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span>View Customer List &rarr;</span>
                    </div>
                </div>

                {/* 2. Active Stamp Cards */}
                <div
                    className="card"
                    onClick={() => navigate('/receptionist/checkin?mode=phone')}
                    style={{
                        borderRadius: 18,
                        padding: 22,
                        background: '#FFFFFF',
                        border: '1px solid rgba(2, 132, 199, 0.15)',
                        boxShadow: '0 8px 24px -4px rgba(2, 132, 199, 0.08)',
                        cursor: 'pointer',
                        transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            STAMP CARDS
                        </span>
                        <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(2, 132, 199, 0.12)', color: '#0284C7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 800 }}>
                            <i className="fas fa-stamp" />
                        </div>
                    </div>
                    <h3 style={{ fontSize: '2rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                        {loading ? <i className="fas fa-spinner fa-spin" style={{ fontSize: '1.4rem' }} /> : (dashboard?.total_stamp_card ?? 0)}
                    </h3>
                    <div style={{ fontSize: '0.78rem', color: '#0284C7', fontWeight: 700, marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span>Issue / Check-In Stamps &rarr;</span>
                    </div>
                </div>

                {/* 3. Active Membership Cards */}
                <div
                    className="card"
                    onClick={() => navigate('/receptionist/checkin?mode=phone')}
                    style={{
                        borderRadius: 18,
                        padding: 22,
                        background: '#FFFFFF',
                        border: '1px solid rgba(245, 158, 11, 0.2)',
                        boxShadow: '0 8px 24px -4px rgba(245, 158, 11, 0.08)',
                        cursor: 'pointer',
                        transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            MEMBERSHIP CARDS
                        </span>
                        <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(245, 158, 11, 0.12)', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 800 }}>
                            <i className="fas fa-crown" />
                        </div>
                    </div>
                    <h3 style={{ fontSize: '2rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                        {loading ? <i className="fas fa-spinner fa-spin" style={{ fontSize: '1.4rem' }} /> : (dashboard?.total_membership_card ?? 0)}
                    </h3>
                    <div style={{ fontSize: '0.78rem', color: '#D97706', fontWeight: 700, marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span>VIP Member Check-In &rarr;</span>
                    </div>
                </div>
            </div>

            {/* QUICK ACTIONS BANNER */}
            <div
                className="card mb-4"
                style={{
                    padding: 24,
                    borderRadius: 20,
                    background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
                    color: '#FFFFFF'
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
                    <div>
                        <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#38BDF8', fontWeight: 800 }}>
                            CARD TERMINAL QUICK DESK
                        </span>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '4px 0 0 0', color: '#FFFFFF' }}>
                            Customer Card Check-In & Entry Terminal
                        </h3>
                        <p style={{ fontSize: '0.84rem', color: '#94A3B8', marginTop: 4, marginBottom: 0 }}>
                            Perform instant stamp pass updates, issue new cards, and log daily membership check-in entries.
                        </p>
                    </div>

                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        <button
                            type="button"
                            className="btn"
                            onClick={() => navigate('/receptionist/add-card-customer')}
                            style={{ padding: '10px 18px', borderRadius: 10, background: 'rgba(255, 255, 255, 0.15)', color: '#FFFFFF', fontWeight: 800, fontSize: '0.85rem', border: '1px solid rgba(255, 255, 255, 0.3)' }}
                        >
                            <i className="fas fa-plus-circle" style={{ marginRight: 6 }} /> Issue Card
                        </button>
                        <button
                            type="button"
                            className="btn"
                            onClick={() => navigate('/receptionist/checkin?mode=phone')}
                            style={{ padding: '10px 18px', borderRadius: 10, background: '#FFFFFF', color: '#0F172A', fontWeight: 800, fontSize: '0.85rem' }}
                        >
                            <i className="fas fa-search" style={{ marginRight: 6 }} /> Phone Search Entry
                        </button>
                        <button
                            type="button"
                            className="btn firstloop-btn-primary"
                            onClick={() => navigate('/receptionist/checkin?mode=qr')}
                            style={{ padding: '10px 18px', borderRadius: 10, fontWeight: 800, fontSize: '0.85rem' }}
                        >
                            <i className="fas fa-qrcode" style={{ marginRight: 6 }} /> Open QR Camera
                        </button>
                    </div>
                </div>
            </div>

            {/* TODAY'S CHECK-IN LOG ACTIVITY TABLE */}
            <div className="card" style={{ padding: 0, overflow: 'hidden', borderRadius: 18, border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                <div style={{ padding: '18px 22px', borderBottom: '1px solid #E2E8F0', background: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h4 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                            Today's Check-In & Payment Activity Log
                        </h4>
                        <small style={{ color: 'var(--text-muted)' }}>Real-time terminal updates logged by receptionist staff.</small>
                    </div>
                    <span style={{ fontSize: '0.78rem', background: 'rgba(16, 185, 129, 0.12)', color: '#059669', fontWeight: 800, padding: '4px 10px', borderRadius: 8 }}>
                        {todayReports.length} Check-Ins Today
                    </span>
                </div>

                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                            <tr>
                                <th style={{ padding: '12px 18px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Date & Time</th>
                                <th style={{ padding: '12px 18px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Customer Name</th>
                                <th style={{ padding: '12px 18px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Card Pass Issued</th>
                                <th style={{ padding: '12px 18px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Payment Method</th>
                                <th style={{ padding: '12px 18px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Amount</th>
                                <th style={{ padding: '12px 18px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {todayReports.length > 0 ? (
                                todayReports.map((log, index) => {
                                    const isStamp = log.card_type === 1 || String(log.card_type).toLowerCase() === 'stamp'
                                    const phoneFormatted = log.phone
                                        ? `${log.country_code ? `+${String(log.country_code).replace('+', '')} ` : ''}${log.phone}`
                                        : (log.email || '-')
                                    const amountFormatted = log.amount != null && log.amount !== ''
                                        ? `₹${parseFloat(log.amount).toFixed(2)}`
                                        : '₹0.00'

                                    return (
                                        <tr key={log.id || `report-${index}`}>
                                            <td style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>
                                                <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.84rem' }}>
                                                    {formatDate(log.time)}
                                                </div>
                                                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                                                    <i className="far fa-clock" style={{ fontSize: '0.7rem' }} />
                                                    <span>{formatTime(log.time)}</span>
                                                </div>
                                            </td>
                                            <td
                                                onClick={() => navigate('/receptionist/customers')}
                                                style={{ padding: '14px 18px', cursor: 'pointer' }}
                                                title="View in Customers List"
                                            >
                                                <strong style={{ fontSize: '0.88rem', color: 'var(--firstloop-primary)', display: 'block' }}>
                                                    {log.name || 'Customer'}
                                                </strong>
                                                <small style={{ color: 'var(--text-muted)' }}>{phoneFormatted}</small>
                                            </td>
                                            <td style={{ padding: '14px 18px' }}>
                                                {isStamp ? (
                                                    <span
                                                        className="badge"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            navigate('/receptionist/checkin?mode=phone')
                                                        }}
                                                        style={{ background: 'var(--firstloop-primary-light)', color: 'var(--firstloop-primary)', fontWeight: 700, padding: '6px 10px', borderRadius: 8, cursor: 'pointer' }}
                                                        title="Check-in or add stamp"
                                                    >
                                                        <i className="fas fa-stamp" style={{ marginRight: 4 }} />
                                                        {log.card_name || 'Stamp Card'}
                                                    </span>
                                                ) : (
                                                    <span
                                                        className="badge"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            navigate('/receptionist/checkin?mode=phone')
                                                        }}
                                                        style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#D97706', fontWeight: 700, padding: '6px 10px', borderRadius: 8, cursor: 'pointer' }}
                                                        title="Check-in member"
                                                    >
                                                        <i className="fas fa-crown" style={{ marginRight: 4 }} />
                                                        {log.card_name || 'VIP Membership'}
                                                    </span>
                                                )}
                                            </td>
                                            <td style={{ padding: '14px 18px', fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                                                {getPaymentLabel(log.payment_type)}
                                            </td>
                                            <td style={{ padding: '14px 18px', fontWeight: 800, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                                                {amountFormatted}
                                            </td>
                                            <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                                                <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#059669', fontWeight: 800, padding: '6px 12px', borderRadius: 8 }}>
                                                    <i className="fas fa-check-circle" style={{ marginRight: 4 }} />
                                                    {log.status || 'Completed'}
                                                </span>
                                            </td>
                                        </tr>
                                    )
                                })
                            ) : (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: '36px 20px', color: 'var(--text-muted)' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                                            <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', color: '#94A3B8' }}>
                                                <i className="fas fa-receipt" />
                                            </div>
                                            <strong style={{ fontSize: '0.95rem', color: '#475569' }}>No check-in activity logged today</strong>
                                            <span style={{ fontSize: '0.82rem', color: '#94A3B8' }}>New customer check-ins and payments will appear here in real-time.</span>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

