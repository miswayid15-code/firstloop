import axios from 'axios';

// Helper: Clean relative image path
export function getRelativeImagePath(value) {
    if (!value) return '';
    let str = String(value).trim();

    if (str.startsWith('data:') || str.startsWith('blob:')) {
        return str;
    }

    const uploadsMatch = str.match(/(uploads\/.*)/i);
    if (uploadsMatch) {
        return uploadsMatch[1].replace(/^\/+/, '');
    }

    while (str.includes('http://') || str.includes('https://')) {
        const lastHttp = str.lastIndexOf('http://');
        const lastHttps = str.lastIndexOf('https://');
        const idx = Math.max(lastHttp, lastHttps);
        try {
            const url = new URL(str.substring(idx));
            str = url.pathname;
        } catch (e) {
            str = str.replace(/^https?:\/\/[^/]+/i, '');
        }
    }

    return str.replace(/^\/+/, '');
}

// Helper: Format image URL with base API URL
export function formatImageUrl(img, baseUrl) {
    if (!img) return '';
    let str = String(img).trim();

    if (str === 'none' || str === 'null' || str === 'undefined' || str === 'false') {
        return '';
    }

    if (str.startsWith('http://') || str.startsWith('https://') || str.startsWith('data:') || str.startsWith('blob:')) {
        return str;
    }

    const rel = getRelativeImagePath(str);
    if (!rel) return '';

    const cleanBase = (baseUrl || '').replace(/\/+$/, '');
    const cleanImg = rel.replace(/^\/+/, '');
    return cleanBase ? `${cleanBase}/${cleanImg}` : cleanImg;
}

/**
 * Standard Node.js helper to fetch card data from Dealora API
 * Compatible with Localhost, Vercel, and DigitalOcean
 */
