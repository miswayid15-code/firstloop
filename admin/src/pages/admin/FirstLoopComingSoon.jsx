import React, { useState, useEffect } from 'react';
import FirstLoopLogo from '../../assets/img/first-loop_logo.png';

export default function FirstLoopComingSoon() {
  // Target launch date: September 25, 2026 (25-09-2026)
  const targetDate = new Date('2026-09-25T00:00:00');

  const calculateTimeLeft = () => {
    const now = new Date();
    const difference = targetDate.getTime() - now.getTime();

    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60)
    };
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fl-coming-soon-wrapper">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Outfit:wght@500;600;700;800&display=swap');

        .fl-coming-soon-wrapper {
          --fl-cyan: #0E88B8;
          --fl-cyan-light: #4CC7E8;
          --fl-dark: #06111C;
          --fl-card-bg: rgba(10, 24, 38, 0.82);
          --fl-card-border: rgba(76, 199, 232, 0.28);
          --fl-text: #F0F8FF;
          --fl-muted: #A3C5D9;

          min-height: 100vh;
          width: 100%;
          background-color: var(--fl-dark);
          background-image: 
            radial-gradient(circle at 15% 20%, rgba(76, 199, 232, 0.2) 0%, transparent 45%),
            radial-gradient(circle at 85% 80%, rgba(14, 136, 184, 0.25) 0%, transparent 50%),
            linear-gradient(rgba(76, 199, 232, 0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(76, 199, 232, 0.04) 1px, transparent 1px);
          background-size: 100% 100%, 100% 100%, 50px 50px, 50px 50px;
          color: var(--fl-text);
          font-family: 'Plus Jakarta Sans', sans-serif;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          padding: 36px 24px;
          box-sizing: border-box;
          position: relative;
          overflow: hidden;
        }

        /* Ambient Lighting */
        .fl-ambient-glow-1 {
          position: absolute;
          top: -140px;
          left: 50%;
          transform: translateX(-50%);
          width: 650px;
          height: 650px;
          background: radial-gradient(circle, rgba(76, 199, 232, 0.25) 0%, transparent 70%);
          filter: blur(90px);
          pointer-events: none;
        }

        .fl-ambient-glow-2 {
          position: absolute;
          bottom: -150px;
          right: 10%;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(14, 136, 184, 0.2) 0%, transparent 70%);
          filter: blur(80px);
          pointer-events: none;
        }

        /* Header Navigation */
        .fl-header {
          width: 100%;
          max-width: 1100px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          position: relative;
          z-index: 5;
        }

        .fl-brand {
          display: inline-flex;
          align-items: center;
          background: #FFFFFF !important;
          padding: 8px 24px;
          border-radius: 16px;
          box-shadow: 
            0 10px 30px rgba(0, 0, 0, 0.35),
            0 0 20px rgba(76, 199, 232, 0.2);
          border: 1px solid rgba(76, 199, 232, 0.3);
        }

        .fl-logo-img {
          height: 42px;
          object-fit: contain;
        }

        .fl-switch-btn {
          background: rgba(255, 255, 255, 0.07);
          border: 1px solid rgba(76, 199, 232, 0.3);
          color: #FFFFFF;
          padding: 10px 22px;
          border-radius: 30px;
          font-size: 0.88rem;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          backdrop-filter: blur(12px);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        }

        .fl-switch-btn:hover {
          background: linear-gradient(135deg, rgba(76, 199, 232, 0.2), rgba(14, 136, 184, 0.3));
          border-color: rgba(76, 199, 232, 0.6);
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(76, 199, 232, 0.3);
        }

        /* Central Hero Coming Soon Card */
        .fl-hero-card {
          width: 100%;
          max-width: 720px;
          background: var(--fl-card-bg);
          border: 1px solid var(--fl-card-border);
          border-radius: 36px;
          padding: 54px 48px;
          text-align: center;
          backdrop-filter: blur(24px);
          box-shadow: 
            0 30px 80px rgba(0, 0, 0, 0.8),
            0 0 50px rgba(14, 136, 184, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.15);
          position: relative;
          z-index: 5;
          margin: 32px 0;
          animation: floatCard 6s ease-in-out infinite;
        }

        @keyframes floatCard {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-7px); }
        }

        .fl-badge {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: linear-gradient(135deg, rgba(76, 199, 232, 0.15), rgba(14, 136, 184, 0.28));
          border: 1px solid rgba(76, 199, 232, 0.45);
          color: var(--fl-cyan-light);
          padding: 8px 20px;
          border-radius: 30px;
          font-size: 0.88rem;
          font-weight: 600;
          letter-spacing: 0.5px;
          margin-bottom: 28px;
          box-shadow: 0 0 25px rgba(76, 199, 232, 0.25);
        }

        .fl-pulse-dot {
          width: 9px;
          height: 9px;
          background: #4CC7E8;
          border-radius: 50%;
          box-shadow: 0 0 12px #4CC7E8;
          animation: flPulse 1.8s infinite;
        }

        @keyframes flPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.4); opacity: 0.5; }
        }

        .fl-hero-title {
          font-family: 'Outfit', sans-serif;
          font-size: 3.4rem;
          font-weight: 800;
          line-height: 1.15;
          letter-spacing: -1px;
          margin: 0 0 20px 0;
          color: #FFFFFF;
        }

        .fl-gradient-text {
          background: linear-gradient(135deg, #FFFFFF 0%, #70E1FF 45%, #0E88B8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          text-shadow: 0 0 30px rgba(76, 199, 232, 0.3);
        }

        .fl-hero-subtitle {
          font-size: 1.12rem;
          line-height: 1.65;
              color: var(--fl-muted) !important;
          margin: 0 auto 36px auto;
          max-width: 540px;
        }

        /* Feature Chips */
        .fl-chips-row {
          display: flex;
          justify-content: center;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 38px;
        }

        .fl-chip {
          background: rgba(7, 21, 33, 0.65);
          border: 1px solid rgba(76, 199, 232, 0.22);
          color: #E2F4FD;
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 0.82rem;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        /* Timer Grid */
        .fl-timer-wrapper {
          background: rgba(6, 17, 28, 0.7);
          border: 1px solid rgba(76, 199, 232, 0.2);
          border-radius: 24px;
          padding: 28px 24px;
        }

        .fl-timer-title {
          font-size: 0.82rem;
          text-transform: uppercase;
          letter-spacing: 2px;
          color: var(--fl-cyan-light);
          font-weight: 700;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .fl-timer-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }

        .fl-timer-box {
          background: linear-gradient(180deg, rgba(14, 35, 54, 0.9) 0%, rgba(7, 21, 33, 0.95) 100%);
          border: 1px solid rgba(76, 199, 232, 0.25);
          border-radius: 20px;
          padding: 22px 10px;
          text-align: center;
          transition: transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }

        .fl-timer-box:hover {
          transform: translateY(-4px);
          border-color: rgba(76, 199, 232, 0.6);
          box-shadow: 0 10px 30px rgba(14, 136, 184, 0.35);
        }

        .fl-timer-val {
          font-family: 'Outfit', sans-serif;
          font-size: 2.8rem;
          font-weight: 800;
          color: #FFFFFF;
          line-height: 1;
          margin-bottom: 8px;
          background: linear-gradient(180deg, #FFFFFF 30%, #B8E4F5 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .fl-timer-lbl {
          font-size: 0.78rem;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          color: var(--fl-muted);
          font-weight: 600;
        }

        .fl-footer-text {
          position: relative;
          z-index: 5;
          color: var(--fl-muted);
          font-size: 0.85rem;
          letter-spacing: 0.5px;
        }

        @media (max-width: 650px) {
          .fl-hero-card {
            padding: 40px 24px;
            border-radius: 24px;
          }
          .fl-hero-title {
            font-size: 2.3rem;
          }
          .fl-timer-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .fl-timer-val {
            font-size: 2.2rem;
          }
          .fl-header {
            flex-direction: column;
            gap: 16px;
          }
        }
      `}</style>

      <div className="fl-ambient-glow-1"></div>
      <div className="fl-ambient-glow-2"></div>

      {/* Header */}
      <header className="fl-header">
        <div className="fl-brand">
          <img src={FirstLoopLogo} alt="FirstLoop Logo" className="fl-logo-img" />
        </div>

        {/* <button
          type="button"
          className="fl-switch-btn"
          onClick={() => {
            sessionStorage.setItem("role", "firstpass");
            localStorage.setItem("role", "firstpass");
            window.location.href = "/dashboard";
          }}
        >
          <i className="fas fa-arrow-left" style={{ color: '#4CC7E8' }}></i> Back to FirstPass Admin
        </button> */}
      </header>

      {/* Central Hero Coming Soon Card */}
      <div className="fl-hero-card">
        <div className="fl-badge">
          <span className="fl-pulse-dot"></span>
          FirstLoop 2.0 Engine • Coming Soon
        </div>

        <h1 className="fl-hero-title">
          FirstLoop is <span className="fl-gradient-text">Coming Soon</span>
        </h1>

        <p className="fl-hero-subtitle">
          We are crafting an intelligent, real-time customer rewards and loyalty ecosystem designed for next-level customer retention. Stay tuned!
        </p>

        <div className="fl-chips-row">
          <div className="fl-chip"><i className="fas fa-wallet" style={{ color: '#4CC7E8' }}></i> Digital Wallet Passes</div>
          <div className="fl-chip"><i className="fas fa-qrcode" style={{ color: '#4CC7E8' }}></i> Instant QR Check-in</div>
          {/* <div className="fl-chip"><i className="fas fa-coins" style={{ color: '#4CC7E8' }}></i> Real-Time Cashback Loops</div> */}
        </div>

        <div className="fl-timer-wrapper">
          <div className="fl-timer-title">
            <i className="fas fa-rocket"></i> Official Platform Launch In
          </div>

          <div className="fl-timer-grid">
            <div className="fl-timer-box">
              <div className="fl-timer-val">{String(timeLeft.days).padStart(2, '0')}</div>
              <div className="fl-timer-lbl">Days</div>
            </div>
            <div className="fl-timer-box">
              <div className="fl-timer-val">{String(timeLeft.hours).padStart(2, '0')}</div>
              <div className="fl-timer-lbl">Hours</div>
            </div>
            <div className="fl-timer-box">
              <div className="fl-timer-val">{String(timeLeft.minutes).padStart(2, '0')}</div>
              <div className="fl-timer-lbl">Mins</div>
            </div>
            <div className="fl-timer-box">
              <div className="fl-timer-val">{String(timeLeft.seconds).padStart(2, '0')}</div>
              <div className="fl-timer-lbl">Secs</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Copyright */}
      <div className="fl-footer-text">
        &copy; {new Date().getFullYear()} FirstLoop. All rights reserved.
      </div>
    </div>
  );
}
