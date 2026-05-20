export default function Dashboard() {
    return (
        <>
            <div className="dashboard-stats-grid">
                {[
                    {
                        title: 'Platform Revenue',
                        value: '142,850',
                        icon: 'fa-dollar-sign',
                        gradient: 'bg-gradient-pink',
                        trend: '14.2%',
                        trendLabel: 'vs last month'
                    },
                    {
                        title: 'Active Merchants',
                        value: '382',
                        icon: 'fa-store',
                        gradient: 'bg-gradient-purple',
                        trend: '6.8%',
                        trendLabel: 'new this week'
                    },
                    {
                        title: 'Redeemed Coupons',
                        value: '24,960',
                        icon: 'fa-ticket-alt',
                        gradient: 'bg-gradient-blue',
                        trend: '22.4%',
                        trendLabel: 'redemption spike'
                    },
                    {
                        title: 'Pending Bookings',
                        value: '46',
                        icon: 'fa-calendar-check',
                        gradient: 'bg-gradient-orange',
                        trend: '3.2%',
                        trendLabel: 'requires action'
                    },
                    {
                        title: 'Active Customers',
                        value: '12,450',
                        icon: 'fa-users',
                        gradient: 'bg-gradient-teal',
                        trend: '8.5%',
                        trendLabel: 'new signups'
                    }
                ].map((item) => (
                    <div key={item.title} className={`card stat-card ${item.gradient}`}>
                        <i className={`fas ${item.icon} stat-bg-icon`} />
                        <div className="stat-header">
                            <div className="flex-column">
                                <span className="stat-title">{item.title}</span>
                                <span className="stat-value">{item.value}</span>
                            </div>
                            <div className={`stat-icon ${item.gradient.replace('bg-gradient-', '')}`}>
                                <i className={`fas ${item.icon}`} />
                            </div>
                        </div>
                        <div className="stat-footer">
                            <span className="stat-trend up">
                                <i className="fas fa-arrow-up" /> {item.trend}
                            </span>
                            <span className="stat-desc">{item.trendLabel}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="dashboard-charts-grid">
                <div className="card">
                    <div className="flex-between" style={{ marginBottom: 24 }}>
                        <div>
                            <h3 className="card-title">Campaign Sales Velocity</h3>
                            <p className="card-subtitle">Performance tracking across the Dealora network</p>
                        </div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary)', background: 'var(--primary-light)', padding: '4px 10px', borderRadius: 6 }}>
                            Live Tracker
                        </div>
                    </div>

                    <div className="svg-chart-container">
                        <svg className="svg-chart" viewBox="0 0 600 200" preserveAspectRatio="none">
                            <defs>
                                <linearGradient id="chart-gradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#FF6699" />
                                    <stop offset="100%" stopColor="#E91E63" />
                                </linearGradient>
                                <linearGradient id="chart-area-gradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#FF4D80" />
                                    <stop offset="100%" stopColor="#FF4D80" stopOpacity="0" />
                                </linearGradient>
                            </defs>
                            <line className="chart-grid-line" x1="0" y1="40" x2="600" y2="40" />
                            <line className="chart-grid-line" x1="0" y1="80" x2="600" y2="80" />
                            <line className="chart-grid-line" x1="0" y1="120" x2="600" y2="120" />
                            <line className="chart-grid-line" x1="0" y1="160" x2="600" y2="160" />
                            <path className="chart-area" d="M 0 160 L 50 130 L 100 145 L 150 90 L 200 110 L 250 55 L 300 80 L 350 40 L 400 70 L 450 30 L 500 50 L 550 15 L 600 15 L 600 200 L 0 200 Z" />
                            <path className="chart-line" d="M 0 160 L 50 130 L 100 145 L 150 90 L 200 110 L 250 55 L 300 80 L 350 40 L 400 70 L 450 30 L 500 50 L 550 15 L 600 15" />
                            <circle className="chart-dot" cx="150" cy="90" />
                            <circle className="chart-dot" cx="250" cy="55" />
                            <circle className="chart-dot" cx="350" cy="40" />
                            <circle className="chart-dot" cx="450" cy="30" />
                            <circle className="chart-dot" cx="550" cy="15" />
                        </svg>
                    </div>

                    <div className="flex-between" style={{ marginTop: 16, fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                        {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'].map((month) => (
                            <span key={month}>{month}</span>
                        ))}
                    </div>
                </div>

                <div className="card">
                    <div className="flex-between" style={{ marginBottom: 24 }}>
                        <div>
                            <h3 className="card-title">Coupon Redemptions</h3>
                            <p className="card-subtitle">Weekly activity totals</p>
                        </div>
                    </div>
                    <div className="chart-container">
                        <div className="bar-chart-mock">
                            {[
                                { label: 'M', height: '40%', value: '1.2k' },
                                { label: 'T', height: '65%', value: '2.4k' },
                                { label: 'W', height: '85%', value: '3.2k' },
                                { label: 'T', height: '50%', value: '1.9k' },
                                { label: 'F', height: '70%', value: '2.8k' },
                                { label: 'S', height: '95%', value: '4.1k' },
                                { label: 'S', height: '30%', value: '0.9k' }
                            ].map((bar) => (
                                <div key={bar.label} className="bar-column">
                                    <div className="bar-fill" style={{ height: bar.height }} data-value={bar.value}></div>
                                    <span className="bar-label">{bar.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="dashboard-content-grid">
                <div className="card">
                    <div className="flex-between" style={{ marginBottom: 20 }}>
                        <div>
                            <h3 className="card-title">Top Performing Merchants</h3>
                            <p className="card-subtitle">Highest redemption volume</p>
                        </div>
                        <button className="btn btn-secondary" style={{ fontSize: '0.78rem', padding: '6px 12px' }}>
                            View All
                        </button>
                    </div>
                    {[
                        { name: 'Starbucks Coffee', category: 'Beverages & Cafe', value: '4,960', badge: 'S' },
                        { name: 'Zara Fashion Group', category: 'Apparel & Design', value: '3,820', badge: 'Z' }
                    ].map((merchant) => (
                        <div key={merchant.name} className="merchant-mini-item">
                            <div className="merchant-mini-profile">
                                <div className="merchant-mini-avatar">{merchant.badge}</div>
                                <div>
                                    <h4 className="merchant-mini-name">{merchant.name}</h4>
                                    <p className="merchant-mini-category">{merchant.category}</p>
                                </div>
                            </div>
                            <div className="merchant-mini-stats">
                                <span className="merchant-mini-value">{merchant.value}</span>
                                <p className="merchant-mini-label">coupons</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="card">
                    <div className="flex-between" style={{ marginBottom: 20 }}>
                        <div>
                            <h3 className="card-title">Recent Activity</h3>
                            <p className="card-subtitle">Real-time system events</p>
                        </div>
                    </div>

                    <div className="activity-list">
                        <div className="activity-item">
                            <div className="activity-icon">
                                <i className="fas fa-store-alt" />
                            </div>
                            <div className="activity-details">
                                <p className="activity-text">New merchant <strong>Subway Eatery</strong> was approved.</p>
                                <span className="activity-time">5 mins ago</span>
                            </div>
                        </div>

                        <div className="activity-item">
                            <div className="activity-icon" style={{ color: 'var(--status-success)' }}>
                                <i className="fas fa-ticket-alt" />
                            </div>
                            <div className="activity-details">
                                <p className="activity-text">Coupon <strong>SAVEMORE50</strong> redeemed by 12 accounts.</p>
                                <span className="activity-time">32 mins ago</span>
                            </div>
                        </div>

                        <div className="activity-item">
                            <div className="activity-icon" style={{ color: 'var(--status-info)' }}>
                                <i className="fas fa-calendar-alt" />
                            </div>
                            <div className="activity-details">
                                <p className="activity-text">Appointment confirmed at <strong>Starbucks - City Center</strong>.</p>
                                <span className="activity-time">1 hour ago</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
