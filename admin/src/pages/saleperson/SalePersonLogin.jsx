import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import API from '../../api.js';
import logo from '../../assets/img/firstloop-favicon.png';

export default function SalePersonLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("sale_access_token");

    if (token === "null" || token === "undefined") {
      localStorage.removeItem("sale_access_token");
      return;
    }

    if (token) {
      navigate("/saleperson-dashboard");
    }
  }, [navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);

    try {
      const response = await API.post("admin/saleperson/login", {
        email,
        password,
      });

      const data = response.data;

      if (data.status === 1) {
        localStorage.setItem("sale_access_token", data.access_token);
        localStorage.setItem("sale_refresh_token", data.refresh_token);
        localStorage.setItem("saleperson_data", JSON.stringify(data.data));

        toast.success("Login Success 🚀");

        setTimeout(() => {
          navigate("/saleperson-dashboard");
        }, 1000);
      } else {
        toast.error(data.message || "Invalid credentials");
      }
    } catch (error) {
      console.log(error);
      const errMsg = error?.response?.data?.message || "Login Failed";
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        .sp-login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          position: relative;
          background: radial-gradient(circle at 80% 20%, rgba(14, 136, 184, 0.15) 0%, rgba(255, 255, 255, 0) 60%),
                      radial-gradient(circle at 20% 80%, rgba(0, 166, 214, 0.12) 0%, rgba(255, 255, 255, 0) 70%),
                      var(--bg-secondary);
          overflow: hidden;
          font-family: var(--font-primary);
        }

        .sp-deco-circle {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          z-index: 0;
          pointer-events: none;
        }

        .sp-circle-1 {
          width: 300px;
          height: 300px;
          background: rgba(76, 199, 232, 0.25);
          top: 15%;
          left: 10%;
          animation: floatAnimation 8s ease-in-out infinite alternate;
        }

        .sp-circle-2 {
          width: 400px;
          height: 400px;
          background: rgba(14, 136, 184, 0.18);
          bottom: 10%;
          right: 8%;
          animation: floatAnimation 12s ease-in-out infinite alternate-reverse;
        }

        @keyframes floatAnimation {
          0% { transform: translateY(0px) scale(1); }
          100% { transform: translateY(30px) scale(1.1); }
        }

        .sp-login-card {
          width: 100%;
          max-width: 450px;
          background: rgba(255, 255, 255, 0.75);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(14, 136, 184, 0.15);
          border-radius: 24px;
          padding: 40px 36px;
          box-shadow: 0 20px 40px rgba(14, 136, 184, 0.08);
          position: relative;
          z-index: 1;
          animation: cardFadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes cardFadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .sp-login-header {
          text-align: center;
          margin-bottom: 36px;
        }

        .sp-login-logo {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 88px;
          height: 88px;
          margin: 0 auto 16px;
          border-radius: 20px;
          background: white;
          border: 1px solid rgba(14, 136, 184, 0.1);
          box-shadow: 0 10px 25px rgba(14, 136, 184, 0.08);
          transition: transform 0.3s ease;
        }

        .sp-login-logo:hover {
          transform: translateY(-4px) rotate(2deg);
        }

        .sp-login-title {
          font-family: var(--font-heading);
          font-size: 1.6rem;
          font-weight: 700;
          color: var(--dark-blue);
          margin-bottom: 6px;
          letter-spacing: -0.02em;
        }

        .sp-login-subtitle {
          font-size: 0.88rem;
          color: var(--text-secondary);
          line-height: 1.4;
        }

        .sp-badge {
          display: inline-block;
          margin-top: 8px;
          padding: 4px 10px;
          background: var(--firstloop-primary-light);
          color: var(--firstloop-primary);
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          border-radius: 30px;
        }

        .sp-form-group {
          position: relative;
          margin-bottom: 24px;
        }

        .sp-form-group .form-control {
          width: 100%;
          height: 52px;
          padding: 14px 16px;
              border: 1.5px solid rgba(14, 136, 184, 0.15);
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.8);
          color: var(--text-primary);
          font-size: 0.95rem;
          font-family: var(--font-primary);
          transition: all 0.25s ease;
          outline: none;
        }

        .sp-form-group .form-control:focus {
          border-color: var(--firstloop-primary);
          background: white;
          box-shadow: 0 0 0 4px rgba(14, 136, 184, 0.12);
        }

        /* Floating label logic styling */
        .sp-form-group .form-label {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          background: transparent;
          padding: 0 4px;
          color: var(--text-muted);
          font-size: 0.95rem;
          pointer-events: none;
          transition: all 0.25s ease;
          transform-origin: left top;
        }

        /* Trigger active/focus state for labels */
        .sp-form-group .form-control:focus ~ .form-label,
        .sp-form-group .form-control:not(:placeholder-shown) ~ .form-label {
          top: 0;
          transform: translateY(-50%) scale(0.85);
          background: white;
          color: var(--firstloop-primary);
          font-weight: 600;
        }

        .sp-password-toggle {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: var(--text-secondary);
          padding: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          zIndex: 10;
          transition: color 0.2s ease;
        }

        .sp-password-toggle:hover {
          color: var(--firstloop-primary);
        }

        .sp-btn-submit {
          width: 100%;
          height: 52px;
          background: var(--firstloop-gradient-primary);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 0.98rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 8px 20px rgba(14, 136, 184, 0.2);
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .sp-btn-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 24px rgba(14, 136, 184, 0.3);
          filter: brightness(1.05);
        }

        .sp-btn-submit:active:not(:disabled) {
          transform: translateY(0);
        }

        .sp-btn-submit:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          box-shadow: none;
        }

        .sp-login-footer {
          text-align: center;
          margin-top: 32px;
          font-size: 0.78rem;
          color: var(--text-muted);
          border-top: 1px solid rgba(14, 136, 184, 0.08);
          padding-top: 18px;
        }
      `}</style>

      <div className="sp-login-page">
        {/* Floating blurred background circles */}
        <div className="sp-deco-circle sp-circle-1" />
        <div className="sp-deco-circle sp-circle-2" />

        <div className="sp-login-card">
          <div className="sp-login-header">
            <div className="sp-login-logo">
              <img
                src={logo}
                alt="FirstLoop Logo"
                style={{
                  width: 76,
                  height: 76,
                  objectFit: "contain",
                }}
              />
            </div>

            <h1 className="sp-login-title">FirstLoop</h1>
            <p className="sp-login-subtitle">
              Enter details below to access the Sales Portal
            </p>
            <span className="sp-badge">Sales Partner Portal</span>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Email Address */}
            <div className="sp-form-group">
              <input
                type="email"
                id="sp-email"
                className="form-control"
                placeholder=" "
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
              <label htmlFor="sp-email" className="form-label">
                Email Address
              </label>
            </div>

            {/* Password */}
            <div className="sp-form-group" style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                id="sp-password"
                className="form-control"
                placeholder=" "
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                style={{ paddingRight: "44px" }}
              />
              <label htmlFor="sp-password" className="form-label">
                Password
              </label>

              <button
                type="button"
                className="sp-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                <i className={showPassword ? "fas fa-eye-slash" : "fas fa-eye"}></i>
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="sp-btn-submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Portal</span>
                  <i className="fas fa-arrow-right" />
                </>
              )}
            </button>
          </form>

          <div className="sp-login-footer">
            <span>&copy; 2026 Minsway Solutions Pvt Ltd. All rights reserved.</span>
          </div>
        </div>
      </div>
    </>
  );
}
