import { useState } from 'react'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { MOCK_RECEPTIONIST_PROFILE } from './mockReceptionistData'

export default function ReceptionistLayout() {
    const navigate = useNavigate()
    const location = useLocation()
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    const handleLogout = () => {
        if (window.confirm('Are you sure you want to log out of Receptionist Terminal?')) {
            navigate('/merchant/login')
        }
    }

    const navLinks = [
        { to: '/receptionist/dashboard', icon: 'fa-chart-line', label: 'Dashboard' },
        { to: '/receptionist/customers', icon: 'fa-users', label: 'Customers' },
        { to: '/receptionist/checkin', icon: 'fa-qrcode', label: 'Check-In & Pay' }
    ]

    return (
        <div style={{ minHeight: '100vh', background: '#F8FAFC' }}>
            {/* Receptionist Top Header Bar */}
            <header
                style={{
                    background: '#FFFFFF',
                    borderBottom: '1px solid #E2E8F0',
                    position: 'sticky',
                    top: 0,
                    zIndex: 1000,
                    boxShadow: '0 4px 20px -2px rgba(0,0,0,0.04)'
                }}
            >
                <div className="container-fluid" style={{ maxWidth: 1400, padding: '0 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 64, py: 2 }}>
                        {/* Brand & Mobile Hamburger Toggle */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <button
                                type="button"
                                className="btn d-md-none"
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                style={{ padding: '6px 10px', background: 'var(--firstloop-primary-light)', color: 'var(--firstloop-primary)', borderRadius: 8, border: 'none', fontSize: '1.1rem' }}
                            >
                                <i className={`fas ${mobileMenuOpen ? 'fa-times' : 'fa-bars'}`} />
                            </button>

                            <div
                                style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: 10,
                                    background: 'var(--firstloop-gradient-primary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#FFFFFF',
                                    fontWeight: 800,
                                    boxShadow: '0 4px 12px rgba(14,136,184,0.3)',
                                    flexShrink: 0
                                }}
                            >
                                <i className="fas fa-concierge-bell" style={{ fontSize: '1rem' }} />
                            </div>

                            <div style={{ minWidth: 0 }}>
                                <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '0.98rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                    <span>Receptionist Desk</span>
                                    <span style={{ fontSize: '0.65rem', fontWeight: 800, background: 'rgba(14, 136, 184, 0.12)', color: 'var(--firstloop-primary)', padding: '2px 6px', borderRadius: 4, textTransform: 'uppercase' }}>
                                        Branch Terminal
                                    </span>
                                </h1>
                                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0, display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    <i className="fas fa-map-marker-alt" style={{ color: 'var(--firstloop-primary)' }} />
                                    {MOCK_RECEPTIONIST_PROFILE.branchName}
                                </p>
                            </div>
                        </div>

                        {/* Navigation Links Desktop */}
                        <nav style={{ display: 'flex', alignItems: 'center', gap: 8 }} className="d-none d-md-flex">
                            {navLinks.map((link) => (
                                <NavLink
                                    key={link.to}
                                    to={link.to}
                                    className={({ isActive }) => `btn btn-sm ${isActive ? 'firstloop-btn-primary' : 'btn-light'}`}
                                    style={{ borderRadius: 10, padding: '8px 16px', fontWeight: 700, fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: 6 }}
                                >
                                    <i className={`fas ${link.icon}`} />
                                    <span>{link.label}</span>
                                </NavLink>
                            ))}
                        </nav>

                        {/* Staff Profile Tag & Logout (Desktop) */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }} className="d-none d-sm-flex">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 10px', background: '#F1F5F9', borderRadius: 10 }}>
                                <img
                                    src={MOCK_RECEPTIONIST_PROFILE.avatar}
                                    alt={MOCK_RECEPTIONIST_PROFILE.name}
                                    style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--firstloop-primary)' }}
                                />
                                <div style={{ lineHeight: 1.1 }}>
                                    <strong style={{ fontSize: '0.78rem', color: 'var(--text-primary)', display: 'block' }}>
                                        {MOCK_RECEPTIONIST_PROFILE.name}
                                    </strong>
                                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                                        ID: {MOCK_RECEPTIONIST_PROFILE.staffId}
                                    </span>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={handleLogout}
                                className="btn btn-outline-danger btn-sm"
                                style={{ padding: '6px 12px', borderRadius: 8, fontWeight: 700, fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 4 }}
                                title="Logout of Receptionist Terminal"
                            >
                                <i className="fas fa-sign-out-alt" />
                                <span>Logout</span>
                            </button>
                        </div>
                    </div>

                    {/* COLLAPSIBLE MOBILE NAV MENU */}
                    {mobileMenuOpen && (
                        <div className="d-md-none" style={{ borderTop: '1px solid #E2E8F0', padding: '12px 0 16px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {navLinks.map((link) => {
                                    const isActive = location.pathname === link.to
                                    return (
                                        <NavLink
                                            key={link.to}
                                            to={link.to}
                                            onClick={() => setMobileMenuOpen(false)}
                                            style={{
                                                padding: '10px 14px',
                                                borderRadius: 10,
                                                background: isActive ? 'var(--firstloop-gradient-primary)' : '#F8FAFC',
                                                color: isActive ? '#FFFFFF' : 'var(--text-primary)',
                                                fontWeight: 800,
                                                fontSize: '0.88rem',
                                                textDecoration: 'none',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 10
                                            }}
                                        >
                                            <i className={`fas ${link.icon}`} />
                                            <span>{link.label}</span>
                                        </NavLink>
                                    )
                                })}

                                <button
                                    type="button"
                                    onClick={handleLogout}
                                    style={{
                                        padding: '10px 14px',
                                        borderRadius: 10,
                                        background: '#FEE2E2',
                                        color: '#DC2626',
                                        fontWeight: 800,
                                        fontSize: '0.88rem',
                                        border: 'none',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 10,
                                        marginTop: 4
                                    }}
                                >
                                    <i className="fas fa-sign-out-alt" />
                                    <span>Logout of Terminal</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </header>

            {/* Main Content View */}
            <main style={{ maxWidth: 1400, margin: '0 auto', padding: '16px 14px 80px' }}>
                <Outlet />
            </main>

            {/* FLOATING MOBILE BOTTOM NAVIGATION BAR FOR RECEPTIONIST */}
            <div className="mobile-bottom-nav">
                {navLinks.map((link) => {
                    const isActive = location.pathname === link.to
                    return (
                        <NavLink
                            key={link.to}
                            to={link.to}
                            className={`mobile-nav-item ${isActive ? 'active' : ''}`}
                        >
                            <i className={`fas ${link.icon}`} />
                            <span>{link.label}</span>
                        </NavLink>
                    )
                })}
            </div>
        </div>
    )
}
