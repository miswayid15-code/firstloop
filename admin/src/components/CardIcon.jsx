import React from 'react'
import * as fas from '@fortawesome/free-solid-svg-icons'

/**
 * Normalizes any FontAwesome icon name (e.g. 'fa-user', 'fas fa-gift', 'far fa-calendar-alt', 'gift')
 * to the corresponding icon definition in @fortawesome/free-solid-svg-icons.
 */
export const resolveFaIconDef = (iconInput) => {
    if (!iconInput) return fas.faGift
    if (typeof iconInput === 'object' && iconInput.icon) return iconInput

    const raw = String(iconInput).trim()
    if (!raw) return fas.faGift

    // Remove prefix like 'fas ', 'far ', 'fal ', 'fad ', 'fab ' and 'fa-'
    const cleaned = raw
        .replace(/^(fas|far|fal|fad|fab)\s+/, '')
        .replace(/^fa-?/, '')

    if (!cleaned) return fas.faGift

    // Build camelCase key: e.g. 'gift' -> 'faGift', 'calendar-alt' -> 'faCalendarAlt'
    const camelKey =
        'fa' +
        cleaned.charAt(0).toUpperCase() +
        cleaned.slice(1).replace(/[-_]([a-z0-9])/g, (_, c) => c.toUpperCase())

    if (fas[camelKey]) return fas[camelKey]

    // Common aliases or fallbacks
    const aliasMap = {
        facalendar: fas.faCalendarAlt || fas.faCalendar,
        facalendaralt: fas.faCalendarAlt || fas.faCalendar,
        fauser: fas.faUser,
        fagift: fas.faGift,
        fatag: fas.faTag,
        fatags: fas.faTags,
        fapercent: fas.faPercent,
        facheck: fas.faCheck,
        facheckcircle: fas.faCheckCircle,
        facheckdouble: fas.faCheckDouble,
        fastar: fas.faStar,
        facrown: fas.faCrown,
        faaward: fas.faAward,
        faclock: fas.faClock,
        fautensils: fas.faUtensils,
        facoffee: fas.faCoffee,
        facut: fas.faCut,
        fashoppingbag: fas.faShoppingBag,
        facar: fas.faCar
    }

    const lower = camelKey.toLowerCase()
    if (aliasMap[lower]) return aliasMap[lower]

    return fas.faGift
}

/**
 * CardIcon Component
 * Renders an inline vector SVG from FontAwesome icon data.
 * Pure vector SVG ensures 100% crisp rendering and fixes the missing/tofu box
 * issue in html2canvas / html-to-image when generating card preview images for WhatsApp sharing.
 */
export default function CardIcon({ name, icon, className = '', style = {}, ...props }) {
    const iconDef = resolveFaIconDef(icon || name)

    if (!iconDef || !iconDef.icon) {
        return null
    }

    const [width, height, , , pathData] = iconDef.icon

    return (
        <svg
            aria-hidden="true"
            focusable="false"
            role="img"
            viewBox={`0 0 ${width} ${height}`}
            fill="currentColor"
            className={`card-svg-icon ${className}`.trim()}
            style={{
                width: '1em',
                height: '1em',
                display: 'inline-block',
                verticalAlign: '-0.125em',
                flexShrink: 0,
                ...style
            }}
            {...props}
        >
            <path d={pathData} />
        </svg>
    )
}
