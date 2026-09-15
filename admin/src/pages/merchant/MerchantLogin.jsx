import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from "react-hot-toast"
import flLogo from '../../assets/img/firstloop-favicon.png'
import API from '../../api.js'

export default function MerchantLogin() {
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    // Auto redirect if already logged in
    useEffect(() => {
        const token = localStorage.getItem("mer_access_token")
        if (token === "null" || token === "undefined") {
            localStorage.removeItem("mer_access_token")
            return
        }
        if (token) {
            navigate("/merchant/dashboard")
        }
    }, [navigate])

    const handleLogin = async (e) => {
        e?.preventDefault()
        setError('')

        if (!email.trim() || !password.trim()) {
            setError('Please fill in both email and password.')
            return
        }

        setLoading(true)

        try {
            const response = await API.post("/firstloop/merchant/login", {
                email,
                password,
            })

            const data = response.data

            if (data.status === 1 || data.success) {
                localStorage.setItem("mer_access_token", data.access_token || data.token)
                if (data.refresh_token) {
                    localStorage.setItem("mer_refresh_token", data.refresh_token)
                }
                localStorage.setItem(
                    "merchant_data",
                    JSON.stringify(data)
                )
                // console.log('data.data', data)
                toast.success("Login Success 🚀")
                navigate('/merchant/dashboard')
            } else {
                const msg = data.message || "Login Failed"
                setError(msg)
                toast.error(msg)
            }
        } catch (err) {
            console.error("Merchant Login Error:", err)
            const errMsg = err?.response?.data?.message || "Login Failed. Please check your credentials."
            setError(errMsg)
            toast.error(errMsg)
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <style>{`
                .merchant-login-container {
                    min-height: 100vh;
                    display: flex;
                    width: 100vw;
                    margin: 0;
                    padding: 0;
                    font-family: var(--font-primary, system-ui, -apple-system, sans-serif);
                    background: #F8FAFC;
                }
                .merchant-input {
                    width: 100% !important;
                    height: 48px !important;
                    border-radius: 12px !important;
                    font-size: 0.92rem !important;
                    border: 1.5px solid #CBD5E1 !important;
                    color: #0F172A !important;
                    background: #FFFFFF !important;
                    box-shadow: none !important;
                    transition: all 0.2s ease !important;
                    padding-left: 16px !important;
                    padding-right: 16px !important;
                }
                .merchant-input-pass {
                    padding-right: 46px !important;
                }
                .merchant-input::placeholder {
                    color: #94A3B8 !important;
                    opacity: 1 !important;
                }
                .merchant-input:focus {
                    border-color: #0E88B8 !important;
                    box-shadow: 0 0 0 3px rgba(14, 136, 184, 0.15) !important;
                    outline: none !important;
                }
                .merchant-toggle-btn {
                    position: absolute;
                    right: 12px;
                    top: 50%;
                    transform: translateY(-50%);
                    background: transparent;
                    border: none;
                    color: #94A3B8;
                    cursor: pointer;
                    padding: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 5;
                    border-radius: 8px;
                    transition: color 0.2s ease;
                }
                .merchant-toggle-btn:hover {
                    color: #0E88B8;
                }
                .merchant-submit-btn {
                    width: 100%;
                    height: 50px;
                    border-radius: 12px;
                    background: linear-gradient(135deg, #00A6D6 0%, #0E88B8 100%);
                    color: #FFFFFF;
                    font-weight: 700;
                    font-size: 0.96rem;
                    border: none;
                    cursor: pointer;
                    transition: all 0.25s ease;
                    box-shadow: 0 8px 20px rgba(14, 136, 184, 0.25);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                }
                .merchant-submit-btn:hover:not(:disabled) {
                    transform: translateY(-1px);
                    box-shadow: 0 12px 24px rgba(14, 136, 184, 0.35);
                    filter: brightness(1.05);
                }
                .merchant-submit-btn:disabled {
                    opacity: 0.75;
                    cursor: wait;
                }
            `}</style>

            <div className="merchant-login-container">
                {/* LEFT PANEL - DARK NAVY BRANDING HERO */}
                <div
                    style={{
                        flex: '1 1 50%',
                        background: 'radial-gradient(circle at 20% 20%, #112A46 0%, #0B192C 75%)',
                        color: '#FFFFFF',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '40px 32px',
                        position: 'relative',
                        overflow: 'hidden',
                        minHeight: '100vh'
                    }}
                    className="d-none d-lg-flex"
                >
                    {/* Ambient Glow Background Accents */}
                    <div
                        style={{
                            position: 'absolute',
                            top: '-10%',
                            left: '-10%',
                            width: '380px',
                            height: '380px',
                            borderRadius: '50%',
                            background: 'radial-gradient(circle, rgba(0, 166, 214, 0.18) 0%, rgba(0,0,0,0) 70%)',
                            pointerEvents: 'none'
                        }}
                    />
                    <div
                        style={{
                            position: 'absolute',
                            bottom: '-10%',
                            right: '-10%',
                            width: '420px',
                            height: '420px',
                            borderRadius: '50%',
                            background: 'radial-gradient(circle, rgba(14, 136, 184, 0.22) 0%, rgba(0,0,0,0) 70%)',
                            pointerEvents: 'none'
                        }}
                    />

                    {/* Main Hero Content */}
                    <div style={{ textAlign: 'center', maxWidth: 460, zIndex: 2, margin: 'auto 0' }}>
                        {/* Logo Card Badge */}
                        <div
                            style={{
                                display: 'inline-flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: '#FFFFFF',
                                borderRadius: 20,
                                padding: '16px 28px',
                                marginBottom: 32,
                                boxShadow: '0 16px 36px rgba(0,0,0,0.3)',
                                border: '1px solid rgba(255,255,255,0.2)'
                            }}
                        >
                            <img src={flLogo} alt="FirstLoop Logo" style={{ height: 42, objectFit: 'contain', marginBottom: 6 }} />
                            <span style={{ color: '#00A6D6', fontWeight: 800, fontSize: '0.94rem', letterSpacing: '0.5px' }}>
                                First Loop
                            </span>
                            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '1px', marginTop: 2 }}>
                                Merchant Platform
                            </span>
                        </div>

                        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#FFFFFF', marginBottom: 16, lineHeight: 1.25 }}>
                            Merchant Panel
                        </h1>
                        <p style={{ fontSize: '0.98rem', color: '#CBD5E1', lineHeight: 1.6, margin: 0 }}>
                            Manage memberships, customer lists, branch outlets, and loyalty passes from one intuitive dashboard.
                        </p>
                    </div>

                    {/* Overlapping Translucent Loyalty Cards Illustration */}
                    <div
                        style={{
                            width: 320,
                            height: 180,
                            position: 'relative',
                            zIndex: 2,
                            marginTop: 20,
                            marginBottom: 20
                        }}
                    >
                        {/* Background Stacked Card */}
                        <div
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 35,
                                width: 250,
                                height: 145,
                                borderRadius: 16,
                                background: 'linear-gradient(135deg, rgba(0, 166, 214, 0.4) 0%, rgba(14, 136, 184, 0.3) 100%)',
                                backdropFilter: 'blur(10px)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                                transform: 'rotate(-6deg)'
                            }}
                        />
                        {/* Foreground Card */}
                        <div
                            style={{
                                position: 'absolute',
                                top: 20,
                                left: 15,
                                width: 260,
                                height: 150,
                                borderRadius: 16,
                                background: 'linear-gradient(135deg, #00A6D6 0%, #0E88B8 100%)',
                                border: '1px solid rgba(255, 255, 255, 0.3)',
                                boxShadow: '0 16px 36px rgba(0,0,0,0.35)',
                                padding: 18,
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                transform: 'rotate(2deg)'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ width: 32, height: 24, borderRadius: 6, background: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.4)' }} />
                                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'rgba(255,255,255,0.95)', letterSpacing: '1px' }}>
                                    VIP MEMBER
                                </span>
                            </div>
                            <div>
                                <div style={{ width: 120, height: 7, background: 'rgba(255,255,255,0.7)', borderRadius: 4, marginBottom: 6 }} />
                                <div style={{ width: 80, height: 6, background: 'rgba(255,255,255,0.4)', borderRadius: 3 }} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT PANEL - LIGHT LOGIN FORM */}
                <div
                    style={{
                        flex: '1 1 50%',
                        background: '#F8FAFC',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '36px 20px 20px 20px',
                        minHeight: '100vh'
                    }}
                >
                    <div style={{ width: '100%', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div
                            style={{
                                width: '100%',
                                maxWidth: 440,
                                background: '#FFFFFF',
                                borderRadius: 24,
                                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.05)',
                                padding: '40px 36px',
                                border: '1px solid #E2E8F0'
                            }}
                        >
                            {/* Mobile Brand Logo Header (Visible on small screens) */}
                            <div className="d-lg-none" style={{ textAlign: 'center', marginBottom: 24 }}>
                                <div
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 10,
                                        background: '#F8FAFC',
                                        padding: '8px 16px',
                                        borderRadius: 12,
                                        border: '1px solid #E2E8F0'
                                    }}
                                >
                                    <img src={flLogo} alt="FirstLoop Logo" style={{ height: 28, objectFit: 'contain' }} />
                                    <span style={{ color: '#0E88B8', fontWeight: 800, fontSize: '0.95rem' }}>
                                        FirstLoop Merchant
                                    </span>
                                </div>
                            </div>

                            {/* Form Header Title */}
                            <div style={{ textAlign: 'center', marginBottom: 20 }}>
                                <h2 style={{ fontSize: '1.55rem', fontWeight: 800, color: '#0F172A', margin: 0, letterSpacing: '-0.02em' }}>
                                    Merchant Portal Login
                                </h2>
                                <p style={{ fontSize: '0.86rem', color: '#64748B', marginTop: 6, margin: 0 }}>
                                    Enter your credentials to access your merchant dashboard
                                </p>
                            </div>

                            {/* Role Selector Tabs (Merchant / Receptionist) */}
                            <div
                                style={{
                                    display: 'flex',
                                    background: '#F1F5F9',
                                    borderRadius: 12,
                                    padding: 4,
                                    marginBottom: 24,
                                    border: '1px solid #E2E8F0'
                                }}
                            >
                                <button
                                    type="button"
                                    onClick={() => navigate('/merchant/login')}
                                    style={{
                                        flex: 1,
                                        padding: '10px 14px',
                                        borderRadius: 8,
                                        border: 'none',
                                        fontSize: '0.84rem',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        background: '#FFFFFF',
                                        color: '#0E88B8',
                                        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 8
                                    }}
                                >
                                    <i className="fas fa-store" />
                                    <span>Merchant</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => navigate('/receptionist/login')}
                                    style={{
                                        flex: 1,
                                        padding: '10px 14px',
                                        borderRadius: 8,
                                        border: 'none',
                                        fontSize: '0.84rem',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        background: 'transparent',
                                        color: '#64748B',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 8
                                    }}
                                >
                                    <i className="fas fa-concierge-bell" />
                                    <span>Receptionist</span>
                                </button>
                            </div>

                            {/* Error Alert Box */}
                            {error && (
                                <div
                                    style={{
                                        padding: '12px 16px',
                                        borderRadius: 10,
                                        background: '#FEE2E2',
                                        color: '#DC2626',
                                        fontSize: '0.84rem',
                                        fontWeight: 600,
                                        marginBottom: 20,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 10,
                                        border: '1px solid #FCA5A5'
                                    }}
                                >
                                    <i className="fas fa-exclamation-circle" style={{ fontSize: '1.05rem', flexShrink: 0 }} />
                                    <span style={{ flex: 1 }}>{error}</span>
                                </div>
                            )}

                            <form onSubmit={handleLogin}>
                                {/* Email Input Field */}
                                <div style={{ marginBottom: 22 }}>
                                    <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#334155', marginBottom: 8 }}>
                                        Merchant Email
                                    </label>
                                    <input
                                        type="email"
                                        className="form-control merchant-input"
                                        placeholder="merchant@example.com"
                                        value={email}
                                        onChange={(e) => {
                                            setEmail(e.target.value)
                                            if (error) setError('')
                                        }}
                                        required
                                    />
                                </div>

                                {/* Password Input Field */}
                                <div style={{ marginBottom: 26 }}>
                                    <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#334155', marginBottom: 8 }}>
                                        Password
                                    </label>
                                    <div style={{ position: 'relative', width: '100%' }}>
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            className="form-control merchant-input merchant-input-pass"
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => {
                                                setPassword(e.target.value)
                                                if (error) setError('')
                                            }}
                                            required
                                        />
                                        <button
                                            type="button"
                                            className="merchant-toggle-btn"
                                            onClick={() => setShowPassword(!showPassword)}
                                            tabIndex={-1}
                                            title={showPassword ? "Hide password" : "Show password"}
                                        >
                                            <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} style={{ fontSize: '0.95rem' }} />
                                        </button>
                                    </div>
                                </div>

                                {/* Submit Login Button */}
                                <button
                                    type="submit"
                                    className="merchant-submit-btn"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <i className="fas fa-circle-notch fa-spin" />
                                            <span>Signing In...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Login to Merchant Dashboard</span>
                                            <i className="fas fa-arrow-right" />
                                        </>
                                    )}
                                </button>
                            </form>

                            {/* Sign Up Link */}
                            <div style={{ marginTop: 22, textAlign: 'center', fontSize: '0.88rem', color: '#64748B' }}>
                                Don't have an account?{' '}
                                <button
                                    type="button"
                                    onClick={() => {
                                        const isFirstLoop = window.location.hostname.includes('firstloop') || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
                                        if (isFirstLoop) {
                                            navigate('/#pricing')
                                        } else {
                                            window.location.href = 'https://firstloop.co.in/#pricing'
                                        }
                                    }}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        padding: 0,
                                        color: '#0E88B8',
                                        fontWeight: 800,
                                        cursor: 'pointer',
                                        textDecoration: 'underline'
                                    }}
                                >
                                    Sign Up
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Footer Copyright */}
                    <div style={{ fontSize: '0.78rem', color: '#94A3B8', textAlign: 'center', paddingBottom: 10 }}>
                        &copy; 2026 FirstLoop. All rights reserved.
                    </div>
                </div>
            </div>
        </>
    )
}

