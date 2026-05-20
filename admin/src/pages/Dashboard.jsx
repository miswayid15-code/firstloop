import React from 'react';
import '../assets/css/cards.css';
import '../assets/css/dashboard.css';
import '../assets/css/responsive.css';

function Dashboard() {
  // Bar chart data for easier management
  const barData = [
    { day: 'M', value: 40, label: '1.2k' },
    { day: 'T', value: 65, label: '2.4k' },
    { day: 'W', value: 85, label: '3.2k' },
    { day: 'T', value: 50, label: '1.9k' },
    { day: 'F', value: 70, label: '2.8k' },
    { day: 'S', value: 95, label: '4.1k' },
    { day: 'S', value: 30, label: '0.9k' },
  ];

  return (
    <div className="app-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>Dealora</h2>
        </div>
        <ul className="sidebar-menu">
          <li className="active">
            <i className="fas fa-chart-line"></i> Dashboard
          </li>
          <li>
            <i className="fas fa-store"></i> Merchants
          </li>
          <li>
            <i className="fas fa-ticket-alt"></i> Coupons
          </li>
          <li>
            <i className="fas fa-users"></i> Customers
          </li>
          <li>
            <i className="fas fa-calendar-check"></i> Bookings
          </li>
          <li>
            <i className="fas fa-cog"></i> Settings
          </li>
        </ul>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Navbar */}


        <main className="page-container">
          {/* Top Control Bar */}
          <div
            className="flex-between"
            style={{
              marginBottom: "24px",
              gap: "24px"
            }}
          >
            <div
              className="search-wrapper"
              style={{
                marginBottom: 0,
                maxWidth: "360px",
                flex: 1
              }}
            >
              <i className="fas fa-search search-icon"></i>
              <input type="text" className="search-input" placeholder="Search dashboard activity, statistics..." />
            </div>

            <div>
              <button
                className="btn btn-primary"
                onClick={() => alert('Exporting platform reports as PDF...')}
              >
                <i className="fas fa-file-download"></i> Export Overview
              </button>
            </div>
          </div>

          {/* Dashboard Stats Grid */}
          <div className="dashboard-stats-grid">
            {/* Revenue Stat */}
            <div className="card stat-card bg-gradient-pink">
              <i className="fas fa-coins stat-bg-icon"></i>
              <div className="stat-header">
                <div className="flex-column">
                  <span className="stat-title">Platform Revenue</span>
                  <span className="stat-value">142,850</span>
                </div>
                <div className="stat-icon pink">
                  <i className="fas fa-dollar-sign"></i>
                </div>
              </div>
              <div className="stat-footer">
                <span className="stat-trend up">
                  <i className="fas fa-arrow-up"></i> 14.2%
                </span>
                <span className="stat-desc">vs last month</span>
              </div>
            </div>

            {/* Merchants Stat */}
            <div className="card stat-card bg-gradient-purple">
              <i className="fas fa-store stat-bg-icon"></i>
              <div className="stat-header">
                <div className="flex-column">
                  <span className="stat-title">Active Merchants</span>
                  <span className="stat-value">382</span>
                </div>
                <div className="stat-icon blue">
                  <i className="fas fa-store"></i>
                </div>
              </div>
              <div className="stat-footer">
                <span className="stat-trend up">
                  <i className="fas fa-arrow-up"></i> 6.8%
                </span>
                <span className="stat-desc">new this week</span>
              </div>
            </div>

            {/* Coupons Stat */}
            <div className="card stat-card bg-gradient-blue">
              <i className="fas fa-ticket-alt stat-bg-icon"></i>
              <div className="stat-header">
                <div className="flex-column">
                  <span className="stat-title">Redeemed Coupons</span>
                  <span className="stat-value">24,960</span>
                </div>
                <div className="stat-icon green">
                  <i className="fas fa-ticket-alt"></i>
                </div>
              </div>
              <div className="stat-footer">
                <span className="stat-trend up">
                  <i className="fas fa-arrow-up"></i> 22.4%
                </span>
                <span className="stat-desc">redemption spike</span>
              </div>
            </div>

            {/* Bookings Stat */}
            <div className="card stat-card bg-gradient-orange">
              <i className="fas fa-calendar-check stat-bg-icon"></i>
              <div className="stat-header">
                <div className="flex-column">
                  <span className="stat-title">Pending Bookings</span>
                  <span className="stat-value">46</span>
                </div>
                <div className="stat-icon orange">
                  <i className="fas fa-calendar-check"></i>
                </div>
              </div>
              <div className="stat-footer">
                <span className="stat-trend down">
                  <i className="fas fa-arrow-down"></i> 3.2%
                </span>
                <span className="stat-desc">requires action</span>
              </div>
            </div>

            {/* Customers Stat - Added back */}
            <div className="card stat-card bg-gradient-teal">
              <i className="fas fa-users stat-bg-icon"></i>
              <div className="stat-header">
                <div className="flex-column">
                  <span className="stat-title">Active Customers</span>
                  <span className="stat-value">12,450</span>
                </div>
                <div className="stat-icon purple">
                  <i className="fas fa-users"></i>
                </div>
              </div>
              <div className="stat-footer">
                <span className="stat-trend up">
                  <i className="fas fa-arrow-up"></i> 8.5%
                </span>
                <span className="stat-desc">new signups</span>
              </div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="dashboard-charts-grid">
            {/* Line Chart Card */}
            <div className="card">
              <div className="flex-between" style={{ marginBottom: "24px" }}>
                <div>
                  <h3 className="card-title">Campaign Sales Velocity</h3>
                  <p className="card-subtitle">Performance tracking across the Dealora network</p>
                </div>
                <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--primary)", background: "var(--primary-light)", padding: "4px 10px", borderRadius: "6px" }}>
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
                      <stop offset="0%" stopColor="#FF4D80" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#FF4D80" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {/* Grid lines */}
                  <line className="chart-grid-line" x1="0" y1="40" x2="600" y2="40" stroke="#e2e8f0" strokeWidth="1" />
                  <line className="chart-grid-line" x1="0" y1="80" x2="600" y2="80" stroke="#e2e8f0" strokeWidth="1" />
                  <line className="chart-grid-line" x1="0" y1="120" x2="600" y2="120" stroke="#e2e8f0" strokeWidth="1" />
                  <line className="chart-grid-line" x1="0" y1="160" x2="600" y2="160" stroke="#e2e8f0" strokeWidth="1" />

                  {/* Area fill */}
                  <path className="chart-area" d="M 0 160 L 50 130 L 100 145 L 150 90 L 200 110 L 250 55 L 300 80 L 350 40 L 400 70 L 450 30 L 500 50 L 550 15 L 600 15 L 600 200 L 0 200 Z" fill="url(#chart-area-gradient)" />

                  {/* Line path */}
                  <path className="chart-line" d="M 0 160 L 50 130 L 100 145 L 150 90 L 200 110 L 250 55 L 300 80 L 350 40 L 400 70 L 450 30 L 500 50 L 550 15 L 600 15" fill="none" stroke="url(#chart-gradient)" strokeWidth="3" />

                  {/* Dots */}
                  <circle className="chart-dot" cx="150" cy="90" r="4" fill="#FF4D80" />
                  <circle className="chart-dot" cx="250" cy="55" r="4" fill="#FF4D80" />
                  <circle className="chart-dot" cx="350" cy="40" r="4" fill="#FF4D80" />
                  <circle className="chart-dot" cx="450" cy="30" r="4" fill="#FF4D80" />
                  <circle className="chart-dot" cx="550" cy="15" r="4" fill="#FF4D80" />
                </svg>
              </div>

              <div className="flex-between" style={{ marginTop: "16px", fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 500 }}>
                <span>Jan</span>
                <span>Feb</span>
                <span>Mar</span>
                <span>Apr</span>
                <span>May</span>
                <span>Jun</span>
                <span>Jul</span>
              </div>
            </div>

            {/* Bar Chart Card */}
            <div className="card">
              <div className="flex-between" style={{ marginBottom: "24px" }}>
                <div>
                  <h3 className="card-title">Coupon Redemptions</h3>
                  <p className="card-subtitle">Weekly activity totals</p>
                </div>
              </div>

              <div className="chart-container">
                <div className="bar-chart-mock" style={{ display: "flex", alignItems: "flex-end", gap: "16px", justifyContent: "center", height: "200px" }}>
                  {barData.map((bar, idx) => (
                    <div key={idx} className="bar-column" style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
                      <div 
                        className="bar-fill" 
                        style={{ 
                          height: `${bar.value}%`, 
                          width: "100%", 
                          backgroundColor: "#FF4D80",
                          borderRadius: "6px 6px 0 0",
                          transition: "height 0.3s ease",
                          minHeight: "4px"
                        }} 
                        data-value={bar.label}
                      ></div>
                      <span className="bar-label" style={{ marginTop: "8px", fontSize: "12px", fontWeight: 600 }}>{bar.day}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Content Grid */}
          <div className="dashboard-content-grid">
            {/* Top Merchants Card */}
            <div className="card">
              <div className="flex-between" style={{ marginBottom: "20px" }}>
                <div>
                  <h3 className="card-title">Top Performing Merchants</h3>
                  <p className="card-subtitle">Highest redemption volume</p>
                </div>
                <button className="btn btn-secondary" style={{ fontSize: "0.78rem", padding: "6px 12px" }} onClick={() => window.location.href = 'merchants.html'}>
                  View All
                </button>
              </div>

              <div className="merchant-mini-list">
                {/* Starbucks */}
                <div className="merchant-mini-item" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <div className="merchant-mini-profile" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div className="merchant-mini-avatar" style={{ width: "40px", height: "40px", borderRadius: "12px", background: "#FFE0E7", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", color: "#E91E63" }}>
                      S
                    </div>
                    <div>
                      <h4 className="merchant-mini-name" style={{ margin: 0, fontSize: "14px", fontWeight: 600 }}>Starbucks Coffee</h4>
                      <p className="merchant-mini-category" style={{ margin: 0, fontSize: "12px", color: "#6c757d" }}>Beverages & Cafe</p>
                    </div>
                  </div>
                  <div className="merchant-mini-stats" style={{ textAlign: "right" }}>
                    <span className="merchant-mini-value" style={{ fontSize: "18px", fontWeight: 700, color: "#E91E63" }}>4,960</span>
                    <p className="merchant-mini-label" style={{ margin: 0, fontSize: "10px", color: "#6c757d" }}>coupons</p>
                  </div>
                </div>

                {/* Zara */}
                <div className="merchant-mini-item" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <div className="merchant-mini-profile" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div className="merchant-mini-avatar" style={{ width: "40px", height: "40px", borderRadius: "12px", background: "#E0F2FE", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", color: "#0284C7" }}>
                      Z
                    </div>
                    <div>
                      <h4 className="merchant-mini-name" style={{ margin: 0, fontSize: "14px", fontWeight: 600 }}>Zara Fashion</h4>
                      <p className="merchant-mini-category" style={{ margin: 0, fontSize: "12px", color: "#6c757d" }}>Apparel & Design</p>
                    </div>
                  </div>
                  <div className="merchant-mini-stats" style={{ textAlign: "right" }}>
                    <span className="merchant-mini-value" style={{ fontSize: "18px", fontWeight: 700, color: "#0284C7" }}>3,820</span>
                    <p className="merchant-mini-label" style={{ margin: 0, fontSize: "10px", color: "#6c757d" }}>coupons</p>
                  </div>
                </div>

                {/* Hilton */}
                <div className="merchant-mini-item" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div className="merchant-mini-profile" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div className="merchant-mini-avatar" style={{ width: "40px", height: "40px", borderRadius: "12px", background: "#DCFCE7", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", color: "#16A34A" }}>
                      H
                    </div>
                    <div>
                      <h4 className="merchant-mini-name" style={{ margin: 0, fontSize: "14px", fontWeight: 600 }}>Hilton Hotels</h4>
                      <p className="merchant-mini-category" style={{ margin: 0, fontSize: "12px", color: "#6c757d" }}>Travel & Tourism</p>
                    </div>
                  </div>
                  <div className="merchant-mini-stats" style={{ textAlign: "right" }}>
                    <span className="merchant-mini-value" style={{ fontSize: "18px", fontWeight: 700, color: "#16A34A" }}>2,950</span>
                    <p className="merchant-mini-label" style={{ margin: 0, fontSize: "10px", color: "#6c757d" }}>coupons</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Activity Card */}
            <div className="card">
              <div className="flex-between" style={{ marginBottom: "20px" }}>
                <div>
                  <h3 className="card-title">Recent Activity</h3>
                  <p className="card-subtitle">Real-time system events</p>
                </div>
              </div>

              <div className="activity-list">
                <div className="activity-item" style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
                  <div className="activity-icon" style={{ color: "#FF4D80" }}>
                    <i className="fas fa-store-alt"></i>
                  </div>
                  <div className="activity-details">
                    <p className="activity-text" style={{ margin: 0, fontSize: "14px" }}>
                      New merchant <strong>Subway Eatery</strong> was approved.
                    </p>
                    <span className="activity-time" style={{ fontSize: "11px", color: "#6c757d" }}>5 mins ago</span>
                  </div>
                </div>

                <div className="activity-item" style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
                  <div className="activity-icon" style={{ color: "#16A34A" }}>
                    <i className="fas fa-ticket-alt"></i>
                  </div>
                  <div className="activity-details">
                    <p className="activity-text" style={{ margin: 0, fontSize: "14px" }}>
                      Coupon <strong>SAVEMORE50</strong> redeemed by 12 accounts.
                    </p>
                    <span className="activity-time" style={{ fontSize: "11px", color: "#6c757d" }}>32 mins ago</span>
                  </div>
                </div>

                <div className="activity-item" style={{ display: "flex", gap: "12px" }}>
                  <div className="activity-icon" style={{ color: "#0284C7" }}>
                    <i className="fas fa-calendar-alt"></i>
                  </div>
                  <div className="activity-details">
                    <p className="activity-text" style={{ margin: 0, fontSize: "14px" }}>
                      Appointment confirmed at <strong>Starbucks - City Center</strong>.
                    </p>
                    <span className="activity-time" style={{ fontSize: "11px", color: "#6c757d" }}>1 hour ago</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Dashboard;