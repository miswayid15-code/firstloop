import React, { useRef, useState, useEffect } from 'react'
import html2canvas from 'html2canvas'
import logo from '../assets/img/firstloop-favicon.png'
import flLogo from '../assets/img/firstloop-favicon.png'
import qrImg from '../assets/img/qr-img.png'
import { QRCodeCanvas } from 'qrcode.react'
import { toast } from 'react-hot-toast'

import {
    getRelativeImagePath,
    formatImageUrl,
    getCardStyle,
    formatValidity,
    captureCardCanvas,
    waitForCardAssets,
    cleanPhoneForWhatsApp,
    fetchCustomerStampLevelsApi,
    formatExpiryDate
} from '../services/cardService.js'
import CardIcon from './CardIcon.jsx'

export default function MembershipCardPreviewModal({
    isOpen = true,
    card = null,
    onClose,
    fallbackBrandName = 'Elite Branch'
}) {
    const cardRef = useRef(null)
    const [downloading, setDownloading] = useState(false)
    const [sharing, setSharing] = useState(false)
    const [customerPhone, setCustomerPhone] = useState('')
    const [customerCountryCode, setCustomerCountryCode] = useState('')
    const [fullCardData, setFullCardData] = useState(null)

    useEffect(() => {
        if (card) {
            setCustomerPhone(
                card.customerPhone ||
                card.customer_phone ||
                card.phone ||
                card.mobile ||
                card.Customer?.phone ||
                card.customer?.phone ||
                ''
            )
            setCustomerCountryCode(
                card.customerCountryCode ||
                card.customer_country_code ||
                card.country_code ||
                card.Customer?.country_code ||
                card.customer?.country_code ||
                ''
            )
        }
    }, [card, isOpen])

    // Load full details if card summary was passed without design attributes
    useEffect(() => {
        if (!card?.id || !isOpen) {
            setFullCardData(null)
            return
        }

        if (card.bgColor && card.validityMonths) {
            setFullCardData(card)
            return
        }

        let isMounted = true
        fetchCustomerStampLevelsApi(card.id, 2, card.customer_id || card.cus_id)
            .then((data) => {
                if (isMounted && data) {
                    setFullCardData({
                        ...data,
                        ...card,
                        bgColor: data.bgColor || card.bgColor,
                        bgImage: data.bgImage || card.bgImage,
                        textColor: data.textColor || card.textColor,
                        borderColor: data.borderColor || card.borderColor,
                        validityMonths: data.validityMonths || card.validityMonths,
                        customerPhone: card.customerPhone || card.phone || data.customer_phone,
                        customerCountryCode: card.customerCountryCode || card.country_code || data.customer_country_code,
                        cardholderName: card.cardholderName || card.customer_name || data.cardholderName
                    })
                }
            })
            .catch((err) => {
                console.warn('Error fetching full card in MembershipCardPreviewModal:', err)
            })

        return () => { isMounted = false }
    }, [card?.id, card?.customer_id, isOpen])

    if (!isOpen || !card) return null

    const displayCard = fullCardData || card
    const activeCard = displayCard

    // Clean phone number for WhatsApp API
    const cleanPhone = (phone, countryCode = '') => {
        return cleanPhoneForWhatsApp(phone, countryCode)
    }

    const handleDownload = async () => {
        if (!cardRef.current) return
        try {
            setDownloading(true)
            const canvas = await captureCardCanvas(cardRef.current)
            const image = canvas.toDataURL('image/png')
            const rawName = activeCard.name || activeCard.title || 'membership-pass'
            const fileName = rawName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'membership-pass'
            const link = document.createElement('a')
            link.href = image
            link.download = `${fileName}.png`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
        } catch (error) {
            console.error('Error downloading membership card canvas:', error)
        } finally {
            setDownloading(false)
        }
    }

    // Direct WhatsApp Sending flow identical to CardPreview
    const handleSendToWhatsApp = async () => {
        if (!cardRef.current) {
            toast.error('Card preview element not found')
            return
        }

        const brand = activeCard.brandName || activeCard.brand_name || fallbackBrandName
        const title = activeCard.name || activeCard.title || 'Digital Membership Pass'
        const validity = formatValidity(activeCard.expires_at || activeCard.validityMonths || activeCard.month || activeCard.totalMonth)
        const shareUrl = activeCard.id ? `${window.location.origin}/card-preview/${activeCard.id}?type=2&cus_id=${activeCard.customer_id || activeCard.cus_id || ''}&phone=${encodeURIComponent(customerPhone || '')}&country_code=${encodeURIComponent(customerCountryCode || '')}&customer_name=${encodeURIComponent(activeCard.cardholderName || activeCard.customer_name || '')}` : window.location.href
        const descToSend = `🎉 *${brand}* - ${title}\n⭐ Validity: ${validity}\n\n👉 *View Pass:* ${shareUrl}`

        const rawName = activeCard.name || activeCard.title || 'membership-pass'
        const safeName = rawName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'membership-pass'
        const fileName = `${safeName}.png`

        const targetPhone = cleanPhone(customerPhone, customerCountryCode)

        setSharing(true)
        const toastId = toast.loading('Capturing pass image for WhatsApp...')

        try {
            await waitForCardAssets(cardRef.current)
            const canvas = await captureCardCanvas(cardRef.current)
            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'))

            if (!blob) {
                throw new Error('Failed to generate image blob from card')
            }

            const file = new File([blob], fileName, { type: 'image/png' })
            const blobUrl = URL.createObjectURL(blob)

            // Web Share API if no target phone and file sharing is supported
            if (!targetPhone && typeof navigator !== 'undefined' && typeof navigator.share === 'function' && typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
                toast.dismiss(toastId)
                try {
                    await navigator.share({
                        files: [file],
                        title: `${brand} - ${title}`,
                        text: descToSend
                    })
                    toast.success('Membership pass image shared successfully! 🎉')
                    return
                } catch (shareErr) {
                    if (shareErr.name === 'AbortError') return
                    console.warn('Web Share API error, falling back:', shareErr)
                }
            }

            toast.dismiss(toastId)

            // Copy image to clipboard for easy Ctrl+V in WhatsApp Web
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

            // Automatically download card image file for attaching
            const dlLink = document.createElement('a')
            dlLink.href = blobUrl
            dlLink.download = fileName
            document.body.appendChild(dlLink)
            dlLink.click()
            document.body.removeChild(dlLink)

            // Open WhatsApp directly for the recipient
            const waUrl = targetPhone
                ? `https://api.whatsapp.com/send?phone=${targetPhone}&text=${encodeURIComponent(descToSend)}`
                : `https://api.whatsapp.com/send?text=${encodeURIComponent(descToSend)}`

            window.open(waUrl, '_blank')

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

    const hasCustomer = Boolean(
        activeCard.card_number ||
        activeCard.customer_id ||
        activeCard.cus_id ||
        activeCard.customer_name ||
        activeCard.customer ||
        activeCard.qr_token
    )

    const brandName = activeCard.brandName || activeCard.brand_name || fallbackBrandName
    const brandLogo = activeCard.brandLogo || activeCard.brand_image ? formatImageUrl(activeCard.brandLogo || activeCard.brand_image) : logo
    const cardTitle = activeCard.name || activeCard.title || 'Membership Card'

    const cardholder = activeCard.cardholderName || activeCard.cardholder_name || activeCard.customer_name || (hasCustomer ? 'Member Pass' : '')
    const cardNo = activeCard.card_number || null
    const validityText = formatExpiryDate(activeCard.expires_at) || formatValidity(activeCard.validityMonths || activeCard.month || activeCard.totalMonth)

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(15, 23, 42, 0.75)',
                backdropFilter: 'blur(6px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                padding: 20
            }}
            onClick={(e) => {
                if (e.target === e.currentTarget && onClose) onClose()
            }}
        >
            <div
                style={{
                    background: '#FFFFFF',
                    borderRadius: 24,
                    maxWidth: 450,
                    width: '100%',
                    overflow: 'hidden',
                    boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
                    animation: 'modalSlideIn 0.25s ease-out'
                }}
            >
                {/* Modal Header */}
                <div style={{ padding: '18px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: '#FFFFFF' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#0F172A' }}>
                                Digital Membership Pass Preview
                            </h3>
                            {cardNo && (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#FEF3C7', border: '1px solid #FDE68A', padding: '2px 8px', borderRadius: 6, color: '#92400E', fontSize: '0.72rem', fontFamily: 'monospace', fontWeight: 700 }}>
                                    <i className="fas fa-barcode" style={{ fontSize: '0.68rem', opacity: 0.7 }} />
                                    {cardNo}
                                </span>
                            )}
                            {(activeCard.expires_at || activeCard.expiry) && (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(217, 119, 6, 0.1)', border: '1px solid rgba(217, 119, 6, 0.25)', padding: '2px 8px', borderRadius: 6, color: '#B45309', fontSize: '0.72rem', fontWeight: 700 }}>
                                    <i className="far fa-calendar-alt" />
                                    Expires: {formatExpiryDate(activeCard.expires_at || activeCard.expiry)}
                                </span>
                            )}
                        </div>
                        <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '4px 0 0 0' }}>
                            Live render of the digital membership pass for members
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', width: 32, height: 32, borderRadius: '50%', fontSize: '0.9rem', color: '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease' }}
                    >
                        <i className="fas fa-times" />
                    </button>
                </div>

                {/* Digital Card Canvas View */}
                <div style={{ padding: 24, background: '#F8FAFC', display: 'flex', justifyContent: 'center' }}>
                    <div
                        ref={cardRef}
                        id="membership-pass-preview-canvas"
                        style={{
                            width: '100%',
                            maxWidth: 370,
                            borderRadius: 20,
                            ...getCardStyle(activeCard, '#D97706'),
                            color: activeCard.textColor || activeCard.text_color || '#FFFFFF',
                            padding: 22,
                            boxShadow: '0 16px 36px -8px rgba(0,0,0,0.25)',
                            position: 'relative',
                            minHeight: 210
                        }}
                    >
                        <div style={{ position: 'relative', zIndex: 2 }}>
                            {/* Header Row */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{ width: 34, height: 34, borderRadius: 10, background: '#FFFFFF', padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}>
                                        <img src={brandLogo} alt="Logo" crossOrigin="anonymous" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                    </div>
                                    <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'inherit' }}>
                                        {brandName}
                                    </span>
                                </div>
                            </div>

                            {/* Middle Section: Left Info + Right Large Middle QR Code */}
                            <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 10 }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'inherit', wordBreak: 'break-word' }}>
                                        {cardTitle}
                                    </div>
                                    {cardholder && (
                                        <div style={{ fontSize: '0.95rem', opacity: 0.95, marginTop: 4, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, lineHeight: 1.35 }}>
                                            <CardIcon name="fa-user" style={{ fontSize: '0.75rem' }} />
                                            <span>{cardholder}</span>
                                        </div>
                                    )}

                                    <div style={{ marginTop: 12, borderTop: '1px solid rgba(255,255,255,0.25)', paddingTop: 8 }}>
                                        <small style={{ fontSize: '0.65rem', textTransform: 'uppercase', opacity: 0.85 }}>
                                             Valid Thru
                                         </small>
                                         <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'inherit' }}>
                                             {validityText}
                                         </div>
                                     </div>
                                 </div>

                                 {/* Large Centered Middle QR Code */}
                                 <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                     {hasCustomer && (activeCard.qr_token || activeCard.qrImg) ? (
                                         <QRCodeCanvas
                                             value={activeCard.qr_token || activeCard.qrImg}
                                             size={92}
                                             style={{
                                                 width: 92,
                                                 height: 92,
                                                 objectFit: 'contain',
                                                 display: 'block'
                                             }}
                                         />
                                     ) : (
                                         <img
                                             src={qrImg}
                                             alt="QR Code"
                                             crossOrigin="anonymous"
                                             style={{
                                                 width: 92,
                                                 height: 92,
                                                 objectFit: 'contain',
                                                 display: 'block'
                                             }}
                                         />
                                     )}
                                     <small style={{ fontSize: '0.6rem', fontWeight: 700, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.9 }}>
                                         SCAN PASS
                                     </small>
                                 </div>
                             </div>

                            {/* Bottom Right Logo Badge */}
                            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 5, fontSize: '0.65rem', opacity: 0.9, fontWeight: 600, marginTop: 6, lineHeight: 1 }}>
                                <span style={{ lineHeight: 1, display: 'inline-flex', alignItems: 'center' }}>powered by</span>
                                <img src={flLogo} alt="FirstLoop" crossOrigin="anonymous" style={{ height: 13, width: 'auto', display: 'inline-block', verticalAlign: 'middle', objectFit: 'contain', margin: '0 1px' }} />
                                <strong style={{ color: 'inherit', lineHeight: 1, display: 'inline-flex', alignItems: 'center' }}>firstloop.co.in</strong>
                            </div>
                        </div>
                    </div>
                </div>

                {/* WhatsApp Recipient Phone & Country Code Inputs */}
                <div style={{ padding: '12px 20px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 6, margin: 0 }}>
                            <i className="fab fa-whatsapp" style={{ color: '#25D366', fontSize: '1rem' }} />
                            <span>Recipient WhatsApp Number</span>
                        </label>
                        {cardholder && (
                            <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
                                Customer: <strong style={{ color: '#0F172A' }}>{cardholder}</strong>
                            </span>
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <div style={{ width: 85, flexShrink: 0 }}>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="+91"
                                value={customerCountryCode ? (String(customerCountryCode).startsWith('+') ? customerCountryCode : `+${customerCountryCode}`) : ''}
                                onChange={(e) => setCustomerCountryCode(e.target.value.replace(/[^\d+]/g, ''))}
                                style={{
                                    fontSize: '0.82rem',
                                    borderRadius: 8,
                                    border: '1.5px solid #CBD5E1',
                                    background: '#FFFFFF',
                                    color: '#0F172A',
                                    height: 34,
                                    fontWeight: 700,
                                    textAlign: 'center'
                                }}
                                title="Country Code"
                            />
                        </div>
                        <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
                            <i className="fas fa-phone-alt" style={{ position: 'absolute', left: 12, color: '#94A3B8', fontSize: '0.75rem' }} />
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Phone number (e.g. 8608862409)"
                                value={customerPhone}
                                onChange={(e) => setCustomerPhone(e.target.value)}
                                style={{
                                    paddingLeft: 32,
                                    fontSize: '0.82rem',
                                    borderRadius: 8,
                                    border: '1.5px solid #CBD5E1',
                                    background: '#FFFFFF',
                                    color: '#0F172A',
                                    height: 34
                                }}
                            />
                        </div>
                    </div>

                    {/* WhatsApp Target Number Badge */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginTop: 2 }}>
                        {cleanPhone(customerPhone, customerCountryCode) ? (
                            <span style={{ fontSize: '0.72rem', background: 'rgba(37, 211, 102, 0.12)', color: '#047857', border: '1px solid rgba(37, 211, 102, 0.3)', padding: '2px 8px', borderRadius: 6, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                <i className="fab fa-whatsapp" style={{ fontSize: '0.75rem' }} />
                                WhatsApp Target: +{cleanPhone(customerPhone, customerCountryCode)}
                            </span>
                        ) : (
                            <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontStyle: 'italic' }}>
                                No recipient phone number specified
                            </span>
                        )}

                        {activeCard.id && (
                            <button
                                type="button"
                                onClick={() => {
                                    const url = `/card-preview/${activeCard.id}?type=2&cus_id=${activeCard.customer_id || activeCard.cus_id || ''}&phone=${encodeURIComponent(customerPhone || '')}&country_code=${encodeURIComponent(customerCountryCode || '')}&customer_name=${encodeURIComponent(cardholder || '')}`
                                    window.open(url, '_blank')
                                }}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#0E88B8',
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    padding: 0,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 3
                                }}
                            >
                                <span>Full Preview</span>
                                <i className="fas fa-external-link-alt" style={{ fontSize: '0.65rem' }} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Modal Action Bar */}
                <div style={{ padding: '16px 20px', background: '#FFFFFF', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <button
                        type="button"
                        onClick={handleSendToWhatsApp}
                        disabled={sharing}
                        className="btn"
                        style={{
                            flex: 1,
                            padding: '10px 14px',
                            borderRadius: 10,
                            background: '#25D366',
                            color: '#FFFFFF',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                            border: 'none',
                            cursor: sharing ? 'not-allowed' : 'pointer',
                            opacity: sharing ? 0.75 : 1,
                            boxShadow: '0 4px 12px rgba(37, 211, 102, 0.25)',
                            transition: 'all 0.15s ease'
                        }}
                    >
                        {sharing ? (
                            <>
                                <i className="fas fa-spinner fa-spin" />
                                <span>Capturing &amp; Sharing...</span>
                            </>
                        ) : (
                            <>
                                <i className="fab fa-whatsapp" style={{ fontSize: '1.1rem' }} />
                                <span>
                                    {cleanPhone(customerPhone, customerCountryCode)
                                        ? `Share to WhatsApp (+${cleanPhone(customerPhone, customerCountryCode)})`
                                        : 'Share to WhatsApp'}
                                </span>
                            </>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={handleDownload}
                        disabled={downloading}
                        className="btn firstloop-btn-primary"
                        style={{
                            flex: 1,
                            padding: '10px 14px',
                            borderRadius: 10,
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                            boxShadow: '0 4px 12px rgba(14, 136, 184, 0.25)'
                        }}
                    >
                        <i className={`fas ${downloading ? 'fa-spinner fa-spin' : 'fa-download'}`} style={{ fontSize: '0.95rem' }} />
                        <span>{downloading ? 'Downloading...' : `Download ${activeCard.name || activeCard.title || 'Membership Pass'}`}</span>
                    </button>
                </div>
            </div>
        </div>
    )
}
