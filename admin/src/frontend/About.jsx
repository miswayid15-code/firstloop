import { useState } from 'react'
import logo from '../assets/img/logo.png'

const roles = [
    {
        icon: '🏪',
        title: 'Merchant',
        color: '#7C3AED',
        desc: 'Full control over your business',
        perks: [
            'Create & manage multiple branches',
            'Issue & manage coupons',
            'Manage receptionist accounts',
            'View all appointment bookings',
            'Access customer coupon claim reports',
        ],
    },
    {
        icon: '🧑‍💼',
        title: 'Receptionist',
        color: '#F59E0B',
        desc: 'Branch-level operations',
        perks: [
            'Access assigned branch details',
            'View coupon claim lists',
            'Manage branch appointments',
            'Communicate via live chat',
        ],
    },
    {
        icon: '🛍️',
        title: 'Customer',
        color: '#10B981',
        desc: 'Discover deals & book services',
        perks: [
            'Browse & claim exclusive coupons',
            'Book appointments effortlessly',
            'Chat directly with branches',
        ],
    },
]

const features = [
    { icon: '🏷️', title: 'Smart Coupons',     desc: 'Merchants create targeted coupon campaigns; customers discover and claim them with one tap.' },
    { icon: '📅', title: 'Appointment System', desc: 'Streamlined booking for customers with full calendar management for merchants and receptionists.' },
    { icon: '💬', title: 'Live Chat',          desc: 'Real-time messaging between customers and branch receptionists for seamless support.' },
    { icon: '🏢', title: 'Multi-Branch',       desc: 'Merchants manage unlimited branches from a single dashboard with role-based access.' },
    { icon: '📊', title: 'Analytics',          desc: 'Detailed insights on coupon claims, booking trends, and customer engagement.' },
    { icon: '🔐', title: 'Role-Based Access',  desc: 'Granular permissions ensure everyone sees only what they need — securely.' },
]

