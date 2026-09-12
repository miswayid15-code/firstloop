import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import API from '../../../api.js'
import CustomerCard from '../../../components/CustomerCard.jsx'
import CustomerCardHistory from '../../../components/CustomerCardHistory.jsx'
import { fetchCustomerStampLevelsApi } from '../../../services/cardService.js'

const formatExpiryDate = (val) => {
    if (!val) return null
    try {
        const d = new Date(val)
        if (isNaN(d.getTime())) return String(val)
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    } catch {
        return String(val)
    }
}

export default function CustomerSearchModal({
    isOpen,
    onClose,
    initialCustomer = null,
    initialQuery = '',
    onSuccess,
    branchId = ''
}) {
    const navigate = useNavigate()
    const location = useLocation()
    const isMerchant = location.pathname.includes('/merchant')
    let receptionist = {}
    try {
        const rawReceptionist = localStorage.getItem("receptionist_data")
        if (rawReceptionist && rawReceptionist !== "null" && rawReceptionist !== "undefined") {
            receptionist = JSON.parse(rawReceptionist) || {}
        }
    } catch (e) {
        console.error("Error parsing receptionist_data:", e)
    }

    const [customers, setCustomers] = useState([])
    const [loadingCustomers, setLoadingCustomers] = useState(false)
    const [searchQuery, setSearchQuery] = useState(initialQuery || '')
    const [selectedCustomer, setSelectedCustomer] = useState(null)
    const [selectedCustomerBranch, setSelectedCustomerBranch] = useState('all')
    const [selectedCard, setSelectedCard] = useState(null)
    const [selectedCardDetails, setSelectedCardDetails] = useState(null)
    const [loadingCardDetails, setLoadingCardDetails] = useState(false)
    const [paymentMethod, setPaymentMethod] = useState('Cash')
    const [paymentAmount, setPaymentAmount] = useState('0.00')
    const [submittingCheckIn, setSubmittingCheckIn] = useState(false)
    const [historyModalOpen, setHistoryModalOpen] = useState(false)
    const [lastReceipt, setLastReceipt] = useState(null)

    const effectiveBranchId = branchId || receptionist?.user_branch_id || ''

    // Fetch customer list when modal opens
    const fetchCustomers = async () => {
        setLoadingCustomers(true)
        try {
            const res = await API.post('firstloop/customer/fetch-rep-customers', {
                br_id: effectiveBranchId
            })
            if (res?.data?.status == 1 && Array.isArray(res.data.data)) {
                setCustomers(res.data.data)
            } else {
                setCustomers([])
            }
        } catch (err) {
            console.error("Error loading customers for search modal:", err)
        } finally {
            setLoadingCustomers(false)
        }
    }

    // Refresh active card details to reflect updated stamps/levels
    const refreshCardDetails = async (cardId, cardType, customerId) => {
        if (!cardId || !customerId) return
        setLoadingCardDetails(true)
        try {
            const data = await fetchCustomerStampLevelsApi(cardId, cardType, customerId)
            if (data) {
                const totalStamps = Number(data.total_stamps || 8)
                const collected = Number(data.current_stamp ?? data.collected ?? 0)
                const isCompleted = Number(data.is_completed) === 1 || collected >= totalStamps
                const amt = isCompleted ? '0.00' : Number(data?.overAll_amt ?? data?.current_amt ?? 0).toFixed(2)
                setSelectedCardDetails(data)
                setPaymentAmount(amt)
            }
        } catch (err) {
            console.error("Error refreshing card details:", err)
        } finally {
            setLoadingCardDetails(false)
        }
    }

    useEffect(() => {
        if (isOpen) {
            fetchCustomers()
            setLastReceipt(null)
            if (initialCustomer) {
                selectCustomer(initialCustomer)
            } else if (initialQuery) {
                setSearchQuery(initialQuery)
                setSelectedCustomer(null)
                setSelectedCard(null)
            } else {
                setSelectedCustomer(null)
                setSelectedCard(null)
                setSearchQuery('')
            }
        } else {
            setSelectedCustomer(null)
            setSelectedCard(null)
            setSelectedCardDetails(null)
            setSearchQuery('')
            setLastReceipt(null)
            setHistoryModalOpen(false)
        }
    }, [isOpen, initialCustomer, initialQuery])

    // Load card details when selectedCard changes
    useEffect(() => {
        if (!selectedCard?.id || !selectedCustomer?.id) {
            setSelectedCardDetails(null)
            return
        }

        let isMounted = true
        const loadCardDetails = async () => {
            setLoadingCardDetails(true)
            try {
                const data = await fetchCustomerStampLevelsApi(
                    selectedCard.id,
                    selectedCard.card_type,
                    selectedCustomer.id
                )
                if (isMounted) {
                    setSelectedCardDetails(data || selectedCard)
                    const amt = Number(data?.overAll_amt ?? data?.current_amt ?? selectedCard?.amount ?? 0).toFixed(2)
                    setPaymentAmount(amt)
                }
            } catch (err) {
                console.error("Error loading card details:", err)
                if (isMounted) setSelectedCardDetails(selectedCard)
            } finally {
                if (isMounted) setLoadingCardDetails(false)
            }
        }
        loadCardDetails()
        return () => { isMounted = false }
    }, [selectedCard?.id, selectedCustomer?.id])

    // Discover branches across the selected customer's cards
    const customerBranches = useMemo(() => {
        if (!selectedCustomer || !Array.isArray(selectedCustomer.cards)) return []
        const map = new Map()
        selectedCustomer.cards.forEach(c => {
            const bName = c.branch_name || c.branch || 'Main Branch'
            const bId = String(c.branch_id || bName)
            if (!map.has(bId)) {
                map.set(bId, { id: bId, name: bName, count: 0 })
            }
            map.get(bId).count++
        })
        return Array.from(map.values())
    }, [selectedCustomer])

    // Cards filtered by selected branch
    const branchCards = useMemo(() => {
        if (!selectedCustomer || !Array.isArray(selectedCustomer.cards)) return []
        if (selectedCustomerBranch === 'all') return selectedCustomer.cards
        return selectedCustomer.cards.filter(c =>
            String(c.branch_id || c.branch_name || '') === String(selectedCustomerBranch) ||
            String(c.branch_name || '').toLowerCase() === String(selectedCustomerBranch).toLowerCase()
        )
    }, [selectedCustomer, selectedCustomerBranch])

    // Live search filter
    const searchResults = useMemo(() => {
        const query = searchQuery.trim().toLowerCase()
        if (!query) return []

        const queryDigits = query.replace(/\D/g, '')

        return (customers || []).filter(c => {
            const name = (c.name || '').toLowerCase()
            const email = (c.email || '').toLowerCase()
            const phone = String(c.phone || '')
            const phoneDigits = phone.replace(/\D/g, '')

            const cardMatch = Array.isArray(c.cards) && c.cards.some(card =>
                (card.title && card.title.toLowerCase().includes(query)) ||
                (card.card_number && card.card_number.toLowerCase().includes(query)) ||
                (card.branch_name && card.branch_name.toLowerCase().includes(query))
            )

            return (
                name.includes(query) ||
                email.includes(query) ||
                phone.includes(query) ||
                (queryDigits.length >= 2 && phoneDigits.includes(queryDigits)) ||
                cardMatch
            )
        })
    }, [searchQuery, customers])

    const selectCustomer = (cus) => {
        setSelectedCustomer(cus)
        setSearchQuery(cus.name || cus.phone || '')
        setLastReceipt(null)

        const cards = Array.isArray(cus.cards) ? cus.cards : []

        // Auto-select branch matching receptionist's branch if possible, else 'all'
        const recBranchName = receptionist?.user_branch || receptionist?.branch_name
        const recBranchId = receptionist?.user_branch_id || receptionist?.branch_id
        const matchingBranch = cards.find(c =>
            (recBranchId && String(c.branch_id) === String(recBranchId)) ||
            (recBranchName && String(c.branch_name).toLowerCase() === String(recBranchName).toLowerCase())
        )

        if (matchingBranch) {
            const bId = String(matchingBranch.branch_id || matchingBranch.branch_name)
            setSelectedCustomerBranch(bId)
            setSelectedCard(matchingBranch)
        } else {
            setSelectedCustomerBranch('all')
            setSelectedCard(cards.length > 0 ? cards[0] : null)
        }
    }

    const handleConfirmCheckIn = async (e) => {
        if (e && e.preventDefault) e.preventDefault()

        if (!selectedCustomer || !selectedCard) {
            toast.error("Please select a customer and card pass")
            return
        }

        const isStamp = Number(selectedCard.card_type) === 1
        const totalStamps = Number(selectedCardDetails?.total_stamps || selectedCardDetails?.number_of_stamps || selectedCard?.total_stamps || 8)
        const currentCollected = Number(selectedCardDetails?.current_stamp ?? selectedCardDetails?.current_stamps ?? selectedCard?.current_stamp ?? selectedCard?.collected ?? 0)

        if (isStamp && currentCollected >= totalStamps) {
            toast.error("This stamp card is already fully completed!")
            return
        }

        setSubmittingCheckIn(true)
        try {
            if (isStamp) {
                const stampLevelId = Number(
                    selectedCardDetails?.stamp_level_id ||
                    selectedCardDetails?.CustomerStampLevels?.[currentCollected]?.id ||
                    selectedCardDetails?.levelRewards?.[currentCollected]?.id ||
                    selectedCardDetails?.stamp_levels?.[currentCollected]?.id ||
                    0
                )

                const payload = {
                    cus_id: Number(selectedCustomer.id),
                    card_id: Number(selectedCard.id),
                    payment_type: paymentMethod === 'Online' ? 2 : 1,
                    amount: parseFloat(paymentAmount) || 0,
                    stamp_level_id: stampLevelId
                }

                const res = await API.post('firstloop/customer/stamp-paid', payload)

                if (res?.data?.status == 1) {
                    const newStamps = currentCollected + 1
                    toast.success(res.data.message || "Stamp payment entry logged successfully! 🚀")

                    const activeReward = selectedCardDetails?.CustomerStampLevels?.[currentCollected] || selectedCardDetails?.levelRewards?.[currentCollected] || selectedCardDetails?.stamp_levels?.[currentCollected]
                    const earnedFreePerk = (Number(selectedCardDetails?.free_stamp) === 1 || Number(activeReward?.free_stamp) === 1 || Boolean(selectedCardDetails?.free_text) || Boolean(activeReward?.free_text))
                        ? (selectedCardDetails?.free_text || activeReward?.free_text || 'Free Perk')
                        : null

                    const receipt = {
                        receiptId: res.data.receipt_id || `RCP-${Date.now().toString().slice(-6)}`,
                        customerName: selectedCustomer.name || 'Customer',
                        cardTitle: selectedCard.title || selectedCardDetails?.title || 'Stamp Pass',
                        previousStamps: currentCollected,
                        newStamps: newStamps,
                        totalStamps: totalStamps,
                        paymentMethod: paymentMethod,
                        paymentAmount: `${parseFloat(paymentAmount).toFixed(2)}`,
                        freePerk: earnedFreePerk,
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    }

                    // DO NOT CLOSE MODAL: keep modal open and refresh card details live!
                    setLastReceipt(receipt)

                    // Refresh card details so new stamp fills in live on card preview & progress circles
                    await refreshCardDetails(selectedCard.id, selectedCard.card_type, selectedCustomer.id)

                    // Notify parent to refresh background lists
                    if (onSuccess) onSuccess()
                } else {
                    toast.error(res?.data?.message || "Failed to log stamp entry")
                }
            } else {
                // Membership Daily Check-In
                toast.success("Membership Check-In Validated! 👑")
                const receipt = {
                    receiptId: `MBR-${Date.now().toString().slice(-6)}`,
                    customerName: selectedCustomer.name || 'Customer',
                    cardTitle: selectedCard.title || 'Membership Pass',
                    paymentMethod: 'Daily Check-In Validated',
                    paymentAmount: '0.00',
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }
                setLastReceipt(receipt)
                if (onSuccess) onSuccess()
            }
        } catch (err) {
            console.error("Check-In submission error:", err)
            toast.error(err?.response?.data?.message || "Failed to process check-in")
        } finally {
            setSubmittingCheckIn(false)
        }
    }

    if (!isOpen) return null

    const isStampCard = Number(selectedCard?.card_type) === 1
    const totalStamps = Number(selectedCardDetails?.total_stamps || selectedCardDetails?.number_of_stamps || selectedCard?.total_stamps || 8)
    const collectedStamps = Number(selectedCardDetails?.current_stamp ?? selectedCardDetails?.current_stamps ?? selectedCard?.current_stamp ?? selectedCard?.collected ?? 0)
    const isCardDone = Number(selectedCardDetails?.is_completed) === 1 || Number(selectedCard?.is_completed) === 1 || collectedStamps >= totalStamps
    const isCompleted = isStampCard && isCardDone
    const remainingStamps = Math.max(0, totalStamps - collectedStamps)

    const handleAddNewCard = () => {
        const bId = effectiveBranchId || branchId || receptionist?.user_branch_id || ''
        const emailQuery = selectedCustomer?.email ? `?email=${encodeURIComponent(selectedCustomer.email)}` : ''
        if (onClose) onClose()
        if (isMerchant) {
            navigate(`/merchant/add-card-customer/${bId}${emailQuery}`)
        } else {
            navigate(`/receptionist/add-card-customer/${bId}${emailQuery}`)
        }
    }

    // Merge card data with customer details to ensure full preview display
    const cardForPreview = {
        ...(selectedCard || {}),
        ...(selectedCardDetails || {}),
        expires_at: selectedCardDetails?.expires_at || selectedCard?.expires_at || null,
        expiry: selectedCardDetails?.expires_at || selectedCard?.expires_at || selectedCardDetails?.expiry || selectedCard?.expiry || null,
        customer_name: selectedCustomer?.name || selectedCardDetails?.customer_name || selectedCard?.customer_name || 'Customer',
        name: selectedCustomer?.name || selectedCardDetails?.name || selectedCard?.name || 'Customer'
    }

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 1060,
                background: 'rgba(15, 23, 42, 0.75)',
                backdropFilter: 'blur(5px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 16
            }}
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose()
            }}
        >
            <div
                style={{
                    background: '#FFFFFF',
                    borderRadius: 20,
                    width: '100%',
                    maxWidth: 1080,
                    maxHeight: '94vh',
                    overflowY: 'auto',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    border: '1px solid #E2E8F0',
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                {/* Modal Top Header */}
                <div
                    style={{
                        padding: '16px 24px',
                        borderBottom: '1px solid #E2E8F0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: '#F8FAFC',
                        flexWrap: 'wrap',
                        gap: 12
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div
                            style={{
                                width: 40,
                                height: 40,
                                borderRadius: 12,
                                background: 'var(--firstloop-primary-light, #E6F2FA)',
                                color: 'var(--firstloop-primary, #0E88B8)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.15rem'
                            }}
                        >
                            <i className="fas fa-desktop" />
                        </div>
                        <div>
                            <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 800, color: 'var(--text-muted)' }}>
                                CARD ENTRY &amp; PAYMENT TERMINAL
                            </span>
                            <h4 style={{ margin: '2px 0 0 0', fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                                {selectedCard ? (isStampCard ? 'Stamp Card Payment & Entry Update' : 'Membership Daily Check-In Entry') : 'Customer Search & Check-In'}
                            </h4>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {selectedCard && (isCompleted || remainingStamps <= 4 || Number(selectedCard?.is_completed) === 1) && (
                            <button
                                type="button"
                                className="btn btn-sm btn-primary"
                                onClick={handleAddNewCard}
                                style={{
                                    borderRadius: 10,
                                    fontWeight: 700,
                                    fontSize: '0.82rem',
                                    padding: '7px 14px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 6
                                }}
                            >
                                <i className="fas fa-plus-circle" />
                                <span>Add New Card</span>
                            </button>
                        )}

                        {selectedCard && (
                            <button
                                type="button"
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => setHistoryModalOpen(true)}
                                style={{
                                    borderRadius: 10,
                                    fontWeight: 700,
                                    fontSize: '0.82rem',
                                    padding: '7px 14px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 6
                                }}
                            >
                                <i className="fas fa-history" />
                                <span>View Card History</span>
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#94A3B8',
                                fontSize: '1.25rem',
                                cursor: 'pointer',
                                padding: 4,
                                lineHeight: 1
                            }}
                        >
                            <i className="fas fa-times" />
                        </button>
                    </div>
                </div>

                {/* Sub-Header: Search & Customer Selection Bar */}
                <div style={{ padding: '14px 24px', background: '#FFFFFF', borderBottom: '1px solid #F1F5F9' }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                        {/* Search Input */}
                        <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
                            <i
                                className="fas fa-search"
                                style={{
                                    position: 'absolute',
                                    left: 14,
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: '#94A3B8'
                                }}
                            />
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Search customer by phone number, name, email or pass..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value)
                                    if (selectedCustomer) setSelectedCustomer(null)
                                }}
                                style={{
                                    paddingLeft: 40,
                                    paddingRight: selectedCustomer ? 40 : 14,
                                    height: 40,
                                    borderRadius: 10,
                                    fontSize: '0.86rem'
                                }}
                                autoFocus={!initialCustomer}
                            />
                            {selectedCustomer && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedCustomer(null)
                                        setSelectedCard(null)
                                        setSearchQuery('')
                                        setLastReceipt(null)
                                    }}
                                    title="Search another customer"
                                    style={{
                                        position: 'absolute',
                                        right: 12,
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none',
                                        border: 'none',
                                        color: '#94A3B8',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <i className="fas fa-times" />
                                </button>
                            )}
                        </div>

                        {selectedCustomer && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F8FAFC', padding: '6px 14px', borderRadius: 10, border: '1px solid #E2E8F0' }}>
                                <div
                                    style={{
                                        width: 28,
                                        height: 28,
                                        borderRadius: '50%',
                                        background: 'var(--firstloop-primary-light, #E6F2FA)',
                                        color: 'var(--firstloop-primary, #0E88B8)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: 800,
                                        fontSize: '0.75rem'
                                    }}
                                >
                                    {selectedCustomer.name ? selectedCustomer.name.charAt(0).toUpperCase() : 'C'}
                                </div>
                                <div>
                                    <strong style={{ fontSize: '0.84rem', color: '#0F172A', display: 'block', lineHeight: 1.2 }}>
                                        {selectedCustomer.name || 'Customer'}
                                    </strong>
                                    <small style={{ fontSize: '0.72rem', color: '#64748B' }}>
                                        {selectedCustomer.phone || selectedCustomer.email || '-'}
                                    </small>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Live Search Dropdown results if searching and not selected */}
                    {!selectedCustomer && searchQuery.trim().length > 0 && (
                        <div
                            style={{
                                border: '1px solid #E2E8F0',
                                borderRadius: 12,
                                maxHeight: 200,
                                overflowY: 'auto',
                                marginTop: 10,
                                boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                                background: '#FFFFFF'
                            }}
                        >
                            {searchResults.length > 0 ? (
                                searchResults.map((cus) => (
                                    <div
                                        key={cus.id}
                                        onClick={() => selectCustomer(cus)}
                                        style={{
                                            padding: '10px 14px',
                                            borderBottom: '1px solid #F1F5F9',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            transition: 'background 0.15s ease'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = '#F8FAFC'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = '#FFFFFF'}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <div
                                                style={{
                                                    width: 32,
                                                    height: 32,
                                                    borderRadius: '50%',
                                                    background: 'var(--firstloop-primary-light, #E6F2FA)',
                                                    color: 'var(--firstloop-primary, #0E88B8)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontWeight: 700,
                                                    fontSize: '0.8rem'
                                                }}
                                            >
                                                {cus.name ? cus.name.charAt(0).toUpperCase() : 'C'}
                                            </div>
                                            <div>
                                                <strong style={{ fontSize: '0.88rem', color: '#0F172A', display: 'block' }}>
                                                    {cus.name || 'Customer'}
                                                </strong>
                                                <small style={{ fontSize: '0.74rem', color: '#64748B' }}>
                                                    {cus.phone ? `+${cus.phone} ` : ''} {cus.email ? `• ${cus.email}` : ''}
                                                </small>
                                            </div>
                                        </div>
                                        <span style={{ fontSize: '0.74rem', color: 'var(--firstloop-primary, #0E88B8)', fontWeight: 700 }}>
                                            Select Pass &rarr;
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <div style={{ padding: '16px', textAlign: 'center', color: '#94A3B8', fontSize: '0.84rem' }}>
                                    No customers found matching &quot;{searchQuery}&quot;
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Body Content */}
                <div style={{ padding: '24px' }}>
                    {/* DISMISSABLE SUCCESS RECEIPT BANNER (Keeps modal open!) */}
                    {lastReceipt && (
                        <div
                            style={{
                                background: '#ECFDF5',
                                border: '1.5px solid #10B981',
                                borderRadius: 14,
                                padding: '14px 18px',
                                marginBottom: 20,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: 12,
                                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.12)'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div
                                    style={{
                                        width: 38,
                                        height: 38,
                                        borderRadius: '50%',
                                        background: '#10B981',
                                        color: '#FFFFFF',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '1.1rem',
                                        flexShrink: 0
                                    }}
                                >
                                    <i className="fas fa-check" />
                                </div>
                                <div>
                                    <strong style={{ fontSize: '0.92rem', color: '#065F46', display: 'block' }}>
                                        Check-In &amp; Stamp Entry Logged Successfully! 🎉
                                    </strong>
                                    <span style={{ fontSize: '0.8rem', color: '#047857' }}>
                                         {lastReceipt.paymentAmount} ({lastReceipt.paymentMethod})
                                        {lastReceipt.newStamps !== undefined && ` • Updated Progress: ${lastReceipt.newStamps}/${lastReceipt.totalStamps} Stamps`}
                                        {lastReceipt.freePerk && ` • 🎁 Unlocked Free Perk: ${lastReceipt.freePerk}`}
                                    </span>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => setLastReceipt(null)}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#059669',
                                    cursor: 'pointer',
                                    fontSize: '1rem',
                                    padding: 4
                                }}
                            >
                                <i className="fas fa-times" />
                            </button>
                        </div>
                    )}

                    {!selectedCustomer ? (
                        /* Empty State when no customer is selected yet */
                        <div style={{ textAlign: 'center', padding: '50px 20px', color: '#94A3B8' }}>
                            <div
                                style={{
                                    width: 60,
                                    height: 60,
                                    borderRadius: '50%',
                                    background: '#F1F5F9',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '1.6rem',
                                    color: '#94A3B8',
                                    margin: '0 auto 14px'
                                }}
                            >
                                <i className="fas fa-search" />
                            </div>
                            <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#334155', marginBottom: 4 }}>
                                Find Customer to Check-In
                            </h4>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748B' }}>
                                Type a phone number, customer name or scan pass code to load their digital pass card.
                            </p>
                        </div>
                    ) : (
                        <div>
                            {/* BRANCH SELECTOR: User can choose branch to see cards of that branch */}
                            {customerBranches.length > 0 && (
                                <div style={{ marginBottom: 18, background: '#F8FAFC', padding: '12px 16px', borderRadius: 14, border: '1px solid #E2E8F0' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
                                        <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                            <i className="fas fa-store-alt" style={{ color: 'var(--firstloop-primary, #0E88B8)' }} />
                                            Choose Branch to View Stamp Card:
                                        </span>
                                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                            Customer enrolled in {customerBranches.length} branch{customerBranches.length > 1 ? 'es' : ''}
                                        </span>
                                    </div>

                                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedCustomerBranch('all')}
                                            style={{
                                                padding: '6px 14px',
                                                borderRadius: 10,
                                                fontSize: '0.78rem',
                                                fontWeight: 700,
                                                border: selectedCustomerBranch === 'all' ? '1.5px solid var(--firstloop-primary, #0E88B8)' : '1px solid #CBD5E1',
                                                background: selectedCustomerBranch === 'all' ? 'var(--firstloop-primary-light, #E6F2FA)' : '#FFFFFF',
                                                color: selectedCustomerBranch === 'all' ? 'var(--firstloop-primary, #0E88B8)' : '#475569',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            All Cards ({selectedCustomer.cards?.length || 0})
                                        </button>

                                        {customerBranches.map(b => {
                                            const isCurrent = selectedCustomerBranch === b.id || selectedCustomerBranch === b.name
                                            return (
                                                <button
                                                    key={b.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedCustomerBranch(b.id)
                                                        // Automatically select first card of this branch
                                                        const matching = selectedCustomer.cards?.find(c =>
                                                            String(c.branch_id || c.branch_name) === String(b.id) ||
                                                            c.branch_name === b.name
                                                        )
                                                        if (matching) setSelectedCard(matching)
                                                    }}
                                                    style={{
                                                        padding: '6px 14px',
                                                        borderRadius: 10,
                                                        fontSize: '0.78rem',
                                                        fontWeight: 700,
                                                        border: isCurrent ? '1.5px solid var(--firstloop-primary, #0E88B8)' : '1px solid #CBD5E1',
                                                        background: isCurrent ? 'var(--firstloop-primary-light, #E6F2FA)' : '#FFFFFF',
                                                        color: isCurrent ? 'var(--firstloop-primary, #0E88B8)' : '#475569',
                                                        cursor: 'pointer',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: 6
                                                    }}
                                                >
                                                    <i className="fas fa-map-marker-alt" style={{ fontSize: '0.7rem' }} />
                                                    <span>{b.name}</span>
                                                    <span style={{ fontSize: '0.68rem', opacity: 0.85, background: isCurrent ? 'rgba(14, 136, 184, 0.2)' : '#F1F5F9', padding: '1px 6px', borderRadius: 8 }}>
                                                        {b.count}
                                                    </span>
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* CARDS LIST FOR CHOSEN BRANCH */}
                            {branchCards.length > 1 && (
                                <div style={{ marginBottom: 18 }}>
                                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>
                                        Select Card Pass:
                                    </span>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
                                        {branchCards.map(card => {
                                            const isSelected = selectedCard?.id === card.id
                                            const isStamp = Number(card.card_type) === 1
                                            const tot = Number(card.number_of_stamps || card.total_stamps || 8)
                                            const col = Number(card.current_stamp ?? card.collected ?? 0)
                                            const isCardDone = Number(card.is_completed ?? (isStamp && col >= tot ? 1 : 0)) === 1

                                            return (
                                                <div
                                                    key={card.id}
                                                    onClick={() => setSelectedCard(card)}
                                                    style={{
                                                        padding: '12px 14px',
                                                        borderRadius: 12,
                                                        border: isSelected ? '2px solid var(--firstloop-primary, #0E88B8)' : '1px solid #E2E8F0',
                                                        background: isSelected ? 'var(--firstloop-primary-light, #E6F2FA)' : '#FFFFFF',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.15s ease',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        gap: 4
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '2px 7px', borderRadius: 6, background: isCardDone ? '#10B981' : (isStamp ? 'var(--firstloop-primary, #0E88B8)' : '#D97706'), color: '#FFFFFF' }}>
                                                            {isCardDone ? 'COMPLETED' : (isStamp ? 'STAMP CARD' : 'MEMBERSHIP')}
                                                        </span>
                                                        {card.branch_name && (
                                                            <span style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: 600 }}>
                                                                <i className="fas fa-map-marker-alt" style={{ marginRight: 3 }} />
                                                                {card.branch_name}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <strong style={{ fontSize: '0.88rem', color: 'var(--text-primary)', marginTop: 2 }}>
                                                        {card.title || 'Stamp Card'}
                                                    </strong>

                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                                                        <small style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                                                            #{card.card_number || card.id}
                                                        </small>
                                                        {isStamp && (
                                                            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: isCardDone ? '#059669' : 'var(--firstloop-primary, #0E88B8)' }}>
                                                                {col}/{tot} Stamps
                                                            </span>
                                                        )}
                                                    </div>

                                                    {(card.expires_at || card.expiry) && (
                                                        <div style={{ fontSize: '0.68rem', color: '#B45309', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                                                            <i className="far fa-calendar-alt" />
                                                            <span>Expires: {formatExpiryDate(card.expires_at || card.expiry)}</span>
                                                        </div>
                                                    )}

                                                    {isCardDone && (
                                                        <div style={{ marginTop: 6, display: 'flex', justifyContent: 'flex-end' }}>
                                                            <button
                                                                type="button"
                                                                className="btn btn-xs btn-outline-primary"
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    handleAddNewCard()
                                                                }}
                                                                style={{
                                                                    fontSize: '0.72rem',
                                                                    padding: '3px 8px',
                                                                    borderRadius: 6,
                                                                    fontWeight: 700,
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    gap: 4
                                                                }}
                                                            >
                                                                <i className="fas fa-plus-circle" />
                                                                <span>Add New Card</span>
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}

                            {!selectedCard ? (
                                <div style={{ textAlign: 'center', padding: '30px 20px', color: '#EF4444' }}>
                                    <i className="fas fa-exclamation-circle" style={{ fontSize: '1.8rem', marginBottom: 8, display: 'block' }} />
                                    <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem' }}>
                                        No cards found for this branch selection.
                                    </p>
                                </div>
                            ) : (
                                /* UNIFIED TERMINAL CARD PANEL: MATCHING CardCheckInPayment.jsx SCREENSHOT */
                                <div
                                    style={{
                                        border: '1.5px solid #CBD5E1',
                                        borderRadius: 20,
                                        padding: 24,
                                        background: '#FFFFFF',
                                        boxShadow: '0 8px 24px rgba(0,0,0,0.04)'
                                    }}
                                >
                                    {/* Top Status Bar: Card Number, Remaining Stamps & Collected Progress */}
                                    <div
                                        style={{
                                            background: '#F0F9FF',
                                            border: '1px solid #BAE6FD',
                                            borderRadius: 12,
                                            padding: '12px 18px',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            flexWrap: 'wrap',
                                            gap: 12,
                                            marginBottom: 20
                                        }}
                                    >
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                                <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', fontWeight: 700, color: '#0369A1' }}>
                                                    CARD-{selectedCard.card_number || selectedCard.id}
                                                </span>
                                                {(selectedCard.expires_at || selectedCardDetails?.expires_at || selectedCard.expiry) && (
                                                    <span style={{ fontSize: '0.72rem', color: '#B45309', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(217, 119, 6, 0.1)', border: '1px solid rgba(217, 119, 6, 0.25)', padding: '2px 8px', borderRadius: 6 }}>
                                                        <i className="far fa-calendar-alt" />
                                                        Expires: {formatExpiryDate(selectedCard.expires_at || selectedCardDetails?.expires_at || selectedCard.expiry)}
                                                    </span>
                                                )}
                                            </div>
                                            <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#0F172A', marginTop: 2 }}>
                                                {isCompleted
                                                    ? '🎉 Card Fully Completed'
                                                    : `Remaining: ${remainingStamps} stamps remaining`}
                                            </div>
                                        </div>

                                        <div style={{ textAlign: 'right' }}>
                                            <span
                                                style={{
                                                    fontSize: '0.82rem',
                                                    fontWeight: 800,
                                                    color: isCompleted ? '#059669' : 'var(--firstloop-primary, #0E88B8)',
                                                    background: '#FFFFFF',
                                                    padding: '5px 14px',
                                                    borderRadius: 20,
                                                    border: '1px solid #BAE6FD',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: 6
                                                }}
                                            >
                                                <i className="fas fa-stamp" style={{ fontSize: '0.75rem' }} />
                                                Progress: {collectedStamps}/{totalStamps} Stamps Collected
                                            </span>
                                        </div>
                                    </div>

                                    {/* MAIN 2-COLUMN LAYOUT: LIVE PASS PREVIEW & CONTROLS */}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 28, alignItems: 'start' }}>
                                        {/* LEFT COLUMN: LIVE DIGITAL CUSTOMER PASS */}
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12, letterSpacing: '0.5px' }}>
                                                LIVE DIGITAL CUSTOMER PASS
                                            </span>

                                            {loadingCardDetails ? (
                                                <div
                                                    style={{
                                                        minHeight: 240,
                                                        width: '100%',
                                                        maxWidth: 420,
                                                        borderRadius: 22,
                                                        background: '#F1F5F9',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: 10
                                                    }}
                                                >
                                                    <div className="spinner-border text-primary" role="status" style={{ width: '2rem', height: '2rem' }} />
                                                    <small style={{ fontWeight: 700, color: 'var(--text-muted)' }}>Loading Card Design...</small>
                                                </div>
                                            ) : (
                                                <CustomerCard
                                                    card={cardForPreview}
                                                    cardType={Number(selectedCard.card_type)}
                                                />
                                            )}
                                        </div>

                                        {/* RIGHT COLUMN: STAMPS STATUS, PERKS & PAYMENT FORM */}
                                        <div>
                                            <form onSubmit={handleConfirmCheckIn}>
                                                {isStampCard ? (
                                                    <div>
                                                        {/* Current Stamp Progress & Stamp Circles */}
                                                        <div
                                                            style={{
                                                                background: isCompleted ? 'rgba(16, 185, 129, 0.08)' : '#F8FAFC',
                                                                borderRadius: 16,
                                                                padding: 18,
                                                                border: isCompleted ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid #E2E8F0',
                                                                marginBottom: 18
                                                            }}
                                                        >
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                                                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                                                                    Current Stamp Progress:
                                                                </span>
                                                                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: isCompleted ? '#059669' : 'var(--firstloop-primary, #0E88B8)' }}>
                                                                    {isCompleted
                                                                        ? `🎉 Card Completed (${collectedStamps}/${totalStamps})`
                                                                        : `${remainingStamps} Remaining (${collectedStamps}/${totalStamps})`}
                                                                </span>
                                                            </div>

                                                            {/* Visual Stamp Circles (Paid vs Not Paid) */}
                                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                                                {Array.from({ length: totalStamps }).map((_, idx) => {
                                                                    const levelData = selectedCardDetails?.CustomerStampLevels?.[idx] || selectedCardDetails?.levelRewards?.[idx] || selectedCardDetails?.stamp_levels?.[idx]
                                                                    const isPaid = levelData?.status !== undefined
                                                                        ? Number(levelData.status) === 1
                                                                        : (isCompleted || idx < collectedStamps)
                                                                    const hasFree = Number(levelData?.free_stamp) === 1 || levelData?.free_stamp === true || levelData?.free_stamp === '1' || Boolean(levelData?.free_text)
                                                                    const freePerkText = levelData?.free_text || ''

                                                                    return (
                                                                        <div
                                                                            key={idx}
                                                                            style={{ position: 'relative' }}
                                                                        >
                                                                            <div
                                                                                title={`Stamp ${idx + 1}: ${isPaid ? 'Paid / Collected' : 'Pending / Not Paid'}${levelData?.reward ? ` • ${levelData.reward}` : ''}${hasFree ? ` (Free: ${freePerkText || 'Free Perk'})` : ''}`}
                                                                                style={{
                                                                                    width: 34,
                                                                                    height: 34,
                                                                                    borderRadius: `${selectedCardDetails?.stamp_radius ?? 50}%`,
                                                                                    background: isPaid ? 'var(--firstloop-gradient-primary, linear-gradient(135deg, #0E88B8 0%, #0284C7 100%))' : '#FFFFFF',
                                                                                    color: isPaid ? '#FFFFFF' : '#94A3B8',
                                                                                    border: isPaid ? 'none' : '2px dashed #CBD5E1',
                                                                                    display: 'flex',
                                                                                    alignItems: 'center',
                                                                                    justifyContent: 'center',
                                                                                    fontWeight: 800,
                                                                                    fontSize: '0.8rem',
                                                                                    boxShadow: isPaid ? '0 2px 6px rgba(14, 136, 184, 0.25)' : 'none',
                                                                                    transition: 'all 0.2s ease'
                                                                                }}
                                                                            >
                                                                                {isPaid ? <i className="fas fa-check" /> : idx + 1}
                                                                            </div>
                                                                            {hasFree && (
                                                                                <span
                                                                                    title={freePerkText ? `Free Perk: ${freePerkText}` : 'Free Bonus Perk'}
                                                                                    style={{
                                                                                        position: 'absolute',
                                                                                        top: -4,
                                                                                        right: -4,
                                                                                        width: 15,
                                                                                        height: 15,
                                                                                        borderRadius: '50%',
                                                                                        background: '#10B981',
                                                                                        color: '#FFFFFF',
                                                                                        border: '1.5px solid #FFFFFF',
                                                                                        display: 'flex',
                                                                                        alignItems: 'center',
                                                                                        justifyContent: 'center',
                                                                                        fontSize: '0.45rem',
                                                                                        boxShadow: '0 2px 4px rgba(0,0,0,0.25)',
                                                                                        pointerEvents: 'none',
                                                                                        zIndex: 2
                                                                                    }}
                                                                                >
                                                                                    <i className="fas fa-gift" />
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    )
                                                                })}
                                                            </div>
                                                        </div>

                                                        {/* Completed Card Notice or Perk & Payment Controls */}
                                                        {isCompleted ? (
                                                            <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 16, padding: '20px', marginBottom: 18, textAlign: 'center' }}>
                                                                <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#10B981', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', fontSize: '1.3rem' }}>
                                                                    <i className="fas fa-check-double" />
                                                                </div>
                                                                <h5 style={{ fontWeight: 800, color: '#065F46', margin: '0 0 4px', fontSize: '1rem' }}>
                                                                    Stamp Card Fully Completed!
                                                                </h5>
                                                                <p style={{ fontSize: '0.82rem', color: '#047857', margin: '0 0 14px 0' }}>
                                                                    All {totalStamps} stamps collected. Customer has unlocked all reward perks!
                                                                </p>
                                                                <div>
                                                                    <button
                                                                        type="button"
                                                                        className="btn btn-primary"
                                                                        onClick={handleAddNewCard}
                                                                        style={{
                                                                            borderRadius: 12,
                                                                            fontWeight: 800,
                                                                            fontSize: '0.88rem',
                                                                            padding: '9px 20px',
                                                                            display: 'inline-flex',
                                                                            alignItems: 'center',
                                                                            gap: 8,
                                                                            boxShadow: '0 4px 14px rgba(14, 136, 184, 0.35)'
                                                                        }}
                                                                    >
                                                                        <i className="fas fa-plus-circle" />
                                                                        <span>Add New Card for Customer</span>
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                {/* Current Stamp Perk & Payable Amount */}
                                                                {(() => {
                                                                    const currentStampIdx = collectedStamps
                                                                    const activeLevel = selectedCardDetails?.CustomerStampLevels?.[currentStampIdx] || selectedCardDetails?.levelRewards?.[currentStampIdx] || selectedCardDetails?.stamp_levels?.[currentStampIdx]
                                                                    const hasFreeBonus = (Number(selectedCardDetails?.free_stamp) === 1 || Number(activeLevel?.free_stamp) === 1 || Boolean(selectedCardDetails?.free_text) || Boolean(activeLevel?.free_text))
                                                                    const freeBonusText = selectedCardDetails?.free_text || activeLevel?.free_text || ''

                                                                    return (
                                                                        <div
                                                                            style={{
                                                                                background: '#F8FAFC',
                                                                                borderRadius: 14,
                                                                                padding: '14px 16px',
                                                                                border: '1px solid #E2E8F0',
                                                                                marginBottom: 16,
                                                                                display: 'flex',
                                                                                flexDirection: 'column',
                                                                                gap: 10
                                                                            }}
                                                                        >
                                                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                                                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                                                                                    Current Stamp Perk:
                                                                                </span>
                                                                                <span
                                                                                    className="badge"
                                                                                    style={{
                                                                                        background: '#F59E0B',
                                                                                        color: '#FFF',
                                                                                        fontWeight: 800,
                                                                                        padding: '4px 12px',
                                                                                        borderRadius: 6,
                                                                                        fontSize: '0.78rem'
                                                                                    }}
                                                                                >
                                                                                    <i className="fas fa-tag" style={{ marginRight: 5 }} />
                                                                                    {selectedCardDetails?.descption || 'Paid Perk'}
                                                                                </span>
                                                                            </div>

                                                                            {hasFreeBonus && (
                                                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px dashed #E2E8F0', paddingTop: 8 }}>
                                                                                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#059669', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                                                                                        <i className="fas fa-gift text-success" />
                                                                                        <span>Bonus Free Perk:</span>
                                                                                    </span>
                                                                                    <span
                                                                                        className="badge"
                                                                                        style={{
                                                                                            background: 'rgba(16, 185, 129, 0.15)',
                                                                                            color: '#059669',
                                                                                            border: '1px solid rgba(16, 185, 129, 0.3)',
                                                                                            fontWeight: 800,
                                                                                            padding: '4px 12px',
                                                                                            borderRadius: 6,
                                                                                            fontSize: '0.78rem',
                                                                                            display: 'inline-flex',
                                                                                            alignItems: 'center',
                                                                                            gap: 5
                                                                                        }}
                                                                                    >
                                                                                        <i className="fas fa-gift" />
                                                                                        <span>Free: {freeBonusText || 'Free Bonus Item'}</span>
                                                                                    </span>
                                                                                </div>
                                                                            )}

                                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E2E8F0', paddingTop: 8 }}>
                                                                                <span style={{ color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.85rem' }}>Payable Amount:</span>
                                                                                <strong style={{ color: 'var(--firstloop-primary, #0E88B8)', fontWeight: 800, fontSize: '1.05rem' }}>
                                                                                    {Number(selectedCardDetails?.overAll_amt ?? selectedCardDetails?.current_amt ?? paymentAmount ?? 0).toFixed(2)}
                                                                                </strong>
                                                                            </div>
                                                                        </div>
                                                                    )
                                                                })()}

                                                                {/* Payment Method Selector */}
                                                                <div className="form-group mb-3">
                                                                    <label style={{ fontSize: '0.82rem', fontWeight: 800, marginBottom: 8, display: 'block', color: 'var(--text-primary)' }}>
                                                                        Select Payment Method:
                                                                    </label>
                                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                                                        <div
                                                                            onClick={() => setPaymentMethod('Cash')}
                                                                            style={{
                                                                                padding: 12,
                                                                                borderRadius: 12,
                                                                                border: paymentMethod === 'Cash' ? '2px solid #059669' : '1px solid #E2E8F0',
                                                                                background: paymentMethod === 'Cash' ? 'rgba(16, 185, 129, 0.12)' : '#F8FAFC',
                                                                                color: paymentMethod === 'Cash' ? '#059669' : 'var(--text-secondary)',
                                                                                cursor: 'pointer',
                                                                                fontWeight: 800,
                                                                                textAlign: 'center',
                                                                                fontSize: '0.85rem',
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                justifyContent: 'center',
                                                                                gap: 8
                                                                            }}
                                                                        >
                                                                            <i className="fas fa-money-bill-wave" />
                                                                            <span>Cash Payment</span>
                                                                        </div>

                                                                        <div
                                                                            onClick={() => setPaymentMethod('Online')}
                                                                            style={{
                                                                                padding: 12,
                                                                                borderRadius: 12,
                                                                                border: paymentMethod === 'Online' ? '2px solid #0284C7' : '1px solid #E2E8F0',
                                                                                background: paymentMethod === 'Online' ? 'rgba(2, 132, 199, 0.12)' : '#F8FAFC',
                                                                                color: paymentMethod === 'Online' ? '#0284C7' : 'var(--text-secondary)',
                                                                                cursor: 'pointer',
                                                                                fontWeight: 800,
                                                                                textAlign: 'center',
                                                                                fontSize: '0.85rem',
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                justifyContent: 'center',
                                                                                gap: 8
                                                                            }}
                                                                        >
                                                                            <i className="fas fa-credit-card" />
                                                                            <span>Online (UPI / Card)</span>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Amount Field */}
                                                                <div className="form-group mb-4">
                                                                    <label style={{ fontSize: '0.82rem', fontWeight: 800, marginBottom: 4, display: 'block', color: 'var(--text-primary)' }}>
                                                                        Transaction Payment Amount
                                                                    </label>
                                                                    <input
                                                                        type="number"
                                                                        step="0.01"
                                                                        className="form-control"
                                                                        value={paymentAmount}
                                                                        onChange={(e) => setPaymentAmount(e.target.value)}
                                                                        style={{ height: 42, borderRadius: 10, fontWeight: 700 }}
                                                                    />
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                ) : (
                                                    /* Membership Card Check-In */
                                                    <div style={{ background: '#F8FAFC', borderRadius: 16, padding: 20, border: '1px solid #E2E8F0', marginBottom: 20 }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                                                            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(245, 158, 11, 0.15)', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                <i className="fas fa-crown" />
                                                            </div>
                                                            <div>
                                                                <strong style={{ fontSize: '0.92rem', color: '#0F172A', display: 'block' }}>
                                                                    VIP Membership Daily Pass
                                                                </strong>
                                                                <small style={{ fontSize: '0.75rem', color: '#64748B' }}>
                                                                    Log daily attendance for active member
                                                                </small>
                                                            </div>
                                                        </div>
                                                        <p style={{ fontSize: '0.84rem', color: '#475569', margin: 0 }}>
                                                            Customer is eligible for daily branch check-in under active membership tier.
                                                        </p>
                                                    </div>
                                                )}

                                                {/* Submit Button */}
                                                <button
                                                    type="submit"
                                                    className="btn firstloop-btn-primary"
                                                    disabled={submittingCheckIn || (isStampCard && isCompleted)}
                                                    style={{
                                                        width: '100%',
                                                        padding: '13px',
                                                        borderRadius: 12,
                                                        fontWeight: 800,
                                                        fontSize: '0.92rem',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: 8,
                                                        boxShadow: '0 4px 14px rgba(14, 136, 184, 0.25)'
                                                    }}
                                                >
                                                    {submittingCheckIn ? (
                                                        <>
                                                            <i className="fas fa-spinner fa-spin" />
                                                            <span>Saving Card Entry...</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <i className="fas fa-check-circle" />
                                                            <span>Save Today's Check-In Entry</span>
                                                        </>
                                                    )}
                                                </button>
                                            </form>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* CUSTOMER CARD HISTORY POPUP MODAL */}
            <CustomerCardHistory
                isOpen={historyModalOpen}
                onClose={() => setHistoryModalOpen(false)}
                cardId={selectedCard?.id}
                card={selectedCard}
            />
        </div>
    )
}
