import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { Html5Qrcode } from 'html5-qrcode'
import { toast } from 'react-hot-toast'
import API from '../../../api.js'
import CustomerCard from '../../../components/CustomerCard.jsx'
import CustomerCardHistory from '../../../components/CustomerCardHistory.jsx'
import AddCardCustomerModal from './AddCardCustomerModal.jsx'
import {
    fetchCustomerStampLevelsApi,
    formatExpiryDate,
    cleanPhoneForWhatsApp,
    waitForCardAssets,
    captureCardCanvas
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

export const getAvailableInheritedRewards = (activeLevel) => {
    if (!activeLevel) return []

    const rawInherited = Array.isArray(activeLevel.InheritedRewards)
        ? activeLevel.InheritedRewards
        : (Array.isArray(activeLevel.inherited_rewards) ? activeLevel.inherited_rewards : [])

    const list = []

    rawInherited.forEach((r, idx) => {
        const hasFree = Number(r.free_stamp) === 1 || r.free_stamp === true || r.free_stamp === '1' || Boolean(r.free_text)
        if (hasFree) {
            const rewardId = Number(r.id || r.inherited_reward_id || 0)
            list.push({
                key: `inherited_${rewardId}_${idx}`,
                id: rewardId,
                inherited_reward_id: rewardId,
                title: r.free_text || r.reward || r.reward_text || `Free Perk #${idx + 1}`,
                isInherited: true
            })
        }
    })

    return list
}

export default function QrScannerModal({ isOpen, onClose, onSuccess, branchId = '' }) {
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

    const [searchParams] = useSearchParams()
    const effectiveBranchId = branchId || searchParams.get('branchId') || receptionist?.user_branch_id || receptionist?.branch_id || ''

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
    const [selectedStampIndex, setSelectedStampIndex] = useState(null)
    const [inheritedRewardActions, setInheritedRewardActions] = useState({})
    const [historyModalOpen, setHistoryModalOpen] = useState(false)
    const [addCardModalOpen, setAddCardModalOpen] = useState(false)
    const [sharingWhatsApp, setSharingWhatsApp] = useState(false)

    const scannerRef = useRef(null)
    const fileInputRef = useRef(null)
    const cardRef = useRef(null)

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
                setSelectedStampIndex(null)
                setPaymentAmount('0.00')
            }
        } catch (err) {
            console.error("Error refreshing card details:", err)
        } finally {
            setLoadingCardDetails(false)
        }
    }

    // Direct selection of a stamp number with step-by-step progression enforcement
    const handleSelectStamp = (idx) => {
        const levels = selectedCardDetails?.CustomerStampLevels || selectedCardDetails?.levelRewards || selectedCardDetails?.stamp_levels || []
        const levelData = levels[idx] || null
        const isProcessed = Number(levelData?.status) === 1

        const total = Number(selectedCardDetails?.total_stamps || selectedCardDetails?.number_of_stamps || selectedCard?.total_stamps || 8)
        let firstUnprocessed = total
        for (let i = 0; i < total; i++) {
            const lvl = levels[i]
            const isPaid = lvl?.status !== undefined ? Number(lvl.status) === 1 : false
            if (!isPaid) {
                firstUnprocessed = i
                break
            }
        }

        // Step-by-step enforcement: Only completed stamps or the immediate next stamp can be clicked
        if (!isProcessed && idx > firstUnprocessed) {
            toast.error(`Please complete Stamp #${firstUnprocessed + 1} first! Stamps must be processed step by step.`)
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

        if (isProcessed) {
            if (levelData?.payment_type == 2 || String(levelData?.payment_method).toLowerCase() === 'online') {
                setPaymentMethod('Online')
            } else {
                setPaymentMethod('Cash')
            }
        }
    }

    // Load full card levels when a card is selected
    useEffect(() => {
        if (!selectedCard?.id || !matchedCustomer?.id) {
            setSelectedCardDetails(null)
            setSelectedStampIndex(null)
            return
        }

        let isMounted = true
        const loadCardDetails = async () => {
            setLoadingCardDetails(true)
            setSelectedStampIndex(null)
            try {
                const data = await fetchCustomerStampLevelsApi(
                    selectedCard.id,
                    selectedCard.card_type,
                    matchedCustomer.id
                )
                if (isMounted) {
                    setSelectedCardDetails(data || selectedCard)
                    setSelectedStampIndex(null)
                    setPaymentAmount('0.00')
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
                qr_code: rawCode,
                br_id: effectiveBranchId
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

    // Share updated customer card to WhatsApp
    const handleShareToWhatsApp = async (receiptData = null) => {
        const cardEl = cardRef.current
        const activeCard = selectedCardDetails || selectedCard
        const customer = matchedCustomer

        const isStamp = Number(selectedCard?.card_type || activeCard?.card_type || 1) === 1
        const brand = activeCard?.brand_name || activeCard?.brandName || selectedCard?.brand_name || 'FirstLoop'
        const title = activeCard?.title || activeCard?.name || (isStamp ? 'Loyalty Stamp Pass' : 'VIP Membership Pass')
        const total = Number(receiptData?.totalStamps || activeCard?.total_stamps || activeCard?.number_of_stamps || activeCard?.total || 8)
        const currentStamps = receiptData?.newStamps !== undefined
            ? Number(receiptData.newStamps)
            : Number(activeCard?.current_stamp ?? activeCard?.current_stamps ?? activeCard?.collected ?? 0)

        const customerPhone = customer?.phone || customer?.mobile || activeCard?.customerPhone || activeCard?.phone || ''
        const customerCountryCode = customer?.country_code || customer?.countryCode || activeCard?.country_code || '91'
        const targetPhone = cleanPhoneForWhatsApp(customerPhone, customerCountryCode)
        const customerName = customer?.name || activeCard?.cardholderName || activeCard?.customer_name || 'Valued Customer'
        const expiryFormatted = formatExpiryDate(activeCard?.expires_at || activeCard?.expiry)
        const expiryLine = expiryFormatted ? `\n⏳ *Expires On:* ${expiryFormatted}` : ''

        let descToSend = ''
        if (isStamp) {
            const perkLine = receiptData?.freePerk ? `\n🎁 *Perk Unlocked:* ${receiptData.freePerk}` : ''
            const stampMsg = receiptData?.stampNumber
                ? `⭐ *Stamp #${receiptData.stampNumber} Recorded!* (${currentStamps}/${total} Stamps collected)`
                : `⭐ *Stamp Progress:* ${currentStamps}/${total} Stamps collected`

            descToSend = `🎉 *Hello ${customerName}!* 👋\nHere is your updated loyalty stamp pass for *${brand}* - *${title}*:\n\n${stampMsg}${perkLine}${expiryLine}\n\nThank you for choosing ${brand}! ✨`
        } else {
            descToSend = `🎉 *Hello ${customerName}!* 👋\nHere is your digital membership pass for *${brand}* - *${title}*:\n\n👑 *Daily VIP Check-In Validated!*${expiryLine}\n\nThank you for visiting ${brand}! ✨`
        }

        const rawName = title || 'customer-card'
        const safeName = rawName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'card'
        const fileName = `${safeName}-${Date.now().toString().slice(-4)}.png`

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
        const toastId = toast.loading('Capturing card image for WhatsApp...')

        try {
            await waitForCardAssets(cardEl)
            const canvas = await captureCardCanvas(cardEl)
            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'))

            if (!blob) {
                throw new Error('Failed to generate image blob from card')
            }

            const file = new File([blob], fileName, { type: 'image/png' })
            const blobUrl = URL.createObjectURL(blob)

            if (!targetPhone && typeof navigator !== 'undefined' && typeof navigator.share === 'function' && typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
                toast.dismiss(toastId)
                try {
                    await navigator.share({
                        files: [file],
                        title: `${brand} - ${title}`,
                        text: descToSend
                    })
                    toast.success('Card image shared successfully! 🎉')
                    return
                } catch (shareErr) {
                    if (shareErr.name === 'AbortError') return
                    console.warn('Web Share API error, falling back:', shareErr)
                }
            }

            toast.dismiss(toastId)

            let copiedToClipboard = false
            try {
                if (navigator.clipboard && window.ClipboardItem) {
                    await navigator.clipboard.write([
                        new ClipboardItem({ 'image/png': blob })
                    ])
                    copiedToClipboard = true
                }
            } catch (clipErr) {
                console.warn('Clipboard write image not supported:', clipErr)
            }

            const dlLink = document.createElement('a')
            dlLink.href = blobUrl
            dlLink.download = fileName
            document.body.appendChild(dlLink)
            dlLink.click()
            document.body.removeChild(dlLink)

            openWhatsAppDirectly()

            if (copiedToClipboard) {
                toast.success(`Card image copied! In WhatsApp (+${targetPhone || customerPhone || ''}), press Ctrl+V to paste & send.`, { duration: 6000 })
            } else {
                toast.success(`Card image downloaded! Opening WhatsApp (+${targetPhone || customerPhone || ''})...`, { duration: 6000 })
            }
        } catch (error) {
            console.warn('Image capture note, opening WhatsApp directly:', error)
            toast.dismiss(toastId)
            openWhatsAppDirectly()
            toast.success(`Opening WhatsApp (+${targetPhone || customerPhone || ''})...`)
        } finally {
            setSharingWhatsApp(false)
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

        if (isStamp) {
            if (selectedStampIndex === null || selectedStampIndex === undefined) {
                toast.error("Please select a stamp number first")
                return
            }

            const levels = selectedCardDetails?.CustomerStampLevels || selectedCardDetails?.levelRewards || selectedCardDetails?.stamp_levels || []
            const activeLevel = levels[selectedStampIndex] || null
            const isProcessed = Number(activeLevel?.status) === 1

            if (!isProcessed && currentCollected >= totalStamps) {
                toast.error("This stamp card is already fully completed!")
                return
            }

            setSavingCheckIn(true)
            try {
                const stampLevelId = Number(
                    activeLevel?.id ||
                    activeLevel?.stamp_level_id ||
                    selectedCardDetails?.stamp_level_id ||
                    0
                )

                const stampId = activeLevel?.id || activeLevel?.stamp_level_id || 0

                const rType = getRewardTypeInfo(selectedCardDetails, selectedStampIndex)
                const discPercent = getDiscountPercentage(selectedCardDetails, selectedStampIndex)

                const enteredAmt = rType === 'Free' ? 0 : (parseFloat(paymentAmount) || 0)
                const finalPaidAmt = rType === 'Free'
                    ? 0
                    : (rType === 'Discount'
                        ? Math.max(0, enteredAmt - (enteredAmt * discPercent) / 100)
                        : enteredAmt)

                const rawInherited = Array.isArray(activeLevel?.InheritedRewards)
                    ? activeLevel.InheritedRewards
                    : (Array.isArray(activeLevel?.inherited_rewards) ? activeLevel.inherited_rewards : [])

                const currentPerksList = []

                rawInherited.forEach((r, idx) => {
                    const hasFree = Number(r.free_stamp) === 1 || r.free_stamp === true || r.free_stamp === '1' || Boolean(r.free_text)
                    if (hasFree) {
                        const rewardId = Number(r.id || r.inherited_reward_id || 0)
                        currentPerksList.push({
                            id: rewardId,
                            inherited_reward_id: rewardId,
                            title: r.free_text || r.reward || r.reward_text || `Free Perk #${idx + 1}`
                        })
                    }
                })

                const inheritedRewardsPayload = currentPerksList.map(p => ({
                    inherited_reward_id: Number(p.id || p.inherited_reward_id),
                    action: inheritedRewardActions[p.id || p.inherited_reward_id] || 'use'
                }))

                const payload = {
                    cus_id: Number(matchedCustomer.id),
                    card_id: Number(selectedCard.id),
                    payment_type: paymentMethod === 'Online' ? 2 : 1,
                    amount: enteredAmt,
                    paid_amount: parseFloat(finalPaidAmt.toFixed(2)),
                    stamp_level_id: stampLevelId,
                    inherited_rewards: inheritedRewardsPayload
                }

                // If the stamp has already been processed (status = 1), pass that stamp's id to the API and treat it as an edit action
                if (isProcessed && stampId) {
                    payload.id = Number(stampId)
                }

                const res = await API.post('firstloop/customer/stamp-paid', payload)

                if (res?.data?.status == 1) {
                    const newStamps = isProcessed ? currentCollected : Math.min(totalStamps, currentCollected + 1)
                    toast.success(res.data.message || (isProcessed ? `Stamp #${selectedStampIndex + 1} updated successfully! 🚀` : "Stamp payment entry logged successfully! 🚀"))

                    const earnedFreePerk = (Number(activeLevel?.free_stamp) === 1 || Boolean(activeLevel?.free_text))
                        ? (activeLevel?.free_text || 'Free Perk')
                        : (Number(selectedCardDetails?.free_stamp) === 1 ? (selectedCardDetails?.free_text || 'Free Perk') : null)

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
                        paymentAmount: `${finalPaidAmt.toFixed(2)}`,
                        freePerk: earnedFreePerk,
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        actionType: isProcessed ? 'Stamp Edit' : 'Stamp Check-In',
                        stampNumber: selectedStampIndex + 1
                    }

                    // DO NOT CLOSE MODAL: keep modal open and refresh card details live!
                    setLastReceipt(receipt)
                    setSelectedStampIndex(null)

                    // Refresh card details so new stamp fills in live on card preview & progress circles
                    await refreshCardDetails(selectedCard.id, selectedCard.card_type, matchedCustomer.id)

                    if (onSuccess) onSuccess()

                    // Automatically share to WhatsApp after submit
                    setTimeout(() => {
                        handleShareToWhatsApp(receipt)
                    }, 400)
                } else {
                    toast.error(res?.data?.message || (isProcessed ? "Failed to update stamp entry" : "Failed to log stamp entry"))
                }
            } catch (err) {
                console.error("Check-In submission error:", err)
                toast.error(err?.response?.data?.message || "Failed to process check-in")
            } finally {
                setSavingCheckIn(false)
            }
        } else {
            // Membership Daily Check-In
            setSavingCheckIn(true)
            try {
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

                // Automatically share to WhatsApp after submit
                setTimeout(() => {
                    handleShareToWhatsApp(receipt)
                }, 400)
            } catch (err) {
                console.error("Check-In submission error:", err)
                toast.error(err?.response?.data?.message || "Failed to process check-in")
            } finally {
                setSavingCheckIn(false)
            }
        }
    }

    const handleRescan = () => {
        setMatchedCustomer(null)
        setSelectedCard(null)
        setSelectedCardDetails(null)
        setLastReceipt(null)
        setSelectedStampIndex(null)
        setManualCode('')
        setCameraError(null)
    }

    if (!isOpen) return null

    const isStampCard = Number(selectedCard?.card_type) === 1
    const totalStamps = Number(selectedCardDetails?.total_stamps || selectedCardDetails?.number_of_stamps || selectedCard?.total_stamps || 8)
    const collectedStamps = Number(selectedCardDetails?.current_stamp ?? selectedCardDetails?.current_stamps ?? selectedCard?.current_stamp ?? selectedCard?.collected ?? 0)
    const isCardDone = Number(selectedCardDetails?.is_completed) === 1 || Number(selectedCard?.is_completed) === 1 || collectedStamps >= totalStamps
    const isCompleted = isStampCard && isCardDone
    const remainingStamps = Math.max(0, totalStamps - collectedStamps)

    // Step-by-step lock & reward calculation for stamp pass
    const stampLevelsList = selectedCardDetails?.CustomerStampLevels || selectedCardDetails?.levelRewards || selectedCardDetails?.stamp_levels || []

    let firstUnprocessedIndex = totalStamps
    for (let i = 0; i < totalStamps; i++) {
        const lvl = stampLevelsList[i]
        const isPaid = lvl?.status !== undefined ? Number(lvl.status) === 1 : false
        if (!isPaid) {
            firstUnprocessedIndex = i
            break
        }
    }

    const activeStampIdx = selectedStampIndex !== null ? selectedStampIndex : -1
    const activeLevel = activeStampIdx >= 0 ? stampLevelsList[activeStampIdx] : null
    const isSelectedStampProcessed = activeLevel?.status !== undefined ? Number(activeLevel.status) === 1 : false

    const currentRewardType = activeStampIdx >= 0 ? getRewardTypeInfo(selectedCardDetails, activeStampIdx) : 'Paid'
    const currentDiscountPercent = activeStampIdx >= 0 ? getDiscountPercentage(selectedCardDetails, activeStampIdx) : 0
    const currentPerkText = activeLevel?.reward || activeLevel?.free_text || selectedCardDetails?.descption || ''

    const enteredTransactionAmount = currentRewardType === 'Free' ? 0 : (parseFloat(paymentAmount) || 0)
    const discountAmountDeduction = currentRewardType === 'Discount' ? (enteredTransactionAmount * currentDiscountPercent) / 100 : 0
    const finalPayableAmount = currentRewardType === 'Free' ? 0 : Math.max(0, enteredTransactionAmount - discountAmountDeduction)

    const availablePerks = getAvailableInheritedRewards(activeLevel)
    const hasFreeBonus = availablePerks.length > 0 || (activeStampIdx >= 0 && (Number(activeLevel?.free_stamp) === 1 || Boolean(activeLevel?.free_text)))
    const freeBonusText = (availablePerks.length > 0 ? availablePerks.map(p => p.title).join(', ') : '') || activeLevel?.free_text || ''

    const handlePerkActionChange = (rewardId, action) => {
        setInheritedRewardActions(prev => ({
            ...prev,
            [rewardId]: action
        }))
    }

    const handleSetAllPerkActions = (action) => {
        setInheritedRewardActions(prev => {
            const next = { ...prev }
            availablePerks.forEach(p => {
                const pid = p.id || p.inherited_reward_id
                next[pid] = action
            })
            return next
        })
    }

    const handleAddNewCard = () => {
        setAddCardModalOpen(true)
    }

    const handleAddCardModalSuccess = async (resData, customerInfo) => {
        setAddCardModalOpen(false)
        if (onClose) onClose()
        if (onSuccess) onSuccess(customerInfo)
    }

    // Merge card data with customer details to ensure full preview display
    const cardForPreview = {
        ...(selectedCard || {}),
        ...(selectedCardDetails || {}),
        expires_at: selectedCardDetails?.expires_at || selectedCard?.expires_at || null,
        expiry: selectedCardDetails?.expires_at || selectedCard?.expires_at || selectedCardDetails?.expiry || selectedCard?.expiry || null,
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
                        {matchedCustomer && selectedCard && (isCompleted || remainingStamps <= 4 || Number(selectedCard?.is_completed) === 1) && (
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
                                                {lastReceipt.freePerk && ` • 🎁 Unlocked Free Perk: ${lastReceipt.freePerk}`}
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
                                                transition: 'all 0.2s ease',
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
                                                    <span>Share Card to WhatsApp{matchedCustomer?.phone ? ` (+${cleanPhoneForWhatsApp(matchedCustomer.phone, matchedCustomer.country_code || matchedCustomer.countryCode || '91')})` : ''}</span>
                                                </>
                                            )}
                                        </button>

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
                                            title="Dismiss"
                                        >
                                            <i className="fas fa-times" />
                                        </button>
                                    </div>
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
                            {/* BRANCH SELECTOR: User can choose branch to see cards of that branch */}
                            {/* {customerBranches.length > 0 && (
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
                            )} */}

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
                                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 380px) 1fr', gap: 24, alignItems: 'start' }}>
                                        {/* LEFT COLUMN: LIVE DIGITAL CUSTOMER PASS (PREVIEW ONLY) */}
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'sticky', top: 12 }}>
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
                                                                    <span>Share Card to WhatsApp{matchedCustomer?.phone ? ` (+${cleanPhoneForWhatsApp(matchedCustomer.phone, matchedCustomer.country_code || matchedCustomer.countryCode || '91')})` : ''}</span>
                                                                </>
                                                            )}
                                                        </button>
                                                    </div>

                                                    {/* Left Column Stamp Perk Preview Details */}
                                                    {isStampCard &&  activeStampIdx !== null && (
                                                        <div style={{ width: '100%', maxWidth: 450, marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                                                            {/* Current Stamp Perk */}
                                                            <div
                                                                style={{
                                                                    background: '#F8FAFC',
                                                                    borderRadius: 12,
                                                                    padding: '12px 14px',
                                                                    border: '1px solid #E2E8F0',
                                                                    display: 'flex',
                                                                    flexDirection: 'column',
                                                                    gap: 6,
                                                                    boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                                                                }}
                                                            >
                                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                                                                    <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'flex', alignItems: 'center', gap: 5 }}>
                                                                        <i className={currentRewardType === 'Discount' ? 'fas fa-percent' : (currentRewardType === 'Paid' ? 'fas fa-tag' : 'fas fa-gift')} style={{ color: currentRewardType === 'Discount' ? '#0284C7' : (currentRewardType === 'Paid' ? '#F59E0B' : '#10B981') }} />
                                                                        Current Stamp Perk
                                                                    </span>
                                                                    <span
                                                                        style={{
                                                                            fontSize: '0.72rem',
                                                                            fontWeight: 700,
                                                                            padding: '2px 8px',
                                                                            borderRadius: 999,
                                                                            background: currentRewardType === 'Discount' ? 'rgba(2, 132, 199, 0.12)' : (currentRewardType === 'Paid' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)'),
                                                                            color: currentRewardType === 'Discount' ? '#0284C7' : (currentRewardType === 'Paid' ? '#B45309' : '#059669')
                                                                        }}
                                                                    >
                                                                        {currentRewardType === 'Discount' ? 'Discount Perk' : (currentRewardType === 'Paid' ? 'Paid Perk' : 'Free Item')}
                                                                    </span>
                                                                </div>
                                                                <div
                                                                    style={{
                                                                        fontSize: '0.86rem',
                                                                        fontWeight: 700,
                                                                        color: '#1E293B',
                                                                        lineHeight: 1.45,
                                                                        wordBreak: 'break-word',
                                                                        backgroundColor: '#FFFFFF',
                                                                        borderRadius: 8,
                                                                        padding: '8px 12px',
                                                                        border: '1px solid #E2E8F0',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: 8
                                                                    }}
                                                                >
                                                                    <span style={{ flex: 1 }}>
                                                                        {currentPerkText || (currentRewardType === 'Discount' ? 'Discount Perk' : (currentRewardType === 'Paid' ? 'Paid Perk' : 'Free Item'))}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            {/* Other details such as Free Stamp and Discount */}
 {(
    currentRewardType === 'Discount' &&
    (
        currentDiscountPercent > 0 ||
        hasFreeBonus
    )
) && (
    <div
        style={{
            background: '#F8FAFC',
            borderRadius: 12,
            padding: '12px 14px',
            border: '1px solid #E2E8F0',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
        }}
    >
        <span
            style={{
                fontSize: '0.74rem',
                fontWeight: 800,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
            }}
        >
            Other details such as Free Stamp and Discount:
        </span>

        {/* Discount */}
        {currentDiscountPercent > 0 && (
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.82rem'
                }}
            >
                <span
                    style={{
                        color: '#0284C7',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5
                    }}
                >
                    <i className="fas fa-percent" />
                    <span>Discount:</span>
                </span>

                <span
                    style={{
                        color: '#0284C7',
                        fontWeight: 800
                    }}
                >
                    {currentDiscountPercent}% (-{discountAmountDeduction.toFixed(2)})
                </span>
            </div>
        )}

        {/* Free Stamp */}
        {hasFreeBonus && (
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                    borderTop: currentDiscountPercent > 0
                        ? '1px dashed #E2E8F0'
                        : 'none',
                    paddingTop: currentDiscountPercent > 0 ? 8 : 0
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '0.82rem'
                    }}
                >
                    <span
                        style={{
                            color: '#059669',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5
                        }}
                    >
                        <i className="fas fa-gift" />
                        <span>Free Stamp Perk:</span>
                    </span>
                </div>

                <div
                    style={{
                        background: 'rgba(16, 185, 129, 0.08)',
                        color: '#047857',
                        border: '1px solid rgba(16, 185, 129, 0.25)',
                        fontWeight: 700,
                        padding: '8px 12px',
                        borderRadius: 8,
                        fontSize: '0.84rem',
                        lineHeight: 1.45,
                        wordBreak: 'break-word',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 8
                    }}
                >
                    <i
                        className="fas fa-gift"
                        style={{
                            marginTop: 2,
                            flexShrink: 0,
                            color: '#10B981'
                        }}
                    />

                    <span style={{ flex: 1 }}>
                        {freeBonusText || 'Free Bonus Perk'}
                    </span>
                </div>
            </div>
        )}
    </div>
)}
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>

                                        {/* RIGHT COLUMN: STAMPS STATUS, PERKS & PAYMENT FORM */}
                                        <div>
                                            <form onSubmit={handleConfirmCheckIn}>
                                                {isStampCard ? (
                                                    <div>
                                                        {/* Current Stamp Progress Card */}
                                                        <div
                                                            style={{
                                                                background: '#FFFFFF',
                                                                borderRadius: 16,
                                                                border: '1.5px solid #E2E8F0',
                                                                marginBottom: 16,
                                                                overflow: 'hidden',
                                                                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                                                            }}
                                                        >
                                                            {/* Header */}
                                                            <div
                                                                style={{
                                                                    padding: '14px 18px',
                                                                    background: '#F8FAFC',
                                                                    borderBottom: '1px solid #E2E8F0',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'space-between',
                                                                    gap: 12
                                                                }}
                                                            >
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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

                                                            {/* Stamp Circles: Step-by-Step with Locking */}
                                                            <div style={{ padding: '16px 18px', background: '#FFFFFF' }}>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                                                    <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                                        Select Stamp Number to Process or Edit:
                                                                    </span>
                                                                    <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
                                                                        Click on any unlocked circle
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

                                                                {/* Free Stamp Perk Action Choice (Use Now or Move to Next Stamp) */}
                                                                {availablePerks.length > 0 && (
                                                                    <div
                                                                        style={{
                                                                            background: 'linear-gradient(135deg, #F0FDF4 0%, #ECFDF5 100%)',
                                                                            border: '1.5px solid #86EFAC',
                                                                            borderRadius: 12,
                                                                            padding: '12px 14px',
                                                                            marginBottom: 12,
                                                                            boxShadow: '0 2px 8px rgba(16, 185, 129, 0.08)'
                                                                        }}
                                                                    >
                                                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                                                <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#10B981', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.78rem', flexShrink: 0 }}>
                                                                                    <i className="fas fa-gift" />
                                                                                </div>
                                                                                <div>
                                                                                    <strong style={{ fontSize: '0.84rem', color: '#166534', display: 'block' }}>
                                                                                        Free Stamp Perk Available
                                                                                    </strong>
                                                                                    <span style={{ fontSize: '0.73rem', color: '#15803D' }}>
                                                                                        Would you like to use the free stamp perk now, or move it to the next stamp?
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                            {availablePerks.length > 1 && (
                                                                                <div style={{ display: 'flex', gap: 6 }}>
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => handleSetAllPerkActions('use')}
                                                                                        style={{
                                                                                            background: '#ECFDF5',
                                                                                            border: '1px solid #10B981',
                                                                                            color: '#047857',
                                                                                            padding: '3px 8px',
                                                                                            borderRadius: 6,
                                                                                            fontSize: '0.72rem',
                                                                                            fontWeight: 700,
                                                                                            cursor: 'pointer'
                                                                                        }}
                                                                                    >
                                                                                        <i className="fas fa-check-double" style={{ marginRight: 4 }} />
                                                                                        Use All
                                                                                    </button>
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => handleSetAllPerkActions('move')}
                                                                                        style={{
                                                                                            background: '#F0F9FF',
                                                                                            border: '1px solid #0EA5E9',
                                                                                            color: '#0284C7',
                                                                                            padding: '3px 8px',
                                                                                            borderRadius: 6,
                                                                                            fontSize: '0.72rem',
                                                                                            fontWeight: 700,
                                                                                            cursor: 'pointer'
                                                                                        }}
                                                                                    >
                                                                                        <i className="fas fa-arrow-right" style={{ marginRight: 4 }} />
                                                                                        Move All
                                                                                    </button>
                                                                                </div>
                                                                            )}
                                                                        </div>

                                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                                                            {availablePerks.map((perk) => {
                                                                                const currentAction = inheritedRewardActions[perk.inherited_reward_id] || 'use'
                                                                                return (
                                                                                    <div
                                                                                        key={perk.key}
                                                                                        style={{
                                                                                            background: '#FFFFFF',
                                                                                            border: '1px solid #BBF7D0',
                                                                                            borderRadius: 10,
                                                                                            padding: '10px 12px'
                                                                                        }}
                                                                                    >
                                                                                        <div style={{ marginBottom: 6 }}>
                                                                                            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#047857', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                                                                                                Stamp Free Perk
                                                                                            </span>
                                                                                            <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#1E293B', lineHeight: 1.4, wordBreak: 'break-word', marginTop: 2 }}>
                                                                                                {perk.title}
                                                                                            </div>
                                                                                        </div>

                                                                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                                                                            <button
                                                                                                type="button"
                                                                                                onClick={() => handlePerkActionChange(perk.inherited_reward_id, 'use')}
                                                                                                style={{
                                                                                                    padding: '7px 10px',
                                                                                                    borderRadius: 8,
                                                                                                    fontSize: '0.78rem',
                                                                                                    fontWeight: 700,
                                                                                                    cursor: 'pointer',
                                                                                                    display: 'flex',
                                                                                                    alignItems: 'center',
                                                                                                    justifyContent: 'center',
                                                                                                    gap: 6,
                                                                                                    border: currentAction === 'use' ? '2px solid #10B981' : '1px solid #CBD5E1',
                                                                                                    background: currentAction === 'use' ? '#ECFDF5' : '#FFFFFF',
                                                                                                    color: currentAction === 'use' ? '#047857' : '#64748B',
                                                                                                    boxShadow: currentAction === 'use' ? '0 2px 6px rgba(16, 185, 129, 0.2)' : 'none'
                                                                                                }}
                                                                                            >
                                                                                                <i className={`fas ${currentAction === 'use' ? 'fa-check-circle' : 'far fa-circle'}`} style={{ color: currentAction === 'use' ? '#10B981' : '#94A3B8' }} />
                                                                                                <span>Use Perk Now</span>
                                                                                            </button>

                                                                                            <button
                                                                                                type="button"
                                                                                                onClick={() => handlePerkActionChange(perk.inherited_reward_id, 'move')}
                                                                                                style={{
                                                                                                    padding: '7px 10px',
                                                                                                    borderRadius: 8,
                                                                                                    fontSize: '0.78rem',
                                                                                                    fontWeight: 700,
                                                                                                    cursor: 'pointer',
                                                                                                    display: 'flex',
                                                                                                    alignItems: 'center',
                                                                                                    justifyContent: 'center',
                                                                                                    gap: 6,
                                                                                                    border: currentAction === 'move' ? '2px solid #0E88B8' : '1px solid #CBD5E1',
                                                                                                    background: currentAction === 'move' ? '#F0F9FF' : '#FFFFFF',
                                                                                                    color: currentAction === 'move' ? '#0369A1' : '#64748B',
                                                                                                    boxShadow: currentAction === 'move' ? '0 2px 6px rgba(14, 136, 184, 0.2)' : 'none'
                                                                                                }}
                                                                                            >
                                                                                                <i className={`fas ${currentAction === 'move' ? 'fa-arrow-right' : 'far fa-circle'}`} style={{ color: currentAction === 'move' ? '#0E88B8' : '#94A3B8' }} />
                                                                                                <span>Move to Next Stamp</span>
                                                                                            </button>
                                                                                        </div>
                                                                                    </div>
                                                                                )
                                                                            })}
                                                                        </div>
                                                                    </div>
                                                                )}

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
                                                                    disabled={savingCheckIn}
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
                                                                    {savingCheckIn ? (
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
                                                            /* Instruction guide when no stamp number has been selected yet */
                                                            isCompleted ? (
                                                                <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 16, padding: '20px', marginBottom: 18, textAlign: 'center' }}>
                                                                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#10B981', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', fontSize: '1.3rem' }}>
                                                                        <i className="fas fa-check-double" />
                                                                    </div>
                                                                    <h5 style={{ fontWeight: 800, color: '#065F46', margin: '0 0 4px', fontSize: '1rem' }}>
                                                                        Stamp Card Fully Completed!
                                                                    </h5>
                                                                    <p style={{ fontSize: '0.82rem', color: '#047857', margin: '0 0 14px 0' }}>
                                                                        All {totalStamps} stamps collected. Customer has unlocked all reward perks! You can click any stamp above to edit its record.
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
                                                                            background: 'rgba(14, 136, 184, 0.1)',
                                                                            color: 'var(--firstloop-primary, #0E88B8)',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'center',
                                                                            fontSize: '1.2rem'
                                                                        }}
                                                                    >
                                                                        <i className="fas fa-hand-pointer" />
                                                                    </div>
                                                                    <strong style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                                                                        Step-by-Step: Click on Stamp #{firstUnprocessedIndex + 1}
                                                                    </strong>
                                                                    <p style={{ fontSize: '0.78rem', margin: 0, maxWidth: 320, lineHeight: 1.4 }}>
                                                                        Stamps are completed in sequence. Click Stamp #{firstUnprocessedIndex + 1} to enter payment details, or click any completed stamp to edit.
                                                                    </p>
                                                                </div>
                                                            )
                                                        )}
                                                    </div>
                                                ) : (
                                                    /* Membership Card Check-In */
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

                                                        {/* Submit Button */}
                                                        <button
                                                            type="submit"
                                                            className="btn firstloop-btn-primary"
                                                            disabled={savingCheckIn}
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
                                                                    <span>Save Today's Check-In Entry</span>
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

            {/* ADD CARD TO CUSTOMER POPUP MODAL */}
            <AddCardCustomerModal
                isOpen={addCardModalOpen}
                onClose={() => setAddCardModalOpen(false)}
                initialCustomer={matchedCustomer}
                branchId={branchId}
                onSuccess={handleAddCardModalSuccess}
            />
        </div>
    )
}
