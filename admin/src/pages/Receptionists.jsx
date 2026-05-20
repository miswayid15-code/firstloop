import { useMemo, useState } from 'react'
import { NavLink } from 'react-router-dom'

const staffRows = [
    {
        name: 'Jane Smith',
        role: 'Senior Receptionist',
        email: 'jane.smith@starbucks.com',
        phone: '+1 (555) 014-9844',
        status: 'Active',
        shift: 'Morning Shift (08:00 AM - 04:00 PM)'
    },
    {
        name: 'Mark Adams',
        role: 'Junior Cashier',
        email: 'mark.adams@starbucks.com',
        phone: '+1 (555) 091-2384',
        status: 'Active',
        shift: 'Evening Shift (04:00 PM - 12:00 AM)'
    },
    {
        name: 'Sarah Lee',
        role: 'Associate Clerk',
        email: 'sarah.lee@starbucks.com',
        phone: '+1 (555) 018-7243',
        status: 'Pending',
        shift: 'Night Shift (12:00 AM - 08:00 AM)'
    }
]

const couponRows = [
    {
        title: 'Starbucks Welcome 50%',
        subtitle: 'Downtown Starbucks • Cafe',
        code: 'SBUX50',
        discount: '50% OFF',
        expiry: 'Jul 30, 2026',
        redeemed: 496,
        limit: 1000,
        status: 'Active'
    },
    {
        title: 'Starbucks Free Coffee Extra',
        subtitle: 'Downtown Starbucks • Cafe',
        code: 'SBUXEXTRA',
        discount: 'FREE BEVERAGE',
        expiry: 'Jun 15, 2026',
        redeemed: 82,
        limit: 150,
        status: 'Active'
    }
]

