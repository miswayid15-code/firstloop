import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from "react-hot-toast"
import API from '../../api.js'
import { formatImageUrl } from '../../services/cardService.js'

export default function ReceptionistCustomerList() {
    let receptionist = {}
    try {
        const rawReceptionist = localStorage.getItem("receptionist_data")
        if (rawReceptionist && rawReceptionist !== "null" && rawReceptionist !== "undefined") {
            receptionist = JSON.parse(rawReceptionist) || {}
        }
    } catch (e) {
        console.error("Error parsing receptionist_data:", e)
    }

    const navigate = useNavigate()
    const [customers, setCustomers] = useState([])
    const [search, setSearch] = useState('')
    const [filterCard, setFilterCard] = useState('all')
    const [loading, setLoading] = useState(false)

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1)
    const [rowsPerPage, setRowsPerPage] = useState(10)

    const fetchCustomers = async () => {
        setLoading(true)
        try {
            const res = await API.post('firstloop/customer/fetch-branch-customers', {
                br_id: receptionist?.user_branch_id
            })

            if (res?.data?.status == 1 && res.data.data) {
                setCustomers(res.data.data)
            } else {
                setCustomers([])
            }
        } catch (error) {
            console.error('Error fetching customers:', error)
            toast.error("Failed to load customer list")
            setCustomers([])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchCustomers()
    }, [])

    const filteredCustomers = useMemo(() => {
        return (customers || []).filter(c => {
            const name = (c.name || '').toLowerCase()
            const email = (c.email || '').toLowerCase()
            const phone = String(c.phone || '')
            const searchLower = (search || '').toLowerCase().trim()

            const matchesSearch = !searchLower ||
                name.includes(searchLower) ||
                email.includes(searchLower) ||
                phone.includes(searchLower) ||
                (Array.isArray(c.cards) && c.cards.some(card =>
                    (card.title && card.title.toLowerCase().includes(searchLower)) ||
                    (card.card_number && card.card_number.toLowerCase().includes(searchLower)) ||
                    (Number(card.card_type) === 1 && 'stamp card'.includes(searchLower)) ||
                    (Number(card.card_type) === 2 && 'membership card'.includes(searchLower))
                ))

            if (!matchesSearch) return false

            const stampCards = (c.cards || []).filter(card => Number(card.card_type) === 1)
            const membershipCards = (c.cards || []).filter(card => Number(card.card_type) === 2)

            if (filterCard === 'stamps') {
                return stampCards.length > 0
            }
            if (filterCard === 'membership') {
                return membershipCards.length > 0
            }

            return true
        })
    }, [customers, search, filterCard])

    const totalPages = useMemo(() => {
        return Math.max(1, Math.ceil(filteredCustomers.length / rowsPerPage))
    }, [filteredCustomers.length, rowsPerPage])

    useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(1)
        }
    }, [totalPages, currentPage])

    const paginatedCustomers = useMemo(() => {
        const start = (currentPage - 1) * rowsPerPage
        return filteredCustomers.slice(start, start + rowsPerPage)
    }, [filteredCustomers, currentPage, rowsPerPage])

    const startEntry = filteredCustomers.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1
    const endEntry = Math.min(currentPage * rowsPerPage, filteredCustomers.length)

    const branchId = receptionist?.user_branch_id || ''

    return (
        <div style={{ paddingBottom: 40 }}>
            {/* Header */}
            <div className="flex-between mb-4" style={{ flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.45rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                        Branch Customers Management
                    </h2>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>
                        Registered branch customers, assigned Stamp & Membership Passes, and quick check-in launcher.
                    </p>
                </div>

                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    <button
                        type="button"
                        className="btn firstloop-btn-secondary"
                        onClick={() => navigate(`/receptionist/add-card-customer/${branchId}`)}
                        style={{
                            padding: '9px 16px',
                            borderRadius: 10,
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8
                        }}
                    >
                        <i className="fas fa-plus-circle" />
                        <span>Add Card to Customer</span>
                    </button>

                    <button
                        type="button"
                        className="btn firstloop-btn-primary"
                        onClick={() => navigate('/receptionist/checkin')}
                        style={{
                            padding: '9px 18px',
                            borderRadius: 10,
                            fontWeight: 800,
                            fontSize: '0.85rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            boxShadow: '0 4px 14px rgba(14, 136, 184, 0.25)'
                        }}
                    >
                        <i className="fas fa-qrcode" />
                        <span>Check-In Terminal</span>
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="card mb-4" style={{ padding: 16, borderRadius: 14, background: '#FFFFFF' }}>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                    {/* Search Input */}
                    <div style={{ position: 'relative', width: 320 }}>
                        <i className="fas fa-search" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Search by name, email or phone..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value)
                                setCurrentPage(1)
                            }}
                            style={{ paddingLeft: 40, height: 40, borderRadius: 10, fontSize: '0.85rem' }}
                        />
                    </div>

                    {/* Filter & Page Size Controls */}
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                                Filter Card:
                            </span>
                            <select
                                className="form-control"
                                value={filterCard}
                                onChange={(e) => {
                                    setFilterCard(e.target.value)
                                    setCurrentPage(1)
                                }}
                                style={{
                                    height: 40,
                                    borderRadius: 10,
                                    fontSize: '0.85rem',
                                    padding: '0 12px',
                                    minWidth: 160,
                                    border: '1px solid #CBD5E1',
                                    background: '#FFFFFF'
                                }}
                            >
                                <option value="all">All Card Types</option>
                                <option value="stamps">Stamp Cards</option>
                                <option value="membership">Membership Tiers</option>
                            </select>
                        </div>

                        {/* Page Size Selector */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                                Show:
                            </span>
                            <select
                                className="form-control"
                                value={rowsPerPage}
                                onChange={(e) => {
                                    setRowsPerPage(Number(e.target.value))
                                    setCurrentPage(1)
                                }}
                                style={{
                                    height: 40,
                                    borderRadius: 10,
                                    fontSize: '0.85rem',
                                    padding: '0 8px',
                                    width: 75,
                                    border: '1px solid #CBD5E1',
                                    background: '#FFFFFF'
                                }}
                            >
                                <option value={5}>5</option>
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Customer List Data Table Card */}
            <div className="card" style={{ padding: 0, overflow: 'hidden', borderRadius: 16, border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                            <tr>
                                <th style={{ padding: '14px 18px', fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Customer Info</th>
                                <th style={{ padding: '14px 18px', fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Contact Details</th>
                                <th style={{ padding: '14px 18px', fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Assigned Stamp Cards</th>
                                <th style={{ padding: '14px 18px', fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Membership Tiers</th>
                                <th style={{ padding: '14px 18px', fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-muted)' }}>
                                        <i className="fas fa-spinner fa-spin" style={{ fontSize: '1.5rem', marginBottom: 8, color: 'var(--firstloop-primary)' }} />
                                        <p style={{ margin: 0, fontSize: '0.88rem' }}>Loading branch customers...</p>
                                    </td>
                                </tr>
                            ) : paginatedCustomers.length > 0 ? (
                                paginatedCustomers.map((cus) => {
                                    const stampCards = Array.isArray(cus.cards)
                                        ? cus.cards.filter(c => Number(c.card_type) === 1)
                                        : []

                                    const membershipCards = Array.isArray(cus.cards)
                                        ? cus.cards.filter(c => Number(c.card_type) === 2)
                                        : []

                                    const profileImg = cus.profile_image ? formatImageUrl(cus.profile_image) : null
                                   
                                        ? new Date(cus.created_at).toLocaleDateString()
                                        : '-'

                                    return (
                                        <tr key={cus.id}>
                                            {/* Customer Info */}
                                            <td style={{ padding: '14px 18px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                    
                                                        <div
                                                            style={{
                                                                width: 40,
                                                                height: 40,
                                                                borderRadius: '50%',
                                                                background: 'var(--firstloop-primary-light, #E6F2FA)',
                                                                color: 'var(--firstloop-primary, #0E88B8)',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                fontWeight: 700,
                                                                fontSize: '0.9rem',
                                                                flexShrink: 0,
                                                                border: '2px solid var(--firstloop-primary, #0E88B8)'
                                                            }}
                                                        >
                                                            {cus.name ? cus.name.charAt(0).toUpperCase() : 'C'}
                                                        </div>
                                                    
                                                    <div>
                                                        <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)', display: 'block' }}>
                                                            {cus.name || 'Customer'}
                                                        </strong>
                                                       
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Contact Details */}
                                            <td style={{ padding: '14px 18px' }}>
                                                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                                                    <div>
                                                        <i className="fas fa-envelope" style={{ marginRight: 6, color: 'var(--firstloop-primary)' }} />
                                                        {cus.email || '-'}
                                                    </div>
                                                    <div>
                                                        <i className="fas fa-phone" style={{ marginRight: 6, color: 'var(--firstloop-primary)' }} />
                                                        {cus.country_code ? `+${cus.country_code} ` : ''}{cus.phone || '-'}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Assigned Stamp Cards */}
                                            <td style={{ padding: '14px 18px' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                    {stampCards.length > 0 ? (
                                                        stampCards.map((sc, idx) => (
                                                            <div
                                                                key={sc.id || idx}
                                                                style={{
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    gap: 8,
                                                                    padding: '5px 10px',
                                                                    borderRadius: 8,
                                                                    background: 'var(--firstloop-primary-light, #E6F2FA)',
                                                                    border: '1px solid rgba(14, 136, 184, 0.25)',
                                                                    color: 'var(--firstloop-primary, #0E88B8)',
                                                                    maxWidth: 260
                                                                }}
                                                            >
                                                                <i className="fas fa-stamp" style={{ fontSize: '0.8rem', flexShrink: 0 }} />
                                                                <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                                                                    <span style={{ fontWeight: 700, fontSize: '0.78rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                        {sc.title || 'Stamp Card'}
                                                                    </span>
                                                                    {sc.card_number && (
                                                                        <small style={{ fontSize: '0.66rem', color: 'var(--text-muted)', fontFamily: 'monospace', fontWeight: 600 }}>
                                                                            {sc.card_number}
                                                                        </small>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', fontStyle: 'italic' }}>
                                                            No stamp cards
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Membership Tiers */}
                                            <td style={{ padding: '14px 18px' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                    {membershipCards.length > 0 ? (
                                                        membershipCards.map((mc, idx) => (
                                                            <div
                                                                key={mc.id || idx}
                                                                style={{
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    gap: 8,
                                                                    padding: '5px 10px',
                                                                    borderRadius: 8,
                                                                    background: 'rgba(245, 158, 11, 0.12)',
                                                                    border: '1px solid rgba(245, 158, 11, 0.3)',
                                                                    color: '#D97706',
                                                                    maxWidth: 260
                                                                }}
                                                            >
                                                                <i className="fas fa-crown" style={{ fontSize: '0.8rem', flexShrink: 0 }} />
                                                                <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                                                                    <span style={{ fontWeight: 700, fontSize: '0.78rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                        {mc.title || mc.name || 'Membership Card'}
                                                                    </span>
                                                                    {mc.card_number && (
                                                                        <small style={{ fontSize: '0.66rem', color: '#B45309', fontFamily: 'monospace', fontWeight: 600 }}>
                                                                            {mc.card_number}
                                                                        </small>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', fontStyle: 'italic' }}>
                                                            No membership passes
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Actions */}
                                            <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm"
                                                        onClick={() => navigate(`/receptionist/add-card-customer/${branchId}?email=${encodeURIComponent(cus.email || '')}`)}
                                                        style={{
                                                            background: 'rgba(14, 136, 184, 0.1)',
                                                            color: 'var(--firstloop-primary, #0E88B8)',
                                                            fontWeight: 700,
                                                            borderRadius: 8,
                                                            fontSize: '0.76rem',
                                                            padding: '6px 10px',
                                                            border: '1px solid rgba(14, 136, 184, 0.25)',
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: 4
                                                        }}
                                                        title="Add Card to this customer"
                                                    >
                                                        <i className="fas fa-plus-circle" />
                                                        <span>Add Card</span>
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="btn firstloop-btn-primary btn-sm"
                                                        onClick={() => navigate(`/receptionist/checkin?phone=${encodeURIComponent(cus.phone || '')}`)}
                                                        style={{
                                                            padding: '6px 12px',
                                                            borderRadius: 8,
                                                            fontWeight: 700,
                                                            fontSize: '0.76rem',
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: 4
                                                        }}
                                                    >
                                                        <i className="fas fa-check-circle" />
                                                        <span>Check-In</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })
                            ) : (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: 36, color: 'var(--text-muted)' }}>
                                        No branch customers found matching your criteria.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Footer */}
                {!loading && filteredCustomers.length > 0 && (
                    <div
                        style={{
                            padding: "16px 20px",
                            background: "#F8FAFC",
                            borderTop: "1px solid #E2E8F0",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            flexWrap: "wrap",
                            gap: 16
                        }}
                    >
                        {/* Range Summary */}
                        <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 500 }}>
                            Showing <strong style={{ color: "var(--text-primary)" }}>{startEntry}</strong> to{" "}
                            <strong style={{ color: "var(--text-primary)" }}>{endEntry}</strong> of{" "}
                            <strong style={{ color: "var(--text-primary)" }}>{filteredCustomers.length}</strong> entries
                        </div>

                        {/* Pagination Buttons */}
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            {/* Previous Button */}
                            <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                                style={{
                                    height: 34,
                                    padding: "0 14px",
                                    fontSize: "0.82rem",
                                    borderRadius: 8,
                                    fontWeight: 600,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6
                                }}
                            >
                                <i className="fas fa-chevron-left" style={{ fontSize: "0.75rem" }} />
                                Previous
                            </button>

                            {/* Page Numbers */}
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                                const isCurrent = currentPage === page
                                return (
                                    <button
                                        key={page}
                                        type="button"
                                        className={`btn btn-sm ${isCurrent ? "firstloop-btn-primary" : "btn-secondary"}`}
                                        onClick={() => setCurrentPage(page)}
                                        style={{
                                            height: 34,
                                            minWidth: 34,
                                            padding: "0 10px",
                                            fontSize: "0.82rem",
                                            borderRadius: 8,
                                            fontWeight: isCurrent ? 800 : 600,
                                            border: isCurrent ? "none" : "1px solid #CBD5E1",
                                            background: isCurrent ? "var(--firstloop-gradient-primary)" : "#FFFFFF",
                                            color: isCurrent ? "#FFFFFF" : "var(--text-primary)"
                                        }}
                                    >
                                        {page}
                                    </button>
                                )
                            })}

                            {/* Next Button */}
                            <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                disabled={currentPage === totalPages || totalPages === 0}
                                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                                style={{
                                    height: 34,
                                    padding: "0 14px",
                                    fontSize: "0.82rem",
                                    borderRadius: 8,
                                    fontWeight: 600,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6
                                }}
                            >
                                Next
                                <i className="fas fa-chevron-right" style={{ fontSize: "0.75rem" }} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
