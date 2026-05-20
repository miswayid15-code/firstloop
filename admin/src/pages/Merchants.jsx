import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { getMerchants, subscribeMerchants } from '../lib/store'

export default function Merchants() {
    const navigate = useNavigate()
    const [merchants, setMerchants] = useState(getMerchants())
    const [showMerchantView, setShowMerchantView] = useState(false)
    const [selectedMerchant, setSelectedMerchant] = useState(null)

    useEffect(() => {
        const unsub = subscribeMerchants((next) => setMerchants(next))
        return unsub
    }, [])

    const openView = (merchant) => {
        setSelectedMerchant(merchant)
        setShowMerchantView(true)
    }

    const closeView = () => {
        setSelectedMerchant(null)
        setShowMerchantView(false)
    }

    return (
        <>
            <div className="flex-between" style={{ marginBottom: 24, gap: 20, flexWrap: 'wrap' }}>
                <div className="flex-row gap-md" style={{ flex: 1, flexWrap: 'nowrap' }}>
                    <div className="search-wrapper" style={{ marginBottom: 0, maxWidth: 360, flex: 1, minWidth: 200 }}>
                        <i className="fas fa-search search-icon" />
                        <input type="text" className="search-input" placeholder="Search merchant name, email..." />
                    </div>
                    <div className="flex-row gap-sm" style={{ flexWrap: 'nowrap' }}>
                        <select className="form-select" style={{ height: 40, minWidth: 140, padding: '0 16px' }}>
                            <option value="">All Categories</option>
                            <option value="cafe">Cafe & Restaurants</option>
                            <option value="fashion">Fashion & Retail</option>
                            <option value="travel">Hotel & Tourism</option>
                        </select>
                        <select className="form-select" style={{ height: 40, minWidth: 130, padding: '0 16px' }}>
                            <option value="">All Statuses</option>
                            <option value="active">Active</option>
                            <option value="pending">Pending</option>
                            <option value="suspended">Suspended</option>
                        </select>
                    </div>
                </div>
                <div>
                    <button className="btn btn-primary" onClick={() => navigate('/add-merchant')}>
                        <i className="fas fa-plus" /> Add Merchant
                    </button>
                </div>
            </div>

            <div className="table-wrapper">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Merchant Name</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>Status</th>
                            <th>Total Branches</th>
                            <th>Created Date</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {merchants.map((row) => (
                            <tr key={row.name}>
                                <td>
                                    <div className="table-cell-profile">
                                        <div className="cell-avatar">{row.name.charAt(0)}</div>
                                        <div className="cell-info">
                                            <span className="cell-name">{row.name}</span>
                                            <span className="cell-subtext">{row.subtitle}</span>
                                        </div>
                                    </div>
                                </td>
                                <td>{row.email}</td>
                                <td>{row.phone}</td>
                                <td>
                                    <span className="badge active">{row.status}</span>
                                </td>
                                <td>{row.branches}</td>
                                <td>{row.date}</td>
                                <td>
                                    <div className="action-group" style={{ justifyContent: 'flex-end' }}>
                                        <button className="btn-icon view" title="View Merchant Details" onClick={() =>  navigate('/view-merchant')}>
                                            <i className="fas fa-eye" />
                                        </button>
                                        <button className="btn-icon edit" title="Edit Merchant" onClick={() => navigate('/edit-merchant')}>
                                            <i className="fas fa-edit" />
                                        </button>
                                        <button className="btn-icon delete" title="Delete Merchant">
                                            <i className="fas fa-trash-alt" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showMerchantView && selectedMerchant && (
                <div className="modal active">
                    <div className="modal-backdrop" onClick={closeView} />
                    <div className="modal-content modal-content-lg">
                        <div className="modal-header">
                            <h3 className="modal-title">Merchant Details</h3>
                            <button className="modal-close" type="button" onClick={closeView}>
                                <i className="fas fa-times" />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                                <div style={{ width: 72, height: 72, borderRadius: 12, background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', fontWeight: 700 }}>
                                    {selectedMerchant.name.charAt(0)}
                                </div>
                                <div>
                                    <h4 style={{ margin: 0 }}>{selectedMerchant.name}</h4>
                                    <div style={{ color: 'var(--text-muted)' }}>{selectedMerchant.subtitle}</div>
                                    <div style={{ marginTop: 8 }}><strong>Email:</strong> {selectedMerchant.email}</div>
                                    <div><strong>Phone:</strong> {selectedMerchant.phone}</div>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" type="button" onClick={closeView}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
