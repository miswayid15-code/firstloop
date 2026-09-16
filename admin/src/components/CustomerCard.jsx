import React, { forwardRef } from 'react'
import fl_logo from '../assets/img/firstloop-favicon.png'
import { QRCodeCanvas } from 'qrcode.react'
import {
    formatImageUrl,
    getCardStyle,
    formatValidity,
    formatExpiryDate
} from '../services/cardService.js'
import CardIcon from './CardIcon.jsx'

/**
 * Reusable Customer Card Component
 * Supports both Type 1 (Stamp Pass) and Type 2 (Membership Pass)
 *
 * @param {Object} props
 * @param {Object} props.card - Card data object (from fetchCustomerStampLevelsApi or API)
 * @param {number} [props.cardType] - 1 for Stamp Card, 2 for Membership Card (defaults to card.card_type || 1)
 * @param {string} [props.canvasId] - Optional DOM ID for html2canvas
 * @param {Object} [props.style] - Optional wrapper style overrides
 */
const CustomerCard = forwardRef(({ card, cardType: propCardType, canvasId, style = {} }, ref) => {
    if (!card) return null

    const type = Number(propCardType || card.card_type || 1) === 2 ? 2 : 1
    const defaultBg = type === 2 ? '#D97706' : '#0E88B8'
    const scanText = type === 2 ? 'SCAN PASS' : 'SCAN TO STAMP'
    const finalCanvasId = canvasId || (type === 2 ? 'membership-pass-preview-canvas' : 'stamp-card-preview-canvas')
    const totalStamps = Number(card.total_stamps || card.number_of_stamps || card.total || 8)

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
    const cardholder = card.cardholderName || card.customer_name || (hasCustomer ? 'Customer' : '')

    return (
        <div
            ref={ref}
            id={finalCanvasId}
            style={{
                width: '100%',
                maxWidth: 380,
                minHeight: 230,
                borderRadius: 20,
                ...getCardStyle(card, defaultBg),
                color: card.textColor || card.text_color || '#FFFFFF',
                padding: 20,
                boxShadow: '0 16px 36px -8px rgba(0,0,0,0.25)',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                overflow: 'hidden',
                boxSizing: 'border-box',
                ...style
            }}
        >
            <div
                style={{
                    position: 'relative',
                    zIndex: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    justifyContent: 'space-between'
                }}
            >
                {/* Top / Main Body (Left Info + Right QR Code) */}
                <div style={{ display: 'flex', gap: 16, alignItems: type === 2 ? 'flex-start' : 'center' }}>
                    {/* LEFT COLUMN */}
                    <div
                        style={{
                            flex: 1,
                            minWidth: 0,
                            display: 'flex',
                            flexDirection: 'column',
                            minHeight: type === 2 ? 156 : undefined,
                            justifyContent: type === 2 ? 'space-between' : 'flex-start'
                        }}
                    >
                        <div>
                            {/* BRAND */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
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
                                        src={formatImageUrl(card.brandLogo || card.brand_image || card.logo) || fl_logo}
                                        alt="Logo"
                                        crossOrigin="anonymous"
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'contain'
                                        }}
                                    />
                                </div>

                                <span
                                    style={{
                                        fontSize: '1rem',
                                        fontWeight: 800,
                                        color: 'inherit',
                                        lineHeight: 1.35,
                                        display: 'inline-block'
                                    }}
                                >
                                    {card.brandName || card.brand_name || 'Merchant'}
                                </span>
                            </div>

                            {/* CARD TITLE */}
                            <div
                                style={{
                                    fontSize: '0.85rem',
                                    opacity: 0.95,
                                    marginBottom: 4,
                                    lineHeight: 1.35
                                }}
                            >
                                <strong>{card.title || (type === 2 ? 'Membership Pass' : 'Stamp Pass')}</strong>
                            </div>

                            {/* CARDHOLDER NAME */}
                            {cardholder && (
                                <div
                                    style={{
                                        fontSize: '0.95rem',
                                        opacity: 0.95,
                                        fontWeight: 700,
                                        marginBottom: type === 1 ? 8 : 0,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 6,
                                        lineHeight: 1.35
                                    }}
                                >
                                    <CardIcon name="fa-user" style={{ fontSize: '0.75rem' }} />
                                    <span>{cardholder}</span>
                                </div>
                            )}
                        </div>

                        {/* TYPE SPECIFIC DETAILS */}
                        {type === 1 ? (
                            /* STAMP GRID (TYPE 1) */
                            <div>
                                <div
                                    style={{
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        gap: 8,
                                        marginBottom: 6,
                                        maxWidth: 220
                                    }}
                                >
                                    {Array.from({
                                        length: totalStamps
                                    }).map((_, i) => {
                                        const stampNum = i + 1
                                        const levels = card.CustomerStampLevels || card.levelRewards || card.stamp_levels || []
                                        const rewardItem = Array.isArray(levels)
                                            ? (levels.find(l => Number(l.stamp_number) === stampNum) || levels[i])
                                            : null
                                        let iconMarkup = null

                                        const isStamped = Boolean(
                                            (rewardItem && (Number(rewardItem.status) === 1 || rewardItem.status === true || rewardItem.status === '1')) ||
                                            (hasCustomer && (
                                                Number(card.is_completed) === 1 ||
                                                Number(card.current_stamp ?? card.current_stamps ?? card.collected ?? 0) >= stampNum
                                            ))
                                        )

                                        const rType = rewardItem
                                            ? (rewardItem.type || (rewardItem.reward_type === '2' || Number(rewardItem.reward_type) === 2 ? 'Discount' : (rewardItem.reward_type === '3' || Number(rewardItem.reward_type) === 3 ? 'Paid' : 'Free')))
                                            : null

                                        if (rewardItem && rType === 'Free') {
                                            iconMarkup = (
                                                <CardIcon
                                                    name={rewardItem.icon || 'fa-gift'}
                                                    style={{
                                                        fontSize: '0.82rem',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}
                                                />
                                            )
                                        } else if (rewardItem && rType === 'Discount') {
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
                                        } else if (rewardItem && rType === 'Paid') {
                                            iconMarkup = (
                                                <CardIcon
                                                    name={rewardItem.icon || 'fa-tag'}
                                                    style={{
                                                        fontSize: '0.82rem',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}
                                                />
                                            )
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
                                                    border: isStamped
                                                        ? '2px solid #FFFFFF'
                                                        : `2px solid ${card.stampBorderColor || card.stamp_border_color || 'rgba(255, 255, 255, 0.7)'}`,
                                                    background: isStamped
                                                        ? 'linear-gradient(135deg, #10B981 0%, #059669 60%, #047857 100%)'
                                                        : (card.stampBgColor || card.stamp_background || 'rgba(255, 255, 255, 0.22)'),
                                                    color: isStamped ? '#FFFFFF' : (card.stampTextColor || card.stamp_text_color || 'inherit'),
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    textAlign: 'center',
                                                    fontSize: '0.85rem',
                                                    fontWeight: 800,
                                                    flexShrink: 0,
                                                    boxSizing: 'border-box',
                                                    position: 'relative',
                                                    boxShadow: isStamped
                                                        ? '0 4px 10px rgba(0, 0, 0, 0.35), 0 2px 4px rgba(16, 185, 129, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.4)'
                                                        : '0 2px 4px rgba(0, 0, 0, 0.1)',
                                                    padding: isStamped ? '2px' : 0
                                                }}
                                            >
                                                {isStamped ? (
                                                    <div
                                                        style={{
                                                            width: '100%',
                                                            height: '100%',
                                                            borderRadius: 'inherit',
                                                            border: '1px solid rgba(255, 255, 255, 0.65)',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            background: 'radial-gradient(circle at 35% 30%, rgba(255, 255, 255, 0.28) 0%, transparent 68%)',
                                                            boxSizing: 'border-box'
                                                        }}
                                                    >
                                                        <CardIcon
                                                            name="fa-check"
                                                            style={{
                                                                fontSize: '0.92rem',
                                                                color: '#FFFFFF',
                                                                filter: 'drop-shadow(0 1.5px 2px rgba(0, 0, 0, 0.4))',
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                lineHeight: 1
                                                            }}
                                                        />
                                                    </div>
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
                                                        <CardIcon name="fa-gift" style={{ fontSize: '0.45rem', lineHeight: 1 }} />
                                                    </span>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                                {(card.expires_at || card.expiry) && (
                                    <div style={{ fontSize: '0.68rem', opacity: 0.9, fontWeight: 700, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <CardIcon name="fa-calendar-alt" style={{ fontSize: '0.62rem' }} />
                                        <span>Expires: {formatExpiryDate(card.expires_at || card.expiry)}</span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* VALID THRU (TYPE 2) */
                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.25)', paddingTop: 6, maxWidth: 200, marginTop: 12 }}>
                                <small style={{ fontSize: '0.62rem', textTransform: 'uppercase', opacity: 0.85, letterSpacing: '0.5px', display: 'block', fontWeight: 600, lineHeight: 1.3 }}>
                                    Valid Thru
                                </small>
                                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'inherit', marginTop: 1, lineHeight: 1.35 }}>
                                    {formatExpiryDate(card.expires_at) || card.expiry || formatValidity(card.validityMonths)}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* RIGHT SIDE - QR CODE & SCAN LABEL */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                        }}
                    >
                        <div
                            style={{
                                background: '#FFFFFF',
                                padding: '4px',
                                borderRadius: 8,
                                zIndex: 999,
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <QRCodeCanvas
                                value={card.qr_token || (card.qrImg && typeof card.qrImg === 'string' && !card.qrImg.includes('/') && !card.qrImg.startsWith('data:') ? card.qrImg : '') || 'https://firstloop.co.in/'}
                                size={84}
                                fgColor={(card.qr_color && card.qr_color !== '#FFFFFF') ? card.qr_color : (card.qrColor && card.qrColor !== '#FFFFFF' ? card.qrColor : '#000000')}
                                bgColor="#FFFFFF"
                                style={{
                                    width: 84,
                                    height: 84,
                                    objectFit: 'contain',
                                    display: 'block'
                                }}
                            />
                        </div>

                        <small
                            style={{
                                fontSize: '0.6rem',
                                fontWeight: 700,
                                marginTop: 4,
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                opacity: 0.9,
                                whiteSpace: 'nowrap',
                                textAlign: 'center',
                                lineHeight: 1.3
                            }}
                        >
                            {scanText}
                        </small>
                    </div>
                </div>

                {/* POWERED BY (BOTTOM-RIGHT POSITION) */}
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        alignItems: 'center',
                        gap: 5,
                        fontSize: '0.65rem',
                        opacity: 0.9,
                        fontWeight: 600,
                        marginTop: 10,
                        lineHeight: 1
                    }}
                >
                    <span style={{ lineHeight: 1, display: 'inline-flex', alignItems: 'center' }}>
                        powered by
                    </span>
                    <img
                        src={fl_logo}
                        alt="FirstLoop"
                        crossOrigin="anonymous"
                        style={{
                            height: 13,
                            width: 'auto',
                            display: 'inline-block',
                            verticalAlign: 'middle',
                            objectFit: 'contain',
                            margin: '0 1px'
                        }}
                    />
                    <strong
                        style={{
                            color: 'inherit',
                            lineHeight: 1,
                            display: 'inline-flex',
                            alignItems: 'center'
                        }}
                    >
                        firstloop
                    </strong>
                </div>
            </div>
        </div>
    )
})

CustomerCard.displayName = 'CustomerCard'

export default CustomerCard
