import { useState, useMemo } from 'react'
import { INITIAL_BRANCHES, INITIAL_REPORTS_LOGS } from './mockMerchantData'

export default function MerchantReports() {
    const [branches] = useState(INITIAL_BRANCHES)
    const [logs] = useState(INITIAL_REPORTS_LOGS)
    const [selectedBranch, setSelectedBranch] = useState('all')
    const [dateRange, setDateRange] = useState('30')
    const [search, setSearch] = useState('')

    const filteredLogs = useMemo(() => {
        return logs.filter(item => {
            const matchesBranch = selectedBranch === 'all' || item.branch.includes(selectedBranch)
            const matchesSearch =
                item.customer.toLowerCase().includes(search.toLowerCase()) ||
                item.action.toLowerCase().includes(search.toLowerCase()) ||
                item.rewardUnlocked.toLowerCase().includes(search.toLowerCase()) ||
                item.staff.toLowerCase().includes(search.toLowerCase())

            return matchesBranch && matchesSearch
        })
    }, [logs, selectedBranch, search])

    const handleExportCSV = () => {
        alert('Merchant Report Data exported successfully to CSV format!')
    }

    return (
        <div style={{ paddingBottom: 40 }}>
            {/* Header */}
            <div className="flex-between mb-4" style={{ flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                        Merchant Analytics & Redemption Reports
                    </h2>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>
                        Track stamp issuance, reward claims, member tier utilization & staff activity.
                    </p>
                </div>

                <button
                    type="button"
                    className="btn firstloop-btn-primary"
                    onClick={handleExportCSV}
                    style={{ padding: '10px 18px', borderRadius: 10, display: 'inline-flex', alignItems: 'center', gap: 8 }}
                >
                    <i className="fas fa-download" />
                    <span>Export CSV Report</span>
                </button>
            </div>

            {/* Filter Bar */}
            <div className="card mb-4" style={{ padding: 18, borderRadius: 16 }}>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                        <div>
                            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>
                                Filter Branch Location
                            </label>
                            <select
                                className="form-select"
                                value={selectedBranch}
                                onChange={(e) => setSelectedBranch(e.target.value)}
                                style={{ height: 40, borderRadius: 10, fontSize: '0.85rem', minWidth: 200 }}
                            >
                                <option value="all">All Merchant Branches</option>
                                {branches.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                            </select>
                        </div>

                        <div>
                            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>
                                Date Range Period
                            </label>
                            <select
                                className="form-select"
                                value={dateRange}
                                onChange={(e) => setDateRange(e.target.value)}
                                style={{ height: 40, borderRadius: 10, fontSize: '0.85rem', minWidth: 160 }}
                            >
                                <option value="7">Last 7 Days</option>
                                <option value="30">Last 30 Days</option>
                                <option value="90">Last 90 Days</option>
                                <option value="365">This Year (2026)</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ position: 'relative', minWidth: 240 }}>
                        <i className="fas fa-search" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Search report logs..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ paddingLeft: 36, height: 40, borderRadius: 10, fontSize: '0.85rem' }}
                        />
                    </div>
                </div>
            </div>

            {/* KPI STAT CARDS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 18, marginBottom: 28 }}>
                <div className="card" style={{ padding: 18, borderRadius: 16, border: '1px solid rgba(14, 136, 184, 0.15)', background: '#FFFFFF' }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Stamps Issued</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--firstloop-primary)', marginTop: 6 }}>2,596 Stamps</div>
                    <small style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 700, marginTop: 4, display: 'block' }}>
                        <i className="fas fa-arrow-up" style={{ marginRight: 4 }} /> +14.2% vs last month
                    </small>
                </div>

                <div className="card" style={{ padding: 18, borderRadius: 16, border: '1px solid rgba(14, 136, 184, 0.15)', background: '#FFFFFF' }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Rewards Claimed</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#EF0003', marginTop: 6 }}>303 Rewards</div>
                    <small style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 700, marginTop: 4, display: 'block' }}>
                        <i className="fas fa-check-circle" style={{ marginRight: 4 }} /> 88.5% Claim Rate
                    </small>
                </div>

                <div className="card" style={{ padding: 18, borderRadius: 16, border: '1px solid rgba(14, 136, 184, 0.15)', background: '#FFFFFF' }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Member Revenue</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--status-success)', marginTop: 6 }}>$18,450.00</div>
                    <small style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                        Avg spend $36.50 per visit
                    </small>
                </div>

                <div className="card" style={{ padding: 18, borderRadius: 16, border: '1px solid rgba(14, 136, 184, 0.15)', background: '#FFFFFF' }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Customer Retention</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#D97706', marginTop: 6 }}>78.4%</div>
                    <small style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 700, marginTop: 4, display: 'block' }}>
                        High Repeat Visit Rate
                    </small>
                </div>
            </div>

            {/* VISUAL CHART & BREAKDOWN CARDS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, marginBottom: 28 }}>
                {/* Stamp Issuance vs Redemptions Bar Graphics */}
                <div className="card" style={{ padding: 20, borderRadius: 18, border: '1px solid rgba(14, 136, 184, 0.12)' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 16px 0', color: 'var(--text-primary)' }}>
                        Stamp Pass Utilization Breakdown
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 700, marginBottom: 6 }}>
                                <span>Artisanal Coffee 8-Stamp Pass</span>
                                <span style={{ color: 'var(--firstloop-primary)' }}>1,420 stamps issued (68%)</span>
                            </div>
                            <div style={{ height: 10, background: '#E2E8F0', borderRadius: 6, overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: '68%', background: 'var(--firstloop-gradient-primary)' }} />
                            </div>
                        </div>

                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 700, marginBottom: 6 }}>
                                <span>Beauty Styling 6-Stamp Card</span>
                                <span style={{ color: '#0284C7' }}>680 stamps issued (22%)</span>
                            </div>
                            <div style={{ height: 10, background: '#E2E8F0', borderRadius: 6, overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: '22%', background: '#0284C7' }} />
                            </div>
                        </div>

                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 700, marginBottom: 6 }}>
                                <span>Gourmet Bakery 10-Stamp Card</span>
                                <span style={{ color: '#D97706' }}>496 stamps issued (10%)</span>
                            </div>
                            <div style={{ height: 10, background: '#E2E8F0', borderRadius: 6, overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: '10%', background: '#D97706' }} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Membership Tier Distribution */}
                <div className="card" style={{ padding: 20, borderRadius: 18, border: '1px solid rgba(14, 136, 184, 0.12)' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 16px 0', color: 'var(--text-primary)' }}>
                        Membership Tier Distribution
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 12, background: 'rgba(245, 158, 11, 0.1)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <i className="fas fa-crown" style={{ color: '#D97706', fontSize: '1.1rem' }} />
                                <div>
                                    <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#D97706' }}>Gold Elite Membership</div>
                                    <small style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>128 Enrolled Members</small>
                                </div>
                            </div>
                            <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#D97706' }}>25.5%</span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 12, background: 'rgba(30, 41, 59, 0.08)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <i className="fas fa-gem" style={{ color: '#1E293B', fontSize: '1.1rem' }} />
                                <div>
                                    <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#1E293B' }}>Platinum Black VIP Pass</div>
                                    <small style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>64 Enrolled Members</small>
                                </div>
                            </div>
                            <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#1E293B' }}>12.7%</span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 12, background: 'rgba(2, 132, 199, 0.1)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <i className="fas fa-award" style={{ color: '#0284C7', fontSize: '1.1rem' }} />
                                <div>
                                    <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0284C7' }}>Silver Select Tier</div>
                                    <small style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>310 Enrolled Members</small>
                                </div>
                            </div>
                            <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0284C7' }}>61.8%</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* DETAILED REPORT TRANSACTION LOG TABLE */}
            <div className="card" style={{ borderRadius: 16, overflow: 'hidden' }}>
                <div style={{ padding: '18px 20px', borderBottom: '1px solid rgba(14, 136, 184, 0.1)' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                        Detailed Redemption & Transaction Log
                    </h3>
                </div>

                <div className="table-responsive">
                    <table className="table table-custom align-middle mb-0" style={{ fontSize: '0.85rem' }}>
                        <thead>
                            <tr style={{ background: 'rgba(14, 136, 184, 0.05)' }}>
                                <th>Timestamp</th>
                                <th>Customer Name</th>
                                <th>Branch Location</th>
                                <th>Card Type</th>
                                <th>Action Performed</th>
                                <th>Reward Unlocked</th>
                                <th>Responsible Staff</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLogs.map((tx) => (
                                <tr key={tx.id}>
                                    <td style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{tx.date}</td>
                                    <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{tx.customer}</td>
                                    <td>{tx.branch}</td>
                                    <td>
                                        <span className="badge" style={{ background: tx.cardType === 'Stamp Card' ? 'rgba(239, 0, 3, 0.1)' : 'rgba(245, 158, 11, 0.1)', color: tx.cardType === 'Stamp Card' ? '#EF0003' : '#D97706', fontWeight: 700 }}>
                                            {tx.cardType}
                                        </span>
                                    </td>
                                    <td style={{ fontWeight: 600 }}>{tx.action}</td>
                                    <td style={{ color: 'var(--firstloop-primary)', fontWeight: 700 }}>{tx.rewardUnlocked}</td>
                                    <td>{tx.staff}</td>
                                    <td>
                                        <span className="badge" style={{ background: 'var(--status-success-bg)', color: 'var(--status-success)', fontWeight: 800 }}>
                                            {tx.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
