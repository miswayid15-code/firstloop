import { NavLink } from 'react-router-dom';

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-inner">
          <div className="footer-links">
            <NavLink to="/about">About Us</NavLink>
            <NavLink to="/privacy">Privacy Policy</NavLink>
            <NavLink to="/terms">Terms &amp; Conditions</NavLink>
          </div>
          <p>© {year} Dealora. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
