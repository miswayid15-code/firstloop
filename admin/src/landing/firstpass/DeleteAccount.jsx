import { useState } from 'react'
import logo from '../../assets/img/logo.png'

export default function DeleteAccount() {
    const [menuOpen, setMenuOpen] = useState(false)
    const [email, setEmail] = useState('')
    const [phone, setPhone] = useState('')
    const [accountType, setAccountType] = useState('customer')
    const [reason, setReason] = useState('')
    const [confirmed, setConfirmed] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [error, setError] = useState('')

    function handleSubmit(e) {
        e.preventDefault()
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setError('Please enter a valid email address.')
            return
        }
        if (!phone || phone.length < 8) {
            setError('Please enter a valid phone number.')
            return
        }
        if (!confirmed) {
            setError('You must confirm the deletion request to proceed.')
            return
        }
        setError('')
        setSubmitted(true)
    }

    return (
        <div className="delete-page">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Outfit:wght@300;400;500;600;700;800&display=swap');

                *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

                .delete-page {
                    min-height: 100vh;
                    background-color: #f8fafc;
                    color: #1e293b;
                    font-family: 'Inter', system-ui, sans-serif;
                    display: flex;
                    flex-direction: column;
                    width: 100%;
                }

                .container {
                    width: 100%;
                    max-width: 1100px;
                    margin: 0 auto;
                    padding: 0 24px;
                }

           

                /* ─── Content Area ───────────────────────────────────────────── */
                .page-wrapper {
                    padding-top: 80px;
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                }
                .content {
                    width: 100%;
                    max-width: 1400px;
                    margin: 120px auto;
                    background-color: #ffffff;
                    padding: 40px;
                    border-radius: 16px;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
                    box-sizing: border-box;
                }
                .title {
                    font-family: 'Outfit', system-ui, sans-serif;
                    font-size: clamp(28px, 5vw, 40px);
                    font-weight: 800;
                    color: #0f172a;
                    margin-bottom: 8px;
                }
                .meta {
                    font-size: 14px;
                    color: #64748b;
                    margin-bottom: 32px;
                }
                .warning-box {
                    background-color: #fff1f2;
                    border: 1px solid #fecdd3;
                    border-radius: 12px;
                    padding: 20px;
                    margin-bottom: 32px;
                    color: #9f1239;
                }
                .warning-box h2 {
                    font-size: 16px;
                    font-weight: 700;
                    margin-bottom: 8px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .warning-box ul {
                    list-style-type: disc;
                    margin-left: 20px;
                    margin-top: 8px;
                }
                .warning-box li {
                    font-size: 14px;
                    line-height: 1.5;
                    margin-bottom: 4px;
                }

                /* Form styling */
                .delete-form {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }
                .form-group {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }
                .form-group label {
                    font-size: 14px;
                    font-weight: 600;
                    color: #1e293b;
                }
                .input-field, .select-field, .textarea-field {
                    width: 100%;
                    padding: 10px 14px;
                    border: 1px solid #cbd5e1;
                    border-radius: 8px;
                    font-family: inherit;
                    font-size: 15px;
                    outline: none;
                    background-color: #ffffff;
                    color: #0f172a;
                    transition: border-color 0.2s, box-shadow 0.2s;
                }
                .input-field:focus, .select-field:focus, .textarea-field:focus {
                    border-color: #D30000;
                    box-shadow: 0 0 0 3px rgba(211,0,0,0.15);
                }
                .textarea-field {
                    resize: vertical;
                    min-height: 100px;
                }
                .checkbox-group {
                    display: flex;
                    align-items: flex-start;
                    gap: 10px;
                    margin-top: 10px;
                }
                .checkbox-group input {
                    margin-top: 4px;
                    accent-color: #D30000;
                    width: 16px;
                    height: 16px;
                    cursor: pointer;
                }
                .checkbox-group label {
                    font-size: 14px;
                    color: #475569;
                    line-height: 1.5;
                    cursor: pointer;
                    user-select: none;
                }
                .error-message {
                    color: #e11d48;
                    font-size: 14px;
                    font-weight: 500;
                }
                .submit-btn {
                    padding: 12px 24px;
                    background-color: #D30000;
                    color: #ffffff;
                    border: none;
                    border-radius: 8px;
                    font-size: 15px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: opacity 0.2s, transform 0.2s, box-shadow 0.2s;
                    box-shadow: 0 4px 12px rgba(211,0,0,0.25);
                }
                .submit-btn:hover {
                    opacity: 0.95;
                    transform: translateY(-1px);
                    box-shadow: 0 6px 16px rgba(211,0,0,0.35);
                }
                .submit-btn:active {
                    transform: translateY(0);
                }

                .success-box {
                    text-align: center;
                    padding: 32px 20px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 16px;
                }
                .success-icon {
                    width: 56px;
                    height: 56px;
                    background-color: #d1fae5;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 28px;
                    color: #059669;
                }
                .success-box h2 {
                    font-size: 20px;
                    font-weight: 700;
                    color: #0f172a;
                }
                .success-box p {
                    font-size: 15px;
                    line-height: 1.6;
                    color: #475569;
                    max-width: 460px;
                }
                .home-btn {
                    margin-top: 12px;
                    display: inline-block;
                    padding: 10px 24px;
                    border: 1px solid #cbd5e1;
                    border-radius: 9999px;
                    color: #475569;
                    text-decoration: none;
                    font-size: 14px;
                    font-weight: 600;
                    transition: all 0.2s;
                }
                .home-btn:hover {
                    color: #0f172a;
                    border-color: #94a3b8;
                    background-color: #f8fafc;
                }

             

                @media (max-width: 600px) {
                    .content {
                        padding: 24px;
                        margin: 24px auto;
                        border-radius: 12px;
                    }
                }
            `}</style>

            {/* Custom Navbar */}


            <div className="page-wrapper">
                <div className="content">
                    {submitted ? (
                        <div className="success-box">
                            <div className="success-icon">✓</div>
                            <h2>Deletion Request Submitted</h2>
                            <p>
                                Your request to permanently delete your First Pass account and remove your personal information has been queued. We will process your request within 7 business days.
                            </p>
                            <a href="/" className="home-btn">Back to Home</a>
                        </div>
                    ) : (
                        <div>
                            <h1 className="title">Request Account Deletion</h1>
                            <p className="meta">Submit a request to permanently close your account and remove associated data.</p>

                            <div className="warning-box">
                                <h2>⚠️ Important Notice</h2>
                                <p>Permanently deleting your account will result in the following actions:</p>
                                <ul>
                                    <li>You will no longer be able to log in or use the First Pass application with this account.</li>
                                    <li>All claimed or active coupons, tokens, and offer history will be permanently revoked.</li>
                                    <li>All scheduled booking appointments, reservations, and branch chats will be deleted.</li>
                                    <li>Merchants will lose access to their branches, staff accounts, analytics, and business listings.</li>
                                </ul>
                            </div>

                            <form onSubmit={handleSubmit} className="delete-form">
                                <div className="form-group">
                                    <label htmlFor="email">Account Email Address</label>
                                    <input 
                                        id="email" 
                                        type="email" 
                                        className="input-field" 
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        placeholder="email@example.com"
                                        required 
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="phone">Mobile Number</label>
                                    <input 
                                        id="phone" 
                                        type="tel" 
                                        className="input-field" 
                                        value={phone}
                                        onChange={e => setPhone(e.target.value)}
                                        placeholder="e.g. +91 98765 43210"
                                        required 
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="account-type">Account Type</label>
                                    <select 
                                        id="account-type" 
                                        className="select-field"
                                        value={accountType}
                                        onChange={e => setAccountType(e.target.value)}
                                    >
                                        <option value="customer">Customer App Account</option>
                                        <option value="merchant">Merchant / Partner Account</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="reason">Reason for leaving </label>
                                    <textarea 
                                        id="reason" 
                                        className="textarea-field"
                                        value={reason}
                                        onChange={e => setReason(e.target.value)}
                                        placeholder="Let us know how we could improve..."
                                    />
                                </div>

                                <div className="checkbox-group">
                                    <input 
                                        id="confirm" 
                                        type="checkbox" 
                                        checked={confirmed}
                                        onChange={e => setConfirmed(e.target.checked)}
                                        required 
                                    />
                                    <label htmlFor="confirm">
                                        I understand that this request is permanent and all my data, including coupons and bookings, will be lost forever.
                                    </label>
                                </div>

                                {error && <p className="error-message" role="alert">{error}</p>}

                                <button type="submit" className="submit-btn">Submit Deletion Request</button>
                            </form>
                        </div>
                    )}
                </div>


            </div>
        </div>
    )
}
