import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import flLogo from '../../assets/img/firstloop-favicon.png'
import qrImg from '../../assets/img/qr-img.png'
import API from '../../api.js'
import { toast } from "react-hot-toast";
import { formatImageUrl } from '../../services/cardService.js'


export default function CustomerList() {
    const navigate = useNavigate()
    const [customers, setCustomers] = useState([])
    const [search, setSearch] = useState('')
    const [filterCard, setFilterCard] = useState('all')

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1)
    const [rowsPerPage, setRowsPerPage] = useState(10)


    const [loading, setLoading] = useState(false)
    const [branches, setBranches] = useState([])
    const [branchModalOpen, setBranchModalOpen] = useState(false)
    const [selectedBranchId, setSelectedBranchId] = useState('')
    const [targetCustomerEmail, setTargetCustomerEmail] = useState('')

    let merchant = {};
    try {
        const rawMerchant = localStorage.getItem("merchant_data");

        if (rawMerchant && rawMerchant !== "null" && rawMerchant !== "undefined") {
            merchant = JSON.parse(rawMerchant) || {};

        }
    } catch (e) {
        console.error("Error parsing merchant_data:", e);
    }

    const fetchCustomers = async () => {
        setLoading(true)
        try {
            const res = await API.post('firstloop/customer/fetch-merchant-customers', { mer_id: merchant?.user_id })
            if (res?.data?.status == 1 && res.data.data) {
                // console.log("Customer Data", res.data)
                setCustomers(res.data.data)
            }
        } catch (error) {
            console.error('Error:', error)
            toast.error("Network Issue")
        } finally {
            setLoading(false)
        }
    }

    const fetchBranches = async () => {
        try {
            const response = await API.post("firstloop/merchant/branch-list")
            if (response?.data?.status === 1 && Array.isArray(response?.data?.data)) {
                const list = response.data.data
                setBranches(list)
                if (list.length > 0) {
                    setSelectedBranchId(list[0].id || list[0]._id || '')
                }
            }
        } catch (e) {
            console.error("Error fetching branch list:", e)
        }
    }

    useEffect(() => {
        fetchCustomers()
        fetchBranches()
    }, [])

    const handleAddCardToCustomer = (customerEmail = '') => {
        setTargetCustomerEmail(customerEmail || '')
        if (!branches || branches.length === 0) {
            toast.error("No active branch found. Please create a branch location first.")
            return
        }

        if (branches.length === 1) {
            const bId = branches[0].id || branches[0]._id
            const emailQuery = customerEmail ? `?email=${encodeURIComponent(customerEmail)}` : ''
            navigate(`/merchant/add-card-customer/${bId}${emailQuery}`)
        } else {
            setBranchModalOpen(true)
        }
    }

    const handleConfirmBranchSelection = () => {
        if (!selectedBranchId) {
            toast.error("Please select a branch location")
            return
        }
        const emailQuery = targetCustomerEmail ? `?email=${encodeURIComponent(targetCustomerEmail)}` : ''
        setBranchModalOpen(false)
        navigate(`/merchant/add-card-customer/${selectedBranchId}${emailQuery}`)
    }

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
                return stampCards.length > 0 || Boolean(c.stampCard)
            }
            if (filterCard === 'membership') {
                return membershipCards.length > 0 || Boolean(c.membershipTier)
            }

            return true
        })
    }, [customers, search, filterCard])

    const totalPages = useMemo(() => {
        return Math.max(1, Math.ceil(filteredCustomers.length / rowsPerPage))
    }, [filteredCustomers.length, rowsPerPage])

    // Safety check for currentPage bounds
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






    return (
        <div style={{ paddingBottom: 40 }}>
            {/* Header */}
            <div className="flex-between mb-4" style={{ flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                        Merchant Customer Management
                    </h2>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>
                        View registered customers, assign single/multiple Stamp Cards & Membership Passes, and access full pass logs.
                    </p>
                </div>

                <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => handleAddCardToCustomer()}
                    style={{
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        borderRadius: 10,
                        padding: '9px 18px',
                        boxShadow: '0 4px 12px rgba(14, 136, 184, 0.25)'
                    }}
                >
                    <i className="fas fa-user-plus"></i>
                    <span>Add Card to Customer</span>
                </button>
            </div>

            {/* Filter Bar */}
            <div className="card mb-4" style={{ padding: 16, borderRadius: 14 }}>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ position: 'relative', width: 320 }}>
                        <i className="fas fa-search" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Search by customer name, email or phone..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value)
                                setCurrentPage(1)
                            }}
                            style={{ paddingLeft: 40, height: 40, borderRadius: 10, fontSize: '0.85rem' }}
                        />
                    </div>

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
                                    background: '#FFFFFF',
                                    color: '#0F172A',
                                    colorScheme: 'light'
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
                                    background: '#FFFFFF',
                                    color: '#0F172A',
                                    colorScheme: 'light'
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

            {/* Customer List Data Table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden', borderRadius: 16, border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                            <tr>
                                <th style={{ padding: '14px 18px', fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'capitalize' }}>Customer Info</th>
                                <th style={{ padding: '14px 18px', fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'capitalize' }}>Contact Details</th>
                                <th style={{ padding: '14px 18px', fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'capitalize' }}>Assigned Stamp Cards</th>
                                <th style={{ padding: '14px 18px', fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'capitalize' }}>Membership Tiers</th>
                                {/* <th style={{ padding: '14px 18px', fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'capitalize' }}>Visits</th> */}
                                <th style={{ padding: '14px 18px', fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'capitalize', textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-muted)' }}>
                                        <i className="fas fa-spinner fa-spin" style={{ fontSize: '1.5rem', marginBottom: 8, color: 'var(--firstloop-primary)' }} />
                                        <p style={{ margin: 0, fontSize: '0.88rem' }}>Loading merchant customers...</p>
                                    </td>
                                </tr>
                            ) : paginatedCustomers.length > 0 ? (
                                paginatedCustomers.map((cus) => {
                                    const stampCards = Array.isArray(cus.cards)
                                        ? cus.cards.filter(c => Number(c.card_type) === 1)
                                        : (cus.heldStampCards || (cus.stampCard ? [{ title: cus.stampCard }] : []))

                                    const membershipCards = Array.isArray(cus.cards)
                                        ? cus.cards.filter(c => Number(c.card_type) === 2)
                                        : (cus.heldMemberships || (cus.membershipTier ? [{ title: cus.membershipTier }] : []))

                                    const profileImg = cus.profile_image ? formatImageUrl(cus.profile_image) : (cus.avatar || null)
                                    const joinedText = cus.created_at
                                        ? new Date(cus.created_at).toLocaleDateString()
                                        : (cus.joinedDate || '-')

                                    return (
                                        <tr key={cus.id}>
                                            <td style={{ padding: '14px 18px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                    {profileImg ? (
                                                        <img
                                                            src={profileImg}
                                                            alt={cus.name || 'Customer'}
                                                            style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--firstloop-primary)' }}
                                                        />
                                                    ) : (
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
                                                    )}
                                                    <div>
                                                        <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)', display: 'block' }}>
                                                            {cus.name || 'Customer'}
                                                        </strong>
                                                        {/* <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                            Joined: {joinedText}
                                                        </span> */}
                                                    </div>
                                                </div>
                                            </td>
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

                                            {/* Assigned Stamp Cards Count */}
                                            <td style={{ padding: '14px 18px' }}>
                                                <span
                                                    style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: 6,
                                                        padding: '5px 14px',
                                                        borderRadius: 20,
                                                        background: stampCards.length > 0 ? 'rgba(14, 136, 184, 0.1)' : '#F1F5F9',
                                                        border: `1px solid ${stampCards.length > 0 ? 'rgba(14, 136, 184, 0.25)' : '#E2E8F0'}`,
                                                        color: stampCards.length > 0 ? 'var(--firstloop-primary, #0E88B8)' : '#94A3B8',
                                                        fontWeight: 800,
                                                        fontSize: '0.84rem'
                                                    }}
                                                    title={`${stampCards.length} Stamp Cards assigned`}
                                                >
                                                    <i className="fas fa-stamp" style={{ fontSize: '0.78rem' }} />
                                                    {stampCards.length}
                                                </span>
                                            </td>

                                            {/* Membership Tiers Count */}
                                            <td style={{ padding: '14px 18px' }}>
                                                <span
                                                    style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: 6,
                                                        padding: '5px 14px',
                                                        borderRadius: 20,
                                                        background: membershipCards.length > 0 ? 'rgba(245, 158, 11, 0.12)' : '#F1F5F9',
                                                        border: `1px solid ${membershipCards.length > 0 ? 'rgba(245, 158, 11, 0.3)' : '#E2E8F0'}`,
                                                        color: membershipCards.length > 0 ? '#D97706' : '#94A3B8',
                                                        fontWeight: 800,
                                                        fontSize: '0.84rem'
                                                    }}
                                                    title={`${membershipCards.length} Membership Passes assigned`}
                                                >
                                                    <i className="fas fa-crown" style={{ fontSize: '0.78rem' }} />
                                                    {membershipCards.length}
                                                </span>
                                            </td>

                                            <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm"
                                                        onClick={() => handleAddCardToCustomer(cus.email)}
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
                                                        className="btn btn-sm"
                                                        onClick={() => navigate(`/merchant/customers/${cus.id}`)}
                                                        style={{ background: 'var(--firstloop-primary-light)', color: 'var(--firstloop-primary)', fontWeight: 700, borderRadius: 8, fontSize: '0.76rem', padding: '6px 10px' }}
                                                    >
                                                        <i className="fas fa-user-circle" style={{ marginRight: 4 }} />
                                                        View Profile
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })
                            ) : (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>
                                        No customers found matching your criteria.
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
                                const isCurrent = currentPage === page;
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
                                );
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

            {/* BRANCH SELECTION MODAL FOR MULTI-BRANCH MERCHANTS */}
            {branchModalOpen && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(15, 23, 42, 0.75)',
                        backdropFilter: 'blur(6px)',
                        zIndex: 9999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 20
                    }}
                >
                    <div
                        style={{
                            background: '#FFFFFF',
                            borderRadius: 20,
                            maxWidth: 480,
                            width: '100%',
                            padding: 24,
                            boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
                            position: 'relative'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--firstloop-primary-light)', color: 'var(--firstloop-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', fontWeight: 800 }}>
                                    <i className="fas fa-store" />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                                        Select Branch Location
                                    </h3>
                                    <small style={{ color: 'var(--text-muted)' }}>
                                        Choose the branch outlet to issue the card from
                                    </small>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setBranchModalOpen(false)}
                                style={{ background: 'none', border: 'none', fontSize: '1.2rem', color: 'var(--text-muted)', cursor: 'pointer' }}
                            >
                                &times;
                            </button>
                        </div>

                        <div style={{ marginBottom: 20 }}>
                            <label style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: 8, display: 'block', color: 'var(--text-primary)' }}>
                                Available Store Branches ({branches.length}):
                            </label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 260, overflowY: 'auto' }}>
                                {branches.map((b) => {
                                    const bId = b.id || b._id
                                    const isSelected = String(selectedBranchId) === String(bId)
                                    return (
                                        <div
                                            key={bId}
                                            onClick={() => setSelectedBranchId(bId)}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                padding: '12px 14px',
                                                borderRadius: 12,
                                                border: isSelected ? '2px solid var(--firstloop-primary)' : '1px solid #E2E8F0',
                                                background: isSelected ? 'var(--firstloop-primary-light)' : '#F8FAFC',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease'
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <div
                                                    style={{
                                                        width: 18,
                                                        height: 18,
                                                        borderRadius: '50%',
                                                        border: isSelected ? '5px solid var(--firstloop-primary)' : '2px solid #CBD5E1',
                                                        background: '#FFFFFF'
                                                    }}
                                                />
                                                <div>
                                                    <strong style={{ fontSize: '0.88rem', color: 'var(--text-primary)', display: 'block' }}>
                                                        {b.name || 'Branch Outlet'}
                                                    </strong>
                                                    {(b.address || b.city) && (
                                                        <small style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                                                            {[b.address, b.city].filter(Boolean).join(', ')}
                                                        </small>
                                                    )}
                                                </div>
                                            </div>
                                            {/* <span
                                                style={{
                                                    fontSize: '0.7rem',
                                                    fontWeight: 700,
                                                    padding: '3px 8px',
                                                    borderRadius: 6,
                                                    background: isSelected ? 'var(--firstloop-primary)' : '#E2E8F0',
                                                    color: isSelected ? '#FFFFFF' : 'var(--text-secondary)'
                                                }}
                                            >
                                                ID: #{bId}
                                            </span> */}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => setBranchModalOpen(false)}
                                style={{ padding: '8px 16px', borderRadius: 8, fontSize: '0.85rem' }}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="btn firstloop-btn-primary"
                                onClick={handleConfirmBranchSelection}
                                style={{ padding: '8px 20px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 700 }}
                            >
                                Continue to Issue Card &rarr;
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
