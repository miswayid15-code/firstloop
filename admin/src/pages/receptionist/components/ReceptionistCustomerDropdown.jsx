import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import API from '../../../api.js'
import CustomerCard from '../../../components/CustomerCard.jsx'
import CustomerCardHistory from '../../../components/CustomerCardHistory.jsx'
import {
    fetchCustomerStampLevelsApi,
    fetchStampCardsApi,
    fetchMembershipCardsApi,
    formatExpiryDate,
    cleanPhoneForWhatsApp,
    waitForCardAssets,
    captureCardCanvas,
    formatImageUrl
} from '../../../services/cardService.js'

// Helper to inspect reward type ('Free' | 'Discount' | 'Paid') for a given stamp level or card
const getRewardTypeInfo = (cardDetails, stampIndex = 0) => {
    if (!cardDetails) return 'Free'
    const levels = cardDetails.CustomerStampLevels || cardDetails.levelRewards || cardDetails.stamp_levels || []
    const activeLevel = levels[stampIndex] || null

    const rawType = String(
        activeLevel?.reward_type ??
        activeLevel?.rewardType ??
        activeLevel?.type ??
        cardDetails?.reward_type ??
        cardDetails?.rewardType ??
        ''
    ).trim().toLowerCase()

    if (rawType === '2' || rawType === 'discount') return 'Discount'
    if (rawType === '3' || rawType === 'paid') return 'Paid'
    if (rawType === '1' || rawType === 'free') return 'Free'

    const disc = parseFloat(activeLevel?.discountVal ?? activeLevel?.discount ?? cardDetails?.discount_val ?? 0) || 0
    if (disc > 0) return 'Discount'

    const amt = parseFloat(activeLevel?.amt ?? cardDetails?.current_amt ?? 0) || 0
    if (amt > 0) return 'Paid'

    return 'Free'
}

// Helper to get discount percentage for current stamp
const getDiscountPercentage = (cardDetails, stampIndex = 0) => {
    if (!cardDetails) return 0
    const levels = cardDetails.CustomerStampLevels || cardDetails.levelRewards || cardDetails.stamp_levels || []
    const activeLevel = levels[stampIndex] || null
    const disc =
        activeLevel?.discountVal ??
        activeLevel?.discount ??
        activeLevel?.discount_percentage ??
        cardDetails?.discount_val ??
        cardDetails?.discount_percentage ??
        0
    return parseFloat(disc) || 0
}

