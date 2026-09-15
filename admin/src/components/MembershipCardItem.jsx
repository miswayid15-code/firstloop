import React from 'react'
import flLogo from '../assets/img/firstloop-favicon.png'
import qrImg from '../assets/img/qr-img.png'
import { getCardStyle, formatImageUrl, formatValidity } from '../services/cardService.js'

export default function MembershipCardItem({
    card,
    merchantName = '',
    onEdit,
    onPreview,
    onDelete
}) {
    if (!card) return null

    const brandName = card.brandName || merchantName || 'FirstLoop'
    const brandLogo = card.brandLogo ? formatImageUrl(card.brandLogo) : flLogo
    const cardTitle = card.name || card.title || 'Membership Card'
    const cardholder = card.cardholderName || card.cardholder_name || 'Member Pass'
    const validityText = formatValidity(card.month)

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
            {/* DIGITAL MEMBERSHIP PASS CANVAS */}
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
                    minHeight: 210
                }}
            >
                <div style={{ position: 'relative', zIndex: 2 }}>
                    {/* Header Row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div
                                style={{
                                    width: 34,
                                    height: 34,
                                    borderRadius: 10,
                                    background: '#FFFFFF',
                                    padding: 4,
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
                            <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'inherit' }}>
                                {brandName}
                            </span>
                        </div>
                    </div>

                    {/* Middle Section: Info + Large Middle QR Code */}
                    <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 10 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'inherit', wordBreak: 'break-word' }}>
                                {cardTitle}
                            </div>
                            <div style={{ fontSize: '0.82rem', opacity: 0.9, marginTop: 4, fontWeight: 700 }}>
                                {cardholder}
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
                            <img
                                src={qrImg}
                                alt="QR Code"
                                style={{ width: 92, height: 92, objectFit: 'contain', flexShrink: 0 }}
                            />
                            <small style={{ fontSize: '0.6rem', fontWeight: 700, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.9 }}>
                                SCAN PASS
                            </small>
                        </div>
                    </div>

                    {/* Bottom Right Logo Badge */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 5, fontSize: '0.65rem', opacity: 0.9, fontWeight: 600, marginTop: 6, lineHeight: 1 }}>
                        <span style={{ lineHeight: 1, display: 'inline-flex', alignItems: 'center' }}>powered by</span>
                        <img src={flLogo} alt="FirstLoop" style={{ height: 13, width: 'auto', display: 'inline-block', verticalAlign: 'middle', objectFit: 'contain', margin: '0 1px' }} />
                        <strong style={{ color: 'inherit', lineHeight: 1, display: 'inline-flex', alignItems: 'center' }}>firstloop</strong>
                    </div>
                </div>
            </div>

            {/* Membership Action Bar */}
            <div style={{ display: 'flex', gap: 10, padding: '0 4px' }}>
                {onEdit && (
                    <button
                        type="button"
                        className="btn"
                        onClick={() => onEdit(card)}
                        style={{
                            flex: 1,
                            padding: '8px 14px',
                            fontSize: '0.82rem',
                            borderRadius: 8,
                            background: 'rgba(217, 119, 6, 0.12)',
                            color: '#D97706',
                            fontWeight: 700,
                            border: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6
                        }}
                    >
                        <i className="fas fa-edit" />
                        <span>Edit Pass Design</span>
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
