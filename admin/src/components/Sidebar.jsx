import { NavLink } from 'react-router-dom'

const sidebarItems = [
    { to: '/dashboard', icon: 'fa-chart-pie', label: 'Dashboard' },
    { to: '/merchants', icon: 'fa-store', label: 'Merchants' },
    { to: '/customers', icon: 'fa-users', label: 'Customers' },
    { to: '/categories', icon: 'fa-tags', label: 'Categories' },
    { to: '/appointments', icon: 'fa-calendar-check', label: 'Appointments' },
    { to: '/reports', icon: 'fa-chart-line', label: 'Reports' },
    { to: '/notifications', icon: 'fa-bell', label: 'Notifications' }
]

export default function Sidebar() {
    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <NavLink to="/dashboard" className="brand-logo-area">
                    <div className="logo-icon">
                        <img src="/assets/img/logo.png" alt="D" style={{ width: 20, height: 20, objectFit: 'contain' }} />
                    </div>
                    <span className="brand-name">Dealora</span>
                    <span className="brand-tag">SaaS</span>
                </NavLink>
            </div>

            <ul className="sidebar-menu">
                <span className="menu-label">Main Console</span>
                {sidebarItems.slice(0, 3).map((item) => (
                    <li key={item.to}>
                        <NavLink to={item.to} className={({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`}>
                            <i className={`fas ${item.icon}`} />
                            <span>{item.label}</span>
                        </NavLink>
                    </li>
                ))}

                <span className="menu-label">Campaigns</span>
                {sidebarItems.slice(3, 5).map((item) => (
                    <li key={item.to}>
                        <NavLink to={item.to} className={({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`}>
                            <i className={`fas ${item.icon}`} />
                            <span>{item.label}</span>
                        </NavLink>
                    </li>
                ))}

                <span className="menu-label">Analytics & Center</span>
                {sidebarItems.slice(5).map((item) => (
                    <li key={item.to}>
                        <NavLink to={item.to} className={({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`}>
                            <i className={`fas ${item.icon}`} />
                            <span>{item.label}</span>
                            {item.label === 'Notifications' ? <span className="sidebar-badge">3</span> : null}
                        </NavLink>
                    </li>
                ))}
            </ul>
        </div>
    )
}
