import { useState } from 'react'
import logo from '../assets/img/logo.png'

export default function TermsAndConditions() {
    const [menuOpen, setMenuOpen] = useState(false)
    const [activeTab, setActiveTab] = useState('customer')

    return (
        <div className="terms-page">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Outfit:wght@300;400;500;600;700;800&display=swap');

                *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

                .terms-page {
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
                    margin-bottom: 32px;
                }

                /* Tab switcher */
                .terms-tabs {
                    display: flex;
                    justify-content: center;
                    gap: 12px;
                    margin-bottom: 40px;
                    border-bottom: 1px solid #e2e8f0;
                    padding-bottom: 16px;
                }
                .tab-btn {
                    padding: 10px 24px;
                    border: 1px solid #cbd5e1;
                    border-radius: 9999px;
                    background-color: #ffffff;
                    color: #475569;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .tab-btn:hover {
                    color: #0f172a;
                    border-color: #94a3b8;
                }
                .tab-btn.active {
                    background-color: #D30000;
                    color: #ffffff;
                    border-color: #D30000;
                    box-shadow: 0 4px 12px rgba(211,0,0,0.2);
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
                        <li><a href="/privacy" onClick={() => setMenuOpen(false)}>Privacy</a></li>
                        <li><a href="/terms" className="active" onClick={() => setMenuOpen(false)}>Terms</a></li>
                    </ul>
                </div>
            </nav>

            <div className="page-wrapper">
                <div className="content">
                    <div className="terms-tabs">
                        <button 
                            className={`tab-btn ${activeTab === 'customer' ? 'active' : ''}`}
                            onClick={() => setActiveTab('customer')}
                        >
                            Customer Terms
                        </button>
                        <button 
                            className={`tab-btn ${activeTab === 'merchant' ? 'active' : ''}`}
                            onClick={() => setActiveTab('merchant')}
                        >
                            Merchant Terms
                        </button>
                    </div>

                    {activeTab === 'customer' ? (
                        <div>
                            <h1 className="title">FIRST PASS CUSTOMER TERMS &amp; CONDITIONS</h1>
                            <p className="meta">Effective Date: [Insert Date]</p>

                            <p className="paragraph" style={{ marginBottom: '32px' }}>
                                By creating an account or using First Pass, you agree to these Terms and Conditions.
                            </p>

                            <div className="section">
                                <h2 className="section-title">1. Acceptance</h2>
                                <p className="paragraph">
                                    By creating an account or using First Pass, you agree to these Terms and Conditions.
                                </p>
                            </div>

                            <div className="section">
                                <h2 className="section-title">2. Service Description</h2>
                                <p className="paragraph">
                                    First Pass is a platform that allows users to discover, claim, and redeem offers provided by participating merchants.
                                </p>
                                <p className="paragraph">
                                    First Pass is not the provider of the products or services offered by merchants.
                                </p>
                            </div>

                            <div className="section">
                                <h2 className="section-title">3. Membership &amp; Subscription</h2>
                                <p className="paragraph">
                                    Some features may require a paid subscription.
                                </p>
                                <p className="paragraph">
                                    Subscription fees are charged according to the selected plan.
                                </p>
                                <p className="paragraph">
                                    Unless otherwise stated, subscriptions may renew automatically until cancelled.
                                </p>
                            </div>

                            <div className="section">
                                <h2 className="section-title">4. Offer Redemption</h2>
                                <ul>
                                    <li>Offers are subject to merchant-specific terms.</li>
                                    <li>Merchants may verify eligibility before redemption.</li>
                                    <li>Offer availability may change without notice.</li>
                                    <li>Claimed offers do not guarantee availability if the merchant has reached redemption limits or withdrawn the offer.</li>
                                </ul>
                            </div>

                            <div className="section">
                                <h2 className="section-title">5. User Conduct</h2>
                                <p className="paragraph">Users agree not to:</p>
                                <ul>
                                    <li>Share accounts</li>
                                    <li>Misuse offers</li>
                                    <li>Attempt fraudulent redemptions</li>
                                    <li>Interfere with platform operations</li>
                                    <li>Violate applicable laws</li>
                                </ul>
                            </div>

                            <div className="section">
                                <h2 className="section-title">6. Merchant Responsibility</h2>
                                <p className="paragraph">Merchants are solely responsible for:</p>
                                <ul>
                                    <li>Offer accuracy</li>
                                    <li>Product quality</li>
                                    <li>Service delivery</li>
                                    <li>Redemption decisions within platform rules</li>
                                </ul>
                            </div>

                            <div className="section">
                                <h2 className="section-title">7. Limitation of Liability</h2>
                                <p className="paragraph">
                                    First Pass acts as a marketplace platform and is not liable for disputes regarding merchant products, services, pricing, availability, or customer experiences.
                                </p>
                            </div>

                            <div className="section">
                                <h2 className="section-title">8. Account Suspension</h2>
                                <p className="paragraph">
                                    First Pass may suspend or terminate accounts involved in abuse, fraud, policy violations, or unlawful activities.
                                </p>
                            </div>

                            <div className="section">
                                <h2 className="section-title">9. Modifications</h2>
                                <p className="paragraph">
                                    First Pass reserves the right to modify services, features, subscription plans, or these Terms at any time.
                                </p>
                            </div>

                            <div className="section">
                                <h2 className="section-title">10. Governing Law</h2>
                                <p className="paragraph">
                                    These Terms shall be governed by the laws applicable in India unless otherwise specified.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <h1 className="title">FIRST PASS MERCHANT TERMS &amp; CONDITIONS</h1>
                            <p className="meta">Effective Date: [Insert Date]</p>

                            <p className="paragraph" style={{ marginBottom: '32px' }}>
                                By creating an account or using First Pass, you agree to these Terms and Conditions.
                            </p>

                            <div className="section">
                                <h2 className="section-title">1. Acceptance</h2>
                                <p className="paragraph">
                                    By creating an account or using First Pass, you agree to these Terms and Conditions.
                                </p>
                            </div>

                            <div className="section">
                                <h2 className="section-title">2. Service Description</h2>
                                <p className="paragraph">
                                    First Pass is a platform that allows users to discover, claim, and redeem offers provided by participating merchants.
                                </p>
                                <p className="paragraph">
                                    First Pass is not the provider of the products or services offered by merchants.
                                </p>
                            </div>

                            <div className="section">
                                <h2 className="section-title">3. Membership &amp; Subscription</h2>
                                <p className="paragraph">
                                    Some features may require a paid subscription.
                                </p>
                                <p className="paragraph">
                                    Subscription fees are charged according to the selected plan.
                                </p>
                                <p className="paragraph">
                                    Unless otherwise stated, subscriptions may renew automatically until cancelled.
                                </p>
                            </div>

                            <div className="section">
                                <h2 className="section-title">4. Offer Redemption</h2>
                                <ul>
                                    <li>Offers are subject to merchant-specific terms.</li>
                                    <li>Merchants may verify eligibility before redemption.</li>
                                    <li>Offer availability may change without notice.</li>
                                    <li>Claimed offers do not guarantee availability if the merchant has reached redemption limits or withdrawn the offer.</li>
                                </ul>
                            </div>

                            <div className="section">
                                <h2 className="section-title">5. User Conduct</h2>
                                <p className="paragraph">Users agree not to:</p>
                                <ul>
                                    <li>Share accounts</li>
                                    <li>Misuse offers</li>
                                    <li>Attempt fraudulent redemptions</li>
                                    <li>Interfere with platform operations</li>
                                    <li>Violate applicable laws</li>
                                </ul>
                            </div>

                            <div className="section">
                                <h2 className="section-title">6. Merchant Responsibility</h2>
                                <p className="paragraph">Merchants are solely responsible for:</p>
                                <ul>
                                    <li>Offer accuracy</li>
                                    <li>Product quality</li>
                                    <li>Service delivery</li>
                                    <li>Redemption decisions within platform rules</li>
                                </ul>
                            </div>

                            <div className="section">
                                <h2 className="section-title">7. Limitation of Liability</h2>
                                <p className="paragraph">
                                    First Pass acts as a marketplace platform and is not liable for disputes regarding merchant products, services, pricing, availability, or customer experiences.
                                </p>
                            </div>

                            <div className="section">
                                <h2 className="section-title">8. Account Suspension</h2>
                                <p className="paragraph">
                                    First Pass may suspend or terminate accounts involved in abuse, fraud, policy violations, or unlawful activities.
                                </p>
                            </div>

                            <div className="section">
                                <h2 className="section-title">9. Modifications</h2>
                                <p className="paragraph">
                                    First Pass reserves the right to modify services, features, subscription plans, or these Terms at any time.
                                </p>
                            </div>

                            <div className="section">
                                <h2 className="section-title">10. Governing Law</h2>
                                <p className="paragraph">
                                    These Terms shall be governed by the laws applicable in India unless otherwise specified.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Custom Footer */}
                <footer className="footer">
                    <div className="container">
                        <div className="footer-inner">
                            <div className="footer-links">
                                <a href="/about">About Us</a>
                                <a href="/privacy">Privacy Policy</a>
                                <a href="/terms">Terms &amp; Conditions</a>
                            </div>
                            <p>© 2026 First Pass. All rights reserved.</p>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    )
}
