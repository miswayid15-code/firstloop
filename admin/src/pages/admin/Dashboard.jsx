import { useEffect, useMemo, useState } from 'react'

import {
    NavLink,
    useNavigate,
    useParams
} from 'react-router-dom'

import { toast } from 'react-hot-toast'
import API from '../../api.js';



export default function Dashboard() {
    const navigate = useNavigate();
    const [dashboard, setDashboard] = useState(null);

    const FetchDashboard = async () => {

        try {

            const response = await API.get('/admin/dashboard');
            setDashboard(response.data.data);

        } catch (error) {

            console.log(
                'Dashboard Fetch Error:',
                error.response?.data || error
            );

            toast.error('Failed to load dashboard');
        }
    };

    useEffect(() => {
        FetchDashboard();
    }, []);

    if (!dashboard) {
        return (
            <>
                <div className="dashboard-stats-grid">
                    {[
                        {
                            title: 'Active Merchants',
                            icon: 'fa-store',
                            gradient: 'bg-gradient-purple',
                            trendLabel: 'new this week'
                        },
                        {
                            title: 'Redeemed Coupons',
                            icon: 'fa-ticket-alt',
                            gradient: 'bg-gradient-blue',
                            trendLabel: 'redeemed today'
                        },
                        {
                            title: 'Pending Bookings',
                            icon: 'fa-calendar-check',
                            gradient: 'bg-gradient-orange',
                            trendLabel: 'requires action'
                        },
                        {
                            title: 'Active Customers',
                            icon: 'fa-users',
                            gradient: 'bg-gradient-teal',
                            trendLabel: 'new signups'
                        }
                    ].map((item) => (
                        <div key={item.title} className={`card stat-card ${item.gradient}`} style={{ pointerEvents: 'none' }}>
                            <i className={`fas ${item.icon} stat-bg-icon`} />
                            <div className="stat-header">
                                <div className="flex-column">
                                    <span className="stat-title">{item.title}</span>
                                    <span className="skeleton-text" style={{ width: '60px', height: '32px', marginTop: '10px', display: 'inline-block' }} />
                                </div>
                                <div className={`stat-icon ${item.gradient.replace('bg-gradient-', '')}`}>
                                    <i className={`fas ${item.icon}`} />
                                </div>
                            </div>
                            <div className="stat-footer">
                                <span className="stat-trend" style={{ padding: '2px 6px', display: 'inline-flex', alignItems: 'center' }}>
                                    <span className="skeleton-text" style={{ width: '24px', height: '12px', display: 'inline-block' }} />
                                </span>
                                <span className="stat-desc">{item.trendLabel}</span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="dashboard-charts-grid">
                    <div className="card" style={{ pointerEvents: 'none' }}>
                        <div className="flex-between" style={{ marginBottom: 24 }}>
                            <div>
                                <h3 className="card-title">Campaign Sales Velocity</h3>
                                <p className="card-subtitle">Performance tracking across the network</p>
                            </div>
                            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary)', background: 'var(--primary-light)', padding: '4px 10px', borderRadius: 6 }}>
                                Live Tracker
                            </div>
                        </div>

                        <div className="svg-chart-container" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', height: '200px' }}>
                            <div className="skeleton-text" style={{ width: '100%', height: '100%', borderRadius: '12px' }} />
                        </div>

                        <div className="flex-between" style={{ marginTop: 20 }}>
                            {Array.from({ length: 6 }).map((_, i) => (
                                <span key={i} className="skeleton-text" style={{ width: '50px', height: '12px', display: 'inline-block' }} />
                            ))}
                        </div>
                    </div>

                    <div className="card" style={{ pointerEvents: 'none' }}>
                        <div className="flex-between" style={{ marginBottom: 24 }}>
                            <div>
                                <h3 className="card-title">Coupon Redemptions</h3>
                                <p className="card-subtitle">Weekly activity totals</p>
                            </div>
                        </div>
                        <div className="chart-container">
                            <div className="bar-chart-mock">
                                {[40, 75, 55, 90, 60, 85, 45].map((height, i) => (
                                    <div key={i} className="bar-column">
                                        <div
                                            className="skeleton-text"
                                            style={{
                                                width: '100%',
                                                height: `${height}%`,
                                                borderRadius: '6px 6px 0 0',
                                                display: 'block'
                                            }}
                                        />
                                        <span className="skeleton-text" style={{ width: '15px', height: '12px', display: 'inline-block' }} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="dashboard-content-grid">
                    <div className="card" style={{ pointerEvents: 'none' }}>
                        <div className="flex-between" style={{ marginBottom: 20 }}>
                            <div>
                                <h3 className="card-title">Top Performing Merchants</h3>
                                <p className="card-subtitle">Highest redemption volume</p>
                            </div>
                            <button className="btn btn-secondary" style={{ fontSize: '0.78rem', padding: '6px 12px' }}>
                                View All
                            </button>
                        </div>
                        <div className="merchant-mini-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {Array.from({ length: 3 }).map((_, index) => (
                                <div key={index} className="merchant-mini-item">
                                    <div className="merchant-mini-profile">
                                        <div className="skeleton-avatar" style={{ width: '40px', height: '40px', borderRadius: '12px' }} />
                                        <div>
                                            <h4 className="merchant-mini-name" style={{ margin: 0 }}>
                                                <span className="skeleton-text" style={{ width: '120px', height: '14px', display: 'inline-block' }} />
                                            </h4>
                                            <p className="merchant-mini-category" style={{ margin: '4px 0 0 0' }}>
                                                <span className="skeleton-text" style={{ width: '80px', height: '12px', display: 'inline-block' }} />
                                            </p>
                                        </div>
                                    </div>
                                    <div className="merchant-mini-stats" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                                        <span className="skeleton-text" style={{ width: '30px', height: '14px', display: 'inline-block' }} />
                                        <span className="skeleton-text" style={{ width: '50px', height: '12px', display: 'inline-block' }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="card" style={{ pointerEvents: 'none' }}>
                        <div className="flex-between" style={{ marginBottom: 20 }}>
                            <div>
                                <h3 className="card-title">Recent Activity</h3>
                                <p className="card-subtitle">Real-time system events</p>
                            </div>
                        </div>

                        <div className="activity-list">
                            {Array.from({ length: 3 }).map((_, index) => (
                                <div key={index} className="activity-item">
                                    <div className="skeleton-avatar" style={{ width: '40px', height: '40px' }} />
                                    <div className="activity-details" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <span className="skeleton-text" style={{ width: index === 0 ? '90%' : index === 1 ? '75%' : '80%', height: '14px', display: 'inline-block' }} />
                                        <span className="skeleton-text" style={{ width: '60px', height: '12px', display: 'inline-block' }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </>
        );
    }

    const { cards, coupon_redemptions_weekly, coupon_usage_monthly, top_performing_merchants } = dashboard;

    // Build bar chart data from weekly redemptions
    const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyMap = {};
    coupon_redemptions_weekly.forEach(({ date, count }) => {
        const dayIndex = new Date(date).getDay();
        weeklyMap[dayIndex] = (weeklyMap[dayIndex] || 0) + parseInt(count);
    });

    const maxWeeklyCount = Math.max(...Object.values(weeklyMap), 1);

    // Build monthly chart points from coupon_usage_monthly
    const monthlyMap = {};
    coupon_usage_monthly.forEach(({ month, count }) => {
        const label = new Date(month).toLocaleString('default', { month: 'short' });
        monthlyMap[label] = parseInt(count);
    });

    return (
        <>
            <div className="dashboard-stats-grid">
                {[
                    {
                        title: 'Active Merchants',
                        value: cards.active_merchants,
                        icon: 'fa-store',
                        gradient: 'bg-gradient-purple',
                        trend: `+${cards.new_merchants_this_week}`,
                        trendLabel: 'new this week',
                        path: '/merchants'
                    },
                    {
                        title: 'Redeemed Coupons',
                        value: cards.redeemed_coupons.toLocaleString(),
                        icon: 'fa-ticket-alt',
                        gradient: 'bg-gradient-blue',
                        trend: `+${cards.redeemed_today}`,
                        trendLabel: 'redeemed today',
                        path: '/coupon-claim'
                    },
                    {
                        title: 'Pending Bookings',
                        value: cards.pending_bookings,
                        icon: 'fa-calendar-check',
                        gradient: 'bg-gradient-orange',
                        trend: `${cards.pending_bookings}`,
                        trendLabel: 'requires action',
                        path: '/appointments'
                    },
                    {
                        title: 'Active Customers',
                        value: cards.active_customers.toLocaleString(),
                        icon: 'fa-users',
                        gradient: 'bg-gradient-teal',
                        trend: `+${cards.new_customers_this_week}`,
                        trendLabel: 'new signups',
                        path: '/customers'
                    }
                ].map((item) => (
                    <div
                        key={item.title}
                        className={`card stat-card ${item.gradient}`}
                        onClick={() => navigate(item.path)}
                        style={{ cursor: 'pointer' }}
                    >
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

            {/* <div className="dashboard-charts-grid">
                <div className="card">
                    <div className="flex-between" style={{ marginBottom: 24 }}>
                        <div>
                            <h3 className="card-title">Campaign Sales Velocity</h3>
                            <p className="card-subtitle">Performance tracking across the network</p>
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
                        {coupon_usage_monthly.map((item) => (
                            <span key={item.month}>
                                {new Date(item.month).toLocaleString('default', { month: 'short' })} ({item.count})
                            </span>
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
                            {coupon_redemptions_weekly.map((item) => {
                                const count = parseInt(item.count);
                                const heightPct = Math.round((count / maxWeeklyCount) * 100);
                                const dayLabel = new Date(item.date).toLocaleString('default', { weekday: 'short' }).charAt(0);
                                const displayDate = new Date(item.date).toLocaleDateString('default', { month: 'short', day: 'numeric' });
                                return (
                                    <div key={item.date} className="bar-column">
                                        <div
                                            className="bar-fill"
                                            style={{ height: `${heightPct}%` }}
                                            data-value={count}
                                        />
                                        <span className="bar-label" title={displayDate}>{dayLabel}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            <div className="dashboard-content-grid">
                <div className="card">
                    <div className="flex-between" style={{ marginBottom: 20 }}>
                        <div>
                            <h3 className="card-title">Top Performing Merchants</h3>
                            <p className="card-subtitle">Highest redemption volume
                                
                            </p>
                        </div>
                        <button className="btn btn-secondary" style={{ fontSize: '0.78rem', padding: '6px 12px' }}>
                            View All
                        </button>
                    </div>
                    {top_performing_merchants
                        .filter((m) => m.Branch !== null)
                        .map((merchant) => {
                            const name = merchant.Branch.name;
                            const badge = name.charAt(0).toUpperCase();
                            return (
                                <div key={merchant.branch_id} className="merchant-mini-item">
                                    <div className="merchant-mini-profile">
                                        <div className="merchant-mini-avatar">{badge}</div>
                                        <div>
                                            <h4 className="merchant-mini-name">{name}</h4>
                                            <p className="merchant-mini-category">Branch ID: {merchant.branch_id}</p>
                                        </div>
                                    </div>
                                    <div className="merchant-mini-stats">
                                        <span className="merchant-mini-value">{merchant.redeemed_count}</span>
                                        <p className="merchant-mini-label">coupons</p>
                                    </div>
                                </div>
                            );
                        })}
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
            </div> */}
        </>
    )
}