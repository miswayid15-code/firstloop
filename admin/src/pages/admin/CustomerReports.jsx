import { useEffect, useMemo, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import API from '../../api.js'

// DonutChart component styled exactly like merchant-report branch
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
                    <text x={cx} y={cy - 4} textAnchor="middle" fontSize="13" fontWeight="800" fill={activeSegment.color}>{activeSegment.value}</text>
                    <text x={cx} y={cy + 8} textAnchor="middle" fontSize="7" fill="var(--text-muted)" fontWeight="700" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>{activeSegment.label?.split(' ')[0]}</text>
                </>
            ) : (
                <>
                    <text x={cx} y={cy - 4} textAnchor="middle" fontSize="15" fontWeight="800" fill="var(--text-primary)">{total}</text>
                    <text x={cx} y={cy + 10} textAnchor="middle" fontSize="7" fill="var(--text-muted)" fontWeight="750" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>{centerLabel}</text>
                </>
            )}
        </svg>
    )
}

export default function CustomerReports() {
    const navigate = useNavigate()
    const [showExport, setShowExport] = useState(false)
    const [customerReportData, setCustomerReportData] = useState([])
    const [loadingCustomerReport, setLoadingCustomerReport] = useState(false)

    // Filters matching the API
    const [fromDate, setFromDate] = useState('')
    const [toDate, setToDate] = useState('')
    const [sortBy, setSortBy] = useState('newest')

    const [customerSearch, setCustomerSearch] = useState('')

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1)
    const [rowsPerPage, setRowsPerPage] = useState(10)

    // Interactive Pie/Donut active slice state
    const [activePieCustomerId, setActivePieCustomerId] = useState(null)

    // Helper to format date input to format expected by backend (DD-MM-YYYY)
    const formatDateToDMY = (dateStr) => {
        if (!dateStr) return ''
        const [year, month, day] = dateStr.split('-')
        return `${day}-${month}-${year}`
    }

    const fetchCustomerReport = async () => {
        setLoadingCustomerReport(true)
        try {
            const payload = {
                sort_by: sortBy
            }
            if (fromDate) {
                payload.from_date = formatDateToDMY(fromDate)
            }
            if (toDate) {
                payload.end_date = formatDateToDMY(toDate)
            }

            const response = await API.post('admin/customer-report', payload)
            if (response.data?.status === 1) {
                setCustomerReportData(response.data.data || [])
            } else {
                setCustomerReportData([])
            }
        } catch (error) {
            console.error("Error fetching customer report:", error)
            setCustomerReportData([])
        } finally {
            setLoadingCustomerReport(false)
        }
    }

    useEffect(() => {
        fetchCustomerReport()
    }, [fromDate, toDate, sortBy])

    // Reset pagination to first page when search or filters change
    useEffect(() => {
        setCurrentPage(1)
    }, [fromDate, toDate, sortBy, customerSearch])

    // Filter dynamic rows based on search input (name, email, phone)
    const filteredCustomerRows = useMemo(() => {
        return customerReportData.filter((row) =>
            (row.customer_name || '').toLowerCase().includes(customerSearch.toLowerCase()) ||
            (row.email || '').toLowerCase().includes(customerSearch.toLowerCase()) ||
            (row.phone || '').toLowerCase().includes(customerSearch.toLowerCase())
        )
    }, [customerReportData, customerSearch])

    // Pagination calculations
    const totalPages = Math.ceil(filteredCustomerRows.length / rowsPerPage)
    const paginatedRows = useMemo(() => {
        const start = (currentPage - 1) * rowsPerPage
        return filteredCustomerRows.slice(start, start + rowsPerPage)
    }, [filteredCustomerRows, currentPage, rowsPerPage])

    // Compute dynamic aggregate metrics for summary cards
    const totalCustomers = customerReportData.length
    const activeCustomers = customerReportData.filter(c => c.status === 1 || c.status === '1').length
    const inactiveCustomers = totalCustomers - activeCustomers
    const totalBookings = customerReportData.reduce((sum, c) => sum + (c.total_appointments || 0), 0)
    const totalCouponsApplied = customerReportData.reduce((sum, c) => sum + (c.total_coupon_applied || 0), 0)

    const dynamicSummaryCards = useMemo(() => [
        { title: 'Total Customers', value: totalCustomers.toLocaleString(), trend: '', trendLabel: 'registered users', icon: 'fa-users', gradient: 'bg-gradient-pink' },
        { title: 'Active / Inactive', value: `${activeCustomers.toLocaleString()} / ${inactiveCustomers.toLocaleString()}`, trend: totalCustomers > 0 ? `${((activeCustomers / totalCustomers) * 100).toFixed(1)}%` : '0%', trendLabel: 'active rate', icon: 'fa-user-check', gradient: 'bg-gradient-purple' },
        { title: 'Appts Booked', value: totalBookings.toLocaleString(), trend: '', trendLabel: 'total appointments', icon: 'fa-calendar-alt', gradient: 'bg-gradient-blue' },
        { title: 'Coupons Used', value: totalCouponsApplied.toLocaleString(), trend: '', trendLabel: 'total coupon applications', icon: 'fa-history', gradient: 'bg-gradient-orange' }
    ], [totalCustomers, activeCustomers, inactiveCustomers, totalBookings, totalCouponsApplied])

    // Derive top 5 most active platform users dynamically for detailed data analysis
    const topActiveUsers = useMemo(() => {
        return [...customerReportData]
            .sort((a, b) => {
                const aVal = (a.total_appointments || 0) + (a.total_coupon_applied || 0);
                const bVal = (b.total_appointments || 0) + (b.total_coupon_applied || 0);
                return bVal - aVal;
            })
            .slice(0, 5);
    }, [customerReportData])

    // Form segments for Donut chart matching top 5 users
    const sliceColors = useMemo(() => ['#FF4D80', '#8E2DE2', '#36D1DC', '#FFB75E', '#10B981'], []);
    const sumTotalTop5 = useMemo(() => {
        return topActiveUsers.reduce((sum, u) => sum + (u.total_appointments || 0) + (u.total_coupon_applied || 0), 0);
    }, [topActiveUsers]);

    const pieSegments = useMemo(() => {
        return topActiveUsers.map((user, index) => {
            const val = (user.total_appointments || 0) + (user.total_coupon_applied || 0);
            return {
                id: user.customer_id,
                label: user.customer_name || 'N/A',
                value: val,
                color: sliceColors[index % sliceColors.length]
            };
        });
    }, [topActiveUsers, sliceColors]);

    const activePieCustomer = useMemo(() => {
        return activePieCustomerId !== null ? topActiveUsers.find(u => u.customer_id === activePieCustomerId) : null
    }, [topActiveUsers, activePieCustomerId]);

    const activePieIdx = useMemo(() => {
        return activePieCustomerId !== null ? topActiveUsers.findIndex(u => u.customer_id === activePieCustomerId) : -1
    }, [topActiveUsers, activePieCustomerId]);

    const handleExportClick = () => {
        setShowExport((prev) => !prev)
    }

    const exportToCSV = (data, filename) => {
        const headers = ["Customer Name", "Phone", "Email", "Status", "Bookings", "Coupons Applied", "Joined Date"];
        const rows = data.map(row => [
            `"${(row.customer_name || '').replace(/"/g, '""')}"`,
            `"${(row.phone || '').replace(/"/g, '""')}"`,
            `"${(row.email || '').replace(/"/g, '""')}"`,
            `"${row.status == 1 ? 'Active' : 'Disabled'}"`,
            row.total_appointments || 0,
            row.total_coupon_applied || 0,
            `"${row.created_at ? new Date(row.created_at).toLocaleDateString() : ''}"`
        ]);

        const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExport = (format) => {
        setShowExport(false);
        if (format === 'CSV' || format === 'Excel') {
            const filename = format === 'CSV' ? 'customer_performance_report.csv' : 'customer_performance_report.csv';
            exportToCSV(filteredCustomerRows, filename);
        } else if (format === 'PDF') {
            window.print();
        }
    };

    const resetFilters = () => {
        setFromDate('')
        setToDate('')
        setSortBy('newest')
    }

    return (
        <div className="reports-grid">
            <div className="reports-main-content">
                <div className="flex-between" style={{ marginBottom: 24, gap: 20, flexWrap: 'wrap' }}>
                    <div className="tab-filters" style={{ marginBottom: 0, padding: 4 }}>
                        <NavLink
                            to="/merchant-reports"
                            className={({ isActive }) => `tab-btn${isActive ? ' active' : ''}`}
                        >
                            <i className="fas fa-store"></i> Merchant Reports
                        </NavLink>
                        <NavLink
                            to="/customer-reports"
                            className={({ isActive }) => `tab-btn${isActive ? ' active' : ''}`}
                        >
                            <i className="fas fa-users"></i> Customer Reports
                        </NavLink>
                    </div>

                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <div className="export-group" style={{ position: 'relative' }}>
                            <button className="btn btn-secondary" style={{ height: 40 }} onClick={handleExportClick}>
                                <i className="fas fa-file-export"></i> Export Report <i className="fas fa-chevron-down" style={{ fontSize: '0.7rem', marginLeft: 4 }} />
                            </button>
                            <div className={`export-dropdown${showExport ? ' active' : ''}`} style={{ opacity: showExport ? 1 : 0, visibility: showExport ? 'visible' : 'hidden', transform: showExport ? 'translateY(0)' : 'translateY(10px)' }}>
                                {['CSV', 'Excel', 'PDF'].map((item) => (
                                    <div key={item} className="export-dropdown-item" onClick={() => handleExport(item)}>
                                        <i className={`fas fa-file-${item === 'PDF' ? 'pdf' : 'csv'}`}></i> {item}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div id="customer-reports-container" className="report-section-container active-report">
                    <div className="filter-panel">
                        <div className="flex-between" style={{ marginBottom: 16 }}>
                            <h4 style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Filter Customer Reports</h4>
                            <button className="btn-link" style={{ color: 'var(--primary)', fontSize: '0.8rem', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }} onClick={resetFilters}>
                                Reset Filters
                            </button>
                        </div>
                        <div className="filter-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label" style={{ position: 'static', fontSize: '0.75rem', transform: 'none', marginBottom: 6 }}>From Date</label>
                                <input
                                    type="date"
                                    className="form-control"
                                    style={{ height: 40, padding: '6px 12px' }}
                                    value={fromDate}
                                    onChange={(e) => setFromDate(e.target.value)}
                                />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label" style={{ position: 'static', fontSize: '0.75rem', transform: 'none', marginBottom: 6 }}>To Date</label>
                                <input
                                    type="date"
                                    className="form-control"
                                    style={{ height: 40, padding: '6px 12px' }}
                                    value={toDate}
                                    onChange={(e) => setToDate(e.target.value)}
                                />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label" style={{ position: 'static', fontSize: '0.75rem', transform: 'none', marginBottom: 6 }}>Sort By</label>
                                <select
                                    className="form-control"
                                    style={{ height: 40, padding: '6px 12px' }}
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                >
                                    <option value="newest">Newest Joined</option>
                                    <option value="oldest">Oldest Joined</option>
                                    <option value="highest_appointment">Highest Appointments</option>
                                    <option value="lowest_appointment">Lowest Appointments</option>
                                    <option value="highest_coupon">Highest Coupons Applied</option>
                                    <option value="lowest_coupon">Lowest Coupons Applied</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="reports-stats-grid" style={{ marginBottom: 24 }}>
                        {dynamicSummaryCards.map((card) => (
                            <div key={card.title} className={`card stat-card ${card.gradient}`}>
                                <i className={`fas ${card.icon} stat-bg-icon`} />
                                <div className="stat-header">
                                    <div className="flex-column">
                                        <span className="stat-title">{card.title}</span>
                                        <span className="stat-value">{card.value}</span>
                                    </div>
                                </div>
                                <div className="stat-footer">
                                    {card.trend ? (
                                        <span className="stat-trend up"><i className="fas fa-plus" /> {card.trend}</span>
                                    ) : null}
                                    <span className="stat-desc">{card.trendLabel}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="card" style={{ marginBottom: 24 }}>
                        <div className="table-header-controls" style={{ marginBottom: 20 }}>
                            <div>
                                <h3 className="card-title">Customer Activity Audit Log</h3>
                                <p className="card-subtitle">Comprehensive analytical log of user engagement, bookings, and coupon usages</p>
                            </div>
                            <div className="search-wrapper" style={{ marginBottom: 0, maxWidth: 320, width: '100%' }}>
                                <i className="fas fa-search search-icon" />
                                <input
                                    type="text"
                                    className="search-input"
                                    placeholder="Search customers..."
                                    value={customerSearch}
                                    onChange={(event) => setCustomerSearch(event.target.value)}
                                />
                            </div>
                        </div>
                        <div className="table-wrapper">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Customer Name</th>
                                        <th>Phone Number</th>
                                        <th>Email Address</th>
                                        <th>Bookings</th>
                                        <th>Coupons Applied</th>
                                        <th>Joined Date</th>
                                        <th>Status</th>
                                        <th style={{ textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loadingCustomerReport ? (
                                        <tr>
                                            <td colSpan="8" align="center" style={{ padding: '40px' }}>
                                                <i className="fas fa-spinner fa-spin" style={{ marginRight: 8 }} /> Loading report data...
                                            </td>
                                        </tr>
                                    ) : paginatedRows.length > 0 ? (
                                        paginatedRows.map((row) => (
                                            <tr key={row.customer_id}>
                                                <td>
                                                    <strong
                                                        style={{ cursor: 'pointer', color: 'var(--primary)', textDecoration: 'underline' }}
                                                        onClick={() => navigate(`/customer-report/${row.customer_id}`)}
                                                    >
                                                        {row.customer_name || 'N/A'}
                                                    </strong>
                                                </td>
                                                <td>{row.phone || 'N/A'}</td>
                                                <td>{row.email || 'N/A'}</td>
                                                <td>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                        <strong>{row.total_appointments || 0} Total</strong>
                                                        <small style={{ color: 'var(--text-muted)' }}>
                                                            Completed: <span style={{ color: '#10B981', fontWeight: 600 }}>{row.completed_appointments || 0}</span>
                                                        </small>
                                                        <small style={{ color: 'var(--text-muted)' }}>
                                                            Pending: <span style={{ color: '#F59E0B', fontWeight: 600 }}>{row.pending_appointments || 0}</span>
                                                        </small>
                                                        <small style={{ color: 'var(--text-muted)' }}>
                                                            Approved: <span style={{ color: '#3B82F6', fontWeight: 600 }}>{row.approved_appointments || 0}</span>
                                                        </small>
                                                        <small style={{ color: 'var(--text-muted)' }}>
                                                            Cancelled: <span style={{ color: '#EF4444', fontWeight: 600 }}>{(row.cancelled_appointments || 0) + (row.rejected_appointments || 0)}</span>
                                                        </small>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                        <strong>{row.total_coupon_applied || 0} Total</strong>
                                                        <small style={{ color: 'var(--text-muted)' }}>
                                                            Approved: <span style={{ color: '#10B981', fontWeight: 600 }}>{row.approved_coupon || 0}</span>
                                                        </small>
                                                        <small style={{ color: 'var(--text-muted)' }}>
                                                            Pending: <span style={{ color: '#F59E0B', fontWeight: 600 }}>{row.pending_coupon || 0}</span>
                                                        </small>
                                                        <small style={{ color: 'var(--text-muted)' }}>
                                                            Rejected: <span style={{ color: '#EF4444', fontWeight: 600 }}>{row.rejected_coupon || 0}</span>
                                                        </small>
                                                    </div>
                                                </td>
                                                <td>{row.created_at ? new Date(row.created_at).toLocaleDateString() : 'N/A'}</td>
                                                <td>
                                                    <span className={`badge ${row.status == 1 ? 'approved' : 'declined'}`}>
                                                        {row.status == 1 ? 'Active' : 'Disabled'}
                                                    </span>
                                                </td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <button
                                                        className="btn btn-icon view"
                                                        title="View Detailed Customer Report"
                                                        onClick={() => navigate(`/customer-report/${row.customer_id}`)}
                                                    >
                                                        <i className="fas fa-eye" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="8" align="center" style={{ padding: '40px' }}>
                                                No customer reports found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Footer */}
                        {filteredCustomerRows.length > 0 && (
                            <div className="flex-between" style={{ marginTop: 20, flexWrap: 'wrap', gap: 16 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Show</span>
                                    <select
                                        className="form-control"
                                        style={{ width: 70, height: 32, padding: '0 8px', fontSize: '0.85rem', background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
                                        value={rowsPerPage}
                                        onChange={(e) => {
                                            setRowsPerPage(Number(e.target.value))
                                            setCurrentPage(1)
                                        }}
                                    >
                                        {[5, 10, 25, 50].map(val => (
                                            <option key={val} value={val}>{val}</option>
                                        ))}
                                    </select>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>entries</span>
                                </div>

                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                    Showing {(currentPage - 1) * rowsPerPage + 1} to {Math.min(currentPage * rowsPerPage, filteredCustomerRows.length)} of {filteredCustomerRows.length} entries
                                </div>

                                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                    <button
                                        className="btn btn-secondary"
                                        style={{ height: 32, padding: '0 12px', fontSize: '0.8rem' }}
                                        disabled={currentPage === 1}
                                        onClick={() => setCurrentPage(prev => prev - 1)}
                                    >
                                        Previous
                                    </button>
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                        <button
                                            key={page}
                                            className={`btn ${currentPage === page ? 'btn-primary' : 'btn-secondary'}`}
                                            style={{ height: 32, width: 32, padding: 0, fontSize: '0.8rem', minWidth: 32 }}
                                            onClick={() => setCurrentPage(page)}
                                        >
                                            {page}
                                        </button>
                                    ))}
                                    <button
                                        className="btn btn-secondary"
                                        style={{ height: 32, padding: '0 12px', fontSize: '0.8rem' }}
                                        disabled={currentPage === totalPages || totalPages === 0}
                                        onClick={() => setCurrentPage(prev => prev + 1)}
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Top Active Platform Users UI for Data Analysis */}
                    <div className="card" style={{ marginBottom: 24, padding: 24 }}>
                        <div style={{ marginBottom: 20 }}>
                            <h3 className="card-title">Top Active Platform Users Analytics</h3>
                            <p className="card-subtitle" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Detailed engagement distribution and interaction shares for the top 5 most active portal accounts</p>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '10px 0' }}>
                            {topActiveUsers.length > 0 ? (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 48, flexWrap: 'wrap', width: '100%', maxWidth: '700px' }}>
                                    {/* SVG Donut Chart */}
                                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
                                        <DonutChart
                                            size={220}
                                            segments={pieSegments}
                                            onSliceClick={(cid) => setActivePieCustomerId(cid)}
                                            activeId={activePieCustomerId}
                                            centerLabel="Interactions"
                                        />
                                    </div>

                                    {/* Legend Map */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 260, flex: 1 }}>
                                        {pieSegments.map((segment) => (
                                            <div
                                                key={segment.id}
                                                className="flex-between"
                                                style={{
                                                    fontSize: '0.85rem',
                                                    cursor: 'pointer',
                                                    padding: '8px 12px',
                                                    borderRadius: 8,
                                                    background: activePieCustomerId === segment.id ? 'rgba(0,0,0,0.03)' : 'var(--bg-primary)',
                                                    border: '1px solid var(--border-color)',
                                                    borderColor: activePieCustomerId === segment.id ? segment.color : 'var(--border-color)',
                                                    transition: 'all 0.2s ease'
                                                }}
                                                onClick={() => setActivePieCustomerId(activePieCustomerId === segment.id ? null : segment.id)}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                                                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: segment.color, flexShrink: 0 }} />
                                                    <span style={{ fontWeight: 600, color: activePieCustomerId === segment.id ? 'var(--primary)' : 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {segment.label}
                                                    </span>
                                                </div>
                                                <span style={{ fontWeight: 700, color: 'var(--text-primary)', marginLeft: 8 }}>
                                                    {segment.value} ({sumTotalTop5 > 0 ? ((segment.value / sumTotalTop5) * 100).toFixed(1) : 0}%)
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                                    No activity records found
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Customer Details Modal Popup ── */}
                    {activePieCustomer && (() => {
                        const color = sliceColors[activePieIdx % sliceColors.length]
                        const total = (activePieCustomer.total_appointments || 0) + (activePieCustomer.total_coupon_applied || 0)
                        const sharePercent = sumTotalTop5 > 0 ? Math.round((total / sumTotalTop5) * 100) : 0

                        return (
                            <div className="modal active" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 1100 }}>
                                <div className="modal-backdrop" onClick={() => setActivePieCustomerId(null)} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }} />
                                <div className="modal-content" style={{ position: 'relative', width: '90%', maxWidth: '460px', borderRadius: '20px', border: `1px solid ${color}40`, animation: 'modalScaleIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)', zIndex: 1101, overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.15)' }}>
                                    <style>{`
                                        @keyframes modalScaleIn {
                                            from { opacity: 0; transform: scale(0.92) translateY(10px); }
                                            to { opacity: 1; transform: scale(1) translateY(0); }
                                        }
                                    `}</style>
                                    <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${color}20`, background: `${color}08`, padding: '16px 20px' }}>
                                        <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                            <div style={{
                                                width: 42, height: 42, borderRadius: 14,
                                                background: color,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: '#fff', fontWeight: 800, fontSize: '1.05rem',
                                                boxShadow: `0 4px 12px ${color}35`
                                            }}>
                                                {activePieCustomer.customer_name?.[0]?.toUpperCase() || 'C'}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 750, fontSize: '1.1rem', color: 'var(--text-primary)', lineHeight: 1.2 }}>{activePieCustomer.customer_name}</div>
                                                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 500, marginTop: 2 }}>
                                                    Rank #{activePieIdx + 1} • Customer ID: #{activePieCustomer.customer_id}
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setActivePieCustomerId(null)}
                                            style={{
                                                background: 'none', border: 'none', cursor: 'pointer',
                                                color: 'var(--text-muted)', fontSize: '1.2rem', padding: 6,
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
                                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Share of top 5 users activity</span>
                                                <span style={{ fontSize: '0.88rem', fontWeight: 850, color: color }}>{sharePercent}%</span>
                                            </div>
                                            <div style={{ height: 10, borderRadius: 5, background: 'var(--bg-primary)', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.03)' }}>
                                                <div style={{ width: `${sharePercent}%`, height: '100%', background: color, borderRadius: 5, transition: 'width 0.6s cubic-bezier(0.1, 0.8, 0.3, 1)' }} />
                                            </div>
                                        </div>

                                        {/* Stats Grid */}
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
                                            {[
                                                { label: 'Bookings', value: activePieCustomer.total_appointments || 0, icon: 'fa-calendar-check', color: '#36D1DC' },
                                                { label: 'Coupons Used', value: activePieCustomer.total_coupon_applied || 0, icon: 'fa-ticket-alt', color: '#FF4D80' },
                                                { label: 'Total Actions', value: total, icon: 'fa-chart-bar', color: color },
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

                                        {/* Contact Information block */}
                                        <div style={{
                                            fontSize: '0.82rem',
                                            color: 'var(--text-secondary)',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: 10,
                                            background: 'var(--bg-primary)',
                                            padding: 16,
                                            borderRadius: 12,
                                            border: '1px solid var(--border-color)'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <i className="fas fa-envelope" style={{ color: color, width: 16 }} />
                                                <strong>Email:</strong> <span style={{ color: 'var(--text-primary)' }}>{activePieCustomer.email || 'N/A'}</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <i className="fas fa-phone" style={{ color: color, width: 16 }} />
                                                <strong>Phone:</strong> <span style={{ color: 'var(--text-primary)' }}>{activePieCustomer.full_phone || 'N/A'}</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <i className="fas fa-info-circle" style={{ color: color, width: 16 }} />
                                                <strong>Status:</strong>
                                                <span className={`badge ${activePieCustomer.status == 1 ? 'approved' : 'declined'}`} style={{ margin: 0, padding: '2px 8px', fontSize: '0.7rem' }}>
                                                    {activePieCustomer.status == 1 ? 'Active' : 'Disabled'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="modal-footer" style={{ background: 'var(--bg-primary)', padding: '12px 20px', display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid rgba(0,0,0,0.03)' }}>
                                        <button className="btn btn-secondary" onClick={() => setActivePieCustomerId(null)} style={{ padding: '8px 16px', fontSize: '0.82rem', height: 36 }}>
                                            Close Details
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )
                    })()}
                </div>
            </div>
        </div>
    )
}
