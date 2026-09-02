import { useState, useEffect, useRef } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import html2canvas from 'html2canvas'
import CustomerCard from '../../components/CustomerCard.jsx'
import { fetchCustomerStampLevelsApi } from '../../services/cardService.js'

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
            const data = await fetchCustomerStampLevelsApi(cardId, cardType, cusId)
            setCardData(data)
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