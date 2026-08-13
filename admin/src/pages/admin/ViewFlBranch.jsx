import { useState, useEffect, useMemo } from 'react'
import { NavLink, useNavigate, useParams } from 'react-router-dom'
import logo from '../../assets/img/firstloop-favicon.png'
import flLogo from '../../assets/img/firstloop-favicon.png'
import qrImg from '../../assets/img/qr-img.png'
import API from '../../api.js'
import StampCardBuilderModal from '../../components/StampCardBuilderModal.jsx'

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

// --- Mock Data ---
const MOCK_BRANCH_DATA = {
    id: 'fl-br-101',
    merchant_id: 'm-204',
    merchant_name: 'Urban Brew & Glow Outlets',
    name: 'FirstLoop Flagship Hub - Downtown',
    email: 'downtown.fl@dealora.com',
    phone: '+1 (555) 382-9102',
    address: '450 Grand Avenue, Suite 120',
    city: 'San Francisco',
    state: 'California',
    country: 'United States',
    zip_code: '94108',
    status: 1,
    visibility: 0,
    createdAt: '2025-01-15T08:30:00Z',
    profile_image: logo,
    sales_person: {
        id: 'sp-88',
        name: 'Samantha Vance',
        code: 'SP-SAN-88'
    },
    timings: [
        { day: 1, name: 'Monday', open_time: '08:00 AM', close_time: '08:00 PM', is_closed: false },
        { day: 2, name: 'Tuesday', open_time: '08:00 AM', close_time: '08:00 PM', is_closed: false },
        { day: 3, name: 'Wednesday', open_time: '08:00 AM', close_time: '08:00 PM', is_closed: false },
        { day: 4, name: 'Thursday', open_time: '08:00 AM', close_time: '08:00 PM', is_closed: false },
        { day: 5, name: 'Friday', open_time: '08:00 AM', close_time: '10:00 PM', is_closed: false },
        { day: 6, name: 'Saturday', open_time: '09:00 AM', close_time: '10:00 PM', is_closed: false },
        { day: 7, name: 'Sunday', open_time: '10:00 AM', close_time: '06:00 PM', is_closed: false },
    ]
}