export default function About() {
    const [menuOpen, setMenuOpen] = useState(false)
    const currentYear = new Date().getFullYear()

    return (
        <div className="page-wrapper">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Outfit:wght@300;400;500;600;700;800&display=swap');

                :root {
                    --primary:        #D30000;
                    --primary-light:  #FF3333;
                    --primary-dark:   #990000;
                    --accent:         #FF8C42;
                    --accent-light:   #FFB347;

                    --bg:             #0A0606;
                    --bg-surface:     #120B0C;
                    --bg-card:        #1B1011;
                    --bg-card2:       #241517;

                    --text:           #EAE0E2;
                    --text-muted:     #9E888C;
                    --text-h:         #FFFFFF;

                    --border:         rgba(211,0,0,0.2);
                    --border-subtle:  rgba(255,255,255,0.07);

                    --gradient-hero:  linear-gradient(135deg, #990000 0%, #D30000 50%, #FF3333 100%);
                    --gradient-card:  linear-gradient(145deg, rgba(211,0,0,0.12) 0%, rgba(255,51,51,0.05) 100%);
                    --glow:           0 0 60px rgba(211,0,0,0.4), 0 0 120px rgba(211,0,0,0.18);
                    --glow-sm:        0 0 20px rgba(211,0,0,0.35);
                    --shadow-card:    0 8px 32px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.35);

                    --radius-sm:      8px;
                    --radius-md:      14px;
                    --radius-lg:      20px;
                    --radius-xl:      28px;
                    --radius-full:    9999px;

                    --sans:    'Inter', system-ui, sans-serif;
                    --heading: 'Outfit', system-ui, sans-serif;
                }

                *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

                body {
                    background: var(--bg);
                    color: var(--text);
                    font-family: var(--sans);
                    overflow-x: hidden;
                    margin: 0;
                    padding: 0;
                }

                .container {
                    width: 100%;
                    max-width: 1100px;
                    margin: 0 auto;
                    padding: 0 24px;
                }

                .gradient-text {
                    background: var(--gradient-hero);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }

                /* ─── Navbar ─────────────────────────────────────────────────── */
                .navbar {
                    position: fixed;
                    top: 0; left: 0; right: 0;
                    z-index: 100;
                    padding: 16px 0;
                    background: rgba(10,10,15,0.75);
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    border-bottom: 1px solid var(--border-subtle);
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
                    font-family: var(--heading);
                    font-size: 22px;
                    font-weight: 800;
                    color: var(--text-h);
                    letter-spacing: -0.5px;
                    text-decoration: none;
                }
                .nav-brand img {
                    width: 32px;
                    height: 32px;
                    border-radius: 8px;
                    object-fit: contain;
                    background-color: #ffffff;
                    padding: 4px;
                }
                .nav-links {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    list-style: none;
                }
                .nav-links a {
                    padding: 8px 16px;
                    border-radius: var(--radius-full);
                    font-size: 14px;
                    font-weight: 500;
                    color: var(--text);
                    text-decoration: none;
                    transition: all 0.2s ease;
                }
                .nav-links a:hover,
                .nav-links a.active {
                    color: var(--text-h);
                    background: rgba(232,24,90,0.15);
                }
                .nav-links a.active {
                    color: var(--primary-light);
                }

                /* Hamburger styles */
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
                    background-color: var(--text-h);
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
                        background: rgba(10,10,15,0.95);
                        backdrop-filter: blur(20px);
                        -webkit-backdrop-filter: blur(20px);
                        flex-direction: column;
                        padding: 20px;
                        gap: 15px;
                        border-bottom: 1px solid var(--border-subtle);
                        z-index: 100;
                        box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                    }
                    .nav-links.open {
                        display: flex;
                    }
                }

                /* ─── Page Wrapper ───────────────────────────────────────────── */
                .page-wrapper {
                    padding-top: 80px;
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    background: var(--bg);
                    font-family: var(--sans);
                    box-sizing: border-box;
                    color: var(--text);
                    min-height: 100vh;
                    width: 100%;
                }

                /* ─── About Page ─────────────────────────────────────────────── */
                .ab-hero {
                    position: relative;
                    padding: 80px 0 60px;
                    overflow: hidden;
                    text-align: center;
                    border-bottom: 1px solid var(--border-subtle);
                }
                .ab-blob {
                    position: absolute;
                    border-radius: 50%;
                    filter: blur(100px);
                    pointer-events: none;
                    z-index: 0;
                }
                .ab-blob-1 {
                    width: 500px; height: 500px;
                    background: radial-gradient(circle, rgba(232,24,90,0.2) 0%, transparent 70%);
                    top: -100px; right: -100px;
                }
                .ab-blob-2 {
                    width: 400px; height: 400px;
                    background: radial-gradient(circle, rgba(255,77,130,0.15) 0%, transparent 70%);
                    bottom: -100px; left: -50px;
                }
                .ab-hero-inner {
                    position: relative;
                    z-index: 1;
                    max-width: 680px;
                    margin: 0 auto;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 20px;
                }
                .ab-logo-wrap {
                    width: 100px; height: 100px;
                    border-radius: 22px;
                    overflow: hidden;
                    box-shadow: var(--glow-sm), 0 4px 24px rgba(0,0,0,0.5);
                    animation: float 4s ease-in-out infinite;
                    background-color: #ffffff;
                }
                .ab-logo { 
                    width: 100%; 
                    height: 100%; 
                    object-fit: contain; 
                    padding: 10px;
                }
                .ab-hero-title {
                    font-family: var(--heading);
                    font-size: clamp(36px, 6vw, 64px);
                    font-weight: 800;
                    letter-spacing: -1.5px;
                    color: var(--text-h);
                }
                .ab-hero-sub {
                    font-size: 17px;
                    line-height: 1.7;
                    color: var(--text);
                    max-width: 540px;
                }

                /* Tag */
                .ab-tag {
                    display: inline-block;
                    padding: 5px 14px;
                    background: rgba(232,24,90,0.15);
                    border: 1px solid rgba(232,24,90,0.3);
                    border-radius: var(--radius-full);
                    font-size: 12px;
                    font-weight: 600;
                    letter-spacing: 1px;
                    text-transform: uppercase;
                    color: var(--primary-light);
                }

                /* Sections */
                .ab-section { padding: 80px 0; }
                .ab-section-alt {
                    background: var(--bg-surface);
                    border-top: 1px solid var(--border-subtle);
                    border-bottom: 1px solid var(--border-subtle);
                }
                .ab-section-header {
                    text-align: center;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 52px;
                }
                .ab-section-header h2 { font-family: var(--heading); font-size: clamp(26px, 4vw, 42px); letter-spacing: -0.8px; color: var(--text-h); }
                .ab-section-sub { font-size: 16px; color: var(--text); max-width: 480px; }

                /* Mission */
                .ab-mission {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 60px;
                    align-items: center;
                }
                .ab-mission-text {
                    display: flex;
                    flex-direction: column;
                    gap: 18px;
                    text-align: left;
                }
                .ab-mission-text h2 { font-family: var(--heading); font-size: clamp(26px, 3.5vw, 40px); letter-spacing: -0.8px; color: var(--text-h); }
                .ab-mission-text p { font-size: 15px; line-height: 1.75; color: var(--text); }

                /* Stat grid */
                .ab-stat-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 16px;
                }
                .ab-stat {
                    background: var(--bg-card);
                    border: 1px solid var(--border-subtle);
                    border-radius: var(--radius-lg);
                    padding: 28px 20px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 6px;
                    text-align: center;
                    transition: border-color 0.2s, transform 0.2s;
                }
                .ab-stat:hover { border-color: var(--border); transform: translateY(-3px); }
                .ab-stat-num { font-size: 38px; font-weight: 800; font-family: var(--heading); letter-spacing: -1px; }
                .ab-stat-label { font-size: 12px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; color: var(--text-muted); }

                /* Features grid */
                .ab-features-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 20px;
                }
                .ab-feature-card {
                    background: var(--gradient-card);
                    border: 1px solid var(--border-subtle);
                    border-radius: var(--radius-lg);
                    padding: 28px 24px;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    text-align: left;
                    transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
                }
                .ab-feature-card:hover {
                    border-color: var(--border);
                    transform: translateY(-4px);
                    box-shadow: var(--shadow-card);
                }
                .ab-feature-icon { font-size: 32px; }
                .ab-feature-card h3 { font-family: var(--heading); font-size: 17px; font-weight: 700; color: var(--text-h); }
                .ab-feature-card p  { font-size: 14px; color: var(--text); line-height: 1.65; }

                /* Roles */
                .ab-roles {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 20px;
                }
                .ab-role-card {
                    background: var(--bg-card);
                    border: 1px solid var(--border-subtle);
                    border-radius: var(--radius-xl);
                    padding: 28px;
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                    text-align: left;
                    transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
                    position: relative;
                    overflow: hidden;
                }
                .ab-role-card::before {
                    content: '';
                    position: absolute;
                    top: 0; left: 0; right: 0;
                    height: 3px;
                    background: var(--role-color);
                    border-radius: var(--radius-xl) var(--radius-xl) 0 0;
                }
                .ab-role-card:hover {
                    border-color: rgba(232, 24, 90, 0.4);
                    transform: translateY(-4px);
                    box-shadow: 0 12px 40px rgba(0,0,0,0.4);
                }
                .ab-role-header {
                    display: flex;
                    align-items: center;
                    gap: 14px;
                }
                .ab-role-icon {
                    font-size: 32px;
                    width: 52px; height: 52px;
                    display: flex; align-items: center; justify-content: center;
                    border-radius: var(--radius-md);
                    background: rgba(232, 24, 90, 0.1);
                    flex-shrink: 0;
                }
                .ab-role-header h3 { font-family: var(--heading); font-size: 18px; font-weight: 700; color: var(--text-h); margin-bottom: 2px; }
                .ab-role-desc { font-size: 13px; color: var(--text-muted); }
                .ab-role-perks { display: flex; flex-direction: column; gap: 10px; list-style: none; }
                .ab-role-perks li {
                    display: flex;
                    align-items: flex-start;
                    gap: 10px;
                    font-size: 14px;
                    color: var(--text);
                    line-height: 1.5;
                }
                .ab-role-check {
                    color: var(--role-color);
                    font-weight: 700;
                    font-size: 14px;
                    flex-shrink: 0;
                    margin-top: 1px;
                }

                /* CTA */
                .ab-cta {
                    padding: 80px 0;
                }
                .ab-cta-inner {
                    position: relative;
                    text-align: center;
                    background: var(--gradient-card);
                    border: 1px solid var(--border);
                    border-radius: var(--radius-xl);
                    padding: 60px 40px;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 16px;
                }
                .ab-blob-cta {
                    width: 400px; height: 400px;
                    background: radial-gradient(circle, rgba(232,24,90,0.25) 0%, transparent 70%);
                    top: 50%; left: 50%;
                    transform: translate(-50%, -50%);
                }
                .ab-cta-inner h2 { font-family: var(--heading); font-size: clamp(24px, 4vw, 40px); letter-spacing: -0.8px; position: relative; z-index: 1; color: var(--text-h); }
                .ab-cta-inner p  { font-size: 16px; color: var(--text); position: relative; z-index: 1; }
                .ab-cta-btn {
                    position: relative;
                    z-index: 1;
                    display: inline-block;
                    padding: 14px 32px;
                    background: var(--gradient-hero);
                    border-radius: var(--radius-full);
                    color: #fff;
                    font-size: 15px;
                    font-weight: 600;
                    box-shadow: 0 4px 20px rgba(232,24,90,0.4);
                    transition: opacity 0.2s, transform 0.2s, box-shadow 0.2s;
                    margin-top: 8px;
                    text-decoration: none;
                }
                .ab-cta-btn:hover { opacity: 0.9; transform: translateY(-2px); box-shadow: 0 8px 30px rgba(232,24,90,0.55); }

                .footer {
                    margin-top: auto;
                    padding: 40px 0;
                    border-top: 1px solid var(--border-subtle);
                    text-align: center;
                    font-size: 13px;
                    color: var(--text-muted);
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
                    color: var(--text-muted);
                    font-size: 13px;
                    transition: color 0.2s;
                    text-decoration: none;
                }
                .footer-links a:hover { color: var(--primary-light); }

                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50%       { transform: translateY(-18px); }
                }
                @keyframes fade-up {
                    from { opacity: 0; transform: translateY(30px); }
                    to   { opacity: 1; transform: translateY(0); }
                }

                .animate-fade-up   { animation: fade-up 0.7s ease both; }
                .animate-fade-up-2 { animation: fade-up 0.7s ease 0.15s both; }

                @media (max-width: 900px) {
                    .ab-mission        { grid-template-columns: 1fr; }
                    .ab-features-grid  { grid-template-columns: repeat(2, 1fr); }
                    .ab-roles          { grid-template-columns: 1fr; }
                }
                @media (max-width: 600px) {
                    .ab-features-grid  { grid-template-columns: 1fr; }
                    .ab-stat-grid      { grid-template-columns: 1fr 1fr; }
                    .ab-cta-inner      { padding: 40px 20px; }
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
                        <li><a href="/about" className="active" onClick={() => setMenuOpen(false)}>About</a></li>
                        <li><a href="/contact" onClick={() => setMenuOpen(false)}>Contact</a></li>
                        <li><a href="/privacy" onClick={() => setMenuOpen(false)}>Privacy</a></li>
                        <li><a href="/terms" onClick={() => setMenuOpen(false)}>Terms</a></li>
                    </ul>
                </div>
            </nav>

            <div className="ab-hero">
                <div className="ab-blob ab-blob-1" aria-hidden="true" />
                <div className="ab-blob ab-blob-2" aria-hidden="true" />
                <div className="container">
                    <div className="ab-hero-inner animate-fade-up">
                        <div className="ab-logo-wrap">
                            <img src={logo} alt="First Pass" className="ab-logo" />
                        </div>
                        <h1 className="ab-hero-title">
                            About <span className="gradient-text">First Pass</span>
                        </h1>
                        <p className="ab-hero-sub">
                            First Pass bridges merchants and customers through smart coupons, seamless booking,
                            and real-time communication — all inside one powerful platform.
                        </p>
                    </div>
                </div>
            </div>

            {/* Mission */}
            <section className="ab-section">
                <div className="container">
                    <div className="ab-mission animate-fade-up">
                        <div className="ab-mission-text">
                            <div className="ab-tag">Our Mission</div>
                            <h2>Connecting businesses<br />with their customers</h2>
                            <p>
                                First Pass is an application built for both merchants and customers. We empower
                                businesses of all sizes to digitize their coupon strategies, manage appointments,
                                and communicate with customers — while giving customers a single app to discover
                                deals, book services, and stay connected with their favourite local businesses.
                            </p>
                            <p>
                                With First Pass's role-based system, merchants retain full business control while
                                receptionists handle day-to-day branch operations efficiently.
                            </p>
                        </div>
                        <div className="ab-mission-visual">
                            <div className="ab-stat-grid">
                                {[
                                    { num: '3',    label: 'App Roles' },
                                    { num: '∞',    label: 'Branches' },
                                    { num: '100%', label: 'Secure' },
                                    { num: '24/7', label: 'Live Chat' },
                                ].map(s => (
                                    <div key={s.label} className="ab-stat">
                                        <span className="ab-stat-num gradient-text">{s.num}</span>
                                        <span className="ab-stat-label">{s.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="ab-section ab-section-alt">
                <div className="container">
                    <div className="ab-section-header animate-fade-up">
                        <div className="ab-tag">Platform Features</div>
                        <h2>Everything you need, in one place</h2>
                    </div>
                    <div className="ab-features-grid animate-fade-up-2">
                        {features.map(f => (
                            <div key={f.title} className="ab-feature-card">
                                <span className="ab-feature-icon">{f.icon}</span>
                                <h3>{f.title}</h3>
                                <p>{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Roles */}
            <section className="ab-section">
                <div className="container">
                    <div className="ab-section-header animate-fade-up">
                        <div className="ab-tag">Role-Based System</div>
                        <h2>Built for every stakeholder</h2>
                        <p className="ab-section-sub">
                            First Pass's role-based system ensures the right people have the right tools.
                        </p>
                    </div>
                    <div className="ab-roles animate-fade-up-2">
                        {roles.map(r => (
                            <div key={r.title} className="ab-role-card" style={{ '--role-color': r.color }}>
                                <div className="ab-role-header">
                                    <span className="ab-role-icon">{r.icon}</span>
                                    <div>
                                        <h3>{r.title}</h3>
                                        <p className="ab-role-desc">{r.desc}</p>
                                    </div>
                                </div>
                                <ul className="ab-role-perks">
                                    {r.perks.map(p => (
                                        <li key={p}>
                                            <span className="ab-role-check" aria-hidden="true" style={{ color: r.color }}>✓</span>
                                            {p}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="ab-cta animate-fade-up">
                <div className="container">
                    <div className="ab-cta-inner">
                        <div className="ab-blob ab-blob-cta" aria-hidden="true" />
                        <h2>Ready to transform your business?</h2>
                        <p>Join First Pass and connect with customers like never before.</p>
                        <a href="/" className="ab-cta-btn">Get Early Access</a>
                    </div>
                </div>
            </section>

            {/* Custom Footer */}
            <footer className="footer">
                <div className="container">
                    <div className="footer-inner">
                        <div className="footer-links">
                            <a href="/about">About Us</a>
                            <a href="/contact">Contact Us</a>
                            <a href="/privacy">Privacy Policy</a>
                            <a href="/terms">Terms &amp; Conditions</a>
                            <a href="/delete-account">Delete Account</a>
                        </div>
                        <p>© {currentYear} First Pass. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    )
}
