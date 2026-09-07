import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import html2canvas from 'html2canvas'
import CustomerCard from '../../components/CustomerCard.jsx'
import { fetchCustomerStampLevelsApi } from '../../services/cardService.js'

/*
|--------------------------------------------------------------------------
| PUBLIC & FREE CARD PREVIEW COMPONENT
| (Does not require any active session / authentication token)
|--------------------------------------------------------------------------
*/

export default function CardPreview() {
    const navigate = useNavigate()
    const { id: paramId, type: paramType } = useParams()
    const [searchParams] = useSearchParams()

    const rawType = searchParams.get('type') || paramType || '1'
    const cardType = Number(rawType) === 2 ? 2 : 1

    const rawCusId = searchParams.get('cus_id') || searchParams.get('customer_id') || '1'
    const cusId = Number(rawCusId) || 1

    const cardId = Number(paramId || searchParams.get('id')) || (paramId ? paramId : null)

    const cardRef = useRef(null)
    const [downloading, setDownloading] = useState(false)
    const [cardData, setCardData] = useState(null)
    const [loading, setLoading] = useState(Boolean(cardId))

    /*
    |--------------------------------------------------------------------------
    | PARSE PARAMS AS FALLBACK CARD (For real-time preview without API save)
    |--------------------------------------------------------------------------
    */
    const getFallbackCardFromParams = () => {
        const title = searchParams.get('title') || searchParams.get('name')
        const brandName = searchParams.get('brand') || searchParams.get('brand_name') || searchParams.get('brandName')
        const bgColor = searchParams.get('bgColor') || searchParams.get('bg_color')
        const borderColor = searchParams.get('borderColor') || searchParams.get('border_color')
        const bgImage = searchParams.get('bgImage') || searchParams.get('bg_image') || searchParams.get('background_image')
        const logo = searchParams.get('logo') || searchParams.get('brand_logo') || searchParams.get('brand_image')
        const totalStamps = Number(searchParams.get('stamps') || searchParams.get('total_stamps') || searchParams.get('number_of_stamps')) || 8
        const discountVal = searchParams.get('discount') || searchParams.get('discountVal') || searchParams.get('percentage') || '10'
        const validity = searchParams.get('validity') || '12 Months'
        const description = searchParams.get('description') || ''

        if (title || brandName || bgColor || borderColor || cardId) {
            return {
                id: cardId || 1,
                title: title || (cardType === 2 ? 'VIP Membership Pass' : 'Loyalty Stamp Card'),
                brandName: brandName || 'FirstLoop',
                brand_name: brandName || 'FirstLoop',
                brandLogo: logo || '',
                bgColor: bgColor || '#0E88B8',
                bg_color: bgColor || '#0E88B8',
                borderColor: borderColor || '#FFFFFF',
                border_color: borderColor || '#FFFFFF',
                bgImage: bgImage || '',
                background_image: bgImage || '',
                totalStamps: totalStamps,
                number_of_stamps: totalStamps,
                collected: 0,
                current_stamp: 0,
                discountVal: discountVal,
                discount: discountVal,
                validity: validity,
                description: description,
                card_type: cardType,
                type: cardType,
                stamp_levels: Array.from({ length: totalStamps }, (_, i) => ({
                    id: i + 1,
                    stamp_number: i + 1,
                    stamp: i + 1,
                    type: i + 1 === totalStamps ? 'Discount' : 'Free Item',
                    reward: i + 1 === totalStamps ? `${discountVal}% OFF Reward` : 'Free Reward',
                    reward_text: i + 1 === totalStamps ? `${discountVal}% OFF Reward` : 'Free Reward',
                    status: 0
                }))
            }
        }
        return null
    }

    /*
    |--------------------------------------------------------------------------
    | FETCH CARD (TYPE 1: STAMP, TYPE 2: MEMBERSHIP)
    |--------------------------------------------------------------------------
    */

    const fetchCardDetails = async () => {
        if (!cardId) {
            const fallback = getFallbackCardFromParams()
            setCardData(fallback)
            setLoading(false)
            return
        }

        setLoading(true)

        try {
            const data = await fetchCustomerStampLevelsApi(cardId, cardType, cusId)
            if (data) {
                setCardData(data)
            } else {
                // Try fallback from URL parameters if available
                const fallback = getFallbackCardFromParams()
                setCardData(fallback)
            }
        } catch (err) {
            console.error('Error fetching card details:', err)
            const fallback = getFallbackCardFromParams()
            setCardData(fallback)
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
        fetchCardDetails()
    }, [cardId, cardType, cusId])

    /*
    |--------------------------------------------------------------------------
    | BROWSER TAB TITLE
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        if (!cardData) return

        const brand = cardData.brandName || cardData.brand_name || 'Merchant'
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
    | HANDLE BACK
    |--------------------------------------------------------------------------
    */
    const handleBack = () => {
        if (window.history.length > 1) {
            navigate(-1)
        } else {
            navigate('/')
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
                        height: '2.5rem',
                        color: 'var(--firstloop-primary, #0E88B8)'
                    }}
                >
                    <span className="visually-hidden">Loading...</span>
                </div>
                <div style={{ color: 'var(--text-muted, #64748B)', fontSize: '0.9rem', fontWeight: 600 }}>
                    Loading Card Preview...
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
                        padding: 32,
                        borderRadius: 20,
                        textAlign: 'center',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
                        maxWidth: 420,
                        width: '100%',
                        border: '1px solid #E2E8F0'
                    }}
                >
                    <div
                        style={{
                            width: 60,
                            height: 60,
                            borderRadius: '50%',
                            background: 'rgba(239, 68, 68, 0.1)',
                            color: '#EF4444',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 16px',
                            fontSize: '1.5rem'
                        }}
                    >
                        <i className="fas fa-id-card-alt" />
                    </div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1E293B', marginBottom: 8 }}>
                        {cardType === 2 ? 'Membership Pass Not Found' : 'Stamp Card Not Found'}
                    </h3>
                    <p style={{ marginBottom: 20, color: '#64748B', fontSize: '0.88rem', lineHeight: 1.5 }}>
                        The requested card could not be loaded. Please check the URL or card ID.
                    </p>
                    <button
                        type="button"
                        onClick={handleBack}
                        style={{
                            padding: '10px 24px',
                            borderRadius: 12,
                            background: '#0E88B8',
                            color: '#FFFFFF',
                            fontWeight: 700,
                            fontSize: '0.88rem',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            boxShadow: '0 4px 12px rgba(14, 136, 184, 0.25)'
                        }}
                    >
                        <i className="fas fa-arrow-left" />
                        <span>Go Back</span>
                    </button>
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
                gap: 16
            }}
        >
            {/* TOP BAR: BACK NAVIGATION BUTTON */}
            <div style={{ width: '100%', maxWidth: 420, display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
                <button
                    type="button"
                    onClick={handleBack}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '8px 16px',
                        borderRadius: 10,
                        background: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        color: '#1E293B',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                        transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#F1F5F9'
                        e.currentTarget.style.borderColor = '#CBD5E1'
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#FFFFFF'
                        e.currentTarget.style.borderColor = '#E2E8F0'
                    }}
                >
                    <i className="fas fa-arrow-left" style={{ color: '#0E88B8' }} />
                    <span>Back</span>
                </button>
            </div>

            {/* REUSABLE CUSTOMER CARD COMPONENT */}
            <CustomerCard
                ref={cardRef}
                card={card}
                cardType={cardType}
            />

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