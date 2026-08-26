import { useState, useEffect } from 'react'
import logo from '../assets/img/firstloop-favicon.png'
import flLogo from '../assets/img/firstloop-favicon.png'
import qrImg from '../assets/img/qr-img.png'
import API from '../api.js'
import { toast } from 'react-hot-toast'

// Default Card Designs Fallback List
const DEFAULT_CARD_DESIGNS = [
    {
        id: 'cd-def-1',
        name: 'Aurora Cyan',
        image: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&q=80&w=400',
        status: 1
    },
    {
        id: 'cd-def-2',
        name: 'Crimson Wave',
        image: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=400',
        status: 1
    },
    {
        id: 'cd-def-3',
        name: 'Midnight Gold',
        image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=400',
        status: 1
    },
    {
        id: 'cd-def-4',
        name: 'Emerald Luxe',
        image: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&q=80&w=400',
        status: 1
    },
    {
        id: 'cd-def-5',
        name: 'Royal Purple',
        image: 'https://images.unsplash.com/photo-1550684847-75bdda21cc95?auto=format&fit=crop&q=80&w=400',
        status: 1
    }
]

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


const PAID_ICONS = [
    { label: 'Coffee / Drink', icon: 'fa-coffee' },
    { label: 'Gourmet Meal', icon: 'fa-utensils' },
    { label: 'Hair & Styling', icon: 'fa-cut' },
    { label: 'Spa & Care', icon: 'fa-spa' },
    { label: 'Ticket / Voucher', icon: 'fa-ticket-alt' },
    { label: 'VIP Gem', icon: 'fa-gem' },
    { label: 'Crown Pass', icon: 'fa-crown' }
]

// Helper: Get clean relative image path
const getRelativeImagePath = (value) => {
    if (!value) return ''
    let str = String(value).trim()

    if (str.startsWith('data:') || str.startsWith('blob:')) {
        return str
    }

    const uploadsMatch = str.match(/(uploads\/.*)/i)
    if (uploadsMatch) {
        return uploadsMatch[1]
    }

    while (str.includes('http://') || str.includes('https://')) {
        const lastHttp = str.lastIndexOf('http://')
        const lastHttps = str.lastIndexOf('https://')
        const idx = Math.max(lastHttp, lastHttps)
        try {
            const url = new URL(str.substring(idx))
            str = url.pathname
        } catch (e) {
            str = str.replace(/^https?:\/\/[^/]+/i, '')
        }
    }

    return str.replace(/^\/+/, '')
}

// Format Image URL helper
const formatImageUrl = (img) => {
    if (!img) return ''
    let str = String(img).trim()

    if (str.startsWith('data:') || str.startsWith('blob:')) {
        return str
    }

    const rel = getRelativeImagePath(str)
    if (!rel) return ''

    const baseUrl = import.meta.env.VITE_API_URL || ''
    const cleanBase = baseUrl.replace(/\/+$/, '')
    const cleanImg = rel.replace(/^\/+/, '')
    return cleanBase ? `${cleanBase}/${cleanImg}` : cleanImg
}

