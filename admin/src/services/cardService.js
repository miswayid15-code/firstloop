import API from '../api.js';

// Helper: Clean relative image path
export const getRelativeImagePath = (value) => {
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
};

// Helper: Format image URL with base API URL
export const formatImageUrl = (img) => {
    if (!img) return '';
    let str = String(img).trim();

    if (str.startsWith('http://') || str.startsWith('https://') || str.startsWith('data:') || str.startsWith('blob:')) {
        return str;
    }

    const rel = getRelativeImagePath(str);
    if (!rel) return '';

    const baseUrl = import.meta.env.VITE_API_URL || '';
    const cleanBase = baseUrl.replace(/\/+$/, '');
    const cleanImg = rel.replace(/^\/+/, '');
    return cleanBase ? `${cleanBase}/${cleanImg}` : cleanImg;
};

// Helper: Card background and border style computation
export const getCardStyle = (card) => {
    if (!card) return {};
    const style = {
        border: `2px solid ${card.borderColor || card.border_color || 'rgba(255,255,255,0.4)'}`
    };
    const bgImg = card.bgImage || card.background_image;
    if (bgImg && bgImg !== 'none' && bgImg !== 'null' && bgImg !== 'undefined') {
        style.backgroundImage = `url(${formatImageUrl(bgImg)})`;
        style.backgroundSize = 'cover';
        style.backgroundPosition = 'center';
        style.backgroundRepeat = 'no-repeat';
    } else {
        style.backgroundColor = card.bgColor || card.background_color || '#0E88B8';
    }
    return style;
};

// Helper: Format validity months for pass display (e.g. 12 -> 12 Months)
export const formatValidity = (val) => {
    if (!val) return '12 Months';
    const str = String(val).trim();
    if (/^\d+$/.test(str)) {
        return `${str} Month${Number(str) > 1 ? 's' : ''}`;
    }
    return str;
};

/**
 * Fetch and format Stamp Cards from API
 * @param {Object} params
 * @param {number|string} [params.merchantId]
 * @param {number|string} [params.branchId]
 * @param {string} [params.fallbackBrandName]
 * @returns {Promise<Array>} Formatted stamp card array
 */
export const fetchStampCardsApi = async ({ merchantId, branchId, fallbackBrandName = 'Merchant' }) => {
    try {
        const endpoint = branchId ? 'firstloop/merchant/fetch-br-stamp-card' : 'firstloop/merchant/fetch-stamp-card';
        const payload = branchId ? { branch_id: Number(branchId), br_id: Number(branchId) } : { mer_id: Number(merchantId) };

        const response = await API.post(endpoint, payload);

        if (response?.data?.status === 1 || response?.data?.status === '1' || response?.data?.success) {
            const rawList = response.data.data || response.data.stamp_cards || response.data.cards || [];
            const list = Array.isArray(rawList) ? rawList : [];

            return list.map(item => ({
                id: item.id || item._id,
                title: item.title || 'Stamp Pass',
                brandName: item.brand_name || fallbackBrandName,
                brandLogo: item.brand_image ? getRelativeImagePath(item.brand_image) : null,
                total_stamps: Number(item.number_of_stamps) || 8,
                // reward: item.reward || 's',
                active_members: item.active_members || 0,
                expiry: item.expiry || '2026-12-31',
                status: 'Active',
                bgColor: item.background_color || '#0E88B8',
                bgImage: item.background_image ? getRelativeImagePath(item.background_image) : null,
                textColor: item.text_color || '#FFFFFF',
                borderColor: item.border_color || '#00A6D6',
                stampBgColor: item.stamp_background || 'rgba(255, 255, 255, 0.3)',
                stampBorderColor: item.stamp_border_color || '#FFFFFF',
                stampTextColor: item.stamp_text_color || '#FFFFFF',
                stamp_radius: Number(item.stamp_radius ?? 50),
                preset: 'Custom',
                branch_ids: Array.isArray(item.branch_ids)
                    ? item.branch_ids.map(Number)
                    : (item.branch_id ? [Number(item.branch_id)] : []),
                levelRewards: (() => {
                    const rawLevels = Array.isArray(item.StampLevels)
                        ? item.StampLevels
                        : (Array.isArray(item.stamp_levels) ? item.stamp_levels : []);
                    if (rawLevels.length > 0) {
                        return rawLevels.map((lvl, idx) => {
                            const rawType = String(lvl.reward_type ?? lvl.type ?? '').trim().toLowerCase();
                            const isDiscount = rawType === '2' || rawType === 'discount';
                            const isPaid = rawType === '3' || rawType === 'paid';
                            const rType = isDiscount ? 'Discount' : (isPaid ? 'Paid' : 'Free');
                            const disc = parseFloat(lvl.discount ?? lvl.discountVal ?? (isDiscount ? (parseFloat(lvl.reward_text) || 0) : 0)) || 0;
                            return {
                                stamp: Number(lvl.stamp_number || lvl.stamp) || idx + 1,
                                reward: lvl.reward_text || lvl.reward || (isDiscount ? `${disc}% Discount` : (isPaid ? 'Paid Perk' : 'Free Item')),
                                type: rType,
                                discountVal: disc,
                                discount: disc,
                                icon: isDiscount ? 'fa-percent' : (isPaid ? (lvl.icon || 'fa-tag') : 'fa-gift'),
                                amt: Number(lvl.amt) || 0,
                                category_id: lvl.category_id || null
                            };
                        });
                    }
                    return Array.from({ length: Number(item.number_of_stamps) || 8 }).map((_, i) => ({
                        stamp: i + 1,
                        reward: `Stamp #${i + 1}`,
                        type: 'Free',
                        discountVal: 0,
                        discount: 0,
                        icon: 'fa-gift',
                        amt: 0
                    }));
                })()
            }));
        }
        return [];
    } catch (err) {
        console.error('Error fetching stamp cards API:', err);
        return [];
    }
};

