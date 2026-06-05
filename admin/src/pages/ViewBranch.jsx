import { useEffect, useMemo, useState } from 'react'
import { NavLink, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-hot-toast'

import AppToaster from '../components/AppToaster.jsx'
import API from '../api.js'

const isSuccessResponse = (data) => {
    return data?.status === 1 || data?.status === '1' || data?.success === true || data?.success === 'true'
}

const formatTime = (value) => {
    if (!value) {
        return '-'
    }

    const parts = String(value).split(':')

    if (parts.length < 2) {
        return value
    }

    const hour = parseInt(parts[0], 10)
    const minute = parts[1]
    const period = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12

    return `${displayHour}:${minute} ${period}`
}

const getAppointmentStatus = (status) => {
    const statusMap = {
        0: { label: 'Pending', badge: 'pending' },
        1: { label: 'Approved', badge: 'active' },
        2: { label: 'Rejected', badge: 'pending' }
    }

    return statusMap[Number(status)] || { label: 'Unknown', badge: 'pending' }
}

const getCouponAppliedStatus = (status) => {
    const statusMap = {
        0: { label: 'Pending', badge: 'pending' },
        1: { label: 'Approved', badge: 'active' },
        2: { label: 'Cancelled', badge: 'pending' }
    }

    return statusMap[Number(status)] || { label: 'Unknown', badge: 'pending' }
}

const formatDate = (value) => {
    if (!value) {
        return '-'
    }

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
        return value
    }

    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    })
}

const ImageGridSkeleton = ({ count = 4 }) => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        {Array.from({ length: count }).map((_, index) => (
            <div
                key={`image-skel-${index}`}
                className="skeleton-avatar"
                style={{
                    width: 120,
                    height: 120,
                    borderRadius: 12,
                    flexShrink: 0
                }}
            />
        ))}
    </div>
)

const SectionTitleSkeleton = () => (
    <>
        <span className="skeleton-text" style={{ width: 160, height: 20, display: 'inline-block' }} />
        <span className="skeleton-text" style={{ width: 240, height: 14, marginTop: 10, display: 'inline-block' }} />
    </>
)

