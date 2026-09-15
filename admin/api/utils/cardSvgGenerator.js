import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import QRCode from 'qrcode';
import axios from 'axios';

// FontAwesome 6 SVG Vector Paths
const SVG_ICONS = {
    user: 'M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256zm-45.7 48C79.8 304 0 383.8 0 482.3C0 498.7 13.3 512 29.7 512H418.3c16.4 0 29.7-13.3 29.7-29.7C448 383.8 368.2 304 269.7 304H178.3z',
    gift: 'M112 0a64 64 0 0 0 -64 64v32H16C7.2 96 0 103.2 0 112v48c0 8.8 7.2 16 16 16h16v272c0 35.3 28.7 64 64 64h320c35.3 0 64-28.7 64-64V176h16c8.8 0 16-7.2 16-16V112c0-8.8-7.2-16-16-16h-32V64a64 64 0 0 0 -64-64H112zM288 96V64a32 32 0 0 1 32-32h64a32 32 0 0 1 32 32v32H288zM224 96H96V64a32 32 0 0 1 32-32h64a32 32 0 0 1 32 32v32zM80 176h144v288H96c-17.7 0-32-14.3-32-32V176h16zm208 288V176h144v256c0 17.7-14.3 32-32 32H288z',
    tag: 'M0 80V229.5c0 17 6.7 33.3 18.7 45.3l192 192c25 25 65.5 25 90.5 0L467.5 300.5c25-25 25-65.5 0-90.5l-192-192C263.5 6.7 247.2 0 230.2 0H80C35.8 0 0 35.8 0 80zm112 48a48 48 0 1 1 0-96 48 48 0 1 1 0 96z'
};

// Helper: Escape XML entities
function escapeXml(unsafe) {
    if (!unsafe) return '';
    return String(unsafe)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

// Helper: Convert remote image or local file to base64 PNG Data URL
async function getBase64Image(imageUrl) {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('data:image/')) return imageUrl;
    try {
        const response = await axios.get(imageUrl, {
            responseType: 'arraybuffer',
            timeout: 5000
        });
        // Convert any format (including WebP, JPEG, GIF) to standard PNG buffer via Sharp
        const pngBuf = await sharp(Buffer.from(response.data)).png().toBuffer();
        return `data:image/png;base64,${pngBuf.toString('base64')}`;
    } catch (e) {
        console.warn('Could not fetch or convert background/brand image:', imageUrl, e.message);
        return null;
    }
}

// Pre-load local FirstLoop favicon base64
let cachedFlLogoBase64 = null;
function getLocalFirstLoopLogo() {
    if (cachedFlLogoBase64) return cachedFlLogoBase64;
    try {
        const logoPath = path.resolve(process.cwd(), 'src', 'assets', 'img', 'firstloop-favicon.png');
        if (fs.existsSync(logoPath)) {
            const buf = fs.readFileSync(logoPath);
            cachedFlLogoBase64 = `data:image/png;base64,${buf.toString('base64')}`;
            return cachedFlLogoBase64;
        }
    } catch (e) {}
    return null;
}

/**
 * Generate a 1:1 server-side PNG reproduction of CustomerCard.jsx
 * Dimensions: 840 x 480 (2x high-resolution retina buffer for crisp rendering)
 */
