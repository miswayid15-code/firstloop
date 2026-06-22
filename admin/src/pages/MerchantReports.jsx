import { useEffect, useMemo, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import API from '../api.js'

export default function MerchantReports() {
    const navigate = useNavigate()
    const [showExport, setShowExport] = useState(false)
    const [merchantReportData, setMerchantReportData] = useState([])
    const [loadingMerchantReport, setLoadingMerchantReport] = useState(false)
    const [fromDate, setFromDate] = useState('')
    const [toDate, setToDate] = useState('')
    const [sortBy, setSortBy] = useState('highest_appointment')
    const [merchantSearch, setMerchantSearch] = useState('')

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
                                {['CSV', 'Excel', 'PDF', 'Print', 'Email', 'Schedule'].map((item) => (
                                    <div key={item} className="export-dropdown-item" onClick={() => window.alert(`Exporting ${item}`)}>
                                        <i className={`fas fa-file-${item === 'Print' ? 'print' : item.toLowerCase()}`}></i> {item}
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
                                    <option value="newest">Newest Joined</option>
                                    <option value="oldest">Oldest Joined</option>
                                    <option value="highest_appointment">Highest Appointments</option>
                                    <option value="lowest_appointment">Lowest Appointments</option>
                                    <option value="highest_completed_appointment">Highest Completed Appointments</option>
                                    <option value="lowest_completed_appointment">Lowest Completed Appointments</option>
                                    <option value="highest_pending_appointment">Highest Pending Appointments</option>
                                    <option value="lowest_pending_appointment">Lowest Pending Appointments</option>
                                    <option value="highest_coupon">Highest Coupons Offered</option>
                                    <option value="lowest_coupon">Lowest Coupons Offered</option>
                                    <option value="highest_active_coupon">Highest Active Coupons</option>
                                    <option value="lowest_active_coupon">Lowest Active Coupons</option>
                                    <option value="highest_redeemed">Highest Coupons Redeemed</option>
                                    <option value="lowest_redeemed">Lowest Coupons Redeemed</option>
                                    <option value="highest_customer">Highest Customers</option>
                                    <option value="lowest_customer">Lowest Customers</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="reports-stats-grid">
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
                                    ) : filteredMerchantRows.length > 0 ? (
                                        filteredMerchantRows.map((row) => (
                                            <tr key={row.merchant_id}>
                                                <td>
                                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                        <strong>{row.business_name || row.owner_name || '-'}</strong>
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
                    </div>
                </div>
            </div>
        </div>
    )
}