export default function ReceptionistCustomerDropdown({
    customer,
    initialMode = 'checkin', // 'checkin' | 'addcard'
    branchId = '',
    onClose,
    onSuccess
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

    const effectiveBranchId = branchId || receptionist?.user_branch_id || receptionist?.branch_id || ''

    // Active mode state: 'checkin' or 'addcard'
    const [currentMode, setCurrentMode] = useState(initialMode)

    // Check-in State
    const [selectedCustomerBranch, setSelectedCustomerBranch] = useState('all')
    const [selectedCard, setSelectedCard] = useState(null)
    const [selectedCardDetails, setSelectedCardDetails] = useState(null)
    const [loadingCardDetails, setLoadingCardDetails] = useState(false)
    const [paymentMethod, setPaymentMethod] = useState('Cash')
    const [paymentAmount, setPaymentAmount] = useState('0.00')
    const [submittingCheckIn, setSubmittingCheckIn] = useState(false)
    const [lastReceipt, setLastReceipt] = useState(null)
    const [selectedStampIndex, setSelectedStampIndex] = useState(null)
    const [sharingWhatsApp, setSharingWhatsApp] = useState(false)
    const [historyModalOpen, setHistoryModalOpen] = useState(false)
    const cardRef = useRef(null)

    // Add Card State
    const [addCardType, setAddCardType] = useState('stamp') // 'stamp' or 'membership'
    const [stampCardsList, setStampCardsList] = useState([])
    const [membershipCardsList, setMembershipCardsList] = useState([])
    const [loadingBranchCards, setLoadingBranchCards] = useState(false)
    const [selectedNewCardId, setSelectedNewCardId] = useState('')
    const [initialStamps, setInitialStamps] = useState(1)
    const [addNotes, setAddNotes] = useState('')
    const [submittingAddCard, setSubmittingAddCard] = useState(false)
    const [addCardSuccess, setAddCardSuccess] = useState(null)

    // Initialize customer cards
    const customerCards = useMemo(() => {
        return Array.isArray(customer?.cards) ? customer.cards : []
    }, [customer])

    // Discover branches across the selected customer's cards
    const customerBranches = useMemo(() => {
        if (!customer || !Array.isArray(customer.cards)) return []
        const map = new Map()
        customer.cards.forEach(c => {
            const bName = c.branch_name || c.branch || 'Main Branch'
            const bId = String(c.branch_id || bName)
            if (!map.has(bId)) {
                map.set(bId, { id: bId, name: bName, count: 0 })
            }
            map.get(bId).count++
        })
        return Array.from(map.values())
    }, [customer])

    // Cards filtered by selected customer branch
    const branchCards = useMemo(() => {
        if (!customer || !Array.isArray(customer.cards)) return []
        if (selectedCustomerBranch === 'all') return customer.cards
        return customer.cards.filter(c =>
            String(c.branch_id || c.branch_name || '') === String(selectedCustomerBranch) ||
            String(c.branch_name || '').toLowerCase() === String(selectedCustomerBranch).toLowerCase()
        )
    }, [customer, selectedCustomerBranch])

    // Auto-select active card for Check-In
    useEffect(() => {
        if (customerCards.length > 0) {
            const recBranchId = receptionist?.user_branch_id || receptionist?.branch_id
            const recBranchName = receptionist?.user_branch || receptionist?.branch_name
            const matching = customerCards.find(c =>
                (recBranchId && String(c.branch_id) === String(recBranchId)) ||
                (recBranchName && String(c.branch_name || '').toLowerCase() === String(recBranchName).toLowerCase())
            )
            setSelectedCard(matching || customerCards[0])
            if (matching) {
                setSelectedCustomerBranch(String(matching.branch_id || matching.branch_name))
            }
        } else {
            setSelectedCard(null)
            if (currentMode === 'checkin') {
                setCurrentMode('addcard')
            }
        }
    }, [customerCards, receptionist])

    // Load active card details when selectedCard changes
    const loadActiveCardDetails = async (cardId, cardType, cusId) => {
        if (!cardId || !cusId) return
        setLoadingCardDetails(true)
        try {
            const data = await fetchCustomerStampLevelsApi(cardId, cardType, cusId)
            setSelectedCardDetails(data || selectedCard)
            setSelectedStampIndex(null)
            setPaymentAmount('0.00')
        } catch (err) {
            console.error("Error loading card details:", err)
            setSelectedCardDetails(selectedCard)
        } finally {
            setLoadingCardDetails(false)
        }
    }

    useEffect(() => {
        if (selectedCard?.id && customer?.id) {
            loadActiveCardDetails(selectedCard.id, selectedCard.card_type, customer.id)
        } else {
            setSelectedCardDetails(null)
        }
    }, [selectedCard?.id, customer?.id])

    // Load branch cards for Add Card mode
    const loadBranchCards = async () => {
        if (!effectiveBranchId) return
        setLoadingBranchCards(true)
        try {
            const [stamps, members] = await Promise.all([
                fetchStampCardsApi({ branchId: effectiveBranchId }),
                fetchMembershipCardsApi({ branchId: effectiveBranchId })
            ])
            setStampCardsList(stamps || [])
            setMembershipCardsList(members || [])

            const targetList = addCardType === 'stamp' ? (stamps || []) : (members || [])
            if (targetList.length > 0) {
                setSelectedNewCardId(targetList[0].id || targetList[0]._id || '')
            }
        } catch (err) {
            console.error("Error loading branch cards:", err)
        } finally {
            setLoadingBranchCards(false)
        }
    }

    useEffect(() => {
        if (currentMode === 'addcard') {
            loadBranchCards()
        }
    }, [currentMode, effectiveBranchId, addCardType])

    // Set default selected new card when list changes
    useEffect(() => {
        const list = addCardType === 'stamp' ? stampCardsList : membershipCardsList
        if (list && list.length > 0) {
            if (!list.some(c => String(c.id || c._id) === String(selectedNewCardId))) {
                setSelectedNewCardId(list[0].id || list[0]._id || '')
            }
        } else {
            setSelectedNewCardId('')
        }
    }, [addCardType, stampCardsList, membershipCardsList])

    const isStampCard = Number(selectedCard?.card_type) === 1
    const totalStamps = Number(selectedCardDetails?.total_stamps || selectedCardDetails?.number_of_stamps || selectedCard?.total_stamps || 8)
    const collectedStamps = Number(selectedCardDetails?.current_stamp ?? selectedCardDetails?.current_stamps ?? selectedCard?.current_stamp ?? selectedCard?.collected ?? 0)
    const isCardDone = Number(selectedCardDetails?.is_completed) === 1 || Number(selectedCard?.is_completed) === 1 || collectedStamps >= totalStamps
    const isCompleted = isStampCard && isCardDone
    const remainingStamps = Math.max(0, totalStamps - collectedStamps)

    // Sequential stamps calculation
    const levels = selectedCardDetails?.CustomerStampLevels || selectedCardDetails?.levelRewards || selectedCardDetails?.stamp_levels || []
    let firstUnprocessedIndex = totalStamps
    for (let i = 0; i < totalStamps; i++) {
        const lvl = levels[i]
        const isPaid = lvl?.status !== undefined ? Number(lvl.status) === 1 : (isCompleted || i < collectedStamps)
        if (!isPaid) {
            firstUnprocessedIndex = i
            break
        }
    }

    // Active stamp index & calculations
    const activeStampIdx = selectedStampIndex !== null ? selectedStampIndex : null
    const activeLevel = activeStampIdx !== null ? (levels[activeStampIdx] || null) : null
    const isSelectedStampProcessed = Number(activeLevel?.status) === 1
    const currentRewardType = activeStampIdx !== null ? getRewardTypeInfo(selectedCardDetails, activeStampIdx) : 'Free'
    const currentDiscountPercent = activeStampIdx !== null ? getDiscountPercentage(selectedCardDetails, activeStampIdx) : 0

    const enteredTransactionAmount = currentRewardType === 'Free' ? 0 : (parseFloat(paymentAmount) || 0)
    const discountAmountDeduction = currentRewardType === 'Discount'
        ? (enteredTransactionAmount * currentDiscountPercent) / 100
        : 0
    const finalPayableAmount = currentRewardType === 'Free'
        ? 0
        : (currentRewardType === 'Discount'
            ? Math.max(0, enteredTransactionAmount - discountAmountDeduction)
            : enteredTransactionAmount)

    const currentPerkText =
        activeLevel?.reward ||
        activeLevel?.reward_text ||
        selectedCardDetails?.descption ||
        selectedCardDetails?.reward ||
        ''

    const hasFreeBonus =
        Number(activeLevel?.free_stamp) === 1 ||
        Boolean(activeLevel?.free_text) ||
        Number(selectedCardDetails?.free_stamp) === 1 ||
        Boolean(selectedCardDetails?.free_text)

    const freeBonusText = activeLevel?.free_text || selectedCardDetails?.free_text || ''

    const handleSelectStamp = (idx) => {
        const levelData = levels[idx] || null
        const isPaid = levelData?.status !== undefined
            ? Number(levelData.status) === 1
            : (isCompleted || idx < collectedStamps)

        if (!isPaid && idx > firstUnprocessedIndex) {
            toast.error(`Please complete Stamp #${firstUnprocessedIndex + 1} first! Stamps must be processed step by step.`)
            return
        }

        setSelectedStampIndex(idx)
        const rType = getRewardTypeInfo(selectedCardDetails, idx)

        if (rType === 'Free') {
            setPaymentAmount('0.00')
        } else {
            const recordedAmt = parseFloat(levelData?.amount ?? levelData?.current_amt ?? levelData?.amt ?? 0)
            const fallbackAmt = parseFloat(levelData?.amt ?? selectedCardDetails?.current_amt ?? selectedCard?.amount ?? 0)

            if (recordedAmt > 0) {
                setPaymentAmount(recordedAmt.toFixed(2))
            } else if (fallbackAmt > 0) {
                setPaymentAmount(fallbackAmt.toFixed(2))
            } else {
                setPaymentAmount('0.00')
            }
        }

        if (isPaid) {
            if (levelData?.payment_type == 2 || String(levelData?.payment_method).toLowerCase() === 'online') {
                setPaymentMethod('Online')
            } else {
                setPaymentMethod('Cash')
            }
        }
    }

    // Share updated customer card to WhatsApp
    const handleShareToWhatsApp = async (receiptData = null) => {
        const cardEl = cardRef.current
        const activeCard = selectedCardDetails || selectedCard
        const isStamp = Number(selectedCard?.card_type || activeCard?.card_type || 1) === 1
        const brand = activeCard?.brand_name || activeCard?.brandName || selectedCard?.brand_name || 'FirstLoop'
        const title = activeCard?.title || activeCard?.name || (isStamp ? 'Loyalty Stamp Pass' : 'VIP Membership Pass')
        const total = Number(receiptData?.totalStamps || activeCard?.total_stamps || activeCard?.number_of_stamps || 8)
        const currentStamps = receiptData?.newStamps !== undefined
            ? Number(receiptData.newStamps)
            : Number(activeCard?.current_stamp ?? activeCard?.current_stamps ?? activeCard?.collected ?? 0)

        const customerPhone = customer?.phone || ''
        const customerCountryCode = customer?.country_code || '91'
        const targetPhone = cleanPhoneForWhatsApp(customerPhone, customerCountryCode)
        const customerName = customer?.name || 'Customer'
        const expiryFormatted = formatExpiryDate(activeCard?.expires_at || activeCard?.expiry)
        const expiryLine = expiryFormatted ? `\n⏳ *Expires On:* ${expiryFormatted}` : ''

        let descToSend = ''
        if (isStamp) {
            const perkLine = receiptData?.freePerk ? `\n🎁 *Perk Unlocked:* ${receiptData.freePerk}` : ''
            const stampMsg = receiptData?.stampNumber
                ? `⭐ *Stamp #${receiptData.stampNumber} Recorded!* (${currentStamps}/${total} Stamps collected)`
                : `⭐ *Stamp Progress:* ${currentStamps}/${total} Stamps collected`

            descToSend = `🎉 *Hello ${customerName}!* 👋\nHere is your updated loyalty stamp pass for *${brand}* - *${title}*:\n\n${stampMsg}${perkLine}${expiryLine}\n\nThank you for visiting ${brand}! ✨`
        } else {
            descToSend = `🎉 *Hello ${customerName}!* 👋\nHere is your digital membership pass for *${brand}* - *${title}*:\n\n👑 *Daily VIP Check-In Validated!*${expiryLine}\n\nThank you for visiting ${brand}! ✨`
        }

        const openWhatsAppDirectly = () => {
            const waUrl = targetPhone
                ? `https://api.whatsapp.com/send?phone=${targetPhone}&text=${encodeURIComponent(descToSend)}`
                : `https://api.whatsapp.com/send?text=${encodeURIComponent(descToSend)}`
            window.open(waUrl, '_blank')
        }

        if (!cardEl) {
            openWhatsAppDirectly()
            toast.success(`Opening WhatsApp (+${targetPhone || customerPhone || 'Customer'})...`)
            return
        }

        setSharingWhatsApp(true)
        const toastId = toast.loading('Capturing card for WhatsApp...')

        try {
            await waitForCardAssets(cardEl)
            const canvas = await captureCardCanvas(cardEl)
            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'))

            if (blob) {
                try {
                    if (navigator.clipboard && window.ClipboardItem) {
                        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
                    }
                } catch (e) { }

                const blobUrl = URL.createObjectURL(blob)
                const dlLink = document.createElement('a')
                dlLink.href = blobUrl
                dlLink.download = `loyalty-pass-${Date.now().toString().slice(-4)}.png`
                document.body.appendChild(dlLink)
                dlLink.click()
                document.body.removeChild(dlLink)
            }

            toast.dismiss(toastId)
            openWhatsAppDirectly()
            toast.success(`Opening WhatsApp (+${targetPhone || customerPhone || ''})...`)
        } catch (error) {
            console.warn('Image capture note, opening WhatsApp directly:', error)
            toast.dismiss(toastId)
            openWhatsAppDirectly()
            toast.success(`Opening WhatsApp (+${targetPhone || customerPhone || ''})...`)
        } finally {
            setSharingWhatsApp(false)
        }
    }

    // Process Check-In
    const handleConfirmCheckIn = async (e) => {
        if (e && e.preventDefault) e.preventDefault()

        if (!customer || !selectedCard) {
            toast.error("Please select a customer pass")
            return
        }

        if (isStampCard) {
            if (selectedStampIndex === null || selectedStampIndex === undefined) {
                toast.error("Please select a stamp number first")
                return
            }

            const activeLvl = levels[selectedStampIndex] || null
            const isProcessed = Number(activeLvl?.status) === 1

            if (!isProcessed && collectedStamps >= totalStamps) {
                toast.error("This stamp card is already fully completed!")
                return
            }

            setSubmittingCheckIn(true)
            try {
                const stampLevelId = Number(
                    activeLvl?.id ||
                    activeLvl?.stamp_level_id ||
                    selectedCardDetails?.stamp_level_id ||
                    0
                )
                const stampId = activeLvl?.id || activeLvl?.stamp_level_id || 0
                const rType = getRewardTypeInfo(selectedCardDetails, selectedStampIndex)
                const discPercent = getDiscountPercentage(selectedCardDetails, selectedStampIndex)

                const enteredAmt = rType === 'Free' ? 0 : (parseFloat(paymentAmount) || 0)
                const finalPaidAmt = rType === 'Free'
                    ? 0
                    : (rType === 'Discount'
                        ? Math.max(0, enteredAmt - (enteredAmt * discPercent) / 100)
                        : enteredAmt)

                const payload = {
                    cus_id: Number(customer.id),
                    card_id: Number(selectedCard.id),
                    payment_type: paymentMethod === 'Online' ? 2 : 1,
                    amount: enteredAmt,
                    paid_amount: parseFloat(finalPaidAmt.toFixed(2)),
                    stamp_level_id: stampLevelId
                }

                if (isProcessed && stampId) {
                    payload.id = Number(stampId)
                }

                const res = await API.post('firstloop/customer/stamp-paid', payload)

                if (res?.data?.status == 1) {
                    const newStamps = isProcessed ? collectedStamps : Math.min(totalStamps, collectedStamps + 1)
                    toast.success(res.data.message || (isProcessed ? `Stamp #${selectedStampIndex + 1} updated successfully! 🚀` : "Stamp payment entry logged successfully! 🚀"))

                    const earnedFreePerk = (Number(activeLvl?.free_stamp) === 1 || Boolean(activeLvl?.free_text))
                        ? (activeLvl?.free_text || 'Free Perk')
                        : (Number(selectedCardDetails?.free_stamp) === 1 ? (selectedCardDetails?.free_text || 'Free Perk') : null)

                    const receipt = {
                        receiptId: res.data.receipt_id || `RCP-${Date.now().toString().slice(-6)}`,
                        customerName: customer.name || 'Customer',
                        cardTitle: selectedCard.title || selectedCardDetails?.title || 'Stamp Pass',
                        previousStamps: collectedStamps,
                        newStamps: newStamps,
                        totalStamps: totalStamps,
                        paymentMethod: paymentMethod,
                        paymentAmount: `${finalPaidAmt.toFixed(2)}`,
                        freePerk: earnedFreePerk,
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        actionType: isProcessed ? 'Stamp Edit' : 'Stamp Check-In',
                        stampNumber: selectedStampIndex + 1
                    }

                    setLastReceipt(receipt)
                    setSelectedStampIndex(null)

                    // Refresh card details live
                    await loadActiveCardDetails(selectedCard.id, selectedCard.card_type, customer.id)

                    // Refresh parent list
                    if (onSuccess) onSuccess()
                } else {
                    toast.error(res?.data?.message || (isProcessed ? "Failed to update stamp entry" : "Failed to log stamp entry"))
                }
            } catch (err) {
                console.error("Check-in error:", err)
                toast.error(err?.response?.data?.message || "Failed to process check-in")
            } finally {
                setSubmittingCheckIn(false)
            }
        } else {
            // Membership Daily Check-In
            setSubmittingCheckIn(true)
            try {
                toast.success("Membership Check-In Validated! 👑")
                const receipt = {
                    receiptId: `MBR-${Date.now().toString().slice(-6)}`,
                    customerName: customer.name || 'Customer',
                    cardTitle: selectedCard.title || 'Membership Pass',
                    paymentMethod: 'Daily Check-In Validated',
                    paymentAmount: '0.00',
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    actionType: 'Membership Check-In'
                }
                setLastReceipt(receipt)
                if (onSuccess) onSuccess()
            } catch (err) {
                console.error("Membership check-in error:", err)
            } finally {
                setSubmittingCheckIn(false)
            }
        }
    }

    // Process Add Card
    const handleAssignNewCard = async (e) => {
        if (e && e.preventDefault) e.preventDefault()

        if (!selectedNewCardId) {
            toast.error("Please select a card to issue")
            return
        }

        setSubmittingAddCard(true)
        try {
            const normalizedCountryCode = (customer?.country_code || '91').startsWith('+')
                ? customer.country_code
                : `+${customer?.country_code || '91'}`

            const payload = {
                cardType: addCardType,
                cus_id: Number(customer.id),
                br_id: Number(effectiveBranchId) || effectiveBranchId || "main",
                cardId: Number(selectedNewCardId) || selectedNewCardId,
                name: (customer.name || '').trim(),
                email: (customer.email || '').trim(),
                phone: String(customer.phone || '').trim(),
                country_code: normalizedCountryCode,
                initial_stamps: Number(initialStamps) || 1,
                notes: addNotes.trim()
            }

            const response = await API.post("firstloop/customer/link-customer", payload)
            const resStatus = response?.data?.status
            const resMsg = response?.data?.message || response?.data?.msg || ""
            const resData = response?.data?.data

            if (resStatus === 1 || resStatus === "1" || response?.data?.success) {
                toast.success(resMsg || `🎉 Successfully assigned card to ${customer.name || 'Customer'}!`, { duration: 4000 })
                setAddCardSuccess({
                    message: resMsg || "Card assigned successfully!",
                    cardId: resData?.customer_card_id || selectedNewCardId
                })
                if (onSuccess) onSuccess()
            } else if (resData && (resStatus === 0 || resStatus === "0")) {
                toast(resMsg || "Customer already has this card", { icon: "ℹ️" })
                setAddCardSuccess({
                    message: resMsg || "Customer already holds this pass",
                    cardId: resData?.id || selectedNewCardId
                })
            } else {
                toast.error(resMsg || "Failed to assign card")
            }
        } catch (err) {
            console.error("Assign card error:", err)
            toast.error(err?.response?.data?.message || "Failed to assign card")
        } finally {
            setSubmittingAddCard(false)
        }
    }

    // Merge card data with customer details for Live Digital Customer Pass preview
    const cardForPreview = {
        ...(selectedCard || {}),
        ...(selectedCardDetails || {}),
        expires_at: selectedCardDetails?.expires_at || selectedCard?.expires_at || null,
        expiry: selectedCardDetails?.expires_at || selectedCard?.expires_at || selectedCardDetails?.expiry || selectedCard?.expiry || null,
        customer_name: customer?.name || selectedCardDetails?.customer_name || selectedCard?.customer_name || 'Customer',
        name: customer?.name || selectedCardDetails?.name || selectedCard?.name || 'Customer',
        customerPhone: customer?.phone || '',
        phone: customer?.phone || '',
        cardholderName: customer?.name || 'Customer'
    }

    return (
        <div
            style={{
                animation: 'accordionSlideDown 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
                background: '#FFFFFF',
                borderRadius: 18,
                border: '1.5px solid #CBD5E1',
                boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
                padding: 0,
                overflow: 'hidden',
                margin: '10px 0 16px 0',
                fontFamily: 'var(--font-body, system-ui, -apple-system, sans-serif)'
            }}
        >
            <style>{`
                @keyframes accordionSlideDown {
                    from {
                        opacity: 0;
                        transform: translateY(-8px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>

            {/* TOP TERMINAL HEADER BAR (Exact match to modal screenshot) */}
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
                        <h4 style={{ margin: '2px 0 0 0', fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                            {currentMode === 'checkin'
                                ? (selectedCard ? (isStampCard ? 'Stamp Card Payment & Entry Update' : 'Membership Daily Check-In Entry') : 'Customer Pass Check-In')
                                : 'Assign New Card to Customer'}
                        </h4>
                    </div>
                </div>

                {/* Right Action Controls: Mode Switcher, Card History & Close button */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    {/* Mode Toggle (Check-In vs Add Pass) */}
                    <div style={{ display: 'inline-flex', background: '#FFFFFF', padding: 2, borderRadius: 8, border: '1px solid #CBD5E1' }}>
                        <button
                            type="button"
                            onClick={() => setCurrentMode('checkin')}
                            style={{
                                border: 'none',
                                background: currentMode === 'checkin' ? 'var(--firstloop-primary, #0E88B8)' : 'transparent',
                                color: currentMode === 'checkin' ? '#FFFFFF' : '#475569',
                                padding: '5px 12px',
                                borderRadius: 6,
                                fontSize: '0.76rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                            }}
                        >
                            <i className="fas fa-check-circle" style={{ marginRight: 5 }} />
                            Check-In
                        </button>
                        <button
                            type="button"
                            onClick={() => setCurrentMode('addcard')}
                            style={{
                                border: 'none',
                                background: currentMode === 'addcard' ? 'var(--firstloop-primary, #0E88B8)' : 'transparent',
                                color: currentMode === 'addcard' ? '#FFFFFF' : '#475569',
                                padding: '5px 12px',
                                borderRadius: 6,
                                fontSize: '0.76rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                            }}
                        >
                            <i className="fas fa-plus-circle" style={{ marginRight: 5 }} />
                            Add Card
                        </button>
                    </div>

                    {/* View Card History Button */}
                    {selectedCard && (
                        <button
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => setHistoryModalOpen(true)}
                            style={{
                                borderRadius: 10,
                                fontWeight: 700,
                                fontSize: '0.8rem',
                                padding: '6px 12px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6
                            }}
                        >
                            <i className="fas fa-history" />
                            <span>View Card History</span>
                        </button>
                    )}

                    {/* Close / Hide Details Button */}
                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#94A3B8',
                            fontSize: '1.25rem',
                            cursor: 'pointer',
                            padding: '4px 6px',
                            lineHeight: 1
                        }}
                        title="Close dropdown"
                    >
                        <i className="fas fa-times" />
                    </button>
                </div>
            </div>

            {/* SUB-HEADER: CUSTOMER PROFILE CHIP & BRANCH SELECTOR */}
            <div style={{ padding: '14px 24px', background: '#FFFFFF', borderBottom: '1px solid #F1F5F9' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                    {/* Customer Profile Chip */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#F8FAFC', padding: '6px 16px', borderRadius: 12, border: '1px solid #E2E8F0' }}>
                        <div
                            style={{
                                width: 34,
                                height: 34,
                                borderRadius: '50%',
                                background: 'var(--firstloop-primary-light, #E6F2FA)',
                                color: 'var(--firstloop-primary, #0E88B8)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 800,
                                fontSize: '0.85rem',
                                border: '1.5px solid var(--firstloop-primary, #0E88B8)'
                            }}
                        >
                            {customer.name ? customer.name.charAt(0).toUpperCase() : 'C'}
                        </div>
                        <div>
                            <strong style={{ fontSize: '0.88rem', color: '#0F172A', display: 'block', lineHeight: 1.2 }}>
                                {customer.name || 'Customer'}
                            </strong>
                            <small style={{ fontSize: '0.74rem', color: '#64748B' }}>
                                {customer.phone ? `+${customer.country_code || '91'} ${customer.phone}` : (customer.email || '-')}
                            </small>
                        </div>
                    </div>

                    {/* Customer Quick Info */}
                    <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
                        Joined: <strong>{customer.created_at ? new Date(customer.created_at).toLocaleDateString() : 'Active Customer'}</strong> • Total Passes: <strong style={{ color: 'var(--firstloop-primary, #0E88B8)' }}>{customerCards.length}</strong>
                    </div>
                </div>

                {/* BRANCH SELECTOR BUTTONS (Matching Screenshot) */}
                {currentMode === 'checkin' && customerBranches.length > 0 && (
                    <div style={{ marginTop: 14, background: '#F8FAFC', padding: '12px 16px', borderRadius: 14, border: '1px solid #E2E8F0' }}>
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
                                All Cards ({customerCards.length})
                            </button>

                            {customerBranches.map(b => {
                                const isCurrent = selectedCustomerBranch === b.id || selectedCustomerBranch === b.name
                                return (
                                    <button
                                        key={b.id}
                                        type="button"
                                        onClick={() => {
                                            setSelectedCustomerBranch(b.id)
                                            const matching = customerCards.find(c =>
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

                {/* Multiple Cards selector within chosen branch */}
                {currentMode === 'checkin' && branchCards.length > 1 && (
                    <div style={{ marginTop: 12 }}>
                        <span style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>
                            Select Card Pass:
                        </span>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
                            {branchCards.map(card => {
                                const isSelected = selectedCard?.id === card.id
                                const isStamp = Number(card.card_type) === 1
                                const tot = Number(card.number_of_stamps || card.total_stamps || 8)
                                const col = Number(card.current_stamp ?? card.collected ?? 0)
                                const isDone = Number(card.is_completed ?? (isStamp && col >= tot ? 1 : 0)) === 1

                                return (
                                    <div
                                        key={card.id}
                                        onClick={() => setSelectedCard(card)}
                                        style={{
                                            padding: '10px 14px',
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
                                            <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '2px 7px', borderRadius: 6, background: isDone ? '#10B981' : (isStamp ? 'var(--firstloop-primary, #0E88B8)' : '#D97706'), color: '#FFFFFF' }}>
                                                {isDone ? 'COMPLETED' : (isStamp ? 'STAMP CARD' : 'MEMBERSHIP')}
                                            </span>
                                            {card.branch_name && (
                                                <span style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: 600 }}>
                                                    <i className="fas fa-map-marker-alt" style={{ marginRight: 3 }} />
                                                    {card.branch_name}
                                                </span>
                                            )}
                                        </div>
                                        <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginTop: 2 }}>
                                            {card.title || 'Stamp Card'}
                                        </strong>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* MAIN CONTENT AREA */}
            <div style={{ padding: '24px' }}>
                {/* SUCCESS RECEIPT BANNER */}
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
                                    {lastReceipt.actionType === 'Stamp Edit' ? 'Stamp Entry Updated Successfully! ✏️' : 'Check-In & Stamp Entry Logged Successfully! 🎉'}
                                </strong>
                                <span style={{ fontSize: '0.8rem', color: '#047857' }}>
                                    {lastReceipt.stampNumber && `Stamp #${lastReceipt.stampNumber} • `}₹{lastReceipt.paymentAmount} ({lastReceipt.paymentMethod})
                                    {lastReceipt.newStamps !== undefined && ` • Progress: ${lastReceipt.newStamps}/${lastReceipt.totalStamps} Stamps`}
                                    {lastReceipt.freePerk && ` • 🎁 Free Perk: ${lastReceipt.freePerk}`}
                                </span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                            <button
                                type="button"
                                onClick={() => handleShareToWhatsApp(lastReceipt)}
                                disabled={sharingWhatsApp}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    padding: '8px 16px',
                                    borderRadius: 10,
                                    background: '#25D366',
                                    color: '#FFFFFF',
                                    fontWeight: 700,
                                    fontSize: '0.82rem',
                                    border: 'none',
                                    cursor: 'pointer',
                                    boxShadow: '0 2px 8px rgba(37, 211, 102, 0.35)',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                {sharingWhatsApp ? (
                                    <>
                                        <i className="fas fa-spinner fa-spin" />
                                        <span>Opening WhatsApp...</span>
                                    </>
                                ) : (
                                    <>
                                        <i className="fab fa-whatsapp" style={{ fontSize: '1.05rem' }} />
                                        <span>Share Card to WhatsApp{customer.phone ? ` (+${cleanPhoneForWhatsApp(customer.phone, customer.country_code || '91')})` : ''}</span>
                                    </>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => setLastReceipt(null)}
                                style={{ background: 'transparent', border: 'none', color: '#059669', cursor: 'pointer', fontSize: '1rem', padding: 4 }}
                                title="Dismiss"
                            >
                                <i className="fas fa-times" />
                            </button>
                        </div>
                    </div>
                )}

                {/* MODE 1: CHECK-IN TERMINAL UI (EXACT MATCH TO SCREENSHOTS) */}
                {currentMode === 'checkin' && (
                    <div>
                        {customerCards.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748B' }}>
                                <i className="fas fa-id-card" style={{ fontSize: '2.5rem', color: '#CBD5E1', marginBottom: 12, display: 'block' }} />
                                <h4 style={{ margin: '0 0 6px 0', fontSize: '1.05rem', fontWeight: 800, color: '#1E293B' }}>
                                    No Assigned Passes Found
                                </h4>
                                <p style={{ margin: '0 0 16px 0', fontSize: '0.85rem' }}>
                                    This customer currently has no active stamp or membership cards assigned.
                                </p>
                                <button
                                    type="button"
                                    className="btn firstloop-btn-primary btn-sm"
                                    onClick={() => setCurrentMode('addcard')}
                                    style={{ padding: '8px 18px', borderRadius: 10, fontWeight: 700 }}
                                >
                                    <i className="fas fa-plus-circle" style={{ marginRight: 6 }} />
                                    Issue New Card Now
                                </button>
                            </div>
                        ) : !selectedCard ? (
                            <div style={{ textAlign: 'center', padding: '30px 20px', color: '#EF4444' }}>
                                <i className="fas fa-exclamation-circle" style={{ fontSize: '1.8rem', marginBottom: 8, display: 'block' }} />
                                <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem' }}>
                                    No cards found for this branch selection.
                                </p>
                            </div>
                        ) : (
                            /* UNIFIED TERMINAL CARD PANEL: MATCHING SCREENSHOT EXACTLY */
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
                                            <>
                                                <CustomerCard
                                                    ref={cardRef}
                                                    card={cardForPreview}
                                                    cardType={Number(selectedCard.card_type)}
                                                />

                                                {/* WhatsApp Share Card Quick Action Button */}
                                                <div style={{ marginTop: 14, width: '100%', maxWidth: 450 }}>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleShareToWhatsApp(lastReceipt)}
                                                        disabled={sharingWhatsApp}
                                                        style={{
                                                            width: '100%',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            gap: 8,
                                                            padding: '11px 16px',
                                                            borderRadius: 12,
                                                            background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                                                            color: '#FFFFFF',
                                                            fontWeight: 700,
                                                            fontSize: '0.85rem',
                                                            border: 'none',
                                                            cursor: 'pointer',
                                                            boxShadow: '0 3px 12px rgba(37, 211, 102, 0.3)',
                                                            transition: 'all 0.2s ease'
                                                        }}
                                                    >
                                                        {sharingWhatsApp ? (
                                                            <>
                                                                <i className="fas fa-spinner fa-spin" />
                                                                <span>Capturing Card for WhatsApp...</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <i className="fab fa-whatsapp" style={{ fontSize: '1.15rem' }} />
                                                                <span>Share Card to WhatsApp{customer.phone ? ` (+${cleanPhoneForWhatsApp(customer.phone, customer.country_code || '91')})` : ''}</span>
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {/* RIGHT COLUMN: STAMPS STATUS, PERKS & PAYMENT FORM */}
                                    <div>
                                        <form onSubmit={handleConfirmCheckIn}>
                                            {isStampCard ? (
                                                <div>
                                                    {/* Completed Card Notice Banner */}
                                                    {isCompleted && (
                                                        <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 14, padding: '12px 16px', marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                                                            <div>
                                                                <span style={{ fontWeight: 800, color: '#065F46', fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                                                                    <i className="fas fa-check-circle" /> Card Fully Completed (All {totalStamps} stamps collected)
                                                                </span>
                                                                <small style={{ color: '#047857', display: 'block' }}>
                                                                    You can select any processed stamp below to edit its recorded payment details.
                                                                </small>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                className="btn btn-sm btn-primary"
                                                                onClick={() => setCurrentMode('addcard')}
                                                                style={{ borderRadius: 10, fontWeight: 700, fontSize: '0.78rem', padding: '6px 14px' }}
                                                            >
                                                                <i className="fas fa-plus-circle" style={{ marginRight: 6 }} /> Add New Card
                                                            </button>
                                                        </div>
                                                    )}

                                                    {/* Current Stamp Progress Section (Always visible, stamps directly selectable) */}
                                                    <div
                                                        style={{
                                                            background: '#FFFFFF',
                                                            borderRadius: 16,
                                                            border: '1.5px solid #E2E8F0',
                                                            marginBottom: 16,
                                                            overflow: 'hidden',
                                                            boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                                                        }}
                                                    >
                                                        {/* Header */}
                                                        <div
                                                            style={{
                                                                padding: '14px 18px',
                                                                background: '#F8FAFC',
                                                                borderBottom: '1px solid #E2E8F0',
                                                                display: 'flex',
                                                                justifyContent: 'space-between',
                                                                alignItems: 'center'
                                                            }}
                                                        >
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                                <div
                                                                    style={{
                                                                        width: 38,
                                                                        height: 38,
                                                                        borderRadius: 10,
                                                                        background: 'var(--firstloop-primary, #0E88B8)',
                                                                        color: '#FFFFFF',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        fontSize: '1rem',
                                                                        flexShrink: 0
                                                                    }}
                                                                >
                                                                    <i className="fas fa-stamp" />
                                                                </div>
                                                                <div>
                                                                    <span style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--text-primary)', display: 'block' }}>
                                                                        Current Stamp Progress
                                                                    </span>
                                                                    <span style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 600 }}>
                                                                        {remainingStamps} stamp{remainingStamps > 1 ? 's' : ''} remaining • Select a stamp number below
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            <span
                                                                style={{
                                                                    fontSize: '0.8rem',
                                                                    fontWeight: 800,
                                                                    color: 'var(--firstloop-primary, #0E88B8)',
                                                                    background: '#FFFFFF',
                                                                    padding: '4px 12px',
                                                                    borderRadius: 20,
                                                                    border: '1px solid #CBD5E1'
                                                                }}
                                                            >
                                                                {collectedStamps}/{totalStamps} Stamps
                                                            </span>
                                                        </div>

                                                        {/* Stamp Circles: Directly Selectable (Matching Screenshot) */}
                                                        <div style={{ padding: '16px 18px', background: '#FFFFFF' }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                                                <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                                    Select Stamp Number to Process or Edit:
                                                                </span>
                                                                <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
                                                                    Click on any circle
                                                                </span>
                                                            </div>

                                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                                                                {Array.from({ length: totalStamps }).map((_, idx) => {
                                                                    const levelData = selectedCardDetails?.CustomerStampLevels?.[idx] || selectedCardDetails?.levelRewards?.[idx] || selectedCardDetails?.stamp_levels?.[idx]
                                                                    const isPaid = levelData?.status !== undefined
                                                                        ? Number(levelData.status) === 1
                                                                        : (isCompleted || idx < collectedStamps)
                                                                    const isSelected = selectedStampIndex === idx
                                                                    const isCurrentNext = idx === firstUnprocessedIndex
                                                                    const isLocked = !isPaid && !isCurrentNext
                                                                    const hasFree = Number(levelData?.free_stamp) === 1 || levelData?.free_stamp === true || levelData?.free_stamp === '1' || Boolean(levelData?.free_text)
                                                                    const freePerkText = levelData?.free_text || ''

                                                                    return (
                                                                        <div
                                                                            key={idx}
                                                                            onClick={() => handleSelectStamp(idx)}
                                                                            role="button"
                                                                            tabIndex={isLocked ? -1 : 0}
                                                                            style={{
                                                                                display: 'flex',
                                                                                flexDirection: 'column',
                                                                                alignItems: 'center',
                                                                                cursor: isLocked ? 'not-allowed' : 'pointer',
                                                                                padding: '4px 6px',
                                                                                borderRadius: 12,
                                                                                background: isSelected ? 'rgba(14, 136, 184, 0.08)' : 'transparent',
                                                                                border: isSelected ? '1.5px solid var(--firstloop-primary, #0E88B8)' : '1.5px solid transparent',
                                                                                opacity: isLocked ? 0.48 : 1,
                                                                                transition: 'all 0.15s ease'
                                                                            }}
                                                                        >
                                                                            <div
                                                                                    title={`Stamp ${idx + 1}: ${isPaid ? 'Completed • Click to Edit' : (isCurrentNext ? 'Next Stamp in Line • Click to Process' : `Locked • Complete Stamp #${firstUnprocessedIndex + 1} first`)}${levelData?.reward ? ` • ${levelData.reward}` : ''}${hasFree ? ` (Free: ${freePerkText || 'Free Perk'})` : ''}`}
                                                                                    style={{
                                                                                        width: 44,
                                                                                        height: 44,
                                                                                        borderRadius: `${selectedCardDetails?.stamp_radius ?? 50}%`,
                                                                                        background: isSelected
                                                                                            ? 'var(--firstloop-primary, #0E88B8)'
                                                                                            : (isPaid
                                                                                                ? 'linear-gradient(135deg, #059669 0%, #10B981 100%)'
                                                                                                : (isCurrentNext ? 'var(--firstloop-primary, #0284C7)' : '#F1F5F9')),
                                                                                        color: (isSelected || isPaid || isCurrentNext) ? '#FFFFFF' : '#334155',
                                                                                        border: isSelected
                                                                                            ? '2px solid #0369A1'
                                                                                            : (isPaid
                                                                                                ? 'none'
                                                                                                : (isCurrentNext
                                                                                                    ? '2px solid var(--firstloop-primary, #0284C7)'
                                                                                                    : (hasFree ? '1.5px solid #CBD5E1' : '1.5px dashed #CBD5E1'))),
                                                                                        display: 'flex',
                                                                                        flexDirection: 'column',
                                                                                        alignItems: 'center',
                                                                                        justifyContent: 'center',
                                                                                        fontWeight: 800,
                                                                                        fontSize: '0.86rem',
                                                                                        boxShadow: isSelected
                                                                                            ? '0 0 0 3px rgba(14, 136, 184, 0.3), 0 4px 10px rgba(14, 136, 184, 0.25)'
                                                                                            : (isPaid
                                                                                                ? '0 2px 6px rgba(16, 185, 129, 0.3)'
                                                                                                : (isCurrentNext ? '0 0 0 3px rgba(2, 132, 199, 0.25)' : 'none')),
                                                                                        transform: isSelected ? 'scale(1.08)' : 'scale(1)',
                                                                                        transition: 'all 0.2s ease',
                                                                                        position: 'relative',
                                                                                        overflow: 'hidden'
                                                                                    }}
                                                                                >
                                                                                    {isPaid ? (
                                                                                        isSelected ? (
                                                                                            <i className="fas fa-edit" style={{ fontSize: '0.84rem' }} />
                                                                                        ) : (
                                                                                            <i className="fas fa-check" style={{ fontSize: '0.94rem' }} />
                                                                                        )
                                                                                    ) : isCurrentNext ? (
                                                                                        idx + 1
                                                                                    ) : (hasFree && idx !== totalStamps - 1) ? (
                                                                                        (() => {
                                                                                            const freeText = String(freePerkText || 'Free').trim()
                                                                                            const numMatch = freeText.match(/^(\d+)\s*([a-zA-Z]+)?/)
                                                                                            if (numMatch) {
                                                                                                return (
                                                                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>
                                                                                                        <span style={{ fontSize: '0.78rem', fontWeight: 800 }}>{numMatch[1]}</span>
                                                                                                        <span style={{ fontSize: '0.52rem', fontWeight: 700, color: '#64748B' }}>{numMatch[2] || 'min'}</span>
                                                                                                    </div>
                                                                                                )
                                                                                            }
                                                                                            return (
                                                                                                <span style={{ fontSize: '0.64rem', fontWeight: 800, textTransform: 'uppercase', maxWidth: 36, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                                                    {freeText.slice(0, 4)}
                                                                                                </span>
                                                                                            )
                                                                                        })()
                                                                                    ) : idx === totalStamps - 1 ? (
                                                                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>
                                                                                            <i className="fas fa-gift" style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: 2 }} />
                                                                                            <span style={{ fontSize: '0.5rem', fontWeight: 800, color: '#64748B' }}>Free</span>
                                                                                        </div>
                                                                                    ) : (
                                                                                        <span style={{ fontSize: '0.82rem', color: '#64748B' }}>{idx + 1}</span>
                                                                                    )}
                                                                                </div>

                                                                                {/* Bottom Label matching Image 2 */}
                                                                                {isCurrentNext ? (
                                                                                    <span
                                                                                        style={{
                                                                                            fontSize: '0.62rem',
                                                                                            fontWeight: 800,
                                                                                            color: '#0284C7',
                                                                                            background: 'rgba(2, 132, 199, 0.12)',
                                                                                            border: '1px solid rgba(2, 132, 199, 0.3)',
                                                                                            padding: '1px 8px',
                                                                                            borderRadius: 999,
                                                                                            marginTop: 4
                                                                                        }}
                                                                                    >
                                                                                        Next
                                                                                    </span>
                                                                                ) : (hasFree && !isPaid && idx !== totalStamps - 1) ? (
                                                                                    <span
                                                                                        style={{
                                                                                            fontSize: '0.6rem',
                                                                                            fontWeight: 800,
                                                                                            color: '#475569',
                                                                                            background: '#F1F5F9',
                                                                                            border: '1px solid #CBD5E1',
                                                                                            padding: '1px 7px',
                                                                                            borderRadius: 999,
                                                                                            marginTop: 4
                                                                                        }}
                                                                                    >
                                                                                        Free
                                                                                    </span>
                                                                                ) : (
                                                                                    <span
                                                                                        style={{
                                                                                            fontSize: '0.68rem',
                                                                                            fontWeight: 700,
                                                                                            color: '#94A3B8',
                                                                                            marginTop: 4
                                                                                        }}
                                                                                    >
                                                                                        {isPaid && isSelected ? 'Edit' : `S-${idx + 1}`}
                                                                                    </span>
                                                                                )}
                                                                        </div>
                                                                    )
                                                                })}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* DETAILS AREA: Shown when a stamp number is selected */}
                                                    {selectedStampIndex !== null ? (
                                                        <div>
                                                            {/* Active Selection Banner */}
                                                            <div
                                                                style={{
                                                                    background: isSelectedStampProcessed ? 'rgba(245, 158, 11, 0.08)' : 'rgba(14, 136, 184, 0.08)',
                                                                    border: isSelectedStampProcessed ? '1.5px solid rgba(245, 158, 11, 0.35)' : '1.5px solid rgba(14, 136, 184, 0.3)',
                                                                    borderRadius: 12,
                                                                    padding: '10px 14px',
                                                                    marginBottom: 16,
                                                                    display: 'flex',
                                                                    justifyContent: 'space-between',
                                                                    alignItems: 'center',
                                                                    flexWrap: 'wrap',
                                                                    gap: 8
                                                                }}
                                                            >
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                                    <span
                                                                        className="badge"
                                                                        style={{
                                                                            background: isSelectedStampProcessed ? '#D97706' : 'var(--firstloop-primary, #0E88B8)',
                                                                            color: '#FFFFFF',
                                                                            fontWeight: 800,
                                                                            fontSize: '0.78rem',
                                                                            padding: '4px 8px',
                                                                            borderRadius: 6
                                                                        }}
                                                                    >
                                                                        {isSelectedStampProcessed ? (
                                                                            <><i className="fas fa-edit" style={{ marginRight: 4 }} /> Edit Stamp #{selectedStampIndex + 1}</>
                                                                        ) : (
                                                                            <><i className="fas fa-stamp" style={{ marginRight: 4 }} /> Stamp #{selectedStampIndex + 1} Check-In</>
                                                                        )}
                                                                    </span>
                                                                    <span style={{ fontSize: '0.8rem', color: isSelectedStampProcessed ? '#B45309' : '#0369A1', fontWeight: 600 }}>
                                                                        {isSelectedStampProcessed
                                                                            ? 'Already processed. Submitting will update this stamp record.'
                                                                            : 'Selected for check-in.'}
                                                                    </span>
                                                                </div>

                                                                <button
                                                                    type="button"
                                                                    onClick={() => setSelectedStampIndex(null)}
                                                                    style={{
                                                                        background: 'none',
                                                                        border: 'none',
                                                                        color: '#64748B',
                                                                        fontSize: '0.75rem',
                                                                        cursor: 'pointer',
                                                                        fontWeight: 700
                                                                    }}
                                                                >
                                                                    Change Stamp <i className="fas fa-times" />
                                                                </button>
                                                            </div>

                                                            {/* 1. Transaction Payment Amount */}
                                                            <div className="form-group mb-3">
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                                                    <label style={{ fontSize: '0.82rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                                                                        Transaction Payment Amount
                                                                    </label>
                                                                    {currentRewardType === 'Discount' && currentDiscountPercent > 0 && (
                                                                        <span style={{ fontSize: '0.74rem', color: '#0284C7', fontWeight: 700 }}>
                                                                            {currentDiscountPercent}% discount will be applied
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                {currentRewardType === 'Free' ? (
                                                                    <div
                                                                        style={{
                                                                            background: 'rgba(16, 185, 129, 0.08)',
                                                                            border: '1px solid rgba(16, 185, 129, 0.25)',
                                                                            borderRadius: 10,
                                                                            padding: '10px 14px',
                                                                            fontSize: '0.85rem',
                                                                            fontWeight: 700,
                                                                            color: '#059669',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            gap: 8
                                                                        }}
                                                                    >
                                                                        <i className="fas fa-gift" />
                                                                        <span>Free Stamp Perk — No payment amount required</span>
                                                                    </div>
                                                                ) : (
                                                                    <div style={{ position: 'relative' }}>
                                                                        <span
                                                                            style={{
                                                                                position: 'absolute',
                                                                                left: 14,
                                                                                top: '50%',
                                                                                transform: 'translateY(-50%)',
                                                                                fontWeight: 800,
                                                                                color: '#64748B',
                                                                                fontSize: '0.9rem'
                                                                            }}
                                                                        >
                                                                            ₹
                                                                        </span>
                                                                        <input
                                                                            type="number"
                                                                            step="0.01"
                                                                            min="0"
                                                                            className="form-control"
                                                                            placeholder="Enter transaction amount (e.g. 100)..."
                                                                            value={paymentAmount}
                                                                            onChange={(e) => setPaymentAmount(e.target.value)}
                                                                            style={{
                                                                                height: 42,
                                                                                paddingLeft: 30,
                                                                                borderRadius: 10,
                                                                                fontWeight: 700,
                                                                                fontSize: '0.92rem',
                                                                                border: '1.5px solid #CBD5E1'
                                                                            }}
                                                                        />
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* 2. Current Stamp Perk */}
                                                            <div
                                                                style={{
                                                                    background: '#F8FAFC',
                                                                    borderRadius: 12,
                                                                    padding: '12px 16px',
                                                                    border: '1px solid #E2E8F0',
                                                                    marginBottom: 12,
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'space-between',
                                                                    flexWrap: 'wrap',
                                                                    gap: 8
                                                                }}
                                                            >
                                                                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                                                                    Current Stamp Perk:
                                                                </span>
                                                                <span
                                                                    className="badge"
                                                                    style={{
                                                                        background: currentRewardType === 'Discount' ? '#0284C7' : (currentRewardType === 'Paid' ? '#F59E0B' : '#10B981'),
                                                                        color: '#FFF',
                                                                        fontWeight: 800,
                                                                        padding: '5px 12px',
                                                                        borderRadius: 6,
                                                                        fontSize: '0.8rem',
                                                                        display: 'inline-flex',
                                                                        alignItems: 'center',
                                                                        gap: 6
                                                                    }}
                                                                >
                                                                    <i className={currentRewardType === 'Discount' ? 'fas fa-percent' : (currentRewardType === 'Paid' ? 'fas fa-tag' : 'fas fa-gift')} />
                                                                    <span>{currentPerkText || (currentRewardType === 'Discount' ? 'Discount Perk' : (currentRewardType === 'Paid' ? 'Paid Perk' : 'Free Item'))}</span>
                                                                </span>
                                                            </div>

                                                            {/* 3. Payable Amount */}
                                                            <div
                                                                style={{
                                                                    background: currentRewardType === 'Discount'
                                                                        ? 'rgba(14, 136, 184, 0.06)'
                                                                        : (currentRewardType === 'Free' ? 'rgba(16, 185, 129, 0.06)' : '#F8FAFC'),
                                                                    borderRadius: 12,
                                                                    padding: '12px 16px',
                                                                    border: currentRewardType === 'Discount'
                                                                        ? '1px solid rgba(14, 136, 184, 0.25)'
                                                                        : (currentRewardType === 'Free' ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid #E2E8F0'),
                                                                    marginBottom: 12,
                                                                    display: 'flex',
                                                                    justifyContent: 'space-between',
                                                                    alignItems: 'center'
                                                                }}
                                                            >
                                                                <div>
                                                                    <span style={{ color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.85rem', display: 'block' }}>
                                                                        Payable Amount:
                                                                    </span>
                                                                    {currentRewardType === 'Discount' && currentDiscountPercent > 0 && (
                                                                        <small style={{ color: '#0284C7', fontSize: '0.72rem', fontWeight: 600 }}>
                                                                            ({currentDiscountPercent}% discount applied to entered amount)
                                                                        </small>
                                                                    )}
                                                                </div>
                                                                <strong style={{ color: currentRewardType === 'Free' ? '#059669' : 'var(--firstloop-primary, #0E88B8)', fontWeight: 800, fontSize: '1.15rem' }}>
                                                                    {currentRewardType === 'Free' ? '0.00' : finalPayableAmount.toFixed(2)}
                                                                </strong>
                                                            </div>

                                                            {/* 4. Other details such as Free Stamp and Discount */}
                                                            <div
                                                                style={{
                                                                    background: '#F8FAFC',
                                                                    borderRadius: 12,
                                                                    padding: '12px 16px',
                                                                    border: '1px solid #E2E8F0',
                                                                    marginBottom: 14,
                                                                    display: 'flex',
                                                                    flexDirection: 'column',
                                                                    gap: 8
                                                                }}
                                                            >
                                                                <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                                    Other details such as Free Stamp and Discount:
                                                                </span>

                                                                {/* Discount Detail */}
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
                                                                    <span style={{ color: currentRewardType === 'Discount' ? '#0284C7' : '#64748B', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                                                                        <i className="fas fa-percent" />
                                                                        <span>Discount:</span>
                                                                    </span>
                                                                    {currentRewardType === 'Discount' && currentDiscountPercent > 0 ? (
                                                                        <span style={{ color: '#0284C7', fontWeight: 800 }}>
                                                                            {currentDiscountPercent}% (-{discountAmountDeduction.toFixed(2)})
                                                                        </span>
                                                                    ) : (
                                                                        <span style={{ color: '#94A3B8', fontWeight: 600 }}>
                                                                            No discount applicable
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                {/* Free Stamp / Bonus Perk Detail */}
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', borderTop: '1px dashed #E2E8F0', paddingTop: 8 }}>
                                                                    <span style={{ color: hasFreeBonus ? '#059669' : '#64748B', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                                                                        <i className="fas fa-gift" />
                                                                        <span>Free Stamp Perk:</span>
                                                                    </span>
                                                                    {hasFreeBonus ? (
                                                                        <span
                                                                            className="badge"
                                                                            style={{
                                                                                background: 'rgba(16, 185, 129, 0.15)',
                                                                                color: '#059669',
                                                                                border: '1px solid rgba(16, 185, 129, 0.3)',
                                                                                fontWeight: 800,
                                                                                padding: '3px 8px',
                                                                                borderRadius: 6,
                                                                                fontSize: '0.76rem',
                                                                                display: 'inline-flex',
                                                                                alignItems: 'center',
                                                                                gap: 4
                                                                            }}
                                                                        >
                                                                            <i className="fas fa-gift" />
                                                                            <span>Free: {freeBonusText || 'Free Bonus Perk'}</span>
                                                                        </span>
                                                                    ) : (
                                                                        <span style={{ color: '#94A3B8', fontWeight: 600 }}>
                                                                            None
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* 5. Select Payment Method */}
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
                                                                            gap: 8,
                                                                            transition: 'all 0.15s ease'
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
                                                                            gap: 8,
                                                                            transition: 'all 0.15s ease'
                                                                        }}
                                                                    >
                                                                        <i className="fas fa-credit-card" />
                                                                        <span>Online (UPI / Card)</span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Submit Button */}
                                                            <button
                                                                type="submit"
                                                                className="btn firstloop-btn-primary"
                                                                disabled={submittingCheckIn}
                                                                style={{
                                                                    width: '100%',
                                                                    padding: '13px',
                                                                    borderRadius: 12,
                                                                    fontWeight: 800,
                                                                    fontSize: '0.92rem',
                                                                    marginTop: 6,
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
                                                                        <span>{isSelectedStampProcessed ? 'Updating Stamp Record...' : 'Saving Card Entry...'}</span>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <i className={isSelectedStampProcessed ? "fas fa-save" : "fas fa-check-circle"} />
                                                                        <span>
                                                                            {isSelectedStampProcessed
                                                                                ? `Update Stamp #${selectedStampIndex + 1} Entry ${finalPayableAmount > 0 ? `(₹${finalPayableAmount.toFixed(2)})` : ''}`
                                                                                : (currentRewardType === 'Free'
                                                                                    ? `Log Free Stamp #${selectedStampIndex + 1} Entry`
                                                                                    : `Log Stamp #${selectedStampIndex + 1} & Collect ₹${finalPayableAmount.toFixed(2)}`)}
                                                                        </span>
                                                                    </>
                                                                )}
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        /* Step-by-Step Instruction box (Matching Screenshot) */
                                                        <div
                                                            style={{
                                                                padding: '24px 18px',
                                                                borderRadius: 14,
                                                                border: '1.5px dashed #CBD5E1',
                                                                background: '#F8FAFC',
                                                                color: '#64748B',
                                                                textAlign: 'center',
                                                                display: 'flex',
                                                                flexDirection: 'column',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                gap: 8
                                                            }}
                                                        >
                                                            <div
                                                                style={{
                                                                    width: 44,
                                                                    height: 44,
                                                                    borderRadius: '50%',
                                                                    background: '#E2E8F0',
                                                                    color: 'var(--firstloop-primary, #0E88B8)',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    fontSize: '1.2rem'
                                                                }}
                                                            >
                                                                <i className="fas fa-hand-pointer" />
                                                            </div>
                                                            <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                                                                {firstUnprocessedIndex < totalStamps ? `Step-by-Step: Click on Stamp #${firstUnprocessedIndex + 1}` : 'All Stamps Completed'}
                                                            </div>
                                                            <div style={{ fontSize: '0.8rem', color: '#64748B', maxWidth: 320 }}>
                                                                {firstUnprocessedIndex < totalStamps
                                                                    ? `Stamps must be processed step by step. Click Stamp #${firstUnprocessedIndex + 1} to log this entry, or click any completed stamp to edit.`
                                                                    : 'All stamps on this card have been processed. You can select any stamp to edit.'}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                /* Membership Card Daily Check-In */
                                                <div>
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

                                                    <button
                                                        type="submit"
                                                        className="btn firstloop-btn-primary"
                                                        disabled={submittingCheckIn}
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
                                                                <span>Validating VIP Pass...</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <i className="fas fa-check-circle" />
                                                                <span>Confirm Daily VIP Check-In</span>
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            )}
                                        </form>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* MODE 2: ADD CARD TERMINAL UI */}
                {currentMode === 'addcard' && (
                    <div
                        style={{
                            border: '1.5px solid #CBD5E1',
                            borderRadius: 20,
                            padding: 24,
                            background: '#FFFFFF',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.04)'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                            <div>
                                <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>
                                    Assign New Loyalty Pass to {customer.name || 'Customer'}
                                </h4>
                                <p style={{ margin: '2px 0 0 0', fontSize: '0.82rem', color: '#64748B' }}>
                                    Select an available pass program from this branch to issue.
                                </p>
                            </div>

                            {/* Pass Type Selector */}
                            <div style={{ display: 'inline-flex', background: '#F1F5F9', padding: 3, borderRadius: 10, gap: 3 }}>
                                <button
                                    type="button"
                                    onClick={() => setAddCardType('stamp')}
                                    style={{
                                        border: 'none',
                                        background: addCardType === 'stamp' ? 'var(--firstloop-primary, #0E88B8)' : 'transparent',
                                        color: addCardType === 'stamp' ? '#FFFFFF' : '#475569',
                                        padding: '7px 16px',
                                        borderRadius: 8,
                                        fontSize: '0.8rem',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        transition: 'all 0.15s ease'
                                    }}
                                >
                                    <i className="fas fa-stamp" style={{ marginRight: 6 }} />
                                    Stamp Passes ({stampCardsList.length})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setAddCardType('membership')}
                                    style={{
                                        border: 'none',
                                        background: addCardType === 'membership' ? 'var(--firstloop-primary, #0E88B8)' : 'transparent',
                                        color: addCardType === 'membership' ? '#FFFFFF' : '#475569',
                                        padding: '7px 16px',
                                        borderRadius: 8,
                                        fontSize: '0.8rem',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        transition: 'all 0.15s ease'
                                    }}
                                >
                                    <i className="fas fa-crown" style={{ marginRight: 6 }} />
                                    VIP Memberships ({membershipCardsList.length})
                                </button>
                            </div>
                        </div>

                        {loadingBranchCards ? (
                            <div style={{ padding: '36px 0', textAlign: 'center', color: '#64748B' }}>
                                <i className="fas fa-spinner fa-spin" style={{ fontSize: '1.6rem', color: 'var(--firstloop-primary, #0E88B8)', marginBottom: 10 }} />
                                <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: 600 }}>Loading available branch passes...</p>
                            </div>
                        ) : (
                            <div>
                                <div style={{ marginBottom: 20 }}>
                                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 10, display: 'block' }}>
                                        Choose Pass Program:
                                    </span>

                                    {(addCardType === 'stamp' ? stampCardsList : membershipCardsList).length === 0 ? (
                                        <div style={{ padding: '24px', background: '#F8FAFC', borderRadius: 12, border: '1.5px dashed #CBD5E1', textAlign: 'center', color: '#64748B', fontSize: '0.86rem' }}>
                                            No {addCardType === 'stamp' ? 'stamp cards' : 'membership cards'} configured for this branch location.
                                        </div>
                                    ) : (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 14 }}>
                                            {(addCardType === 'stamp' ? stampCardsList : membershipCardsList).map(card => {
                                                const isSelected = String(selectedNewCardId) === String(card.id || card._id)
                                                const totalStampsVal = Number(card.number_of_stamps || card.total_stamps || 8)
                                                return (
                                                    <div
                                                        key={card.id || card._id}
                                                        onClick={() => setSelectedNewCardId(card.id || card._id)}
                                                        style={{
                                                            padding: 16,
                                                            borderRadius: 14,
                                                            border: isSelected ? '2px solid var(--firstloop-primary, #0E88B8)' : '1px solid #CBD5E1',
                                                            background: isSelected ? 'var(--firstloop-primary-light, #E6F2FA)' : '#FFFFFF',
                                                            cursor: 'pointer',
                                                            transition: 'all 0.15s ease',
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            justifyContent: 'space-between',
                                                            gap: 10,
                                                            boxShadow: isSelected ? '0 4px 14px rgba(14, 136, 184, 0.18)' : 'none'
                                                        }}
                                                    >
                                                        <div>
                                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                                <span style={{ fontWeight: 800, fontSize: '0.92rem', color: '#0F172A' }}>
                                                                    {card.title || card.name || 'Pass Program'}
                                                                </span>
                                                                {isSelected && (
                                                                    <i className="fas fa-check-circle" style={{ color: 'var(--firstloop-primary, #0E88B8)', fontSize: '1rem' }} />
                                                                )}
                                                            </div>
                                                            <div style={{ fontSize: '0.76rem', color: '#64748B', marginTop: 3 }}>
                                                                {card.brand_name || card.brandName || 'FirstLoop'}
                                                            </div>
                                                        </div>

                                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.74rem', fontWeight: 700 }}>
                                                            <span style={{ color: 'var(--firstloop-primary, #0E88B8)', background: '#FFFFFF', padding: '2px 8px', borderRadius: 6, border: '1px solid #BAE6FD' }}>
                                                                {addCardType === 'stamp' ? `${totalStampsVal} Stamps` : 'VIP Tier'}
                                                            </span>
                                                            <span style={{ color: '#64748B' }}>
                                                                {card.branch_name || 'Current Branch'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* Form Options */}
                                <div
                                    style={{
                                        background: '#F8FAFC',
                                        borderRadius: 14,
                                        border: '1px solid #E2E8F0',
                                        padding: '18px 20px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        flexWrap: 'wrap',
                                        gap: 16
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                                        {/* Initial Stamps */}
                                        {addCardType === 'stamp' && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569' }}>
                                                    Initial Stamps:
                                                </span>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="20"
                                                    className="form-control"
                                                    value={initialStamps}
                                                    onChange={(e) => setInitialStamps(e.target.value)}
                                                    style={{ width: 80, height: 38, fontSize: '0.85rem', fontWeight: 700, borderRadius: 8 }}
                                                />
                                            </div>
                                        )}

                                        {/* Notes */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569' }}>
                                                Notes:
                                            </span>
                                            <input
                                                type="text"
                                                placeholder="Optional issuance note..."
                                                className="form-control"
                                                value={addNotes}
                                                onChange={(e) => setAddNotes(e.target.value)}
                                                style={{ width: 220, height: 38, fontSize: '0.85rem', borderRadius: 8 }}
                                            />
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <button
                                        type="button"
                                        className="btn firstloop-btn-primary"
                                        onClick={handleAssignNewCard}
                                        disabled={submittingAddCard || !selectedNewCardId}
                                        style={{
                                            padding: '10px 22px',
                                            borderRadius: 10,
                                            fontWeight: 800,
                                            fontSize: '0.86rem',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 8,
                                            boxShadow: '0 4px 14px rgba(14, 136, 184, 0.25)'
                                        }}
                                    >
                                        {submittingAddCard ? (
                                            <>
                                                <i className="fas fa-spinner fa-spin" />
                                                <span>Issuing Card...</span>
                                            </>
                                        ) : (
                                            <>
                                                <i className="fas fa-plus-circle" />
                                                <span>Assign Pass to Customer</span>
                                            </>
                                        )}
                                    </button>
                                </div>

                                {addCardSuccess && (
                                    <div
                                        style={{
                                            marginTop: 16,
                                            padding: '14px 18px',
                                            borderRadius: 10,
                                            background: '#ECFDF5',
                                            border: '1.5px solid #10B981',
                                            color: '#065F46',
                                            fontSize: '0.86rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <i className="fas fa-check-circle" style={{ color: '#10B981', fontSize: '1.1rem' }} />
                                            <span><strong>Success:</strong> {addCardSuccess.message}</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setCurrentMode('checkin')}
                                            className="btn firstloop-btn-primary btn-sm"
                                            style={{ padding: '6px 14px', borderRadius: 8, fontWeight: 700, fontSize: '0.78rem' }}
                                        >
                                            Go to Check-In &rarr;
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Customer Card History Modal */}
            {historyModalOpen && selectedCard && (
                <CustomerCardHistory
                    isOpen={historyModalOpen}
                    onClose={() => setHistoryModalOpen(false)}
                    cardId={selectedCard.id}
                    card={selectedCard}
                />
            )}
        </div>
    )
}
