import { useState, useEffect, useMemo } from 'react';
import { useParams, NavLink, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import API from '../../api.js';

export default function SalePersonMerchants() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [salesPerson, setSalesPerson] = useState(null);
    const [merchants, setMerchants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        if (id) {
            fetchData();
        }
    }, [id]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch Sales Person Details
            const spResponse = await API.post('admin/saleperson/details', { id });
            if (spResponse.data.status === 1) {
                const spData = Array.isArray(spResponse.data.data) ? spResponse.data.data[0] : spResponse.data.data;
                if (spData) {
                    setSalesPerson(spData);
                } else {
                    toast.error("Sales person details not found");
                }
            } else {
                toast.error(spResponse.data.message || "Sales person details not found");
            }

            // Fetch Referred Merchants
            const merchantsResponse = await API.post('admin/saleperson/referred-merchants', { id });
            if (merchantsResponse.data.status === 1) {
                const list = Array.isArray(merchantsResponse.data.data)
                    ? merchantsResponse.data.data
                    : (merchantsResponse.data.data?.merchants || merchantsResponse.data.data?.list || []);
                setMerchants(list);
            } else {
                setMerchants([]);
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to load referred merchants data");
        } finally {
            setLoading(false);
        }
    };

    // Client-side filtering
    const filteredMerchants = useMemo(() => {
        const searchValue = search.toLowerCase();
        return merchants.filter((m) => {
            const busName = m.bus_name || '';
            const name = m.name || '';
            const email = m.email || '';
            const phone = m.phone || '';
            return (
                busName.toLowerCase().includes(searchValue) ||
                name.toLowerCase().includes(searchValue) ||
                email.toLowerCase().includes(searchValue) ||
                phone.toLowerCase().includes(searchValue)
            );
        });
    }, [merchants, search]);

    // Pagination
    const ITEMS_PER_PAGE = 10;
    const totalPages = Math.max(1, Math.ceil(filteredMerchants.length / ITEMS_PER_PAGE));
    const safePage = Math.min(currentPage, totalPages);
    const startIndex = (safePage - 1) * ITEMS_PER_PAGE;
    const paginatedMerchants = filteredMerchants.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    const startCount = filteredMerchants.length === 0 ? 0 : startIndex + 1;
    const endCount = Math.min(startIndex + ITEMS_PER_PAGE, filteredMerchants.length);

    const pageNumbers = [];
    for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
    }

    const totalEarnings = merchants.length * 4.0;

    return (
        <>
            <style>{`
                .sp-merch-container {
                    padding: 4px;
                    font-family: var(--font-primary);
                }

                .sp-merch-kpi-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 24px;
                    margin-bottom: 32px;
                }

                .sp-merch-kpi-card {
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

                .sp-merch-kpi-card:hover {
                    transform: translateY(-4px);
                    box-shadow: var(--shadow-md);
                }

                .sp-merch-kpi-label {
                    font-size: 0.8rem;
                    color: var(--text-secondary);
                    font-weight: 500;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    margin-bottom: 6px;
                }

                .sp-merch-kpi-value {
                    font-size: 1.8rem;
                    font-weight: 700;
                    color: var(--dark-blue);
                }

                .sp-merch-icon-wrapper {
                    width: 52px;
                    height: 52px;
                    border-radius: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.4rem;
                }

                .badge-commission {
                    background-color: rgba(22, 163, 74, 0.1);
                    color: #16a34a;
                    font-weight: 700;
                    padding: 6px 12px;
                    border-radius: 20px;
                    font-size: 0.85rem;
                    display: inline-block;
                }

                .sp-info-text {
                    font-size: 0.88rem;
                    margin-top: 4px;
                    color: var(--text-secondary);
                }

                .sp-info-text strong {
                    color: var(--dark-blue);
                }

                @media (max-width: 1024px) {
                    .sp-merch-kpi-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }
                }

                @media (max-width: 768px) {
                    .sp-merch-kpi-grid {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>

            <div className="sp-merch-container">
                {/* Breadcrumbs */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500, marginBottom: 16 }}>
                    <NavLink to="/dashboard" style={{ color: 'var(--primary)' }}>
                        Home
                    </NavLink>
                    <i className="fas fa-chevron-right" style={{ fontSize: '0.7rem' }} />
                    <NavLink to="/salepersons" style={{ color: 'var(--primary)' }}>
                        Sales Persons
                    </NavLink>
                    <i className="fas fa-chevron-right" style={{ fontSize: '0.7rem' }} />
                    <span>Referred Merchants</span>
                </div>

                <div className="flex-between" style={{ marginBottom: 24, gap: 20, flexWrap: 'wrap' }}>
                    <div>
                        <h2 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--dark-blue)', margin: 0 }}>
                            Referred Merchants
                        </h2>
                        {salesPerson && (
                            <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                Showing merchant acquisitions by sales representative <strong>{salesPerson.name}</strong>
                            </p>
                        )}
                    </div>
                    <button className="btn btn-outline" onClick={() => navigate('/salepersons')} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                        <i className="fas fa-arrow-left" style={{ marginRight: 6 }} /> Back to list
                    </button>
                </div>

                {/* KPI Grid */}
                <div className="sp-merch-kpi-grid">
                    <div className="sp-merch-kpi-card">
                        <div>
                            <div className="sp-merch-kpi-label">Sales Representative</div>
                            <div className="sp-merch-kpi-value" style={{ fontSize: '1.4rem' }}>
                                {salesPerson ? salesPerson.name : 'Loading...'}
                            </div>
                            {salesPerson && (
                                <div className="sp-info-text">
                                    Referral Code: <strong>{salesPerson.code}</strong>
                                </div>
                            )}
                        </div>
                        <div className="sp-merch-icon-wrapper" style={{ background: 'rgba(14, 136, 184, 0.1)', color: 'var(--primary)' }}>
                            <i className="fas fa-user-tie" />
                        </div>
                    </div>

                    <div className="sp-merch-kpi-card">
                        <div>
                            <div className="sp-merch-kpi-label">Total Referrals</div>
                            <div className="sp-merch-kpi-value">
                                {loading ? '...' : merchants.length}
                            </div>
                            <div className="sp-info-text">
                                Registered campaigns
                            </div>
                        </div>
                        <div className="sp-merch-icon-wrapper" style={{ background: 'rgba(0, 166, 214, 0.1)', color: 'var(--secondary)' }}>
                            <i className="fas fa-store" />
                        </div>
                    </div>

                    <div className="sp-merch-kpi-card">
                        <div>
                            <div className="sp-merch-kpi-label">Total Earnings</div>
                            <div className="sp-merch-kpi-value" style={{ color: '#16a34a' }}>
                                ${totalEarnings.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </div>
                            <div className="sp-info-text">
                                Calculated at <strong>$4.00</strong> per signup
                            </div>
                        </div>
                        <div className="sp-merch-icon-wrapper" style={{ background: 'rgba(22, 163, 74, 0.1)', color: '#16a34a' }}>
                            <i className="fas fa-dollar-sign" />
                        </div>
                    </div>
                </div>

                {/* Main Filter & Table area */}
                <div className="card-panel" style={{ padding: 24, background: 'white', borderRadius: 'var(--border-radius-lg)', border: 'var(--border-light)', boxShadow: 'var(--shadow-sm)' }}>
                    <div className="flex-between" style={{ marginBottom: 20, gap: 16, flexWrap: 'wrap' }}>
                        <div className="search-wrapper" style={{ marginBottom: 0, maxWidth: 360, flex: 1, minWidth: 200 }}>
                            <i className="fas fa-search search-icon" />
                            <input
                                type="text"
                                className="search-input"
                                placeholder="Search business, owner name or email..."
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setCurrentPage(1);
                                }}
                            />
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            Showing <strong>{filteredMerchants.length}</strong> referred merchant{filteredMerchants.length !== 1 ? 's' : ''}
                        </div>
                    </div>

                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Merchant Profile</th>
                                    <th>Referral Code</th>
                                    <th>Contact Details</th>
                                    <th>Acquisition Date</th>
                                    <th>Commission</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    Array.from({ length: 3 }).map((_, index) => (
                                        <tr className="skeleton-row" key={`skeleton-${index}`}>
                                            <td>
                                                <div className="table-cell-profile">
                                                    <div className="cell-avatar skeleton-avatar" />
                                                    <div className="cell-info">
                                                        <span className="skeleton-text" style={{ width: '120px' }} />
                                                    </div>
                                                </div>
                                            </td>
                                            <td><span className="skeleton-text" style={{ width: '70px' }} /></td>
                                            <td><span className="skeleton-text" style={{ width: '150px' }} /></td>
                                            <td><span className="skeleton-text" style={{ width: '100px' }} /></td>
                                            <td><span className="skeleton-text" style={{ width: '60px' }} /></td>
                                            <td><span className="skeleton-text" style={{ width: '80px' }} /></td>
                                        </tr>
                                    ))
                                ) : paginatedMerchants.length > 0 ? (
                                    paginatedMerchants.map((row) => (
                                        <tr key={row.id}>
                                            <td>
                                                <div className="table-cell-profile">
                                                    <div className="cell-avatar" style={{ background: 'rgba(14, 136, 184, 0.1)', color: 'var(--primary)', fontWeight: 'bold' }}>
                                                        {row.bus_name ? row.bus_name.charAt(0).toUpperCase() : 'M'}
                                                    </div>
                                                    <div className="cell-info">
                                                        <span className="cell-name" style={{ fontWeight: 600 }}>{row.bus_name}</span>
                                                        <span className="cell-subtext">Owner: {row.name}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <strong>{salesPerson ? salesPerson.code : '-'}</strong>
                                            </td>
                                            <td>
                                                <div style={{ fontSize: '0.85rem' }}>{row.email}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                    {row.country_code} {row.phone}
                                                </div>
                                            </td>
                                            <td>
                                                {row.createdAt || '-'}
                                            </td>
                                            <td>
                                                <span className="badge-commission">$4.00</span>
                                            </td>
                                            <td>
                                                <span className={`badge ${
                                                    row.status === 1 ? 'active' : 'inactive'
                                                }`}>
                                                    {row.status === 1 ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
                                            No referred merchants found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {!loading && filteredMerchants.length > ITEMS_PER_PAGE && (
                        <div className="pagination-container" style={{ marginTop: 16 }}>
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
        </>
    );
}
