import { useEffect, useState } from 'react';
import logo from '../../assets/img/FirstPass-logo.png';

export default function CustomerApp() {
    const [redirectStatus, setRedirectStatus] = useState('Detecting your device...');
    const [showFallback, setShowFallback] = useState(false);

    useEffect(() => {
        // Show fallback download options if redirect takes more than 2 seconds
        const fallbackTimer = setTimeout(() => {
            setShowFallback(true);
        }, 2000);

        const ua = navigator.userAgent || navigator.vendor || window.opera;
        let targetUrl = '';

        // iPhone / iPad
        if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) {
            targetUrl = "https://apps.apple.com/in/app/firstpass/id6782366355";
            setRedirectStatus('Redirecting to the App Store...');
        }
        // Android
        else if (/android/i.test(ua)) {
            targetUrl = "https://play.google.com/store/apps/details?id=com.app.firstpass";
            setRedirectStatus('Redirecting to the Google Play Store...');
        }
        // Desktop or Other Devices
        else {
            targetUrl = "https://firstpassapp.co/";
            setRedirectStatus('Redirecting to the website...');
        }

        // Slight delay before actual redirect to show off the micro-animation
        const redirectTimer = setTimeout(() => {
            window.location.replace(targetUrl);
        }, 1200);

        return () => {
            clearTimeout(fallbackTimer);
            clearTimeout(redirectTimer);
        };
    }, []);

    return (
        <div className="redirect-container">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;600;800&display=swap');

                .redirect-container {
                    --primary: #D30000;
                    --primary-hover: #FF1A1A;
                    --bg-dark: #0A0506;
                    --bg-card: rgba(22, 11, 12, 0.75);
                    --text-main: #F5EAEB;
                    --text-muted: #A38C8F;
                    --border-glow: rgba(211, 0, 0, 0.2);
                    --font-sans: 'Inter', sans-serif;
                    --font-title: 'Outfit', sans-serif;

                    min-height: 100vh;
                    background-color: var(--bg-dark);
                    background-image: 
                        linear-gradient(rgba(211, 0, 0, 0.04) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(211, 0, 0, 0.04) 1px, transparent 1px),
                        radial-gradient(circle at 50% 50%, rgba(211, 0, 0, 0.18) 0%, transparent 60%);
                    background-size: 50px 50px, 50px 50px, 100% 100%;
                    color: var(--text-main);
                    font-family: var(--font-sans);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 40px 20px;
                    box-sizing: border-box;
                    overflow: hidden;
                    position: relative;
                }

                .redirect-content {
                    max-width: 500px;
                    width: 100%;
                    text-align: center;
                    z-index: 2;
                    background: var(--bg-card);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 28px;
                    padding: 50px 40px;
                    backdrop-filter: blur(20px);
                    box-shadow: 
                        0 25px 60px rgba(0, 0, 0, 0.85), 
                        0 0 50px rgba(211, 0, 0, 0.18),
                        inset 0 1px 0 rgba(255, 255, 255, 0.12);
                    animation: floatAnimation 6s ease-in-out infinite;
                }

                @keyframes floatAnimation {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-8px); }
                }

                .logo-wrapper {
                    margin: 0 auto 30px auto;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    background: #FFFFFF !important;
                    padding: 12px 28px;
                    border-radius: 20px;
                    box-shadow: 
                        0 12px 32px rgba(0, 0, 0, 0.35),
                        0 0 20px rgba(211, 0, 0, 0.15);
                    border: 1px solid rgba(211, 0, 0, 0.1);
                }

                .logo-img {
                    height: 50px;
                    object-fit: contain;
                }

                .status-title {
                    font-family: var(--font-title);
                    font-size: 2.2rem;
                    font-weight: 800;
                    margin-bottom: 12px;
                    letter-spacing: -0.5px;
                    color: #FFFFFF !important;
                }

                .status-highlight {
                    color: var(--primary) !important;
                    text-shadow: 0 0 20px rgba(211, 0, 0, 0.4);
                }

                .status-text {
                    font-size: 1.05rem;
                    color: var(--text-muted) !important;
                    margin-bottom: 30px;
                }

                /* Pulsing Loader Animation */
                .loader-container {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 80px;
                    margin-bottom: 30px;
                }

                .pulse-circle {
                    width: 16px;
                    height: 16px;
                    background-color: var(--primary);
                    border-radius: 50%;
                    margin: 0 6px;
                    box-shadow: 0 0 12px var(--primary);
                    animation: pulse 1.2s infinite ease-in-out;
                }

                .pulse-circle:nth-child(2) {
                    animation-delay: 0.2s;
                }

                .pulse-circle:nth-child(3) {
                    animation-delay: 0.4s;
                }

                @keyframes pulse {
                    0%, 100% {
                        transform: scale(0.6);
                        opacity: 0.4;
                    }
                    50% {
                        transform: scale(1.2);
                        opacity: 1;
                        filter: brightness(1.2);
                    }
                }

                /* Fallback Links & Buttons */
                .fallback-container {
                    margin-top: 20px;
                    animation: fadeIn 0.6s ease-out forwards;
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .fallback-description {
                    font-size: 0.9rem;
                    color: var(--text-muted) !important;
                    margin-bottom: 20px;
                    line-height: 1.5;
                }

                .button-group {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .app-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    background: rgba(255, 255, 255, 0.04);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    color: #FFFFFF !important;
                    padding: 14px 20px;
                    border-radius: 14px;
                    font-weight: 600;
                    font-size: 0.95rem;
                    text-decoration: none !important;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    cursor: pointer;
                }

                .app-btn i {
                    font-size: 1.3rem;
                }

                .app-btn:hover {
                    background: rgba(211, 0, 0, 0.1);
                    border-color: var(--primary);
                    transform: translateY(-2px);
                    box-shadow: 0 8px 20px rgba(211, 0, 0, 0.15);
                }

                .app-btn:active {
                    transform: translateY(0);
                }

                .website-link {
                    display: inline-block;
                    margin-top: 20px;
                    color: var(--text-muted) !important;
                    font-size: 0.85rem;
                    text-decoration: underline !important;
                    transition: color 0.3s;
                }

                .website-link:hover {
                    color: var(--primary) !important;
                }

                .footer-text {
                    position: absolute;
                    bottom: 24px;
                    color: var(--text-muted) !important;
                    font-size: 0.85rem;
                    letter-spacing: 0.5px;
                }

                @media (max-width: 600px) {
                    .redirect-content {
                        padding: 35px 25px;
                        border-radius: 20px;
                    }
                    .status-title {
                        font-size: 1.8rem;
                    }
                }
            `}</style>

            <div className="redirect-content">
                <div className="logo-wrapper">
                    <img src={logo} alt="FirstPass Logo" className="logo-img" />
                </div>
                <h1 className="status-title">
                    Opening <span className="status-highlight">FirstPass</span>
                </h1>
                <p className="status-text">{redirectStatus}</p>

                <div className="loader-container">
                    <div className="pulse-circle"></div>
                    <div className="pulse-circle"></div>
                    <div className="pulse-circle"></div>
                </div>

                {showFallback && (
                    <div className="fallback-container">
                        <p className="fallback-description">
                            If you aren't redirected automatically, please select your platform below to download or view the app:
                        </p>
                        <div className="button-group">
                            <a 
                                href="https://apps.apple.com/in/app/firstpass/id6782366355" 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="app-btn"
                            >
                                <i className="fab fa-apple"></i>
                                Download on the App Store
                            </a>
                            <a 
                                href="https://play.google.com/store/apps/details?id=com.app.firstpass" 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="app-btn"
                            >
                                <i className="fab fa-google-play"></i>
                                Get it on Google Play
                            </a>
                        </div>
                        <a 
                            href="https://afosindia.com" 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="website-link"
                        >
                            Or visit our website
                        </a>
                    </div>
                )}
            </div>

            <div className="footer-text">
                &copy; {new Date().getFullYear()} FirstPass. All rights reserved.
            </div>
        </div>
    );
}
