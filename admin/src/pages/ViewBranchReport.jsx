import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import API from '../api.js'

// --- Helpers ---
const apptStatusMap = {
    0: { label: 'Pending',  color: '#F59E0B', badge: 'pending' },
    1: { label: 'Approved', color: '#3B82F6', badge: 'active' },
    2: { label: 'Rejected', color: '#EF4444', badge: 'declined' },
}

const couponAppliedStatusMap = {
    0: { label: 'Pending',   color: '#F59E0B', badge: 'pending' },
    1: { label: 'Approved',  color: '#10B981', badge: 'active' },
    2: { label: 'Cancelled', color: '#EF4444', badge: 'pending' },
}

function formatDateDisplay(str) {
    if (!str) return '-'
    const date = new Date(str)
    if (isNaN(date.getTime())) return str
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    })
}

function formatTimeDisplay(value) {
    if (!value) return '-'
    const parts = String(value).split(':')
    if (parts.length < 2) return value
    const hour = parseInt(parts[0], 10)
    const minute = parts[1]
    const period = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minute} ${period}`
}

// ----- SVG Donut Chart Component -----
function DonutChart({ segments = [], size = 120, centerLabel = "Total" }) {
    const validSegments = segments.filter(s => s.value > 0)

    if (!validSegments.length) {
        return (
            <div style={{
                width: size, height: size, borderRadius: '50%',
                background: 'var(--bg-primary)', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                border: '3px solid rgba(0,0,0,0.06)'
            }}>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>No data</span>
            </div>
        )
    }

    const total = validSegments.reduce((s, d) => s + d.value, 0) || 1
    const R = size / 2
    const r = R * 0.58
    const cx = R, cy = R
    let cumAngle = -Math.PI / 2

    const arcs = validSegments.map(seg => {
        const angle = (seg.value / total) * 2 * Math.PI
        const renderingAngle = angle > 2 * Math.PI - 0.001 ? 2 * Math.PI - 0.001 : angle
        const x1 = cx + R * Math.cos(cumAngle), y1 = cy + R * Math.sin(cumAngle)
        cumAngle += renderingAngle
        const x2 = cx + R * Math.cos(cumAngle), y2 = cy + R * Math.sin(cumAngle)
        const largeArc = renderingAngle > Math.PI ? 1 : 0
        const ix1 = cx + r * Math.cos(cumAngle - renderingAngle), iy1 = cy + r * Math.sin(cumAngle - renderingAngle)
        const ix2 = cx + r * Math.cos(cumAngle), iy2 = cy + r * Math.sin(cumAngle)
        return {
            ...seg,
            path: `M ${x1} ${y1} A ${R} ${R} 0 ${largeArc} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${r} ${r} 0 ${largeArc} 0 ${ix1} ${iy1} Z`,
        }
    })

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible' }}>
            {arcs.map((a, i) => (
                <path
                    key={i} d={a.path}
                    fill={a.color}
                    stroke="var(--bg-surface)"
                    strokeWidth={2}
                >
                    <title>{a.label}: {a.value}</title>
                </path>
            ))}
            <circle cx={cx} cy={cy} r={r} fill="var(--bg-surface)" />
            <text x={cx} y={cy - 4} textAnchor="middle" fontSize="13" fontWeight="800" fill="var(--text-primary)">{total}</text>
            <text x={cx} y={cy + 8} textAnchor="middle" fontSize="7" fill="var(--text-muted)" fontWeight="700" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>{centerLabel}</text>
        </svg>
    )
}

export default function ViewBranchReport() {
    const { id } = useParams()
    const navigate = useNavigate()

    const [data, setData] = useState(null)
    const [branchDetails, setBranchDetails] = useState(null)
    const [loading, setLoading] = useState(true)
    const [fromDate, setFromDate] = useState('')
    const [toDate, setToDate] = useState('')

    const [apptSearch, setApptSearch] = useState('')
    const [couponSearch, setCouponSearch] = useState('')
    const [appliedSearch, setAppliedSearch] = useState('')

    const [activeListTab, setActiveListTab] = useState('appointments')

    const [apptPage, setApptPage] = useState(1)
    const [couponPage, setCouponPage] = useState(1)
    const [appliedPage, setAppliedPage] = useState(1)

    useEffect(() => { setApptPage(1) }, [apptSearch])
    useEffect(() => { setCouponPage(1) }, [couponSearch])
    useEffect(() => { setAppliedPage(1) }, [appliedSearch])

    const fetchBranchInfo = useCallback(async () => {
        try {
            const response = await API.get(`admin/branch/id/${encodeURIComponent(id)}`)
            if (response.data && response.data.status === 1) {
                setBranchDetails(response.data.data || null)
            }
        } catch (err) {
            console.error('Error fetching branch info:', err)
        }
    }, [id])

    const fetchReport = useCallback(async () => {
        setLoading(true)
        try {
            const params = {}
            if (fromDate) params.fromdate = fromDate
            if (toDate) params.end_date = toDate
            const res = await API.get(`admin/branch/reports/${id}`, { params })
            setData(res.data?.status === 1 ? res.data : null)
        } catch (err) {
            console.error('Error fetching branch report:', err)
            setData(null)
        } finally {
            setLoading(false)
        }
    }, [id, fromDate, toDate])

    useEffect(() => {
        fetchBranchInfo()
        fetchReport()
    }, [fetchBranchInfo, fetchReport])

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: 16 }}>
                <div style={{ width: 48, height: 48, border: '4px solid var(--primary-light)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <p style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Loading branch report...</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        )
    }

    if (!data) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: 12 }}>
                <i className="fas fa-exclamation-circle" style={{ fontSize: '3rem', color: 'var(--text-muted)' }} />
                <p style={{ color: 'var(--text-muted)', fontSize: '1rem', fontWeight: 500 }}>No report data found.</p>
                <button className="btn btn-secondary" onClick={() => navigate(-1)}>
                    <i className="fas fa-arrow-left" /> Go Back
                </button>
            </div>
        )
    }

    const { report = {}, lists = {} } = data

    // --- Derived Summary Cards ---
    const summaryCards = [
        { title: 'Pending Appointments',  value: report.pending_appointment,  icon: 'fa-hourglass-start', gradient: 'bg-gradient-orange' },
        { title: 'Approved Appointments', value: report.approved_appointment, icon: 'fa-calendar-check',    gradient: 'bg-gradient-blue' },
        { title: 'Rejected Appointments', value: report.rejected_appointment, icon: 'fa-calendar-times',    gradient: 'bg-gradient-pink' },
        { title: 'Total Coupons Offered', value: report.total_coupon,         icon: 'fa-ticket-alt',        gradient: 'bg-gradient-purple' },
        { title: 'Active Coupons',        value: report.active_coupon,        icon: 'fa-badge-percent',     gradient: 'bg-gradient-teal' },
        { title: 'Expired Coupons',       value: report.expired_coupon,       icon: 'fa-clock',             gradient: 'bg-gradient-pink' },
        { title: 'Applied Coupons',       value: report.applied_coupon,       icon: 'fa-check-double',      gradient: 'bg-gradient-orange' }
    ]

    const apptBreakdown = [
        { label: 'Pending',  value: report.pending_appointment,  color: '#F59E0B' },
        { label: 'Approved', value: report.approved_appointment, color: '#3B82F6' },
        { label: 'Rejected', value: report.rejected_appointment, color: '#EF4444' }
    ]

    const couponBreakdown = [
        { label: 'Active',  value: report.active_coupon,  color: '#10B981' },
        { label: 'Expired', value: report.expired_coupon, color: '#EF4444' },
        { label: 'Applied', value: report.applied_coupon, color: '#8E2DE2' }
    ]

    const totalAppts = report.pending_appointment + report.approved_appointment + report.rejected_appointment
    const totalCoupons = report.total_coupon

    // --- Filters ---
    const filteredAppts = (lists.appointments || []).filter(a =>
        String(a.id).includes(apptSearch) ||
        String(a.cus_id || '').includes(apptSearch) ||
        String(a.br_id || '').includes(apptSearch)
    )

    const filteredCoupons = (lists.coupons || []).filter(c =>
        (c.code || '').toLowerCase().includes(couponSearch.toLowerCase()) ||
        String(c.id).includes(couponSearch)
    )

    const filteredAppliedCoupons = (lists.applied_coupons || []).filter(ac =>
        (ac.coupon_code || '').toLowerCase().includes(appliedSearch.toLowerCase()) ||
        String(ac.cus_id || '').includes(appliedSearch)
    )

    const ITEMS_PER_PAGE = 10

    // Appointments pagination
    const totalApptPages = Math.max(1, Math.ceil(filteredAppts.length / ITEMS_PER_PAGE))
    const safeApptPage = Math.min(apptPage, totalApptPages)
    const apptStartIndex = (safeApptPage - 1) * ITEMS_PER_PAGE
    const paginatedAppts = filteredAppts.slice(apptStartIndex, apptStartIndex + ITEMS_PER_PAGE)

    // Coupons pagination
    const totalCouponPages = Math.max(1, Math.ceil(filteredCoupons.length / ITEMS_PER_PAGE))
    const safeCouponPage = Math.min(couponPage, totalCouponPages)
    const couponStartIndex = (safeCouponPage - 1) * ITEMS_PER_PAGE
    const paginatedCoupons = filteredCoupons.slice(couponStartIndex, couponStartIndex + ITEMS_PER_PAGE)

    // Applied coupons pagination
    const totalAppliedPages = Math.max(1, Math.ceil(filteredAppliedCoupons.length / ITEMS_PER_PAGE))
    const safeAppliedPage = Math.min(appliedPage, totalAppliedPages)
    const appliedStartIndex = (safeAppliedPage - 1) * ITEMS_PER_PAGE
    const paginatedApplied = filteredAppliedCoupons.slice(appliedStartIndex, appliedStartIndex + ITEMS_PER_PAGE)

    return (
        <div style={{ padding: '4px 0' }}>
            {/* ── Page Header ── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <button className="btn btn-secondary" style={{ height: 38, padding: '0 14px' }} onClick={() => navigate(-1)}>
                        <i className="fas fa-arrow-left" />
                    </button>
                    <div>
                        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.45rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                            Branch Performance Report
                        </h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: 2 }}>
                            Detailed analytics for branch: <strong style={{ color: 'var(--primary)' }}>{branchDetails?.branch_name || `Branch #${id}`}</strong>
                        </p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    <div>
                        <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.4px' }}>From</label>
                        <input type="date" className="form-control" style={{ height: 38, padding: '6px 12px', minWidth: 150 }}
                            value={fromDate} onChange={e => setFromDate(e.target.value)} />
                    </div>
                    <div>
                        <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.4px' }}>To</label>
                        <input type="date" className="form-control" style={{ height: 38, padding: '6px 12px', minWidth: 150 }}
                            value={toDate} onChange={e => setToDate(e.target.value)} />
                    </div>
                    {(fromDate || toDate) && (
                        <button className="btn btn-secondary" style={{ height: 38 }} onClick={() => { setFromDate(''); setToDate('') }}>
                            <i className="fas fa-times" /> Clear
                        </button>
                    )}
                </div>
            </div>

            {/* ── Summary Stats Grid ── */}
            <div className="reports-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
                {summaryCards.map((card, i) => (
                    <div key={i} className={`card stat-card ${card.gradient}`} style={{ padding: '20px 16px', position: 'relative', overflow: 'hidden' }}>
                        <i className={`fas ${card.icon} stat-bg-icon`} style={{ position: 'absolute', right: '-8px', bottom: '-8px', fontSize: '4.5rem', opacity: 0.1, color: '#fff' }} />
                        <span className="stat-title" style={{ fontSize: '0.72rem', fontWeight: 600, color: 'rgba(255,255,255,0.78)', textTransform: 'uppercase', display: 'block' }}>{card.title}</span>
                        <h3 className="stat-value" style={{ fontSize: '1.8rem', fontWeight: 700, color: '#fff', marginTop: 8, marginBottom: 0 }}>{card.value}</h3>
                    </div>
                ))}
            </div>

            {/* ── Breakdown Visualizer Row ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, marginBottom: 24 }}>
                {/* Appointment Breakdown */}
                <div className="card" style={{ padding: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                        <div>
                            <h3 className="card-title" style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>Appointment Status Breakdown</h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.76rem', margin: '4px 0 0' }}>Distribution of booked slots</p>
                        </div>
                        <DonutChart size={90} segments={apptBreakdown} centerLabel="Appts" />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {apptBreakdown.map((item) => (
                            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                                <span style={{ flex: 1, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{item.label}</span>
                                <div style={{ flex: 2, background: 'var(--bg-primary)', borderRadius: 6, height: 6, overflow: 'hidden' }}>
                                    <div style={{
                                        width: `${totalAppts > 0 ? (item.value / totalAppts * 100) : 0}%`,
                                        height: '100%', background: item.color, borderRadius: 6
                                    }} />
                                </div>
                                <span style={{ width: 30, textAlign: 'right', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>{item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Coupon Breakdown */}
                <div className="card" style={{ padding: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                        <div>
                            <h3 className="card-title" style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>Coupon Claim Breakdown</h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.76rem', margin: '4px 0 0' }}>Campaign execution metrics</p>
                        </div>
                        <DonutChart size={90} segments={couponBreakdown} centerLabel="Coupons" />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {couponBreakdown.map((item) => (
                            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                                <span style={{ flex: 1, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{item.label}</span>
                                <div style={{ flex: 2, background: 'var(--bg-primary)', borderRadius: 6, height: 6, overflow: 'hidden' }}>
                                    <div style={{
                                        width: `${totalCoupons > 0 ? (item.value / totalCoupons * 100) : 0}%`,
                                        height: '100%', background: item.color, borderRadius: 6
                                    }} />
                                </div>
                                <span style={{ width: 30, textAlign: 'right', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>{item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Detailed Lists Tabs ── */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-hover)', padding: '0 16px', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                        {[
                            { key: 'appointments', label: 'Appointments', count: lists.appointments?.length || 0 },
                            { key: 'coupons',      label: 'Coupons Created', count: lists.coupons?.length || 0 },
                            { key: 'applied',      label: 'Applied Coupons', count: lists.applied_coupons?.length || 0 }
                        ].map(t => (
                            <button
                                key={t.key}
                                onClick={() => setActiveListTab(t.key)}
                                style={{
                                    padding: '16px 20px',
                                    border: 'none',
                                    background: 'none',
                                    borderBottom: activeListTab === t.key ? '3px solid var(--primary)' : '3px solid transparent',
                                    color: activeListTab === t.key ? 'var(--primary)' : 'var(--text-secondary)',
                                    fontWeight: activeListTab === t.key ? 700 : 500,
                                    fontSize: '0.88rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    transition: 'all 0.15s ease'
                                }}
                            >
                                {t.label}
                                <span style={{
                                    fontSize: '0.72rem',
                                    padding: '2px 6px',
                                    borderRadius: 10,
                                    background: activeListTab === t.key ? 'var(--primary-light)' : 'var(--bg-primary)',
                                    color: activeListTab === t.key ? 'var(--primary)' : 'var(--text-muted)',
                                    fontWeight: 700
                                }}>
                                    {t.count}
                                </span>
                            </button>
                        ))}
                    </div>

                    <div style={{ padding: '8px 0', minWidth: 220 }}>
                        <div className="form-group-classic" style={{ margin: 0 }}>
                            <input
                                type="text"
                                className="form-control"
                                style={{ height: 36, fontSize: '0.82rem', padding: '6px 12px' }}
                                placeholder={
                                    activeListTab === 'appointments' ? 'Search by Client/Branch...' :
                                    activeListTab === 'coupons' ? 'Search by Coupon Code...' :
                                    'Search Coupon Code / Client...'
                                }
                                value={
                                    activeListTab === 'appointments' ? apptSearch :
                                    activeListTab === 'coupons' ? couponSearch :
                                    appliedSearch
                                }
                                onChange={e => {
                                    if (activeListTab === 'appointments') setApptSearch(e.target.value)
                                    else if (activeListTab === 'coupons') setCouponSearch(e.target.value)
                                    else setAppliedSearch(e.target.value)
                                }}
                            />
                        </div>
                    </div>
                </div>

                <div style={{ padding: 20 }}>
                    {/* Appointments Tab Content */}
                    {activeListTab === 'appointments' && (
                        <div className="table-wrapper">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Customer ID</th>
                                        <th>Branch ID</th>
                                        <th>Branch Name</th>
                                        <th>Date</th>
                                        <th>Time Slot</th>
                                        <th>Status</th>
                                        <th>Approved By</th>
                                        <th>Cancelled By</th>
                                        <th>Reason</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedAppts.length ? paginatedAppts.map((appt) => {
                                        const status = apptStatusMap[Number(appt.status)] || { label: 'Unknown', color: '#94A3B8', badge: 'pending' }
                                        return (
                                            <tr key={appt.id}>
                                                <td><strong>#{appt.id}</strong></td>
                                                <td>{appt.cus_id || '-'}</td>
                                                <td>{appt.br_id || '-'}</td>
                                                <td>{appt.br_name || '-'}</td>
                                                <td>{formatDateDisplay(appt.appointment_date)}</td>
                                                <td>{formatTimeDisplay(appt.slot)}</td>
                                                <td>
                                                    <span className={`badge ${status.badge}`}>
                                                        {status.label}
                                                    </span>
                                                </td>
                                                <td>{appt.approved_by || '-'}</td>
                                                <td>{appt.cancel_by || '-'}</td>
                                                <td>{appt.cancel_reason || '-'}</td>
                                            </tr>
                                        )
                                    }) : (
                                        <tr>
                                            <td colSpan={10} style={{ textAlign: 'center', padding: '36px 0', color: 'var(--text-muted)' }}>
                                                <i className="fas fa-calendar-times" style={{ fontSize: '1.8rem', display: 'block', marginBottom: 8, opacity: 0.6 }} />
                                                No appointments found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>

                            {filteredAppts.length > ITEMS_PER_PAGE && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 }}>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                        Showing {apptStartIndex + 1}-{Math.min(apptStartIndex + ITEMS_PER_PAGE, filteredAppts.length)} of {filteredAppts.length} entries
                                    </span>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <button className="btn btn-secondary" style={{ height: 32, padding: '0 10px', fontSize: '0.76rem' }}
                                            disabled={safeApptPage === 1} onClick={() => setApptPage(safeApptPage - 1)}>Prev</button>
                                        <button className="btn btn-secondary" style={{ height: 32, padding: '0 10px', fontSize: '0.76rem' }}
                                            disabled={safeApptPage === totalApptPages} onClick={() => setApptPage(safeApptPage + 1)}>Next</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Coupons Tab Content */}
                    {activeListTab === 'coupons' && (
                        <div className="table-wrapper">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Code</th>
                                        <th>Min Amount</th>
                                        <th>Start Date</th>
                                        <th>End Date</th>
                                        <th>Redemptions/Limit</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedCoupons.length ? paginatedCoupons.map((coupon) => (
                                        <tr key={coupon.id}>
                                            <td><strong>#{coupon.id}</strong></td>
                                            <td><span style={{ fontFamily: 'monospace', background: 'var(--bg-hover)', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>{coupon.code}</span></td>
                                            <td>₹{coupon.min_amount}</td>
                                            <td>{formatDateDisplay(coupon.start_date)}</td>
                                            <td>{formatDateDisplay(coupon.end_date)}</td>
                                            <td>{coupon.usage_limit === 0 ? 'Unlimited' : coupon.usage_limit}</td>
                                            <td>
                                                <span className={`badge ${coupon.is_expired === 1 ? 'pending' : 'active'}`}>
                                                    {coupon.is_expired === 1 ? 'Expired' : 'Active'}
                                                </span>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={7} style={{ textAlign: 'center', padding: '36px 0', color: 'var(--text-muted)' }}>
                                                <i className="fas fa-ticket-alt" style={{ fontSize: '1.8rem', display: 'block', marginBottom: 8, opacity: 0.6 }} />
                                                No coupons found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>

                            {filteredCoupons.length > ITEMS_PER_PAGE && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 }}>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                        Showing {couponStartIndex + 1}-{Math.min(couponStartIndex + ITEMS_PER_PAGE, filteredCoupons.length)} of {filteredCoupons.length} entries
                                    </span>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <button className="btn btn-secondary" style={{ height: 32, padding: '0 10px', fontSize: '0.76rem' }}
                                            disabled={safeCouponPage === 1} onClick={() => setCouponPage(safeCouponPage - 1)}>Prev</button>
                                        <button className="btn btn-secondary" style={{ height: 32, padding: '0 10px', fontSize: '0.76rem' }}
                                            disabled={safeCouponPage === totalCouponPages} onClick={() => setCouponPage(safeCouponPage + 1)}>Next</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Applied Coupons Tab Content */}
                    {activeListTab === 'applied' && (
                        <div className="table-wrapper">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Customer ID</th>
                                        <th>Coupon Code</th>
                                        <th>Used At</th>
                                        <th>Approved By</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedApplied.length ? paginatedApplied.map((applied) => {
                                        const status = couponAppliedStatusMap[Number(applied.status)] || { label: 'Unknown', color: '#94A3B8', badge: 'pending' }
                                        return (
                                            <tr key={applied.id}>
                                                <td><strong>#{applied.id}</strong></td>
                                                <td>{applied.cus_id || '-'}</td>
                                                <td><span style={{ fontFamily: 'monospace', background: 'var(--bg-hover)', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>{applied.coupon_code}</span></td>
                                                <td>{formatDateDisplay(applied.used_at)}</td>
                                                <td>{applied.approved_by || '-'}</td>
                                                <td>
                                                    <span className={`badge ${status.badge}`}>
                                                        {status.label}
                                                    </span>
                                                </td>
                                            </tr>
                                        )
                                    }) : (
                                        <tr>
                                            <td colSpan={6} style={{ textAlign: 'center', padding: '36px 0', color: 'var(--text-muted)' }}>
                                                <i className="fas fa-check-double" style={{ fontSize: '1.8rem', display: 'block', marginBottom: 8, opacity: 0.6 }} />
                                                No applied coupons found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>

                            {filteredAppliedCoupons.length > ITEMS_PER_PAGE && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 }}>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                        Showing {appliedStartIndex + 1}-{Math.min(appliedStartIndex + ITEMS_PER_PAGE, filteredAppliedCoupons.length)} of {filteredAppliedCoupons.length} entries
                                    </span>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <button className="btn btn-secondary" style={{ height: 32, padding: '0 10px', fontSize: '0.76rem' }}
                                            disabled={safeAppliedPage === 1} onClick={() => setAppliedPage(safeAppliedPage - 1)}>Prev</button>
                                        <button className="btn btn-secondary" style={{ height: 32, padding: '0 10px', fontSize: '0.76rem' }}
                                            disabled={safeAppliedPage === totalAppliedPages} onClick={() => setAppliedPage(safeAppliedPage + 1)}>Next</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
