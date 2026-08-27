import React, { useRef, useState } from 'react'
import html2canvas from 'html2canvas'
import logo from '../assets/img/firstloop-favicon.png'
import flLogo from '../assets/img/firstloop-favicon.png'
import qrImg from '../assets/img/qr-img.png'

// Helper: Clean relative image path
const getRelativeImagePath = (path) => {
    if (!path || typeof path !== 'string') return ''
    let str = path.trim()
    if (str.startsWith('data:') || str.startsWith('blob:')) return str

    const uploadsMatch = str.match(/(uploads\/.*)/i)
    if (uploadsMatch && uploadsMatch[1]) {
        return uploadsMatch[1].replace(/^\/+/, '')
    }

    if (str.startsWith('http://') || str.startsWith('https://')) {
        const lastHttp = str.lastIndexOf('http://')
        const lastHttps = str.lastIndexOf('https://')
        const idx = Math.max(lastHttp, lastHttps)
        try {
            const url = new URL(str.substring(idx))
            str = url.pathname
        } catch (e) {
            str = str.replace(/^https?:\/\/[^/]+/i, '')
        }
    }

    return str.replace(/^\/+/, '')
}

// Helper: Format image url with base API URL
const formatImageUrl = (img) => {
    if (!img) return ''
    let str = String(img).trim()

    if (str.startsWith('http://') || str.startsWith('https://') || str.startsWith('data:') || str.startsWith('blob:')) {
        return str
    }

    const baseUrl = import.meta.env.VITE_API_URL || ''
    const cleanBase = baseUrl.replace(/\/+$/, '')
    const cleanImg = getRelativeImagePath(str).replace(/^\/+/, '')
    return cleanBase ? `${cleanBase}/${cleanImg}` : cleanImg
}

export default function StampCardPreviewModal({
    isOpen = true,
    card = null,
    onClose,
    fallbackBrandName = 'Elite Branch'
}) {
    const cardRef = useRef(null)
    const [downloading, setDownloading] = useState(false)

    if (!isOpen || !card) return null

    // Card background and border style computation
    const getCardStyle = () => {
        const style = {
            border: `2px solid ${card.borderColor || card.border_color || 'rgba(255,255,255,0.4)'}`
        }
        const bgImg = card.bgImage || card.background_image
        if (bgImg && bgImg !== 'none' && bgImg !== 'null' && bgImg !== 'undefined') {
            style.backgroundImage = `url(${formatImageUrl(bgImg)})`
            style.backgroundSize = 'cover'
            style.backgroundPosition = 'center'
            style.backgroundRepeat = 'no-repeat'
        } else {
            style.backgroundColor = card.bgColor || card.background_color || '#0E88B8'
        }
        return style
    }

    // High quality canvas download
    const handleDownload = async () => {
        if (!cardRef.current) return
        try {
            setDownloading(true)
            const canvas = await html2canvas(cardRef.current, {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                backgroundColor: null
            })
            const image = canvas.toDataURL('image/png')
            const fileName = (card.title || 'stamp-card').toLowerCase().replace(/\s+/g, '-')
            const link = document.createElement('a')
            link.href = image
            link.download = `${fileName}-pass.png`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
        } catch (error) {
            console.error('Error downloading stamp card canvas:', error)
            // Fallback download
            const fileName = (card.title || 'stamp-card').toLowerCase().replace(/\s+/g, '-')
            const link = document.createElement('a')
            link.href = qrImg
            link.download = `${fileName}-pass.png`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
        } finally {
            setDownloading(false)
        }
    }

    // WhatsApp Share Link
    const getWhatsAppShareUrl = () => {
        const brand = card.brandName || card.brand_name || fallbackBrandName
        const title = card.title || 'Digital Stamp Card'
        const total = Number(card.total_stamps || card.number_of_stamps || 8)
        const shareUrl = card.id ? `${window.location.origin}/card-preview/${card.id}` : window.location.href
        const message = `🎉 *${brand}* - ${title}\n⭐ Collect ${total} stamps to claim special rewards!\n\n👉 *View Card:* ${shareUrl}`
        return `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`
    }

    const totalStamps = Number(card.total_stamps || card.number_of_stamps || 8)
    const brandName = card.brandName || card.brand_name || fallbackBrandName
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
                <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#0F172A' }}>
                            Digital Stamp Card Preview
                        </h3>
                        <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '2px 0 0 0' }}>
                            Live render of the digital stamp pass for customers
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{ background: 'none', border: 'none', fontSize: '1.2rem', color: '#64748B', cursor: 'pointer', padding: 4 }}
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
                            ...getCardStyle(),
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
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                        <div style={{ width: 26, height: 26, borderRadius: 8, background: '#FFFFFF', padding: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}>
                                            <img src={brandLogo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                        </div>
                                        <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'inherit' }}>
                                            {brandName}
                                        </span>
                                    </div>

                                    <div style={{ fontSize: '0.78rem', opacity: 0.9, marginBottom: 12, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                        <strong>{card.title || 'Stamp Pass'}</strong>
                                    </div>

                                    {/* Stamp Circles Grid */}
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 6, maxWidth: 220 }}>
                                        {Array.from({ length: totalStamps }).map((_, i) => {
                                            const rewardItem = card.levelRewards ? card.levelRewards[i] : (card.stamp_levels ? card.stamp_levels[i] : null)
                                            let iconMarkup = i + 1

                                            if (rewardItem) {
                                                const rType = rewardItem.type || (rewardItem.reward_type === '2' ? 'Discount' : (rewardItem.reward_type === '3' ? 'Paid' : 'Free'))
                                                if (rType === 'Free') {
                                                    iconMarkup = <i className="fas fa-gift" style={{ fontSize: '0.8rem' }} />
                                                } else if (rType === 'Discount') {
                                                    const disc = Number(rewardItem.discount ?? rewardItem.discountVal ?? (parseInt(rewardItem.reward_text) || 0))
                                                    iconMarkup = <span style={{ fontSize: '0.65rem', fontWeight: 800 }}>{disc}%</span>
                                                } else if (rType === 'Paid') {
                                                    iconMarkup = <i className={`fas ${rewardItem.icon || 'fa-tag'}`} style={{ fontSize: '0.8rem' }} />
                                                }
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
                                                        fontSize: '0.85rem',
                                                        fontWeight: 800,
                                                        flexShrink: 0
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
                                    <img src={qrImg} alt="QR Code" style={{ width: 86, height: 86, objectFit: 'contain', flexShrink: 0 }} />
                                    <small style={{ fontSize: '0.6rem', fontWeight: 700, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.9 }}>
                                        SCAN TO STAMP
                                    </small>
                                </div>
                            </div>

                            {/* Powered by FirstLoop badge */}
                            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 5, fontSize: '0.65rem', opacity: 0.9, fontWeight: 600, marginTop: 10, lineHeight: 1 }}>
                                <span style={{ lineHeight: 1, display: 'inline-flex', alignItems: 'center' }}>powered by</span>
                                <img src={flLogo} alt="FirstLoop" style={{ height: 13, width: 'auto', display: 'inline-block', verticalAlign: 'middle', objectFit: 'contain', margin: '0 1px' }} />
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
                        <span>{downloading ? 'Generating...' : 'Download Card'}</span>
                    </button>
                </div>
            </div>
        </div>
    )
}
