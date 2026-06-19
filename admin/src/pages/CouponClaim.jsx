import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import API from '../api.js'
import AppToaster from '../components/AppToaster.jsx'
import DecisionDialog from '../components/DecisionDialog.jsx'

const isSuccessResponse = (data) => {
    return data?.status === 1 || data?.status === '1' || data?.success === true || data?.success === 'true'
}

const getCouponClaimStatus = (claim) => {
    const status = claim?.status
    if (status === 1 || status === '1') return { label: 'Approved', badge: 'active', filter: 'approved' }
    if (status === 2 || status === '2') return { label: 'Cancelled', badge: 'pending', filter: 'cancelled' }
    if (claim?.cancel_by || claim?.cancel_reason) return { label: 'Cancelled', badge: 'pending', filter: 'cancelled' }
    if (claim?.approved_by || claim?.approved_by_id || claim?.used_at) return { label: 'Approved', badge: 'active', filter: 'approved' }
    return { label: 'Pending', badge: 'pending', filter: 'pending' }
}

const getCustomerInitials = (name) => {
    if (!name) return 'NA'
    const parts = name.trim().split(' ')
    return parts.length === 1
        ? parts[0].slice(0, 2).toUpperCase()
        : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const formatDate = (value) => {
    if (!value) return '-'

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
        return value
    }

    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    })
}

const mapCouponClaim = (claim) => {
    const customerName = claim?.Customer?.name || ''
    const phone = claim?.Customer
        ? `${claim.Customer.country_code || ''}${claim.Customer.phone || ''}`
        : ''
    const statusInfo = getCouponClaimStatus(claim)

    return {
        id: claim.id,
        customer: customerName || 'Unknown Customer',
        phone,
        initials: getCustomerInitials(customerName),
        couponCode: claim.coupon_code || '-',
        couponId: claim.coupon_id,
        percentage: claim.percentage,
        branch: claim.Branch?.name || '-',
        branchId: claim.branch_id || claim.Branch?.id,
        merchant: claim.Branch?.Merchant?.name || '-',
        merchantId: claim.Branch?.Merchant?.id,
        customerId: claim.cus_id || claim.Customer?.id,
        usedAt: claim.used_at,
        status: statusInfo.label,
        statusFilter: statusInfo.filter,
        badge: statusInfo.badge,
        cancel_by: claim.cancel_by,
        cancel_reason: claim.cancel_reason,
        approved_by: claim.approved_by,
        approved_by_id: claim.approved_by_id,
        raw: claim
    }
}