export default function ViewBranch() {
    const navigate = useNavigate()
    const { id } = useParams()

    const [loading, setLoading] = useState(true)
    const [branchData, setBranchData] = useState(null)
    const [coupons, setCoupons] = useState([])
    const [statusCount, setStatusCount] = useState(null)
    const [appointmentSearch, setAppointmentSearch] = useState('')
    const [appointmentStatusFilter, setAppointmentStatusFilter] = useState('all')

    const [appliedCoupons, setAppliedCoupons] = useState([])
    const [appliedCouponsLoading, setAppliedCouponsLoading] = useState(true)

    useEffect(() => {
        fetchBranch()
        fetchAppliedCoupons()
    }, [id])

    const fetchBranch = async () => {
        try {
            setLoading(true)

            const response = await API.get(`admin/branch/id/${id}`)
            const data = response.data || {}

            if (isSuccessResponse(data)) {
                setBranchData(data.data || null)
                setCoupons(data.coupon || [])
                setStatusCount(data.status_count || null)
            } else {
                setBranchData(null)
                toast.error(data.message || 'Failed to load branch details')
            }
        } catch (error) {
            setBranchData(null)
            const apiMessage = error?.response?.data?.message || 'Failed to load branch details'
            toast.error(apiMessage)
            console.error('Error fetching branch:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchAppliedCoupons = async () => {
        try {
            setAppliedCouponsLoading(true)

            const response = await API.post('admin/branch/applied-coupons', {
                branch_id: id
            })
            // console.log('Applied coupons response:', response.data)
            const data = response.data || {}

            if (isSuccessResponse(data)) {
                setAppliedCoupons(data.data || [])
            } else {
                setAppliedCoupons([])
            }
        } catch (error) {
            setAppliedCoupons([])
            console.error('Error fetching applied coupons:', error)
        } finally {
            setAppliedCouponsLoading(false)
        }
    }

    const merchantId = branchData?.merchant_id
    const galleryImages = branchData?.BranchImages || []
    const menuImages = branchData?.MenuImages || []
    const appointments = branchData?.Appointments || []

    const filteredAppointments = useMemo(() => {
        const searchValue = appointmentSearch.trim().toLowerCase()

        return appointments.filter((item) => {
            const statusInfo = getAppointmentStatus(item.status)
            const matchesStatus =
                appointmentStatusFilter === 'all' ||
                statusInfo.label.toLowerCase() === appointmentStatusFilter

            if (!searchValue) {
                return matchesStatus
            }

            const haystack = [
                item.br_name,
                item.appointment_date,
                item.slot,
                item.cancel_by,
                item.cancel_reason,
                item.approved_by,
                String(item.approved_by_id),
                String(item.cus_id),
                String(item.br_id),
                String(item.id)
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase()

            return matchesStatus && haystack.includes(searchValue)
        })
    }, [appointments, appointmentSearch, appointmentStatusFilter])

    if (!loading && !branchData) {
        return (
            <>
                <AppToaster />

                <div className="card" style={{ marginBottom: 18 }}>
                    <div className="flex-between" style={{ gap: 16, flexWrap: 'wrap' }}>
                        <div>
                            <h3 className="card-title">Branch details unavailable</h3>
                            <p className="card-subtitle">
                                The branch data could not be loaded. Please try again or go back.
                            </p>
                        </div>

                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => navigate(merchantId ? `/view-merchant/${merchantId}` : '/merchants')}
                        >
                            <i className="fas fa-arrow-left" />
                            {' '}Go Back
                        </button>
                    </div>
                </div>
            </>
        )
    }

    return (
        <>
            <AppToaster />

            <div style={{ marginBottom: 24 }}>
                {loading ? (
                    <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <span className="skeleton-text" style={{ width: 72, height: 14, display: 'inline-block' }} />
                            <span className="skeleton-text" style={{ width: 8, height: 14, display: 'inline-block' }} />
                            <span className="skeleton-text" style={{ width: 80, height: 14, display: 'inline-block' }} />
                            <span className="skeleton-text" style={{ width: 8, height: 14, display: 'inline-block' }} />
                            <span className="skeleton-text" style={{ width: 120, height: 14, display: 'inline-block' }} />
                        </div>

                        <div className="flex-between" style={{ gap: 20, flexWrap: 'wrap' }}>
                            <div style={{ flex: 1, minWidth: 240 }}>
                                <span className="skeleton-text" style={{ width: 180, height: 24, display: 'inline-block' }} />
                                <span className="skeleton-text" style={{ width: '70%', maxWidth: 420, height: 14, marginTop: 10, display: 'inline-block' }} />
                            </div>
                            <span className="skeleton-text" style={{ width: 160, height: 40, borderRadius: 8, display: 'inline-block' }} />
                        </div>
                    </>
                ) : (
                    <>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                fontSize: '0.8rem',
                                color: 'var(--text-muted)',
                                fontWeight: 500,
                                marginBottom: 8
                            }}
                        >
                            <NavLink to="/merchants" style={{ color: 'var(--primary)' }}>
                                Merchants
                            </NavLink>

                            <i className="fas fa-chevron-right" style={{ fontSize: '0.7rem' }} />

                            {merchantId ? (
                                <>
                                    <NavLink to={`/view-merchant/${merchantId}`} style={{ color: 'var(--primary)' }}>
                                        Merchant
                                    </NavLink>
                                    <i className="fas fa-chevron-right" style={{ fontSize: '0.7rem' }} />
                                </>
                            ) : null}

                            <span>{branchData?.name || 'Branch'}</span>
                        </div>

                        <div className="flex-between" style={{ gap: 20, flexWrap: 'wrap' }}>
                            <div>
                                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', fontWeight: 600, margin: 0 }}>
                                    Branch Overview
                                </h3>
                                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 6 }}>
                                    View branch profile, gallery, menu, appointments, and coupons.
                                </p>
                            </div>

                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => navigate(merchantId ? `/view-merchant/${merchantId}` : '/merchants')}
                            >
                                <i className="fas fa-arrow-left" />
                                {' '}Back to Merchant
                            </button>
                        </div>
                    </>
                )}
            </div>

            <div className="card card-glass merchant-profile-card">
                {loading ? (
                    <>
                        <div className="merchant-profile-info">
                            <div className="cell-avatar merchant-avatar skeleton-avatar" />
                            <div className="cell-info" style={{ width: '100%' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                                    <span className="skeleton-text" style={{ width: '220px', height: '28px', display: 'inline-block' }} />
                                    <span className="skeleton-text" style={{ width: '90px', height: '24px', display: 'inline-block', borderRadius: 20 }} />
                                </div>
                                <span className="skeleton-text" style={{ width: '55%', height: '16px', marginTop: 8, display: 'inline-block' }} />
                                <div
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                                        gap: '14px',
                                        marginTop: '18px'
                                    }}
                                >
                                    {Array.from({ length: 8 }).map((_, index) => (
                                        <div key={`branch-detail-skel-${index}`}>
                                            <span className="skeleton-text" style={{ width: '90%', height: '16px', display: 'inline-block', marginBottom: 10 }} />
                                            <span className="skeleton-text" style={{ width: index % 2 === 0 ? '60%' : '80%', height: '14px', display: 'inline-block' }} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="merchant-profile-stats merchant-profile-stats-grid">
                            {Array.from({ length: 6 }).map((_, index) => (
                                <div className={`merchant-stat-item${index > 0 ? ' border-left' : ''}`} key={`branch-stat-skel-${index}`}>
                                    <span className="skeleton-text" style={{ width: index === 0 ? '80px' : '60px', height: '30px', display: 'inline-block' }} />
                                    <span className="skeleton-text" style={{ width: '120px', height: '14px', marginTop: 10, display: 'inline-block' }} />
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <>
                        <div className="merchant-profile-info">
                            <div className="cell-avatar merchant-avatar">
                                {branchData?.profile_image ? (
                                    <img
                                        src={branchData.profile_image}
                                        alt={branchData?.name || 'Branch'}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }}
                                    />
                                ) : (
                                    branchData?.name?.charAt(0) || 'B'
                                )}
                            </div>

                            <div className="cell-info" style={{ flex: 1 }}>
                                <div className="merchant-title-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                                    <h2>{branchData?.name}</h2>
                                    <span className="badge active">Active Branch</span>
                                </div>

                                <p className="merchant-subtext" style={{ marginTop: 8, maxWidth: 640 }}>
                                    {branchData?.email} • {branchData?.phone}
                                    {branchData?.city || branchData?.state
                                        ? ` • ${[branchData?.city, branchData?.state].filter(Boolean).join(', ')}`
                                        : ''}
                                </p>

                                <div className="merchant-details-grid">
                                    <div>
                                        <small className="merchant-sub-label">Email</small>
                                        <p className="merchant-subtext">{branchData?.email || '-'}</p>
                                    </div>

                                    <div>
                                        <small className="merchant-sub-label">Phone</small>
                                        <p className="merchant-subtext">{branchData?.phone || '-'}</p>
                                    </div>

                                    <div>
                                        <small className="merchant-sub-label">Open Time</small>
                                        <p className="merchant-subtext">{formatTime(branchData?.open_time)}</p>
                                    </div>

                                    <div>
                                        <small className="merchant-sub-label">Close Time</small>
                                        <p className="merchant-subtext">{formatTime(branchData?.close_time)}</p>
                                    </div>

                                    <div>
                                        <small className="merchant-sub-label">City</small>
                                        <p className="merchant-subtext">{branchData?.city || '-'}</p>
                                    </div>

                                    <div>
                                        <small className="merchant-sub-label">State</small>
                                        <p className="merchant-subtext">{branchData?.state || '-'}</p>
                                    </div>
                                    <div>
                                        <small className="merchant-sub-label">Country</small>
                                        <p className="merchant-subtext">{branchData?.country || '-'}</p>
                                    </div>

                                    <div>
                                        <small className="merchant-sub-label">Zip Code / Postal Code</small>
                                        <p className="merchant-subtext">{branchData?.zip_code || '-'}</p>
                                    </div>

                                    <div>
                                        <small className="merchant-sub-label">Latitude</small>
                                        <p className="merchant-subtext">{branchData?.lat || '-'}</p>
                                    </div>

                                    <div>
                                        <small className="merchant-sub-label">Longitude</small>
                                        <p className="merchant-subtext">{branchData?.lon || '-'}</p>
                                    </div>

                                    <div style={{ gridColumn: '1 / -1' }}>
                                        <small className="merchant-sub-label">Address</small>
                                        <p
                                            className="merchant-subtext"
                                            style={{
                                                whiteSpace: 'normal',
                                                wordBreak: 'break-word',
                                                lineHeight: '1.6'
                                            }}
                                        >
                                            {branchData?.address || '-'}
                                        </p>
                                    </div>

                                    {branchData?.description ? (
                                        <div style={{ gridColumn: '1 / -1' }}>
                                            <small className="merchant-sub-label">Description</small>
                                            <p
                                                className="merchant-subtext"
                                                style={{
                                                    whiteSpace: 'normal',
                                                    wordBreak: 'break-word',
                                                    lineHeight: '1.6'
                                                }}
                                            >
                                                {branchData.description}
                                            </p>
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        </div>

                        <div className="merchant-profile-stats merchant-profile-stats-grid">
                            <div className="merchant-stat-item">
                                <span className="merchant-stat-val val-primary">
                                    {statusCount?.pending_appointment || 0}
                                </span>
                                <span className="merchant-stat-lbl">Pending Appointments</span>
                            </div>

                            <div className="merchant-stat-item border-left">
                                <span className="merchant-stat-val">
                                    {statusCount?.approved_appointment || 0}
                                </span>
                                <span className="merchant-stat-lbl">Approved Appointments</span>
                            </div>

                            <div className="merchant-stat-item border-left">
                                <span className="merchant-stat-val">
                                    {statusCount?.rejected_appointment || 0}
                                </span>
                                <span className="merchant-stat-lbl">Rejected Appointments</span>
                            </div>

                            <div className="merchant-stat-item border-left">
                                <span className="merchant-stat-val">
                                    {statusCount?.total_coupon || 0}
                                </span>
                                <span className="merchant-stat-lbl">Total Coupons</span>
                            </div>

                            <div className="merchant-stat-item border-left">
                                <span className="merchant-stat-val">
                                    {statusCount?.active_coupon || 0}
                                </span>
                                <span className="merchant-stat-lbl">Active Coupons</span>
                            </div>

                            <div className="merchant-stat-item border-left">
                                <span className="merchant-stat-val">
                                    {statusCount?.expired_coupon || 0}
                                </span>
                                <span className="merchant-stat-lbl">Expired Coupons</span>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {loading ? (
                <div className="card" style={{ marginTop: 24 }}>
                    <div style={{ marginBottom: 16 }}>
                        <SectionTitleSkeleton />
                    </div>
                    <ImageGridSkeleton count={4} />
                </div>
            ) : galleryImages.length > 0 ? (
                <div className="card" style={{ marginTop: 24 }}>
                    <div style={{ marginBottom: 16 }}>
                        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.05rem', fontWeight: 600, margin: 0 }}>
                            Gallery Images
                        </h3>
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 6 }}>
                            Branch gallery photos.
                        </p>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                        {galleryImages.map((item) => (
                            <div
                                key={item.id}
                                style={{
                                    width: 120,
                                    height: 120,
                                    borderRadius: 12,
                                    overflow: 'hidden',
                                    border: '1px solid var(--border)',
                                    flexShrink: 0
                                }}
                            >
                                <img
                                    src={item.image}
                                    alt="Branch gallery"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            ) : null}

            {loading ? (
                <div className="card" style={{ marginTop: 24 }}>
                    <div style={{ marginBottom: 16 }}>
                        <SectionTitleSkeleton />
                    </div>
                    <ImageGridSkeleton count={4} />
                </div>
            ) : menuImages.length > 0 ? (
                <div className="card" style={{ marginTop: 24 }}>
                    <div style={{ marginBottom: 16 }}>
                        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.05rem', fontWeight: 600, margin: 0 }}>
                            Menu Images
                        </h3>
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 6 }}>
                            Menu items uploaded for this branch.
                        </p>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                        {menuImages.map((item) => (
                            <div
                                key={item.id}
                                style={{
                                    width: 120,
                                    height: 120,
                                    borderRadius: 12,
                                    overflow: 'hidden',
                                    border: '1px solid var(--border)',
                                    flexShrink: 0
                                }}
                            >
                                <img
                                    src={item.image}
                                    alt="Menu item"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            ) : null}

            <div className="card" style={{ marginTop: 24 }}>
                <div className="flex-between" style={{ gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
                    {loading ? (
                        <>
                            <div style={{ flex: 1, minWidth: 200 }}>
                                <SectionTitleSkeleton />
                            </div>
                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                <span className="skeleton-text" style={{ width: 220, height: 40, borderRadius: 8, display: 'inline-block' }} />
                                <span className="skeleton-text" style={{ width: 150, height: 40, borderRadius: 8, display: 'inline-block' }} />
                            </div>
                        </>
                    ) : (
                        <>
                            <div>
                                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.05rem', fontWeight: 600, margin: 0 }}>
                                    Appointments
                                </h3>
                                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 6 }}>
                                    Bookings scheduled for this branch.
                                </p>
                            </div>

                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                <div className="search-wrapper" style={{ marginBottom: 0, minWidth: 220 }}>
                                    <i className="fas fa-search search-icon" />
                                    <input
                                        type="text"
                                        className="search-input"
                                        placeholder="Search branch, date, reason..."
                                        value={appointmentSearch}
                                        onChange={(e) => setAppointmentSearch(e.target.value)}
                                    />
                                </div>

                                <select
                                    className="form-select"
                                    value={appointmentStatusFilter}
                                    onChange={(e) => setAppointmentStatusFilter(e.target.value)}
                                    style={{ minWidth: 150 }}
                                >
                                    <option value="all">All Status</option>
                                    <option value="pending">Pending</option>
                                    <option value="approved">Approved</option>
                                    <option value="rejected">Rejected</option>
                                </select>
                            </div>
                        </>
                    )}
                </div>

                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Customer ID</th>
                                <th>Branch ID</th>
                                <th>Branch Name</th>
                                <th>Date</th>
                                <th>Time Slot</th>
                                <th>Status</th>
                                <th>Approved By</th>
                                {/* <th>Approved By ID</th> */}
                                <th>Cancelled By</th>
                                <th>Reason</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array.from({ length: 3 }).map((_, index) => (
                                    <tr className="skeleton-row" key={`appointment-skel-${index}`}>
                                        {Array.from({ length: 11 }).map((__, cellIndex) => (
                                            <td key={`appointment-skel-cell-${cellIndex}`}>
                                                <span className="skeleton-text" style={{ width: '80%', display: 'inline-block' }} />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : filteredAppointments.length ? (
                                filteredAppointments.map((appointment) => {
                                    const statusInfo = getAppointmentStatus(appointment.status)

                                    return (
                                        <tr key={appointment.id}>
                                            <td><strong>#{appointment.id}</strong></td>
                                            <td>{appointment.cus_id ?? '-'}</td>
                                            <td>{appointment.br_id ?? '-'}</td>
                                            <td>{appointment.br_name || branchData?.name || '-'}</td>
                                            <td>{formatDate(appointment.appointment_date)}</td>
                                            <td>{formatTime(appointment.slot)}</td>
                                            <td>
                                                <span className={`badge ${statusInfo.badge}`}>
                                                    {statusInfo.label}
                                                </span>
                                            </td>
                                            <td>{appointment.approved_by || '-'}</td>
                                            {/* <td>{appointment.approved_by_id ?? '-'}</td> */}
                                            <td>{appointment.cancel_by || '-'}</td>
                                            <td>
                                                <span
                                                    style={{
                                                        display: 'block',
                                                        maxWidth: 200,
                                                        whiteSpace: 'normal',
                                                        wordBreak: 'break-word'
                                                    }}
                                                >
                                                    {appointment.cancel_reason || '-'}
                                                </span>
                                            </td>
                                        </tr>
                                    )
                                })
                            ) : (
                                <tr>
                                    <td colSpan="11" style={{ textAlign: 'center', padding: '28px 16px' }}>
                                        No appointments found for this branch.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="card" style={{ marginTop: 24 }}>
                <div style={{ marginBottom: 16 }}>
                    {loading ? (
                        <SectionTitleSkeleton />
                    ) : (
                        <>
                            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.05rem', fontWeight: 600, margin: 0 }}>
                                Branch Coupons
                            </h3>
                            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 6 }}>
                                Coupons linked to this branch.
                            </p>
                        </>
                    )}
                </div>

                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Code</th>
                                <th>Discount</th>
                                <th>Min Amount</th>
                                <th>Usage Limit</th>
                                <th>Start Date</th>
                                <th>End Date</th>
                                <th>Status</th>
                                <th>Banner</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array.from({ length: 3 }).map((_, index) => (
                                    <tr className="skeleton-row" key={`coupon-skel-${index}`}>
                                        {Array.from({ length: 8 }).map((__, cellIndex) => (
                                            <td key={`coupon-skel-cell-${cellIndex}`}>
                                                <span className="skeleton-text" style={{ width: '80%', display: 'inline-block' }} />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : coupons.length ? (
                                coupons.map((coupon) => (
                                    <tr key={coupon.id}>
                                        <td><strong>{coupon.code}</strong></td>
                                        <td>{coupon.percentage}%</td>
                                        <td>{coupon.min_amount}</td>
                                        <td>{coupon.usage_limit}</td>
                                        <td>{formatDate(coupon.start_date)}</td>
                                        <td>{formatDate(coupon.end_date)}</td>
                                        <td>
                                            <span className={`badge ${coupon.is_expired == 1 ? 'pending' : 'active'}`}>
                                                {coupon.is_expired == 1 ? 'Expired' : 'Active'}
                                            </span>
                                        </td>
                                        <td>
                                            {coupon.banner_image ? (
                                                <img
                                                    src={coupon.banner_image}
                                                    alt={coupon.code}
                                                    style={{
                                                        width: 56,
                                                        height: 36,
                                                        objectFit: 'cover',
                                                        borderRadius: 6,
                                                        border: '1px solid var(--border)'
                                                    }}
                                                />
                                            ) : (
                                                '-'
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="8" style={{ textAlign: 'center', padding: '28px 16px' }}>
                                        No coupons found for this branch.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="card" style={{ marginTop: 24 }}>
                <div className="flex-between" style={{ gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
                    {appliedCouponsLoading ? (
                        <>
                            <div style={{ flex: 1, minWidth: 200 }}>
                                <SectionTitleSkeleton />
                            </div>
                            <span className="skeleton-text" style={{ width: 120, height: 40, borderRadius: 8, display: 'inline-block' }} />
                        </>
                    ) : (
                        <div>
                            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.05rem', fontWeight: 600, margin: 0 }}>
                                Applied Coupons
                            </h3>
                            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 6 }}>
                                Coupons redeemed by customers for this branch.
                            </p>
                        </div>
                    )}
                </div>

                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Coupon Code</th>
                                <th>Customer Name</th>
                                <th>Discount</th>
                                <th>Status</th>
                                <th>Used At</th>
                                <th>Approved By</th>
                               <th>Cancel By</th>
                                <th>Cancel Reason</th>
                                <th>Created At</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {appliedCouponsLoading ? (
                                Array.from({ length: 3 }).map((_, index) => (
                                    <tr className="skeleton-row" key={`applied-coupon-skel-${index}`}>
                                        {Array.from({ length: 7 }).map((__, cellIndex) => (
                                            <td key={`applied-coupon-skel-cell-${cellIndex}`}>
                                                <span className="skeleton-text" style={{ width: '80%', display: 'inline-block' }} />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : appliedCoupons.length ? (
                                appliedCoupons.map((item) => {
                                    const statusInfo = getCouponAppliedStatus(item.status)

                                    return (
                                        <tr key={item.id}>
                                            <td>
                                                <strong>{item.coupon_code || '-'}</strong>
                                            </td>
                                            <td>
                                                <div className="table-cell-profile">
                                                    <div className="cell-avatar" style={{ width: 32, height: 32, fontSize: '0.75rem', flexShrink: 0 }}>
                                                        {item.Customer?.name?.charAt(0)?.toUpperCase() || '?'}
                                                    </div>
                                                    <div className="cell-info">
                                                        <span className="cell-name">{item.Customer?.name || '-'}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span
                                                    style={{
                                                        fontWeight: 600,
                                                        color: 'var(--primary)'
                                                    }}
                                                >
                                                    {item.percentage != null ? `${item.percentage}%` : '-'}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`badge ${statusInfo.badge}`}>
                                                    {statusInfo.label}
                                                </span>
                                            </td>
                                            <td>{formatDate(item.used_at)}</td>
                                            <td>{item.approved_by || '-'}</td>
                                            <td>{item.cancel_by || '-'}</td>
                                            <td>
                                                <span
                                                    style={{
                                                        display: 'block',
                                                        maxWidth: 200,
                                                        whiteSpace: 'normal',
                                                        wordBreak: 'break-word'
                                                    }}
                                                >
                                                    {item.cancel_reason || '-'}
                                                </span>
                                            </td>
                                             <td>{formatDate(item.created_at)}</td>
                                             <td></td>
                                        </tr>
                                    )
                                })
                            ) : (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center', padding: '28px 16px' }}>
                                        No applied coupons found for this branch.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    )
}
