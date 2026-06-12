import { useState, useEffect } from 'react';
import './ComingSoon.css';

// Target launch date — adjust as needed
const LAUNCH_DATE = new Date('2025-09-01T00:00:00');

function getTimeLeft() {
  const now = new Date();
  const diff = LAUNCH_DATE - now;
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    days:    Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours:   Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
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
  );
}

export default function ComingSoon() {
  const [time, setTime]       = useState(getTimeLeft());
  const [email, setEmail]     = useState('');
  const [submitted, setSubmit] = useState(false);
  const [error, setError]     = useState('');

  useEffect(() => {
    const id = setInterval(() => setTime(getTimeLeft()), 1000);
    return () => clearInterval(id);
  }, []);

  function handleNotify(e) {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    setError('');
    setSubmit(true);
  }

  return (
    <div className="cs-page">
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
          <img src="/logo.png" alt="Dealora logo" className="cs-logo" />
        </div>

        <div className="cs-badge animate-fade-up-2">
          <span className="cs-badge-dot" aria-hidden="true" />
          Something amazing is brewing
        </div>

        <h1 className="cs-title animate-fade-up-2">
          Dealora is<br />
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
                <p>We'll notify you the moment Dealora launches.</p>
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
            { icon: '🏪', label: 'Merchant Dashboard' },
          ].map(f => (
            <div key={f.label} className="cs-feature-pill">
              <span>{f.icon}</span>
              <span>{f.label}</span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
