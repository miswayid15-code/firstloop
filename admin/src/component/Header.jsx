import React from 'react';
import { NavLink, Link } from 'react-router-dom';

export default function Header() {
  return (
    <header className="tf-header header2">
      <div className="header-inner">
        <Link to="/" className="logo-site">
          <img src="asset/images/img/new-logo.png" alt="" />
        </Link>
        <div className="box-navigation">
          <ul className="nav-menu-main">
            <li className="menu-item">
              <NavLink to="/" className={({ isActive }) => `item-link link1 ${isActive ? 'active' : ''}`}>Home</NavLink>
            </li>
            <li className="menu-item">
              <NavLink to="/how-it-works" className={({ isActive }) => `item-link link1 ${isActive ? 'active' : ''}`}>How It Works</NavLink>
            </li>
            {/* <li className="menu-item">
              <NavLink to="/company" className={({ isActive }) => `item-link link1 ${isActive ? 'active' : ''}`}>About</NavLink>
            </li>
            <li className="menu-item">
              <NavLink to="/offerings" className={({ isActive }) => `item-link link1 ${isActive ? 'active' : ''}`}>Offerings</NavLink>
            </li>
            <li className="menu-item">
              <NavLink to="/portfolio" className={({ isActive }) => `item-link link1 ${isActive ? 'active' : ''}`}>Portfolio</NavLink>
            </li>
            <li className="menu-item">
              <NavLink to="/journal" className={({ isActive }) => `item-link link1 ${isActive ? 'active' : ''}`}>Journal</NavLink>
            </li> */}
            <li className="menu-item">
              <NavLink to="/reach-us" className={({ isActive }) => `item-link link1 ${isActive ? 'active' : ''}`}>Contact Us</NavLink>
            </li>
          </ul>
        </div>
        <a href="https://play.google.com/store/apps/details?id=com.app.firstpass_partner" target="_blank" rel="noopener noreferrer" className="tf-btn d-lg-flex d-none align-items-center" style={{ whiteSpace: 'nowrap' }}>
          Download Now
          <i className="icon icon-arrow-right2"></i>
        </a>
        <a href="#" className="tf-btn open-mb-menu mobile-menu d-lg-none d-flex">
          <i className="icon icon-grip-lines-solid"></i>
        </a>
      </div>
    </header>
  );
}
