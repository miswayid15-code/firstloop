import { useState } from 'react'

export default function Customers() {
    const [showCustomerView, setShowCustomerView] = useState(false)
    const [showCustomerEdit, setShowCustomerEdit] = useState(false)
    const [selectedCustomer, setSelectedCustomer] = useState(null)

    const customerRows = [
        {
            name: 'John Doe',
            subtitle: 'Premium Club Member',
            phone: '+1 (555) 019-3829',
            email: 'john.doe@example.com',
            dob: 'Nov 12, 1994',
            joined: 'Oct 12, 2025',
            branch: 'Downtown Starbucks'
        }
    ]

    return (
        <>
            <div className="flex-between" style={{ marginBottom: 24, gap: 20, flexWrap: 'wrap' }}>
                <div className="flex-row gap-md" style={{ flex: 1, flexWrap: 'nowrap' }}>
                    <div className="search-wrapper" style={{ marginBottom: 0, maxWidth: 360, flex: 1, minWidth: 200 }}>
                        <i className="fas fa-search search-icon" />
                        <input type="text" className="search-input" placeholder="Search customer name, email, phone..." />
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                        Total Registered Customers: <strong>4 Users</strong>
                    </div>
                </div>
                <div>
                    <button className="btn btn-primary">
                        <i className="fas fa-plus" /> Add Customer
                    </button>
                </div>
            </div>

            <div className="table-wrapper">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Customer Name</th>
                            <th>Mobile Number</th>
                            <th>Email</th>
                            <th>Date of Birth</th>
                            <th>Joiner Dealora Date</th>
                            <th>Assigned Branch</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {customerRows.concat(customerRows, customerRows).map((row, index) => (
                            <tr key={`${row.email}-${index}`}>
                                <td>
                                    <div className="table-cell-profile">
                                        <div className="cell-avatar">JD</div>
                                        <div className="cell-info">
                                            <span className="cell-name">{row.name}</span>
                                            <span className="cell-subtext">{row.subtitle}</span>
                                        </div>
                                    </div>
                                </td>
                                <td>{row.phone}</td>
                                <td>{row.email}</td>
                                <td>{row.dob}</td>
                                <td>{row.joined}</td>
                                <td>{row.branch}</td>
                                <td>
                                    <div className="action-group" style={{ justifyContent: 'flex-end' }}>
                                        <button
                                            className="btn-icon view"
                                            title="View Customer Details"
                                            onClick={() => {
                                                setSelectedCustomer(row)
                                                setShowCustomerView(true)
                                            }}
                                        >
                                            <i className="fas fa-eye" />
                                        </button>
                                        <button
                                            className="btn-icon edit"
                                            title="Edit Customer Details"
                                            onClick={() => {
                                                setSelectedCustomer(row)
                                                setShowCustomerEdit(true)
                                            }}
                                        >
                                            <i className="fas fa-edit" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
{
    showCustomerView && selectedCustomer && (

        <div
            className="modal active"
            id="global-details-modal"
        >

            <div
                className="modal-backdrop"
                onClick={() => setShowCustomerView(false)}
                style={{
                    background: 'rgba(233, 30, 99, 0.05)',
                    backdropFilter: 'blur(10px)'
                }}
            ></div>

            <div
                className="modal-content"
                style={{
                    maxWidth: 500,
                    animation: 'modalFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
            >

                <div
                    className="modal-header"
                    style={{
                        borderBottom: '1px solid rgba(255, 77, 128, 0.08)',
                        paddingBottom: 16
                    }}
                >

                    <h3
                        className="modal-title"
                        style={{
                            fontFamily: 'var(--font-heading)',
                            fontWeight: 700,
                            color: 'var(--primary)',
                            fontSize: '1.2rem'
                        }}
                    >

                        <i
                            className="fas fa-info-circle"
                            style={{ marginRight: 8 }}
                        ></i>

                        Customer Profile Details

                    </h3>

                    <button
                        className="modal-close"
                        type="button"
                        onClick={() => setShowCustomerView(false)}
                        style={{
                            cursor: 'pointer',
                            color: 'var(--text-muted)',
                            transition: 'var(--transition-fast)',
                            background: 'none',
                            border: 'none'
                        }}
                    >

                        <i className="fas fa-times"></i>

                    </button>

                </div>

                <div
                    className="modal-body"
                    style={{
                        padding: '24px 0'
                    }}
                >

                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            marginBottom: 24
                        }}
                    >

                        <div
                            style={{
                                width: 90,
                                height: 90,
                                borderRadius: '50%',
                                background: 'rgba(255,77,128,0.12)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '2rem',
                                fontWeight: 700,
                                color: 'var(--primary)',
                                marginBottom: 14
                            }}
                        >
                            {selectedCustomer.name?.charAt(0)}
                        </div>

                        <h3
                            style={{
                                marginBottom: 6,
                                fontSize: '1.4rem'
                            }}
                        >
                            {selectedCustomer.name}
                        </h3>

                        <span
                            style={{
                                color: 'var(--text-muted)',
                                fontSize: '0.9rem'
                            }}
                        >
                            Premium Club Member
                        </span>

                    </div>

                    <div className="details-grid">

                        <div className="details-item">

                            <span className="details-label">
                                Mobile Number
                            </span>

                            <span className="details-value">
                                {selectedCustomer.phone}
                            </span>

                        </div>

                        <div className="details-item">

                            <span className="details-label">
                                Email Address
                            </span>

                            <span className="details-value">
                                {selectedCustomer.email}
                            </span>

                        </div>

                        <div className="details-item">

                            <span className="details-label">
                                Date of Birth
                            </span>

                            <span className="details-value">
                                {selectedCustomer.dob}
                            </span>

                        </div>

                        <div className="details-item">

                            <span className="details-label">
                                Join Date
                            </span>

                            <span className="details-value">
                                {selectedCustomer.joinDate}
                            </span>

                        </div>

                        <div className="details-item">

                            <span className="details-label">
                                Assigned Branch
                            </span>

                            <span className="details-value">
                                {selectedCustomer.branch}
                            </span>

                        </div>

                    </div>

                </div>

                <div
                    className="modal-footer"
                    style={{
                        borderTop: '1px solid rgba(255, 77, 128, 0.08)',
                        paddingTop: 16,
                        display: 'flex',
                        justifyContent: 'flex-end'
                    }}
                >

                    <button
                        className="btn btn-secondary"
                        type="button"
                        onClick={() => setShowCustomerView(false)}
                        style={{
                            padding: '8px 20px'
                        }}
                    >
                        Close Details
                    </button>

                </div>

            </div>

        </div>

    )
}

{
    showCustomerEdit && selectedCustomer && (

        <div className="modal active">

            <div
                className="modal-backdrop"
                onClick={() => setShowCustomerEdit(false)}
            ></div>

            <div className="modal-content">

                <div className="modal-header">

                    <h3 className="modal-title">
                        Edit Customer Profile
                    </h3>

                    <button
                        className="modal-close"
                        type="button"
                        onClick={() => setShowCustomerEdit(false)}
                    >
                        <i className="fas fa-times"></i>
                    </button>

                </div>

                <div className="modal-body">

                    <form>

                        <div className="form-group">

                            <input
                                type="text"
                                id="edit-cust-name"
                                className="form-control"
                                placeholder=" "
                                defaultValue={selectedCustomer.name}
                                required
                            />

                            <label
                                htmlFor="edit-cust-name"
                                className="form-label"
                            >
                                Full Name
                            </label>

                        </div>

                        <div className="form-row">

                            <div className="form-group">

                                <input
                                    type="text"
                                    id="edit-cust-mobile"
                                    className="form-control"
                                    placeholder=" "
                                    defaultValue={selectedCustomer.phone}
                                    required
                                />

                                <label
                                    htmlFor="edit-cust-mobile"
                                    className="form-label"
                                >
                                    Mobile Number
                                </label>

                            </div>

                            <div className="form-group">

                                <input
                                    type="email"
                                    id="edit-cust-email"
                                    className="form-control"
                                    placeholder=" "
                                    defaultValue={selectedCustomer.email}
                                    required
                                />

                                <label
                                    htmlFor="edit-cust-email"
                                    className="form-label"
                                >
                                    Email Address
                                </label>

                            </div>

                        </div>

                        <div className="form-row">

                            <div className="form-group-classic">

                                <label className="form-label-classic">
                                    Date of Birth
                                </label>

                                <input
                                    type="date"
                                    className="form-control"
                                    defaultValue={selectedCustomer.dob}
                                    required
                                    style={{
                                        padding: '8px 12px',
                                        height: 40
                                    }}
                                />

                            </div>

                            <div className="form-group-classic">

                                <label className="form-label-classic">
                                    Date of Join
                                </label>

                                <input
                                    type="date"
                                    className="form-control"
                                    defaultValue={selectedCustomer.joinDate}
                                    required
                                    style={{
                                        padding: '8px 12px',
                                        height: 40
                                    }}
                                />

                            </div>

                        </div>

                        <div className="form-group-classic">

                            <label className="form-label-classic">
                                Branch Outlet
                            </label>

                            <select
                                className="form-select"
                                defaultValue={selectedCustomer.branch}
                                required
                            >

                                <option value="Downtown Starbucks">
                                    Downtown Starbucks
                                </option>

                                <option value="City Mall Store">
                                    City Mall Store
                                </option>

                                <option value="Starbucks Drive-Thru">
                                    Starbucks Drive-Thru
                                </option>

                                <option value="Financial District Outlet">
                                    Financial District Outlet
                                </option>

                            </select>

                        </div>

                    </form>

                </div>

                <div className="modal-footer">

                    <button
                        className="btn btn-secondary"
                        type="button"
                        onClick={() => setShowCustomerEdit(false)}
                    >
                        Cancel
                    </button>

                    <button
                        className="btn btn-primary"
                        type="button"
                    >
                        Update Details
                    </button>

                </div>

            </div>

        </div>

    )
}
        </>
    )
}
