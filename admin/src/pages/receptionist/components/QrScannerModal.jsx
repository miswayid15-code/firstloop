import { useState, useEffect, useRef, useMemo } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { toast } from 'react-hot-toast'
import API from '../../../api.js'
import CustomerCard from '../../../components/CustomerCard.jsx'
import CustomerCardHistory from '../../../components/CustomerCardHistory.jsx'
import { fetchCustomerStampLevelsApi } from '../../../services/cardService.js'

export default function QrScannerModal({ isOpen, onClose, onSuccess, branchId = '' }) {
    let receptionist = {}
    try {
        const rawReceptionist = localStorage.getItem("receptionist_data")
        if (rawReceptionist && rawReceptionist !== "null" && rawReceptionist !== "undefined") {
            receptionist = JSON.parse(rawReceptionist) || {}
        }
    } catch (e) {
        console.error("Error parsing receptionist_data:", e)
    }

    const [scanning, setScanning] = useState(false)
    const [cameraError, setCameraError] = useState(null)
    const [cameraFacing, setCameraFacing] = useState('environment') // 'environment' | 'user'
    const [manualCode, setManualCode] = useState('')
    const [loadingCustomer, setLoadingCustomer] = useState(false)
    const [matchedCustomer, setMatchedCustomer] = useState(null)
    const [selectedCustomerBranch, setSelectedCustomerBranch] = useState('all')
    const [selectedCard, setSelectedCard] = useState(null)
    const [selectedCardDetails, setSelectedCardDetails] = useState(null)
    const [loadingCardDetails, setLoadingCardDetails] = useState(false)
    const [paymentMethod, setPaymentMethod] = useState('Cash')
    const [paymentAmount, setPaymentAmount] = useState('0.00')
    const [savingCheckIn, setSavingCheckIn] = useState(false)
    const [lastReceipt, setLastReceipt] = useState(null)
    const [historyModalOpen, setHistoryModalOpen] = useState(false)

    const scannerRef = useRef(null)
    const fileInputRef = useRef(null)

    // Reset state on modal open/close
    useEffect(() => {
        if (!isOpen) {
            stopScanner()
            setMatchedCustomer(null)
            setSelectedCard(null)
            setSelectedCardDetails(null)
            setSelectedCustomerBranch('all')
            setManualCode('')
            setCameraError(null)
            setLastReceipt(null)
            setHistoryModalOpen(false)
        }
    }, [isOpen])

    const stopScanner = async () => {
        if (scannerRef.current) {
            try {
                if (scannerRef.current.isScanning) {
                    await scannerRef.current.stop()
                }
                scannerRef.current.clear()
            } catch (err) {
                console.error("Error stopping scanner:", err)
            }
            scannerRef.current = null
        }
        setScanning(false)
    }

    const startScanner = async () => {
        setCameraError(null)
        setScanning(true)

        try {
            await stopScanner()

            // Small delay to ensure DOM element is mounted
            const readerEl = document.getElementById("qr-modal-camera-box")
            if (!readerEl) return

            const html5QrCode = new Html5Qrcode("qr-modal-camera-box")
            scannerRef.current = html5QrCode

            await html5QrCode.start(
                { facingMode: cameraFacing },
                {
                    fps: 15,
                    qrbox: (viewfinderWidth, viewfinderHeight) => {
                        const min = Math.min(viewfinderWidth, viewfinderHeight)
                        return { width: Math.floor(min * 0.72), height: Math.floor(min * 0.72) }
                    }
                },
                (decodedText) => {
                    handleCodeScanned(decodedText)
                },
                () => {
                    // Ignore transient per-frame decode misses
                }
            )
        } catch (err) {
            console.error("Camera startup error:", err)
            setCameraError("Unable to access camera. You can upload a QR image or flip the camera.")
            setScanning(false)
        }
    }

    // Lifecycle of camera when modal is open and in scanning mode
    useEffect(() => {
        if (isOpen && !matchedCustomer) {
            const timer = setTimeout(() => {
                startScanner()
            }, 300)
            return () => {
                clearTimeout(timer)
                stopScanner()
            }
        } else {
            stopScanner()
        }
    }, [isOpen, cameraFacing, matchedCustomer])

    // Refresh active card details to reflect updated stamps/levels
    const refreshCardDetails = async (cardId, cardType, customerId) => {
        if (!cardId || !customerId) return
        setLoadingCardDetails(true)
        try {
            const data = await fetchCustomerStampLevelsApi(cardId, cardType, customerId)
            if (data) {
                setSelectedCardDetails(data)
                const amt = Number(data?.overAll_amt ?? data?.current_amt ?? 0).toFixed(2)
                setPaymentAmount(amt)
            }
        } catch (err) {
            console.error("Error refreshing card details:", err)
        } finally {
            setLoadingCardDetails(false)
        }
    }

    // Load full card levels when a card is selected
    useEffect(() => {
        if (!selectedCard?.id || !matchedCustomer?.id) {
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
                    matchedCustomer.id
                )
                if (isMounted) {
                    setSelectedCardDetails(data || selectedCard)
                    const amt = Number(data?.overAll_amt ?? data?.current_amt ?? selectedCard?.amount ?? 0).toFixed(2)
                    setPaymentAmount(amt)
                }
            } catch (err) {
                console.error("Error loading card levels:", err)
                if (isMounted) setSelectedCardDetails(selectedCard)
            } finally {
                if (isMounted) setLoadingCardDetails(false)
            }
        }
        loadCardDetails()
        return () => { isMounted = false }
    }, [selectedCard?.id, matchedCustomer?.id])

    // Discover branches across the matched customer's cards
    const customerBranches = useMemo(() => {
        if (!matchedCustomer || !Array.isArray(matchedCustomer.cards)) return []
        const map = new Map()
        matchedCustomer.cards.forEach(c => {
            const bName = c.branch_name || c.branch || 'Main Branch'
            const bId = String(c.branch_id || bName)
            if (!map.has(bId)) {
                map.set(bId, { id: bId, name: bName, count: 0 })
            }
            map.get(bId).count++
        })
        return Array.from(map.values())
    }, [matchedCustomer])

    // Cards filtered by selected branch
    const branchCards = useMemo(() => {
        if (!matchedCustomer || !Array.isArray(matchedCustomer.cards)) return []
        if (selectedCustomerBranch === 'all') return matchedCustomer.cards
        return matchedCustomer.cards.filter(c =>
            String(c.branch_id || c.branch_name || '') === String(selectedCustomerBranch) ||
            String(c.branch_name || '').toLowerCase() === String(selectedCustomerBranch).toLowerCase()
        )
    }, [matchedCustomer, selectedCustomerBranch])

    // Handle scanned string from camera, image, or manual input
    const handleCodeScanned = async (code) => {
        const rawCode = String(code || '').trim()
        if (!rawCode) return

        await stopScanner()
        setLoadingCustomer(true)
        setCameraError(null)

        try {
            const response = await API.post('firstloop/reception/scan-qr', {
                qr_code: rawCode
            })

            if (response?.data?.status == 1 && response.data.data) {
                const customerData = response.data.data
                setMatchedCustomer(customerData)
                setLastReceipt(null)

                if (Array.isArray(customerData.cards) && customerData.cards.length > 0) {
                    const matchedCard = customerData.cards.find(c =>
                        String(c.card_number || '').toLowerCase() === rawCode.toLowerCase() ||
                        String(c.id) === rawCode
                    ) || customerData.cards[0]

                    setSelectedCard(matchedCard)

                    // Auto-select branch matching receptionist or matched card
                    const recBranchName = receptionist?.user_branch || receptionist?.branch_name
                    const recBranchId = receptionist?.user_branch_id || receptionist?.branch_id
                    const cardBranchId = matchedCard.branch_id || matchedCard.branch_name

                    if (cardBranchId) {
                        setSelectedCustomerBranch(String(cardBranchId))
                    } else if (recBranchId || recBranchName) {
                        const matchingBranch = customerData.cards.find(c =>
                            (recBranchId && String(c.branch_id) === String(recBranchId)) ||
                            (recBranchName && String(c.branch_name).toLowerCase() === String(recBranchName).toLowerCase())
                        )
                        setSelectedCustomerBranch(matchingBranch ? String(matchingBranch.branch_id || matchingBranch.branch_name) : 'all')
                    } else {
                        setSelectedCustomerBranch('all')
                    }
                } else {
                    setSelectedCard(null)
                    setSelectedCustomerBranch('all')
                }
                toast.success(`Customer Identified: ${customerData.name || 'Customer'}`)
            } else {
                toast.error(response?.data?.message || "No customer or pass found for this QR code")
                // Restart scanner after short pause so user can try again
                setTimeout(() => {
                    if (isOpen && !matchedCustomer) startScanner()
                }, 1500)
            }
        } catch (err) {
            console.error("Scan-qr API error:", err)
            toast.error(err?.response?.data?.message || "Failed to identify QR code from server")
            setTimeout(() => {
                if (isOpen && !matchedCustomer) startScanner()
            }, 1500)
        } finally {
            setLoadingCustomer(false)
        }
    }

    // Handle image file upload for QR scanning
    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return

        setLoadingCustomer(true)
        try {
            await stopScanner()
            const html5QrCode = new Html5Qrcode("qr-modal-camera-box")
            const decoded = await html5QrCode.scanFile(file, true)
            handleCodeScanned(decoded)
        } catch (err) {
            console.error("File decode error:", err)
            toast.error("Could not find a valid QR code in this image.")
        } finally {
            setLoadingCustomer(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    // Handle Save / Submit Check-In & Stamp
    const handleConfirmCheckIn = async (e) => {
        if (e && e.preventDefault) e.preventDefault()

        if (!matchedCustomer || !selectedCard) {
            toast.error("Please select a valid customer and card pass")
            return
        }

        const isStamp = Number(selectedCard.card_type) === 1
        const totalStamps = Number(selectedCardDetails?.total_stamps || selectedCardDetails?.number_of_stamps || selectedCard?.total_stamps || 8)
        const currentCollected = Number(selectedCardDetails?.current_stamp ?? selectedCardDetails?.current_stamps ?? selectedCard?.current_stamp ?? selectedCard?.collected ?? 0)

        if (isStamp && currentCollected >= totalStamps) {
            toast.error("This stamp card is already fully completed!")
            return
        }

        setSavingCheckIn(true)
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
                    cus_id: Number(matchedCustomer.id),
                    card_id: Number(selectedCard.id),
                    payment_type: paymentMethod === 'Online' ? 2 : 1,
                    amount: parseFloat(paymentAmount) || 0,
                    stamp_level_id: stampLevelId
                }

                const res = await API.post('firstloop/customer/stamp-paid', payload)

                if (res?.data?.status == 1) {
                    const newStamps = currentCollected + 1
                    toast.success(res.data.message || "Stamp payment entry logged successfully! 🚀")

                    const receipt = {
                        receiptId: res.data.receipt_id || `RCP-${Date.now().toString().slice(-6)}`,
                        customerName: matchedCustomer.name || 'Customer',
                        customerPhone: matchedCustomer.phone || '-',
                        cardTitle: selectedCard.title || selectedCardDetails?.title || 'Stamp Pass',
                        cardNumber: selectedCard.card_number || '-',
                        previousStamps: currentCollected,
                        newStamps: newStamps,
                        totalStamps: totalStamps,
                        paymentMethod: paymentMethod,
                        paymentAmount: `$${parseFloat(paymentAmount).toFixed(2)}`,
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    }

                    // DO NOT CLOSE MODAL: keep modal open and refresh card details live!
                    setLastReceipt(receipt)

                    // Refresh card details so new stamp fills in live on card preview & progress circles
                    await refreshCardDetails(selectedCard.id, selectedCard.card_type, matchedCustomer.id)

                    if (onSuccess) onSuccess()
                } else {
                    toast.error(res?.data?.message || "Failed to log stamp entry")
                }
            } else {
                // Membership Daily Check-In
                toast.success("Membership Check-In Validated! 👑")
                const receipt = {
                    receiptId: `MBR-${Date.now().toString().slice(-6)}`,
                    customerName: matchedCustomer.name || 'Customer',
                    customerPhone: matchedCustomer.phone || '-',
                    cardTitle: selectedCard.title || 'Membership Pass',
                    cardNumber: selectedCard.card_number || '-',
                    paymentMethod: 'Daily Check-In Validated',
                    paymentAmount: '$0.00',
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }
                setLastReceipt(receipt)
                if (onSuccess) onSuccess()
            }
        } catch (err) {
            console.error("Check-In submission error:", err)
            toast.error(err?.response?.data?.message || "Failed to process check-in")
        } finally {
            setSavingCheckIn(false)
        }
    }

    const handleRescan = () => {
        setMatchedCustomer(null)
        setSelectedCard(null)
        setSelectedCardDetails(null)
        setLastReceipt(null)
        setManualCode('')
        setCameraError(null)
    }

    if (!isOpen) return null

    const isStampCard = Number(selectedCard?.card_type) === 1
    const totalStamps = Number(selectedCardDetails?.total_stamps || selectedCardDetails?.number_of_stamps || selectedCard?.total_stamps || 8)
    const collectedStamps = Number(selectedCardDetails?.current_stamp ?? selectedCardDetails?.current_stamps ?? selectedCard?.current_stamp ?? selectedCard?.collected ?? 0)
    const isCompleted = isStampCard && collectedStamps >= totalStamps
    const remainingStamps = Math.max(0, totalStamps - collectedStamps)

    // Merge card data with customer details to ensure full preview display
    const cardForPreview = {
        ...(selectedCard || {}),
        ...(selectedCardDetails || {}),
        customer_name: matchedCustomer?.name || selectedCardDetails?.customer_name || selectedCard?.customer_name || 'Customer',
        name: matchedCustomer?.name || selectedCardDetails?.name || selectedCard?.name || 'Customer'
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
                    maxWidth: matchedCustomer ? 1080 : 560,
                    maxHeight: '94vh',
                    overflowY: 'auto',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    border: '1px solid #E2E8F0',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'max-width 0.2s ease'
                }}
            >
                {/* Modal Header */}
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
                            <i className={matchedCustomer ? "fas fa-desktop" : "fas fa-qrcode"} />
                        </div>
                        <div>
                            <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 800, color: 'var(--text-muted)' }}>
                                {matchedCustomer ? 'CARD ENTRY & PAYMENT TERMINAL' : 'QR PASS SCANNER'}
                            </span>
                            <h4 style={{ margin: '2px 0 0 0', fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                                {matchedCustomer
                                    ? (selectedCard ? (isStampCard ? 'Stamp Card Payment & Entry Update' : 'Membership Daily Check-In Entry') : 'Customer Card Pass Check-In')
                                    : 'Scan Customer Pass QR'}
                            </h4>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {matchedCustomer && selectedCard && (
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

                        {matchedCustomer && (
                            <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary"
                                onClick={handleRescan}
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
                                <i className="fas fa-qrcode" />
                                <span>Scan Another QR</span>
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

                {/* Modal Body */}
                <div style={{ padding: 24 }}>
                    {matchedCustomer ? (
                        /* CASE: CUSTOMER IDENTIFIED - RICH TERMINAL VIEW */
                        <div>
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
                                                Receipt #{lastReceipt.receiptId} • {lastReceipt.paymentAmount} ({lastReceipt.paymentMethod})
                                                {lastReceipt.newStamps !== undefined && ` • Updated Progress: ${lastReceipt.newStamps}/${lastReceipt.totalStamps} Stamps`}
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

                            {/* Customer Profile Banner */}
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: 12,
                                    padding: '12px 16px',
                                    borderRadius: 14,
                                    background: 'var(--firstloop-primary-light, #E6F2FA)',
                                    border: '1px solid rgba(14, 136, 184, 0.2)',
                                    marginBottom: 18,
                                    flexWrap: 'wrap'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div
                                        style={{
                                            width: 44,
                                            height: 44,
                                            borderRadius: '50%',
                                            background: 'var(--firstloop-primary, #0E88B8)',
                                            color: '#FFFFFF',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontWeight: 800,
                                            fontSize: '1.1rem',
                                            flexShrink: 0
                                        }}
                                    >
                                        {matchedCustomer.name ? matchedCustomer.name.charAt(0).toUpperCase() : 'C'}
                                    </div>
                                    <div>
                                        <strong style={{ fontSize: '0.98rem', color: '#0F172A', display: 'block' }}>
                                            {matchedCustomer.name || 'Customer'}
                                        </strong>
                                        <span style={{ fontSize: '0.78rem', color: '#64748B', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                            {matchedCustomer.phone && <span><i className="fas fa-phone" style={{ marginRight: 4 }} />{matchedCustomer.phone}</span>}
                                            {matchedCustomer.email && <span><i className="fas fa-envelope" style={{ marginRight: 4 }} />{matchedCustomer.email}</span>}
                                        </span>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleRescan}
                                    className="btn btn-sm btn-outline-secondary"
                                    style={{ borderRadius: 8, fontSize: '0.78rem', fontWeight: 600 }}
                                >
                                    <i className="fas fa-sync" style={{ marginRight: 6 }} />
                                    Rescan Another Pass
                                </button>
                            </div>

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
                                            All Cards ({matchedCustomer.cards?.length || 0})
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
                                                        const matching = matchedCustomer.cards?.find(c =>
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
                                        No active card passes found for this customer.
                                    </p>
                                </div>
                            ) : (
                                /* UNIFIED TERMINAL CARD PANEL: MATCHING CustomerSearchModal & CardCheckInPayment */
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
                                            <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', fontWeight: 700, color: '#0369A1' }}>
                                                CARD-{selectedCard.card_number || selectedCard.id}
                                            </span>
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

                                                                    return (
                                                                        <div
                                                                            key={idx}
                                                                            title={`Stamp ${idx + 1}: ${isPaid ? 'Paid / Collected' : 'Pending / Not Paid'}`}
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
                                                                <p style={{ fontSize: '0.82rem', color: '#047857', margin: 0 }}>
                                                                    All {totalStamps} stamps collected. Customer has unlocked all reward perks!
                                                                </p>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                {/* Current Stamp Perk & Payable Amount */}
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

                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E2E8F0', paddingTop: 8 }}>
                                                                        <span style={{ color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.85rem' }}>Payable Amount:</span>
                                                                        <strong style={{ color: 'var(--firstloop-primary, #0E88B8)', fontWeight: 800, fontSize: '1.05rem' }}>
                                                                            {Number(selectedCardDetails?.overAll_amt ?? selectedCardDetails?.current_amt ?? paymentAmount ?? 0).toFixed(2)}
                                                                        </strong>
                                                                    </div>
                                                                </div>

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
                                                    disabled={savingCheckIn || (isStampCard && isCompleted)}
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
                                                    {savingCheckIn ? (
                                                        <>
                                                            <i className="fas fa-spinner fa-spin" />
                                                            <span>Saving Card Entry...</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <i className="fas fa-check-circle" />
                                                            <span>Save Card Entry &amp; Generate Payment Receipt</span>
                                                        </>
                                                    )}
                                                </button>
                                            </form>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* CASE: CAMERA SCANNER VIEW */
                        <div>
                            {/* Camera Box */}
                            <div
                                style={{
                                    position: 'relative',
                                    borderRadius: 16,
                                    overflow: 'hidden',
                                    background: '#0F172A',
                                    minHeight: 280,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <div id="qr-modal-camera-box" style={{ width: '100%', minHeight: 280 }} />

                                {loadingCustomer && (
                                    <div
                                        style={{
                                            position: 'absolute',
                                            inset: 0,
                                            background: 'rgba(15, 23, 42, 0.8)',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: '#FFFFFF',
                                            gap: 10,
                                            zIndex: 10
                                        }}
                                    >
                                        <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', color: 'var(--firstloop-primary, #0E88B8)' }} />
                                        <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Verifying Pass QR...</span>
                                    </div>
                                )}
                            </div>

                            {cameraError && (
                                <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 10, background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', fontSize: '0.8rem' }}>
                                    <i className="fas fa-exclamation-triangle" style={{ marginRight: 6 }} />
                                    {cameraError}
                                </div>
                            )}

                            {/* Camera Controls */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
                                <button
                                    type="button"
                                    className="btn btn-sm btn-outline-secondary"
                                    onClick={() => setCameraFacing(prev => prev === 'environment' ? 'user' : 'environment')}
                                    style={{ borderRadius: 8, fontSize: '0.78rem', fontWeight: 600 }}
                                >
                                    <i className="fas fa-sync" style={{ marginRight: 6 }} />
                                    Flip Camera
                                </button>

                                <label
                                    className="btn btn-sm btn-outline-secondary mb-0"
                                    style={{ borderRadius: 8, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
                                >
                                    <i className="fas fa-upload" style={{ marginRight: 6 }} />
                                    Upload QR Image
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileUpload}
                                        style={{ display: 'none' }}
                                    />
                                </label>
                            </div>

                            {/* Manual Entry Fallback */}
                            {/* <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px dashed #E2E8F0' }}>
                                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                                    Manual Pass / QR Code Entry
                                </span>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Enter card number or QR code..."
                                        value={manualCode}
                                        onChange={(e) => setManualCode(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleCodeScanned(manualCode)
                                        }}
                                        style={{ height: 40, borderRadius: 10, fontSize: '0.84rem' }}
                                    />
                                    <button
                                        type="button"
                                        className="btn firstloop-btn-primary"
                                        disabled={!manualCode.trim() || loadingCustomer}
                                        onClick={() => handleCodeScanned(manualCode)}
                                        style={{ padding: '0 16px', borderRadius: 10, fontWeight: 700, fontSize: '0.84rem' }}
                                    >
                                        Verify
                                    </button>
                                </div>
                            </div> */}
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
