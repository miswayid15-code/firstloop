import React from 'react';
import { Link, NavLink } from 'react-router-dom';

export default function MobileMenu() {
  return (
    <div className="offcanvas offcanvas-start offcanvas-menu" id="mobileMenu" style={{ backgroundColor: '#4d1d1dff' }}>
      <div className="offcanvas-content">
        <div className="canvas-menu-inner">
          <div className="canvas-menu-wrap">
            <div className="canvas_head">
              <Link to="/" className="logo-site">
                <img src="asset/images/img/new-logo.png" alt="First Pass" style={{ height: '90px' }} />
              </Link>
              <div className="btn-mobile-menu close-mb-menu text-caption link">
                <i className="icon icon-close"></i>
                CLOSE
              </div>
            </div>
            <div className="canvas_center">
              <ul className="nav-ul-mb" id="mobile-menu" style={{ textAlign: 'left' }}>
                <li style={{ textAlign: 'left' }}>
                  <div className="item">
                    <NavLink to="/" className="mb-menu-link" style={{ fontSize: '28px', lineHeight: '40px' }}>
                      <span className="text">Home</span>
                    </NavLink>
                  </div>
                </li>
                <li style={{ textAlign: 'left' }}>
                  <div className="item">
                    <NavLink to="/how-it-works" className="mb-menu-link" style={{ fontSize: '28px', lineHeight: '40px' }}>
                      <span className="text">How It Works</span>
                    </NavLink>
                  </div>
                </li>
                {/* <li style={{ textAlign: 'left' }}>
                  <div className="item">
                    <NavLink to="/company" className="mb-menu-link" style={{ fontSize: '28px', lineHeight: '40px' }}>
                      <span className="text">About</span>
                    </NavLink>
                  </div>
                </li>
                <li style={{ textAlign: 'left' }}>
                  <div className="item">
                    <NavLink to="/portfolio" className="mb-menu-link" style={{ fontSize: '28px', lineHeight: '40px' }}>
                      <span className="text">Portfolio</span>
                    </NavLink>
                  </div>
                </li>
                <li style={{ textAlign: 'left' }}>
                  <div className="item">
                    <NavLink to="/offerings" className="mb-menu-link" style={{ fontSize: '28px', lineHeight: '40px' }}>
                      <span className="text">Offerings</span>
                    </NavLink>
                  </div>
                </li>
                <li style={{ textAlign: 'left' }}>
                  <div className="item">
                    <NavLink to="/journal" className="mb-menu-link" style={{ fontSize: '28px', lineHeight: '40px' }}>
                      <span className="text">Journal</span>
                    </NavLink>
                  </div>
                </li> */}
                <li style={{ textAlign: 'left' }}>
                  <div className="item">
                    <NavLink to="/reach-us" className="mb-menu-link" style={{ fontSize: '28px', lineHeight: '40px' }}>
                      <span className="text">Contact Us</span>
                    </NavLink>
                  </div>
                </li>
                <li style={{ textAlign: 'left' }}>
                  <div className="item">
                    <a href="https://play.google.com/store/apps/dev?id=8834287381296988592&hl=en_IN" target="_blank" rel="noopener noreferrer" className="mb-menu-link" style={{ fontSize: '28px', lineHeight: '40px' }}>
                      <span className="text">Download Now</span>
                    </a>
                  </div>
                </li>
                <li style={{ textAlign: 'left' }}>
                  <div className="item">
                    <NavLink to="/data-policy" className="mb-menu-link" style={{ fontSize: '28px', lineHeight: '40px' }}>
                      <span className="text">Privacy policy</span>
                    </NavLink>
                  </div>
                </li>
                <li style={{ textAlign: 'left' }}>
                  <div className="item">
                    <NavLink to="/conditions" className="mb-menu-link" style={{ fontSize: '28px', lineHeight: '40px' }}>
                      <span className="text">Terms and Conditions</span>
                    </NavLink>
                  </div>
                </li>
              </ul>
            </div>
            {/* <div className="canvas_foot">
              <div className="right">
                <a href="#" className="tf-link-icon text-caption text-neutral-200">
                  <i className="icon icon-arrow-top-right"></i>
                  TWITTER (X)
                </a>
                <a href="#" className="tf-link-icon text-caption text-neutral-200">
                  <i className="icon icon-arrow-top-right"></i>
                  DRIBBBLE
                </a>
                <a href="#" className="tf-link-icon text-caption text-neutral-200">
                  <i className="icon icon-arrow-top-right"></i>
                  LINKEDIN
                </a>
              </div>
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
}
