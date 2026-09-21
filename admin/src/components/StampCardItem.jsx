import React from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import flLogo from '../assets/img/firstloop-favicon.png'
import qrImg from '../assets/img/qr-img.png'
import { getCardStyle, formatImageUrl, parsePerkTwoLines } from '../services/cardService.js'
import CardIcon from './CardIcon.jsx'

const RealQRCode = ({ size = 80, color = '#000000' }) => (
    <QRCodeCanvas
        value="https://firstloop.co.in/"
        size={size}
        fgColor={color}
        bgColor="#FFFFFF"
        style={{
            width: size,
            height: size,
            flexShrink: 0
        }}
    />
);

export default function StampCardItem({
    card,
    merchantName = '',
    onEdit,
    onPreview,
    onDelete
}) {
    if (!card) return null

    const brandName = card.brandName || merchantName || 'Merchant'
    const brandLogo = card.brandLogo ? formatImageUrl(card.brandLogo) : flLogo
    const totalStamps = Number(card.total_stamps || card.number_of_stamps || 8)

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                maxWidth: 450,
                width: '100%'
            }}
        >
            {/* DIGITAL STAMP CARD CANVAS */}
            <div
                style={{
                    width: '100%',
                    maxWidth: 450,
                    borderRadius: 20,
                    ...getCardStyle(card),
                    color: card.textColor || card.text_color || '#FFFFFF',
                    padding: '16px 20px',
                    boxShadow: '0 14px 30px -6px rgba(0,0,0,0.22)',
                    position: 'relative',
                    minHeight: 215
                }}
            >
                <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
                    {/* 1. TOP HEADER ROW: Left = Brand Info | Right = QR Code */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                        {/* Brand Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                                <div
                                    style={{
                                        width: 28,
                                        height: 28,
                                        borderRadius: 8,
                                        background: '#FFFFFF',
                                        padding: 2,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                                        flexShrink: 0
                                    }}
                                >
                                    <img
                                        src={brandLogo}
                                        alt="Logo"
                                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                    />
                                </div>
                                <span style={{ fontSize: '1rem', fontWeight: 800, color: 'inherit', lineHeight: 1.25 }}>
                                    {brandName}
                                </span>
                            </div>

                            <div style={{ fontSize: '0.84rem', opacity: 0.95, marginBottom: 3, lineHeight: 1.3 }}>
                                <strong>{card.title || 'Stamp Pass'}</strong>
                            </div>
                        </div>

                        {/* Right Side: QR Code */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', flexShrink: 0 }}>
                            <div style={{
                                backgroundColor: '#FFFFFF',
                                padding: 3,
                                borderRadius: 6,
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <RealQRCode size={56} color={(card.qr_color && card.qr_color !== '#FFFFFF') ? card.qr_color : (card.qrColor && card.qrColor !== '#FFFFFF' ? card.qrColor : '#000000')} />
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
                                const levels = card.CustomerStampLevels || card.levelRewards || card.stamp_levels || []
                                const rewardItem = Array.isArray(levels)
                                    ? (levels.find(l => Number(l.stamp_number) === stampNum) || levels[i])
                                    : null

                                const hasCustomer = Boolean(
                                    card.card_number ||
                                    card.customer_id ||
                                    card.cus_id ||
                                    card.customer_name ||
                                    card.cardholderName ||
                                    card.customer ||
                                    card.qr_token ||
                                    card.customer_card_id
                                )

                                const isStamped = Boolean(
                                    (rewardItem && (Number(rewardItem.status) === 1 || rewardItem.status === true || rewardItem.status === '1')) ||
                                    (hasCustomer && Number(card.current_stamp ?? card.current_stamps ?? card.collected ?? 0) >= stampNum)
                                )

                                const rType = rewardItem
                                    ? (rewardItem.type || (rewardItem.reward_type === '2' || Number(rewardItem.reward_type) === 2 ? 'Discount' : (rewardItem.reward_type === '3' || Number(rewardItem.reward_type) === 3 ? 'Paid' : 'Free')))
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

                                return (
                                    <div
                                        key={i}
                                        title={isStamped ? `Stamp #${stampNum} - Completed` : (hasFreeStamp ? `${rewardItem?.reward || (rType === 'Discount' ? `${rewardItem.discount ?? rewardItem.discountVal}% Off` : 'Paid Perk')} Free: ${freeTextDesc || 'Free Perk'}` : undefined)}
                                        style={{
                                            width: 52,
                                            height: 52,
                                            borderRadius: `${card.stamp_radius ?? card.stampRadius ?? 50}%`,
                                            border: isStamped
                                                ? '2px solid #10B981'
                                                : `2px solid ${card.stampBorderColor || card.stamp_border_color || '#FFFFFF'}`,
                                            background: isStamped
                                                ? '#10B981'
                                                : (card.stampBgColor || card.stamp_background || 'rgba(255, 255, 255, 0.3)'),
                                            color: isStamped ? '#FFFFFF' : (card.stampTextColor || card.stamp_text_color || 'inherit'),
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '0.88rem',
                                            fontWeight: 800,
                                            flexShrink: 0,
                                            position: 'relative',
                                            overflow: 'hidden',
                                            boxSizing: 'border-box',
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

                    {/* 3. BOTTOM FOOTER: Powered by badge with glass pill */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: 8, width: '100%', minHeight: 22 }}>
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
                            <img src={flLogo} alt="FirstLoop" style={{ height: 12, width: 'auto', display: 'inline-block', verticalAlign: 'middle', objectFit: 'contain', margin: '0 1px' }} />
                            <strong style={{ color: 'inherit', lineHeight: 1, display: 'inline-flex', alignItems: 'center', fontWeight: 800 }}>firstloop</strong>
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Bar */}
            <div style={{ display: 'flex', gap: 10, padding: '0 4px' }}>
                {onEdit && (
                    <button
                        type="button"
                        className="btn firstloop-btn-primary"
                        onClick={() => onEdit(card)}
                        style={{ flex: 1, padding: '8px 14px', fontSize: '0.82rem', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                    >
                        <i className="fas fa-edit" />
                        <span>Edit Card Design</span>
                    </button>
                )}

                {onPreview && (
                    <button
                        type="button"
                        className="btn firstloop-btn-secondary"
                        onClick={() => onPreview(card)}
                        style={{ padding: '8px 14px', fontSize: '0.82rem', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                        <i className="fas fa-eye" />
                        <span>Preview</span>
                    </button>
                )}

                {onDelete && (
                    <button
                        type="button"
                        className="btn"
                        onClick={() => onDelete(card.id)}
                        style={{ padding: '8px 12px', fontSize: '0.8rem', borderRadius: 8, background: 'var(--status-danger-bg, rgba(239, 68, 68, 0.1))', color: 'var(--status-danger, #EF4444)', border: 'none' }}
                    >
                        <i className="fas fa-trash-alt" />
                    </button>
                )}
            </div>
        </div>
    )
}
