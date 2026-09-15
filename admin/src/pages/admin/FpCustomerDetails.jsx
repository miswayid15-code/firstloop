import { useState, useMemo, useEffect } from 'react'
import { NavLink, useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { QRCodeCanvas } from 'qrcode.react'
import logo from '../../assets/img/firstloop-favicon.png'
import flLogo from '../../assets/img/firstloop-favicon.png'
import qrImg from '../../assets/img/qr-img.png'
import { getCardStyle, formatImageUrl, formatExpiryDate } from '../../services/cardService.js'
import API from '../../api.js'
import { toast } from 'react-hot-toast'
import CustomerCardHistory from '../../components/CustomerCardHistory.jsx'
import StampCardPreviewModal from '../../components/StampCardPreviewModal.jsx'
import MembershipCardPreviewModal from '../../components/MembershipCardPreviewModal.jsx'
import CardIcon from '../../components/CardIcon.jsx'

// --- QR Code Component Supporting Live Tokens or Default Static QR ---
const RealQRCode = ({ token, size = 80 }) => {
    if (token) {
        return (
            <div style={{ background: '#FFFFFF', padding: 4, borderRadius: 6, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <QRCodeCanvas value={String(token)} size={size - 8} />
            </div>
        )
    }
    return (
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
}

export default function FpCustomerDetails() {
    const navigate = useNavigate()
    const { id } = useParams()
    const [searchParams] = useSearchParams()
    const location = useLocation()

    // Determine navigation source: Branch view or general Customer list
    const fromSource = searchParams.get('from') || (location.state?.fromPath ? 'branch' : '')
    const fromBranchId = searchParams.get('fromBranchId') || (fromSource === 'branch' ? (searchParams.get('branchId') || searchParams.get('branch')) : '') || location.state?.fromBranchId || ''
    const fromBranchName = searchParams.get('branchName') || location.state?.fromBranchName || ''
    
    const isFromBranch = fromSource === 'branch' || Boolean(location.state?.fromPath && location.state.fromPath.includes('branch'))
    const isMerchant = location.pathname.startsWith('/merchant') || (location.state?.fromPath && location.state.fromPath.startsWith('/merchant'))
    const isReceptionist = location.pathname.startsWith('/receptionist') || (location.state?.fromPath && location.state.fromPath.startsWith('/receptionist'))

    const defaultBackPath = isMerchant ? '/merchant/customers' : (isReceptionist ? '/receptionist/customers' : '/customers')
    const branchBackPath = location.state?.fromPath || (fromBranchId
        ? (isMerchant ? `/merchant/view-fl-branch/${fromBranchId}` : (isReceptionist ? `/receptionist/branches/${fromBranchId}` : `/view-fl-branch/${fromBranchId}`))
        : (isMerchant ? '/merchant/branches' : '/branches'))

    const backPath = isFromBranch ? branchBackPath : defaultBackPath
    const backLabel = isFromBranch ? `Back to ${fromBranchName || 'Branch'}` : 'Back to Customers List'

    const [customer, setCustomer] = useState(null)
    const [loading, setLoading] = useState(true)
    const [branchesList, setBranchesList] = useState([])


    // Branch Filter State - Auto pre-select from URL query params if provided
    const branchFromUrl = searchParams.get('branchId') || searchParams.get('branch') || 'all'
    const [selectedBranchId, setSelectedBranchId] = useState(branchFromUrl)

    const fetchCustomers = async (branchIdToFetch = selectedBranchId) => {
        setLoading(true)
        try {
            const payload = {
                customer_id: Number(id) || id
            }
            if (branchIdToFetch && branchIdToFetch !== 'all') {
                payload.branch_id = Number(branchIdToFetch) || branchIdToFetch
                payload.br_id = Number(branchIdToFetch) || branchIdToFetch
            }

            const response = await API.post(`/firstloop/customer/get-customer-details`, payload)
            if (response?.data?.status == 1 && response?.data?.data) {
                const raw = response.data.data
                const cusInfo = raw.customer || {}

                const stampCards = (raw.stamp_card || raw.stampCards || []).map(sc => {
                    const total = Number(sc.number_of_stamps || sc.total_stamps || sc.total || 8)
                    const collected = Number(sc.current_stamp ?? sc.current_stamps ?? sc.collected ?? 0)
                    const remaining = Math.max(0, total - collected)
                    const isCompleted = Number(sc.is_completed ?? (collected >= total ? 1 : 0)) === 1
                    const usageNote = isCompleted
                        ? `All ${total} stamps collected — Card Completed!`
                        : `${collected} of ${total} stamps collected — ${remaining} stamp${remaining > 1 ? 's' : ''} remaining.`

                    const stampLevels = Array.isArray(sc.CustomerStampLevels) ? sc.CustomerStampLevels : (Array.isArray(sc.stamp_levels) ? sc.stamp_levels : [])
                    const branchTitle = sc.Branch?.name || sc.branch_name || sc.branchName || (sc.branch_id ? `Branch #${sc.branch_id}` : 'Main Branch')
                    const historyLogs = stampLevels
                        .filter(lvl => Number(lvl.status) === 1)
                        .map((lvl, idx) => {
                            const freeTextNotice = (Number(lvl.free_stamp) === 1 && lvl.free_text) ? ` Free: ${lvl.free_text}` : ''
                            return {
                                date: lvl.updated_at ? new Date(lvl.updated_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : (sc.issued_at ? new Date(sc.issued_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Logged'),
                                branch: branchTitle,
                                event: `Stamp #${lvl.stamp_number || idx + 1} Earned ${lvl.reward_text ? `(${lvl.reward_text})` : ''}${freeTextNotice}`,
                                balance: `${lvl.stamp_number || idx + 1} / ${total} Stamps`,
                                operator: 'Receptionist / Staff',
                                amt: Number(lvl.amt || 0).toFixed(2)
                            }
                        })

                    return {
                        ...sc,
                        id: sc.id,
                        branchId: String(sc.Branch?.id || sc.branch_id || sc.branchId || ''),
                        branchName: branchTitle,
                        title: sc.title || 'Stamp Card',
                        brandName: sc.brand_name || sc.brandName || 'Brand',
                        brandLogo: sc.brand_image ? formatImageUrl(sc.brand_image) : (sc.brandLogo ? formatImageUrl(sc.brandLogo) : null),
                        bgImage: sc.background_image ? formatImageUrl(sc.background_image) : (sc.bgImage ? formatImageUrl(sc.bgImage) : null),
                        bgColor: sc.background_color || sc.bgColor || '#0E88B8',
                        textColor: sc.text_color || sc.textColor || '#FFFFFF',
                        borderColor: sc.border_color || sc.borderColor || '#00A6D6',
                        stampBgColor: sc.stamp_background || sc.stampBgColor || 'rgba(255, 255, 255, 0.3)',
                        stampBorderColor: sc.stamp_border_color || sc.stampBorderColor || '#FFFFFF',
                        stampTextColor: sc.stamp_text_color || sc.stampTextColor || '#FFFFFF',
                        stamp_radius: Number(sc.stamp_radius ?? sc.stampRadius ?? 50),
                        collected,
                        total,
                        total_stamps: total,
                        number_of_stamps: total,
                        is_completed: isCompleted ? 1 : 0,
                        usageNote: sc.usageNote || usageNote,
                        cardholderName: sc.Customer?.name || cusInfo.name || 'Customer',
                        customer_name: sc.Customer?.name || cusInfo.name || 'Customer',
                        customer_id: cusInfo.id || id,
                        customerPhone: cusInfo.phone || '',
                        customerCountryCode: cusInfo.country_code || '',
                        phone: cusInfo.phone || '',
                        country_code: cusInfo.country_code || '',
                        qrImg: sc.qr_token,
                        card_number: sc.card_number,
                        CustomerStampLevels: stampLevels,
                        stamp_levels: stampLevels,
                        expires_at: sc.expires_at || sc.expiry || null,
                        expiry: sc.expires_at || sc.expiry || null,
                        history: sc.history && sc.history.length > 0 ? sc.history : historyLogs,
                        totalVisits: collected
                    }
                })

                const membershipCards = (raw.membership_card || raw.membershipCards || []).map(mc => {
                    const expiryStr = mc.expires_at ? new Date(mc.expires_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : (mc.expiryDate || 'Active')
                    const validThru = mc.month ? `${mc.month} Months` : (mc.validThru || '12 Months')
                    const branchTitle = mc.Branch?.name || mc.branch_name || mc.branchName || (mc.branch_id ? `Branch #${mc.branch_id}` : 'Main Branch')

                    return {
                        ...mc,
                        id: mc.id,
                        branchId: String(mc.Branch?.id || mc.branch_id || mc.branchId || ''),
                        branchName: branchTitle,
                        name: mc.title || mc.name || 'Membership Pass',
                        title: mc.title || mc.name || 'Membership Pass',
                        cardholderName: mc.Customer?.name || cusInfo.name || 'Member',
                        customer_name: mc.Customer?.name || cusInfo.name || 'Member',
                        customer_id: cusInfo.id || id,
                        customerPhone: cusInfo.phone || '',
                        customerCountryCode: cusInfo.country_code || '',
                        phone: cusInfo.phone || '',
                        country_code: cusInfo.country_code || '',
                        brandName: mc.brand_name || 'Brand',
                        brandLogo: mc.brand_image ? formatImageUrl(mc.brand_image) : null,
                        bgImage: mc.background_image ? formatImageUrl(mc.background_image) : null,
                        bgColor: mc.background_color || '#D97706',
                        textColor: mc.text_color || '#FFFFFF',
                        borderColor: mc.border_color || '#F59E0B',
                        validThru: validThru,
                        expires_at: mc.expires_at || mc.expiry || null,
                        expiry: mc.expires_at || mc.expiry || null,
                        expiryDate: expiryStr,
                        expiryNotice: mc.expires_at ? `Expires on ${expiryStr}` : 'Active Pass',
                        tier: mc.tier || 'VIP',
                        qrImg: mc.qr_token,
                        card_number: mc.card_number,
                        status: Number(mc.status) === 1 ? 'Active' : 'Inactive',
                        history: mc.history || [],
                        totalVisits: mc.totalVisits || (Number(mc.status) === 1 ? 1 : 0)
                    }
                })

                // Extract all unique branches directly from the customer's cards
                const allRawCards = [...(raw.stamp_card || []), ...(raw.membership_card || [])]
                const extractedBranches = []
                const branchSet = new Set()

                allRawCards.forEach(c => {
                    const bId = String(c.Branch?.id || c.branch_id || c.branchId || '')
                    const bName = c.Branch?.name || c.branch_name || c.branchName || (bId ? `Branch #${bId}` : '')
                    if (bId && !branchSet.has(bId)) {
                        branchSet.add(bId)
                        extractedBranches.push({ id: bId, name: bName })
                    }
                })

                setBranchesList(prev => {
                    const branchMap = new Map()
                    if (Array.isArray(prev)) {
                        prev.forEach(b => branchMap.set(String(b.id), b.name))
                    }
                    extractedBranches.forEach(b => branchMap.set(String(b.id), b.name))
                    return Array.from(branchMap.entries()).map(([id, name]) => ({ id, name }))
                })

                const formattedCustomer = {
                    id: cusInfo.id || id,
                    name: cusInfo.name || 'Customer',
                    email: cusInfo.email || '-',
                    phone: cusInfo.phone ? `${cusInfo.country_code ? `+${cusInfo.country_code} ` : ''}${cusInfo.phone}` : '-',
                    rawPhone: cusInfo.phone || '',
                    country_code: cusInfo.country_code || '',
                    avatar: cusInfo.profile_image ? formatImageUrl(cusInfo.profile_image) : null,
                    joinedDate: cusInfo.created_at ? new Date(cusInfo.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Registered Member',
                    totalSpendAllBranches: `${Number(raw.total_spend || 0).toFixed(2)}`,
                    stampCards,
                    membershipCards
                }

                setCustomer(formattedCustomer)
                
            } else {
                toast.error(response?.data?.message || 'Customer details not found')
            }
        } catch (error) {
            console.error('Error fetching customer details:', error)
            toast.error('Error fetching customer details')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchCustomers(selectedBranchId)
    }, [id, selectedBranchId])

    useEffect(() => {
        const b = searchParams.get('branchId') || searchParams.get('branch')
        if (b) {
            setSelectedBranchId(b)
        }
    }, [searchParams])

    const handleBranchChange = (newBranchId) => {
        setSelectedBranchId(newBranchId)
    }

    // Card History & Preview Modal States
    const [historyModalCard, setHistoryModalCard] = useState(null)
    const [previewModalCard, setPreviewModalCard] = useState(null)

    // Search & Pagination States for Stamp Cards
    const [stampSearch, setStampSearch] = useState('')
    const [stampPage, setStampPage] = useState(1)
    const stampPerPage = 6

    // Search & Pagination States for Membership Passes
    const [membershipSearch, setMembershipSearch] = useState('')
    const [membershipPage, setMembershipPage] = useState(1)
    const membershipPerPage = 6

    useEffect(() => {
        setStampPage(1)
    }, [stampSearch, selectedBranchId])

    useEffect(() => {
        setMembershipPage(1)
    }, [membershipSearch, selectedBranchId])

    // Dynamic Branch Filter Options
    const branchOptions = useMemo(() => {
        const branchMap = new Map()
        branchMap.set('all', 'All Outlets / Branches')

        if (Array.isArray(branchesList)) {
            branchesList.forEach(b => {
                const bId = String(b.id || '')
                if (bId) {
                    branchMap.set(bId, b.name || `Branch #${bId}`)
                }
            })
        }

        return Array.from(branchMap.entries()).map(([id, name]) => ({ id, name }))
    }, [branchesList])

    // Filter & Search Stamp Cards
    const searchedStampCards = useMemo(() => {
        if (!customer?.stampCards) return []
        return customer.stampCards.filter(sc => {
            const matchesBranch = selectedBranchId === 'all' || String(sc.branchId) === String(selectedBranchId)
            if (!matchesBranch) return false
            if (!stampSearch.trim()) return true
            const query = stampSearch.toLowerCase().trim()
            return (
                (sc.title && sc.title.toLowerCase().includes(query)) ||
                (sc.brandName && sc.brandName.toLowerCase().includes(query)) ||
                (sc.card_number && sc.card_number.toLowerCase().includes(query)) ||
                (sc.branchName && sc.branchName.toLowerCase().includes(query))
            )
        })
    }, [customer, selectedBranchId, stampSearch])

    const totalStampPages = Math.max(1, Math.ceil(searchedStampCards.length / stampPerPage))
    const paginatedStampCards = useMemo(() => {
        const start = (stampPage - 1) * stampPerPage
        return searchedStampCards.slice(start, start + stampPerPage)
    }, [searchedStampCards, stampPage, stampPerPage])

    // Filter & Search Membership Passes
    const searchedMemberships = useMemo(() => {
        if (!customer?.membershipCards) return []
        return customer.membershipCards.filter(mc => {
            const matchesBranch = selectedBranchId === 'all' || String(mc.branchId) === String(selectedBranchId)
            if (!matchesBranch) return false
            if (!membershipSearch.trim()) return true
            const query = membershipSearch.toLowerCase().trim()
            return (
                (mc.title && mc.title.toLowerCase().includes(query)) ||
                (mc.name && mc.name.toLowerCase().includes(query)) ||
                (mc.brandName && mc.brandName.toLowerCase().includes(query)) ||
                (mc.card_number && mc.card_number.toLowerCase().includes(query)) ||
                (mc.branchName && mc.branchName.toLowerCase().includes(query))
            )
        })
    }, [customer, selectedBranchId, membershipSearch])

    const totalMembershipPages = Math.max(1, Math.ceil(searchedMemberships.length / membershipPerPage))
    const paginatedMemberships = useMemo(() => {
        const start = (membershipPage - 1) * membershipPerPage
        return searchedMemberships.slice(start, start + membershipPerPage)
    }, [searchedMemberships, membershipPage, membershipPerPage])

    if (loading) {
        return (
            <div style={{ paddingBottom: 40 }}>
                {/* Header & Breadcrumbs Skeleton */}
                <div style={{ marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <span className="skeleton-text" style={{ width: 70, height: 14 }} />
                        <span className="skeleton-text" style={{ width: 12, height: 14 }} />
                        <span className="skeleton-text" style={{ width: 90, height: 14 }} />
                        <span className="skeleton-text" style={{ width: 12, height: 14 }} />
                        <span className="skeleton-text" style={{ width: 110, height: 14 }} />
                    </div>

                    <div className="flex-between" style={{ gap: 20, flexWrap: 'wrap' }}>
                        <div>
                            <span className="skeleton-text" style={{ width: 260, height: 28, display: 'block', borderRadius: 8 }} />
                            <span className="skeleton-text" style={{ width: 340, height: 14, marginTop: 8, display: 'block' }} />
                        </div>
                        <span className="skeleton-text" style={{ width: 160, height: 40, borderRadius: 10 }} />
                    </div>
                </div>

                {/* Profile Overview Card Skeleton */}
                <div className="card card-glass firstloop-card" style={{ marginBottom: 24, padding: 20 }}>
                    <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center' }}>
                        <div className="skeleton-avatar" style={{ width: 80, height: 80, borderRadius: '50%', flexShrink: 0 }} />

                        <div style={{ flex: 1, minWidth: 260 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                                <div>
                                    <span className="skeleton-text" style={{ width: 180, height: 22, display: 'block', borderRadius: 6 }} />
                                    <span className="skeleton-text" style={{ width: 280, height: 14, marginTop: 8, display: 'block' }} />
                                </div>
                                <span className="skeleton-text" style={{ width: 140, height: 16 }} />
                            </div>

                            {/* Stat Badges Skeleton */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                                {[1, 2, 3].map((i) => (
                                    <div key={i} style={{ padding: 14, background: '#F8FAFC', borderRadius: 10, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                                        <span className="skeleton-text" style={{ width: 75, height: 10 }} />
                                        <span className="skeleton-text" style={{ width: 90, height: 22, borderRadius: 6 }} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Branch Filter Skeleton */}
                <div className="card" style={{ marginBottom: 24, padding: 18, background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div className="skeleton-avatar" style={{ width: 38, height: 38, borderRadius: 10 }} />
                            <div>
                                <span className="skeleton-text" style={{ width: 190, height: 16, display: 'block' }} />
                                <span className="skeleton-text" style={{ width: 300, height: 12, marginTop: 6, display: 'block' }} />
                            </div>
                        </div>
                        <span className="skeleton-text" style={{ height: 42, width: 320, maxWidth: '100%', borderRadius: 10 }} />
                    </div>
                </div>

                {/* 1. Stamp Cards Section Skeleton */}
                <div className="card" style={{ marginBottom: 28, padding: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, marginBottom: 22 }}>
                        <div>
                            <span className="skeleton-text" style={{ width: 220, height: 22, display: 'block', borderRadius: 6 }} />
                            <span className="skeleton-text" style={{ width: 180, height: 12, marginTop: 6, display: 'block' }} />
                        </div>
                        <span className="skeleton-text" style={{ width: 260, height: 38, borderRadius: 10 }} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 380px))', gap: 24 }}>
                        {[1, 2].map((k) => (
                            <div key={k} style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 380, width: '100%' }}>
                                {/* Branch Badge line */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span className="skeleton-text" style={{ width: 100, height: 14 }} />
                                    <span className="skeleton-text" style={{ width: 80, height: 18, borderRadius: 6 }} />
                                </div>

                                {/* Card Canvas Placeholder */}
                                <div style={{ width: '100%', height: 220, borderRadius: 20, background: 'linear-gradient(135deg, #F1F5F9 0%, #E2E8F0 100%)', padding: 18, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
                                    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                                <div className="skeleton-avatar" style={{ width: 28, height: 28, borderRadius: 8 }} />
                                                <span className="skeleton-text" style={{ width: 100, height: 16 }} />
                                            </div>
                                            <span className="skeleton-text" style={{ width: 130, height: 14, display: 'block', marginBottom: 8 }} />
                                            <span className="skeleton-text" style={{ width: 110, height: 14, display: 'block', marginBottom: 12 }} />

                                            {/* Stamps grid skeleton */}
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, maxWidth: 220 }}>
                                                {[1, 2, 3, 4, 5, 6].map((s) => (
                                                    <div key={s} className="skeleton-avatar" style={{ width: 36, height: 36, borderRadius: '50%' }} />
                                                ))}
                                            </div>
                                        </div>

                                        {/* QR Code box skeleton */}
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                                            <div className="skeleton-avatar" style={{ width: 86, height: 86, borderRadius: 12 }} />
                                            <span className="skeleton-text" style={{ width: 65, height: 10 }} />
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons Skeleton */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC', padding: '10px 14px', borderRadius: 10, border: '1px solid #E2E8F0' }}>
                                    <span className="skeleton-text" style={{ width: 120, height: 14 }} />
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <span className="skeleton-text" style={{ width: 68, height: 28, borderRadius: 8 }} />
                                        <span className="skeleton-text" style={{ width: 88, height: 28, borderRadius: 8 }} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 2. Membership Passes Section Skeleton */}
                <div className="card" style={{ padding: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, marginBottom: 22 }}>
                        <div>
                            <span className="skeleton-text" style={{ width: 240, height: 22, display: 'block', borderRadius: 6 }} />
                            <span className="skeleton-text" style={{ width: 180, height: 12, marginTop: 6, display: 'block' }} />
                        </div>
                        <span className="skeleton-text" style={{ width: 260, height: 38, borderRadius: 10 }} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 380px))', gap: 24 }}>
                        {[1].map((k) => (
                            <div key={k} style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 380, width: '100%' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span className="skeleton-text" style={{ width: 100, height: 14 }} />
                                    <span className="skeleton-text" style={{ width: 80, height: 18, borderRadius: 6 }} />
                                </div>

                                <div style={{ width: '100%', height: 210, borderRadius: 20, background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)', padding: 18, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                                            <div className="skeleton-avatar" style={{ width: 34, height: 34, borderRadius: 10 }} />
                                            <span className="skeleton-text" style={{ width: 110, height: 16 }} />
                                        </div>

                                        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                                            <div style={{ flex: 1 }}>
                                                <span className="skeleton-text" style={{ width: 140, height: 20, display: 'block', marginBottom: 6, borderRadius: 4 }} />
                                                <span className="skeleton-text" style={{ width: 100, height: 14, display: 'block', marginBottom: 12 }} />
                                                <span className="skeleton-text" style={{ width: 80, height: 12, display: 'block' }} />
                                            </div>
                                            <div className="skeleton-avatar" style={{ width: 92, height: 92, borderRadius: 12 }} />
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FFFBEB', padding: '10px 14px', borderRadius: 10, border: '1px solid #FDE68A' }}>
                                    <span className="skeleton-text" style={{ width: 100, height: 14 }} />
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <span className="skeleton-text" style={{ width: 68, height: 28, borderRadius: 8 }} />
                                        <span className="skeleton-text" style={{ width: 88, height: 28, borderRadius: 8 }} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    if (!customer) {
        return (
            <div className="card text-center" style={{ padding: 40, margin: '40px auto', maxWidth: 480 }}>
                <i className="fas fa-user-slash" style={{ fontSize: '2.5rem', color: 'var(--text-muted)', marginBottom: 12 }} />
                <h4 style={{ fontWeight: 800 }}>Customer Record Not Found</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>The requested customer details could not be loaded.</p>
                <button type="button" className="btn firstloop-btn-primary" onClick={() => navigate(backPath)} style={{ marginTop: 10 }}>
                    {backLabel}
                </button>
            </div>
        )
    }

    return (
        <div style={{ paddingBottom: 40 }}>
            {/* Header & Breadcrumbs */}
            <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 500, marginBottom: 8 }}>
                    {isFromBranch ? (
                        <>
                            <NavLink to={isMerchant ? '/merchant/branches' : '/branches'} style={{ color: 'var(--firstloop-primary)' }}>
                                Branches
                            </NavLink>
                            <i className="fas fa-chevron-right" style={{ fontSize: '0.7rem' }} />
                            <NavLink to={branchBackPath} style={{ color: 'var(--firstloop-primary)' }}>
                                {fromBranchName || (fromBranchId ? `Branch #${fromBranchId}` : 'Branch')}
                            </NavLink>
                        </>
                    ) : (
                        <NavLink to={defaultBackPath} style={{ color: 'var(--firstloop-primary)' }}>
                            Customers
                        </NavLink>
                    )}
                    <i className="fas fa-chevron-right" style={{ fontSize: '0.7rem' }} />
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{customer.name}</span>
                </div>

                <div className="flex-between" style={{ gap: 20, flexWrap: 'wrap' }}>
                    <div>
                        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                            Customer Profile: {customer.name}
                        </h2>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 6 }}>
                            Multi-branch Stamp Cards, Membership Passes, and Complete Transaction History logs.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="btn firstloop-btn-secondary"
                        onClick={() => navigate(backPath)}
                        style={{ padding: '9px 18px', borderRadius: 10, fontSize: '0.85rem' }}
                    >
                        <i className="fas fa-arrow-left" style={{ marginRight: 6 }} />
                        {backLabel}
                    </button>
                </div>
            </div>

            {/* Profile Overview Card & Quick Stats */}
            <div className="card card-glass firstloop-card" style={{ marginBottom: 24, padding: 20 }}>
                <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                        {customer.avatar ? (
                            <img
                                src={customer.avatar}
                                alt={customer.name}
                                style={{
                                    width: 80,
                                    height: 80,
                                    borderRadius: '50%',
                                    border: '3px solid var(--firstloop-primary)',
                                    boxShadow: '0 8px 24px rgba(14, 136, 184, 0.2)',
                                    objectFit: 'cover'
                                }}
                            />
                        ) : (
                            <div
                                style={{
                                    width: 80,
                                    height: 80,
                                    borderRadius: '50%',
                                    border: '3px solid var(--firstloop-primary)',
                                    background: 'var(--firstloop-primary-light, #E6F2FA)',
                                    color: 'var(--firstloop-primary, #0E88B8)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '1.8rem',
                                    fontWeight: 800,
                                    boxShadow: '0 8px 24px rgba(14, 136, 184, 0.2)'
                                }}
                            >
                                {customer.name ? customer.name.charAt(0).toUpperCase() : 'C'}
                            </div>
                        )}
                    </div>

                    <div style={{ flex: 1, minWidth: 260 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                            <div>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                                    {customer.name}
                                </h3>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                                    <i className="fas fa-envelope" style={{ color: 'var(--firstloop-primary)', marginRight: 6 }} />
                                    {customer.email} • <i className="fas fa-phone-alt" style={{ color: 'var(--firstloop-primary)', margin: '0 4px 0 6px' }} />
                                    {customer.phone}
                                </div>
                            </div>

                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                                Member Joined: <strong>{customer.joinedDate}</strong>
                            </div>
                        </div>

                        {/* Counter Stat Badges */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(14, 136, 184, 0.12)' }}>

                            <div style={{ padding: 10, background: 'rgba(16, 185, 129, 0.08)', borderRadius: 10, border: '1px solid rgba(16, 185, 129, 0.2)', textAlign: 'center' }}>
                                <small style={{ fontSize: '0.68rem', color: '#059669', fontWeight: 700, display: 'block' }}>TOTAL SPEND</small>
                                <strong style={{ fontSize: '1.2rem', color: '#059669' }}>{customer.totalSpendAllBranches}</strong>
                            </div>

                            <div style={{ padding: 10, background: 'var(--firstloop-primary-light)', borderRadius: 10, border: '1px solid rgba(14,136,184,0.2)', textAlign: 'center' }}>
                                <small style={{ fontSize: '0.68rem', color: 'var(--firstloop-primary)', fontWeight: 700, display: 'block' }}>ACTIVE STAMP CARDS</small>
                                <strong style={{ fontSize: '1.2rem', color: 'var(--firstloop-primary)' }}>{(customer.stampCards || []).length} Cards</strong>
                            </div>

                            {/* <div style={{ padding: 10, background: 'rgba(245, 158, 11, 0.1)', borderRadius: 10, border: '1px solid rgba(245,158,11,0.2)', textAlign: 'center' }}>
                                <small style={{ fontSize: '0.68rem', color: '#D97706', fontWeight: 700, display: 'block' }}>MEMBERSHIP PASSES</small>
                                <strong style={{ fontSize: '1.2rem', color: '#D97706' }}>{(customer.membershipCards || []).length} Passes</strong>
                            </div> */}
                        </div>
                    </div>
                </div>
            </div>

            {/* BRANCH FILTER DROPDOWN BAR */}
            <div className="card" style={{ marginBottom: 24, padding: 18, background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--firstloop-primary-light)', color: 'var(--firstloop-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
                            <i className="fas fa-filter" />
                        </div>
                        <div>
                            <h4 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                                Filter Cards & Passes by Branch
                            </h4>
                            <small style={{ color: 'var(--text-muted)' }}>
                                Select a branch to view specific customer stamp cards, memberships, and history logs.
                            </small>
                        </div>
                    </div>

                    <div style={{ minWidth: 280, flex: 1, maxWidth: 420 }}>
                        <select
                            className="form-control"
                            value={selectedBranchId}
                            onChange={(e) => setSelectedBranchId(e.target.value)}
                            style={{
                                height: 42,
                                fontSize: '0.88rem',
                                borderRadius: 10,
                                fontWeight: 600,
                                borderColor: 'var(--firstloop-primary)',
                                background: '#FFFFFF',
                                color: '#0F172A',
                                colorScheme: 'light'
                            }}
                        >
                            {branchOptions.map(b => (
                                <option key={b.id} value={b.id} style={{ background: '#FFFFFF', color: '#0F172A' }}>
                                    {b.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* 1. STAMP CARDS SECTION */}
            <div className="card" style={{ marginBottom: 28, padding: 20 }}>
                {/* Header with Search Bar */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, marginBottom: 18 }}>
                    <div>
                        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)' }}>
                            <i className="fas fa-stamp" style={{ color: 'var(--firstloop-primary)' }} />
                            Active Stamp Cards ({searchedStampCards.length})
                        </h3>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                            Click any card to view full transaction history
                        </span>
                    </div>

                    {/* Stamp Card Search Input */}
                    <div style={{ position: 'relative', width: 280, maxWidth: '100%' }}>
                        <i className="fas fa-search" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.82rem' }} />
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Search stamp cards by title, brand, card number..."
                            value={stampSearch}
                            onChange={(e) => setStampSearch(e.target.value)}
                            style={{ paddingLeft: 34, paddingRight: stampSearch ? 32 : 12, height: 38, fontSize: '0.82rem', borderRadius: 10, borderColor: '#E2E8F0' }}
                        />
                        {stampSearch && (
                            <button
                                type="button"
                                onClick={() => setStampSearch('')}
                                style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
                            >
                                <i className="fas fa-times-circle" />
                            </button>
                        )}
                    </div>
                </div>

                {paginatedStampCards.length > 0 ? (
                    <>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 380px))', gap: 24 }}>
                            {paginatedStampCards.map((card) => (
                                <div key={card.id} style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 380, width: '100%' }}>
                                    {/* Branch & Card Number Header Badge */}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, fontSize: '0.75rem', fontWeight: 700, padding: '0 2px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--firstloop-primary)' }}>
                                            <i className="fas fa-store" />
                                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 170 }}>{card.branchName}</span>
                                        </div>
                                        {card.card_number && (
                                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#F1F5F9', border: '1px solid #E2E8F0', padding: '2px 8px', borderRadius: 6, color: '#475569', fontSize: '0.72rem', fontFamily: 'monospace', fontWeight: 700 }}>
                                                <i className="fas fa-barcode" style={{ fontSize: '0.68rem', opacity: 0.7 }} />
                                                <span>{card.card_number}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* DIGITAL STAMP CARD CANVAS */}
                                    <div
                                        onClick={() => setHistoryModalCard({ ...card, type: 'stamp' })}
                                        style={{
                                            width: '100%',
                                            maxWidth: 380,
                                            borderRadius: 20,
                                            ...getCardStyle(card),
                                            color: card.textColor || card.text_color || '#FFFFFF',
                                            padding: 20,
                                            boxShadow: '0 16px 36px -8px rgba(0,0,0,0.25)',
                                            position: 'relative',
                                            cursor: 'pointer',
                                            transition: 'transform 0.2s ease',
                                            minHeight: 230
                                        }}
                                        className="card-hover-effect"
                                    >
                                        <div style={{ position: 'relative', zIndex: 2 }}>
                                            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                                                {/* LEFT SIDE: Brand, Title & Controlled 36px Stamp Circles */}
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    {/* BRAND */}
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                                        <div style={{ width: 28, height: 28, borderRadius: 8, background: '#FFFFFF', padding: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.1)', flexShrink: 0 }}>
                                                            <img src={card.brandLogo || logo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                                        </div>
                                                        <span style={{ fontSize: '1rem', fontWeight: 800, color: 'inherit', lineHeight: 1.35, display: 'inline-block' }}>
                                                            {card.brandName || 'Merchant'}
                                                        </span>
                                                    </div>

                                                    {/* CARD TITLE */}
                                                    <div style={{ fontSize: '0.85rem', opacity: 0.95, marginBottom: 4, lineHeight: 1.35 }}>
                                                        <strong>{card.title || 'Stamp Pass'}</strong>
                                                    </div>

                                                    {/* CARDHOLDER NAME */}
                                                    <div style={{ fontSize: '0.95rem', opacity: 0.95, fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6, lineHeight: 1.35 }}>
                                                        <i className="fas fa-user" style={{ fontSize: '0.75rem', lineHeight: 1, verticalAlign: '0' }} />
                                                        <span>{card.cardholderName || customer?.name || 'Customer'}</span>
                                                    </div>

                                                    {/* Fixed 36px Sized Stamp Circles Grid */}
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 6, maxWidth: 220 }}>
                                                        {Array.from({ length: card.total || card.total_stamps || 8 }).map((_, i) => {
                                                            const stampNum = i + 1
                                                            const levels = card.CustomerStampLevels || card.levelRewards || card.stamp_levels || []
                                                            const rewardItem = Array.isArray(levels)
                                                                ? (levels.find(l => Number(l.stamp_number) === stampNum) || levels[i])
                                                                : null

                                                            let iconMarkup = i + 1

                                                            const rType = rewardItem
                                                                ? (rewardItem.type || (rewardItem.reward_type === '2' || Number(rewardItem.reward_type) === 2 ? 'Discount' : (rewardItem.reward_type === '3' || Number(rewardItem.reward_type) === 3 ? 'Paid' : 'Free')))
                                                                : null

                                                            if (rewardItem) {
                                                                if (rType === 'Free') {
                                                                    iconMarkup = (
                                                                        <i
                                                                            className={`fas ${rewardItem.icon || 'fa-gift'}`}
                                                                            style={{
                                                                                fontSize: '0.82rem',
                                                                                display: 'inline-flex',
                                                                                alignItems: 'center',
                                                                                justifyContent: 'center',
                                                                                lineHeight: 1,
                                                                                verticalAlign: '0',
                                                                                margin: 0,
                                                                                padding: 0
                                                                            }}
                                                                        />
                                                                    )
                                                                } else if (rType === 'Discount') {
                                                                    const disc = Number(rewardItem.discount ?? rewardItem.discountVal ?? (parseInt(rewardItem.reward_text) || 0))
                                                                    iconMarkup = (
                                                                        <span
                                                                            style={{
                                                                                fontSize: '0.62rem',
                                                                                fontWeight: 800,
                                                                                display: 'inline-flex',
                                                                                alignItems: 'center',
                                                                                justifyContent: 'center',
                                                                                lineHeight: 1,
                                                                                verticalAlign: '0',
                                                                                margin: 0,
                                                                                padding: 0
                                                                            }}
                                                                        >
                                                                            {disc}%
                                                                        </span>
                                                                    )
                                                                } else if (rType === 'Paid') {
                                                                    iconMarkup = (
                                                                        <i
                                                                            className={`fas ${rewardItem.icon || 'fa-tag'}`}
                                                                            style={{
                                                                                fontSize: '0.82rem',
                                                                                display: 'inline-flex',
                                                                                alignItems: 'center',
                                                                                justifyContent: 'center',
                                                                                lineHeight: 1,
                                                                                verticalAlign: '0',
                                                                                margin: 0,
                                                                                padding: 0
                                                                            }}
                                                                        />
                                                                    )
                                                                }
                                                            } else {
                                                                iconMarkup = (
                                                                    <span
                                                                        style={{
                                                                            fontSize: '0.82rem',
                                                                            fontWeight: 800,
                                                                            display: 'inline-flex',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'center',
                                                                            lineHeight: 1,
                                                                            verticalAlign: '0',
                                                                            margin: 0,
                                                                            padding: 0
                                                                        }}
                                                                    >
                                                                        {i + 1}
                                                                    </span>
                                                                )
                                                            }

                                                            const hasCustomer = Boolean(
                                                                card.card_number ||
                                                                card.customer_id ||
                                                                card.cus_id ||
                                                                card.customer_name ||
                                                                card.cardholderName ||
                                                                card.customer ||
                                                                card.qr_token ||
                                                                card.customer_card_id ||
                                                                customer?.id
                                                            )

                                                            const isStamped = Boolean(
                                                                (rewardItem && (Number(rewardItem.status) === 1 || rewardItem.status === true || rewardItem.status === '1')) ||
                                                                (hasCustomer && Number(card.current_stamp ?? card.current_stamps ?? card.collected ?? 0) >= stampNum)
                                                            )

                                                            const hasFreeStamp = rewardItem && (rType === 'Discount' || rType === 'Paid') && (Number(rewardItem.free_stamp) === 1 || rewardItem.free_stamp === true || rewardItem.free_stamp === '1')

                                                            return (
                                                                <div
                                                                    key={i}
                                                                    title={isStamped ? `Stamp #${stampNum} - Completed` : (hasFreeStamp ? `${rewardItem.reward || (rType === 'Discount' ? `${rewardItem.discount ?? rewardItem.discountVal}% Off` : 'Paid Perk')} Free: ${rewardItem.free_text || 'Free Item'}` : (rewardItem?.reward_text ? `Stamp #${stampNum}: ${rewardItem.reward_text}` : `Stamp #${stampNum}`))}
                                                                    style={{
                                                                        width: 36,
                                                                        height: 36,
                                                                        borderRadius: `${card.stamp_radius ?? card.stampRadius ?? 50}%`,
                                                                        border: `2px solid ${card.stampBorderColor || card.stamp_border_color || '#FFFFFF'}`,
                                                                        background: card.stampBgColor || card.stamp_background || 'rgba(255, 255, 255, 0.3)',
                                                                        color: card.stampTextColor || card.stamp_text_color || 'inherit',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        textAlign: 'center',
                                                                        fontSize: '0.85rem',
                                                                        fontWeight: 800,
                                                                        flexShrink: 0,
                                                                        boxSizing: 'border-box',
                                                                        position: 'relative'
                                                                    }}
                                                                >
                                                                    {isStamped ? (
                                                                        <CardIcon
                                                                            name="fa-check"
                                                                            style={{
                                                                                fontSize: '0.88rem',
                                                                                display: 'inline-flex',
                                                                                alignItems: 'center',
                                                                                justifyContent: 'center',
                                                                                lineHeight: 1
                                                                            }}
                                                                        />
                                                                    ) : (
                                                                        iconMarkup
                                                                    )}
                                                                    {hasFreeStamp && (
                                                                        <span
                                                                            title={rewardItem.free_text ? `Free Perk: ${rewardItem.free_text}` : 'Free Perk Included'}
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
                                                    {(card.expires_at || card.expiry) && (
                                                        <div style={{ fontSize: '0.68rem', opacity: 0.9, fontWeight: 700, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                            <i className="far fa-calendar-alt" style={{ fontSize: '0.62rem' }} />
                                                            <span>Expires: {formatExpiryDate(card.expires_at || card.expiry)}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* RIGHT SIDE: QR CODE */}
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                    <RealQRCode token={card.qrImg || card.card_number} size={92} />
                                                    <small style={{ fontSize: '0.6rem', fontWeight: 700, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.9 }}>
                                                        SCAN TO STAMP
                                                    </small>
                                                </div>
                                            </div>

                                            {/* BOTTOM RIGHT ALIGNED POWERED BY BADGE WITH FIRSTLOOP LOGO */}
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 5, fontSize: '0.65rem', opacity: 0.9, fontWeight: 600, marginTop: 10, lineHeight: 1 }}>
                                                <span style={{ lineHeight: 1, display: 'inline-flex', alignItems: 'center' }}>powered by</span>
                                                <img src={flLogo} alt="FirstLoop" style={{ height: 13, width: 'auto', display: 'inline-block', verticalAlign: 'middle', objectFit: 'contain', margin: '0 1px' }} />
                                                <strong style={{ color: 'inherit', lineHeight: 1, display: 'inline-flex', alignItems: 'center' }}>firstloop</strong>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Usage & History Trigger Bar */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC', padding: '10px 14px', borderRadius: 10, border: '1px solid #E2E8F0', maxWidth: 380, width: '100%' }}>
                                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                                            <i className="fas fa-info-circle" style={{ color: 'var(--firstloop-primary)', marginRight: 6 }} />
                                            {card.usageNote}
                                            {(card.expires_at || card.expiry) && (
                                                <span style={{ display: 'block', marginTop: 3, color: '#B45309', fontWeight: 700, fontSize: '0.74rem' }}>
                                                    <i className="far fa-calendar-alt" style={{ marginRight: 4 }} />
                                                    Expires: {formatExpiryDate(card.expires_at || card.expiry)}
                                                </span>
                                            )}
                                        </div>

                                        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                                            {/* <button
                                                type="button"
                                                className="btn"
                                                title={`Send to WhatsApp (${customer?.phone || ''})`}
                                                onClick={() => {
                                                    const targetUrl = `/card-preview/${card.id}?type=1&cus_id=${customer?.id || ''}&phone=${encodeURIComponent(customer?.rawPhone || '')}&country_code=${encodeURIComponent(customer?.country_code || '')}&customer_name=${encodeURIComponent(customer?.name || '')}`
                                                    window.open(targetUrl, '_blank')
                                                }}
                                                style={{ padding: '6px 10px', fontSize: '0.78rem', borderRadius: 8, background: '#25D366', color: '#FFFFFF', fontWeight: 700, border: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'pointer', boxShadow: '0 2px 5px rgba(37, 211, 102, 0.3)' }}
                                            >
                                                <i className="fab fa-whatsapp" />
                                                <span>Send</span>
                                            </button> */}
                                            <button
                                                type="button"
                                                className="btn firstloop-btn-secondary"
                                                onClick={() => setPreviewModalCard({
                                                    ...card,
                                                    type: 'stamp',
                                                    customerPhone: customer?.rawPhone || card.customerPhone,
                                                    customerCountryCode: customer?.country_code || card.customerCountryCode,
                                                    cardholderName: customer?.name || card.cardholderName
                                                })}
                                                style={{ padding: '6px 12px', fontSize: '0.78rem', borderRadius: 8, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                            >
                                                <i className="fas fa-eye" />
                                                <span>Preview</span>
                                            </button>
                                            <button
                                                type="button"
                                                className="btn firstloop-btn-primary"
                                                onClick={() => setHistoryModalCard({ ...card, type: 'stamp' })}
                                                style={{ padding: '6px 12px', fontSize: '0.78rem', borderRadius: 8, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                            >
                                                <i className="fas fa-history" />
                                                <span>View History</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Stamp Cards Pagination Controls */}
                        {totalStampPages > 1 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginTop: 24, paddingTop: 16, borderTop: '1px solid #E2E8F0' }}>
                                <small style={{ color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 600 }}>
                                    Showing {((stampPage - 1) * stampPerPage) + 1} to {Math.min(stampPage * stampPerPage, searchedStampCards.length)} of {searchedStampCards.length} stamp cards
                                </small>

                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <button
                                        type="button"
                                        className="btn firstloop-btn-secondary"
                                        disabled={stampPage === 1}
                                        onClick={() => setStampPage(p => Math.max(1, p - 1))}
                                        style={{ padding: '6px 12px', fontSize: '0.78rem', borderRadius: 8, opacity: stampPage === 1 ? 0.5 : 1 }}
                                    >
                                        <i className="fas fa-chevron-left" style={{ marginRight: 4 }} /> Prev
                                    </button>

                                    {Array.from({ length: totalStampPages }).map((_, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => setStampPage(idx + 1)}
                                            style={{
                                                width: 32,
                                                height: 32,
                                                borderRadius: 8,
                                                border: stampPage === idx + 1 ? 'none' : '1px solid #E2E8F0',
                                                background: stampPage === idx + 1 ? 'var(--firstloop-primary)' : '#FFFFFF',
                                                color: stampPage === idx + 1 ? '#FFFFFF' : 'var(--text-primary)',
                                                fontWeight: 700,
                                                fontSize: '0.78rem',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                        >
                                            {idx + 1}
                                        </button>
                                    ))}

                                    <button
                                        type="button"
                                        className="btn firstloop-btn-secondary"
                                        disabled={stampPage === totalStampPages}
                                        onClick={() => setStampPage(p => Math.min(totalStampPages, p + 1))}
                                        style={{ padding: '6px 12px', fontSize: '0.78rem', borderRadius: 8, opacity: stampPage === totalStampPages ? 0.5 : 1 }}
                                    >
                                        Next <i className="fas fa-chevron-right" style={{ marginLeft: 4 }} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div style={{ padding: 30, textAlign: 'center', color: 'var(--text-muted)', background: '#F8FAFC', borderRadius: 12 }}>
                        {stampSearch ? `No stamp cards match "${stampSearch}".` : 'No active stamp cards found for the selected branch.'}
                    </div>
                )}
            </div>

            {/* 2. MEMBERSHIP CARDS SECTION */}
            {/* <div className="card" style={{ padding: 20 }}>
              
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, marginBottom: 18 }}>
                    <div>
                        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)' }}>
                            <i className="fas fa-id-card" style={{ color: '#D97706' }} />
                            Membership Passes ({searchedMemberships.length})
                        </h3>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                            Click any pass to view full transaction history
                        </span>
                    </div>

                
                    <div style={{ position: 'relative', width: 280, maxWidth: '100%' }}>
                        <i className="fas fa-search" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.82rem' }} />
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Search membership passes by title, brand, card number..."
                            value={membershipSearch}
                            onChange={(e) => setMembershipSearch(e.target.value)}
                            style={{ paddingLeft: 34, paddingRight: membershipSearch ? 32 : 12, height: 38, fontSize: '0.82rem', borderRadius: 10, borderColor: '#E2E8F0' }}
                        />
                        {membershipSearch && (
                            <button
                                type="button"
                                onClick={() => setMembershipSearch('')}
                                style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
                            >
                                <i className="fas fa-times-circle" />
                            </button>
                        )}
                    </div>
                </div>

                {paginatedMemberships.length > 0 ? (
                    <>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 380px))', gap: 24 }}>
                            {paginatedMemberships.map((mem) => (
                                <div key={mem.id} style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 380, width: '100%' }}>
                                   
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, fontSize: '0.75rem', fontWeight: 700, padding: '0 2px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#D97706' }}>
                                            <i className="fas fa-store" />
                                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 170 }}>{mem.branchName}</span>
                                        </div>
                                        {mem.card_number && (
                                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#FEF3C7', border: '1px solid #FDE68A', padding: '2px 8px', borderRadius: 6, color: '#92400E', fontSize: '0.72rem', fontFamily: 'monospace', fontWeight: 700 }}>
                                                <i className="fas fa-barcode" style={{ fontSize: '0.68rem', opacity: 0.7 }} />
                                                <span>{mem.card_number}</span>
                                            </div>
                                        )}
                                    </div>

                                    
                                    <div
                                        onClick={() => setHistoryModalCard({ ...mem, type: 'membership' })}
                                        style={{
                                            width: '100%',
                                            maxWidth: 380,
                                            borderRadius: 20,
                                            ...getCardStyle(mem),
                                            color: mem.textColor || mem.text_color || '#FFFFFF',
                                            padding: 20,
                                            boxShadow: '0 16px 36px -8px rgba(0,0,0,0.25)',
                                            position: 'relative',
                                            cursor: 'pointer',
                                            transition: 'transform 0.2s ease',
                                            minHeight: 230
                                        }}
                                        className="card-hover-effect"
                                    >
                                        <div style={{ position: 'relative', zIndex: 2 }}>
                                            
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

                                         
                                            <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 10 }}>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'inherit' }}>
                                                        {mem.name}
                                                    </div>
                                                    <div style={{ fontSize: '0.95rem', opacity: 0.95, marginTop: 4, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, lineHeight: 1.35 }}>
                                                        <i className="fas fa-user" style={{ fontSize: '0.75rem', lineHeight: 1, verticalAlign: '0' }} />
                                                        <span>{mem.cardholderName || customer?.name || 'Member Pass'}</span>
                                                    </div>

                                                    <div style={{ marginTop: 12, borderTop: '1px solid rgba(255,255,255,0.25)', paddingTop: 8 }}>
                                                        <small style={{ fontSize: '0.65rem', textTransform: 'uppercase', opacity: 0.85 }}>
                                                            Valid Thru
                                                        </small>
                                                        <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'inherit' }}>
                                                            {formatExpiryDate(mem.expires_at) || mem.expiryDate || mem.validThru || '12 Months'}
                                                        </div>
                                                    </div>
                                                </div>

                                               
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                    <RealQRCode token={mem.qrImg || mem.card_number} size={92} />
                                                    <small style={{ fontSize: '0.6rem', fontWeight: 700, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.9 }}>
                                                        SCAN PASS
                                                    </small>
                                                </div>
                                            </div>

                                            
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 5, fontSize: '0.65rem', opacity: 0.9, fontWeight: 600, marginTop: 10, lineHeight: 1 }}>
                                                <span style={{ lineHeight: 1, display: 'inline-flex', alignItems: 'center' }}>powered by</span>
                                                <img src={flLogo} alt="FirstLoop" style={{ height: 13, width: 'auto', display: 'inline-block', verticalAlign: 'middle', objectFit: 'contain', margin: '0 1px' }} />
                                                <strong style={{ color: 'inherit', lineHeight: 1, display: 'inline-flex', alignItems: 'center' }}>firstloop.co.in</strong>
                                            </div>
                                        </div>
                                    </div>

                                    
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FFFBEB', padding: '10px 14px', borderRadius: 10, border: '1px solid #FDE68A', maxWidth: 380, width: '100%' }}>
                                        <div style={{ fontSize: '0.78rem', color: '#B45309', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <i className="fas fa-exclamation-circle" style={{ color: '#D97706' }} />
                                            <span>{mem.expiryNotice}</span>
                                        </div>

                                        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                                            <button
                                                type="button"
                                                className="btn"
                                                title={`Send to WhatsApp (${customer?.phone || ''})`}
                                                onClick={() => {
                                                    const targetUrl = `/card-preview/${mem.id}?type=2&cus_id=${customer?.id || ''}&phone=${encodeURIComponent(customer?.rawPhone || '')}&country_code=${encodeURIComponent(customer?.country_code || '')}&customer_name=${encodeURIComponent(customer?.name || '')}`
                                                    window.open(targetUrl, '_blank')
                                                }}
                                                style={{ padding: '6px 10px', fontSize: '0.78rem', borderRadius: 8, background: '#25D366', color: '#FFFFFF', fontWeight: 700, border: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'pointer', boxShadow: '0 2px 5px rgba(37, 211, 102, 0.3)' }}
                                            >
                                                <i className="fab fa-whatsapp" />
                                                <span>Send</span>
                                            </button>
                                            <button
                                                type="button"
                                                className="btn firstloop-btn-secondary"
                                                onClick={() => setPreviewModalCard({
                                                    ...mem,
                                                    type: 'membership',
                                                    customerPhone: customer?.rawPhone || mem.customerPhone,
                                                    customerCountryCode: customer?.country_code || mem.customerCountryCode,
                                                    cardholderName: customer?.name || mem.cardholderName
                                                })}
                                                style={{ padding: '6px 12px', fontSize: '0.78rem', borderRadius: 8, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                            >
                                                <i className="fas fa-eye" />
                                                <span>Preview</span>
                                            </button>
                                            <button
                                                type="button"
                                                className="btn"
                                                onClick={() => setHistoryModalCard({ ...mem, type: 'membership' })}
                                                style={{ padding: '6px 12px', fontSize: '0.78rem', borderRadius: 8, background: '#D97706', color: '#FFF', fontWeight: 700, border: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                            >
                                                <i className="fas fa-history" />
                                                <span>View History</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {totalMembershipPages > 1 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginTop: 24, paddingTop: 16, borderTop: '1px solid #E2E8F0' }}>
                                <small style={{ color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 600 }}>
                                    Showing {((membershipPage - 1) * membershipPerPage) + 1} to {Math.min(membershipPage * membershipPerPage, searchedMemberships.length)} of {searchedMemberships.length} membership passes
                                </small>

                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <button
                                        type="button"
                                        className="btn firstloop-btn-secondary"
                                        disabled={membershipPage === 1}
                                        onClick={() => setMembershipPage(p => Math.max(1, p - 1))}
                                        style={{ padding: '6px 12px', fontSize: '0.78rem', borderRadius: 8, opacity: membershipPage === 1 ? 0.5 : 1 }}
                                    >
                                        <i className="fas fa-chevron-left" style={{ marginRight: 4 }} /> Prev
                                    </button>

                                    {Array.from({ length: totalMembershipPages }).map((_, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => setMembershipPage(idx + 1)}
                                            style={{
                                                width: 32,
                                                height: 32,
                                                borderRadius: 8,
                                                border: membershipPage === idx + 1 ? 'none' : '1px solid #E2E8F0',
                                                background: membershipPage === idx + 1 ? '#D97706' : '#FFFFFF',
                                                color: membershipPage === idx + 1 ? '#FFFFFF' : 'var(--text-primary)',
                                                fontWeight: 700,
                                                fontSize: '0.78rem',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                        >
                                            {idx + 1}
                                        </button>
                                    ))}

                                    <button
                                        type="button"
                                        className="btn firstloop-btn-secondary"
                                        disabled={membershipPage === totalMembershipPages}
                                        onClick={() => setMembershipPage(p => Math.min(totalMembershipPages, p + 1))}
                                        style={{ padding: '6px 12px', fontSize: '0.78rem', borderRadius: 8, opacity: membershipPage === totalMembershipPages ? 0.5 : 1 }}
                                    >
                                        Next <i className="fas fa-chevron-right" style={{ marginLeft: 4 }} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div style={{ padding: 30, textAlign: 'center', color: 'var(--text-muted)', background: '#F8FAFC', borderRadius: 12 }}>
                        {membershipSearch ? `No membership passes match "${membershipSearch}".` : 'No membership passes found for the selected branch.'}
                    </div>
                )}
            </div> */}

            {/* CUSTOMER CARD HISTORY MODAL */}
            {historyModalCard && (
                <CustomerCardHistory
                    isOpen={!!historyModalCard}
                    onClose={() => setHistoryModalCard(null)}
                    cardId={historyModalCard.id}
                    card={historyModalCard}
                />
            )}

            {/* STAMP CARD PREVIEW MODAL */}
            {previewModalCard && (Number(previewModalCard.card_type) === 1 || previewModalCard.type === 'stamp') && (
                <StampCardPreviewModal
                    isOpen={!!previewModalCard}
                    card={previewModalCard}
                    onClose={() => setPreviewModalCard(null)}
                    fallbackBrandName={previewModalCard.brandName || customer?.name || 'Brand'}
                />
            )}

            {/* MEMBERSHIP PASS PREVIEW MODAL */}
            {previewModalCard && (Number(previewModalCard.card_type) === 2 || previewModalCard.type === 'membership') && (
                <MembershipCardPreviewModal
                    isOpen={!!previewModalCard}
                    card={previewModalCard}
                    onClose={() => setPreviewModalCard(null)}
                    fallbackBrandName={previewModalCard.brandName || customer?.name || 'FirstLoop'}
                />
            )}
        </div>
    )
}
