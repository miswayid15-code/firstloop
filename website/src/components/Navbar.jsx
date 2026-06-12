import { NavLink } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="navbar" role="navigation" aria-label="Main navigation">
      <div className="container">
        <NavLink to="/" className="nav-brand">
          <img src="/logo.png" alt="Dealora logo" />
          {/* Dealora */}
        </NavLink>
        <ul className="nav-links">
          <li><NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''}>Home</NavLink></li>
          <li><NavLink to="/about" className={({ isActive }) => isActive ? 'active' : ''}>About</NavLink></li>
          <li><NavLink to="/privacy" className={({ isActive }) => isActive ? 'active' : ''}>Privacy</NavLink></li>
          <li><NavLink to="/terms" className={({ isActive }) => isActive ? 'active' : ''}>Terms</NavLink></li>
        </ul>
      </div>
    </nav>
  );
}
