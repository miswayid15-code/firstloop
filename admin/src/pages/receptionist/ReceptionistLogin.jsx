import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import flLogo from '../../assets/img/firstloop-favicon.png'

export default function ReceptionistLogin() {
    const navigate = useNavigate()
    const [email, setEmail] = useState('elena.r@dealora.com')
    const [password, setPassword] = useState('password123')
    const [loading, setLoading] = useState(false)

    const handleLogin = (e) => {
        e.preventDefault()
        if (!email.trim()) {
            alert('Please enter receptionist email address')
            return
        }

        setLoading(true)
        setTimeout(() => {
            setLoading(false)
            navigate('/receptionist/dashboard')
        }, 500)
    }

    const handleDemoFill = () => {
        setEmail('elena.r@dealora.com')
        setPassword('password123')
    }

    return (
        <div
            style={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0E88B8 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px 16px'
            }}
        >
            <div
                style={{
                    width: '100%',
                    maxWidth: 440,
                    background: '#FFFFFF',
                    borderRadius: 24,
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
                    padding: '36px 32px',
                    position: 'relative',
                    overflow: 'hidden'
                }}
            >
                {/* Decorative Top Accent */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, background: 'var(--firstloop-gradient-primary)' }} />

                {/* Logo & Header */}
                <div style={{ textAlign: 'center', marginBottom: 28 }}>
                    <div
                        style={{
                            width: 64,
                            height: 64,
                            borderRadius: 18,
                            background: 'var(--firstloop-primary-light)',
                            margin: '0 auto 16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid rgba(14,136,184,0.2)'
                        }}
                    >
                        <img src={flLogo} alt="FirstLoop Logo" style={{ width: 36, height: 36, objectFit: 'contain' }} />
                    </div>

                    <span
                        style={{
                            display: 'inline-block',
                            background: 'rgba(14, 136, 184, 0.12)',
                            color: 'var(--firstloop-primary)',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            padding: '4px 12px',
                            borderRadius: 20,
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                            marginBottom: 8
                        }}
                    >
                        RECEPTIONIST DESK PORTAL
                    </span>

                    <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', margin: '4px 0 0 0' }}>
                        Receptionist Login
                    </h2>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 6 }}>
                        FirstLoop Flagship Outlet • Branch Check-In & Card Terminal
                    </p>
                </div>

                {/* Quick Fill Shortcut */}
                <div
                    onClick={handleDemoFill}
                    style={{
                        background: '#F8FAFC',
                        border: '1px dashed var(--firstloop-primary)',
                        borderRadius: 12,
                        padding: '10px 14px',
                        marginBottom: 20,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <i className="fas fa-user-shield" style={{ color: 'var(--firstloop-primary)', fontSize: '1.1rem' }} />
                        <div>
                            <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                                Demo Receptionist Account
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                elena.r@dealora.com (Downtown Branch)
                            </div>
                        </div>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--firstloop-primary)', fontWeight: 800 }}>Auto Fill</span>
                </div>

                {/* Form */}
                <form onSubmit={handleLogin}>
                    <div className="form-group mb-3">
                        <label style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: 6, display: 'block', color: 'var(--text-primary)' }}>
                            Receptionist Email
                        </label>
                        <div style={{ position: 'relative' }}>
                            <i className="fas fa-envelope" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="email"
                                className="form-control"
                                placeholder="elena.r@dealora.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                style={{ paddingLeft: 40, height: 44, borderRadius: 10, fontSize: '0.88rem' }}
                            />
                        </div>
                    </div>

                    <div className="form-group mb-4">
                        <label style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: 6, display: 'block', color: 'var(--text-primary)' }}>
                            Password
                        </label>
                        <div style={{ position: 'relative' }}>
                            <i className="fas fa-lock" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="password"
                                className="form-control"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                style={{ paddingLeft: 40, height: 44, borderRadius: 10, fontSize: '0.88rem' }}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn firstloop-btn-primary"
                        style={{
                            width: '100%',
                            height: 46,
                            borderRadius: 12,
                            fontWeight: 800,
                            fontSize: '0.92rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8
                        }}
                    >
                        {loading ? (
                            <span>Logging in...</span>
                        ) : (
                            <>
                                <span>Access Receptionist Terminal</span>
                                <i className="fas fa-arrow-right" />
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    )
}
