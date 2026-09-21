import React, { forwardRef } from 'react'
import fl_logo from '../assets/img/firstloop-favicon.png'
import { QRCodeCanvas } from 'qrcode.react'
import {
    formatImageUrl,
    getCardStyle,
    formatValidity,
    formatExpiryDate,
    parsePerkTwoLines
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
                maxWidth: 450,
                minHeight: 215,
                borderRadius: 20,
                ...getCardStyle(card, defaultBg),
                color: card.textColor || card.text_color || '#FFFFFF',
                padding: '16px 20px',
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
                {/* 1. TOP HEADER ROW: Left = Brand & Customer Info | Right = QR Code */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                    {/* BRAND & CUSTOMER INFO */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        {/* BRAND */}
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
                                    lineHeight: 1.25,
                                    display: 'inline-block'
                                }}
                            >
                                {card.brandName || card.brand_name || 'Merchant'}
                            </span>
                        </div>

                        {/* CARD TITLE */}
                        <div
                            style={{
                                fontSize: '0.84rem',
                                opacity: 0.95,
                                marginBottom: 3,
                                lineHeight: 1.3
                            }}
                        >
                            <strong>{card.title || (type === 2 ? 'Membership Pass' : 'Stamp Pass')}</strong>
                        </div>

                        {/* CARDHOLDER NAME */}
                        {cardholder && (
                            <div
                                style={{
                                    fontSize: '0.88rem',
                                    opacity: 0.95,
                                    fontWeight: 700,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 5,
                                    lineHeight: 1.3
                                }}
                            >
                                <CardIcon name="fa-user" style={{ fontSize: '0.72rem' }} />
                                <span>{cardholder}</span>
                            </div>
                        )}
                    </div>

                    {/* RIGHT SIDE - QR CODE & SCAN LABEL */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'flex-start',
                            flexShrink: 0
                        }}
                    >
                        <div
                            style={{
                                background: '#FFFFFF',
                                padding: '3px',
                                borderRadius: 6,
                                zIndex: 999,
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <QRCodeCanvas
                                value={card.qr_token || (card.qrImg && typeof card.qrImg === 'string' && !card.qrImg.includes('/') && !card.qrImg.startsWith('data:') ? card.qrImg : '') || 'https://firstloop.co.in/'}
                                size={56}
                                fgColor={(card.qr_color && card.qr_color !== '#FFFFFF') ? card.qr_color : (card.qrColor && card.qrColor !== '#FFFFFF' ? card.qrColor : '#000000')}
                                bgColor="#FFFFFF"
                                style={{
                                    width: 56,
                                    height: 56,
                                    objectFit: 'contain',
                                    display: 'block'
                                }}
                            />
                        </div>

                        <small
                            style={{
                                fontSize: '0.52rem',
                                fontWeight: 700,
                                marginTop: 2,
                                textTransform: 'uppercase',
                                letterSpacing: '0.35px',
                                opacity: 0.9,
                                whiteSpace: 'nowrap',
                                textAlign: 'center',
                                lineHeight: 1.15
                            }}
                        >
                            {scanText}
                        </small>
                    </div>
                </div>

                {/* 2. MIDDLE SECTION: STAMP GRID (TYPE 1) OR VALID THRU (TYPE 2) */}
                {type === 1 ? (
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

                                const inheritedRewards = Array.isArray(rewardItem?.InheritedRewards) ? rewardItem.InheritedRewards : []
                                const hasInheritedFree = inheritedRewards.some(r => Number(r.free_stamp) === 1 || r.free_stamp === true || r.free_stamp === '1')
                                const hasFreeStamp = rewardItem && (Number(rewardItem.free_stamp) === 1 || rewardItem.free_stamp === true || rewardItem.free_stamp === '1' || hasInheritedFree || Boolean(rewardItem.free_text))
                                const freeTextDesc = rewardItem?.free_text || (inheritedRewards.map(r => r.free_text).filter(Boolean).join(', ')) || ''

                                const perkLines = hasFreeStamp
                                    ? parsePerkTwoLines(freeTextDesc, rType, rType === 'Discount' ? (rewardItem?.discount ?? rewardItem?.discountVal) : null)
                                    : null

                                let iconMarkup = null
                                if (rewardItem && rType === 'Free') {
                                    iconMarkup = (
                                        <CardIcon
                                            name={rewardItem.icon || 'fa-gift'}
                                            style={{
                                                fontSize: '0.88rem',
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
                                                fontSize: '0.76rem',
                                                fontWeight: 800,
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                lineHeight: 1
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
                                                fontSize: '0.88rem',
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
                                                fontSize: '0.88rem',
                                                fontWeight: 800,
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                lineHeight: 1
                                            }}
                                        >
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
                                                ? '2px solid #FFFFFF'
                                                : `2px solid ${card.stampBorderColor || card.stamp_border_color || 'rgba(255, 255, 255, 0.7)'}`,
                                            background: isStamped
                                                ? 'linear-gradient(135deg, #10B981 0%, #059669 60%, #047857 100%)'
                                                : (card.stampBgColor || card.stamp_background || 'rgba(255, 255, 255, 0.22)'),
                                            color: isStamped ? '#FFFFFF' : (card.stampTextColor || card.stamp_text_color || 'inherit'),
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
                                            boxShadow: isStamped
                                                ? '0 4px 10px rgba(0, 0, 0, 0.35), 0 2px 4px rgba(16, 185, 129, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.4)'
                                                : '0 2px 4px rgba(0, 0, 0, 0.1)',
                                            padding: '2px',
                                            overflow: 'hidden'
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
                                                <CardIcon
                                                    name="fa-heart"
                                                    style={{
                                                        fontSize: '0.92rem',
                                                        color: '#FFFFFF',
                                                        filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.25))',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}
                                                />
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
                    {(card.expires_at || card.expiry) ? (
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
                            <span>Expires: {formatExpiryDate(card.expires_at || card.expiry)}</span>
                        </div>
                    ) : (
                        <div />
                    )}

                    {/* Right: Powered by Pill Badge */}
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
                        <span style={{ lineHeight: 1, display: 'inline-flex', alignItems: 'center' }}>
                            powered by
                        </span>
                        <img
                            src={fl_logo}
                            alt="FirstLoop"
                            crossOrigin="anonymous"
                            style={{
                                height: 12,
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
                                alignItems: 'center',
                                fontWeight: 800
                            }}
                        >
                            firstloop
                        </strong>
                    </div>
                </div>
            </div>
        </div>
    )
})

CustomerCard.displayName = 'CustomerCard'

export default CustomerCard
