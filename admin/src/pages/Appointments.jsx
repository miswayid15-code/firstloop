import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import API from '../api.js'
import AppToaster from '../components/AppToaster.jsx'
import DecisionDialog from '../components/DecisionDialog.jsx'

const getAppointmentStatus = (status) => {
    if (status === 1 || status === '1') return 'Approved'
    if (status === 2 || status === '2') return 'Cancelled'
    if (status === 'Declined') return 'Declined'
    return 'Pending'
}

const getAppointmentStatusBadge = (statusLabel) => {
    if (statusLabel === 'Approved') return 'approved'
    if (statusLabel === 'Pending') return 'pending'
    return 'declined'
}

const getCustomerInitials = (name) => {
    if (!name) return 'NA'
    const parts = name.trim().split(' ')
    return parts.length === 1
        ? parts[0].slice(0, 2).toUpperCase()
        : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export default function Appointments() {

    const [search, setSearch] = useState('')

    const [statusFilter, setStatusFilter] = useState('all')

    const [showAppointmentView, setShowAppointmentView] = useState(false)

    const [selectedAppointment, setSelectedAppointment] = useState(null)

    const [isAppointmentDialogOpen, setIsAppointmentDialogOpen] = useState(false)
    const [isAppointmentSaving, setIsAppointmentSaving] = useState(false)

    const [appointments, setAppointments] = useState([])

    const [loading, setLoading] = useState(true)
    const [appointmentPage, setAppointmentPage] = useState(1)

    const fetchAppointments = async () => {
        try {
            const response = await API.post('admin/appointment/list')
            const data = response.data || {}

            if (data.status === 1) {
                const items = Array.isArray(data.data) ? data.data : []
                const mapped = items.map((appointment) => {
                    const customerName = appointment?.Customer?.name || ''
                    const phone = appointment?.Customer
                        ? `${appointment.Customer.country_code || ''}${appointment.Customer.phone || ''}`
                        : ''

                    return {
                        id: appointment.id,
                        customer: customerName || 'Unknown Customer',
                        phone,
                        initials: getCustomerInitials(customerName),
                        service: appointment.service || appointment.title || '',
                        branch: appointment.br_name || appointment.branch_name || '',
                        date: appointment.appointment_date || '',
                        time: appointment.slot || '',
                        status: getAppointmentStatus(appointment.status),
                        statusCode: appointment.status,
                        cancel_by: appointment.cancel_by,
                        cancel_reason: appointment.cancel_reason,
                        approved_by: appointment.approved_by,
                        approved_by_id: appointment.approved_by_id,
                        customerId: appointment.cus_id,
                        branchId: appointment.br_id,
                        raw: appointment
                    }
                })

                setAppointments(mapped)
            } else {
                setAppointments([])
                toast.error(data.message || 'Failed to load appointments')
            }
        } catch (error) {
            setAppointments([])
            toast.error(
                error?.response?.data?.message ||
                'Failed to load appointments'
            )
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchAppointments()
    }, [])

    const filteredAppointments = useMemo(
        () =>
            appointments.filter((row) => {

                const matchesSearch =
                    [row.customer, row.branch, row.service]
                        .some((value) =>
                            value.toLowerCase().includes(search.toLowerCase())
                        )

                const matchesStatus =
                    statusFilter === 'all' ||
                    row.status.toLowerCase() === statusFilter

                return matchesSearch && matchesStatus
            }),
        [appointments, search, statusFilter]
    )

    const openViewModal = (appointment) => {

        setSelectedAppointment(appointment)

        setShowAppointmentView(true)
    }

    const openAppointmentDialog = (appointment) => {
        setSelectedAppointment(appointment)
        setShowAppointmentView(false)
        setIsAppointmentDialogOpen(true)
    }

    const closeAppointmentDialog = () => {
        setIsAppointmentDialogOpen(false)
        setSelectedAppointment(null)
    }

    const handleAppointmentDecision = async ({ decision, reason }) => {
        if (!selectedAppointment) return

        try {
            setIsAppointmentSaving(true)
            const response = await API.post('admin/branch/update-appointment', {
                appointment_id: selectedAppointment.id,
                status: decision === 'accept' ? 1 : 2,
                cancel_reason: reason
            })

            const data = response.data || {}

            if (data.status === 1) {
                toast.success(data.message || 'Appointment updated successfully')
                setAppointments((prev) =>
                    prev.map((item) =>
                        item.id === selectedAppointment.id
                            ? { ...item, status: decision === 'accept' ? 'Approved' : 'Declined' }
                            : item
                    )
                )
                closeAppointmentDialog()
            } else {
                toast.error(data.message || 'Failed to update appointment')
            }
        } catch (error) {
            toast.error(
                error?.response?.data?.message ||
                'Failed to update appointment'
            )
        } finally {
            setIsAppointmentSaving(false)
        }
    }

    const APPOINTMENTS_PER_PAGE = 10

    const totalAppointmentPages = Math.max(
        1,
        Math.ceil(filteredAppointments.length / APPOINTMENTS_PER_PAGE)
    )

    const safeAppointmentPage = Math.min(
        appointmentPage,
        totalAppointmentPages
    )

    const appointmentPageStartIndex =
        (safeAppointmentPage - 1) * APPOINTMENTS_PER_PAGE

    const paginatedAppointments =
        filteredAppointments.slice(
            appointmentPageStartIndex,
            appointmentPageStartIndex + APPOINTMENTS_PER_PAGE
        )

    const appointmentStartCount = filteredAppointments.length
        ? appointmentPageStartIndex + 1
        : 0

    const appointmentEndCount = Math.min(
        appointmentPageStartIndex + APPOINTMENTS_PER_PAGE,
        filteredAppointments.length
    )

    const appointmentPageNumbers = Array.from(
        { length: totalAppointmentPages },
        (_, index) => index + 1
    )

    useEffect(() => {
        setAppointmentPage(1)
    }, [search, statusFilter])

    useEffect(() => {
        if (appointmentPage > totalAppointmentPages) {
            setAppointmentPage(totalAppointmentPages)
        }
    }, [appointmentPage, totalAppointmentPages])

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
                            placeholder="Search customer name, service..."
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

                            <span className="tab-badge">
                                {appointments.length}
                            </span>

                        </button>

                        <button
                            className={`tab-btn ${statusFilter === 'pending' ? 'active' : ''}`}
                            onClick={() => setStatusFilter('pending')}
                        >
                            Pending

                            <span
                                className="tab-badge"
                                style={{
                                    background: '#fff4e5',
                                    color: '#ff9800'
                                }}
                            >
                                {
                                    appointments.filter(
                                        (row) => row.status === 'Pending'
                                    ).length
                                }
                            </span>

                        </button>

                        <button
                            className={`tab-btn ${statusFilter === 'approved' ? 'active' : ''}`}
                            onClick={() => setStatusFilter('approved')}
                        >
                            Approved

                            <span
                                className="tab-badge"
                                style={{
                                    background: '#e8f5e9',
                                    color: '#4caf50'
                                }}
                            >
                                {
                                    appointments.filter(
                                        (row) => row.status === 'Approved'
                                    ).length
                                }
                            </span>

                        </button>

                        <button
                            className={`tab-btn ${statusFilter === 'declined' ? 'active' : ''}`}
                            onClick={() => setStatusFilter('declined')}
                        >
                            Declined

                            <span
                                className="tab-badge"
                                style={{
                                    background: '#ffebee',
                                    color: '#f44336'
                                }}
                            >
                                {
                                    appointments.filter(
                                        (row) => row.status === 'Declined'
                                    ).length
                                }
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
                    Live Schedule Feed
                </div>

            </div>

            <div className="table-wrapper">

                <table className="data-table">

                    <thead>

                        <tr>

                            <th>Customer Details</th>

                            <th>Date & Time</th>

                            {/* <th>Service Campaign</th> */}

                            <th>Branch Outlet</th>

                            <th>Status</th>

                            <th>Approved By</th>

                            <th>Cancelled By</th>

                            <th>Reason</th>

                            <th style={{ textAlign: 'right' }}>
                                Actions
                            </th>

                        </tr>

                    </thead>

                    <tbody>
                        {loading ? (
                            Array.from({ length: 5 }).map((_, index) => (
                                <tr className="skeleton-row" key={`appointment-skel-${index}`}>
                                    <td>
                                        <div className="table-cell-profile">
                                            <div className="cell-avatar skeleton-avatar" />
                                            <div className="cell-info">
                                                <span className="skeleton-text" style={{ width: '80px' }} />
                                                <span className="skeleton-text" style={{ width: '120px', marginTop: 8 }} />
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="skeleton-text" style={{ width: '80px' }} />
                                    </td>
                                    {/* <td>
                                        <span className="skeleton-text" style={{ width: '120px' }} />
                                    </td> */}
                                    <td>
                                        <span className="skeleton-text" style={{ width: '100px' }} />
                                    </td>
                                    <td>
                                        <span className="skeleton-text" style={{ width: '70px' }} />
                                    </td>
                                    <td>
                                        <span className="skeleton-text" style={{ width: '80px' }} />
                                    </td>
                                    <td>
                                        <span className="skeleton-text" style={{ width: '80px' }} />
                                    </td>
                                    <td>
                                        <span className="skeleton-text" style={{ width: '100px' }} />
                                    </td>
                                    <td>
                                        <span className="skeleton-text" style={{ width: '90px' }} />
                                    </td>
                                </tr>
                            ))
                        ) : paginatedAppointments.length > 0 ? (
                            paginatedAppointments.map((row) => (
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
                                                <span className="cell-subtext">{row.phone}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <strong>{row.date}</strong>
                                        <div
                                            style={{
                                                fontSize: '0.74rem',
                                                color: 'var(--text-muted)',
                                                marginTop: 2
                                            }}
                                        >
                                            {row.time}
                                        </div>
                                    </td>
                                    {/* <td>{row.service}</td> */}
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
                                        <span
                                            className={`badge ${row.status === 'Approved'
                                                ? 'approved'
                                                : row.status === 'Pending'
                                                    ? 'pending'
                                                    : 'declined'
                                                }`}
                                        >
                                            {row.status}
                                        </span>
                                    </td>
                                    <td>{row.approved_by || '-'}</td>
                                    <td>{row.cancel_by || '-'}</td>
                                    <td>{row.cancel_reason || '-'}</td>
                                    <td>
                                        <div
                                            className="action-group"
                                            style={{ justifyContent: 'flex-end', gap: 6 }}
                                        >
                                            <button
                                                className="btn-icon edit"
                                                title="Review Appointment"
                                                onClick={() => openAppointmentDialog(row)}
                                            >
                                                <i className="fas fa-edit"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={9} style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)' }}>
                                    No appointments found.
                                </td>
                            </tr>
                        )}
                    </tbody>

                </table>

            </div>

            {!loading && filteredAppointments.length > APPOINTMENTS_PER_PAGE && (
                <div className="pagination-container">
                    <span className="pagination-text">
                        Showing {appointmentStartCount}-{appointmentEndCount} of {filteredAppointments.length} appointments
                    </span>

                    <div className="pagination-controls">
                        <button
                            type="button"
                            className={`btn-page ${safeAppointmentPage === 1 ? 'disabled' : ''}`}
                            onClick={() => setAppointmentPage((page) => Math.max(1, page - 1))}
                            disabled={safeAppointmentPage === 1}
                        >
                            <i className="fas fa-chevron-left"></i>
                        </button>

                        {appointmentPageNumbers.map((page) => (
                            <button
                                type="button"
                                key={page}
                                className={`btn-page ${page === safeAppointmentPage ? 'active' : ''}`}
                                onClick={() => setAppointmentPage(page)}
                            >
                                {page}
                            </button>
                        ))}

                        <button
                            type="button"
                            className={`btn-page ${safeAppointmentPage === totalAppointmentPages ? 'disabled' : ''}`}
                            onClick={() => setAppointmentPage((page) => Math.min(totalAppointmentPages, page + 1))}
                            disabled={safeAppointmentPage === totalAppointmentPages}
                        >
                            <i className="fas fa-chevron-right"></i>
                        </button>
                    </div>
                </div>
            )}

            {
                showAppointmentView && selectedAppointment && (

                    <div className="modal active">

                        <div
                            className="modal-backdrop"
                            onClick={() => setShowAppointmentView(false)}
                        ></div>

                        <div
                            className="modal-content"
                            style={{
                                maxWidth: 500
                            }}
                        >

                            <div className="modal-header">

                                <h3 className="modal-title">

                                    <i
                                        className="fas fa-info-circle"
                                        style={{ marginRight: 8 }}
                                    ></i>

                                    Appointment Booking

                                </h3>

                                <button
                                    className="modal-close"
                                    type="button"
                                    onClick={() => setShowAppointmentView(false)}
                                >

                                    <i className="fas fa-times"></i>

                                </button>

                            </div>

                            <div className="modal-body">

                                <div
                                    style={{
                                        textAlign: 'center',
                                        marginBottom: 20
                                    }}
                                >

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
                                        {selectedAppointment.initials}
                                    </div>

                                    <h4
                                        style={{
                                            fontSize: '1.15rem',
                                            fontWeight: 700,
                                            margin: 0
                                        }}
                                    >
                                        {selectedAppointment.customer}
                                    </h4>

                                    <span
                                        style={{
                                            fontSize: '0.8rem',
                                            color: 'var(--text-muted)'
                                        }}
                                    >
                                        {selectedAppointment.phone}
                                    </span>

                                </div>

                                <div className="details-grid">

                                    <div className="details-item">

                                        <span className="details-label">
                                            Service Campaign
                                        </span>

                                        <span
                                            className="details-value"
                                            style={{
                                                color: 'var(--primary)',
                                                fontWeight: 700
                                            }}
                                        >
                                            {selectedAppointment.service}
                                        </span>

                                    </div>

                                    <div className="details-item">

                                        <span className="details-label">
                                            Date & Time
                                        </span>

                                        <span className="details-value">
                                            {selectedAppointment.date} ({selectedAppointment.time})
                                        </span>

                                    </div>

                                    <div className="details-item">

                                        <span className="details-label">
                                            Branch Outlet
                                        </span>

                                        <span className="details-value">
                                            {selectedAppointment.branch}
                                        </span>

                                    </div>

                                    <div className="details-item">

                                        <span className="details-label">
                                            Booking Status
                                        </span>

                                        <span className="details-value">

                                            <span
                                                className={`badge ${selectedAppointment.status === 'Approved'
                                                    ? 'approved'
                                                    : selectedAppointment.status === 'Pending'
                                                        ? 'pending'
                                                        : 'declined'
                                                    }`}
                                            >
                                                {selectedAppointment.status}
                                            </span>

                                        </span>

                                    </div>

                                </div>

                            </div>

                            <div className="modal-footer">

                                <button
                                    className="btn btn-secondary"
                                    type="button"
                                    onClick={() => setShowAppointmentView(false)}
                                >
                                    Close Details
                                </button>

                                {selectedAppointment?.status === 'Pending' && (
                                    <button
                                        className="btn btn-primary"
                                        type="button"
                                        onClick={() => openAppointmentDialog(selectedAppointment)}
                                    >
                                        Review Appointment
                                    </button>
                                )}

                            </div>

                        </div>

                    </div>

                )
            }

            <DecisionDialog
                open={isAppointmentDialogOpen}
                title="Review Appointment"
                message="Accept or reject this appointment. Rejection requires a reason."
                details={selectedAppointment ? `Appointment #${selectedAppointment.id}` : ''}
                loading={isAppointmentSaving}
                onClose={closeAppointmentDialog}
                onSubmit={handleAppointmentDecision}
            />

        </>
    )
}