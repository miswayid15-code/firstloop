import { useState, useMemo, useEffect } from 'react'
import { NavLink, useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import logo from '../../assets/img/firstloop-favicon.png'
import flLogo from '../../assets/img/firstloop-favicon.png'
import qrImg from '../../assets/img/qr-img.png'
import { getCardStyle, formatImageUrl } from '../../services/cardService.js'

// --- QR Code Component Using qr-img.png ---
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

// List of Branches for Dropdown Filter
const MOCK_BRANCHES = [
    { id: 'all', name: 'All Outlets / Branches (4 Outlets)' },
    { id: 'fl-br-101', name: 'FirstLoop Flagship Hub - Downtown (San Francisco)' },
    { id: 'br-102', name: 'Westside Salon & Beauty Lounge (San Jose)' },
    { id: 'br-103', name: 'Sunset Bay Gourmet Bakery (Oakland)' },
    { id: 'br-104', name: 'Northside Fashion Outlet (Palo Alto)' }
]

// Mock Customer Data with Multiple Stamp Cards & Membership Passes across Branches
const MOCK_CUSTOMER_FULL = {
    id: 'cus-501',
    name: 'Sophia Reynolds',
    email: 'sophia.reynolds@example.com',
    phone: '+1 (555) 234-5678',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120',
    joinedDate: '10 Feb 2025',
    // status: 'VIP CUSTOMER',
    totalVisitsAllBranches: 54,
    totalSpendAllBranches: '$1,480.50',

    // Multiple Stamp Cards across branches
    stampCards: [
        {
            id: 'sc-101',
            branchId: 'fl-br-101',
            branchName: 'FirstLoop Flagship Hub - Downtown',
            title: 'Artisanal Coffee 8-Stamp Pass',
            brandName: 'Elite Brews',
            collected: 7,
            total: 8,
            totalVisits: 18,
            reward: 'Free Gourmet Muffin or Specialty Beverage',
            bgColor: '#EF0003',
            textColor: '#FFFFFF',
            borderColor: '#FF3B3B',
            stampBgColor: 'rgba(255, 255, 255, 0.3)',
            stampBorderColor: '#FFFFFF',
            stampTextColor: '#FFFFFF',
            usageNote: '7 of 8 stamps collected — 1 stamp away from unlocking Free Muffin reward!',
            history: [
                { date: '12 Aug 2026 • 02:45 PM', branch: 'FirstLoop Flagship Hub', event: '+1 Stamp Earned (Specialty Cold Brew)', balance: '7 / 8 Stamps', operator: 'Samantha Vance', amt: '100.00' },
                { date: '05 Aug 2026 • 11:15 AM', branch: 'FirstLoop Flagship Hub', event: '+1 Stamp Earned (Flat White)', balance: '6 / 8 Stamps', operator: 'Samantha Vance', amt: '100.00' },
                { date: '28 Jul 2026 • 09:30 AM', branch: 'FirstLoop Flagship Hub', event: 'Reward Claimed (20% Off Coupon)', balance: '5 / 8 Stamps', operator: 'John Miller', amt: '100.00' },
                { date: '20 Jul 2026 • 04:20 PM', branch: 'FirstLoop Flagship Hub', event: '+1 Stamp Earned (Iced Mocha)', balance: '5 / 8 Stamps', operator: 'Samantha Vance', amt: '100.00' },
                { date: '10 Jul 2026 • 08:00 AM', branch: 'FirstLoop Flagship Hub', event: '+1 Stamp Earned (Espresso Shot)', balance: '4 / 8 Stamps', operator: 'Samantha Vance', amt: '100.00' }
            ]
        },
        {
            id: 'sc-102',
            branchId: 'br-102',
            branchName: 'Westside Salon & Beauty Lounge',
            title: 'Beauty Styling 6-Stamp Card',
            brandName: 'FirstLoop Salon',
            collected: 5,
            total: 6,
            totalVisits: 14,
            reward: '50% Discount on Next Hair Styling',
            bgColor: '#0284C7',
            textColor: '#FFFFFF',
            borderColor: '#00A6D6',
            stampBgColor: 'rgba(255, 255, 255, 0.3)',
            stampBorderColor: '#FFFFFF',
            stampTextColor: '#FFFFFF',
            usageNote: '5 of 6 stamps collected — 1 stamp remaining for 50% Off Styling reward.',
            history: [
                { date: '10 Aug 2026 • 04:10 PM', branch: 'Westside Salon & Beauty', event: '+1 Stamp Earned (Hydrating Spa Treatment)', balance: '5 / 6 Stamps', operator: 'Elena Rostova (SP-44)', amt: '100.00' },
                { date: '01 Aug 2026 • 01:20 PM', branch: 'Westside Salon & Beauty', event: '+1 Stamp Earned (Blowout Styling)', balance: '4 / 6 Stamps', operator: 'Elena Rostova (SP-44)', amt: '100.00' },
                { date: '15 Jul 2026 • 05:00 PM', branch: 'Westside Salon & Beauty', event: '+1 Stamp Earned (Hair Color Touchup)', balance: '3 / 6 Stamps', operator: 'Marcus Wu (SP-19)', amt: '100.00' }
            ]
        },
        {
            id: 'sc-103',
            branchId: 'br-103',
            branchName: 'Sunset Bay Gourmet Bakery',
            title: 'Gourmet Pastry 10-Stamp Pass',
            brandName: 'Sunset Bakery',
            collected: 9,
            total: 10,
            totalVisits: 22,
            reward: 'Free Deluxe Croissant & Coffee Combo',
            bgColor: '#D97706',
            textColor: '#FFFFFF',
            borderColor: '#F59E0B',
            stampBgColor: 'rgba(255, 255, 255, 0.3)',
            stampBorderColor: '#FFFFFF',
            stampTextColor: '#FFFFFF',
            usageNote: '9 of 10 stamps collected — Only 1 stamp needed for Deluxe Combo reward!',
            history: [
                { date: '11 Aug 2026 • 08:30 AM', branch: 'Sunset Bay Gourmet Bakery', event: '+1 Stamp Earned (Almond Croissant)', balance: '9 / 10 Stamps', operator: 'Carlos Mendez (SP-05)', amt: '100.00' },
                { date: '04 Aug 2026 • 09:15 AM', branch: 'Sunset Bay Gourmet Bakery', event: '+1 Stamp Earned (Artisanal Sourdough)', balance: '8 / 10 Stamps', operator: 'Carlos Mendez (SP-05)', amt: '100.00' }
            ]
        },
        {
            id: 'sc-104',
            branchId: 'br-104',
            branchName: 'Northside Fashion Outlet',
            title: 'Apparel VIP 8-Stamp Pass',
            brandName: 'Northside Style',
            collected: 3,
            total: 8,
            totalVisits: 6,
            reward: '$30 Cash Voucher on Fashion Items',
            bgColor: '#8B5CF6',
            textColor: '#FFFFFF',
            borderColor: '#A855F7',
            stampBgColor: 'rgba(255, 255, 255, 0.3)',
            stampBorderColor: '#FFFFFF',
            stampTextColor: '#FFFFFF',
            usageNote: '3 of 8 stamps collected — 5 stamps remaining for $30 Voucher.',
            history: [
                { date: '02 Aug 2026 • 03:30 PM', branch: 'Northside Fashion Outlet', event: '+1 Stamp Earned (Denim Jacket Purchase)', balance: '3 / 8 Stamps', operator: 'Lisa Ray (SP-77)', amt: '100.00' }
            ]
        }
    ],

    // Multiple Membership Passes across branches
    membershipCards: [
        {
            id: 'mc-201',
            branchId: 'fl-br-101',
            branchName: 'FirstLoop Flagship Hub - Downtown',
            name: 'Gold Elite Membership',
            cardholderName: 'Sophia Reynolds',
            brandName: 'FirstLoop Elite',
            brandLogo: flLogo,
            validThru: '03/25',
            expiryDate: '28 Dec 2026',
            expiryNotice: 'Going to expire on 28 Dec 2026',
            tier: 'Gold',
            totalVisits: 24,
            bgColor: '#D97706',
            textColor: '#FFFFFF',
            borderColor: '#F59E0B',
            status: 'Active',
            perks: ['15% Instant Discount', 'Priority Queue', 'Free Birthday Gift'],
            history: [
                { date: '15 Jan 2026 • 10:00 AM', branch: 'FirstLoop Flagship Hub', event: 'Membership Renewed for 12 Months', balance: 'Gold Tier Active', operator: 'System Admin', amt: '250.00' },
                { date: '15 Jan 2025 • 09:00 AM', branch: 'FirstLoop Flagship Hub', event: 'Initial Gold Tier Membership Issued', balance: 'Gold Tier Active', operator: 'Samantha Vance', amt: '250.00' }
            ]
        },
        {
            id: 'mc-202',
            branchId: 'br-102',
            branchName: 'Westside Salon & Beauty Lounge',
            name: 'Platinum Black VIP Pass',
            cardholderName: 'Sophia Reynolds',
            brandName: 'VIP Club',
            brandLogo: logo,
            validThru: '03/25',
            expiryDate: '15 Nov 2026',
            expiryNotice: 'Going to expire on 15 Nov 2026',
            tier: 'Platinum',
            totalVisits: 16,
            bgColor: '#1E293B',
            textColor: '#FFFFFF',
            borderColor: '#64748B',
            status: 'Active',
            perks: ['25% Styling Discount', 'Dedicated Stylist', 'Free Valet'],
            history: [
                { date: '10 Nov 2025 • 02:00 PM', branch: 'Westside Salon & Beauty', event: 'Upgraded to Platinum Black VIP Tier', balance: 'Platinum Tier Active', operator: 'Elena Rostova (SP-44)', amt: '500.00' }
            ]
        },
        {
            id: 'mc-203',
            branchId: 'br-103',
            branchName: 'Sunset Bay Gourmet Bakery',
            name: 'Diamond Gourmet Pass',
            cardholderName: 'Sophia Reynolds',
            brandName: 'Sunset Diamond',
            brandLogo: flLogo,
            validThru: '06/26',
            expiryDate: '10 Jan 2027',
            expiryNotice: 'Going to expire on 10 Jan 2027',
            tier: 'Diamond',
            totalVisits: 12,
            bgColor: '#0284C7',
            textColor: '#FFFFFF',
            borderColor: '#00A6D6',
            status: 'Active',
            perks: ['Unlimited Free Coffee Top-ups', 'Reserved Seating', 'Monthly Pastry Box'],
            history: [
                { date: '10 Jan 2026 • 11:30 AM', branch: 'Sunset Bay Gourmet Bakery', event: 'Diamond Pass Enrolled', balance: 'Diamond Tier Active', operator: 'Carlos Mendez (SP-05)', amt: '350.00' }
            ]
        }
    ]
}

export default function FpCustomerDetails() {
    const navigate = useNavigate()
    const { id } = useParams()
    const [searchParams] = useSearchParams()

    const customer = MOCK_CUSTOMER_FULL

    // Branch Filter State - Auto pre-select from URL query params if provided
    const branchFromUrl = searchParams.get('branchId') || searchParams.get('branch') || 'all'
    const [selectedBranchId, setSelectedBranchId] = useState(branchFromUrl)

    useEffect(() => {
        const b = searchParams.get('branchId') || searchParams.get('branch')
        if (b) {
            setSelectedBranchId(b)
        }
    }, [searchParams])

    // Card History & Preview Modal States
    const [historyModalCard, setHistoryModalCard] = useState(null)
    const [previewModalCard, setPreviewModalCard] = useState(null)

    // Filter Stamp Cards by Branch
    const filteredStampCards = useMemo(() => {
        if (selectedBranchId === 'all') return customer.stampCards
        return customer.stampCards.filter(sc => sc.branchId === selectedBranchId)
    }, [customer.stampCards, selectedBranchId])

    // Filter Membership Passes by Branch
    const filteredMemberships = useMemo(() => {
        if (selectedBranchId === 'all') return customer.membershipCards
        return customer.membershipCards.filter(mc => mc.branchId === selectedBranchId)
    }, [customer.membershipCards, selectedBranchId])



    const location = useLocation()
    const backPath = location.pathname.startsWith('/merchant') ? '/merchant/customers' : '/customers'

    return (
        <div style={{ paddingBottom: 40 }}>
            {/* Header & Breadcrumbs */}
            <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 500, marginBottom: 8 }}>
                    <NavLink to={backPath} style={{ color: 'var(--firstloop-primary)' }}>
                        Customers
                    </NavLink>
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
                        Back to Customers List
                    </button>
                </div>
            </div>

            {/* Profile Overview Card & Quick Stats */}
            <div className="card card-glass firstloop-card" style={{ marginBottom: 24, padding: 20 }}>
                <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flexShrink: 0 }}>
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
                                <strong style={{ fontSize: '1.2rem', color: 'var(--firstloop-primary)' }}>{customer.stampCards.length} Cards</strong>
                            </div>

                            <div style={{ padding: 10, background: 'rgba(245, 158, 11, 0.1)', borderRadius: 10, border: '1px solid rgba(245,158,11,0.2)', textAlign: 'center' }}>
                                <small style={{ fontSize: '0.68rem', color: '#D97706', fontWeight: 700, display: 'block' }}>MEMBERSHIP PASSES</small>
                                <strong style={{ fontSize: '1.2rem', color: '#D97706' }}>{customer.membershipCards.length} Passes</strong>
                            </div>
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
                            style={{ height: 42, fontSize: '0.88rem', borderRadius: 10, fontWeight: 600, borderColor: 'var(--firstloop-primary)' }}
                        >
                            {MOCK_BRANCHES.map(b => (
                                <option key={b.id} value={b.id}>
                                    {b.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* 1. STAMP CARDS SECTION */}
            <div className="card" style={{ marginBottom: 28, padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)' }}>
                        <i className="fas fa-stamp" style={{ color: 'var(--firstloop-primary)' }} />
                        Active Stamp Cards ({filteredStampCards.length})
                    </h3>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                        Click any card to view full transaction history
                    </span>
                </div>

                {filteredStampCards.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 380px))', gap: 24 }}>
                        {filteredStampCards.map((card) => (
                            <div key={card.id} style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 380, width: '100%' }}>
                                {/* Branch Badge */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', fontWeight: 700, color: 'var(--firstloop-primary)' }}>
                                    <i className="fas fa-store" />
                                    <span>{card.branchName}</span>
                                </div>

                                {/* DIGITAL STAMP CARD CANVAS */}
                                <div
                                    onClick={() => setHistoryModalCard({ ...card, type: 'stamp' })}
                                    style={{
                                        width: '100%',
                                        maxWidth: 380,
                                        borderRadius: 20,
                                        ...getCardStyle(card),
                                        color: card.textColor || '#FFFFFF',
                                        padding: 15,
                                        boxShadow: '0 14px 30px -6px rgba(0,0,0,0.22)',
                                        position: 'relative',
                                        cursor: 'pointer',
                                        transition: 'transform 0.2s ease',
                                        minHeight: 220
                                    }}
                                    className="card-hover-effect"
                                >
                                    <div style={{ position: 'relative', zIndex: 2 }}>
                                        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                                            {/* LEFT SIDE: Brand, Title & Controlled 36px Stamp Circles */}
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                                    <div style={{ width: 26, height: 26, borderRadius: 8, background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <img src={logo} alt="Logo" style={{ width: 18, height: 18, objectFit: 'contain' }} />
                                                    </div>
                                                    <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'inherit' }}>
                                                        {card.brandName}
                                                    </span>
                                                </div>

                                                <div style={{ fontSize: '0.78rem', opacity: 0.9, marginBottom: 10 }}>
                                                    <strong>{card.title}</strong>
                                                </div>

                                                {/* Fixed 36px Sized Stamp Circles Grid */}
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 6, maxWidth: 220 }}>
                                                    {Array.from({ length: card.total }).map((_, i) => (
                                                        <div
                                                            key={i}
                                                            style={{
                                                                width: 36,
                                                                height: 36,
                                                                borderRadius: '50%',
                                                                border: `2px solid ${card.stampBorderColor || '#FFFFFF'}`,
                                                                background: i < card.collected ? 'rgba(255, 255, 255, 0.85)' : card.stampBgColor || 'rgba(255, 255, 255, 0.3)',
                                                                color: i < card.collected ? '#EF0003' : card.stampTextColor || 'inherit',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                fontSize: '0.85rem',
                                                                fontWeight: 800,
                                                                flexShrink: 0
                                                            }}
                                                        >
                                                            {i < card.collected ? <i className="fas fa-check" /> : i + 1}
                                                        </div>
                                                    ))}
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
                                            <strong style={{ color: 'inherit' }}>firstloop.co.in</strong>
                                        </div>
                                    </div>
                                </div>

                                {/* Usage & History Trigger Bar */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC', padding: '10px 14px', borderRadius: 10, border: '1px solid #E2E8F0', maxWidth: 380, width: '100%' }}>
                                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                                        <i className="fas fa-info-circle" style={{ color: 'var(--firstloop-primary)', marginRight: 6 }} />
                                        {card.usageNote}
                                    </div>

                                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                                        <button
                                            type="button"
                                            className="btn firstloop-btn-secondary"
                                            onClick={() => setPreviewModalCard({ ...card, type: 'stamp' })}
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
                ) : (
                    <div style={{ padding: 30, textAlign: 'center', color: 'var(--text-muted)', background: '#F8FAFC', borderRadius: 12 }}>
                        No active stamp cards found for the selected branch.
                    </div>
                )}
            </div>

            {/* 2. MEMBERSHIP CARDS SECTION */}
            <div className="card" style={{ padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)' }}>
                        <i className="fas fa-id-card" style={{ color: '#D97706' }} />
                        Membership Passes ({filteredMemberships.length})
                    </h3>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                        Click any pass to view full transaction history
                    </span>
                </div>

                {filteredMemberships.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 380px))', gap: 24 }}>
                        {filteredMemberships.map((mem) => (
                            <div key={mem.id} style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 380, width: '100%' }}>
                                {/* Branch Badge */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', fontWeight: 700, color: '#D97706' }}>
                                    <i className="fas fa-store" />
                                    <span>{mem.branchName}</span>
                                </div>

                                {/* DIGITAL MEMBERSHIP PASS CANVAS WITH LARGE MIDDLE QR CODE */}
                                <div
                                    onClick={() => setHistoryModalCard({ ...mem, type: 'membership' })}
                                    style={{
                                        width: '100%',
                                        maxWidth: 380,
                                        borderRadius: 20,
                                        ...getCardStyle(mem),
                                        color: mem.textColor || '#FFFFFF',
                                        padding: 15,
                                        boxShadow: '0 14px 30px -6px rgba(0,0,0,0.22)',
                                        position: 'relative',
                                        cursor: 'pointer',
                                        transition: 'transform 0.2s ease',
                                        minHeight: 210
                                    }}
                                    className="card-hover-effect"
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
                                                    {mem.cardholderName || 'Sophia Reynolds'}
                                                </div>

                                                <div style={{ marginTop: 12, borderTop: '1px solid rgba(255,255,255,0.25)', paddingTop: 8 }}>
                                                    <small style={{ fontSize: '0.65rem', textTransform: 'uppercase', opacity: 0.85 }}>
                                                        Valid Thru
                                                    </small>
                                                    <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'inherit' }}>
                                                        {mem.validThru || '03/25'}
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

                                {/* Expiry Notice & Action Bar */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FFFBEB', padding: '10px 14px', borderRadius: 10, border: '1px solid #FDE68A', maxWidth: 380, width: '100%' }}>
                                    <div style={{ fontSize: '0.78rem', color: '#B45309', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <i className="fas fa-exclamation-circle" style={{ color: '#D97706' }} />
                                        <span>{mem.expiryNotice}</span>
                                    </div>

                                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                                        <button
                                            type="button"
                                            className="btn firstloop-btn-secondary"
                                            onClick={() => setPreviewModalCard({ ...mem, type: 'membership' })}
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
                ) : (
                    <div style={{ padding: 30, textAlign: 'center', color: 'var(--text-muted)', background: '#F8FAFC', borderRadius: 12 }}>
                        No membership passes found for the selected branch.
                    </div>
                )}
            </div>

            {/* FULL TRANSACTION & ACTIVITY HISTORY MODAL WITH TOTAL VISITS METRIC */}
            {historyModalCard && (
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
                            maxWidth: 720,
                            width: '100%',
                            maxHeight: '92vh',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                            boxShadow: '0 25px 50px rgba(0,0,0,0.35)'
                        }}
                    >
                        {/* History Header */}
                        <div style={{ padding: '18px 24px', background: 'var(--firstloop-gradient-primary)', color: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 38, height: 38, borderRadius: 10, background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--firstloop-primary)', fontSize: '1.2rem' }}>
                                    <i className={historyModalCard.type === 'stamp' ? 'fas fa-stamp' : 'fas fa-id-card'} />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
                                        Full History Logs: {historyModalCard.title || historyModalCard.name}
                                    </h3>
                                    <small style={{ color: 'rgba(255,255,255,0.85)' }}>
                                        Branch: {historyModalCard.branchName} • Customer: {customer.name}
                                    </small>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => setHistoryModalCard(null)}
                                style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#FFF', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                <i className="fas fa-times" />
                            </button>
                        </div>

                        {/* History Log Body */}
                        <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
                            {/* Summary Card Info with TOTAL VISITS ON CARD Metric */}
                            <div style={{ padding: 14, background: '#F8FAFC', borderRadius: 12, border: '1px solid #E2E8F0', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
                                <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                                    <div>
                                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>CURRENT CARD STATUS</span>
                                        <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--firstloop-primary)' }}>
                                            {historyModalCard.type === 'stamp'
                                                ? `${historyModalCard.collected} of ${historyModalCard.total} Stamps Collected`
                                                : `${historyModalCard.tier} Tier Active (Expires: ${historyModalCard.expiryDate})`
                                            }
                                        </div>
                                    </div>

                                    <div style={{ paddingLeft: 16, borderLeft: '2px solid #E2E8F0' }}>
                                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>TOTAL VISITS ON CARD</span>
                                        <div style={{ fontWeight: 800, fontSize: '1rem', color: '#059669', display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <i className="fas fa-user-check" style={{ color: '#059669', fontSize: '0.85rem' }} />
                                            <span>{historyModalCard.totalVisits || (historyModalCard.history ? historyModalCard.history.length : 12)} Visits</span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    className="btn firstloop-btn-secondary"
                                    onClick={() => alert(`Exporting history statement for ${historyModalCard.title || historyModalCard.name}...`)}
                                    style={{ padding: '7px 14px', fontSize: '0.78rem', borderRadius: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                                >
                                    <i className="fas fa-download" />
                                    <span>Export History Log</span>
                                </button>
                            </div>

                            {/* Activity History Timeline Table */}
                            <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Activity & Transaction History Timeline
                            </h4>

                            <div className="table-responsive" style={{ border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
                                <table className="table" style={{ margin: 0, fontSize: '0.82rem' }}>
                                    <thead>
                                        <tr style={{ background: '#F8FAFC' }}>
                                            <th style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--text-muted)' }}>Sl No</th>
                                            <th style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--text-muted)' }}>DATE & TIME</th>
                                            <th style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--text-muted)' }}>Receptionist</th>
                                            <th style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--text-muted)', textAlign: 'right' }}>Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {historyModalCard.history && historyModalCard.history.length > 0 ? (
                                            historyModalCard.history.map((log, index) => (
                                                <tr key={index} style={{ verticalAlign: 'middle' }}>
                                                    <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                                                        {index + 1}
                                                    </td>
                                                    <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                                                        {log.date}
                                                    </td>
                                                    <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>
                                                        {log.operator}
                                                    </td>
                                                    <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: '#059669' }}>
                                                        ${log.amt || '100.00'}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="4" style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>
                                                    No past activity logged for this card.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div style={{ padding: '14px 24px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', textAlign: 'right' }}>
                            <button
                                type="button"
                                className="btn firstloop-btn-secondary"
                                onClick={() => setHistoryModalCard(null)}
                                style={{ padding: '8px 20px', borderRadius: 8, fontSize: '0.85rem' }}
                            >
                                Close History Log
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* PASS PREVIEW MODAL */}
            {previewModalCard && (
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
                            onClick={() => setPreviewModalCard(null)}
                            style={{ position: 'absolute', right: 16, top: 16, background: 'none', border: 'none', fontSize: '1.2rem', color: 'var(--text-muted)', cursor: 'pointer' }}
                        >
                            &times;
                        </button>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 16 }}>
                            {previewModalCard.type === 'membership' ? 'Membership Pass Preview' : 'Stamp Card Pass Preview'}
                        </h3>

                        {/* Pass Canvas */}
                        <div
                            style={{
                                width: '100%',
                                borderRadius: 20,
                                ...getCardStyle(previewModalCard),
                                color: previewModalCard.textColor || '#FFFFFF',
                                padding: 18,
                                boxShadow: '0 14px 30px -6px rgba(0,0,0,0.22)',
                                minHeight: 210
                            }}
                        >
                            {previewModalCard.type === 'membership' ? (
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <div style={{ width: 34, height: 34, borderRadius: 10, background: '#FFFFFF', padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <img src={previewModalCard.brandLogo || flLogo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                            </div>
                                            <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'inherit' }}>
                                                {previewModalCard.brandName || 'FirstLoop'}
                                            </span>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 10 }}>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'inherit' }}>
                                                {previewModalCard.name}
                                            </div>
                                            <div style={{ fontSize: '0.82rem', opacity: 0.9, marginTop: 4, fontWeight: 700 }}>
                                                {previewModalCard.cardholderName || 'Sophia Reynolds'}
                                            </div>

                                            <div style={{ marginTop: 12, borderTop: '1px solid rgba(255,255,255,0.25)', paddingTop: 8 }}>
                                                <small style={{ fontSize: '0.65rem', textTransform: 'uppercase', opacity: 0.85 }}>Valid Thru</small>
                                                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'inherit' }}>
                                                    {previewModalCard.validThru || '03/25'}
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                                            <RealQRCode size={92} />
                                            <small style={{ fontSize: '0.6rem', fontWeight: 700, marginTop: 4, textTransform: 'uppercase', opacity: 0.9 }}>SCAN PASS</small>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                                <div style={{ width: 26, height: 26, borderRadius: 8, background: '#FFF', padding: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <img src={logo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                                </div>
                                                <span style={{ fontSize: '0.92rem', fontWeight: 800, color: 'inherit' }}>
                                                    {previewModalCard.brandName || 'FirstLoop'}
                                                </span>
                                            </div>

                                            <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: 10 }}>
                                                {previewModalCard.title}
                                            </div>

                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 6, maxWidth: 220 }}>
                                                {Array.from({ length: previewModalCard.total || 8 }).map((_, i) => (
                                                    <div
                                                        key={i}
                                                        style={{
                                                            width: 36,
                                                            height: 36,
                                                            borderRadius: '50%',
                                                            border: `2px solid ${previewModalCard.stampBorderColor || '#FFFFFF'}`,
                                                            background: i < (previewModalCard.collected || 0) ? 'rgba(255, 255, 255, 0.85)' : previewModalCard.stampBgColor || 'rgba(255, 255, 255, 0.3)',
                                                            color: i < (previewModalCard.collected || 0) ? '#EF0003' : previewModalCard.stampTextColor || 'inherit',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            fontSize: '0.82rem',
                                                            fontWeight: 800
                                                        }}
                                                    >
                                                        {i < (previewModalCard.collected || 0) ? <i className="fas fa-check" /> : i + 1}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                                            <RealQRCode size={84} />
                                            <small style={{ fontSize: '0.58rem', fontWeight: 800, marginTop: 4, letterSpacing: '0.5px' }}>
                                                SCAN TO STAMP
                                            </small>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 4, fontSize: '0.65rem', opacity: 0.9, marginTop: 10, fontWeight: 700 }}>
                                <span>powered by</span>
                                <img src={flLogo} alt="FirstLoop" style={{ height: 12 }} />
                                <span>firstloop.co.in</span>
                            </div>
                        </div>

                        {/* Share & Download Action Buttons */}
                        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                            <a
                                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Check out my ${previewModalCard.name || previewModalCard.title || 'FirstLoop'} Pass! Access your digital loyalty card here: ${window.location.href}`)}`}
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
                                    const cardName = (previewModalCard.name || previewModalCard.title || 'digital-pass').toLowerCase().replace(/\s+/g, '-')
                                    const link = document.createElement('a')
                                    link.href = qrImg
                                    link.download = `${cardName}-pass.png`
                                    document.body.appendChild(link)
                                    link.click()
                                    document.body.removeChild(link)
                                    alert(`Downloading ${previewModalCard.name || previewModalCard.title} Digital Pass...`)
                                }}
                                className="btn firstloop-btn-primary"
                                style={{
                                    flex: 1,
                                    padding: '10px 14px',
                                    borderRadius: 10,
                                    fontWeight: 700,
                                    fontSize: '0.85rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 8,
                                    boxShadow: '0 4px 12px rgba(14, 136, 184, 0.25)'
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
