import { generateCardPngBuffer } from './utils/cardSvgGenerator.js';

// Helper to clean and format image URLs
function formatImageUrl(img, baseUrl) {
    if (!img) return null;
    let str = String(img).trim();
    if (str.startsWith('http://') || str.startsWith('https://') || str.startsWith('data:')) {
        return str;
    }
    const cleanBase = (baseUrl || 'https://dealora-7st9.onrender.com').replace(/\/+$/, '');
    const cleanImg = str.replace(/^\/+/, '');
    return `${cleanBase}/${cleanImg}`;
}

/**
 * Fetch Card Data from Backend API
 */
async function fetchCardData(cardId, type = 1, cusId = null) {
    const baseUrl = process.env.VITE_API_URL || process.env.API_URL || 'https://dealora-7st9.onrender.com';
    const cleanBase = baseUrl.replace(/\/+$/, '');
    const url = `${cleanBase}/firstloop/customer/fetch-card`;

    const payload = {
        id: Number(cardId),
        type: Number(type) === 2 ? 2 : 1
    };
    if (cusId) {
        payload.cus_id = Number(cusId);
    }

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-Skip-Auth-Redirect': 'true'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            console.warn(`Card API returned status ${response.status} for cardId ${cardId}`);
            return null;
        }

        const data = await response.json();
        if (data && (data.status === 1 || data.status === '1' || data.success)) {
            const rawItem = data.data;
            const item = Array.isArray(rawItem) ? rawItem[0] : rawItem;
            if (!item) return null;

            const isType2 = Number(type) === 2;
            return {
                id: item.id || cardId,
                card_type: isType2 ? 2 : 1,
                title: item.title || item.name || (isType2 ? 'Membership Pass' : 'Stamp Pass'),
                brandName: item.brand_name || item.brandName || 'Merchant',
                brandLogo: formatImageUrl(item.brand_image || item.brandLogo, baseUrl),
                cardholderName: item.customer_name || item.cardholderName || item.cardholder_name || (isType2 ? 'Member Pass' : 'Stamp Pass'),
                total_stamps: Number(item.number_of_stamps || item.total_stamps || 8),
                bgColor: item.background_color || item.bgColor || (isType2 ? '#D97706' : '#0E88B8'),
                bgImage: formatImageUrl(item.background_image || item.bgImage, baseUrl),
                textColor: item.text_color || item.textColor || '#FFFFFF',
                borderColor: item.border_color || item.borderColor || '#00A6D6',
                stampBgColor: item.stamp_background || item.stampBgColor || 'rgba(255, 255, 255, 0.3)',
                stampBorderColor: item.stamp_border_color || item.stampBorderColor || '#FFFFFF',
                stampTextColor: item.stamp_text_color || item.stampTextColor || '#FFFFFF',
                stamp_radius: Number(item.stamp_radius ?? 50),
                expiry: item.expiry || item.valid_thru,
                validityMonths: item.month || item.validity_months || item.validityMonths || 12,
                CustomerStampLevels: item.CustomerStampLevels || item.stamp_levels || item.StampLevels || [],
                qrImg: item.qr_token || item.qrImg || `card-${cardId}`
            };
        }
    } catch (e) {
        console.error('Error fetching card data for image generation:', e.message);
    }
    return null;
}

/**
 * Serverless / Express / Node HTTP Handler for /api/card-image
 */
export default async function handler(req, res) {
    try {
        // Extract params from URL or query
        const urlObj = new URL(req.url, `http://${req.headers?.host || 'localhost'}`);
        const pathSegments = urlObj.pathname.split('/').filter(Boolean);
        
        // Match /api/card-image/:cardId
        let cardId = req.query?.cardId || req.query?.id;
        if (!cardId && pathSegments.length > 0) {
            const lastSegment = pathSegments[pathSegments.length - 1];
            if (lastSegment !== 'card-image' && !isNaN(Number(lastSegment))) {
                cardId = lastSegment;
            }
        }
        cardId = cardId || urlObj.searchParams.get('cardId') || urlObj.searchParams.get('id') || '35';

        const type = Number(req.query?.type || urlObj.searchParams.get('type') || 1);
        const cusId = req.query?.cus_id || urlObj.searchParams.get('cus_id') || null;

        // Fetch card or build fallback with any query params
        let card = await fetchCardData(cardId, type, cusId);

        if (!card) {
            // Fallback card with optional query overrides
            card = {
                id: cardId,
                card_type: type,
                title: urlObj.searchParams.get('title') || (type === 2 ? 'Membership Pass' : 'Stamp Pass'),
                brandName: urlObj.searchParams.get('brand') || 'FirstLoop',
                brandLogo: urlObj.searchParams.get('brandLogo') || null,
                cardholderName: urlObj.searchParams.get('name') || (type === 2 ? 'Member Pass' : 'Stamp Pass'),
                total_stamps: Number(urlObj.searchParams.get('stamps') || 8),
                bgColor: urlObj.searchParams.get('bgColor') || (type === 2 ? '#D97706' : '#0E88B8'),
                bgImage: urlObj.searchParams.get('bgImage') || null,
                textColor: urlObj.searchParams.get('textColor') || '#FFFFFF',
                borderColor: urlObj.searchParams.get('borderColor') || '#00A6D6',
                stampBgColor: 'rgba(255, 255, 255, 0.3)',
                stampBorderColor: '#FFFFFF',
                stampTextColor: '#FFFFFF',
                stamp_radius: 50,
                validityMonths: 12,
                CustomerStampLevels: [],
                qrImg: `card-${cardId}`
            };
        }

        const pngBuffer = await generateCardPngBuffer(card);

        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Content-Length', pngBuffer.length);
        res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=3600');
        res.statusCode = 200;
        
        if (typeof res.send === 'function') {
            res.send(pngBuffer);
        } else {
            res.end(pngBuffer);
        }
    } catch (err) {
        console.error('Error generating card image:', err);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'text/plain');
        res.end('Error generating card image: ' + err.message);
    }
}
