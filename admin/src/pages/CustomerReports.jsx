import { useMemo, useState } from 'react'
import { NavLink } from 'react-router-dom'

const customerSummaryCards = [
    { title: 'Total Customers', value: '24,500', trend: '+1.8K', trendLabel: 'this month', icon: 'fa-users', gradient: 'bg-gradient-pink' },
    { title: 'Active Customers', value: '12,450', trend: '+50.8%', trendLabel: 'monthly active', icon: 'fa-user-check', gradient: 'bg-gradient-purple' },
    { title: 'Appts Booked', value: '15,900', trend: '+320', trendLabel: 'today', icon: 'fa-calendar-alt', gradient: 'bg-gradient-blue' },
    { title: 'Retention Rate', value: '84.6%', trend: 'Robust', trendLabel: 'retention', icon: 'fa-history', gradient: 'bg-gradient-orange' }
]

const customerMetricCards = [
    { value: '24,500', label: 'Total Enrolled', color: '#FF4D80' },
    { value: '12,450', label: 'Active This Month', color: '#8E2DE2' },
    { value: '84.6%', label: 'Average Retention', color: '#36D1DC' },
    { value: '15,900', label: 'Bookings Completed', color: '#FFB75E' },
]

const customerLeaderboard = [
    { rank: 1, name: 'Fatima Al Mansoori', value: '42 claims', width: '85%' },
    { rank: 2, name: 'Abine M.', value: '36 claims', width: '70%', fill: 'linear-gradient(135deg,#8E2DE2,#4A00E0)' },
    { rank: 3, name: 'John Smith', value: '22 claims', width: '50%', fill: 'linear-gradient(135deg,#36D1DC,#5B86E5)' }
]

const customerTableRows = [
    { name: 'Fatima Al Mansoori', phone: '+971 50 123 4567', email: 'fatima@domain.ae', bookings: '18 bookings', coupons: '42 coupons', chats: '125 chats', lastActive: 'Today', joined: '2025-09-12', status: 'Active' },
    { name: 'Abine M.', phone: '+971 52 987 6543', email: 'abine@dealora.com', bookings: '15 bookings', coupons: '36 coupons', chats: '94 chats', lastActive: 'Yesterday', joined: '2025-10-02', status: 'Active' },
    { name: 'John Smith', phone: '+971 55 456 7890', email: 'john.smith@gmail.com', bookings: '8 bookings', coupons: '22 coupons', chats: '18 chats', lastActive: '3 days ago', joined: '2025-11-20', status: 'Active' },
    { name: 'Sarah Connor', phone: '+971 58 111 2222', email: 'sarah.c@skyline.org', bookings: '0 bookings', coupons: '0 coupons', chats: '2 chats', lastActive: '2 weeks ago', joined: '2026-02-18', status: 'Disabled' }
]

