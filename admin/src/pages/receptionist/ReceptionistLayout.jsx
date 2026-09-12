import { useState, useEffect } from 'react'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import API from '../../api.js'
import { checkAccountStatusApi } from '../../services/accountStatusService.js'
import AccountRestrictedSupportModal from '../../components/AccountRestrictedSupportModal.jsx'

export default function ReceptionistLayout() {
    const navigate = useNavigate()
    const location = useLocation()
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [accountStatus, setAccountStatus] = useState(null)
    const [supportModalOpen, setSupportModalOpen] = useState(false)

    let receptionist = {}
    try {
        const rawReceptionist = localStorage.getItem("receptionist_data") || localStorage.getItem("rec_data")
        if (rawReceptionist && rawReceptionist !== "null" && rawReceptionist !== "undefined") {
            const parsed = JSON.parse(rawReceptionist)
            receptionist = parsed?.data || parsed?.user || parsed || {}
        }
        if (!receptionist.user_repId && localStorage.getItem("rec_user_repId")) {
            receptionist.user_repId = localStorage.getItem("rec_user_repId")
        }
        if (!receptionist.user_id && localStorage.getItem("rec_user_id")) {
            receptionist.user_id = localStorage.getItem("rec_user_id")
        }
    } catch (e) {
        console.error("Error parsing receptionist_data:", e)
    }

    const recId = receptionist.user_id || receptionist.id || receptionist.user_repId || localStorage.getItem("rec_user_id") || localStorage.getItem("rec_user_repId")

    useEffect(() => {
        let isMounted = true
        const checkStatus = async () => {
            if (!recId) return
            const res = await checkAccountStatusApi(2, recId)
            if (isMounted) {
                setAccountStatus(res)
                if (!res.isActive) {
                    if (location.pathname !== '/receptionist/dashboard') {
                        toast.error(res.message || "Account is inactive or deleted. Restricted to dashboard.", { id: 'rec-inactive-toast' })
                        navigate('/receptionist/dashboard', { replace: true })
                    }
                }
            }
        }

        checkStatus()
        return () => { isMounted = false }
    }, [location.pathname, recId])

    const handleLogout = async () => {


        try {
            let response = null
            try {
                response = await API.post('firstloop/reception/logout', {}, { skipAuthRedirect: true })
            } catch (err1) {
                try {
                    response = await API.post('firstloop/merchant/logout', {}, { skipAuthRedirect: true })
                } catch (err2) {
                    response = null
                }
            }

            if (response?.data?.status === 1 || response?.data?.status === "1" || response?.data?.success) {
                toast.success(response.data.message || 'Logged out of Receptionist Terminal 👋')
            } else if (response?.data?.message) {
                toast.error(response.data.message)
            } else {
                toast.success('Logged out of Receptionist Terminal 👋')
            }
        } catch (error) {
            const errMsg = error?.response?.data?.message || 'Logout failed'
            toast.error(errMsg)
        } finally {
            localStorage.removeItem('rec_access_token')
            localStorage.removeItem('rec_refresh_token')
            localStorage.removeItem('receptionist_token')
            localStorage.removeItem('receptionist_data')
            localStorage.removeItem('rec_data')
            localStorage.removeItem('rec_user_id')
            localStorage.removeItem('rec_user_repId')
            navigate('/receptionist/login', { replace: true })
        }
    }

    const isAccountActive = accountStatus ? accountStatus.isActive : true

    const allNavLinks = [
        { to: '/receptionist/dashboard', icon: 'fa-chart-line', label: 'Dashboard' },
        { to: '/receptionist/customers', icon: 'fa-users', label: 'Customers' },
        // { to: '/receptionist/checkin', icon: 'fa-qrcode', label: 'Check-In & Pay' }
    ]

    const navLinks = isAccountActive
        ? allNavLinks
        : allNavLinks.filter(item => item.to === '/receptionist/dashboard')

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
                                    {receptionist.user_branch || "Branch"}
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
                                <div
                                    style={{
                                        width: 30,
                                        height: 30,
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        background: 'var(--firstloop-primary)',
                                        color: '#fff',
                                        border: '2px solid var(--firstloop-primary)'
                                    }}
                                >
                                    <i className="fa-solid fa-user"></i>
                                </div>
                                <div style={{ lineHeight: 1.1 }}>
                                    <strong style={{ fontSize: '0.78rem', color: 'var(--text-primary)', display: 'block' }}>
                                        {receptionist.user_name || "Receptionist"}
                                    </strong>
                                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                                        ID: {receptionist.user_repId}
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
                {!isAccountActive && (
                    <div
                        style={{
                            background: 'linear-gradient(135deg, #FEF2F2 0%, #FFF1F2 100%)',
                            border: '1px solid #FCA5A5',
                            borderLeft: '5px solid #EF4444',
                            borderRadius: 14,
                            padding: '16px 20px',
                            marginBottom: 20,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 16,
                            flexWrap: 'wrap',
                            boxShadow: '0 4px 14px rgba(239, 68, 68, 0.08)'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                            <div
                                style={{
                                    width: 42,
                                    height: 42,
                                    borderRadius: 10,
                                    background: '#FEE2E2',
                                    color: '#DC2626',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '1.25rem',
                                    flexShrink: 0
                                }}
                            >
                                <i className="fas fa-exclamation-triangle" />
                            </div>
                            <div>
                                <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: '#991B1B' }}>
                                     Account Suspended
                                </h4>
                                <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: '#B91C1C', lineHeight: 1.4 }}>
                                    {accountStatus?.message || "Your receptionist terminal has been marked inactive or deleted. Customer operations and terminal features are locked."}
                                </p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                            <span
                                style={{
                                    background: '#DC2626',
                                    color: '#FFFFFF',
                                    fontSize: '0.75rem',
                                    fontWeight: 800,
                                    padding: '6px 14px',
                                    borderRadius: 8,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                }}
                            >
                               RESTRICTED
                            </span>
                            <button
                                type="button"
                                onClick={() => setSupportModalOpen(true)}
                                style={{
                                    background: '#991B1B',
                                    color: '#FFFFFF',
                                    border: 'none',
                                    borderRadius: 8,
                                    padding: '6px 14px',
                                    fontSize: '0.8rem',
                                    fontWeight: 800,
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    boxShadow: '0 2px 8px rgba(153, 27, 27, 0.3)'
                                }}
                            >
                                <i className="fas fa-headset" />
                                <span>Contact Support</span>
                            </button>
                        </div>
                    </div>
                )}
                <Outlet context={{ isAccountActive, accountMessage: accountStatus?.message, openSupportModal: () => setSupportModalOpen(true) }} />

                {/* Support Popup Modal */}
                <AccountRestrictedSupportModal
                    isOpen={supportModalOpen}
                    onClose={() => setSupportModalOpen(false)}
                    userType={2}
                    accountMessage={accountStatus?.message}
                />
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
