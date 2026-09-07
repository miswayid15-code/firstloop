import sharp from 'sharp';
import QRCode from 'qrcode';
import axios from 'axios';

// Helper to escape XML characters
function escapeXml(unsafe) {
    if (!unsafe) return '';
    return String(unsafe)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

// Helper to fetch image and convert to base64 Data URL
async function getBase64Image(imageUrl) {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('data:image/')) return imageUrl;
    try {
        const response = await axios.get(imageUrl, {
            responseType: 'arraybuffer',
            timeout: 4000
        });
        const contentType = response.headers['content-type'] || 'image/png';
        const base64 = Buffer.from(response.data, 'binary').toString('base64');
        return `data:${contentType};base64,${base64}`;
    } catch (e) {
        return null;
    }
}

/**
 * Generate high-resolution PNG buffer (840x480, 2x retina) matching CustomerCard.jsx
 */
export async function generateCardPngBuffer(card) {
    const width = 840;
    const height = 480;
    const type = Number(card.card_type || 1) === 2 ? 2 : 1;

    // Card Colors & Styles
    const defaultBg = type === 2 ? '#D97706' : '#0E88B8';
    const bgColor = card.bgColor || defaultBg;
    const borderColor = card.borderColor || '#FFFFFF';
    const textColor = card.textColor || '#FFFFFF';
    const totalStamps = Number(card.total_stamps || 8);
    const stampRadiusPercent = Number(card.stamp_radius ?? 50);
    const stampBorderRadius = (stampRadiusPercent / 100) * 36; // for 72px width

    const stampBgColor = card.stampBgColor || 'rgba(255, 255, 255, 0.3)';
    const stampBorderColor = card.stampBorderColor || '#FFFFFF';
    const stampTextColor = card.stampTextColor || textColor;

    const brandName = escapeXml(card.brandName || 'FirstPass');
    const cardTitle = escapeXml(card.title || (type === 2 ? 'VIP Membership Pass' : 'Loyalty Stamp Card'));
    const customerName = escapeXml(card.cardholderName || 'Valued Member');
    const validity = escapeXml(card.validity || '12 Months');
    const scanText = type === 2 ? 'SCAN PASS' : 'SCAN TO STAMP';

    // 1. Generate QR Code SVG / Data URL
    const qrData = card.qr_token || `dealora-${card.id || 1}`;
    let qrSvg = '';
    try {
        qrSvg = await QRCode.toString(qrData, {
            type: 'svg',
            margin: 1,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        });
        // Remove xml declaration & outer svg tag to embed cleanly inside our main SVG
        qrSvg = qrSvg.replace(/<\?xml.*?\?>/, '').replace(/<svg[^>]*>/, '').replace(/<\/svg>/, '');
    } catch (err) {
        console.warn('QR Code generation error:', err.message);
    }

    // 2. Fetch Brand Logo & Background Image as base64 (if provided)
    let brandLogoBase64 = null;
    if (card.brandLogo) {
        brandLogoBase64 = await getBase64Image(card.brandLogo);
    }

    let bgImageBase64 = null;
    if (card.bgImage && card.bgImage !== 'none' && card.bgImage !== 'null') {
        bgImageBase64 = await getBase64Image(card.bgImage);
    }

    // 3. Build Stamp Grid Elements (Type 1)
    let stampGridSvg = '';
    if (type === 1) {
        const levels = card.levelRewards || card.CustomerStampLevels || [];
        const stampW = 72;
        const stampH = 72;
        const gapX = 12;
        const gapY = 12;
        const maxCols = 4;
        const startX = 44;
        const startY = 220;

        for (let i = 0; i < totalStamps; i++) {
            const col = i % maxCols;
            const row = Math.floor(i / maxCols);
            const x = startX + col * (stampW + gapX);
            const y = startY + row * (stampH + gapY);

            const stampNum = i + 1;
            const rewardItem = levels.find(l => Number(l.stamp_number) === stampNum) || levels[i];
            const rType = rewardItem?.type || (rewardItem?.rewardType === 2 ? 'Discount' : (rewardItem?.rewardType === 3 ? 'Paid' : 'Free'));

            let insideContent = '';
            if (rewardItem && rType === 'Discount') {
                const disc = Number(rewardItem.discountVal ?? rewardItem.discount ?? 10);
                insideContent = `
                    <text x="${x + stampW / 2}" y="${y + stampH / 2 + 6}" 
                          font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="900" 
                          fill="${stampTextColor}" text-anchor="middle" dominant-baseline="central">
                        ${disc}%
                    </text>
                `;
            } else if (rewardItem && rType === 'Paid') {
                insideContent = `
                    <text x="${x + stampW / 2}" y="${y + stampH / 2}" 
                          font-size="24" text-anchor="middle" dominant-baseline="central">
                        🏷️
                    </text>
                `;
            } else if (rewardItem && rType === 'Free') {
                insideContent = `
                    <text x="${x + stampW / 2}" y="${y + stampH / 2}" 
                          font-size="24" text-anchor="middle" dominant-baseline="central">
                        🎁
                    </text>
                `;
            } else {
                insideContent = `
                    <text x="${x + stampW / 2}" y="${y + stampH / 2 + 5}" 
                          font-family="Arial, Helvetica, sans-serif" font-size="26" font-weight="800" 
                          fill="${stampTextColor}" text-anchor="middle" dominant-baseline="central">
                        ${stampNum}
                    </text>
                `;
            }

            stampGridSvg += `
                <g>
                    <rect x="${x}" y="${y}" width="${stampW}" height="${stampH}" rx="${stampBorderRadius}" ry="${stampBorderRadius}"
                          fill="${stampBgColor}" stroke="${stampBorderColor}" stroke-width="4" />
                    ${insideContent}
                </g>
            `;
        }
    }

    // 4. Assemble the Full SVG matching CustomerCard.jsx
    const svgString = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <clipPath id="cardClip">
                <rect x="0" y="0" width="${width}" height="${height}" rx="44" ry="44" />
            </clipPath>
            <filter id="cardShadow" x="-10%" y="-10%" width="120%" height="130%">
                <feDropShadow dx="0" dy="20" stdDeviation="25" flood-color="#000000" flood-opacity="0.35" />
            </filter>
        </defs>

        <!-- Card Container with Rounded Corners & Background -->
        <g clip-path="url(#cardClip)">
            <!-- Solid Color Background -->
            <rect x="0" y="0" width="${width}" height="${height}" fill="${bgColor}" />
            
            ${bgImageBase64 ? `
                <!-- Background Image Overlay -->
                <image href="${bgImageBase64}" x="0" y="0" width="${width}" height="${height}" preserveAspectRatio="xMidYMid slice" opacity="0.35" />
            ` : ''}

            <!-- 2px (scaled to 4px) Border Overlay -->
            <rect x="2" y="2" width="${width - 4}" height="${height - 4}" rx="44" ry="44" fill="none" stroke="${borderColor}" stroke-width="4" />

            <!-- BRAND LOGO & NAME -->
            <g transform="translate(44, 44)">
                <!-- Brand Logo White Box -->
                <rect x="0" y="0" width="56" height="56" rx="16" ry="16" fill="#FFFFFF" />
                ${brandLogoBase64 ? `
                    <image href="${brandLogoBase64}" x="4" y="4" width="48" height="48" preserveAspectRatio="xMidYMid meet" />
                ` : `
                    <text x="28" y="28" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="#0E88B8" text-anchor="middle" dominant-baseline="central">FP</text>
                `}

                <!-- Brand Name -->
                <text x="72" y="38" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="900" fill="${textColor}">
                    ${brandName}
                </text>
            </g>

            <!-- CARD TITLE -->
            <text x="44" y="140" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="700" fill="${textColor}" opacity="0.95">
                ${cardTitle}
            </text>

            <!-- CARDHOLDER NAME -->
            <g transform="translate(44, 175)">
                <!-- User Icon (SVG Path) -->
                <path d="M10 2a5 5 0 100 10 5 5 0 000-10zm-8 16c0-2.66 5.33-4 8-4s8 1.34 8 4v2H2v-2z" transform="scale(1.2)" fill="${textColor}" opacity="0.9" />
                <text x="32" y="18" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="700" fill="${textColor}">
                    ${customerName}
                </text>
            </g>

            <!-- TYPE 1: STAMP GRID -->
            ${type === 1 ? stampGridSvg : `
                <!-- TYPE 2: VALID THRU -->
                <g transform="translate(44, 260)">
                    <line x1="0" y1="0" x2="380" y2="0" stroke="rgba(255,255,255,0.3)" stroke-width="2" />
                    <text x="0" y="32" font-family="Arial, sans-serif" font-size="18" font-weight="700" fill="${textColor}" opacity="0.85" letter-spacing="1">
                        VALID THRU
                    </text>
                    <text x="0" y="75" font-family="Arial, sans-serif" font-size="32" font-weight="900" fill="${textColor}">
                        ${validity}
                    </text>
                </g>
            `}

            <!-- RIGHT COLUMN: QR CODE CONTAINER (184x184 at 2x) -->
            <g transform="translate(590, 48)">
                <rect x="0" y="0" width="206" height="206" rx="16" ry="16" fill="#FFFFFF" />
                <g transform="translate(11, 11) scale(4.8)">
                    ${qrSvg}
                </g>

                <!-- Scan Text -->
                <text x="103" y="244" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="800" fill="${textColor}" opacity="0.95" text-anchor="middle" letter-spacing="1">
                    ${scanText}
                </text>
            </g>

            <!-- FOOTER: POWERED BY FIRSTLOOP.CO.IN -->
            <g transform="translate(${width - 44}, ${height - 24})">
                <text x="0" y="0" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="700" fill="${textColor}" opacity="0.9" text-anchor="end">
                    powered by <tspan font-weight="900">firstloop.co.in</tspan>
                </text>
            </g>
        </g>
    </svg>
    `;

    // Convert SVG to high-quality PNG buffer using Sharp
    return await sharp(Buffer.from(svgString))
        .png({ quality: 95 })
        .toBuffer();
}