export default function CustomerReports() {
    const [showExport, setShowExport] = useState(false)
    const [customerFilters, setCustomerFilters] = useState({
        date: 'Last 30 Days',
        status: 'All Customers',
        category: 'All Users',
        frequency: 'Any Frequency',
        offers: 'Any Usage'
    })
    const [customerSearch, setCustomerSearch] = useState('')

    const filteredCustomerRows = useMemo(
        () => customerTableRows.filter((row) =>
            row.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
            row.email.toLowerCase().includes(customerSearch.toLowerCase())
        ),
        [customerSearch]
    )

    const handleExportClick = () => {
        setShowExport((prev) => !prev)
    }

    const resetFilters = () => {
        setCustomerFilters({
            date: 'Last 30 Days',
            status: 'All Customers',
            category: 'All Users',
            frequency: 'Any Frequency',
            offers: 'Any Usage'
        })
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

                <div id="customer-reports-container" className="report-section-container active-report">
                    <div className="filter-panel">
                        <div className="flex-between" style={{ marginBottom: 16 }}>
                            <h4 style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Filter Customer Reports</h4>
                            <button className="btn-link" style={{ color: 'var(--primary)', fontSize: '0.8rem', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }} onClick={resetFilters}>
                                Reset Filters
                            </button>
                        </div>
                        <div className="filter-grid">
                            {[
                                { label: 'Date Range', name: 'date', options: ['Last 30 Days', 'Last 7 Days', 'This Month', 'All Time'] },
                                { label: 'Account Status', name: 'status', options: ['All Customers', 'Active', 'Disabled'] },
                                { label: 'User Category', name: 'category', options: ['All Users', 'New Users (30d)', 'Returning Users'] },
                                { label: 'Booking Freq', name: 'frequency', options: ['Any Frequency', 'High (> 5 bookings)', 'Medium (1-5 bookings)', 'Zero Bookings'] },
                                { label: 'Offers Used', name: 'offers', options: ['Any Usage', '> 10 Coupons', '1 - 10 Coupons', 'None Used'] }
                            ].map((filter) => (
                                <div key={filter.name} className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label" style={{ position: 'static', fontSize: '0.75rem', transform: 'none', marginBottom: 6 }}>{filter.label}</label>
                                    <select
                                        className="form-control"
                                        style={{ height: 40, padding: '6px 12px' }}
                                        value={customerFilters[filter.name]}
                                        onChange={(event) => setCustomerFilters((prev) => ({ ...prev, [filter.name]: event.target.value }))}
                                    >
                                        {filter.options.map((option) => (
                                            <option key={option} value={option}>{option}</option>
                                        ))}
                                    </select>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="reports-stats-grid">
                        {customerSummaryCards.map((card) => (
                            <div key={card.title} className={`card stat-card ${card.gradient}`}>
                                <i className={`fas ${card.icon} stat-bg-icon`} />
                                <div className="stat-header">
                                    <div className="flex-column">
                                        <span className="stat-title">{card.title}</span>
                                        <span className="stat-value">{card.value}</span>
                                    </div>
                                </div>
                                <div className="stat-footer">
                                    <span className="stat-trend up"><i className="fas fa-plus" /> {card.trend}</span>
                                    <span className="stat-desc">{card.trendLabel}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="adv-metrics-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                        {customerMetricCards.map((card) => (
                            <div key={card.label} className="adv-metric-card" style={{ background: 'rgba(255, 77, 128, 0.01)', border: '1px solid rgba(255, 77, 128, 0.05)' }}>
                                <div className="adv-metric-value" style={{ color: card.color }}>{card.value}</div>
                                <div className="adv-metric-label">{card.label}</div>
                            </div>
                        ))}
                    </div>

                    <div className="reports-charts-grid">
                        <div className="card">
                            <div className="flex-between" style={{ marginBottom: 12 }}>
                                <div>
                                    <h3 className="card-title" style={{ fontSize: '0.95rem' }}>Customer Growth Trend</h3>
                                    <p className="card-subtitle">New signups cumulative count (Line)</p>
                                </div>
                            </div>
                            <div className="svg-chart-container" style={{ height: 160 }}>
                                <svg className="svg-chart" viewBox="0 0 600 200" preserveAspectRatio="none">
                                    <line className="chart-grid-line" x1="0" y1="40" x2="600" y2="40" />
                                    <line className="chart-grid-line" x1="0" y1="80" x2="600" y2="80" />
                                    <line className="chart-grid-line" x1="0" y1="120" x2="600" y2="120" />
                                    <line className="chart-grid-line" x1="0" y1="160" x2="600" y2="160" />
                                    <path className="chart-area" d="M 0 180 L 100 170 L 200 155 L 300 115 L 400 90 L 500 50 L 600 10 L 600 200 L 0 200 Z" style={{ fill: 'rgba(59, 130, 246, 0.15)' }} />
                                    <path className="chart-line" d="M 0 180 L 100 170 L 200 155 L 300 115 L 400 90 L 500 50 L 600 10" style={{ stroke: '#3B82F6' }} />
                                </svg>
                            </div>
                        </div>
                        <div className="card">
                            <div className="flex-between" style={{ marginBottom: 12 }}>
                                <div>
                                    <h3 className="card-title" style={{ fontSize: '0.95rem' }}>Appointment Booking Trend</h3>
                                    <p className="card-subtitle">Daily appointments tracking (Area)</p>
                                </div>
                            </div>
                            <div className="svg-chart-container" style={{ height: 160 }}>
                                <svg className="svg-chart" viewBox="0 0 600 200" preserveAspectRatio="none">
                                    <line className="chart-grid-line" x1="0" y1="40" x2="600" y2="40" />
                                    <line className="chart-grid-line" x1="0" y1="80" x2="600" y2="80" />
                                    <line className="chart-grid-line" x1="0" y1="120" x2="600" y2="120" />
                                    <line className="chart-grid-line" x1="0" y1="160" x2="600" y2="160" />
                                    <path className="chart-area" d="M 0 150 L 100 110 L 200 160 L 300 80 L 400 120 L 500 60 L 600 40 L 600 200 L 0 200 Z" style={{ fill: 'rgba(16, 185, 129, 0.15)' }} />
                                    <path className="chart-line" d="M 0 150 L 100 110 L 200 160 L 300 80 L 400 120 L 500 60 L 600 40" style={{ stroke: '#10B981' }} />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="flex-between">
                            <div>
                                <h3 className="card-title" style={{ fontSize: '0.95rem' }}>Most Active Platform Users</h3>
                                <p className="card-subtitle">By appointment & coupon scans</p>
                            </div>
                        </div>
                        <div className="leaderboard-list">
                            {customerLeaderboard.map((item) => (
                                <div key={item.rank} className="leaderboard-item">
                                    <span className="leaderboard-rank">#{item.rank}</span>
                                    <span style={{ fontWeight: 600, flex: 1 }}>{item.name}</span>
                                    <div className="leaderboard-bar">
                                        <div className="leaderboard-bar-fill" style={{ width: item.width, background: item.fill || 'var(--gradient-primary)' }} />
                                    </div>
                                    <span style={{ fontWeight: 700 }}>{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="card">
                        <div className="table-header-controls" style={{ marginBottom: 20 }}>
                            <div>
                                <h3 className="card-title">Customer Registration & Engagement Database</h3>
                                <p className="card-subtitle">Filterable list of all registered portal accounts</p>
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
                                        <th>Coupons Used</th>
                                        <th>Chats Opened</th>
                                        <th>Last Active</th>
                                        <th>Joined Date</th>
                                        <th>Status</th>
                                        <th style={{ textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredCustomerRows.map((row) => (
                                        <tr key={row.email}>
                                            <td><strong>{row.name}</strong></td>
                                            <td>{row.phone}</td>
                                            <td>{row.email}</td>
                                            <td>{row.bookings}</td>
                                            <td>{row.coupons}</td>
                                            <td>{row.chats}</td>
                                            <td>{row.lastActive}</td>
                                            <td>{row.joined}</td>
                                            <td><span className={`badge ${row.status === 'Active' ? 'approved' : 'declined'}`}>{row.status}</span></td>
                                            <td style={{ textAlign: 'right' }}>
                                                <button className="btn btn-icon view" title="View Profile"><i className="fas fa-user-tag" /></button>
                                                <button className="btn btn-icon delete" title={row.status === 'Disabled' ? 'Reactivate Account' : 'Disable Account'}>
                                                    <i className={`fas ${row.status === 'Disabled' ? 'fa-user-plus' : 'fa-user-slash'}`} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
