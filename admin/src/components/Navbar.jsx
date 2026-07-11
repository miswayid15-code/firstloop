import { useEffect, useRef, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { FaUserCircle } from "react-icons/fa";
import API from '../api.js'
import FirstPass from '../assets/img/FirePass1.png'
import logo from '../assets/img/new_logo.png'
const navItems = [
    { to: '/dashboard', icon: 'fa-chart-pie', label: 'Dashboard' },
    { to: '/merchants', icon: 'fa-store', label: 'Merchants' },
    { to: '/customers', icon: 'fa-users', label: 'Customers' },
    { to: '/categories', icon: 'fa-tags', label: 'Categories' },
    { to: '/appointments', icon: 'fa-calendar-check', label: 'Appointments' },

    { to: '/coupon-claim', icon: 'fa-ticket-alt', label: 'Coupon Claim' },
 
    { to: '/merchant-reports', icon: 'fa-store', label: 'Reports' },
   
    { to: '/notifications', icon: 'fa-bell', label: 'Notifications' },
    { to: '/settings', icon: 'fa-cog', label: 'Settings' },
]

export default function Navbar() {
    const [profileOpen, setProfileOpen] = useState(false)
    const [mobileOpen, setMobileOpen] = useState(false)
    const [notificationsOpen, setNotificationsOpen] = useState(false)
    const [incomingNotifications, setIncomingNotifications] = useState([])
    const [loadingNotifications, setLoadingNotifications] = useState(true)

    const fetchIncomingNotifications = async () => {
        try {
            setLoadingNotifications(true)
            const response = await API.post('admin/new-incoming-list')
            if (response.data && (response.data.status === 1 || response.data.status === '1')) {
                setIncomingNotifications(response.data.data || [])
            }
        } catch (error) {
            console.error('Error fetching incoming notifications:', error)
        } finally {
            setLoadingNotifications(false)
        }
    }

    useEffect(() => {
        fetchIncomingNotifications()
    }, [])

    const getNotificationTypeDetails = (type) => {
        switch (type) {
            case 1:
                return { icon: 'fa-store', bg: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6', route: '/merchants' };
            case 2:
                return { icon: 'fa-users', bg: 'rgba(16, 185, 129, 0.12)', color: '#10b981', route: '/customers' };
            case 3:
                return { icon: 'fa-store-alt', bg: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', route: '/merchants' };
            case 4:
                return { icon: 'fa-calendar-check', bg: 'rgba(139, 92, 246, 0.12)', color: '#8b5cf6', route: '/appointments' };
            case 5:
                return { icon: 'fa-ticket-alt', bg: 'rgba(236, 72, 153, 0.12)', color: '#ec4899', route: '/coupon-claim' };
            case 6: // Pending Menu Images
                return { icon: 'fa-utensils', bg: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', route: '/merchants' };
            case 7: // Pending Branch Images
                return { icon: 'fa-images', bg: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', route: '/merchants' };
            case 8: // Pending Branch Profile Images
                return { icon: 'fa-image', bg: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', route: '/merchants' };
            default:
                return { icon: 'fa-info-circle', bg: 'rgba(75, 85, 99, 0.12)', color: '#4b5563', route: '/dashboard' };
        }
    }

    const getNotificationDesc = (item) => {
        const { count } = item;
        switch (item.type) {
            case 1:
                return `${count} new merchant ${count === 1 ? 'registration' : 'registrations'} pending approval.`;
            case 2:
                return `${count} new customer ${count === 1 ? 'has' : 'have'} registered today.`;
            case 3:
                return `${count} new branch ${count === 1 ? 'outlet is' : 'outlets are'} pending verification.`;
            case 4:
                return `${count} new ${count === 1 ? 'appointment' : 'appointments'} scheduled for today.`;
            case 5:
                return `${count} new coupon ${count === 1 ? 'redemption' : 'redemptions'} recorded today.`;
            case 6:
                return `${count} menu ${count === 1 ? 'image' : 'images'} awaiting verification.`;
            case 7:
                return `${count} branch gallery ${count === 1 ? 'image' : 'images'} awaiting verification.`;
            case 8:
                return `${count} branch profile ${count === 1 ? 'image' : 'images'} awaiting verification.`;
            default:
                return `You have ${count} pending items.`;
        }
    }

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

    const activeNotifications = incomingNotifications.filter((item) => item.count > 0)
    const unreadCount = activeNotifications.reduce((acc, item) => acc + item.count, 0)

    return (
        <div className="admin-navbar" data-component="navbar">
            <div className="navbar-top">
                <div className="navbar-left">
                    <NavLink to="/dashboard" className="brand-logo-area">
                                           <div className="nav-user-profile" id="nav-user-profile" ref={profileRef}>
                        {/* <img src="/assets/img/FirstPass.png" alt="FirstPass" className="desktop-profile-logo" /> */}
                        {/* <div className="mobile-profile-content">
                            <div className="nav-user-avatar">
                                <img src="/assets/img/logo.png" alt="User" style={{ width: 20, height: 20, objectFit: 'contain' }} />
                            </div>
                            <div className="nav-user-info">
                                <span className="nav-user-name">FirstPass</span>
                            </div>
                        </div> */}
                        <button
                            type="button"
                            className="nav-user-trigger"
                            aria-expanded={profileOpen}
                           
                        >
                            <span className="nav-user-name"> <img src={FirstPass} alt="FirstPass" className="desktop-profile-logo" style={{ width: 150, height: 42, objectFit: 'contain' }} /></span>
                        </button>
                       
                    </div>
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
                                    const nextState = !notificationsOpen
                                    setNotificationsOpen(nextState)
                                    setProfileOpen(false)
                                    if (nextState) {
                                        fetchIncomingNotifications()
                                    }
                                }}
                            >
                                <i className="far fa-bell" />
                                {unreadCount > 0 && <span className="nav-badge" />}
                            </button>
                            <div className={`nav-notification-dropdown${notificationsOpen ? ' active' : ''}`} id="nav-notification-dropdown" style={{ minWidth: '340px' }}>
                                <div className="dropdown-header">
                                    <span>Notifications</span>
                                    {unreadCount > 0 && (
                                        <span style={{ fontSize: '0.72rem', background: 'var(--primary-light)', color: 'var(--primary)', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
                                            {unreadCount} New Action{unreadCount > 1 ? 's' : ''}
                                        </span>
                                    )}
                                </div>
                                <div className="dropdown-body">
                                    {loadingNotifications ? (
                                        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                            <i className="fas fa-spinner fa-spin" style={{ marginRight: '8px' }}></i> Loading...
                                        </div>
                                    ) : activeNotifications.length === 0 ? (
                                        <div className="dropdown-empty">No new notifications.</div>
                                    ) : (
                                        <ul className="dropdown-notification-list" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                                            {activeNotifications.map((item) => {
                                                const details = getNotificationTypeDetails(item.type);
                                                return (
                                                    <li 
                                                        key={item.type} 
                                                        className="dropdown-item unread"
                                                        onClick={() => {
                                                            setNotificationsOpen(false);
                                                            navigate(details.route);
                                                        }}
                                                        style={{ cursor: 'pointer', display: 'flex', gap: '12px', padding: '12px 16px', borderBottom: '1px solid rgba(0,0,0,0.04)', transition: 'background 0.2s' }}
                                                    >
                                                        <div 
                                                            className="dropdown-item-icon" 
                                                            style={{ 
                                                                background: details.bg, 
                                                                color: details.color,
                                                                width: '32px',
                                                                height: '32px',
                                                                borderRadius: '50%',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                flexShrink: 0
                                                            }}
                                                        >
                                                            <i className={`fas ${details.icon}`} />
                                                        </div>
                                                        <div className="dropdown-item-content" style={{ flex: 1 }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                                                <h4 className="dropdown-item-title" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{item.title}</h4>
                                                                <span style={{ fontSize: '0.72rem', background: details.bg, color: details.color, padding: '1px 6px', borderRadius: '10px', fontWeight: 700 }}>
                                                                    {item.count}
                                                                </span>
                                                            </div>
                                                            <p className="dropdown-item-desc" style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', margin: '4px 0 0 0', lineHeight: 1.3 }}>{getNotificationDesc(item)}</p>
                                                        </div>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    )}
                                </div>
                                <div className="dropdown-footer">
                                    {/* <NavLink to="/notifications" onClick={() => setNotificationsOpen(false)}>Go to notifications</NavLink> */}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="nav-divider" />

                    <div className="nav-user-profile" id="nav-user-profile" ref={profileRef}>
                        {/* <img src="/assets/img/FirstPass.png" alt="FirstPass" className="desktop-profile-logo" /> */}
                        {/* <div className="mobile-profile-content">
                            <div className="nav-user-avatar">
                                <img src="/assets/img/logo.png" alt="User" style={{ width: 20, height: 20, objectFit: 'contain' }} />
                            </div>
                            <div className="nav-user-info">
                                <span className="nav-user-name">FirstPass</span>
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
                            <div className="nav-user-avatar">
                                <i className="fas fa-user" />
                            </div>
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