export default function Receptionists() {
    const [activeTab, setActiveTab] = useState('staff')
    const [search, setSearch] = useState('')
    const [showStaffModal, setShowStaffModal] = useState(false)
    const [showCouponModal, setShowCouponModal] = useState(false)
    const [showStaffView, setShowStaffView] = useState(false)
    const [showStaffEdit, setShowStaffEdit] = useState(false)
    const [selectedStaff, setSelectedStaff] = useState(null)

    const filteredStaff = useMemo(
        () => staffRows.filter((row) => row.name.toLowerCase().includes(search.toLowerCase()) || row.email.toLowerCase().includes(search.toLowerCase())),
        [search]
    )

    const filteredCoupons = useMemo(
        () => couponRows.filter(
            (row) => row.title.toLowerCase().includes(search.toLowerCase()) || row.code.toLowerCase().includes(search.toLowerCase())
        ),
        [search]
    )

    const renderStatusBadge = (status) => {
        const className = status === 'Active' ? 'badge active' : status === 'Pending' ? 'badge pending' : 'badge'
        return <span className={className}>{status}</span>
    }

    return (
        <>
            <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500, marginBottom: 8 }}>
                    <NavLink to="/merchants" style={{ color: 'var(--primary)' }}>
                        Merchants
                    </NavLink>
                    <i className="fas fa-chevron-right" style={{ fontSize: '0.7rem' }} />
                    <NavLink to="/branches" style={{ color: 'var(--primary)' }}>
                        Starbucks Coffee
                    </NavLink>
                    <i className="fas fa-chevron-right" style={{ fontSize: '0.7rem' }} />
                    <span>Receptionists</span>
                </div>
                <div className="flex-between" style={{ gap: 20, flexWrap: 'wrap' }}>
                    <div className="flex-row gap-md" style={{ flex: 1, flexWrap: 'nowrap' }}>
                        <div className="search-wrapper" style={{ marginBottom: 0, maxWidth: 360, flex: 1, minWidth: 200 }}>
                            <i className="fas fa-search search-icon" />
                            <input
                                type="text"
                                className="search-input"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder={activeTab === 'staff' ? 'Search staff name or email...' : 'Search coupons, promo codes...'}
                            />
                        </div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                            Branch Outlet: <strong>Downtown Starbucks</strong>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        {activeTab === 'staff' ? (
                            <button className="btn btn-primary" onClick={() => setShowStaffModal(true)}>
                                <i className="fas fa-plus" /> Add Staff
                            </button>
                        ) : (
                            <button className="btn btn-primary" onClick={() => setShowCouponModal(true)}>
                                <i className="fas fa-plus" /> Add Coupon
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="tab-filters">
                <button className={`tab-btn${activeTab === 'staff' ? ' active' : ''}`} onClick={() => setActiveTab('staff')}>
                    Branch Staff <span className="tab-badge">{staffRows.length}</span>
                </button>
                <button className={`tab-btn${activeTab === 'coupons' ? ' active' : ''}`} onClick={() => setActiveTab('coupons')}>
                    Branch Coupons <span className="tab-badge">{couponRows.length}</span>
                </button>
            </div>

            {activeTab === 'staff' ? (
                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Staff Name</th>
                                <th>Email</th>
                                <th>Phone Number</th>
                                <th>Status</th>
                                <th>Shift Timing</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStaff.map((row) => (
                                <tr key={row.email}>
                                    <td>
                                        <div className="table-cell-profile">
                                            <div className="cell-avatar" style={{ color: row.name === 'Mark Adams' ? 'var(--status-info)' : undefined }}>
                                                {row.name
                                                    .split(' ')
                                                    .map((part) => part[0])
                                                    .join('')}
                                            </div>
                                            <div className="cell-info">
                                                <span className="cell-name">{row.name}</span>
                                                <span className="cell-subtext">{row.role}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>{row.email}</td>
                                    <td>{row.phone}</td>
                                    <td>{renderStatusBadge(row.status)}</td>
                                    <td>{row.shift}</td>
                                    <td>
                                        <div className="action-group" style={{ justifyContent: 'flex-end' }}>
                                            <button
                                                className="btn-icon view"
                                                title="View details"
                                                onClick={() => {
                                                    setSelectedStaff(row)
                                                    setShowStaffView(true)
                                                }}
                                            >
                                                <i className="fas fa-eye" />
                                            </button>
                                            <button
                                                className="btn-icon edit"
                                                title="Edit Shift"
                                                onClick={() => {
                                                    setSelectedStaff(row)
                                                    setShowStaffEdit(true)
                                                }}
                                            >
                                                <i className="fas fa-edit" />
                                            </button>
                                            <button className="btn-icon delete" title="Suspend Access">
                                                <i className="fas fa-trash-alt" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Coupon Title</th>
                                <th>Promo Code</th>
                                <th>Discount</th>
                                <th>Expiry Date</th>
                                <th style={{ width: 200 }}>Redemption Progression</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCoupons.map((row) => {
                                const percent = Math.round((row.redeemed / row.limit) * 100)
                                return (
                                    <tr key={row.code}>
                                        <td>
                                            <strong>{row.title}</strong>
                                            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 2 }}>{row.subtitle}</div>
                                        </td>
                                        <td>
                                            <code style={{ fontSize: '0.8rem', background: 'var(--bg-hover)', color: 'var(--primary)', padding: '4px 8px', borderRadius: 6, fontWeight: 600, border: '1px solid rgba(255, 77, 128, 0.08)' }}>
                                                {row.code}
                                            </code>
                                        </td>
                                        <td>
                                            <strong style={{ color: 'var(--secondary)' }}>{row.discount}</strong>
                                        </td>
                                        <td>{row.expiry}</td>
                                        <td>
                                            <div className="progress-bar-container">
                                                <div className="progress-bar-info">
                                                    <span>{row.redeemed} redeemed</span>
                                                    <span>{row.limit} Limit</span>
                                                </div>
                                                <div className="progress-bar-track">
                                                    <div className="progress-bar-fill" style={{ width: `${percent}%` }} />
                                                </div>
                                            </div>
                                        </td>
                                        <td>{renderStatusBadge(row.status)}</td>
                                        <td>
                                            <div className="action-group" style={{ justifyContent: 'flex-end' }}>
                                                <button className="btn-icon edit" title="Edit Campaign">
                                                    <i className="fas fa-edit" />
                                                </button>
                                                <button className="btn-icon delete" title="End Campaign">
                                                    <i className="fas fa-trash-alt" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {showStaffModal && (
                <div className="modal active">
                    <div className="modal-backdrop" onClick={() => setShowStaffModal(false)} />
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3 className="modal-title">Register Receptionist Access</h3>
                            <button className="modal-close" type="button" onClick={() => setShowStaffModal(false)}>
                                <i className="fas fa-times" />
                            </button>
                        </div>
                        <div className="modal-body">
                            <form>
                                <div className="form-group">
                                    <input type="text" className="form-control" placeholder=" " required autoComplete="off" />
                                    <label className="form-label">Full Name</label>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <input type="email" className="form-control" placeholder=" " required autoComplete="off" />
                                        <label className="form-label">Corporate Email</label>
                                    </div>
                                    <div className="form-group">
                                        <input type="text" className="form-control" placeholder=" " required autoComplete="off" />
                                        <label className="form-label">Phone Number</label>
                                    </div>
                                </div>
                                <div className="form-group-classic">
                                    <label className="form-label-classic">Work Shift Assignment</label>
                                    <select className="form-select" required>
                                        <option value="morning">Morning Shift (08:00 AM - 04:00 PM)</option>
                                        <option value="evening">Evening Shift (04:00 PM - 12:00 AM)</option>
                                        <option value="night">Night Shift (12:00 AM - 08:00 AM)</option>
                                    </select>
                                </div>
                            </form>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" type="button" onClick={() => setShowStaffModal(false)}>
                                Cancel
                            </button>
                            <button className="btn btn-primary" type="button" onClick={() => setShowStaffModal(false)}>
                                Save Receptionist
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showStaffView && selectedStaff && (
                <div className="modal active">
                    <div className="modal-backdrop" onClick={() => setShowStaffView(false)} />
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3 className="modal-title">Staff Details</h3>
                            <button className="modal-close" type="button" onClick={() => setShowStaffView(false)}>
                                <i className="fas fa-times" />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div style={{ marginBottom: 8 }}><strong>Name:</strong> {selectedStaff.name}</div>
                            <div style={{ marginBottom: 8 }}><strong>Email:</strong> {selectedStaff.email}</div>
                            <div style={{ marginBottom: 8 }}><strong>Phone:</strong> {selectedStaff.phone}</div>
                            <div style={{ marginBottom: 8 }}><strong>Role:</strong> {selectedStaff.role}</div>
                            <div style={{ marginBottom: 8 }}><strong>Shift:</strong> {selectedStaff.shift}</div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" type="button" onClick={() => setShowStaffView(false)}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showStaffEdit && selectedStaff && (
                <div className="modal active">
                    <div className="modal-backdrop" onClick={() => setShowStaffEdit(false)} />
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3 className="modal-title">Edit Staff</h3>
                            <button className="modal-close" type="button" onClick={() => setShowStaffEdit(false)}>
                                <i className="fas fa-times" />
                            </button>
                        </div>
                        <div className="modal-body">
                            <form>
                                <div className="form-group">
                                    <input type="text" className="form-control" defaultValue={selectedStaff.name} placeholder=" " />
                                    <label className="form-label">Full Name</label>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <input type="email" className="form-control" defaultValue={selectedStaff.email} placeholder=" " />
                                        <label className="form-label">Corporate Email</label>
                                    </div>
                                    <div className="form-group">
                                        <input type="text" className="form-control" defaultValue={selectedStaff.phone} placeholder=" " />
                                        <label className="form-label">Phone Number</label>
                                    </div>
                                </div>
                                <div className="form-group-classic">
                                    <label className="form-label-classic">Work Shift Assignment</label>
                                    <select className="form-select" defaultValue={selectedStaff.shift}>
                                        <option value="morning">Morning Shift (08:00 AM - 04:00 PM)</option>
                                        <option value="evening">Evening Shift (04:00 PM - 12:00 AM)</option>
                                        <option value="night">Night Shift (12:00 AM - 08:00 AM)</option>
                                    </select>
                                </div>
                            </form>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" type="button" onClick={() => setShowStaffEdit(false)}>
                                Cancel
                            </button>
                            <button className="btn btn-primary" type="button" onClick={() => setShowStaffEdit(false)}>
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showCouponModal && (
                <div className="modal active">
                    <div className="modal-backdrop" onClick={() => setShowCouponModal(false)} />
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3 className="modal-title">Create Branch Coupon</h3>
                            <button className="modal-close" type="button" onClick={() => setShowCouponModal(false)}>
                                <i className="fas fa-times" />
                            </button>
                        </div>
                        <div className="modal-body">
                            <form>
                                <div className="form-group">
                                    <input type="text" className="form-control" placeholder=" " required autoComplete="off" />
                                    <label className="form-label">Coupon Campaign Title</label>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <input type="text" className="form-control" placeholder=" " required autoComplete="off" />
                                        <label className="form-label">Promotional Code</label>
                                    </div>
                                    <div className="form-group">
                                        <input type="text" className="form-control" placeholder=" " required autoComplete="off" />
                                        <label className="form-label">Discount Value</label>
                                    </div>
                                </div>
                                <div className="form-group-classic">
                                    <label className="form-label-classic">Expiry Date</label>
                                    <input type="date" className="form-control" required style={{ padding: '8px 12px', height: 40 }} />
                                </div>
                            </form>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" type="button" onClick={() => setShowCouponModal(false)}>
                                Cancel
                            </button>
                            <button className="btn btn-primary" type="button" onClick={() => setShowCouponModal(false)}>
                                Publish Coupon
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
