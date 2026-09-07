import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import API from '../../api.js'

// --- Helpers ---
const apptStatusMap = {
    0: { label: 'Pending', color: '#F59E0B', bg: '#FEF3C7' },
    1: { label: 'Approved', color: '#3B82F6', bg: '#DBEAFE' },
    2: { label: 'Completed', color: '#10B981', bg: '#D1FAE5' },
    3: { label: 'Cancelled', color: '#EF4444', bg: '#FEE2E2' },
    4: { label: 'Rejected', color: '#EF4444', bg: '#FEE2E2' },
}

const couponStatusMap = {
    0: { label: 'Pending', color: '#F59E0B', bg: '#FEF3C7' },
    1: { label: 'Redeemed', color: '#10B981', bg: '#D1FAE5' },
}

function formatDateDisplay(str) {
    if (!str) return '-'
    return new Date(str).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

// Generate a unique color from index using HSL — infinite colors, always distinct
function branchColor(index, opacity = null) {
    const hue = (index * 137.508) % 360 // golden angle distribution
    if (opacity !== null) {
        return `hsla(${Math.round(hue)}, 65%, 52%, ${opacity})`
    }
    return `hsl(${Math.round(hue)}, 65%, 52%)`
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

// ----- SVG Donut Chart with click interaction -----
function DonutChart({ segments = [], size = 120, onSliceClick = null, activeId = null, centerLabel = "Total" }) {
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
        const isActive = activeId === seg.id
        // Expand active slice outward
        const expand = isActive ? 6 : 0
        const midAngle = cumAngle - renderingAngle / 2
        const dx = expand * Math.cos(midAngle)
        const dy = expand * Math.sin(midAngle)
        return {
            ...seg,
            path: `M ${x1 + dx} ${y1 + dy} A ${R} ${R} 0 ${largeArc} 1 ${x2 + dx} ${y2 + dy} L ${ix2 + dx} ${iy2 + dy} A ${r} ${r} 0 ${largeArc} 0 ${ix1 + dx} ${iy1 + dy} Z`,
            isActive
        }
    })

    const activeSegment = arcs.find(a => a.isActive)

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible' }}>
            {arcs.map((a, i) => (
                <path
                    key={i} d={a.path}
                    fill={a.color}
                    stroke="var(--bg-surface)"
                    strokeWidth={a.isActive ? 3.5 : 2}
                    style={{ cursor: onSliceClick ? 'pointer' : 'default', transition: 'all 0.2s ease', filter: a.isActive ? `drop-shadow(0 0 6px ${a.color}88)` : 'none' }}
                    onClick={() => onSliceClick && onSliceClick(a.id === activeId ? null : a.id)}
                >
                    <title>{a.label}: {a.value}</title>
                </path>
            ))}
            {/* Center text */}
            {activeSegment ? (
                <>
                    <text x={cx} y={cy - 6} textAnchor="middle" fontSize="14" fontWeight="800" fill={activeSegment.color}>{activeSegment.value}</text>
                    <text x={cx} y={cy + 8} textAnchor="middle" fontSize="7.5" fill="var(--text-muted)" fontWeight="700" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>{activeSegment.label?.split(' ')[0]}</text>
                </>
            ) : (
                <>
                    <text x={cx} y={cy - 4} textAnchor="middle" fontSize="16" fontWeight="800" fill="var(--text-primary)">{total}</text>
                    <text x={cx} y={cy + 10} textAnchor="middle" fontSize="7.5" fill="var(--text-muted)" fontWeight="750" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>{centerLabel}</text>
                </>
            )}
        </svg>
    )
}

