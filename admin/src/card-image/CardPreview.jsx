import React, { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import CustomerCard from '../components/CustomerCard.jsx'
import { fetchCustomerStampLevelsApi } from '../services/cardService.js'

/**
 * Standalone CardPreview Component specifically for card-image preview/generation.
 * Contains ONLY the card itself.
 * NO Back button, NO Download button, NO Page Header, NO Page Layout, NO Navbar, NO Footer, NO Extra text.
 */
export default function CardPreview({ card: propCard, cardType: propCardType }) {
    const { id: paramId, type: paramType } = useParams()
    const [searchParams] = useSearchParams()

    const rawType = propCardType || searchParams.get('type') || paramType || '1'
    const cardType = Number(rawType) === 2 ? 2 : 1

    const rawCusId = searchParams.get('cus_id') || searchParams.get('customer_id') || '1'
    const cusId = Number(rawCusId) || 1

    const cardId = Number(paramId || searchParams.get('id')) || (paramId ? paramId : null)

    const [cardData, setCardData] = useState(propCard || null)
    const [loading, setLoading] = useState(!propCard && Boolean(cardId))

    const getFallbackCard = () => {
        const title = searchParams.get('title') || searchParams.get('name')
        const brandName = searchParams.get('brand') || searchParams.get('brand_name') || searchParams.get('brandName')
        const bgColor = searchParams.get('bgColor') || searchParams.get('bg_color')
        const borderColor = searchParams.get('borderColor') || searchParams.get('border_color')
        const bgImage = searchParams.get('bgImage') || searchParams.get('bg_image') || searchParams.get('background_image')
        const logo = searchParams.get('logo') || searchParams.get('brand_logo') || searchParams.get('brand_image')
        const totalStamps = Number(searchParams.get('stamps') || searchParams.get('total_stamps') || searchParams.get('number_of_stamps')) || 8
        const discountVal = searchParams.get('discount') || searchParams.get('discountVal') || searchParams.get('percentage') || '10'
        const validity = searchParams.get('validity') || '12 Months'

        return {
            id: cardId || 1,
            title: title || (cardType === 2 ? 'VIP Membership Pass' : 'Loyalty Stamp Card'),
            brandName: brandName || 'FirstLoop',
            brand_name: brandName || 'FirstLoop',
            brandLogo: logo || '',
            bgColor: bgColor || (cardType === 2 ? '#D97706' : '#0E88B8'),
            bg_color: bgColor || (cardType === 2 ? '#D97706' : '#0E88B8'),
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

    useEffect(() => {
        if (propCard) {
            setCardData(propCard)
            return
        }

        let isMounted = true

        const loadCard = async () => {
            if (!cardId) {
                if (isMounted) {
                    setCardData(getFallbackCard())
                    setLoading(false)
                }
                return
            }

            try {
                const data = await fetchCustomerStampLevelsApi(cardId, cardType, cusId)
                if (isMounted) {
                    if (data) {
                        setCardData(data)
                    } else {
                        setCardData(getFallbackCard())
                    }
                }
            } catch (err) {
                console.error('Error fetching card in CardPreview:', err)
                if (isMounted) {
                    setCardData(getFallbackCard())
                }
            } finally {
                if (isMounted) {
                    setLoading(false)
                }
            }
        }

        loadCard()

        return () => {
            isMounted = false
        }
    }, [propCard, cardId, cardType, cusId])

    if (loading) {
        return null
    }

    const currentCard = cardData || getFallbackCard()

    return (
        <CustomerCard
            card={currentCard}
            cardType={cardType}
        />
    )
}
