import { useEffect, useMemo, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import API from '../../api.js'

export default function MerchantReports() {
    const navigate = useNavigate()
    const [showExport, setShowExport] = useState(false)
    const [merchantReportData, setMerchantReportData] = useState([])
    const [loadingMerchantReport, setLoadingMerchantReport] = useState(false)
    const [fromDate, setFromDate] = useState('')
    const [toDate, setToDate] = useState('')
    const [sortBy, setSortBy] = useState('highest_appointment')
    const [merchantSearch, setMerchantSearch] = useState('')

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1)
    const [rowsPerPage, setRowsPerPage] = useState(10)

    const formatDateToDMY = (dateStr) => {
        if (!dateStr) return '';
        const [year, month, day] = dateStr.split('-');
        return `${day}-${month}-${year}`;
    }

    const fetchMerchantReport = async () => {
        setLoadingMerchantReport(true)
        try {
            const payload = {
                sort_by: sortBy
            }
            if (fromDate) {
                payload.from_date = formatDateToDMY(fromDate)
            }
            if (toDate) {
                payload.to_date = formatDateToDMY(toDate)
            }

            const response = await API.post('admin/merchant-report', payload)
            if (response.data?.status === 1) {
                setMerchantReportData(response.data.data || [])
            } else {
                setMerchantReportData([])
            }
        } catch (error) {
            console.error("Error fetching merchant report:", error)
            setMerchantReportData([])
        } finally {
            setLoadingMerchantReport(false)
        }
    }

    useEffect(() => {
        fetchMerchantReport()
    }, [fromDate, toDate, sortBy])

    // Reset pagination to first page when search or filters change
    useEffect(() => {
        setCurrentPage(1)
    }, [fromDate, toDate, sortBy, merchantSearch])

    const filteredMerchantRows = useMemo(
        () => merchantReportData.filter((row) =>
            (row.business_name || '').toLowerCase().includes(merchantSearch.toLowerCase()) ||
            (row.owner_name || '').toLowerCase().includes(merchantSearch.toLowerCase()) ||
            (row.cat_name || '').toLowerCase().includes(merchantSearch.toLowerCase()) ||
            (row.email || '').toLowerCase().includes(merchantSearch.toLowerCase()) ||
            (row.phone || '').toLowerCase().includes(merchantSearch.toLowerCase())
        ),
        [merchantReportData, merchantSearch]
    )

    // Pagination calculations
    const totalPages = Math.ceil(filteredMerchantRows.length / rowsPerPage)
    const paginatedRows = useMemo(() => {
        const start = (currentPage - 1) * rowsPerPage
        return filteredMerchantRows.slice(start, start + rowsPerPage)
    }, [filteredMerchantRows, currentPage, rowsPerPage])

    const totalMerchants = merchantReportData.length
    const activeMerchants = merchantReportData.filter(m => m.status === 1 || m.status === '1').length
    const inactiveMerchants = totalMerchants - activeMerchants
    const totalBranches = merchantReportData.reduce((sum, m) => sum + (m.total_branches || 0), 0)

    const dynamicMerchantSummaryCards = useMemo(() => [
        { title: 'Total Merchants', value: totalMerchants, trend: '', trendLabel: 'registered merchants', icon: 'fa-store', gradient: 'bg-gradient-pink' },
        { title: 'Active / Inactive', value: `${activeMerchants} / ${inactiveMerchants}`, trend: totalMerchants > 0 ? `${((activeMerchants / totalMerchants) * 100).toFixed(1)}%` : '0%', trendLabel: 'active rate', icon: 'fa-check-circle', gradient: 'bg-gradient-purple' },
        { title: 'Total Outlets', value: totalBranches, trend: '', trendLabel: 'active outlets', icon: 'fa-map-marker-alt', gradient: 'bg-gradient-blue' }
    ], [totalMerchants, activeMerchants, inactiveMerchants, totalBranches])

    const handleExportClick = () => {
        setShowExport((prev) => !prev)
    }

    const exportToCSV = (data, filename) => {
        const headers = ["Business Name", "Owner Name", "Category", "Phone", "Email", "Status", "Total Branches", "Total Coupons", "Total Appointments", "Total Customers", "Total Receptionists", "Joined Date"];
        const rows = data.map(row => [
            `"${(row.business_name || '').replace(/"/g, '""')}"`,
            `"${(row.owner_name || '').replace(/"/g, '""')}"`,
            `"${(row.cat_name || '').replace(/"/g, '""')}"`,
            `"${(row.phone || '').replace(/"/g, '""')}"`,
            `"${(row.email || '').replace(/"/g, '""')}"`,
            `"${row.status == 1 ? 'Active' : 'Inactive'}"`,
            row.total_branches || 0,
            row.total_coupons || 0,
            row.total_appointments || 0,
            row.total_customers || 0,
            row.total_receptionists || 0,
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
            const filename = format === 'CSV' ? 'merchant_performance_report.csv' : 'merchant_performance_report.csv';
            exportToCSV(filteredMerchantRows, filename);
        } else if (format === 'PDF') {
            window.print();
        }
    };

    const resetFilters = () => {
        setFromDate('')
        setToDate('')
        setSortBy('highest_appointment')
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

                <div id="merchant-reports-container" className="report-section-container active-report">
                    <div className="filter-panel">
                        <div className="flex-between" style={{ marginBottom: 16 }}>
                            <h4 style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Filter Merchant Analytics</h4>
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
                                    <option value="highest_appointment">Highest Appointments</option>
                                    <option value="lowest_appointment">Lowest Appointments</option>
                                    <option value="highest_coupon">Highest Coupons Claimed</option>
                                    <option value="lowest_coupon">Lowest Coupons Claimed</option>
                                    <option value="highest_customer">Highest Customers</option>
                                    <option value="lowest_customer">Lowest Customers</option>
                                    <option value="newest">Newest Registered</option>
                                    <option value="oldest">Oldest Registered</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="reports-stats-grid" style={{ marginBottom: 24 }}>
                        {dynamicMerchantSummaryCards.map((card) => (
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

                    <div className="card">
                        <div className="table-header-controls" style={{ marginBottom: 20 }}>
                            <div>
                                <h3 className="card-title">Merchant Performance Table</h3>
                                <p className="card-subtitle">Comprehensive merchant analytics audit</p>
                            </div>
                            <div className="search-wrapper" style={{ marginBottom: 0, maxWidth: 320, width: '100%' }}>
                                <i className="fas fa-search search-icon" />
                                <input
                                    type="text"
                                    className="search-input"
                                    placeholder="Search merchants..."
                                    value={merchantSearch}
                                    onChange={(event) => setMerchantSearch(event.target.value)}
                                />
                            </div>
                        </div>
                        <div className="table-wrapper">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Merchant / Contact</th>
                                        <th>Category</th>
                                        <th>Branches</th>
                                        <th>Coupons Redeemed</th>
                                        <th>Appointments</th>
                                        <th>Customers</th>
                                        <th>Receptionists</th>
                                        <th>Status</th>
                                        <th>Joined Date</th>
                                        <th style={{ textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loadingMerchantReport ? (
                                        <tr>
                                            <td colSpan="10" align="center" style={{ padding: '40px' }}>
                                                <i className="fas fa-spinner fa-spin" style={{ marginRight: 8 }} /> Loading report data...
                                            </td>
                                        </tr>
                                    ) : paginatedRows.length > 0 ? (
                                        paginatedRows.map((row) => (
                                            <tr key={row.merchant_id}>
                                                <td>
                                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                        <strong
                                                            style={{ cursor: 'pointer', color: 'var(--primary)', textDecoration: 'underline' }}
                                                            onClick={() => navigate(`/merchant-report/${row.merchant_id}`)}
                                                        >
                                                            {row.business_name || row.owner_name || '-'}
                                                        </strong>
                                                        {row.owner_name && <small style={{ color: 'var(--text-muted)' }}>Owner: {row.owner_name}</small>}
                                                        <small style={{ color: 'var(--text-muted)' }}>{row.email} | {row.phone}</small>
                                                    </div>
                                                </td>
                                                <td>{row.cat_name || '-'}</td>
                                                <td>{row.total_branches}</td>
                                                <td>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                        <strong>{row.total_coupons} Total</strong>
                                                        <small style={{ color: 'var(--text-muted)' }}>
                                                            Active: <span style={{ color: '#10B981', fontWeight: 600 }}>{row.total_active_coupons || 0}</span>
                                                        </small>
                                                        <small style={{ color: 'var(--text-muted)' }}>
                                                            Inactive: <span style={{ color: '#94A3B8', fontWeight: 600 }}>{row.total_inactive_coupons || 0}</span>
                                                        </small>
                                                        <small style={{ color: 'var(--text-muted)' }}>
                                                            Redeemed: <span style={{ color: '#8E2DE2', fontWeight: 600 }}>{row.total_coupon_redeemed || 0}</span>
                                                        </small>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                        <strong>{row.total_appointments} Total</strong>
                                                        <small style={{ color: 'var(--text-muted)' }}>
                                                            Completed: <span style={{ color: '#10B981', fontWeight: 600 }}>{row.total_completed_appointments || 0}</span>
                                                        </small>
                                                        <small style={{ color: 'var(--text-muted)' }}>
                                                            Pending: <span style={{ color: '#F59E0B', fontWeight: 600 }}>{row.total_pending_appointments || 0}</span>
                                                        </small>
                                                        <small style={{ color: 'var(--text-muted)' }}>
                                                            Approved: <span style={{ color: '#3B82F6', fontWeight: 600 }}>{row.total_approved_appointments || 0}</span>
                                                        </small>
                                                        <small style={{ color: 'var(--text-muted)' }}>
                                                            Cancelled: <span style={{ color: '#EF4444', fontWeight: 600 }}>{(row.total_cancelled_appointments || 0) + (row.total_rejected_appointments || 0)}</span>
                                                        </small>
                                                    </div>
                                                </td>
                                                <td>{row.total_customers}</td>
                                                <td>{row.total_receptionists}</td>
                                                <td>
                                                    <span className={`badge ${row.status == 1 ? 'approved' : 'declined'}`}>
                                                        {row.status == 1 ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td>{row.created_at ? new Date(row.created_at).toLocaleDateString() : '-'}</td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <button
                                                        className="btn btn-icon view"
                                                        title="View Detailed Report"
                                                        onClick={() => navigate(`/merchant-report/${row.merchant_id}`)}
                                                    >
                                                        <i className="fas fa-eye" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="10" align="center" style={{ padding: '40px' }}>
                                                No merchant reports found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Footer */}
                        {filteredMerchantRows.length > 0 && (
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
                                    Showing {(currentPage - 1) * rowsPerPage + 1} to {Math.min(currentPage * rowsPerPage, filteredMerchantRows.length)} of {filteredMerchantRows.length} entries
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
                </div>
            </div>
        </div>
    )
}