// ===== Main Component =====
export default function ViewMerchReport() {
    const { id } = useParams()
    const navigate = useNavigate()

    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [fromDate, setFromDate] = useState('')
    const [toDate, setToDate] = useState('')
    const [apptSearch, setApptSearch] = useState('')
    const [couponSearch, setCouponSearch] = useState('')
    const [activeListTab, setActiveListTab] = useState('appointments')
    const [activePieBranchId, setActivePieBranchId] = useState(null)
    const [pieMode, setPieMode] = useState('all') // 'all' | 'appointments' | 'coupons'
    const [selectedGraphBranchId, setSelectedGraphBranchId] = useState('all') // 'all' | branch_id

    const [apptPage, setApptPage] = useState(1)
    const [couponPage, setCouponPage] = useState(1)

    useEffect(() => {
        setApptPage(1)
    }, [apptSearch])

    useEffect(() => {
        setCouponPage(1)
    }, [couponSearch])

    useEffect(() => {
        setApptPage(1)
        setCouponPage(1)
    }, [data])

    const formatDateToDMY = (str) => {
        if (!str) return ''
        const [y, m, d] = str.split('-')
        return `${d}-${m}-${y}`
    }

    const fetchReport = useCallback(async () => {
        setLoading(true)
        try {
            const params = {}
            if (fromDate) params.from_date = formatDateToDMY(fromDate)
            if (toDate) params.to_date = formatDateToDMY(toDate)
            const res = await API.get(`admin/merchant-details-report/${id}`, { params })
            setData(res.data?.status === 1 ? res.data.data : null)
        } catch (err) {
            console.error('Error fetching merchant detail report:', err)
            setData(null)
        } finally {
            setLoading(false)
        }
    }, [id, fromDate, toDate])

    useEffect(() => { fetchReport() }, [fetchReport])

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: 16 }}>
                <div style={{ width: 48, height: 48, border: '4px solid var(--primary-light)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <p style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Loading merchant report...</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        )
    }

    if (!data) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: 12 }}>
                <i className="fas fa-exclamation-circle" style={{ fontSize: '3rem', color: 'var(--text-muted)' }} />
                <p style={{ color: 'var(--text-muted)', fontSize: '1rem', fontWeight: 500 }}>No report data found.</p>
                <button className="btn btn-secondary" onClick={() => navigate('/merchant-reports')}>
                    <i className="fas fa-arrow-left" /> Back to Reports
                </button>
            </div>
        )
    }

    // --- Derived ---
    const summaryCards = [
        { title: 'Total Branches', value: data.total_branches, icon: 'fa-code-branch', gradient: 'bg-gradient-pink' },
        { title: 'Total Appointments', value: data.total_appointments, icon: 'fa-calendar-check', gradient: 'bg-gradient-purple' },
        { title: 'Coupons Offered', value: data.total_coupons, icon: 'fa-ticket-alt', gradient: 'bg-gradient-blue' },
        { title: 'Coupons Redeemed', value: data.total_coupon_redeemed, icon: 'fa-check-double', gradient: 'bg-gradient-orange' },
        { title: 'Total Customers', value: data.total_customers, icon: 'fa-users', gradient: 'bg-gradient-teal' },
        { title: 'Receptionists', value: data.total_receptionists, icon: 'fa-user-headset', gradient: 'bg-gradient-pink' },
    ]

    const apptBreakdown = [
        { label: 'Pending', value: data.total_pending_appointments, color: '#F59E0B' },
        { label: 'Approved', value: data.total_approved_appointments, color: '#3B82F6' },
        { label: 'Completed', value: data.total_completed_appointments, color: '#10B981' },
        { label: 'Cancelled', value: data.total_cancelled_appointments, color: '#EF4444' },
        { label: 'Rejected', value: data.total_rejected_appointments, color: '#8B5CF6' },
    ]

    const couponBreakdown = [
        { label: 'Active', value: data.total_active_coupons, color: '#10B981' },
        { label: 'Inactive', value: data.total_inactive_coupons, color: '#94A3B8' },
        { label: 'Redeemed', value: data.total_coupon_redeemed, color: '#8E2DE2' },
    ]

    // Branch pie segments — dynamic colors via HSL, filtered by pieMode
    const branchPieSegments = (data.branch_pie || []).map((b, idx) => {
        let val = 0
        if (pieMode === 'all') val = b.appointment_count + b.coupon_count
        else if (pieMode === 'appointments') val = b.appointment_count
        else if (pieMode === 'coupons') val = b.coupon_count

        return {
            id: b.branch_id,
            label: b.branch_name,
            value: val,
            color: branchColor(idx),
            branch: b,
        }
    }).filter(s => s.value > 0)

    // Graph series — filtered by selectedGraphBranchId dropdown selection
    const apptSeries = (data.graphs || [])
        .map((b, i) => ({
            branch_id: b.branch_id,
            label: `${b.branch_name} (#${b.branch_id})`,
            color: branchColor(i),
            data: b.appointments_per_day || []
        }))
        .filter(s => selectedGraphBranchId === 'all' || s.branch_id == selectedGraphBranchId)

    const couponSeries = (data.graphs || [])
        .map((b, i) => ({
            branch_id: b.branch_id,
            label: `${b.branch_name} (#${b.branch_id})`,
            color: branchColor(i),
            data: b.coupon_applied_per_day || []
        }))
        .filter(s => selectedGraphBranchId === 'all' || s.branch_id == selectedGraphBranchId)

    const filteredAppts = (data.lists?.appointments || []).filter(a =>
        (a.Customer?.name || '').toLowerCase().includes(apptSearch.toLowerCase()) ||
        (a.br_name || '').toLowerCase().includes(apptSearch.toLowerCase())
    )
    const filteredCoupons = (data.lists?.coupon_applied || []).filter(c =>
        (c.Customer?.name || '').toLowerCase().includes(couponSearch.toLowerCase()) ||
        (c.coupon_code || '').toLowerCase().includes(couponSearch.toLowerCase())
    )

    const ITEMS_PER_PAGE = 10

    // Appointments pagination calculations
    const totalApptPages = Math.max(1, Math.ceil(filteredAppts.length / ITEMS_PER_PAGE))
    const safeApptPage = Math.min(apptPage, totalApptPages)
    const apptPageStartIndex = (safeApptPage - 1) * ITEMS_PER_PAGE
    const paginatedAppts = filteredAppts.slice(apptPageStartIndex, apptPageStartIndex + ITEMS_PER_PAGE)
    const apptStartCount = filteredAppts.length ? apptPageStartIndex + 1 : 0
    const apptEndCount = Math.min(apptPageStartIndex + ITEMS_PER_PAGE, filteredAppts.length)

    // Coupons pagination calculations
    const totalCouponPages = Math.max(1, Math.ceil(filteredCoupons.length / ITEMS_PER_PAGE))
    const safeCouponPage = Math.min(couponPage, totalCouponPages)
    const couponPageStartIndex = (safeCouponPage - 1) * ITEMS_PER_PAGE
    const paginatedCoupons = filteredCoupons.slice(couponPageStartIndex, couponPageStartIndex + ITEMS_PER_PAGE)
    const couponStartCount = filteredCoupons.length ? couponPageStartIndex + 1 : 0
    const couponEndCount = Math.min(couponPageStartIndex + ITEMS_PER_PAGE, filteredCoupons.length)

    const activePieBranch = activePieBranchId != null
        ? (data.branch_pie || []).find(b => b.branch_id == activePieBranchId)
        : null

    const activePieIdx = activePieBranchId != null
        ? (data.branch_pie || []).findIndex(b => b.branch_id == activePieBranchId)
        : -1

    return (
        <div style={{ padding: '4px 0' }}>
            {/* ── Page Header ── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <button className="btn btn-secondary" style={{ height: 38, padding: '0 14px' }} onClick={() => navigate('/merchant-reports')}>
                        <i className="fas fa-arrow-left" />
                    </button>
                    <div>
                        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.45rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                            Merchant Analytics Report
                        </h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: 2 }}>
                            Detailed performance metrics for <strong style={{ color: 'var(--primary)' }}>{data.business_name || data.owner_name}</strong>
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

            {/* ── Merchant Identity Card ── */}
            <div className="card" style={{ marginBottom: 24, background: 'linear-gradient(135deg, rgba(255,77,128,0.05) 0%, rgba(91,134,229,0.04) 100%)', borderColor: 'rgba(255,77,128,0.12)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                    <div style={{
                        width: 72, height: 72, borderRadius: 20, flexShrink: 0,
                        background: 'var(--gradient-primary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.8rem', fontWeight: 700, color: '#fff',
                        boxShadow: '0 12px 28px rgba(255,77,128,0.28)'
                    }}>
                        {(data.business_name || data.owner_name || 'M')[0].toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                                {data.business_name || '-'}
                            </h3>
                            <span className={`badge ${data.status == 1 ? 'approved' : 'declined'}`} style={{ fontSize: '0.72rem' }}>
                                {data.status == 1 ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: 4 }}>
                            <i className="fas fa-user" style={{ color: 'var(--primary)', marginRight: 6 }} />
                            Owner: <strong>{data.owner_name}</strong>
                            <span style={{ margin: '0 12px', color: 'var(--text-muted)' }}>|</span>
                            <i className="fas fa-tags" style={{ color: 'var(--primary)', marginRight: 6 }} />
                            {data.cat_name || '-'}
                        </p>
                        <div style={{ display: 'flex', gap: 20, marginTop: 10, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <i className="fas fa-phone" style={{ color: 'var(--primary)' }} /> {data.phone || '-'}
                            </span>
                            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <i className="fas fa-envelope" style={{ color: 'var(--primary)' }} /> {data.email || '-'}
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
                            <p className="card-subtitle">Status distribution</p>
                        </div>
                        <DonutChart size={90} segments={apptBreakdown.map((a, i) => ({ ...a, id: i }))} />
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
                            <p className="card-subtitle">Coupon status distribution</p>
                        </div>
                        <DonutChart size={90} segments={couponBreakdown.map((a, i) => ({ ...a, id: i }))} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {couponBreakdown.map((item) => (
                            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                                <span style={{ flex: 1, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{item.label}</span>
                                <div style={{ flex: 2, background: 'var(--bg-primary)', borderRadius: 6, height: 6, overflow: 'hidden' }}>
                                    <div style={{
                                        width: `${data.total_coupons > 0 ? (item.value / data.total_coupons * 100) : 0}%`,
                                        height: '100%', background: item.color, borderRadius: 6, transition: 'width 0.5s ease'
                                    }} />
                                </div>
                                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: item.color, minWidth: 24, textAlign: 'right' }}>{item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Branch Performance Pie ── */}
            {branchPieSegments.length > 0 && (
                <div className="card" style={{ marginBottom: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                        <div>
                            <h3 className="card-title" style={{ fontSize: '0.95rem' }}>Branch Performance Overview</h3>
                            <p className="card-subtitle">Click a slice to view branch details</p>
                        </div>
                        {/* Interactive Mode Toggle */}
                        <div style={{ display: 'inline-flex', background: 'var(--bg-primary)', padding: 3, borderRadius: 10, border: '1px solid rgba(0,0,0,0.06)' }}>
                            {[
                                { key: 'all', label: 'All Actions' },
                                { key: 'appointments', label: 'Appointments' },
                                { key: 'coupons', label: 'Coupons' },
                            ].map(tab => (
                                <button
                                    key={tab.key}
                                    onClick={() => {
                                        setPieMode(tab.key)
                                        setActivePieBranchId(null)
                                    }}
                                    style={{
                                        padding: '5px 12px',
                                        borderRadius: 8,
                                        fontSize: '0.72rem',
                                        fontWeight: 700,
                                        border: 'none',
                                        cursor: 'pointer',
                                        background: pieMode === tab.key ? 'var(--bg-surface)' : 'transparent',
                                        color: pieMode === tab.key ? 'var(--primary)' : 'var(--text-muted)',
                                        boxShadow: pieMode === tab.key ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '24px 0' }}>
                        <DonutChart
                            size={280}
                            segments={branchPieSegments}
                            onSliceClick={(bid) => setActivePieBranchId(bid)}
                            activeId={activePieBranchId}
                            centerLabel={pieMode === 'all' ? 'Actions' : pieMode === 'appointments' ? 'Appts' : 'Coupons'}
                        />
                    </div>
                </div>
            )}

            {/* ── Daily Activity Charts ── */}
            {data.graphs && data.graphs.length > 0 && (
                <div className="card" style={{ marginBottom: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                            <div>
                                <h3 className="card-title" style={{ fontSize: '0.95rem' }}>Daily Activity Charts</h3>
                                <p className="card-subtitle">Daily appointments and coupon claims trend</p>
                            </div>

                        </div>
                        {/* Branch Selector Dropdown */}
                        <select
                            value={selectedGraphBranchId}
                            onChange={e => setSelectedGraphBranchId(e.target.value)}
                            className="form-select"
                            style={{
                                width: 170,
                                height: 34,
                                padding: '0 10px',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                borderRadius: 8,
                                background: 'var(--bg-primary)',
                                border: '1px solid rgba(0,0,0,0.08)',
                                color: 'var(--text-primary)',
                                cursor: 'pointer'
                            }}
                        >
                            <option value="all">All Outlets</option>
                            {data.graphs.map(b => (
                                <option key={b.branch_id} value={b.branch_id}>
                                    {b.branch_name} (#{b.branch_id})
                                </option>
                            ))}
                        </select>

                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
                        <div style={{ background: 'var(--bg-primary)', borderRadius: 14, padding: '16px 20px', border: '1px solid rgba(142,45,226,0.08)' }}>
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
            )}

            {/* ── Data Lists ── */}
            <div className="card" style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                    <div className="tab-filters" style={{ marginBottom: 0, padding: 4 }}>
                        {[
                            { key: 'appointments', label: 'Appointments', icon: 'fa-calendar-check', count: data.lists?.appointments?.length || 0 },
                            { key: 'coupons', label: 'Coupon Claims', icon: 'fa-ticket-alt', count: data.lists?.coupon_applied?.length || 0 },
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
                                    <th>Customer</th>
                                    <th>Branch</th>
                                    <th>Appt Date</th>
                                    <th>Slot</th>
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
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                    <div style={{
                                                        width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                                                        background: 'var(--gradient-primary)',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        color: '#fff', fontWeight: 700, fontSize: '0.8rem'
                                                    }}>
                                                        {(appt.Customer?.name || 'C')[0].toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <strong style={{ fontSize: '0.85rem' }}>{appt.Customer?.name || '-'}</strong>
                                                        <small style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.72rem' }}>ID #{appt.cus_id}</small>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                                                <i className="fas fa-code-branch" style={{ color: 'var(--primary)', marginRight: 5, fontSize: '0.72rem' }} />
                                                {appt.br_name || '-'}
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

                {/* Coupon Applied Table */}
                {activeListTab === 'coupons' && (
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Customer</th>
                                    <th>Coupon Code</th>
                                    <th>Discount</th>
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
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                    <div style={{
                                                        width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                                                        background: 'linear-gradient(135deg,#36D1DC,#5B86E5)',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        color: '#fff', fontWeight: 700, fontSize: '0.8rem'
                                                    }}>
                                                        {(coupon.Customer?.name || 'C')[0].toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <strong style={{ fontSize: '0.85rem' }}>{coupon.Customer?.name || '-'}</strong>
                                                        <small style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.72rem' }}>ID #{coupon.cus_id}</small>
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
                                        <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
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

            {/* ── Branch Details Modal Popup ── */}
            {activePieBranch && (() => {
                const color = branchColor(activePieIdx)
                const brTotal = activePieBranch.appointment_count + activePieBranch.coupon_count
                const grandTotal = branchPieSegments.reduce((sum, b) => sum + b.value, 0)
                const sharePercent = grandTotal > 0 ? Math.round((brTotal / grandTotal) * 100) : 0

                return (
                    <div className="modal active">
                        <div className="modal-backdrop" onClick={() => setActivePieBranchId(null)} />
                        <div className="modal-content" style={{ maxWidth: '460px', borderRadius: '20px', border: `1px solid ${branchColor(activePieIdx, 0.25)}`, animation: 'modalScaleIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)', zIndex: 1100 }}>
                            <style>{`
                                @keyframes modalScaleIn {
                                    from { opacity: 0; transform: scale(0.92) translateY(10px); }
                                    to { opacity: 1; transform: scale(1) translateY(0); }
                                }
                            `}</style>
                            <div className="modal-header" style={{ borderBottom: `1px solid ${branchColor(activePieIdx, 0.15)}`, background: branchColor(activePieIdx, 0.05), padding: '16px 20px' }}>
                                <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 12, margin: 0 }}>
                                    <div style={{
                                        width: 38, height: 38, borderRadius: 12,
                                        background: color,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: '#fff', fontWeight: 800, fontSize: '1rem',
                                        boxShadow: `0 4px 12px ${branchColor(activePieIdx, 0.25)}`
                                    }}>
                                        {activePieBranch.branch_name?.[0]?.toUpperCase() || 'B'}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 750, fontSize: '1.05rem', color: 'var(--text-primary)' }}>{activePieBranch.branch_name}</div>
                                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 500 }}>Branch #{activePieBranch.branch_id}</div>
                                    </div>
                                </h3>
                                <button
                                    onClick={() => setActivePieBranchId(null)}
                                    style={{
                                        background: 'none', border: 'none', cursor: 'pointer',
                                        color: 'var(--text-muted)', fontSize: '1.1rem', padding: 4,
                                        transition: 'color 0.2s', display: 'flex', alignItems: 'center'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
                                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                                >
                                    <i className="fas fa-times" />
                                </button>
                            </div>

                            <div className="modal-body" style={{ padding: '24px 20px' }}>
                                {/* Share bar */}
                                <div style={{ marginBottom: 24 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Share of total activity</span>
                                        <span style={{ fontSize: '0.88rem', fontWeight: 850, color: color }}>{sharePercent}%</span>
                                    </div>
                                    <div style={{ height: 10, borderRadius: 5, background: 'var(--bg-hover)', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.03)' }}>
                                        <div style={{ width: `${sharePercent}%`, height: '100%', background: color, borderRadius: 5, transition: 'width 0.6s cubic-bezier(0.1, 0.8, 0.3, 1)' }} />
                                    </div>
                                </div>

                                {/* Stats Grid */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
                                    {[
                                        { label: 'Appointments', value: activePieBranch.appointment_count, icon: 'fa-calendar-check', color: '#8E2DE2' },
                                        { label: 'Coupons Used', value: activePieBranch.coupon_count, icon: 'fa-ticket-alt', color: '#FF4D80' },
                                        { label: 'Total Actions', value: brTotal, icon: 'fa-chart-bar', color: color },
                                    ].map(stat => (
                                        <div
                                            key={stat.label}
                                            style={{
                                                textAlign: 'center',
                                                padding: '16px 8px',
                                                borderRadius: 14,
                                                background: `${stat.color}08`,
                                                border: `1.5px solid ${stat.color}15`,
                                                transition: 'all 0.2s ease'
                                            }}
                                        >
                                            <div style={{
                                                width: 32, height: 32, borderRadius: '50%',
                                                background: `${stat.color}15`, display: 'flex',
                                                alignItems: 'center', justifyContent: 'center',
                                                margin: '0 auto 10px auto'
                                            }}>
                                                <i className={`fas ${stat.icon}`} style={{ color: stat.color, fontSize: '0.9rem' }} />
                                            </div>
                                            <div style={{ fontSize: '1.25rem', fontWeight: 850, color: stat.color }}>{stat.value}</div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 650, marginTop: 4 }}>{stat.label}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="modal-footer" style={{ background: 'var(--bg-primary)', padding: '12px 20px', display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid rgba(0,0,0,0.03)' }}>
                                <button
                                    className="btn btn-primary"
                                    onClick={() => navigate(`/branch-report/${activePieBranch.branch_id}`)}
                                    style={{ padding: '8px 16px', fontSize: '0.82rem', height: 36 }}
                                >
                                    <i className="fas fa-chart-line" /> View Branch Report
                                </button>
                                <button className="btn btn-secondary" onClick={() => setActivePieBranchId(null)} style={{ padding: '8px 16px', fontSize: '0.82rem', height: 36 }}>
                                    Close Details
                                </button>
                            </div>
                        </div>
                    </div>
                )
            })()}
        </div>
    )
}