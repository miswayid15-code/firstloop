export default async function handler(req, res) {
    const { id } = req.query;

    if (!id) {
        return res.status(400).send('Missing card ID');
    }

    try {
        const apiBaseUrl = process.env.VITE_API_URL || process.env.BACKEND_URL || 'https://dealora-7st9.onrender.com';
        const cleanApiUrl = apiBaseUrl.replace(/\/+$/, '');

        const response = await fetch(`${cleanApiUrl}/firstloop/merchant/fetch-stamp-card-details`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: Number(id) })
        });

        const data = await response.json();
        const item = data?.data?.[0];

        if (!item) {
            return res.status(404).send('Card not found');
        }

        const brandName = escapeXml(item.brand_name || 'Merchant');
        const title = escapeXml(item.title || 'Digital Stamp Card');
        const totalStamps = Math.min(Math.max(Number(item.number_of_stamps) || 8, 1), 12);
        const bgColor = item.background_color || '#0E88B8';
        const textColor = item.text_color || '#FFFFFF';
        const borderColor = item.border_color || '#00A6D6';
        const stampBgColor = item.stamp_background || 'rgba(255, 255, 255, 0.3)';
        const stampBorderColor = item.stamp_border_color || '#FFFFFF';
        const stampTextColor = item.stamp_text_color || '#FFFFFF';

        const getFullUrl = (path) => {
            if (!path || typeof path !== 'string') return '';
            const trimmed = path.trim();
            if (trimmed.startsWith('http')) return trimmed;
            return `${cleanApiUrl}/${trimmed.replace(/^\/+/, '')}`;
        };

        const bgImage = getFullUrl(item.background_image);
        const brandLogo = getFullUrl(item.brand_image);

        const stampLevels = Array.isArray(item.StampLevels) ? item.StampLevels : [];

        // Build Stamp Circles Grid SVG
        let stampCirclesSvg = '';
        const maxPerRow = totalStamps > 6 ? 5 : totalStamps;
        const startX = 60;
        const startY = 190;
        const spacingX = 66;
        const spacingY = 70;
        const circleRadius = 26;

        for (let i = 0; i < totalStamps; i++) {
            const row = Math.floor(i / maxPerRow);
            const col = i % maxPerRow;
            const cx = startX + (col * spacingX) + circleRadius;
            const cy = startY + (row * spacingY) + circleRadius;

            const lvl = stampLevels[i];
            let label = `${i + 1}`;
            if (lvl) {
                if (lvl.reward_type === '2') {
                    label = `${parseInt(lvl.reward_text) || 10}%`;
                } else if (lvl.reward_type === '1' || lvl.reward_type === '3') {
                    label = '🎁';
                }
            }

            stampCirclesSvg += `
                <g>
                    <circle cx="${cx}" cy="${cy}" r="${circleRadius}" fill="${stampBgColor}" stroke="${stampBorderColor}" stroke-width="2.5" />
                    <text x="${cx}" y="${cy + 6}" font-size="${label.length > 2 ? '13' : '16'}" font-weight="800" fill="${stampTextColor}" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">
                        ${escapeXml(label)}
                    </text>
                </g>
            `;
        }

        const svg = `
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="800" height="460" viewBox="0 0 800 460">
    <defs>
        <clipPath id="card-clip">
            <rect x="20" y="20" width="760" height="420" rx="28" />
        </clipPath>
        <filter id="card-shadow" x="0" y="0" width="800" height="460" filterUnits="userSpaceOnUse">
            <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#000000" flood-opacity="0.35" />
        </filter>
    </defs>

    <!-- Canvas Background -->
    <rect width="800" height="460" fill="#F1F5F9" />

    <!-- Card Base with Shadow -->
    <g filter="url(#card-shadow)">
        <rect x="20" y="20" width="760" height="420" rx="28" fill="${bgColor}" />
        
        ${bgImage ? `
            <image href="${bgImage}" x="20" y="20" width="760" height="420" preserveAspectRatio="xMidYMid slice" clip-path="url(#card-clip)" />
            <rect x="20" y="20" width="760" height="420" rx="28" fill="black" opacity="0.1" clip-path="url(#card-clip)" />
        ` : ''}
        
        <rect x="20" y="20" width="760" height="420" rx="28" fill="none" stroke="${borderColor}" stroke-width="3.5" />
    </g>

    <!-- Card Content -->
    <g clip-path="url(#card-clip)">
        <!-- Brand Logo Container -->
        <rect x="60" y="55" width="48" height="48" rx="12" fill="#FFFFFF" filter="drop-shadow(0 2px 5px rgba(0,0,0,0.15))" />
        ${brandLogo ? `
            <image href="${brandLogo}" x="64" y="59" width="40" height="40" preserveAspectRatio="xMidYMid meet" />
        ` : `
            <circle cx="84" cy="79" r="14" fill="#0E88B8" />
        `}

        <!-- Brand Name -->
        <text x="122" y="88" font-size="24" font-weight="800" fill="${textColor}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">
            ${brandName}
        </text>

        <!-- Card Title -->
        <text x="60" y="142" font-size="18" font-weight="700" fill="${textColor}" opacity="0.95" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">
            ${title}
        </text>

        <!-- Stamp Circles Grid -->
        ${stampCirclesSvg}

        <!-- Right Side: QR Code Area -->
        <g transform="translate(560, 110)">
            <rect x="0" y="0" width="160" height="160" rx="16" fill="#FFFFFF" filter="drop-shadow(0 4px 10px rgba(0,0,0,0.12))" />
            
            <!-- Stylized QR Representation -->
            <path d="M 20,20 h 40 v 40 h -40 Z M 30,30 v 20 h 20 v -20 Z" fill="#0E88B8" />
            <path d="M 100,20 h 40 v 40 h -40 Z M 110,30 v 20 h 20 v -20 Z" fill="#0E88B8" />
            <path d="M 20,100 h 40 v 40 h -40 Z M 30,110 v 20 h 20 v -20 Z" fill="#0E88B8" />
            
            <rect x="75" y="25" width="12" height="30" fill="#1E293B" />
            <rect x="25" y="75" width="30" height="12" fill="#1E293B" />
            <rect x="70" y="70" width="22" height="22" fill="#0E88B8" />
            <rect x="105" y="75" width="30" height="12" fill="#1E293B" />
            <rect x="75" y="105" width="12" height="30" fill="#1E293B" />
            <rect x="100" y="100" width="18" height="18" fill="#1E293B" />
            <rect x="125" y="125" width="15" height="15" fill="#0E88B8" />

            <text x="80" y="186" font-size="11" font-weight="800" fill="${textColor}" text-anchor="middle" letter-spacing="1" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">
                SCAN TO STAMP
            </text>
        </g>

        <!-- Bottom Right Footer Badge -->
        <g transform="translate(560, 395)">
            <text x="0" y="15" font-size="13" font-weight="600" fill="${textColor}" opacity="0.9" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">
                powered by <tspan font-weight="800">firstloop.co.in</tspan>
            </text>
        </g>
    </g>
</svg>
        `.trim();

        res.setHeader('Content-Type', 'image/svg+xml');
        res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=600');
        return res.status(200).send(svg);

    } catch (err) {
        console.error('Error generating card image SVG:', err);
        res.setHeader('Content-Type', 'image/svg+xml');
        return res.status(200).send(`
            <svg xmlns="http://www.w3.org/2000/svg" width="600" height="340" viewBox="0 0 600 340">
                <rect width="600" height="340" rx="20" fill="#0E88B8" />
                <text x="300" y="170" fill="#ffffff" font-size="24" font-family="sans-serif" text-anchor="middle" font-weight="bold">FirstLoop Digital Card</text>
            </svg>
        `);
    }
}

function escapeXml(unsafe) {
    return String(unsafe || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}
