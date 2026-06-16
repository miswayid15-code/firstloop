import { useState } from 'react'
import logo from '../assets/img/logo.png'

export default function PrivacyPolicy() {
    const [menuOpen, setMenuOpen] = useState(false)

    return (
        <div className="privacy-page">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Outfit:wght@300;400;500;600;700;800&display=swap');

                *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

                .privacy-page {
                    min-height: 100vh;
                    background-color: #f8fafc;
                    color: #1e293b;
                    font-family: 'Inter', system-ui, sans-serif;
                    display: flex;
                    flex-direction: column;
                    width: 100%;
                }

                .container {
                    width: 100%;
                    max-width: 1100px;
                    margin: 0 auto;
                    padding: 0 24px;
                }

                /* ─── Navbar ─────────────────────────────────────────────────── */
                .navbar {
                    position: fixed;
                    top: 0; left: 0; right: 0;
                    z-index: 100;
                    padding: 16px 0;
                    background: rgba(255, 255, 255, 0.85);
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    border-bottom: 1px solid #e2e8f0;
                    transition: all 0.3s ease;
                }
                .navbar .container {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }
                .nav-brand {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-family: 'Outfit', system-ui, sans-serif;
                    font-size: 22px;
                    font-weight: 800;
                    letter-spacing: -0.5px;
                    text-decoration: none;
                    color: #0f172a;
                }
                .nav-brand img {
                    width: 32px;
                    height: 32px;
                    border-radius: 8px;
                    object-fit: contain;
                    background-color: #ffffff;
                    padding: 4px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
                }
                .nav-brand span {
                    background: linear-gradient(135deg, #D30000 0%, #1A1A1A 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }
                
                .menu-toggle {
                    display: none;
                    flex-direction: column;
                    gap: 5px;
                    background: none;
                    border: none;
                    cursor: pointer;
                    padding: 4px;
                    z-index: 101;
                }
                .menu-toggle .bar {
                    width: 22px;
                    height: 2px;
                    background-color: #1e293b;
                    transition: all 0.3s ease;
                }
                .menu-toggle.active .bar:nth-child(1) {
                    transform: translateY(7px) rotate(45deg);
                }
                .menu-toggle.active .bar:nth-child(2) {
                    opacity: 0;
                }
                .menu-toggle.active .bar:nth-child(3) {
                    transform: translateY(-7px) rotate(-45deg);
                }

                .nav-links {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    list-style: none;
                }
                .nav-links a {
                    padding: 8px 16px;
                    border-radius: 9999px;
                    font-size: 14px;
                    font-weight: 500;
                    color: #475569;
                    text-decoration: none;
                    transition: all 0.2s ease;
                }
                .nav-links a:hover,
                .nav-links a.active {
                    color: #0f172a;
                    background: rgba(211,0,0,0.08);
                }
                .nav-links a.active {
                    color: #D30000;
                    font-weight: 600;
                }

                @media (max-width: 768px) {
                    .menu-toggle {
                        display: flex;
                    }
                    .nav-links {
                        display: none;
                        position: absolute;
                        top: 100%;
                        left: 0;
                        right: 0;
                        background: rgba(255, 255, 255, 0.98);
                        backdrop-filter: blur(20px);
                        -webkit-backdrop-filter: blur(20px);
                        flex-direction: column;
                        padding: 20px;
                        gap: 15px;
                        border-bottom: 1px solid #e2e8f0;
                        z-index: 100;
                        box-shadow: 0 10px 30px rgba(0,0,0,0.08);
                    }
                    .nav-links.open {
                        display: flex;
                    }
                }

                /* ─── Content Area ───────────────────────────────────────────── */
                .page-wrapper {
                    padding-top: 80px;
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                }
                .content {
                    width: 100%;
                    max-width: 800px;
                    margin: 48px auto;
                    background-color: #ffffff;
                    padding: 40px;
                    border-radius: 16px;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
                    box-sizing: border-box;
                }
                .title {
                    font-family: 'Outfit', system-ui, sans-serif;
                    font-size: clamp(28px, 5vw, 40px);
                    font-weight: 800;
                    color: #0f172a;
                    margin-bottom: 8px;
                }
                .meta {
                    font-size: 14px;
                    color: #64748b;
                    margin-bottom: 40px;
                }
                .section {
                    margin-bottom: 32px;
                }
                .section-title {
                    font-family: 'Outfit', system-ui, sans-serif;
                    font-size: 20px;
                    font-weight: 700;
                    color: #1e293b;
                    margin-bottom: 16px;
                }
                .paragraph {
                    font-size: 15px;
                    line-height: 1.7;
                    color: #475569;
                    margin-bottom: 16px;
                }
                .content h3 {
                    font-family: 'Outfit', system-ui, sans-serif;
                    font-size: 16px;
                    font-weight: 600;
                    color: #0f172a;
                    margin: 20px 0 10px;
                }
                .content ul {
                    list-style-type: disc;
                    margin-left: 20px;
                    margin-bottom: 20px;
                    color: #475569;
                }
                .content li {
                    font-size: 15px;
                    line-height: 1.6;
                    margin-bottom: 6px;
                }

                /* ─── Footer ─────────────────────────────────────────────────── */
                .footer {
                    margin-top: auto;
                    padding: 40px 0;
                    border-top: 1px solid #e2e8f0;
                    text-align: center;
                    font-size: 13px;
                    color: #94a3b8;
                    width: 100%;
                }
                .footer-inner {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 16px;
                }
                .footer-links {
                    display: flex;
                    gap: 24px;
                }
                .footer-links a {
                    color: #64748b;
                    font-size: 13px;
                    transition: color 0.2s;
                    text-decoration: none;
                }
                .footer-links a:hover { color: #D30000; }

                @media (max-width: 600px) {
                    .content {
                        padding: 24px;
                        margin: 24px auto;
                        border-radius: 12px;
                    }
                }
            `}</style>

            {/* Custom Navbar */}
            <nav className="navbar" role="navigation" aria-label="Main navigation">
                <div className="container">
                    <a href="/" className="nav-brand">
                        <img src={logo} alt="First Pass logo" />
                        <span>First Pass</span>
                    </a>
                    <button 
                        className={`menu-toggle ${menuOpen ? 'active' : ''}`} 
                        onClick={() => setMenuOpen(!menuOpen)}
                        aria-label="Toggle navigation menu"
                    >
                        <span className="bar"></span>
                        <span className="bar"></span>
                        <span className="bar"></span>
                    </button>
                    <ul className={`nav-links ${menuOpen ? 'open' : ''}`}>
                        <li><a href="/" onClick={() => setMenuOpen(false)}>Home</a></li>
                        <li><a href="/about" onClick={() => setMenuOpen(false)}>About</a></li>
                        <li><a href="/privacy" className="active" onClick={() => setMenuOpen(false)}>Privacy</a></li>
                        <li><a href="/terms" onClick={() => setMenuOpen(false)}>Terms</a></li>
                    </ul>
                </div>
            </nav>

            <div className="page-wrapper">
                <div className="content">
                    <h1 className="title">FIRST PASS PRIVACY POLICY</h1>
                    <p className="meta">Effective Date: 16/06/2026</p>

                    <p className="paragraph" style={{ marginBottom: '32px' }}>
                        Welcome to First Pass. We respect your privacy and are committed to protecting your personal information.
                    </p>

                    <div className="section">
                        <h2 className="section-title">1. Information We Collect</h2>

                        <h3>Customer App</h3>
                        <p className="paragraph">We may collect:</p>
                        <ul>
                            <li>Name</li>
                            <li>Mobile number</li>
                            <li>Email address</li>
                            <li>Profile information</li>
                            <li>Location information (if permitted)</li>
                            <li>Device and app usage information</li>
                            <li>Subscription and payment information</li>
                        </ul>

                        <h3>Merchant App</h3>
                        <p className="paragraph">We may collect:</p>
                        <ul>
                            <li>Business name</li>
                            <li>Owner details</li>
                            <li>Contact information</li>
                            <li>Branch information</li>
                            <li>Staff account information</li>
                            <li>Offer and redemption data</li>
                            <li>Appointment and customer interaction records</li>
                        </ul>
                    </div>

                    <div className="section">
                        <h2 className="section-title">2. How We Use Information</h2>
                        <p className="paragraph">We use collected information to:</p>
                        <ul>
                            <li>Provide and improve First Pass services</li>
                            <li>Manage customer accounts</li>
                            <li>Manage merchant accounts</li>
                            <li>Enable offer discovery and redemption</li>
                            <li>Facilitate appointments and customer communication</li>
                            <li>Process subscriptions and payments</li>
                            <li>Prevent fraud and misuse</li>
                            <li>Provide customer support</li>
                        </ul>
                    </div>

                    <div className="section">
                        <h2 className="section-title">3. Information Sharing</h2>
                        <p className="paragraph">First Pass does not sell personal information.</p>
                        <p className="paragraph">We may share information:</p>
                        <ul>
                            <li>Between customers and merchants when necessary for offer redemption or appointments</li>
                            <li>With payment processors</li>
                            <li>With service providers supporting our platform</li>
                            <li>When required by law</li>
                        </ul>
                    </div>

                    <div className="section">
                        <h2 className="section-title">4. Data Security</h2>
                        <p className="paragraph">
                            We implement reasonable technical and organizational measures to protect user information. However, no system can guarantee absolute security.
                        </p>
                    </div>

                    <div className="section">
                        <h2 className="section-title">5. User Responsibilities</h2>
                        <p className="paragraph">
                            Users are responsible for maintaining the confidentiality of their account credentials.
                        </p>
                    </div>

                    <div className="section">
                        <h2 className="section-title">6. Data Retention</h2>
                        <p className="paragraph">
                            We retain information as long as necessary to provide services, comply with legal obligations, resolve disputes, and enforce agreements.
                        </p>
                    </div>

                    <div className="section">
                        <h2 className="section-title">7. Children's Privacy</h2>
                        <p className="paragraph">
                            First Pass is not intended for users under the age of 18 without parental or guardian consent.
                        </p>
                    </div>

                    <div className="section">
                        <h2 className="section-title">8. Changes to this Policy</h2>
                        <p className="paragraph">
                            We may update this Privacy Policy from time to time. Continued use of First Pass constitutes acceptance of the updated policy.
                        </p>
                    </div>

                    <div className="section">
                        <h2 className="section-title">9. Contact Us</h2>
                        <p className="paragraph">For privacy-related questions, contact:</p>
                        <p className="paragraph" style={{ lineHeight: '1.8' }}>
                            <strong>Email:</strong> info.firstpassapp.co <br />
                            <strong>Company:</strong> Byte Nova<br />
                            {/* <strong>Address:</strong> [Insert Address] */}
                        </p>
                    </div>
                </div>

                {/* Custom Footer */}
                <footer className="footer">
                    <div className="container">
                        <div className="footer-inner">
                            <div className="footer-links">
                                <a href="/about">About Us</a>
                                <a href="/privacy">Privacy Policy</a>
                                <a href="/terms">Terms &amp; Conditions</a>
                                <a href="/delete-account">Delete Account</a>
                            </div>
                            <p>© 2026 First Pass. All rights reserved.</p>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    )
}
