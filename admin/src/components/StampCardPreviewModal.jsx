import React, { useRef, useState } from 'react'
import html2canvas from 'html2canvas'
import logo from '../assets/img/firstloop-favicon.png'
import flLogo from '../assets/img/firstloop-favicon.png'
import { QRCodeCanvas } from 'qrcode.react'

import {
    getRelativeImagePath,
    formatImageUrl,
    getCardStyle
} from '../services/cardService.js'

export default function StampCardPreviewModal({
    isOpen = true,
    card = null,
    onClose,
    fallbackBrandName = 'Elite Branch'
}) {
    const cardRef = useRef(null)
    const [downloading, setDownloading] = useState(false)

    if (!isOpen || !card) return null

    // High quality canvas download
    const handleDownload = async () => {
        if (!cardRef.current) return
        try {
            setDownloading(true)
            const canvas = await html2canvas(cardRef.current, {
                scale: 3,
                useCORS: true,
                allowTaint: true,
                backgroundColor: null,
                logging: false
            })
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

    // WhatsApp Share Link
    const getWhatsAppShareUrl = () => {
        const brand = card.brandName || card.brand_name || fallbackBrandName
        const title = card.title || 'Digital Stamp Card'

        const total = Number(card.total_stamps || card.number_of_stamps || 8)
        const shareUrl = card.id ? `${window.location.origin}/card-preview/${card.id}?type=1` : window.location.href
        const message = `🎉 *${brand}* - ${title}\n⭐ Collect ${total} stamps to claim special rewards!\n\n👉 *View Card:* ${shareUrl}`
        return `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`
    }

    const totalStamps = Number(card.total_stamps || card.number_of_stamps || 8)
    const brandName = card.brandName || card.brand_name || fallbackBrandName
    const cardNo = card.card_number || "Card-123456"
    const brandLogo = card.brandLogo || card.brand_image ? formatImageUrl(card.brandLogo || card.brand_image) : logo

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
                            maxWidth: 380,
                            borderRadius: 20,
                            ...getCardStyle(card, '#0E88B8'),
                            color: card.textColor || card.text_color || '#FFFFFF',
                            padding: 20,
                            boxShadow: '0 16px 36px -8px rgba(0,0,0,0.25)',
                            position: 'relative',
                            minHeight: 230
                        }}
                    >
                        <div style={{ position: 'relative', zIndex: 2 }}>
                            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                                {/* Left Side: Brand Logo, Title & Stamp Slots */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    {/* Brand Logo & Name */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                        <div style={{ width: 28, height: 28, borderRadius: 8, background: '#FFFFFF', padding: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.1)', flexShrink: 0 }}>
                                            <img src={brandLogo} alt="Logo" crossOrigin="anonymous" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                        </div>
                                        <span style={{ fontSize: '1rem', fontWeight: 800, color: 'inherit', lineHeight: 1.35, display: 'inline-block' }}>
                                            {brandName}
                                        </span>
                                    </div>

                                    {/* Card Title */}
                                    <div style={{ fontSize: '0.85rem', opacity: 0.95, marginBottom: 4, lineHeight: 1.35 }}>
                                        <strong>{card.title || 'Stamp Pass'}</strong>
                                    </div>

                                    {/* Cardholder Name with User Icon */}
                                    <div style={{ fontSize: '0.95rem', opacity: 0.95, fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6, lineHeight: 1.35 }}>
                                        <i className="fas fa-user" style={{ fontSize: '0.75rem', lineHeight: 1, verticalAlign: '0' }} />
                                        <span>{card.cardholderName || card.customer_name || 'Customer'}</span>
                                    </div>

                                    {/* Stamp Circles Grid */}
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 6, maxWidth: 220 }}>
                                        {Array.from({ length: totalStamps }).map((_, i) => {
                                            const stampNum = i + 1
                                            const levels = card.CustomerStampLevels || card.levelRewards || card.stamp_levels || []
                                            const rewardItem = Array.isArray(levels) ? (levels.find(l => Number(l.stamp_number) === stampNum) || levels[i]) : null
                                            let iconMarkup = stampNum

                                            if (rewardItem) {
                                                const rType = rewardItem.type || (rewardItem.reward_type === '2' ? 'Discount' : (rewardItem.reward_type === '3' ? 'Paid' : 'Free'))
                                                if (rType === 'Free') {
                                                    iconMarkup = (
                                                        <i
                                                            className={`fas ${rewardItem.icon || 'fa-gift'}`}
                                                            style={{
                                                                fontSize: '0.82rem',
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                lineHeight: 1,
                                                                verticalAlign: '0',
                                                                margin: 0,
                                                                padding: 0
                                                            }}
                                                        />
                                                    )
                                                } else if (rType === 'Discount') {
                                                    const disc = Number(rewardItem.discount ?? rewardItem.discountVal ?? (parseInt(rewardItem.reward_text) || 0))
                                                    iconMarkup = (
                                                        <span
                                                            style={{
                                                                fontSize: '0.62rem',
                                                                fontWeight: 800,
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                lineHeight: 1,
                                                                verticalAlign: '0',
                                                                margin: 0,
                                                                padding: 0
                                                            }}
                                                        >
                                                            {disc}%
                                                        </span>
                                                    )
                                                } else if (rType === 'Paid') {
                                                    iconMarkup = (
                                                        <i
                                                            className={`fas ${rewardItem.icon || 'fa-tag'}`}
                                                            style={{
                                                                fontSize: '0.82rem',
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                lineHeight: 1,
                                                                verticalAlign: '0',
                                                                margin: 0,
                                                                padding: 0
                                                            }}
                                                        />
                                                    )
                                                }
                                            } else {
                                                iconMarkup = (
                                                    <span
                                                        style={{
                                                            fontSize: '0.82rem',
                                                            fontWeight: 800,
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            lineHeight: 1,
                                                            verticalAlign: '0',
                                                            margin: 0,
                                                            padding: 0
                                                        }}
                                                    >
                                                        {i + 1}
                                                    </span>
                                                )
                                            }

                                            return (
                                                <div
                                                    key={i}
                                                    style={{
                                                        width: 36,
                                                        height: 36,
                                                        borderRadius: `${card.stamp_radius ?? card.stampRadius ?? 50}%`,
                                                        border: `2px solid ${card.stampBorderColor || card.stamp_border_color || '#FFFFFF'}`,
                                                        background: card.stampBgColor || card.stamp_background || 'rgba(255, 255, 255, 0.3)',
                                                        color: card.stampTextColor || card.stamp_text_color || 'inherit',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        textAlign: 'center',
                                                        fontSize: '0.85rem',
                                                        fontWeight: 800,
                                                        flexShrink: 0,
                                                        boxSizing: 'border-box'
                                                    }}
                                                >
                                                    {iconMarkup}
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>

                                {/* Right Side: QR CODE */}
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <QRCodeCanvas
                                        value={card.qrImg || card.qr_token || 'firstloop'}
                                        size={92}
                                        style={{
                                            width: 92,
                                            height: 92,
                                            objectFit: 'contain',
                                            display: 'block'
                                        }}
                                    />
                                    <small style={{ fontSize: '0.6rem', fontWeight: 700, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.9 }}>
                                        SCAN TO STAMP
                                    </small>
                                </div>
                            </div>

                            {/* Powered by FirstLoop badge */}
                            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 5, fontSize: '0.65rem', opacity: 0.9, fontWeight: 600, marginTop: 10, lineHeight: 1 }}>
                                <span style={{ lineHeight: 1, display: 'inline-flex', alignItems: 'center' }}>powered by</span>
                                <img src={flLogo} alt="FirstLoop" crossOrigin="anonymous" style={{ height: 13, width: 'auto', display: 'inline-block', verticalAlign: 'middle', objectFit: 'contain', margin: '0 1px' }} />
                                <strong style={{ color: 'inherit', lineHeight: 1, display: 'inline-flex', alignItems: 'center' }}>firstloop.co.in</strong>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Modal Action Bar */}
                <div style={{ padding: '16px 20px', background: '#FFFFFF', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <a
                        href={getWhatsAppShareUrl()}
                        target="_blank"
                        rel="noopener noreferrer"
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
                            textDecoration: 'none',
                            border: 'none',
                            boxShadow: '0 4px 12px rgba(37, 211, 102, 0.25)'
                        }}
                    >
                        <i className="fab fa-whatsapp" style={{ fontSize: '1.1rem' }} />
                        <span>Share to WhatsApp</span>
                    </a>

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
                        <span>{downloading ? 'Downloading...' : `Download ${card.title || card.name || 'Stamp Card'}`}</span>
                    </button>
                </div>
            </div>
        </div>
    )
}
