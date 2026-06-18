import { useState } from 'react'
import logo from '../assets/img/logo.png'

export default function ContactUs() {
    const [menuOpen, setMenuOpen] = useState(false)
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [subject, setSubject] = useState('')
    const [message, setMessage] = useState('')
    const [submitted, setSubmitted] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    function handleSubmit(e) {
        e.preventDefault()
        if (!name.trim()) {
            setError('Please enter your name.')
            return
        }
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setError('Please enter a valid email address.')
            return
        }
        if (!subject.trim()) {
            setError('Please enter a subject.')
            return
        }
        if (!message.trim()) {
            setError('Please enter your message.')
            return
        }

        setError('')
        setLoading(true)

        // Simulate API call
        setTimeout(() => {
            setLoading(false)
            setSubmitted(true)
        }, 1200)
    }

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
                    background: rgba(211,0,0,0.15);
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

                /* ─── Contact Page ─────────────────────────────────────────────── */
                .ct-hero {
                    position: relative;
                    padding: 80px 0 40px;
                    overflow: hidden;
                    text-align: center;
                }
                .ct-blob {
                    position: absolute;
                    border-radius: 50%;
                    filter: blur(100px);
                    pointer-events: none;
                    z-index: 0;
                }
                .ct-blob-1 {
                    width: 500px; height: 500px;
                    background: radial-gradient(circle, rgba(232,24,90,0.2) 0%, transparent 70%);
                    top: -100px; right: -100px;
                }
                .ct-blob-2 {
                    width: 400px; height: 400px;
                    background: radial-gradient(circle, rgba(255,77,130,0.15) 0%, transparent 70%);
                    bottom: -100px; left: -50px;
                }
                .ct-hero-inner {
                    position: relative;
                    z-index: 1;
                    max-width: 680px;
                    margin: 0 auto;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 16px;
                }
                .ct-tag {
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
                .ct-hero-title {
                    font-family: var(--heading);
                    font-size: clamp(36px, 6vw, 64px);
                    font-weight: 800;
                    letter-spacing: -1.5px;
                    color: var(--text-h);
                    line-height: 1.1;
                }
                .ct-hero-sub {
                    font-size: 16px;
                    line-height: 1.6;
                    color: var(--text);
                    max-width: 540px;
                }

                .ct-content-section {
                    padding: 20px 0 80px;
                    position: relative;
                    z-index: 2;
                }

                .ct-grid {
                    display: grid;
                    grid-template-columns: 1fr 1.25fr;
                    gap: 40px;
                    align-items: start;
                }

                /* Info Columns */
                .ct-info-sidebar {
                    display: flex;
                    flex-direction: column;
                    gap: 24px;
                }
                .ct-info-card {
                    background: var(--bg-card);
                    border: 1px solid var(--border-subtle);
                    border-radius: var(--radius-lg);
                    padding: 24px;
                    display: flex;
                    align-items: flex-start;
                    gap: 18px;
                    transition: border-color 0.2s, transform 0.2s;
                }
                .ct-info-card:hover {
                    border-color: var(--border);
                    transform: translateY(-2px);
                }
                .ct-info-icon-wrapper {
                    width: 46px;
                    height: 46px;
                    border-radius: var(--radius-md);
                    background: rgba(211, 0, 0, 0.12);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--primary-light);
                    flex-shrink: 0;
                    border: 1px solid rgba(211, 0, 0, 0.25);
                }
                .ct-info-text h3 {
                    font-family: var(--heading);
                    font-size: 16px;
                    font-weight: 700;
                    color: var(--text-h);
                    margin-bottom: 4px;
                }
                .ct-info-text p {
                    font-size: 14px;
                    color: var(--text);
                    line-height: 1.5;
                }
                .ct-info-link {
                    color: var(--primary-light);
                    text-decoration: none;
                    font-weight: 500;
                    transition: color 0.2s;
                }
                .ct-info-link:hover {
                    color: #fff;
                    text-decoration: underline;
                }

                /* Form Panel */
                .ct-form-panel {
                    background: var(--gradient-card);
                    border: 1px solid var(--border-subtle);
                    border-radius: var(--radius-xl);
                    padding: 40px;
                    box-shadow: var(--shadow-card);
                    position: relative;
                    overflow: hidden;
                }
                .ct-form-panel::before {
                    content: '';
                    position: absolute;
                    top: 0; left: 0; right: 0;
                    height: 4px;
                    background: var(--gradient-hero);
                }

                .ct-form {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }
                .ct-form-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 16px;
                }
                .ct-form-group {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }
                .ct-form-group label {
                    font-size: 13px;
                    font-weight: 600;
                    color: var(--text-muted);
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .ct-input, .ct-textarea {
                    width: 100%;
                    padding: 12px 16px;
                    background: var(--bg-card2);
                    border: 1px solid var(--border-subtle);
                    border-radius: var(--radius-sm);
                    color: var(--text-h);
                    font-family: inherit;
                    font-size: 14px;
                    outline: none;
                    transition: border-color 0.2s, box-shadow 0.2s;
                }
                .ct-input:focus, .ct-textarea:focus {
                    border-color: var(--primary);
                    box-shadow: 0 0 0 3px rgba(211, 0, 0, 0.2);
                }
                .ct-textarea {
                    resize: vertical;
                    min-height: 120px;
                }
                .ct-error {
                    color: #f87171;
                    font-size: 13px;
                    font-weight: 500;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                .ct-btn-submit {
                    height: 48px;
                    background: var(--gradient-hero);
                    border: none;
                    border-radius: var(--radius-sm);
                    color: #fff;
                    font-size: 15px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: opacity 0.2s, transform 0.2s, box-shadow 0.2s;
                    box-shadow: 0 4px 16px rgba(211, 0, 0, 0.3);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                }
                .ct-btn-submit:hover:not(:disabled) {
                    opacity: 0.95;
                    transform: translateY(-1px);
                    box-shadow: 0 6px 20px rgba(211, 0, 0, 0.45);
                }
                .ct-btn-submit:active:not(:disabled) {
                    transform: translateY(0);
                }
                .ct-btn-submit:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                /* Success box */
                .ct-success-card {
                    text-align: center;
                    padding: 40px 10px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 20px;
                    animation: fade-in 0.5s ease;
                }
                .ct-success-icon-wrapper {
                    width: 64px;
                    height: 64px;
                    border-radius: 50%;
                    background: rgba(16, 185, 129, 0.15);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 28px;
                    color: #10b981;
                    border: 1px solid rgba(16, 185, 129, 0.3);
                }
                .ct-success-card h2 {
                    font-family: var(--heading);
                    font-size: 24px;
                    font-weight: 700;
                    color: var(--text-h);
                }
                .ct-success-card p {
                    font-size: 15px;
                    color: var(--text);
                    line-height: 1.6;
                    max-width: 380px;
                }
                .ct-btn-back {
                    padding: 10px 24px;
                    background: rgba(255, 255, 255, 0.08);
                    border: 1px solid var(--border-subtle);
                    border-radius: var(--radius-full);
                    color: var(--text);
                    font-size: 14px;
                    font-weight: 600;
                    text-decoration: none;
                    transition: all 0.2s;
                    cursor: pointer;
                }
                .ct-btn-back:hover {
                    background: rgba(255, 255, 255, 0.15);
                    color: var(--text-h);
                    border-color: var(--border);
                }

                /* Socials */
                .ct-socials {
                    display: flex;
                    gap: 12px;
                    margin-top: 8px;
                }
                .ct-social-btn {
                    width: 38px;
                    height: 38px;
                    border-radius: 50%;
                    background: var(--bg-card);
                    border: 1px solid var(--border-subtle);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--text-muted);
                    transition: all 0.2s;
                    text-decoration: none;
                }
                .ct-social-btn:hover {
                    border-color: var(--border);
                    color: var(--primary-light);
                    transform: translateY(-2px);
                    background: var(--bg-card2);
                }

                /* Animations */
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50%       { transform: translateY(-10px); }
                }
                @keyframes fade-up {
                    from { opacity: 0; transform: translateY(20px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes fade-in {
                    from { opacity: 0; }
                    to   { opacity: 1; }
                }

                .animate-fade-up { animation: fade-up 0.6s ease both; }
                .animate-fade-up-2 { animation: fade-up 0.6s ease 0.15s both; }

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

                @media (max-width: 900px) {
                    .ct-grid {
                        grid-template-columns: 1fr;
                        gap: 32px;
                    }
                }
                @media (max-width: 600px) {
                    .ct-form-panel {
                        padding: 24px;
                    }
                    .ct-form-row {
                        grid-template-columns: 1fr;
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
                        <li><a href="/contact" className="active" onClick={() => setMenuOpen(false)}>Contact</a></li>
                        <li><a href="/privacy" onClick={() => setMenuOpen(false)}>Privacy</a></li>
                        <li><a href="/terms" onClick={() => setMenuOpen(false)}>Terms</a></li>
                    </ul>
                </div>
            </nav>

            <div className="ct-hero">
                <div className="ct-blob ct-blob-1" aria-hidden="true" />
                <div className="ct-blob ct-blob-2" aria-hidden="true" />
                <div className="container">
                    <div className="ct-hero-inner animate-fade-up">
                        <div className="ct-tag">Get in Touch</div>
                        <h1 className="ct-hero-title">
                            Contact <span className="gradient-text">First Pass</span>
                        </h1>
                        <p className="ct-hero-sub">
                            Have questions, feedback, or need support? Drop us a line and our team will get back to you shortly.
                        </p>
                    </div>
                </div>
            </div>

            <section className="ct-content-section container">
                <div className="ct-grid animate-fade-up-2">
                    
                    {/* Contact details */}
                    <div className="ct-info-sidebar">
                        
                        <div className="ct-info-card">
                            <div className="ct-info-icon-wrapper">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect width="20" height="16" x="2" y="4" rx="2"/>
                                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                                </svg>
                            </div>
                            <div className="ct-info-text">
                                <h3>Email Us</h3>
                                <p>For general inquiries &amp; support:</p>
                                <a href="mailto:info@firstpassapp.co" className="ct-info-link">info@firstpassapp.co</a>
                            </div>
                        </div>

                        {/* <div className="ct-info-card">
                            <div className="ct-info-icon-wrapper">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                                </svg>
                            </div>
                            <div className="ct-info-text">
                                <h3>Call Us</h3>
                                <p>Speak with our team:</p>
                                <a href="tel:+919876543210" className="ct-info-link">+91 98765 43210</a>
                            </div>
                        </div> */}

                        <div className="ct-info-card">
                            <div className="ct-info-icon-wrapper">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                                    <circle cx="12" cy="10" r="3"/>
                                </svg>
                            </div>
                            <div className="ct-info-text">
                                <h3>Company Details</h3>
                                <p>Byte Nova Technologies</p>
                                {/* <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
                                    Tech Hub, Koramangala,<br />
                                    Bangalore, KA 560034, India
                                </p> */}
                            </div>
                        </div>

                        <div className="ct-info-card">
                            <div className="ct-info-icon-wrapper">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10"/>
                                    <polyline points="12 6 12 12 16 14"/>
                                </svg>
                            </div>
                            <div className="ct-info-text">
                                <h3>Business Hours</h3>
                                <p>Monday – Friday</p>
                                <p style={{ color: 'var(--text-muted)' }}>9:00 AM – 6:00 PM IST</p>
                            </div>
                        </div>

                        {/* Social Links */}
                        {/* <div style={{ padding: '0 8px' }}>
                            <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>Follow Us</p>
                            <div className="ct-socials">
                                <a href="#" className="ct-social-btn" aria-label="Facebook">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                                </a>
                                <a href="#" className="ct-social-btn" aria-label="Twitter">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
                                </a>
                                <a href="#" className="ct-social-btn" aria-label="Instagram">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                                </a>
                                <a href="#" className="ct-social-btn" aria-label="LinkedIn">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
                                </a>
                            </div>
                        </div> */}

                    </div>

                    {/* Contact Form */}
                    <div className="ct-form-panel">
                        {submitted ? (
                            <div className="ct-success-card" role="status">
                                <div className="ct-success-icon-wrapper">✓</div>
                                <h2>Message Sent!</h2>
                                <p>
                                    Thank you for contacting First Pass. A member of our support team will reach out to you at <strong>{email}</strong> within 24–48 hours.
                                </p>
                                <button onClick={() => { setSubmitted(false); setName(''); setEmail(''); setSubject(''); setMessage(''); }} className="ct-btn-back">
                                    Send Another Message
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="ct-form" noValidate>
                                <div className="ct-form-row">
                                    <div className="ct-form-group">
                                        <label htmlFor="name">Your Name</label>
                                        <input
                                            id="name"
                                            type="text"
                                            value={name}
                                            onChange={e => setName(e.target.value)}
                                            placeholder="John Doe"
                                            className="ct-input"
                                            disabled={loading}
                                            required
                                        />
                                    </div>
                                    <div className="ct-form-group">
                                        <label htmlFor="email">Email Address</label>
                                        <input
                                            id="email"
                                            type="email"
                                            value={email}
                                            onChange={e => setEmail(e.target.value)}
                                            placeholder="john@example.com"
                                            className="ct-input"
                                            disabled={loading}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="ct-form-group">
                                    <label htmlFor="subject">Subject</label>
                                    <input
                                        id="subject"
                                        type="text"
                                        value={subject}
                                        onChange={e => setSubject(e.target.value)}
                                        placeholder="How can we help you?"
                                        className="ct-input"
                                        disabled={loading}
                                        required
                                    />
                                </div>

                                <div className="ct-form-group">
                                    <label htmlFor="message">Message</label>
                                    <textarea
                                        id="message"
                                        value={message}
                                        onChange={e => setMessage(e.target.value)}
                                        placeholder="Tell us more about your inquiry..."
                                        className="ct-textarea"
                                        disabled={loading}
                                        required
                                    />
                                </div>

                                {error && (
                                    <div className="ct-error" role="alert">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>
                                        </svg>
                                        {error}
                                    </div>
                                )}

                                <button type="submit" className="ct-btn-submit" disabled={loading}>
                                    {loading ? 'Sending...' : 'Send Message'}
                                </button>
                            </form>
                        )}
                    </div>

                </div>
            </section>

            {/* Custom Footer */}
            <footer className="footer">
                <div className="container">
                    <div className="footer-inner">
                        <div className="footer-links">
                            <a href="/about">About Us</a>
                            <a href="/contact" className="active">Contact Us</a>
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
