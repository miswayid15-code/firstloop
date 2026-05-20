import { useMemo, useState } from 'react'

const appointmentRows = [
    {
        id: 1,
        customer: 'Alice Cooper',
        phone: '+1 (555) 019-8239',
        initials: 'AC',
        service: 'Coffee Tasting Event',
        branch: 'Downtown Starbucks',
        date: 'May 24, 2026',
        time: '10:30 AM',
        status: 'Pending'
    },
    {
        id: 2,
        customer: 'Brian Rogers',
        phone: '+1 (555) 042-8812',
        initials: 'BR',
        service: 'Summer Collection Fitting',
        branch: 'City Mall Zara',
        date: 'May 25, 2026',
        time: '02:00 PM',
        status: 'Approved'
    },
    {
        id: 3,
        customer: 'Charlotte Hall',
        phone: '+1 (555) 082-9341',
        initials: 'CH',
        service: 'Free Latte Redemption',
        branch: 'Drive-Thru Starbucks',
        date: 'May 20, 2026',
        time: '09:00 AM',
        status: 'Approved'
    },
    {
        id: 4,
        customer: 'Emma Watson',
        phone: '+1 (555) 091-2384',
        initials: 'EW',
        service: 'Hilton Spa Package',
        branch: 'Hilton Luxury Hotel',
        date: 'May 15, 2026',
        time: '11:00 AM',
        status: 'Declined'
    }
]

export default function Appointments() {

    const [search, setSearch] = useState('')

    const [statusFilter, setStatusFilter] = useState('all')

    const [showAppointmentView, setShowAppointmentView] = useState(false)

    const [selectedAppointment, setSelectedAppointment] = useState(null)

    const [appointments, setAppointments] = useState(appointmentRows)

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

    const updateStatus = (id, status) => {

        const updated = appointments.map((item) =>
            item.id === id
                ? { ...item, status }
                : item
        )

        setAppointments(updated)
    }

    return (
        <>

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

                            <th>Service Campaign</th>

                            <th>Branch Outlet</th>

                            <th>Status</th>

                            <th style={{ textAlign: 'right' }}>
                                Actions
                            </th>

                        </tr>

                    </thead>

                    <tbody>

                        {filteredAppointments.map((row) => (

                            <tr key={row.id}>

                                <td>

                                    <div className="table-cell-profile">

                                        <div className="cell-avatar">
                                            {row.initials}
                                        </div>

                                        <div className="cell-info">

                                            <span className="cell-name">
                                                {row.customer}
                                            </span>

                                            <span className="cell-subtext">
                                                {row.phone}
                                            </span>

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

                                <td>{row.service}</td>

                                <td>{row.branch}</td>

                                <td>

                                    <span
                                        className={`badge ${
                                            row.status === 'Approved'
                                                ? 'approved'
                                                : row.status === 'Pending'
                                                    ? 'pending'
                                                    : 'declined'
                                        }`}
                                    >
                                        {row.status}
                                    </span>

                                </td>

                                <td>

    <div
        className="action-group"
        style={{
            justifyContent: 'flex-end',
            gap: 6
        }}
    >

        {
            row.status === 'Pending' ? (
                <>

                    <button
                        className="btn-icon"
                        title="Approve"
                        onClick={() => updateStatus(row.id, 'Approved')}
                        style={{
                            background: 'rgba(76,175,80,0.12)',
                            color: '#4caf50'
                        }}
                    >
                        <i className="fas fa-check"></i>
                    </button>

                    <button
                        className="btn-icon"
                        title="Decline"
                        onClick={() => updateStatus(row.id, 'Declined')}
                        style={{
                            background: 'rgba(244,67,54,0.12)',
                            color: '#f44336'
                        }}
                    >
                        <i className="fas fa-times"></i>
                    </button>

                </>
            ) : (
                <button
                    className="btn-icon view"
                    title="View Details"
                    onClick={() => openViewModal(row)}
                >
                    <i className="fas fa-eye"></i>
                </button>
            )
        }

    </div>

</td>

                            </tr>

                        ))}

                    </tbody>

                </table>

            </div>

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
                                                className={`badge ${
                                                    selectedAppointment.status === 'Approved'
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

                            </div>

                        </div>

                    </div>

                )
            }

        </>
    )
}