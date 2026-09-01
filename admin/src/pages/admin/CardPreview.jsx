import { useState, useEffect, useRef } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import html2canvas from 'html2canvas'
import API from '../../api.js'
import fl_logo from '../../assets/img/firstloop-favicon.png'
import { QRCodeCanvas } from 'qrcode.react'
import {
    getRelativeImagePath,
    formatImageUrl,
    getCardStyle,
    formatValidity
} from '../../services/cardService.js'

/*
|--------------------------------------------------------------------------
| CARD PREVIEW COMPONENT
|--------------------------------------------------------------------------
*/

export default function CardPreview() {
    const { id: paramId, type: paramType } = useParams()
    const [searchParams] = useSearchParams()

    const rawType = searchParams.get('type') || paramType || '1'
    const cardType = Number(rawType) === 2 ? 2 : 1

    const rawCusId = searchParams.get('cus_id') || searchParams.get('customer_id') || '1'
    const cusId = Number(rawCusId) || 1

    const cardId = Number(paramId || searchParams.get('id'))

    const cardRef = useRef(null)
    const [downloading, setDownloading] = useState(false)
    const [cardData, setCardData] = useState(null)
    const [loading, setLoading] = useState(true)

    /*
    |--------------------------------------------------------------------------
    | FETCH CARD (TYPE 1: STAMP, TYPE 2: MEMBERSHIP)
    |--------------------------------------------------------------------------
    */

    const fetchCardDetails = async () => {
        if (!cardId) {
            setLoading(false)
            return
        }

        setLoading(true)

        try {
            // console.log(`CardPreview: Fetching card - ID: ${cardId}, Type: ${cardType}, CusID: ${cusId}`)

            const response = await API.post('firstloop/customer/fetch-card', {
                id: Number(cardId),
                type: Number(cardType),
                cus_id: Number(cusId)
            })

            // console.log('CardPreview API Response:', response?.data)

            if (response?.data?.status !== 1) {
                console.error('Failed to fetch card:', response?.data?.msg)
                setCardData(null)
                return
            }

            const rawItem = response?.data?.data
            const item = Array.isArray(rawItem) ? rawItem[0] : rawItem

            if (!item) {
                console.error('No card data found in response for ID:', cardId)
                setCardData(null)
                return
            }

            // console.log('CardPreview Parsed Item:', item)

            if (cardType === 1) {
                // TYPE 1: STAMP CARD
                const totalStamps = Number(item.number_of_stamps) || 8
                const stampLevels = Array.isArray(item.StampLevels)
                    ? item.StampLevels
                    : Array.isArray(item.stamp_levels)
                        ? item.stamp_levels
                        : []

                const formattedStamp = {
                    id: Number(item.id),
                    card_type: 1,
                    title: item.title || 'Stamp Pass',
                    brandName: item.brand_name || 'Merchant',
                    brandLogo: item.brand_image ? getRelativeImagePath(item.brand_image) : null,
                    total_stamps: totalStamps,
                    cardholderName: item.customer?.name || 'Stamp Passs',
                    reward: item.reward || 'Special Gift',
                    active_members: Number(item.active_members) || 0,
                    status: Number(item.status) === 1 ? 'Active' : 'Inactive',
                    bgColor: item.background_color || '#0E88B8',
                    bgImage: item.background_image ? getRelativeImagePath(item.background_image) : null,
                    textColor: item.text_color || '#FFFFFF',
                    borderColor: item.border_color || '#00A6D6',
                    stampBgColor: item.stamp_background || 'rgba(255, 255, 255, 0.3)',
                    stampBorderColor: item.stamp_border_color || '#FFFFFF',
                    stampTextColor: item.stamp_text_color || '#FFFFFF',
                    stamp_radius: Number(item.stamp_radius ?? 50),
                    qrImg: item.qr_token,
                    customer_name: item.customer_name,
                    branch_ids: Array.isArray(item.branch_ids)
                        ? item.branch_ids.map(Number)
                        : item.branch_id
                            ? [Number(item.branch_id)]
                            : [],
                    levelRewards: stampLevels.length > 0
                        ? stampLevels.map((lvl, idx) => {
                            const rawType = String(lvl.reward_type ?? lvl.type ?? '').trim().toLowerCase()
                            const isDiscount = rawType === '2' || rawType === 'discount'
                            const isPaid = rawType === '3' || rawType === 'paid'
                            const rType = isDiscount ? 'Discount' : (isPaid ? 'Paid' : 'Free')
                            return {
                                stamp: Number(lvl.stamp_number || lvl.stamp) || idx + 1,
                                reward: lvl.reward_text || (isDiscount ? 'Discount' : (isPaid ? 'Paid' : 'Free Item')),
                                type: rType,
                                discountVal: isDiscount ? (parseFloat(lvl.discount ?? lvl.discountVal ?? lvl.reward_text) || 10) : 0,
                                icon: lvl.icon || (isDiscount ? 'fa-percent' : (isPaid ? 'fa-tag' : 'fa-gift')),
                                amt: Number(lvl.amt) || 0
                            }
                        })
                        : Array.from({ length: totalStamps }).map((_, i) => ({
                            stamp: i + 1,
                            reward: `Stamp #${i + 1}`,
                            type: 'Free',
                            discountVal: 0,
                            icon: 'fa-gift',
                            amt: 0
                        }))
                }

                setCardData(formattedStamp)
            } else {
                // TYPE 2: MEMBERSHIP CARD
                const formattedMembership = {
                    id: Number(item.id),
                    card_type: 2,
                    title: item.title || item.name || 'Membership Pass',
                    brandName: item.brand_name || 'Merchant',
                    brandLogo: item.brand_image ? getRelativeImagePath(item.brand_image) : null,
                    cardholderName: item.customer?.name || 'Member Pass',
                    qrImg: item.qr_token,
                    validityMonths: item.month || item.validityMonths || item.totalMonth,
                    expiry: item.expires_at,
                    bgColor: item.background_color || '#D97706',
                    bgImage: item.background_image ? getRelativeImagePath(item.background_image) : null,
                    textColor: item.text_color || '#FFFFFF',
                    borderColor: item.border_color || '#EA1031',
                    branch_ids: Array.isArray(item.branch_ids)
                        ? item.branch_ids.map(Number)
                        : item.branch_id
                            ? [Number(item.branch_id)]
                            : [],
                    status: Number(item.status) === 1 ? 'Active' : 'Inactive'
                }

                setCardData(formattedMembership)
            }
        } catch (err) {
            console.error('Error fetching card details from API:', err)
            setCardData(null)
        } finally {
            setLoading(false)
        }
    }

    /*
    |--------------------------------------------------------------------------
    | LOAD CARD WHEN ID, TYPE, OR CUS_ID CHANGES
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        if (cardId) {
            fetchCardDetails()
        } else {
            setLoading(false)
        }
    }, [cardId, cardType, cusId])

    /*
    |--------------------------------------------------------------------------
    | BROWSER TAB TITLE
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        if (!cardData) return

        const brand = cardData.brandName || 'Merchant'
        const title = cardData.title || (cardType === 2 ? 'Membership Pass' : 'Digital Stamp Card')

        document.title = `${brand} - ${title}`
    }, [cardData, cardType])

    /*
    |--------------------------------------------------------------------------
    | DOWNLOAD CARD AS PNG
    |--------------------------------------------------------------------------
    */

    const handleDownload = async () => {
        if (!cardRef.current || !cardData) return
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
            const rawName = cardData.title || cardData.name || (cardType === 2 ? 'membership-pass' : 'stamp-card')
            const fileName = rawName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'card-pass'
            const link = document.createElement('a')
            link.href = image
            link.download = `${fileName}.png`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
        } catch (error) {
            console.error('Error downloading card canvas:', error)
        } finally {
            setDownloading(false)
        }
    }

    /*
    |--------------------------------------------------------------------------
    | LOADING STATE
    |--------------------------------------------------------------------------
    */

    if (loading) {
        return (
            <div
                style={{
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 16,
                    background: '#F8FAFC'
                }}
            >
                <div
                    className="spinner-border text-primary"
                    role="status"
                    style={{
                        width: '2.5rem',
                        height: '2.5rem'
                    }}
                >
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        )
    }

    /*
    |--------------------------------------------------------------------------
    | CARD NOT FOUND
    |--------------------------------------------------------------------------
    */

    if (!cardData) {
        return (
            <div
                style={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#F8FAFC',
                    padding: 20
                }}
            >
                <div
                    style={{
                        background: '#FFFFFF',
                        padding: 30,
                        borderRadius: 16,
                        textAlign: 'center',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
                    }}
                >
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1E293B', marginBottom: 8 }}>
                        {cardType === 2 ? 'Membership Pass Not Found' : 'Stamp Card Not Found'}
                    </h3>
                    <p style={{ marginBottom: 0, color: '#64748B', fontSize: '0.9rem' }}>
                        The requested card could not be found.
                    </p>
                </div>
            </div>
        )
    }

    const card = cardData

    /*
    |--------------------------------------------------------------------------
    | RENDER CARD (UNIFIED DIMENSIONS & FIXED POSITIONS)
    |--------------------------------------------------------------------------
    */

    const defaultBg = cardType === 2 ? '#D97706' : '#0E88B8'
    const scanText = cardType === 2 ? 'SCAN PASS' : 'SCAN TO STAMP'
    const canvasId = cardType === 2 ? 'membership-pass-preview-canvas' : 'stamp-card-preview-canvas'

    return (
        <div
            style={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '28px 16px',
                background: '#F8FAFC',
                gap: 20
            }}
        >
            {/* CARD CANVAS */}
            <div
                ref={cardRef}
                id={canvasId}
                style={{
                    width: '100%',
                    maxWidth: 420,
                    minHeight: 240,
                    borderRadius: 22,
                    ...getCardStyle(card, defaultBg),
                    color: card.textColor || '#FFFFFF',
                    padding: '22px 22px 16px 22px',
                    boxShadow: '0 20px 45px -10px rgba(0,0,0,0.3)',
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    overflow: 'hidden'
                }}
            >
                <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
                    {/* Top / Main Body (Left Info + Right QR Code) */}
                    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                        {/* LEFT COLUMN */}
                        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', minHeight: 156, justifyContent: cardType === 2 ? 'space-between' : 'flex-start' }}>
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
                                            src={formatImageUrl(card.brandLogo) || fl_logo}
                                            alt="Logo"
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
                                        {card.brandName || 'Merchant'}
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
                                    <strong>{card.title}</strong>
                                </div>

                                {/* CARDHOLDER NAME */}
                                <div
                                    style={{
                                        fontSize: '0.95rem',
                                        opacity: 0.95,
                                        fontWeight: 700,
                                        marginBottom: cardType === 1 ? 8 : 0,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 6,
                                        lineHeight: 1.35
                                    }}
                                >
                                    <i className="fas fa-user" style={{ fontSize: '0.75rem', lineHeight: 1, verticalAlign: '0' }} />
                                    <span>{card.cardholderName || (cardType === 2 ? 'Member Pass' : 'Stamp Pass')}</span>
                                </div>
                            </div>

                            {/* TYPE SPECIFIC DETAILS */}
                            {cardType === 1 ? (
                                /* STAMP GRID (TYPE 1) */
                                <div
                                    style={{
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        gap: 6,
                                        maxWidth: 220
                                    }}
                                >
                                    {Array.from({
                                        length: Number(card.total_stamps || 8)
                                    }).map((_, i) => {
                                        const rewardItem = card.levelRewards ? card.levelRewards[i] : null
                                        let iconMarkup = null

                                        if (rewardItem && rewardItem.type === 'Free') {
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
                                        } else if (rewardItem && rewardItem.type === 'Discount') {
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
                                                    {rewardItem.discountVal || 10}%
                                                </span>
                                            )
                                        } else if (rewardItem && rewardItem.type === 'Paid') {
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
                                                    borderRadius: `${card.stamp_radius ?? 50}%`,
                                                    border: `2px solid ${card.stampBorderColor || '#FFFFFF'}`,
                                                    background: card.stampBgColor || 'rgba(255, 255, 255, 0.3)',
                                                    color: card.stampTextColor || 'inherit',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    textAlign: 'center',
                                                    flexShrink: 0,
                                                    boxSizing: 'border-box'
                                                }}
                                            >
                                                {iconMarkup}
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : (
                                /* VALID THRU (TYPE 2) */
                                <div style={{ borderTop: '1px solid rgba(255,255,255,0.25)', paddingTop: 6, maxWidth: 200, marginTop: 12 }}>
                                    <small style={{ fontSize: '0.62rem', textTransform: 'uppercase', opacity: 0.85, letterSpacing: '0.5px', display: 'block', fontWeight: 600, lineHeight: 1.3 }}>
                                        Valid Thru
                                    </small>
                                    <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'inherit', marginTop: 1, lineHeight: 1.35 }}>
                                        {card.expiry || formatValidity(card.validityMonths)}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* RIGHT SIDE - QR CODE & SCAN LABEL (EXACT FIXED DIMENSION & POSITION) */}
                        <div
                            style={{
                                width: 96,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                marginTop: 4
                            }}
                        >
                            <QRCodeCanvas
                                value={card.qrImg || 'firstloop'}
                                size={92}
                                style={{
                                    width: 92,
                                    height: 92,
                                    objectFit: 'contain',
                                    display: 'block'
                                }}
                            />
                            <small
                                style={{
                                    fontSize: '0.62rem',
                                    fontWeight: 700,
                                    marginTop: 8,
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

                    {/* POWERED BY (EXACT FIXED BOTTOM-RIGHT POSITION) */}
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
                            firstloop.co.in
                        </strong>
                    </div>
                </div>
            </div>

            {/* ACTION BAR: DOWNLOAD BUTTON */}
            <div style={{ width: '100%', maxWidth: 420, display: 'flex', justifyContent: 'center' }}>
                <button
                    type="button"
                    onClick={handleDownload}
                    disabled={downloading}
                    style={{
                        width: '100%',
                        padding: '12px 20px',
                        borderRadius: 14,
                        background: '#0E88B8',
                        color: '#FFFFFF',
                        fontWeight: 700,
                        fontSize: '0.92rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 10,
                        border: 'none',
                        cursor: downloading ? 'not-allowed' : 'pointer',
                        boxShadow: '0 6px 18px rgba(14, 136, 184, 0.28)',
                        opacity: downloading ? 0.75 : 1,
                        transition: 'all 0.2s ease'
                    }}
                >
                    <i className={`fas ${downloading ? 'fa-spinner fa-spin' : 'fa-download'}`} style={{ fontSize: '1rem' }} />
                    <span>{downloading ? 'Downloading...' : `Download ${card.title || (cardType === 2 ? 'Membership Pass' : 'Stamp Card')}`}</span>
                </button>
            </div>
        </div>
    )
}