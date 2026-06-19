import { useEffect, useRef, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import API from '../api.js'
import Dealora from '../assets/img/Dealora.png'
import logo from '../assets/img/new_logo.png'
const navItems = [
    { to: '/dashboard', icon: 'fa-chart-pie', label: 'Dashboard' },
    { to: '/merchants', icon: 'fa-store', label: 'Merchants' },
    { to: '/customers', icon: 'fa-users', label: 'Customers' },
    { to: '/categories', icon: 'fa-tags', label: 'Categories' },
    { to: '/appointments', icon: 'fa-calendar-check', label: 'Appointments' },

    { to: '/coupon-claim', icon: 'fa-ticket-alt', label: 'Coupon Claim' },
 
    { to: '/reports', icon: 'fa-chart-line', label: 'Reports' },
    { to: '/notifications', icon: 'fa-bell', label: 'Notifications' },
       { to: '/settings', icon: 'fa-cog', label: 'Settings' },
]

export default function Navbar() {
    const [profileOpen, setProfileOpen] = useState(false)
    const [mobileOpen, setMobileOpen] = useState(false)
    const [notificationsOpen, setNotificationsOpen] = useState(false)
    const [notifications] = useState([
        {
            id: 1,
            title: 'Subway Approval Pending',
            desc: 'Subway Eatery has uploaded franchise licenses and is awaiting platform approval.',
            category: 'info',
            time: '5 mins ago',
            unread: true
        },
        {
            id: 2,
            title: 'Weekly Scan Capacity Warning',
            desc: 'Zara Summer Campaign has scanned 425 out of 500 max limit coupons. Zara may require a limit increase.',
            category: 'alert',
            time: '32 mins ago',
            unread: true
        },
        {
            id: 3,
            title: 'System Update Installed',
            desc: 'Antigravity Design Engine v2.4.1 has successfully deployed. Table scrollbars and floating layouts are fully accelerated.',
            category: 'success',
            time: 'Yesterday at 11:22 PM',
            unread: false
        },
        {
            id: 4,
            title: 'Auditing Complete',
            desc: 'Hilton Luxury Hotels audits compiled for corporate exports. File download completed.',
            category: 'info',
            time: '2 days ago',
            unread: false
        }
    ])

    const notificationRef = useRef(null)
    const profileRef = useRef(null)
    const navigate = useNavigate()

    const handleLogout = async () => {
        try {
            await API.post('admin/logout')
        } catch (error) {
            console.log(error)
        } finally {
            localStorage.clear();
            navigate('/', { replace: true })
        }
    }

    useEffect(() => {
        function handleClickOutside(event) {
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setNotificationsOpen(false)
            }
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setProfileOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const unreadCount = notifications.filter((item) => item.unread).length

    return (
        <div className="navbar" data-component="navbar">
            <div className="navbar-top">
                <div className="navbar-left">
                    <NavLink to="/dashboard" className="brand-logo-area">
                        <div className="logo-icon desktop-logo-icon">
                            <img src={logo} alt="D" style={{ width: 20, height: 20, objectFit: 'contain' }} />
                        </div>
                        <span className="brand-name">First Pass</span>
                        <img
                            src={Dealora}
                            alt="Dealora"
                            className="mobile-logo-img"
                            style={{ display: 'none', height: 32, objectFit: 'contain' }}
                        />
                    </NavLink>
                </div>

                <div className="navbar-right">
                    <button
                        className="mobile-menu-trigger"
                        aria-label="Toggle Menu"
                        onClick={() => setMobileOpen((state) => !state)}
                    >
                        <i className="fas fa-bars" />
                    </button>

                    <div className="nav-actions-group">
                        <div className="nav-notification-wrapper" ref={notificationRef}>
                            <button
                                className="nav-btn nav-notification-bell"
                                aria-label="Notifications"
                                onClick={() => {
                                    setNotificationsOpen((state) => !state)
                                    setProfileOpen(false)
                                }}
                            >
                                <i className="far fa-bell" />
                                {unreadCount > 0 && <span className="nav-badge" />}
                            </button>
                            <div className={`nav-notification-dropdown${notificationsOpen ? ' active' : ''}`} id="nav-notification-dropdown">
                                <div className="dropdown-header">
                                    <span>Notifications</span>
                                </div>
                                <div className="dropdown-body">
                                    {notifications.length === 0 ? (
                                        <div className="dropdown-empty">No new notifications.</div>
                                    ) : (
                                        <ul className="dropdown-notification-list" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                                            {notifications.map((notification) => (
                                                <li key={notification.id} className={`dropdown-item${notification.unread ? ' unread' : ''}`}>
                                                    <div className={`dropdown-item-icon ${notification.category}`}>
                                                        <i className={`fas ${notification.category === 'success' ? 'fa-check-circle' : notification.category === 'alert' ? 'fa-exclamation-triangle' : 'fa-info-circle'}`} />
                                                    </div>
                                                    <div className="dropdown-item-content">
                                                        <h4 className="dropdown-item-title">{notification.title}</h4>
                                                        <p className="dropdown-item-desc">{notification.desc}</p>
                                                        <span className="dropdown-item-time">{notification.time}</span>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                                <div className="dropdown-footer">
                                    <NavLink to="/notification-list">Go to notification list</NavLink>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="nav-divider" />

                    <div className="nav-user-profile" id="nav-user-profile" ref={profileRef}>
                        {/* <img src="/assets/img/Dealora.png" alt="Dealora" className="desktop-profile-logo" /> */}
                        {/* <div className="mobile-profile-content">
                            <div className="nav-user-avatar">
                                <img src="/assets/img/logo.png" alt="User" style={{ width: 20, height: 20, objectFit: 'contain' }} />
                            </div>
                            <div className="nav-user-info">
                                <span className="nav-user-name">dealora</span>
                            </div>
                        </div> */}
                        <button
                            type="button"
                            className="nav-user-trigger"
                            aria-expanded={profileOpen}
                            onClick={() => {
                                setProfileOpen((state) => !state)
                                setNotificationsOpen(false)
                            }}
                        >
                            <span className="nav-user-name"> <img src={Dealora} alt="Dealora" className="desktop-profile-logo" style={{ width: 150, height: 42, objectFit: 'contain' }} /></span>
                        </button>
                        <div className={`profile-dropdown-menu${profileOpen ? ' active' : ''}`} id="profile-dropdown-menu">
                            <div className="profile-dropdown-item" style={{ pointerEvents: 'none', color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.9rem' }}>
                                Welcome First Pass
                            </div>
                            <NavLink to="/notifications" className="profile-dropdown-item">
                                <i className="fas fa-bell" /> Notification
                            </NavLink>
                            <div className="profile-dropdown-divider" />
                            <button type="button" className="profile-dropdown-item logout" onClick={handleLogout}>
                                <i className="fas fa-sign-out-alt" /> Logout
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="navbar-bottom">
                <div className="navbar-menu-desktop">
                    {navItems.map((item) => (
                        <NavLink key={item.to} to={item.to} className={({ isActive }) => `navbar-item${isActive ? ' active' : ''}`}>
                            <i className={`fas ${item.icon}`} />
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </div>
            </div>

            <div className={`navbar-menu-mobile${mobileOpen ? ' active' : ''}`}>
                {navItems.map((item) => (
                    <NavLink key={item.to} to={item.to} className={({ isActive }) => `mobile-navbar-item${isActive ? ' active' : ''}`} onClick={() => setMobileOpen(false)}>
                        <i className={`fas ${item.icon}`} />
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </div>
        </div>
    )
}
