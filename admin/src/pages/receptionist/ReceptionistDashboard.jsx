import { useNavigate } from 'react-router-dom'
import { MOCK_RECEPTIONIST_PROFILE, RECEPTIONIST_STATS, TODAY_CHECKINS } from './mockReceptionistData'

export default function ReceptionistDashboard() {
    const navigate = useNavigate()

    return (
        <div style={{ paddingBottom: 40 }}>
            {/* Header Banner */}
            <div className="flex-between mb-4" style={{ flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.45rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                        Receptionist Counter Dashboard
                    </h2>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>
                        Welcome back, <strong>{MOCK_RECEPTIONIST_PROFILE.name}</strong>
                    </p>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                    <button
                        type="button"
                        className="btn firstloop-btn-primary"
                        onClick={() => navigate('/receptionist/checkin?mode=qr')}
                        style={{ padding: '10px 18px', borderRadius: 12, fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 8 }}
                    >
                        <i className="fas fa-qrcode" style={{ fontSize: '1.1rem' }} />
                        <span>Scan QR Code</span>
                    </button>

                    <button
                        type="button"
                        className="btn firstloop-btn-secondary"
                        onClick={() => navigate('/receptionist/checkin?mode=phone')}
                        style={{ padding: '10px 18px', borderRadius: 12, fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 8 }}
                    >
                        <i className="fas fa-phone-alt" />
                        <span>Phone Search</span>
                    </button>
                </div>
            </div>

            {/* KEY STATISTICS OVERVIEW CARDS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 28 }}>
                {/* 1. Active Customers */}
                <div
                    className="card"
                    style={{
                        borderRadius: 18,
                        padding: 22,
                        background: '#FFFFFF',
                        border: '1px solid rgba(14, 136, 184, 0.15)',
                        boxShadow: '0 8px 24px -4px rgba(14, 136, 184, 0.08)'
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            BRANCH CUSTOMERS
                        </span>
                        <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--firstloop-primary-light)', color: 'var(--firstloop-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 800 }}>
                            <i className="fas fa-users" />
                        </div>
                    </div>
                    <h3 style={{ fontSize: '2rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                        {RECEPTIONIST_STATS.activeCustomers}
                    </h3>
                    <div style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 700, marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <i className="fas fa-check-circle" />
                        <span>Active Enrolled Customers</span>
                    </div>
                </div>

                {/* 2. Active Stamp Cards */}
                <div
                    className="card"
                    style={{
                        borderRadius: 18,
                        padding: 22,
                        background: '#FFFFFF',
                        border: '1px solid rgba(2, 132, 199, 0.15)',
                        boxShadow: '0 8px 24px -4px rgba(2, 132, 199, 0.08)'
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            STAMP CARDS
                        </span>
                        <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(2, 132, 199, 0.12)', color: '#0284C7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 800 }}>
                            <i className="fas fa-stamp" />
                        </div>
                    </div>
                    <h3 style={{ fontSize: '2rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                        {RECEPTIONIST_STATS.activeStampCards}
                    </h3>
                    <div style={{ fontSize: '0.78rem', color: '#0284C7', fontWeight: 700, marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <i className="fas fa-stamp" />
                        <span>Active Stamp Passes Issued</span>
                    </div>
                </div>

                {/* 3. Active Membership Cards */}
                <div
                    className="card"
                    style={{
                        borderRadius: 18,
                        padding: 22,
                        background: '#FFFFFF',
                        border: '1px solid rgba(245, 158, 11, 0.2)',
                        boxShadow: '0 8px 24px -4px rgba(245, 158, 11, 0.08)'
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            MEMBERSHIP CARDS
                        </span>
                        <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(245, 158, 11, 0.12)', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 800 }}>
                            <i className="fas fa-crown" />
                        </div>
                    </div>
                    <h3 style={{ fontSize: '2rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                        {RECEPTIONIST_STATS.activeMembershipCards}
                    </h3>
                    <div style={{ fontSize: '0.78rem', color: '#D97706', fontWeight: 700, marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <i className="fas fa-crown" />
                        <span>Active VIP Membership Passes</span>
                    </div>
                </div>
            </div>

            {/* QUICK ACTIONS BANNER */}
            <div
                className="card mb-4"
                style={{
                    padding: 24,
                    borderRadius: 20,
                    background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
                    color: '#FFFFFF'
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
                    <div>
                        <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#38BDF8', fontWeight: 800 }}>
                            CARD TERMINAL QUICK DESK
                        </span>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '4px 0 0 0', color: '#FFFFFF' }}>
                            Customer Card Check-In & Entry Terminal
                        </h3>
                        <p style={{ fontSize: '0.84rem', color: '#94A3B8', marginTop: 4, marginBottom: 0 }}>
                            Perform instant stamp pass updates and daily membership check-in entries using Phone Search or QR Scanner.
                        </p>
                    </div>

                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        <button
                            type="button"
                            className="btn"
                            onClick={() => navigate('/receptionist/checkin?mode=phone')}
                            style={{ padding: '10px 18px', borderRadius: 10, background: '#FFFFFF', color: '#0F172A', fontWeight: 800, fontSize: '0.85rem' }}
                        >
                            <i className="fas fa-search" style={{ marginRight: 6 }} /> Phone Search Entry
                        </button>
                        <button
                            type="button"
                            className="btn firstloop-btn-primary"
                            onClick={() => navigate('/receptionist/checkin?mode=qr')}
                            style={{ padding: '10px 18px', borderRadius: 10, fontWeight: 800, fontSize: '0.85rem' }}
                        >
                            <i className="fas fa-qrcode" style={{ marginRight: 6 }} /> Open QR Camera
                        </button>
                    </div>
                </div>
            </div>

            {/* TODAY'S CHECK-IN LOG ACTIVITY TABLE */}
            <div className="card" style={{ padding: 0, overflow: 'hidden', borderRadius: 18, border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                <div style={{ padding: '18px 22px', borderBottom: '1px solid #E2E8F0', background: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h4 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                            Today's Check-In & Payment Activity Log
                        </h4>
                        <small style={{ color: 'var(--text-muted)' }}>Real-time terminal updates logged by receptionist staff.</small>
                    </div>
                    <span style={{ fontSize: '0.78rem', background: 'rgba(16, 185, 129, 0.12)', color: '#059669', fontWeight: 800, padding: '4px 10px', borderRadius: 8 }}>
                        {TODAY_CHECKINS.length} Check-Ins Today
                    </span>
                </div>

                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                            <tr>
                                <th style={{ padding: '12px 18px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Time</th>
                                <th style={{ padding: '12px 18px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Customer Name</th>
                                <th style={{ padding: '12px 18px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Card Pass Issued</th>
                                <th style={{ padding: '12px 18px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Payment Method</th>
                                <th style={{ padding: '12px 18px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Amount</th>
                                <th style={{ padding: '12px 18px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {TODAY_CHECKINS.map((log) => (
                                <tr key={log.id}>
                                    <td style={{ padding: '14px 18px', fontWeight: 700, fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                                        {log.time}
                                    </td>
                                    <td style={{ padding: '14px 18px' }}>
                                        <strong style={{ fontSize: '0.88rem', color: 'var(--text-primary)', display: 'block' }}>
                                            {log.customerName}
                                        </strong>
                                        <small style={{ color: 'var(--text-muted)' }}>{log.phone}</small>
                                    </td>
                                    <td style={{ padding: '14px 18px' }}>
                                        {log.cardType === 'stamp' ? (
                                            <span className="badge" style={{ background: 'var(--firstloop-primary-light)', color: 'var(--firstloop-primary)', fontWeight: 700, padding: '6px 10px', borderRadius: 8 }}>
                                                <i className="fas fa-stamp" style={{ marginRight: 4 }} />
                                                {log.cardTitle} (+{log.stampsAdded} Stamp)
                                            </span>
                                        ) : (
                                            <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#D97706', fontWeight: 700, padding: '6px 10px', borderRadius: 8 }}>
                                                <i className="fas fa-crown" style={{ marginRight: 4 }} />
                                                {log.cardTitle} (Daily Visit)
                                            </span>
                                        )}
                                    </td>
                                    <td style={{ padding: '14px 18px', fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                                        {log.paymentMethod}
                                    </td>
                                    <td style={{ padding: '14px 18px', fontWeight: 800, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                                        {log.amount}
                                    </td>
                                    <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                                        <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#059669', fontWeight: 800, padding: '6px 12px', borderRadius: 8 }}>
                                            <i className="fas fa-check-circle" style={{ marginRight: 4 }} />
                                            {log.status}
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
