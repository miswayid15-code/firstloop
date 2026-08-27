import { useState, useEffect, useMemo } from 'react'
import { INITIAL_STAMP_CARDS, INITIAL_MEMBERSHIP_CARDS } from './mockMerchantData'
import flLogo from '../../assets/img/firstloop-favicon.png'
import qrImg from '../../assets/img/qr-img.png'
import axios from 'axios'
import API from '../../api.js'
import StampCardBuilderModal from '../../components/StampCardBuilderModal.jsx'
import MembershipCardBuilderModal from '../../components/MembershipCardBuilderModal.jsx'
import StampCardPreviewModal from '../../components/StampCardPreviewModal.jsx'

// const DEFAULT_CARD_DESIGNS = [
//     {
//         id: 'cd-def-1',
//         name: 'Aurora Cyan',
//         image: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&q=80&w=400',
//         status: 1
//     },
//     {
//         id: 'cd-def-2',
//         name: 'Crimson Wave',
//         image: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=400',
//         status: 1
//     },
//     {
//         id: 'cd-def-3',
//         name: 'Midnight Gold',
//         image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=400',
//         status: 1
//     },
//     {
//         id: 'cd-def-4',
//         name: 'Emerald Luxe',
//         image: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&q=80&w=400',
//         status: 1
//     },
//     {
//         id: 'cd-def-5',
//         name: 'Royal Purple',
//         image: 'https://images.unsplash.com/photo-1550684847-75bdda21cc95?auto=format&fit=crop&q=80&w=400',
//         status: 1
//     }
// ]

// Real QR Code Component matching view-fl-branch
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

const formatValidity = (val) => {
    if (!val) return '12 Months'
    const str = String(val).trim()
    if (/^\d+$/.test(str)) {
        return `${str} Month${Number(str) > 1 ? 's' : ''}`
    }
    return str
}

const formatImageUrl = (img) => {
    if (!img) return ''
    let str = String(img).trim()

    if (str.startsWith('data:') || str.startsWith('blob:')) {
        return str
    }

    if (str.startsWith('http://') || str.startsWith('https://')) {
        return str
    }

    const baseUrl = import.meta.env.VITE_API_URL || ''
    const cleanBase = baseUrl.replace(/\/+$/, '')
    const cleanImg = getRelativeImagePath(str).replace(/^\/+/, '')
    return cleanBase ? `${cleanBase}/${cleanImg}` : `/${cleanImg}`
}

