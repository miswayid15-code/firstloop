import { useState, useEffect } from 'react'
import logo from '../assets/img/firstloop-favicon.png'
import flLogo from '../assets/img/firstloop-favicon.png'
import qrImg from '../assets/img/qr-img.png'
import API from '../api.js'
import { toast } from 'react-hot-toast'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// Default Card Designs Fallback List
// --- QR Code Component ---
const RealQRCode = ({ size = 80 }) => (
    <img
        src={qrImg}
        alt="QR Code"
        style={{
            width: size,
            height: size,
            objectFit: 'contain',
            flexShrink: 0
        }}
    />
)

import {
    getRelativeImagePath,
    formatImageUrl,
    getCardStyle
} from '../services/cardService.js'

const EMPTY_ARRAY = []

// Categorized Font Awesome Icons for Stamp Levels & Categories
export const FA_ICONS_BY_CATEGORY = {
    'Food & Beverages': [
        { icon: 'fa-utensils', label: 'Utensils' },
        { icon: 'fa-burger', label: 'Burger' },
        { icon: 'fa-pizza-slice', label: 'Pizza' },
        { icon: 'fa-coffee', label: 'Coffee' },
        { icon: 'fa-mug-hot', label: 'Hot Mug' },
        { icon: 'fa-ice-cream', label: 'Ice Cream' },
        { icon: 'fa-cocktail', label: 'Cocktail' },
        { icon: 'fa-beer', label: 'Beer' },
        { icon: 'fa-wine-glass', label: 'Wine' },
        { icon: 'fa-bread-slice', label: 'Bakery' },
        { icon: 'fa-cookie', label: 'Cookie' },
        { icon: 'fa-drumstick-bite', label: 'Meal' }
    ],
    'Salon & Beauty': [
        { icon: 'fa-spa', label: 'Spa' },
        { icon: 'fa-cut', label: 'Salon / Cut' },
        { icon: 'fa-hand-sparkles', label: 'Nails & Care' },
        { icon: 'fa-magic', label: 'Treatment' },
        { icon: 'fa-spray-can', label: 'Cosmetics' },
        { icon: 'fa-smile', label: 'Facial' },
        { icon: 'fa-heart', label: 'Wellness' }
    ],
    'Retail & Shopping': [
        { icon: 'fa-shopping-bag', label: 'Shopping Bag' },
        { icon: 'fa-shopping-cart', label: 'Cart' },
        { icon: 'fa-tag', label: 'Price Tag' },
        { icon: 'fa-tags', label: 'Tags' },
        { icon: 'fa-tshirt', label: 'Apparel' },
        { icon: 'fa-gem', label: 'Jewelry / Gem' },
        { icon: 'fa-store', label: 'Store' }
    ],
    'Fitness & Sports': [
        { icon: 'fa-dumbbell', label: 'Gym / Fitness' },
        { icon: 'fa-running', label: 'Running' },
        { icon: 'fa-bicycle', label: 'Cycling' },
        { icon: 'fa-heartbeat', label: 'Cardio' },
        { icon: 'fa-trophy', label: 'Trophy' },
        { icon: 'fa-medal', label: 'Medal' }
    ],
    'Automotive & Fuel': [
        { icon: 'fa-car', label: 'Car Service' },
        { icon: 'fa-wrench', label: 'Repair' },
        { icon: 'fa-gas-pump', label: 'Fuel' },
        { icon: 'fa-oil-can', label: 'Oil Change' }
    ],
    'Entertainment': [
        { icon: 'fa-ticket-alt', label: 'Ticket' },
        { icon: 'fa-film', label: 'Cinema' },
        { icon: 'fa-gamepad', label: 'Gaming' },
        { icon: 'fa-music', label: 'Music' }
    ],
    'Rewards & Generic': [
        { icon: 'fa-gift', label: 'Gift' },
        { icon: 'fa-star', label: 'Star / VIP' },
        { icon: 'fa-crown', label: 'Crown' },
        { icon: 'fa-award', label: 'Award' },
        { icon: 'fa-coins', label: 'Coins' },
        { icon: 'fa-percent', label: 'Discount' },
        { icon: 'fa-check', label: 'Checkmark' }
    ]
}

export const ALL_FA_ICONS = Object.entries(FA_ICONS_BY_CATEGORY).flatMap(([category, icons]) =>
    icons.map(item => ({ ...item, category }))
)

export const getCategoryRecommendedIcons = (categoryName = '') => {
    const cat = String(categoryName).toLowerCase()
    if (cat.includes('food') || cat.includes('restaurant') || cat.includes('cafe') || cat.includes('bakery') || cat.includes('dining')) {
        return FA_ICONS_BY_CATEGORY['Food & Beverages']
    }
    if (cat.includes('salon') || cat.includes('spa') || cat.includes('beauty') || cat.includes('hair') || cat.includes('nail')) {
        return FA_ICONS_BY_CATEGORY['Salon & Beauty']
    }
    if (cat.includes('retail') || cat.includes('shop') || cat.includes('cloth') || cat.includes('jewel') || cat.includes('fashion') || cat.includes('store')) {
        return FA_ICONS_BY_CATEGORY['Retail & Shopping']
    }
    if (cat.includes('fit') || cat.includes('gym') || cat.includes('sport') || cat.includes('health') || cat.includes('yoga')) {
        return FA_ICONS_BY_CATEGORY['Fitness & Sports']
    }
    if (cat.includes('auto') || cat.includes('car') || cat.includes('bike') || cat.includes('fuel') || cat.includes('wash')) {
        return FA_ICONS_BY_CATEGORY['Automotive & Fuel']
    }
    if (cat.includes('entertain') || cat.includes('game') || cat.includes('movie') || cat.includes('cinema') || cat.includes('event')) {
        return FA_ICONS_BY_CATEGORY['Entertainment']
    }
    return [
        ...FA_ICONS_BY_CATEGORY['Food & Beverages'].slice(0, 4),
        ...FA_ICONS_BY_CATEGORY['Retail & Shopping'].slice(0, 4),
        ...FA_ICONS_BY_CATEGORY['Rewards & Generic'].slice(0, 4)
    ]
}

export const getCategoryDefaultIcon = (categoryName = '') => {
    const recs = getCategoryRecommendedIcons(categoryName)
    return recs && recs.length > 0 ? recs[0].icon : 'fa-tag'
}

