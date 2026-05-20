import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import logo from '../assets/img/logo.png'

export default function Login() {
    const [email, setEmail] = useState('admin@dealora.com')
    const [password, setPassword] = useState('')
    const navigate = useNavigate()

    const handleSubmit = (event) => {
        event.preventDefault()
        navigate('/dashboard')
    }

    return (
        <div className="login-page">
            <div className="deco-blob blob-1" />
            <div className="deco-blob blob-2" />
            <div className="login-card">
                <div className="login-header">
                    <div className="login-logo">
                        <img src={logo} alt="D" style={{ width: 32, height: 32, objectFit: 'contain' }} />
                    </div>
                    <h1 className="login-title">Dealora</h1>
                    <p className="login-subtitle">Enterprise Merchant & Campaign Platform</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <input
                            type="email"
                            id="email"
                            className="form-control"
                            placeholder=" "
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            required
                            autoComplete="username"
                        />
                        <label htmlFor="email" className="form-label">
                            Email Address
                        </label>
                    </div>

                    <div className="form-group">
                        <input
                            type="password"
                            id="password"
                            className="form-control"
                            placeholder=" "
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            required
                            autoComplete="current-password"
                        />
                        <label htmlFor="password" className="form-label">
                            Security Password
                        </label>
                    </div>

                    {/* <div className="login-options">
                        <label className="remember-me">
                            <input type="checkbox" className="remember-checkbox" />
                            <span>Remember for 30 days</span>
                        </label>
                        <a href="#" className="forgot-link" onClick={(e) => e.preventDefault()}>
                            Recover Access?
                        </a>
                    </div> */}

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', height: 50, fontSize: '0.95rem' }}>
                        Login
                        <i className="fas fa-arrow-right" style={{ marginLeft: 4 }} />
                    </button>
                </form>

                <div className="login-footer">
                    <span>&copy; 2026 Minsway solutions Pvt Ltd</span>
                </div>
            </div>
        </div>
    )
}
