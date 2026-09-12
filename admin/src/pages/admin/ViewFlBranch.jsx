import { useState, useEffect, useMemo } from 'react'
import { NavLink, useNavigate, useParams ,useLocation  } from 'react-router-dom'
import html2canvas from 'html2canvas'
import logo from '../../assets/img/firstloop-favicon.png'
import flLogo from '../../assets/img/firstloop-favicon.png'
import qrImg from '../../assets/img/qr-img.png'
import API from '../../api.js'
import StampCardItem from '../../components/StampCardItem.jsx'
import MembershipCardItem from '../../components/MembershipCardItem.jsx'
import StampCardBuilderModal from '../../components/StampCardBuilderModal.jsx'
import MembershipCardBuilderModal from '../../components/MembershipCardBuilderModal.jsx'
import StampCardPreviewModal from '../../components/StampCardPreviewModal.jsx'
import MembershipCardPreviewModal from '../../components/MembershipCardPreviewModal.jsx'

import {
    getRelativeImagePath,
    formatImageUrl,
    getCardStyle,
    formatValidity,
    captureCardCanvas
} from '../../services/cardService.js'

// Helper: Download Canvas Image using html2canvas
const handleDownloadCard = async (elementId, title) => {
    const element = document.getElementById(elementId)
    if (!element) return
    try {
        const canvas = await captureCardCanvas(element)
        const image = canvas.toDataURL('image/png')
        const link = document.createElement('a')
        link.href = image
        link.download = `${(title || 'Stamp-Card').replace(/\s+/g, '_')}.png`
        link.click()
    } catch (error) {
        console.error('Error downloading card:', error)
    }
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

export default function ViewFlBranch() {
    const navigate = useNavigate()
    const location = useLocation()
    const { id } = useParams()

    const isMerchantMode = location.pathname.startsWith('/merchant') || window.location.pathname.startsWith('/merchant')
    const isReceptionistMode = location.pathname.startsWith('/receptionist') || window.location.pathname.startsWith('/receptionist')

    const [branch, setBranch] = useState(null)
    const [branchLoading, setBranchLoading] = useState(true)

    // Dynamic Lists State
    const [stampCards, setStampCards] = useState([])
    const [membershipCards, setMembershipCards] = useState([])
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
    const [selectedEditMembershipCard, setSelectedEditMembershipCard] = useState(null)
    const [addCardCustomerOpen, setAddCardCustomerOpen] = useState(false)
    const [customers, setCustomers] = useState([])
    const [customersLoading, setCustomersLoading] = useState(false)

    // Fetch Branch Details using firstloop/branch_details/:id
    const fetchBranchDetails = async () => {
        if (!id) return
        setBranchLoading(true)
        try {
            let response = await API.post(`firstloop/branch_details/${id}`)
            if (!response?.data || (response.data.status !== 1 && response.data.status !== '1')) {
                response = await API.post(`firstloop/merchant/branch_details/${id}`)
            }

            console.log('Branch Details Response:', response?.data)

            if (response?.data && (response.data.status === 1 || response.data.status === '1') && response.data.data) {
                setBranch(response.data.data)
            } else {
                setBranch(null)
            }
        } catch (err) {
            console.error('Error fetching branch details:', err)
            try {
                const fallbackRes = await API.post(`firstloop/merchant/branch_details/${id}`)
                if (fallbackRes?.data && (fallbackRes.data.status === 1 || fallbackRes.data.status === '1') && fallbackRes.data.data) {
                    setBranch(fallbackRes.data.data)
                }
            } catch (e) {}
        } finally {
            setBranchLoading(false)
        }
    }

    // Fetch Branch Customers using firstloop/customer/fetch-branch-customers
    const fetchBranchCustomers = async () => {
        if (!id) return
        setCustomersLoading(true)
        try {
            const response = await API.post('firstloop/customer/fetch-branch-customers', {
                br_id: Number(id)
            })

            console.log('Fetch Branch Customers Response:', response?.data)

            if (response?.data && (response.data.status === 1 || response.data.status === '1' || response.data.success)) {
                const list = response.data.data || response.data.customers || []
                setCustomers(Array.isArray(list) ? list : (list ? [list] : []))
            } else {
                setCustomers([])
            }
        } catch (err) {
            console.error('Error fetching branch customers:', err)
            setCustomers([])
        } finally {
            setCustomersLoading(false)
        }
    }

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

    // Fetch Card Designs & Branch Details on load
    useEffect(() => {
        fetchCardDesignsFromApi()
        if (id) {
            fetchBranchDetails()
            fetchStampCards()
            fetchMembershipCards()
            fetchBranchCustomers()
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
                        ...item,
                        id: item.id || item._id,
                        title: item.title || 'Stamp Pass',
                        brandName: item.brand_name || branch?.name || 'Elite Branch',
                        brandLogo: item.brand_image ? getRelativeImagePath(item.brand_image) : null,
                        total_stamps: totalStamps,
                        reward: item.reward || 'Special Gift',
                        active_members: Number(item.active_members) || 0,
                        month: item.month || item.validity_months || item.validityMonths || item.totalMonth || item.total_month || 12,
                        validityMonths: item.month || item.validity_months || item.validityMonths || item.totalMonth || item.total_month || 12,
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
                                    category_id: lvl.category_id,
                                    free_stamp: Number(lvl.free_stamp) === 1 ? 1 : 0,
                                    free_text: lvl.free_text || ''
                                };
                            })
                            : Array.from({ length: totalStamps }).map((_, i) => ({
                                stamp: i + 1,
                                reward: `Stamp #${i + 1}`,
                                type: 'Free',
                                discountVal: 0,
                                discount: 0,
                                icon: 'fa-gift',
                                amt: 0,
                                free_stamp: 0,
                                free_text: ''
                            })),
                        StampLevels: item.StampLevels || item.stamp_levels || []
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

    // Fetch Branch Membership Cards using fetch-br-membership-card
    const fetchMembershipCards = async () => {
        if (!id) return
        try {
            const response = await API.post('firstloop/merchant/fetch-br-membership-card', {
                branch_id: Number(id)
            })

            console.log('Fetch Branch Membership Card Response:', response?.data)

            if (response?.data && (response.data.status === 1 || response.data.status === '1' || response.data.success)) {
                const rawList = response.data.data || response.data.membership_cards || response.data.cards || []
                const list = Array.isArray(rawList) ? rawList : (rawList ? [rawList] : [])

                const formattedCards = list.map((item) => ({
                    id: item.id || item._id,
                    name: item.name || item.title || 'Membership Card',
                    title: item.name || item.title || 'Membership Card',
                    cardholderName: item.cardholder_name || item.cardholderName || 'Member Pass',
                    brandName: item.brand_name || branch?.name || 'FirstLoop',
                    brandLogo: item.brand_image ? getRelativeImagePath(item.brand_image) : null,
                    validityMonths: item.month || item.validity_months || item.validityMonths || 12,
                    totalMonth: item.month || item.validity_months || item.validityMonths || 12,
                    tier: item.tier || 'VIP Pass',
                    status: Number(item.status) === 1 ? 'Active' : (item.status || 'Active'),
                    bgColor: item.background_color || item.bgColor || '#0E88B8',
                    bgImage: item.background_image ? getRelativeImagePath(item.background_image) : (item.bgImage ? getRelativeImagePath(item.bgImage) : null),
                    textColor: item.text_color || item.textColor || '#FFFFFF',
                    borderColor: item.border_color || item.borderColor || '#00A6D6',
                    preset: 'Custom',
                    branch_ids: Array.isArray(item.branch_ids)
                        ? item.branch_ids.map(Number)
                        : (item.branch_id ? [Number(item.branch_id)] : [])
                }))

                setMembershipCards(formattedCards)
            } else {
                setMembershipCards([])
            }
        } catch (err) {
            console.error('Error fetching branch membership cards:', err)
            setMembershipCards([])
        }
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
        return (customers || []).filter(c => {
            const name = (c.name || '').toLowerCase()
            const email = (c.email || '').toLowerCase()
            const phone = String(c.phone || '')
            const search = (customerSearch || '').toLowerCase().trim()

            const matchesSearch = !search ||
                name.includes(search) ||
                email.includes(search) ||
                phone.includes(search) ||
                (Array.isArray(c.cards) && c.cards.some(card =>
                    (card.title && card.title.toLowerCase().includes(search)) ||
                    (card.card_number && card.card_number.toLowerCase().includes(search)) ||
                    (Number(card.card_type) === 1 && 'stamp card'.includes(search)) ||
                    (Number(card.card_type) === 2 && 'membership card'.includes(search))
                ))

            if (!matchesSearch) return false

            if (customerFilterCard === '1' || customerFilterCard === 'stamps') {
                return Array.isArray(c.cards) && c.cards.some(card => Number(card.card_type) === 1)
            }
            if (customerFilterCard === '2' || customerFilterCard === 'membership') {
                return Array.isArray(c.cards) && c.cards.some(card => Number(card.card_type) === 2)
            }

            return true
        })
    }, [customers, customerSearch, customerFilterCard])

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
                month: Number(savedForm.month) || 12,
                validityMonths: Number(savedForm.month) || 12,
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
                month: Number(savedForm.month) || 12,
                validityMonths: Number(savedForm.month) || 12,
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
        if (savedForm.id) {
            setMembershipCards(prev => prev.map(item => item.id === savedForm.id ? {
                ...item,
                name: savedForm.name,
                brandName: savedForm.brandName,
                brandLogo: savedForm.brandLogo || flLogo,
                tier: savedForm.tier,
                validityMonths: savedForm.validityMonths,
                joiningFee: savedForm.joiningFee,
                renewalFee: savedForm.renewalFee,
                bgColor: savedForm.bgColor,
                bgImage: savedForm.bgImage,
                cardDesignId: savedForm.cardDesignId,
                textColor: savedForm.textColor,
                borderColor: savedForm.borderColor,
                preset: savedForm.preset,
                isDefault: savedForm.isDefault,
                minSpend: savedForm.minSpend || item.minSpend,
                perks: savedForm.perks || item.perks
            } : item))
        } else {
            const newMem = {
                id: `mc-${Date.now()}`,
                name: savedForm.name,
                brandName: savedForm.brandName,
                brandLogo: savedForm.brandLogo || flLogo,
                tier: savedForm.tier,
                validityMonths: savedForm.validityMonths,
                joiningFee: savedForm.joiningFee,
                renewalFee: savedForm.renewalFee,
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



    return (
        <div style={{ paddingBottom: 40 }}>
            {/* Header & Breadcrumbs */}
            <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 500, marginBottom: 8 }}>
                    {isMerchantMode ? (
                        <>
                            <NavLink to="/merchant/branches" style={{ color: 'var(--firstloop-primary)' }}>
                                Branches
                            </NavLink>
                            <i className="fas fa-chevron-right" style={{ fontSize: '0.7rem' }} />
                            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{branch?.name || 'Branch Overview'}</span>
                        </>
                    ) : isReceptionistMode ? (
                        <>
                            <NavLink to="/receptionist/dashboard" style={{ color: 'var(--firstloop-primary)' }}>
                                Dashboard
                            </NavLink>
                            <i className="fas fa-chevron-right" style={{ fontSize: '0.7rem' }} />
                            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{branch?.name || 'Branch Overview'}</span>
                        </>
                    ) : (
                        <>
                            <NavLink to="/merchants" style={{ color: 'var(--firstloop-primary)' }}>
                                Merchants
                            </NavLink>
                            <i className="fas fa-chevron-right" style={{ fontSize: '0.7rem' }} />
                            <NavLink to={branch?.merchant_id ? `/view-merchant/${branch.merchant_id}` : '/merchants'} style={{ color: 'var(--firstloop-primary)' }}>
                                {branch?.merchant_name || 'Merchant'}
                            </NavLink>
                            <i className="fas fa-chevron-right" style={{ fontSize: '0.7rem' }} />
                            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{branch?.name || 'Branch Overview'}</span>
                        </>
                    )}
                </div>

                <div className="flex-between" style={{ gap: 20, flexWrap: 'wrap' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                                {branch?.name || 'Branch Overview'}
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
                            onClick={() => {
                                if (isMerchantMode) navigate('/merchant/branches')
                                else if (isReceptionistMode) navigate('/receptionist/dashboard')
                                else navigate(branch?.merchant_id ? `/view-merchant/${branch.merchant_id}` : -1)
                            }}
                        >
                            <i className="fas fa-arrow-left" />
                            {' '}{isMerchantMode ? 'Back to Branches' : (isReceptionistMode ? 'Back to Dashboard' : 'Back to Merchant')}
                        </button>
                    </div>
                </div>
            </div>

            {/* Basic Branch Details Card */}
            <div className="card card-glass firstloop-card" style={{ marginBottom: 28, padding: 20 }}>
                {branchLoading ? (
                    <div style={{ padding: '30px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <i className="fas fa-spinner fa-spin" style={{ fontSize: '1.5rem', marginBottom: 8, color: 'var(--firstloop-primary)' }} />
                        <p style={{ margin: 0, fontSize: '0.88rem' }}>Loading branch details...</p>
                    </div>
                ) : (
                    <>
                        <div className="merchant-profile-info" style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                            <div style={{ position: 'relative', flexShrink: 0 }}>
                                <div
                                    className="cell-avatar"
                                    style={{
                                        width: 88,
                                        height: 88,
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
                                    {branch?.profile_image ? (
                                        <img
                                            src={formatImageUrl(branch.profile_image)}
                                            alt={branch?.name || 'Branch'}
                                            style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 6 }}
                                        />
                                    ) : (
                                        <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--firstloop-primary)' }}>
                                            {branch?.name?.charAt(0) || 'B'}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div style={{ flex: 1, minWidth: 260 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                                        {branch?.name || 'Branch'}
                                    </h3>
                                    <span
                                        className={`badge ${branch?.status === 1 || branch?.status === '1' || branch?.status === undefined ? 'badge-glass-success' : 'badge-glass-danger'}`}
                                        style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: 20 }}
                                    >
                                        {branch?.status === 0 || branch?.status === '0' ? 'Inactive' : 'Active Branch'}
                                    </span>
                                </div>

                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 14 }}>
                                    {[
                                        branch?.merchant_name,
                                        branch?.email,
                                        [branch?.city, branch?.state, branch?.country].filter(Boolean).join(', ') || branch?.address
                                    ].filter(Boolean).join(' • ')}
                                </p>

                                <div
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                        gap: 14,
                                        fontSize: '0.82rem'
                                    }}
                                >
                                    <div>
                                        <small className="merchant-sub-label">Email Address</small>
                                        <p className="merchant-subtext" style={{ fontWeight: 600 }}>{branch?.email || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <small className="merchant-sub-label">Phone Number</small>
                                        <p className="merchant-subtext" style={{ fontWeight: 600 }}>
                                            {branch?.country_code ? `${branch.country_code} ` : ''}{branch?.phone || 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <small className="merchant-sub-label">Street Address</small>
                                        <p className="merchant-subtext">
                                            {branch?.address || 'N/A'}
                                            {branch?.address_line_2 ? ` (${branch.address_line_2})` : ''}
                                        </p>
                                    </div>
                                    <div>
                                        <small className="merchant-sub-label">Location / Country</small>
                                        <p className="merchant-subtext">
                                            {[branch?.city, branch?.state, branch?.country].filter(Boolean).join(', ') || 'N/A'}
                                        </p>
                                    </div>

                                    {branch?.description && (
                                        <div style={{ gridColumn: '1 / -1' }}>
                                            <small className="merchant-sub-label">Description</small>
                                            <p className="merchant-subtext" style={{ margin: '2px 0 0' }}>{branch.description}</p>
                                        </div>
                                    )}

                                    {/* Assigned Receptionists Section */}
                                    {Array.isArray(branch?.Receptionists) && branch.Receptionists.length > 0 && (
                                        <div style={{ gridColumn: '1 / -1', marginTop: 6 }}>
                                            <small className="merchant-sub-label" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                                                <i className="fas fa-user-tie" style={{ color: 'var(--firstloop-primary)' }} />
                                                Assigned Receptionists ({branch.Receptionists.length})
                                            </small>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                                {branch.Receptionists.map((rec) => (
                                                    <div
                                                        key={rec.id}
                                                        style={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: 8,
                                                            padding: '6px 12px',
                                                            borderRadius: 10,
                                                            background: 'rgba(14, 136, 184, 0.08)',
                                                            border: '1px solid rgba(14, 136, 184, 0.2)'
                                                        }}
                                                    >
                                                        <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--firstloop-primary)', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.68rem', fontWeight: 700 }}>
                                                            {rec.name ? rec.name.charAt(0).toUpperCase() : 'R'}
                                                        </div>
                                                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                                            {rec.name}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Branch Operating Hours / Timings */}
                                    {((branch?.BranchTimings && branch.BranchTimings.length > 0) || (branch?.timings && branch.timings.length > 0)) && (
                                        <div style={{ gridColumn: '1 / -1', marginTop: 10 }}>
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
                                    )}
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
                                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--firstloop-primary)', marginTop: 4 }}>
                                    {stampCards.length} Cards
                                </div>
                            </div>

                            {/* <div style={{ padding: 14, borderRadius: 12, background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                                <div style={{ fontSize: '0.78rem', color: '#D97706', fontWeight: 600 }}>Membership Tiers</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#D97706', marginTop: 4 }}>
                                    {membershipCards.length} Tiers
                                </div>
                            </div> */}

                            <div style={{ padding: 14, borderRadius: 12, background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                                <div style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 600 }}>Assigned Staff</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#059669', marginTop: 4 }}>
                                    {Array.isArray(branch?.Receptionists) ? branch.Receptionists.length : 0} Receptionists
                                </div>
                            </div>
                        </div>
                    </>
                )}
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
                            <StampCardItem
                                key={card.id}
                                card={card}
                                merchantName={branch?.name || 'Elite Branch'}
                                onPreview={setSelectedStampCard}
                            />
                        ))}
                    </div>
                )}
            </div>

          
            {/* <div className="card" style={{ marginBottom: 28, padding: 15 }}>
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
                        <div style={{ position: 'relative', width: 220 }}>
                            <i className="fas fa-search" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.8rem' }} />
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Search Passes..."
                                value={membershipSearch}
                                onChange={(e) => setMembershipSearch(e.target.value)}
                                style={{ paddingLeft: 34, height: 38, fontSize: '0.85rem', borderRadius: 8 }}
                            />
                        </div>
                    </div>
                </div>

                
                {filteredMemberships.length === 0 ? (
                    <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        <i className="fas fa-id-card" style={{ fontSize: '2rem', marginBottom: 8, opacity: 0.4 }} />
                        <p>No membership cards found for this branch.</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 380px))', gap: 24 }}>
                        {filteredMemberships.map((mem) => (
                            <MembershipCardItem
                                key={mem.id}
                                card={mem}
                                merchantName={branch?.name || 'FirstLoop'}
                                onPreview={setSelectedMembership}
                            />
                        ))}
                    </div>
                )}
            </div> */}

          
            <StampCardBuilderModal
                isOpen={stampBuilderOpen}
                cardData={selectedEditStampCard}
                cardDesigns={cardDesignsApi}
                merchantId={branch?.merchant_id}
                merchantData={branch}
                brandName={branch?.name || 'Elite Branch'}
                brandImage={branch?.profile_image}
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

            {/* PREVIEW MODAL 1: STAMP CARD */}
            <StampCardPreviewModal
                isOpen={Boolean(selectedStampCard)}
                card={selectedStampCard}
                fallbackBrandName={branch?.name || 'Elite Branch'}
                onClose={() => setSelectedStampCard(null)}
            />

            {/* PREVIEW MODAL 2: MEMBERSHIP CARD */}
            <MembershipCardPreviewModal
                isOpen={Boolean(selectedMembership)}
                card={selectedMembership}
                fallbackBrandName={branch?.name || 'FirstLoop'}
                onClose={() => setSelectedMembership(null)}
            />

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
                        <div style={{ flex: '0 0 auto' }}>
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={() => navigate(
                                    isMerchantMode
                                        ? `/merchant/add-card-customer/${branch?.id || id}`
                                        : isReceptionistMode
                                            ? `/receptionist/add-card-customer/${branch?.id || id}`
                                            : `/add-card-customer/${branch?.id || id}`
                                )}
                                style={{
                                    fontWeight: 600,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    borderRadius: 10,
                                    padding: '9px 18px',
                                    boxShadow: '0 4px 12px rgba(14, 136, 184, 0.25)'
                                }}
                            >
                                <i className="fas fa-user-plus"></i>
                                <span>Add Card to Customer</span>
                            </button>
                        </div>
                        <select
                            className="form-control"
                            value={customerFilterCard}
                            onChange={(e) => setCustomerFilterCard(e.target.value)}
                            style={{ height: 38, fontSize: '0.85rem', borderRadius: 8, width: 180 }}
                        >
                            <option value="all">All Card Types</option>
                            <option value="1">Stamp Card Holders</option>
                            <option value="2">Membership Holders</option>
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
                                <th style={{ padding: '12px 16px', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>ASSIGNED CARDS & TYPE</th>
                                <th style={{ padding: '12px 16px', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textAlign: 'right' }}>ACTION</th>
                            </tr>
                        </thead>
                        <tbody>
                            {customersLoading ? (
                                <tr>
                                    <td colSpan="4" style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-muted)' }}>
                                        <i className="fas fa-spinner fa-spin" style={{ fontSize: '1.5rem', marginBottom: 8, color: 'var(--firstloop-primary)' }} />
                                        <p style={{ margin: 0, fontSize: '0.88rem' }}>Loading associated customers...</p>
                                    </td>
                                </tr>
                            ) : filteredCustomers.length > 0 ? (
                                filteredCustomers.map((cus) => (
                                    <tr key={cus.id} style={{ verticalAlign: 'middle' }}>
                                        <td style={{ padding: '14px 16px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                {cus.profile_image ? (
                                                    <img
                                                        src={formatImageUrl(cus.profile_image)}
                                                        alt={cus.name || 'Customer'}
                                                        style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }}
                                                    />
                                                ) : (
                                                    <div style={{
                                                        width: 40,
                                                        height: 40,
                                                        borderRadius: '50%',
                                                        background: 'var(--firstloop-primary-light, #E6F2FA)',
                                                        color: 'var(--firstloop-primary, #0E88B8)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontWeight: 700,
                                                        fontSize: '0.9rem',
                                                        flexShrink: 0
                                                    }}>
                                                        {cus.name ? cus.name.charAt(0).toUpperCase() : 'C'}
                                                    </div>
                                                )}
                                                <div>
                                                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                                                        {cus.name || 'Customer'}
                                                    </div>
                                                    {cus.created_at && (
                                                        <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                                                            Joined: {new Date(cus.created_at).toLocaleDateString()}
                                                        </small>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '14px 16px', fontSize: '0.82rem' }}>
                                            <div>{cus.email || '-'}</div>
                                            <small style={{ color: 'var(--text-muted)' }}>
                                                {cus.country_code ? `+${cus.country_code} ` : ''}{cus.phone || ''}
                                            </small>
                                        </td>
                                        <td style={{ padding: '14px 16px' }}>
                                            {Array.isArray(cus.cards) && cus.cards.length > 0 ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                                    {cus.cards.map((card, cIdx) => {
                                                        const isStamp = Number(card.card_type) === 1
                                                        const isMembership = Number(card.card_type) === 2
                                                        return (
                                                            <div
                                                                key={card.id || cIdx}
                                                                style={{
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'space-between',
                                                                    gap: 12,
                                                                    padding: '8px 12px',
                                                                    borderRadius: 10,
                                                                    background: isStamp ? 'rgba(14, 136, 184, 0.08)' : isMembership ? 'rgba(217, 119, 6, 0.08)' : '#F1F5F9',
                                                                    border: `1px solid ${isStamp ? 'rgba(14, 136, 184, 0.22)' : isMembership ? 'rgba(217, 119, 6, 0.22)' : '#E2E8F0'}`,
                                                                    maxWidth: 420
                                                                }}
                                                            >
                                                                <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                                        <span style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                            {card.title || (isStamp ? 'Stamp Card' : isMembership ? 'Membership Card' : 'Card')}
                                                                        </span>
                                                                        <span
                                                                            style={{
                                                                                fontSize: '0.65rem',
                                                                                fontWeight: 700,
                                                                                padding: '1px 6px',
                                                                                borderRadius: 4,
                                                                                background: isStamp ? 'var(--firstloop-primary, #0E88B8)' : isMembership ? '#D97706' : '#64748B',
                                                                                color: '#FFFFFF'
                                                                            }}
                                                                        >
                                                                            {isStamp ? 'Stamp' : isMembership ? 'VIP' : 'Card'}
                                                                        </span>
                                                                    </div>
                                                                    {card.card_number && (
                                                                        <small style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontFamily: 'monospace' }}>
                                                                            {card.card_number}
                                                                        </small>
                                                                    )}
                                                                </div>

                                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                                                                    {/* Send to WhatsApp (opens CardPreview with recipient preloaded) */}
                                                                    <button
                                                                        type="button"
                                                                        className="btn"
                                                                        title={`Send to WhatsApp (${cus.country_code ? `+${cus.country_code} ` : ''}${cus.phone || ''})`}
                                                                        onClick={() => {
                                                                            const targetUrl = `/card-preview/${card.id}?type=${card.card_type || (isStamp ? 1 : 2)}&cus_id=${cus.id}&phone=${encodeURIComponent(cus.phone || '')}&country_code=${encodeURIComponent(cus.country_code || '')}&customer_name=${encodeURIComponent(cus.name || '')}`
                                                                            window.open(targetUrl, '_blank')
                                                                        }}
                                                                        style={{
                                                                            background: '#25D366',
                                                                            color: '#FFFFFF',
                                                                            border: 'none',
                                                                            borderRadius: 6,
                                                                            padding: '4px 8px',
                                                                            fontSize: '0.72rem',
                                                                            fontWeight: 700,
                                                                            display: 'inline-flex',
                                                                            alignItems: 'center',
                                                                            gap: 4,
                                                                            cursor: 'pointer',
                                                                            boxShadow: '0 2px 5px rgba(37, 211, 102, 0.3)'
                                                                        }}
                                                                    >
                                                                        <i className="fab fa-whatsapp" style={{ fontSize: '0.82rem' }} />
                                                                        <span>Send</span>
                                                                    </button>

                                                                    {/* Preview Card Modal */}
                                                                    <button
                                                                        type="button"
                                                                        className="btn"
                                                                        title="Preview Card"
                                                                        onClick={() => {
                                                                            const cardPayload = {
                                                                                ...card,
                                                                                customer_id: cus.id,
                                                                                customerPhone: cus.phone,
                                                                                customer_phone: cus.phone,
                                                                                phone: cus.phone,
                                                                                customerCountryCode: cus.country_code,
                                                                                customer_country_code: cus.country_code,
                                                                                country_code: cus.country_code,
                                                                                cardholderName: cus.name,
                                                                                customer_name: cus.name,
                                                                                brandName: branch?.name || 'Elite Branch',
                                                                                total_stamps: Number(card.number_of_stamps) || 10,
                                                                                number_of_stamps: Number(card.number_of_stamps) || 10,
                                                                                collected: Number(card.current_stamp) || 0,
                                                                                current_stamp: Number(card.current_stamp) || 0
                                                                            }
                                                                            if (isStamp) {
                                                                                setSelectedStampCard(cardPayload)
                                                                            } else {
                                                                                setSelectedMembership(cardPayload)
                                                                            }
                                                                        }}
                                                                        style={{
                                                                            background: '#FFFFFF',
                                                                            color: '#475569',
                                                                            border: '1px solid #CBD5E1',
                                                                            borderRadius: 6,
                                                                            padding: '4px 8px',
                                                                            fontSize: '0.72rem',
                                                                            fontWeight: 600,
                                                                            display: 'inline-flex',
                                                                            alignItems: 'center',
                                                                            gap: 4,
                                                                            cursor: 'pointer'
                                                                        }}
                                                                    >
                                                                        <i className="fas fa-eye" style={{ fontSize: '0.75rem' }} />
                                                                        <span>Preview</span>
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            ) : (
                                                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>
                                                    No cards assigned
                                                </span>
                                            )}
                                        </td>
                                        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                                            <button
                                                type="button"
                                                className="btn firstloop-btn-secondary"
                                                onClick={() => navigate(
                                                    isMerchantMode
                                                        ? `/merchant/customers/${cus.id}?branchId=${branch?.id || id}&from=branch&fromBranchId=${branch?.id || id}&branchName=${encodeURIComponent(branch?.name || '')}`
                                                        : isReceptionistMode
                                                            ? `/receptionist/customers/${cus.id}?branchId=${branch?.id || id}&from=branch&fromBranchId=${branch?.id || id}&branchName=${encodeURIComponent(branch?.name || '')}`
                                                            : `/fp-customer_details/${cus.id}?branchId=${branch?.id || id}&from=branch&fromBranchId=${branch?.id || id}&branchName=${encodeURIComponent(branch?.name || '')}`,
                                                    {
                                                        state: {
                                                            fromPath: location.pathname,
                                                            fromBranchId: branch?.id || id,
                                                            fromBranchName: branch?.name
                                                        }
                                                    }
                                                )}
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
                                    <td colSpan="4" style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>
                                        No associated customers found for this branch.
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

            {/* REUSABLE MEMBERSHIP CARD BUILDER MODAL COMPONENT */}
            <MembershipCardBuilderModal
                isOpen={membershipBuilderOpen}
                cardData={selectedEditMembershipCard}
                cardDesigns={cardDesignsApi}
                onSave={handleSaveMembershipCard}
                onClose={() => setMembershipBuilderOpen(false)}
            />

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
