import { useNavigate } from 'react-router-dom'

export default function NotFound() {
    const navigate = useNavigate()

    return (
        <>
            <style>{`
                .not-found-container {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                    background: linear-gradient(135deg, #fff7f9 0%, #fff0f3 50%, #f5eefc 100%);
                    font-family: 'Outfit', 'Inter', sans-serif;
                    padding: 24px;
                    text-align: center;
                    position: relative;
                    overflow: hidden;
                }

                /* Animated background shapes */
                .bg-circle {
                    position: absolute;
                    border-radius: 50%;
                    filter: blur(80px);
                    z-index: 1;
                    opacity: 0.4;
                    animation: floatAnimation 8s ease-in-out infinite alternate;
                }

                .circle-pink {
                    width: 300px;
                    height: 300px;
                    background: #ff4d80;
                    top: -50px;
                    left: -50px;
                }

                .circle-purple {
                    width: 350px;
                    height: 350px;
                    background: #8e54e9;
                    bottom: -80px;
                    right: -50px;
                    animation-delay: -3s;
                }

                @keyframes floatAnimation {
                    0% { transform: translateY(0) scale(1); }
                    100% { transform: translateY(30px) scale(1.1); }
                }

                .not-found-content {
                    background: rgba(255, 255, 255, 0.7);
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.5);
                    padding: 48px 40px;
                    border-radius: 28px;
                    box-shadow: 0 20px 50px rgba(18, 25, 42, 0.05);
                    max-width: 500px;
                    width: 100%;
                    z-index: 2;
                    transform: scale(0.98);
                    animation: cardEntrance 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }

                @keyframes cardEntrance {
                    to { transform: scale(1); }
                }

                .error-code {
                    font-size: 8rem;
                    font-weight: 800;
                    line-height: 1;
                    margin: 0;
                    background: linear-gradient(135deg, #ff4d80 0%, #8e54e9 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    letter-spacing: -2px;
                    filter: drop-shadow(0 4px 10px rgba(255, 77, 128, 0.15));
                }

                .error-title {
                    font-size: 1.6rem;
                    font-weight: 700;
                    color: #1e293b;
                    margin-top: 16px;
                    margin-bottom: 12px;
                }

                .error-desc {
                    font-size: 0.95rem;
                    color: #64748b;
                    line-height: 1.6;
                    margin-bottom: 32px;
                }

                .error-actions {
                    display: flex;
                    justify-content: center;
                    gap: 14px;
                    flex-wrap: wrap;
                }

                .btn-404 {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 12px 24px;
                    font-size: 0.9rem;
                    font-weight: 600;
                    border-radius: 12px;
                    border: none;
                    cursor: pointer;
                    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .btn-404-primary {
                    background: linear-gradient(135deg, #ff4d80 0%, #e91e63 100%);
                    color: #fff;
                    box-shadow: 0 8px 20px rgba(233, 30, 99, 0.25);
                }

                .btn-404-primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 12px 24px rgba(233, 30, 99, 0.35);
                }

                .btn-404-primary:active {
                    transform: translateY(0);
                }

                .btn-404-secondary {
                    background: #ffffff;
                    color: #475569;
                    border: 1px solid #e2e8f0;
                }

                .btn-404-secondary:hover {
                    background: #f8fafc;
                    border-color: #cbd5e1;
                    color: #1e293b;
                    transform: translateY(-2px);
                }

                .btn-404-secondary:active {
                    transform: translateY(0);
                }
            `}</style>

            <div className="not-found-container">
                {/* Background Blobs */}
                <div className="bg-circle circle-pink"></div>
                <div className="bg-circle circle-purple"></div>

                {/* Main Card */}
                <div className="not-found-content">
                    <h1 className="error-code">404</h1>
                    <h2 className="error-title">Page Not Found</h2>
                    <p className="error-desc">
                        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
                    </p>

                    <div className="error-actions">
                        <button 
                            className="btn-404 btn-404-secondary" 
                            onClick={() => navigate(-1)}
                        >
                            <i className="fas fa-arrow-left" />
                            Go Back
                        </button>
                        <button 
                            className="btn-404 btn-404-primary" 
                            onClick={() => navigate('/')}
                        >
                            <i className="fas fa-home" />
                            Go to Home
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}
