import sharp from 'sharp';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';

// Helper to safely fetch an image and return as base64 data URI
async function fetchImageAsBase64(url) {
    if (!url) return null;
    if (url.startsWith('data:')) return url;
    try {
        const res = await fetch(url);
        if (!res.ok) return null;
        const arrayBuffer = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const contentType = res.headers.get('content-type') || 'image/png';
        return `data:${contentType};base64,${buffer.toString('base64')}`;
    } catch (e) {
        console.warn('Could not fetch image for card SVG:', url, e.message);
        return null;
    }
}

// Helper to get local asset as base64
function getLocalAssetAsBase64(relativeFilePath) {
    try {
        const fullPath = path.resolve(process.cwd(), relativeFilePath);
        if (fs.existsSync(fullPath)) {
            const buffer = fs.readFileSync(fullPath);
            const ext = path.extname(fullPath).replace('.', '') || 'png';
            return `data:image/${ext};base64,${buffer.toString('base64')}`;
        }
    } catch (e) {
        // ignore
    }
    return null;
}

// Escape XML special characters
function escapeXml(unsafe) {
    if (unsafe === null || unsafe === undefined) return '';
    return String(unsafe)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

/**
 * Generate a PNG Buffer for a given card object
 * @param {Object} card 
 * @returns {Promise<Buffer>} PNG binary buffer
 */
export async function generateCardPngBuffer(card) {
    const type = Number(card.card_type || card.type || 1) === 2 ? 2 : 1;
    const defaultBg = type === 2 ? '#D97706' : '#0E88B8';
    const bgColor = card.bgColor || card.background_color || defaultBg;
    const borderColor = card.borderColor || card.border_color || 'rgba(255,255,255,0.4)';
    const textColor = card.textColor || '#FFFFFF';
    const brandName = escapeXml(card.brandName || card.brand_name || 'Merchant');
    const title = escapeXml(card.title || (type === 2 ? 'Membership Pass' : 'Stamp Pass'));
    const cardholderName = escapeXml(card.cardholderName || card.customer_name || (type === 2 ? 'Member Pass' : 'Stamp Pass'));
    const scanText = type === 2 ? 'SCAN PASS' : 'SCAN TO STAMP';

    // 1. Resolve Brand Logo
    let brandLogoBase64 = null;
    if (card.brandLogo) {
        brandLogoBase64 = await fetchImageAsBase64(card.brandLogo);
    }
    if (!brandLogoBase64) {
        brandLogoBase64 = getLocalAssetAsBase64('src/assets/img/firstloop-favicon.png');
    }

    // 2. Resolve Background Image
    let bgImageBase64 = null;
    if (card.bgImage && card.bgImage !== 'none' && card.bgImage !== 'null') {
        bgImageBase64 = await fetchImageAsBase64(card.bgImage);
    }

    // 3. Resolve FirstLoop Logo for powered by
    const flLogoBase64 = getLocalAssetAsBase64('src/assets/img/firstloop-favicon.png');

    // 4. Generate QR Code SVG / Data URI
    const qrValue = card.qrImg || card.qr_token || 'firstloop';
    const qrDataUrl = await QRCode.toDataURL(qrValue, {
        margin: 1,
        width: 192,
        color: {
            dark: '#000000',
            light: '#FFFFFF'
        }
    });

    // 5. Generate Stamps or Validity Markup
    const totalStamps = Math.min(Math.max(Number(card.total_stamps || card.number_of_stamps || 8), 1), 20);
    const stampRadius = Number(card.stamp_radius ?? 50); // percentage (50 = circle)
    const stampBorderColor = card.stampBorderColor || '#FFFFFF';
    const stampBgColor = card.stampBgColor || 'rgba(255, 255, 255, 0.3)';
    const stampTextColor = card.stampTextColor || textColor;

    let middleContentSvg = '';

    if (type === 1) {
        // Stamp Grid
        const levels = card.CustomerStampLevels || card.levelRewards || card.stamp_levels || [];
        const stampElements = [];
        
        const stampWidth = 72;
        const stampHeight = 72;
        const gapX = 12;
        const gapY = 12;
        const maxCols = 5;

        for (let i = 0; i < totalStamps; i++) {
            const stampNum = i + 1;
            const rewardItem = Array.isArray(levels)
                ? (levels.find(l => Number(l.stamp_number || l.stamp) === stampNum) || levels[i])
                : null;
            
            const rType = rewardItem
                ? (rewardItem.type || (rewardItem.reward_type === '2' || Number(rewardItem.reward_type) === 2 ? 'Discount' : (rewardItem.reward_type === '3' || Number(rewardItem.reward_type) === 3 ? 'Paid' : 'Free')))
                : null;

            let iconOrText = `<text x="36" y="44" font-size="28" font-weight="800" fill="${stampTextColor}" text-anchor="middle" dominant-baseline="central">${stampNum}</text>`;

            if (rewardItem && rType === 'Free') {
                // Gift Box Icon SVG
                iconOrText = `
                    <g transform="translate(18, 18) scale(1.4)" fill="${stampTextColor}">
                        <path d="M20 12l-1.41-1.41L13 16.17V4h-2v12.17l-5.58-5.59L4 12l8 8 8-8z" opacity="0"/>
                        <path d="M20 6h-2.18c.11-.31.18-.65.18-1 0-1.66-1.34-3-3-3-1.05 0-1.96.54-2.5 1.35l-.5.65-.5-.65C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm11 15H4v-2h16v2zm0-5H4V8h5.08L7 10.83 8.62 12 11 8.76V14h2V8.76L15.38 12 17 10.83 14.92 8H20v6z"/>
                    </g>
                `;
            } else if (rewardItem && rType === 'Discount') {
                const disc = Number(rewardItem.discount ?? rewardItem.discountVal ?? (parseInt(rewardItem.reward_text) || 10));
                iconOrText = `<text x="36" y="44" font-size="22" font-weight="800" fill="${stampTextColor}" text-anchor="middle" dominant-baseline="central">${disc}%</text>`;
            } else if (rewardItem && rType === 'Paid') {
                // Tag Icon SVG
                iconOrText = `
                    <g transform="translate(18, 18) scale(1.4)" fill="${stampTextColor}">
                        <path d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z"/>
                    </g>
                `;
            }

            const col = i % maxCols;
            const row = Math.floor(i / maxCols);
            const posX = col * (stampWidth + gapX);
            const posY = row * (stampHeight + gapY);
            const rx = (stampRadius / 100) * (stampWidth / 2);

            stampElements.push(`
                <g transform="translate(${posX}, ${posY})">
                    <rect width="${stampWidth}" height="${stampHeight}" rx="${rx}" ry="${rx}" fill="${stampBgColor}" stroke="${stampBorderColor}" stroke-width="4"/>
                    ${iconOrText}
                </g>
            `);
        }

        middleContentSvg = `
            <g transform="translate(44, 210)">
                ${stampElements.join('')}
            </g>
        `;
    } else {
        // Membership Validity
        const validityText = escapeXml(card.expiry || (card.validityMonths ? `${card.validityMonths} Months` : '12 Months'));
        middleContentSvg = `
            <g transform="translate(44, 270)">
                <line x1="0" y1="0" x2="380" y2="0" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>
                <text x="0" y="32" font-size="16" font-weight="700" fill="${textColor}" letter-spacing="1" opacity="0.85">VALID THRU</text>
                <text x="0" y="68" font-size="30" font-weight="800" fill="${textColor}">${validityText}</text>
            </g>
        `;
    }

    // Complete Card SVG at 840x480
    const svgString = `
<svg width="840" height="480" viewBox="0 0 840 480" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <clipPath id="cardClip">
            <rect width="840" height="480" rx="44" ry="44"/>
        </clipPath>
    </defs>
    
    <!-- Background & Border Clip -->
    <g clip-path="url(#cardClip)">
        <!-- Background color -->
        <rect width="840" height="480" fill="${bgColor}"/>
        
        <!-- Background image if present -->
        ${bgImageBase64 ? `<image href="${bgImageBase64}" width="840" height="480" preserveAspectRatio="xMidYMid slice"/>` : ''}
        
        <!-- Semi-transparent overlay to ensure readability -->
        ${bgImageBase64 ? `<rect width="840" height="480" fill="rgba(0,0,0,0.25)"/>` : ''}
        
        <!-- Border -->
        <rect width="840" height="480" fill="none" stroke="${borderColor}" stroke-width="4" rx="44" ry="44"/>

        <!-- ================= TOP LEFT HEADER ================= -->
        <g transform="translate(44, 40)">
            <!-- Brand Logo Container -->
            <rect x="0" y="0" width="56" height="56" rx="16" ry="16" fill="#FFFFFF"/>
            ${brandLogoBase64 ? `<image href="${brandLogoBase64}" x="4" y="4" width="48" height="48" preserveAspectRatio="xMidYMid meet"/>` : ''}

            <!-- Brand Name -->
            <text x="70" y="38" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="30" font-weight="800" fill="${textColor}">
                ${brandName}
            </text>

            <!-- Card Title -->
            <text x="0" y="90" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="24" font-weight="700" fill="${textColor}" opacity="0.95">
                ${title}
            </text>

            <!-- Cardholder Name with User Icon -->
            <g transform="translate(0, 108)">
                <circle cx="10" cy="14" r="7" fill="${textColor}" opacity="0.9"/>
                <path d="M 0 30 Q 10 20 20 30" fill="${textColor}" opacity="0.9"/>
                <text x="30" y="24" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="26" font-weight="700" fill="${textColor}" opacity="0.95">
                    ${cardholderName}
                </text>
            </g>
        </g>

        <!-- ================= MIDDLE CONTENT (STAMPS / VALIDITY) ================= -->
        <g font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif">
            ${middleContentSvg}
        </g>

        <!-- ================= RIGHT QR CODE & SCAN TEXT ================= -->
        <g transform="translate(580, 48)">
            <!-- QR Container Background -->
            <rect x="0" y="0" width="200" height="200" rx="16" ry="16" fill="#FFFFFF"/>
            <!-- QR Code -->
            <image href="${qrDataUrl}" x="8" y="8" width="184" height="184"/>
            <!-- Scan label -->
            <text x="100" y="235" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="18" font-weight="800" fill="${textColor}" letter-spacing="1" text-anchor="middle" opacity="0.95">
                ${scanText}
            </text>
        </g>

        <!-- ================= BOTTOM RIGHT BRANDING ================= -->
        <g transform="translate(580, 435)" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" fill="${textColor}" opacity="0.9">
            <text x="0" y="16" font-size="16" font-weight="600">powered by</text>
            ${flLogoBase64 ? `<image href="${flLogoBase64}" x="88" y="0" width="20" height="20"/>` : ''}
            <text x="114" y="16" font-size="16" font-weight="800">firstloop.co.in</text>
        </g>
    </g>
</svg>
    `.trim();

    // Convert SVG to PNG Buffer using sharp
    const pngBuffer = await sharp(Buffer.from(svgString))
        .png({ quality: 95 })
        .toBuffer();

    return pngBuffer;
}
