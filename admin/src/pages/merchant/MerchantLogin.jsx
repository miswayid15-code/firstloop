import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import flLogo from '../../assets/img/firstloop-favicon.png'

export default function MerchantLogin() {
    const navigate = useNavigate()
    const [loginRole, setLoginRole] = useState('merchant') // 'merchant' | 'receptionist'
    const [email, setEmail] = useState('admin@gmail.com')
    const [password, setPassword] = useState('123456')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleRoleSwitch = (role) => {
        setLoginRole(role)
        setError('')
        if (role === 'receptionist') {
            setEmail('elena.r@dealora.com')
            setPassword('password123')
        } else {
            setEmail('admin@gmail.com')
            setPassword('123456')
        }
    }

    const handleLogin = (e) => {
        e?.preventDefault()
        setError('')

        if (!email.trim() || !password.trim()) {
            setError('Please fill in both email and password.')
            return
        }

        setLoading(true)

        setTimeout(() => {
            const userData = {
                merchantId: 'm-204',
                name: loginRole === 'receptionist' ? 'Elena Rostova' : 'Urban Brew & Glow Outlets',
                email: email,
                role: loginRole,
                token: 'mock-jwt-token-2026'
            }

            localStorage.setItem('user_session', JSON.stringify(userData))
            sessionStorage.setItem('user_session', JSON.stringify(userData))
            setLoading(false)

            // Direct route redirect based on selected role switch
            if (loginRole === 'receptionist') {
                navigate('/receptionist/dashboard')
            } else {
                navigate('/merchant/dashboard')
            }
        }, 500)
    }

    const handleQuickFill = () => {
        if (loginRole === 'receptionist') {
            setEmail('elena.r@dealora.com')
            setPassword('password123')
        } else {
            setEmail('admin@gmail.com')
            setPassword('123456')
        }
    }

    return (
        <div style={{ minHeight: '100vh', display: 'flex', width: '100vw', margin: 0, padding: 0, fontFamily: 'var(--font-primary)' }}>
            {/* LEFT PANEL - DARK NAVY BRANDING */}
            <div
                style={{
                    flex: 1,
                    background: '#0B192C',
                    color: '#FFFFFF',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '40px 30px',
                    position: 'relative',
                    overflow: 'hidden',
                    minHeight: '100vh'
                }}
                className="d-none d-lg-flex"
            >
                {/* Center Content Container */}
                <div style={{ textAlign: 'center', maxWidth: 460, zIndex: 2, marginTop: -40 }}>
                    {/* Logo Card Icon */}
                    <div
                        style={{
                            width: 140,
                            height: 100,
                            background: '#FFFFFF',
                            borderRadius: 16,
                            display: 'inline-flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: 32,
                            boxShadow: '0 12px 30px rgba(0,0,0,0.3)',
                            padding: 12
                        }}
                    >
                        <img src={flLogo} alt="FirstLoop" style={{ height: 46, objectFit: 'contain', marginBottom: 4 }} />
                        <span style={{ color: '#00A6D6', fontWeight: 800, fontSize: '0.95rem', fontFamily: 'var(--font-heading)' }}>
                            First Loop
                        </span>
                    </div>

                    <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.2rem', fontWeight: 800, color: '#FFFFFF', marginBottom: 12 }}>
                        {loginRole === 'receptionist' ? 'Receptionist Terminal' : 'Merchant Admin Portal'}
                    </h1>
                    <p style={{ fontSize: '0.98rem', color: '#94A3B8', lineHeight: 1.6, margin: 0 }}>
                        {loginRole === 'receptionist'
                            ? 'Branch desk check-in, stamp card updates, and daily membership verification.'
                            : 'Manage memberships, customer lists, branch outlets, and loyalty passes from one place.'}
                    </p>
                </div>

                {/* Overlapping Translucent Loyalty Cards Illustration */}
                <div
                    style={{
                        position: 'absolute',
                        bottom: 40,
                        width: 320,
                        height: 180,
                        zIndex: 1
                    }}
                >
                    {/* Background Stacked Card */}
                    <div
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 40,
                            width: 260,
                            height: 150,
                            borderRadius: 16,
                            background: 'linear-gradient(135deg, rgba(0, 166, 214, 0.45) 0%, rgba(14, 136, 184, 0.35) 100%)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                            transform: 'rotate(-6deg)'
                        }}
                    />
                    {/* Foreground Card */}
                    <div
                        style={{
                            position: 'absolute',
                            top: 25,
                            left: 10,
                            width: 260,
                            height: 150,
                            borderRadius: 16,
                            background: 'linear-gradient(135deg, rgba(0, 166, 214, 0.85) 0%, rgba(14, 136, 184, 0.95) 100%)',
                            border: '1px solid rgba(255, 255, 255, 0.25)',
                            boxShadow: '0 16px 36px rgba(0,0,0,0.3)',
                            padding: 18,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            transform: 'rotate(2deg)'
                        }}
                    >
                        <div style={{ width: 34, height: 26, borderRadius: 6, background: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.4)' }} />
                        <div>
                            <div style={{ width: 120, height: 6, background: 'rgba(255,255,255,0.5)', borderRadius: 3, marginBottom: 6 }} />
                            <div style={{ width: 80, height: 6, background: 'rgba(255,255,255,0.3)', borderRadius: 3 }} />
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT PANEL - LIGHT LOGIN FORM */}
            <div
                style={{
                    flex: 1,
                    background: '#F4F6F8',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '40px 20px 20px 20px',
                    minHeight: '100vh'
                }}
            >
                <div style={{ width: '100%', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div
                        style={{
                            width: '100%',
                            maxWidth: 440,
                            background: '#FFFFFF',
                            borderRadius: 20,
                            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.05)',
                            padding: '36px 32px',
                            border: '1px solid rgba(0, 0, 0, 0.04)'
                        }}
                    >
                        {/* ROLE SWITCH TOGGLE TAB */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: '#F1F5F9', padding: 4, borderRadius: 12, marginBottom: 24 }}>
                            <button
                                type="button"
                                onClick={() => handleRoleSwitch('merchant')}
                                style={{
                                    padding: '9px 12px',
                                    borderRadius: 10,
                                    border: 'none',
                                    background: loginRole === 'merchant' ? '#0E88B8' : 'transparent',
                                    color: loginRole === 'merchant' ? '#FFFFFF' : '#64748B',
                                    fontWeight: 800,
                                    fontSize: '0.85rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 6
                                }}
                            >
                                <i className="fas fa-store" />
                                <span>Merchant Login</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleRoleSwitch('receptionist')}
                                style={{
                                    padding: '9px 12px',
                                    borderRadius: 10,
                                    border: 'none',
                                    background: loginRole === 'receptionist' ? '#0E88B8' : 'transparent',
                                    color: loginRole === 'receptionist' ? '#FFFFFF' : '#64748B',
                                    fontWeight: 800,
                                    fontSize: '0.85rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 6
                                }}
                            >
                                <i className="fas fa-concierge-bell" />
                                <span>Receptionist Login</span>
                            </button>
                        </div>

                        {/* Header Title */}
                        <div style={{ textAlign: 'center', marginBottom: 24 }}>
                            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 800, color: '#1E293B', margin: 0 }}>
                                {loginRole === 'receptionist' ? 'Receptionist Login' : 'Merchant Portal Login'}
                            </h2>
                            <p style={{ fontSize: '0.85rem', color: '#64748B', marginTop: 4, margin: 0 }}>
                                {loginRole === 'receptionist'
                                    ? 'Log in to access branch card check-in desk'
                                    : 'Enter credentials to access your merchant dashboard'}
                            </p>
                        </div>

                        {error && (
                            <div style={{ padding: '10px 14px', borderRadius: 8, background: '#FEE2E2', color: '#DC2626', fontSize: '0.82rem', fontWeight: 600, marginBottom: 18 }}>
                                <i className="fas fa-exclamation-circle" style={{ marginRight: 6 }} />
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleLogin}>
                            {/* Email Input */}
                            <div style={{ marginBottom: 18 }}>
                                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                                    {loginRole === 'receptionist' ? 'Receptionist Email' : 'Merchant Email'}
                                </label>
                                <input
                                    type="email"
                                    className="form-control"
                                    placeholder={loginRole === 'receptionist' ? 'elena.r@dealora.com' : 'admin@gmail.com'}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    style={{
                                        height: 44,
                                        borderRadius: 8,
                                        fontSize: '0.9rem',
                                        border: '1px solid #E2E8F0',
                                        padding: '0 14px',
                                        color: '#1E293B',
                                        background: '#FFFFFF'
                                    }}
                                    required
                                />
                            </div>

                            {/* Password Input */}
                            <div style={{ marginBottom: 22 }}>
                                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                                    Password
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        className="form-control"
                                        placeholder="••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        style={{
                                            height: 44,
                                            borderRadius: 8,
                                            fontSize: '0.9rem',
                                            border: '1px solid #E2E8F0',
                                            paddingLeft: 14,
                                            paddingRight: 40,
                                            color: '#1E293B',
                                            background: '#FFFFFF'
                                        }}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        style={{
                                            position: 'absolute',
                                            right: 12,
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            background: 'none',
                                            border: 'none',
                                            color: '#94A3B8',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} />
                                    </button>
                                </div>
                            </div>

                            {/* Login Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                style={{
                                    width: '100%',
                                    height: 46,
                                    borderRadius: 10,
                                    background: '#0E88B8',
                                    color: '#FFFFFF',
                                    fontWeight: 800,
                                    fontSize: '0.92rem',
                                    border: 'none',
                                    cursor: loading ? 'wait' : 'pointer',
                                    transition: 'all 0.2s ease',
                                    marginBottom: 16,
                                    boxShadow: '0 4px 12px rgba(14, 136, 184, 0.2)'
                                }}
                            >
                                {loading
                                    ? 'Signing In...'
                                    : loginRole === 'receptionist'
                                        ? 'Login to Receptionist Terminal'
                                        : 'Login to Merchant Dashboard'}
                            </button>
                        </form>

                        {/* Demo Quick Fill */}
                        <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px dashed #E2E8F0', textAlign: 'center' }}>
                            <button
                                type="button"
                                onClick={handleQuickFill}
                                style={{
                                    padding: '6px 14px',
                                    borderRadius: 6,
                                    background: '#E6F2FA',
                                    color: '#0E88B8',
                                    fontSize: '0.78rem',
                                    fontWeight: 700,
                                    border: 'none',
                                    cursor: 'pointer'
                                }}
                            >
                                Fill Demo {loginRole === 'receptionist' ? 'Receptionist' : 'Merchant'} Credentials
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
    )
}
