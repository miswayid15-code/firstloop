import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import SalePersonHeader from '../../components/SalePersonHeader';
import API from '../../api';

export default function SalePersonDashboard() {
    const navigate = useNavigate();
    const [copied, setCopied] = useState(false);
    const [merchant_list, setMerchant_list] = useState([]);
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    useEffect(() => {

        fetchMerchants()

    }, [])
    useEffect(() => {
        const token = localStorage.getItem("sale_access_token");
        if (!token || token === "null" || token === "undefined") {
            localStorage.removeItem("sale_access_token");
            localStorage.removeItem("saleperson_data");
            navigate("/saleperson-login");
        }

    }, [navigate]);


    const salesPerson = JSON.parse(localStorage.getItem("saleperson_data")) || {};

    const filteredMerchants = (Array.isArray(merchant_list) ? merchant_list : []).filter((merchant) => {
        const searchValue = search.toLowerCase();
        const name = merchant.name || '';
        const busName = merchant.bus_name || '';
        const email = merchant.email || '';
        const phone = merchant.phone || '';
        return (
            name.toLowerCase().includes(searchValue) ||
            busName.toLowerCase().includes(searchValue) ||
            email.toLowerCase().includes(searchValue) ||
            phone.toLowerCase().includes(searchValue)
        );
    });

    const MERCHANTS_PER_PAGE = 10;
    const totalPages = Math.max(1, Math.ceil(filteredMerchants.length / MERCHANTS_PER_PAGE));
    const safePage = Math.min(currentPage, totalPages);
    const startIndex = (safePage - 1) * MERCHANTS_PER_PAGE;
    const paginatedMerchants = filteredMerchants.slice(startIndex, startIndex + MERCHANTS_PER_PAGE);

    const startCount = filteredMerchants.length === 0 ? 0 : startIndex + 1;
    const endCount = Math.min(startIndex + MERCHANTS_PER_PAGE, filteredMerchants.length);

    const pageNumbers = [];
    for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
    }

     const fetchMerchants = async () => {
        try {
            const response = await API.post('admin/saleperson/merchant_list');
            console.log("response for merchant list", response.data);
            if (response.data.status === 1 && Array.isArray(response.data.data)) {
                setMerchant_list(response.data.data);
            } else {
                setMerchant_list([]);
            }
        } catch (err) {
            toast.error("Failed to fetch merchants");
        }
     };




    const copyToClipboard = () => {
        navigator.clipboard.writeText(salesPerson.code);
        setCopied(true);
        toast.success("Referral code copied to clipboard! 📋");
        setTimeout(() => setCopied(false), 2000);
    };


    return (
        <>
            <style>{`
                .sp-dash-container {
                    min-height: 100vh;
                    background: var(--firstloop-bg-primary);
                    font-family: var(--font-primary);
                    color: var(--text-primary);
                }

                /* Portal Top Navigation bar */
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
                    width: 100px;
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

                /* Portal Layout View */
                .sp-dash-body {
                    padding: 40px;
                    max-width: 1800px;
                    margin: 0 auto;
                }

                .sp-welcome-banner {
                        background: linear-gradient(135deg, #8cd7e5 0%, #0dcaf0 100%);
                    color: white;
                    border-radius: var(--border-radius-lg);
                    padding: 32px 40px;
                    margin-bottom: 32px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    position: relative;
                    overflow: hidden;
                    box-shadow: var(--shadow-md);
                }

                .sp-banner-deco {
                    position: absolute;
                    right: 0;
                    bottom: 0;
                    width: 250px;
                    height: 250px;
                    background: radial-gradient(circle, rgba(76, 199, 232, 0.15) 0%, rgba(255,255,255,0) 70%);
                    pointer-events: none;
                }

                .sp-welcome-title {
                    font-family: var(--font-heading);
                    font-size: 1.75rem;
                    font-weight: 700;
                    margin-bottom: 8px;
                }

                .sp-welcome-subtitle {
                    color: rgba(255, 255, 255, 0.7);
                    font-size: 0.95rem;
                }

                .sp-banner-info-badge {
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.15);
                    padding: 10px 20px;
                    border-radius: 12px;
                    font-size: 0.85rem;
                    text-align: right;
                }

                /* KPI Grid */
                .sp-kpi-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 24px;
                    margin-bottom: 32px;
                }

                .sp-kpi-card {
                    background: white;
                    border: var(--border-light);
                    border-radius: var(--border-radius-lg);
                    padding: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    box-shadow: var(--shadow-sm);
                    transition: var(--transition-bounce);
                }

                .sp-kpi-card:hover {
                    transform: translateY(-4px);
                    box-shadow: var(--shadow-md);
                }

                .sp-kpi-label {
                    font-size: 0.8rem;
                    color: var(--text-secondary);
                    font-weight: 500;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    margin-bottom: 6px;
                }

                .sp-kpi-value {
                    font-size: 1.8rem;
                    font-weight: 700;
                    color: var(--dark-blue);
                }

                .sp-kpi-icon-wrapper {
                    width: 52px;
                    height: 52px;
                    border-radius: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.4rem;
                }

                .sp-code-area {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    background: var(--firstloop-bg-primary);
                    border: 1px solid rgba(14, 136, 184, 0.15);
                    padding: 6px 12px;
                    border-radius: 8px;
                    margin-top: 4px;
                }

                .sp-code-text {
                    font-family: monospace;
                    font-size: 1.1rem;
                    font-weight: 700;
                    color: var(--firstloop-primary);
                }

                .sp-code-copy-btn {
                    background: none;
                    border: none;
                    cursor: pointer;
                    color: var(--text-muted);
                    transition: var(--transition-fast);
                }

                .sp-code-copy-btn:hover {
                    color: var(--firstloop-primary);
                }

                /* Grid content structure */
                .sp-main-grid {
                    display: grid;
                    // grid-template-columns: 1fr 1fr;
                    gap: 32px;
                }

                .sp-card-panel {
                    background: white;
                    border: var(--border-light);
                    border-radius: var(--border-radius-lg);
                    box-shadow: var(--shadow-sm);
                    padding: 32px;
                    margin-bottom: 32px;
                }

                .sp-panel-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 24px;
                }

                .sp-panel-title {
                    font-family: var(--font-heading);
                    font-size: 1.2rem;
                    font-weight: 700;
                    color: var(--dark-blue);
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                /* Custom responsive table styles */
                .sp-custom-table {
                    width: 100%;
                    border-collapse: collapse;
                }

                .sp-custom-table th {
                    text-align: left;
                    padding: 14px 16px;
                    background: var(--firstloop-bg-primary);
                    color: var(--text-secondary);
                    font-weight: 600;
                    font-size: 0.85rem;
                    border-bottom: 1.5px solid rgba(14, 136, 184, 0.08);
                }

                .sp-custom-table td {
                    padding: 16px;
                    border-bottom: 1px solid rgba(14, 136, 184, 0.05);
                    font-size: 0.9rem;
                    color: var(--text-primary);
                }

                .sp-custom-table tr:hover td {
                    background: rgba(14, 136, 184, 0.02);
                }

                .sp-merchant-profile {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .sp-merchant-avatar {
                    width: 36px;
                    height: 36px;
                    border-radius: 8px;
                    background: rgba(14, 136, 184, 0.1);
                    color: var(--firstloop-primary);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 700;
                }

                .sp-merchant-name {
                    font-weight: 600;
                    color: var(--dark-blue);
                }

                .sp-merchant-owner {
                    font-size: 0.75rem;
                    color: var(--text-secondary);
                }

                .sp-badge-status {
                    display: inline-block;
                    padding: 4px 8px;
                    border-radius: 6px;
                    font-size: 0.72rem;
                    font-weight: 600;
                }

                .sp-badge-active {
                    background: var(--status-success-bg);
                    color: var(--status-success);
                }

                .sp-badge-pending {
                    background: var(--status-warning-bg);
                    color: var(--status-warning);
                }

                .sp-badge-inactive {
                    background: var(--status-danger-bg);
                    color: var(--status-danger);
                }

                /* Ledger card layout */
                .sp-ledger-list {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }

                .sp-ledger-item {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 14px 16px;
                    background: var(--firstloop-bg-primary);
                    border-radius: 12px;
                    border: 1px solid rgba(14, 136, 184, 0.05);
                }

                .sp-ledger-left {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                .sp-ledger-type {
                    font-size: 0.82rem;
                    font-weight: 600;
                    color: var(--dark-blue);
                }

                .sp-ledger-desc {
                    font-size: 0.75rem;
                    color: var(--text-secondary);
                }

                .sp-ledger-meta {
                    text-align: right;
                }

                .sp-ledger-points {
                    font-size: 0.95rem;
                    font-weight: 700;
                }

                .sp-ledger-date {
                    font-size: 0.7rem;
                    color: var(--text-muted);
                }

                /* Target Tier milestone */
                .sp-tier-progress-card {
                    background: linear-gradient(135deg, rgba(14, 136, 184, 0.05) 0%, rgba(0, 166, 214, 0.02) 100%);
                    border: 1px dashed rgba(14, 136, 184, 0.25);
                    border-radius: 16px;
                    padding: 20px;
                    margin-bottom: 24px;
                }

                .sp-progress-header {
                    display: flex;
                    justify-content: space-between;
                    font-size: 0.8rem;
                    font-weight: 600;
                    margin-bottom: 10px;
                }

                .sp-progress-track {
                    height: 8px;
                    background: rgba(14, 136, 184, 0.1);
                    border-radius: 10px;
                    overflow: hidden;
                    margin-bottom: 12px;
                }

                .sp-progress-bar {
                    height: 100%;
                    background: var(--firstloop-gradient-primary);
                    border-radius: 10px;
                }

                .sp-tier-footer-text {
                    font-size: 0.75rem;
                    color: var(--text-secondary);
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }

                @media (max-width: 1024px) {
                    .sp-main-grid {
                        grid-template-columns: 1fr;
                    }
                    .sp-kpi-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }
                }

                @media (max-width: 768px) {
                    .sp-kpi-grid {
                        grid-template-columns: 1fr;
                    }
                    .sp-portal-header {
                        padding: 0 20px;
                    }
                    .sp-dash-body {
                        padding: 20px;
                    }
                    .sp-welcome-banner {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 16px;
                        padding: 24px;
                    }
                    .sp-banner-info-badge {
                        text-align: left;
                    }
                }
            `}</style>

            <div className="sp-dash-container">
                <SalePersonHeader />

                <div className="sp-dash-body">
                    {/* Welcome banner */}
                    <div className="sp-welcome-banner">
                        <div className="sp-banner-deco" />
                        <div>
                            <h1 className="sp-welcome-title">Welcome back, {salesPerson.name}!</h1>
                            <p className="sp-welcome-subtitle">Here is the update on your merchant acquisitions and referral statistics.</p>
                        </div>
                        <div className="sp-banner-info-badge">
                            <div>Member Since</div>
                            <strong>
                                {salesPerson.createdAt
                                    ? new Date(salesPerson.createdAt).toLocaleDateString("en-IN", {
                                          day: "numeric",
                                          month: "short",
                                          year: "numeric",
                                      })
                                    : ""}
                            </strong>
                        </div>
                    </div>

                    {/* KPI metrics row */}
                    <div className="sp-kpi-grid">
                        <div className="sp-kpi-card">
                            <div>
                                <div className="sp-kpi-label">Merchants Referred</div>
                                <div className="sp-kpi-value">{merchant_list.length}</div>
                            </div>
                            <div className="sp-kpi-icon-wrapper" style={{ background: 'rgba(14, 136, 184, 0.1)', color: 'var(--firstloop-primary)' }}>
                                <i className="fas fa-store" />
                            </div>
                        </div>

                        <div className="sp-kpi-card">
                            <div>
                                <div className="sp-kpi-label">Your Referral Code</div>
                                <div className="sp-code-area">
                                    <span className="sp-code-text">{salesPerson.code}</span>
                                    <button className="sp-code-copy-btn" onClick={copyToClipboard} title="Copy Referral Code">
                                        <i className={`fas ${copied ? 'fa-check' : 'fa-copy'}`} style={{ color: copied ? '#16a34a' : 'inherit' }} />
                                    </button>
                                </div>
                            </div>
                            <div className="sp-kpi-icon-wrapper" style={{ background: 'rgba(0, 166, 214, 0.1)', color: 'var(--firstloop-primary)' }}>
                                <i className="fas fa-barcode" />
                            </div>
                        </div>

                        <div className="sp-kpi-card">
                            <div>
                                <div className="sp-kpi-label">Points Balance</div>
                                <div className="sp-kpi-value" style={{ color: 'var(--firstloop-primary)' }}>
                                    {(salesPerson.points || 0).toLocaleString()}
                                </div>
                            </div>
                            <div className="sp-kpi-icon-wrapper" style={{ background: 'rgba(76, 199, 232, 0.15)', color: 'var(--firstloop-primary)' }}>
                                <i className="fas fa-award" />
                            </div>
                        </div>
                    </div>

                    {/* Main contents grids */}
                    <div className="sp-main-grid">
                        {/* Left column: registered merchants */}
                        <div className="sp-card-panel">
                            <div className="sp-panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                                <h2 className="sp-panel-title" style={{ margin: 0 }}>
                                    <i className="fas fa-clipboard-list" />
                                    <span>Registered Campaign Merchants</span>
                                </h2>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                                    <div className="search-wrapper" style={{ marginBottom: 0, maxWidth: 280, minWidth: 200 }}>
                                        <i className="fas fa-search search-icon" />
                                        <input
                                            type="text"
                                            className="search-input"
                                            placeholder="Search name, business, email..."
                                            value={search}
                                            onChange={(e) => {
                                                setSearch(e.target.value);
                                                setCurrentPage(1);
                                            }}
                                        />
                                    </div>
                                    <button className="btn firstloop-btn-primary" onClick={() => navigate('/saleperson-add-merchant')} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                                        <i className="fas fa-plus" style={{ marginRight: 6 }} /> Add Merchant
                                    </button>
                                </div>
                            </div>

                            <div style={{ overflowX: 'auto' }}>
                                <table className="sp-custom-table">
                                    <thead>
                                        <tr>
                                            <th>Merchant Profile</th>
                                            <th>Referral Code</th>
                                            <th>Contact Details</th>
                                            <th>Acquisition Date</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(Array.isArray(paginatedMerchants) ? paginatedMerchants : []).map((row) => (
                                            <tr key={row.id}>
                                                <td>
                                                    <div className="sp-merchant-profile">
                                                        <div className="sp-merchant-avatar">
                                                            {row.bus_name ? row.bus_name.charAt(0).toUpperCase() : 'M'}
                                                        </div>
                                                        <div>
                                                            <div className="sp-merchant-name">{row.bus_name}</div>
                                                            <div className="sp-merchant-owner">Owner: {row.name}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <strong>{salesPerson.code}</strong>
                                                </td>
                                                <td>
                                                    <div style={{ fontSize: '0.85rem' }}>{row.email}</div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                        {row.country_code} {row.phone}
                                                    </div>
                                                </td>
                                                <td>
                                                    {row.createdAt}
                                                </td>
                                                <td>
                                                    <span className={`sp-badge-status ${
                                                        row.status === 1 ? 'sp-badge-active' : 'sp-badge-inactive'
                                                    }`}>
                                                        {row.status === 1 ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                               
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {filteredMerchants.length > MERCHANTS_PER_PAGE && (
                                <div className="pagination-container" style={{ marginTop: 16, padding: '0 16px 16px' }}>
                                    <span className="pagination-text">
                                        Showing {startCount}-{endCount} of {filteredMerchants.length} merchants
                                    </span>

                                    <div className="pagination-controls">
                                        <button
                                            type="button"
                                            className={`btn-page ${safePage === 1 ? 'disabled' : ''}`}
                                            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                                            disabled={safePage === 1}
                                        >
                                            <i className="fas fa-chevron-left" />
                                        </button>

                                        {pageNumbers.map((page) => (
                                            <button
                                                type="button"
                                                key={page}
                                                className={`btn-page ${page === safePage ? 'active' : ''}`}
                                                onClick={() => setCurrentPage(page)}
                                            >
                                                {page}
                                            </button>
                                        ))}

                                        <button
                                            type="button"
                                            className={`btn-page ${safePage === totalPages ? 'disabled' : ''}`}
                                            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                                            disabled={safePage === totalPages}
                                        >
                                            <i className="fas fa-chevron-right" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>


                    </div>
                </div>
                
            <footer style={{
                textAlign: 'center',
                padding: '24px 0 40px',
                fontSize: '0.78rem',
                color: 'var(--text-muted)',
                borderTop: '1px solid rgba(14, 136, 184, 0.08)',
                marginTop: '40px'
            }}>
                <span>&copy; 2026 Minsway Solutions Pvt Ltd. All rights reserved.</span>
            </footer>                                       
            </div>
        </>
    );
    
}
