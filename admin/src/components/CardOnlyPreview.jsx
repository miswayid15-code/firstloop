import React from 'react'
import CustomerCard from './CustomerCard.jsx'

/**
 * CardOnlyPreview Component
 * Renders ONLY the pure card element (no buttons, no header, no layout wrapper)
 * Specifically used for card-image preview and OG image visualization.
 */
export default function CardOnlyPreview({ card, cardType = 1, style = {} }) {
    if (!card) return null

    return (
        <div style={{ display: 'inline-block', ...style }}>
            <CustomerCard
                card={card}
                cardType={cardType}
            />
        </div>
    )
}
