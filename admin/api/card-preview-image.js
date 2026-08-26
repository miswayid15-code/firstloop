// In-memory cache for dynamic card images (keyed by card ID)
// Format: { id: { svg: string, etag: string, updatedAt: string, timestamp: number } }
const cardImageCache = new Map()
const CACHE_TTL_MS = 60 * 1000 // 1 minute local TTL check

function escapeXml(unsafe) {
    if (!unsafe) return ''
    return String(unsafe)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;')
}

function generateCardSvg(card) {
    const width = 800
    const height = 480
    const borderRadius = 36

    const brandName = escapeXml(card.brandName || 'Merchant')
    const title = escapeXml(card.title || 'Digital Stamp Card')
    const bgColor = card.bgColor || '#0E88B8'
    const textColor = card.textColor || '#FFFFFF'
    const borderColor = card.borderColor || 'rgba(255,255,255,0.4)'
    const stampBg = card.stampBgColor || 'rgba(255,255,255,0.3)'
    const stampBorder = card.stampBorderColor || '#FFFFFF'
    const stampText = card.stampTextColor || '#FFFFFF'
    const stampRadiusPct = Number(card.stamp_radius ?? 50)
    const totalStamps = Math.min(Math.max(Number(card.total_stamps || 8), 1), 30)

    // Calculate stamp circle corner radius based on stampRadiusPct (0-50%)
    const stampSize = 64
    const stampRx = Math.round((stampSize * stampRadiusPct) / 100)

    // Stamps grid layout
    const cols = totalStamps > 10 ? 6 : totalStamps > 5 ? 5 : totalStamps
    const startX = 48
    const startY = 160
    const gapX = 16
    const gapY = 16

    let stampsSvg = ''
    for (let i = 0; i < totalStamps; i++) {
        const row = Math.floor(i / cols)
        const col = i % cols
        const x = startX + col * (stampSize + gapX)
        const y = startY + row * (stampSize + gapY)

        const lvl = card.levelRewards ? card.levelRewards[i] : null
        let iconText = `${i + 1}`

        if (lvl) {
            if (lvl.type === 'Discount') {
                iconText = `${lvl.discountVal || 10}%`
            } else if (lvl.type === 'Free') {
                iconText = '🎁'
            } else if (lvl.type === 'Paid') {
                iconText = '★'
            }
        }

        stampsSvg += `
        <g transform="translate(${x}, ${y})">
            <rect width="${stampSize}" height="${stampSize}" rx="${stampRx}" ry="${stampRx}" fill="${stampBg}" stroke="${stampBorder}" stroke-width="2.5" />
            <text x="${stampSize / 2}" y="${stampSize / 2 + 6}" font-family="Arial, Helvetica, sans-serif" font-size="${iconText.length > 2 ? '15' : '18'}" font-weight="bold" fill="${stampText}" text-anchor="middle" dominant-baseline="middle">${escapeXml(iconText)}</text>
        </g>`
    }

    const bgImageTag = card.bgImage && card.bgImage !== 'none'
        ? `<image href="${escapeXml(card.bgImage)}" x="0" y="0" width="${width}" height="${height}" preserveAspectRatio="xMidYMid slice" opacity="0.95" />`
        : ''

    const brandLogoTag = card.brandLogo
        ? `<image href="${escapeXml(card.brandLogo)}" x="48" y="44" width="48" height="48" preserveAspectRatio="xMidYMid contain" />`
        : `<circle cx="72" cy="68" r="24" fill="#FFFFFF" />`

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
    <defs>
        <clipPath id="cardClip">
            <rect width="${width}" height="${height}" rx="${borderRadius}" ry="${borderRadius}" />
        </clipPath>
        <filter id="shadow" x="-5%" y="-5%" width="110%" height="115%">
            <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#000000" flood-opacity="0.25" />
        </filter>
    </defs>

    <!-- Main Card Body -->
    <g clip-path="url(#cardClip)">
        <rect width="${width}" height="${height}" fill="${bgColor}" />
        ${bgImageTag}

        <!-- Top Left Brand & Title -->
        <g transform="translate(0, 0)">
            <!-- Logo Container -->
            <rect x="44" y="40" width="56" height="56" rx="14" ry="14" fill="#FFFFFF" opacity="0.95" />
            ${brandLogoTag}

            <text x="116" y="66" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="800" fill="${textColor}">${brandName}</text>
            <text x="116" y="92" font-family="Arial, Helvetica, sans-serif" font-size="16" font-weight="600" fill="${textColor}" opacity="0.9">${title}</text>
        </g>

        <!-- Stamp Circles Grid -->
        ${stampsSvg}

        <!-- Right Side QR Code Box -->
        <g transform="translate(${width - 200}, 140)">
            <rect width="152" height="152" rx="16" ry="16" fill="#FFFFFF" opacity="0.95" />
            <text x="76" y="70" font-family="Arial, Helvetica, sans-serif" font-size="44" text-anchor="middle">📱</text>
            <text x="76" y="112" font-family="Arial, Helvetica, sans-serif" font-size="12" font-weight="800" fill="#1E293B" text-anchor="middle" letter-spacing="1">SCAN TO STAMP</text>
        </g>

        <!-- Footer: Powered by FirstLoop -->
        <g transform="translate(${width - 48}, ${height - 32})">
            <text x="0" y="0" font-family="Arial, Helvetica, sans-serif" font-size="13" font-weight="700" fill="${textColor}" opacity="0.9" text-anchor="end">
                powered by <tspan font-weight="900">firstloop.co.in</tspan>
            </text>
        </g>
    </g>

    <!-- Card Border -->
    <rect width="${width}" height="${height}" rx="${borderRadius}" ry="${borderRadius}" fill="none" stroke="${borderColor}" stroke-width="4" />
</svg>`
}

export default async function handler(req, res) {
    const { id, v } = req.query
    const cardId = Number(id)

    if (!cardId) {
        return res.status(400).json({ error: 'Valid card ID is required' })
    }

    const backendUrl = process.env.VITE_API_URL || process.env.API_URL || 'http://localhost:5000/'
    const cleanApiBase = backendUrl.replace(/\/+$/, '')

    try {
        // Fetch card details dynamically from database
        const apiResponse = await fetch(`${cleanApiBase}/firstloop/merchant/fetch-stamp-card-details`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: cardId })
        })

        const data = await apiResponse.json()
        const item = data?.data?.[0]

        if (!item || data?.status !== 1) {
            return res.status(404).json({ error: 'Stamp card not found' })
        }

        const updatedAt = String(item.updated_at || item.updatedAt || item.created_at || item.id)
        const etag = `W/"card-${cardId}-${updatedAt}-${v || ''}"`

        // Check if client has latest version cached via ETag
        if (req.headers['if-none-match'] === etag) {
            return res.status(304).end()
        }

        // Check in-memory cache
        const cached = cardImageCache.get(cardId)
        if (cached && cached.etag === etag && !v) {
            res.setHeader('Content-Type', 'image/svg+xml')
            res.setHeader('Cache-Control', 'public, max-age=1800, s-maxage=3600, stale-while-revalidate=86400')
            res.setHeader('ETag', etag)
            return res.send(cached.svg)
        }

        // Format card object for SVG generator
        const formatImg = (path) => {
            if (!path) return null
            if (path.startsWith('http://') || path.startsWith('https://')) return path
            return `${cleanApiBase}/${path.replace(/^\/+/, '')}`
        }

        const stampLevels = Array.isArray(item.StampLevels) ? item.StampLevels : []
        const totalStamps = Number(item.number_of_stamps) || 8

        const card = {
            id: cardId,
            title: item.title || 'Stamp Pass',
            brandName: item.brand_name || 'Merchant',
            brandLogo: formatImg(item.brand_image),
            bgImage: formatImg(item.background_image),
            total_stamps: totalStamps,
            bgColor: item.background_color || '#0E88B8',
            textColor: item.text_color || '#FFFFFF',
            borderColor: item.border_color || '#00A6D6',
            stampBgColor: item.stamp_background || 'rgba(255, 255, 255, 0.3)',
            stampBorderColor: item.stamp_border_color || '#FFFFFF',
            stampTextColor: item.stamp_text_color || '#FFFFFF',
            stamp_radius: Number(item.stamp_radius ?? 50),
            levelRewards: stampLevels.map((lvl, idx) => ({
                stamp: Number(lvl.stamp_number) || idx + 1,
                type: lvl.reward_type === '2' ? 'Discount' : lvl.reward_type === '3' ? 'Paid' : 'Free',
                discountVal: lvl.reward_type === '2' ? parseInt(lvl.reward_text) || 10 : 0
            }))
        }

        const svgOutput = generateCardSvg(card)

        // Store in memory cache (automatically updated/invalidated when updatedAt changes)
        cardImageCache.set(cardId, {
            svg: svgOutput,
            etag,
            updatedAt,
            timestamp: Date.now()
        })

        res.setHeader('Content-Type', 'image/svg+xml')
        res.setHeader('Cache-Control', 'public, max-age=1800, s-maxage=3600, stale-while-revalidate=86400')
        res.setHeader('ETag', etag)
        return res.send(svgOutput)

    } catch (err) {
        console.error('[CardPreviewImage API Error]:', err)
        return res.status(500).json({ error: 'Failed to dynamically generate card image' })
    }
}