export default function CardList() {

    const [activeTab, setActiveTab] = useState('stamps')

    // Dynamic Lists State
    const [stampCards, setStampCards] = useState([])
    const [membershipCards, setMembershipCards] = useState(INITIAL_MEMBERSHIP_CARDS)
    const [cardDesignsApi, setCardDesignsApi] = useState([])

    const [stampSearch, setStampSearch] = useState('')
  
    const getStoredMerchant = () => {
        try {
            const raw = localStorage.getItem("merchant_data")
            if (raw && raw !== "null" && raw !== "undefined") {
                const parsed = JSON.parse(raw)
                return parsed?.merchant_data || parsed || null
            }
        } catch (e) {
            console.error("Error parsing merchant_data:", e)
        }
        return null
    }

    const initialMerchant = getStoredMerchant()
    const initialMerId = initialMerchant?.id || initialMerchant?.user_id || initialMerchant?.merchant_id || initialMerchant?.mer_id || null

    const [merchantData, setMerchantData] = useState(initialMerchant)
    const [branchesData, setBranchesData] = useState(null)
    const [loading, setLoading] = useState(false)
    const [selectedCategoryId, setSelectedCategoryId] = useState(null)
    const [merId, setMerId] = useState(initialMerId)

    const [stampBuilderOpen, setStampBuilderOpen] = useState(false)
    const [selectedEditStampCard, setSelectedEditStampCard] = useState(null)
    const [selectedStampCard, setSelectedStampCard] = useState(null)
    const [membershipBuilderOpen, setMembershipBuilderOpen] = useState(false)
    const [membershipSearch, setMembershipSearch] = useState('')
    const [selectedEditMembershipCard, setSelectedEditMembershipCard] = useState(null)
    const [selectedMembership, setSelectedMembership] = useState(null)

    useEffect(() => {
        fetchCardDesignsFromApi()
        const targetId = initialMerId
        if (targetId) {
            fetchStampCards(targetId)
            fetchMerchant(targetId)
        } else {
            fetchStampCards()
            fetchMerchant()
        }
    }, [])

    const fetchCardDesignsFromApi = async () => {
        try {
            const response = await API.post('admin/card-design/list')
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
                    setCardDesignsApi(formattedDesigns)
                    return
                }
            }

            setCardDesignsApi(DEFAULT_CARD_DESIGNS.map(d => ({ ...d, image: formatImageUrl(d.image) })))
        } catch (err) {
            console.error('Error fetching card designs from API:', err)
            setCardDesignsApi(DEFAULT_CARD_DESIGNS.map(d => ({ ...d, image: formatImageUrl(d.image) })))
        }
    }

    const fetchMerchant = async (targetId) => {
        const idToFetch = targetId || merId || initialMerId
        try {
            setLoading(true)

            let response = null
            if (idToFetch) {
                try {
                    response = await API.post('firstloop/merchant/fetch-id', { id: idToFetch })
                } catch (e) {
                    console.log(e)
                }
            }

            // Fallback to merchant branch list if admin fetch is not accessible
            if (!response?.data || (response.data.status !== 1 && response.data.status !== '1')) {
                try {
                    const branchRes = await API.post('firstloop/merchant/branch-list')
                    if (branchRes?.data?.status === 1 || branchRes?.data?.status === '1') {
                        const branches = Array.isArray(branchRes.data.data) ? branchRes.data.data : []
                        setBranchesData(branches)
                    }
                } catch (e) {}
            }

            console.log("merchant data", response?.data)

            if (response?.data && (response.data.status === 1 || response.data.status === '1' || response.data.success)) {
                const merchant = response.data.data
                if (merchant && typeof merchant === 'object' && !Array.isArray(merchant)) {
                    setMerchantData(merchant)

                    setSelectedCategoryId(
                        merchant.cat_id?.toString() || ''
                    )

                    const branches = merchant.Branches || merchant.branches || []
                    const sortedBranches = [...branches].sort((a, b) => Number(b.id) - Number(a.id))
                    setBranchesData(sortedBranches)
                }
            }
        } catch (err) {
            console.error("Error fetching merchant:", err.response?.data || err.message)
        } finally {
            setLoading(false)
        }
    }

    const fetchStampCards = async (targetId) => {
        const mId = targetId || merId || initialMerId
        if (!mId) return

        try {
            const response = await API.post('firstloop/merchant/fetch-stamp-card', {
                mer_id: Number(mId)
            })

            console.log('Fetch Stamp Card Response:', response?.data)

            if (response?.data?.status === 1 || response?.data?.status === '1' || response?.data?.success) {
                const rawList = response.data.data || response.data.stamp_cards || response.data.cards || []
                const list = Array.isArray(rawList) ? rawList : []

                const formatted = list.map(item => ({
                    id: item.id || item._id,
                    title: item.title || 'Stamp Pass',
                    brandName: item.brand_name || merchantData?.brand_name || merchantData?.bus_name || merchantData?.user_name || 'Merchant',
                    brandLogo: item.brand_image ? formatImageUrl(item.brand_image) : null,
                    total_stamps: Number(item.number_of_stamps) || 8,
                    reward: item.reward || 'Special Gift',
                    active_members: item.active_members || 0,
                    expiry: item.expiry || '2026-12-31',
                    status: 'Active',
                    bgColor: item.background_color || '#0E88B8',
                    bgImage: item.background_image ? formatImageUrl(item.background_image) : null,
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
                }))

                if (formatted.length > 0) {
                    setStampCards(formatted)
                }
            }
        } catch (err) {
            console.error('Error fetching stamp cards from API:', err)
        }
    }
    // Filtered lists
    const filteredStampCards = useMemo(() => {
        return stampCards.filter(sc =>
            sc.title.toLowerCase().includes(stampSearch.toLowerCase()) ||
            (sc.reward && sc.reward.toLowerCase().includes(stampSearch.toLowerCase()))
        )
    }, [stampCards, stampSearch])

    const filteredMemberships = useMemo(() => {
        return membershipCards.filter(mc =>
            mc.name.toLowerCase().includes(membershipSearch.toLowerCase()) ||
            (mc.tier && mc.tier.toLowerCase().includes(membershipSearch.toLowerCase()))
        )
    }, [membershipCards, membershipSearch])

    // Card Style Helper (supports bgImage, cardDesignId and bgColor)
    const getCardStyle = (card) => {
        const style = {
            border: `2px solid ${card.borderColor || 'rgba(255,255,255,0.4)'}`
        }
        const bgImg = card.bgImage || (card.cardDesignId ? cardDesignsApi.find(d => String(d.id) === String(card.cardDesignId))?.image : null)
        if (bgImg) {
            style.backgroundImage = `url(${formatImageUrl(bgImg)})`
            style.backgroundSize = 'cover'
            style.backgroundPosition = 'center'
            style.backgroundRepeat = 'no-repeat'
        } else {
            style.backgroundColor = card.bgColor || '#0E88B8'
        }
        return style
    }

    // --- STAMP CARD HANDLERS ---
    const handleOpenCreateStampCard = () => {
        setSelectedEditStampCard(null)
        setStampBuilderOpen(true)
    }

    const handleOpenEditStampCard = (card) => {
        setSelectedEditStampCard(card)
        setStampBuilderOpen(true)
    }

    const handleSaveStampCard = (savedForm) => {
        const count = Number(savedForm.total_stamps) || 8

        if (savedForm.id) {
            setStampCards(prev => prev.map(item => item.id === savedForm.id ? {
                ...item,
                title: savedForm.title,
                brandName: savedForm.brandName,
                brandLogo: savedForm.brandLogo || flLogo,
                total_stamps: count,
                reward: savedForm.reward,
                bgColor: savedForm.bgColor,
                bgImage: savedForm.bgImage,
                cardDesignId: savedForm.cardDesignId,
                textColor: savedForm.textColor,
                borderColor: savedForm.borderColor,
                stampBgColor: savedForm.stampBgColor,
                stampBorderColor: savedForm.stampBorderColor,
                stampTextColor: savedForm.stampTextColor,
                preset: savedForm.preset,
                levelRewards: savedForm.levelRewards
            } : item))
        } else {
            const newCard = {
                id: `sc-${Date.now()}`,
                title: savedForm.title,
                brandName: savedForm.brandName,
                brandLogo: savedForm.brandLogo || flLogo,
                tagline: `Collect ${count} Stamps & Get Rewards`,
                total_stamps: count,
                reward: savedForm.reward || 'Special Gift Voucher',
                active_members: 1,
                expiry: '2026-12-31',
                status: 'Active',
                icon: 'fa-stamp',
                bgColor: savedForm.bgColor,
                bgImage: savedForm.bgImage,
                cardDesignId: savedForm.cardDesignId,
                textColor: savedForm.textColor,
                borderColor: savedForm.borderColor,
                stampBgColor: savedForm.stampBgColor,
                stampBorderColor: savedForm.stampBorderColor,
                stampTextColor: savedForm.stampTextColor,
                preset: savedForm.preset,
                stamps_given: 0,
                rewards_claimed: 0,
                levelRewards: savedForm.levelRewards
            }
            setStampCards(prev => [newCard, ...prev])
        }
        setStampBuilderOpen(false)
    }

    const handleDeleteStampCard = (id) => {
        if (window.confirm('Are you sure you want to delete this stamp card pass?')) {
            setStampCards(prev => prev.filter(sc => sc.id !== id))
        }
    }

    // --- MEMBERSHIP CARD HANDLERS ---
    const handleOpenCreateMembership = () => {
        setSelectedEditMembershipCard(null)
        setMembershipBuilderOpen(true)
    }

    const handleOpenEditMembership = (mem) => {
        setSelectedEditMembershipCard(mem)
        setMembershipBuilderOpen(true)
    }

    const handleSaveMembershipCard = (savedForm) => {
        const validNum = Number(savedForm.validityMonths) || 12

        if (savedForm.id) {
            setMembershipCards(prev => prev.map(item => item.id === savedForm.id ? {
                ...item,
                name: savedForm.name,
                brandName: savedForm.brandName,
                brandLogo: savedForm.brandLogo,
                validityMonths: validNum,
                bgColor: savedForm.bgColor,
                bgImage: savedForm.bgImage,
                cardDesignId: savedForm.cardDesignId,
                textColor: savedForm.textColor,
                borderColor: savedForm.borderColor,
                preset: savedForm.preset,
                isDefault: savedForm.isDefault
            } : item))
        } else {
            const newMem = {
                id: `mc-${Date.now()}`,
                name: savedForm.name,
                brandName: savedForm.brandName,
                brandLogo: savedForm.brandLogo,
                validityMonths: validNum,
                tier: 'Custom VIP',
                bgColor: savedForm.bgColor,
                bgImage: savedForm.bgImage,
                cardDesignId: savedForm.cardDesignId,
                textColor: savedForm.textColor,
                borderColor: savedForm.borderColor,
                preset: savedForm.preset,
                isDefault: savedForm.isDefault,
                minSpend: 'New Membership',
                activeMembers: 1,
                perks: [
                    'Exclusive Member Discount',
                    'Priority Lounge Seating',
                    'Free Birthday Reward Pass'
                ],
                status: 'Active'
            }
            setMembershipCards(prev => [newMem, ...prev])
        }
        setMembershipBuilderOpen(false)
    }

    const handleDeleteMembershipCard = (id) => {
        if (window.confirm('Are you sure you want to delete this membership card?')) {
            setMembershipCards(prev => prev.filter(mc => mc.id !== id))
        }
    }

    return (
        <div style={{ paddingBottom: 40 }}>
            {/* Header */}
            <div className="flex-between mb-4" style={{ flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                        Loyalty Card List & Builder Studio
                    </h2>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>
                        Create & manage Stamp Cards and Membership Tiers matching `view-fl-branch` UI system.
                    </p>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                    <button
                        type="button"
                        className="btn firstloop-btn-primary"
                        onClick={handleOpenCreateStampCard}
                        style={{ padding: '10px 16px', borderRadius: 10, display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}
                    >
                        <i className="fas fa-plus-circle" />
                        <span>+ Add Stamp Card</span>
                    </button>

                    <button
                        type="button"
                        className="btn"
                        onClick={handleOpenCreateMembership}
                        style={{ padding: '10px 16px', borderRadius: 10, display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', background: '#D97706', color: '#FFF', fontWeight: 700, border: 'none' }}
                    >
                        <i className="fas fa-plus-circle" />
                        <span>+ Add Membership Card</span>
                    </button>
                </div>
            </div>

            {/* TAB SELECTOR */}
            <div style={{ display: 'flex', borderBottom: '2px solid rgba(14, 136, 184, 0.15)', marginBottom: 24 }}>
                <button
                    type="button"
                    onClick={() => setActiveTab('stamps')}
                    style={{
                        padding: '12px 24px',
                        fontWeight: 800,
                        fontSize: '0.95rem',
                        border: 'none',
                        background: 'none',
                        color: activeTab === 'stamps' ? 'var(--firstloop-primary)' : 'var(--text-muted)',
                        borderBottom: activeTab === 'stamps' ? '3px solid var(--firstloop-primary)' : 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8
                    }}
                >
                    <i className="fas fa-stamp" />
                    <span>Stamp Cards ({stampCards.length})</span>
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab('memberships')}
                    style={{
                        padding: '12px 24px',
                        fontWeight: 800,
                        fontSize: '0.95rem',
                        border: 'none',
                        background: 'none',
                        color: activeTab === 'memberships' ? '#D97706' : 'var(--text-muted)',
                        borderBottom: activeTab === 'memberships' ? '3px solid #D97706' : 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8
                    }}
                >
                    <i className="fas fa-crown" />
                    <span>Membership Cards ({membershipCards.length})</span>
                </button>
            </div>

            {/* ================= STAMP CARDS TAB ================= */}
            {activeTab === 'stamps' && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                        <div style={{ position: 'relative', width: 300 }}>
                            <i className="fas fa-search" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Search stamp cards..."
                                value={stampSearch}
                                onChange={(e) => setStampSearch(e.target.value)}
                                style={{ paddingLeft: 36, height: 38, borderRadius: 8, fontSize: '0.85rem' }}
                            />
                        </div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            Showing {filteredStampCards.length} Stamp Cards
                        </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
                        {filteredStampCards.map((card) => (
                            <div key={card.id} style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
                                {/* Stamp Card Canvas (ViewFlBranch Style) */}
                                <div
                                    style={{
                                        width: '100%',
                                        borderRadius: 20,
                                        ...getCardStyle(card),
                                        color: card.textColor || '#FFFFFF',
                                        padding: 16,
                                        boxShadow: '0 12px 28px -6px rgba(0,0,0,0.25)',
                                        position: 'relative',
                                        minHeight: 220
                                    }}
                                >
                                    {/* ALERT NOTICE BADGE: 2 STAMPS ONLY REMAINING & EXPIRED IN 30 DAYS */}


                                    <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                                <div style={{ width: 26, height: 26, borderRadius: 8, background: '#FFF', padding: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <img src={formatImageUrl(card.brandLogo) || flLogo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                                </div>
                                                <span style={{ fontSize: '0.92rem', fontWeight: 800, color: 'inherit' }}>
                                                    {card.brandName || 'Urban Brew'}
                                                </span>
                                            </div>

                                            <div style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {card.title}
                                            </div>

                                            {/* Stamp Circles Grid */}
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 6, maxWidth: 220 }}>
                                                {Array.from({ length: Number(card.total_stamps || 8) }).map((_, i) => {
                                                    const rewardItem = card.levelRewards ? card.levelRewards[i] : null
                                                    let iconMarkup = i + 1

                                                    if (rewardItem) {
                                                        if (rewardItem.type === 'Free') {
                                                            iconMarkup = <i className="fas fa-gift" style={{ fontSize: '0.8rem' }} />
                                                        } else if (rewardItem.type === 'Discount') {
                                                            iconMarkup = <span style={{ fontSize: '0.65rem', fontWeight: 800 }}>{rewardItem.discount ?? rewardItem.discountVal ?? 0}%</span>
                                                        } else if (rewardItem.type === 'Paid') {
                                                            iconMarkup = <i className={`fas ${rewardItem.icon || 'fa-tag'}`} style={{ fontSize: '0.8rem' }} />
                                                        }
                                                    }

                                                    return (
                                                        <div
                                                            key={i}
                                                            style={{
                                                                width: 36,
                                                                height: 36,
                                                                borderRadius: '50%',
                                                                border: `2px solid ${card.stampBorderColor || '#FFFFFF'}`,
                                                                background: card.stampBgColor || 'rgba(255, 255, 255, 0.3)',
                                                                color: card.stampTextColor || 'inherit',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                fontSize: '0.82rem',
                                                                fontWeight: 800
                                                            }}
                                                        >
                                                            {iconMarkup}
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>

                                        {/* QR Code Preview */}
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                                            <RealQRCode size={84} />
                                            <small style={{ fontSize: '0.58rem', fontWeight: 800, marginTop: 4, letterSpacing: '0.5px' }}>
                                                SCAN TO STAMP
                                            </small>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 4, fontSize: '0.65rem', opacity: 0.9, marginTop: 10, fontWeight: 700 }}>
                                        <span>powered by</span>
                                        <img src={flLogo} alt="FirstLoop" style={{ height: 12 }} />
                                        <span>firstloop.co.in</span>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div style={{ display: 'flex', gap: 10 }}>
                                    <button
                                        type="button"
                                        className="btn firstloop-btn-primary"
                                        onClick={() => handleOpenEditStampCard(card)}
                                        style={{ flex: 1, padding: '8px 12px', fontSize: '0.8rem', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                                    >
                                        <i className="fas fa-edit" />
                                        <span>Edit Card Design</span>
                                    </button>

                                    <button
                                        type="button"
                                        className="btn firstloop-btn-secondary"
                                        onClick={() => setSelectedStampCard(card)}
                                        style={{ padding: '8px 14px', fontSize: '0.82rem', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6 }}
                                    >
                                        <i className="fas fa-eye" />
                                        <span>Preview</span>
                                    </button>

                                    <button
                                        type="button"
                                        className="btn"
                                        onClick={() => handleDeleteStampCard(card.id)}
                                        style={{ padding: '8px 12px', fontSize: '0.8rem', borderRadius: 8, background: 'var(--status-danger-bg)', color: 'var(--status-danger)', border: 'none' }}
                                    >
                                        <i className="fas fa-trash-alt" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ================= MEMBERSHIP CARDS TAB ================= */}
            {activeTab === 'memberships' && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                        <div style={{ position: 'relative', width: 300 }}>
                            <i className="fas fa-search" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Search membership cards..."
                                value={membershipSearch}
                                onChange={(e) => setMembershipSearch(e.target.value)}
                                style={{ paddingLeft: 36, height: 38, borderRadius: 8, fontSize: '0.85rem' }}
                            />
                        </div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            Showing {filteredMemberships.length} Membership Cards
                        </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
                        {filteredMemberships.map((mem) => (
                            <div key={mem.id} style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
                                {/* DIGITAL MEMBERSHIP PASS CANVAS WITH LARGE MIDDLE QR CODE */}
                                <div
                                    style={{
                                        width: '100%',
                                        maxWidth: 380,
                                        borderRadius: 20,
                                        ...getCardStyle(mem),
                                        color: mem.textColor || '#FFFFFF',
                                        padding: 22,
                                        boxShadow: '0 14px 30px -6px rgba(0,0,0,0.22)',
                                        position: 'relative',
                                        minHeight: 210
                                    }}
                                >
                                    <div style={{ position: 'relative', zIndex: 2 }}>
                                        {/* ALERT NOTICE BADGE: EXPIRED IN 30 DAYS */}


                                        {/* Header Row */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <div style={{ width: 34, height: 34, borderRadius: 10, background: '#FFFFFF', padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}>
                                                    <img src={formatImageUrl(mem.brandLogo) || flLogo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                                </div>
                                                <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'inherit' }}>
                                                    {mem.brandName || 'FirstLoop'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Middle Section: Left Info + Right Large Middle QR Code */}
                                        <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 10 }}>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'inherit' }}>
                                                    {mem.name}
                                                </div>

                                                <div style={{ marginTop: 12, borderTop: '1px solid rgba(255,255,255,0.25)', paddingTop: 8 }}>
                                                    <small style={{ fontSize: '0.65rem', textTransform: 'uppercase', opacity: 0.85 }}>
                                                        Valid Thru
                                                    </small>
                                                    <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'inherit' }}>
                                                        {formatValidity(mem.validityMonths)}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Large Centered Middle QR Code */}
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                <RealQRCode size={92} />
                                                <small style={{ fontSize: '0.6rem', fontWeight: 700, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.9 }}>
                                                    SCAN PASS
                                                </small>
                                            </div>
                                        </div>

                                        {/* Bottom Right Logo Badge */}
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 5, fontSize: '0.65rem', opacity: 0.9, fontWeight: 600, marginTop: 6 }}>
                                            <span>powered by</span>
                                            <img src={flLogo} alt="FirstLoop" style={{ height: 14, objectFit: 'contain' }} />
                                            <strong style={{ color: 'inherit' }}>firstloop.co.in</strong>
                                        </div>
                                    </div>
                                </div>

                                {/* Membership Action Bar */}
                                <div style={{ display: 'flex', gap: 10, padding: '0 4px' }}>
                                    <button
                                        type="button"
                                        className="btn"
                                        onClick={() => handleOpenEditMembership(mem)}
                                        style={{
                                            flex: 1,
                                            padding: '8px 14px',
                                            fontSize: '0.82rem',
                                            borderRadius: 8,
                                            background: 'rgba(217, 119, 6, 0.12)',
                                            color: '#D97706',
                                            fontWeight: 700,
                                            border: 'none',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: 6
                                        }}
                                    >
                                        <i className="fas fa-edit" />
                                        <span>Edit Pass Design</span>
                                    </button>

                                    <button
                                        type="button"
                                        className="btn firstloop-btn-secondary"
                                        onClick={() => setSelectedMembership(mem)}
                                        style={{ padding: '8px 14px', fontSize: '0.82rem', borderRadius: 8 }}
                                    >
                                        <i className="fas fa-eye" />
                                        <span>Preview</span>
                                    </button>

                                    <button
                                        type="button"
                                        className="btn"
                                        onClick={() => handleDeleteMembershipCard(mem.id)}
                                        style={{ padding: '8px 12px', fontSize: '0.8rem', borderRadius: 8, background: 'var(--status-danger-bg)', color: 'var(--status-danger)', border: 'none' }}
                                    >
                                        <i className="fas fa-trash-alt" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* REUSABLE STAMP CARD BUILDER MODAL COMPONENT */}
            <StampCardBuilderModal
                isOpen={stampBuilderOpen}
                cardData={selectedEditStampCard}
                cardDesigns={cardDesignsApi}
                merchantId={merId || merchantData?.id}
                merchantData={merchantData}
                brandName={merchantData?.bus_name || merchantData?.name || "Elite Branch"}
                brandImage={merchantData?.brand_image }
                branches={branchesData || []}
                onSave={handleSaveStampCard}
                onClose={() => setStampBuilderOpen(false)}
            />

            {/* REUSABLE MEMBERSHIP CARD BUILDER MODAL COMPONENT */}
            <MembershipCardBuilderModal
                isOpen={membershipBuilderOpen}
                cardData={selectedEditMembershipCard}
                cardDesigns={cardDesignsApi}
                onSave={handleSaveMembershipCard}
                onClose={() => setMembershipBuilderOpen(false)}
            />

            {/* REUSABLE STAMP CARD PREVIEW MODAL COMPONENT */}
            <StampCardPreviewModal
                isOpen={Boolean(selectedStampCard)}
                card={selectedStampCard}
                fallbackBrandName={merchantData?.bus_name || merchantData?.name || "Elite Branch"}
                onClose={() => setSelectedStampCard(null)}
            />

            {/* PREVIEW MEMBERSHIP MODAL */}
            {selectedMembership && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(15, 23, 42, 0.75)',
                        backdropFilter: 'blur(6px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 9999,
                        padding: 20
                    }}
                >
                    <div style={{ background: '#FFFFFF', borderRadius: 20, maxWidth: 440, width: '100%', padding: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.3)', position: 'relative' }}>
                        <button
                            type="button"
                            onClick={() => setSelectedMembership(null)}
                            style={{ position: 'absolute', right: 16, top: 16, background: 'none', border: 'none', fontSize: '1.2rem', color: 'var(--text-muted)', cursor: 'pointer' }}
                        >
                            &times;
                        </button>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 16 }}>Membership Pass Preview</h3>

                        <div
                            style={{
                                width: '100%',
                                borderRadius: 20,
                                ...getCardStyle(selectedMembership),
                                color: selectedMembership.textColor || '#FFFFFF',
                                padding: 22,
                                boxShadow: '0 14px 30px -6px rgba(0,0,0,0.22)'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{ width: 34, height: 34, borderRadius: 10, background: '#FFFFFF', padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <img src={formatImageUrl(selectedMembership.brandLogo) || flLogo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                    </div>
                                    <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'inherit' }}>
                                        {selectedMembership.brandName || 'FirstLoop'}
                                    </span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 10 }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'inherit' }}>
                                        {selectedMembership.name}
                                    </div>

                                    <div style={{ marginTop: 12, borderTop: '1px solid rgba(255,255,255,0.25)', paddingTop: 8 }}>
                                        <small style={{ fontSize: '0.65rem', textTransform: 'uppercase', opacity: 0.85 }}>Valid Thru</small>
                                        <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'inherit' }}>
                                            {formatValidity(selectedMembership.validityMonths)}
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                                    <RealQRCode size={92} />
                                    <small style={{ fontSize: '0.6rem', fontWeight: 700, marginTop: 4, textTransform: 'uppercase', opacity: 0.9 }}>SCAN PASS</small>
                                </div>
                            </div>
                        </div>

                        {/* Share & Download Action Buttons */}
                        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                            <a
                                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Check out my ${selectedMembership.name || 'FirstLoop Membership'} Pass! Access your digital membership card here: ${window.location.href}`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn"
                                style={{
                                    flex: 1,
                                    padding: '10px 14px',
                                    borderRadius: 10,
                                    background: '#25D366',
                                    color: '#FFFFFF',
                                    fontWeight: 700,
                                    fontSize: '0.85rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 8,
                                    textDecoration: 'none',
                                    border: 'none',
                                    boxShadow: '0 4px 12px rgba(37, 211, 102, 0.25)'
                                }}
                            >
                                <i className="fab fa-whatsapp" style={{ fontSize: '1.1rem' }} />
                                <span>Share to WhatsApp</span>
                            </a>

                            <button
                                type="button"
                                onClick={() => {
                                    const fileName = (selectedMembership.name || 'membership-pass').toLowerCase().replace(/\s+/g, '-')
                                    const link = document.createElement('a')
                                    link.href = qrImg
                                    link.download = `${fileName}-pass.png`
                                    document.body.appendChild(link)
                                    link.click()
                                    document.body.removeChild(link)
                                    alert(`Downloading ${selectedMembership.name} Digital Pass...`)
                                }}
                                className="btn"
                                style={{
                                    flex: 1,
                                    padding: '10px 14px',
                                    borderRadius: 10,
                                    background: '#D97706',
                                    color: '#FFFFFF',
                                    fontWeight: 700,
                                    fontSize: '0.85rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 8,
                                    border: 'none',
                                    boxShadow: '0 4px 12px rgba(217, 119, 6, 0.25)'
                                }}
                            >
                                <i className="fas fa-download" style={{ fontSize: '0.95rem' }} />
                                <span>Download Card</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
