// src/components/Header.jsx

import React, { useState } from 'react'

import { Link, useNavigate } from 'react-router-dom'
import API from '../api.js'

import logo from "../../assets/image/new_logo.png";
import dealoraLogo from '../assets/image/Dealora.png'

function Header() {

  const [mobileMenu, setMobileMenu] = useState(false)
  const navigate = useNavigate();

  const handleLogout = async () => {

    try {

      await API.post("admin/logout");

    } catch (error) {

      console.log(error);

    } finally {

      localStorage.removeItem("access_token");
      localStorage.removeItem("admin_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("admin_data");

      window.location.replace("/");
    }

  };

  return (

    <>

      {/* Dealora Shared Navbar Component */}

      <div className="navbar">

        {/* Top Row: Branding, Global Search, and Quick Actions */}

        <div className="navbar-top">

          <div className="navbar-left">

            <a
              href="#"
              onClick={() => window.location.reload()}
              className="brand-logo-area"
            >

              <div className="logo-icon desktop-logo-icon">

                <img
                  src={logo}
                  alt="D"
                  style={{
                    width: '20px',
                    height: '20px',
                    objectFit: 'contain'
                  }}
                />

              </div>

              <span className="brand-name">
                Dealora
              </span>

              <img
                src={dealoraLogo}
                alt="Dealora"
                className="mobile-logo-img"
                style={{
                  display: 'none',
                  height: '32px',
                  objectFit: 'contain'
                }}
              />

            </a>

          </div>

          <div className="navbar-right">

            <button
              className="mobile-menu-trigger"
              aria-label="Toggle Menu"
              onClick={() => setMobileMenu(true)}
            >

              <i className="fas fa-bars"></i>

            </button>

            <div className="nav-actions-group">

              <div className="nav-notification-wrapper">

                <button
                  className="nav-btn nav-notification-bell"
                  aria-label="Notifications"
                >

                  <i className="far fa-bell"></i>

                  <span
                    className="nav-badge"
                    id="nav-notification-badge"
                    style={{
                      display: 'none'
                    }}
                  ></span>

                </button>

                {/* Notification Dropdown Panel */}

                <div
                  className="nav-notification-dropdown"
                  id="nav-notification-dropdown"
                >

                  <div className="dropdown-header">

                    <span>
                      Notifications
                    </span>

                    <button
                      className="clear-all-btn"
                      id="clear-notifications-btn"
                    >

                      Clear All

                    </button>

                  </div>

                  <div
                    className="dropdown-body"
                    id="dropdown-notifications-list"
                  >

                  </div>

                  <div className="dropdown-footer">

                    <Link
                      to="/notifications"
                      id="dropdown-notifications-link"
                    >

                      Push Notification

                    </Link>

                  </div>

                </div>

              </div>

            </div>

            <div className="nav-divider"></div>

            <div
              className="nav-user-profile"
              id="nav-user-profile"
            >

              {/* <img
                src={dealoraLogo}
                alt="Dealora"
                className="desktop-profile-logo"
              /> */}

              <div className="mobile-profile-content">

                <div className="nav-user-avatar">

                  <img
                    src={logo}
                    alt="User"
                    style={{
                      width: '20px',
                      height: '20px',
                      objectFit: 'contain'
                    }}
                  />

                </div>

                <div className="nav-user-info">

                  <span className="nav-user-name">
                    dealora
                  </span>

                </div>

              </div>

              {/* Profile Dropdown Menu */}

              <div
                className="profile-dropdown-menu"
                id="profile-dropdown-menu"
              >

                <div
                  className="profile-dropdown-item"
                  style={{
                    pointerEvents: 'none',
                    color: 'var(--text-primary)',
                    fontWeight: 600,
                    fontSize: '0.9rem'
                  }}
                >

                  Welcome First Pass

                </div>

                <Link
                  to="/notifications"
                  className="profile-dropdown-item"
                  id="profile-dropdown-notif"
                >

                  <i className="fas fa-bell"></i>

                  Notification

                </Link>

                <div className="profile-dropdown-divider"></div>
                <button
                  type="button"
                  className="profile-dropdown-item logout"
                  id="profile-dropdown-logout"
                  onClick={handleLogout}
                >

                  <i className="fas fa-sign-out-alt"></i>

                  Logout

                </button>

              </div>

            </div>

          </div>

        </div>

        {/* Bottom Row: Navigation Menu Tabs */}

        <div className="navbar-bottom">

          <div className="navbar-menu-desktop">

            <Link
              to="/dashboard"
              className="navbar-item active"
            >

              <i className="fas fa-chart-pie"></i>

              <span>
                Dashboard
              </span>

            </Link>

            <Link
              to="/merchants"
              className="navbar-item"
            >

              <i className="fas fa-store"></i>

              <span>
                Merchants
              </span>

            </Link>

            <Link
              to="/customers"
              className="navbar-item"
            >

              <i className="fas fa-users"></i>

              <span>
                Customers
              </span>

            </Link>

            <Link
              to="/categories"
              className="navbar-item"
            >

              <i className="fas fa-tags"></i>

              <span>
                Categories
              </span>

            </Link>

            <Link
              to="/appointments"
              className="navbar-item"
            >

              <i className="fas fa-calendar-check"></i>

              <span>
                Appointments
              </span>

            </Link>

            <div
              className="navbar-item dropdown-trigger"
              id="nav-reports-dropdown-trigger"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >

              <i className="fas fa-chart-line"></i>

              <span>
                Reports
              </span>

              <i
                className="fas fa-chevron-down"
                style={{
                  fontSize: '0.7rem',
                  marginLeft: '2px'
                }}
              ></i>

              <div className="navbar-dropdown-content">

                <Link to="/reports/merchant">
                  Merchant Reports
                </Link>

                <Link to="/reports/customer">
                  Customer Reports
                </Link>

              </div>

            </div>

            <Link
              to="/notifications"
              className="navbar-item"
            >

              <i className="fas fa-bell"></i>

              <span>
                Notification
              </span>

            </Link>

          </div>

        </div>

      </div>

      {/* Mobile Menu */}

      {
        mobileMenu && (

          <div className="navbar-menu-mobile">

            <div className="mobile-menu-header">

              <span>
                Menu
              </span>

              <button
                className="mobile-menu-close"
                aria-label="Close Menu"
                onClick={() => setMobileMenu(false)}
              >

                <i className="fas fa-times"></i>

              </button>

            </div>

            {/* Mobile Menu User Profile */}

            <div
              className="mobile-menu-profile"
              style={{
                justifyContent: 'center',
                padding: '20px 0'
              }}
            >

              <img
                src={dealoraLogo}
                alt="Dealora"
                style={{
                  height: '36px',
                  objectFit: 'contain'
                }}
              />

            </div>

            <div className="mobile-profile-divider"></div>

            <Link
              to="/dashboard"
              className="mobile-navbar-item"
            >

              <i className="fas fa-chart-pie"></i>

              <span>
                Dashboard
              </span>

            </Link>

            <Link
              to="/merchants"
              className="mobile-navbar-item"
            >

              <i className="fas fa-store"></i>

              <span>
                Merchants
              </span>

            </Link>

            <Link
              to="/customers"
              className="mobile-navbar-item"
            >

              <i className="fas fa-users"></i>

              <span>
                Customers
              </span>

            </Link>

            <Link
              to="/categories"
              className="mobile-navbar-item"
            >

              <i className="fas fa-tags"></i>

              <span>
                Categories
              </span>

            </Link>

            <Link
              to="/appointments"
              className="mobile-navbar-item"
            >

              <i className="fas fa-calendar-check"></i>

              <span>
                Appointments
              </span>

            </Link>

            {/* Reports Mobile Dropdown */}

            <div
              className="mobile-navbar-item mobile-dropdown-trigger"
            >

              <div className="mobile-dropdown-header">

                <i className="fas fa-chart-line"></i>

                <span>
                  Reports
                </span>

                <i
                  className="fas fa-chevron-down"
                  style={{
                    fontSize: '0.75rem',
                    marginLeft: 'auto'
                  }}
                ></i>

              </div>

              <div className="mobile-dropdown-content">

                <Link to="/reports/merchant">
                  Merchant Reports
                </Link>

                <Link to="/reports/customer">
                  Customer Reports
                </Link>

              </div>

            </div>

            <Link
              to="/notifications"
              className="mobile-navbar-item"
            >

              <i className="fas fa-bell"></i>

              <span>
                Notification
              </span>

            </Link>

          </div>

        )
      }

    </>

  )

}

export default Header