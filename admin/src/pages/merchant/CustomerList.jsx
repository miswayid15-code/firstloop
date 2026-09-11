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
    const [selectedBranch, setSelectedBranch] = useState('all')

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1)
    const [rowsPerPage, setRowsPerPage] = useState(10)


    const [loading, setLoading] = useState(false)
    const [branches, setBranches] = useState([])
    const [branchModalOpen, setBranchModalOpen] = useState(false)
    const [selectedBranchId, setSelectedBranchId] = useState('')
    const [targetCustomerEmail, setTargetCustomerEmail] = useState('')
    const [expandedRows, setExpandedRows] = useState({})

    const toggleExpandRow = (cusId) => {
        setExpandedRows(prev => ({
            ...prev,
            [cusId]: !prev[cusId]
        }))
    }

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

    const handleCheckInCustomer = (customer) => {
        // Find if customer already has a card with a branch_id matching selectedBranch or any branch_id
        let targetBranchId = ''
        if (selectedBranch !== 'all') {
            const matchCard = customer?.cards?.find(c =>
                String(c.branch_id) === String(selectedBranch) ||
                String(c.branch_name || '').toLowerCase() === String(selectedBranch).toLowerCase()
            )
            targetBranchId = matchCard?.branch_id || selectedBranch
        } else {
            const cardBranchId = customer?.cards?.find(c => c.branch_id)?.branch_id
            targetBranchId = cardBranchId || selectedBranchId || branches?.[0]?.id || branches?.[0]?._id || ''
        }

        const params = new URLSearchParams()
        if (customer?.phone) params.set('phone', customer.phone)
        if (customer?.email) params.set('email', customer.email)
        if (customer?.id) params.set('customerId', customer.id)

        const queryString = params.toString() ? `?${params.toString()}` : ''
        const url = targetBranchId ? `/merchant/checkin/${targetBranchId}${queryString}` : `/merchant/checkin${queryString}`

        navigate(url, {
            state: { customer }
        })
    }

    // Dynamic available branches list combining merchant branch list and customer card branches
    const availableBranches = useMemo(() => {
        const branchMap = new Map()

        if (Array.isArray(branches)) {
            branches.forEach(b => {
                const bId = String(b.id || b._id || '').trim()
                const bName = b.branch_name || b.name || b.location
                if (bId && bName) {
                    branchMap.set(bId, bName)
                }
            })
        }

        if (Array.isArray(customers)) {
            customers.forEach(cus => {
                if (cus.branch_name) {
                    const key = String(cus.branch_id || cus.branch_name).trim()
                    if (key && !branchMap.has(key)) {
                        branchMap.set(key, cus.branch_name)
                    }
                }
                if (Array.isArray(cus.cards)) {
                    cus.cards.forEach(card => {
                        if (card.branch_name) {
                            const key = String(card.branch_id || card.branch_name).trim()
                            if (key && !branchMap.has(key)) {
                                branchMap.set(key, card.branch_name)
                            }
                        }
                    })
                }
            })
        }

        return Array.from(branchMap.entries())
            .map(([id, name]) => ({ id, name }))
            .sort((a, b) => a.name.localeCompare(b.name))
    }, [branches, customers])

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
                    (card.branch_name && card.branch_name.toLowerCase().includes(searchLower)) ||
                    (Number(card.card_type) === 1 && 'stamp card'.includes(searchLower)) ||
                    (Number(card.card_type) === 2 && 'membership card'.includes(searchLower))
                ))

            if (!matchesSearch) return false

            // Branch filter
            if (selectedBranch !== 'all') {
                const selId = String(selectedBranch).toLowerCase().trim()
                const matchesBranch =
                    String(c.branch_id || '').toLowerCase() === selId ||
                    String(c.branch_name || '').toLowerCase() === selId ||
                    (Array.isArray(c.cards) && c.cards.some(card =>
                        String(card.branch_id || '').toLowerCase() === selId ||
                        String(card.branch_name || '').toLowerCase() === selId
                    ))

                if (!matchesBranch) return false
            }

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
    }, [customers, search, filterCard, selectedBranch])

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
                        {/* Branch Filter */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                                <i className="fas fa-store-alt" style={{ color: 'var(--firstloop-primary, #0E88B8)' }} />
                                Branch:
                            </span>
                            <select
                                className="form-control"
                                value={selectedBranch}
                                onChange={(e) => {
                                    setSelectedBranch(e.target.value)
                                    setCurrentPage(1)
                                }}
                                style={{
                                    height: 40,
                                    borderRadius: 10,
                                    fontSize: '0.85rem',
                                    padding: '0 12px',
                                    minWidth: 170,
                                    border: '1px solid #CBD5E1',
                                    background: '#FFFFFF',
                                    color: '#0F172A',
                                    colorScheme: 'light',
                                    cursor: 'pointer'
                                }}
                            >
                                <option value="all">All Branches ({availableBranches.length})</option>
                                {availableBranches.map((br) => (
                                    <option key={br.id} value={br.id}>
                                        {br.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Reset Filter Button if active */}
                        {(search || selectedBranch !== 'all') && (
                            <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary"
                                onClick={() => {
                                    setSearch('')
                                    setSelectedBranch('all')
                                    setCurrentPage(1)
                                }}
                                style={{
                                    height: 40,
                                    borderRadius: 10,
                                    fontSize: '0.8rem',
                                    fontWeight: 600,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    padding: '0 12px'
                                }}
                            >
                                <i className="fas fa-undo" /> Reset
                            </button>
                        )}

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
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
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
                                {/* <th style={{ padding: '14px 18px', fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'capitalize' }}>Membership Tiers</th> */}
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
                                        ? cus.cards.filter(c => c.card_type == null || Number(c.card_type) === 1 || String(c.card_type).toLowerCase().includes('stamp'))
                                        : (cus.heldStampCards || (cus.stampCard ? [{ title: cus.stampCard }] : []))

                                    const profileImg = cus.profile_image ? formatImageUrl(cus.profile_image) : (cus.avatar || null)
                                    const isExpanded = !!expandedRows[cus.id]

                                    // Sort cards so that matching branch or is_branch: 1 cards appear first
                                    const sortedStampCards = [...stampCards].sort((a, b) => {
                                        const aMatches = selectedBranch !== 'all'
                                            ? (String(a.branch_id) === String(selectedBranch) || String(a.branch_name || '').toLowerCase() === String(selectedBranch).toLowerCase() ? 1 : 0)
                                            : (Number(a.is_branch) === 1 ? 1 : 0)
                                        const bMatches = selectedBranch !== 'all'
                                            ? (String(b.branch_id) === String(selectedBranch) || String(b.branch_name || '').toLowerCase() === String(selectedBranch).toLowerCase() ? 1 : 0)
                                            : (Number(b.is_branch) === 1 ? 1 : 0)
                                        return bMatches - aMatches
                                    })

                                    // If not expanded, show only top 1 card; if expanded, show all
                                    const cardsToDisplay = isExpanded ? sortedStampCards : sortedStampCards.slice(0, 1)

                                    return (
                                        <tr key={cus.id}>
                                            <td style={{ padding: '14px 18px', verticalAlign: 'top' }}>
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
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '14px 18px', verticalAlign: 'top' }}>
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

                                            {/* Assigned Stamp Cards - Matching ReceptionistCustomerList UI */}
                                            <td style={{ padding: '14px 18px', verticalAlign: 'top' }}>
                                                {stampCards.length === 0 ? (
                                                    <div style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: 6,
                                                        padding: '6px 12px',
                                                        borderRadius: 8,
                                                        background: '#F8FAFC',
                                                        border: '1px dashed #CBD5E1',
                                                        color: 'var(--text-muted, #94A3B8)',
                                                        fontSize: '0.78rem'
                                                    }}>
                                                        <i className="fas fa-stamp" style={{ opacity: 0.5 }} />
                                                        <span>No stamp cards</span>
                                                    </div>
                                                ) : (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 260, maxWidth: 420 }}>
                                                        {/* Header summary when multiple cards */}
                                                        {stampCards.length > 1 && (
                                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                                                                <span style={{
                                                                    fontSize: '0.72rem',
                                                                    fontWeight: 700,
                                                                    color: 'var(--firstloop-primary, #0E88B8)',
                                                                    background: 'var(--firstloop-primary-light, #E6F2FA)',
                                                                    padding: '2px 8px',
                                                                    borderRadius: 12,
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    gap: 4
                                                                }}>
                                                                    <i className="fas fa-layer-group" style={{ fontSize: '0.65rem' }} />
                                                                    {stampCards.length} Stamp Cards
                                                                </span>

                                                                <button
                                                                    type="button"
                                                                    onClick={() => toggleExpandRow(cus.id)}
                                                                    style={{
                                                                        background: 'transparent',
                                                                        border: 'none',
                                                                        padding: '2px 6px',
                                                                        fontSize: '0.73rem',
                                                                        fontWeight: 700,
                                                                        color: 'var(--firstloop-primary, #0E88B8)',
                                                                        cursor: 'pointer',
                                                                        display: 'inline-flex',
                                                                        alignItems: 'center',
                                                                        gap: 4
                                                                    }}
                                                                >
                                                                    {isExpanded ? (
                                                                        <>
                                                                            <i className="fas fa-chevron-up" style={{ fontSize: '0.65rem' }} />
                                                                            Show less
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <i className="fas fa-chevron-down" style={{ fontSize: '0.65rem' }} />
                                                                            View all ({stampCards.length})
                                                                        </>
                                                                    )}
                                                                </button>
                                                            </div>
                                                        )}

                                                        {/* Scrollable Container if expanded with many cards */}
                                                        <div
                                                            style={{
                                                                display: 'flex',
                                                                flexDirection: 'column',
                                                                gap: 6,
                                                                maxHeight: isExpanded ? 240 : 'none',
                                                                overflowY: isExpanded ? 'auto' : 'visible',
                                                                paddingRight: isExpanded ? 4 : 0
                                                            }}
                                                        >
                                                            {cardsToDisplay.map((sc, idx) => {
                                                                // If is_branch is 1 or matches selectedBranch use Color 1 (Cyan/Primary); otherwise use Color 2 (Purple/Violet)
                                                                const isCurrentBranch = selectedBranch !== 'all'
                                                                    ? (String(sc.branch_id) === String(selectedBranch) || String(sc.branch_name || '').toLowerCase() === String(selectedBranch).toLowerCase())
                                                                    : Number(sc.is_branch) === 1
                                                                const collected = sc.current_stamp ?? sc.collected_stamps ?? sc.stamps ?? 0
                                                                const total = sc.number_of_stamps ?? sc.total_stamps ?? 8

                                                                const cardBg = isCurrentBranch ? '#F0F9FF' : '#FAF5FF'
                                                                const cardBorder = isCurrentBranch ? '1.5px solid var(--firstloop-primary, #0E88B8)' : '1.5px solid #8B5CF6'
                                                                const badgeBg = isCurrentBranch ? 'var(--firstloop-primary, #0E88B8)' : '#7C3AED'
                                                                const stampIconColor = isCurrentBranch ? 'var(--firstloop-primary, #0E88B8)' : '#7C3AED'

                                                                return (
                                                                    <div
                                                                        key={sc.id || idx}
                                                                        style={{
                                                                            padding: '8px 10px',
                                                                            borderRadius: 8,
                                                                            background: cardBg,
                                                                            border: cardBorder,
                                                                            transition: 'all 0.15s ease',
                                                                            display: 'flex',
                                                                            flexDirection: 'column',
                                                                            gap: 4,
                                                                            boxShadow: isCurrentBranch
                                                                                ? '0 2px 6px rgba(14, 136, 184, 0.08)'
                                                                                : '0 2px 6px rgba(139, 92, 246, 0.08)'
                                                                        }}
                                                                    >
                                                                        {/* Card Title & Branch Badge Row */}
                                                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, flex: 1 }}>
                                                                                <i className="fas fa-stamp" style={{ fontSize: '0.75rem', color: stampIconColor, flexShrink: 0 }} />
                                                                                <span
                                                                                    title={sc.title || 'Stamp Card'}
                                                                                    style={{
                                                                                        fontWeight: 700,
                                                                                        fontSize: '0.8rem',
                                                                                        color: 'var(--text-primary, #0F172A)',
                                                                                        whiteSpace: 'nowrap',
                                                                                        overflow: 'hidden',
                                                                                        textOverflow: 'ellipsis'
                                                                                    }}
                                                                                >
                                                                                    {sc.title || 'Stamp Card'}
                                                                                </span>
                                                                            </div>

                                                                            {sc.branch_name && (
                                                                                <span
                                                                                    title={`Branch: ${sc.branch_name} (${isCurrentBranch ? 'This Branch' : 'Other Branch'})`}
                                                                                    style={{
                                                                                        display: 'inline-flex',
                                                                                        alignItems: 'center',
                                                                                        gap: 4,
                                                                                        padding: '2px 7px',
                                                                                        borderRadius: 6,
                                                                                        background: badgeBg,
                                                                                        color: '#FFFFFF',
                                                                                        border: `1px solid ${badgeBg}`,
                                                                                        fontSize: '0.68rem',
                                                                                        fontWeight: 700,
                                                                                        whiteSpace: 'nowrap',
                                                                                        flexShrink: 0
                                                                                    }}
                                                                                >
                                                                                    <i className={isCurrentBranch ? "fas fa-store" : "fas fa-map-marker-alt"} style={{ fontSize: '0.62rem' }} />
                                                                                    {sc.branch_name}
                                                                                </span>
                                                                            )}
                                                                        </div>

                                                                        {/* Card Number & Stamps Meta Row */}
                                                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginTop: 1 }}>
                                                                            {sc.card_number ? (
                                                                                <div
                                                                                    onClick={() => {
                                                                                        navigator.clipboard.writeText(sc.card_number)
                                                                                        toast.success(`Copied: ${sc.card_number}`)
                                                                                    }}
                                                                                    title="Click to copy Card Number"
                                                                                    style={{
                                                                                        display: 'inline-flex',
                                                                                        alignItems: 'center',
                                                                                        gap: 4,
                                                                                        cursor: 'pointer',
                                                                                        fontSize: '0.68rem',
                                                                                        fontFamily: 'monospace',
                                                                                        fontWeight: 600,
                                                                                        color: 'var(--text-muted, #64748B)',
                                                                                        background: '#FFFFFF',
                                                                                        border: '1px solid #E2E8F0',
                                                                                        borderRadius: 4,
                                                                                        padding: '1px 5px'
                                                                                    }}
                                                                                >
                                                                                    <span>#{sc.card_number}</span>
                                                                                    <i className="far fa-copy" style={{ fontSize: '0.6rem', opacity: 0.7 }} />
                                                                                </div>
                                                                            ) : <span />}

                                                                            <span
                                                                                style={{
                                                                                    fontSize: '0.68rem',
                                                                                    fontWeight: 700,
                                                                                    color: '#047857',
                                                                                    background: '#ECFDF5',
                                                                                    border: '1px solid #A7F3D0',
                                                                                    padding: '1px 6px',
                                                                                    borderRadius: 4,
                                                                                    display: 'inline-flex',
                                                                                    alignItems: 'center',
                                                                                    gap: 3
                                                                                }}
                                                                            >
                                                                                <i className="fas fa-check-circle" style={{ fontSize: '0.6rem' }} />
                                                                                {collected} / {total} stamps
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                )
                                                            })}
                                                        </div>

                                                        {/* Toggle button below cards when multiple and not expanded */}
                                                        {stampCards.length > 1 && !isExpanded && (
                                                            <button
                                                                type="button"
                                                                onClick={() => toggleExpandRow(cus.id)}
                                                                style={{
                                                                    background: 'rgba(14, 136, 184, 0.08)',
                                                                    border: '1px dashed rgba(14, 136, 184, 0.3)',
                                                                    borderRadius: 6,
                                                                    padding: '4px 8px',
                                                                    color: 'var(--firstloop-primary, #0E88B8)',
                                                                    fontSize: '0.73rem',
                                                                    fontWeight: 700,
                                                                    cursor: 'pointer',
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    gap: 5,
                                                                    width: '100%'
                                                                }}
                                                            >
                                                                <i className="fas fa-layer-group" style={{ fontSize: '0.68rem' }} />
                                                                <span>+{stampCards.length - 1} more card{stampCards.length - 1 > 1 ? 's' : ''} (click to view)</span>
                                                            </button>
                                                        )}

                                                        {/* Collapse button below cards when expanded */}
                                                        {stampCards.length > 1 && isExpanded && (
                                                            <button
                                                                type="button"
                                                                onClick={() => toggleExpandRow(cus.id)}
                                                                style={{
                                                                    background: '#F1F5F9',
                                                                    border: '1px solid #CBD5E1',
                                                                    borderRadius: 6,
                                                                    padding: '3px 8px',
                                                                    color: '#64748B',
                                                                    fontSize: '0.72rem',
                                                                    fontWeight: 700,
                                                                    cursor: 'pointer',
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    gap: 4,
                                                                    width: '100%'
                                                                }}
                                                            >
                                                                <i className="fas fa-chevron-up" style={{ fontSize: '0.65rem' }} />
                                                                <span>Show less</span>
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </td>

                                            {/* Actions */}
                                            <td style={{ padding: '14px 18px', textAlign: 'right', verticalAlign: 'top' }}>
                                                <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                                    <button
                                                        type="button"
                                                        className="btn firstloop-btn-primary btn-sm"
                                                        onClick={() => handleCheckInCustomer(cus)}
                                                        style={{
                                                            padding: '6px 12px',
                                                            borderRadius: 8,
                                                            fontWeight: 700,
                                                            fontSize: '0.76rem',
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: 4
                                                        }}
                                                        title="Check-In Customer"
                                                    >
                                                        <i className="fas fa-check-circle" />
                                                        <span>Check-In</span>
                                                    </button>
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
