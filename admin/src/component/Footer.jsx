import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer id="footer">
      <div className="footer-image">
        <img className="effectFade fadeUp" alt="" />
      </div>
      <div className="container">
        <div className="footer-content">
          <Link to="/" className="footer-logo" style={{width: '250px'}}>
            <img src="asset/images/img/foologo.png" alt="First Pass Logo" style={{width: '250px'}}/>
          </Link>
          <div className="title h6 fw-semibold">Get connected <br /> with First Pass on social</div>
          <div className="text">Don’t miss our new updates!</div>
          <div className="tf-social-1 justify-content-center">
            <a href="#" target="_blank" rel="noreferrer" className="text-body-1 fw-semibold">
              Twitter / X
              <div className="social-item">
                <i className="icon icon-twitter-x"></i>
              </div>
            </a>
            <a href="#" target="_blank" rel="noreferrer" className="text-body-1 fw-semibold">
              Facebook
              <div className="social-item">
                <i className="icon icon-facebook-f"></i>
              </div>
            </a>
            <a href="#" target="_blank" rel="noreferrer" className="text-body-1 fw-semibold">
              Instagram
              <div className="social-item">
                <i className="icon icon-instagram"></i>
              </div>
            </a>
            <a href="#" target="_blank" rel="noreferrer" className="text-body-1 fw-semibold">
              Linkedin
              <div className="social-item">
                <i className="icon icon-linkedin-in"></i>
              </div>
            </a>
          </div>
        </div>
        <div className="footer-bottom">
          <ul className="footer-links d-flex gap-24 align-items-center">
            <li>
              <Link to="/how-it-works" className="fw-semibold link-underline link1">How It Works</Link>
            </li>
            {/* <li>
              <Link to="/company" className="fw-semibold link-underline link1">About</Link>
            </li>
            <li>
              <Link to="/offerings" className="fw-semibold link-underline link1">Offerings</Link>
            </li>
            <li>
              <Link to="/portfolio" className="fw-semibold link-underline link1">Portfolio</Link>
            </li>
            <li>
              <Link to="/journal" className="fw-semibold link-underline link1">Journal</Link>
            </li> */}
            <li>
              <Link to="/reach-us" className="fw-semibold link-underline link1">Contact Us</Link>
            </li>
            <li>
              <a href="#" target="_blank" rel="noopener noreferrer" className="fw-semibold link-underline link1">Download Now</a>
            </li>
            <li>
              <Link to="/data-policy" className="fw-semibold link-underline link1">Privacy policy</Link>
            </li>
            <li>
              <Link to="/conditions" className="fw-semibold link-underline link1">Terms and Conditions</Link>
            </li>
          </ul>
          <div className="text-caption text-neutral-400">Copyright © 2026 First Pass. All Rights Reserved.</div>
        </div>
      </div>
    </footer>
  );
}
