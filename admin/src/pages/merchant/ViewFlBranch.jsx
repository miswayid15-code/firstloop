import { useState, useEffect, useMemo } from 'react'
import { NavLink, useNavigate, useParams } from 'react-router-dom'
import html2canvas from 'html2canvas'
import logo from '../../assets/img/firstloop-favicon.png'
import flLogo from '../../assets/img/firstloop-favicon.png'
import qrImg from '../../assets/img/qr-img.png'
import axios from 'axios'
import API from '../../api.js'
import StampCardBuilderModal from '../../components/StampCardBuilderModal.jsx'
import MembershipCardBuilderModal from '../../components/MembershipCardBuilderModal.jsx'
import StampCardPreviewModal from '../../components/StampCardPreviewModal.jsx'
import { toast } from 'react-hot-toast'


const getRelativeImagePath = (path) => {
    if (!path || typeof path !== 'string') return ''
    let str = path.trim()
    if (str.startsWith('data:') || str.startsWith('blob:')) return str
    const uploadsMatch = str.match(/(uploads\/.*)/i)
    if (uploadsMatch && uploadsMatch[1]) {
        return uploadsMatch[1].replace(/^\/+/, '')
    }
    if (str.startsWith('http://') || str.startsWith('https://')) {
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

const formatImageUrl = (img) => {
    if (!img) return ''
    let str = String(img).trim()

    if (str.startsWith('http://') || str.startsWith('https://') || str.startsWith('data:') || str.startsWith('blob:')) {
        return str
    }

    const baseUrl = import.meta.env.VITE_API_URL || ''
    const cleanBase = baseUrl.replace(/\/+$/, '')
    const cleanImg = getRelativeImagePath(str).replace(/^\/+/, '')
    return cleanBase ? `${cleanBase}/${cleanImg}` : cleanImg
}




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
// Helper: Format validity months for pass display (e.g. 12 -> 12 Months)
const formatValidity = (val) => {
    if (!val) return '12 Months'
    const str = String(val).trim()
    if (/^\d+$/.test(str)) {
        return `${str} Month${Number(str) > 1 ? 's' : ''}`
    }
    return str
}

const DAYS_LIST = [
    { day: 1, name: 'Monday' },
    { day: 2, name: 'Tuesday' },
    { day: 3, name: 'Wednesday' },
    { day: 4, name: 'Thursday' },
    { day: 5, name: 'Friday' },
    { day: 6, name: 'Saturday' },
    { day: 7, name: 'Sunday' }
]

const formatTimingTime = (timeStr) => {
    if (!timeStr) return ''
    if (String(timeStr).includes('AM') || String(timeStr).includes('PM')) return timeStr
    const parts = String(timeStr).split(':')
    if (parts.length < 2) return timeStr
    let hrs = parseInt(parts[0], 10)
    const mins = parts[1]
    const ampm = hrs >= 12 ? 'PM' : 'AM'
    hrs = hrs % 12 || 12
    return `${hrs}:${mins} ${ampm}`
}
let merchant = {};
try {
    const rawMerchant = localStorage.getItem("merchant_data");

    if (rawMerchant && rawMerchant !== "null" && rawMerchant !== "undefined") {
        merchant = JSON.parse(rawMerchant) || {};

    }
} catch (e) {
    console.error("Error parsing merchant_data:", e);
}
// --- QR Code Component Using qr-img.png (No white container background / box shadow) ---
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

// List of Icon options for Paid rewards
const PAID_ICONS = [
    { label: 'Coffee / Drink', icon: 'fa-coffee' },
    { label: 'Gourmet Meal', icon: 'fa-utensils' },
    { label: 'Hair & Styling', icon: 'fa-cut' },
    { label: 'Spa & Care', icon: 'fa-spa' },
    { label: 'Ticket / Voucher', icon: 'fa-ticket-alt' },
    { label: 'VIP Gem', icon: 'fa-gem' },
    { label: 'Crown Pass', icon: 'fa-crown' }
]





const INITIAL_MEMBERSHIP_CARDS = [
    {
        id: 'mc-201',
        name: 'Gold Elite Membership',
        cardholderName: 'Sarah Jenkins',
        brandName: 'FirstLoop Elite',
        brandLogo: flLogo,
        validityMonths: '03/25',
        tier: 'Gold',
        bgColor: '#D97706',
        bgImage: null,
        textColor: '#FFFFFF',
        borderColor: '#F59E0B',
        preset: 'Gold Tier',
        isDefault: true,
        minSpend: '$250 / year',
        activeMembers: 128,
        perks: [
            '15% Instant Discount on All Items',
            'Priority Queue & Reserved Seating',
            'Free Birthday Gift & $10 Voucher',
            'Exclusive Double Stamp Days'
        ],
        status: 'Active'
    },
    {
        id: 'mc-202',
        name: 'Platinum Black VIP Pass',
        cardholderName: 'Alex Mercer',
        brandName: 'VIP Club',
        brandLogo: logo,
        validityMonths: '03/25',
        tier: 'Platinum',
        bgColor: '#1E293B',
        bgImage: null,
        textColor: '#FFFFFF',
        borderColor: '#64748B',
        preset: 'Midnight',
        isDefault: false,
        minSpend: '$500 / year',
        activeMembers: 64,
        perks: [
            '25% Discount on All Premium Products',
            'Dedicated Concierge & Account Assistant',
            'Complimentary Valet Parking',
            'Free Monthly Tasting Pass'
        ],
        status: 'Active'
    }
]

const MOCK_CUSTOMERS = [
    {
        id: 'cus-501',
        name: 'Sophia Reynolds',
        email: 'sophia.reynolds@example.com',
        phone: '+1 (555) 234-5678',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120',
        stampCard: 'Artisanal Coffee 8-Stamp Pass',
        stampsCollected: 7,
        stampsTotal: 8,
        membershipTier: 'Gold Elite Member',
        tierBadge: 'Gold',
        totalVisits: 24,
        lifetimeSpend: '$480.50',
        joinedDate: '2025-02-10',
        status: 'VIP',
        stampCardsCount: 2,
        membershipCardsCount: 1,
        heldStampCards: [
            {
                title: 'Artisanal Coffee 8-Stamp Pass',
                collected: 7,
                total: 8,
                reward: 'Free Gourmet Muffin or Specialty Beverage',
                usageStatus: '7 of 8 stamps collected — 1 stamp away from unlocking Free Muffin reward!'
            },
            {
                title: 'Beauty Styling 6-Stamp Card',
                collected: 4,
                total: 6,
                reward: '50% Discount on Next Styling Session',
                usageStatus: '4 of 6 stamps collected — 2 stamps remaining for 50% Off Styling reward.'
            }
        ],
        heldMemberships: [
            {
                name: 'Gold Elite Membership',
                tier: 'Gold',
                validThru: '03/25',
                expiryDate: '28 Dec 2026',
                expiryNotice: 'Going to expire on 28 Dec 2026',
                status: 'Active'
            }
        ]
    },
    {
        id: 'cus-502',
        name: 'Alexander Wright',
        email: 'alex.wright@example.com',
        phone: '+1 (555) 876-5432',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120',
        stampCard: 'Beauty Styling 6-Stamp Card',
        stampsCollected: 5,
        stampsTotal: 6,
        membershipTier: 'Platinum Black VIP Pass',
        tierBadge: 'Platinum',
        totalVisits: 38,
        lifetimeSpend: '$920.00',
        joinedDate: '2025-01-22',
        status: 'VIP',
        stampCardsCount: 1,
        membershipCardsCount: 1,
        heldStampCards: [
            {
                title: 'Beauty Styling 6-Stamp Card',
                collected: 5,
                total: 6,
                reward: '50% Discount on Next Styling Session',
                usageStatus: '5 of 6 stamps collected — 1 stamp remaining for 50% Off Styling reward.'
            }
        ],
        heldMemberships: [
            {
                name: 'Platinum Black VIP Pass',
                tier: 'Platinum',
                validThru: '03/25',
                expiryDate: '15 Nov 2026',
                expiryNotice: 'Going to expire on 15 Nov 2026',
                status: 'Active'
            }
        ]
    }
]



export default function ViewFlBranch() {
    const navigate = useNavigate()
    const { id } = useParams()

    // Dynamic Lists State
    const [stampCards, setStampCards] = useState([])
    const [membershipCards, setMembershipCards] = useState(INITIAL_MEMBERSHIP_CARDS)
    const [cardDesignsApi, setCardDesignsApi] = useState([])

    // Filters & Search state
    const [stampSearch, setStampSearch] = useState('')
    const [branch, setbranch] = useState('')
    const [membershipSearch, setMembershipSearch] = useState('')
    const [customerSearch, setCustomerSearch] = useState('')
    const [customerFilterCard, setCustomerFilterCard] = useState('all')

    // Modals state
    const [selectedStampCard, setSelectedStampCard] = useState(null)
    const [selectedMembership, setSelectedMembership] = useState(null)
    const [selectedCustomer, setSelectedCustomer] = useState(null)

    // Builder Modals State
    const [stampBuilderOpen, setStampBuilderOpen] = useState(false)
    const [selectedEditStampCard, setSelectedEditStampCard] = useState(null)

    const [membershipBuilderOpen, setMembershipBuilderOpen] = useState(false)
    const [selectedEditMembershipCard, setSelectedEditMembershipCard] = useState(null)

    // Fetch Card Designs & Branch Details from API
    useEffect(() => {
        fetchCardDesignsFromApi()
        branch_details()
        if (id) {
            fetchStampCards()
        }
    }, [id])

    // Fetch Branch Stamp Cards using fetch-br-stamp-card
    const fetchStampCards = async () => {
        if (!id) return
        try {
            const response = await API.post('firstloop/merchant/fetch-br-stamp-card', {
                branch_id: Number(id)
            })

            console.log('Fetch Branch Stamp Card Response:', response?.data)

            if (response?.data && (response.data.status === 1 || response.data.status === '1' || response.data.success)) {
                const rawList = response.data.data || response.data.stamp_cards || response.data.cards || []
                const list = Array.isArray(rawList) ? rawList : (rawList ? [rawList] : [])

                const formattedCards = list.map((item) => {
                    const totalStamps = Number(item.number_of_stamps) || 8
                    const stampLevels = Array.isArray(item.StampLevels)
                        ? item.StampLevels
                        : (Array.isArray(item.stamp_levels) ? item.stamp_levels : [])

                    return {
                        id: item.id || item._id,
                        title: item.title || 'Stamp Pass',
                        brandName: item.brand_name || branch?.name || 'Elite Branch',
                        brandLogo: item.brand_image ? getRelativeImagePath(item.brand_image) : null,
                        total_stamps: totalStamps,
                        reward: item.reward || 'Special Gift',
                        active_members: Number(item.active_members) || 0,
                        expiry: item.expiry || '2026-12-31',
                        status: Number(item.status) === 1 ? 'Active' : 'Inactive',
                        bgColor: item.background_color || '#0E88B8',
                        bgImage: item.background_image ? getRelativeImagePath(item.background_image) : null,
                        textColor: item.text_color || '#FFFFFF',
                        borderColor: item.border_color || '#00A6D6',
                        stampBgColor: item.stamp_background || 'rgba(255, 255, 255, 0.3)',
                        stampBorderColor: item.stamp_border_color || '#FFFFFF',
                        stampTextColor: item.stamp_text_color || '#FFFFFF',
                        stamp_radius: Number(item.stamp_radius ?? 50),
                        preset: 'Custom',
                        levelRewards: stampLevels.length > 0
                            ? stampLevels.map((lvl, idx) => {
                                const rType = lvl.reward_type === '2' ? 'Discount' : (lvl.reward_type === '3' ? 'Paid' : 'Free');
                                const disc = Number(lvl.discount ?? (rType === 'Discount' ? (parseInt(lvl.reward_text) || 0) : 0));
                                return {
                                    stamp: Number(lvl.stamp_number) || idx + 1,
                                    reward: lvl.reward_text || (
                                        rType === 'Discount' ? `${disc}% Discount` : (rType === 'Paid' ? 'Paid Perk' : 'Free Item')
                                    ),
                                    type: rType,
                                    discountVal: disc,
                                    discount: disc,
                                    icon: rType === 'Discount' ? 'fa-percent' : (rType === 'Paid' ? (lvl.icon || 'fa-tag') : 'fa-gift'),
                                    amt: Number(lvl.amt) || 0,
                                    category_id: lvl.category_id
                                };
                            })
                            : Array.from({ length: totalStamps }).map((_, i) => ({
                                stamp: i + 1,
                                reward: `Stamp #${i + 1}`,
                                type: 'Free',
                                discountVal: 0,
                                discount: 0,
                                icon: 'fa-gift',
                                amt: 0
                            }))
                    }
                })

                setStampCards(formattedCards)
            } else {
                setStampCards([])
            }
        } catch (err) {
            console.error('Error fetching branch stamp cards:', err)
            setStampCards([])
        }
    }

    const fetchCardDesignsFromApi = async () => {
        try {
            const adminToken = localStorage.getItem('access_token') || localStorage.getItem('admin_token')
            const role = localStorage.getItem('role') || 'firstpass'

            let response = null

            // 1. Try with Admin token if available
            if (adminToken && adminToken !== 'null' && adminToken !== 'undefined') {
                try {
                    response = await API.post('admin/card-design/list', {}, {
                        skipAuthRedirect: true,
                        headers: { Authorization: `Bearer ${adminToken}`, 'X-Role': role }
                    })
                } catch (e) { }
            }

            // 2. Try unauthenticated axios POST with X-Role header
            if (!response?.data || (response.data.status !== 1 && response.data.status !== "1")) {
                try {
                    response = await axios.post(`${import.meta.env.VITE_API_URL}/admin/card-design/list`, {}, {
                        headers: { 'X-Role': role, 'Content-Type': 'application/json' }
                    })
                } catch (e) { }
            }

            // 3. Try standard API.post
            if (!response?.data || (response.data.status !== 1 && response.data.status !== "1")) {
                try {
                    response = await API.post('admin/card-design/list', {}, { skipAuthRedirect: true })
                } catch (e) { }
            }

            // 4. Try firstloop merchant route
            if (!response?.data || (response.data.status !== 1 && response.data.status !== "1")) {
                try {
                    response = await API.post('firstloop/merchant/card-design/list', {}, { skipAuthRedirect: true })
                } catch (e) { }
            }

            console.log('Card Designs API Response:', response?.data)

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

            setCardDesignsApi(DEFAULT_CARD_DESIGNS)
        } catch (err) {
            console.error('Error fetching card designs from API:', err)
            setCardDesignsApi(DEFAULT_CARD_DESIGNS)
        }
    }
    const branch_details = async () => {
        if (!id) return;
        try {
            let response = await API.post(`firstloop/branch_details/${id}`);
            if (!response?.data || (response.data.status !== 1 && response.data.status !== '1')) {
                response = await API.post(`firstloop/merchant/branch_details/${id}`);
            }

            if (response?.data?.status === 1 || response?.data?.status === '1') {
                setbranch(response.data.data);
            } else {
                toast.error(
                    response?.data?.message ||
                    "Failed to fetch branch details"
                );
            }

        } catch (err) {
            console.error(
                "Branch Details Error:",
                err.response?.data || err
            );
            try {
                const fallbackRes = await API.post(`firstloop/merchant/branch_details/${id}`);
                if (fallbackRes?.data?.status === 1 || fallbackRes?.data?.status === '1') {
                    setbranch(fallbackRes.data.data);
                    return;
                }
            } catch (e) { }

            toast.error(
                err.response?.data?.message ||
                "Failed to fetch branch details"
            );
        }
    };

    // Handler: Open Stamp Card Builder for Creation
    const handleOpenCreateStampCard = () => {
        setSelectedEditStampCard(null)
        setStampBuilderOpen(true)
    }

    // Handler: Open Stamp Card Builder for Editing
    const handleOpenEditStampCard = (card) => {
        setSelectedEditStampCard(card)
        setStampBuilderOpen(true)
    }

    // Save Stamp Card
    const handleSaveStampCard = (savedForm) => {
        fetchStampCards()
        setStampBuilderOpen(false)
    }

    // Filtered lists
    const filteredStampCards = useMemo(() => {
        return stampCards.filter(sc =>
            (sc.title && sc.title.toLowerCase().includes(stampSearch.toLowerCase())) ||
            (sc.reward && sc.reward.toLowerCase().includes(stampSearch.toLowerCase()))
        )
    }, [stampCards, stampSearch])

    const filteredMemberships = useMemo(() => {
        return membershipCards.filter(mc =>
            mc.name.toLowerCase().includes(membershipSearch.toLowerCase()) ||
            (mc.tier && mc.tier.toLowerCase().includes(membershipSearch.toLowerCase()))
        )
    }, [membershipCards, membershipSearch])

    const filteredCustomers = useMemo(() => {
        return MOCK_CUSTOMERS.filter(c => {
            const matchesSearch =
                c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
                c.email.toLowerCase().includes(customerSearch.toLowerCase()) ||
                c.phone.includes(customerSearch)

            const matchesCard =
                customerFilterCard === 'all' ||
                (customerFilterCard === 'stamps' && c.stampCard) ||
                (customerFilterCard === 'membership' && c.membershipTier)

            return matchesSearch && matchesCard
        })
    }, [customerSearch, customerFilterCard])

    // Handler: Open Membership Builder for Creation
    const handleOpenCreateMembership = () => {
        setSelectedEditMembershipCard(null)
        setMembershipBuilderOpen(true)
    }

    // Handler: Open Membership Builder for Editing
    const handleOpenEditMembership = (mem) => {
        setSelectedEditMembershipCard(mem)
        setMembershipBuilderOpen(true)
    }

    // Save Membership Card
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

    // Helper: Compute Card Background & Border Style
    const getCardStyle = (card) => {
        const style = {
            border: `2px solid ${card.borderColor || 'rgba(255,255,255,0.4)'}`
        }
        if (card.bgImage) {
            const fullImg = formatImageUrl(card.bgImage)
            style.backgroundImage = `url(${fullImg})`
            style.backgroundSize = 'cover'
            style.backgroundPosition = 'center'
            style.backgroundRepeat = 'no-repeat'
        } else {
            style.backgroundColor = card.bgColor || '#0E88B8'
        }
        return style
    }

    return (
        <div style={{ paddingBottom: 40 }}>
            {/* Header & Breadcrumbs */}
            <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 500, marginBottom: 8 }}>


                    <NavLink to={`/merchant/branches`} style={{ color: 'var(--firstloop-primary)' }}>
                        {merchant.user_name}
                    </NavLink>
                    <i className="fas fa-chevron-right" style={{ fontSize: '0.7rem' }} />
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{branch.name}</span>
                </div>

                <div className="flex-between" style={{ gap: 20, flexWrap: 'wrap' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                                {branch.name}
                            </h2>

                        </div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 6 }}>
                            Overview & Visual Details for Stamp Cards, Membership Tiers, and QR-Image Passes.
                        </p>
                    </div>

                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => navigate(-1)}
                        >
                            <i className="fas fa-arrow-left" />
                            {' '}Back
                        </button>
                    </div>
                </div>
            </div>

            {/* Basic Branch Details Card */}
            <div className="card card-glass firstloop-card" style={{ marginBottom: 28, padding: 15 }}>
                <div className="merchant-profile-info" style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                        <div
                            className="cell-avatar"
                            style={{
                                width: 84,
                                height: 84,
                                borderRadius: 20,
                                border: '3px solid var(--firstloop-primary)',
                                boxShadow: '0 8px 24px rgba(14, 136, 184, 0.2)',
                                overflow: 'hidden',
                                background: '#FFFFFF',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >

                            {branch.profile_image_status == 1 ?
                                <img src={branch.profile_image} alt="FirstLoop" style={{ width: 56, height: 56, objectFit: 'contain' }} />
                                :
                                <img src={branch.profile_image_status} alt="FirstLoop" style={{ width: 56, height: 56, objectFit: 'contain' }} />
                            }
                        </div>
                        <span
                            style={{
                                position: 'absolute',
                                bottom: -6,
                                right: -6,
                                background: 'var(--status-success)',
                                color: '#FFF',
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                padding: '3px 8px',
                                borderRadius: 12,
                                boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                            }}
                        >
                            ACTIVE
                        </span>
                    </div>

                    <div className="cell-info" style={{ flex: 1, minWidth: 280 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                            <div>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                                    {branch.name}
                                </h3>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                                    <i className="fas fa-store" style={{ color: 'var(--firstloop-primary)', marginRight: 6 }} />
                                    {merchant.user_name}
                                </p>
                            </div>
                        </div>

                        {/* Contact & Address Grid */}
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                                gap: '14px',
                                marginTop: 18,
                                paddingTop: 16,
                                borderTop: '1px solid rgba(14, 136, 184, 0.1)'
                            }}
                        >
                            <div>
                                <small className="merchant-sub-label">
                                    Email Address
                                </small>
                                <p
                                    className="merchant-subtext"
                                    style={{ fontWeight: 600 }}
                                >
                                    {branch?.email || "-"}
                                </p>
                            </div>

                            <div>
                                <small className="merchant-sub-label">
                                    Phone Number
                                </small>
                                <p
                                    className="merchant-subtext"
                                    style={{ fontWeight: 600 }}
                                >
                                    {branch?.country_code || branch?.phone
                                        ? `${branch?.country_code || ""} ${branch?.phone || ""}`.trim()
                                        : "-"}
                                </p>
                            </div>

                            <div>
                                <small className="merchant-sub-label">Address</small>
                                <p className="merchant-subtext">{branch.address}</p>
                            </div>

                            {/* Assigned Receptionists */}
                            <div >
                                <small className="merchant-sub-label" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                                    <i className="fas fa-user-shield" style={{ color: 'var(--firstloop-primary)' }} />
                                    Assigned Receptionists
                                </small>
                                {(() => {
                                    const receptionistsList = branch?.Receptionists || branch?.receptionists || (branch?.receptionist ? [branch.receptionist] : []);
                                    if (receptionistsList.length === 0) {
                                        return (
                                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 8, background: '#F1F5F9', color: '#64748B', fontSize: '0.82rem', fontWeight: 600 }}>
                                                <i className="fas fa-user-slash" style={{ fontSize: '0.75rem' }} />
                                                <span>No Receptionist Assigned</span>
                                            </div>
                                        );
                                    }
                                    return (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                                            {receptionistsList.map((rec, idx) => (
                                                <div
                                                    key={rec.id || idx}
                                                    style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: 10,
                                                        padding: '8px 14px',
                                                        borderRadius: 10,
                                                        background: 'var(--firstloop-primary-light, #E6F2FA)',
                                                        border: '1px solid rgba(14, 136, 184, 0.2)'
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            width: 32,
                                                            height: 32,
                                                            borderRadius: '50%',
                                                            background: 'var(--firstloop-primary, #0E88B8)',
                                                            color: '#FFFFFF',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            fontSize: '0.82rem',
                                                            fontWeight: 700,
                                                            flexShrink: 0
                                                        }}
                                                    >
                                                        <i className="fas fa-user" />
                                                    </div>
                                                    <div>
                                                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                                            {rec.name || rec.user_name || 'Receptionist'}
                                                        </div>
                                                        {(rec.phone || rec.email) && (
                                                            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                                                                {rec.phone || rec.email}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })()}
                            </div>


                            {/* Branch Operating Hours / Timings */}
                            <div style={{ gridColumn: '1 / -1', marginTop: 14 }}>
                                <small className="merchant-sub-label" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                                    <i className="far fa-clock" style={{ color: 'var(--firstloop-primary)' }} />
                                    Branch Operating Hours & Weekly Timings
                                </small>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
                                    {DAYS_LIST.map(({ day, name }) => {
                                        const timing = (branch?.BranchTimings || branch?.timings || []).find(t => Number(t.day) === day);
                                        const isClosed = timing ? Boolean(timing.is_closed) : false;
                                        const open = timing?.open_time ? formatTimingTime(timing.open_time) : '';
                                        const close = timing?.close_time ? formatTimingTime(timing.close_time) : '';

                                        return (
                                            <div
                                                key={day}
                                                style={{
                                                    padding: '8px 12px',
                                                    borderRadius: 10,
                                                    background: isClosed ? '#F8FAFC' : 'var(--firstloop-primary-light, #E6F2FA)',
                                                    border: isClosed ? '1px solid #E2E8F0' : '1px solid rgba(14, 136, 184, 0.2)',
                                                    transition: 'all 0.2s ease'
                                                }}
                                            >
                                                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: isClosed ? '#64748B' : 'var(--firstloop-primary, #0E88B8)' }}>
                                                    {name}
                                                </div>
                                                <div style={{ fontSize: '0.74rem', fontWeight: 600, marginTop: 3 }}>
                                                    {isClosed ? (
                                                        <span style={{ color: '#EF4444' }}>Closed</span>
                                                    ) : open && close ? (
                                                        <span style={{ color: '#0F172A' }}>{open} - {close}</span>
                                                    ) : (
                                                        <span style={{ color: '#94A3B8' }}>Not set</span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Metric Counter Cards */}
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                        gap: 16,
                        marginTop: 24,
                        paddingTop: 20,
                        borderTop: '1px dashed rgba(14, 136, 184, 0.18)'
                    }}
                >
                    <div style={{ padding: 14, borderRadius: 12, background: 'var(--firstloop-primary-light)', border: '1px solid rgba(14, 136, 184, 0.2)' }}>
                        <div style={{ fontSize: '0.78rem', color: 'var(--firstloop-primary)', fontWeight: 600 }}>Active Stamp Cards</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--firstloop-primary)', marginTop: 4 }}>{stampCards.length} Cards</div>
                    </div>

                    <div style={{ padding: 14, borderRadius: 12, background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                        <div style={{ fontSize: '0.78rem', color: '#D97706', fontWeight: 600 }}>Membership Tiers</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#D97706', marginTop: 4 }}>{membershipCards.length} Tiers</div>
                    </div>

                    <div style={{ padding: 14, borderRadius: 12, background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                        <div style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 600 }}>Enrolled Customers</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#059669', marginTop: 4 }}>502 Members</div>
                    </div>

                    {/* <div style={{ padding: 14, borderRadius: 12, background: 'rgba(76, 199, 232, 0.12)', border: '1px solid rgba(76, 199, 232, 0.3)' }}>
                        <div style={{ fontSize: '0.78rem', color: '#00A6D6', fontWeight: 600 }}>Stamps Issued</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#00A6D6', marginTop: 4 }}>2,794 Stamps</div>
                    </div> */}
                </div>
            </div>

            {/* STAMP CARDS SECTION - VISUAL CARD LIST VIEW */}
            <div className="card" style={{ marginBottom: 28, padding: 15 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
                    <div>
                        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)' }}>
                            <i className="fas fa-stamp" style={{ color: 'var(--firstloop-primary)' }} />
                            Stamp Cards ({filteredStampCards.length})
                        </h3>
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 4 }}>
                            Digital stamp cards featuring dynamic stamp count (max 10) and a clean QR Code image.
                        </p>
                    </div>

                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                        <div style={{ position: 'relative', width: 240 }}>
                            <i className="fas fa-search" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.8rem' }} />
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Search Stamp Cards..."
                                value={stampSearch}
                                onChange={(e) => setStampSearch(e.target.value)}
                                style={{ paddingLeft: 34, height: 38, fontSize: '0.85rem', borderRadius: 8 }}
                            />
                        </div>
                    </div>
                </div>

                {/* Stamp Cards Grid */}
                {filteredStampCards.length === 0 ? (
                    <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        <i className="fas fa-stamp" style={{ fontSize: '2rem', marginBottom: 8, opacity: 0.4 }} />
                        <p>No stamp cards found for this branch.</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 380px))', gap: 24 }}>
                        {filteredStampCards.map((card) => (
                            <div
                                key={card.id}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 12,
                                    maxWidth: 380,
                                    width: '100%'
                                }}
                            >
                                {/* DIGITAL STAMP CARD CANVAS */}
                                <div
                                    style={{
                                        width: '100%',
                                        maxWidth: 380,
                                        borderRadius: 20,
                                        ...getCardStyle(card),
                                        color: card.textColor || '#FFFFFF',
                                        padding: 15,
                                        boxShadow: '0 14px 30px -6px rgba(0,0,0,0.22)',
                                        position: 'relative',
                                        minHeight: 220
                                    }}
                                >
                                    <div style={{ position: 'relative', zIndex: 2 }}>
                                        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                                            {/* LEFT SIDE: Brand, Title & Stamp Circles */}
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                                    <div style={{ width: 26, height: 26, borderRadius: 8, background: '#FFFFFF', padding: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}>
                                                        <img src={formatImageUrl(card.brandLogo) || logo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                                    </div>
                                                    <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'inherit' }}>
                                                        {card.brandName || branch?.name || 'Elite Branch'}
                                                    </span>
                                                </div>

                                                <div style={{ fontSize: '0.78rem', opacity: 0.9, marginBottom: 10, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                                    <strong>{card.title}</strong>
                                                </div>

                                                {/* Fixed 36px Stamp Circles Grid */}
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
                                                                    borderRadius: `${card.stamp_radius ?? 50}%`,
                                                                    border: `2px solid ${card.stampBorderColor || '#FFFFFF'}`,
                                                                    background: card.stampBgColor || 'rgba(255, 255, 255, 0.3)',
                                                                    color: card.stampTextColor || 'inherit',
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

                                            {/* RIGHT SIDE: QR CODE */}
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                <img src={qrImg} alt="QR Code" style={{ width: 86, height: 86, objectFit: 'contain', flexShrink: 0 }} />
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

                                {/* Card Item Action Bar */}
                                <div style={{ display: 'flex', gap: 10, padding: '0 4px' }}>

                                    <button
                                        type="button"
                                        className="btn firstloop-btn-secondary"
                                        onClick={() => setSelectedStampCard(card)}
                                        style={{ flex: 1, padding: '8px 14px', fontSize: '0.82rem', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                                    >
                                        <i className="fas fa-eye" />
                                        <span>Preview</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* MEMBERSHIP CARDS SECTION - VISUAL PASS LIST VIEW WITH LARGE MIDDLE QR CODE */}
            <div className="card" style={{ marginBottom: 28, padding: 15 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
                    <div>
                        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)' }}>
                            <i className="fas fa-id-card" style={{ color: '#D97706' }} />
                            Membership Cards ({filteredMemberships.length})
                        </h3>
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 4 }}>
                            Digital membership passes with custom brand logo and large middle QR code layout.
                        </p>
                    </div>

                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                        <button
                            type="button"
                            className="btn"
                            onClick={handleOpenCreateMembership}
                            style={{ padding: '8px 14px', fontSize: '0.82rem', borderRadius: 8, background: '#D97706', color: '#FFFFFF', fontWeight: 700, border: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                        >
                            <i className="fas fa-plus-circle" />
                            <span>+ Create Membership Card</span>
                        </button>

                        <div style={{ position: 'relative', width: 220 }}>
                            <i className="fas fa-search" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.8rem' }} />
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Search Membership Tiers..."
                                value={membershipSearch}
                                onChange={(e) => setMembershipSearch(e.target.value)}
                                style={{ paddingLeft: 34, height: 38, fontSize: '0.85rem', borderRadius: 8 }}
                            />
                        </div>
                    </div>
                </div>

                {/* Membership Cards Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 380px))', gap: 24 }}>
                    {filteredMemberships.map((mem) => (
                        <div
                            key={mem.id}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 12,
                                maxWidth: 380,
                                width: '100%'
                            }}
                        >
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
                                    {/* Header Row */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <div style={{ width: 34, height: 34, borderRadius: 10, background: '#FFFFFF', padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}>
                                                <img src={mem.brandLogo || flLogo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                            </div>
                                            <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'inherit' }}>
                                                {mem.brandName || 'FirstLoop'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* MIDDLE: LARGE CENTERED QR CODE */}
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: '4px 0 6px' }}>
                                        <img src={qrImg} alt="QR Code" style={{ width: 92, height: 92, objectFit: 'contain', flexShrink: 0 }} />
                                        <small style={{ fontSize: '0.62rem', fontWeight: 700, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.9 }}>
                                            SCAN PASS
                                        </small>
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
                                    className="btn firstloop-btn-secondary"
                                    onClick={() => setSelectedMembership(mem)}
                                    style={{ padding: '8px 14px', fontSize: '0.82rem', borderRadius: 8 }}
                                >
                                    <i className="fas fa-eye" />
                                    <span>Preview</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ASSOCIATED CUSTOMERS TABLE SECTION */}
            <div className="card" style={{ padding: 15 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
                    <div>
                        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)' }}>
                            <i className="fas fa-users" style={{ color: '#059669' }} />
                            Associated Customers ({filteredCustomers.length})
                        </h3>
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 4 }}>
                            Directory of customers holding Stamp Cards or Membership Passes at this branch.
                        </p>
                    </div>

                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                        <select
                            className="form-control"
                            value={customerFilterCard}
                            onChange={(e) => setCustomerFilterCard(e.target.value)}
                            style={{ height: 38, fontSize: '0.85rem', borderRadius: 8, width: 170 }}
                        >
                            <option value="all">All Card Types</option>
                            <option value="stamps">Stamp Card Holders</option>
                            <option value="membership">Membership Holders</option>
                        </select>

                        <div style={{ position: 'relative', width: 220 }}>
                            <i className="fas fa-search" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.8rem' }} />
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Search customers..."
                                value={customerSearch}
                                onChange={(e) => setCustomerSearch(e.target.value)}
                                style={{ paddingLeft: 34, height: 38, fontSize: '0.85rem', borderRadius: 8 }}
                            />
                        </div>
                    </div>
                </div>

                {/* Customer Table */}
                <div className="table-responsive" style={{ border: '1px solid #E2E8F0', borderRadius: 12 }}>
                    <table className="table" style={{ margin: 0 }}>
                        <thead>
                            <tr style={{ background: '#F8FAFC' }}>
                                <th style={{ padding: '12px 16px', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>CUSTOMER</th>
                                <th style={{ padding: '12px 16px', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>CONTACT</th>
                                {/* <th style={{ padding: '12px 16px', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>ACTIVE STAMP CARD</th> */}
                                {/* <th style={{ padding: '12px 16px', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>MEMBERSHIP TIER</th> */}
                                <th style={{ padding: '12px 16px', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>VISITS & SPEND</th>
                                {/* <th style={{ padding: '12px 16px', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>STATUS</th> */}
                                <th style={{ padding: '12px 16px', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textAlign: 'right' }}>ACTION</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCustomers.length > 0 ? (
                                filteredCustomers.map((cus) => (
                                    <tr key={cus.id} style={{ verticalAlign: 'middle' }}>
                                        <td style={{ padding: '14px 16px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                <img
                                                    src={cus.avatar}
                                                    alt={cus.name}
                                                    style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }}
                                                />
                                                <div>
                                                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>{cus.name}</div>
                                                    <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Joined: {cus.joinedDate}</small>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '14px 16px', fontSize: '0.82rem' }}>
                                            <div>{cus.email}</div>
                                            <small style={{ color: 'var(--text-muted)' }}>{cus.phone}</small>
                                        </td>
                                        {/* <td style={{ padding: '14px 16px' }}>
                                            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--firstloop-primary)' }}>
                                                {cus.stampCard}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                                                <div style={{ flex: 1, background: '#E2E8F0', height: 6, borderRadius: 4, overflow: 'hidden', maxWidth: 100 }}>
                                                    <div
                                                        style={{
                                                            width: `${(cus.stampsCollected / cus.stampsTotal) * 100}%`,
                                                            background: 'var(--firstloop-gradient-primary)',
                                                            height: '100%'
                                                        }}
                                                    />
                                                </div>
                                                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                                                    {cus.stampsCollected}/{cus.stampsTotal} Stamps
                                                </span>
                                            </div>
                                        </td> */}
                                        {/* <td style={{ padding: '14px 16px' }}>
                                            <span
                                                style={{
                                                    fontSize: '0.75rem',
                                                    fontWeight: 700,
                                                    padding: '3px 10px',
                                                    borderRadius: 12,
                                                    background: cus.tierBadge === 'Platinum' ? '#1E293B' : cus.tierBadge === 'Gold' ? '#D97706' : '#64748B',
                                                    color: '#FFFFFF'
                                                }}
                                            >
                                                {cus.membershipTier}
                                            </span>
                                        </td> */}
                                        <td style={{ padding: '14px 16px', fontSize: '0.82rem' }}>
                                            <strong>{cus.totalVisits} Visits</strong>
                                            <div style={{ color: '#059669', fontWeight: 600 }}>{cus.lifetimeSpend} Spend</div>
                                        </td>
                                        {/* <td style={{ padding: '14px 16px' }}>
                                            <span className="badge active" style={{ fontSize: '0.72rem' }}>
                                                {cus.status}
                                            </span>
                                        </td> */}
                                        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                                            <button
                                                type="button"
                                                className="btn firstloop-btn-secondary"
                                                onClick={() => navigate(`/fp-customer_details/${cus.id}?branchId=${branch.id || 'br-101'}`)}
                                                style={{ padding: '6px 12px', fontSize: '0.78rem', borderRadius: 6 }}
                                            >
                                                <i className="fas fa-user-circle" style={{ marginRight: 4 }} />
                                                View Profile
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>
                                        No associated customers match your query.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* REUSABLE STAMP CARD BUILDER MODAL COMPONENT */}
            <StampCardBuilderModal
                isOpen={stampBuilderOpen}
                cardData={selectedEditStampCard}
                cardDesigns={cardDesignsApi}
                merchantId={merchant?.id || branch?.merchant_id}
                merchantData={merchant}
                brandName={branch?.name || merchant?.brand_name || merchant?.bus_name}
                brandImage={branch?.profile_image || merchant?.brand_image || merchant?.profile_image}
                branches={branch?.id ? [branch] : (id ? [{ id: Number(id), name: branch?.name || 'Current Branch' }] : [])}
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

            {/* PREVIEW MODAL 1: STAMP CARD (REUSABLE COMPONENT) */}
            <StampCardPreviewModal
                isOpen={Boolean(selectedStampCard)}
                card={selectedStampCard}
                fallbackBrandName={branch?.name || merchant?.brand_name || merchant?.bus_name || 'Elite Branch'}
                onClose={() => setSelectedStampCard(null)}
            />

            {/* PREVIEW MODAL 2: MEMBERSHIP CARD WITH LARGE MIDDLE QR CODE */}
            {selectedMembership && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(15, 23, 42, 0.7)',
                        backdropFilter: 'blur(5px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 9999,
                        padding: 20
                    }}
                >
                    <div
                        style={{
                            background: '#FFFFFF',
                            borderRadius: 24,
                            maxWidth: 440,
                            width: '100%',
                            overflow: 'hidden',
                            boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
                            animation: 'fadeIn 0.2s ease'
                        }}
                    >
                        {/* Digital Pass Canvas View */}
                        <div style={{ padding: 15, background: '#F8FAFC', display: 'flex', justifyContent: 'center' }}>
                            <div
                                style={{
                                    width: '100%',
                                    maxWidth: 370,
                                    borderRadius: 20,
                                    ...getCardStyle(selectedMembership),
                                    color: selectedMembership.textColor || '#FFFFFF',
                                    padding: 22,
                                    boxShadow: '0 16px 36px -8px rgba(0,0,0,0.25)',
                                    position: 'relative',
                                    minHeight: 210
                                }}
                            >
                                <div style={{ position: 'relative', zIndex: 2 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <div style={{ width: 34, height: 34, borderRadius: 10, background: '#FFFFFF', padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}>
                                                <img src={selectedMembership.brandLogo || flLogo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                            </div>
                                            <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'inherit' }}>
                                                {selectedMembership.brandName || 'FirstLoop'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Middle Section: Left Info + Right Large Middle QR Code */}
                                    <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 10 }}>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'inherit' }}>
                                                {selectedMembership.name}
                                            </div>
                                            <div style={{ fontSize: '0.82rem', opacity: 0.9, marginTop: 4, fontWeight: 700 }}>
                                                {selectedMembership.cardholderName || 'Sarah Jenkins'}
                                            </div>

                                            <div style={{ marginTop: 12, borderTop: '1px solid rgba(255,255,255,0.25)', paddingTop: 8 }}>
                                                <small style={{ fontSize: '0.65rem', textTransform: 'uppercase', opacity: 0.85 }}>
                                                    Valid Thru
                                                </small>
                                                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'inherit' }}>
                                                    {selectedMembership.validityMonths || '03/25'}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Large Centered Middle QR Code */}
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <img src={qrImg} alt="QR Code" style={{ width: 92, height: 92, objectFit: 'contain', flexShrink: 0 }} />
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
                        </div>

                        {/* Modal Action Bar with Share to WhatsApp & Download Card */}
                        <div style={{ padding: '16px 20px', background: '#FFFFFF', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                            <button
                                type="button"
                                className="btn"
                                onClick={() => {
                                    const text = encodeURIComponent(`Check out our Digital Membership Pass "${selectedMembership.name}" from ${branch.name}!`)
                                    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank')
                                }}
                                style={{ background: '#25D366', color: '#FFFFFF', fontWeight: 700, borderRadius: 8, padding: '9px 16px', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: 6, border: 'none' }}
                            >
                                <i className="fab fa-whatsapp" style={{ fontSize: '1.1rem' }} />
                                <span>Share to WhatsApp</span>
                            </button>

                            <button
                                type="button"
                                className="btn firstloop-btn-primary"
                                onClick={() => alert(`Downloading pass image for "${selectedMembership.name}"...`)}
                                style={{ borderRadius: 8, padding: '9px 16px', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                            >
                                <i className="fas fa-download" />
                                <span>Download Pass</span>
                            </button>

                            <button
                                type="button"
                                className="btn firstloop-btn-secondary"
                                onClick={() => setSelectedMembership(null)}
                                style={{ borderRadius: 8, padding: '9px 16px', fontSize: '0.82rem' }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* PREVIEW MODAL 3: ENHANCED CUSTOMER PROFILE MODAL (STAMP & MEMBERSHIP CARD USAGE & EXPIRY DETAILS) */}
            {selectedCustomer && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(15, 23, 42, 0.7)',
                        backdropFilter: 'blur(5px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 9999,
                        padding: 20
                    }}
                >
                    <div
                        style={{
                            background: '#FFFFFF',
                            borderRadius: 22,
                            maxWidth: 540,
                            width: '100%',
                            maxHeight: '90vh',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                            boxShadow: '0 25px 50px rgba(0,0,0,0.3)'
                        }}
                    >
                        {/* Profile Header */}
                        <div style={{ background: 'var(--firstloop-gradient-primary)', padding: '20px 24px', color: '#FFFFFF', position: 'relative' }}>
                            <button
                                type="button"
                                onClick={() => setSelectedCustomer(null)}
                                style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.2)', border: 'none', color: '#FFF', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                <i className="fas fa-times" />
                            </button>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                <img
                                    src={selectedCustomer.avatar}
                                    alt={selectedCustomer.name}
                                    style={{ width: 64, height: 64, borderRadius: '50%', border: '3px solid #FFFFFF', objectFit: 'cover' }}
                                />
                                <div>
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
                                        {selectedCustomer.name}
                                    </h3>
                                    <div style={{ fontSize: '0.82rem', opacity: 0.9, marginTop: 2 }}>{selectedCustomer.email} • {selectedCustomer.phone}</div>
                                    <span style={{ display: 'inline-block', marginTop: 6, fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: '#FFFFFF', color: 'var(--firstloop-primary)' }}>
                                        {selectedCustomer.status} CUSTOMER
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Scrollable Body */}
                        <div style={{ padding: 20, overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
                            {/* Summary Counter Stat Cards */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                                <div style={{ padding: 10, background: '#F8FAFC', borderRadius: 10, border: '1px solid #E2E8F0', textAlign: 'center' }}>
                                    <small style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>VISITS</small>
                                    <strong style={{ fontSize: '1.05rem', color: 'var(--text-primary)' }}>{selectedCustomer.totalVisits}</strong>
                                </div>
                                <div style={{ padding: 10, background: '#F8FAFC', borderRadius: 10, border: '1px solid #E2E8F0', textAlign: 'center' }}>
                                    <small style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>SPEND</small>
                                    <strong style={{ fontSize: '1.05rem', color: '#059669' }}>{selectedCustomer.lifetimeSpend}</strong>
                                </div>
                                <div style={{ padding: 10, background: 'var(--firstloop-primary-light)', borderRadius: 10, border: '1px solid rgba(14,136,184,0.2)', textAlign: 'center' }}>
                                    <small style={{ fontSize: '0.68rem', color: 'var(--firstloop-primary)', fontWeight: 700, display: 'block' }}>STAMP CARDS</small>
                                    <strong style={{ fontSize: '1.05rem', color: 'var(--firstloop-primary)' }}>{selectedCustomer.stampCardsCount || 1} Cards</strong>
                                </div>
                                <div style={{ padding: 10, background: 'rgba(245, 158, 11, 0.1)', borderRadius: 10, border: '1px solid rgba(245,158,11,0.2)', textAlign: 'center' }}>
                                    <small style={{ fontSize: '0.68rem', color: '#D97706', fontWeight: 700, display: 'block' }}>MEMBERSHIP</small>
                                    <strong style={{ fontSize: '1.05rem', color: '#D97706' }}>{selectedCustomer.membershipCardsCount || 1} Pass</strong>
                                </div>
                            </div>

                            {/* 1. STAMP CARDS HELD & USAGE PROGRESS */}
                            <div>
                                <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <i className="fas fa-stamp" style={{ color: 'var(--firstloop-primary)' }} />
                                    Active Stamp Cards ({selectedCustomer.heldStampCards?.length || 1})
                                </h4>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {(selectedCustomer.heldStampCards || [
                                        {
                                            title: selectedCustomer.stampCard,
                                            collected: selectedCustomer.stampsCollected,
                                            total: selectedCustomer.stampsTotal,
                                            reward: 'Special Gift Voucher',
                                            usageStatus: `${selectedCustomer.stampsCollected} of ${selectedCustomer.stampsTotal} stamps used — scan QR code at checkout on next visit to unlock reward!`
                                        }
                                    ]).map((sc, idx) => (
                                        <div key={idx} style={{ padding: 14, background: '#F8FAFC', borderRadius: 12, border: '1px solid #E2E8F0' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                                <strong style={{ fontSize: '0.88rem', color: 'var(--firstloop-primary)' }}>
                                                    {sc.title}
                                                </strong>
                                                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                                                    {sc.collected} / {sc.total} Stamps
                                                </span>
                                            </div>

                                            {/* Progress Bar */}
                                            <div style={{ background: '#E2E8F0', height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 10 }}>
                                                <div
                                                    style={{
                                                        width: `${(sc.collected / sc.total) * 100}%`,
                                                        background: 'var(--firstloop-gradient-primary)',
                                                        height: '100%',
                                                        borderRadius: 4
                                                    }}
                                                />
                                            </div>

                                            {/* Stamp Card Usage Info Box */}
                                            <div style={{ padding: 8, background: '#FFFFFF', borderRadius: 8, border: '1px solid #E2E8F0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                                                <i className="fas fa-info-circle" style={{ color: 'var(--firstloop-primary)', marginRight: 6 }} />
                                                <strong>Card Usage Status: </strong>{sc.usageStatus}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* 2. MEMBERSHIP CARDS HELD & EXPIRY DATE DETAILS */}
                            <div>
                                <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <i className="fas fa-id-card" style={{ color: '#D97706' }} />
                                    Membership Pass Details & Expiry
                                </h4>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {(selectedCustomer.heldMemberships || [
                                        {
                                            name: selectedCustomer.membershipTier,
                                            tier: selectedCustomer.tierBadge,
                                            validThru: '03/25',
                                            expiryDate: '28 Dec 2026',
                                            expiryNotice: 'Going to expire on 28 Dec 2026',
                                            status: 'Active'
                                        }
                                    ]).map((mc, idx) => (
                                        <div key={idx} style={{ padding: 14, background: '#FFFBEB', borderRadius: 12, border: '1px solid #FDE68A' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                                <strong style={{ fontSize: '0.9rem', color: '#B45309' }}>
                                                    {mc.name}
                                                </strong>
                                                <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: '#D97706', color: '#FFF' }}>
                                                    {mc.status || 'Active'}
                                                </span>
                                            </div>

                                            <div style={{ display: 'flex', gap: 16, fontSize: '0.8rem', color: '#92400E', marginBottom: 10 }}>
                                                <div>Valid Thru: <strong>{mc.validThru || '03/25'}</strong></div>
                                                <div>Exact Expiry: <strong>{mc.expiryDate || '28 Dec 2026'}</strong></div>
                                            </div>

                                            {/* Explicit Expiry Notification Box */}
                                            <div style={{ padding: 9, background: '#FFFFFF', borderRadius: 8, border: '1px solid #FCD34D', fontSize: '0.8rem', color: '#B45309', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <i className="fas fa-exclamation-circle" style={{ color: '#D97706', fontSize: '0.95rem' }} />
                                                <span>{mc.expiryNotice || `Going to expire on ${mc.expiryDate || '28 Dec 2026'}`}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div style={{ padding: '14px 20px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', textAlign: 'right' }}>
                            <button
                                type="button"
                                className="btn firstloop-btn-secondary"
                                onClick={() => setSelectedCustomer(null)}
                                style={{ padding: '8px 20px', borderRadius: 8, fontSize: '0.85rem' }}
                            >
                                Close Profile
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
