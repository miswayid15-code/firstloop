import API from '../api.js';
import html2canvas from 'html2canvas';

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
 * Clean phone number for WhatsApp API (combines country_code and phone into international digits)
 * Handles country_code being number (e.g. 91) or string (e.g. "91", "+91")
 * Handles phone having trunk zeros (e.g. "08608862409") or already prefixed with country code
 * @param {string|number} phone
 * @param {string|number} [countryCode]
 * @returns {string} digits only
 */
export const cleanPhoneForWhatsApp = (phone, countryCode = '') => {
    if (!phone) return '';
    const p = String(phone).trim();
    const cc = String(countryCode || '').replace(/\D/g, '');
    let digits = p.replace(/\D/g, '');
    if (!digits) return '';

    if (cc) {
        // If digits start with trunk prefix '0' (common in local formats), strip it
        if (digits.startsWith('0')) {
            digits = digits.replace(/^0+/, '');
        }
        // If digits do not already start with the country code, prepend it
        if (!digits.startsWith(cc)) {
            digits = `${cc}${digits}`;
        }
    }
    return digits;
};


/**
 * Ensures all fonts (Font Awesome, web fonts), <img> elements, and background images
 * are fully loaded before html2canvas captures the card DOM element.
 * @param {HTMLElement} element - The card container element to capture
 * @returns {Promise<void>}
 */
export const waitForCardAssets = async (element) => {
    if (!element) return;

    // 1. Wait for document fonts (Font Awesome, web fonts) to be fully loaded
    if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
        try {
            await document.fonts.ready;
        } catch (e) {
            console.warn('Font loading check error:', e);
        }
    }

    // 2. Wait for all <img> tags inside the card
    const images = Array.from(element.querySelectorAll('img'));
    const imgPromises = images.map((img) => {
        if (img.complete && img.naturalHeight !== 0) {
            return Promise.resolve();
        }
        return new Promise((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => resolve();
            setTimeout(resolve, 3000);
        });
    });

    // 3. Wait for CSS background images on element or children
    const bgImage = window.getComputedStyle(element).backgroundImage;
    if (bgImage && bgImage !== 'none') {
        const matches = bgImage.match(/url\(["']?([^"')]+)["']?\)/);
        if (matches && matches[1]) {
            const bgPromise = new Promise((resolve) => {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.src = matches[1];
                if (img.complete && img.naturalHeight !== 0) {
                    resolve();
                } else {
                    img.onload = () => resolve();
                    img.onerror = () => resolve();
                    setTimeout(resolve, 3000);
                }
            });
            imgPromises.push(bgPromise);
        }
    }

    await Promise.all(imgPromises);

    // 4. Brief delay to guarantee browser render tree and subpixel layout stabilization
    await new Promise((resolve) => setTimeout(resolve, 150));
};

/**
 * Accurately captures the rendered card element into an HTML5 Canvas matching the Live Card Preview exactly.
 * - Waits for all fonts (Font Awesome, web fonts) and images (img tags & CSS background)
 * - Measures the exact live rendered dimensions (width and height)
 * - Locks dimensions in the cloned document so responsive widths (width: 100%, max-width) do not stretch to iframe width
 * - Uses scale: 2, useCORS: true, backgroundColor: null
 *
 * @param {HTMLElement} cardElement - The live DOM container element of the card
 * @param {Object} [customOptions] - Optional html2canvas overrides
 * @returns {Promise<HTMLCanvasElement>}
 */