export default function StampCardBuilderModal({
    isOpen,
    cardData = null,
    cardDesigns = [],
    merchantId = null,
    merchantData = null,
    brandName = '',
    brandImage = null,
    brandLogo = null,
    branches = [],
    onSave,
    onClose
}) {
    const fallbackBrandName = brandName || merchantData?.brand_name || merchantData?.bus_name || 'Elite Branch'
    const fallbackBrandLogo = brandImage || brandLogo || merchantData?.brand_image || merchantData?.profile_image || logo

    const [fetchedDesigns, setFetchedDesigns] = useState([])
    const [stampForm, setStampForm] = useState({
        id: null,
        title: '',
        brandName: fallbackBrandName,
        brandLogo: fallbackBrandLogo,
        brandLogoFile: null,
        total_stamps: 8,
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
        levelRewards: Array.from({ length: 8 }).map((_, i) => ({
            stamp: i + 1,
            reward: '',
            type: 'Free',
            discountVal: 0,
            icon: 'fa-gift',
            amt: 0
        }))
    })

    // Self-contained API call to fetch card designs if not provided via props
    useEffect(() => {
        if (isOpen) {
            if (!cardDesigns || cardDesigns.length === 0) {
                fetchCardDesignsFromApi()
            }
        }
    }, [isOpen, cardDesigns])

    const fetchCardDesignsFromApi = async () => {
        try {
            const response = await API.post('admin/card-design/list')
            console.log("response",response)

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

            setFetchedDesigns(DEFAULT_CARD_DESIGNS.map(d => ({ ...d, image: formatImageUrl(d.image) })))
        } catch (err) {
            console.error('Error fetching card designs in StampCardBuilderModal:', err)
            setFetchedDesigns(DEFAULT_CARD_DESIGNS.map(d => ({ ...d, image: formatImageUrl(d.image) })))
        }
    }

    const stamp_card = async () => {
        try {
            // Get merchant ID
            const targetMerchantId =
                merchantId ||
                stampForm.mer_id ||
                stampForm.merchant_id ||
                cardData?.merchant_id ||
                cardData?.mer_id ||
                25;

            // Build FormData payload
            const formData = new FormData();
            
            // If editing an existing card, include the card ID
            if (stampForm.id) {
                formData.append('id', Number(stampForm.id));
            }

            // Core required fields
            formData.append('merchant_id', Number(targetMerchantId));
            formData.append('branch_ids', JSON.stringify(stampForm.branch_ids || []));
            formData.append('title', stampForm.title || '');
            formData.append('brand_name', stampForm.brandName || 'Elite Branch');
            formData.append('number_of_stamps', Number(stampForm.total_stamps || 8));

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

            // Stamp reward levels array JSON string
            const levelsPayload = (stampForm.levelRewards || []).map((lvl, idx) => ({
                stamp_number: idx + 1,
                reward_type: lvl.type === 'Discount' ? '2' : (lvl.type === 'Paid' ? '3' : '1'),
                amt: Number(lvl.amt || (lvl.type === 'Discount' ? lvl.discountVal : 0) || 0),
                reward_text: lvl.reward || (lvl.type === 'Discount' ? `${lvl.discountVal || 10}% Off` : `Stamp #${idx + 1}`)
            }));
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
                'Error while creating stamp card'
            );
        }
        finally {
            // Optional loading handling can be added here
        }
    };

    const availableDesigns = cardDesigns && cardDesigns.length > 0 ? cardDesigns : fetchedDesigns

    // Sync form state when modal opens or cardData changes
    useEffect(() => {
        if (!isOpen) return

        if (cardData) {
            const count = cardData.total_stamps || 8
            setStampForm({
                id: cardData.id,
                title: cardData.title || '',
                brandName: cardData.brandName || cardData.brand_name || fallbackBrandName,
                brandLogo: cardData.brandLogo || cardData.brand_image || fallbackBrandLogo,
                brandLogoFile: null,
                total_stamps: count,
                reward: cardData.reward || '',
                bgColor: cardData.bgColor || '#0E88B8',
                bgImage: cardData.bgImage || null,
                cardDesignId: cardData.cardDesignId || null,
                textColor: cardData.textColor || '#FFFFFF',
                borderColor: cardData.borderColor || '#00A6D6',
                stampBgColor: cardData.stampBgColor || 'rgba(255, 255, 255, 0.3)',
                stampBorderColor: cardData.stampBorderColor || '#FFFFFF',
                stampTextColor: cardData.stampTextColor || '#FFFFFF',
                stampRadius: Number(cardData.stamp_radius ?? cardData.stampRadius ?? 50),
                preset: cardData.preset || 'Custom',
                branch_ids: Array.isArray(cardData.branch_ids)
                    ? cardData.branch_ids.map(Number)
                    : (cardData.branch_id ? [Number(cardData.branch_id)] : (branches || []).map(b => Number(b.id))),
                levelRewards: cardData.levelRewards && cardData.levelRewards.length === count
                    ? cardData.levelRewards.map((r, i) => ({
                        stamp: i + 1,
                        reward: r.reward || '',
                        type: r.type || 'Free',
                        discountVal: r.discountVal || 0,
                        icon: r.icon || 'fa-gift',
                        amt: r.amt || 0
                    }))
                    : Array.from({ length: count }).map((_, i) => ({
                        stamp: i + 1,
                        reward: '',
                        type: 'Free',
                        discountVal: 0,
                        icon: 'fa-gift',
                        amt: 0
                    }))
            })
        } else {
            setStampForm({
                id: null,
                title: '',
                brandName: fallbackBrandName,
                brandLogo: fallbackBrandLogo,
                brandLogoFile: null,
                total_stamps: 8,
                reward: 'Free Beverage or Meal Pass',
                bgColor: '#0E88B8',
                bgImage: availableDesigns.length > 0 ? availableDesigns[0].image : null,
                cardDesignId: availableDesigns.length > 0 ? availableDesigns[0].id : null,
                textColor: '#FFFFFF',
                borderColor: '#00A6D6',
                stampBgColor: 'rgba(255, 255, 255, 0.3)',
                stampBorderColor: '#FFFFFF',
                stampTextColor: '#FFFFFF',
                preset: availableDesigns.length > 0 ? availableDesigns[0].name : 'Custom',
                branch_ids: (branches || []).map(b => Number(b.id)),
                levelRewards: Array.from({ length: 8 }).map((_, i) => ({
                    stamp: i + 1,
                    reward: '',
                    type: 'Free',
                    discountVal: 0,
                    icon: 'fa-gift',
                    amt: 0
                }))
            })
        }
    }, [cardData, availableDesigns, isOpen, branches, fallbackBrandName, fallbackBrandLogo])

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

    // Helper: Compute Card Background Style
    const getCardStyle = (card) => {
        const bgImg = card.bgImage
        if (bgImg && bgImg !== 'none' && bgImg !== 'null' && bgImg !== 'undefined') {
            return {
                backgroundImage: `url(${formatImageUrl(bgImg)})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
            }
        }
        return {
            backgroundColor: card.bgColor || card.background_color || '#0E88B8',
            border: `2px solid ${card.borderColor || card.border_color || '#00A6D6'}`
        }
    }

    const handleSubmit = () => {
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

                                    <div className="card-builder-form-trio">
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
                                                Number of Stamps (1-10 Max)
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                max="10"
                                                className="form-control"
                                                value={stampForm.total_stamps}
                                                onChange={(e) => {
                                                    const count = Math.min(10, Math.max(1, Number(e.target.value) || 1))
                                                    setStampForm(prev => ({
                                                        ...prev,
                                                        total_stamps: count,
                                                        levelRewards: Array.from({ length: count }).map((_, i) => prev.levelRewards[i] || { stamp: i + 1, reward: '', type: 'Free', discountVal: 0, icon: 'fa-gift' })
                                                    }))
                                                }}
                                                style={{ height: 36, fontSize: '0.85rem' }}
                                            />
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
                                <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Stamp Levels Configuration ({stampForm.total_stamps} Levels)
                                </h4>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    {Array.from({ length: Number(stampForm.total_stamps) }).map((_, i) => {
                                        const reward = stampForm.levelRewards[i] || { stamp: i + 1, reward: '', type: 'Free', discountVal: 0, icon: 'fa-gift', amt: 0 }
                                        return (
                                            <div key={i} style={{ padding: 10, background: '#F8FAFC', borderRadius: 10, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 8 }}>
                                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                                    <span style={{ fontSize: '0.78rem', fontWeight: 700, width: 60, color: 'var(--firstloop-primary)' }}>
                                                        Stamp {i + 1}
                                                    </span>

                                                    <select
                                                        className="form-control"
                                                        value={reward.type || 'Free'}
                                                        onChange={(e) => {
                                                            const typeVal = e.target.value
                                                            setStampForm(prev => {
                                                                const updated = [...prev.levelRewards]
                                                                updated[i] = {
                                                                    ...updated[i],
                                                                    stamp: i + 1,
                                                                    type: typeVal,
                                                                    icon: typeVal === 'Free' ? 'fa-gift' : typeVal === 'Discount' ? 'fa-percent' : 'fa-coffee'
                                                                }
                                                                return { ...prev, levelRewards: updated }
                                                            })
                                                        }}
                                                        style={{ width: 110, height: 36, fontSize: '0.8rem' }}
                                                    >
                                                        <option value="Free">Free 🎁</option>
                                                        <option value="Discount">Discount %</option>
                                                        <option value="Paid">Paid Perk</option>
                                                    </select>

                                                    {reward.type === 'Discount' ? (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, width: 130 }}>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                max="100"
                                                                className="form-control"
                                                                placeholder="0-100"
                                                                value={reward.discountVal || ''}
                                                                onChange={(e) => {
                                                                    const val = Math.min(100, Math.max(0, Number(e.target.value) || 0))
                                                                    setStampForm(prev => {
                                                                        const updated = [...prev.levelRewards]
                                                                        updated[i] = { ...updated[i], discountVal: val, reward: `${val}% Discount` }
                                                                        return { ...prev, levelRewards: updated }
                                                                    })
                                                                }}
                                                                style={{ height: 36, fontSize: '0.82rem' }}
                                                            />
                                                            <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>%</span>
                                                        </div>
                                                    ) : reward.type === 'Paid' ? (
                                                        <select
                                                            className="form-control"
                                                            value={reward.icon || 'fa-coffee'}
                                                            onChange={(e) => {
                                                                const iconVal = e.target.value
                                                                setStampForm(prev => {
                                                                    const updated = [...prev.levelRewards]
                                                                    updated[i] = { ...updated[i], icon: iconVal }
                                                                    return { ...prev, levelRewards: updated }
                                                                })
                                                            }}
                                                            style={{ width: 140, height: 36, fontSize: '0.8rem' }}
                                                        >
                                                            {PAID_ICONS.map(pi => (
                                                                <option key={pi.icon} value={pi.icon}>
                                                                    {pi.label}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    ) : (
                                                        <div style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                            <i className="fas fa-gift" /> Free Reward
                                                        </div>
                                                    )}
                                                </div>

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

                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="any"
                                                        className="form-control"
                                                        placeholder="Amt (Spend)"
                                                        value={reward.amt ?? ''}
                                                        onChange={(e) => {
                                                            const val = e.target.value === '' ? '' : Number(e.target.value) || 0
                                                            setStampForm(prev => {
                                                                const updated = [...prev.levelRewards]
                                                                updated[i] = { ...updated[i], amt: val }
                                                                return { ...prev, levelRewards: updated }
                                                            })
                                                        }}
                                                        style={{ flex: 1, height: 34, fontSize: '0.8rem' }}
                                                    />
                                                </div>
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
                                {/* ALERT NOTICE BADGE: 2 STAMPS ONLY REMAINING & EXPIRES IN 30 DAYS */}


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
                                                let iconMarkup = i + 1
                                                if (r) {
                                                    if (r.type === 'Free') {
                                                        iconMarkup = <i className="fas fa-gift" style={{ fontSize: '0.8rem' }} />
                                                    } else if (r.type === 'Discount') {
                                                        iconMarkup = <span style={{ fontSize: '0.65rem', fontWeight: 800 }}>{r.discountVal || 10}%</span>
                                                    } else if (r.type === 'Paid' && r.icon) {
                                                        iconMarkup = <i className={`fas ${r.icon}`} style={{ fontSize: '0.8rem' }} />
                                                    }
                                                }

                                                return (
                                                    <div
                                                        key={i}
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
                                                            flexShrink: 0
                                                        }}
                                                    >
                                                        {iconMarkup}
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
                        style={{ padding: '9px 22px', borderRadius: 8, fontSize: '0.85rem' }}
                    >
                        <i className="fas fa-check" style={{ marginRight: 6 }} />
                        Save Design
                    </button>
                </div>
            </div>
        </div>
    )
}
