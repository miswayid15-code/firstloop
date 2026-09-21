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
    captureCardCanvas,
    waitForCardAssets,
    cleanPhoneForWhatsApp,
    fetchCustomerStampLevelsApi,
    formatExpiryDate,
    parsePerkTwoLines
} from '../services/cardService.js'
import CardIcon from './CardIcon.jsx'

function StampCardPreviewModal({
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

    // Load full details if card summary was passed without levels
    useEffect(() => {
        if (!card?.id || !isOpen) {
            setFullCardData(null)
            return
        }

        const hasLevels = (card.levelRewards && card.levelRewards.length > 0) ||
            (card.StampLevels && card.StampLevels.length > 0) ||
            (card.stamp_levels && card.stamp_levels.length > 0)

        if (hasLevels && card.bgColor) {
            setFullCardData(card)
            return
        }

        let isMounted = true
        fetchCustomerStampLevelsApi(card.id, 1, card.customer_id || card.cus_id)
            .then((data) => {
                if (isMounted && data) {
                    setFullCardData({
                        ...data,
                        ...card,
                        bgColor: data.bgColor || card.bgColor,
                        bgImage: data.bgImage || card.bgImage,
                        textColor: data.textColor || card.textColor,
                        borderColor: data.borderColor || card.borderColor,
                        stampBgColor: data.stampBgColor || card.stampBgColor,
                        stampBorderColor: data.stampBorderColor || card.stampBorderColor,
                        stampTextColor: data.stampTextColor || card.stampTextColor,
                        levelRewards: data.levelRewards?.length ? data.levelRewards : (card.levelRewards || []),
                        CustomerStampLevels: data.CustomerStampLevels?.length ? data.CustomerStampLevels : (card.CustomerStampLevels || []),
                        customerPhone: card.customerPhone || card.phone || data.customer_phone,
                        customerCountryCode: card.customerCountryCode || card.country_code || data.customer_country_code,
                        cardholderName: card.cardholderName || card.customer_name || data.cardholderName,
                        expires_at: data.expires_at || card.expires_at || null,
                        expiry: data.expires_at || card.expires_at || card.expiry || null
                    })
                }
            })
            .catch((err) => {
                console.warn('Error fetching full card in StampCardPreviewModal:', err)
            })

        return () => { isMounted = false }
    }, [card?.id, card?.customer_id, isOpen])

    if (!isOpen || !card) return null

    const displayCard = fullCardData || card

    // Clean phone number for WhatsApp API
    const cleanPhone = (phone, countryCode = '') => {
        return cleanPhoneForWhatsApp(phone, countryCode)
    }


    // High quality canvas download
    const handleDownload = async () => {
        if (!cardRef.current) return
        try {
            setDownloading(true)
            const canvas = await captureCardCanvas(cardRef.current)
            const image = canvas.toDataURL('image/png')
            const rawName = card.title || card.name || 'stamp-card'
            const fileName = rawName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'stamp-card'
            const link = document.createElement('a')
            link.href = image
            link.download = `${fileName}.png`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
        } catch (error) {
            console.error('Error downloading stamp card canvas:', error)
        } finally {
            setDownloading(false)
        }
    }

    // Share Card Image directly to WhatsApp (Identical to CardPreview flow)
    const handleSendToWhatsApp = async () => {
        if (!cardRef.current) {
            toast.error('Card preview element not found')
            return
        }

        const activeCard = displayCard
        const brand = activeCard.brandName || activeCard.brand_name || fallbackBrandName
        const title = activeCard.title || activeCard.name || 'Digital Stamp Card'
        const total = Number(activeCard.total_stamps || activeCard.number_of_stamps || activeCard.total || 8)
        const shareUrl = activeCard.id ? `${window.location.origin}/card-preview/${activeCard.id}?type=1&cus_id=${activeCard.customer_id || activeCard.cus_id || ''}&phone=${encodeURIComponent(customerPhone || '')}&country_code=${encodeURIComponent(customerCountryCode || '')}&customer_name=${encodeURIComponent(activeCard.cardholderName || activeCard.customer_name || '')}` : window.location.href
        const expiryFormatted = formatExpiryDate(activeCard.expires_at || activeCard.expiry)
        const expiryLine = expiryFormatted ? `\n⏳ *Expires On:* ${expiryFormatted}` : ''
        const descToSend = `🎉 *${brand}* - ${title}\n⭐ Collect ${total} stamps to claim special rewards!${expiryLine}\n\n👉 *View Card:* ${shareUrl}`

        const rawName = activeCard.title || activeCard.name || 'stamp-card'
        const safeName = rawName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'stamp-card'
        const fileName = `${safeName}.png`

        const targetPhone = cleanPhone(customerPhone, customerCountryCode)

        setSharing(true)
        const toastId = toast.loading('Capturing card image for WhatsApp...')

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
                    toast.success('Card image shared successfully! 🎉')
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

            // Open WhatsApp
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

    const activeCard = displayCard
    const hasCustomer = Boolean(
        activeCard.card_number ||
        activeCard.customer_id ||
        activeCard.cus_id ||
        activeCard.customer_name ||
        activeCard.customer ||
        activeCard.qr_token
    )

    const totalStamps = Number(activeCard.total_stamps || activeCard.number_of_stamps || 8)
    const brandName = activeCard.brandName || activeCard.brand_name || fallbackBrandName
    const cardholder = activeCard.cardholderName || activeCard.customer_name || (hasCustomer ? 'Customer' : '')
    const cardNo = activeCard.card_number || null
    const brandLogo = activeCard.brandLogo || activeCard.brand_image ? formatImageUrl(activeCard.brandLogo || activeCard.brand_image) : logo

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
                    maxWidth: 460,
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
                                Digital Stamp Card Preview
                            </h3>
                            {cardNo && (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#F1F5F9', border: '1px solid #E2E8F0', padding: '2px 8px', borderRadius: 6, color: '#475569', fontSize: '0.72rem', fontFamily: 'monospace', fontWeight: 700 }}>
                                    <i className="fas fa-barcode" style={{ fontSize: '0.68rem', opacity: 0.7 }} />
                                    {cardNo}
                                </span>
                            )}
                            {(activeCard.expires_at || activeCard.expiry) && (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(217, 119, 6, 0.1)', border: '1px solid rgba(217, 119, 6, 0.25)', padding: '2px 8px', borderRadius: 6, color: '#B45309', fontSize: '0.72rem', fontWeight: 700 }}>
                                    <i className="far fa-calendar-alt" style={{ fontSize: '0.68rem' }} />
                                    Expires: {formatExpiryDate(activeCard.expires_at || activeCard.expiry)}
                                </span>
                            )}
                        </div>
                        <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '4px 0 0 0' }}>
                            Live render of the digital stamp pass for customers
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
                        id="stamp-card-preview-canvas"
                        style={{
                            width: '100%',
                            maxWidth: 450,
                            borderRadius: 20,
                            ...getCardStyle(activeCard, '#0E88B8'),
                            color: activeCard.textColor || activeCard.text_color || '#FFFFFF',
                            padding: '16px 20px',
                            boxShadow: '0 16px 36px -8px rgba(0,0,0,0.25)',
                            position: 'relative',
                            minHeight: 215
                        }}
                    >
                        <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
                            {/* 1. TOP HEADER ROW: Left = Brand Logo & Title | Right = QR Code */}
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                                {/* Brand Logo & Name */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                                        <div style={{ width: 28, height: 28, borderRadius: 8, background: '#FFFFFF', padding: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.1)', flexShrink: 0 }}>
                                            <img src={brandLogo} alt="Logo" crossOrigin="anonymous" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                        </div>
                                        <span style={{ fontSize: '1rem', fontWeight: 800, color: 'inherit', lineHeight: 1.25, display: 'inline-block' }}>
                                            {brandName}
                                        </span>
                                    </div>

                                    {/* Card Title */}
                                    <div style={{ fontSize: '0.84rem', opacity: 0.95, marginBottom: 3, lineHeight: 1.3 }}>
                                        <strong>{activeCard.title || 'Stamp Pass'}</strong>
                                    </div>

                                    {/* Cardholder Name with User Icon */}
                                    {cardholder && (
                                        <div style={{ fontSize: '0.88rem', opacity: 0.95, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5, lineHeight: 1.3 }}>
                                            <CardIcon name="fa-user" style={{ fontSize: '0.72rem' }} />
                                            <span>{cardholder}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Right Side: QR CODE */}
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', flexShrink: 0 }}>
                                    <div
                                        style={{
                                            backgroundColor: '#FFFFFF',
                                            padding: 3,
                                            borderRadius: 6,
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                    >
                                        <QRCodeCanvas
                                            value={activeCard.qr_token || (activeCard.qrImg && typeof activeCard.qrImg === 'string' && !activeCard.qrImg.includes('/') && !activeCard.qrImg.startsWith('data:') ? activeCard.qrImg : '') || 'https://firstloop.co.in/'}
                                            size={56}
                                            fgColor={(activeCard.qr_color && activeCard.qr_color !== '#FFFFFF') ? activeCard.qr_color : (activeCard.qrColor && activeCard.qrColor !== '#FFFFFF' ? activeCard.qrColor : '#000000')}
                                            bgColor="#FFFFFF"
                                            style={{
                                                width: 56,
                                                height: 56,
                                                objectFit: 'contain',
                                                display: 'block'
                                            }}
                                        />
                                    </div>
                                    <small style={{ fontSize: '0.52rem', fontWeight: 700, marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.35px', opacity: 0.9, lineHeight: 1.15 }}>
                                        SCAN TO STAMP
                                    </small>
                                </div>
                            </div>

                            {/* 2. MIDDLE SECTION: Stamp Circles Grid - 5 Columns x 2 Rows with equal space on both sides */}
                            <div style={{ marginTop: 10, marginBottom: 4, width: '100%' }}>
                                <div
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(5, 52px)',
                                        justifyContent: 'space-between',
                                        gap: '8px 0',
                                        width: '100%'
                                    }}
                                >
                                    {Array.from({ length: totalStamps }).map((_, i) => {
                                        const stampNum = i + 1
                                        const levels = activeCard.CustomerStampLevels || activeCard.levelRewards || activeCard.stamp_levels || []
                                        const rewardItem = Array.isArray(levels) ? (levels.find(l => Number(l.stamp_number) === stampNum) || levels[i]) : null

                                        const rType = rewardItem
                                            ? (rewardItem.type || (rewardItem.reward_type === '2' ? 'Discount' : (rewardItem.reward_type === '3' ? 'Paid' : 'Free')))
                                            : null

                                        const inheritedRewards = Array.isArray(rewardItem?.InheritedRewards) ? rewardItem.InheritedRewards : []
                                        const hasInheritedFree = inheritedRewards.some(r => Number(r.free_stamp) === 1 || r.free_stamp === true || r.free_stamp === '1')
                                        const hasFreeStamp = rewardItem && (Number(rewardItem.free_stamp) === 1 || rewardItem.free_stamp === true || rewardItem.free_stamp === '1' || hasInheritedFree || Boolean(rewardItem.free_text))
                                        const freeTextDesc = rewardItem?.free_text || (inheritedRewards.map(r => r.free_text).filter(Boolean).join(', ')) || ''

                                        const perkLines = hasFreeStamp
                                            ? parsePerkTwoLines(freeTextDesc, rType, rType === 'Discount' ? (rewardItem?.discount ?? rewardItem?.discountVal) : null)
                                            : null

                                        let iconMarkup = null
                                        if (rewardItem && rType === 'Free') {
                                            iconMarkup = <CardIcon name={rewardItem.icon || 'fa-gift'} style={{ fontSize: '0.88rem' }} />
                                        } else if (rewardItem && rType === 'Discount') {
                                            const disc = Number(rewardItem.discount ?? rewardItem.discountVal ?? (parseInt(rewardItem.reward_text) || 0))
                                            iconMarkup = (
                                                <span style={{ fontSize: '0.76rem', fontWeight: 800, lineHeight: 1 }}>
                                                    {disc}%
                                                </span>
                                            )
                                        } else if (rewardItem && rType === 'Paid') {
                                            iconMarkup = <CardIcon name={rewardItem.icon || 'fa-tag'} style={{ fontSize: '0.88rem' }} />
                                        } else {
                                            iconMarkup = (
                                                <span style={{ fontSize: '0.88rem', fontWeight: 800, lineHeight: 1 }}>
                                                    {i + 1}
                                                </span>
                                            )
                                        }

                                        const hasCustomer = Boolean(
                                            activeCard.card_number ||
                                            activeCard.customer_id ||
                                            activeCard.cus_id ||
                                            activeCard.customer_name ||
                                            activeCard.cardholderName ||
                                            activeCard.customer ||
                                            activeCard.qr_token ||
                                            activeCard.customer_card_id
                                        )

                                        const isStamped = Boolean(
                                            (rewardItem && (Number(rewardItem.status) === 1 || rewardItem.status === true || rewardItem.status === '1')) ||
                                            (hasCustomer && Number(activeCard.current_stamp ?? activeCard.current_stamps ?? activeCard.collected ?? 0) >= stampNum)
                                        )

                                        return (
                                            <div
                                                key={i}
                                                title={isStamped ? `Stamp #${stampNum} - Completed` : (hasFreeStamp ? `${rewardItem?.reward || (rType === 'Discount' ? `${rewardItem.discount ?? rewardItem.discountVal}% Off` : 'Paid Perk')} Free: ${freeTextDesc || 'Free Perk'}` : `Stamp #${stampNum}`)}
                                                style={{
                                                    width: 52,
                                                    height: 52,
                                                    borderRadius: `${activeCard.stamp_radius ?? activeCard.stampRadius ?? 50}%`,
                                                    border: isStamped
                                                        ? '2px solid #10B981'
                                                        : `2px solid ${activeCard.stampBorderColor || activeCard.stamp_border_color || '#FFFFFF'}`,
                                                    background: isStamped
                                                        ? '#10B981'
                                                        : (activeCard.stampBgColor || activeCard.stamp_background || 'rgba(255, 255, 255, 0.3)'),
                                                    color: isStamped ? '#FFFFFF' : (activeCard.stampTextColor || activeCard.stamp_text_color || 'inherit'),
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    textAlign: 'center',
                                                    fontSize: '0.88rem',
                                                    fontWeight: 800,
                                                    flexShrink: 0,
                                                    boxSizing: 'border-box',
                                                    position: 'relative',
                                                    overflow: 'hidden',
                                                    padding: '2px'
                                                }}
                                            >
                                                {isStamped && hasFreeStamp ? (
                                                    <div
                                                        style={{
                                                            width: '100%',
                                                            height: '100%',
                                                            borderRadius: 'inherit',
                                                            border: '1.5px solid rgba(255, 255, 255, 0.8)',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            background: 'radial-gradient(circle, rgba(255, 255, 255, 0.38) 0%, rgba(255, 255, 255, 0.15) 65%, transparent 100%)',
                                                            backdropFilter: 'blur(2px)',
                                                            WebkitBackdropFilter: 'blur(2px)',
                                                            boxShadow: 'inset 0 0 6px rgba(255, 255, 255, 0.5), 0 0 6px rgba(255, 255, 255, 0.35)',
                                                            boxSizing: 'border-box'
                                                        }}
                                                    >
                                                        <CardIcon name="fa-heart" style={{ fontSize: '0.92rem', color: '#FFFFFF', filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.25))' }} />
                                                    </div>
                                                ) : (
                                                    hasFreeStamp && perkLines ? (
                                                        <div
                                                            style={{
                                                                display: 'flex',
                                                                flexDirection: 'column',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                width: '100%',
                                                                height: '100%',
                                                                lineHeight: 1.05
                                                            }}
                                                        >
                                                            <span
                                                                style={{
                                                                    fontSize: perkLines.bottom ? '0.82rem' : '0.90rem',
                                                                    fontWeight: 800,
                                                                    lineHeight: 1,
                                                                    color: '#FFFFFF',
                                                                    textAlign: 'center',
                                                                    letterSpacing: '0.2px'
                                                                }}
                                                            >
                                                                {perkLines.top}
                                                            </span>
                                                            {perkLines.bottom && (
                                                                <span
                                                                    style={{
                                                                        fontSize: '0.50rem',
                                                                        fontWeight: 800,
                                                                        lineHeight: 1,
                                                                        letterSpacing: '0.4px',
                                                                        textTransform: 'uppercase',
                                                                        color: '#FFFFFF',
                                                                        marginTop: 2,
                                                                        textAlign: 'center',
                                                                        opacity: 0.95
                                                                    }}
                                                                >
                                                                    {perkLines.bottom}
                                                                </span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        iconMarkup
                                                    )
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* 3. BOTTOM FOOTER: Left = Expiry Date | Right = Powered by firstloop badge */}
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    marginTop: 8,
                                    width: '100%',
                                    minHeight: 22
                                }}
                            >
                                {/* Left: Expiry Date */}
                                {(activeCard.expires_at || activeCard.expiry) ? (
                                    <div
                                        style={{
                                            fontSize: '0.65rem',
                                            opacity: 0.95,
                                            fontWeight: 700,
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 5,
                                            background: 'rgba(0, 0, 0, 0.22)',
                                            backdropFilter: 'blur(6px)',
                                            WebkitBackdropFilter: 'blur(6px)',
                                            padding: '3px 8px',
                                            borderRadius: 12,
                                            border: '1px solid rgba(255, 255, 255, 0.14)',
                                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                                        }}
                                    >
                                        <CardIcon name="fa-calendar-alt" style={{ fontSize: '0.6rem' }} />
                                        <span>Expires: {formatExpiryDate(activeCard.expires_at || activeCard.expiry)}</span>
                                    </div>
                                ) : (
                                    <div />
                                )}

                                {/* Right: Powered by FirstLoop Pill Badge */}
                                <div
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 5,
                                        fontSize: '0.62rem',
                                        opacity: 0.95,
                                        fontWeight: 600,
                                        background: 'rgba(0, 0, 0, 0.22)',
                                        backdropFilter: 'blur(6px)',
                                        WebkitBackdropFilter: 'blur(6px)',
                                        padding: '3px 8px',
                                        borderRadius: 12,
                                        border: '1px solid rgba(255, 255, 255, 0.14)',
                                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                                        lineHeight: 1
                                    }}
                                >
                                    <span style={{ lineHeight: 1, display: 'inline-flex', alignItems: 'center' }}>powered by</span>
                                    <img src={flLogo} alt="FirstLoop" crossOrigin="anonymous" style={{ height: 12, width: 'auto', display: 'inline-block', verticalAlign: 'middle', objectFit: 'contain', margin: '0 1px' }} />
                                    <strong style={{ color: 'inherit', lineHeight: 1, display: 'inline-flex', alignItems: 'center', fontWeight: 800 }}>firstloop</strong>
                                </div>
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
                                    const url = `/card-preview/${activeCard.id}?type=1&cus_id=${activeCard.customer_id || activeCard.cus_id || ''}&phone=${encodeURIComponent(customerPhone || '')}&country_code=${encodeURIComponent(customerCountryCode || '')}&customer_name=${encodeURIComponent(cardholder || '')}`
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
                        <span>{downloading ? 'Downloading...' : `Download ${activeCard.title || activeCard.name || 'Stamp Card'}`}</span>
                    </button>
                </div>
            </div>
        </div>
    )
}

export { StampCardPreviewModal }
export default StampCardPreviewModal
