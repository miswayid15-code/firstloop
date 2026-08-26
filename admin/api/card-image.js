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

        const brandName = item.brand_name || 'Merchant';
        const title = item.title || 'Stamp Pass';
        const totalStamps = Number(item.number_of_stamps) || 8;
        const bgColor = item.background_color || '#0E88B8';
        const textColor = item.text_color || '#FFFFFF';
        const borderColor = item.border_color || '#00A6D6';
        const stampBgColor = item.stamp_background || 'rgba(255, 255, 255, 0.3)';
        const stampBorderColor = item.stamp_border_color || '#FFFFFF';
        const stampTextColor = item.stamp_text_color || '#FFFFFF';
        const stampRadius = Number(item.stamp_radius ?? 50);

        let bgImage = item.background_image || '';
        if (bgImage && !bgImage.startsWith('http')) {
            bgImage = `${cleanApiUrl}/${bgImage.replace(/^\/+/, '')}`;
        }

        let brandLogo = item.brand_image || '';
        if (brandLogo && !brandLogo.startsWith('http')) {
            brandLogo = `${cleanApiUrl}/${brandLogo.replace(/^\/+/, '')}`;
        }

        // Generate SVG stamps
        const stampsPerRow = 5;
        const stampSize = 44;
        const stampGap = 12;
        const startX = 40;
        const startY = 160;

        let stampsSvg = '';
        for (let i = 0; i < totalStamps; i++) {
            const col = i % stampsPerRow;
            const row = Math.floor(i / stampsPerRow);
            const cx = startX + col * (stampSize + stampGap);
            const cy = startY + row * (stampSize + stampGap);
            const rx = (stampSize * stampRadius) / 100;

            stampsSvg += `
                <g transform="translate(${cx}, ${cy})">
                    <rect width="${stampSize}" height="${stampSize}" rx="${rx}" fill="${stampBgColor}" stroke="${stampBorderColor}" stroke-width="2.5" />
                    <!-- Gift Icon -->
                    <g transform="translate(12, 12) scale(0.8)" fill="${stampTextColor}">
                        <path d="M20 12v10H4V12h16m0-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V12c0-1.1-.9-2-2-2z"/>
                        <path d="M13 4a3 3 0 0 0-3 3c0 .34.06.67.17.97H5c-1.1 0-2 .9-2 2v1h18v-1c0-1.1-.9-2-2-2h-5.17c.11-.3.17-.63.17-.97a3 3 0 0 0-3-3m-1 4a1 1 0 0 1-1-1 1 1 0 0 1 1-1 1 1 0 0 1 1 1 1 1 0 0 1-1 1m2 0a1 1 0 0 1-1-1 1 1 0 0 1 1-1 1 1 0 0 1 1 1 1 1 0 0 1-1 1z"/>
                    </g>
                </g>
            `;
        }

        const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 460" width="800" height="460">
            <defs>
                <clipPath id="cardClip">
                    <rect width="760" height="420" rx="28" ry="28" x="20" y="20" />
                </clipPath>
                <filter id="shadow" x="0" y="0" width="800" height="460" filterUnits="userSpaceOnUse">
                    <feDropShadow dx="0" dy="16" stdDeviation="20" flood-color="rgba(0,0,0,0.3)" />
                </filter>
            </defs>

            <!-- Card Background Container -->
            <g filter="url(#shadow)">
                <rect x="20" y="20" width="760" height="420" rx="28" fill="${bgColor}" stroke="${borderColor}" stroke-width="4" />
            </g>

            <g clip-path="url(#cardClip)">
                ${bgImage ? `<image href="${bgImage}" x="20" y="20" width="760" height="420" preserveAspectRatio="xMidYMid slice" />` : ''}

                <!-- Darkening Gradient Overlay for readability -->
                <rect x="20" y="20" width="760" height="420" fill="rgba(0,0,0,0.15)" />

                <!-- Content Area -->
                <!-- Brand Logo & Name -->
                <g transform="translate(40, 50)">
                    ${brandLogo ? `
                        <rect x="0" y="0" width="48" height="48" rx="12" fill="#FFFFFF" />
                        <image href="${brandLogo}" x="4" y="4" width="40" height="40" preserveAspectRatio="xMidYMid contain" />
                        <text x="62" y="32" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="800" fill="${textColor}">${brandName}</text>
                    ` : `
                        <text x="0" y="32" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="800" fill="${textColor}">${brandName}</text>
                    `}
                </g>

                <!-- Card Title -->
                <text x="40" y="125" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="700" fill="${textColor}" opacity="0.95">${title}</text>

                <!-- Stamp Grid -->
                ${stampsSvg}

                <!-- Right Side QR Code -->
                <g transform="translate(600, 140)">
                    <rect width="140" height="140" rx="14" fill="#FFFFFF" />
                    <!-- QR Placeholder pattern -->
                    <rect x="12" y="12" width="40" height="40" fill="#000000" />
                    <rect x="18" y="18" width="28" height="28" fill="#FFFFFF" />
                    <rect x="24" y="24" width="16" height="16" fill="#000000" />

                    <rect x="88" y="12" width="40" height="40" fill="#000000" />
                    <rect x="94" y="18" width="28" height="28" fill="#FFFFFF" />
                    <rect x="100" y="24" width="16" height="16" fill="#000000" />

                    <rect x="12" y="88" width="40" height="40" fill="#000000" />
                    <rect x="18" y="94" width="28" height="28" fill="#FFFFFF" />
                    <rect x="24" y="100" width="16" height="16" fill="#000000" />

                    <rect x="60" y="60" width="20" height="20" fill="#000000" />
                    <rect x="88" y="88" width="16" height="16" fill="#000000" />
                    <rect x="110" y="110" width="18" height="18" fill="#000000" />

                    <text x="70" y="165" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="800" fill="${textColor}" letter-spacing="1">SCAN TO STAMP</text>
                </g>

                <!-- Footer powered by -->
                <g transform="translate(560, 400)">
                    <text x="0" y="14" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="600" fill="${textColor}" opacity="0.9">powered by</text>
                    <text x="75" y="14" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="800" fill="${textColor}">firstloop.co.in</text>
                </g>
            </g>
        </svg>`;

        res.setHeader('Content-Type', 'image/svg+xml');
        res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800');
        return res.status(200).send(svg);

    } catch (err) {
        console.error('Error generating card image:', err);
        return res.status(500).send('Internal Server Error');
    }
}
