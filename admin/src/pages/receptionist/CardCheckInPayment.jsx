import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { RECEPTIONIST_CUSTOMERS } from './mockReceptionistData'
import { INITIAL_STAMP_CARDS, INITIAL_MEMBERSHIP_CARDS } from '../merchant/mockMerchantData'
import qrImg from '../../assets/img/qr-img.png'

export default function CardCheckInPayment() {
    const [searchParams] = useSearchParams()

    // Customers State (allows dynamically adding new customers)
    const [customerList, setCustomerList] = useState(RECEPTIONIST_CUSTOMERS)

    // Mode: 'phone' or 'qr'
    const [activeTab, setActiveTab] = useState(searchParams.get('mode') === 'qr' ? 'qr' : 'phone')

    // Search state
    const [phoneInput, setPhoneInput] = useState(searchParams.get('phone') || '')
    const [matchedCustomer, setMatchedCustomer] = useState(null)
    const [selectedCard, setSelectedCard] = useState(null)

    // Add / Enroll Customer Modal State
    const [enrollModalOpen, setEnrollModalOpen] = useState(false)
    const [enrollForm, setEnrollForm] = useState({
        name: '',
        email: '',
        phone: '',
        cardType: 'stamp',
        selectedCardTitle: INITIAL_STAMP_CARDS[0].title
    })

    // QR Modal Scanner state
    const [qrScannerOpen, setQrScannerOpen] = useState(false)
    const [qrScanningState, setQrScanningState] = useState(false)

    // Card Payment / Entry Form state
    const [paymentMethod, setPaymentMethod] = useState('Cash') // 'Cash' | 'Online'
    const [paymentAmount, setPaymentAmount] = useState('25.00')
    const [successReceiptModal, setSuccessReceiptModal] = useState(null)

    // Pre-load customer if phone is passed in URL query
    useEffect(() => {
        const initialPhone = searchParams.get('phone')
        if (initialPhone) {
            handlePhoneSearch(initialPhone)
        }
    }, [searchParams, customerList])

    // Search by Phone Number or Name logic
    const handlePhoneSearch = (phoneToSearch = phoneInput) => {
        if (!phoneToSearch.trim()) {
            setMatchedCustomer(null)
            setSelectedCard(null)
            return
        }

        const found = customerList.find(c =>
            c.phone.replace(/\D/g, '').includes(phoneToSearch.replace(/\D/g, '')) ||
            c.name.toLowerCase().includes(phoneToSearch.toLowerCase())
        )

        if (found) {
            setMatchedCustomer(found)
            // Default select first available card
            if (found.heldCards && found.heldCards.length > 0) {
                setSelectedCard(found.heldCards[0])
            }
        } else {
            setMatchedCustomer(null)
            setSelectedCard(null)
        }
    }

    // Open Enroll Customer Modal with pre-filled phone
    const handleOpenEnrollModal = () => {
        setEnrollForm({
            name: '',
            email: '',
            phone: phoneInput || '+1 (555) 000-0000',
            cardType: 'stamp',
            selectedCardTitle: INITIAL_STAMP_CARDS[0].title
        })
        setEnrollModalOpen(true)
    }

    // Save newly enrolled customer
    const handleSaveEnrolledCustomer = (e) => {
        e.preventDefault()
        if (!enrollForm.name.trim()) {
            alert('Please enter customer name')
            return
        }

        const isStamp = enrollForm.cardType === 'stamp'
        const cardTitle = enrollForm.selectedCardTitle

        const newCus = {
            id: `cus-${Date.now()}`,
            name: enrollForm.name,
            email: enrollForm.email || `${enrollForm.name.toLowerCase().replace(/\s+/g, '')}@example.com`,
            phone: enrollForm.phone || phoneInput || '+1 (555) 000-0000',
            avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120',
            joinedDate: new Date().toISOString().split('T')[0],
            totalVisits: 1,
            status: 'Active',
            heldCards: [
                isStamp ? {
                    id: `sc-${Date.now()}`,
                    type: 'stamp',
                    title: cardTitle,
                    brandName: 'FirstLoop Flagship Hub',
                    collected: 1,
                    total: 8,
                    reward: 'Free Gourmet Beverage',
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
            ]
        }

        setCustomerList(prev => [newCus, ...prev])
        setMatchedCustomer(newCus)
        setSelectedCard(newCus.heldCards[0])
        setEnrollModalOpen(false)
    }

    // QR Code Scanning Simulation
    const handleStartQRScan = () => {
        setQrScannerOpen(true)
        setQrScanningState(true)

        // Simulate camera scanning delay (1.5 seconds)
        setTimeout(() => {
            setQrScanningState(false)
            // Pick customer #1 (Sophia Reynolds with Stamp Card + Membership)
            const scannedCus = customerList[0]
            setMatchedCustomer(scannedCus)
            if (scannedCus.heldCards && scannedCus.heldCards.length > 0) {
                setSelectedCard(scannedCus.heldCards[0])
            }
            setQrScannerOpen(false)
        }, 1500)
    }

    // Handler: Save & Submit Card Payment / Entry Update
    const handleSaveEntry = (e) => {
        e.preventDefault()

        if (!matchedCustomer || !selectedCard) return

        const isStamp = selectedCard.type === 'stamp'
        const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

        const receipt = {
            receiptId: `RCP-${Date.now().toString().slice(-6)}`,
            customerName: matchedCustomer.name,
            customerPhone: matchedCustomer.phone,
            cardTitle: selectedCard.title,
            cardType: selectedCard.type,
            previousStamps: isStamp ? selectedCard.collected : undefined,
            newStamps: isStamp ? Math.min(selectedCard.total, selectedCard.collected + 1) : undefined,
            totalStamps: isStamp ? selectedCard.total : undefined,
            remainingStamps: isStamp ? Math.max(0, selectedCard.total - (selectedCard.collected + 1)) : undefined,
            paymentMethod: isStamp ? paymentMethod : 'Daily Check-In Validated',
            paymentAmount: isStamp ? `$${paymentAmount}` : '$0.00',
            time: nowTime,
            date: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
        }

        // If stamp card, update local collected count by +1
        if (isStamp) {
            selectedCard.collected = receipt.newStamps
        }

        setSuccessReceiptModal(receipt)
    }

    return (
        <div style={{ paddingBottom: 40 }}>
            {/* Header */}
            <div className="flex-between mb-4" style={{ flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.45rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                        Card Check-In & Payment Terminal
                    </h2>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>
                        Search customer phone or scan QR code to load cards and process entry updates.
                    </p>
                </div>

                {/* Mode Selector Tabs */}
                <div style={{ display: 'flex', background: '#E2E8F0', padding: 4, borderRadius: 12 }}>
                    <button
                        type="button"
                        onClick={() => setActiveTab('phone')}
                        style={{
                            padding: '8px 18px',
                            borderRadius: 10,
                            border: 'none',
                            background: activeTab === 'phone' ? '#FFFFFF' : 'transparent',
                            color: activeTab === 'phone' ? 'var(--firstloop-primary)' : 'var(--text-secondary)',
                            fontWeight: 800,
                            fontSize: '0.84rem',
                            cursor: 'pointer',
                            boxShadow: activeTab === 'phone' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6
                        }}
                    >
                        <i className="fas fa-phone-alt" />
                        <span>Search by Phone</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('qr')}
                        style={{
                            padding: '8px 18px',
                            borderRadius: 10,
                            border: 'none',
                            background: activeTab === 'qr' ? 'var(--firstloop-primary)' : 'transparent',
                            color: activeTab === 'qr' ? '#FFFFFF' : 'var(--text-secondary)',
                            fontWeight: 800,
                            fontSize: '0.84rem',
                            cursor: 'pointer',
                            boxShadow: activeTab === 'qr' ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6
                        }}
                    >
                        <i className="fas fa-qrcode" />
                        <span>QR Code Scanner</span>
                    </button>
                </div>
            </div>

            {/* TAB CONTENT: SEARCH BY PHONE vs QR CODE SCANNER */}
            <div className="card mb-4" style={{ padding: 22, borderRadius: 20, background: '#FFFFFF' }}>
                {activeTab === 'phone' ? (
                    <div>
                        <label style={{ fontSize: '0.85rem', fontWeight: 800, marginBottom: 8, display: 'block', color: 'var(--text-primary)' }}>
                            Enter Customer Phone Number or Name:
                        </label>
                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                            <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
                                <i className="fas fa-search" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="e.g. +1 (555) 234-5678 or Sophia"
                                    value={phoneInput}
                                    onChange={(e) => {
                                        setPhoneInput(e.target.value)
                                        handlePhoneSearch(e.target.value)
                                    }}
                                    style={{ paddingLeft: 40, height: 46, borderRadius: 10, fontSize: '0.92rem' }}
                                />
                            </div>

                            {/* Quick Select Preset Buttons */}
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                                <small style={{ fontWeight: 700, color: 'var(--text-muted)' }}>Quick Pick:</small>
                                {customerList.slice(0, 3).map(cus => (
                                    <button
                                        key={cus.id}
                                        type="button"
                                        className="btn btn-sm btn-light"
                                        onClick={() => {
                                            setPhoneInput(cus.phone)
                                            handlePhoneSearch(cus.phone)
                                        }}
                                        style={{ borderRadius: 8, fontWeight: 700, fontSize: '0.78rem' }}
                                    >
                                        {cus.name} ({cus.phone.slice(-4)})
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* NO CUSTOMER FOUND BANNER & ENROLL BUTTON */}
                        {!matchedCustomer && phoneInput.trim().length > 0 && (
                            <div style={{ marginTop: 18, padding: 16, borderRadius: 14, background: '#FFFBEB', border: '1px dashed #F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                                <div>
                                    <strong style={{ color: '#B45309', fontSize: '0.9rem', display: 'block' }}>
                                        No customer found for "{phoneInput}"
                                    </strong>
                                    <span style={{ fontSize: '0.8rem', color: '#D97706' }}>
                                        Click button to quickly register this customer and assign a card.
                                    </span>
                                </div>

                                <button
                                    type="button"
                                    className="btn firstloop-btn-primary"
                                    onClick={handleOpenEnrollModal}
                                    style={{ padding: '8px 16px', borderRadius: 10, fontWeight: 800, fontSize: '0.84rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                                >
                                    <i className="fas fa-user-plus" />
                                    <span>+ Enroll & Add New Customer</span>
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '16px 0' }}>
                        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--firstloop-primary-light)', color: 'var(--firstloop-primary)', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem' }}>
                            <i className="fas fa-qrcode" />
                        </div>
                        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                            Scan Customer QR Code Pass
                        </h3>
                        <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: 4, marginBottom: 16 }}>
                            Position customer's digital card QR code in front of scanner to load card details instantly.
                        </p>

                        <button
                            type="button"
                            className="btn firstloop-btn-primary"
                            onClick={handleStartQRScan}
                            style={{ padding: '12px 28px', borderRadius: 12, fontWeight: 800, fontSize: '0.92rem', display: 'inline-flex', alignItems: 'center', gap: 8 }}
                        >
                            <i className="fas fa-camera" />
                            <span>Scan QR Code Pass</span>
                        </button>
                    </div>
                )}
            </div>

            {/* MATCHED CUSTOMER & AVAILABLE CARDS DISPLAY */}
            {matchedCustomer && (
                <div className="card mb-4" style={{ padding: 22, borderRadius: 20, background: '#FFFFFF', border: '2px solid var(--firstloop-primary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 18, borderBottom: '1px solid #E2E8F0', paddingBottom: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                            <img
                                src={matchedCustomer.avatar}
                                alt={matchedCustomer.name}
                                style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--firstloop-primary)' }}
                            />
                            <div>
                                <span className="badge" style={{ background: '#10B981', color: '#FFF', fontWeight: 800, padding: '3px 8px', borderRadius: 6, fontSize: '0.7rem' }}>
                                    CUSTOMER IDENTIFIED
                                </span>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '2px 0 0 0', color: 'var(--text-primary)' }}>
                                    {matchedCustomer.name}
                                </h3>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: 14, marginTop: 2 }}>
                                    <span><i className="fas fa-phone-alt" style={{ marginRight: 4, color: 'var(--firstloop-primary)' }} />{matchedCustomer.phone}</span>
                                    <span><i className="fas fa-envelope" style={{ marginRight: 4, color: 'var(--firstloop-primary)' }} />{matchedCustomer.email}</span>
                                </div>
                            </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block' }}>Branch Visits</span>
                            <strong style={{ fontSize: '1.1rem', color: 'var(--text-primary)', fontWeight: 800 }}>{matchedCustomer.totalVisits} Visits Logged</strong>
                        </div>
                    </div>

                    {/* SELECT AVAILABLE HELD CARDS */}
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: 12, color: 'var(--text-primary)' }}>
                        Select Card Pass to Update:
                    </h4>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                        {matchedCustomer.heldCards.map(card => {
                            const isSelected = selectedCard?.id === card.id
                            const isStamp = card.type === 'stamp'
                            const remainingStamps = Math.max(0, card.total - card.collected)

                            return (
                                <div
                                    key={card.id}
                                    onClick={() => setSelectedCard(card)}
                                    style={{
                                        padding: 16,
                                        borderRadius: 16,
                                        border: isSelected ? '2px solid var(--firstloop-primary)' : '1px solid #E2E8F0',
                                        background: isSelected ? 'var(--firstloop-primary-light)' : '#F8FAFC',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        boxShadow: isSelected ? '0 8px 20px -4px rgba(14,136,184,0.2)' : 'none'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                        <span
                                            style={{
                                                fontSize: '0.7rem',
                                                fontWeight: 800,
                                                padding: '3px 8px',
                                                borderRadius: 6,
                                                background: isStamp ? 'var(--firstloop-primary)' : '#D97706',
                                                color: '#FFFFFF'
                                            }}
                                        >
                                            {isStamp ? 'STAMP CARD' : 'MEMBERSHIP CARD'}
                                        </span>
                                        {isSelected && <i className="fas fa-check-circle" style={{ color: 'var(--firstloop-primary)', fontSize: '1.1rem' }} />}
                                    </div>

                                    <h5 style={{ fontSize: '1rem', fontWeight: 800, margin: '4px 0', color: 'var(--text-primary)' }}>
                                        {card.title}
                                    </h5>

                                    {/* MENTION STAMP CARD AS REMAINING STAMPS & MEMBERSHIP CARD AS 1 MONTH TO EXPIRE */}
                                    {isStamp ? (
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 6 }}>
                                            Remaining: <strong style={{ color: 'var(--firstloop-primary)', fontWeight: 800 }}>{remainingStamps} stamps remaining</strong>
                                            <div style={{ fontSize: '0.75rem', color: '#059669', marginTop: 4, fontWeight: 700 }}>
                                                Reward: {card.reward}
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 6 }}>
                                            Status: <strong style={{ color: '#D97706', fontWeight: 800 }}>1 month to expire</strong>
                                            <div style={{ fontSize: '0.75rem', color: '#D97706', marginTop: 4, fontWeight: 700 }}>
                                                Tier: {card.tier} Status Active (Valid Thru: {card.validThru})
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* UNIFIED CARD PAYMENT / UPDATE ENTRY PANEL */}
            {matchedCustomer && selectedCard && (
                <div
                    className="card"
                    style={{
                        padding: 24,
                        borderRadius: 22,
                        background: '#FFFFFF',
                        border: '2px solid #1E293B',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, borderBottom: '1px solid #E2E8F0', paddingBottom: 16 }}>
                        <div
                            style={{
                                width: 44,
                                height: 44,
                                borderRadius: 12,
                                background: selectedCard.type === 'stamp' ? 'var(--firstloop-primary)' : '#D97706',
                                color: '#FFFFFF',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.2rem',
                                fontWeight: 800
                            }}
                        >
                            <i className={selectedCard.type === 'stamp' ? 'fas fa-stamp' : 'fas fa-crown'} />
                        </div>
                        <div>
                            <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 800, color: 'var(--text-muted)' }}>
                                CARD ENTRY & PAYMENT TERMINAL
                            </span>
                            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '2px 0 0 0', color: 'var(--text-primary)' }}>
                                {selectedCard.type === 'stamp' ? 'Stamp Card Payment & Entry Update' : 'Membership Daily Check-In Entry'}
                            </h3>
                        </div>
                    </div>

                    <form onSubmit={handleSaveEntry}>
                        {/* CONDITIONAL CONTENT: STAMP CARD vs MEMBERSHIP CARD */}
                        {selectedCard.type === 'stamp' ? (
                            <div>
                                {/* Current Stamp Progress & Remaining Stamps Display */}
                                <div style={{ background: '#F8FAFC', borderRadius: 16, padding: 18, border: '1px solid #E2E8F0', marginBottom: 20 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                        <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                                            Current Stamp Pass Progress:
                                        </span>
                                        <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--firstloop-primary)' }}>
                                            {selectedCard.total - selectedCard.collected} Stamps Remaining ({selectedCard.collected}/{selectedCard.total} collected)
                                        </span>
                                    </div>

                                    {/* Visual Stamp Circles */}
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
                                        {Array.from({ length: selectedCard.total }).map((_, idx) => (
                                            <div
                                                key={idx}
                                                style={{
                                                    width: 38,
                                                    height: 38,
                                                    borderRadius: '50%',
                                                    background: idx < selectedCard.collected ? 'var(--firstloop-gradient-primary)' : '#FFFFFF',
                                                    color: idx < selectedCard.collected ? '#FFFFFF' : '#94A3B8',
                                                    border: idx < selectedCard.collected ? 'none' : '2px dashed #CBD5E1',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontWeight: 800,
                                                    fontSize: '0.85rem'
                                                }}
                                            >
                                                {idx < selectedCard.collected ? <i className="fas fa-check" /> : idx + 1}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Payment Method Selector: Cash vs Online */}
                                <div className="form-group mb-4">
                                    <label style={{ fontSize: '0.85rem', fontWeight: 800, marginBottom: 8, display: 'block', color: 'var(--text-primary)' }}>
                                        Select Payment Method:
                                    </label>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                                        <div
                                            onClick={() => setPaymentMethod('Cash')}
                                            style={{
                                                padding: 14,
                                                borderRadius: 14,
                                                border: paymentMethod === 'Cash' ? '2px solid #059669' : '1px solid #E2E8F0',
                                                background: paymentMethod === 'Cash' ? 'rgba(16, 185, 129, 0.12)' : '#F8FAFC',
                                                color: paymentMethod === 'Cash' ? '#059669' : 'var(--text-secondary)',
                                                cursor: 'pointer',
                                                fontWeight: 800,
                                                textAlign: 'center',
                                                fontSize: '0.9rem',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: 8
                                            }}
                                        >
                                            <i className="fas fa-money-bill-wave" style={{ fontSize: '1.2rem' }} />
                                            <span>Cash Payment</span>
                                        </div>

                                        <div
                                            onClick={() => setPaymentMethod('Online')}
                                            style={{
                                                padding: 14,
                                                borderRadius: 14,
                                                border: paymentMethod === 'Online' ? '2px solid #0284C7' : '1px solid #E2E8F0',
                                                background: paymentMethod === 'Online' ? 'rgba(2, 132, 199, 0.12)' : '#F8FAFC',
                                                color: paymentMethod === 'Online' ? '#0284C7' : 'var(--text-secondary)',
                                                cursor: 'pointer',
                                                fontWeight: 800,
                                                textAlign: 'center',
                                                fontSize: '0.9rem',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: 8
                                            }}
                                        >
                                            <i className="fas fa-credit-card" style={{ fontSize: '1.2rem' }} />
                                            <span>Online (UPI / Card)</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Amount Input */}
                                <div className="form-group mb-4">
                                    <label style={{ fontSize: '0.85rem', fontWeight: 800, marginBottom: 4, display: 'block', color: 'var(--text-primary)' }}>
                                        Transaction Payment Amount ($)
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={paymentAmount}
                                        onChange={(e) => setPaymentAmount(e.target.value)}
                                        placeholder="25.00"
                                        required
                                        style={{ height: 44, borderRadius: 10, fontWeight: 700 }}
                                    />
                                </div>
                            </div>
                        ) : (
                            /* MEMBERSHIP CARD FLOW */
                            <div>
                                <div style={{ background: 'rgba(245, 158, 11, 0.08)', borderRadius: 16, padding: 20, border: '1px solid rgba(245, 158, 11, 0.3)', marginBottom: 20 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#B45309', fontWeight: 800 }}>
                                                MEMBERSHIP STATUS: 1 MONTH TO EXPIRE
                                            </span>
                                            <h4 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '2px 0 0 0', color: '#D97706' }}>
                                                {selectedCard.title} ({selectedCard.tier} Tier)
                                            </h4>
                                            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 4, marginBottom: 0 }}>
                                                Expiration Status: <strong style={{ color: '#D97706' }}>1 month to expire</strong> (Valid Thru: {selectedCard.validThru})
                                            </p>
                                        </div>

                                        <span className="badge" style={{ background: '#D97706', color: '#FFF', padding: '6px 14px', borderRadius: 10, fontWeight: 800, fontSize: '0.8rem' }}>
                                            <i className="fas fa-crown" style={{ marginRight: 6 }} /> VIP Member
                                        </span>
                                    </div>
                                </div>

                                <div style={{ padding: 16, background: '#F8FAFC', borderRadius: 14, border: '1px solid #E2E8F0', marginBottom: 20 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div style={{ width: 36, height: 36, borderRadius: 10, background: '#10B981', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <i className="fas fa-calendar-check" />
                                        </div>
                                        <div>
                                            <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)', display: 'block' }}>
                                                Logging Current Day's Visit Check-In
                                            </strong>
                                            <small style={{ color: 'var(--text-muted)' }}>
                                                Check-In Date: <strong>Today ({new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })})</strong> • Timestamp logged automatically.
                                            </small>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            className="btn firstloop-btn-primary"
                            style={{
                                width: '100%',
                                height: 48,
                                borderRadius: 12,
                                fontWeight: 800,
                                fontSize: '0.95rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 8
                            }}
                        >
                            <i className="fas fa-check-circle" />
                            <span>{selectedCard.type === 'stamp' ? 'Save Card Entry & Generate Payment Receipt' : "Save Today's Check-In Entry"}</span>
                        </button>
                    </form>
                </div>
            )}

            {/* ENROLL NEW CUSTOMER POPUP MODAL */}
            {enrollModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(6px)', zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                    <div style={{ width: '100%', maxWidth: 480, background: '#FFFFFF', borderRadius: 22, padding: 26, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)', position: 'relative' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--firstloop-primary-light)', color: 'var(--firstloop-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', fontWeight: 800 }}>
                                    <i className="fas fa-user-plus" />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Enroll New Customer</h3>
                                    <small style={{ color: 'var(--text-muted)' }}>Quick register customer & issue initial pass card.</small>
                                </div>
                            </div>
                            <button type="button" onClick={() => setEnrollModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', color: 'var(--text-muted)', cursor: 'pointer' }}>&times;</button>
                        </div>

                        <form onSubmit={handleSaveEnrolledCustomer}>
                            <div className="form-group mb-3">
                                <label style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: 4, display: 'block' }}>Full Name</label>
                                <input type="text" className="form-control" placeholder="e.g. Chloe Adams" value={enrollForm.name} onChange={(e) => setEnrollForm({ ...enrollForm, name: e.target.value })} required style={{ height: 42, borderRadius: 8 }} />
                            </div>

                            <div className="form-group mb-3">
                                <label style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: 4, display: 'block' }}>Phone Number</label>
                                <input type="text" className="form-control" value={enrollForm.phone} onChange={(e) => setEnrollForm({ ...enrollForm, phone: e.target.value })} required style={{ height: 42, borderRadius: 8 }} />
                            </div>

                            <div className="form-group mb-3">
                                <label style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: 4, display: 'block' }}>Email Address</label>
                                <input type="email" className="form-control" placeholder="chloe@example.com" value={enrollForm.email} onChange={(e) => setEnrollForm({ ...enrollForm, email: e.target.value })} style={{ height: 42, borderRadius: 8 }} />
                            </div>

                            {/* SELECT CARD TYPE */}
                            <div className="form-group mb-3">
                                <label style={{ fontSize: '0.82rem', fontWeight: 800, marginBottom: 8, display: 'block', color: 'var(--text-primary)' }}>
                                    Select Initial Card Pass to Issue:
                                </label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                    <div
                                        onClick={() => setEnrollForm({
                                            ...enrollForm,
                                            cardType: 'stamp',
                                            selectedCardTitle: INITIAL_STAMP_CARDS[0].title
                                        })}
                                        style={{
                                            padding: 12,
                                            borderRadius: 12,
                                            border: enrollForm.cardType === 'stamp' ? '2px solid var(--firstloop-primary)' : '1px solid #E2E8F0',
                                            background: enrollForm.cardType === 'stamp' ? 'var(--firstloop-primary-light)' : '#F8FAFC',
                                            color: enrollForm.cardType === 'stamp' ? 'var(--firstloop-primary)' : 'var(--text-secondary)',
                                            cursor: 'pointer',
                                            textAlign: 'center',
                                            fontWeight: 800,
                                            fontSize: '0.85rem'
                                        }}
                                    >
                                        <i className="fas fa-stamp" style={{ display: 'block', marginBottom: 4 }} />
                                        Stamp Card
                                    </div>

                                    <div
                                        onClick={() => setEnrollForm({
                                            ...enrollForm,
                                            cardType: 'membership',
                                            selectedCardTitle: INITIAL_MEMBERSHIP_CARDS[0].name
                                        })}
                                        style={{
                                            padding: 12,
                                            borderRadius: 12,
                                            border: enrollForm.cardType === 'membership' ? '2px solid #D97706' : '1px solid #E2E8F0',
                                            background: enrollForm.cardType === 'membership' ? 'rgba(245, 158, 11, 0.12)' : '#F8FAFC',
                                            color: enrollForm.cardType === 'membership' ? '#D97706' : 'var(--text-secondary)',
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

                            {/* CARD DROPDOWN */}
                            <div className="form-group mb-4">
                                <label style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: 4, display: 'block' }}>
                                    Select Card Pass Design
                                </label>
                                {enrollForm.cardType === 'stamp' ? (
                                    <select
                                        className="form-select"
                                        value={enrollForm.selectedCardTitle}
                                        onChange={(e) => setEnrollForm({ ...enrollForm, selectedCardTitle: e.target.value })}
                                        style={{ height: 42, borderRadius: 8, fontSize: '0.85rem' }}
                                    >
                                        {INITIAL_STAMP_CARDS.map(sc => (
                                            <option key={sc.id} value={sc.title}>{sc.title}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <select
                                        className="form-select"
                                        value={enrollForm.selectedCardTitle}
                                        onChange={(e) => setEnrollForm({ ...enrollForm, selectedCardTitle: e.target.value })}
                                        style={{ height: 42, borderRadius: 8, fontSize: '0.85rem' }}
                                    >
                                        {INITIAL_MEMBERSHIP_CARDS.map(mc => (
                                            <option key={mc.id} value={mc.name}>{mc.name}</option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            <button type="submit" className="btn firstloop-btn-primary" style={{ width: '100%', height: 44, borderRadius: 10, fontWeight: 800, fontSize: '0.9rem' }}>
                                Save & Enroll Customer to Terminal
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* QR SCANNER POPUP MODAL SIMULATION */}
            {qrScannerOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(8px)', zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                    <div style={{ width: '100%', maxWidth: 420, background: '#FFFFFF', borderRadius: 24, padding: 24, textAlign: 'center', boxShadow: '0 25px 50px rgba(0,0,0,0.4)', position: 'relative' }}>
                        <button type="button" onClick={() => setQrScannerOpen(false)} style={{ position: 'absolute', right: 16, top: 16, background: 'none', border: 'none', fontSize: '1.2rem', color: 'var(--text-muted)', cursor: 'pointer' }}>&times;</button>

                        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 12px 0', color: 'var(--text-primary)' }}>
                            Scanning Customer QR Pass...
                        </h3>

                        <div
                            style={{
                                width: 220,
                                height: 220,
                                borderRadius: 20,
                                border: '3px dashed var(--firstloop-primary)',
                                margin: '0 auto 16px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: '#F8FAFC',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                        >
                            {qrScanningState ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                                    <div className="spinner-border text-primary" role="status" style={{ width: '2.5rem', height: '2.5rem' }}>
                                        <span className="visually-hidden">Scanning...</span>
                                    </div>
                                    <small style={{ fontWeight: 800, color: 'var(--firstloop-primary)' }}>Scanning QR Camera View...</small>
                                </div>
                            ) : (
                                <img src={qrImg} alt="Scanned Pass" style={{ width: 160, height: 160, objectFit: 'contain' }} />
                            )}
                        </div>

                        <small style={{ color: 'var(--text-muted)', display: 'block' }}>
                            Simulating QR Pass camera scan for Receptionist Terminal.
                        </small>
                    </div>
                </div>
            )}

            {/* SUCCESS RECEIPT & CHECK-IN CONFIRMATION MODAL */}
            {successReceiptModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(8px)', zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                    <div style={{ width: '100%', maxWidth: 440, background: '#FFFFFF', borderRadius: 24, padding: 26, boxShadow: '0 25px 50px rgba(0,0,0,0.4)', position: 'relative' }}>
                        <div style={{ textAlign: 'center', marginBottom: 20 }}>
                            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#10B981', color: '#FFFFFF', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', boxShadow: '0 8px 20px rgba(16, 185, 129, 0.4)' }}>
                                <i className="fas fa-check" />
                            </div>
                            <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#059669', fontWeight: 800, padding: '5px 12px', borderRadius: 8, fontSize: '0.78rem' }}>
                                ENTRY SUCCESSFULLY UPDATED
                            </span>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '8px 0 0 0', color: 'var(--text-primary)' }}>
                                Receipt #{successReceiptModal.receiptId}
                            </h3>
                        </div>

                        <div style={{ background: '#F8FAFC', borderRadius: 16, padding: 18, border: '1px solid #E2E8F0', marginBottom: 20, fontSize: '0.85rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                <span style={{ color: 'var(--text-muted)' }}>Customer Name:</span>
                                <strong>{successReceiptModal.customerName}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                <span style={{ color: 'var(--text-muted)' }}>Phone Number:</span>
                                <strong>{successReceiptModal.customerPhone}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                <span style={{ color: 'var(--text-muted)' }}>Card Pass Updated:</span>
                                <strong>{successReceiptModal.cardTitle}</strong>
                            </div>

                            {successReceiptModal.cardType === 'stamp' ? (
                                <>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, color: 'var(--firstloop-primary)' }}>
                                        <span>Stamps Updated:</span>
                                        <strong>{successReceiptModal.previousStamps} &rarr; {successReceiptModal.newStamps} / {successReceiptModal.totalStamps} Stamps</strong>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, color: '#059669' }}>
                                        <span>Stamps Remaining:</span>
                                        <strong>{successReceiptModal.remainingStamps} stamps remaining</strong>
                                    </div>
                                </>
                            ) : (
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, color: '#D97706' }}>
                                    <span>Check-In Entry:</span>
                                    <strong>Today ({successReceiptModal.time}) Validated • 1 month to expire</strong>
                                </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                <span style={{ color: 'var(--text-muted)' }}>Payment Method:</span>
                                <strong>{successReceiptModal.paymentMethod}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #CBD5E1', paddingTop: 8, marginTop: 8, fontSize: '0.95rem' }}>
                                <strong>Amount Paid:</strong>
                                <strong style={{ color: 'var(--firstloop-primary)' }}>{successReceiptModal.paymentAmount}</strong>
                            </div>
                        </div>

                        <button
                            type="button"
                            className="btn firstloop-btn-primary"
                            onClick={() => {
                                setSuccessReceiptModal(null)
                                setMatchedCustomer(null)
                                setSelectedCard(null)
                                setPhoneInput('')
                            }}
                            style={{ width: '100%', height: 44, borderRadius: 10, fontWeight: 800 }}
                        >
                            Done & Return to Terminal
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