/**
 * Fetch and format Membership Cards from API
 * @param {Object} params
 * @param {number|string} [params.merchantId]
 * @param {number|string} [params.branchId]
 * @param {string} [params.fallbackBrandName]
 * @returns {Promise<Array>} Formatted membership card array
 */
export const fetchMembershipCardsApi = async ({ merchantId, branchId, fallbackBrandName = 'FirstLoop' }) => {
    try {
        const endpoint = branchId ? 'firstloop/merchant/fetch-br-membership-card' : 'firstloop/merchant/fetch-membership-card';
        const payload = branchId ? { branch_id: Number(branchId), br_id: Number(branchId) } : { mer_id: Number(merchantId) };
        const response = await API.post(endpoint, payload);

        if (response?.data?.status === 1 || response?.data?.status === '1' || response?.data?.success) {
            const rawList = response.data.data || response.data.membership_cards || response.data.cards || [];
            const list = Array.isArray(rawList) ? rawList : [];

            return list.map(item => ({
                id: item.id || item._id,
                name: item.name || item.title || 'Membership Card',
                title: item.name || item.title || 'Membership Card',
                cardholderName: item.cardholder_name || item.cardholderName || 'Member Pass',
                brandName: item.brand_name || fallbackBrandName,
                brandLogo: item.brand_image ? getRelativeImagePath(item.brand_image) : null,
                validityMonths: item.month || item.validity_months || item.validityMonths || 12,
                totalMonth: item.month || item.validity_months || item.validityMonths || 12,
                tier: item.tier || 'VIP Pass',
                status: 'Active',
                bgColor: item.background_color || item.bgColor || '#0E88B8',
                bgImage: item.background_image ? getRelativeImagePath(item.background_image) : (item.bgImage ? getRelativeImagePath(item.bgImage) : null),
                textColor: item.text_color || item.textColor || '#FFFFFF',
                borderColor: item.border_color || item.borderColor || '#00A6D6',
                branch_ids: Array.isArray(item.branch_ids)
                    ? item.branch_ids.map(Number)
                    : (item.branch_id ? [Number(item.branch_id)] : [])
            }));
        }
        return [];
    } catch (err) {
        console.error('Error fetching membership cards API:', err);
        return [];
    }
};