export const captureCardCanvas = async (cardElement, customOptions = {}) => {
    if (!cardElement) {
        throw new Error('Card element not provided for capture');
    }

    // 1. Wait for document fonts to be ready
    if (document.fonts?.ready) {
        try {
            await document.fonts.ready;
        } catch (e) {
            console.warn('Font loading check error:', e);
        }
    }

    // 2. Wait for images in the original card element
    const origImages = cardElement.querySelectorAll('img');
    await Promise.all(
        Array.from(origImages).map((img) => {
            if (img.complete && img.naturalWidth > 0) return Promise.resolve();
            return new Promise((resolve) => {
                img.onload = resolve;
                img.onerror = resolve;
            });
        })
    );

    // 3. Detect the card's original/base design dimensions from computed CSS / style
    const computed = window.getComputedStyle(cardElement);
    const parsedMaxWidth = parseFloat(cardElement.style.maxWidth || computed.maxWidth);
    const parsedWidth = parseFloat(cardElement.style.width || computed.width);

    // Original base width is the unscaled card design width (e.g. 380px or 420px)
    const baseWidth = (!isNaN(parsedMaxWidth) && parsedMaxWidth > 0)
        ? parsedMaxWidth
        : ((!isNaN(parsedWidth) && parsedWidth > 0) ? parsedWidth : 380);

    // 4. Clone the card for export
    const clone = cardElement.cloneNode(true);

    // Transfer HTML5 canvas bitmap data (e.g. QRCodeCanvas) to the clone
    const origCanvases = cardElement.querySelectorAll('canvas');
    const cloneCanvases = clone.querySelectorAll('canvas');
    origCanvases.forEach((origCanvas, idx) => {
        const cloneCanvas = cloneCanvases[idx];
        if (cloneCanvas) {
            cloneCanvas.width = origCanvas.width;
            cloneCanvas.height = origCanvas.height;
            const ctx = cloneCanvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(origCanvas, 0, 0);
            }
        }
    });

    // 5. Remove responsive scaling from the clone only and set to fixed original dimensions
    clone.style.transform = 'none';
    clone.style.webkitTransform = 'none';
    clone.style.zoom = '1';
    clone.style.width = `${baseWidth}px`;
    clone.style.minWidth = `${baseWidth}px`;
    clone.style.maxWidth = `${baseWidth}px`;
    clone.style.boxSizing = 'border-box';
    clone.style.margin = '0';
    clone.style.flexShrink = '0';

    // 6. Temporarily place the clone in an off-screen container
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '-99999px';
    container.style.left = '-99999px';
    container.style.width = `${baseWidth}px`;
    container.style.zIndex = '-9999';
    container.style.opacity = '1';
    container.style.pointerEvents = 'none';
    container.style.overflow = 'visible';

    container.appendChild(clone);
    document.body.appendChild(container);

    let canvas;
    try {
        // Wait for clone images to be ready
        const cloneImages = clone.querySelectorAll('img');
        await Promise.all(
            Array.from(cloneImages).map((img) => {
                if (img.complete && img.naturalWidth > 0) return Promise.resolve();
                return new Promise((resolve) => {
                    img.onload = resolve;
                    img.onerror = resolve;
                });
            })
        );

        // Determine natural base height at the original unscaled baseWidth
        const baseHeight = clone.offsetHeight || clone.scrollHeight || parseFloat(computed.minHeight) || 240;
        clone.style.height = `${baseHeight}px`;
        clone.style.minHeight = `${baseHeight}px`;
        clone.style.maxHeight = `${baseHeight}px`;

        // 7. Capture the unscaled clone using html2canvas
        canvas = await html2canvas(clone, {
            scale: 2,
            useCORS: true,
            allowTaint: false,
            backgroundColor: null,
            logging: false,
            width: baseWidth,
            height: baseHeight,
            windowWidth: baseWidth,
            windowHeight: baseHeight,
            scrollX: 0,
            scrollY: 0,
            onclone: async (clonedDocument) => {
                if (clonedDocument.fonts?.ready) {
                    try {
                        await clonedDocument.fonts.ready;
                    } catch (e) {
                        console.warn('Cloned font loading error:', e);
                    }
                }
            },
            ...customOptions
        });
    } finally {
        // 8. Remove the temporary off-screen container
        if (container && container.parentNode) {
            container.parentNode.removeChild(container);
        }
    }

    return canvas;
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
                ...item,
                id: item.id || item._id,
                title: item.title || 'Stamp Pass',
                brandName: item.brand_name || fallbackBrandName,
                brandLogo: item.brand_image ? getRelativeImagePath(item.brand_image) : null,
                total_stamps: Number(item.number_of_stamps) || 8,
                // reward: item.reward || 's',
                active_members: item.active_members || 0,
                month: item.month || item.validity_months || item.validityMonths || item.totalMonth || item.total_month || 12,
                validityMonths: item.month || item.validity_months || item.validityMonths || item.totalMonth || item.total_month || 12,
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
                qr_color: item.qr_color || item.qrColor || '#FFFFFF',
                qrColor: item.qr_color || item.qrColor || '#FFFFFF',
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
                                category_id: lvl.category_id || null,
                                free_stamp: Number(lvl.free_stamp) === 1 ? 1 : 0,
                                free_text: lvl.free_text || ''
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

        const response = await API.post('firstloop/customer/fetch-card', payload, {
            skipAuthRedirect: true,
            headers: {
                'X-Skip-Auth-Redirect': 'true'
            }
        });

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
                        status: Number(lvl.status) || 0,

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

                        amt: Number(lvl.amt) || 0,
                        free_stamp: Number(lvl.free_stamp) === 1 ? 1 : 0,
                        free_text: lvl.free_text || ''
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
            const nextStampNumber = currentStamp + 1;

            // ---------------------------------------
            // GET ONLY THE NEXT STAMP LEVEL
            // ---------------------------------------

            const latestReward = levelRewards.find(
                (lvl) => Number(lvl.stamp_number) === nextStampNumber
            );

            // ---------------------------------------
            // CURRENT AMOUNT
            // ONLY THIS STAMP AMOUNT
            // ---------------------------------------

            const currentAmt = Number(
                latestReward?.amt || 0
            );

            // ---------------------------------------
            // DISCOUNT FOR THIS STAMP ONLY
            // ---------------------------------------

            const discount_val = Number(
                latestReward?.discountVal || 0
            );

            // ---------------------------------------
            // REWARD TYPE FOR THIS STAMP
            // ---------------------------------------

            const reward_type = Number(
                latestReward?.rewardType || 0
            );

            // ---------------------------------------
            // REWARD DESCRIPTION
            // ---------------------------------------

            const descption =
                latestReward?.reward || '';

            let overAll_amt = currentAmt;

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

                qr_color:
                    item.qr_color ||
                    item.qrColor ||
                    '#FFFFFF',

                qrColor:
                    item.qr_color ||
                    item.qrColor ||
                    '#FFFFFF',

                customer:
                    item.customer || item.Customer || null,

                customer_id:
                    item.customer_id || item.cus_id || item.customer?.id || item.Customer?.id || null,

                customer_name:
                    item.customer_name ||
                    item.customer?.name ||
                    item.Customer?.name,

                customer_phone:
                    item.customer?.phone ||
                    item.Customer?.phone ||
                    item.phone ||
                    item.mobile ||
                    null,

                customer_country_code:
                    item.customer?.country_code ||
                    item.Customer?.country_code ||
                    item.country_code ||
                    null,

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

                descption: item.reward_text || descption,
                free_stamp: Number(item.free_stamp ?? latestReward?.free_stamp ?? 0) === 1 ? 1 : 0,
                free_text: item.free_text || latestReward?.free_text || '',
                expires_at: item.expires_at || item.expiry || null,
                expiry: item.expires_at || item.expiry || null,
                month: item.month || null,
                is_completed: Number(item.is_completed ?? (currentStamp >= totalStamps ? 1 : 0))
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
                cardholderName: item.customer?.name || item.Customer?.name || item.customer_name || 'Member Pass',
                customer: item.customer || item.Customer || null,
                customer_id: item.customer_id || item.cus_id || item.customer?.id || item.Customer?.id || null,
                customer_name: item.customer?.name || item.Customer?.name || item.customer_name || 'Member Pass',
                customer_phone: item.customer?.phone || item.Customer?.phone || item.phone || item.mobile || null,
                customer_country_code: item.customer?.country_code || item.Customer?.country_code || item.country_code || null,
                qrImg: item.qr_token,
                qr_color: item.qr_color || item.qrColor || '#FFFFFF',
                qrColor: item.qr_color || item.qrColor || '#FFFFFF',
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
                status: Number(item.status) === 1 ? 'Active' : 'Inactive',
                is_completed: Number(item.is_completed || 0)
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