export async function generateCardPngBuffer(card) {
    const width = 840;
    const height = 480;
    const type = Number(card.card_type || 1) === 2 ? 2 : 1;

    // Card Colors & Dimensions matching CustomerCard.jsx
    const defaultBg = type === 2 ? '#D97706' : '#0E88B8';
    const bgColor = card.bgColor || defaultBg;
    const borderColor = card.borderColor || (type === 2 ? '#FFFFFF' : '#00A6D6');
    const textColor = card.textColor || '#FFFFFF';
    const totalStamps = Number(card.total_stamps || card.number_of_stamps || 8);
    const stampRadiusPercent = Number(card.stamp_radius ?? 50);
    const stampBorderRadius = (stampRadiusPercent / 100) * 36; // 72px stamp width

    const stampBgColor = card.stampBgColor || 'rgba(255, 255, 255, 0.3)';
    const stampBorderColor = card.stampBorderColor || '#FFFFFF';
    const stampTextColor = card.stampTextColor || textColor;

    const brandName = escapeXml(card.brandName || 'Merchant');
    const cardTitle = escapeXml(card.title || (type === 2 ? 'Membership Pass' : 'Stamp Pass'));
    const customerName = escapeXml(card.cardholderName || card.customer_name || (type === 2 ? 'Member Pass' : 'Stamp Pass'));
    const validity = escapeXml(card.validity || '12 Months');
    const scanText = type === 2 ? 'SCAN PASS' : 'SCAN TO STAMP';

    // 1. Generate QR Code Matrix
    const qrData = card.qr_token || card.qrImg || `dealora-${card.id || 1}`;
    let qrSvg = '';
    try {
        qrSvg = await QRCode.toString(qrData, {
            type: 'svg',
            margin: 0,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        });
        qrSvg = qrSvg.replace(/<\?xml.*?\?>/, '').replace(/<svg[^>]*>/, '').replace(/<\/svg>/, '');
    } catch (err) {
        console.warn('QR Code generation error:', err.message);
    }

    // 2. Fetch Brand Logo & Background Image
    let brandLogoBase64 = null;
    if (card.brandLogo) {
        brandLogoBase64 = await getBase64Image(card.brandLogo);
    }

    let bgImageBase64 = null;
    if (card.bgImage && card.bgImage !== 'none' && card.bgImage !== 'null' && card.bgImage !== 'undefined') {
        bgImageBase64 = await getBase64Image(card.bgImage);
    }

    const flLogoBase64 = getLocalFirstLoopLogo();

    // 3. Build Stamp Grid Elements (Type 1)
    let stampGridSvg = '';
    if (type === 1) {
        const levels = card.levelRewards || card.CustomerStampLevels || card.stamp_levels || [];
        const stampW = 72;
        const stampH = 72;
        const gapX = 12;
        const gapY = 12;
        const maxCols = 5;
        const startX = 44;
        const startY = 196;

        for (let i = 0; i < totalStamps; i++) {
            const col = i % maxCols;
            const row = Math.floor(i / maxCols);
            const x = startX + col * (stampW + gapX);
            const y = startY + row * (stampH + gapY);

            const stampNum = i + 1;
            const rewardItem = levels.find(l => Number(l.stamp_number) === stampNum) || levels[i];
            const rawType = String(rewardItem?.reward_type ?? rewardItem?.type ?? '').trim().toLowerCase();
            const isDiscount = rawType === '2' || rawType === 'discount';
            const isPaid = rawType === '3' || rawType === 'paid';
            const isFree = rawType === '1' || rawType === 'free';

            let insideContent = '';
            if (rewardItem && isDiscount) {
                const disc = Number(rewardItem.discount ?? rewardItem.discountVal ?? (parseInt(rewardItem.reward_text) || 10));
                insideContent = `
                    <text x="${x + stampW / 2}" y="${y + stampH / 2 + 7}" 
                          font-family="system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" 
                          font-size="20" font-weight="900" fill="${stampTextColor}" text-anchor="middle" dominant-baseline="central">
                        ${disc}%
                    </text>
                `;
            } else if (rewardItem && isPaid) {
                insideContent = `
                    <g transform="translate(${x + (stampW - 28) / 2}, ${y + (stampH - 28) / 2}) scale(0.054)">
                        <path d="${SVG_ICONS.tag}" fill="${stampTextColor}" />
                    </g>
                `;
            } else if (rewardItem && isFree) {
                insideContent = `
                    <g transform="translate(${x + (stampW - 28) / 2}, ${y + (stampH - 28) / 2}) scale(0.054)">
                        <path d="${SVG_ICONS.gift}" fill="${stampTextColor}" />
                    </g>
                `;
            } else {
                insideContent = `
                    <text x="${x + stampW / 2}" y="${y + stampH / 2 + 7}" 
                          font-family="system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" 
                          font-size="26" font-weight="800" fill="${stampTextColor}" text-anchor="middle" dominant-baseline="central">
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

    // 4. Assemble the Full 1:1 SVG Layout
    const svgString = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <clipPath id="cardClip">
                <rect x="0" y="0" width="${width}" height="${height}" rx="44" ry="44" />
            </clipPath>
        </defs>

        <!-- Rounded Card Container -->
        <g clip-path="url(#cardClip)">
            <!-- Card Background: If Background Image is provided, display it with cover; Otherwise, use background color -->
            ${bgImageBase64 ? `
                <image href="${bgImageBase64}" x="0" y="0" width="${width}" height="${height}" preserveAspectRatio="xMidYMid slice" />
            ` : `
                <rect x="0" y="0" width="${width}" height="${height}" fill="${bgColor}" />
            `}

            <!-- 4px Border Overlay (2px at 1x) -->
            <rect x="2" y="2" width="${width - 4}" height="${height - 4}" rx="44" ry="44" fill="none" stroke="${borderColor}" stroke-width="4" />

            <!-- LEFT COLUMN (padding 44px) -->
            <g transform="translate(44, 44)">
                <!-- BRAND LOGO & BRAND NAME -->
                <g>
                    <!-- White Rounded Box 56x56 (28x28 at 1x, borderRadius 16px) -->
                    <rect x="0" y="0" width="56" height="56" rx="16" ry="16" fill="#FFFFFF" />
                    ${brandLogoBase64 ? `
                        <image href="${brandLogoBase64}" x="4" y="4" width="48" height="48" preserveAspectRatio="xMidYMid meet" />
                    ` : (flLogoBase64 ? `
                        <image href="${flLogoBase64}" x="4" y="4" width="48" height="48" preserveAspectRatio="xMidYMid meet" />
                    ` : `
                        <text x="28" y="32" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="900" fill="#0E88B8" text-anchor="middle" dominant-baseline="central">FP</text>
                    `)}

                    <!-- Brand Name -->
                    <text x="72" y="38" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" 
                          font-size="32" font-weight="800" fill="${textColor}">
                        ${brandName}
                    </text>
                </g>

                <!-- CARD TITLE -->
                <text x="0" y="94" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" 
                      font-size="24" font-weight="700" fill="${textColor}" opacity="0.95">
                    ${cardTitle}
                </text>

                <!-- CARDHOLDER NAME with User Vector Icon -->
                <g transform="translate(0, 114)">
                    <g transform="scale(0.046)">
                        <path d="${SVG_ICONS.user}" fill="${textColor}" opacity="0.9" />
                    </g>
                    <text x="30" y="21" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" 
                          font-size="28" font-weight="700" fill="${textColor}">
                        ${customerName}
                    </text>
                </g>
            </g>

            <!-- TYPE 1: STAMP GRID -->
            ${type === 1 ? stampGridSvg : `
                <!-- TYPE 2: VALID THRU -->
                <g transform="translate(44, 250)">
                    <line x1="0" y1="0" x2="400" y2="0" stroke="rgba(255,255,255,0.25)" stroke-width="2" />
                    <text x="0" y="30" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="600" fill="${textColor}" opacity="0.85" letter-spacing="1">
                        VALID THRU
                    </text>
                    <text x="0" y="74" font-family="system-ui, -apple-system, sans-serif" font-size="32" font-weight="800" fill="${textColor}">
                        ${validity}
                    </text>
                </g>
            `}

            <!-- RIGHT COLUMN: QR CODE CONTAINER (192px width, 184x184 QR Canvas) -->
            <g transform="translate(604, 48)">
                <rect x="0" y="0" width="192" height="192" rx="16" ry="16" fill="#FFFFFF" />
                <g transform="translate(4, 4) scale(4.4)">
                    ${qrSvg}
                </g>

                <!-- SCAN LABEL -->
                <text x="96" y="228" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" 
                      font-size="19" font-weight="700" fill="${textColor}" opacity="0.9" text-anchor="middle" letter-spacing="1">
                    ${scanText}
                </text>
            </g>

            <!-- FOOTER: POWERED BY FIRSTLOOP.CO.IN -->
            <g transform="translate(${width - 44}, ${height - 24})">
                <text x="0" y="0" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" 
                      font-size="19" font-weight="600" fill="${textColor}" opacity="0.9" text-anchor="end">
                    powered by ${flLogoBase64 ? ' ' : ''}<tspan font-weight="800">firstloop</tspan>
                </text>
            </g>
        </g>
    </svg>
    `;

    // Convert SVG to crisp PNG buffer via Sharp
    return await sharp(Buffer.from(svgString))
        .png({ quality: 100 })
        .toBuffer();
}
