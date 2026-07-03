import { useState } from 'react'
import logo from '../assets/img/FirePass1.png'

export default function UnderConstruction() {
    const [email, setEmail] = useState('')
    const [submitted, setSubmitted] = useState(false)
    const [error, setError] = useState('')

    function handleSubmit(e) {
        e.preventDefault()
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setError('Please enter a valid email address.')
            return
        }
        setError('')
        setSubmitted(true)
    }

    return (
        <div className="construction-container">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;600;800&display=swap');

                .construction-container {
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
                        radial-gradient(circle at 15% 25%, rgba(211, 0, 0, 0.16) 0%, transparent 45%),
                        radial-gradient(circle at 85% 75%, rgba(211, 0, 0, 0.12) 0%, transparent 45%);
                    background-size: 50px 50px, 50px 50px, 100% 100%, 100% 100%;
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

                .construction-content {
                    max-width: 600px;
                    width: 100%;
                    text-align: center;
                    z-index: 2;
                    background: var(--bg-card);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 28px;
                    padding: 55px 45px;
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
                    margin: 0 auto 35px auto;
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
                    height: 60px;
                    object-fit: contain;
                }

                .construction-title {
                    font-family: var(--font-title);
                    font-size: 2.8rem;
                    font-weight: 800;
                    margin-bottom: 16px;
                    letter-spacing: -1px;
                    line-height: 1.2;
                    color: #FFFFFF !important;
                }

                .title-highlight {
                    color: var(--primary) !important;
                    text-shadow: 0 0 20px rgba(211, 0, 0, 0.4);
                }

                .construction-subtitle {
                    font-size: 1.05rem;
                    line-height: 1.6;
                    color: var(--text-muted) !important;
                    margin-bottom: 40px;
                }

                /* Progress bar styling */
                .progress-container {
                    margin-bottom: 40px;
                    text-align: left;
                }

                .progress-label-row {
                    display: flex;
                    justify-content: space-between;
                    font-size: 0.9rem;
                    color: var(--text-muted) !important;
                    margin-bottom: 8px;
                    font-weight: 500;
                }

                .progress-label-row span {
                    color: var(--text-muted) !important;
                }

                .progress-bar-bg {
                    width: 100%;
                    height: 12px;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 6px;
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    overflow: hidden;
                    position: relative;
                }

                .progress-bar-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #990000, var(--primary), #ff4d4d);
                    border-radius: 6px;
                    width: 78%;
                    box-shadow: 0 0 15px var(--primary);
                    position: relative;
                    animation: pulseGlow 2s infinite;
                }

                @keyframes pulseGlow {
                    0%, 100% { filter: brightness(1); }
                    50% { filter: brightness(1.2); }
                }

                /* Notify form styling */
                .notify-form {
                    display: flex;
                    gap: 10px;
                    margin-bottom: 20px;
                }

                .email-input {
                    flex: 1;
                    background: rgba(0, 0, 0, 0.3);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    padding: 14px 20px;
                    border-radius: 12px;
                    color: #FFFFFF !important;
                    font-size: 0.95rem;
                    outline: none;
                    transition: border-color 0.3s, box-shadow 0.3s;
                }

                .email-input:focus {
                    border-color: var(--primary);
                    box-shadow: 0 0 10px rgba(211, 0, 0, 0.2);
                }

                .submit-btn {
                    background: var(--primary);
                    color: #fff;
                    border: none;
                    padding: 14px 24px;
                    border-radius: 12px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: background 0.3s, transform 0.2s;
                }

                .submit-btn:hover {
                    background: var(--primary-hover);
                    transform: translateY(-1px);
                }

                .submit-btn:active {
                    transform: translateY(1px);
                }

                .success-msg {
                    color: #22c55e;
                    font-size: 0.95rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    background: rgba(34, 197, 94, 0.1);
                    padding: 12px;
                    border-radius: 12px;
                    border: 1px solid rgba(34, 197, 94, 0.2);
                }

                .error-msg {
                    color: #ef4444;
                    font-size: 0.85rem;
                    margin-top: 8px;
                    text-align: left;
                }

                .footer-text {
                    position: absolute;
                    bottom: 24px;
                    color: var(--text-muted) !important;
                    font-size: 0.85rem;
                    letter-spacing: 0.5px;
                }

                @media (max-width: 600px) {
                    .construction-content {
                        padding: 35px 25px;
                        border-radius: 16px;
                    }
                    .construction-title {
                        font-size: 2.2rem;
                    }
                    .notify-form {
                        flex-direction: column;
                    }
                }
            `}</style>

            <div className="construction-content">
                <div className="logo-wrapper">
                    <img src={logo} alt="FirstPass Logo" className="logo-img" />
                </div>
                <h1 className="construction-title">
                    <span className="title-highlight">FirstPass</span> Under Construction
                </h1>
                <p className="construction-subtitle">
                    We're building something epic. Our team is working hard behind the scenes to craft a brand-new experience. Stay tuned!
                </p>

                <div className="progress-container">
                    <div className="progress-label-row">
                        <span>Development Progress</span>
                        <span>78% Complete</span>
                    </div>
                    <div className="progress-bar-bg">
                        <div className="progress-bar-fill"></div>
                    </div>
                </div>

                {!submitted ? (
                    <form onSubmit={handleSubmit}>
                        <div className="notify-form">
                            <input
                                type="email"
                                className="email-input"
                                placeholder="Enter your email to get notified"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                            <button type="submit" className="submit-btn">
                                Notify Me
                            </button>
                        </div>
                        {error && <p className="error-msg">{error}</p>}
                    </form>
                ) : (
                    <div className="success-msg">
                        <i className="fas fa-check-circle" /> Thank you! We'll keep you posted.
                    </div>
                )}
            </div>

            <div className="footer-text">
                &copy; {new Date().getFullYear()} FirstPass. All rights reserved.
            </div>
        </div>
    )
}
