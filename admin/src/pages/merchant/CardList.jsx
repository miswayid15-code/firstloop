import { useState, useEffect, useMemo } from 'react'
import qrImg from '../../assets/img/qr-img.png'
import axios from 'axios'
import API from '../../api.js'
import StampCardItem from '../../components/StampCardItem.jsx'
import MembershipCardItem from '../../components/MembershipCardItem.jsx'
import StampCardBuilderModal from '../../components/StampCardBuilderModal.jsx'
import MembershipCardBuilderModal from '../../components/MembershipCardBuilderModal.jsx'
import StampCardPreviewModal from '../../components/StampCardPreviewModal.jsx'
import MembershipCardPreviewModal from '../../components/MembershipCardPreviewModal.jsx'

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
import {
    getRelativeImagePath,
    formatImageUrl,
    formatValidity
} from '../../services/cardService.js'

export default function CardList() {

    const [activeTab, setActiveTab] = useState('stamps')

    // Dynamic Lists State
    const [stampCards, setStampCards] = useState([])
    const [membershipCards, setMembershipCards] = useState([])
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
            fetchMerchant(targetId)
            fetchStampCards(targetId)
            fetchMembershipCards(targetId)

        } else {
            fetchMerchant()
            fetchStampCards()
            fetchMembershipCards()

        }
    }, [])
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
                } catch (e) { }
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

                    if (merchant.id && (!merId || String(merId) !== String(merchant.id))) {
                        setMerId(merchant.id)
                        fetchStampCards(merchant.id)
                        fetchMembershipCards(merchant.id)
                    }
                }
            }
        } catch (err) {
            console.error("Error fetching merchant:", err.response?.data || err.message)
        } finally {
            setLoading(false)
        }
    }
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

                setStampCards(formatted)
            } else {
                setStampCards([])
            }
        } catch (err) {
            console.error('Error fetching stamp cards from API:', err)
        }
    }

    const fetchMembershipCards = async (targetId) => {
        const mId = targetId || merId || initialMerId
        if (!mId) return

        try {
            const response = await API.post('firstloop/merchant/fetch-membership-card', {
                mer_id: Number(mId)
            })

            console.log('Fetch Membership Card Response:', response?.data)

            if (response?.data?.status === 1 || response?.data?.status === '1' || response?.data?.success) {
                const rawList = response.data.data || response.data.membership_cards || response.data.cards || []
                const list = Array.isArray(rawList) ? rawList : (rawList ? [rawList] : [])

                const formatted = list.map(item => ({
                    id: item.id || item._id,
                    name: item.name || item.title || 'Membership Card',
                    title: item.name || item.title || 'Membership Card',
                    cardholderName: item.cardholder_name || item.cardholderName || 'Member Pass',
                    brandName: item.brand_name || merchantData?.brand_name || merchantData?.bus_name || merchantData?.user_name || 'Merchant',
                    brandLogo: item.brand_image ? formatImageUrl(item.brand_image) : null,
                    validityMonths: item.month || item.validity_months || item.validityMonths || 12,
                    totalMonth: item.month || item.validity_months || item.validityMonths || 12,
                    tier: item.tier || 'VIP Pass',
                    status: Number(item.status) === 1 ? 'Active' : (item.status || 'Active'),
                    bgColor: item.background_color || item.bgColor || '#D97706',
                    bgImage: item.background_image ? formatImageUrl(item.background_image) : (item.bgImage ? formatImageUrl(item.bgImage) : null),
                    cardDesignId: item.card_design_id || item.cardDesignId || null,
                    textColor: item.text_color || item.textColor || '#FFFFFF',
                    borderColor: item.border_color || item.borderColor || '#F59E0B',
                    preset: item.preset || 'Custom',
                    branch_ids: Array.isArray(item.branch_ids)
                        ? item.branch_ids.map(Number)
                        : (item.branch_id ? [Number(item.branch_id)] : [])
                }))

                setMembershipCards(formatted)
            } else {
                setMembershipCards([])
            }
        } catch (err) {
            console.error('Error fetching membership cards from API:', err)
            setMembershipCards([])
        }
    }

    // Filtered lists
    const filteredStampCards = useMemo(() => {
        return stampCards.filter(sc =>
            sc.title?.toLowerCase().includes(stampSearch.toLowerCase()) ||
            (sc.reward && sc.reward.toLowerCase().includes(stampSearch.toLowerCase())) ||
            (sc.brandName && sc.brandName.toLowerCase().includes(stampSearch.toLowerCase()))
        )
    }, [stampCards, stampSearch])

    const filteredMemberships = useMemo(() => {
        return membershipCards.filter(mc =>
            (mc.name && mc.name.toLowerCase().includes(membershipSearch.toLowerCase())) ||
            (mc.title && mc.title.toLowerCase().includes(membershipSearch.toLowerCase())) ||
            (mc.tier && mc.tier.toLowerCase().includes(membershipSearch.toLowerCase())) ||
            (mc.brandName && mc.brandName.toLowerCase().includes(membershipSearch.toLowerCase()))
        )
    }, [membershipCards, membershipSearch])



    // --- STAMP CARD HANDLERS ---
    const handleOpenCreateStampCard = () => {
        setSelectedEditStampCard(null)
        setStampBuilderOpen(true)
    }

    const handleOpenEditStampCard = (card) => {
        setSelectedEditStampCard(card)
        setStampBuilderOpen(true)
    }

    const handleSaveStampCard = () => {
        fetchStampCards()
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

    const handleSaveMembershipCard = () => {
        fetchMembershipCards()
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

                    {filteredStampCards.length > 0 ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 380px))', gap: 20 }}>
                            {filteredStampCards.map((card) => (
                                <StampCardItem
                                    key={card.id}
                                    card={card}
                                    merchantName={merchantData?.bus_name || merchantData?.name || "Elite Branch"}
                                    onEdit={handleOpenEditStampCard}
                                    onPreview={setSelectedStampCard}
                                    onDelete={handleDeleteStampCard}
                                />
                            ))}
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '48px 16px', background: '#F8FAFC', borderRadius: 16, border: '1px dashed #CBD5E1' }}>
                            <div style={{ width: 54, height: 54, borderRadius: '50%', background: 'rgba(14, 136, 184, 0.1)', color: 'var(--firstloop-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: '1.4rem' }}>
                                <i className="fas fa-stamp" />
                            </div>
                            <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#1E293B', margin: '0 0 6px' }}>No Stamp Cards Found</h4>
                            <p style={{ fontSize: '0.82rem', color: '#64748B', maxWidth: 360, margin: '0 auto 16px' }}>
                                {stampSearch ? 'No cards match your search criteria. Try another keyword.' : 'You haven’t created any stamp reward cards yet. Create one to reward your regular customers.'}
                            </p>
                            {!stampSearch && (
                                <button
                                    type="button"
                                    className="btn firstloop-btn-primary"
                                    onClick={handleOpenCreateStampCard}
                                    style={{ padding: '8px 18px', borderRadius: 8, fontSize: '0.82rem', fontWeight: 700 }}
                                >
                                    + Create First Stamp Card
                                </button>
                            )}
                        </div>
                    )}
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

                    {filteredMemberships.length > 0 ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 380px))', gap: 20 }}>
                            {filteredMemberships.map((mem) => (
                                <MembershipCardItem
                                    key={mem.id}
                                    card={mem}
                                    merchantName={merchantData?.bus_name || merchantData?.name || "FirstLoop"}
                                    onEdit={handleOpenEditMembership}
                                    onPreview={setSelectedMembership}
                                    onDelete={handleDeleteMembershipCard}
                                />
                            ))}
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '48px 16px', background: '#F8FAFC', borderRadius: 16, border: '1px dashed #CBD5E1' }}>
                            <div style={{ width: 54, height: 54, borderRadius: '50%', background: 'rgba(217, 119, 6, 0.1)', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: '1.4rem' }}>
                                <i className="fas fa-crown" />
                            </div>
                            <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#1E293B', margin: '0 0 6px' }}>No Membership Cards Found</h4>
                            <p style={{ fontSize: '0.82rem', color: '#64748B', maxWidth: 360, margin: '0 auto 16px' }}>
                                {membershipSearch ? 'No cards match your search criteria. Try another keyword.' : 'You haven’t created any membership cards yet. Create VIP or tier passes to build loyalty.'}
                            </p>
                            {!membershipSearch && (
                                <button
                                    type="button"
                                    className="btn"
                                    onClick={handleOpenCreateMembership}
                                    style={{ padding: '8px 18px', borderRadius: 8, fontSize: '0.82rem', background: '#D97706', color: '#FFF', fontWeight: 700, border: 'none' }}
                                >
                                    + Create First Membership Card
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* REUSABLE STAMP CARD BUILDER MODAL COMPONENT */}
            <StampCardBuilderModal
                isOpen={stampBuilderOpen}
                cardData={selectedEditStampCard}
                cardDesigns={cardDesignsApi}
                merchantId={merId || merchantData?.id || initialMerId}
                merchantData={merchantData}
                brandName={merchantData?.bus_name || merchantData?.name || "Elite Branch"}
                brandImage={merchantData?.brand_image}
                branches={branchesData || []}
                onSave={handleSaveStampCard}
                onClose={() => setStampBuilderOpen(false)}
            />

            {/* REUSABLE MEMBERSHIP CARD BUILDER MODAL COMPONENT */}
            <MembershipCardBuilderModal
                isOpen={membershipBuilderOpen}
                cardData={selectedEditMembershipCard}
                cardDesigns={cardDesignsApi}
                merchantId={merId || merchantData?.id || initialMerId}
                merchantData={merchantData}
                brandName={merchantData?.bus_name || merchantData?.name || "Elite Branch"}
                brandImage={merchantData?.brand_image}
                branches={branchesData || []}
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

            {/* REUSABLE MEMBERSHIP CARD PREVIEW MODAL COMPONENT */}
            <MembershipCardPreviewModal
                isOpen={Boolean(selectedMembership)}
                card={selectedMembership}
                fallbackBrandName={merchantData?.bus_name || merchantData?.name || "FirstLoop"}
                onClose={() => setSelectedMembership(null)}
            />
        </div>
    )
}
