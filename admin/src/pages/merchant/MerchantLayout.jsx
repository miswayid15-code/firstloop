import { useState, useEffect } from 'react'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { MOCK_MERCHANT_PROFILE } from './mockMerchantData'
import flLogo from '../../assets/img/firstloop-favicon.png'
import API from '../../api.js';
// Helper to safely retrieve merchant data from localStorage
const getStoredMerchant = () => {
    try {
        const raw = localStorage.getItem("merchant_data") || localStorage.getItem("mer_data")
        if (raw && raw !== "null" && raw !== "undefined") {
            const parsed = JSON.parse(raw)
            return parsed?.merchant_data || parsed?.data || parsed?.user || parsed || {}
        }
    } catch (e) {
        console.error("Error parsing merchant_data in MerchantLayout:", e)
    }
    return {}
}

export default function MerchantLayout() {
    const navigate = useNavigate()
    const location = useLocation()
    const [mobileOpen, setMobileOpen] = useState(false)
    const [merchant, setMerchant] = useState(getStoredMerchant)

    // Ensure FirstLoop theme is set for merchant portal & refresh merchant data on route changes
    useEffect(() => {
        document.documentElement.setAttribute('data-role', 'firstloop')
        document.body.setAttribute('data-role', 'firstloop')
        document.documentElement.setAttribute('data-theme', 'firstloop')
        document.body.setAttribute('data-theme', 'firstloop')

        setMerchant(getStoredMerchant())
    }, [location.pathname])

    const handleLogout = async () => {
        try {
            let response = null
            try {
                response = await API.post("firstloop/merchant/logout", {}, { skipAuthRedirect: true })
            } catch (err) {
                // If network/token already invalid, continue cleaning up
                response = null
            }

            if (response?.data?.status === 1 || response?.data?.status === "1" || response?.data?.success) {
                toast.success(response.data.message || 'Logged out successfully 👋')
            } else if (response?.data?.message) {
                toast.error(response.data.message)
            } else {
                toast.success('Logged out successfully 👋')
            }
        } catch (error) {
            console.error("Logout Error:", error)
            toast.error("Logged out successfully 👋")
        } finally {
            localStorage.removeItem('mer_access_token')
            localStorage.removeItem('mer_refresh_token')
            localStorage.removeItem('merchant_token')
            localStorage.removeItem('merchant_data')
            localStorage.removeItem('mer_data')
            localStorage.removeItem('mer_user_id')
            navigate('/merchant/login', { replace: true })
        }
    }

    const menuItems = [
        { to: '/merchant/dashboard', icon: 'fa-chart-pie', label: 'Dashboard' },
        { to: '/merchant/customers', icon: 'fa-users', label: 'Customers' },
        { to: '/merchant/cards', icon: 'fa-id-card', label: 'Cards' },
        { to: '/merchant/branches', icon: 'fa-store', label: 'Branches' },
        { to: '/merchant/reports', icon: 'fa-chart-line', label: 'Reports' },
    ]

    return (
        <div className="app-container firstloop-theme" data-role="firstloop" data-theme="firstloop" style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>

            {/* MOBILE NAVIGATION SLIDE-OVER DRAWER OVERLAY */}
            {mobileOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        onClick={() => setMobileOpen(false)}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(15, 23, 42, 0.65)',
                            backdropFilter: 'blur(4px)',
                            zIndex: 1055
                        }}
                    />

                    {/* Sliding Drawer */}
                    <div
                        style={{
                            position: 'fixed',
                            top: 0,
                            bottom: 0,
                            left: 0,
                            width: 280,
                            background: '#FFFFFF',
                            zIndex: 1060,
                            boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
                            display: 'flex',
                            flexDirection: 'column',
                            padding: 0
                        }}
                    >
                        {/* Drawer Header */}
                        <div style={{ padding: '18px 16px', borderBottom: '1px solid rgba(14, 136, 184, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--firstloop-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <img src={flLogo} alt="FirstLoop" style={{ width: 22, height: 22, objectFit: 'contain' }} />
                                </div>
                                <div>
                                    <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)', display: 'block' }}>
                                        Merchant Admin
                                    </span>
                                    <span style={{ fontSize: '0.65rem', color: 'var(--firstloop-primary)', fontWeight: 600 }}>
                                        FirstLoop Portal
                                    </span>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => setMobileOpen(false)}
                                style={{ border: 'none', background: 'none', fontSize: '1.4rem', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
                            >
                                &times;
                            </button>
                        </div>

                        {/* Profile Summary Badge */}
                        <div style={{ padding: '12px 16px', background: 'rgba(14, 136, 184, 0.04)', borderBottom: '1px solid rgba(14, 136, 184, 0.08)', display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 34, height: 34, borderRadius: 8, background: '#FFFFFF', border: '2px solid var(--firstloop-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                <img src={flLogo} alt="Merchant" style={{ width: '80%', height: '80%', objectFit: 'contain' }} />
                            </div>
                            <div style={{ overflow: 'hidden' }}>
                                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                    {merchant?.business_name || merchant?.user_name || merchant?.name || merchant?.email || "Merchant Admin"}
                                </div>
                                {merchant?.email && (
                                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                        {merchant.email}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Menu Navigation Links */}
                        <div style={{ padding: '16px 12px', flex: 1, overflowY: 'auto' }}>
                            <span style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)', paddingLeft: 12, marginBottom: 8, display: 'block', fontWeight: 700 }}>
                                Navigation Console
                            </span>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                {menuItems.map((item) => {
                                    const isActive = location.pathname === item.to
                                    return (
                                        <NavLink
                                            key={item.to}
                                            to={item.to}
                                            onClick={() => setMobileOpen(false)}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 12,
                                                padding: '10px 14px',
                                                borderRadius: 10,
                                                fontSize: '0.88rem',
                                                fontWeight: isActive ? 800 : 600,
                                                color: isActive ? '#FFFFFF' : 'var(--text-primary)',
                                                background: isActive ? 'var(--firstloop-gradient-primary)' : 'transparent',
                                                textDecoration: 'none',
                                                transition: 'all 0.2s ease'
                                            }}
                                        >
                                            <i className={`fas ${item.icon}`} style={{ fontSize: '0.95rem', width: 20, textAlign: 'center' }} />
                                            <span>{item.label}</span>
                                        </NavLink>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Drawer Footer Logout Button */}
                        <div style={{ padding: 16, borderTop: '1px solid rgba(14, 136, 184, 0.1)' }}>
                            <button
                                type="button"
                                onClick={handleLogout}
                                style={{
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 8,
                                    padding: '10px 14px',
                                    borderRadius: 10,
                                    background: '#FEE2E2',
                                    color: '#DC2626',
                                    border: 'none',
                                    fontWeight: 800,
                                    fontSize: '0.85rem',
                                    cursor: 'pointer'
                                }}
                            >
                                <i className="fas fa-sign-out-alt" />
                                <span>Logout</span>
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* MAIN CONTENT AREA */}
            <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%' }}>
                {/* TOP NAVBAR WITH DIRECT NAVIGATION LINKS & LOGOUT */}
                <header
                    style={{
                        background: '#FFFFFF',
                        borderBottom: '1px solid rgba(14, 136, 184, 0.12)',
                        minHeight: 64,
                        padding: '0 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        position: 'sticky',
                        top: 0,
                        zIndex: 100,
                        gap: 12,
                        boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {/* Mobile Hamburger Menu Toggle Button */}
                        <button
                            type="button"
                            className="btn d-md-none"
                            onClick={() => setMobileOpen(!mobileOpen)}
                            style={{ padding: '6px 10px', background: 'var(--firstloop-primary-light)', color: 'var(--firstloop-primary)', borderRadius: 8, border: 'none', fontSize: '1.1rem' }}
                        >
                            <i className="fas fa-bars" />
                        </button>

                        <NavLink to="/merchant/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <img src={flLogo} alt="Logo" style={{ width: 26, height: 26, objectFit: 'contain' }} />
                            {/* <span style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
                                {MOCK_MERCHANT_PROFILE.name}
                            </span> */}
                        </NavLink>
                    </div>

                    {/* TOP NAVBAR NAVIGATION ITEMS (Desktop) */}
                    <nav style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }} className="d-none d-md-flex">
                        {menuItems.map((item) => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                style={({ isActive }) => ({
                                    padding: '8px 14px',
                                    borderRadius: 8,
                                    fontSize: '0.85rem',
                                    fontWeight: isActive ? 700 : 600,
                                    color: isActive ? 'var(--firstloop-primary)' : 'var(--text-secondary)',
                                    background: isActive ? 'var(--firstloop-primary-light)' : 'transparent',
                                    textDecoration: 'none',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    transition: 'all 0.2s ease'
                                })}
                            >
                                <i className={`fas ${item.icon}`} style={{ fontSize: '0.85rem' }} />
                                <span>{item.label}</span>
                            </NavLink>
                        ))}
                    </nav>

                    {/* RIGHT TOP LOGOUT & PROFILE BUTTON */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 10px', background: '#F1F5F9', borderRadius: 10 }} className="d-none d-sm-flex">
                            <div
                                style={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: 'var(--firstloop-primary)',
                                    color: '#FFFFFF',
                                    fontSize: '0.75rem',
                                    fontWeight: 800
                                }}
                            >
                                {(merchant?.business_name || merchant?.user_name || merchant?.name || merchant?.email || "M").charAt(0).toUpperCase()}
                            </div>
                            <div style={{ lineHeight: 1.1, maxWidth: 150, overflow: 'hidden' }}>
                                <strong style={{ fontSize: '0.78rem', color: 'var(--text-primary)', display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                    {merchant?.business_name || merchant?.user_name || merchant?.name || merchant?.email || "Merchant"}
                                </strong>
                                <span style={{ fontSize: '0.66rem', color: 'var(--firstloop-primary)', fontWeight: 700 }}>
                                    Merchant Portal
                                </span>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleLogout}
                            className="btn btn-sm"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '6px 12px',
                                borderRadius: 8,
                                background: 'var(--status-danger-bg)',
                                color: 'var(--status-danger)',
                                border: '1px solid rgba(220, 38, 38, 0.2)',
                                fontWeight: 700,
                                fontSize: '0.8rem',
                                cursor: 'pointer'
                            }}
                        >
                            <i className="fas fa-sign-out-alt" />
                            <span className="d-none d-sm-inline">Logout</span>
                        </button>
                    </div>
                </header>

                {/* PAGE CONTAINER */}
                <main style={{ flex: 1, padding: '16px 14px 80px', maxWidth: 1400, width: '100%', margin: '0 auto' }}>
                    <Outlet />
                </main>

                {/* FLOATING MOBILE BOTTOM NAVIGATION BAR FOR MERCHANT */}
                <div className="mobile-bottom-nav">
                    {menuItems.map((item) => {
                        const isActive = location.pathname === item.to
                        return (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                className={`mobile-nav-item ${isActive ? 'active' : ''}`}
                            >
                                <i className={`fas ${item.icon}`} />
                                <span>{item.label}</span>
                            </NavLink>
                        )
                    })}
                </div>

                {/* FOOTER */}
                <footer style={{ padding: '16px 20px', borderTop: '1px solid rgba(14, 136, 184, 0.1)', background: '#FFFFFF', textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    &copy; 2026 FirstLoop Merchant Admin Portal &bull; All rights reserved.
                </footer>
            </div>
        </div>
    )
}
