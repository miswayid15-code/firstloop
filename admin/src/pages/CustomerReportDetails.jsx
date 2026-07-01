import { useEffect, useState, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import API from '../api.js'

// --- Helpers ---
const apptStatusMap = {
    0: { label: 'Pending',   color: '#F59E0B', bg: '#FEF3C7' },
    1: { label: 'Approved',  color: '#3B82F6', bg: '#DBEAFE' },
    2: { label: 'Completed', color: '#10B981', bg: '#D1FAE5' },
    3: { label: 'Cancelled', color: '#EF4444', bg: '#FEE2E2' },
    4: { label: 'Rejected',  color: '#EF4444', bg: '#FEE2E2' },
}

const couponStatusMap = {
    0: { label: 'Pending',  color: '#F59E0B', bg: '#FEF3C7' },
    1: { label: 'Redeemed', color: '#10B981', bg: '#D1FAE5' },
}

function formatDateDisplay(str) {
    if (!str) return '-'
    return new Date(str).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function getPageWindow(current, total) {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
    if (current <= 4) return [1, 2, 3, 4, 5, '...', total]
    if (current >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total]
    return [1, '...', current - 1, current, current + 1, '...', total]
}

// ----- SVG Multi-Line Chart -----
function SvgMultiLineChart({ series = [] }) {
    const [tooltip, setTooltip] = useState(null)
    const allDates = [...new Set(series.flatMap(s => s.data.map(d => d.date)))].sort()

    if (!allDates.length) {
        return (
            <div style={{ height: 130, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                No data in selected range
            </div>
        )
    }

    const W = 600, H = 160, PAD = 24
    const seriesPoints = series.map(s => {
        const map = Object.fromEntries(s.data.map(d => [d.date, d.count]))
        return allDates.map(date => map[date] ?? 0)
    })
    const maxVal = Math.max(...seriesPoints.flat(), 1)
    const xStep = allDates.length > 1 ? (W - PAD * 2) / (allDates.length - 1) : 0
    const getX = (i) => {
        if (allDates.length === 1) return W / 2
        return PAD + i * xStep
    }
    const yScale = v => PAD + ((maxVal - v) / maxVal) * (H - PAD * 2)

    return (
        <div style={{ position: 'relative' }}>
            <div style={{ position: 'relative', width: '100%', height: 130 }}>
                <svg
                    viewBox={`0 0 ${W} ${H}`}
                    preserveAspectRatio="none"
                    style={{ width: '100%', height: '100%', display: 'block' }}
                    onMouseLeave={() => setTooltip(null)}
                >
                    {[0.25, 0.5, 0.75, 1].map(r => (
                        <line key={r} x1={PAD} y1={PAD + r * (H - PAD * 2)} x2={W - PAD} y2={PAD + r * (H - PAD * 2)}
                            stroke="rgba(0,0,0,0.04)" strokeWidth="1" />
                    ))}
                    {series.map((s, si) => {
                        const pts = seriesPoints[si].map((count, i) => ({
                            x: getX(i), y: yScale(count), count, date: allDates[i]
                        }))
                        const linePath = pts.length > 1
                            ? pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
                            : ''
                        const areaPath = pts.length > 1
                            ? `${linePath} L ${pts[pts.length - 1].x} ${H} L ${pts[0].x} ${H} Z`
                            : ''
                        return (
                            <g key={si}>
                                {areaPath && <path d={areaPath} fill={s.color} fillOpacity={0.12} />}
                                {linePath && <path d={linePath} fill="none" stroke={s.color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />}
                                {pts.length === 1 && (
                                    <line
                                        x1={pts[0].x} y1={H - PAD}
                                        x2={pts[0].x} y2={pts[0].y}
                                        stroke={s.color} strokeWidth="1.5" strokeDasharray="3,3"
                                    />
                                )}
                                {pts.map((p, i) => (
                                    <circle
                                        key={i}
                                        cx={p.x} cy={p.y} r={4}
                                        fill={s.color} stroke="#fff" strokeWidth="1.5"
                                        style={{ cursor: 'pointer' }}
                                        onMouseEnter={() => setTooltip({ x: p.x, y: p.y, date: p.date, count: p.count, label: s.label, color: s.color })}
                                    />
                                ))}
                            </g>
                        )
                    })}
                </svg>

                {/* Tooltip */}
                {tooltip && (
                    <div style={{
                        position: 'absolute',
                        left: `${(tooltip.x / W) * 100}%`,
                        top: `${(tooltip.y / H) * 100}%`,
                        transform: 'translate(-50%, -115%)',
                        background: 'rgba(30, 30, 40, 0.95)',
                        color: '#fff',
                        padding: '6px 10px',
                        borderRadius: '8px',
                        fontSize: '0.72rem',
                        pointerEvents: 'none',
                        whiteSpace: 'nowrap',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.18)',
                        zIndex: 10,
                        textAlign: 'center',
                        border: '1px solid rgba(255,255,255,0.08)',
                        fontFamily: 'inherit',
                        transition: 'left 0.1s ease, top 0.1s ease'
                    }}>
                        <div style={{ fontWeight: 600, fontSize: '0.65rem', color: 'rgba(255,255,255,0.6)', marginBottom: 2 }}>
                            {tooltip.label}
                        </div>
                        <div style={{ fontWeight: 700, color: tooltip.color }}>
                            {tooltip.date}: {tooltip.count}
                        </div>
                    </div>
                )}
            </div>
            <div style={{ display: 'flex', justifyContent: allDates.length > 1 ? 'space-between' : 'center', padding: '4px 4px 0 4px' }}>
                {allDates.map((d, i) => {
                    const labelInterval = Math.max(1, Math.ceil(allDates.length / 7))
                    const showLabel = i === 0 || i === allDates.length - 1 || i % labelInterval === 0
                    return (
                        <span key={i} style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 500, visibility: showLabel ? 'visible' : 'hidden' }}>
                            {d.slice(5)}
                        </span>
                    )
                })}
            </div>
        </div>
    )
}

// ----- SVG Donut Chart -----
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
            path: `M ${x1} ${y1} A ${R} ${R} 0 ${largeArc} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${r} ${r} 0 ${largeArc} 0 ${ix1} ${iy1} Z`
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
                    style={{ transition: 'all 0.2s ease' }}
                >
                    <title>{a.label}: {a.value}</title>
                </path>
            ))}
            <text x={cx} y={cy - 4} textAnchor="middle" fontSize="14" fontWeight="800" fill="var(--text-primary)">{total}</text>
            <text x={cx} y={cy + 10} textAnchor="middle" fontSize="7.5" fill="var(--text-muted)" fontWeight="750" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>{centerLabel}</text>
        </svg>
    )
}

