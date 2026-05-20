import { useNavigate } from 'react-router-dom'
import { useState } from 'react'

const branchRows = [
    {
        name: 'Downtown Starbucks',
        address: '410 Broadway Ave, Downtown City',
        status: 'Active',
        staff: 6,
        coupons: 4,
        branchPath: '/receptionists'
    },
    {
        name: 'City Mall Store',
        address: 'Level 2, City Galleria Shopping Mall',
        status: 'Active',
        staff: 4,
        coupons: 3,
        branchPath: '/receptionists'
    },
    {
        name: 'Starbucks Drive-Thru',
        address: '82 North Highway Road, Exit 12',
        status: 'Active',
        staff: 8,
        coupons: 5,
        branchPath: '/receptionists'
    },
    {
        name: 'Financial District Outlet',
        address: 'Exchange Towers Lobby, Financial Rd',
        status: 'Pending',
        staff: 0,
        coupons: 0,
        branchPath: '/receptionists'
    }
]

export default function Branches() {
    const navigate = useNavigate()
    const [showEditBranch, setShowEditBranch] = useState(false)
    const [selectedBranch, setSelectedBranch] = useState(null)

    const openEdit = (branch) => {
        setSelectedBranch(branch)
        setShowEditBranch(true)
    }

    const closeEdit = () => {
        setShowEditBranch(false)
        setSelectedBranch(null)
    }

    return (
        <>
            <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500, marginBottom: 8 }}>
                    <a href="/merchants" style={{ color: 'var(--primary)' }}>Merchants</a>
                    <i className="fas fa-chevron-right" style={{ fontSize: '0.7rem' }} />
                    <span>Starbucks Coffee</span>
                </div>
                <div className="flex-between" style={{ gap: 20, flexWrap: 'wrap' }}>
                    <div className="search-wrapper" style={{ marginBottom: 0, maxWidth: 360, flex: 1, minWidth: 240 }}>
                        <i className="fas fa-search search-icon" />
                        <input type="text" className="search-input" placeholder="Search branch name, address..." />
                    </div>
                    <button className="btn btn-secondary" onClick={() => navigate('/merchants')}>
                        <i className="fas fa-arrow-left" /> Back to Merchants
                    </button>
                </div>
            </div>

            <div className="card card-glass merchant-profile-card" style={{ marginBottom: 24 }}>
                <div className="merchant-profile-info">
                    <div className="cell-avatar merchant-avatar">S</div>
                    <div className="cell-info">
                        <div className="merchant-title-row">
                            <h2>Starbucks Coffee</h2>
                            <span className="badge active">Active</span>
                        </div>
                        <p className="merchant-subtext">Beverages & Cafe Franchise • partner@starbucks.com</p>
                    </div>
                </div>

                <div className="merchant-profile-stats">
                    <div className="merchant-stat-item">
                        <span className="merchant-stat-val val-primary">14</span>
                        <span className="merchant-stat-lbl">Total Branches</span>
                    </div>
                    <div className="merchant-stat-item border-left">
                        <span className="merchant-stat-val">32</span>
                        <span className="merchant-stat-lbl">Receptionists</span>
                    </div>
                    <div className="merchant-stat-item border-left">
                        <span className="merchant-stat-val">12.4k</span>
                        <span className="merchant-stat-lbl">Coupons Redeemed</span>
                    </div>
                </div>
            </div>

            <div className="flex-between" style={{ marginBottom: 20 }}>
                <div>
                    <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', fontWeight: 600 }}>Active Branch Outlets</h3>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Manage physical retail storefront locations.</p>
                </div>
                <button className="btn btn-primary">
                    <i className="fas fa-plus" /> Add Branch
                </button>
            </div>

            <div className="table-wrapper">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Branch Name</th>
                            <th>Store Address</th>
                            <th>Status</th>
                            <th>Receptionist Count</th>
                            <th>Coupons Count</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {branchRows.map((branch) => (
                            <tr key={branch.name}>
                                <td><strong>{branch.name}</strong></td>
                                <td>{branch.address}</td>
                                <td><span className={`badge ${branch.status === 'Active' ? 'active' : branch.status === 'Pending' ? 'pending' : ''}`}>{branch.status}</span></td>
                                <td>
                                    <button className="btn-sm-action" onClick={() => navigate(branch.branchPath)}>
                                        <i className="fas fa-user-shield" /> {branch.staff} Staff
                                    </button>
                                </td>
                                <td>
                                    <button className="btn-sm-action-secondary" onClick={() => navigate(branch.branchPath)}>
                                        <i className="fas fa-ticket-alt" /> {branch.coupons} Coupons
                                    </button>
                                </td>
                                <td>
                                    <div className="action-group" style={{ justifyContent: 'flex-end' }}>
                                        <button className="btn-icon view" title="View Branch Console" onClick={() => navigate(branch.branchPath)}>
                                            <i className="fas fa-eye" />
                                        </button>
                                        <button className="btn-icon edit" title="Edit Branch" onClick={() => openEdit(branch)}>
                                            <i className="fas fa-edit" />
                                        </button>
                                        <button className="btn-icon delete" title="Delete Branch">
                                            <i className="fas fa-trash-alt" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {showEditBranch && (
                <div className="modal active">
                    <div className="modal-backdrop" onClick={closeEdit} />
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3 className="modal-title">Edit Branch</h3>
                            <button className="modal-close" type="button" onClick={closeEdit}>
                                <i className="fas fa-times" />
                            </button>
                        </div>
                        <div className="modal-body">
                            <form>
                                <div className="form-group">
                                    <input type="text" className="form-control" defaultValue={selectedBranch?.name} placeholder=" " />
                                    <label className="form-label">Branch Name</label>
                                </div>
                                <div className="form-group">
                                    <input type="text" className="form-control" defaultValue={selectedBranch?.address} placeholder=" " />
                                    <label className="form-label">Address</label>
                                </div>
                            </form>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" type="button" onClick={closeEdit}>
                                Cancel
                            </button>
                            <button className="btn btn-primary" type="button" onClick={closeEdit}>
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