export async function fetchCardData({ id, type = 1, cus_id = 1, query = {} }) {
    const cardId = Number(id) || 1;
    const cardType = Number(type) === 2 ? 2 : 1;
    const customerId = Number(cus_id) || 1;

    // Resolve API Base URL
    const baseUrl = (
        process.env.VITE_API_URL ||
        process.env.API_URL ||
        'https://dealora-7st9.onrender.com'
    ).replace(/\/+$/, '');

    try {
        const payload = {
            id: cardId,
            type: cardType
        };
        if (customerId) {
            payload.cus_id = customerId;
        }

        const response = await axios.post(`${baseUrl}/firstloop/customer/fetch-card`, payload, {
            timeout: 6000,
            headers: {
                'Content-Type': 'application/json',
                'X-Skip-Auth-Redirect': 'true'
            }
        });

        if (response?.data?.status === 1 && response?.data?.data) {
            const raw = response.data.data;
            const item = Array.isArray(raw) ? raw[0] : raw;

            if (item) {
                const totalStamps = Number(item.number_of_stamps || item.total_stamps || 8);
                const CustomerStampLevels = Array.isArray(item.CustomerStampLevels)
                    ? item.CustomerStampLevels
                    : Array.isArray(item.stamp_levels)
                        ? item.stamp_levels
                        : [];

                const levelRewards = CustomerStampLevels.length > 0
                    ? CustomerStampLevels.map((lvl, idx) => {
                        const rawType = String(lvl.reward_type ?? lvl.type ?? '').trim().toLowerCase();
                        const isDiscount = rawType === '2' || rawType === 'discount';
                        const isPaid = rawType === '3' || rawType === 'paid';
                        const rType = isDiscount ? 'Discount' : isPaid ? 'Paid' : 'Free';

                        return {
                            id: Number(lvl.id || lvl.stamp_level_id || 0),
                            stamp_number: Number(lvl.stamp_number || lvl.stamp) || idx + 1,
                            status: Number(lvl.status) || 0,
                            reward: lvl.reward_text || (isDiscount ? 'Discount' : isPaid ? 'Paid' : 'Free Item'),
                            type: rType,
                            discountVal: isDiscount ? parseFloat(lvl.discount ?? lvl.discountVal ?? 10) : 0,
                            icon: lvl.icon || (isDiscount ? 'fa-percent' : isPaid ? 'fa-tag' : 'fa-gift'),
                            amt: Number(lvl.amt) || 0
                        };
                    })
                    : Array.from({ length: totalStamps }).map((_, i) => ({
                        id: 0,
                        stamp_number: i + 1,
                        status: i < Number(item.current_stamp ?? item.collected ?? 0) ? 1 : 0,
                        reward: `Stamp #${i + 1}`,
                        type: 'Free',
                        discountVal: 0,
                        icon: 'fa-gift',
                        amt: 0
                    }));

                const brandLogoRaw = item.brand_image || item.brand_logo;
                const bgImageRaw = item.background_image || item.bg_image || item.bgImage;

                return {
                    id: cardId,
                    card_type: cardType,
                    title: item.title || (cardType === 2 ? 'VIP Membership Pass' : 'Loyalty Stamp Card'),
                    brandName: item.brand_name || 'FirstPass',
                    brandLogo: formatImageUrl(brandLogoRaw, baseUrl),
                    total_stamps: totalStamps,
                    cardholderName: item.customer_name || item.customer?.name || 'Customer',
                    bgColor: item.background_color || (cardType === 2 ? '#D97706' : '#0E88B8'),
                    bgImage: formatImageUrl(bgImageRaw, baseUrl),
                    textColor: item.text_color || '#FFFFFF',
                    borderColor: item.border_color || (cardType === 2 ? '#FFFFFF' : '#00A6D6'),
                    stampBgColor: item.stamp_background || 'rgba(255, 255, 255, 0.3)',
                    stampBorderColor: item.stamp_border_color || '#FFFFFF',
                    stampTextColor: item.stamp_text_color || '#FFFFFF',
                    stamp_radius: Number(item.stamp_radius ?? 50),
                    qr_token: item.qr_token || `dealora-card-${cardId}-${customerId}`,
                    CustomerStampLevels,
                    levelRewards,
                    validity: item.validity || '12 Months',
                    description: item.description || ''
                };
            }
        }
    } catch (err) {
        console.warn('fetchCardData API failed or timed out, using fallback parameters:', err.message);
    }

    // Fallback from query parameters
    const totalStamps = Number(query.stamps || query.total_stamps || 8);
    const discountVal = query.discount || query.discountVal || '10';
    const queryBgImage = query.bgImage || query.bg_image || query.background_image || '';
    const queryLogo = query.logo || query.brand_logo || query.brand_image || '';

    return {
        id: cardId,
        card_type: cardType,
        title: query.title || (cardType === 2 ? 'Membership Pass' : 'Digital Stamp Card'),
        brandName: query.brand || query.brand_name || 'FirstPass',
        brandLogo: formatImageUrl(queryLogo, baseUrl),
        total_stamps: totalStamps,
        cardholderName: query.name || query.customer_name || 'Customer',
        bgColor: query.bgColor || query.bg_color || (cardType === 2 ? '#D97706' : '#0E88B8'),
        bgImage: formatImageUrl(queryBgImage, baseUrl),
        textColor: query.textColor || '#FFFFFF',
        borderColor: query.borderColor || query.border_color || '#FFFFFF',
        stampBgColor: query.stampBgColor || 'rgba(255, 255, 255, 0.3)',
        stampBorderColor: query.stampBorderColor || '#FFFFFF',
        stampTextColor: query.stampTextColor || '#FFFFFF',
        stamp_radius: 50,
        qr_token: query.qr || `dealora-card-${cardId}-${customerId}`,
        levelRewards: Array.from({ length: totalStamps }).map((_, i) => ({
            stamp_number: i + 1,
            reward: i + 1 === totalStamps ? `${discountVal}% OFF Reward` : 'Free Reward',
            type: i + 1 === totalStamps ? 'Discount' : 'Free',
            discountVal: i + 1 === totalStamps ? Number(discountVal) : 0,
            icon: 'fa-gift',
            status: 0
        })),
        validity: query.validity || '12 Months',
        description: query.description || ''
    };
}
