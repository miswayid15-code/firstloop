import { useEffect, useState, useCallback } from 'react'
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
    1: { label: 'Approved', color: '#10B981', bg: '#D1FAE5' },
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

    const getXLabelIndices = (length) => {
        if (length <= 6) return Array.from({ length }, (_, i) => i)
        const step = Math.floor((length - 1) / 5)
        const indices = []
        for (let i = 0; i < 5; i++) {
            indices.push(i * step)
        }
        indices.push(length - 1)
        return [...new Set(indices)].sort((a,b)=>a-b)
    }

    const labelIndices = getXLabelIndices(allDates.length)

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
                        
                        const drawCircles = allDates.length <= 40;
                        const circleRadius = allDates.length > 20 ? 1.8 : 3.5;
                        const strokeWidth = allDates.length > 20 ? 0.75 : 1.2;

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
                                {pts.map((p, i) => {
                                    return (
                                        <g key={i}>
                                            {drawCircles && (
                                                <circle
                                                    cx={p.x} cy={p.y} r={circleRadius}
                                                    fill={s.color} stroke="#fff" strokeWidth={strokeWidth}
                                                    style={{ pointerEvents: 'none' }}
                                                />
                                            )}
                                            <circle
                                                cx={p.x} cy={p.y} r={allDates.length > 40 ? 6 : 8}
                                                fill="transparent"
                                                style={{ cursor: 'pointer' }}
                                                onMouseEnter={() => setTooltip({ x: p.x, y: p.y, date: p.date, count: p.count, label: s.label, color: s.color })}
                                            />
                                        </g>
                                    )
                                })}
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
            <div style={{ position: 'relative', height: 16, marginTop: 8 }}>
                {labelIndices.map((idx) => {
                    const pct = (getX(idx) / W) * 100
                    return (
                        <span 
                            key={idx} 
                            style={{ 
                                position: 'absolute', 
                                left: `${pct}%`, 
                                transform: 'translateX(-50%)', 
                                fontSize: '0.62rem', 
                                color: 'var(--text-muted)', 
                                fontWeight: 600,
                                whiteSpace: 'nowrap'
                            }}
                        >
                            {allDates[idx].slice(5)}
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

export default function BranchReport() {
    const { id } = useParams()
    const navigate = useNavigate()

    const [reportData, setReportData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [fromDate, setFromDate] = useState('')
    const [toDate, setToDate] = useState('')
    const [apptSearch, setApptSearch] = useState('')
    const [couponSearch, setCouponSearch] = useState('')
    const [appliedSearch, setAppliedSearch] = useState('')
    const [activeListTab, setActiveListTab] = useState('appointments')
    const [showExport, setShowExport] = useState(false)
    const [chartFilter, setChartFilter] = useState('all')

    const handleExportClick = () => {
        setShowExport((prev) => !prev)
    }

    const [apptPage, setApptPage] = useState(1)
    const [couponPage, setCouponPage] = useState(1)
    const [appliedPage, setAppliedPage] = useState(1)

    useEffect(() => {
        setApptPage(1)
    }, [apptSearch])

    useEffect(() => {
        setCouponPage(1)
    }, [couponSearch])

    useEffect(() => {
        setAppliedPage(1)
    }, [appliedSearch])

    const fetchReport = useCallback(async () => {
        setLoading(true)
        try {
            const params = {}
            if (fromDate) {
                params.from_date = fromDate
                params.fromdate = fromDate
            }
            if (toDate) {
                params.to_date = toDate
                params.end_date = toDate
            }
            const res = await API.get(`admin/branch/reports/${id}`, { params })
            setReportData(res.data?.status === 1 ? res.data : null)
        } catch (err) {
            console.error('Error fetching branch report:', err)
            setReportData(null)
        } finally {
            setLoading(false)
        }
    }, [id, fromDate, toDate])

    useEffect(() => {
        fetchReport()
    }, [fetchReport])

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: 16 }}>
                <div style={{ width: 48, height: 48, border: '4px solid var(--primary-light)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <p style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Loading branch report...</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        )
    }

    if (!reportData) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: 12 }}>
                <i className="fas fa-exclamation-circle" style={{ fontSize: '3rem', color: 'var(--text-muted)' }} />
                <p style={{ color: 'var(--text-muted)', fontSize: '1rem', fontWeight: 500 }}>No branch report data found.</p>
                <button className="btn btn-secondary" onClick={() => navigate(-1)}>
                    <i className="fas fa-arrow-left" /> Go Back
                </button>
            </div>
        )
    }

    const { report = {}, lists = {} } = reportData

    const apptBreakdown = [
        { label: 'Pending', value: report.pending_appointment || 0, color: '#F59E0B' },
        { label: 'Approved', value: report.approved_appointment || 0, color: '#3B82F6' },
        { label: 'Rejected', value: report.rejected_appointment || 0, color: '#EF4444' }
    ]

    // --- Derived Summary Cards ---
    const summaryCards = [
        { title: 'Pending Bookings',    value: report.pending_appointment || 0,  icon: 'fa-clock',          gradient: 'bg-gradient-purple' },
        { title: 'Approved Bookings',   value: report.approved_appointment || 0, icon: 'fa-calendar-check', gradient: 'bg-gradient-teal' },
        { title: 'Rejected Bookings',   value: report.rejected_appointment || 0, icon: 'fa-calendar-times', gradient: 'bg-gradient-pink' },
        { title: 'Total Coupons',       value: report.total_coupon || 0,         icon: 'fa-ticket-alt',     gradient: 'bg-gradient-blue' },
        { title: 'Active Coupons',      value: report.active_coupon || 0,        icon: 'fa-check-circle',   gradient: 'bg-gradient-teal' },
        { title: 'Expired Coupons',     value: report.expired_coupon || 0,       icon: 'fa-times-circle',   gradient: 'bg-gradient-pink' },
        { title: 'Redeemed Coupons',     value: report.applied_coupon || 0,       icon: 'fa-check-double',   gradient: 'bg-gradient-orange' },
    ]

    // --- Filtering & Pagination ---
    const filteredAppts = (lists.appointments || []).filter(a =>
        (String(a.id).includes(apptSearch)) ||
        (String(a.cus_id).includes(apptSearch)) ||
        (a.slot && a.slot.toLowerCase().includes(apptSearch.toLowerCase()))
    )

    const filteredCoupons = (lists.coupons || []).filter(c =>
        (c.code || '').toLowerCase().includes(couponSearch.toLowerCase()) ||
        (String(c.id).includes(couponSearch))
    )

    const filteredAppliedCoupons = (lists.applied_coupons || []).filter(ac =>
        (ac.coupon_code || '').toLowerCase().includes(appliedSearch.toLowerCase()) ||
        (String(ac.cus_id).includes(appliedSearch)) ||
        (ac.approved_by && ac.approved_by.toLowerCase().includes(appliedSearch.toLowerCase()))
    )

    const ITEMS_PER_PAGE = 10

    // Appointments pagination
    const totalApptPages = Math.max(1, Math.ceil(filteredAppts.length / ITEMS_PER_PAGE))
    const safeApptPage = Math.min(apptPage, totalApptPages)
    const apptPageStartIndex = (safeApptPage - 1) * ITEMS_PER_PAGE
    const paginatedAppts = filteredAppts.slice(apptPageStartIndex, apptPageStartIndex + ITEMS_PER_PAGE)
    const apptStartCount = filteredAppts.length ? apptPageStartIndex + 1 : 0
    const apptEndCount = Math.min(apptPageStartIndex + ITEMS_PER_PAGE, filteredAppts.length)

    // Coupons pagination
    const totalCouponPages = Math.max(1, Math.ceil(filteredCoupons.length / ITEMS_PER_PAGE))
    const safeCouponPage = Math.min(couponPage, totalCouponPages)
    const couponPageStartIndex = (safeCouponPage - 1) * ITEMS_PER_PAGE
    const paginatedCoupons = filteredCoupons.slice(couponPageStartIndex, couponPageStartIndex + ITEMS_PER_PAGE)
    const couponStartCount = filteredCoupons.length ? couponPageStartIndex + 1 : 0
    const couponEndCount = Math.min(couponPageStartIndex + ITEMS_PER_PAGE, filteredCoupons.length)

    // Applied Coupons pagination
    const totalAppliedPages = Math.max(1, Math.ceil(filteredAppliedCoupons.length / ITEMS_PER_PAGE))
    const safeAppliedPage = Math.min(appliedPage, totalAppliedPages)
    const appliedPageStartIndex = (safeAppliedPage - 1) * ITEMS_PER_PAGE
    const paginatedApplied = filteredAppliedCoupons.slice(appliedPageStartIndex, appliedPageStartIndex + ITEMS_PER_PAGE)
    const appliedStartCount = filteredAppliedCoupons.length ? appliedPageStartIndex + 1 : 0
    const appliedEndCount = Math.min(appliedPageStartIndex + ITEMS_PER_PAGE, filteredAppliedCoupons.length)

    const handleExport = (format) => {
        let csvContent = "";
        let fileName = "";
        
        if (activeListTab === 'appointments') {
            fileName = `branch_${id}_appointments_report.${format === 'Excel' ? 'xls' : 'csv'}`;
            const headers = ["Appointment ID", "Customer Name", "Customer ID", "Appointment Date", "Slot", "Status", "Booked On"];
            const rows = filteredAppts.map(appt => [
                appt.id,
                appt.Customer?.name || 'Customer',
                appt.cus_id,
                appt.appointment_date ? new Date(appt.appointment_date).toLocaleDateString() : '',
                appt.slot || '',
                apptStatusMap[appt.status]?.label || 'Pending',
                appt.created_at ? new Date(appt.created_at).toLocaleDateString() : ''
            ]);
            csvContent = [headers, ...rows].map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(",")).join("\n");
        } else if (activeListTab === 'coupons') {
            fileName = `branch_${id}_coupons_report.${format === 'Excel' ? 'xls' : 'csv'}`;
            const headers = ["Coupon ID", "Coupon Code", "Percentage Off", "Min Amount", "Start Date", "End Date", "Status", "Created At"];
            const rows = filteredCoupons.map(coupon => [
                coupon.id,
                coupon.code || '',
                `${coupon.percentage}%`,
                coupon.min_amount || '',
                coupon.start_date ? new Date(coupon.start_date).toLocaleDateString() : '',
                coupon.end_date ? new Date(coupon.end_date).toLocaleDateString() : '',
                coupon.is_expired === 1 ? 'Expired' : 'Active',
                coupon.created_at ? new Date(coupon.created_at).toLocaleDateString() : ''
            ]);
            csvContent = [headers, ...rows].map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(",")).join("\n");
        } else if (activeListTab === 'applied_coupons') {
            fileName = `branch_${id}_applied_coupons_report.${format === 'Excel' ? 'xls' : 'csv'}`;
            const headers = ["Applied ID", "Customer Name", "Customer ID", "Coupon Code", "Percentage Off", "Used At", "Approved By", "Status", "Claimed On"];
            const rows = filteredAppliedCoupons.map(ac => [
                ac.id,
                ac.Customer?.name || 'Customer',
                ac.cus_id,
                ac.coupon_code || '',
                `${ac.percentage}%`,
                ac.used_at ? new Date(ac.used_at).toLocaleDateString() : '',
                ac.approved_by || '',
                couponStatusMap[ac.status]?.label || 'Pending',
                ac.created_at ? new Date(ac.created_at).toLocaleDateString() : ''
            ]);
            csvContent = [headers, ...rows].map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(",")).join("\n");
        }

        if (format === 'PDF' || format === 'Print') {
            window.print();
            return;
        }

        if (format === 'Email') {
            const subject = encodeURIComponent(`Branch ${id} Analytics Report`);
            const body = encodeURIComponent(`Find the summary of Branch ${id} below:\n\n` + 
                `Pending Appointments: ${report.pending_appointment || 0}\n` +
                `Approved Appointments: ${report.approved_appointment || 0}\n` +
                `Active Coupons: ${report.active_coupon || 0}\n\n` +
                `Please check the dashboard for the full data.`);
            window.location.href = `mailto:?subject=${subject}&body=${body}`;
            return;
        }

        if (format === 'Schedule') {
            window.alert("Export schedule set successfully. The report will be emailed weekly.");
            return;
        }

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", fileName);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

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
                            Branch Analytics Report
                        </h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: 2 }}>
                            Detailed performance metrics for Branch <strong style={{ color: 'var(--primary)' }}></strong>
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
                    <div className="export-group" style={{ position: 'relative' }}>
                        <button className="btn btn-secondary" style={{ height: 38 }} onClick={handleExportClick}>
                            <i className="fas fa-file-export"></i> Export Report <i className="fas fa-chevron-down" style={{ fontSize: '0.7rem', marginLeft: 4 }} />
                        </button>
                        <div className={`export-dropdown${showExport ? ' active' : ''}`} style={{ opacity: showExport ? 1 : 0, visibility: showExport ? 'visible' : 'hidden', transform: showExport ? 'translateY(0)' : 'translateY(10px)' }}>
                            {['CSV', 'Excel', 'PDF', 'Print', 'Email', 'Schedule'].map((item) => (
                                <div key={item} className="export-dropdown-item" onClick={() => { handleExport(item); setShowExport(false); }}>
                                    <i className={`fas fa-file-${item === 'Print' ? 'print' : item === 'Email' ? 'envelope' : item === 'Schedule' ? 'calendar-alt' : item.toLowerCase()}`}></i> {item}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Summary Stat Cards ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
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

            {/* ── Charts Grid ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, marginBottom: 24 }}>
                {/* Activity Trend */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column', minHeight: 240 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, flexWrap: 'wrap', gap: 12 }}>
                        <div>
                            <h3 className="card-title" style={{ fontSize: '0.95rem', marginBottom: 2 }}>Activity Trend</h3>
                            <p className="card-subtitle" style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>Appointments vs. Redemptions per day</p>
                        </div>
                        <select
                            value={chartFilter}
                            onChange={e => setChartFilter(e.target.value)}
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
                            <option value="all">All Activity</option>
                            <option value="appointments">Appointments</option>
                            <option value="redeemed">Redeemed Coupons</option>
                        </select>
                    </div>
                    <div style={{ flex: 1, marginTop: 12 }}>
                        <SvgMultiLineChart series={[
                            ...(chartFilter === 'all' || chartFilter === 'appointments' ? [{ label: 'Appointments', color: '#3B82F6', data: reportData.graphs?.appointments_per_day || [] }] : []),
                            ...(chartFilter === 'all' || chartFilter === 'redeemed' ? [{ label: 'Redemptions', color: '#10B981', data: reportData.graphs?.coupon_applied_per_day || [] }] : [])
                        ]} />
                    </div>
                </div>

                {/* Appointment Status Breakdown */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column', minHeight: 240 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                        <div>
                            <h3 className="card-title" style={{ fontSize: '0.95rem', marginBottom: 2 }}>Appointment Breakdown</h3>
                            <p className="card-subtitle" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Status distribution</p>
                        </div>
                        <DonutChart size={85} segments={apptBreakdown.map((a, i) => ({ ...a, id: i }))} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, justifyContent: 'center' }}>
                        {apptBreakdown.map((item) => {
                            const totalAppts = (report.pending_appointment || 0) + (report.approved_appointment || 0) + (report.rejected_appointment || 0)
                            const percent = totalAppts > 0 ? Math.round((item.value / totalAppts) * 100) : 0
                            return (
                                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                                    <span style={{ flex: 1, fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{item.label}</span>
                                    <div style={{ flex: 2, background: 'var(--bg-primary)', borderRadius: 6, height: 6, overflow: 'hidden' }}>
                                        <div style={{
                                            width: `${percent}%`,
                                            height: '100%', background: item.color, borderRadius: 6, transition: 'width 0.5s ease'
                                        }} />
                                    </div>
                                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: item.color, minWidth: 32, textAlign: 'right' }}>{item.value} ({percent}%)</span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* ── Tabbed Lists ── */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ background: 'var(--primary-light)', padding: '12px 20px', borderBottom: '1px solid rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                    <div className="tab-filters" style={{ marginBottom: 0, padding: 0, background: 'none', border: 'none' }}>
                        {[
                            { key: 'appointments', label: 'Appointments', count: filteredAppts.length, icon: 'fa-calendar-check' },
                            { key: 'coupons', label: 'Coupons', count: filteredCoupons.length, icon: 'fa-ticket-alt' },
                            { key: 'applied_coupons', label: 'Redeemed Coupons', count: filteredAppliedCoupons.length, icon: 'fa-check-double' },
                        ].map((tab) => (
                            <button
                                key={tab.key}
                                type="button"
                                className={`tab-btn${activeListTab === tab.key ? ' active' : ''}`}
                                onClick={() => setActiveListTab(tab.key)}
                                style={{
                                    background: activeListTab === tab.key ? 'rgba(255,255,255,0.3)' : 'var(--primary-light)',
                                    color: activeListTab === tab.key ? 'var(--primary-dark)' : 'var(--text-muted)',
                                    fontSize: '0.85rem', fontWeight: 600, padding: '8px 16px', borderRadius: 8,
                                    display: 'inline-flex', alignItems: 'center', gap: 8, transition: 'all 0.2s ease', border: 'none'
                                }}
                            >
                                <i className={`fas ${tab.icon}`} />
                                {tab.label}
                                <span style={{
                                    fontSize: '0.72rem', background: activeListTab === tab.key ? 'var(--primary)' : 'rgba(0,0,0,0.06)',
                                    color: activeListTab === tab.key ? '#fff' : 'var(--text-muted)', padding: '2px 8px', borderRadius: 12, fontWeight: 700
                                }}>
                                    {tab.count}
                                </span>
                            </button>
                        ))}
                    </div>

                    <div className="search-wrapper" style={{ marginBottom: 0, maxWidth: 260, width: '100%' }}>
                        <i className="fas fa-search search-icon" />
                        {activeListTab === 'appointments' && (
                            <input
                                type="text"
                                className="search-input"
                                placeholder="Search appointments..."
                                value={apptSearch}
                                onChange={e => setApptSearch(e.target.value)}
                            />
                        )}
                        {activeListTab === 'coupons' && (
                            <input
                                type="text"
                                className="search-input"
                                placeholder="Search coupons..."
                                value={couponSearch}
                                onChange={e => setCouponSearch(e.target.value)}
                            />
                        )}
                        {activeListTab === 'applied_coupons' && (
                            <input
                                type="text"
                                className="search-input"
                                placeholder="Search redeemed coupons..."
                                value={appliedSearch}
                                onChange={e => setAppliedSearch(e.target.value)}
                            />
                        )}
                    </div>
                </div>

                <div style={{ padding: 20 }}>
                    {/* ── Tab: Appointments ── */}
                    {activeListTab === 'appointments' && (
                        <div className="table-wrapper">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Customer</th>
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
                                                            <strong style={{ fontSize: '0.85rem' }}>{appt.Customer?.name || 'Customer'}</strong>
                                                            <small style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.72rem' }}>ID #{appt.cus_id}</small>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ fontWeight: 600, fontSize: '0.85rem' }}>{formatDateDisplay(appt.appointment_date)}</td>
                                                <td style={{ fontSize: '0.82rem', fontWeight: 500 }}>{appt.slot || '-'}</td>
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
                                            <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                                                <i className="fas fa-calendar-alt" style={{ fontSize: '2rem', opacity: 0.3, display: 'block', marginBottom: 8 }} />
                                                No appointments found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                            {filteredAppts.length > ITEMS_PER_PAGE && (
                                <div className="pagination-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 20 }}>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                                        Showing {apptStartCount} to {apptEndCount} of {filteredAppts.length} entries
                                    </span>
                                    <div style={{ display: 'flex', gap: 5 }}>
                                        <button
                                            className={`btn btn-secondary ${safeApptPage === 1 ? 'disabled' : ''}`}
                                            disabled={safeApptPage === 1}
                                            onClick={() => setApptPage(p => Math.max(1, p - 1))}
                                            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                                        >
                                            Prev
                                        </button>
                                        {getPageWindow(safeApptPage, totalApptPages).map((p, idx) => (
                                            <button
                                                key={idx}
                                                className={`btn ${safeApptPage === p ? 'btn-primary' : 'btn-secondary'}`}
                                                disabled={p === '...'}
                                                onClick={() => p !== '...' && setApptPage(p)}
                                                style={{ padding: '6px 12px', fontSize: '0.8rem', minWidth: 32 }}
                                            >
                                                {p}
                                            </button>
                                        ))}
                                        <button
                                            className={`btn btn-secondary ${safeApptPage === totalApptPages ? 'disabled' : ''}`}
                                            disabled={safeApptPage === totalApptPages}
                                            onClick={() => setApptPage(p => Math.min(totalApptPages, p + 1))}
                                            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Tab: Coupons ── */}
                    {activeListTab === 'coupons' && (
                        <div className="table-wrapper">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Name</th>
                                        <th>Percentage</th>
                                        <th>Min Amount</th>
                                        <th>Start Date</th>
                                        <th>End Date</th>
                                        <th>Status</th>
                                        <th>Created At</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedCoupons.length > 0 ? paginatedCoupons.map((coupon) => {
                                        const isExpired = coupon.is_expired === 1
                                        return (
                                            <tr key={coupon.id}>
                                                <td style={{ fontWeight: 600, color: 'var(--text-muted)' }}>#{coupon.id}</td>
                                                <td>
                                                    <span style={{
                                                        display: 'inline-flex', alignItems: 'center', gap: 6,
                                                        padding: '3px 12px', borderRadius: 8,
                                                        background: 'var(--primary-light)', color: 'var(--primary)',
                                                        fontSize: '0.82rem', fontWeight: 700, fontFamily: 'monospace'
                                                    }}>
                                                        <i className="fas fa-ticket-alt" style={{ fontSize: '0.7rem' }} /> {coupon.code}
                                                    </span>
                                                </td>
                                                <td style={{ fontWeight: 700, fontSize: '0.95rem', color: '#10B981' }}>{coupon.percentage}% off</td>
                                                <td style={{ fontWeight: 600 }}>{coupon.min_amount ? `${coupon.min_amount}` : '-'}</td>
                                                <td>{formatDateDisplay(coupon.start_date)}</td>
                                                <td>{formatDateDisplay(coupon.end_date)}</td>
                                                <td>
                                                    <span style={{
                                                        display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 8,
                                                        background: isExpired ? '#FEE2E2' : '#D1FAE5',
                                                        color: isExpired ? '#EF4444' : '#10B981',
                                                        fontSize: '0.78rem', fontWeight: 700
                                                    }}>
                                                        {isExpired ? 'Expired' : 'Active'}
                                                    </span>
                                                </td>
                                                <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{formatDateDisplay(coupon.created_at)}</td>
                                            </tr>
                                        )
                                    }) : (
                                        <tr>
                                            <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                                                <i className="fas fa-ticket-alt" style={{ fontSize: '2rem', opacity: 0.3, display: 'block', marginBottom: 8 }} />
                                                No coupons found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                            {filteredCoupons.length > ITEMS_PER_PAGE && (
                                <div className="pagination-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 20 }}>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                                        Showing {couponStartCount} to {couponEndCount} of {filteredCoupons.length} entries
                                    </span>
                                    <div style={{ display: 'flex', gap: 5 }}>
                                        <button
                                            className={`btn btn-secondary ${safeCouponPage === 1 ? 'disabled' : ''}`}
                                            disabled={safeCouponPage === 1}
                                            onClick={() => setCouponPage(p => Math.max(1, p - 1))}
                                            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                                        >
                                            Prev
                                        </button>
                                        {getPageWindow(safeCouponPage, totalCouponPages).map((p, idx) => (
                                            <button
                                                key={idx}
                                                className={`btn ${safeCouponPage === p ? 'btn-primary' : 'btn-secondary'}`}
                                                disabled={p === '...'}
                                                onClick={() => p !== '...' && setCouponPage(p)}
                                                style={{ padding: '6px 12px', fontSize: '0.8rem', minWidth: 32 }}
                                            >
                                                {p}
                                            </button>
                                        ))}
                                        <button
                                            className={`btn btn-secondary ${safeCouponPage === totalCouponPages ? 'disabled' : ''}`}
                                            disabled={safeCouponPage === totalCouponPages}
                                            onClick={() => setCouponPage(p => Math.min(totalCouponPages, p + 1))}
                                            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Tab: Applied Coupons ── */}
                    {activeListTab === 'applied_coupons' && (
                        <div className="table-wrapper">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Customer</th>
                                        <th>Coupon Name</th>
                                        <th>Discount</th>
                                        <th>Used At</th>
                                        <th>Approved By</th>
                                        <th>Status</th>
                                        <th>Claimed On</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedApplied.length > 0 ? paginatedApplied.map((ac) => {
                                        const s = couponStatusMap[ac.status] || couponStatusMap[0]
                                        return (
                                            <tr key={ac.id}>
                                                <td style={{ fontWeight: 600, color: 'var(--text-muted)' }}>#{ac.id}</td>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                        <div style={{
                                                            width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                                                            background: 'linear-gradient(135deg,#36D1DC,#5B86E5)',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            color: '#fff', fontWeight: 700, fontSize: '0.8rem'
                                                        }}>
                                                            {(ac.Customer?.name || 'C')[0].toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <strong style={{ fontSize: '0.85rem' }}>{ac.Customer?.name || 'Customer'}</strong>
                                                            <small style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.72rem' }}>ID #{ac.cus_id}</small>
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
                                                        <i className="fas fa-ticket-alt" style={{ fontSize: '0.7rem' }} /> {ac.coupon_code}
                                                    </span>
                                                </td>
                                                <td style={{ fontWeight: 700, fontSize: '0.95rem', color: '#10B981' }}>{ac.percentage}% off</td>
                                                <td style={{ fontSize: '0.82rem', fontWeight: 550 }}>{ac.used_at ? formatDateDisplay(ac.used_at) : '-'}</td>
                                                <td style={{ fontSize: '0.82rem' }}>
                                                    {ac.approved_by || '-'} {ac.approved_by_id && <small style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}></small>}
                                                </td>
                                                <td>
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 8, background: s.bg, color: s.color, fontSize: '0.78rem', fontWeight: 700 }}>
                                                        {s.label}
                                                    </span>
                                                </td>
                                                <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{formatDateDisplay(ac.created_at)}</td>
                                            </tr>
                                        )
                                    }) : (
                                        <tr>
                                            <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                                                <i className="fas fa-check-double" style={{ fontSize: '2rem', opacity: 0.3, display: 'block', marginBottom: 8 }} />
                                                No redeemed coupons found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                            {filteredAppliedCoupons.length > ITEMS_PER_PAGE && (
                                <div className="pagination-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 20 }}>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                                        Showing {appliedStartCount} to {appliedEndCount} of {filteredAppliedCoupons.length} entries
                                    </span>
                                    <div style={{ display: 'flex', gap: 5 }}>
                                        <button
                                            className={`btn btn-secondary ${safeAppliedPage === 1 ? 'disabled' : ''}`}
                                            disabled={safeAppliedPage === 1}
                                            onClick={() => setAppliedPage(p => Math.max(1, p - 1))}
                                            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                                        >
                                            Prev
                                        </button>
                                        {getPageWindow(safeAppliedPage, totalAppliedPages).map((p, idx) => (
                                            <button
                                                key={idx}
                                                className={`btn ${safeAppliedPage === p ? 'btn-primary' : 'btn-secondary'}`}
                                                disabled={p === '...'}
                                                onClick={() => p !== '...' && setAppliedPage(p)}
                                                style={{ padding: '6px 12px', fontSize: '0.8rem', minWidth: 32 }}
                                            >
                                                {p}
                                            </button>
                                        ))}
                                        <button
                                            className={`btn btn-secondary ${safeAppliedPage === totalAppliedPages ? 'disabled' : ''}`}
                                            disabled={safeAppliedPage === totalAppliedPages}
                                            onClick={() => setAppliedPage(p => Math.min(totalAppliedPages, p + 1))}
                                            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                                        >
                                            Next
                                        </button>
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
