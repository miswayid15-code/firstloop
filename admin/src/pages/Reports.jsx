import { useMemo, useState } from 'react'

const merchantSummaryCards = [
    { title: 'Total Merchants', value: '520', trend: '+12', trendLabel: 'this month', icon: 'fa-store', gradient: 'bg-gradient-pink' },
    { title: 'Active / Inactive', value: '382 / 138', trend: '+73.4%', trendLabel: 'active rate', icon: 'fa-check-circle', gradient: 'bg-gradient-purple' },
    { title: 'Verified Outlets', value: '410', trend: '85%', trendLabel: 'verified pct', icon: 'fa-shield-alt', gradient: 'bg-gradient-blue' },
    { title: 'Total Revenue', value: '4.12M', trend: '+14.2%', trendLabel: 'vs last month', icon: 'fa-coins', gradient: 'bg-gradient-orange' }
]

const merchantMetricCards = [
    { value: '24.3%', label: 'Conversion Rate', color: '#FF4D80' },
    { value: '18.5%', label: 'Offer Click Rate', color: '#8E2DE2' },
    { value: '96.2%', label: 'Appt Success', color: '#36D1DC' },
    { value: '38.4%', label: 'Repeat Cust %', color: '#FFB75E' },
    { value: '9.2/10', label: 'Engagement', color: '#11998e' },
    { value: '92.5%', label: 'Chat Response', color: '#FF4D80' }
]

const merchantLeaderboard = [
    { rank: 1, name: "Nando's Marina", value: '482 appts', width: '90%' },
    { rank: 2, name: "Gold's Gym Downtown", value: '354 appts', width: '75%', fill: 'linear-gradient(135deg,#8E2DE2,#4A00E0)' },
    { rank: 3, name: 'Tips & Toes Salon', value: '269 appts', width: '58%', fill: 'linear-gradient(135deg,#36D1DC,#5B86E5)' }
]

const merchantTableRows = [
    { name: "Nando's Marina", type: 'Food & Beverage', outlets: 4, offers: 12, appointments: 482, revenue: 'AED 248,500', rating: '4.8', status: 'Active', joined: '2025-10-12' },
    { name: "Gold's Gym", type: 'Fitness & Health', outlets: 6, offers: 8, appointments: 354, revenue: 'AED 184,200', rating: '4.6', status: 'Active', joined: '2025-11-05' },
    { name: 'Tips & Toes Salon', type: 'Salon & Spa', outlets: 3, offers: 15, appointments: 269, revenue: 'AED 115,000', rating: '4.5', status: 'Active', joined: '2025-12-20' },
    { name: 'Ski Dubai Office', type: 'Entertainment', outlets: 1, offers: 4, appointments: 142, revenue: 'AED 98,600', rating: '4.9', status: 'Inactive', joined: '2026-01-14' }
]

const customerSummaryCards = [
    { title: 'Total Customers', value: '24,500', trend: '+1.8K', trendLabel: 'this month', icon: 'fa-users', gradient: 'bg-gradient-pink' },
    { title: 'Active Customers', value: '12,450', trend: '+50.8%', trendLabel: 'monthly active', icon: 'fa-user-check', gradient: 'bg-gradient-purple' },
    { title: 'Appts Booked', value: '15,900', trend: '+320', trendLabel: 'today', icon: 'fa-calendar-alt', gradient: 'bg-gradient-blue' },
    { title: 'Retention Rate', value: '84.6%', trend: 'Robust', trendLabel: 'retention', icon: 'fa-history', gradient: 'bg-gradient-orange' }
]

