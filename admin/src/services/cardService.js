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
export const getCardStyle = (card, defaultBgColor = '#0E88B8') => {
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
        style.backgroundColor = card.bgColor || card.background_color || defaultBgColor;
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

/**
 * Fetch and format a single Customer Card (Stamp or Membership) with levels and custom details
 * @param {number|string} cardId
 * @param {number|string} cardType - 1 for Stamp Card, 2 for Membership Card
 * @param {number|string} [cusId]
 * @returns {Promise<Object|null>} Formatted card data object
 */
export const fetchCustomerStampLevelsApi = async (cardId, cardType, cusId) => {
    try {
        const id = Number(cardId);
        const type = Number(cardType) === 2 ? 2 : 1;
        const customerId = cusId ? Number(cusId) : undefined;

        const payload = {
            id,
            type
        };
        if (customerId) {
            payload.cus_id = customerId;
        }

        const response = await API.post('firstloop/customer/fetch-card', payload);

        if (response?.data?.status !== 1) {
            console.error('Failed to fetch card:', response?.data?.message || response?.data?.msg);
            return null;
        }

        const rawItem = response?.data?.data;
        const item = Array.isArray(rawItem) ? rawItem[0] : rawItem;

        if (!item) {
            console.error('No card data found in response for ID:', id);
            return null;
        }
        if (type === 1) {
            // TYPE 1: STAMP CARD
            const totalStamps = Number(item.number_of_stamps) || 8;

            const CustomerStampLevels = Array.isArray(item.CustomerStampLevels)
                ? item.CustomerStampLevels
                : Array.isArray(item.stamp_levels)
                    ? item.stamp_levels
                    : [];

            const levelRewards = CustomerStampLevels.length > 0
                ? CustomerStampLevels.map((lvl, idx) => {
                    const rawType = String(
                        lvl.reward_type ?? lvl.type ?? ''
                    ).trim().toLowerCase();

                    const isDiscount =
                        rawType === '2' || rawType === 'discount';

                    const isPaid =
                        rawType === '3' || rawType === 'paid';

                    const rType = isDiscount
                        ? 'Discount'
                        : isPaid
                            ? 'Paid'
                            : 'Free';

                    return {
                        id: Number(lvl.id || lvl.stamp_level_id || 0),
                        stamp: Number(lvl.stamp_number || lvl.stamp) || idx + 1,
                        stamp_number: Number(lvl.stamp_number || lvl.stamp) || idx + 1,
                        status: lvl.status !== undefined ? Number(lvl.status) : (idx < Number(item.current_stamp ?? item.current_stamps ?? item.collected ?? 0) ? 1 : 0),

                        reward:
                            lvl.reward_text ||
                            (
                                isDiscount
                                    ? 'Discount'
                                    : isPaid
                                        ? 'Paid'
                                        : 'Free Item'
                            ),

                        type: rType,

                        // Keep numeric reward type
                        rewardType: Number(lvl.reward_type) || 1,

                        discountVal: isDiscount
                            ? (
                                parseFloat(
                                    lvl.discount ??
                                    lvl.discountVal ??
                                    lvl.reward_text
                                ) || 10
                            )
                            : 0,

                        icon:
                            lvl.icon ||
                            (
                                isDiscount
                                    ? 'fa-percent'
                                    : isPaid
                                        ? 'fa-tag'
                                        : 'fa-gift'
                            ),

                        amt: Number(lvl.amt) || 0
                    };
                })
                : Array.from({ length: totalStamps }).map((_, i) => ({
                    id: 0,
                    stamp: i + 1,
                    stamp_number: i + 1,
                    status: i < Number(item.current_stamp ?? item.current_stamps ?? item.collected ?? 0) ? 1 : 0,
                    reward: `Stamp #${i + 1}`,
                    type: 'Free',
                    rewardType: 1,
                    discountVal: 0,
                    icon: 'fa-gift',
                    amt: 0
                }));

            // Current collected stamps
            const currentStamp = Number(
                item.current_stamp ??
                item.current_stamps ??
                item.collected ??
                0
            );

            // Get applicable rewards
            const applicableRewards = levelRewards.filter(
                (lvl) => Number(lvl.stamp) <= currentStamp + 1
            );

            // Total amount
            const currentAmt = applicableRewards.reduce(
                (acc, lvl) => acc + (Number(lvl.amt) || 0),
                0
            );

            // Total discount percentage
            const discount_val = applicableRewards.reduce(
                (acc, lvl) => acc + (Number(lvl.discountVal) || 0),
                0
            );

            // Get latest/applicable reward
            const latestReward =
                applicableRewards[applicableRewards.length - 1];

            const reward_type = Number(
                latestReward?.rewardType || 0
            );

            const descption =
                latestReward?.reward || '';

            // ---------------------------------------
            // CALCULATE FINAL AMOUNT
            // ---------------------------------------

            let overAll_amt = currentAmt;

            // reward_type = 2 => Percentage Discount
            if (reward_type === 2) {
                const discountAmount =
                    (currentAmt * discount_val) / 100;

                overAll_amt =
                    currentAmt - discountAmount;
            }

            const stampLevelId = Number(
                item.stamp_level_id ||
                latestReward?.id ||
                CustomerStampLevels[currentStamp]?.id ||
                CustomerStampLevels[0]?.id ||
                0
            );

            return {
                id: Number(item.id),
                card_type: 1,

                title: item.title || 'Stamp Pass',

                brandName:
                    item.brand_name || 'Merchant',

                brandLogo:
                    item.brand_image
                        ? getRelativeImagePath(item.brand_image)
                        : null,

                total_stamps: totalStamps,

                cardholderName:
                    item.customer?.name ||
                    item.customer_name ||
                    'Stamp Pass',

                reward:
                    item.reward ||
                    'Special Gift',

                active_members:
                    Number(item.active_members) || 0,

                status:
                    Number(item.status) === 1
                        ? 'Active'
                        : 'Inactive',

                bgColor:
                    item.background_color ||
                    '#0E88B8',

                bgImage:
                    item.background_image
                        ? getRelativeImagePath(item.background_image)
                        : null,

                textColor:
                    item.text_color ||
                    '#FFFFFF',

                borderColor:
                    item.border_color ||
                    '#00A6D6',

                stampBgColor:
                    item.stamp_background ||
                    'rgba(255, 255, 255, 0.3)',

                stampBorderColor:
                    item.stamp_border_color ||
                    '#FFFFFF',

                stampTextColor:
                    item.stamp_text_color ||
                    '#FFFFFF',

                stamp_radius:
                    Number(item.stamp_radius ?? 50),

                qrImg:
                    item.qr_token,

                customer_name:
                    item.customer_name ||
                    item.customer?.name,

                branch_ids:
                    Array.isArray(item.branch_ids)
                        ? item.branch_ids.map(Number)
                        : item.branch_id
                            ? [Number(item.branch_id)]
                            : [],

                CustomerStampLevels,
                levelRewards,
                stamp_level_id: stampLevelId,

                current_stamp:
                    currentStamp,

                discount_val: item.discount_percentage || discount_val,

                reward_type: item.reward_type || reward_type,

                current_amt: Number(item.total_amount
                    || currentAmt).toFixed(2),

                // Amount after discount
                overAll_amt: item.current_amount
                    || overAll_amt,

                descption:item.reward_text|| descption,
            };
        }
        else {
            // TYPE 2: MEMBERSHIP CARD
            return {
                id: Number(item.id),
                card_type: 2,
                title: item.title || item.name || 'Membership Pass',
                brandName: item.brand_name || 'Merchant',
                brandLogo: item.brand_image ? getRelativeImagePath(item.brand_image) : null,
                cardholderName: item.customer?.name || item.customer_name || 'Member Pass',
                qrImg: item.qr_token,
                validityMonths: item.month || item.validityMonths || item.totalMonth || 12,
                expiry: item.expires_at,
                bgColor: item.background_color || '#D97706',
                bgImage: item.background_image ? getRelativeImagePath(item.background_image) : null,
                textColor: item.text_color || '#FFFFFF',
                borderColor: item.border_color || '#EA1031',
                branch_ids: Array.isArray(item.branch_ids)
                    ? item.branch_ids.map(Number)
                    : item.branch_id
                        ? [Number(item.branch_id)]
                        : [],
                status: Number(item.status) === 1 ? 'Active' : 'Inactive'
            };
        }
    } catch (err) {
        console.error('Error fetching card in fetchCustomerStampLevelsApi:', err);
        return null;
    }
};

/**
 * Fetch detailed stamp transaction history and summary for a customer card
 * Endpoint: firstloop/customer/get-customer-card-details
 *
 * @param {string|number} cardId
 * @returns {Promise<Object|null>}
 */
export const fetchCustomerCardDetailsApi = async (cardId) => {
    try {
        const res = await API.post('firstloop/customer/get-customer-card-details', {
            card_id: cardId
        });
        if (res?.data?.status === 1 && res.data.data) {
            return res.data.data;
        }
        return null;
    } catch (err) {
        console.error('Error in fetchCustomerCardDetailsApi:', err);
        return null;
    }
};