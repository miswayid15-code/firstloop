import React from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import flLogo from '../assets/img/firstloop-favicon.png'
import qrImg from '../assets/img/qr-img.png'
import { getCardStyle, formatImageUrl } from '../services/cardService.js'
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
                maxWidth: 380,
                width: '100%'
            }}
        >
            {/* DIGITAL STAMP CARD CANVAS */}
            <div
                style={{
                    width: '100%',
                    maxWidth: 380,
                    borderRadius: 20,
                    ...getCardStyle(card),
                    color: card.textColor || card.text_color || '#FFFFFF',
                    padding: 22,
                    boxShadow: '0 14px 30px -6px rgba(0,0,0,0.22)',
                    position: 'relative',
                    minHeight: 230
                }}
            >
                <div style={{ position: 'relative', zIndex: 2 }}>
                    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                        {/* Left Side: Brand info + Stamp circles */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                <div
                                    style={{
                                        width: 26,
                                        height: 26,
                                        borderRadius: 8,
                                        background: '#FFFFFF',
                                        padding: 2,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                                    }}
                                >
                                    <img
                                        src={brandLogo}
                                        alt="Logo"
                                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                    />
                                </div>
                                <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'inherit' }}>
                                    {brandName}
                                </span>
                            </div>

                            <div style={{ fontSize: '0.78rem', opacity: 0.9, marginBottom: 12 }}>
                                <strong>{card.title || 'Stamp Pass'}</strong>
                            </div>

                            {/* Stamp Circles Grid */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 6, maxWidth: 220 }}>
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

                                    let iconMarkup = null
                                    if (rewardItem && rType === 'Free') {
                                        iconMarkup = <CardIcon name={rewardItem.icon || 'fa-gift'} style={{ fontSize: '0.82rem' }} />
                                    } else if (rewardItem && rType === 'Discount') {
                                        const disc = Number(rewardItem.discount ?? rewardItem.discountVal ?? (parseInt(rewardItem.reward_text) || 0))
                                        iconMarkup = (
                                            <span style={{ fontSize: '0.62rem', fontWeight: 800, lineHeight: 1 }}>
                                                {disc}%
                                            </span>
                                        )
                                    } else if (rewardItem && rType === 'Paid') {
                                        iconMarkup = <CardIcon name={rewardItem.icon || 'fa-tag'} style={{ fontSize: '0.82rem' }} />
                                    } else {
                                        iconMarkup = (
                                            <span style={{ fontSize: '0.82rem', fontWeight: 800, lineHeight: 1 }}>
                                                {i + 1}
                                            </span>
                                        )
                                    }

                                    const inheritedRewards = Array.isArray(rewardItem?.InheritedRewards) ? rewardItem.InheritedRewards : []
                                    const hasInheritedFree = inheritedRewards.some(r => Number(r.free_stamp) === 1 || r.free_stamp === true || r.free_stamp === '1')
                                    const hasFreeStamp = rewardItem && (rType === 'Discount' || rType === 'Paid') && (Number(rewardItem.free_stamp) === 1 || rewardItem.free_stamp === true || rewardItem.free_stamp === '1' || hasInheritedFree)
                                    const freeTextDesc = rewardItem?.free_text || (inheritedRewards.map(r => r.free_text).filter(Boolean).join(', ')) || 'Free Item'

                                    return (
                                        <div
                                            key={i}
                                            title={isStamped ? `Stamp #${stampNum} - Completed` : (hasFreeStamp ? `${rewardItem.reward || (rType === 'Discount' ? `${rewardItem.discount ?? rewardItem.discountVal}% Off` : 'Paid Perk')} Free: ${freeTextDesc}` : undefined)}
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
                                                flexShrink: 0,
                                                position: 'relative'
                                            }}
                                        >
                                            {isStamped ? (
                                                <CardIcon
                                                    name="fa-check"
                                                    style={{
                                                        fontSize: '0.88rem',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        lineHeight: 1
                                                    }}
                                                />
                                            ) : (
                                                iconMarkup
                                            )}
                                            {hasFreeStamp && (
                                                <span
                                                    title={rewardItem.free_text ? `Free Perk: ${rewardItem.free_text}` : 'Free Perk Included'}
                                                    style={{
                                                        position: 'absolute',
                                                        top: -4,
                                                        right: -4,
                                                        width: 15,
                                                        height: 15,
                                                        borderRadius: '50%',
                                                        background: '#10B981',
                                                        color: '#FFFFFF',
                                                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.35)',
                                                        border: '1.5px solid #FFFFFF',
                                                        zIndex: 4,
                                                        pointerEvents: 'none',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: '0.45rem',
                                                        lineHeight: 1
                                                    }}
                                                >
                                                    <CardIcon name="fa-gift" style={{ lineHeight: 1, fontSize: '0.45rem' }} />
                                                </span>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Right Side: QR Code */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <div style={{
                                backgroundColor: '#FFFFFF',
                                padding: 4,
                                borderRadius: 8,
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <RealQRCode size={78} color={(card.qr_color && card.qr_color !== '#FFFFFF') ? card.qr_color : (card.qrColor && card.qrColor !== '#FFFFFF' ? card.qrColor : '#000000')} />
                            </div>
                            <small style={{ fontSize: '0.6rem', fontWeight: 700, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.9 }}>
                                SCAN TO STAMP
                            </small>
                        </div>
                    </div>

                    {/* Bottom Right: Powered by badge */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 5, fontSize: '0.65rem', opacity: 0.9, fontWeight: 600, marginTop: 10, lineHeight: 1 }}>
                        <span style={{ lineHeight: 1, display: 'inline-flex', alignItems: 'center' }}>powered by</span>
                        <img src={flLogo} alt="FirstLoop" style={{ height: 13, width: 'auto', display: 'inline-block', verticalAlign: 'middle', objectFit: 'contain', margin: '0 1px' }} />
                        <strong style={{ color: 'inherit', lineHeight: 1, display: 'inline-flex', alignItems: 'center' }}>firstloop</strong>
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