const INITIAL_STAMP_CARDS = [
    {
        id: 'sc-101',
        title: 'Artisanal Coffee 8-Stamp Pass',
        brandName: 'Elite Branch',
        tagline: 'Buy 8 Specialty Coffees, Get 1 Free Dessert!',
        total_stamps: 8,
        reward: 'Free Gourmet Muffin or Specialty Beverage',
        active_members: 142,
        expiry: '2026-12-31',
        status: 'Active',
        icon: 'fa-coffee',
        bgColor: '#EF0003',
        bgImage: null,
        textColor: '#FFFFFF',
        borderColor: '#FF3B3B',
        stampBgColor: 'rgba(255, 255, 255, 0.3)',
        stampBorderColor: '#FFFFFF',
        stampTextColor: '#FFFFFF',
        preset: 'Wave Red',
        stamps_given: 856,
        rewards_claimed: 98,
        levelRewards: Array.from({ length: 8 }).map((_, i) => ({
            stamp: i + 1,
            reward: i === 7 ? 'Free Specialty Drink & Muffin' : i === 3 ? '20% Discount' : 'Free Extra Shot',
            type: i === 3 ? 'Discount' : 'Free',
            discountVal: i === 3 ? 20 : 0,
            icon: 'fa-gift'
        }))
    },
    {
        id: 'sc-102',
        title: 'Beauty Styling 6-Stamp Card',
        brandName: 'FirstLoop Salon',
        tagline: 'Collect 6 Stamps on Hair & Facial Services',
        total_stamps: 6,
        reward: '50% Discount on Next Styling Session',
        active_members: 89,
        expiry: '2026-11-15',
        status: 'Active',
        icon: 'fa-cut',
        bgColor: '#0284C7',
        bgImage: null,
        textColor: '#FFFFFF',
        borderColor: '#00A6D6',
        stampBgColor: 'rgba(255, 255, 255, 0.3)',
        stampBorderColor: '#FFFFFF',
        stampTextColor: '#FFFFFF',
        preset: 'Aurora',
        stamps_given: 320,
        rewards_claimed: 45,
        levelRewards: Array.from({ length: 6 }).map((_, i) => ({
            stamp: i + 1,
            reward: i === 5 ? '50% Off Styling' : 'Free Treatment',
            type: i === 5 ? 'Discount' : 'Free',
            discountVal: i === 5 ? 50 : 0,
            icon: 'fa-gift'
        }))
    }
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

const QUICK_COLORS = [
    { label: 'Red', hex: '#EF0003' },
    { label: 'Orange', hex: '#F97316' },
    { label: 'Yellow', hex: '#F59E0B' },
    { label: 'Teal', hex: '#10B981' },
    { label: 'Cyan', hex: '#00A6D6' },
    { label: 'Blue', hex: '#0284C7' },
    { label: 'Purple', hex: '#8B5CF6' },
    { label: 'Dark', hex: '#1E293B' },
    { label: 'White', hex: '#FFFFFF' }
]

export default function ViewFlBranch() {
    const navigate = useNavigate()
    const { id } = useParams()

    const branch = MOCK_BRANCH_DATA

    // Dynamic Lists State
    const [stampCards, setStampCards] = useState(INITIAL_STAMP_CARDS)
    const [membershipCards, setMembershipCards] = useState(INITIAL_MEMBERSHIP_CARDS)
    const [cardDesignsApi, setCardDesignsApi] = useState([])

    // Filters & Search state
    const [stampSearch, setStampSearch] = useState('')
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
    const [membershipForm, setMembershipForm] = useState({
        id: null,
        name: '',
        cardholderName: 'Sarah Jenkins',
        brandName: 'FirstLoop',
        brandLogo: flLogo,
        validityMonths: '03/25',
        bgColor: '#D97706',
        bgImage: null,
        cardDesignId: null,
        textColor: '#FFFFFF',
        borderColor: '#F59E0B',
        preset: 'Custom',
        isDefault: false
    })

    // Fetch Card Designs from API (admin/card-design/list)
    useEffect(() => {
        const fetchCardDesignsFromApi = async () => {
            try {
                const response = await API.post('admin/card-design/list')
                if (response.data && response.data.status === 1) {
                    const activeDesigns = (response.data.data || []).filter(item => Number(item.status) === 1)
                    setCardDesignsApi(activeDesigns)
                }
            } catch (err) {
                console.error('Error fetching card designs API:', err)
            }
        }
        fetchCardDesignsFromApi()
    }, [])

    // Handler: Stamp Card Brand Logo Upload
    const handleStampLogoUpload = (e) => {
        const file = e.target.files[0]
        if (file) {
            const url = URL.createObjectURL(file)
            setStampForm(prev => ({ ...prev, brandLogo: url }))
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
        const count = Number(savedForm.total_stamps) || 8

        if (savedForm.id) {
            setStampCards(prev => prev.map(item => item.id === savedForm.id ? {
                ...item,
                title: savedForm.title,
                brandName: savedForm.brandName,
                brandLogo: savedForm.brandLogo || logo,
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
                brandLogo: savedForm.brandLogo || logo,
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

    // Handler: Open Membership Builder for Creation
    const handleOpenCreateMembership = () => {
        setMembershipForm({
            id: null,
            name: '',
            cardholderName: 'Sarah Jenkins',
            brandName: 'FirstLoop',
            brandLogo: flLogo,
            validityMonths: '03/25',
            bgColor: '#D97706',
            bgImage: cardDesignsApi.length > 0 ? cardDesignsApi[0].image : null,
            cardDesignId: cardDesignsApi.length > 0 ? cardDesignsApi[0].id : null,
            textColor: '#FFFFFF',
            borderColor: '#F59E0B',
            preset: cardDesignsApi.length > 0 ? cardDesignsApi[0].name : 'Custom',
            isDefault: false
        })
        setMembershipBuilderOpen(true)
    }

    // Handler: Open Membership Builder for Editing
    const handleOpenEditMembership = (mem) => {
        setMembershipForm({
            id: mem.id,
            name: mem.name || '',
            cardholderName: mem.cardholderName || 'Sarah Jenkins',
            brandName: mem.brandName || 'FirstLoop',
            brandLogo: mem.brandLogo || flLogo,
            validityMonths: mem.validityMonths || '03/25',
            bgColor: mem.bgColor || '#D97706',
            bgImage: mem.bgImage || null,
            cardDesignId: mem.cardDesignId || null,
            textColor: mem.textColor || '#FFFFFF',
            borderColor: mem.borderColor || '#F59E0B',
            preset: mem.preset || 'Custom',
            isDefault: mem.isDefault || false
        })
        setMembershipBuilderOpen(true)
    }

    // Handle Membership Logo File Upload
    const handleMembershipLogoUpload = (e) => {
        const file = e.target.files[0]
        if (file) {
            const previewUrl = URL.createObjectURL(file)
            setMembershipForm(prev => ({ ...prev, brandLogo: previewUrl }))
        }
    }

    // Save Membership Card
    const handleSaveMembershipCard = () => {
        if (!membershipForm.name.trim()) {
            alert('Please enter a Membership Name')
            return
        }

        if (membershipForm.id) {
            setMembershipCards(prev => prev.map(item => item.id === membershipForm.id ? {
                ...item,
                name: membershipForm.name,
                cardholderName: membershipForm.cardholderName,
                brandName: membershipForm.brandName,
                brandLogo: membershipForm.brandLogo,
                validityMonths: membershipForm.validityMonths,
                bgColor: membershipForm.bgColor,
                bgImage: membershipForm.bgImage,
                cardDesignId: membershipForm.cardDesignId,
                textColor: membershipForm.textColor,
                borderColor: membershipForm.borderColor,
                preset: membershipForm.preset,
                isDefault: membershipForm.isDefault
            } : item))
        } else {
            const newMem = {
                id: `mc-${Date.now()}`,
                name: membershipForm.name,
                cardholderName: membershipForm.cardholderName,
                brandName: membershipForm.brandName,
                brandLogo: membershipForm.brandLogo,
                validityMonths: membershipForm.validityMonths,
                tier: 'Custom VIP',
                bgColor: membershipForm.bgColor,
                bgImage: membershipForm.bgImage,
                cardDesignId: membershipForm.cardDesignId,
                textColor: membershipForm.textColor,
                borderColor: membershipForm.borderColor,
                preset: membershipForm.preset,
                isDefault: membershipForm.isDefault,
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
            style.backgroundImage = `url(${card.bgImage})`
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
                    <NavLink to="/merchants" style={{ color: 'var(--firstloop-primary)' }}>
                        Merchants
                    </NavLink>
                    <i className="fas fa-chevron-right" style={{ fontSize: '0.7rem' }} />
                    <NavLink to={`/view-merchant/${branch.merchant_id}`} style={{ color: 'var(--firstloop-primary)' }}>
                        {branch.merchant_name}
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
                            Overview & Visual Builder for Stamp Cards, Membership Tiers, and QR-Image Passes.
                        </p>
                    </div>

                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <button
                            type="button"
                            className="btn firstloop-btn-primary"
                            onClick={handleOpenCreateStampCard}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: '10px' }}
                        >
                            <i className="fas fa-plus-circle" />
                            <span>+ Add Stamp Card</span>
                        </button>

                        <button
                            type="button"
                            className="btn firstloop-btn-secondary"
                            onClick={handleOpenCreateMembership}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: '10px' }}
                        >
                            <i className="fas fa-plus-circle" />
                            <span>+ Add Membership Card</span>
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
                            <img src={flLogo} alt="FirstLoop" style={{ width: 56, height: 56, objectFit: 'contain' }} />
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
                                    {branch.merchant_name}
                                </p>
                            </div>

                            <NavLink
                                to={`/salepersons?id=${branch.sales_person.id}`}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    padding: '8px 14px',
                                    background: 'var(--firstloop-primary-light)',
                                    borderRadius: 10,
                                    color: 'var(--firstloop-primary)',
                                    fontWeight: 600,
                                    fontSize: '0.82rem',
                                    textDecoration: 'none'
                                }}
                            >
                                <i className="fas fa-user-tie" />
                                <span>Sales Person: {branch.sales_person.name} ({branch.sales_person.code})</span>
                                <i className="fas fa-external-link-alt" style={{ fontSize: '0.65rem' }} />
                            </NavLink>
                        </div>

                        {/* Contact & Address Grid */}
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                gap: '14px',
                                marginTop: 18,
                                paddingTop: 16,
                                borderTop: '1px solid rgba(14, 136, 184, 0.1)'
                            }}
                        >
                            <div>
                                <small className="merchant-sub-label">Email Address</small>
                                <p className="merchant-subtext" style={{ fontWeight: 600 }}>{branch.email}</p>
                            </div>
                            <div>
                                <small className="merchant-sub-label">Phone Number</small>
                                <p className="merchant-subtext" style={{ fontWeight: 600 }}>{branch.phone}</p>
                            </div>
                            <div>
                                <small className="merchant-sub-label">Street Address</small>
                                <p className="merchant-subtext">{branch.address}</p>
                            </div>
                            <div>
                                <small className="merchant-sub-label">Location / City</small>
                                <p className="merchant-subtext">{branch.city}, {branch.state}, {branch.country} ({branch.zip_code})</p>
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
                        <button
                            type="button"
                            className="btn firstloop-btn-primary"
                            onClick={handleOpenCreateStampCard}
                            style={{ padding: '8px 14px', fontSize: '0.82rem', borderRadius: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                        >
                            <i className="fas fa-plus-circle" />
                            <span>+ Create Stamp Card</span>
                        </button>

                        <div style={{ position: 'relative', width: 220 }}>
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
                                                    <img src={card.brandLogo || logo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                                </div>
                                                <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'inherit' }}>
                                                    {card.brandName || 'Elite Branch'}
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
                                                            iconMarkup = <span style={{ fontSize: '0.65rem', fontWeight: 800 }}>{rewardItem.discountVal || 10}%</span>
                                                        } else if (rewardItem.type === 'Paid' && rewardItem.icon) {
                                                            iconMarkup = <i className={`fas ${rewardItem.icon}`} style={{ fontSize: '0.8rem' }} />
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
                                            <RealQRCode size={86} />
                                            <small style={{ fontSize: '0.6rem', fontWeight: 700, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.9 }}>
                                                SCAN TO STAMP
                                            </small>
                                        </div>
                                    </div>

                                    {/* BOTTOM RIGHT ALIGNED POWERED BY BADGE WITH FIRSTLOOP LOGO */}
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 5, fontSize: '0.65rem', opacity: 0.9, fontWeight: 600, marginTop: 10 }}>
                                        <span>powered by</span>
                                        <img src={flLogo} alt="FirstLoop" style={{ height: 14, objectFit: 'contain' }} />
                                        <strong style={{ color: 'inherit' }}>FirstLoop</strong>
                                    </div>
                                </div>
                            </div>

                            {/* Card Item Action Bar */}
                            <div style={{ display: 'flex', gap: 10, padding: '0 4px' }}>
                                <button
                                    type="button"
                                    className="btn firstloop-btn-primary"
                                    onClick={() => handleOpenEditStampCard(card)}
                                    style={{ flex: 1, padding: '8px 14px', fontSize: '0.82rem', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                                >
                                    <i className="fas fa-edit" />
                                    <span>Edit Card Design</span>
                                </button>

                                <button
                                    type="button"
                                    className="btn firstloop-btn-secondary"
                                    onClick={() => setSelectedStampCard(card)}
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

                                    {/* Middle Section: Left Info + Right Large Middle QR Code */}
                                    <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 10 }}>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'inherit' }}>
                                                {mem.name}
                                            </div>
                                            <div style={{ fontSize: '0.82rem', opacity: 0.9, marginTop: 4, fontWeight: 700 }}>
                                                {mem.cardholderName || 'Sarah Jenkins'}
                                            </div>

                                            <div style={{ marginTop: 12, borderTop: '1px solid rgba(255,255,255,0.25)', paddingTop: 8 }}>
                                                <small style={{ fontSize: '0.65rem', textTransform: 'uppercase', opacity: 0.85 }}>
                                                    Valid Thru
                                                </small>
                                                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'inherit' }}>
                                                    {mem.validityMonths || '03/25'}
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
                                        <strong style={{ color: 'inherit' }}>FirstLoop</strong>
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
                onSave={handleSaveStampCard}
                onClose={() => setStampBuilderOpen(false)}
            />

            {/* BUILDER MODAL 2: MEMBERSHIP CARD BUILDER */}
            {membershipBuilderOpen && (
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
                    <div
                        style={{
                            background: '#FFFFFF',
                            borderRadius: 20,
                            maxWidth: 1100,
                            width: '100%',
                            maxHeight: '92vh',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)'
                        }}
                    >
                        {/* Builder Header */}
                        <div style={{ padding: '18px 28px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(217, 119, 6, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D97706', fontSize: '1.1rem' }}>
                                    <i className="fas fa-id-card" />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                                        {membershipForm.id ? 'Edit Membership Card' : 'Create Membership Card'} - FirstLoop
                                    </h3>
                                    <small style={{ color: 'var(--text-muted)' }}>
                                        Upload brand logo, set membership name, validity months, and custom colors.
                                    </small>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setMembershipBuilderOpen(false)}
                                style={{ background: 'none', border: 'none', fontSize: '1.2rem', color: 'var(--text-muted)', cursor: 'pointer' }}
                            >
                                <i className="fas fa-times" />
                            </button>
                        </div>

                        {/* Top Card Design API Picker */}
                        <div style={{ padding: '14px 28px', background: '#FFFFFF', borderBottom: '1px solid #F1F5F9' }}>
                            <small style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
                                SELECT CARD DESIGN BACKGROUND IMAGE (API: admin/card-design/list)
                            </small>
                            <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4 }}>
                                {cardDesignsApi.length > 0 && cardDesignsApi.map(design => (
                                    <div
                                        key={design.id}
                                        onClick={() => setMembershipForm(prev => ({
                                            ...prev,
                                            cardDesignId: design.id,
                                            bgImage: design.image,
                                            preset: design.name
                                        }))}
                                        style={{
                                            minWidth: 120,
                                            height: 54,
                                            borderRadius: 10,
                                            backgroundImage: `url(${design.image})`,
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center',
                                            border: membershipForm.bgImage === design.image ? '3px solid #D97706' : '2px solid #E2E8F0',
                                            cursor: 'pointer',
                                            position: 'relative',
                                            boxShadow: membershipForm.bgImage === design.image ? '0 4px 12px rgba(217, 119, 6, 0.4)' : 'none',
                                            overflow: 'hidden'
                                        }}
                                    >
                                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.65)', color: '#FFF', fontSize: '0.65rem', fontWeight: 700, padding: '2px 4px', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden', textAlign: 'center' }}>
                                            {design.name}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Modal Body Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', flex: 1, overflowY: 'auto' }}>
                            {/* LEFT PANEL: FORM CONTROLS */}
                            <div style={{ padding: 28, borderRight: '1px solid #F1F5F9', overflowY: 'auto' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                    {/* 1. Membership Details */}
                                    <div>
                                        <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                            Membership Details & Brand Logo
                                        </h4>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                            <div>
                                                <label style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: 4, display: 'block' }}>Membership Card Name</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    placeholder="Gold Elite Membership"
                                                    value={membershipForm.name}
                                                    onChange={(e) => setMembershipForm(prev => ({ ...prev, name: e.target.value }))}
                                                    style={{ height: 38, fontSize: '0.85rem' }}
                                                />
                                            </div>

                                            <div>
                                                <label style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: 4, display: 'block' }}>Cardholder Name</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    placeholder="Sarah Jenkins"
                                                    value={membershipForm.cardholderName}
                                                    onChange={(e) => setMembershipForm(prev => ({ ...prev, cardholderName: e.target.value }))}
                                                    style={{ height: 38, fontSize: '0.85rem' }}
                                                />
                                            </div>

                                            <div>
                                                <label style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: 4, display: 'block' }}>Brand Name</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    placeholder="FirstLoop"
                                                    value={membershipForm.brandName}
                                                    onChange={(e) => setMembershipForm(prev => ({ ...prev, brandName: e.target.value }))}
                                                    style={{ height: 38, fontSize: '0.85rem' }}
                                                />
                                            </div>

                                            <div>
                                                <label style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: 4, display: 'block' }}>
                                                    Upload Brand Logo
                                                </label>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleMembershipLogoUpload}
                                                    className="form-control"
                                                    style={{ height: 38, fontSize: '0.8rem' }}
                                                />
                                            </div>

                                            <div>
                                                <label style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: 4, display: 'block' }}>
                                                    Valid Thru
                                                </label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    placeholder="03/25"
                                                    value={membershipForm.validityMonths}
                                                    onChange={(e) => setMembershipForm(prev => ({ ...prev, validityMonths: e.target.value }))}
                                                    style={{ height: 38, fontSize: '0.85rem' }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* 2. Color Pickers */}
                                    <div style={{ paddingTop: 16, borderTop: '1px solid #F1F5F9' }}>
                                        <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                            Pass Colors (Solid Background, Text & Border)
                                        </h4>

                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 14 }}>
                                            <div>
                                                <label style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: 4, display: 'block' }}>
                                                    Solid Background Color
                                                </label>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <input
                                                        type="color"
                                                        value={membershipForm.bgColor.startsWith('#') ? membershipForm.bgColor : '#D97706'}
                                                        onChange={(e) => setMembershipForm(prev => ({ ...prev, bgColor: e.target.value, bgImage: null }))}
                                                        style={{ width: 40, height: 38, padding: 0, border: 'none', borderRadius: 6, cursor: 'pointer' }}
                                                    />
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        value={membershipForm.bgColor}
                                                        onChange={(e) => setMembershipForm(prev => ({ ...prev, bgColor: e.target.value, bgImage: null }))}
                                                        style={{ height: 38, fontSize: '0.82rem' }}
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: 4, display: 'block' }}>
                                                    Pass Text Color
                                                </label>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <input
                                                        type="color"
                                                        value={membershipForm.textColor.startsWith('#') ? membershipForm.textColor : '#FFFFFF'}
                                                        onChange={(e) => setMembershipForm(prev => ({ ...prev, textColor: e.target.value }))}
                                                        style={{ width: 40, height: 38, padding: 0, border: 'none', borderRadius: 6, cursor: 'pointer' }}
                                                    />
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        value={membershipForm.textColor}
                                                        onChange={(e) => setMembershipForm(prev => ({ ...prev, textColor: e.target.value }))}
                                                        style={{ height: 38, fontSize: '0.82rem' }}
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: 4, display: 'block' }}>
                                                    Pass Border Color
                                                </label>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <input
                                                        type="color"
                                                        value={membershipForm.borderColor.startsWith('#') ? membershipForm.borderColor : '#F59E0B'}
                                                        onChange={(e) => setMembershipForm(prev => ({ ...prev, borderColor: e.target.value }))}
                                                        style={{ width: 40, height: 38, padding: 0, border: 'none', borderRadius: 6, cursor: 'pointer' }}
                                                    />
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        value={membershipForm.borderColor}
                                                        onChange={(e) => setMembershipForm(prev => ({ ...prev, borderColor: e.target.value }))}
                                                        style={{ height: 38, fontSize: '0.82rem' }}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ paddingTop: 10 }}>
                                            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: '0.84rem', fontWeight: 600, cursor: 'pointer' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={membershipForm.isDefault}
                                                    onChange={(e) => setMembershipForm(prev => ({ ...prev, isDefault: e.target.checked }))}
                                                />
                                                <span>Set as default membership card</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT PANEL: LIVE MEMBERSHIP CARD PREVIEW WITH ENLARGED MIDDLE QR CODE */}
                            <div style={{ padding: 28, background: '#F8FAFC', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                <small style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 16 }}>
                                    LIVE DIGITAL PASS PREVIEW
                                </small>

                                <div
                                    style={{
                                        width: '100%',
                                        maxWidth: 340,
                                        borderRadius: 20,
                                        ...getCardStyle(membershipForm),
                                        color: membershipForm.textColor || '#FFFFFF',
                                        padding: 15,
                                        boxShadow: '0 16px 36px -8px rgba(0,0,0,0.25)',
                                        position: 'relative',
                                        transition: 'all 0.3s ease',
                                        minHeight: 220
                                    }}
                                >
                                    <div style={{ position: 'relative', zIndex: 2 }}>
                                        {/* Header Row */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <div style={{ width: 34, height: 34, borderRadius: 10, background: '#FFFFFF', padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}>
                                                    <img src={membershipForm.brandLogo || flLogo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                                </div>
                                                <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'inherit' }}>
                                                    {membershipForm.brandName || 'FirstLoop'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Middle Section: Left Info + Right Large QR Code */}
                                        <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 10 }}>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'inherit' }}>
                                                    {membershipForm.name || 'Gold Elite Membership'}
                                                </div>
                                                <div style={{ fontSize: '0.82rem', opacity: 0.9, marginTop: 4, fontWeight: 700 }}>
                                                    {membershipForm.cardholderName || 'Sarah Jenkins'}
                                                </div>

                                                <div style={{ marginTop: 12, borderTop: '1px solid rgba(255,255,255,0.25)', paddingTop: 8 }}>
                                                    <small style={{ fontSize: '0.65rem', textTransform: 'uppercase', opacity: 0.85 }}>
                                                        Valid Thru
                                                    </small>
                                                    <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'inherit' }}>
                                                        {membershipForm.validityMonths || '03/25'}
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
                                            <strong style={{ color: 'inherit' }}>FirstLoop</strong>
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
                                onClick={() => setMembershipBuilderOpen(false)}
                                style={{ padding: '9px 20px', borderRadius: 8, fontSize: '0.85rem' }}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="btn"
                                onClick={handleSaveMembershipCard}
                                style={{ padding: '9px 22px', borderRadius: 8, fontSize: '0.85rem', background: '#D97706', color: '#FFFFFF', fontWeight: 700, border: 'none' }}
                            >
                                <i className="fas fa-check" style={{ marginRight: 6 }} />
                                Save Design
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* PREVIEW MODAL 1: STAMP CARD */}
            {selectedStampCard && (
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
                            maxWidth: 460,
                            width: '100%',
                            overflow: 'hidden',
                            boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
                            animation: 'fadeIn 0.2s ease'
                        }}
                    >
                        {/* Digital Card Canvas View */}
                        <div style={{ padding: 15, background: '#F8FAFC', display: 'flex', justifyContent: 'center' }}>
                            <div
                                style={{
                                    width: '100%',
                                    maxWidth: 380,
                                    borderRadius: 20,
                                    ...getCardStyle(selectedStampCard),
                                    color: selectedStampCard.textColor || '#FFFFFF',
                                    padding: 22,
                                    boxShadow: '0 16px 36px -8px rgba(0,0,0,0.25)',
                                    position: 'relative',
                                    minHeight: 230
                                }}
                            >
                                <div style={{ position: 'relative', zIndex: 2 }}>
                                    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                                        {/* Left Side */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                                <div style={{ width: 26, height: 26, borderRadius: 8, background: '#FFFFFF', padding: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}>
                                                    <img src={selectedStampCard.brandLogo || logo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                                </div>
                                                <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'inherit' }}>
                                                    {selectedStampCard.brandName || 'Elite Branch'}
                                                </span>
                                            </div>

                                            <div style={{ fontSize: '0.78rem', opacity: 0.9, marginBottom: 12 }}>
                                                <strong>{selectedStampCard.title}</strong>
                                            </div>

                                            {/* Stamp Circles Grid */}
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 6, maxWidth: 220 }}>
                                                {Array.from({ length: Number(selectedStampCard.total_stamps || 8) }).map((_, i) => {
                                                    const rewardItem = selectedStampCard.levelRewards ? selectedStampCard.levelRewards[i] : null
                                                    let iconMarkup = i + 1

                                                    if (rewardItem) {
                                                        if (rewardItem.type === 'Free') {
                                                            iconMarkup = <i className="fas fa-gift" style={{ fontSize: '0.8rem' }} />
                                                        } else if (rewardItem.type === 'Discount') {
                                                            iconMarkup = <span style={{ fontSize: '0.65rem', fontWeight: 800 }}>{rewardItem.discountVal || 10}%</span>
                                                        } else if (rewardItem.type === 'Paid' && rewardItem.icon) {
                                                            iconMarkup = <i className={`fas ${rewardItem.icon}`} style={{ fontSize: '0.8rem' }} />
                                                        }
                                                    }

                                                    return (
                                                        <div
                                                            key={i}
                                                            style={{
                                                                width: 36,
                                                                height: 36,
                                                                borderRadius: '50%',
                                                                border: `2px solid ${selectedStampCard.stampBorderColor || '#FFFFFF'}`,
                                                                background: selectedStampCard.stampBgColor || 'rgba(255, 255, 255, 0.3)',
                                                                color: selectedStampCard.stampTextColor || 'inherit',
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
                                            <RealQRCode size={88} />
                                            <small style={{ fontSize: '0.6rem', fontWeight: 700, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.9 }}>
                                                SCAN TO STAMP
                                            </small>
                                        </div>
                                    </div>

                                    {/* BOTTOM RIGHT ALIGNED POWERED BY BADGE WITH FIRSTLOOP LOGO */}
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 5, fontSize: '0.65rem', opacity: 0.9, fontWeight: 600, marginTop: 10 }}>
                                        <span>powered by</span>
                                        <img src={flLogo} alt="FirstLoop" style={{ height: 14, objectFit: 'contain' }} />
                                        <strong style={{ color: 'inherit' }}>FirstLoop</strong>
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
                                    const text = encodeURIComponent(`Check out our Digital Stamp Card "${selectedStampCard.title}" from ${branch.name}!`)
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
                                onClick={() => alert(`Downloading card design image for "${selectedStampCard.title}"...`)}
                                style={{ borderRadius: 8, padding: '9px 16px', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                            >
                                <i className="fas fa-download" />
                                <span>Download Card</span>
                            </button>

                            <button
                                type="button"
                                className="btn firstloop-btn-secondary"
                                onClick={() => setSelectedStampCard(null)}
                                style={{ borderRadius: 8, padding: '9px 16px', fontSize: '0.82rem' }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
                                        <strong style={{ color: 'inherit' }}>FirstLoop</strong>
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
