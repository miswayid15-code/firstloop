import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import API from '../api.js'
import { fetchCustomerCardDetailsApi, formatExpiryDate, parsePerkTwoLines } from '../services/cardService.js'

/**
 * CustomerCardHistory Component (Popup Modal)
 * Displays full history, stamp levels, payment status, and summary for a customer card.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether modal is visible
 * @param {Function} props.onClose - Callback to close modal
 * @param {string|number} props.cardId - Card ID to fetch history for
 * @param {Object} [props.card] - Optional card object
 */
const CustomerCardHistory = ({ isOpen, onClose, cardId, card }) => {
    const navigate = useNavigate()
    const location = useLocation()
    const isMerchant = location.pathname.includes('/merchant')

    const [loading, setLoading] = useState(false)
    const [historyData, setHistoryData] = useState(null)
    const [error, setError] = useState(null)

    const activeCardId = cardId || card?.id

    useEffect(() => {
        if (!isOpen || !activeCardId) {
            setHistoryData(null)
            setError(null)
            return
        }

        let isMounted = true
        const fetchHistory = async () => {
            setLoading(true)
            setError(null)
            try {
                const data = await fetchCustomerCardDetailsApi(activeCardId)
                if (isMounted) {
                    if (data) {
                        setHistoryData(data)
                    } else {
                        setError('No history records found for this card.')
                    }
                }
            } catch (err) {
                console.error('Error fetching customer card history:', err)
                if (isMounted) {
                    setError('Failed to fetch card history details.')
                }
            } finally {
                if (isMounted) {
                    setLoading(false)
                }
            }
        }

        fetchHistory()

        return () => {
            isMounted = false
        }
    }, [isOpen, activeCardId])

    if (!isOpen) return null

    const customer = historyData?.customer
    const cardInfo = historyData?.card
    const summary = historyData?.summary
    const stampHistory = historyData?.stamp_history || historyData?.stamp_levels || historyData?.CustomerStampLevels || []
    const isCompleted = Number(cardInfo?.is_completed) === 1 || Number(card?.is_completed) === 1 || (summary?.total_stamps && Number(summary?.current_stamp) >= Number(summary?.total_stamps))
    const expiryDateVal = cardInfo?.expires_at || card?.expires_at || historyData?.expires_at || cardInfo?.expiry || card?.expiry || null

    const handleAddNewCard = () => {
        const branchId = cardInfo?.branch_id || card?.branch_id || ''
        const emailQuery = customer?.email ? `?email=${encodeURIComponent(customer.email)}` : ''
        onClose()
        if (isMerchant) {
            navigate(`/merchant/add-card-customer/${branchId}${emailQuery}`)
        } else {
            navigate(`/receptionist/add-card-customer/${branchId}${emailQuery}`)
        }
    }

    const formatDate = (dateStr) => {
        if (!dateStr) return '-'
        try {
            const d = new Date(dateStr)
            return d.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })
        } catch {
            return dateStr
        }
    }


    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(15, 23, 42, 0.8)',
                backdropFilter: 'blur(8px)',
                zIndex: 1100,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '16px'
            }}
            onClick={onClose}
        >
            <div
                style={{
                    width: '100%',
                    maxWidth: 1100,
                    maxHeight: '100vh',
                    background: '#FFFFFF',
                    borderRadius: 24,
                    boxShadow: '0 25px 60px -15px rgba(0,0,0,0.35)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    animation: 'fadeIn 0.2s ease-out'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* MODAL HEADER */}
                <div
                    style={{
                        padding: '20px 24px',
                        borderBottom: '1px solid #E2E8F0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: '#F8FAFC'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div
                            style={{
                                width: 44,
                                height: 44,
                                borderRadius: 14,
                                background: 'var(--firstloop-gradient-primary)',
                                color: '#FFFFFF',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.25rem',
                                boxShadow: '0 4px 12px rgba(14, 136, 184, 0.3)'
                            }}
                        >
                            <i className="fas fa-history" />
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#0F172A' }}>
                                    Customer Card History
                                </h3>
                                {cardInfo && (
                                    <span
                                        className="badge"
                                        style={{
                                            background: cardInfo.is_completed === 1 ? '#10B981' : 'var(--firstloop-primary)',
                                            color: '#FFFFFF',
                                            fontWeight: 700,
                                            padding: '4px 10px',
                                            borderRadius: 6,
                                            fontSize: '0.72rem'
                                        }}
                                    >
                                        {cardInfo.is_completed === 1 ? 'Completed Card' : `Stamp ${cardInfo.current_stamp || 0}`}
                                    </span>
                                )}
                                {expiryDateVal && (
                                    <span
                                        className="badge"
                                        style={{
                                            background: 'rgba(217, 119, 6, 0.12)',
                                            color: '#B45309',
                                            border: '1px solid rgba(217, 119, 6, 0.25)',
                                            fontWeight: 700,
                                            padding: '4px 10px',
                                            borderRadius: 6,
                                            fontSize: '0.72rem',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 4
                                        }}
                                    >
                                        <i className="far fa-calendar-alt" />
                                        Expires: {formatExpiryDate(expiryDateVal)}
                                    </span>
                                )}
                            </div>
                            {customer && (
                                <small style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                                    <strong>{customer.name}</strong> • {customer.phone} {customer.email ? `• ${customer.email}` : ''}
                                </small>
                            )}
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {isCompleted && (
                            <button
                                type="button"
                                className="btn btn-sm btn-primary"
                                onClick={handleAddNewCard}
                                style={{
                                    borderRadius: 10,
                                    fontWeight: 700,
                                    fontSize: '0.82rem',
                                    padding: '7px 14px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    boxShadow: '0 2px 8px rgba(14, 136, 184, 0.25)'
                                }}
                            >
                                <i className="fas fa-plus-circle" />
                                <span>Add New Card</span>
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                width: 36,
                                height: 36,
                                borderRadius: '50%',
                                border: '1px solid #E2E8F0',
                                background: '#FFFFFF',
                                color: '#64748B',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.1rem',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            &times;
                        </button>
                    </div>
                </div>

                {/* MODAL BODY */}
                <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '60px 0' }}>
                            <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }} />
                            <p style={{ marginTop: 14, fontWeight: 700, color: 'var(--text-muted)' }}>
                                Loading Card Details & History...
                            </p>
                        </div>
                    ) : error ? (
                        <div style={{ textAlign: 'center', padding: '40px 20px', background: '#FFF1F2', borderRadius: 16, border: '1px solid #FECDD3' }}>
                            <i className="fas fa-exclamation-circle" style={{ fontSize: '2rem', color: '#E11D48', marginBottom: 10 }} />
                            <h4 style={{ color: '#9F1239', fontWeight: 800, margin: '4px 0' }}>{error}</h4>
                            <p style={{ color: '#BE123C', fontSize: '0.85rem', margin: 0 }}>Please verify the card ID and try again.</p>
                        </div>
                    ) : (
                        <>
                            {/* COMPLETED CARD BANNER */}
                            {isCompleted && (
                                <div
                                    style={{
                                        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)',
                                        border: '1.5px solid rgba(16, 185, 129, 0.35)',
                                        borderRadius: 16,
                                        padding: '16px 20px',
                                        marginBottom: 20,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        flexWrap: 'wrap',
                                        gap: 12
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#10B981', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>
                                            <i className="fas fa-check-double" />
                                        </div>
                                        <div>
                                            <strong style={{ fontSize: '0.95rem', color: '#065F46', display: 'block' }}>
                                                Stamp Card Fully Completed!
                                            </strong>
                                            <small style={{ fontSize: '0.82rem', color: '#047857' }}>
                                                All stamps have been collected for this pass. You can now issue a new card to this customer.
                                            </small>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-primary"
                                        onClick={handleAddNewCard}
                                        style={{
                                            borderRadius: 10,
                                            fontWeight: 700,
                                            fontSize: '0.85rem',
                                            padding: '8px 16px',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 6,
                                            boxShadow: '0 4px 12px rgba(14, 136, 184, 0.3)'
                                        }}
                                    >
                                        <i className="fas fa-plus-circle" />
                                        <span>Add New Card</span>
                                    </button>
                                </div>
                            )}

                            {/* SUMMARY METRICS CARDS */}
                            {summary && (() => {
                                const freeStampsCount = stampHistory.filter(s => Number(s.free_stamp) === 1 || s.free_stamp === true || s.free_stamp === '1' || Boolean(s.free_text)).length
                                return (
                                <div
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                                        gap: 12,
                                        marginBottom: 24
                                    }}
                                >
                                    <div style={{ padding: 14, borderRadius: 14, background: '#F8FAFC', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Stamps</span>
                                        <h4 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '4px 0 0', color: '#0F172A' }}>{summary.total_stamps || 0}</h4>
                                    </div>

                                    <div style={{ padding: 14, borderRadius: 14, background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', textAlign: 'center' }}>
                                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#059669', textTransform: 'uppercase' }}>Completed</span>
                                        <h4 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '4px 0 0', color: '#059669' }}>{summary.completed_stamps || 0}</h4>
                                    </div>

                                    <div style={{ padding: 14, borderRadius: 14, background: 'rgba(2, 132, 199, 0.08)', border: '1px solid rgba(2, 132, 199, 0.25)', textAlign: 'center' }}>
                                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0284C7', textTransform: 'uppercase' }}>Discounts</span>
                                        <h4 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '4px 0 0', color: '#0284C7' }}>{summary.discount_stamps || 0}</h4>
                                    </div>

                                    <div style={{ padding: 14, borderRadius: 14, background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)', textAlign: 'center' }}>
                                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#D97706', textTransform: 'uppercase' }}>Paid Perks</span>
                                        <h4 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '4px 0 0', color: '#D97706' }}>{summary.paid_stamps || 0}</h4>
                                    </div>

                                    {freeStampsCount > 0 && (
                                        <div style={{ padding: 14, borderRadius: 14, background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', textAlign: 'center' }}>
                                            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#047857', textTransform: 'uppercase' }}>Free Perks</span>
                                            <h4 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '4px 0 0', color: '#047857' }}>{freeStampsCount}</h4>
                                        </div>
                                    )}

                                    <div style={{ padding: 14, borderRadius: 14, background: 'rgba(14, 136, 184, 0.1)', border: '1px solid rgba(14, 136, 184, 0.3)', textAlign: 'center' }}>
                                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--firstloop-primary)', textTransform: 'uppercase' }}>Total Paid</span>
                                        <h4 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '4px 0 0', color: 'var(--firstloop-primary)' }}>
                                            {Number(summary.total_paid_amount || 0).toFixed(2)}
                                        </h4>
                                    </div>

                                    {expiryDateVal && (
                                        <div style={{ padding: 14, borderRadius: 14, background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)', textAlign: 'center' }}>
                                            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#B45309', textTransform: 'uppercase' }}>Expires On</span>
                                            <h4 style={{ fontSize: '1rem', fontWeight: 800, margin: '6px 0 0', color: '#B45309' }}>
                                                {formatExpiryDate(expiryDateVal)}
                                            </h4>
                                        </div>
                                    )}
                                </div>
                                )
                            })()}

                            {/* STAMP LEVEL HISTORY TABLE */}
                            <div style={{ border: '1px solid #E2E8F0', borderRadius: 16, overflow: 'hidden' }}>
                                <div style={{ padding: '14px 18px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <strong style={{ fontSize: '0.9rem', color: '#0F172A' }}>
                                        Stamp Levels & Transaction History
                                    </strong>
                                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                        {stampHistory.length} total levels defined
                                    </span>
                                </div>

                                <div className="table-responsive">
                                    <table className="table table-hover mb-0" style={{ fontSize: '0.84rem' }}>
                                        <thead style={{ background: '#F8FAFC', color: 'var(--text-muted)' }}>
                                            <tr>
                                                <th style={{ padding: '10px 14px', fontWeight: 700 }}>Stamp</th>
                                                <th style={{ padding: '10px 14px', fontWeight: 700 }}>Reward / Perk</th>
                                                <th style={{ padding: '10px 14px', fontWeight: 700 }}>Type</th>
                                                <th style={{ padding: '10px 14px', fontWeight: 700 }}>Base</th>
                                                <th style={{ padding: '10px 14px', fontWeight: 700 }}>Discount</th>
                                                <th style={{ padding: '10px 14px', fontWeight: 700 }}>Paid Amount</th>
                                                <th style={{ padding: '10px 14px', fontWeight: 700 }}>Method</th>
                                                <th style={{ padding: '10px 14px', fontWeight: 700 }}>Status</th>
                                                <th style={{ padding: '10px 14px', fontWeight: 700 }}>Updated Date</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {stampHistory.length === 0 ? (
                                                <tr>
                                                    <td colSpan={9} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                                                        No stamp history records found.
                                                    </td>
                                                </tr>
                                            ) : (
                                                stampHistory.map((item) => {
                                                    const isPaid = Number(item.status) === 1
                                                    const rewardTypeStr = item.reward_type_text || (Number(item.reward_type) === 2 ? 'Discount' : (Number(item.reward_type) === 3 ? 'Paid' : 'Free'))
                                                    const hasFree = Number(item.free_stamp) === 1 || item.free_stamp === true || item.free_stamp === '1' || Boolean(item.free_text)
                                                    const freePerkText = item.free_text || ''

                                                    return (
                                                        <tr key={item.id} style={{ verticalAlign: 'middle' }}>
                                                            {/* STAMP CIRCLE */}
                                                            <td style={{ padding: '12px 14px' }}>
                                                                <div style={{ position: 'relative', width: 36, height: 36 }}>
                                                                    <div
                                                                        style={{
                                                                            width: 36,
                                                                            height: 36,
                                                                            borderRadius: '50%',
                                                                            background: isPaid ? 'var(--firstloop-gradient-primary)' : '#F1F5F9',
                                                                            color: isPaid ? '#FFFFFF' : '#64748B',
                                                                            display: 'flex',
                                                                            flexDirection: 'column',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'center',
                                                                            fontWeight: 800,
                                                                            fontSize: '0.8rem',
                                                                            border: isPaid ? 'none' : '1px dashed #CBD5E1',
                                                                            overflow: 'hidden',
                                                                            padding: '2px'
                                                                        }}
                                                                    >
                                                                        {isPaid ? (
                                                                            hasFree ? (
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
                                                                                    <i className="fas fa-heart" style={{ fontSize: '0.86rem', color: '#FFFFFF', filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.25))' }} />
                                                                                </div>
                                                                            ) : (
                                                                                item.icon ? <i className={`fas ${item.icon}`} /> : item.stamp_number
                                                                            )
                                                                        ) : (
                                                                            hasFree ? (() => {
                                                                                const perkLines = parsePerkTwoLines(freePerkText, rewardTypeStr, item.discount)
                                                                                return (
                                                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', lineHeight: 1.05 }}>
                                                                                        <span style={{ fontSize: perkLines.bottom ? '0.72rem' : '0.8rem', fontWeight: 800, color: '#334155' }}>
                                                                                            {perkLines.top}
                                                                                        </span>
                                                                                        {perkLines.bottom && (
                                                                                            <span
                                                                                                style={{
                                                                                                    fontSize: '0.44rem',
                                                                                                    fontWeight: 800,
                                                                                                    letterSpacing: '0.3px',
                                                                                                    textTransform: 'uppercase',
                                                                                                    color: '#64748B',
                                                                                                    marginTop: 1
                                                                                                }}
                                                                                            >
                                                                                                {perkLines.bottom}
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                )
                                                                            })() : (
                                                                                item.stamp_number
                                                                            )
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </td>

                                                            {/* REWARD TEXT & FREE PERK */}
                                                            <td style={{ padding: '12px 14px', color: '#0F172A' }}>
                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'flex-start' }}>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
                                                                        {item.icon && <i className={`fas ${item.icon}`} style={{ color: 'var(--firstloop-primary)' }} />}
                                                                        <span>{item.reward_text || `Stamp #${item.stamp_number}`}</span>
                                                                    </div>
                                                                    {hasFree && (
                                                                        <span
                                                                            className="badge"
                                                                            title={`Bonus Free Perk: ${freePerkText || 'Included'}`}
                                                                            style={{
                                                                                background: 'rgba(16, 185, 129, 0.12)',
                                                                                color: '#059669',
                                                                                border: '1px solid rgba(16, 185, 129, 0.25)',
                                                                                fontWeight: 700,
                                                                                padding: '3px 8px',
                                                                                borderRadius: 6,
                                                                                fontSize: '0.72rem',
                                                                                display: 'inline-flex',
                                                                                alignItems: 'center',
                                                                                gap: 5,
                                                                                lineHeight: 1.3
                                                                            }}
                                                                        >
                                                                            <i className="fas fa-gift" style={{ fontSize: '0.68rem' }} />
                                                                            <span>Free: {freePerkText || 'Bonus Perk'}</span>
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </td>

                                                            {/* REWARD TYPE */}
                                                            <td style={{ padding: '12px 14px' }}>
                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
                                                                    <span
                                                                        className="badge"
                                                                        style={{
                                                                            background: rewardTypeStr === 'Discount' ? 'rgba(2, 132, 199, 0.12)' : (rewardTypeStr === 'Paid' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.12)'),
                                                                            color: rewardTypeStr === 'Discount' ? '#0284C7' : (rewardTypeStr === 'Paid' ? '#D97706' : '#059669'),
                                                                            fontWeight: 800,
                                                                            padding: '4px 8px',
                                                                            borderRadius: 6,
                                                                            fontSize: '0.72rem'
                                                                        }}
                                                                    >
                                                                        {rewardTypeStr}
                                                                    </span>
                                                                    {hasFree && (
                                                                        <span
                                                                            className="badge"
                                                                            style={{
                                                                                background: 'rgba(16, 185, 129, 0.15)',
                                                                                color: '#047857',
                                                                                fontWeight: 800,
                                                                                padding: '2px 6px',
                                                                                borderRadius: 4,
                                                                                fontSize: '0.66rem',
                                                                                display: 'inline-flex',
                                                                                alignItems: 'center',
                                                                                gap: 3
                                                                            }}
                                                                        >
                                                                            <i className="fas fa-gift" style={{ fontSize: '0.6rem' }} /> +FREE
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </td>

                                                            {/* BASE AMOUNT */}
                                                            <td style={{ padding: '12px 14px' }}>
                                                                {Number(item.amt || 0).toFixed(2)}
                                                            </td>

                                                            {/* DISCOUNT */}
                                                            <td style={{ padding: '12px 14px', color: Number(item.discount || 0) > 0 ? '#0284C7' : 'var(--text-muted)', fontWeight: Number(item.discount || 0) > 0 ? 700 : 400 }}>
                                                                {Number(item.discount || 0) > 0 ? `${item.discount}%` : '-'}
                                                            </td>

                                                            {/* PAID AMOUNT */}
                                                            <td style={{ padding: '12px 14px', fontWeight: 800, color: isPaid ? 'var(--firstloop-primary)' : 'var(--text-muted)' }}>
                                                                {Number(item.paid_amt || item.payable_amount || 0).toFixed(2)}
                                                            </td>

                                                            {/* PAYMENT TYPE */}
                                                            <td style={{ padding: '12px 14px' }}>
                                                                {item.payment_type_text ? (
                                                                    <span style={{ fontWeight: 600 }}>
                                                                        <i className={item.payment_type === '1' || item.payment_type_text?.toLowerCase() === 'cash' ? 'fas fa-money-bill-wave text-success' : 'fas fa-credit-card text-primary'} style={{ marginRight: 4 }} />
                                                                        {item.payment_type_text}
                                                                    </span>
                                                                ) : '-'}
                                                            </td>

                                                            {/* STATUS */}
                                                            <td style={{ padding: '12px 14px' }}>
                                                                <span
                                                                    className="badge"
                                                                    style={{
                                                                        background: isPaid ? 'rgba(16, 185, 129, 0.15)' : 'rgba(148, 163, 184, 0.15)',
                                                                        color: isPaid ? '#059669' : '#64748B',
                                                                        fontWeight: 800,
                                                                        padding: '4px 8px',
                                                                        borderRadius: 6,
                                                                        fontSize: '0.72rem'
                                                                    }}
                                                                >
                                                                    {isPaid ? 'PAID' : 'PENDING'}
                                                                </span>
                                                            </td>

                                                            {/* UPDATED AT */}
                                                            <td style={{ padding: '12px 14px', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                                                                {isPaid ? formatDate(item.payment_date) : '-'}
                                                            </td>
                                                        </tr>
                                                    )
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* MODAL FOOTER */}
                <div
                    style={{
                        padding: '16px 24px',
                        borderTop: '1px solid #E2E8F0',
                        display: 'flex',
                        justifyContent: 'flex-end',
                        background: '#F8FAFC'
                    }}
                >
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={onClose}
                        style={{ padding: '8px 20px', borderRadius: 10, fontWeight: 700, fontSize: '0.85rem' }}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    )
}

export default CustomerCardHistory