/**
 * Format expiry date supporting DD/MM/YY, DD/MM/YYYY, ISO, and standard date formats.
 * Correctly treats first number as Day and second number as Month for slash/dash formats.
 *
 * @param {string|Date} val - Expiry date string (e.g. "12/09/28", "12/09/2028", "2028-09-12")
 * @returns {string|null} Formatted date like "12 Sep 2028"
 */
export const formatExpiryDate = (val) => {
    if (!val) return null;
    try {
        const str = String(val).trim();
        if (!str) return null;

        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        // 1. DD/MM/YY or DD/MM/YYYY or DD-MM-YY or DD-MM-YYYY
        const dmyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2}|\d{4})$/);
        if (dmyMatch) {
            const day = parseInt(dmyMatch[1], 10);
            const month = parseInt(dmyMatch[2], 10);
            let year = parseInt(dmyMatch[3], 10);
            if (year < 100) {
                year = 2000 + year;
            }
            if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
                const dayStr = String(day).padStart(2, '0');
                const monthStr = months[month - 1];
                return `${dayStr} ${monthStr} ${year}`;
            }
        }

        // 2. YYYY-MM-DD or YYYY/MM/DD
        const ymdMatch = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
        if (ymdMatch) {
            const year = parseInt(ymdMatch[1], 10);
            const month = parseInt(ymdMatch[2], 10);
            const day = parseInt(ymdMatch[3], 10);
            if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
                const dayStr = String(day).padStart(2, '0');
                const monthStr = months[month - 1];
                return `${dayStr} ${monthStr} ${year}`;
            }
        }

        // 3. Fallback to Date object parsing
        const d = new Date(str);
        if (!isNaN(d.getTime())) {
            const dayStr = String(d.getDate()).padStart(2, '0');
            const monthStr = months[d.getMonth()];
            const year = d.getFullYear();
            return `${dayStr} ${monthStr} ${year}`;
        }

        return str;
    } catch {
        return String(val);
    }
};