export default function StampCardBuilderModal({
    isOpen,
    cardData = null,
    cardDesigns = EMPTY_ARRAY,
    merchantId = null,
    merchantData = null,
    brandName = '',
    brandImage = null,
    brandLogo = null,
    branches = EMPTY_ARRAY,
    onSave,
    onClose
}) {
    const fallbackBrandName = brandName || merchantData?.bus_name || 'Elite Branch'
    const fallbackBrandLogo = brandImage || brandLogo || merchantData?.brand_image || logo
    // console.log("fallbackBrandLogo", fallbackBrandLogo)
    const [fetchedDesigns, setFetchedDesigns] = useState([])

    // Font Awesome Icon Picker & Multi-Select State
    const [activeIconPickerLevel, setActiveIconPickerLevel] = useState(null)
    const [isMultiSelectModalOpen, setIsMultiSelectModalOpen] = useState(false)
    const [selectedCategoryIcons, setSelectedCategoryIcons] = useState([])
    const [iconSearchQuery, setIconSearchQuery] = useState('')
    const [selectedIconCategoryTab, setSelectedIconCategoryTab] = useState('Recommended')

    const categoryName = merchantData?.Category?.name || merchantData?.category?.name || cardData?.Category?.name || 'Category'
    const categoryRecommendedIcons = getCategoryRecommendedIcons(categoryName)

    const [stampForm, setStampForm] = useState({
        id: null,
        title: '',
        brandName: fallbackBrandName,
        brandLogo: fallbackBrandLogo,
        brandLogoFile: null,
        total_stamps: 8,
        month: 12,
        reward: 'Free Gift or Beverage',
        bgColor: '#0E88B8',
        bgImage: null,
        cardDesignId: null,
        textColor: '#FFFFFF',
        borderColor: '#00A6D6',
        stampBgColor: 'rgba(255, 255, 255, 0.3)',
        stampBorderColor: '#FFFFFF',
        stampTextColor: '#FFFFFF',
        stampRadius: 50,
        preset: 'Custom',
        branch_ids: [],
        category_id: merchantData?.cat_id || null,
        Category: merchantData?.Category || null,
        levelRewards: Array.from({ length: 8 }).map((_, i) => ({
            stamp: i + 1,
            reward: '',
            type: 'Free',
            discountVal: 0,
            icon: 'fa-gift',
            amt: 0,
            discount: 0,
            free_stamp: 0,
            free_text: ''
        }))
    })
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Self-contained API call to fetch card designs if not provided via props
    useEffect(() => {
        if (isOpen && (!cardDesigns || cardDesigns.length === 0)) {
            fetchCardDesignsFromApi()
        }
    }, [isOpen, cardDesigns?.length])

    const fetchCardDesignsFromApi = async () => {
        try {
            const response = await API.post('admin/card-design/list')
            console.log("response", response)

            if (response?.data && (response.data.status === 1 || response.data.status === '1' || response.data.success)) {
                const rawList = response.data.data || response.data.card_designs || response.data.designs || []
                const list = Array.isArray(rawList) ? rawList : []

                const formattedDesigns = list
                    .filter(item => Number(item.status) === 1 || item.status === '1' || item.status === undefined)
                    .map(item => ({
                        id: item.id || item._id,
                        name: item.name || item.title || 'Card Design',
                        image: formatImageUrl(item.image || item.card_image || item.image_url || item.path),
                        status: Number(item.status)
                    }))

                if (formattedDesigns.length > 0) {
                    setFetchedDesigns(formattedDesigns)
                    return
                }
            }

            // setFetchedDesigns(DEFAULT_CARD_DESIGNS.map(d => ({ ...d, image: formatImageUrl(d.image) })))
        } catch (err) {
            console.error('Error fetching card designs in StampCardBuilderModal:', err)
            // setFetchedDesigns(DEFAULT_CARD_DESIGNS.map(d => ({ ...d, image: formatImageUrl(d.image) })))
        }
    }

    const stamp_card = async () => {
        if (isSubmitting) return
        setIsSubmitting(true)
        try {
            // Get local merchant ID if stored
            let localMerchantId = null
            try {
                const rawMerchant = localStorage.getItem("merchant_data")
                if (rawMerchant && rawMerchant !== "null" && rawMerchant !== "undefined") {
                    const parsed = JSON.parse(rawMerchant)
                    localMerchantId = parsed?.id || parsed?.merchant_id || parsed?.mer_id
                }
            } catch (e) { }

            // Get merchant ID
            const targetMerchantId =
                merchantId ||
                stampForm.mer_id ||
                stampForm.merchant_id ||
                cardData?.merchant_id ||
                cardData?.mer_id ||
                merchantData?.id ||
                localMerchantId;

            // Build FormData payload
            const formData = new FormData();

            // If editing an existing card, include the card ID
            if (stampForm.id) {
                formData.append('id', Number(stampForm.id));
            }

            // Validation: Month validity
            const validMonth = Number(stampForm.month) || 12;
            if (validMonth <= 0) {
                toast.error('Please enter a valid validity duration (in months)');
                setIsSubmitting(false);
                return;
            }

            // Validation: Stamp Levels amounts for Paid & Discount
            for (let i = 0; i < (stampForm.levelRewards || []).length; i++) {
                const lvl = stampForm.levelRewards[i];
                const isPaidOrDiscount = lvl.type === 'Paid' || lvl.type === 'Discount';
                if (isPaidOrDiscount) {
                    const numAmt = Number(lvl.amt);
                    if (!lvl.amt || isNaN(numAmt) || numAmt <= 0) {
                        toast.error(`Please enter an amount greater than 0 for Stamp #${i + 1} (${lvl.type} reward)`);
                        setIsSubmitting(false);
                        return;
                    }
                }
            }

            // Core required fields
            formData.append('merchant_id', Number(targetMerchantId));
            formData.append('branch_ids', JSON.stringify(stampForm.branch_ids || []));
            formData.append('title', stampForm.title || '');

            formData.append('brand_name', stampForm.brandName || 'Elite Branch');
            formData.append('number_of_stamps', Number(stampForm.total_stamps || 8));
            formData.append('month', validMonth);

            // Brand image / logo:
            // 1) If user picked a new file, append File object as 'brand_image'
            // 2) If editing with existing image, sanitize to relative path (e.g. uploads/...) to avoid double domain prefix
            if (stampForm.brandLogoFile) {
                formData.append('brand_image', stampForm.brandLogoFile);
            } else if (stampForm.brandLogo && typeof stampForm.brandLogo === 'string' && !stampForm.brandLogo.startsWith('blob:')) {
                const relBrandLogo = getRelativeImagePath(stampForm.brandLogo);
                if (relBrandLogo) {
                    formData.append('brand_image', relBrandLogo);
                }
            }

            // Background & style fields
            if (stampForm.bgImage) {
                const relBgImage = getRelativeImagePath(stampForm.bgImage);
                formData.append('background_image', relBgImage || stampForm.bgImage);
            }
            formData.append('background_color', stampForm.bgColor || '#0E88B8');
            formData.append('text_color', stampForm.textColor || '#FFFFFF');
            formData.append('border_color', stampForm.borderColor || '#00A6D6');
            formData.append('stamp_radius', Number(stampForm.stampRadius ?? 50));
            formData.append('stamp_background', stampForm.stampBgColor || 'rgba(255, 255, 255, 0.3)');
            formData.append('stamp_border_color', stampForm.stampBorderColor || '#FFFFFF');
            formData.append('stamp_text_color', stampForm.stampTextColor || '#FFFFFF');

            // Category ID resolution
            const catId =
                stampForm.category_id ||
                merchantData?.cat_id ||
                merchantData?.Category?.id ||
                cardData?.category_id ||
                cardData?.cat_id ||
                null;

            if (catId) {
                formData.append('category_id', Number(catId));
            }

            // Stamp reward levels array JSON string
            const levelsPayload = (stampForm.levelRewards || []).map((lvl, idx) => {
                const isPaid = lvl.type === 'Paid';
                const isDiscount = lvl.type === 'Discount';
                const isRewardType2or3 = isDiscount || isPaid;
                const disc = Number(lvl.discount ?? lvl.discountVal ?? (isDiscount ? 10 : 0));
                const hasFree = isRewardType2or3 && Number(lvl.free_stamp) === 1 ? 1 : 0;
                const freeTxt = hasFree === 1 ? String(lvl.free_text || '').trim() : '';

                const levelItem = {
                    stamp_number: idx + 1,
                    reward_type: isDiscount ? '2' : (isPaid ? '3' : '1'),
                    amt: (isPaid || isDiscount) ? Number(lvl.amt || 0) : 0,
                    reward_text: lvl.reward || (isDiscount ? `${disc}% Off` : `Stamp #${idx + 1}`),
                    discount: isDiscount ? disc : 0,
                    icon: lvl.icon || (isDiscount ? 'fa-percent' : (isPaid ? 'fa-tag' : 'fa-gift')),
                    free_stamp: hasFree,
                    free_text: freeTxt
                };
                if (isPaid && catId) {
                    levelItem.category_id = Number(catId);
                }
                return levelItem;
            });
            formData.append('stamp_levels', JSON.stringify(levelsPayload));

            // Optional card design id
            if (stampForm.cardDesignId) {
                formData.append('card_design_id', Number(stampForm.cardDesignId));
            }

            // API Call: Always post multipart/form-data
            const response = await API.post(
                'firstloop/merchant/create_stamp_card',
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            console.log('Stamp Card API Response:', response?.data);

            if (response?.data?.status === 1 || response?.data?.success) {
                toast.success(response?.data?.message || response?.data?.msg || 'Stamp Card saved successfully!');
                if (onSave) {
                    onSave(stampForm);
                }
                onClose();
            } else {
                toast.error(
                    response?.data?.message ||
                    response?.data?.msg ||
                    'Failed to save stamp card'
                );
            }
        } catch (err) {
            console.error('Error creating stamp card:', err);

            toast.error(
                err?.response?.data?.message ||
                err?.response?.data?.msg ||
                err?.response?.data?.error ||
                'Server error while saving stamp card'
            );
        }
        finally {
            setIsSubmitting(false)
        }
    };

    const availableDesigns = (cardDesigns && cardDesigns.length > 0) ? cardDesigns : fetchedDesigns

    // Sync form state when modal opens or cardData changes
    useEffect(() => {
        if (!isOpen) return

        if (cardData) {
            const count = Number(cardData.total_stamps || cardData.number_of_stamps || 8)
            const resolvedBranchIds = Array.isArray(cardData.branch_ids)
                ? cardData.branch_ids.map(Number)
                : (cardData.branch_id ? [Number(cardData.branch_id)] : (branches || []).map(b => Number(b.id || b)).filter(Boolean))

            const rawLevels = Array.isArray(cardData.StampLevels) && cardData.StampLevels.length > 0
                ? cardData.StampLevels
                : (Array.isArray(cardData.levelRewards) && cardData.levelRewards.length > 0
                    ? cardData.levelRewards
                    : (Array.isArray(cardData.stamp_levels) ? cardData.stamp_levels : []))

            const originalStampLevels = Array.isArray(cardData.StampLevels)
                ? cardData.StampLevels
                : (Array.isArray(cardData.stamp_levels) ? cardData.stamp_levels : (Array.isArray(cardData.CustomerStampLevels) ? cardData.CustomerStampLevels : []))

            const actualCard = cardData.card || cardData.data || cardData;
            let valMonth = 12;
            const rawMonth =
                actualCard.month ??
                actualCard.validity_months ??
                actualCard.validityMonths ??
                actualCard.totalMonth ??
                actualCard.total_month ??
                actualCard.total_months ??
                actualCard.validity ??
                actualCard.duration ??
                actualCard.months ??
                actualCard.raw?.month ??
                cardData.month ??
                cardData.validity_months ??
                cardData.validityMonths ??
                cardData.totalMonth ??
                cardData.total_month;

            if (rawMonth !== undefined && rawMonth !== null && rawMonth !== '') {
                const str = String(rawMonth).trim().toLowerCase();
                if (str.includes('year')) {
                    const num = parseFloat(str);
                    if (!isNaN(num) && num > 0) valMonth = Math.round(num * 12);
                } else {
                    const parsed = parseInt(str.replace(/\D/g, ''), 10);
                    if (!isNaN(parsed) && parsed > 0) valMonth = parsed;
                }
            }

            setStampForm({
                id: cardData.id || null,
                title: cardData.title || '',
                brandName: cardData.brandName || cardData.brand_name || fallbackBrandName,
                brandLogo: cardData.brandLogo || cardData.brand_image || fallbackBrandLogo,
                brandLogoFile: null,
                total_stamps: count,
                month: valMonth,
                reward: cardData.reward || '',
                bgColor: cardData.bgColor || cardData.background_color || '#0E88B8',
                bgImage: cardData.bgImage || cardData.background_image || null,
                cardDesignId: cardData.cardDesignId || cardData.card_design_id || null,
                textColor: cardData.textColor || cardData.text_color || '#FFFFFF',
                borderColor: cardData.borderColor || cardData.border_color || '#00A6D6',
                stampBgColor: cardData.stampBgColor || cardData.stamp_background || 'rgba(255, 255, 255, 0.3)',
                stampBorderColor: cardData.stampBorderColor || cardData.stamp_border_color || '#FFFFFF',
                stampTextColor: cardData.stampTextColor || cardData.stamp_text_color || '#FFFFFF',
                stampRadius: Number(cardData.stamp_radius ?? cardData.stampRadius ?? 50),
                preset: cardData.preset || 'Custom',
                branch_ids: resolvedBranchIds,
                category_id: cardData.category_id || cardData.cat_id || merchantData?.cat_id || null,
                Category: cardData.Category || merchantData?.Category || null,
                levelRewards: Array.from({ length: count }).map((_, i) => {
                    const stampNum = i + 1;
                    const r = (Array.isArray(rawLevels) ? rawLevels : []).find(lvl => Number(lvl.stamp_number || lvl.stamp) === stampNum) || rawLevels[i];
                    const orig = (Array.isArray(originalStampLevels) ? originalStampLevels : []).find(sl => Number(sl.stamp_number || sl.stamp) === stampNum) || originalStampLevels[i] || {};

                    if (!r && !orig.id && !orig.stamp_number) {
                        return {
                            stamp: stampNum,
                            reward: '',
                            type: 'Free',
                            discountVal: 0,
                            discount: 0,
                            icon: 'fa-gift',
                            amt: 0,
                            category_id: null,
                            free_stamp: 0,
                            free_text: ''
                        };
                    }
                    const itemData = r || orig;
                    const rawType = String(itemData.reward_type ?? itemData.type ?? orig.reward_type ?? orig.type ?? '').trim().toLowerCase();
                    const isDiscount = rawType === '2' || rawType === 'discount';
                    const isPaid = rawType === '3' || rawType === 'paid';
                    const rType = isDiscount ? 'Discount' : (isPaid ? 'Paid' : 'Free');
                    const disc = parseFloat(itemData.discount ?? itemData.discountVal ?? orig.discount ?? (isDiscount ? (parseFloat(itemData.reward_text || orig.reward_text) || 0) : 0)) || 0;

                    const rawFreeStamp = itemData.free_stamp ?? orig.free_stamp ?? itemData.is_free ?? orig.is_free ?? itemData.free ?? orig.free;
                    const hasFree = (isDiscount || isPaid) && (Number(rawFreeStamp) === 1 || rawFreeStamp === true || rawFreeStamp === '1') ? 1 : 0;
                    const freeTxt = itemData.free_text ?? orig.free_text ?? itemData.free_reward ?? orig.free_reward ?? '';

                    // Amount resolution: Only Free is 0. Paid and Discount should not default to 0!
                    const rawAmt = itemData.amt ?? orig.amt;
                    let initialAmt = 0;
                    if (rType === 'Free') {
                        initialAmt = 0;
                    } else {
                        initialAmt = (rawAmt !== undefined && rawAmt !== null && rawAmt !== '' && Number(rawAmt) > 0) ? rawAmt : '';
                    }

                    return {
                        stamp: stampNum,
                        reward: itemData.reward || itemData.reward_text || orig.reward_text || (isDiscount ? `${disc}% Discount` : ''),
                        type: rType,
                        discountVal: disc,
                        discount: disc,
                        icon: isDiscount ? 'fa-percent' : (isPaid ? (itemData.icon || orig.icon || 'fa-tag') : 'fa-gift'),
                        amt: initialAmt,
                        category_id: itemData.category_id || orig.category_id || null,
                        free_stamp: hasFree,
                        free_text: hasFree === 1 ? freeTxt : ''
                    };
                })
            })
        } else {
            const initialDesign = (cardDesigns && cardDesigns.length > 0) ? cardDesigns[0] : (fetchedDesigns.length > 0 ? fetchedDesigns[0] : null)
            const initialBranchIds = (branches || []).map(b => Number(b.id || b)).filter(Boolean)

            setStampForm({
                id: null,
                title: '',
                brandName: fallbackBrandName,
                brandLogo: fallbackBrandLogo,
                brandLogoFile: null,
                total_stamps: 8,
                month: 12,
                reward: 'Free Beverage or Meal Pass',
                bgColor: '#0E88B8',
                bgImage: initialDesign ? initialDesign.image : null,
                cardDesignId: initialDesign ? initialDesign.id : null,
                textColor: '#FFFFFF',
                borderColor: '#00A6D6',
                stampBgColor: 'rgba(255, 255, 255, 0.3)',
                stampBorderColor: '#FFFFFF',
                stampTextColor: '#FFFFFF',
                stampRadius: 50,
                preset: initialDesign ? initialDesign.name : 'Custom',
                branch_ids: initialBranchIds,
                category_id: merchantData?.cat_id || null,
                Category: merchantData?.Category || null,
                levelRewards: Array.from({ length: 8 }).map((_, i) => ({
                    stamp: i + 1,
                    reward: '',
                    type: 'Free',
                    discountVal: 0,
                    discount: 0,
                    icon: 'fa-gift',
                    amt: 0,
                    free_stamp: 0,
                    free_text: ''
                }))
            })
        }
    }, [isOpen, cardData])

    // Update background image if card designs load asynchronously for a new card
    useEffect(() => {
        if (!isOpen || cardData) return
        if (availableDesigns.length > 0) {
            setStampForm(prev => {
                if (prev.cardDesignId || prev.bgImage) return prev
                return {
                    ...prev,
                    bgImage: availableDesigns[0].image,
                    cardDesignId: availableDesigns[0].id,
                    preset: availableDesigns[0].name
                }
            })
        }
    }, [isOpen, cardData, availableDesigns.length])

    if (!isOpen) return null

    // Handler: Brand Logo Upload
    const handleStampLogoUpload = (e) => {
        const file = e.target.files[0]
        if (file) {
            const previewUrl = URL.createObjectURL(file)
            setStampForm(prev => ({
                ...prev,
                brandLogoFile: file,
                brandLogo: previewUrl
            }))
        }
    }



    const handleSubmit = (e) => {
        if (e) {
            e.preventDefault()
            e.stopPropagation()
        }
        if (isSubmitting) return
        stamp_card()
    }

    return (
        <div
            className="builder-modal-overlay"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                // background: 'rgba(15, 23, 42, 0.75)',
                // backdropFilter: 'blur(6px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                padding: 14
            }}
        >
            <div
                className="builder-modal-content"
                style={{
                    background: '#FFFFFF',
                    borderRadius: 20,
                    maxWidth: 1120,
                    width: '100%',
                    maxHeight: '94vh',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)'
                }}
            >
                {/* Builder Header */}
                <div style={{ padding: '18px 20px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--firstloop-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--firstloop-primary)', fontSize: '1.1rem' }}>
                            <i className="fas fa-stamp" />
                        </div>
                        <div>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                                {stampForm.id ? 'Edit Stamp Card' : 'Create Stamp Card'} - Dynamic Stamp Count
                            </h3>
                            <small style={{ color: 'var(--text-muted)' }}>
                                Set brand logo, number of stamps (up to 10 max), and configure reward levels.
                            </small>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{ background: 'none', border: 'none', fontSize: '1.2rem', color: 'var(--text-muted)', cursor: 'pointer' }}
                    >
                        <i className="fas fa-times" />
                    </button>
                </div>

                {/* Top Card Design API Picker Carousel */}
                <div style={{ padding: '12px 20px', background: '#FFFFFF', borderBottom: '1px solid #F1F5F9' }}>

                    <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4 }}>
                        {availableDesigns.length > 0 && availableDesigns.map(design => {
                            const isSelected = stampForm.cardDesignId === design.id || stampForm.bgImage === design.image
                            return (
                                <div
                                    key={design.id}
                                    onClick={() => setStampForm(prev => ({
                                        ...prev,
                                        cardDesignId: design.id,
                                        bgImage: design.image,
                                        preset: design.name
                                    }))}
                                    style={{
                                        minWidth: 120,
                                        height: 54,
                                        borderRadius: 10,
                                        backgroundImage: `url(${formatImageUrl(design.image)})`,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                        border: isSelected ? '3px solid #00A6D6' : '2px solid #E2E8F0',
                                        cursor: 'pointer',
                                        position: 'relative',
                                        boxShadow: isSelected ? '0 4px 12px rgba(0, 166, 214, 0.4)' : 'none',
                                        overflow: 'hidden'
                                    }}
                                >
                                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.65)', color: '#FFF', fontSize: '0.65rem', fontWeight: 700, padding: '2px 4px', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden', textAlign: 'center' }}>
                                        {design.name}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Modal Body Grid */}
                <div className="card-builder-modal-grid">
                    {/* LEFT PANEL: FORM CONTROLS */}
                    <div className="builder-left-panel" style={{ padding: 24, borderRight: '1px solid #F1F5F9', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            {/* 1. Card Title, Brand & Stamp Count Input */}
                            <div>
                                <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Card & Stamp Details
                                </h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    <div>
                                        <label style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: 4, display: 'block' }}>Stamp Card Title</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="e.g., Artisanal Coffee Stamp Pass"
                                            value={stampForm.title}
                                            onChange={(e) => setStampForm(prev => ({ ...prev, title: e.target.value }))}
                                            style={{ height: 36, fontSize: '0.85rem' }}
                                        />
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                                        <div>
                                            <label style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: 4, display: 'block' }}>Brand Name</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="Elite Branch"
                                                value={stampForm.brandName}
                                                onChange={(e) => setStampForm(prev => ({ ...prev, brandName: e.target.value }))}
                                                style={{ height: 36, fontSize: '0.85rem' }}
                                            />
                                        </div>

                                        <div>
                                            <label style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: 4, display: 'block' }}>
                                                Upload Brand Logo
                                            </label>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleStampLogoUpload}
                                                className="form-control"
                                                style={{ height: 36, fontSize: '0.8rem' }}
                                            />
                                        </div>

                                        <div>
                                            <label style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: 4, display: 'block' }}>
                                                Number of Stamps (1-10)
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                max="10"
                                                className="form-control"
                                                value={stampForm.total_stamps}
                                                onWheel={(e) => { e.currentTarget.blur(); e.preventDefault(); }}
                                                onChange={(e) => {
                                                    const count = Math.min(10, Math.max(1, Number(e.target.value) || 1))
                                                    setStampForm(prev => ({
                                                        ...prev,
                                                        total_stamps: count,
                                                        levelRewards: Array.from({ length: count }).map((_, i) => prev.levelRewards[i] || { stamp: i + 1, reward: '', type: 'Free', discountVal: 0, icon: 'fa-gift', discount: 0, amt: 0, free_stamp: 0, free_text: '' })
                                                    }))
                                                }}
                                                style={{ height: 36, fontSize: '0.85rem' }}
                                            />
                                        </div>

                                        <div>
                                            <label style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: 4, display: 'block' }}>
                                                Validity (in Months)
                                            </label>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="120"
                                                    className="form-control"
                                                    placeholder="12"
                                                    value={stampForm.month}
                                                    onWheel={(e) => { e.currentTarget.blur(); e.preventDefault(); }}
                                                    onChange={(e) => setStampForm(prev => ({ ...prev, month: e.target.value }))}
                                                    style={{ height: 36, fontSize: '0.85rem' }}
                                                />
                                                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', flexShrink: 0 }}>
                                                    Months
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                                                {[3, 6, 12, 24].map(m => (
                                                    <button
                                                        key={m}
                                                        type="button"
                                                        className="btn btn-sm"
                                                        onClick={() => setStampForm(prev => ({ ...prev, month: m }))}
                                                        style={{
                                                            padding: '2px 7px',
                                                            fontSize: '0.72rem',
                                                            borderRadius: 5,
                                                            background: String(stampForm.month) === String(m) ? 'var(--firstloop-primary, #0E88B8)' : '#E2E8F0',
                                                            color: String(stampForm.month) === String(m) ? '#FFFFFF' : '#334155',
                                                            fontWeight: 700,
                                                            border: 'none',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        {m}M
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 2. Color Pickers */}
                            <div style={{ paddingTop: 16, borderTop: '1px solid #F1F5F9' }}>
                                <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Card Background & Main Colors
                                </h4>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 16 }}>
                                    <div>
                                        <label style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: 4, display: 'block' }}>
                                            Solid Background Color
                                        </label>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <input
                                                type="color"
                                                value={stampForm.bgColor.startsWith('#') ? stampForm.bgColor : '#0E88B8'}
                                                onChange={(e) => setStampForm(prev => ({ ...prev, bgColor: e.target.value, bgImage: null }))}
                                                style={{ width: 40, height: 36, padding: 0, border: 'none', borderRadius: 6, cursor: 'pointer' }}
                                            />
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={stampForm.bgColor}
                                                onChange={(e) => setStampForm(prev => ({ ...prev, bgColor: e.target.value, bgImage: null }))}
                                                style={{ height: 36, fontSize: '0.82rem' }}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: 4, display: 'block' }}>
                                            Card Text Color
                                        </label>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <input
                                                type="color"
                                                value={stampForm.textColor.startsWith('#') ? stampForm.textColor : '#FFFFFF'}
                                                onChange={(e) => setStampForm(prev => ({ ...prev, textColor: e.target.value }))}
                                                style={{ width: 40, height: 36, padding: 0, border: 'none', borderRadius: 6, cursor: 'pointer' }}
                                            />
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={stampForm.textColor}
                                                onChange={(e) => setStampForm(prev => ({ ...prev, textColor: e.target.value }))}
                                                style={{ height: 36, fontSize: '0.82rem' }}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: 4, display: 'block' }}>
                                            Card Border Color
                                        </label>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <input
                                                type="color"
                                                value={stampForm.borderColor.startsWith('#') ? stampForm.borderColor : '#00A6D6'}
                                                onChange={(e) => setStampForm(prev => ({ ...prev, borderColor: e.target.value }))}
                                                style={{ width: 40, height: 36, padding: 0, border: 'none', borderRadius: 6, cursor: 'pointer' }}
                                            />
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={stampForm.borderColor}
                                                onChange={(e) => setStampForm(prev => ({ ...prev, borderColor: e.target.value }))}
                                                style={{ height: 36, fontSize: '0.82rem' }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 3. STAMP CIRCLE COLOR PICKERS */}
                            <div style={{ paddingTop: 16, borderTop: '1px solid #F1F5F9' }}>
                                <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Stamp Circle Slot Colors
                                </h4>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 14 }}>
                                    <div>
                                        <label style={{ fontSize: '0.78rem', fontWeight: 600, marginBottom: 4, display: 'block' }}>
                                            Stamp Circle Background
                                        </label>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <input
                                                type="color"
                                                value={stampForm.stampBgColor.startsWith('#') ? stampForm.stampBgColor : '#00A6D6'}
                                                onChange={(e) => setStampForm(prev => ({ ...prev, stampBgColor: e.target.value }))}
                                                style={{ width: 38, height: 36, padding: 0, border: 'none', borderRadius: 6, cursor: 'pointer' }}
                                            />
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={stampForm.stampBgColor}
                                                onChange={(e) => setStampForm(prev => ({ ...prev, stampBgColor: e.target.value }))}
                                                style={{ height: 36, fontSize: '0.8rem' }}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label style={{ fontSize: '0.78rem', fontWeight: 600, marginBottom: 4, display: 'block' }}>
                                            Stamp Circle Border Color
                                        </label>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <input
                                                type="color"
                                                value={stampForm.stampBorderColor.startsWith('#') ? stampForm.stampBorderColor : '#FFFFFF'}
                                                onChange={(e) => setStampForm(prev => ({ ...prev, stampBorderColor: e.target.value }))}
                                                style={{ width: 38, height: 36, padding: 0, border: 'none', borderRadius: 6, cursor: 'pointer' }}
                                            />
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={stampForm.stampBorderColor}
                                                onChange={(e) => setStampForm(prev => ({ ...prev, stampBorderColor: e.target.value }))}
                                                style={{ height: 36, fontSize: '0.8rem' }}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label style={{ fontSize: '0.78rem', fontWeight: 600, marginBottom: 4, display: 'block' }}>
                                            Stamp Text / Number Color
                                        </label>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <input
                                                type="color"
                                                value={stampForm.stampTextColor.startsWith('#') ? stampForm.stampTextColor : '#FFFFFF'}
                                                onChange={(e) => setStampForm(prev => ({ ...prev, stampTextColor: e.target.value }))}
                                                style={{ width: 38, height: 36, padding: 0, border: 'none', borderRadius: 6, cursor: 'pointer' }}
                                            />
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={stampForm.stampTextColor}
                                                onChange={(e) => setStampForm(prev => ({ ...prev, stampTextColor: e.target.value }))}
                                                style={{ height: 36, fontSize: '0.8rem' }}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label style={{ fontSize: '0.78rem', fontWeight: 600, marginBottom: 4, display: 'block' }}>
                                            Stamp Border Radius (stamp_radius: {stampForm.stampRadius ?? 50}%)
                                        </label>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <input
                                                type="range"
                                                min="0"
                                                max="50"
                                                value={stampForm.stampRadius ?? 50}
                                                onChange={(e) => setStampForm(prev => ({ ...prev, stampRadius: Number(e.target.value) }))}
                                                style={{ flex: 1, cursor: 'pointer' }}
                                            />
                                            <input
                                                type="number"
                                                min="0"
                                                max="50"
                                                className="form-control"
                                                value={stampForm.stampRadius ?? 50}
                                                onChange={(e) => {
                                                    const val = Math.min(50, Math.max(0, Number(e.target.value) || 0));
                                                    setStampForm(prev => ({ ...prev, stampRadius: val }));
                                                }}
                                                style={{ width: 64, height: 36, fontSize: '0.8rem' }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 4. Applicable Branches */}
                            <div style={{ paddingTop: 16, borderTop: '1px solid #F1F5F9' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <h4 style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        Applicable Branches <span style={{ color: '#EF4444' }}>*</span>
                                    </h4>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-outline-primary"
                                            onClick={() => setStampForm(prev => ({ ...prev, branch_ids: (branches || []).map(b => Number(b.id)) }))}
                                            style={{ padding: '2px 8px', fontSize: '0.72rem' }}
                                        >
                                            Select All
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-outline-secondary"
                                            onClick={() => setStampForm(prev => ({ ...prev, branch_ids: [] }))}
                                            style={{ padding: '2px 8px', fontSize: '0.72rem' }}
                                        >
                                            Clear
                                        </button>
                                    </div>
                                </div>

                                <div
                                    style={{
                                        border: '1px solid #E2E8F0',
                                        borderRadius: 8,
                                        maxHeight: 140,
                                        overflowY: 'auto',
                                        background: '#F8FAFC'
                                    }}
                                >
                                    {branches && branches.length > 0 ? (
                                        branches.map((b) => {
                                            const bId = Number(b.id);
                                            const isSelected = (stampForm.branch_ids || []).includes(bId);
                                            return (
                                                <label
                                                    key={b.id}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 8,
                                                        padding: '6px 10px',
                                                        cursor: 'pointer',
                                                        borderBottom: '1px solid #F1F5F9',
                                                        fontSize: '0.8rem',
                                                        background: isSelected ? 'rgba(14, 136, 184, 0.08)' : 'transparent',
                                                        margin: 0
                                                    }}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => {
                                                            setStampForm(prev => {
                                                                const current = prev.branch_ids || [];
                                                                const exists = current.includes(bId);
                                                                const updated = exists
                                                                    ? current.filter(x => x !== bId)
                                                                    : [...current, bId];
                                                                return { ...prev, branch_ids: updated };
                                                            });
                                                        }}
                                                    />
                                                    <span style={{ fontWeight: 600 }}>{b.name || b.branch_name || `Branch #${b.id}`}</span>
                                                </label>
                                            );
                                        })
                                    ) : (
                                        <p style={{ padding: 8, margin: 0, fontSize: '0.76rem', color: '#94A3B8' }}>
                                            No branches available for this merchant.
                                        </p>
                                    )}
                                </div>
                                <small style={{ color: '#64748B', fontSize: '0.72rem', marginTop: 4, display: 'block' }}>
                                    {(stampForm.branch_ids || []).length} branch(es) selected
                                </small>
                            </div>

                            {/* 5. Stamp Levels Setup */}
                            <div style={{ paddingTop: 16, borderTop: '1px solid #F1F5F9' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                                    <div>
                                        <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                            Stamp Levels Configuration ({stampForm.total_stamps} Levels)
                                        </h4>
                                        <small style={{ color: '#64748B', fontSize: '0.72rem' }}>
                                            Category: <strong style={{ color: 'var(--firstloop-primary)' }}>{categoryName}</strong>
                                        </small>
                                    </div>

                                    {/* Multi-Select Category Icons Button */}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsMultiSelectModalOpen(true)
                                            setActiveIconPickerLevel(null)
                                            setIconSearchQuery('')
                                        }}
                                        className="btn btn-sm btn-outline-primary"
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 6,
                                            fontSize: '0.75rem',
                                            fontWeight: 700,
                                            padding: '4px 10px',
                                            borderRadius: 8
                                        }}
                                    >
                                        <i className="fas fa-icons" />
                                        <span>Category FA Icons ({selectedCategoryIcons.length || categoryRecommendedIcons.length})</span>
                                    </button>
                                </div>

                                {/* Category Recommended Icons Bar */}
                                <div
                                    style={{
                                        background: '#F1F5F9',
                                        borderRadius: 8,
                                        padding: '8px 12px',
                                        marginBottom: 12,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        flexWrap: 'wrap',
                                        gap: 8
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                        <small style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569' }}>
                                            Category Icons:
                                        </small>
                                        {(selectedCategoryIcons.length > 0
                                            ? selectedCategoryIcons.map(ic => ({ icon: ic, label: ic.replace('fa-', '') }))
                                            : categoryRecommendedIcons
                                        ).map((item, idx) => (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => {
                                                    // Quick apply icon to all paid or first free level
                                                    setStampForm(prev => ({
                                                        ...prev,
                                                        levelRewards: prev.levelRewards.map(lvl => ({
                                                            ...lvl,
                                                            icon: lvl.type === 'Paid' ? item.icon : lvl.icon
                                                        }))
                                                    }))
                                                    toast.success(`Applied ${item.label || item.icon} to Paid Stamp Levels`)
                                                }}
                                                title={`Click to apply ${item.label || item.icon} to Paid Levels`}
                                                style={{
                                                    background: '#FFFFFF',
                                                    border: '1px solid #CBD5E1',
                                                    borderRadius: 6,
                                                    padding: '2px 8px',
                                                    fontSize: '0.75rem',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: 4,
                                                    cursor: 'pointer',
                                                    color: 'var(--text-primary)'
                                                }}
                                            >
                                                <i className={`fas ${item.icon}`} style={{ color: 'var(--firstloop-primary)', fontSize: '0.75rem' }} />
                                                <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>{item.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                    <small style={{ fontSize: '0.68rem', color: '#64748B' }}>
                                        Click icon to apply to Paid levels
                                    </small>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    {Array.from({ length: Number(stampForm.total_stamps) }).map((_, i) => {
                                        const reward = stampForm.levelRewards[i] || {
                                            stamp: i + 1,
                                            reward: '',
                                            type: 'Free',
                                            discountVal: 0,
                                            icon: 'fa-gift',
                                            amt: 0,
                                            discount: 0
                                        }
                                        const activeIcon = reward.icon || (reward.type === 'Free' ? 'fa-gift' : (reward.type === 'Discount' ? 'fa-percent' : getCategoryDefaultIcon(categoryName)))

                                        return (
                                            <div
                                                key={i}
                                                style={{
                                                    padding: 10,
                                                    background: '#F8FAFC',
                                                    borderRadius: 10,
                                                    border: '1px solid #E2E8F0',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: 8
                                                }}
                                            >
                                                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                                                    <span style={{ fontSize: '0.78rem', fontWeight: 700, width: 56, color: 'var(--firstloop-primary)' }}>
                                                        Stamp {i + 1}
                                                    </span>

                                                    {/* Reward Type Dropdown */}
                                                    <select
                                                        className="form-control"
                                                        value={reward.type || 'Free'}
                                                        onChange={(e) => {
                                                            const typeVal = e.target.value
                                                            setStampForm(prev => {
                                                                const updated = [...prev.levelRewards]
                                                                const prevDisc = parseFloat(updated[i]?.discount ?? updated[i]?.discountVal) || 0
                                                                const newDisc = prevDisc > 0 ? prevDisc : 10
                                                                const defaultLvlIcon = typeVal === 'Free' ? 'fa-gift' : (typeVal === 'Discount' ? 'fa-percent' : getCategoryDefaultIcon(categoryName))
                                                                const isType2or3 = typeVal === 'Discount' || typeVal === 'Paid'

                                                                // Amount resolution:
                                                                // Only Free has amount 0. Paid and Discount should not default to 0.
                                                                // Keep user-entered amount if > 0, otherwise empty string '' so user can enter it.
                                                                let newAmt = 0
                                                                if (typeVal === 'Free') {
                                                                    newAmt = 0
                                                                } else {
                                                                    const currentAmt = updated[i]?.amt
                                                                    newAmt = (currentAmt !== undefined && currentAmt !== null && currentAmt !== '' && Number(currentAmt) > 0) ? currentAmt : ''
                                                                }

                                                                updated[i] = {
                                                                    ...updated[i],
                                                                    stamp: i + 1,
                                                                    type: typeVal,
                                                                    amt: newAmt,
                                                                    icon: updated[i]?.icon && updated[i]?.icon !== 'fa-gift' && updated[i]?.icon !== 'fa-percent' && updated[i]?.icon !== 'fa-tag' ? updated[i].icon : defaultLvlIcon,
                                                                    discountVal: typeVal === 'Discount' ? newDisc : 0,
                                                                    discount: typeVal === 'Discount' ? newDisc : 0,
                                                                    reward: typeVal === 'Discount' ? `${newDisc}% Discount` : (typeVal === 'Paid' ? (updated[i]?.reward && !updated[i]?.reward.includes('Discount') && !updated[i]?.reward.includes('Stamp #') ? updated[i]?.reward : 'Paid Perk') : (updated[i]?.reward || `Stamp #${i + 1}`)),
                                                                    free_stamp: isType2or3 ? (updated[i]?.free_stamp ?? 0) : 0,
                                                                    free_text: isType2or3 ? (updated[i]?.free_text ?? '') : ''
                                                                }
                                                                return { ...prev, levelRewards: updated }
                                                            })
                                                        }}
                                                        style={{ width: 105, height: 36, fontSize: '0.8rem' }}
                                                    >
                                                        <option value="Free">Free 🎁</option>
                                                        <option value="Discount">Discount %</option>
                                                        <option value="Paid">Paid / Price</option>
                                                    </select>

                                                    {/* Type Value Control */}
                                                    {reward.type === 'Discount' ? (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, width: 100 }}>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                max="100"
                                                                className="form-control"
                                                                placeholder="0-100"
                                                                value={reward.discount !== undefined && reward.discount !== null ? reward.discount : (reward.discountVal ?? '')}
                                                                onWheel={(e) => {
                                                                    e.currentTarget.blur()
                                                                    e.preventDefault()
                                                                }}
                                                                onChange={(e) => {
                                                                    const val = e.target.value === '' ? '' : Math.min(100, Math.max(0, Number(e.target.value) || 0))
                                                                    setStampForm(prev => {
                                                                        const updated = [...prev.levelRewards]
                                                                        updated[i] = {
                                                                            ...updated[i],
                                                                            discountVal: val,
                                                                            discount: val,
                                                                            reward: val !== '' ? `${val}% Discount` : ''
                                                                        }
                                                                        return { ...prev, levelRewards: updated }
                                                                    })
                                                                }}
                                                                style={{ height: 36, fontSize: '0.82rem' }}
                                                            />
                                                            <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>%</span>
                                                        </div>
                                                    ) : reward.type === 'Paid' ? (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', background: '#F1F5F9', borderRadius: 8, fontSize: '0.75rem', color: 'var(--text-primary)', border: '1px solid #CBD5E1', maxWidth: 130, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                                                            <i className="fas fa-tag" style={{ color: 'var(--firstloop-primary)' }} />
                                                            <span>{categoryName}</span>
                                                        </div>
                                                    ) : (
                                                        <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, paddingRight: 4 }}>
                                                            <i className="fas fa-gift" /> Free
                                                        </div>
                                                    )}

                                                    {/* FA Icon Picker Trigger Button */}
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setActiveIconPickerLevel(i)
                                                            setIsMultiSelectModalOpen(false)
                                                            setIconSearchQuery('')
                                                            setSelectedIconCategoryTab('Recommended')
                                                        }}
                                                        className="btn btn-sm btn-light"
                                                        title="Click to choose Font Awesome icon"
                                                        style={{
                                                            height: 36,
                                                            padding: '4px 10px',
                                                            borderRadius: 8,
                                                            border: '1px solid #CBD5E1',
                                                            background: '#FFFFFF',
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: 6,
                                                            cursor: 'pointer',
                                                            marginLeft: 'auto'
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                width: 22,
                                                                height: 22,
                                                                borderRadius: 6,
                                                                background: 'rgba(14, 136, 184, 0.1)',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                color: 'var(--firstloop-primary)',
                                                                fontSize: '0.82rem'
                                                            }}
                                                        >
                                                            <i className={`fas ${activeIcon}`} />
                                                        </div>
                                                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155' }}>
                                                            {activeIcon.replace('fa-', '')}
                                                        </span>
                                                        <i className="fas fa-chevron-down" style={{ fontSize: '0.55rem', opacity: 0.6 }} />
                                                    </button>
                                                </div>

                                                {/* Description & Amount Inputs */}
                                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        placeholder="Reward description (e.g. Free Artisanal Muffin)..."
                                                        value={reward.reward || ''}
                                                        onChange={(e) => {
                                                            const val = e.target.value
                                                            setStampForm(prev => {
                                                                const updated = [...prev.levelRewards]
                                                                updated[i] = { ...updated[i], reward: val }
                                                                return { ...prev, levelRewards: updated }
                                                            })
                                                        }}
                                                        style={{ flex: 2, height: 34, fontSize: '0.8rem' }}
                                                    />

                                                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="any"
                                                            className="form-control"
                                                            placeholder={reward.type === 'Free' ? '0 (Free)' : 'Enter Amount *'}
                                                            title={reward.type === 'Free' ? 'Free reward amount is fixed at 0' : 'Enter amount required for this stamp level'}
                                                            value={reward.type === 'Free' ? 0 : (reward.amt ?? '')}
                                                            disabled={reward.type === 'Free'}
                                                            readOnly={reward.type === 'Free'}
                                                            onWheel={(e) => {
                                                                e.currentTarget.blur()
                                                                e.preventDefault()
                                                            }}
                                                            onChange={(e) => {
                                                                if (reward.type === 'Free') return
                                                                const val = e.target.value
                                                                setStampForm(prev => {
                                                                    const updated = [...prev.levelRewards]
                                                                    updated[i] = { ...updated[i], amt: val }
                                                                    return { ...prev, levelRewards: updated }
                                                                })
                                                            }}
                                                            style={{
                                                                height: 34,
                                                                fontSize: '0.8rem',
                                                                fontWeight: 600,
                                                                background: reward.type === 'Free' ? '#F1F5F9' : '#FFFFFF',
                                                                color: reward.type === 'Free' ? '#94A3B8' : 'var(--text-primary)',
                                                                cursor: reward.type === 'Free' ? 'not-allowed' : 'text'
                                                            }}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Free Stamp & Free Text (Shown only for reward_type 2: Discount and 3: Paid) */}
                                                {(reward.type === 'Discount' || reward.type === 'Paid') && (
                                                    <div
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 10,
                                                            padding: '7px 10px',
                                                            background: Number(reward.free_stamp) === 1 ? '#F0FDF4' : '#FFFFFF',
                                                            borderRadius: 8,
                                                            border: Number(reward.free_stamp) === 1 ? '1.5px solid #86EFAC' : '1px dashed #CBD5E1',
                                                            transition: 'all 0.2s ease',
                                                            flexWrap: 'wrap'
                                                        }}
                                                    >
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                            <label
                                                                htmlFor={`free-stamp-select-${i}`}
                                                                style={{
                                                                    fontSize: '0.76rem',
                                                                    fontWeight: 700,
                                                                    color: '#334155',
                                                                    margin: 0,
                                                                    whiteSpace: 'nowrap',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: 5
                                                                }}
                                                            >
                                                                <span
                                                                    style={{
                                                                        width: 18,
                                                                        height: 18,
                                                                        borderRadius: '50%',
                                                                        background: Number(reward.free_stamp) === 1 ? '#10B981' : '#E2E8F0',
                                                                        color: Number(reward.free_stamp) === 1 ? '#FFFFFF' : '#94A3B8',
                                                                        display: 'inline-flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        fontSize: '0.55rem'
                                                                    }}
                                                                >
                                                                    <i className="fas fa-gift" />
                                                                </span>
                                                                <span>Free Stamp:</span>
                                                            </label>
                                                            <select
                                                                id={`free-stamp-select-${i}`}
                                                                className="form-control"
                                                                value={Number(reward.free_stamp) === 1 ? 1 : 0}
                                                                onChange={(e) => {
                                                                    const val = Number(e.target.value) === 1 ? 1 : 0
                                                                    setStampForm(prev => {
                                                                        const updated = [...prev.levelRewards]
                                                                        updated[i] = {
                                                                            ...updated[i],
                                                                            free_stamp: val,
                                                                            free_text: val === 1 ? (updated[i]?.free_text || '') : ''
                                                                        }
                                                                        return { ...prev, levelRewards: updated }
                                                                    })
                                                                }}
                                                                style={{
                                                                    width: 78,
                                                                    height: 32,
                                                                    fontSize: '0.78rem',
                                                                    fontWeight: 700,
                                                                    borderRadius: 8,
                                                                    borderColor: Number(reward.free_stamp) === 1 ? '#10B981' : '#CBD5E1',
                                                                    color: Number(reward.free_stamp) === 1 ? '#047857' : '#475569',
                                                                    background: '#FFFFFF'
                                                                }}
                                                            >
                                                                <option value={0}>No</option>
                                                                <option value={1}>Yes</option>
                                                            </select>
                                                        </div>

                                                        {/* If free_stamp is 1, show free_text field */}
                                                        {Number(reward.free_stamp) === 1 && (
                                                            <div style={{ flex: 1, minWidth: 160, display: 'flex', alignItems: 'center', gap: 6 }}>
                                                                <span style={{ fontSize: '0.74rem', fontWeight: 600, color: '#047857', whiteSpace: 'nowrap' }}>
                                                                    Free Text:
                                                                </span>
                                                                <input
                                                                    type="text"
                                                                    className="form-control"
                                                                    placeholder="e.g. Free Cookie, Free Drink..."
                                                                    value={reward.free_text || ''}
                                                                    onChange={(e) => {
                                                                        const textVal = e.target.value
                                                                        setStampForm(prev => {
                                                                            const updated = [...prev.levelRewards]
                                                                            updated[i] = { ...updated[i], free_text: textVal }
                                                                            return { ...prev, levelRewards: updated }
                                                                        })
                                                                    }}
                                                                    style={{
                                                                        height: 32,
                                                                        fontSize: '0.78rem',
                                                                        borderColor: '#86EFAC',
                                                                        background: '#FFFFFF'
                                                                    }}
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT PANEL: LIVE STAMP CARD PREVIEW */}
                    <div className="builder-right-panel" style={{ padding: 24, background: '#F8FAFC', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <small style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 16 }}>
                            LIVE CARD PREVIEW
                        </small>

                        <div
                            style={{
                                width: '100%',
                                maxWidth: 370,
                                borderRadius: 20,
                                ...getCardStyle(stampForm),
                                color: stampForm.textColor || '#FFFFFF',
                                padding: 22,
                                boxShadow: '0 16px 36px -8px rgba(0,0,0,0.25)',
                                position: 'relative',
                                transition: 'all 0.3s ease',
                                minHeight: 240
                            }}
                        >
                            <div style={{ position: 'relative', zIndex: 2 }}>
                                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                                    {/* Left Side */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                            <div style={{ width: 26, height: 26, borderRadius: 8, background: '#FFFFFF', padding: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}>
                                                <img src={formatImageUrl(stampForm.brandLogo) || logo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                            </div>
                                            <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'inherit' }}>
                                                {stampForm.brandName || 'Elite Branch'}
                                            </span>
                                        </div>

                                        <div style={{ fontSize: '0.78rem', opacity: 0.9, marginBottom: 12 }}>
                                            <strong>{stampForm.title || 'Stamp Card Title'}</strong>
                                        </div>

                                        {/* Stamp Circles Slot Canvas */}
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10, maxWidth: 220 }}>
                                            {Array.from({ length: Number(stampForm.total_stamps) }).map((_, i) => {
                                                const r = stampForm.levelRewards[i]
                                                const isType2or3 = r && (r.type === 'Discount' || r.type === 'Paid')
                                                const hasFreeStamp = isType2or3 && Number(r?.free_stamp) === 1

                                                let iconMarkup = i + 1
                                                let mainRewardLabel = `Stamp #${i + 1}`

                                                if (r) {
                                                    if (r.type === 'Free') {
                                                        iconMarkup = <i className={`fas ${r.icon || 'fa-gift'}`} style={{ fontSize: '0.8rem' }} />
                                                        mainRewardLabel = r.reward || 'Free Perk'
                                                    } else if (r.type === 'Discount') {
                                                        const disc = r.discount ?? r.discountVal ?? 0
                                                        iconMarkup = <span style={{ fontSize: '0.62rem', fontWeight: 800 }}>{disc}%</span>
                                                        mainRewardLabel = `${disc}% Discount`
                                                    } else if (r.type === 'Paid') {
                                                        iconMarkup = <i className={`fas ${r.icon || getCategoryDefaultIcon(categoryName)}`} style={{ fontSize: '0.8rem' }} />
                                                        mainRewardLabel = r.reward || 'Paid Perk'
                                                    }
                                                }

                                                const tooltipText = hasFreeStamp
                                                    ? `${mainRewardLabel} FREE: ${r.free_text || 'Free Perk'}`
                                                    : mainRewardLabel

                                                return (
                                                    <div
                                                        key={i}
                                                        title={tooltipText}
                                                        style={{
                                                            width: 36,
                                                            height: 36,
                                                            borderRadius: `${stampForm.stampRadius ?? 50}%`,
                                                            border: `2px solid ${stampForm.stampBorderColor || '#FFFFFF'}`,
                                                            background: stampForm.stampBgColor || 'rgba(255, 255, 255, 0.3)',
                                                            color: stampForm.stampTextColor || 'inherit',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            fontSize: '0.85rem',
                                                            fontWeight: 800,
                                                            flexShrink: 0,
                                                            position: 'relative'
                                                        }}
                                                    >
                                                        {iconMarkup}

                                                        {/* Small circular FREE symbol badge for reward_type 2 or 3 when free_stamp is 1 */}
                                                        {hasFreeStamp && (
                                                            <span
                                                                title={r.free_text ? `Free Perk: ${r.free_text}` : 'Free Perk Included'}
                                                                style={{
                                                                    position: 'absolute',
                                                                    top: -4,
                                                                    right: -4,
                                                                    width: 15,
                                                                    height: 15,
                                                                    borderRadius: '50%',
                                                                    background: '#10B981',
                                                                    color: '#FFFFFF',
                                                                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.35)',
                                                                    border: '1.5px solid #FFFFFF',
                                                                    zIndex: 4,
                                                                    pointerEvents: 'none',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    fontSize: '0.45rem',
                                                                    lineHeight: 1
                                                                }}
                                                            >
                                                                <i className="fas fa-gift" style={{ lineHeight: 1, fontSize: '0.45rem' }} />
                                                            </span>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>

                                    {/* Right Side: QR CODE */}
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <RealQRCode size={86} />
                                        <small style={{ fontSize: '0.6rem', fontWeight: 700, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.9 }}>
                                            SCAN TO STAMP
                                        </small>
                                    </div>
                                </div>

                                {/* BOTTOM RIGHT ALIGNED POWERED BY BADGE WITH FIRSTLOOP LOGO */}
                                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 5, fontSize: '0.65rem', opacity: 0.9, fontWeight: 600, marginTop: 10, lineHeight: 1 }}>
                                    <span style={{ lineHeight: 1, display: 'inline-flex', alignItems: 'center' }}>powered by</span>
                                    <img src={flLogo} alt="FirstLoop" style={{ height: 13, width: 'auto', display: 'inline-block', verticalAlign: 'middle', objectFit: 'contain', margin: '0 1px' }} />
                                    <strong style={{ color: 'inherit', lineHeight: 1, display: 'inline-flex', alignItems: 'center' }}>firstloop.co.in</strong>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Modal Footer Actions */}
                <div style={{ padding: '16px 28px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                    <button
                        type="button"
                        className="btn firstloop-btn-secondary"
                        onClick={onClose}
                        style={{ padding: '9px 20px', borderRadius: 8, fontSize: '0.85rem' }}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="btn firstloop-btn-primary"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        style={{ padding: '9px 22px', borderRadius: 8, fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    >
                        {isSubmitting ? (
                            <>
                                <i className="fas fa-spinner fa-spin" />
                                <span>Saving...</span>
                            </>
                        ) : (
                            <>
                                <i className="fas fa-check" />
                                <span>Save Design</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* =========================================================================
                FONT AWESOME ICON PICKER & MULTI-SELECT MODAL
            ========================================================================= */}
            {(activeIconPickerLevel !== null || isMultiSelectModalOpen) && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(15, 23, 42, 0.65)',
                        backdropFilter: 'blur(4px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 100000,
                        padding: 16
                    }}
                >
                    <div
                        style={{
                            background: '#FFFFFF',
                            borderRadius: 16,
                            maxWidth: 580,
                            width: '100%',
                            maxHeight: '85vh',
                            display: 'flex',
                            flexDirection: 'column',
                            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)',
                            overflow: 'hidden'
                        }}
                    >
                        {/* Header */}
                        <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC' }}>
                            <div>
                                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                                    {isMultiSelectModalOpen
                                        ? `Select Font Awesome Icons for ${categoryName}`
                                        : `Choose Icon for Stamp Level #${(activeIconPickerLevel ?? 0) + 1}`
                                    }
                                </h4>
                                <small style={{ color: '#64748B', fontSize: '0.75rem' }}>
                                    {isMultiSelectModalOpen
                                        ? 'Multi-select icons relevant to your category and price offers'
                                        : 'Pick an icon or apply to multiple stamp levels'
                                    }
                                </small>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setActiveIconPickerLevel(null)
                                    setIsMultiSelectModalOpen(false)
                                }}
                                style={{ background: 'none', border: 'none', fontSize: '1.2rem', color: '#64748B', cursor: 'pointer' }}
                            >
                                <i className="fas fa-times" />
                            </button>
                        </div>

                        {/* Search Bar & Category Filter Tabs */}
                        <div style={{ padding: '14px 20px', borderBottom: '1px solid #F1F5F9', background: '#FFFFFF', display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <div style={{ position: 'relative' }}>
                                <i className="fas fa-search" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', fontSize: '0.85rem' }} />
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Search icons (e.g. coffee, burger, gift, spa, tag, percent)..."
                                    value={iconSearchQuery}
                                    onChange={(e) => setIconSearchQuery(e.target.value)}
                                    style={{ paddingLeft: 36, height: 38, fontSize: '0.85rem', borderRadius: 10 }}
                                />
                            </div>

                            {/* Category Filter Pills */}
                            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
                                {['Recommended', 'All', ...Object.keys(FA_ICONS_BY_CATEGORY)].map((catKey) => {
                                    const isSelected = selectedIconCategoryTab === catKey
                                    return (
                                        <button
                                            key={catKey}
                                            type="button"
                                            onClick={() => setSelectedIconCategoryTab(catKey)}
                                            style={{
                                                padding: '4px 10px',
                                                borderRadius: 20,
                                                fontSize: '0.72rem',
                                                fontWeight: 700,
                                                border: isSelected ? '1px solid var(--firstloop-primary)' : '1px solid #E2E8F0',
                                                background: isSelected ? 'rgba(14, 136, 184, 0.12)' : '#F8FAFC',
                                                color: isSelected ? 'var(--firstloop-primary)' : '#64748B',
                                                cursor: 'pointer',
                                                whiteSpace: 'nowrap'
                                            }}
                                        >
                                            {catKey === 'Recommended' ? `✨ ${categoryName}` : catKey}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Icon Grid */}
                        <div style={{ padding: 18, overflowY: 'auto', maxHeight: 340, background: '#F8FAFC' }}>
                            {(() => {
                                let displayedIcons = []
                                if (selectedIconCategoryTab === 'Recommended') {
                                    displayedIcons = categoryRecommendedIcons
                                } else if (selectedIconCategoryTab === 'All') {
                                    displayedIcons = ALL_FA_ICONS
                                } else if (FA_ICONS_BY_CATEGORY[selectedIconCategoryTab]) {
                                    displayedIcons = FA_ICONS_BY_CATEGORY[selectedIconCategoryTab]
                                }

                                if (iconSearchQuery.trim()) {
                                    const q = iconSearchQuery.toLowerCase()
                                    displayedIcons = ALL_FA_ICONS.filter(
                                        item => item.label.toLowerCase().includes(q) || item.icon.toLowerCase().includes(q)
                                    )
                                }

                                if (displayedIcons.length === 0) {
                                    return (
                                        <div style={{ textAlign: 'center', padding: 28, color: '#94A3B8' }}>
                                            <i className="fas fa-search" style={{ fontSize: '1.8rem', marginBottom: 8 }} />
                                            <p style={{ margin: 0, fontSize: '0.85rem' }}>No icons found for "{iconSearchQuery}"</p>
                                        </div>
                                    )
                                }

                                return (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(76px, 1fr))', gap: 10 }}>
                                        {displayedIcons.map((item, idx) => {
                                            const currentLvlIcon = activeIconPickerLevel !== null ? stampForm.levelRewards[activeIconPickerLevel]?.icon : null
                                            const isSelectedForLevel = currentLvlIcon === item.icon
                                            const isSelectedForCategory = selectedCategoryIcons.includes(item.icon)

                                            return (
                                                <button
                                                    key={`${item.icon}-${idx}`}
                                                    type="button"
                                                    onClick={() => {
                                                        if (isMultiSelectModalOpen) {
                                                            // Toggle in category multi-select list
                                                            setSelectedCategoryIcons(prev =>
                                                                prev.includes(item.icon)
                                                                    ? prev.filter(x => x !== item.icon)
                                                                    : [...prev, item.icon]
                                                            )
                                                        } else if (activeIconPickerLevel !== null) {
                                                            // Assign to active level
                                                            setStampForm(prev => {
                                                                const updated = [...prev.levelRewards]
                                                                updated[activeIconPickerLevel] = {
                                                                    ...updated[activeIconPickerLevel],
                                                                    icon: item.icon
                                                                }
                                                                return { ...prev, levelRewards: updated }
                                                            })
                                                            toast.success(`Selected ${item.label} for Stamp #${activeIconPickerLevel + 1}`)
                                                            setActiveIconPickerLevel(null)
                                                        }
                                                    }}
                                                    style={{
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: 6,
                                                        padding: '10px 6px',
                                                        borderRadius: 10,
                                                        background: (isSelectedForLevel || isSelectedForCategory) ? 'rgba(14, 136, 184, 0.12)' : '#FFFFFF',
                                                        border: (isSelectedForLevel || isSelectedForCategory) ? '2px solid var(--firstloop-primary)' : '1px solid #E2E8F0',
                                                        color: (isSelectedForLevel || isSelectedForCategory) ? 'var(--firstloop-primary)' : '#334155',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.15s ease',
                                                        position: 'relative'
                                                    }}
                                                >
                                                    {isMultiSelectModalOpen && isSelectedForCategory && (
                                                        <span style={{ position: 'absolute', top: 3, right: 4, fontSize: '0.65rem', color: 'var(--firstloop-primary)' }}>
                                                            <i className="fas fa-check-circle" />
                                                        </span>
                                                    )}
                                                    <i className={`fas ${item.icon}`} style={{ fontSize: '1.25rem' }} />
                                                    <span style={{ fontSize: '0.65rem', fontWeight: 600, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', whiteSpace: 'nowrap' }}>
                                                        {item.label}
                                                    </span>
                                                </button>
                                            )
                                        })}
                                    </div>
                                )
                            })()}
                        </div>

                        {/* Modal Footer with Actions */}
                        <div style={{ padding: '12px 20px', borderTop: '1px solid #E2E8F0', background: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                            {activeIconPickerLevel !== null && (
                                <div style={{ display: 'flex', gap: 6 }}>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const activeIcon = stampForm.levelRewards[activeIconPickerLevel]?.icon || 'fa-tag'
                                            setStampForm(prev => ({
                                                ...prev,
                                                levelRewards: prev.levelRewards.map(lvl => ({ ...lvl, icon: activeIcon }))
                                            }))
                                            toast.success(`Applied ${activeIcon} to all ${stampForm.total_stamps} Stamp Levels`)
                                            setActiveIconPickerLevel(null)
                                        }}
                                        className="btn btn-sm btn-outline-secondary"
                                        style={{ fontSize: '0.72rem', padding: '4px 8px', borderRadius: 6 }}
                                    >
                                        Apply to All Stamps
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const activeIcon = stampForm.levelRewards[activeIconPickerLevel]?.icon || 'fa-tag'
                                            setStampForm(prev => ({
                                                ...prev,
                                                levelRewards: prev.levelRewards.map(lvl => ({
                                                    ...lvl,
                                                    icon: lvl.type === 'Paid' ? activeIcon : lvl.icon
                                                }))
                                            }))
                                            toast.success(`Applied ${activeIcon} to all Paid Levels`)
                                            setActiveIconPickerLevel(null)
                                        }}
                                        className="btn btn-sm btn-outline-secondary"
                                        style={{ fontSize: '0.72rem', padding: '4px 8px', borderRadius: 6 }}
                                    >
                                        Apply to All Paid
                                    </button>
                                </div>
                            )}

                            {isMultiSelectModalOpen && (
                                <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>
                                    {selectedCategoryIcons.length} icon(s) selected
                                </div>
                            )}

                            <button
                                type="button"
                                onClick={() => {
                                    setActiveIconPickerLevel(null)
                                    setIsMultiSelectModalOpen(false)
                                }}
                                className="btn firstloop-btn-primary"
                                style={{ padding: '6px 16px', borderRadius: 8, fontSize: '0.8rem', marginLeft: 'auto' }}
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
