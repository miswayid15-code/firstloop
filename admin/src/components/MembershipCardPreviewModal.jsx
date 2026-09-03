import React, { useRef, useState } from 'react'
import html2canvas from 'html2canvas'
import logo from '../assets/img/firstloop-favicon.png'
import flLogo from '../assets/img/firstloop-favicon.png'
import qrImg from '../assets/img/qr-img.png'

import {
    getRelativeImagePath,
    formatImageUrl,
    getCardStyle,
    formatValidity
} from '../services/cardService.js'

export default function MembershipCardPreviewModal({
    isOpen = true,
    card = null,
    onClose,
    fallbackBrandName = 'FirstLoop'
}) {
    const cardRef = useRef(null)
    const [downloading, setDownloading] = useState(false)

    if (!isOpen || !card) return null
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
            const rawName = card.name || card.title || 'membership-pass'
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

    // WhatsApp Share Link
    const getWhatsAppShareUrl = () => {
        const brand = card.brandName || card.brand_name || fallbackBrandName
        const title = card.name || card.title || 'Digital Membership Pass'
        const validity = formatValidity(card.validityMonths || card.month || card.totalMonth)
        const shareUrl = card.id ? `${window.location.origin}/card-preview/${card.id}?type=2` : window.location.href
        const message = `🎉 *${brand}* - ${title}\n⭐ Validity: ${validity}\n\n👉 *View Pass:* ${shareUrl}`
        return `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`
    }

    const brandName = card.brandName || card.brand_name || fallbackBrandName
    const brandLogo = card.brandLogo || card.brand_image ? formatImageUrl(card.brandLogo || card.brand_image) : logo
    const cardTitle = card.name || card.title || 'Membership Card'
    const cardholder = card.cardholderName || card.cardholder_name || 'Member Pass'
    const cardNo = card.card_number || "Card-123456"
    const validityText = formatValidity(card.expires_at || card.month || card.totalMonth)

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
                            ...getCardStyle(card, '#D97706'),
                            color: card.textColor || card.text_color || '#FFFFFF',
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
                                    <div style={{ fontSize: '0.95rem', opacity: 0.95, marginTop: 4, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, lineHeight: 1.35 }}>
                                        <i className="fas fa-user" style={{ fontSize: '0.75rem', lineHeight: 1, verticalAlign: '0' }} />
                                        <span>{cardholder}</span>
                                    </div>

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
                                    <img src={qrImg} alt="QR Code" crossOrigin="anonymous" style={{ width: 92, height: 92, objectFit: 'contain', flexShrink: 0 }} />
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
                        <span>{downloading ? 'Downloading...' : `Download ${card.name || card.title || 'Membership Pass'}`}</span>
                    </button>
                </div>
            </div>
        </div>
    )
}
