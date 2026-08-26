import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { INITIAL_CUSTOMERS, INITIAL_STAMP_CARDS, INITIAL_MEMBERSHIP_CARDS } from './mockMerchantData'
import flLogo from '../../assets/img/firstloop-favicon.png'
import qrImg from '../../assets/img/qr-img.png'

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

export default function CustomerList() {
    const navigate = useNavigate()
    const [customers, setCustomers] = useState(INITIAL_CUSTOMERS)
    const [search, setSearch] = useState('')
    const [filterCard, setFilterCard] = useState('all')

    // Customer Detail Modal / Drawer State
    const [selectedCustomer, setSelectedCustomer] = useState(null)

    // Newly Enrolled Digital Card Modal State
    const [enrolledCardModal, setEnrolledCardModal] = useState(null)

    // Add Customer Modal Form State
    const [addModalOpen, setAddModalOpen] = useState(false)
    const [form, setForm] = useState({
        name: '',
        email: '',
        phone: '',
        cardType: 'stamp', // 'stamp' | 'membership'
        selectedCardTitle: INITIAL_STAMP_CARDS[0].title,
        status: 'Active'
    })

    // Add Additional Card Modal State for Existing Customer
    const [addCardModalCustomer, setAddCardModalCustomer] = useState(null)
    const [newCardForm, setNewCardForm] = useState({
        cardType: 'stamp',
        selectedCardTitle: INITIAL_STAMP_CARDS[0].title
    })

    const filteredCustomers = useMemo(() => {
        return customers.filter(c => {
            const matchesSearch =
                c.name.toLowerCase().includes(search.toLowerCase()) ||
                c.email.toLowerCase().includes(search.toLowerCase()) ||
                c.phone.includes(search)

            const matchesCard =
                filterCard === 'all' ||
                (filterCard === 'stamps' && c.stampCard) ||
                (filterCard === 'membership' && c.membershipTier)

            return matchesSearch && matchesCard
        })
    }, [customers, search, filterCard])

    // Save New Customer
    const handleSaveCustomer = (e) => {
        e.preventDefault()
        if (!form.name.trim() || !form.email.trim()) {
            alert('Please provide customer name and email')
            return
        }

        const isStamp = form.cardType === 'stamp'
        const stampCardTitle = isStamp ? form.selectedCardTitle : INITIAL_STAMP_CARDS[0].title
        const membershipTitle = !isStamp ? form.selectedCardTitle : INITIAL_MEMBERSHIP_CARDS[0].name

        const newCus = {
            id: `cus-${Date.now()}`,
            name: form.name,
            email: form.email,
            phone: form.phone || '+1 (555) 000-0000',
            avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120',
            stampCard: stampCardTitle,
            stampsCollected: 1,
            stampsTotal: 8,
            membershipTier: membershipTitle,
            tierBadge: isStamp ? 'Standard' : 'VIP Member',
            totalVisits: 1,
            lifetimeSpend: '$35.00',
            joinedDate: new Date().toISOString().split('T')[0],
            status: form.status,
            branchVisited: 'FirstLoop Flagship Hub - Downtown',
            heldCards: [
                isStamp ? {
                    id: `sc-${Date.now()}`,
                    type: 'stamp',
                    title: stampCardTitle,
                    brandName: 'FirstLoop Flagship Hub',
                    collected: 1,
                    total: 8,
                    reward: 'Free Gourmet Beverage',
                    status: 'Active',
                    qrCode: qrImg
                } : {
                    id: `mc-${Date.now()}`,
                    type: 'membership',
                    title: membershipTitle,
                    tier: 'VIP',
                    validThru: '12/26',
                    expiryDate: '31 Dec 2026',
                    status: 'Active',
                    qrCode: qrImg
                }
            ],
            heldStampCards: [
                {
                    title: stampCardTitle,
                    collected: 1,
                    total: 8,
                    reward: 'Free Gourmet Beverage',
                    usageStatus: '1 of 8 stamps collected — scan QR code on visit!'
                }
            ],
            heldMemberships: [
                {
                    name: membershipTitle,
                    tier: 'VIP',
                    validThru: '12/26',
                    expiryDate: '31 Dec 2026',
                    expiryNotice: 'Active',
                    status: 'Active'
                }
            ]
        }

        setCustomers(prev => [newCus, ...prev])
        setAddModalOpen(false)

        // Automatically open the enrolled digital pass card preview modal right after enrolling!
        setEnrolledCardModal({
            customer: newCus,
            cardType: form.cardType,
            cardTitle: form.selectedCardTitle
        })

        // Reset form
        setForm({
            name: '',
            email: '',
            phone: '',
            cardType: 'stamp',
            selectedCardTitle: INITIAL_STAMP_CARDS[0].title,
            status: 'Active'
        })
    }

    // Assign Additional Card Pass to Existing Customer
    const handleAssignAdditionalCard = (e) => {
        e.preventDefault()
        if (!addCardModalCustomer) return

        const isStamp = newCardForm.cardType === 'stamp'
        const cardTitle = newCardForm.selectedCardTitle

        const newCardObj = isStamp ? {
            id: `sc-${Date.now()}`,
            type: 'stamp',
            title: cardTitle,
            brandName: 'FirstLoop Flagship Hub',
            collected: 1,
            total: 8,
            reward: 'Free Gourmet Beverage / Reward Pass',
            status: 'Active',
            qrCode: qrImg
        } : {
            id: `mc-${Date.now()}`,
            type: 'membership',
            title: cardTitle,
            tier: 'VIP',
            validThru: '12/26',
            expiryDate: '31 Dec 2026',
            status: 'Active',
            qrCode: qrImg
        }

        setCustomers(prev => prev.map(c => {
            if (c.id === addCardModalCustomer.id) {
                const existingHeld = c.heldCards || []
                const updatedHeld = [...existingHeld, newCardObj]

                const updatedStampCards = isStamp
                    ? [...(c.heldStampCards || []), { title: cardTitle, collected: 1, total: 8, reward: 'Free Beverage', usageStatus: '1 of 8 stamps collected' }]
                    : (c.heldStampCards || [])

                const updatedMemberships = !isStamp
                    ? [...(c.heldMemberships || []), { name: cardTitle, tier: 'VIP', validThru: '12/26', expiryDate: '31 Dec 2026', expiryNotice: 'Active' }]
                    : (c.heldMemberships || [])

                return {
                    ...c,
                    stampCard: isStamp ? cardTitle : c.stampCard,
                    membershipTier: !isStamp ? cardTitle : c.membershipTier,
                    heldCards: updatedHeld,
                    heldStampCards: updatedStampCards,
                    heldMemberships: updatedMemberships
                }
            }
            return c
        }))

        const updatedCustomer = {
            ...addCardModalCustomer,
            stampCard: isStamp ? cardTitle : addCardModalCustomer.stampCard,
            membershipTier: !isStamp ? cardTitle : addCardModalCustomer.membershipTier,
            heldCards: [...(addCardModalCustomer.heldCards || []), newCardObj]
        }

        setAddCardModalCustomer(null)

        // Show pass preview modal
        setEnrolledCardModal({
            customer: updatedCustomer,
            cardType: newCardForm.cardType,
            cardTitle: cardTitle
        })
    }

    const handleDeleteCustomer = (id) => {
        if (window.confirm('Are you sure you want to remove this customer record?')) {
            setCustomers(prev => prev.filter(c => c.id !== id))
        }
    }

    return (
        <div style={{ paddingBottom: 40 }}>
            {/* Header */}
            <div className="flex-between mb-4" style={{ flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                        Merchant Customer Management
                    </h2>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>
                        View registered customers, assign single/multiple Stamp Cards & Membership Passes, and access full pass logs.
                    </p>
                </div>

                <button
                    type="button"
                    className="btn firstloop-btn-primary"
                    onClick={() => setAddModalOpen(true)}
                    style={{ padding: '10px 18px', borderRadius: 10, display: 'inline-flex', alignItems: 'center', gap: 8 }}
                >
                    <i className="fas fa-user-plus" />
                    <span>+ Enroll New Customer</span>
                </button>
            </div>

            {/* Filter Bar */}
            <div className="card mb-4" style={{ padding: 16, borderRadius: 14 }}>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ position: 'relative', width: 320 }}>
                        <i className="fas fa-search" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Search by customer name, email or phone..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ paddingLeft: 40, height: 40, borderRadius: 10, fontSize: '0.85rem' }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <small style={{ fontWeight: 700, color: 'var(--text-muted)' }}>Filter Card Type:</small>
                        <select
                            className="form-select"
                            value={filterCard}
                            onChange={(e) => setFilterCard(e.target.value)}
                            style={{ height: 40, borderRadius: 10, fontSize: '0.85rem', minWidth: 160 }}
                        >
                            <option value="all">All Card Types</option>
                            <option value="stamps">Stamp Cards</option>
                            <option value="membership">Membership Tiers</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Customer List Data Table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden', borderRadius: 16, border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                            <tr>
                                <th style={{ padding: '14px 18px', fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Customer Info</th>
                                <th style={{ padding: '14px 18px', fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Contact Details</th>
                                <th style={{ padding: '14px 18px', fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Assigned Stamp Cards</th>
                                <th style={{ padding: '14px 18px', fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Membership Tiers</th>
                                <th style={{ padding: '14px 18px', fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Visits</th>
                                <th style={{ padding: '14px 18px', fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCustomers.map((cus) => (
                                <tr key={cus.id}>
                                    <td style={{ padding: '14px 18px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <img
                                                src={cus.avatar}
                                                alt={cus.name}
                                                style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--firstloop-primary)' }}
                                            />
                                            <div>
                                                <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)', display: 'block' }}>{cus.name}</strong>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Joined: {cus.joinedDate}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '14px 18px' }}>
                                        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                                            <div><i className="fas fa-envelope" style={{ marginRight: 6, color: 'var(--firstloop-primary)' }} />{cus.email}</div>
                                            <div><i className="fas fa-phone" style={{ marginRight: 6, color: 'var(--firstloop-primary)' }} />{cus.phone}</div>
                                        </div>
                                    </td>

                                    {/* Multiple Stamp Cards Display */}
                                    <td style={{ padding: '14px 18px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                            {cus.heldStampCards && cus.heldStampCards.length > 0 ? (
                                                cus.heldStampCards.map((sc, idx) => (
                                                    <span key={idx} className="badge" style={{ background: 'var(--firstloop-primary-light)', color: 'var(--firstloop-primary)', fontWeight: 700, padding: '5px 8px', borderRadius: 6, fontSize: '0.74rem' }}>
                                                        <i className="fas fa-stamp" style={{ marginRight: 4 }} />
                                                        {sc.title}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="badge" style={{ background: 'var(--firstloop-primary-light)', color: 'var(--firstloop-primary)', fontWeight: 700, padding: '5px 8px', borderRadius: 6, fontSize: '0.74rem' }}>
                                                    <i className="fas fa-stamp" style={{ marginRight: 4 }} />
                                                    {cus.stampCard || 'Standard Pass'}
                                                </span>
                                            )}
                                        </div>
                                    </td>

                                    {/* Multiple Membership Tiers Display */}
                                    <td style={{ padding: '14px 18px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                            {cus.heldMemberships && cus.heldMemberships.length > 0 ? (
                                                cus.heldMemberships.map((mc, idx) => (
                                                    <span key={idx} className="badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#D97706', fontWeight: 700, padding: '5px 8px', borderRadius: 6, fontSize: '0.74rem' }}>
                                                        <i className="fas fa-crown" style={{ marginRight: 4 }} />
                                                        {mc.name} ({mc.validThru || 'Active'})
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#D97706', fontWeight: 700, padding: '5px 8px', borderRadius: 6, fontSize: '0.74rem' }}>
                                                    <i className="fas fa-crown" style={{ marginRight: 4 }} />
                                                    {cus.membershipTier || 'Gold Member'}
                                                </span>
                                            )}
                                        </div>
                                    </td>

                                    <td style={{ fontWeight: 700, padding: '14px 18px' }}>{cus.totalVisits} Visits</td>

                                    <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                            {/* ADD ANOTHER CARD BUTTON */}
                                            <button
                                                type="button"
                                                className="btn firstloop-btn-secondary btn-sm"
                                                onClick={() => {
                                                    setNewCardForm({
                                                        cardType: 'stamp',
                                                        selectedCardTitle: INITIAL_STAMP_CARDS[0].title
                                                    })
                                                    setAddCardModalCustomer(cus)
                                                }}
                                                style={{ padding: '6px 10px', fontSize: '0.76rem', borderRadius: 8, fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                                title="Assign another Stamp or Membership card to this customer"
                                            >
                                                <i className="fas fa-plus-circle" />
                                                <span>+ Add Card</span>
                                            </button>

                                            <button
                                                type="button"
                                                className="btn btn-sm"
                                                onClick={() => navigate(`/merchant/customers/${cus.id}`)}
                                                style={{ background: 'var(--firstloop-primary-light)', color: 'var(--firstloop-primary)', fontWeight: 700, borderRadius: 8, fontSize: '0.76rem', padding: '6px 10px' }}
                                            >
                                                <i className="fas fa-user-circle" style={{ marginRight: 4 }} />
                                                View Profile
                                            </button>

                                            <button
                                                type="button"
                                                className="btn btn-sm"
                                                onClick={() => handleDeleteCustomer(cus.id)}
                                                style={{ background: 'var(--status-danger-bg)', color: 'var(--status-danger)', borderRadius: 8, fontSize: '0.76rem', padding: '6px 8px' }}
                                            >
                                                <i className="fas fa-trash-alt" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ASSIGN ANOTHER CARD PASS MODAL TO EXISTING CUSTOMER */}
            {addCardModalCustomer && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(6px)', zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                    <div style={{ width: '100%', maxWidth: 480, background: '#FFFFFF', borderRadius: 22, padding: 26, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)', position: 'relative' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--firstloop-primary-light)', color: 'var(--firstloop-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', fontWeight: 800 }}>
                                    <i className="fas fa-plus-circle" />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                                        Add Another Card Pass
                                    </h3>
                                    <small style={{ color: 'var(--text-muted)' }}>
                                        Assign an additional card to <strong>{addCardModalCustomer.name}</strong>
                                    </small>
                                </div>
                            </div>
                            <button type="button" onClick={() => setAddCardModalCustomer(null)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', color: 'var(--text-muted)', cursor: 'pointer' }}>&times;</button>
                        </div>

                        <form onSubmit={handleAssignAdditionalCard}>
                            {/* SELECT CARD TYPE */}
                            <div className="form-group mb-3">
                                <label style={{ fontSize: '0.82rem', fontWeight: 800, marginBottom: 8, display: 'block', color: 'var(--text-primary)' }}>
                                    Select Additional Card Type to Issue:
                                </label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                    <div
                                        onClick={() => setNewCardForm({
                                            ...newCardForm,
                                            cardType: 'stamp',
                                            selectedCardTitle: INITIAL_STAMP_CARDS[0].title
                                        })}
                                        style={{
                                            padding: 12,
                                            borderRadius: 12,
                                            border: newCardForm.cardType === 'stamp' ? '2px solid var(--firstloop-primary)' : '1px solid #E2E8F0',
                                            background: newCardForm.cardType === 'stamp' ? 'var(--firstloop-primary-light)' : '#F8FAFC',
                                            color: newCardForm.cardType === 'stamp' ? 'var(--firstloop-primary)' : 'var(--text-secondary)',
                                            cursor: 'pointer',
                                            textAlign: 'center',
                                            fontWeight: 800,
                                            fontSize: '0.85rem'
                                        }}
                                    >
                                        <i className="fas fa-stamp" style={{ display: 'block', marginBottom: 4 }} />
                                        Stamp Card Pass
                                    </div>

                                    <div
                                        onClick={() => setNewCardForm({
                                            ...newCardForm,
                                            cardType: 'membership',
                                            selectedCardTitle: INITIAL_MEMBERSHIP_CARDS[0].name
                                        })}
                                        style={{
                                            padding: 12,
                                            borderRadius: 12,
                                            border: newCardForm.cardType === 'membership' ? '2px solid #D97706' : '1px solid #E2E8F0',
                                            background: newCardForm.cardType === 'membership' ? 'rgba(245, 158, 11, 0.12)' : '#F8FAFC',
                                            color: newCardForm.cardType === 'membership' ? '#D97706' : 'var(--text-secondary)',
                                            cursor: 'pointer',
                                            textAlign: 'center',
                                            fontWeight: 800,
                                            fontSize: '0.85rem'
                                        }}
                                    >
                                        <i className="fas fa-crown" style={{ display: 'block', marginBottom: 4 }} />
                                        Membership Card
                                    </div>
                                </div>
                            </div>

                            {/* DYNAMIC CARD SELECTION DROPDOWN */}
                            <div className="form-group mb-4">
                                <label style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: 4, display: 'block' }}>
                                    {newCardForm.cardType === 'stamp' ? 'Select Stamp Card Pass' : 'Select Membership Tier'}
                                </label>
                                {newCardForm.cardType === 'stamp' ? (
                                    <select
                                        className="form-select"
                                        value={newCardForm.selectedCardTitle}
                                        onChange={(e) => setNewCardForm({ ...newCardForm, selectedCardTitle: e.target.value })}
                                        style={{ height: 42, borderRadius: 8, fontSize: '0.85rem' }}
                                    >
                                        {INITIAL_STAMP_CARDS.map(sc => (
                                            <option key={sc.id} value={sc.title}>
                                                {sc.title} ({sc.total_stamps} Stamps • {sc.reward})
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <select
                                        className="form-select"
                                        value={newCardForm.selectedCardTitle}
                                        onChange={(e) => setNewCardForm({ ...newCardForm, selectedCardTitle: e.target.value })}
                                        style={{ height: 42, borderRadius: 8, fontSize: '0.85rem' }}
                                    >
                                        {INITIAL_MEMBERSHIP_CARDS.map(mc => (
                                            <option key={mc.id} value={mc.name}>
                                                {mc.name} ({mc.validityMonths} Months • {mc.tier} Tier)
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            <button type="submit" className="btn firstloop-btn-primary" style={{ width: '100%', height: 44, borderRadius: 10, fontWeight: 800, fontSize: '0.9rem' }}>
                                Assign Additional Card & Issue Pass
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* ENROLL NEW CUSTOMER MODAL WITH CARD TYPE SELECTOR */}
            {addModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(6px)', zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                    <div style={{ width: '100%', maxWidth: 480, background: '#FFFFFF', borderRadius: 22, padding: 26, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)', position: 'relative' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--firstloop-primary-light)', color: 'var(--firstloop-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', fontWeight: 800 }}>
                                    <i className="fas fa-user-plus" />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Enroll New Customer</h3>
                                    <small style={{ color: 'var(--text-muted)' }}>Assign a Stamp Card or Membership Pass to the customer.</small>
                                </div>
                            </div>
                            <button type="button" onClick={() => setAddModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', color: 'var(--text-muted)', cursor: 'pointer' }}>&times;</button>
                        </div>

                        <form onSubmit={handleSaveCustomer}>
                            <div className="form-group mb-3">
                                <label style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: 4, display: 'block' }}>Full Name</label>
                                <input type="text" className="form-control" placeholder="e.g. Sophia Reynolds" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required style={{ height: 42, borderRadius: 8 }} />
                            </div>

                            <div className="form-group mb-3">
                                <label style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: 4, display: 'block' }}>Email Address</label>
                                <input type="email" className="form-control" placeholder="sophia@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required style={{ height: 42, borderRadius: 8 }} />
                            </div>

                            <div className="form-group mb-3">
                                <label style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: 4, display: 'block' }}>Phone Number</label>
                                <input type="text" className="form-control" placeholder="+1 (555) 234-5678" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={{ height: 42, borderRadius: 8 }} />
                            </div>

                            {/* SELECT CARD TYPE: STAMP CARD vs MEMBERSHIP CARD */}
                            <div className="form-group mb-3">
                                <label style={{ fontSize: '0.82rem', fontWeight: 800, marginBottom: 8, display: 'block', color: 'var(--text-primary)' }}>
                                    Select Initial Card Type to Issue:
                                </label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                    <div
                                        onClick={() => setForm({
                                            ...form,
                                            cardType: 'stamp',
                                            selectedCardTitle: INITIAL_STAMP_CARDS[0].title
                                        })}
                                        style={{
                                            padding: 12,
                                            borderRadius: 12,
                                            border: form.cardType === 'stamp' ? '2px solid var(--firstloop-primary)' : '1px solid #E2E8F0',
                                            background: form.cardType === 'stamp' ? 'var(--firstloop-primary-light)' : '#F8FAFC',
                                            color: form.cardType === 'stamp' ? 'var(--firstloop-primary)' : 'var(--text-secondary)',
                                            cursor: 'pointer',
                                            textAlign: 'center',
                                            fontWeight: 800,
                                            fontSize: '0.85rem',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        <i className="fas fa-stamp" style={{ fontSize: '1.2rem', display: 'block', marginBottom: 4 }} />
                                        Stamp Card Pass
                                    </div>

                                    <div
                                        onClick={() => setForm({
                                            ...form,
                                            cardType: 'membership',
                                            selectedCardTitle: INITIAL_MEMBERSHIP_CARDS[0].name
                                        })}
                                        style={{
                                            padding: 12,
                                            borderRadius: 12,
                                            border: form.cardType === 'membership' ? '2px solid #D97706' : '1px solid #E2E8F0',
                                            background: form.cardType === 'membership' ? 'rgba(245, 158, 11, 0.12)' : '#F8FAFC',
                                            color: form.cardType === 'membership' ? '#D97706' : 'var(--text-secondary)',
                                            cursor: 'pointer',
                                            textAlign: 'center',
                                            fontWeight: 800,
                                            fontSize: '0.85rem',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        <i className="fas fa-crown" style={{ fontSize: '1.2rem', display: 'block', marginBottom: 4 }} />
                                        Membership Card
                                    </div>
                                </div>
                            </div>

                            {/* DYNAMIC CARD SELECTION DROPDOWN */}
                            <div className="form-group mb-4">
                                <label style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: 4, display: 'block' }}>
                                    {form.cardType === 'stamp' ? 'Select Stamp Card Pass' : 'Select Membership Tier'}
                                </label>
                                {form.cardType === 'stamp' ? (
                                    <select
                                        className="form-select"
                                        value={form.selectedCardTitle}
                                        onChange={(e) => setForm({ ...form, selectedCardTitle: e.target.value })}
                                        style={{ height: 42, borderRadius: 8, fontSize: '0.85rem' }}
                                    >
                                        {INITIAL_STAMP_CARDS.map(sc => (
                                            <option key={sc.id} value={sc.title}>
                                                {sc.title} ({sc.total_stamps} Stamps • {sc.reward})
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <select
                                        className="form-select"
                                        value={form.selectedCardTitle}
                                        onChange={(e) => setForm({ ...form, selectedCardTitle: e.target.value })}
                                        style={{ height: 42, borderRadius: 8, fontSize: '0.85rem' }}
                                    >
                                        {INITIAL_MEMBERSHIP_CARDS.map(mc => (
                                            <option key={mc.id} value={mc.name}>
                                                {mc.name} ({mc.validityMonths} Months • {mc.tier} Tier)
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            <button type="submit" className="btn firstloop-btn-primary" style={{ width: '100%', height: 44, borderRadius: 10, fontWeight: 800, fontSize: '0.9rem' }}>
                                Save & Issue Digital Pass Card
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* AUTOMATICALLY SHOW ENROLLED CUSTOMER'S DIGITAL CARD MODAL */}
            {enrolledCardModal && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(15, 23, 42, 0.8)',
                        backdropFilter: 'blur(6px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 9999,
                        padding: 20
                    }}
                >
                    <div style={{ background: '#FFFFFF', borderRadius: 22, maxWidth: 460, width: '100%', padding: 24, boxShadow: '0 25px 50px rgba(0,0,0,0.3)', position: 'relative' }}>
                        <button
                            type="button"
                            onClick={() => setEnrolledCardModal(null)}
                            style={{ position: 'absolute', right: 16, top: 16, background: 'none', border: 'none', fontSize: '1.2rem', color: 'var(--text-muted)', cursor: 'pointer' }}
                        >
                            &times;
                        </button>

                        <div style={{ textAlign: 'center', marginBottom: 16 }}>
                            <span className="badge" style={{ background: '#10B981', color: '#FFF', fontWeight: 800, padding: '5px 12px', borderRadius: 10, fontSize: '0.78rem' }}>
                                <i className="fas fa-check-circle" style={{ marginRight: 6 }} />
                                Pass Card Successfully Issued!
                            </span>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: 8, margin: 0, color: 'var(--text-primary)' }}>
                                {enrolledCardModal.customer.name}'s Pass
                            </h3>
                            <small style={{ color: 'var(--text-muted)' }}>
                                Digital Pass generated & assigned for {enrolledCardModal.customer.email}
                            </small>
                        </div>

                        {/* DIGITAL CARD CANVAS */}
                        <div
                            style={{
                                width: '100%',
                                borderRadius: 20,
                                background: enrolledCardModal.cardType === 'membership' ? '#1E293B' : '#0E88B8',
                                color: '#FFFFFF',
                                padding: 20,
                                boxShadow: '0 14px 30px -6px rgba(0,0,0,0.25)',
                                border: '2px solid rgba(255,255,255,0.4)',
                                minHeight: 210
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div style={{ width: 28, height: 28, borderRadius: 8, background: '#FFF', padding: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <img src={flLogo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                    </div>
                                    <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#FFF' }}>
                                        FirstLoop Outlets
                                    </span>
                                </div>
                                <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '3px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.2)', color: '#FFF' }}>
                                    {enrolledCardModal.cardType === 'membership' ? 'MEMBERSHIP PASS' : 'STAMP PASS'}
                                </span>
                            </div>

                            <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 10 }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFF' }}>
                                        {enrolledCardModal.cardTitle}
                                    </div>
                                    <div style={{ fontSize: '0.82rem', opacity: 0.9, marginTop: 4, fontWeight: 700 }}>
                                        Holder: {enrolledCardModal.customer.name}
                                    </div>

                                    <div style={{ marginTop: 12, borderTop: '1px solid rgba(255,255,255,0.25)', paddingTop: 8 }}>
                                        <small style={{ fontSize: '0.65rem', textTransform: 'uppercase', opacity: 0.85 }}>Valid Thru / Stamps</small>
                                        <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#FFF' }}>
                                            {enrolledCardModal.cardType === 'membership' ? '12 Months' : '8 Stamps Pass'}
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                                    <RealQRCode size={90} />
                                    <small style={{ fontSize: '0.6rem', fontWeight: 800, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        SCAN TO STAMP
                                    </small>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 4, fontSize: '0.65rem', opacity: 0.9, marginTop: 8, fontWeight: 700 }}>
                                <span>powered by</span>
                                <img src={flLogo} alt="FirstLoop" style={{ height: 12 }} />
                                <span>firstloop.co.in</span>
                            </div>
                        </div>

                        {/* WhatsApp Share & Download Buttons */}
                        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                            <a
                                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Hello ${enrolledCardModal.customer.name}! Here is your digital ${enrolledCardModal.cardTitle} pass: ${window.location.href}`)}`}
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
                                    fontSize: '0.82rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 6,
                                    textDecoration: 'none'
                                }}
                            >
                                <i className="fab fa-whatsapp" style={{ fontSize: '1.1rem' }} />
                                <span>Share to WhatsApp</span>
                            </a>

                            <button
                                type="button"
                                onClick={() => {
                                    const fileName = (enrolledCardModal.cardTitle || 'enrolled-pass').toLowerCase().replace(/\s+/g, '-')
                                    const link = document.createElement('a')
                                    link.href = qrImg
                                    link.download = `${fileName}-pass.png`
                                    document.body.appendChild(link)
                                    link.click()
                                    document.body.removeChild(link)
                                    alert(`Downloading digital pass for ${enrolledCardModal.customer.name}...`)
                                }}
                                className="btn firstloop-btn-primary"
                                style={{
                                    flex: 1,
                                    padding: '10px 14px',
                                    borderRadius: 10,
                                    fontWeight: 700,
                                    fontSize: '0.82rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 6
                                }}
                            >
                                <i className="fas fa-download" />
                                <span>Download Card</span>
                            </button>
                        </div>

                        {/* View Full Profile Action Button */}
                        <div style={{ marginTop: 12, textAlign: 'center' }}>
                            <button
                                type="button"
                                className="btn firstloop-btn-secondary"
                                onClick={() => {
                                    const cusId = enrolledCardModal.customer.id
                                    setEnrolledCardModal(null)
                                    navigate(`/merchant/customers/${cusId}`)
                                }}
                                style={{ width: '100%', padding: '10px', borderRadius: 10, fontWeight: 700, fontSize: '0.85rem' }}
                            >
                                View Full Customer Profile & History Log &rarr;
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