export default function CustomerReportDetails() {
    const { id } = useParams()
    const navigate = useNavigate()

    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [fromDate, setFromDate] = useState('')
    const [toDate, setToDate] = useState('')
    const [apptSearch, setApptSearch] = useState('')
    const [couponSearch, setCouponSearch] = useState('')
    const [activeListTab, setActiveListTab] = useState('appointments')

    const [apptPage, setApptPage] = useState(1)
    const [couponPage, setCouponPage] = useState(1)
    const ITEMS_PER_PAGE = 10

    const fetchDetails = useCallback(async () => {
        setLoading(true)
        try {
            const params = {}
            if (fromDate) params.from_date = fromDate
            if (toDate) params.to_date = toDate

            const response = await API.get(`admin/customer-details-report/${id}`, { params })
            if (response.data?.status === 1) {
                setData(response.data.data)
            } else {
                setData(null)
            }
        } catch (error) {
            console.error("Error fetching customer report details:", error)
            setData(null)
        } finally {
            setLoading(false)
        }
    }, [id, fromDate, toDate])

    useEffect(() => {
        fetchDetails()
    }, [fetchDetails])

    const handleClearFilters = () => {
        setFromDate('')
        setToDate('')
    }

    // Filters for lists
    const filteredAppts = useMemo(() => {
        if (!data?.lists?.appointments) return []
        return data.lists.appointments.filter(appt => 
            (appt.br_name || '').toLowerCase().includes(apptSearch.toLowerCase()) ||
            (appt.slot || '').toLowerCase().includes(apptSearch.toLowerCase()) ||
            (appt.id || '').toString().includes(apptSearch)
        )
    }, [data, apptSearch])

    const filteredCoupons = useMemo(() => {
        if (!data?.lists?.coupon_applied) return []
        return data.lists.coupon_applied.filter(c => 
            (c.coupon_code || '').toLowerCase().includes(couponSearch.toLowerCase()) ||
            (c.Branch?.name || '').toLowerCase().includes(couponSearch.toLowerCase()) ||
            (c.id || '').toString().includes(couponSearch)
        )
    }, [data, couponSearch])

    // Paginated subsets
    const totalApptPages = Math.ceil(filteredAppts.length / ITEMS_PER_PAGE)
    const safeApptPage = Math.max(1, Math.min(apptPage, totalApptPages))
    const paginatedAppts = useMemo(() => {
        const start = (safeApptPage - 1) * ITEMS_PER_PAGE
        return filteredAppts.slice(start, start + ITEMS_PER_PAGE)
    }, [filteredAppts, safeApptPage])

    const totalCouponPages = Math.ceil(filteredCoupons.length / ITEMS_PER_PAGE)
    const safeCouponPage = Math.max(1, Math.min(couponPage, totalCouponPages))
    const paginatedCoupons = useMemo(() => {
        const start = (safeCouponPage - 1) * ITEMS_PER_PAGE
        return filteredCoupons.slice(start, start + ITEMS_PER_PAGE)
    }, [filteredCoupons, safeCouponPage])

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px', flexDirection: 'column', gap: 16 }}>
                <i className="fas fa-spinner fa-spin" style={{ fontSize: '2.5rem', color: 'var(--primary)' }} />
                <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-muted)' }}>Loading analytics report...</span>
            </div>
        )
    }

    if (!data) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px', flexDirection: 'column', gap: 16 }}>
                <i className="fas fa-exclamation-triangle" style={{ fontSize: '2.5rem', color: 'var(--text-muted)' }} />
                <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-muted)' }}>No report data found.</span>
                <button className="btn btn-primary" onClick={() => navigate('/customer-reports')}>Go Back</button>
            </div>
        )
    }

    // Prep charts data
    const apptBreakdown = [
        { label: 'Completed', value: data.completed_appointments || 0, color: '#10B981' },
        { label: 'Pending',    value: data.pending_appointments || 0,    color: '#F59E0B' },
        { label: 'Approved',   value: data.approved_appointments || 0,   color: '#3B82F6' },
        { label: 'Cancelled',  value: (data.cancelled_appointments || 0) + (data.rejected_appointments || 0), color: '#EF4444' },
    ]

    const couponBreakdown = [
        { label: 'Redeemed', value: data.approved_coupon || 0,  color: '#10B981' },
        { label: 'Pending',  value: data.pending_coupon || 0,   color: '#F59E0B' },
        { label: 'Rejected', value: data.rejected_coupon || 0,  color: '#EF4444' },
    ]

    const apptSeries = [
        {
            label: 'Appointments',
            color: '#36D1DC',
            data: data.graphs?.appointments_per_day || []
        }
    ]

    const couponSeries = [
        {
            label: 'Coupons Redeemed',
            color: '#FF4D80',
            data: data.graphs?.coupon_applied_per_day || []
        }
    ]

    const summaryCards = [
        { title: 'Appointments Booked', value: data.total_appointments, icon: 'fa-calendar-alt', gradient: 'bg-gradient-pink' },
        { title: 'Coupons Redeemed', value: data.total_coupon_applied, icon: 'fa-ticket-alt', gradient: 'bg-gradient-purple' },
        { title: 'Completed Visits', value: data.completed_appointments, icon: 'fa-check-circle', gradient: 'bg-gradient-blue' },
        { title: 'Unused Coupons', value: data.pending_coupon, icon: 'fa-history', gradient: 'bg-gradient-orange' }
    ]

    const apptStartCount = (safeApptPage - 1) * ITEMS_PER_PAGE + 1
    const apptEndCount = Math.min(safeApptPage * ITEMS_PER_PAGE, filteredAppts.length)
    const couponStartCount = (safeCouponPage - 1) * ITEMS_PER_PAGE + 1
    const couponEndCount = Math.min(safeCouponPage * ITEMS_PER_PAGE, filteredCoupons.length)

    return (
        <div style={{ padding: '4px 0' }}>
            {/* ── Page Header ── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <button className="btn btn-secondary" style={{ height: 38, padding: '0 14px' }} onClick={() => navigate('/customer-reports')}>
                        <i className="fas fa-arrow-left" />
                    </button>
                    <div>
                        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.45rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                            Customer Analytics Report
                        </h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: 2 }}>
                            Detailed activity logs and engagement stats for <strong style={{ color: 'var(--primary)' }}>{data.customer_name}</strong>
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
                        <button className="btn btn-secondary" style={{ height: 38 }} onClick={handleClearFilters}>
                            <i className="fas fa-times" /> Clear
                        </button>
                    )}
                </div>
            </div>

            {/* ── Customer Identity Card ── */}
            <div className="card" style={{ marginBottom: 24, background: 'linear-gradient(135deg, rgba(91,134,229,0.05) 0%, rgba(54,209,220,0.04) 100%)', borderColor: 'rgba(54,209,220,0.12)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                    <div style={{
                        width: 72, height: 72, borderRadius: 20, flexShrink: 0,
                        background: 'var(--gradient-primary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.8rem', fontWeight: 700, color: '#fff',
                        boxShadow: '0 12px 28px rgba(91,134,229,0.28)'
                    }}>
                        {(data.customer_name || 'C')[0].toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                                {data.customer_name}
                            </h3>
                            <span className={`badge ${data.status == 1 ? 'approved' : 'declined'}`} style={{ fontSize: '0.72rem' }}>
                                {data.status == 1 ? 'Active' : 'Disabled'}
                            </span>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: 4 }}>
                            <i className="fas fa-envelope" style={{ color: 'var(--primary)', marginRight: 6 }} />
                            Email: <strong>{data.email}</strong>
                        </p>
                        <div style={{ display: 'flex', gap: 20, marginTop: 10, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <i className="fas fa-phone" style={{ color: 'var(--primary)' }} /> {data.full_phone || data.phone || '-'}
                            </span>
                            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <i className="fas fa-calendar-alt" style={{ color: 'var(--primary)' }} /> Joined {formatDateDisplay(data.created_at)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Summary Stat Cards ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 24 }}>
                {summaryCards.map((card) => (
                    <div key={card.title} className={`card stat-card ${card.gradient}`}>
                        <i className={`fas ${card.icon} stat-bg-icon`} />
                        <div className="stat-header">
                            <div className="flex-column">
                                <span className="stat-title">{card.title}</span>
                                <span className="stat-value">{card.value}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Breakdown Row ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, marginBottom: 24 }}>
                {/* Appointment Breakdown */}
                <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                        <div>
                            <h3 className="card-title" style={{ fontSize: '0.95rem' }}>Appointment Breakdown</h3>
                            <p className="card-subtitle">Booking status distribution</p>
                        </div>
                        <DonutChart size={90} segments={apptBreakdown} centerLabel="Bookings" />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {apptBreakdown.map((item) => (
                            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                                <span style={{ flex: 1, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{item.label}</span>
                                <div style={{ flex: 2, background: 'var(--bg-primary)', borderRadius: 6, height: 6, overflow: 'hidden' }}>
                                    <div style={{
                                        width: `${data.total_appointments > 0 ? (item.value / data.total_appointments * 100) : 0}%`,
                                        height: '100%', background: item.color, borderRadius: 6, transition: 'width 0.5s ease'
                                    }} />
                                </div>
                                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: item.color, minWidth: 24, textAlign: 'right' }}>{item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Coupon Breakdown */}
                <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                        <div>
                            <h3 className="card-title" style={{ fontSize: '0.95rem' }}>Coupon Breakdown</h3>
                            <p className="card-subtitle">Claimed coupons distribution</p>
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
                                        width: `${data.total_coupon_applied > 0 ? (item.value / data.total_coupon_applied * 100) : 0}%`,
                                        height: '100%', background: item.color, borderRadius: 6, transition: 'width 0.5s ease'
                                    }} />
                                </div>
                                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: item.color, minWidth: 24, textAlign: 'right' }}>{item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Daily Activity Trend Charts ── */}
            <div className="card" style={{ marginBottom: 24 }}>
                <div style={{ marginBottom: 20 }}>
                    <h3 className="card-title" style={{ fontSize: '0.95rem' }}>Daily Activity Trend</h3>
                    <p className="card-subtitle">Interactive trend lines mapping out user bookings and coupon redemptions over time</p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
                    <div style={{ background: 'var(--bg-primary)', borderRadius: 14, padding: '16px 20px', border: '1px solid rgba(54,209,220,0.08)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>Appointments per Day</span>
                        </div>
                        <SvgMultiLineChart series={apptSeries} />
                    </div>
                    <div style={{ background: 'var(--bg-primary)', borderRadius: 14, padding: '16px 20px', border: '1px solid rgba(255,77,128,0.08)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>Coupon Claims per Day</span>
                        </div>
                        <SvgMultiLineChart series={couponSeries} />
                    </div>
                </div>
            </div>

            {/* ── Data Lists ── */}
            <div className="card" style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                    <div className="tab-filters" style={{ marginBottom: 0, padding: 4 }}>
                        {[
                            { key: 'appointments', label: 'Appointments', icon: 'fa-calendar-check', count: data.lists?.appointments?.length || 0 },
                            { key: 'coupons',      label: 'Coupon Claims', icon: 'fa-ticket-alt',    count: data.lists?.coupon_applied?.length || 0 },
                        ].map(tab => (
                            <button
                                key={tab.key}
                                className={`tab-btn${activeListTab === tab.key ? ' active' : ''}`}
                                onClick={() => setActiveListTab(tab.key)}
                            >
                                <i className={`fas ${tab.icon}`} /> {tab.label}
                                <span style={{
                                    marginLeft: 8,
                                    background: activeListTab === tab.key ? 'rgba(255,255,255,0.3)' : 'var(--primary-light)',
                                    color: activeListTab === tab.key ? '#fff' : 'var(--primary)',
                                    borderRadius: 999, padding: '1px 8px', fontSize: '0.72rem', fontWeight: 700
                                }}>{tab.count}</span>
                            </button>
                        ))}
                    </div>
                    <div className="search-wrapper" style={{ marginBottom: 0, maxWidth: 280, width: '100%' }}>
                        <i className="fas fa-search search-icon" />
                        <input
                            type="text"
                            className="search-input"
                            placeholder={activeListTab === 'appointments' ? 'Search appointments...' : 'Search coupons...'}
                            value={activeListTab === 'appointments' ? apptSearch : couponSearch}
                            onChange={e => activeListTab === 'appointments' ? setApptSearch(e.target.value) : setCouponSearch(e.target.value)}
                        />
                    </div>
                </div>

                {/* Appointments Table */}
                {activeListTab === 'appointments' && (
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Outlet / Branch</th>
                                    <th>Appt Date</th>
                                    <th>Time Slot</th>
                                    <th>Approved By</th>
                                    <th>Status</th>
                                    <th>Booked On</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedAppts.length > 0 ? paginatedAppts.map((appt) => {
                                    const s = apptStatusMap[appt.status] || apptStatusMap[0]
                                    return (
                                        <tr key={appt.id}>
                                            <td style={{ fontWeight: 600, color: 'var(--text-muted)' }}>#{appt.id}</td>
                                            <td style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <i className="fas fa-code-branch" style={{ color: 'var(--primary)', fontSize: '0.75rem' }} />
                                                    <div>
                                                        <strong>{appt.Branch?.name || appt.br_name || 'Outlet'}</strong>
                                                        {/* <small style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.7rem' }}>ID #{appt.br_id}</small> */}
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ fontWeight: 600, fontSize: '0.85rem' }}>{formatDateDisplay(appt.appointment_date)}</td>
                                            <td>
                                                <span style={{
                                                    display: 'inline-flex', alignItems: 'center', gap: 4,
                                                    padding: '3px 10px', borderRadius: 8,
                                                    background: 'var(--primary-light)', color: 'var(--primary)',
                                                    fontSize: '0.78rem', fontWeight: 600
                                                }}>
                                                    <i className="fas fa-clock" style={{ fontSize: '0.68rem' }} /> {appt.slot}
                                                </span>
                                            </td>
                                            <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{appt.approved_by || '-'}</td>
                                            <td>
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 8, background: s.bg, color: s.color, fontSize: '0.78rem', fontWeight: 700 }}>
                                                    {s.label}
                                                </span>
                                            </td>
                                            <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{formatDateDisplay(appt.created_at)}</td>
                                        </tr>
                                    )
                                }) : (
                                    <tr>
                                        <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                                            <i className="fas fa-calendar-times" style={{ fontSize: '2rem', opacity: 0.3, display: 'block', marginBottom: 8 }} />
                                            No appointments found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                        {filteredAppts.length > ITEMS_PER_PAGE && (
                            <div className="pagination-container">
                                <span className="pagination-text">
                                    Showing {apptStartCount}-{apptEndCount} of {filteredAppts.length} appointments
                                </span>
                                <div className="pagination-controls">
                                    <button
                                        type="button"
                                        className={`btn-page ${safeApptPage === 1 ? 'disabled' : ''}`}
                                        onClick={() => setApptPage(p => Math.max(1, p - 1))}
                                        disabled={safeApptPage === 1}
                                    >
                                        <i className="fas fa-chevron-left" />
                                    </button>
                                    {getPageWindow(safeApptPage, totalApptPages).map((page, idx) => (
                                        page === '...' ? (
                                            <span key={`appt-ell-${idx}`} style={{ padding: '0 4px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>...</span>
                                        ) : (
                                            <button
                                                type="button"
                                                key={page}
                                                className={`btn-page ${page === safeApptPage ? 'active' : ''}`}
                                                onClick={() => setApptPage(page)}
                                            >
                                                {page}
                                            </button>
                                        )
                                    ))}
                                    <button
                                        type="button"
                                        className={`btn-page ${safeApptPage === totalApptPages ? 'disabled' : ''}`}
                                        onClick={() => setApptPage(p => Math.min(totalApptPages, p + 1))}
                                        disabled={safeApptPage === totalApptPages}
                                    >
                                        <i className="fas fa-chevron-right" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Coupon Claims Table */}
                {activeListTab === 'coupons' && (
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Outlet / Branch</th>
                                    <th>Coupon Code</th>
                                    <th>Discount</th>
                                    <th>Approved By</th>
                                    <th>Status</th>
                                    <th>Claimed On</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedCoupons.length > 0 ? paginatedCoupons.map((coupon) => {
                                    const s = couponStatusMap[coupon.status] || couponStatusMap[0]
                                    return (
                                        <tr key={coupon.id}>
                                            <td style={{ fontWeight: 600, color: 'var(--text-muted)' }}>#{coupon.id}</td>
                                            <td style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <i className="fas fa-store" style={{ color: 'var(--primary)', fontSize: '0.75rem' }} />
                                                    <div>
                                                        <strong>{coupon.Branch?.name || 'Branch Outlet'}</strong>
                                                        {/* <small style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.7rem' }}>ID #{coupon.branch_id}</small> */}
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span style={{
                                                    display: 'inline-flex', alignItems: 'center', gap: 6,
                                                    padding: '3px 12px', borderRadius: 8,
                                                    background: 'var(--primary-light)', color: 'var(--primary)',
                                                    fontSize: '0.82rem', fontWeight: 700, fontFamily: 'monospace'
                                                }}>
                                                    <i className="fas fa-ticket-alt" style={{ fontSize: '0.7rem' }} /> {coupon.coupon_code}
                                                </span>
                                            </td>
                                            <td>
                                                <span style={{ fontWeight: 700, fontSize: '1rem', color: '#10B981' }}>{coupon.percentage}%</span>
                                                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: 4 }}>off</span>
                                            </td>
                                            <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{coupon.approved_by || '-'}</td>
                                            <td>
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 8, background: s.bg, color: s.color, fontSize: '0.78rem', fontWeight: 700 }}>
                                                    {s.label}
                                                </span>
                                            </td>
                                            <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{formatDateDisplay(coupon.created_at)}</td>
                                        </tr>
                                    )
                                }) : (
                                    <tr>
                                        <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                                            <i className="fas fa-ticket-alt" style={{ fontSize: '2rem', opacity: 0.3, display: 'block', marginBottom: 8 }} />
                                            No coupon claims found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                        {filteredCoupons.length > ITEMS_PER_PAGE && (
                            <div className="pagination-container">
                                <span className="pagination-text">
                                    Showing {couponStartCount}-{couponEndCount} of {filteredCoupons.length} coupon claims
                                </span>
                                <div className="pagination-controls">
                                    <button
                                        type="button"
                                        className={`btn-page ${safeCouponPage === 1 ? 'disabled' : ''}`}
                                        onClick={() => setCouponPage(p => Math.max(1, p - 1))}
                                        disabled={safeCouponPage === 1}
                                    >
                                        <i className="fas fa-chevron-left" />
                                    </button>
                                    {getPageWindow(safeCouponPage, totalCouponPages).map((page, idx) => (
                                        page === '...' ? (
                                            <span key={`coupon-ell-${idx}`} style={{ padding: '0 4px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>...</span>
                                        ) : (
                                            <button
                                                type="button"
                                                key={page}
                                                className={`btn-page ${page === safeCouponPage ? 'active' : ''}`}
                                                onClick={() => setCouponPage(page)}
                                            >
                                                {page}
                                            </button>
                                        )
                                    ))}
                                    <button
                                        type="button"
                                        className={`btn-page ${safeCouponPage === totalCouponPages ? 'disabled' : ''}`}
                                        onClick={() => setCouponPage(p => Math.min(totalCouponPages, p + 1))}
                                        disabled={safeCouponPage === totalCouponPages}
                                    >
                                        <i className="fas fa-chevron-right" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
