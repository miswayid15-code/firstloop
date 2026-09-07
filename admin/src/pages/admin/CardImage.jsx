import { useState, useEffect, useRef } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import CustomerCard from '../../components/CustomerCard.jsx'
import { fetchCustomerStampLevelsApi } from '../../services/cardService.js'

/*
|--------------------------------------------------------------------------
| CARD-ONLY IMAGE / PREVIEW COMPONENT (CardImage.jsx)
| Displays strictly and ONLY the card itself.
| Zero headers, zero footers, zero navbars, zero back/download buttons.
| Public & free to access without any session/authentication.
|--------------------------------------------------------------------------
*/

export default function CardImage() {
    const { id: paramId, type: paramType } = useParams()
    const [searchParams] = useSearchParams()

    const rawType = searchParams.get('type') || paramType || '1'
    const cardType = Number(rawType) === 2 ? 2 : 1

    const rawCusId = searchParams.get('cus_id') || searchParams.get('customer_id') || '1'
    const cusId = Number(rawCusId) || 1

    const cardId = Number(paramId || searchParams.get('id')) || (paramId ? paramId : null)

    const cardRef = useRef(null)
    const [cardData, setCardData] = useState(null)
    const [loading, setLoading] = useState(Boolean(cardId))

    /*
    |--------------------------------------------------------------------------
    | PARSE PARAMS AS FALLBACK CARD (For real-time dynamic card rendering)
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

        return {
            id: cardId || 1,
            title: title || (cardType === 2 ? 'VIP Membership Pass' : 'Loyalty Stamp Card'),
            brandName: brandName || 'FirstLoop',
            brand_name: brandName || 'FirstLoop',
            brandLogo: logo || '',
            bgColor: bgColor || (cardType === 2 ? '#D97706' : '#0E88B8'),
            bg_color: bgColor || (cardType === 2 ? '#D97706' : '#0E88B8'),
            borderColor: borderColor || 'rgba(255,255,255,0.4)',
            border_color: borderColor || 'rgba(255,255,255,0.4)',
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

    /*
    |--------------------------------------------------------------------------
    | FETCH CARD (TYPE 1: STAMP, TYPE 2: MEMBERSHIP)
    |--------------------------------------------------------------------------
    */
    const fetchCardDetails = async () => {
        if (!cardId) {
            setCardData(getFallbackCardFromParams())
            setLoading(false)
            return
        }

        setLoading(true)

        try {
            const data = await fetchCustomerStampLevelsApi(cardId, cardType, cusId)
            if (data) {
                setCardData(data)
            } else {
                setCardData(getFallbackCardFromParams())
            }
        } catch (err) {
            console.error('Error fetching card details in CardImage:', err)
            setCardData(getFallbackCardFromParams())
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchCardDetails()
    }, [cardId, cardType, cusId])

    useEffect(() => {
        if (!cardData) return
        const brand = cardData.brandName || cardData.brand_name || 'FirstPass'
        const title = cardData.title || (cardType === 2 ? 'Membership Pass' : 'Stamp Card')
        document.title = `${brand} - ${title}`
    }, [cardData, cardType])

    if (loading) {
        return (
            <div
                style={{
                    minHeight: '100vh',
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'transparent'
                }}
            >
                <div
                    className="spinner-border"
                    role="status"
                    style={{
                        width: '2.5rem',
                        height: '2.5rem',
                        color: '#0E88B8'
                    }}
                >
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        )
    }

    const card = cardData || getFallbackCardFromParams()

    /*
    |--------------------------------------------------------------------------
    | RENDER CARD ONLY (Zero Headers, Footers, Navbars, or Action Buttons)
    |--------------------------------------------------------------------------
    */
    return (
        <div
            style={{
                minHeight: '100vh',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '16px',
                background: 'transparent',
                boxSizing: 'border-box'
            }}
        >
            <CustomerCard
                ref={cardRef}
                card={card}
                cardType={cardType}
            />
        </div>
    )
}