const customerMetricCards = [
    { value: '42,300', label: 'Chats Initiated', color: '#FF4D80' },
    { value: '28,150', label: 'Coupons Redeemed', color: '#8E2DE2' },
    { value: '8,420', label: 'Daily Active Users', color: '#36D1DC' },
    { value: '78.4%', label: 'Ad Click Ratio', color: '#FFB75E' }
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

const liveActivities = [
    { title: "Fatima A. claimed Starbucks 50% Coupon", time: 'Just now' },
    { title: "Nando's updated active outlets count", time: '2 mins ago' },
    { title: 'John S. booked Gold\'s Gym appt', time: '5 mins ago' }
]

const realTimeCounters = [
    { label: 'Active Users Online', value: '182' },
    { label: 'Appts booked today', value: '320' },
    { label: 'Chat channels active', value: '48' },
    { label: 'Online merchants list', value: '34 stores online' }
]

export default function Reports() {
    const [activeTab, setActiveTab] = useState('merchant')
    const [showExport, setShowExport] = useState(false)
    const [merchantFilters, setMerchantFilters] = useState({
        date: 'Last 30 Days',
        category: 'All Categories',
        status: 'All Merchants',
        location: 'All Cities',
        revenue: 'All Ranges'
    })
    const [customerFilters, setCustomerFilters] = useState({
        date: 'Last 30 Days',
        status: 'All Customers',
        category: 'All Users',
        frequency: 'Any Frequency',
        offers: 'Any Usage'
    })
    const [merchantSearch, setMerchantSearch] = useState('')
    const [customerSearch, setCustomerSearch] = useState('')

    const filteredMerchantRows = useMemo(
        () => merchantTableRows.filter((row) =>
            row.name.toLowerCase().includes(merchantSearch.toLowerCase()) ||
            row.type.toLowerCase().includes(merchantSearch.toLowerCase())
        ),
        [merchantSearch]
    )

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

    const resetFilters = (type) => {
        if (type === 'merchant') {
            setMerchantFilters({
                date: 'Last 30 Days',
                category: 'All Categories',
                status: 'All Merchants',
                location: 'All Cities',
                revenue: 'All Ranges'
            })
        } else {
            setCustomerFilters({
                date: 'Last 30 Days',
                status: 'All Customers',
                category: 'All Users',
                frequency: 'Any Frequency',
                offers: 'Any Usage'
            })
        }
    }

    return (
        <div className="reports-grid">
            <div className="reports-main-content">
                <div className="flex-between" style={{ marginBottom: 24, gap: 20, flexWrap: 'wrap' }}>
                    <div className="tab-filters" style={{ marginBottom: 0, padding: 4 }}>
                        <button
                            className={`tab-btn${activeTab === 'merchant' ? ' active' : ''}`}
                            onClick={() => setActiveTab('merchant')}
                        >
                            <i className="fas fa-store"></i> Merchant Reports
                        </button>
                        <button
                            className={`tab-btn${activeTab === 'customer' ? ' active' : ''}`}
                            onClick={() => setActiveTab('customer')}
                        >
                            <i className="fas fa-users"></i> Customer Reports
                        </button>
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

                {activeTab === 'merchant' ? (
                    <div id="merchant-reports-container" className="report-section-container active-report">
                        <div className="filter-panel">
                            <div className="flex-between" style={{ marginBottom: 16 }}>
                                <h4 style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Filter Merchant Analytics</h4>
                                <button className="btn-link" style={{ color: 'var(--primary)', fontSize: '0.8rem', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }} onClick={() => resetFilters('merchant')}>
                                    Reset Filters
                                </button>
                            </div>
                            <div className="filter-grid">
                                {[
                                    { label: 'Date Range', name: 'date', options: ['Last 30 Days', 'Last 7 Days', 'This Month', 'Last Quarter', 'Custom Date Range'] },
                                    { label: 'Business Category', name: 'category', options: ['All Categories', 'Food & Beverages', 'Salons & Spas', 'Fitness Centers', 'Entertainment'] },
                                    { label: 'Active Status', name: 'status', options: ['All Merchants', 'Active', 'Inactive'] },
                                    { label: 'Location/City', name: 'location', options: ['All Cities', 'Dubai Marina', 'Downtown Dubai', 'Jumeirah', 'Deira'] },
                                    { label: 'Revenue Range', name: 'revenue', options: ['All Ranges', '< AED 10K', 'AED 10K - 50K', 'AED 50K - 100K', '> AED 100K'] }
                                ].map((filter) => (
                                    <div key={filter.name} className="form-group" style={{ marginBottom: 0 }}>
                                        <label className="form-label" style={{ position: 'static', fontSize: '0.75rem', transform: 'none', marginBottom: 6 }}>{filter.label}</label>
                                        <select
                                            className="form-control"
                                            style={{ height: 40, padding: '6px 12px' }}
                                            value={merchantFilters[filter.name]}
                                            onChange={(event) => setMerchantFilters((prev) => ({ ...prev, [filter.name]: event.target.value }))}
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
                            {merchantSummaryCards.map((card) => (
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

                        <div className="adv-metrics-grid">
                            {merchantMetricCards.map((card) => (
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
                                        <h3 className="card-title" style={{ fontSize: '0.95rem' }}>Merchant Registration Growth</h3>
                                        <p className="card-subtitle">Network growth trajectory</p>
                                    </div>
                                </div>
                                <div className="svg-chart-container" style={{ height: 160 }}>
                                    <svg className="svg-chart" viewBox="0 0 600 200" preserveAspectRatio="none">
                                        <line className="chart-grid-line" x1="0" y1="40" x2="600" y2="40" />
                                        <line className="chart-grid-line" x1="0" y1="80" x2="600" y2="80" />
                                        <line className="chart-grid-line" x1="0" y1="120" x2="600" y2="120" />
                                        <line className="chart-grid-line" x1="0" y1="160" x2="600" y2="160" />
                                        <path className="chart-area" d="M 0 160 L 100 140 L 200 135 L 300 95 L 400 80 L 500 45 L 600 20 L 600 200 L 0 200 Z" style={{ fill: 'rgba(255, 77, 128, 0.1)' }} />
                                        <path className="chart-line" d="M 0 160 L 100 140 L 200 135 L 300 95 L 400 80 L 500 45 L 600 20" style={{ stroke: 'var(--primary)' }} />
                                    </svg>
                                </div>
                            </div>

                            <div className="card">
                                <div className="flex-between" style={{ marginBottom: 12 }}>
                                    <div>
                                        <h3 className="card-title" style={{ fontSize: '0.95rem' }}>Revenue Generated by Merchant</h3>
                                        <p className="card-subtitle">Monthly transaction volume (Bar)</p>
                                    </div>
                                </div>
                                <div className="svg-chart-container" style={{ height: 160, display: 'flex', alignItems: 'flex-end', gap: 20, padding: '20px 10px 0' }}>
                                    {[
                                        { label: 'Food', height: '95px', fill: 'var(--gradient-primary)' },
                                        { label: 'Salon', height: '60px', fill: 'linear-gradient(135deg, #8E2DE2, #4A00E0)' },
                                        { label: 'Fitness', height: '110px', fill: 'linear-gradient(135deg, #36D1DC, #5B86E5)' },
                                        { label: 'Entertain', height: '45px', fill: 'linear-gradient(135deg, #FFB75E, #ED8F03)' }
                                    ].map((bar) => (
                                        <div key={bar.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                                            <div style={{ width: '100%', height: bar.height, background: bar.fill, borderRadius: 4 }} />
                                            <span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{bar.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>


                        </div>


                            <div className="card">
                                <div className="flex-between">
                                    <div>
                                        <h3 className="card-title" style={{ fontSize: '0.95rem' }}>Top Performing Merchants</h3>
                                        <p className="card-subtitle">Leaderboard by appointments</p>
                                    </div>
                                </div>
                                <div className="leaderboard-list">
                                    {merchantLeaderboard.map((item) => (
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
                                            <th>Merchant Name</th>
                                            <th>Business Type</th>
                                            <th>Outlets</th>
                                            <th>Offers</th>
                                            <th>Appointments</th>
                                            <th>Revenue</th>
                                            <th>Rating</th>
                                            <th>Status</th>
                                            <th>Joined Date</th>
                                            <th style={{ textAlign: 'right' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredMerchantRows.map((row) => (
                                            <tr key={row.name}>
                                                <td><strong>{row.name}</strong></td>
                                                <td>{row.type}</td>
                                                <td>{row.outlets}</td>
                                                <td>{row.offers}</td>
                                                <td>{row.appointments}</td>
                                                <td><span style={{ fontWeight: 700, color: '#10B981' }}>{row.revenue}</span></td>
                                                <td><i className="fas fa-star" style={{ color: '#FFB75E' }} /> {row.rating}</td>
                                                <td><span className={`badge ${row.status === 'Active' ? 'approved' : 'declined'}`}>{row.status}</span></td>
                                                <td>{row.joined}</td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <button className="btn btn-icon view" title="View details"><i className="fas fa-eye" /></button>
                                                    <button className="btn btn-icon delete" title={row.status === 'Inactive' ? 'Reactivate merchant' : 'Suspend merchant'}>
                                                        <i className={`fas ${row.status === 'Inactive' ? 'fa-check' : 'fa-ban'}`} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div id="customer-reports-container" className="report-section-container active-report">
                        <div className="filter-panel">
                            <div className="flex-between" style={{ marginBottom: 16 }}>
                                <h4 style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Filter Customer Reports</h4>
                                <button className="btn-link" style={{ color: 'var(--primary)', fontSize: '0.8rem', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }} onClick={() => resetFilters('customer')}>
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
                )}
            </div>

            <div className="reports-insights-sidebar">
                <div className="card" style={{ marginBottom: 24, marginTop: 24 }}>
                    <h3 className="card-title" style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <i className="fas fa-sync-alt fa-spin" style={{ color: 'var(--primary)', fontSize: '0.8rem' }} /> Real-Time Insights
                    </h3>
                    <p className="card-subtitle">Live platform analytics ticker</p>
                    <div style={{ marginTop: 15 }}>
                        {realTimeCounters.map((item) => (
                            <div key={item.label} className="counter-row">
                                <span>{item.label}</span>
                                <span className="counter-value">{item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="card" style={{ marginBottom: 24 }}>
                    <h3 className="card-title" style={{ fontSize: '0.9rem' }}><i className="fas fa-ad" style={{ color: 'var(--primary)' }} /> Banner Ad Metrics</h3>
                    <p className="card-subtitle">Active placements click ratios</p>
                    <div style={{ marginTop: 15, display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {[
                            { title: 'Marina Mall Summer Banner', ratio: '4.8%', width: '48%' },
                            { title: 'Tips & Toes Promo Slider', ratio: '7.2%', width: '72%' }
                        ].map((item) => (
                            <div key={item.title}>
                                <div className="progress-bar-container">
                                    <div className="progress-bar-info">
                                        <strong>{item.title}</strong>
                                        <span>{item.ratio} CTR</span>
                                    </div>
                                    <div className="progress-bar-track">
                                        <div className="progress-bar-fill" style={{ width: item.width }} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="card">
                    <h3 className="card-title" style={{ fontSize: '0.9rem' }}><i className="fas fa-satellite-dish" style={{ color: '#10B981' }} /> User Activity Feed</h3>
                    <p className="card-subtitle">Live events occurring now</p>
                    <div className="live-tracker-widget" style={{ marginTop: 15 }}>
                        {liveActivities.map((item) => (
                            <div key={item.title} className="live-item">
                                <span className="live-dot" />
                                <div>
                                    <strong>{item.title}</strong>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: 2 }}>{item.time}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
