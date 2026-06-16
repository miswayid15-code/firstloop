import { useState, useEffect } from 'react'
import logo from '../assets/img/logo.png'

// Target launch date — adjust as needed
const LAUNCH_DATE = new Date('2026-07-01T00:00:00')

function getTimeLeft() {
    const now = new Date()
    const diff = LAUNCH_DATE - now
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 }
    return {
        days:    Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours:   Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
    }
}

function CountUnit({ value, label }) {
    return (
        <div className="count-unit">
            <div className="count-box">
                <span className="count-value">{String(value).padStart(2, '0')}</span>
                <span className="count-sep">:</span>
            </div>
            <span className="count-label">{label}</span>
        </div>
    )
}

export default function ComingSoon() {
    const [time, setTime]       = useState(getTimeLeft())
    const [email, setEmail]     = useState('')
    const [submitted, setSubmitted] = useState(false)
    const [error, setError]     = useState('')
    const [menuOpen, setMenuOpen] = useState(false)

    useEffect(() => {
        const id = setInterval(() => setTime(getTimeLeft()), 1000)
        return () => clearInterval(id)
    }, [])

    function handleNotify(e) {
        e.preventDefault()
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setError('Please enter a valid email address.')
            return
        }
        setError('')
        setSubmit(true)
    }

    const currentYear = new Date().getFullYear()

    return (
        <div className="cs-page">
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
                }

                /* ─── Coming Soon Page ────────────────────────────────────────── */
                .cs-page {
                    position: relative;
                    min-height: 100svh;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    overflow-x: hidden;
                    padding: 100px 24px 60px;
                    background: var(--bg);
                    font-family: var(--sans);
                    box-sizing: border-box;
                    width: 100%;
                }

                /* Blobs */
                .cs-blob {
                    position: absolute;
                    border-radius: 50%;
                    filter: blur(100px);
                    pointer-events: none;
                    z-index: 0;
                }
                .cs-blob-1 {
                    width: 600px; height: 600px;
                    background: radial-gradient(circle, rgba(232,24,90,0.22) 0%, transparent 70%);
                    top: -150px; left: -150px;
                }
                .cs-blob-2 {
                    width: 500px; height: 500px;
                    background: radial-gradient(circle, rgba(255,77,130,0.18) 0%, transparent 70%);
                    bottom: -100px; right: -100px;
                }
                .cs-blob-3 {
                    width: 350px; height: 350px;
                    background: radial-gradient(circle, rgba(245,158,11,0.1) 0%, transparent 70%);
                    top: 40%; left: 50%;
                    transform: translate(-50%, -50%);
                }

                .cs-main {
                    position: relative;
                    z-index: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 28px;
                    max-width: 700px;
                    width: 100%;
                    text-align: center;
                }

                /* Logo ring */
                .cs-logo-ring {
                    position: relative;
                    width: 140px;
                    height: 140px; 
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-top: 20px; 
                }
                .cs-logo { 
                    width: 90px;
                    height: 90px; 
                    border-radius: 20px;
                    box-shadow: var(--glow-sm), 0 4px 24px rgba(0,0,0,0.5);
                    animation: float 4s ease-in-out infinite, pulse-glow 3s ease-in-out infinite;
                    object-fit: contain;
                    background-color: #ffffff;
                    padding: 10px;
                    position: relative;
                    z-index: 2;
                }
                .cs-orbit-ring {
                    position: absolute;
                    inset: 0;
                    animation: spin-slow 8s linear infinite;
                }
                .cs-orbit-dot {
                    position: absolute;
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                    background: var(--primary-light);
                    box-shadow: 0 0 8px rgba(159,103,245,0.8);
                }
                .cs-orbit-dot-1 { top: 0;   left: 50%; transform: translateX(-50%); background: var(--primary); }
                .cs-orbit-dot-2 { bottom: 0; right: 12%; background: var(--accent); box-shadow: 0 0 8px rgba(245,158,11,0.8); }
                .cs-orbit-dot-3 { top: 50%;  left: 0;  transform: translateY(-50%); width: 7px; height: 7px; background: #FF4D82; }

                /* Badge */
                .cs-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 18px;
                    background: rgba(232,24,90,0.15);
                    border: 1px solid rgba(232,24,90,0.35);
                    border-radius: var(--radius-full);
                    font-size: 13px;
                    font-weight: 500;
                    color: var(--primary-light);
                    letter-spacing: 0.3px;
                }
                .cs-badge-dot {
                    width: 7px;
                    height: 7px;
                    border-radius: 50%;
                    background: var(--primary-light);
                    animation: blink 1.4s ease infinite;
                    flex-shrink: 0;
                }

                /* Title */
                .cs-title {
                    font-family: var(--heading);
                    font-size: clamp(42px, 7vw, 78px);
                    font-weight: 800;
                    letter-spacing: -2px;
                    line-height: 1.1;
                    color: var(--text-h);
                }

                /* Subtitle */
                .cs-sub {
                    font-size: 17px;
                    line-height: 1.7;
                    color: var(--text);
                    max-width: 520px;
                }

                /* ─── Countdown ────────────────────────────────────────────────── */
                .cs-countdown {
                    display: flex;
                    align-items: flex-start;
                    gap: 4px;
                }
                .count-unit {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 8px;
                }
                .count-box {
                    display: flex;
                    align-items: center;
                }
                .count-value {
                    min-width: 86px;
                    height: 86px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-family: var(--heading);
                    font-size: 40px;
                    font-weight: 800;
                    color: var(--text-h);
                    background: var(--bg-card);
                    border: 1px solid var(--border);
                    border-radius: var(--radius-md);
                    box-shadow: var(--shadow-card), inset 0 1px 0 rgba(255,255,255,0.05);
                    letter-spacing: -1px;
                    animation: countdown-pulse 1s ease infinite;
                    position: relative;
                    overflow: hidden;
                }
                .count-value::before {
                    content: '';
                    position: absolute;
                    top: 50%; left: 0; right: 0;
                    height: 1px;
                    background: rgba(255,255,255,0.06);
                }
                .cs-seconds {
                    color: var(--primary-light);
                    border-color: rgba(232,24,90,0.35);
                    box-shadow: var(--shadow-card), var(--glow-sm), inset 0 1px 0 rgba(255,255,255,0.05);
                }
                .count-sep {
                    font-size: 36px;
                    font-weight: 700;
                    color: var(--text-muted);
                    line-height: 86px;
                    padding: 0 4px;
                    margin-top: -8px;
                }
                .count-unit-last .count-sep { display: none; }
                .count-label {
                    font-size: 11px;
                    font-weight: 600;
                    letter-spacing: 1.5px;
                    text-transform: uppercase;
                    color: var(--text-muted);
                }

                /* ─── Notify Form ──────────────────────────────────────────────── */
                .cs-notify { width: 100%; max-width: 520px; }
                .cs-form {
                    display: flex;
                    gap: 10px;
                    flex-wrap: wrap;
                    position: relative;
                }
                .cs-input {
                    flex: 1;
                    min-width: 220px;
                    height: 52px;
                    padding: 0 18px;
                    background: var(--bg-card);
                    border: 1px solid var(--border-subtle);
                    border-radius: var(--radius-full);
                    color: var(--text-h);
                    font-size: 15px;
                    outline: none;
                    transition: border-color 0.2s, box-shadow 0.2s;
                }
                .cs-input::placeholder { color: var(--text-muted); }
                .cs-input:focus {
                    border-color: var(--primary);
                    box-shadow: 0 0 0 3px rgba(232,24,90,0.2);
                }
                .cs-input-error { border-color: #f87171 !important; }
                .cs-btn {
                    height: 52px;
                    padding: 0 28px;
                    background: var(--gradient-hero);
                    border: none;
                    border-radius: var(--radius-full);
                    color: #fff;
                    font-size: 15px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: opacity 0.2s, transform 0.2s, box-shadow 0.2s;
                    box-shadow: 0 4px 20px rgba(232,24,90,0.4);
                    white-space: nowrap;
                }
                .cs-btn:hover { opacity: 0.9; transform: translateY(-1px); box-shadow: 0 6px 30px rgba(232,24,90,0.55); }
                .cs-btn:active { transform: translateY(0); }
                .cs-error {
                    width: 100%;
                    margin-top: 6px;
                    padding-left: 18px;
                    font-size: 13px;
                    color: #f87171;
                    text-align: left;
                }

                .cs-success {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    padding: 20px 24px;
                    background: rgba(16,185,129,0.1);
                    border: 1px solid rgba(16,185,129,0.3);
                    border-radius: var(--radius-lg);
                    text-align: left;
                    color: var(--text-h);
                }
                .cs-success-icon {
                    width: 40px; height: 40px;
                    display: flex; align-items: center; justify-content: center;
                    background: rgba(16,185,129,0.2);
                    border-radius: 50%;
                    font-size: 20px;
                    color: #10b981;
                    flex-shrink: 0;
                }
                .cs-success p { font-size: 14px; color: var(--text); margin-top: 4px; }

                /* ─── Feature Pills ────────────────────────────────────────────── */
                .cs-features {
                    display: flex;
                    flex-wrap: wrap;
                    justify-content: center;
                    gap: 10px;
                    margin-bottom: 20px;
                }
                .cs-feature-pill {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 18px;
                    background: var(--bg-card);
                    border: 1px solid var(--border-subtle);
                    border-radius: var(--radius-full);
                    font-size: 14px;
                    color: var(--text);
                    transition: all 0.2s ease;
                    cursor: pointer;
                    text-decoration: none;
                }
                .cs-feature-pill:hover {
                    border-color: var(--border);
                    background: var(--bg-card2);
                    color: var(--text-h);
                    transform: translateY(-2px);
                }

                /* Screen-reader only */
                .sr-only {
                    position: absolute; width: 1px; height: 1px;
                    padding: 0; margin: -1px; overflow: hidden;
                    clip: rect(0,0,0,0); white-space: nowrap; border: 0;
                }

                /* Animations */
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50%       { transform: translateY(-18px); }
                }
                @keyframes pulse-glow {
                    0%, 100% { box-shadow: var(--glow-sm); }
                    50%       { box-shadow: var(--glow); }
                }
                @keyframes fade-up {
                    from { opacity: 0; transform: translateY(30px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to   { transform: rotate(360deg); }
                }
                @keyframes countdown-pulse {
                    0%, 100% { transform: scale(1); }
                    50%       { transform: scale(1.04); }
                }
                @keyframes blink {
                    0%,100% { opacity: 1; }
                    50%     { opacity: 0; }
                }

                .animate-fade-up   { animation: fade-up 0.7s ease both; }
                .animate-fade-up-2 { animation: fade-up 0.7s ease 0.15s both; }
                .animate-fade-up-3 { animation: fade-up 0.7s ease 0.3s both; }
                .animate-fade-up-4 { animation: fade-up 0.7s ease 0.45s both; }

                .footer {
                    margin-top: 60px;
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

                @media (max-width: 600px) {
                    .cs-title { letter-spacing: -1px; }
                    .count-value { min-width: 64px; height: 64px; font-size: 28px; }
                    .count-sep { font-size: 26px; line-height: 64px; }
                    .cs-form { flex-direction: column; }
                    .cs-btn { width: 100%; }
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
                        <li><a href="/" className="active" onClick={() => setMenuOpen(false)}>Home</a></li>
                        <li><a href="/about" onClick={() => setMenuOpen(false)}>About</a></li>
                        <li><a href="/privacy" onClick={() => setMenuOpen(false)}>Privacy</a></li>
                        <li><a href="/terms" onClick={() => setMenuOpen(false)}>Terms</a></li>
                    </ul>
                </div>
            </nav>

            {/* Ambient blobs */}
            <div className="cs-blob cs-blob-1" aria-hidden="true" />
            <div className="cs-blob cs-blob-2" aria-hidden="true" />
            <div className="cs-blob cs-blob-3" aria-hidden="true" />

            <main className="cs-main">
                {/* Logo ring */}
                <div className="cs-logo-ring animate-fade-up">
                    <div className="cs-orbit-ring">
                        <span className="cs-orbit-dot cs-orbit-dot-1" aria-hidden="true" />
                        <span className="cs-orbit-dot cs-orbit-dot-2" aria-hidden="true" />
                        <span className="cs-orbit-dot cs-orbit-dot-3" aria-hidden="true" />
                    </div>
                    <img src={logo} alt="First Pass logo" className="cs-logo" />
                </div>

                <div className="cs-badge animate-fade-up-2">
                    <span className="cs-badge-dot" aria-hidden="true" />
                    Something amazing is brewing
                </div>

                <h1 className="cs-title animate-fade-up-2">
                    First Pass is<br />
                    <span className="gradient-text">Coming Soon</span>
                </h1>

                <p className="cs-sub animate-fade-up-3">
                    The smarter way to discover deals, book appointments, and connect
                    merchants with customers — all in one place.
                </p>

                {/* Countdown */}
                <div className="cs-countdown animate-fade-up-3" aria-label="Launch countdown">
                    <CountUnit value={time.days}    label="Days" />
                    <CountUnit value={time.hours}   label="Hours" />
                    <CountUnit value={time.minutes} label="Minutes" />
                    <div className="count-unit count-unit-last">
                        <div className="count-box">
                            <span className="count-value cs-seconds">{String(time.seconds).padStart(2, '0')}</span>
                        </div>
                        <span className="count-label">Seconds</span>
                    </div>
                </div>

                {/* Notify form */}
                <div className="cs-notify animate-fade-up-4">
                    {submitted ? (
                        <div className="cs-success" role="status">
                            <span className="cs-success-icon">✓</span>
                            <div>
                                <strong>You're on the list!</strong>
                                <p>We'll notify you the moment First Pass launches.</p>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleNotify} className="cs-form" noValidate>
                            <label htmlFor="notify-email" className="sr-only">Email address</label>
                            <input
                                id="notify-email"
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="Enter your email address"
                                className={`cs-input${error ? ' cs-input-error' : ''}`}
                                aria-describedby={error ? 'notify-error' : undefined}
                            />
                            <button type="submit" className="cs-btn">Notify Me</button>
                            {error && <p id="notify-error" className="cs-error" role="alert">{error}</p>}
                        </form>
                    )}
                </div>

                {/* Features preview */}
                <div className="cs-features animate-fade-up-4">
                    {[
                        { icon: '🏷️', label: 'Exclusive Coupons' },
                        { icon: '📅', label: 'Easy Bookings' },
                        { icon: '💬', label: 'Live Chat' },
                    ].map(f => (
                        <div key={f.label} className="cs-feature-pill">
                            <span>{f.icon}</span>
                            <span>{f.label}</span>
                        </div>
                    ))}
                    <a href="#" className="cs-feature-pill">
                        <span>🏪</span>
                        <span>Merchant Dashboard</span>
                    </a>
                </div>
            </main>

            {/* Custom Footer */}
            <footer className="footer">
                <div className="container">
                    <div className="footer-inner">
                        <div className="footer-links">
                            <a href="/about">About Us</a>
                            <a href="/privacy">Privacy Policy</a>
                            <a href="/terms">Terms &amp; Conditions</a>
                        </div>
                        <p>© {currentYear} First Pass. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    )
}
