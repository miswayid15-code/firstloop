import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from "react-hot-toast"
import API from '../../api.js'
import { formatImageUrl } from '../../services/cardService.js'
import QrScannerModal from './components/QrScannerModal.jsx'
import CustomerSearchModal from './components/CustomerSearchModal.jsx'

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
    const [selectedBranch, setSelectedBranch] = useState('all')
    const [loading, setLoading] = useState(false)
    const [expandedRows, setExpandedRows] = useState({})

    // Popup Modal States
    const [qrModalOpen, setQrModalOpen] = useState(false)
    const [searchModalOpen, setSearchModalOpen] = useState(false)
    const [selectedCustomerForCheckIn, setSelectedCustomerForCheckIn] = useState(null)

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1)
    const [rowsPerPage, setRowsPerPage] = useState(10)

    const fetchCustomers = async () => {
        setLoading(true)
        try {
            const res = await API.post('firstloop/customer/fetch-rep-customers', {
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

    // Extract dynamic unique branch list from customers and their cards
    const availableBranches = useMemo(() => {
        const branchMap = new Map()

        ;(customers || []).forEach(cus => {
            if (cus.branch_name) {
                const key = String(cus.branch_id || cus.branch_name).trim()
                if (key) branchMap.set(key, cus.branch_name)
            }
            if (Array.isArray(cus.cards)) {
                cus.cards.forEach(card => {
                    if (card.branch_name) {
                        const key = String(card.branch_id || card.branch_name).trim()
                        if (key) branchMap.set(key, card.branch_name)
                    }
                })
            }
        })

        // Include receptionist's active branch if available
        const recBranchName = receptionist?.user_branch || receptionist?.branch_name || receptionist?.user_branch_name
        const recBranchId = receptionist?.user_branch_id || receptionist?.branch_id
        if (recBranchName) {
            const key = String(recBranchId || recBranchName).trim()
            if (key && !branchMap.has(key)) {
                branchMap.set(key, recBranchName)
            }
        }

        return Array.from(branchMap.entries())
            .map(([id, name]) => ({ id, name }))
            .sort((a, b) => a.name.localeCompare(b.name))
    }, [customers, receptionist])

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
                    (card.branch_name && card.branch_name.toLowerCase().includes(searchLower))
                ))

            if (!matchesSearch) return false

            // Branch filter
            if (selectedBranch !== 'all') {
                const matchesBranch =
                    String(c.branch_id || '') === String(selectedBranch) ||
                    String(c.branch_name || '').toLowerCase() === String(selectedBranch).toLowerCase() ||
                    (Array.isArray(c.cards) && c.cards.some(card =>
                        String(card.branch_id || '') === String(selectedBranch) ||
                        String(card.branch_name || '').toLowerCase() === String(selectedBranch).toLowerCase()
                    ))

                if (!matchesBranch) return false
            }

            return true
        })
    }, [customers, search, selectedBranch])

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

    const toggleExpandRow = (cusId) => {
        setExpandedRows(prev => ({
            ...prev,
            [cusId]: !prev[cusId]
        }))
    }

    return (
        <div style={{ paddingBottom: 40 }}>
            {/* Header */}
            <div className="mb-4 flex-between" style={{ flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.45rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                        Branch Customers Management
                    </h2>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>
                        Registered branch customers, assigned Stamp Passes, and quick check-in launcher.
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
                        onClick={() => setQrModalOpen(true)}
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
                        <span>Qr Scanner</span>
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="mb-4 card" style={{ padding: 16, borderRadius: 14, background: '#FFFFFF', border: '1px solid #E2E8F0', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                    {/* Search Input */}
                    <div style={{ position: 'relative', width: 320 }}>
                        <i className="fas fa-search" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Search by name, email, phone or card..."
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
                                    minWidth: 160,
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
                                    gap: 5
                                }}
                            >
                                <i className="fas fa-times" />
                                <span>Reset</span>
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
                                    colorScheme: 'light',
                                    cursor: 'pointer'
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
                    <table className="table mb-0 align-middle table-hover">
                        <thead style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                            <tr>
                                <th style={{ padding: '14px 18px', fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', width: '25%' }}>Customer Info</th>
                                <th style={{ padding: '14px 18px', fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', width: '22%' }}>Contact Details</th>
                                <th style={{ padding: '14px 18px', fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', width: '38%' }}>Assigned Stamp Cards</th>
                                <th style={{ padding: '14px 18px', fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right', width: '15%' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={4} style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-muted)' }}>
                                        <i className="fas fa-spinner fa-spin" style={{ fontSize: '1.5rem', marginBottom: 8, color: 'var(--firstloop-primary, #0E88B8)' }} />
                                        <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: 600 }}>Loading branch customers...</p>
                                    </td>
                                </tr>
                            ) : paginatedCustomers.length > 0 ? (
                                paginatedCustomers.map((cus) => {
                                    const stampCards = Array.isArray(cus.cards)
                                        ? cus.cards.filter(c => Number(c.card_type) === 1)
                                        : []

                                    const profileImg = cus.profile_image ? formatImageUrl(cus.profile_image) : null
                                    const joinDate = cus.created_at ? new Date(cus.created_at).toLocaleDateString() : null
                                    const isExpanded = !!expandedRows[cus.id]

                                     // Sort cards so that is_branch: 1 cards or selected branch cards appear first
                                     const sortedStampCards = [...stampCards].sort((a, b) => {
                                         if (selectedBranch !== 'all') {
                                             const aMatch = String(a.branch_id || '') === String(selectedBranch) || String(a.branch_name || '').toLowerCase() === String(selectedBranch).toLowerCase()
                                             const bMatch = String(b.branch_id || '') === String(selectedBranch) || String(b.branch_name || '').toLowerCase() === String(selectedBranch).toLowerCase()
                                             if (aMatch !== bMatch) return (bMatch ? 1 : 0) - (aMatch ? 1 : 0)
                                         }
                                         const aBranch = Number(a.is_branch) === 1 ? 1 : 0
                                         const bBranch = Number(b.is_branch) === 1 ? 1 : 0
                                         return bBranch - aBranch
                                     })

                                     // If not expanded, show only top 1 card; if expanded, show all
                                     const cardsToDisplay = isExpanded ? sortedStampCards : sortedStampCards.slice(0, 1)

                                     return (
                                         <tr key={cus.id}>
                                             {/* Customer Info */}
                                             <td style={{ padding: '14px 18px', verticalAlign: 'top' }}>
                                                 <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                     {profileImg ? (
                                                         <img
                                                             src={profileImg}
                                                             alt={cus.name || 'Customer'}
                                                             style={{
                                                                 width: 40,
                                                                 height: 40,
                                                                 borderRadius: '50%',
                                                                 objectFit: 'cover',
                                                                 border: '2px solid var(--firstloop-primary, #0E88B8)',
                                                                 flexShrink: 0
                                                             }}
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
                                                         {joinDate && (
                                                             <small style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                                                 Joined: {joinDate}
                                                             </small>
                                                         )}
                                                     </div>
                                                 </div>
                                             </td>

                                             {/* Contact Details */}
                                             <td style={{ padding: '14px 18px', verticalAlign: 'top' }}>
                                                 <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                                                     <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                         <i className="fas fa-envelope" style={{ color: 'var(--firstloop-primary, #0E88B8)', width: 14, textAlign: 'center' }} />
                                                         <span style={{ wordBreak: 'break-all' }}>{cus.email || '-'}</span>
                                                     </div>
                                                     <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                         <i className="fas fa-phone" style={{ color: 'var(--firstloop-primary, #0E88B8)', width: 14, textAlign: 'center' }} />
                                                         <span>{cus.country_code ? `+${cus.country_code} ` : ''}{cus.phone || '-'}</span>
                                                     </div>
                                                 </div>
                                             </td>

                                             {/* Assigned Stamp Cards */}
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
                                                                 // If is_branch is 1 use Color 1 (Cyan/Primary); if not 1 use Color 2 (Purple/Violet)
                                                                 const isCurrentBranch = Number(sc.is_branch) === 1
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
                                                        onClick={() => {
                                                            setSelectedCustomerForCheckIn(cus)
                                                            setSearchModalOpen(true)
                                                        }}
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
                                    <td colSpan={4} style={{ textAlign: 'center', padding: 36, color: 'var(--text-muted)' }}>
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

            {/* QR Scanner Popup Modal */}
            <QrScannerModal
                isOpen={qrModalOpen}
                onClose={() => setQrModalOpen(false)}
                onSuccess={() => fetchCustomers()}
            />

            {/* Phone/Customer Search Check-In Popup Modal */}
            <CustomerSearchModal
                isOpen={searchModalOpen}
                onClose={() => {
                    setSearchModalOpen(false)
                    setSelectedCustomerForCheckIn(null)
                }}
                initialCustomer={selectedCustomerForCheckIn}
                onSuccess={() => fetchCustomers()}
                branchId={branchId}
            />
        </div>
    )
}
