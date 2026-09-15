import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import html2canvas from 'html2canvas'
import { toBlob } from 'html-to-image'
import { toast } from 'react-hot-toast'
import CustomerCard from '../../components/CustomerCard.jsx'
import { fetchCustomerStampLevelsApi, waitForCardAssets, captureCardCanvas, cleanPhoneForWhatsApp, formatExpiryDate } from '../../services/cardService.js'
import API from '../../api.js'



export default function CardPreview() {
    const navigate = useNavigate()
    const { id: paramId, type: paramType } = useParams()
    const [searchParams] = useSearchParams()

    const rawType = searchParams.get('type') || paramType || '1'
    const cardType = Number(rawType) === 2 ? 2 : 1

    const rawCusId = searchParams.get('cus_id') || searchParams.get('customer_id') || null
    const cusId = rawCusId ? Number(rawCusId) : null

    const cardId = Number(paramId || searchParams.get('id')) || (paramId ? paramId : null)

    const cardRef = useRef(null)
    const [downloading, setDownloading] = useState(false)
    const [sharing, setSharing] = useState(false)
    const [canNativeShare, setCanNativeShare] = useState(false)
    const [copiedModalOpen, setCopiedModalOpen] = useState(false)
    const [capturedImageUrl, setCapturedImageUrl] = useState('')
    const [cardData, setCardData] = useState(null)
    const [loading, setLoading] = useState(Boolean(cardId))
    const [hasStaffToken, setHasStaffToken] = useState(false)
    const [customText, setCustomText] = useState('')
    const [selectedTemplate, setSelectedTemplate] = useState('default')

    // Recipient Customer states for direct WhatsApp messaging
    const [customerPhone, setCustomerPhone] = useState(
        searchParams.get('phone') || searchParams.get('customer_phone') || searchParams.get('mobile') || searchParams.get('cus_phone') || ''
    )
    const [customerCountryCode, setCustomerCountryCode] = useState(
        searchParams.get('country_code') || searchParams.get('cc') || ''
    )
    const [customerName, setCustomerName] = useState(
        searchParams.get('customer_name') || searchParams.get('cus_name') || ''
    )

    /*
    |--------------------------------------------------------------------------
    | CLEAN PHONE NUMBER FOR WHATSAPP API (DIGITS ONLY)
    |--------------------------------------------------------------------------
    */
    const cleanPhone = (phone, countryCode = '') => {
        return cleanPhoneForWhatsApp(phone, countryCode)
    }



    /*
    |--------------------------------------------------------------------------
    | CHECK ADMIN / MERCHANT / RECEPTIONIST TOKEN
    |--------------------------------------------------------------------------
    */
    useEffect(() => {
        const keys = [
            'access_token',
            'admin_token',
            'mer_access_token',
            'merchant_token',
            'rec_access_token',
            'receptionist_token'
        ]
        const tokenExists = keys.some((k) => {
            const val = localStorage.getItem(k)
            return val && val !== 'null' && val !== 'undefined'
        })
        setHasStaffToken(tokenExists)
    }, [])

    /*
    |--------------------------------------------------------------------------
    | CHECK WEB SHARE API FILE SHARING AVAILABILITY
    |--------------------------------------------------------------------------
    */
    useEffect(() => {
        try {
            if (typeof navigator !== 'undefined' && typeof navigator.share === 'function' && typeof navigator.canShare === 'function') {
                const testFile = new File([''], 'card.png', { type: 'image/png' })
                setCanNativeShare(Boolean(navigator.canShare({ files: [testFile] })))
            } else {
                setCanNativeShare(false)
            }
        } catch (e) {
            setCanNativeShare(false)
        }
    }, [])

    /*
    |--------------------------------------------------------------------------
    | RESOLVE CUSTOMER PHONE IF CUSTOMER ID IS PRESENT
    |--------------------------------------------------------------------------
    */
    const effectiveCusId = cusId || cardData?.customer_id || cardData?.customer?.id || null

    useEffect(() => {
        const qPhone = searchParams.get('phone') || searchParams.get('customer_phone') || searchParams.get('mobile') || searchParams.get('cus_phone')
        const qCc = searchParams.get('country_code') || searchParams.get('cc')
        const qName = searchParams.get('customer_name') || searchParams.get('cus_name')

        if (qPhone) {
            setCustomerPhone(qPhone)
        } else if (cardData?.customer_phone) {
            setCustomerPhone(cardData.customer_phone)
        }

        if (qCc) {
            setCustomerCountryCode(qCc)
        } else if (cardData?.customer_country_code) {
            setCustomerCountryCode(cardData.customer_country_code)
        }

        if (qName) {
            setCustomerName(qName)
        } else if (cardData?.customer_name) {
            setCustomerName(cardData.customer_name)
        }

        if (!qPhone && !cardData?.customer_phone && effectiveCusId && hasStaffToken) {
            let isMounted = true
            API.post(
                '/firstloop/customer/get-customer-details',
                { customer_id: Number(effectiveCusId) || effectiveCusId },
                {
                    skipAuthRedirect: true,
                    headers: { 'X-Skip-Auth-Redirect': 'true' }
                }
            )
                .then((res) => {
                    if (!isMounted) return
                    if (res?.data?.status == 1 && res?.data?.data) {
                        const cus = res.data.data.customer || {}
                        if (cus.phone) setCustomerPhone(cus.phone)
                        if (cus.country_code) setCustomerCountryCode(cus.country_code)
                        if (cus.name) setCustomerName(cus.name)
                    }
                })
                .catch((err) => {
                    console.warn('Could not fetch customer details for WhatsApp:', err)
                })
            return () => {
                isMounted = false
            }
        }
    }, [cardData, effectiveCusId, hasStaffToken, searchParams])

    /*
    |--------------------------------------------------------------------------
    | PARSE PARAMS AS FALLBACK CARD (For real-time preview without API save)
    |--------------------------------------------------------------------------
    */
    const getFallbackCardFromParams = () => {
        const title = searchParams.get('title') || searchParams.get('name')
        const brandName = searchParams.get('brand') || searchParams.get('brand_name') || searchParams.get('brandName')
        const bgColor = searchParams.get('bgColor') || searchParams.get('bg_color')
        const borderColor = searchParams.get('borderColor') || searchParams.get('border_color')
        const bgImage = searchParams.get('bgImage') || searchParams.get('bg_image') || searchParams.get('background_image')
        const logo = searchParams.get('logo') || searchParams.get('brand_logo') || searchParams.get('brand_image')
        const totalStamps = Number(searchParams.get('stamps') || searchParams.get('total_stamps') || searchParams.get('number_of_stamps')) || 8
        const discountVal = searchParams.get('discount') || searchParams.get('discountVal') || searchParams.get('percentage') || '10'
        const validity = searchParams.get('validity') || '12 Months'
        const description = searchParams.get('description') || ''

        if (title || brandName || bgColor || borderColor || cardId) {
            return {
                id: cardId || 1,
                title: title || (cardType === 2 ? 'VIP Membership Pass' : 'Loyalty Stamp Card'),
                brandName: brandName || 'FirstLoop',
                brand_name: brandName || 'FirstLoop',
                brandLogo: logo || '',
                bgColor: bgColor || '#0E88B8',
                bg_color: bgColor || '#0E88B8',
                borderColor: borderColor || '#FFFFFF',
                border_color: borderColor || '#FFFFFF',
                bgImage: bgImage || '',
                background_image: bgImage || '',
                totalStamps: totalStamps,
                number_of_stamps: totalStamps,
                collected: 0,
                current_stamp: 0,
                discountVal: discountVal,
                discount: discountVal,
                validity: validity,
                expires_at: searchParams.get('expires_at') || searchParams.get('expiry') || null,
                expiry: searchParams.get('expires_at') || searchParams.get('expiry') || null,
                description: description,
                card_type: cardType,
                type: cardType,
                stamp_levels: Array.from({ length: totalStamps }, (_, i) => ({
                    id: i + 1,
                    stamp_number: i + 1,
                    stamp: i + 1,
                    type: i + 1 === totalStamps ? 'Discount' : 'Free Item',
                    reward: i + 1 === totalStamps ? `${discountVal}% OFF Reward` : 'Free Reward',
                    reward_text: i + 1 === totalStamps ? `${discountVal}% OFF Reward` : 'Free Reward',
                    status: 0
                }))
            }
        }
        return null
    }

    /*
    |--------------------------------------------------------------------------
    | FETCH CARD (TYPE 1: STAMP, TYPE 2: MEMBERSHIP)
    |--------------------------------------------------------------------------
    */

    const fetchCardDetails = async () => {
        if (!cardId) {
            const fallback = getFallbackCardFromParams()
            setCardData(fallback)
            setLoading(false)
            return
        }

        setLoading(true)

        try {
            const data = await fetchCustomerStampLevelsApi(cardId, cardType, cusId)
            if (data) {
                setCardData(data)
            } else {
                // Try fallback from URL parameters if available
                const fallback = getFallbackCardFromParams()
                setCardData(fallback)
            }
        } catch (err) {
            console.error('Error fetching card details:', err)
            const fallback = getFallbackCardFromParams()
            setCardData(fallback)
        } finally {
            setLoading(false)
        }
    }

    /*
    |--------------------------------------------------------------------------
    | LOAD CARD WHEN ID, TYPE, OR CUS_ID CHANGES
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        fetchCardDetails()
    }, [cardId, cardType, cusId])

    /*
    |--------------------------------------------------------------------------
    | BROWSER TAB TITLE
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        if (!cardData) return

        const brand = cardData.brandName || cardData.brand_name || 'Merchant'
        const title = cardData.title || (cardType === 2 ? 'Membership Pass' : 'Digital Stamp Card')

        document.title = `${brand} - ${title}`
    }, [cardData, cardType])

    /*
    |--------------------------------------------------------------------------
    | DOWNLOAD CARD AS PNG
    |--------------------------------------------------------------------------
    */

    const handleDownload = async () => {
        if (!cardRef.current || !cardData) return
        try {
            setDownloading(true)
            const canvas = await captureCardCanvas(cardRef.current)
            const image = canvas.toDataURL('image/png')
            const rawName = cardData.title || cardData.name || (cardType === 2 ? 'membership-pass' : 'stamp-card')
            const fileName = rawName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'card-pass'
            const link = document.createElement('a')
            link.href = image
            link.download = `${fileName}.png`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
        } catch (error) {
            console.error('Error downloading card canvas:', error)
        } finally {
            setDownloading(false)
        }
    }

    /*
    |--------------------------------------------------------------------------
    | HANDLE BACK
    |--------------------------------------------------------------------------
    */
    const handleBack = () => {
        if (window.history.length > 1) {
            navigate(-1)
        } else {
            navigate('/')
        }
    }

    /*
    |--------------------------------------------------------------------------
    | LOADING STATE
    |--------------------------------------------------------------------------
    */

    if (loading) {
        return (
            <div
                style={{
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 16,
                    background: '#F8FAFC'
                }}
            >
                <div
                    className="spinner-border text-primary"
                    role="status"
                    style={{
                        width: '2.5rem',
                        height: '2.5rem',
                        color: 'var(--firstloop-primary, #0E88B8)'
                    }}
                >
                    <span className="visually-hidden">Loading...</span>
                </div>
                <div style={{ color: 'var(--text-muted, #64748B)', fontSize: '0.9rem', fontWeight: 600 }}>
                    Loading Card Preview...
                </div>
            </div>
        )
    }

    /*
    |--------------------------------------------------------------------------
    | CARD NOT FOUND
    |--------------------------------------------------------------------------
    */

    if (!cardData) {
        return (
            <div
                style={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#F8FAFC',
                    padding: 20
                }}
            >
                <div
                    style={{
                        background: '#FFFFFF',
                        padding: 32,
                        borderRadius: 20,
                        textAlign: 'center',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
                        maxWidth: 420,
                        width: '100%',
                        border: '1px solid #E2E8F0'
                    }}
                >
                    <div
                        style={{
                            width: 60,
                            height: 60,
                            borderRadius: '50%',
                            background: 'rgba(239, 68, 68, 0.1)',
                            color: '#EF4444',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 16px',
                            fontSize: '1.5rem'
                        }}
                    >
                        <i className="fas fa-id-card-alt" />
                    </div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1E293B', marginBottom: 8 }}>
                        {cardType === 2 ? 'Membership Pass Not Found' : 'Stamp Card Not Found'}
                    </h3>
                    <p style={{ marginBottom: 20, color: '#64748B', fontSize: '0.88rem', lineHeight: 1.5 }}>
                        The requested card could not be loaded. Please check the URL or card ID.
                    </p>
                    {hasStaffToken && (
                        <button
                            type="button"
                            onClick={handleBack}
                            style={{
                                padding: '10px 24px',
                                borderRadius: 12,
                                background: '#0E88B8',
                                color: '#FFFFFF',
                                fontWeight: 700,
                                fontSize: '0.88rem',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 8,
                                boxShadow: '0 4px 12px rgba(14, 136, 184, 0.25)'
                            }}
                        >
                            <i className="fas fa-arrow-left" />
                            <span>Go Back</span>
                        </button>
                    )}
                </div>
            </div>
        )
    }

    const card = cardData

    const brand = card?.brandName || card?.brand_name || 'FirstLoop'
    const title = card?.title || card?.name || (cardType === 2 ? 'Membership Pass' : 'Stamp Card')
    const defaultDesc = card?.description || card?.descption || card?.reward_text || card?.reward || (cardType === 2 ? 'Enjoy exclusive perks and privileges with our digital membership pass!' : 'Collect stamps and unlock exciting rewards on every visit!')
    const recipient = customerName ? customerName : 'Valued Customer'
    const expiryFormatted = formatExpiryDate(card?.expires_at || card?.expiry)
    const expirySuffix = expiryFormatted ? ` (Valid till ${expiryFormatted})` : ''

    const messageTemplates = [
        {
            id: 'default',
            label: '📋 Default Card Description',
            getText: () => `${defaultDesc}${expiryFormatted ? `\n⏳ *Expires On:* ${expiryFormatted}` : ''}`
        },
        {
            id: 'welcome',
            label: '🎉 Welcome & Card Invitation',
            getText: () => `🎉 Hello ${recipient}! Here is your digital ${cardType === 2 ? 'membership pass' : 'stamp pass'} for *${brand}* - ${title}${expirySuffix}. Collect stamps & unlock exciting rewards!`
        },
        {
            id: 'reward',
            label: '🎁 Special Reward & Perks Alert',
            getText: () => `🎁 Special Perk from *${brand}*! Check your digital card and enjoy exclusive rewards on your visits.${expiryFormatted ? ` Valid till ${expiryFormatted}.` : ''}`
        },
        {
            id: 'reminder',
            label: '⭐ Visit & Stamp Reminder',
            getText: () => `⭐ Don't forget to present your digital pass at *${brand}* during your next visit to collect your stamps and claim your rewards!${expiryFormatted ? ` Card valid till ${expiryFormatted}.` : ''}`
        },
        {
            id: 'custom',
            label: '✍️ Custom Message (Type below)',
            getText: () => ''
        }
    ]

    const handleTemplateChange = (templateId) => {
        setSelectedTemplate(templateId)
        const tmpl = messageTemplates.find(t => t.id === templateId)
        if (tmpl && templateId !== 'custom') {
            setCustomText(tmpl.getText())
        }
    }

    const targetPhone = cleanPhone(customerPhone, customerCountryCode)

    /*
    |--------------------------------------------------------------------------
    | CAPTURE CARD DOM AS IMAGE & SHARE DIRECTLY VIA WEB SHARE API / WHATSAPP
    |--------------------------------------------------------------------------
    */
    const handleSendToWhatsApp = async () => {
        const cardEl = document.getElementById('loyalty-card') || cardRef.current
        if (!cardEl) {
            toast.error('Loyalty card element not found')
            return
        }

        let descToSend = customText.trim()
        if (!descToSend) {
            const tmpl = messageTemplates.find(t => t.id === selectedTemplate)
            descToSend = tmpl && tmpl.id !== 'custom' ? tmpl.getText() : defaultDesc
        }

        const rawName = card?.title || card?.name || (cardType === 2 ? 'membership-pass' : 'stamp-card')
        const safeName = rawName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'loyalty-card'
        const fileName = `${safeName}.png`

        setSharing(true)
        const toastId = toast.loading('Capturing loyalty card image...')

        try {
            // Wait for fonts and images to be fully loaded
            await waitForCardAssets(cardEl)

            // 1. Capture DOM element to Blob using html-to-image, with html2canvas fallback
            let blob = null
            try {
                blob = await toBlob(cardEl, {
                    quality: 0.95,
                    pixelRatio: 2,
                    cacheBust: true,
                    backgroundColor: null
                })
            } catch (err) {
                console.warn('html-to-image error, trying html2canvas fallback:', err)
            }

            if (!blob) {
                const canvas = await captureCardCanvas(cardEl)
                blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
            }

            if (!blob) {
                throw new Error('Failed to generate image blob from loyalty card')
            }

            // 2. Create File object & Blob URL
            const file = new File([blob], fileName, { type: 'image/png' })
            const blobUrl = URL.createObjectURL(blob)
            setCapturedImageUrl(blobUrl)

            // 3. If NO target phone was specified, check if generic Web Share is available
            if (!targetPhone) {
                const isWebShareAvailable = typeof navigator !== 'undefined' &&
                    typeof navigator.share === 'function' &&
                    typeof navigator.canShare === 'function' &&
                    navigator.canShare({ files: [file] })

                if (isWebShareAvailable) {
                    toast.dismiss(toastId)
                    try {
                        await navigator.share({
                            files: [file],
                            title: `${brand} - ${title}`,
                            text: descToSend
                        })
                        toast.success('Loyalty card image shared successfully! 🎉')
                        return
                    } catch (shareErr) {
                        if (shareErr.name === 'AbortError') return
                        console.warn('Web Share API error, falling back:', shareErr)
                    }
                }
            }

            // 4. OPTION 1: Specific customer delivery flow
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

            // Automatically download card image file for easy drag-and-drop or attaching
            const dlLink = document.createElement('a')
            dlLink.href = blobUrl
            dlLink.download = fileName
            document.body.appendChild(dlLink)
            dlLink.click()
            document.body.removeChild(dlLink)

            // Open WhatsApp directly for the specified customer phone
            const waUrl = targetPhone
                ? `https://api.whatsapp.com/send?phone=${targetPhone}&text=${encodeURIComponent(descToSend)}`
                : `https://api.whatsapp.com/send?text=${encodeURIComponent(descToSend)}`

            window.open(waUrl, '_blank')

            // Open the instructional modal so the user sees exactly what to do
            setCopiedModalOpen(true)

            if (copiedToClipboard) {
                toast.success('Card image copied to clipboard! In WhatsApp, press Ctrl+V to paste and send.', { duration: 6000 })
            } else {
                toast.success('Card image downloaded! Attach it directly in WhatsApp.', { duration: 6000 })
            }
        } catch (error) {
            console.error('Error capturing or sharing card image:', error)
            toast.dismiss(toastId)
            toast.error('Failed to capture card image: ' + (error.message || 'Unknown error'))
        } finally {
            setSharing(false)
        }
    }

    /*
    |--------------------------------------------------------------------------
    | RENDER CARD (UNIFIED DIMENSIONS & FIXED POSITIONS)
    |--------------------------------------------------------------------------
    */

    return (
        <div
            style={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '28px 16px',
                background: '#F8FAFC',
                gap: 16
            }}
        >
            {/* TOP BAR: BACK NAVIGATION BUTTON (ONLY IF STAFF TOKEN EXISTS) */}
            {hasStaffToken && (
                <div style={{ width: '100%', maxWidth: 380, display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
                    <button
                        type="button"
                        onClick={handleBack}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '8px 16px',
                            borderRadius: 10,
                            background: '#FFFFFF',
                            border: '1px solid #E2E8F0',
                            color: '#1E293B',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                            transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#F1F5F9'
                            e.currentTarget.style.borderColor = '#CBD5E1'
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#FFFFFF'
                            e.currentTarget.style.borderColor = '#E2E8F0'
                        }}
                    >
                        <i className="fas fa-arrow-left" style={{ color: '#0E88B8' }} />
                        <span>Back</span>
                    </button>
                </div>
            )}

            {/* REUSABLE CUSTOMER CARD COMPONENT */}
            <CustomerCard
                ref={cardRef}
                canvasId="loyalty-card"
                card={card}
                cardType={cardType}
            />

            {(card?.expires_at || card?.expiry) && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(217, 119, 6, 0.1)', border: '1px solid rgba(217, 119, 6, 0.25)', padding: '5px 14px', borderRadius: 8, color: '#B45309', fontSize: '0.8rem', fontWeight: 700 }}>
                    <i className="far fa-calendar-alt" />
                    <span>Expires: {formatExpiryDate(card.expires_at || card.expiry)}</span>
                </div>
            )}

            {/* ACTION SECTION: WHATSAPP (FOR STAFF/ADMIN/MERCHANT/RECEPTIONIST) & DOWNLOAD */}
            <div style={{ width: '100%', maxWidth: 580, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {hasStaffToken && (
                    <div
                        style={{
                            background: '#FFFFFF',
                            border: '1px solid #E2E8F0',
                            borderRadius: 16,
                            padding: '16px',
                            boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 12
                        }}
                    >
                        {/* CUSTOMER PHONE / RECIPIENT HEADER */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <label
                                    style={{
                                        fontSize: '0.82rem',
                                        fontWeight: 700,
                                        color: '#1E293B',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 6,
                                        margin: 0
                                    }}
                                >
                                    <i className="fab fa-whatsapp" style={{ color: '#25D366', fontSize: '1.05rem' }} />
                                    <span>Recipient WhatsApp Number</span>
                                </label>
                                {effectiveCusId && (
                                    <span style={{ fontSize: '0.72rem', background: '#F1F5F9', color: '#0E88B8', padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>
                                        Customer #{effectiveCusId}
                                    </span>
                                )}
                            </div>
                            {/* Dual Inputs for Country Code and Phone Number */}
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                <div style={{ width: 90, flexShrink: 0 }}>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="+91"
                                        value={customerCountryCode ? (String(customerCountryCode).startsWith('+') ? customerCountryCode : `+${customerCountryCode}`) : ''}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/[^\d+]/g, '')
                                            setCustomerCountryCode(val)
                                        }}
                                        style={{
                                            fontSize: '0.84rem',
                                            borderRadius: 10,
                                            border: '1.5px solid #CBD5E1',
                                            background: '#FFFFFF',
                                            color: '#0F172A',
                                            height: 38,
                                            fontWeight: 700,
                                            textAlign: 'center'
                                        }}
                                        title="Country Calling Code"
                                    />
                                </div>
                                <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
                                    <i className="fas fa-phone-alt" style={{ position: 'absolute', left: 12, color: '#94A3B8', fontSize: '0.8rem' }} />
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Phone Number (e.g. 8608862409)"
                                        value={customerPhone}
                                        onChange={(e) => setCustomerPhone(e.target.value)}
                                        style={{
                                            paddingLeft: 34,
                                            fontSize: '0.84rem',
                                            borderRadius: 10,
                                            border: '1.5px solid #CBD5E1',
                                            background: '#FFFFFF',
                                            color: '#0F172A',
                                            height: 38
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Preview of resolved international number & customer name */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6, marginTop: 2 }}>
                                {customerName ? (
                                    <div style={{ fontSize: '0.74rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <i className="fas fa-user-check" style={{ color: '#0E88B8', fontSize: '0.75rem' }} />
                                        <span>Customer: <strong style={{ color: '#1E293B' }}>{customerName}</strong></span>
                                    </div>
                                ) : <div />}

                                {targetPhone ? (
                                    <span style={{ fontSize: '0.72rem', background: 'rgba(37, 211, 102, 0.12)', color: '#047857', border: '1px solid rgba(37, 211, 102, 0.3)', padding: '2px 8px', borderRadius: 6, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                        <i className="fab fa-whatsapp" style={{ fontSize: '0.75rem' }} />
                                        WhatsApp: +{targetPhone}
                                    </span>
                                ) : (
                                    <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontStyle: 'italic' }}>
                                        No phone number set
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* DESCRIPTION / MESSAGE BOX WITH DROPDOWN TEMPLATES */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <label
                                    style={{
                                        fontSize: '0.8rem',
                                        fontWeight: 700,
                                        color: '#334155',
                                        margin: 0,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 6
                                    }}
                                >
                                    <i className="fas fa-comment-alt" style={{ color: '#0E88B8', fontSize: '0.85rem' }} />
                                    <span>WhatsApp Description / Message</span>
                                </label>
                                {(customText || selectedTemplate !== 'default') && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setCustomText('')
                                            setSelectedTemplate('default')
                                        }}
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            color: '#EF4444',
                                            fontSize: '0.72rem',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            padding: 0
                                        }}
                                    >
                                        Reset to Default
                                    </button>
                                )}
                            </div>

                            {/* Dropdown list for pre-set messages */}
                            <div>
                                <label style={{ fontSize: '0.74rem', fontWeight: 600, color: '#64748B', marginBottom: 3, display: 'block' }}>
                                    Select Pre-set Template or Write Custom:
                                </label>
                                <select
                                    className="form-control"
                                    value={selectedTemplate}
                                    onChange={(e) => handleTemplateChange(e.target.value)}
                                    style={{
                                        height: 38,
                                        borderRadius: 10,
                                        border: '1.5px solid #CBD5E1',
                                        fontSize: '0.82rem',
                                        fontWeight: 600,
                                        color: '#1E293B',
                                        background: '#FFFFFF',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {messageTemplates.map(tmpl => (
                                        <option key={tmpl.id} value={tmpl.id}>
                                            {tmpl.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Text box for custom message */}
                            <div>
                                <label style={{ fontSize: '0.74rem', fontWeight: 600, color: '#64748B', marginBottom: 3, display: 'block' }}>
                                    Message Text Box:
                                </label>
                                <textarea
                                    className="form-control"
                                    rows={3}
                                    placeholder={`Type custom text here or select from dropdown above...\nDefault: "${defaultDesc}"`}
                                    value={customText}
                                    onChange={(e) => {
                                        setCustomText(e.target.value)
                                        setSelectedTemplate('custom')
                                    }}
                                    style={{
                                        width: '100%',
                                        minHeight: 70,
                                        fontSize: '0.84rem',
                                        borderRadius: 10,
                                        border: '1.5px solid #CBD5E1',
                                        background: '#FFFFFF',
                                        color: '#0F172A',
                                        colorScheme: 'light',
                                        padding: '8px 12px',
                                        resize: 'vertical'
                                    }}
                                />
                                <small style={{ fontSize: '0.71rem', color: '#94A3B8', marginTop: 2, display: 'block' }}>
                                    💡 Captures the rendered loyalty-card design as an image and shares it directly to WhatsApp.
                                </small>
                            </div>
                        </div>

                        {/* SEND BUTTON */}
                        <button
                            type="button"
                            onClick={handleSendToWhatsApp}
                            disabled={sharing}
                            className="btn"
                            style={{
                                width: '100%',
                                padding: '11px 18px',
                                borderRadius: 12,
                                background: '#25D366',
                                color: '#FFFFFF',
                                fontWeight: 700,
                                fontSize: '0.88rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 8,
                                border: 'none',
                                cursor: sharing ? 'not-allowed' : 'pointer',
                                opacity: sharing ? 0.75 : 1,
                                boxShadow: '0 4px 14px rgba(37, 211, 102, 0.28)',
                                transition: 'all 0.15s ease'
                            }}
                        >
                            {sharing ? (
                                <>
                                    <i className="fas fa-spinner fa-spin" />
                                    <span>Capturing Card Image &amp; Sharing...</span>
                                </>
                            ) : (
                                <>
                                    <i className="fab fa-whatsapp" style={{ fontSize: '1.15rem' }} />
                                    <span>
                                        {targetPhone
                                            ? `Share Card Image to WhatsApp (+${targetPhone})`
                                            : 'Share Card Image to WhatsApp'}
                                    </span>
                                </>
                            )}
                        </button>

                        <small style={{ fontSize: '0.71rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: 5 }}>
                            <i className="fas fa-camera" style={{ color: '#0E88B8', fontSize: '0.75rem' }} />
                            <span>
                                {canNativeShare
                                    ? 'Web Share API active: Captures loyalty card image & opens WhatsApp / Share Sheet directly.'
                                    : 'Captures card image, copies to clipboard & downloads PNG ready to send in WhatsApp.'}
                            </span>
                        </small>
                    </div>
                )}

                {/* DOWNLOAD BUTTON */}
                <button
                    type="button"
                    onClick={handleDownload}
                    disabled={downloading}
                    style={{
                        width: '100%',
                        padding: '12px 20px',
                        borderRadius: 14,
                        background: '#0E88B8',
                        color: '#FFFFFF',
                        fontWeight: 700,
                        fontSize: '0.92rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 10,
                        border: 'none',
                        cursor: downloading ? 'not-allowed' : 'pointer',
                        boxShadow: '0 6px 18px rgba(14, 136, 184, 0.28)',
                        opacity: downloading ? 0.75 : 1,
                        transition: 'all 0.2s ease'
                    }}
                >
                    <i className={`fas ${downloading ? 'fa-spinner fa-spin' : 'fa-download'}`} style={{ fontSize: '1rem' }} />
                    <span>{downloading ? 'Downloading...' : `Download ${card.title || (cardType === 2 ? 'Membership Pass' : 'Stamp Card')}`}</span>
                </button>
            </div>

            {/* OPTION 1 INSTRUCTION MODAL: CARD IMAGE COPIED & WHATSAPP CHAT OPENED */}
            {copiedModalOpen && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(15, 23, 42, 0.75)',
                        backdropFilter: 'blur(4px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 99999,
                        padding: 16
                    }}
                    onClick={() => setCopiedModalOpen(false)}
                >
                    <div
                        style={{
                            background: '#FFFFFF',
                            borderRadius: 20,
                            padding: 24,
                            maxWidth: 440,
                            width: '100%',
                            boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
                            position: 'relative',
                            textAlign: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 16
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header icon */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div
                                style={{
                                    width: 60,
                                    height: 60,
                                    borderRadius: '50%',
                                    background: '#DCFCE7',
                                    color: '#16A34A',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '1.8rem',
                                    boxShadow: '0 4px 14px rgba(22, 163, 74, 0.2)'
                                }}
                            >
                                <i className="fab fa-whatsapp" />
                            </div>
                        </div>

                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>
                                Card Image Copied &amp; WhatsApp Opened!
                            </h3>
                            {targetPhone ? (
                                <div style={{ marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 6, background: '#F1F5F9', padding: '4px 12px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>
                                    <i className="fas fa-user-check" style={{ color: '#0E88B8' }} />
                                    <span>Sending to: <strong>{customerName || 'Customer'} (+{targetPhone})</strong></span>
                                </div>
                            ) : (
                                <p style={{ fontSize: '0.84rem', color: '#64748B', marginTop: 4, margin: 0 }}>
                                    WhatsApp has been opened with your message.
                                </p>
                            )}
                        </div>

                        {/* Image Preview Thumbnail */}
                        {capturedImageUrl && (
                            <div style={{ borderRadius: 12, overflow: 'hidden', border: '1.5px solid #E2E8F0', background: '#F8FAFC', padding: 6 }}>
                                <img
                                    src={capturedImageUrl}
                                    alt="Captured Loyalty Card"
                                    style={{ width: '100%', maxHeight: 150, objectFit: 'contain', borderRadius: 8 }}
                                />
                            </div>
                        )}

                        {/* Instruction Steps */}
                        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: '12px 14px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: '0.82rem', color: '#334155' }}>
                                <span style={{ width: 22, height: 22, borderRadius: '50%', background: '#0E88B8', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.72rem', flexShrink: 0 }}>
                                    1
                                </span>
                                <div>
                                    <strong>WhatsApp Chat Ready:</strong> Your pre-filled text is already in the WhatsApp chat box.
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: '0.82rem', color: '#334155' }}>
                                <span style={{ width: 22, height: 22, borderRadius: '50%', background: '#16A34A', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.72rem', flexShrink: 0 }}>
                                    2
                                </span>
                                <div>
                                    <strong>Paste the Card Image:</strong> Press <kbd style={{ background: '#E2E8F0', padding: '2px 5px', borderRadius: 4, fontWeight: 700 }}>Ctrl + V</kbd> (or right-click Paste / long-press Paste) in the chat to attach the card, then hit <strong>Send</strong>!
                                </div>
                            </div>
                        </div>

                        {/* Modal Action Buttons */}
                        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                            {targetPhone && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        const desc = customText.trim() || defaultDesc
                                        const waUrl = `https://api.whatsapp.com/send?phone=${targetPhone}&text=${encodeURIComponent(desc)}`
                                        window.open(waUrl, '_blank')
                                    }}
                                    className="btn btn-outline-secondary"
                                    style={{ flex: 1, padding: '9px 14px', borderRadius: 10, fontWeight: 700, fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                                >
                                    <i className="fas fa-external-link-alt" /> Re-open WhatsApp
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={() => setCopiedModalOpen(false)}
                                className="btn firstloop-btn-primary"
                                style={{ flex: 1, padding: '9px 14px', borderRadius: 10, fontWeight: 700, fontSize: '0.82rem' }}
                            >
                                Got it, Done!
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}