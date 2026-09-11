import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useNavigate, useParams, useLocation } from 'react-router-dom'
import { toast } from "react-hot-toast"
import API from '../../api.js'
import CustomerCard from '../../components/CustomerCard.jsx'
import CustomerCardHistory from '../../components/CustomerCardHistory.jsx'
import { fetchCustomerStampLevelsApi } from '../../services/cardService.js'
import qrImg from '../../assets/img/qr-img.png'
import { Html5Qrcode } from 'html5-qrcode'

export default function CardCheckInPayment() {
    const navigate = useNavigate()
    const { branchId: paramBranchId } = useParams()
    const location = useLocation()
    const isMerchant = location.pathname.startsWith('/merchant')

    let receptionist = {}
    try {
        const rawReceptionist = localStorage.getItem("receptionist_data")
        if (rawReceptionist && rawReceptionist !== "null" && rawReceptionist !== "undefined") {
            receptionist = JSON.parse(rawReceptionist) || {}
        }
    } catch (e) {
        console.error("Error parsing receptionist_data:", e)
    }
    const [searchParams] = useSearchParams()
    const effectiveBranchId = paramBranchId || searchParams.get('branchId') || receptionist?.user_branch_id || receptionist?.branch_id || ''

    // Customers State
    const [customerList, setCustomerList] = useState([])
    const [loading, setLoading] = useState(false)

    // Mode: 'phone' or 'qr'
    const [activeTab, setActiveTab] = useState(searchParams.get('mode') === 'qr' ? 'qr' : 'phone')

    // Search state
    const [searchInput, setSearchInput] = useState(searchParams.get('phone') || '')
    const [searchResults, setSearchResults] = useState([])
    const [matchedCustomer, setMatchedCustomer] = useState(null)
    const [selectedCard, setSelectedCard] = useState(null)
    const [selectedCardDetails, setSelectedCardDetails] = useState(null)
    const [loadingCardDetails, setLoadingCardDetails] = useState(false)

    // QR Modal Scanner state
    const [qrScannerOpen, setQrScannerOpen] = useState(false)
    const [qrScanningState, setQrScanningState] = useState(false)
    const [scannerError, setScannerError] = useState(null)
    const [cameraFacing, setCameraFacing] = useState('environment') // 'environment' | 'user'
    const scannerRef = useRef(null)
    const fileInputRef = useRef(null)

    // Card Payment / Entry Form state
    const [paymentMethod, setPaymentMethod] = useState('Cash') // 'Cash' | 'Online'
    const [paymentAmount, setPaymentAmount] = useState('0.00')
   
    const [savingEntry, setSavingEntry] = useState(false)
    const [historyModalOpen, setHistoryModalOpen] = useState(false)
    const [successReceiptModal, setSuccessReceiptModal] = useState(null)
    const [paidCards, setPaidCards] = useState(new Set())
    const [selectedCustomerBranch, setSelectedCustomerBranch] = useState('all')

    const fetchCustomers = async () => {
        setLoading(true)
        try {
            const res = await API.post('firstloop/customer/fetch-branch-customers', {
                br_id: effectiveBranchId || undefined
            })

            if (res?.data?.status == 1 && res.data.data) {
                setCustomerList(res.data.data)
            } else {
                setCustomerList([])
            }
        } catch (error) {
            console.error('Error fetching customers:', error)
            toast.error("Failed to load customer list")
            setCustomerList([])
        } finally {
            setLoading(false)
        }
    }

    const fetchScanner = async (scannedCode) => {
        if (!scannedCode) return false
        setLoading(true)
        try {
            const response = await API.post('firstloop/reception/scan-qr', {
                qr_code: scannedCode
            })

            if (response?.data?.status == 1 && response.data.data) {
                const customerData = response.data.data
                setMatchedCustomer(customerData)
                setSearchInput(customerData.name || customerData.phone || '')
                setSearchResults([])

                if (Array.isArray(customerData.cards) && customerData.cards.length > 0) {
                    // Match specific card from scanned code if possible, else default to first
                    const exactCard = customerData.cards.find(c =>
                        String(c.card_number || '').toLowerCase() === String(scannedCode).toLowerCase() ||
                        String(c.id) === String(scannedCode)
                    ) || customerData.cards[0]
                    setSelectedCard(exactCard)
                } else {
                    setSelectedCard(null)
                }
                toast.success(response.data.message || `Customer found: ${customerData.name || 'Customer'}`)
                return true
            } else {
                toast.error(response?.data?.message || "No customer found for this QR code")
                return false
            }
        } catch (err) {
            console.error("Error in scan-qr API:", err)
            toast.error(err?.response?.data?.message || "Failed to identify QR code from server")
            return false
        } finally {
            setLoading(false)
        }
    }
    useEffect(() => {
        fetchCustomers()
    }, [effectiveBranchId])

    // Filter search results whenever search input or customer list changes
    useEffect(() => {
        const query = searchInput.trim().toLowerCase()
        if (!query) {
            setSearchResults([])
            return
        }

        const queryDigits = query.replace(/\D/g, '')

        const matches = customerList.filter(c => {
            const name = (c.name || '').toLowerCase()
            const email = (c.email || '').toLowerCase()
            const phone = String(c.phone || '')
            const phoneClean = phone.replace(/\D/g, '')

            const hasCardMatch = Array.isArray(c.cards) && c.cards.some(card =>
                (card.title && card.title.toLowerCase().includes(query)) ||
                (card.card_number && card.card_number.toLowerCase().includes(query))
            )

            return (
                name.includes(query) ||
                email.includes(query) ||
                phone.includes(query) ||
                (queryDigits.length >= 2 && phoneClean.includes(queryDigits)) ||
                hasCardMatch
            )
        })

        setSearchResults(matches)
    }, [searchInput, customerList])

    // Pre-load customer if phone is passed in URL query
    useEffect(() => {
        const initialPhone = searchParams.get('phone')
        if (initialPhone && customerList.length > 0) {
            const found = customerList.find(c =>
                String(c.phone).includes(initialPhone) ||
                (c.name && c.name.toLowerCase().includes(initialPhone.toLowerCase()))
            )
            if (found) {
                selectCustomer(found)
            }
        }
    }, [searchParams, customerList])

    // Fetch full card design details whenever selected card changes
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
                    const finalAmt = Number(
                        data?.overAll_amt ??
                        data?.current_amt ??
                        selectedCard?.overAll_amt ??
                        selectedCard?.current_amt ??
                        0
                    ).toFixed(2)
                    setPaymentAmount(String(finalAmt))
                }
            } catch (err) {
                console.error('Error fetching card details in CheckIn:', err)
                if (isMounted) {
                    setSelectedCardDetails(selectedCard)
                }
            } finally {
                if (isMounted) {
                    setLoadingCardDetails(false)
                }
            }
        }

        loadCardDetails()

        return () => {
            isMounted = false
        }
    }, [selectedCard?.id, selectedCard?.card_type, matchedCustomer?.id])

    const selectCustomer = (customer) => {
        setMatchedCustomer(customer)
        setSearchInput(customer.name || customer.phone || '')
        setSearchResults([])
        setSelectedCustomerBranch('all')
        const cards = Array.isArray(customer.cards) ? customer.cards : []
        if (cards.length > 0) {
            setSelectedCard(cards[0])
        } else {
            setSelectedCard(null)
        }
    }

    const clearSelectedCustomer = () => {
        setMatchedCustomer(null)
        setSelectedCard(null)
        setSelectedCardDetails(null)
        setSearchInput('')
        setSearchResults([])
        setSelectedCustomerBranch('all')
    }

    // Navigate to Add Card to Customer page
    const handleNavigateToAddCustomer = () => {
        const branchId = effectiveBranchId || ''
        if (isMerchant) {
            navigate(`/merchant/add-card-customer/${branchId}`)
        } else {
            navigate(`/receptionist/add-card-customer/${branchId}`)
        }
    }

    // Stop and cleanup html5QrCode scanner instance
    const stopScanner = async () => {
        if (scannerRef.current) {
            try {
                if (scannerRef.current.isScanning) {
                    await scannerRef.current.stop()
                }
                scannerRef.current.clear()
            } catch (err) {
                console.error("Error stopping QR scanner:", err)
            }
            scannerRef.current = null
        }
        setQrScanningState(false)
    }

    // Process decoded QR text and match to customer/card
    const handleQrCodeScanned = async (decodedText) => {
        if (!decodedText) return
        // console.log("QR Code Decoded:", decodedText)

        await stopScanner()
        setQrScannerOpen(false)

        const raw = String(decodedText).trim()

        // 1. First call the scan-qr API
        const success = await fetchScanner(raw)
        if (success) return

        // 2. Fallback: Try finding match in already fetched customerList
        let matchedCus = null
        let matchedCard = null

        for (const cus of customerList) {
            if (Array.isArray(cus.cards)) {
                for (const card of cus.cards) {
                    const cardNo = String(card.card_number || '').toLowerCase()
                    const cardId = String(card.id || '')
                    const target = raw.toLowerCase()

                    if (
                        (cardNo && (cardNo === target || target.includes(cardNo))) ||
                        (cardId && (cardId === raw || target.includes(`/card-preview/${cardId}`) || target.includes(`id=${cardId}`)))
                    ) {
                        matchedCus = cus
                        matchedCard = card
                        break
                    }
                }
            }
            if (matchedCus) break

            const phoneDigits = String(cus.phone || '').replace(/\D/g, '')
            const rawDigits = raw.replace(/\D/g, '')
            if (
                String(cus.id) === raw ||
                (phoneDigits.length >= 7 && rawDigits.includes(phoneDigits)) ||
                (cus.email && cus.email.toLowerCase() === raw.toLowerCase())
            ) {
                matchedCus = cus
                if (Array.isArray(cus.cards) && cus.cards.length > 0) {
                    matchedCard = cus.cards[0]
                }
                break
            }
        }

        if (matchedCus) {
            setMatchedCustomer(matchedCus)
            setSearchInput(matchedCus.name || matchedCus.phone || '')
            setSearchResults([])
            if (matchedCard) {
                setSelectedCard(matchedCard)
            } else if (Array.isArray(matchedCus.cards) && matchedCus.cards.length > 0) {
                setSelectedCard(matchedCus.cards[0])
            }
            toast.success(`QR Pass Identified: ${matchedCus.name || 'Customer'}`)
            return
        }

        // 3. If still not matched, set search input so receptionist can see what was scanned
        setSearchInput(raw)
    }

    // Start html5QrCode scanner camera stream
    const startScanner = async () => {
        setScannerError(null)
        setQrScanningState(true)

        try {
            if (scannerRef.current) {
                try {
                    await scannerRef.current.stop()
                } catch (e) {}
            }

            const html5QrCode = new Html5Qrcode("receptionist-qr-reader")
            scannerRef.current = html5QrCode

            const config = {
                fps: 15,
                qrbox: (viewfinderWidth, viewfinderHeight) => {
                    const minEdge = Math.min(viewfinderWidth, viewfinderHeight)
                    const qrboxSize = Math.floor(minEdge * 0.72)
                    return {
                        width: Math.max(200, Math.min(280, qrboxSize)),
                        height: Math.max(200, Math.min(280, qrboxSize))
                    }
                },
                aspectRatio: 1.0
            }

            await html5QrCode.start(
                { facingMode: cameraFacing },
                config,
                (decodedText) => {
                    handleQrCodeScanned(decodedText)
                },
                (errorMessage) => {
                    // Ongoing frame parse, normal while aiming camera
                }
            )
            setQrScanningState(false)
        } catch (err) {
            console.error("Camera scanner start error:", err)
            setScannerError(err?.message || "Camera access failed. Please ensure camera permissions are granted.")
            setQrScanningState(false)
        }
    }

    // Trigger QR modal opening
    const handleStartQRScan = () => {
        setScannerError(null)
        setQrScannerOpen(true)
    }

    // Toggle Front / Back Camera
    const toggleCameraFacing = async () => {
        await stopScanner()
        setCameraFacing(prev => prev === 'environment' ? 'user' : 'environment')
    }

    // Scan QR from image file upload
    const handleScanFile = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return

        try {
            setQrScanningState(true)
            const html5QrCode = new Html5Qrcode("receptionist-qr-reader-file-temp")
            const decodedText = await html5QrCode.scanFile(file, true)
            html5QrCode.clear()
            handleQrCodeScanned(decodedText)
        } catch (err) {
            console.error("File scan error:", err)
            toast.error("Could not find a valid QR code in this image.")
        } finally {
            setQrScanningState(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    // Handle scanner lifecycle when modal opens / camera facing changes
    useEffect(() => {
        if (qrScannerOpen) {
            const timer = setTimeout(() => {
                startScanner()
            }, 250)
            return () => {
                clearTimeout(timer)
                stopScanner()
            }
        } else {
            stopScanner()
        }
    }, [qrScannerOpen, cameraFacing])

    // Handler: Save & Submit Card Payment / Entry Update
    const handleSaveEntry = async (e) => {
        e.preventDefault()

        if (!matchedCustomer || !selectedCard) {
            toast.error('Please select a customer and card pass')
            return
        }

        const isStamp = Number(selectedCard.card_type) === 1 || selectedCard.type === 'stamp'
        const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        const totalStamps = Number(selectedCardDetails?.total_stamps || selectedCardDetails?.number_of_stamps || selectedCard?.total_stamps || selectedCard?.number_of_stamps || selectedCard?.total || 8)
        const currentCollected = Number(selectedCardDetails?.current_stamp ?? selectedCardDetails?.current_stamps ?? selectedCardDetails?.collected ?? selectedCard?.current_stamp ?? selectedCard?.current_stamps ?? selectedCard?.collected ?? 0)
        const isCompleted = Number(selectedCardDetails?.is_completed ?? selectedCard?.is_completed ?? (currentCollected >= totalStamps ? 1 : 0)) === 1

        if (isStamp && isCompleted) {
            toast.info('This stamp card is already fully completed!')
            return
        }

        const updatedStamps = isStamp ? Math.min(totalStamps, currentCollected + 1) : undefined
        const isNowCompleted = isStamp && updatedStamps >= totalStamps ? 1 : (selectedCardDetails?.is_completed || 0)

        setSavingEntry(true)
        try {
            if (isStamp) {
                // Determine stamp_level_id for the current stamp entry
                const stampLevelId = Number(
                    selectedCardDetails?.stamp_level_id ||
                    selectedCardDetails?.CustomerStampLevels?.[currentCollected]?.id ||
                    selectedCardDetails?.levelRewards?.[currentCollected]?.id ||
                    selectedCardDetails?.stamp_levels?.[currentCollected]?.id ||
                    selectedCardDetails?.CustomerStampLevels?.[0]?.id ||
                    0
                )

                const payload = {
                    cus_id: Number(matchedCustomer.id),
                    card_id: Number(selectedCard.id),
                    payment_type: paymentMethod === 'Online' ? 2 : 1,
                    amount: parseFloat(paymentAmount) || Number(selectedCardDetails?.overAll_amt || selectedCardDetails?.current_amt || 0),
                    stamp_level_id: stampLevelId
                }

                const res = await API.post('firstloop/customer/stamp-paid', payload)

                if (res?.data?.status == 1) {
                    toast.success(res.data.message || "Stamp payment entry logged successfully 🚀")
                    selectedCard.collected = updatedStamps
                    selectedCard.current_stamp = updatedStamps
                    selectedCard.is_completed = isNowCompleted
                    setSelectedCardDetails(prev => prev ? { ...prev, current_stamp: updatedStamps, collected: updatedStamps, is_completed: isNowCompleted } : prev)

                    const receipt = {
                        receiptId: res.data.receipt_id || `RCP-${Date.now().toString().slice(-6)}`,
                        customerName: matchedCustomer.name || 'Customer',
                        customerPhone: matchedCustomer.phone || '-',
                        cardTitle: selectedCard.title || selectedCardDetails?.title || 'Stamp Pass',
                        cardNumber: selectedCard.card_number || '-',
                        cardType: 'stamp',
                        previousStamps: currentCollected,
                        newStamps: updatedStamps,
                        totalStamps: totalStamps,
                        remainingStamps: Math.max(0, totalStamps - updatedStamps),
                        paymentMethod: paymentMethod,
                        paymentAmount: `$${parseFloat(paymentAmount).toFixed(2)}`,
                        time: nowTime,
                        date: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
                    }
                    setSuccessReceiptModal(receipt)

                    // Track this card as Paid
                    if (selectedCard?.id) {
                        setPaidCards(prev => new Set([...prev, String(selectedCard.id)]))
                    }

                    // Refresh latest card and level details
                    if (selectedCard?.id && matchedCustomer?.id) {
                        const refreshed = await fetchCustomerStampLevelsApi(
                            selectedCard.id,
                            selectedCard.card_type,
                            matchedCustomer.id
                        )
                        if (refreshed) {
                            setSelectedCardDetails(refreshed)
                        }
                    }
                } else {
                    toast.error(res?.data?.message || "Failed to log stamp payment entry")
                }
            } else {
                // Membership Daily Check-In
                if (selectedCard?.id) {
                    setPaidCards(prev => new Set([...prev, String(selectedCard.id)]))
                }
                const receipt = {
                    receiptId: `RCP-${Date.now().toString().slice(-6)}`,
                    customerName: matchedCustomer.name || 'Customer',
                    customerPhone: matchedCustomer.phone || '-',
                    cardTitle: selectedCard.title || selectedCardDetails?.title || 'Membership Pass',
                    cardNumber: selectedCard.card_number || '-',
                    cardType: 'membership',
                    paymentMethod: 'Daily Check-In Validated',
                    paymentAmount: '0.00',
                    time: nowTime,
                    date: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
                }
                setSuccessReceiptModal(receipt)
                toast.success("Daily Membership Check-In Entry Logged 🚀")
            }
        } catch (error) {
            console.error('Error in handleSaveEntry:', error)
            toast.error(error?.response?.data?.message || "Error logging entry")
        } finally {
            setSavingEntry(false)
        }
    }

    return (
        <div style={{ paddingBottom: 40 }}>
            {/* Header */}
            <div className="flex-between mb-4" style={{ flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.45rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                        Card Check-In
                    </h2>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>
                        Search customer by name, phone, or scan QR code to load cards and process check-in entries.
                    </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    {isMerchant && (
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => navigate(effectiveBranchId ? `/merchant/branches/${effectiveBranchId}` : '/merchant/branches')}
                            style={{ borderRadius: 10, padding: '8px 14px', fontSize: '0.84rem', fontWeight: 700 }}
                        >
                            <i className="fas fa-arrow-left" /> Back to Branch
                        </button>
                    )}

                    {/* Mode Selector Tabs */}
                    <div style={{ display: 'flex', background: '#E2E8F0', padding: 4, borderRadius: 12 }}>
                    <button
                        type="button"
                        onClick={() => setActiveTab('phone')}
                        style={{
                            padding: '8px 18px',
                            borderRadius: 10,
                            border: 'none',
                            background: activeTab === 'phone' ? '#FFFFFF' : 'transparent',
                            color: activeTab === 'phone' ? 'var(--firstloop-primary)' : 'var(--text-secondary)',
                            fontWeight: 800,
                            fontSize: '0.84rem',
                            cursor: 'pointer',
                            boxShadow: activeTab === 'phone' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6
                        }}
                    >
                        <i className="fas fa-search" />
                        <span>Search Customer</span>
                    </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('qr')}
                            style={{
                                padding: '8px 18px',
                                borderRadius: 10,
                                border: 'none',
                                background: activeTab === 'qr' ? 'var(--firstloop-primary)' : 'transparent',
                                color: activeTab === 'qr' ? '#FFFFFF' : 'var(--text-secondary)',
                                fontWeight: 800,
                                fontSize: '0.84rem',
                                cursor: 'pointer',
                                boxShadow: activeTab === 'qr' ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6
                            }}
                        >
                            <i className="fas fa-qrcode" />
                            <span>QR Code Scanner</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* TAB CONTENT: SEARCH BY NAME/PHONE vs QR CODE SCANNER */}
            <div className="card mb-4" style={{ padding: 22, borderRadius: 20, background: '#FFFFFF', position: 'relative' }}>
                {activeTab === 'phone' ? (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <label style={{ fontSize: '0.88rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                                Search Customer by Name, Phone, Email or Card:
                            </label>
                            {matchedCustomer && (
                                <button
                                    type="button"
                                    className="btn btn-sm btn-link text-danger"
                                    onClick={clearSelectedCustomer}
                                    style={{ fontSize: '0.8rem', textDecoration: 'none', fontWeight: 700 }}
                                >
                                    <i className="fas fa-times-circle" style={{ marginRight: 4 }} />
                                    Clear Selection
                                </button>
                            )}
                        </div>

                        <div style={{ position: 'relative' }}>
                            <i className="fas fa-search" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--firstloop-primary)', fontSize: '1rem' }} />
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Type customer name (e.g. Rahul, Sophia) or phone number..."
                                value={searchInput}
                                onChange={(e) => {
                                    setSearchInput(e.target.value)
                                    setMatchedCustomer(null)
                                    setSelectedCard(null)
                                }}
                                style={{
                                    paddingLeft: 46,
                                    paddingRight: searchInput ? 40 : 16,
                                    height: 48,
                                    borderRadius: 12,
                                    fontSize: '0.92rem',
                                    border: '1.5px solid #CBD5E1'
                                }}
                            />
                            {searchInput && (
                                <button
                                    type="button"
                                    onClick={clearSelectedCustomer}
                                    style={{
                                        position: 'absolute',
                                        right: 12,
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none',
                                        border: 'none',
                                        color: '#94A3B8',
                                        cursor: 'pointer',
                                        fontSize: '1.1rem'
                                    }}
                                >
                                    &times;
                                </button>
                            )}
                        </div>

                        {/* CUSTOMER LIST / SEARCH RESULTS */}
                        {!matchedCustomer && (
                            <div
                                style={{
                                    marginTop: 14,
                                    borderRadius: 16,
                                    border: '1px solid #E2E8F0',
                                    background: '#FFFFFF',
                                    boxShadow: '0 6px 20px rgba(0,0,0,0.04)',
                                    overflow: 'hidden'
                                }}
                            >
                                <div
                                    style={{
                                        padding: '12px 18px',
                                        background: '#F8FAFC',
                                        borderBottom: '1px solid #E2E8F0',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        flexWrap: 'wrap',
                                        gap: 8
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <i className={searchInput.trim() ? "fas fa-filter" : "fas fa-users"} style={{ color: 'var(--firstloop-primary)' }} />
                                        <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                            {searchInput.trim() ? `Search Results (${searchResults.length})` : `All Branch Customers (${customerList.length})`}
                                        </span>
                                    </div>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        Click on any customer to view &amp; check-in cards
                                    </span>
                                </div>

                                {loading ? (
                                    <div style={{ padding: '36px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                        <div className="spinner-border text-primary" role="status" style={{ width: '2rem', height: '2rem', marginBottom: 8 }} />
                                        <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700 }}>Loading customer database...</p>
                                    </div>
                                ) : (searchInput.trim() ? searchResults : customerList).length > 0 ? (
                                    <div style={{ maxHeight: 380, overflowY: 'auto' }}>
                                        {(searchInput.trim() ? searchResults : customerList).map((cus) => {
                                            const cards = Array.isArray(cus.cards) ? cus.cards : []
                                            const stampCardsCount = cards.filter(c => Number(c.card_type) === 1).length
                                            const membershipCardsCount = cards.filter(c => Number(c.card_type) === 2).length
                                            const completedCardsCount = cards.filter(c => Number(c.is_completed) === 1 || (Number(c.card_type) === 1 && Number(c.current_stamp ?? c.current_stamps ?? c.collected ?? 0) >= Number(c.number_of_stamps || c.total_stamps || c.total || 8))).length
                                            const hasPaidInSession = cards.some(c => paidCards.has(String(c.id)))

                                            return (
                                                <div
                                                    key={cus.id}
                                                    onClick={() => selectCustomer(cus)}
                                                    style={{
                                                        padding: '14px 18px',
                                                        borderBottom: '1px solid #F1F5F9',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                        cursor: 'pointer',
                                                        transition: 'background 0.15s ease',
                                                        background: hasPaidInSession ? 'rgba(16, 185, 129, 0.04)' : '#FFFFFF'
                                                    }}
                                                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--firstloop-primary-light, #E6F2FA)'}
                                                    onMouseLeave={(e) => e.currentTarget.style.background = hasPaidInSession ? 'rgba(16, 185, 129, 0.04)' : '#FFFFFF'}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                        <div
                                                            style={{
                                                                width: 40,
                                                                height: 40,
                                                                borderRadius: '50%',
                                                                background: hasPaidInSession ? 'rgba(16, 185, 129, 0.15)' : 'var(--firstloop-primary-light, #E6F2FA)',
                                                                color: hasPaidInSession ? '#059669' : 'var(--firstloop-primary, #0E88B8)',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                fontWeight: 800,
                                                                fontSize: '0.92rem',
                                                                border: hasPaidInSession ? '2px solid #10B981' : '1.5px solid var(--firstloop-primary, #0E88B8)'
                                                            }}
                                                        >
                                                            {cus.name ? cus.name.charAt(0).toUpperCase() : 'C'}
                                                        </div>
                                                        <div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                                <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                                                                    {cus.name}
                                                                </strong>
                                                                {hasPaidInSession && (
                                                                    <span className="badge" style={{ background: '#10B981', color: '#FFFFFF', fontSize: '0.7rem', fontWeight: 800, padding: '2px 7px', borderRadius: 6 }}>
                                                                        <i className="fas fa-check" style={{ marginRight: 3 }} /> PAID
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <small style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                                                <i className="fas fa-phone-alt" style={{ marginRight: 4, color: 'var(--firstloop-primary)' }} />
                                                                {cus.phone}
                                                                {cus.email && <span style={{ marginLeft: 8 }}><i className="fas fa-envelope" style={{ marginRight: 4 }} />{cus.email}</span>}
                                                            </small>
                                                        </div>
                                                    </div>

                                                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                                                        {completedCardsCount > 0 && (
                                                            <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#059669', fontWeight: 700, padding: '4px 8px', borderRadius: 6, fontSize: '0.72rem' }}>
                                                                <i className="fas fa-check-circle" style={{ marginRight: 3 }} />
                                                                {completedCardsCount} Completed
                                                            </span>
                                                        )}
                                                        {stampCardsCount > 0 && (
                                                            <span className="badge" style={{ background: 'var(--firstloop-primary-light)', color: 'var(--firstloop-primary)', fontWeight: 700, padding: '4px 8px', borderRadius: 6, fontSize: '0.72rem' }}>
                                                                <i className="fas fa-stamp" style={{ marginRight: 3 }} />
                                                                {stampCardsCount} Stamp Card{stampCardsCount > 1 ? 's' : ''}
                                                            </span>
                                                        )}
                                                        {membershipCardsCount > 0 && (
                                                            <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#D97706', fontWeight: 700, padding: '4px 8px', borderRadius: 6, fontSize: '0.72rem' }}>
                                                                <i className="fas fa-crown" style={{ marginRight: 3 }} />
                                                                {membershipCardsCount} VIP Member
                                                            </span>
                                                        )}
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm firstloop-btn-primary"
                                                            style={{ padding: '5px 12px', fontSize: '0.78rem', borderRadius: 8, marginLeft: 4, fontWeight: 700 }}
                                                        >
                                                            Select &rarr;
                                                        </button>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                ) : (
                                    <div style={{ padding: '36px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                        <i className="fas fa-search" style={{ fontSize: '1.8rem', color: '#CBD5E1', marginBottom: 8 }} />
                                        <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: 700 }}>
                                            {searchInput.trim() ? `No customers found matching "${searchInput}"` : "No customers found in this branch."}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* NO CUSTOMER FOUND BANNER & ENROLL BUTTON */}
                        {!matchedCustomer && searchInput.trim().length > 0 && searchResults.length === 0 && (
                            <div style={{ marginTop: 16, padding: 16, borderRadius: 14, background: '#FFFBEB', border: '1px dashed #F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                                <div>
                                    <strong style={{ color: '#B45309', fontSize: '0.9rem', display: 'block' }}>
                                        No customer found matching "{searchInput}"
                                    </strong>
                                    <span style={{ fontSize: '0.8rem', color: '#D97706' }}>
                                        Click button to register this customer and assign an initial card pass.
                                    </span>
                                </div>

                                <button
                                    type="button"
                                    className="btn firstloop-btn-primary"
                                    onClick={handleNavigateToAddCustomer}
                                    style={{ padding: '8px 16px', borderRadius: 10, fontWeight: 800, fontSize: '0.84rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                                >
                                    <i className="fas fa-user-plus" />
                                    <span>+ Enroll & Add New Customer</span>
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div style={{ padding: '8px 0' }}>
                        {/* Interactive Scanner Hub */}
                        <div
                            style={{
                                background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F283D 100%)',
                                borderRadius: 20,
                                padding: '32px 28px',
                                color: '#FFFFFF',
                                position: 'relative',
                                overflow: 'hidden',
                                boxShadow: '0 12px 32px rgba(15, 23, 42, 0.25)',
                                border: '1px solid rgba(255, 255, 255, 0.08)'
                            }}
                        >
                            {/* Decorative background glow circles */}
                            <div
                                style={{
                                    position: 'absolute',
                                    top: -60,
                                    right: -60,
                                    width: 220,
                                    height: 220,
                                    borderRadius: '50%',
                                    background: 'radial-gradient(circle, rgba(14, 136, 184, 0.3) 0%, rgba(14, 136, 184, 0) 70%)',
                                    pointerEvents: 'none'
                                }}
                            />
                            <div
                                style={{
                                    position: 'absolute',
                                    bottom: -40,
                                    left: 40,
                                    width: 180,
                                    height: 180,
                                    borderRadius: '50%',
                                    background: 'radial-gradient(circle, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0) 70%)',
                                    pointerEvents: 'none'
                                }}
                            />

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, alignItems: 'center', position: 'relative', zIndex: 1 }}>
                                {/* Left: Info & Actions */}
                                <div>
                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
                                        <span
                                            style={{
                                                background: 'rgba(14, 136, 184, 0.25)',
                                                color: '#38BDF8',
                                                border: '1px solid rgba(56, 189, 248, 0.4)',
                                                fontWeight: 800,
                                                fontSize: '0.72rem',
                                                padding: '4px 10px',
                                                borderRadius: 20,
                                                letterSpacing: '0.5px',
                                                textTransform: 'uppercase',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: 5
                                            }}
                                        >
                                            <i className="fas fa-bolt" style={{ fontSize: '0.7rem' }} /> Instant Pass Lookup
                                        </span>
                                        <span
                                            style={{
                                                background: 'rgba(16, 185, 129, 0.2)',
                                                color: '#34D399',
                                                border: '1px solid rgba(52, 211, 153, 0.35)',
                                                fontWeight: 800,
                                                fontSize: '0.72rem',
                                                padding: '4px 10px',
                                                borderRadius: 20,
                                                letterSpacing: '0.5px',
                                                textTransform: 'uppercase',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: 5
                                            }}
                                        >
                                            <i className="fas fa-shield-alt" style={{ fontSize: '0.7rem' }} /> Apple & Google Wallet Ready
                                        </span>
                                    </div>

                                    <h3 style={{ fontSize: '1.45rem', fontWeight: 800, margin: '0 0 8px 0', color: '#FFFFFF', letterSpacing: '-0.3px' }}>
                                        Scan Customer Pass QR
                                    </h3>
                                    <p style={{ fontSize: '0.88rem', color: '#94A3B8', margin: '0 0 22px 0', lineHeight: 1.55 }}>
                                        Point the camera at the customer's digital card pass, Apple/Google wallet QR, or upload an image to identify the customer and retrieve stamp balances instantly.
                                    </p>

                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                                        <button
                                            type="button"
                                            className="btn"
                                            onClick={handleStartQRScan}
                                            style={{
                                                background: 'linear-gradient(135deg, #0E88B8 0%, #0284C7 100%)',
                                                color: '#FFFFFF',
                                                border: 'none',
                                                padding: '12px 26px',
                                                borderRadius: 14,
                                                fontWeight: 800,
                                                fontSize: '0.92rem',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: 10,
                                                boxShadow: '0 6px 20px rgba(14, 136, 184, 0.45)',
                                                cursor: 'pointer',
                                                transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.transform = 'translateY(-2px)'
                                                e.currentTarget.style.boxShadow = '0 8px 25px rgba(14, 136, 184, 0.6)'
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.transform = 'translateY(0)'
                                                e.currentTarget.style.boxShadow = '0 6px 20px rgba(14, 136, 184, 0.45)'
                                            }}
                                        >
                                            <div
                                                style={{
                                                    width: 26,
                                                    height: 26,
                                                    borderRadius: '50%',
                                                    background: 'rgba(255, 255, 255, 0.2)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '0.85rem'
                                                }}
                                            >
                                                <i className="fas fa-camera" />
                                            </div>
                                            <span>Launch Camera Scanner</span>
                                        </button>

                                        <button
                                            type="button"
                                            className="btn"
                                            onClick={() => fileInputRef.current?.click()}
                                            style={{
                                                background: 'rgba(255, 255, 255, 0.08)',
                                                color: '#E2E8F0',
                                                border: '1px solid rgba(255, 255, 255, 0.18)',
                                                padding: '12px 20px',
                                                borderRadius: 14,
                                                fontWeight: 700,
                                                fontSize: '0.88rem',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: 8,
                                                cursor: 'pointer',
                                                backdropFilter: 'blur(4px)'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.14)'
                                                e.currentTarget.style.color = '#FFFFFF'
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
                                                e.currentTarget.style.color = '#E2E8F0'
                                            }}
                                        >
                                            <i className="fas fa-file-image" style={{ color: '#38BDF8' }} />
                                            <span>Upload QR Image</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Right: Tech HUD Scanner Graphic Preview */}
                                <div style={{ display: 'flex', justifyContent: 'center' }}>
                                    <div
                                        onClick={handleStartQRScan}
                                        style={{
                                            width: 200,
                                            height: 200,
                                            borderRadius: 24,
                                            background: 'rgba(15, 23, 42, 0.7)',
                                            border: '1.5px dashed rgba(56, 189, 248, 0.5)',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            position: 'relative',
                                            cursor: 'pointer',
                                            boxShadow: '0 0 30px rgba(14, 136, 184, 0.15)',
                                            transition: 'border-color 0.2s ease, transform 0.2s ease'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.borderColor = '#38BDF8'
                                            e.currentTarget.style.transform = 'scale(1.03)'
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.5)'
                                            e.currentTarget.style.transform = 'scale(1)'
                                        }}
                                    >
                                        {/* Scanner Corner Reticles */}
                                        <div style={{ position: 'absolute', top: 12, left: 12, width: 18, height: 18, borderTop: '3px solid #38BDF8', borderLeft: '3px solid #38BDF8', borderRadius: '4px 0 0 0' }} />
                                        <div style={{ position: 'absolute', top: 12, right: 12, width: 18, height: 18, borderTop: '3px solid #38BDF8', borderRight: '3px solid #38BDF8', borderRadius: '0 4px 0 0' }} />
                                        <div style={{ position: 'absolute', bottom: 12, left: 12, width: 18, height: 18, borderBottom: '3px solid #38BDF8', borderLeft: '3px solid #38BDF8', borderRadius: '0 0 0 4px' }} />
                                        <div style={{ position: 'absolute', bottom: 12, right: 12, width: 18, height: 18, borderBottom: '3px solid #38BDF8', borderRight: '3px solid #38BDF8', borderRadius: '0 0 4px 0' }} />

                                        {/* QR Icon in center */}
                                        <div
                                            style={{
                                                width: 64,
                                                height: 64,
                                                borderRadius: 16,
                                                background: 'rgba(56, 189, 248, 0.15)',
                                                border: '1px solid rgba(56, 189, 248, 0.3)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: '#38BDF8',
                                                fontSize: '1.8rem',
                                                marginBottom: 10,
                                                boxShadow: '0 0 20px rgba(56, 189, 248, 0.25)'
                                            }}
                                        >
                                            <i className="fas fa-qrcode" />
                                        </div>

                                        <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '0.3px' }}>
                                            TAP TO SCAN
                                        </span>
                                        <span style={{ fontSize: '0.68rem', color: '#94A3B8', marginTop: 2 }}>
                                            Auto-Detect Active
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Features Grid Footer */}
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                    gap: 12,
                                    marginTop: 26,
                                    paddingTop: 20,
                                    borderTop: '1px solid rgba(255, 255, 255, 0.08)'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.8rem', color: '#CBD5E1' }}>
                                    <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(14, 136, 184, 0.2)', color: '#38BDF8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>
                                        <i className="fas fa-mobile-alt" />
                                    </div>
                                    <span>Apple & Google Wallet Passes</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.8rem', color: '#CBD5E1' }}>
                                    <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(16, 185, 129, 0.2)', color: '#34D399', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>
                                        <i className="fas fa-id-card" />
                                    </div>
                                    <span>Physical Cards & QR Receipts</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.8rem', color: '#CBD5E1' }}>
                                    <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(245, 158, 11, 0.2)', color: '#FBBF24', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>
                                        <i className="fas fa-sync" />
                                    </div>
                                    <span>Front & Rear Camera Switching</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* MATCHED CUSTOMER & AVAILABLE CARDS DISPLAY */}
            {matchedCustomer && (
                <div className="card mb-4" style={{ padding: 22, borderRadius: 20, background: '#FFFFFF', border: '2px solid var(--firstloop-primary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 18, borderBottom: '1px solid #E2E8F0', paddingBottom: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                            <div
                                style={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: '50%',
                                    background: 'var(--firstloop-primary-light)',
                                    color: 'var(--firstloop-primary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 800,
                                    fontSize: '1.1rem',
                                    border: '2.5px solid var(--firstloop-primary)'
                                }}
                            >
                                {matchedCustomer.name ? matchedCustomer.name.charAt(0).toUpperCase() : 'C'}
                            </div>
                            <div>
                                <span className="badge" style={{ background: '#10B981', color: '#FFF', fontWeight: 800, padding: '3px 8px', borderRadius: 6, fontSize: '0.7rem' }}>
                                    CUSTOMER IDENTIFIED
                                </span>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '2px 0 0 0', color: 'var(--text-primary)' }}>
                                    {matchedCustomer.name}
                                </h3>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: 14, marginTop: 2 }}>
                                    <span><i className="fas fa-phone-alt" style={{ marginRight: 4, color: 'var(--firstloop-primary)' }} />{matchedCustomer.phone}</span>
                                    {matchedCustomer.email && (
                                        <span><i className="fas fa-envelope" style={{ marginRight: 4, color: 'var(--firstloop-primary)' }} />{matchedCustomer.email}</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block' }}>Held Passes</span>
                            <strong style={{ fontSize: '1rem', color: 'var(--text-primary)', fontWeight: 800 }}>
                                {Array.isArray(matchedCustomer.cards) ? matchedCustomer.cards.length : 0} Cards Enrolled
                            </strong>
                        </div>
                    </div>

                    {/* SELECT AVAILABLE HELD CARDS */}
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: 12, color: 'var(--text-primary)' }}>
                        Select Card Pass to Update:
                    </h4>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                        {(matchedCustomer.cards || []).map(card => {
                            const isSelected = selectedCard?.id === card.id
                            const isStamp = Number(card.card_type) === 1 || card.type === 'stamp'
                            const totalStamps = Number(card.number_of_stamps || card.total_stamps || card.total || 8)
                            const collectedStamps = Number(card.current_stamp ?? card.current_stamps ?? card.collected ?? 0)
                            const isCardCompleted = Number(card.is_completed ?? (isStamp && collectedStamps >= totalStamps ? 1 : 0)) === 1
                            const remainingStamps = Math.max(0, totalStamps - collectedStamps)

                            return (
                                <div
                                    key={card.id}
                                    onClick={() => setSelectedCard(card)}
                                    style={{
                                        padding: 16,
                                        borderRadius: 16,
                                        border: isSelected ? '2px solid var(--firstloop-primary)' : '1px solid #E2E8F0',
                                        background: isSelected ? 'var(--firstloop-primary-light)' : '#F8FAFC',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        boxShadow: isSelected ? '0 8px 20px -4px rgba(14,136,184,0.2)' : 'none'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <span
                                                style={{
                                                    fontSize: '0.7rem',
                                                    fontWeight: 800,
                                                    padding: '3px 8px',
                                                    borderRadius: 6,
                                                    background: isCardCompleted ? '#10B981' : (isStamp ? 'var(--firstloop-primary)' : '#D97706'),
                                                    color: '#FFFFFF'
                                                }}
                                            >
                                                {isCardCompleted ? 'COMPLETED' : (isStamp ? 'STAMP CARD' : 'MEMBERSHIP CARD')}
                                            </span>
                                            {paidCards.has(String(card.id)) && (
                                                <span
                                                    style={{
                                                        fontSize: '0.68rem',
                                                        fontWeight: 800,
                                                        padding: '3px 7px',
                                                        borderRadius: 6,
                                                        background: 'rgba(16, 185, 129, 0.15)',
                                                        color: '#059669',
                                                        border: '1px solid #10B981'
                                                    }}
                                                >
                                                    <i className="fas fa-check" style={{ marginRight: 3 }} /> PAID
                                                </span>
                                            )}
                                        </div>
                                        {isSelected && <i className="fas fa-check-circle" style={{ color: 'var(--firstloop-primary)', fontSize: '1.1rem' }} />}
                                    </div>

                                    <h5 style={{ fontSize: '1rem', fontWeight: 800, margin: '4px 0', color: 'var(--text-primary)' }}>
                                        {card.title || (isStamp ? 'Stamp Card' : 'Membership Pass')}
                                    </h5>
                                    {card.card_number && (
                                        <small style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'monospace', fontWeight: 600, display: 'block', marginBottom: 6 }}>
                                            {card.card_number}
                                        </small>
                                    )}

                                    {isStamp ? (
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 6 }}>
                                            {isCardCompleted ? (
                                                <strong style={{ color: '#059669', fontWeight: 800 }}>
                                                    <i className="fas fa-check-circle" style={{ marginRight: 4 }} />
                                                    Card Fully Completed
                                                </strong>
                                            ) : (
                                                <>
                                                    Remaining: <strong style={{ color: 'var(--firstloop-primary)', fontWeight: 800 }}>{remainingStamps} stamps remaining</strong>
                                                </>
                                            )}
                                            <div style={{ fontSize: '0.75rem', color: '#059669', marginTop: 4, fontWeight: 700 }}>
                                                Progress: {collectedStamps}/{totalStamps} Stamps Collected
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 6 }}>
                                            Status: <strong style={{ color: '#D97706', fontWeight: 800 }}>Active Member</strong>
                                            <div style={{ fontSize: '0.75rem', color: '#D97706', marginTop: 4, fontWeight: 700 }}>
                                                Tier: {card.tier || 'VIP'} Status Active
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* UNIFIED CARD PAYMENT / UPDATE ENTRY PANEL */}
            {matchedCustomer && selectedCard && (() => {
                const isStampCard = Number(selectedCard.card_type) === 1 || selectedCard.type === 'stamp';
                const totalStampsVal = Number(selectedCardDetails?.total_stamps || selectedCardDetails?.number_of_stamps || selectedCard?.total_stamps || selectedCard?.number_of_stamps || selectedCard?.total || 8);
                const collectedStampsVal = Number(selectedCardDetails?.current_stamp ?? selectedCardDetails?.current_stamps ?? selectedCardDetails?.collected ?? selectedCard?.current_stamp ?? selectedCard?.current_stamps ?? selectedCard?.collected ?? 0);
                const remainingStampsVal = Math.max(0, totalStampsVal - collectedStampsVal);

                return (
                    <div
                        className="card mb-4"
                        style={{
                            padding: 24,
                            borderRadius: 22,
                            background: '#FFFFFF',
                            border: '2px solid #1E293B',
                            boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20, borderBottom: '1px solid #E2E8F0', paddingBottom: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div
                                    style={{
                                        width: 44,
                                        height: 44,
                                        borderRadius: 12,
                                        background: isStampCard ? 'var(--firstloop-primary)' : '#D97706',
                                        color: '#FFFFFF',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '1.2rem',
                                        fontWeight: 800
                                    }}
                                >
                                    <i className={isStampCard ? 'fas fa-stamp' : 'fas fa-crown'} />
                                </div>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 800, color: 'var(--text-muted)' }}>
                                            CARD ENTRY & PAYMENT TERMINAL
                                        </span>
                                        {paidCards.has(String(selectedCard.id)) && (
                                            <span style={{ fontSize: '0.72rem', background: '#10B981', color: '#FFFFFF', padding: '2px 8px', borderRadius: 6, fontWeight: 800 }}>
                                                <i className="fas fa-check-circle" style={{ marginRight: 4 }} /> PAID
                                            </span>
                                        )}
                                    </div>
                                    <h3 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '2px 0 0 0', color: 'var(--text-primary)' }}>
                                        {isStampCard ? 'Stamp Card Check-In Entry' : 'Membership Daily Check-In Entry'}
                                    </h3>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                {isStampCard && remainingStampsVal <= 4 && (
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-primary"
                                        onClick={() => {
                                            const branchId = effectiveBranchId || '';
                                            const emailQuery = matchedCustomer?.email ? `?email=${encodeURIComponent(matchedCustomer.email)}` : '';
                                            if (isMerchant) {
                                                navigate(`/merchant/add-card-customer/${branchId}${emailQuery}`);
                                            } else {
                                                navigate(`/receptionist/add-card-customer/${branchId}${emailQuery}`);
                                            }
                                        }}
                                        style={{
                                            borderRadius: 10,
                                            fontWeight: 700,
                                            fontSize: '0.82rem',
                                            padding: '8px 14px',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 6
                                        }}
                                    >
                                        <i className="fas fa-stamp" />
                                        <span>Add New Card</span>
                                    </button>
                                )}

                                <button
                                    type="button"
                                    className="btn btn-sm btn-outline-primary"
                                    onClick={() => setHistoryModalOpen(true)}
                                    style={{
                                        borderRadius: 10,
                                        fontWeight: 700,
                                        fontSize: '0.82rem',
                                        padding: '8px 14px',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 6
                                    }}
                                >
                                    <i className="fas fa-history" />
                                    <span>View Card History</span>
                                </button>
                            </div>
                        </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, alignItems: 'start' }}>
                        {/* LEFT: REAL DIGITAL PASS CARD PREVIEW */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 10, letterSpacing: '0.5px' }}>
                                Live Digital Customer Pass
                            </span>
                            {loadingCardDetails ? (
                                <div style={{ minHeight: 240, width: '100%', maxWidth: 420, borderRadius: 22, background: '#F1F5F9', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                                    <div className="spinner-border text-primary" role="status" style={{ width: '2rem', height: '2rem' }} />
                                    <small style={{ fontWeight: 700, color: 'var(--text-muted)' }}>Loading Card Design...</small>
                                </div>
                            ) : (
                                <CustomerCard
                                    card={selectedCardDetails || selectedCard}
                                    cardType={Number(selectedCard.card_type)}
                                />
                            )}
                        </div>

                        {/* RIGHT: ACTION CONTROLS & FORM */}
                        <div>
                            <form onSubmit={handleSaveEntry}>
                                {/* CONDITIONAL CONTENT: STAMP CARD vs MEMBERSHIP CARD */}
                                {(Number(selectedCard.card_type) === 1) ? (
                                    (() => {
                                        const totalStamps = Number(selectedCardDetails?.total_stamps || selectedCardDetails?.number_of_stamps || selectedCard?.total_stamps || selectedCard?.number_of_stamps || selectedCard?.total || 8);
                                        const collectedStamps = Number(selectedCardDetails?.current_stamp ?? selectedCardDetails?.current_stamps ?? selectedCardDetails?.collected ?? selectedCard?.current_stamp ?? selectedCard?.current_stamps ?? selectedCard?.collected ?? 0);
                                        const isCompleted = Number(selectedCardDetails?.is_completed ?? selectedCard?.is_completed ?? (collectedStamps >= totalStamps ? 1 : 0)) === 1;
                                        const remainingStamps = Math.max(0, totalStamps - collectedStamps);

                                        return (
                                            <div>
                                                {/* SUCCESS PAID NOTIFICATION BANNER IF PAID IN SESSION */}
                                                {paidCards.has(String(selectedCard.id)) && (
                                                    <div
                                                        style={{
                                                            background: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
                                                            border: '1.5px solid #10B981',
                                                            borderRadius: 14,
                                                            padding: '12px 16px',
                                                            marginBottom: 16,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'space-between',
                                                            gap: 10,
                                                            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.15)'
                                                        }}
                                                    >
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#10B981', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem' }}>
                                                                <i className="fas fa-check" />
                                                            </div>
                                                            <div>
                                                                <strong style={{ fontSize: '0.88rem', color: '#065F46', display: 'block' }}>
                                                                    Check-In &amp; Payment Completed!
                                                                </strong>
                                                                <small style={{ fontSize: '0.78rem', color: '#047857' }}>
                                                                    This card pass has been marked as <strong>PAID</strong> for today.
                                                                </small>
                                                            </div>
                                                        </div>
                                                        <span className="badge" style={{ background: '#10B981', color: '#FFFFFF', padding: '4px 10px', borderRadius: 8, fontSize: '0.74rem', fontWeight: 800 }}>
                                                            STATUS: PAID
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Current Stamp Progress & Remaining Stamps Display */}
                                                <div style={{ background: isCompleted ? 'rgba(16, 185, 129, 0.08)' : '#F8FAFC', borderRadius: 16, padding: 18, border: isCompleted ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid #E2E8F0', marginBottom: 20 }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                                        <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                                                            Current Stamp Progress:
                                                        </span>
                                                        <span style={{ fontSize: '0.85rem', fontWeight: 800, color: isCompleted ? '#059669' : 'var(--firstloop-primary)' }}>
                                                            {isCompleted ? `🎉 Card Completed (${collectedStamps}/${totalStamps})` : `${remainingStamps} Remaining (${collectedStamps}/${totalStamps})`}
                                                        </span>
                                                    </div>

                                                    {/* Visual Stamp Circles */}
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                                        {Array.from({ length: totalStamps }).map((_, idx) => {
                                                            const levelData = selectedCardDetails?.CustomerStampLevels?.[idx] || selectedCardDetails?.levelRewards?.[idx] || selectedCardDetails?.stamp_levels?.[idx]
                                                            const isPaid = levelData?.status !== undefined
                                                                ? Number(levelData.status) === 1
                                                                : (isCompleted || idx < collectedStamps)

                                                            return (
                                                                <div
                                                                    key={idx}
                                                                    title={`Stamp ${idx + 1}: ${isPaid ? 'Paid / Completed' : 'Not Paid'}`}
                                                                    style={{
                                                                        width: 32,
                                                                        height: 32,
                                                                        borderRadius: `${selectedCardDetails?.stamp_radius ?? 50}%`,
                                                                        background: isPaid ? 'var(--firstloop-gradient-primary)' : '#FFFFFF',
                                                                        color: isPaid ? '#FFFFFF' : '#94A3B8',
                                                                        border: isPaid ? 'none' : '2px dashed #CBD5E1',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        fontWeight: 800,
                                                                        fontSize: '0.78rem',
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

                                                {/* COMPLETED CARD NOTICE OR PAYMENT CONTROLS */}
                                                {isCompleted ? (
                                                    <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 16, padding: '24px 20px', marginBottom: 20, textAlign: 'center' }}>
                                                        <div style={{ width: 50, height: 50, borderRadius: '50%', background: '#10B981', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: '1.4rem', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' }}>
                                                            <i className="fas fa-check-double" />
                                                        </div>
                                                        <h4 style={{ fontWeight: 800, color: '#065F46', margin: '0 0 6px', fontSize: '1.05rem' }}>
                                                            Stamp Card Fully Completed!
                                                        </h4>
                                                        <p style={{ fontSize: '0.84rem', color: '#047857', margin: 0, lineHeight: 1.5 }}>
                                                            All <strong>{totalStamps}</strong> stamps have been successfully collected for this customer card. No further stamps or payment check-ins are required.
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <>
                                                        {/* REWARD LEVEL DETAILS & PRICING BREAKDOWN */}
                                                        {selectedCardDetails && (selectedCardDetails.descption || selectedCardDetails.current_amt !== undefined || selectedCardDetails.discount_val !== undefined) && (
                                                            <div
                                                                style={{
                                                                    background: Number(selectedCardDetails.reward_type) === 2
                                                                        ? 'rgba(14, 136, 184, 0.06)'
                                                                        : '#F8FAFC',
                                                                    borderRadius: 14,
                                                                    padding: '14px 16px',
                                                                    border: Number(selectedCardDetails.reward_type) === 2
                                                                        ? '1px solid rgba(14, 136, 184, 0.25)'
                                                                        : '1px solid #E2E8F0',
                                                                    marginBottom: 16
                                                                }}
                                                            >
                                                                {/* REWARD / PERK TITLE */}
                                                                {selectedCardDetails.descption && (
                                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, paddingBottom: 8, borderBottom: '1px solid #E2E8F0' }}>
                                                                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                                                                            Current Stamp Perk:
                                                                        </span>
                                                                        <span
                                                                            className="badge"
                                                                            style={{
                                                                                background: Number(selectedCardDetails.reward_type) === 2 ? '#0284C7' : (Number(selectedCardDetails.reward_type) === 3 ? '#F59E0B' : '#10B981'),
                                                                                color: '#FFF',
                                                                                fontWeight: 800,
                                                                                padding: '4px 10px',
                                                                                borderRadius: 6,
                                                                                fontSize: '0.78rem'
                                                                            }}
                                                                        >
                                                                            <i
                                                                                className={Number(selectedCardDetails.reward_type) === 2 ? 'fas fa-percent' : (Number(selectedCardDetails.reward_type) === 3 ? 'fas fa-tag' : 'fas fa-gift')}
                                                                                style={{ marginRight: 5 }}
                                                                            />
                                                                            {selectedCardDetails.descption}
                                                                        </span>
                                                                    </div>
                                                                )}

                                                                {/* PRICING BREAKDOWN */}
                                                                {Number(selectedCardDetails.reward_type) === 2 ? (
                                                                    /* DISCOUNT BREAKDOWN VIEW */
                                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.84rem' }}>
                                                                        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                                                                            <span>Standard Amount:</span>
                                                                            <span style={{ textDecoration: 'line-through', color: '#94A3B8' }}>
                                                                                {Number(selectedCardDetails.current_amt || 0).toFixed(2)}
                                                                            </span>
                                                                        </div>
                                                                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#0284C7', fontWeight: 700 }}>
                                                                            <span>Discount Applied ({selectedCardDetails.discount_val}%):</span>
                                                                            <span>
                                                                                -{((Number(selectedCardDetails.current_amt || 0) * Number(selectedCardDetails.discount_val || 0)) / 100).toFixed(2)}
                                                                            </span>
                                                                        </div>
                                                                        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #CBD5E1', paddingTop: 6, marginTop: 2, fontWeight: 800, color: '#0F172A', fontSize: '0.92rem' }}>
                                                                            <span>Net Payable Amount:</span>
                                                                            <strong style={{ color: 'var(--firstloop-primary)' }}>
                                                                                {Number(selectedCardDetails.overAll_amt ?? selectedCardDetails.current_amt ?? 0).toFixed(2)}
                                                                            </strong>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    /* STANDARD / PAID / FREE PERK VIEW */
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.88rem' }}>
                                                                        <span style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>Payable Amount:</span>
                                                                        <strong style={{ color: 'var(--firstloop-primary)', fontWeight: 800, fontSize: '0.95rem' }}>
                                                                            {Number(selectedCardDetails.overAll_amt ?? selectedCardDetails.current_amt ?? 0).toFixed(2)}
                                                                        </strong>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}

                                                        {/* Payment Method Selector: Cash vs Online */}
                                                        <div className="form-group mb-3">
                                                            <label style={{ fontSize: '0.85rem', fontWeight: 800, marginBottom: 8, display: 'block', color: 'var(--text-primary)' }}>
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
                                                                        fontSize: '0.86rem',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        gap: 6
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
                                                                        fontSize: '0.86rem',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        gap: 6
                                                                    }}
                                                                >
                                                                    <i className="fas fa-credit-card" />
                                                                    <span>Online (UPI / Card)</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Amount Input */}
                                                        <div className="form-group mb-4">
                                                            <label style={{ fontSize: '0.85rem', fontWeight: 800, marginBottom: 4, display: 'block', color: 'var(--text-primary)' }}>
                                                                Transaction Payment Amount
                                                            </label>
                                                            <input
                                                                readOnly
                                                                type="text"
                                                                className="form-control"
                                                                value={paymentAmount}
                                                                onChange={(e) => setPaymentAmount(e.target.value)}
                                                                placeholder="25.00"
                                                                required
                                                                style={{ height: 42, borderRadius: 10, fontWeight: 700 }}
                                                            />
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        );
                                    })()
                                ) : (
                                    /* MEMBERSHIP CARD FLOW */
                                    <div>
                                        <div style={{ background: 'rgba(245, 158, 11, 0.08)', borderRadius: 16, padding: 18, border: '1px solid rgba(245, 158, 11, 0.3)', marginBottom: 18 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#B45309', fontWeight: 800 }}>
                                                        MEMBERSHIP STATUS: ACTIVE PASS
                                                    </span>
                                                    <h4 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '2px 0 0 0', color: '#D97706' }}>
                                                        {selectedCard.title || 'Membership Pass'} ({selectedCard.tier || 'VIP'} Tier)
                                                    </h4>
                                                    {selectedCard.card_number && (
                                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace', margin: '4px 0 0 0' }}>
                                                            {selectedCard.card_number}
                                                        </p>
                                                    )}
                                                </div>

                                                <span className="badge" style={{ background: '#D97706', color: '#FFF', padding: '6px 12px', borderRadius: 8, fontWeight: 800, fontSize: '0.78rem' }}>
                                                    <i className="fas fa-crown" style={{ marginRight: 4 }} /> {selectedCard.tier || 'VIP'} Member
                                                </span>
                                            </div>
                                        </div>

                                        <div style={{ padding: 14, background: '#F8FAFC', borderRadius: 12, border: '1px solid #E2E8F0', marginBottom: 20 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#10B981', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem' }}>
                                                    <i className="fas fa-calendar-check" />
                                                </div>
                                                <div>
                                                    <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)', display: 'block' }}>
                                                        Logging Current Day's Visit Check-In
                                                    </strong>
                                                    <small style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                                                        Date: <strong>Today ({new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })})</strong> • Timestamp logged automatically.
                                                    </small>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Submit Button */}
                                {(() => {
                                    const isStamp = Number(selectedCard.card_type) === 1 || selectedCard.type === 'stamp';
                                    const totalStamps = Number(selectedCardDetails?.total_stamps || selectedCardDetails?.number_of_stamps || selectedCard?.total_stamps || selectedCard?.number_of_stamps || selectedCard?.total || 8);
                                    const collectedStamps = Number(selectedCardDetails?.current_stamp ?? selectedCardDetails?.current_stamps ?? selectedCardDetails?.collected ?? selectedCard?.current_stamp ?? selectedCard?.current_stamps ?? selectedCard?.collected ?? 0);
                                    const isCompleted = Number(selectedCardDetails?.is_completed ?? selectedCard?.is_completed ?? (isStamp && collectedStamps >= totalStamps ? 1 : 0)) === 1;

                                    if (isStamp && isCompleted) {
                                        return (
                                            <button
                                                type="button"
                                                disabled
                                                className="btn"
                                                style={{
                                                    width: '100%',
                                                    height: 48,
                                                    borderRadius: 12,
                                                    fontWeight: 800,
                                                    fontSize: '0.95rem',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: 8,
                                                    background: '#F1F5F9',
                                                    color: '#059669',
                                                    border: '1px solid #CBD5E1',
                                                    cursor: 'not-allowed'
                                                }}
                                            >
                                                <i className="fas fa-check-circle" style={{ color: '#10B981' }} />
                                                <span>Card Fully Completed</span>
                                            </button>
                                        );
                                    }

                                    return (
                                        <button
                                            type="submit"
                                            disabled={savingEntry}
                                            className="btn firstloop-btn-primary"
                                            style={{
                                                width: '100%',
                                                height: 48,
                                                borderRadius: 12,
                                                fontWeight: 800,
                                                fontSize: '0.95rem',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: 8,
                                                opacity: savingEntry ? 0.75 : 1,
                                                cursor: savingEntry ? 'not-allowed' : 'pointer'
                                            }}
                                        >
                                            {savingEntry ? (
                                                <>
                                                    <div className="spinner-border spinner-border-sm text-light" role="status" />
                                                    <span>Processing Entry & Payment...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <i className="fas fa-check-circle" />
                                                    <span>{ "Save Today's Check-In Entry"}</span>
                                                </>
                                            )}
                                        </button>
                                    );
                                })()}
                            </form>
                        </div>
                    </div>
                </div>
            )})()}

            {/* REAL-TIME HTML5 QR SCANNER POPUP MODAL */}
            {qrScannerOpen && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(10, 15, 29, 0.88)',
                        backdropFilter: 'blur(10px)',
                        zIndex: 1050,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 16
                    }}
                >
                    {/* Embedded Scoped Scanner Animations */}
                    <style>
                        {`
                            @keyframes qrLaserSweep {
                                0% { top: 6%; opacity: 0.8; }
                                50% { top: 90%; opacity: 1; }
                                100% { top: 6%; opacity: 0.8; }
                            }
                            @keyframes qrPulseGlow {
                                0%, 100% { opacity: 0.8; filter: drop-shadow(0 0 6px rgba(56, 189, 248, 0.6)); }
                                50% { opacity: 1; filter: drop-shadow(0 0 14px rgba(56, 189, 248, 0.95)); }
                            }
                            @keyframes qrLiveDotPulse {
                                0%, 100% { opacity: 1; transform: scale(1); }
                                50% { opacity: 0.4; transform: scale(0.85); }
                            }
                            #receptionist-qr-reader {
                                border: none !important;
                            }
                            #receptionist-qr-reader video {
                                border-radius: 16px !important;
                                object-fit: cover !important;
                                width: 100% !important;
                                max-height: 380px !important;
                            }
                            #receptionist-qr-reader__scan_region {
                                border: none !important;
                            }
                            #receptionist-qr-reader__dashboard_section {
                                display: none !important;
                            }
                        `}
                    </style>

                    <div
                        style={{
                            width: '100%',
                            maxWidth: 480,
                            background: '#0F172A',
                            borderRadius: 24,
                            padding: '24px 22px 20px',
                            boxShadow: '0 25px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.1)',
                            position: 'relative',
                            overflow: 'hidden',
                            color: '#FFFFFF'
                        }}
                    >
                        {/* Header with Live Status Pill */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div
                                    style={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: 12,
                                        background: 'linear-gradient(135deg, rgba(14, 136, 184, 0.3) 0%, rgba(2, 132, 199, 0.2) 100%)',
                                        border: '1px solid rgba(56, 189, 248, 0.4)',
                                        color: '#38BDF8',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '1.2rem',
                                        boxShadow: '0 0 15px rgba(56, 189, 248, 0.25)'
                                    }}
                                >
                                    <i className="fas fa-qrcode" />
                                </div>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: '#FFFFFF', letterSpacing: '-0.2px' }}>
                                            Live QR Scanner
                                        </h3>
                                        <span
                                            style={{
                                                background: 'rgba(16, 185, 129, 0.2)',
                                                border: '1px solid rgba(52, 211, 153, 0.4)',
                                                color: '#34D399',
                                                fontSize: '0.68rem',
                                                fontWeight: 800,
                                                padding: '2px 8px',
                                                borderRadius: 12,
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: 5
                                            }}
                                        >
                                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34D399', animation: 'qrLiveDotPulse 1.5s infinite' }} />
                                            LIVE
                                        </span>
                                    </div>
                                    <p style={{ fontSize: '0.76rem', color: '#94A3B8', margin: '2px 0 0 0' }}>
                                        Align pass inside the viewfinder reticle
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    stopScanner()
                                    setQrScannerOpen(false)
                                }}
                                style={{
                                    background: 'rgba(255, 255, 255, 0.08)',
                                    border: '1px solid rgba(255, 255, 255, 0.12)',
                                    width: 34,
                                    height: 34,
                                    borderRadius: '50%',
                                    fontSize: '0.9rem',
                                    color: '#94A3B8',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.15s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'
                                    e.currentTarget.style.color = '#EF4444'
                                    e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)'
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
                                    e.currentTarget.style.color = '#94A3B8'
                                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)'
                                }}
                            >
                                <i className="fas fa-times" />
                            </button>
                        </div>

                        {/* Error Banner if Camera is Blocked */}
                        {scannerError ? (
                            <div style={{ padding: 22, background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.35)', borderRadius: 18, textAlign: 'center', marginBottom: 16 }}>
                                <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.2)', color: '#F87171', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
                                    <i className="fas fa-video-slash" />
                                </div>
                                <h5 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#FCA5A5', margin: '0 0 6px' }}>Camera Permission Blocked</h5>
                                <p style={{ fontSize: '0.8rem', color: '#F87171', margin: '0 0 16px', lineHeight: 1.5 }}>
                                    {scannerError}
                                </p>
                                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                                    <button
                                        type="button"
                                        className="btn btn-sm"
                                        onClick={startScanner}
                                        style={{
                                            background: '#0E88B8',
                                            color: '#FFFFFF',
                                            border: 'none',
                                            padding: '8px 16px',
                                            borderRadius: 10,
                                            fontSize: '0.82rem',
                                            fontWeight: 700,
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 6
                                        }}
                                    >
                                        <i className="fas fa-redo" />
                                        Try Again
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-sm"
                                        onClick={() => fileInputRef.current?.click()}
                                        style={{
                                            background: 'rgba(255, 255, 255, 0.1)',
                                            color: '#E2E8F0',
                                            border: '1px solid rgba(255, 255, 255, 0.2)',
                                            padding: '8px 16px',
                                            borderRadius: 10,
                                            fontSize: '0.82rem',
                                            fontWeight: 700,
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 6
                                        }}
                                    >
                                        <i className="fas fa-upload" />
                                        Upload QR Image
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* Live High-Tech Viewfinder Camera Box */
                            <div
                                style={{
                                    position: 'relative',
                                    width: '100%',
                                    borderRadius: 20,
                                    overflow: 'hidden',
                                    background: '#020617',
                                    minHeight: 310,
                                    maxHeight: 360,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: 'inset 0 0 30px rgba(0,0,0,0.8), 0 0 0 1px rgba(56, 189, 248, 0.2)',
                                    marginBottom: 16
                                }}
                            >
                                {/* HTML5 QR Camera Container */}
                                <div
                                    id="receptionist-qr-reader"
                                    style={{
                                        width: '100%',
                                        height: '100%'
                                    }}
                                />

                                {/* Camera HUD Overlay (Cyber / Fintech Look) */}
                                <div
                                    style={{
                                        position: 'absolute',
                                        inset: 0,
                                        pointerEvents: 'none',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    {/* Central Target Viewfinder Box */}
                                    <div
                                        style={{
                                            width: 220,
                                            height: 220,
                                            position: 'relative',
                                            animation: 'qrPulseGlow 3s infinite ease-in-out'
                                        }}
                                    >
                                        {/* 4 Glowing Corner Brackets */}
                                        <div style={{ position: 'absolute', top: 0, left: 0, width: 24, height: 24, borderTop: '3.5px solid #38BDF8', borderLeft: '3.5px solid #38BDF8', borderRadius: '6px 0 0 0' }} />
                                        <div style={{ position: 'absolute', top: 0, right: 0, width: 24, height: 24, borderTop: '3.5px solid #38BDF8', borderRight: '3.5px solid #38BDF8', borderRadius: '0 6px 0 0' }} />
                                        <div style={{ position: 'absolute', bottom: 0, left: 0, width: 24, height: 24, borderBottom: '3.5px solid #38BDF8', borderLeft: '3.5px solid #38BDF8', borderRadius: '0 0 0 6px' }} />
                                        <div style={{ position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, borderBottom: '3.5px solid #38BDF8', borderRight: '3.5px solid #38BDF8', borderRadius: '0 0 6px 0' }} />

                                        {/* Subtle Center Crosshair */}
                                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 14, height: 14, opacity: 0.4 }}>
                                            <div style={{ position: 'absolute', top: 6, left: 0, right: 0, height: 2, background: '#38BDF8' }} />
                                            <div style={{ position: 'absolute', left: 6, top: 0, bottom: 0, width: 2, background: '#38BDF8' }} />
                                        </div>

                                        {/* Moving Neon Laser Scan Line */}
                                        <div
                                            style={{
                                                position: 'absolute',
                                                left: 8,
                                                right: 8,
                                                height: 3,
                                                background: 'linear-gradient(90deg, rgba(56, 189, 248, 0) 0%, rgba(56, 189, 248, 1) 50%, rgba(56, 189, 248, 0) 100%)',
                                                boxShadow: '0 0 12px 3px rgba(56, 189, 248, 0.8), 0 0 25px 6px rgba(14, 136, 184, 0.5)',
                                                animation: 'qrLaserSweep 2.2s ease-in-out infinite'
                                            }}
                                        />
                                    </div>

                                    {/* Viewfinder Target Label */}
                                    <div
                                        style={{
                                            position: 'absolute',
                                            bottom: 12,
                                            background: 'rgba(15, 23, 42, 0.75)',
                                            backdropFilter: 'blur(6px)',
                                            border: '1px solid rgba(255, 255, 255, 0.15)',
                                            color: '#E2E8F0',
                                            fontSize: '0.72rem',
                                            fontWeight: 700,
                                            padding: '4px 14px',
                                            borderRadius: 20,
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 6
                                        }}
                                    >
                                        <i className="fas fa-crosshairs" style={{ color: '#38BDF8', fontSize: '0.7rem' }} />
                                        Hold phone steady • Auto-capturing
                                    </div>
                                </div>

                                {/* Camera Loading Overlay */}
                                {qrScanningState && (
                                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(2, 6, 23, 0.85)', backdropFilter: 'blur(4px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, zIndex: 10 }}>
                                        <div className="spinner-border text-info" role="status" style={{ width: '2.4rem', height: '2.4rem' }} />
                                        <small style={{ color: '#FFFFFF', fontWeight: 800, fontSize: '0.84rem', letterSpacing: '0.3px' }}>Starting Camera Stream...</small>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Hidden temp container for scanning image files */}
                        <div id="receptionist-qr-reader-file-temp" style={{ display: 'none' }} />
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleScanFile}
                            style={{ display: 'none' }}
                        />

                        {/* Bottom Actions Bar */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, paddingTop: 12, borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                            <button
                                type="button"
                                onClick={toggleCameraFacing}
                                style={{
                                    background: 'rgba(255, 255, 255, 0.08)',
                                    border: '1px solid rgba(255, 255, 255, 0.15)',
                                    color: '#E2E8F0',
                                    padding: '8px 14px',
                                    borderRadius: 10,
                                    fontSize: '0.8rem',
                                    fontWeight: 700,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 7,
                                    cursor: 'pointer',
                                    transition: 'background 0.15s ease'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
                            >
                                <i className="fas fa-camera-rotate" style={{ color: '#38BDF8' }} />
                                <span>Switch: {cameraFacing === 'environment' ? 'Rear Camera' : 'Front Camera'}</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                style={{
                                    background: 'rgba(56, 189, 248, 0.12)',
                                    border: '1px solid rgba(56, 189, 248, 0.35)',
                                    color: '#38BDF8',
                                    padding: '8px 14px',
                                    borderRadius: 10,
                                    fontSize: '0.8rem',
                                    fontWeight: 700,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 7,
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(56, 189, 248, 0.22)'
                                    e.currentTarget.style.color = '#FFFFFF'
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'rgba(56, 189, 248, 0.12)'
                                    e.currentTarget.style.color = '#38BDF8'
                                }}
                            >
                                <i className="fas fa-file-image" />
                                <span>Upload QR Image</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* SUCCESS RECEIPT & CHECK-IN CONFIRMATION MODAL */}
            {successReceiptModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(8px)', zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                    <div style={{ width: '100%', maxWidth: 440, background: '#FFFFFF', borderRadius: 24, padding: 26, boxShadow: '0 25px 50px rgba(0,0,0,0.4)', position: 'relative' }}>
                        <div style={{ textAlign: 'center', marginBottom: 20 }}>
                            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#10B981', color: '#FFFFFF', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', boxShadow: '0 8px 20px rgba(16, 185, 129, 0.4)' }}>
                                <i className="fas fa-check" />
                            </div>
                            <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#059669', fontWeight: 800, padding: '5px 12px', borderRadius: 8, fontSize: '0.78rem' }}>
                                ENTRY SUCCESSFULLY UPDATED
                            </span>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '8px 0 0 0', color: 'var(--text-primary)' }}>
                                Receipt #{successReceiptModal.receiptId}
                            </h3>
                        </div>

                        <div style={{ background: '#F8FAFC', borderRadius: 16, padding: 18, border: '1px solid #E2E8F0', marginBottom: 20, fontSize: '0.85rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                <span style={{ color: 'var(--text-muted)' }}>Customer Name:</span>
                                <strong>{successReceiptModal.customerName}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                <span style={{ color: 'var(--text-muted)' }}>Phone Number:</span>
                                <strong>{successReceiptModal.customerPhone}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                <span style={{ color: 'var(--text-muted)' }}>Card Pass Updated:</span>
                                <strong>{successReceiptModal.cardTitle}</strong>
                            </div>

                            {successReceiptModal.cardType === 'stamp' ? (
                                <>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, color: 'var(--firstloop-primary)' }}>
                                        <span>Stamps Updated:</span>
                                        <strong>{successReceiptModal.previousStamps} &rarr; {successReceiptModal.newStamps} / {successReceiptModal.totalStamps} Stamps</strong>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, color: '#059669' }}>
                                        <span>Stamps Remaining:</span>
                                        <strong>{successReceiptModal.remainingStamps} stamps remaining</strong>
                                    </div>
                                </>
                            ) : (
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, color: '#D97706' }}>
                                    <span>Check-In Entry:</span>
                                    <strong>Today ({successReceiptModal.time}) Validated • Active Member</strong>
                                </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                <span style={{ color: 'var(--text-muted)' }}>Payment Method:</span>
                                <strong>{successReceiptModal.paymentMethod}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #CBD5E1', paddingTop: 8, marginTop: 8, fontSize: '0.95rem' }}>
                                <strong>Amount Paid:</strong>
                                <strong style={{ color: 'var(--firstloop-primary)' }}>{successReceiptModal.paymentAmount}</strong>
                            </div>
                        </div>

                        <button
                            type="button"
                            className="btn firstloop-btn-primary"
                            onClick={() => {
                                setSuccessReceiptModal(null)
                            }}
                            style={{ width: '100%', height: 44, borderRadius: 10, fontWeight: 800 }}
                        >
                            <i className="fas fa-check-circle" style={{ marginRight: 6 }} />
                            View Paid Card on Terminal
                        </button>
                    </div>
                </div>
            )}
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
