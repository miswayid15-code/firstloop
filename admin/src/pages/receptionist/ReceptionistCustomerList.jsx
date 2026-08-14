import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { RECEPTIONIST_CUSTOMERS } from './mockReceptionistData'
import { INITIAL_STAMP_CARDS, INITIAL_MEMBERSHIP_CARDS } from '../merchant/mockMerchantData'
import qrImg from '../../assets/img/qr-img.png'

export default function ReceptionistCustomerList() {
    const navigate = useNavigate()
    const [customers, setCustomers] = useState(RECEPTIONIST_CUSTOMERS)
    const [search, setSearch] = useState('')

    // Add Additional Card Modal State
    const [addCardModalCustomer, setAddCardModalCustomer] = useState(null)
    const [newCardForm, setNewCardForm] = useState({
        cardType: 'stamp',
        selectedCardTitle: INITIAL_STAMP_CARDS[0].title
    })

    const filteredCustomers = useMemo(() => {
        return customers.filter(c =>
            c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.email.toLowerCase().includes(search.toLowerCase()) ||
            c.phone.includes(search)
        )
    }, [customers, search])

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
            reward: 'Free Beverage / Reward Pass',
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
                return {
                    ...c,
                    heldCards: [...(c.heldCards || []), newCardObj]
                }
            }
            return c
        }))

        setAddCardModalCustomer(null)
        alert(`Successfully assigned additional ${cardTitle} to ${addCardModalCustomer.name}!`)
    }

    return (
        <div style={{ paddingBottom: 40 }}>
            {/* Header */}
            <div className="flex-between mb-4" style={{ flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.45rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                        Branch Assigned Customer List
                    </h2>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>
                        Registered branch customers, multiple held loyalty cards, and quick check-in terminal launcher.
                    </p>
                </div>

                <button
                    type="button"
                    className="btn firstloop-btn-primary"
                    onClick={() => navigate('/receptionist/checkin')}
                    style={{ padding: '10px 18px', borderRadius: 10, display: 'inline-flex', alignItems: 'center', gap: 8 }}
                >
                    <i className="fas fa-qrcode" />
                    <span>Open Check-In Terminal</span>
                </button>
            </div>

            {/* Search Bar & Counter Stats */}
            <div className="card mb-4" style={{ padding: 18, borderRadius: 16, background: '#FFFFFF' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                    <div style={{ position: 'relative', width: 340 }}>
                        <i className="fas fa-search" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Search by customer name, phone or email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ paddingLeft: 40, height: 42, borderRadius: 10, fontSize: '0.88rem' }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: 12 }}>
                        <div style={{ padding: '8px 16px', background: 'var(--firstloop-primary-light)', borderRadius: 10, border: '1px solid rgba(14,136,184,0.2)', fontSize: '0.8rem', fontWeight: 700, color: 'var(--firstloop-primary)' }}>
                            <i className="fas fa-users" style={{ marginRight: 6 }} />
                            {customers.length} Branch Enrolled Customers
                        </div>
                    </div>
                </div>
            </div>

            {/* CUSTOMER LIST TABLE */}
            <div className="card" style={{ padding: 0, overflow: 'hidden', borderRadius: 16, border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                            <tr>
                                <th style={{ padding: '14px 18px', fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Customer Name</th>
                                <th style={{ padding: '14px 18px', fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Contact Info</th>
                                <th style={{ padding: '14px 18px', fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Held Loyalty Cards ({'Multiple'})</th>
                                <th style={{ padding: '14px 18px', fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Visits</th>
                                <th style={{ padding: '14px 18px', fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCustomers.length > 0 ? (
                                filteredCustomers.map((cus) => (
                                    <tr key={cus.id}>
                                        {/* Customer Name */}
                                        <td style={{ padding: '16px 18px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                <img
                                                    src={cus.avatar}
                                                    alt={cus.name}
                                                    style={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--firstloop-primary)' }}
                                                />
                                                <div>
                                                    <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)', display: 'block' }}>
                                                        {cus.name}
                                                    </strong>
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                        Joined: {cus.joinedDate}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Contact Info */}
                                        <td style={{ padding: '16px 18px' }}>
                                            <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                                <i className="fas fa-phone-alt" style={{ marginRight: 6, color: 'var(--firstloop-primary)' }} />
                                                {cus.phone}
                                            </div>
                                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                                <i className="fas fa-envelope" style={{ marginRight: 6, color: 'var(--firstloop-primary)' }} />
                                                {cus.email}
                                            </div>
                                        </td>

                                        {/* Held Loyalty Cards List */}
                                        <td style={{ padding: '16px 18px' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                {cus.heldCards.map(card => (
                                                    <div key={card.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                        {card.type === 'stamp' ? (
                                                            <span className="badge" style={{ background: 'var(--firstloop-primary-light)', color: 'var(--firstloop-primary)', fontWeight: 700, padding: '4px 8px', borderRadius: 6, fontSize: '0.75rem' }}>
                                                                <i className="fas fa-stamp" style={{ marginRight: 4 }} />
                                                                {card.title} ({card.collected}/{card.total} Stamps)
                                                            </span>
                                                        ) : (
                                                            <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#D97706', fontWeight: 700, padding: '4px 8px', borderRadius: 6, fontSize: '0.75rem' }}>
                                                                <i className="fas fa-crown" style={{ marginRight: 4 }} />
                                                                {card.title} ({card.validThru})
                                                            </span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </td>

                                        {/* Total Visits */}
                                        <td style={{ padding: '16px 18px', fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                                            {cus.totalVisits} Visits
                                        </td>

                                        {/* Actions */}
                                        <td style={{ padding: '16px 18px', textAlign: 'right' }}>
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
                                                    style={{ padding: '6px 10px', fontSize: '0.78rem', borderRadius: 8, fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                                >
                                                    <i className="fas fa-plus-circle" />
                                                    <span>+ Add Card</span>
                                                </button>

                                                <button
                                                    type="button"
                                                    className="btn firstloop-btn-primary btn-sm"
                                                    onClick={() => navigate(`/receptionist/checkin?phone=${encodeURIComponent(cus.phone)}`)}
                                                    style={{ padding: '6px 12px', borderRadius: 8, fontWeight: 700, fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                                >
                                                    <i className="fas fa-check-circle" />
                                                    <span>Check-In</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>
                                        No customers found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ASSIGN ANOTHER CARD PASS MODAL */}
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
                                Assign Additional Card Pass
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
