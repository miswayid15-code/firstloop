import { useNavigate, useParams, NavLink } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import API from '../api.js'

export default function ViewDeletedMerchant() {
    const navigate = useNavigate()
    const { id } = useParams()
    const [loading, setLoading] = useState(true)
    const [merchantData, setMerchantData] = useState(null)
    const [branchesData, setBranchesData] = useState([])
    const [receptionists, setReceptionists] = useState([])

    useEffect(() => {
        fetchDeletedMerchantDetails()
    }, [id])

    const fetchDeletedMerchantDetails = async () => {
        try {
            setLoading(true)
            const response = await API.post('admin/delete-merchant-fetch-id', { id: id })
            const data = response.data || {}
            
            if (data.status === 1 || data.success === true) {
                const merchant = data.data || {}
                setMerchantData(merchant)
                setBranchesData(merchant.Branches || [])
                setReceptionists(merchant.Receptionists || [])
            } else {
                toast.error(data.message || 'Failed to load deleted merchant details')
            }
        } catch (error) {
            console.error('Error fetching deleted merchant:', error)
            toast.error('Failed to load deleted merchant details')
        } finally {
            setLoading(false)
        }
    }

    const formatDisplayDate = (dateStr) => {
        if (!dateStr) return '-'
        const d = new Date(dateStr)
        if (isNaN(d.getTime())) return dateStr
        return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    }

    const getCouponTypeName = (type) => {
        const t = Number(type)
        if (t === 1) return 'Discount Percentage'
        if (t === 2) return 'Fixed Amount Discount'
        if (t === 3) return 'Buy One Get One'
        return 'Unknown'
    }

    return (
        <>
            <div style={{ marginBottom: 24 }}>
                <div className="flex-between" style={{ gap: 20, flexWrap: 'wrap' }}>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            fontSize: '0.8rem',
                            color: 'var(--text-muted)',
                            fontWeight: 500
                        }}
                    >
                        <NavLink to="/deleted-merchants" style={{ color: 'var(--primary)' }}>
                            Deleted Merchants
                        </NavLink>
                        <i className="fas fa-chevron-right" style={{ fontSize: '0.7rem' }} />
                        <span>Deleted Merchant Details</span>
                    </div>

                    <div className="flex-between" style={{ gap: 20, flexWrap: 'wrap' }}>
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => navigate('/deleted-merchants')}
                        >
                            <i className="fas fa-arrow-left" /> Back to Deleted Merchants
                        </button>
                    </div>
                </div>
            </div>

            <div className="card card-glass merchant-profile-card" style={{ position: 'relative', marginBottom: 24 }}>
                {loading ? (
                    <div className="merchant-profile-info">
                        <div className="cell-avatar merchant-avatar skeleton-avatar" />
                        <div className="cell-info" style={{ width: '100%' }}>
                            <div className="merchant-title-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                                <span className="skeleton-text" style={{ width: '220px', height: '28px', display: 'inline-block' }} />
                                <span className="skeleton-text" style={{ width: '90px', height: '24px', display: 'inline-block' }} />
                            </div>
                            <span className="skeleton-text" style={{ width: '55%', height: '16px', marginTop: 8, display: 'inline-block' }} />
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: '14px', marginTop: '18px' }}>
                                {Array.from({ length: 8 }).map((_, index) => (
                                    <div key={`profile-skel-${index}`}>
                                        <span className="skeleton-text" style={{ width: '90%', height: '16px', display: 'inline-block', marginBottom: 10 }} />
                                        <span className="skeleton-text" style={{ width: index % 2 === 0 ? '60%' : '80%', height: '14px', display: 'inline-block' }} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="merchant-profile-info">
                            <div className="cell-avatar merchant-avatar">
                                {merchantData?.name?.charAt(0) || 'M'}
                            </div>

                            <div className="cell-info" style={{ flex: 1 }}>
                                <div className="merchant-title-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                                    <h2>{merchantData?.name}</h2>
                                    <span className="badge pending">Deleted</span>
                                </div>

                                <p className="merchant-subtext" style={{ marginTop: 8, maxWidth: 540 }}>
                                    {merchantData?.bus_name} • {merchantData?.email} • {merchantData?.city || '-'}, {merchantData?.state || '-'}
                                </p>

                                <div className="merchant-details-grid">
                                    <div>
                                        <small className="merchant-sub-label">Business Name</small>
                                        <p className="merchant-subtext">{merchantData?.bus_name || '-'}</p>
                                    </div>

                                    <div>
                                        <small className="merchant-sub-label">Service Provided Name</small>
                                        <p className="merchant-subtext">{merchantData?.bus_cat || '-'}</p>
                                    </div>

                                    <div>
                                        <small className="merchant-sub-label">Category</small>
                                        <p className="merchant-subtext">
                                            {merchantData?.Category?.name || merchantData?.category?.name || '-'}
                                        </p>
                                    </div>

                                    <div>
                                        <small className="merchant-sub-label">Contact Email</small>
                                        <p className="merchant-subtext">{merchantData?.email || '-'}</p>
                                    </div>

                                    <div>
                                        <small className="merchant-sub-label">Contact Phone</small>
                                        <p className="merchant-subtext">
                                            {merchantData?.country_code || ''} {merchantData?.phone || '-'}
                                        </p>
                                    </div>

                                    <div>
                                        <small className="merchant-sub-label">Complete Address</small>
                                        <p className="merchant-subtext">{merchantData?.address || '-'}</p>
                                    </div>

                                    <div>
                                        <small className="merchant-sub-label">Zip Code</small>
                                        <p className="merchant-subtext">{merchantData?.zipcode || '-'}</p>
                                    </div>

                                    <div>
                                        <small className="merchant-sub-label">Created Date</small>
                                        <p className="merchant-subtext">{formatDisplayDate(merchantData?.createdAt)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="merchant-profile-stats">
                            <div className="merchant-stat-item">
                                <span className="merchant-stat-val val-primary">
                                    {merchantData?.total_branch || branchesData.length || 0}
                                </span>
                                <span className="merchant-stat-lbl">Total Branches</span>
                            </div>

                            <div className="merchant-stat-item">
                                <span className="merchant-stat-val">
                                    {merchantData?.total_receptionists || receptionists.length || 0}
                                </span>
                                <span className="merchant-stat-lbl">Receptionists</span>
                            </div>

                            <div className="merchant-stat-item">
                                <span className="merchant-stat-val">
                                    {merchantData?.total_coupon_count || 0}
                                </span>
                                <span className="merchant-stat-lbl">Active Coupons</span>
                            </div>

                            <div className="merchant-stat-item">
                                <span className="merchant-stat-val">
                                    {merchantData?.total_redeem_coupon || 0}
                                </span>
                                <span className="merchant-stat-lbl">Coupons Redeemed</span>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Document / KYC Section (Read Only) */}
            {!loading && merchantData?.document && (
                <div className="card card-glass" style={{ marginBottom: 24 }}>
                    <h3 className="card-title" style={{ fontSize: '1.1rem', marginBottom: 12 }}>KYC Document</h3>
                    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: 280 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div>
                                    <small className="merchant-sub-label">Document Verification</small>
                                    <p style={{ marginTop: 4 }}>
                                        <span className={`badge ${merchantData?.doc_verify === 1 ? 'active' : 'pending'}`}>
                                            {merchantData?.doc_verify === 1 ? 'Verified' : 'Not Verified'}
                                        </span>
                                    </p>
                                </div>
                                <div>
                                    <small className="merchant-sub-label">Tax / GST Number</small>
                                    <p className="merchant-subtext" style={{ marginTop: 4 }}>
                                        {merchantData?.gst_no || '-'}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="kyc-doc-preview-area">
                            <a
                                href={merchantData.document}
                                target="_blank"
                                rel="noreferrer"
                                className="btn btn-secondary btn-sm"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                            >
                                <i className="fas fa-external-link-alt" /> View KYC Document
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {/* Branches Section (Read Only) */}
            <div style={{ marginBottom: 20, marginTop: 28 }}>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', fontWeight: 600 }}>
                    Branch Outlets
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    Physical retail locations associated with this merchant account.
                </p>
            </div>

            <div className="table-wrapper" style={{ marginBottom: 24 }}>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Branch Name</th>
                            <th>Store Address</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            Array.from({ length: 3 }).map((_, index) => (
                                <tr className="skeleton-row" key={`branch-skel-${index}`}>
                                    <td><span className="skeleton-text" style={{ width: '120px', display: 'inline-block' }} /></td>
                                    <td><span className="skeleton-text" style={{ width: '240px', display: 'inline-block' }} /></td>
                                    <td><span className="skeleton-text" style={{ width: '75px', display: 'inline-block' }} /></td>
                                </tr>
                            ))
                        ) : branchesData.length > 0 ? (
                            branchesData.map((branch) => (
                                <tr key={branch.id}>
                                    <td>
                                        <div className="table-cell-profile">
                                            <div className="cell-avatar">
                                                {branch.name?.charAt(0) || 'B'}
                                            </div>
                                            <div className="cell-info">
                                                <span className="cell-name">{branch.name}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>{branch.address || '-'}</td>
                                    <td>
                                        <span className={`badge ${branch.status == 1 ? 'active' : 'pending'}`}>
                                            {branch.status == 1 ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="3" style={{ textAlign: 'center', padding: '20px 16px' }}>
                                    No branches found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Receptionists Section (Read Only) */}
            <div style={{ marginBottom: 20, marginTop: 28 }}>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', fontWeight: 600 }}>
                    Receptionists
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    Receptionists assigned to the retail branches.
                </p>
            </div>

            <div className="table-wrapper" style={{ marginBottom: 24 }}>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Receptionist Name</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            Array.from({ length: 3 }).map((_, index) => (
                                <tr className="skeleton-row" key={`rep-skel-${index}`}>
                                    <td><span className="skeleton-text" style={{ width: '120px', display: 'inline-block' }} /></td>
                                    <td><span className="skeleton-text" style={{ width: '140px', display: 'inline-block' }} /></td>
                                    <td><span className="skeleton-text" style={{ width: '90px', display: 'inline-block' }} /></td>
                                    <td><span className="skeleton-text" style={{ width: '70px', display: 'inline-block' }} /></td>
                                </tr>
                            ))
                        ) : receptionists.length > 0 ? (
                            receptionists.map((receptionist) => (
                                <tr key={receptionist.id}>
                                    <td>
                                        <div className="table-cell-profile">
                                            <div className="cell-avatar">
                                                {receptionist.name?.charAt(0) || 'R'}
                                            </div>
                                            <div className="cell-info">
                                                <span className="cell-name">{receptionist.name}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>{receptionist.email || '-'}</td>
                                    <td>{receptionist.country_code} {receptionist.phone}</td>
                                    <td>
                                        <span className={`badge ${receptionist.status == 1 ? 'active' : 'pending'}`}>
                                            {receptionist.status == 1 ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="4" style={{ textAlign: 'center', padding: '20px 16px' }}>
                                    No receptionists found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </>
    )
}