export default function CouponClaim() {
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [showClaimView, setShowClaimView] = useState(false)
    const [selectedClaim, setSelectedClaim] = useState(null)
    const [isClaimDialogOpen, setIsClaimDialogOpen] = useState(false)
    const [isClaimSaving, setIsClaimSaving] = useState(false)
    const [couponClaims, setCouponClaims] = useState([])
    const [loading, setLoading] = useState(true)
    const [claimPage, setClaimPage] = useState(1)

    const fetchCouponClaims = async () => {
        try {
            setLoading(true)
            const response = await API.post('admin/coupon-claim/list')
            const data = response.data || {}
            console.log("Coupon claim lis", data);

            if (isSuccessResponse(data)) {
                const items =
                    data?.data?.rows ||
                    data?.data ||
                    [];

                setCouponClaims(items.map(mapCouponClaim));
            }
            else {
                setCouponClaims([])
                toast.error(data.message || 'Failed to load coupon claims')
            }
        } catch (error) {
            setCouponClaims([])
            toast.error(
                error?.response?.data?.message ||
                'Failed to load coupon claims'
            )
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchCouponClaims()
    }, [])

    const filteredCouponClaims = useMemo(
        () =>
            couponClaims.filter((row) => {
                const searchValue = search.trim().toLowerCase()
                const matchesSearch =
                    !searchValue ||
                    [row.customer, row.phone, row.couponCode, row.branch, row.merchant]
                        .filter(Boolean)
                        .some((value) => String(value).toLowerCase().includes(searchValue))

                const matchesStatus =
                    statusFilter === 'all' ||
                    row.statusFilter === statusFilter

                return matchesSearch && matchesStatus
            }),
        [couponClaims, search, statusFilter]
    )

    const openViewModal = (claim) => {
        setSelectedClaim(claim)
        setShowClaimView(true)
    }

    const openClaimDialog = (claim) => {
        setSelectedClaim(claim)
        setShowClaimView(false)
        setIsClaimDialogOpen(true)
    }

    const closeClaimDialog = () => {
        setIsClaimDialogOpen(false)
        setSelectedClaim(null)
    }

    const handleClaimDecision = async ({ decision, reason }) => {
        if (!selectedClaim) return

        try {
            setIsClaimSaving(true)

            const response = await API.post('admin/branch/claim-coupon', {
                coupon_id: selectedClaim.id,
                status: decision === 'accept' ? 1 : 2,
                cancel_reason: reason
            })

            const data = response.data || {}

            if (isSuccessResponse(data)) {
                toast.success(data.message || 'Coupon claim updated successfully')
                await fetchCouponClaims()
                closeClaimDialog()
            }
            else {
                toast.error(data.message || 'Failed to update coupon claim')
            }
        } catch (error) {
            toast.error(
                error?.response?.data?.message ||
                'Failed to update coupon claim'
            )
        } finally {
            setIsClaimSaving(false)
        }
    }

    const statusCounts = useMemo(() => ({
        pending: couponClaims.filter((row) => row.statusFilter === 'pending').length,
        approved: couponClaims.filter((row) => row.statusFilter === 'approved').length,
        cancelled: couponClaims.filter((row) => row.statusFilter === 'cancelled').length
    }), [couponClaims])

    const CLAIMS_PER_PAGE = 10

    const totalClaimPages = Math.max(
        1,
        Math.ceil(filteredCouponClaims.length / CLAIMS_PER_PAGE)
    )

    const safeClaimPage = Math.min(
        claimPage,
        totalClaimPages
    )

    const claimPageStartIndex =
        (safeClaimPage - 1) * CLAIMS_PER_PAGE

    const paginatedClaims =
        filteredCouponClaims.slice(
            claimPageStartIndex,
            claimPageStartIndex + CLAIMS_PER_PAGE
        )

    const claimStartCount = filteredCouponClaims.length
        ? claimPageStartIndex + 1
        : 0

    const claimEndCount = Math.min(
        claimPageStartIndex + CLAIMS_PER_PAGE,
        filteredCouponClaims.length
    )

    const claimPageNumbers = Array.from(
        { length: totalClaimPages },
        (_, index) => index + 1
    )

    useEffect(() => {
        setClaimPage(1)
    }, [search, statusFilter])

    useEffect(() => {
        if (claimPage > totalClaimPages) {
            setClaimPage(totalClaimPages)
        }
    }, [claimPage, totalClaimPages])

    return (
        <>
            <AppToaster />

            <div
                className="flex-between"
                style={{
                    marginBottom: 24,
                    gap: 20,
                    flexWrap: 'wrap'
                }}
            >
                <div
                    className="flex-row gap-md"
                    style={{
                        flex: 1,
                        flexWrap: 'nowrap'
                    }}
                >
                    <div
                        className="search-wrapper"
                        style={{
                            marginBottom: 0,
                            maxWidth: 360,
                            flex: 1,
                            minWidth: 200
                        }}
                    >
                        <i className="fas fa-search search-icon"></i>
                        <input
                            type="text"
                            className="search-input"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search customer, coupon, branch..."
                        />
                    </div>

                    <div
                        className="tab-filters"
                        style={{
                            marginBottom: 0,
                            padding: 4
                        }}
                    >
                        <button
                            className={`tab-btn ${statusFilter === 'all' ? 'active' : ''}`}
                            onClick={() => setStatusFilter('all')}
                        >
                            All
                            <span className="tab-badge">{couponClaims.length}</span>
                        </button>

                        <button
                            className={`tab-btn ${statusFilter === 'pending' ? 'active' : ''}`}
                            onClick={() => setStatusFilter('pending')}
                        >
                            Pending
                            <span className="tab-badge" style={{ background: '#fff4e5', color: '#ff9800' }}>
                                {statusCounts.pending}
                            </span>
                        </button>

                        <button
                            className={`tab-btn ${statusFilter === 'approved' ? 'active' : ''}`}
                            onClick={() => setStatusFilter('approved')}
                        >
                            Approved
                            <span className="tab-badge" style={{ background: '#e8f5e9', color: '#4caf50' }}>
                                {statusCounts.approved}
                            </span>
                        </button>

                        <button
                            className={`tab-btn ${statusFilter === 'cancelled' ? 'active' : ''}`}
                            onClick={() => setStatusFilter('cancelled')}
                        >
                            Cancelled
                            <span className="tab-badge" style={{ background: '#ffebee', color: '#f44336' }}>
                                {statusCounts.cancelled}
                            </span>
                        </button>
                    </div>
                </div>

                <div
                    style={{
                        fontSize: '0.82rem',
                        color: 'var(--text-secondary)',
                        fontWeight: 500
                    }}
                >
                    Coupon Claim Feed
                </div>
            </div>

            <div className="table-wrapper">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Customer Details</th>
                            <th>Coupon</th>
                            <th>Branch Outlet</th>
                            <th>Merchant</th>
                            <th>Status</th>
                            <th>Used At</th>
                            <th>Approved By</th>
                            <th>Cancelled By</th>
                            <th>Reason</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>

                    <tbody>
                        {loading ? (
                            Array.from({ length: 5 }).map((_, index) => (
                                <tr className="skeleton-row" key={`coupon-claim-skel-${index}`}>
                                    {Array.from({ length: 10 }).map((__, cellIndex) => (
                                        <td key={`coupon-claim-skel-cell-${cellIndex}`}>
                                            <span className="skeleton-text" style={{ width: '80%', display: 'inline-block' }} />
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : paginatedClaims.length > 0 ? (
                            paginatedClaims.map((row) => (
                                <tr key={row.id}>
                                    <td>
                                        <div className="table-cell-profile">
                                            <div className="cell-avatar">{row.initials}</div>
                                            <div className="cell-info">
                                                {row.customerId ? (
                                                    <Link to={`/customers?id=${row.customerId}`} style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
                                                        {row.customer}
                                                    </Link>
                                                ) : (
                                                    <span className="cell-name">{row.customer}</span>
                                                )}
                                                <span className="cell-subtext">{row.phone || '-'}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <strong>{row.couponCode}</strong>
                                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 2 }}>
                                            {row.percentage != null ? `${row.percentage}% off` : `Coupon #${row.couponId || '-'}`}
                                        </div>
                                    </td>
                                    <td>
                                        {row.branchId ? (
                                            <Link to={`/view-branch/${row.branchId}`} style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
                                                {row.branch}
                                            </Link>
                                        ) : (
                                            row.branch
                                        )}
                                    </td>
                                    <td>
                                        {row.merchantId ? (
                                            <Link to={`/view-merchant/${row.merchantId}`} style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
                                                {row.merchant}
                                            </Link>
                                        ) : (
                                            row.merchant
                                        )}
                                    </td>
                                    <td>
                                        <span className={`badge ${row.badge}`}>
                                            {row.status}
                                        </span>
                                    </td>
                                    <td>{formatDate(row.usedAt)}</td>
                                    <td>{row.approved_by || '-'}</td>
                                    <td>{row.cancel_by || '-'}</td>
                                    <td>
                                        <span style={{ display: 'block', maxWidth: 200, whiteSpace: 'normal', wordBreak: 'break-word' }}>
                                            {row.cancel_reason || '-'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="action-group" style={{ justifyContent: 'flex-end', gap: 6 }}>
                                            <button
                                                className="btn-icon view"
                                                title="View Coupon Claim"
                                                onClick={() => openViewModal(row)}
                                            >
                                                <i className="fas fa-eye"></i>
                                            </button>

                                            <button
                                                className="btn-icon edit"
                                                title="Review Coupon Claim"
                                                onClick={() => openClaimDialog(row)}
                                            >
                                                <i className="fas fa-edit"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={10} style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)' }}>
                                    No coupon claims found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {!loading && filteredCouponClaims.length > CLAIMS_PER_PAGE && (
                <div className="pagination-container">
                    <span className="pagination-text">
                        Showing {claimStartCount}-{claimEndCount} of {filteredCouponClaims.length} coupon claims
                    </span>

                    <div className="pagination-controls">
                        <button
                            type="button"
                            className={`btn-page ${safeClaimPage === 1 ? 'disabled' : ''}`}
                            onClick={() => setClaimPage((page) => Math.max(1, page - 1))}
                            disabled={safeClaimPage === 1}
                        >
                            <i className="fas fa-chevron-left"></i>
                        </button>

                        {claimPageNumbers.map((page) => (
                            <button
                                type="button"
                                key={page}
                                className={`btn-page ${page === safeClaimPage ? 'active' : ''}`}
                                onClick={() => setClaimPage(page)}
                            >
                                {page}
                            </button>
                        ))}

                        <button
                            type="button"
                            className={`btn-page ${safeClaimPage === totalClaimPages ? 'disabled' : ''}`}
                            onClick={() => setClaimPage((page) => Math.min(totalClaimPages, page + 1))}
                            disabled={safeClaimPage === totalClaimPages}
                        >
                            <i className="fas fa-chevron-right"></i>
                        </button>
                    </div>
                </div>
            )}

            {showClaimView && selectedClaim && (
                <div className="modal active">
                    <div className="modal-backdrop" onClick={() => setShowClaimView(false)}></div>

                    <div className="modal-content" style={{ maxWidth: 520 }}>
                        <div className="modal-header">
                            <h3 className="modal-title">
                                <i className="fas fa-ticket-alt" style={{ marginRight: 8 }}></i>
                                Coupon Claim
                            </h3>

                            <button
                                className="modal-close"
                                type="button"
                                onClick={() => setShowClaimView(false)}
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        <div className="modal-body">
                            <div style={{ textAlign: 'center', marginBottom: 20 }}>
                                <div
                                    style={{
                                        width: 70,
                                        height: 70,
                                        borderRadius: '50%',
                                        background: 'var(--bg-hover)',
                                        color: 'var(--primary)',
                                        fontSize: '1.8rem',
                                        fontWeight: 700,
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginBottom: 12
                                    }}
                                >
                                    {selectedClaim.initials}
                                </div>

                                <h4 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>
                                    {selectedClaim.customer}
                                </h4>

                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                    {selectedClaim.phone || '-'}
                                </span>
                            </div>

                            <div className="details-grid">
                                <div className="details-item">
                                    <span className="details-label">Coupon Code</span>
                                    <span className="details-value" style={{ color: 'var(--primary)', fontWeight: 700 }}>
                                        {selectedClaim.couponCode}
                                    </span>
                                </div>

                                <div className="details-item">
                                    <span className="details-label">Discount</span>
                                    <span className="details-value">
                                        {selectedClaim.percentage != null ? `${selectedClaim.percentage}%` : '-'}
                                    </span>
                                </div>

                                <div className="details-item">
                                    <span className="details-label">Branch Outlet</span>
                                    <span className="details-value">{selectedClaim.branch}</span>
                                </div>

                                <div className="details-item">
                                    <span className="details-label">Merchant</span>
                                    <span className="details-value">{selectedClaim.merchant}</span>
                                </div>

                                <div className="details-item">
                                    <span className="details-label">Used At</span>
                                    <span className="details-value">{formatDate(selectedClaim.usedAt)}</span>
                                </div>

                                <div className="details-item">
                                    <span className="details-label">Claim Status</span>
                                    <span className="details-value">
                                        <span className={`badge ${selectedClaim.badge}`}>
                                            {selectedClaim.status}
                                        </span>
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button
                                className="btn btn-secondary"
                                type="button"
                                onClick={() => setShowClaimView(false)}
                            >
                                Close Details
                            </button>

                            {selectedClaim?.status === 'Pending' && (
                                <button
                                    className="btn btn-primary"
                                    type="button"
                                    onClick={() => openClaimDialog(selectedClaim)}
                                >
                                    Review Coupon Claim
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <DecisionDialog
                open={isClaimDialogOpen}
                title="Review Coupon Claim"
                message="Confirm whether to accept or reject this coupon claim."
                details={selectedClaim ? selectedClaim.couponCode : ''}
                loading={isClaimSaving}
                onClose={closeClaimDialog}
                onSubmit={handleClaimDecision}
            />
        </>
    )
}
