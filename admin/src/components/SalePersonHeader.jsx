import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import logo from '../assets/img/first-loop_logo.png';
import API from '../api.js';

export default function SalePersonHeader() {
    const navigate = useNavigate();
const salesPersonData = JSON.parse(localStorage.getItem("saleperson_data")) || {};

const salesPerson = {
    name: salesPersonData.name || "",
    code: salesPersonData.code || "",
    email: salesPersonData.email || "",
    phone: salesPersonData.phone || "",
    address: salesPersonData.address || "",
    points: salesPersonData.points || 0,
    joinedDate: salesPersonData.createdAt
        ? new Date(salesPersonData.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
          })
        : "",
    // rank: salesPersonData.rank || ""
};
    const handleLogout = async () => {
        try {
            await API.post("admin/saleperson/logout");
        } catch (error) {
            console.log("Logout API error:", error);
        } finally {
            localStorage.removeItem("sale_access_token");
            localStorage.removeItem("saleperson_data");
            localStorage.removeItem("sale_refresh_token");
            toast.success("Logged out successfully");
            navigate("/saleperson-login");
        }
    };

    return (
        <>
            <style>{`
                .sp-portal-header {
                    height: 80px;
                    background: white;
                    border-bottom: var(--border-light);
                    padding: 0 40px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    position: sticky;
                    top: 0;
                    z-index: 100;
                    box-shadow: var(--shadow-sm);
                }

                .sp-header-left {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }

                .sp-portal-logo {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 140px;
                    height: 44px;
                    background: var(--firstloop-primary-light);
                    border-radius: 12px;
                }

                .sp-portal-title {
                    font-family: var(--font-heading);
                    font-size: 1.25rem;
                    font-weight: 700;
                    color: var(--dark-blue);
                }

                .sp-portal-badge {
                    font-size: 0.68rem;
                    font-weight: 700;
                    background: var(--firstloop-primary-light);
                    color: var(--firstloop-primary);
                    padding: 4px 8px;
                    border-radius: 20px;
                    letter-spacing: 0.05em;
                    text-transform: uppercase;
                }

                .sp-header-right {
                    display: flex;
                    align-items: center;
                    gap: 24px;
                }

                .sp-user-profile {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .sp-user-avatar {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background: var(--firstloop-gradient-primary);
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 700;
                    box-shadow: 0 4px 10px rgba(14, 136, 184, 0.2);
                }

                .sp-user-meta {
                    display: flex;
                    flex-direction: column;
                }

                .sp-username {
                    font-size: 0.9rem;
                    font-weight: 600;
                    color: var(--dark-blue);
                }

                // .sp-user-rank {
                //     font-size: 0.72rem;
                //     color: #d97706;
                //     font-weight: 600;
                // }

                .sp-logout-btn {
                    background: none;
                    border: 1px solid rgba(220, 38, 38, 0.15);
                    color: var(--status-danger);
                    padding: 8px 16px;
                    border-radius: 8px;
                    font-size: 0.85rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: var(--transition-fast);
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }

                .sp-logout-btn:hover {
                    background: var(--status-danger-bg);
                    border-color: transparent;
                }

                @media (max-width: 768px) {
                    .sp-portal-header {
                        padding: 0 20px;
                    }
                }
            `}</style>

            <header className="sp-portal-header">
                <div className="sp-header-left">
                    <div className="sp-portal-logo">
                        <img src={logo} alt="L" style={{ width: 100, height: 80, objectFit: 'contain' }} />
                    </div>
                    {/* <span className="sp-portal-title">Dealora Campaign Console</span>
                    <span className="sp-portal-badge">Sales Partner</span> */}
                </div>

                <div className="sp-header-right">
                    <div className="sp-user-profile">
                        <div className="sp-user-avatar">
                            {salesPerson.name ? salesPerson.name.charAt(0).toUpperCase() : 'A'}
                        </div>
                        <div className="sp-user-meta">
                            <span className="sp-username">{salesPerson.name || 'Sales Partner'}</span>
                            {/* <span className="sp-user-rank">Gold Partner</span> */}
                        </div>
                    </div>

                    <button className="sp-logout-btn" onClick={handleLogout}>
                        <i className="fas fa-sign-out-alt" />
                        <span>Sign Out</span>
                    </button>
                </div>
            </header>
        </>
    );
}
