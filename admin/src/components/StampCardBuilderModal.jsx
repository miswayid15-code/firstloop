import { useState, useEffect } from 'react'
import logo from '../assets/img/firstloop-favicon.png'
import flLogo from '../assets/img/firstloop-favicon.png'
import qrImg from '../assets/img/qr-img.png'

// --- QR Code Component ---
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

// Paid Perk Icon List
const PAID_ICONS = [
    { label: 'Coffee / Drink', icon: 'fa-coffee' },
    { label: 'Gourmet Meal', icon: 'fa-utensils' },
    { label: 'Hair & Styling', icon: 'fa-cut' },
    { label: 'Spa & Care', icon: 'fa-spa' },
    { label: 'Ticket / Voucher', icon: 'fa-ticket-alt' },
    { label: 'VIP Gem', icon: 'fa-gem' },
    { label: 'Crown Pass', icon: 'fa-crown' }
]

export default function StampCardBuilderModal({
    isOpen,
    cardData = null,
    cardDesigns = [],
    onSave,
    onClose
}) {
    const [stampForm, setStampForm] = useState({
        id: null,
        title: '',
        brandName: 'Elite Branch',
        brandLogo: logo,
        total_stamps: 8,
        reward: 'Free Gift or Beverage',
        bgColor: '#0E88B8',
        bgImage: null,
        cardDesignId: null,
        textColor: '#FFFFFF',
        borderColor: '#00A6D6',
        stampBgColor: 'rgba(255, 255, 255, 0.3)',
        stampBorderColor: '#FFFFFF',
        stampTextColor: '#FFFFFF',
        preset: 'Custom',
        levelRewards: Array.from({ length: 8 }).map((_, i) => ({
            stamp: i + 1,
            reward: '',
            type: 'Free',
            discountVal: 0,
            icon: 'fa-gift'
        }))
    })

    // Sync form state when modal opens or cardData changes
    useEffect(() => {
        if (cardData) {
            const count = cardData.total_stamps || 8
            setStampForm({
                id: cardData.id,
                title: cardData.title || '',
                brandName: cardData.brandName || 'Elite Branch',
                brandLogo: cardData.brandLogo || logo,
                total_stamps: count,
                reward: cardData.reward || '',
                bgColor: cardData.bgColor || '#0E88B8',
                bgImage: cardData.bgImage || null,
                cardDesignId: cardData.cardDesignId || null,
                textColor: cardData.textColor || '#FFFFFF',
                borderColor: cardData.borderColor || '#00A6D6',
                stampBgColor: cardData.stampBgColor || 'rgba(255, 255, 255, 0.3)',
                stampBorderColor: cardData.stampBorderColor || '#FFFFFF',
                stampTextColor: cardData.stampTextColor || '#FFFFFF',
                preset: cardData.preset || 'Custom',
                levelRewards: cardData.levelRewards && cardData.levelRewards.length === count
                    ? cardData.levelRewards
                    : Array.from({ length: count }).map((_, i) => ({
                        stamp: i + 1,
                        reward: '',
                        type: 'Free',
                        discountVal: 0,
                        icon: 'fa-gift'
                    }))
            })
        } else {
            setStampForm({
                id: null,
                title: '',
                brandName: 'Elite Branch',
                brandLogo: logo,
                total_stamps: 8,
                reward: 'Free Beverage or Meal Pass',
                bgColor: '#0E88B8',
                bgImage: cardDesigns.length > 0 ? cardDesigns[0].image : null,
                cardDesignId: cardDesigns.length > 0 ? cardDesigns[0].id : null,
                textColor: '#FFFFFF',
                borderColor: '#00A6D6',
                stampBgColor: 'rgba(255, 255, 255, 0.3)',
                stampBorderColor: '#FFFFFF',
                stampTextColor: '#FFFFFF',
                preset: cardDesigns.length > 0 ? cardDesigns[0].name : 'Custom',
                levelRewards: Array.from({ length: 8 }).map((_, i) => ({
                    stamp: i + 1,
                    reward: '',
                    type: 'Free',
                    discountVal: 0,
                    icon: 'fa-gift'
                }))
            })
        }
    }, [cardData, cardDesigns, isOpen])

    if (!isOpen) return null

    // Handler: Brand Logo Upload
    const handleStampLogoUpload = (e) => {
        const file = e.target.files[0]
        if (file) {
            const url = URL.createObjectURL(file)
            setStampForm(prev => ({ ...prev, brandLogo: url }))
        }
    }

    // Helper: Compute Card Background Style
    const getCardStyle = (card) => {
        if (card.bgImage) {
            return {
                backgroundImage: `url(${card.bgImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
            }
        }
        return {
            backgroundColor: card.bgColor || '#0E88B8',
            border: `2px solid ${card.borderColor || '#00A6D6'}`
        }
    }

    const handleSubmit = () => {
        if (!stampForm.title.trim()) {
            alert('Please enter a Title for the Stamp Card')
            return
        }
        onSave(stampForm)
    }

    return (
        <div
            className="builder-modal-overlay"
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
                padding: 14
            }}
        >
            <div
                className="builder-modal-content"
                style={{
                    background: '#FFFFFF',
                    borderRadius: 20,
                    maxWidth: 1120,
                    width: '100%',
                    maxHeight: '94vh',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)'
                }}
            >
                {/* Builder Header */}
                <div style={{ padding: '18px 20px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--firstloop-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--firstloop-primary)', fontSize: '1.1rem' }}>
                            <i className="fas fa-stamp" />
                        </div>
                        <div>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                                {stampForm.id ? 'Edit Stamp Card' : 'Create Stamp Card'} - Dynamic Stamp Count
                            </h3>
                            <small style={{ color: 'var(--text-muted)' }}>
                                Set brand logo, number of stamps (up to 10 max), and configure reward levels.
                            </small>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{ background: 'none', border: 'none', fontSize: '1.2rem', color: 'var(--text-muted)', cursor: 'pointer' }}
                    >
                        <i className="fas fa-times" />
                    </button>
                </div>

                {/* Top Card Design API Picker Carousel */}
                <div style={{ padding: '12px 20px', background: '#FFFFFF', borderBottom: '1px solid #F1F5F9' }}>
                    <small style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
                        SELECT CARD DESIGN BACKGROUND IMAGE (API: admin/card-design/list)
                    </small>
                    <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4 }}>
                        {cardDesigns.length > 0 && cardDesigns.map(design => (
                            <div
                                key={design.id}
                                onClick={() => setStampForm(prev => ({
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
                                    border: stampForm.bgImage === design.image ? '3px solid #00A6D6' : '2px solid #E2E8F0',
                                    cursor: 'pointer',
                                    position: 'relative',
                                    boxShadow: stampForm.bgImage === design.image ? '0 4px 12px rgba(0, 166, 214, 0.4)' : 'none',
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
                <div className="card-builder-modal-grid">
                    {/* LEFT PANEL: FORM CONTROLS */}
                    <div className="builder-left-panel" style={{ padding: 24, borderRight: '1px solid #F1F5F9', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            {/* 1. Card Title, Brand & Stamp Count Input */}
                            <div>
                                <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Card & Stamp Details
                                </h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    <div>
                                        <label style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: 4, display: 'block' }}>Stamp Card Title</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="e.g., Artisanal Coffee Stamp Pass"
                                            value={stampForm.title}
                                            onChange={(e) => setStampForm(prev => ({ ...prev, title: e.target.value }))}
                                            style={{ height: 36, fontSize: '0.85rem' }}
                                        />
                                    </div>

                                    <div className="card-builder-form-trio">
                                        <div>
                                            <label style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: 4, display: 'block' }}>Brand Name</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="Elite Branch"
                                                value={stampForm.brandName}
                                                onChange={(e) => setStampForm(prev => ({ ...prev, brandName: e.target.value }))}
                                                style={{ height: 36, fontSize: '0.85rem' }}
                                            />
                                        </div>

                                        <div>
                                            <label style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: 4, display: 'block' }}>
                                                Upload Brand Logo
                                            </label>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleStampLogoUpload}
                                                className="form-control"
                                                style={{ height: 36, fontSize: '0.8rem' }}
                                            />
                                        </div>

                                        <div>
                                            <label style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: 4, display: 'block' }}>
                                                Number of Stamps (1-10 Max)
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                max="10"
                                                className="form-control"
                                                value={stampForm.total_stamps}
                                                onChange={(e) => {
                                                    const count = Math.min(10, Math.max(1, Number(e.target.value) || 1))
                                                    setStampForm(prev => ({
                                                        ...prev,
                                                        total_stamps: count,
                                                        levelRewards: Array.from({ length: count }).map((_, i) => prev.levelRewards[i] || { stamp: i + 1, reward: '', type: 'Free', discountVal: 0, icon: 'fa-gift' })
                                                    }))
                                                }}
                                                style={{ height: 36, fontSize: '0.85rem' }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 2. Color Pickers */}
                            <div style={{ paddingTop: 16, borderTop: '1px solid #F1F5F9' }}>
                                <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Card Background & Main Colors
                                </h4>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 16 }}>
                                    <div>
                                        <label style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: 4, display: 'block' }}>
                                            Solid Background Color
                                        </label>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <input
                                                type="color"
                                                value={stampForm.bgColor.startsWith('#') ? stampForm.bgColor : '#0E88B8'}
                                                onChange={(e) => setStampForm(prev => ({ ...prev, bgColor: e.target.value, bgImage: null }))}
                                                style={{ width: 40, height: 36, padding: 0, border: 'none', borderRadius: 6, cursor: 'pointer' }}
                                            />
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={stampForm.bgColor}
                                                onChange={(e) => setStampForm(prev => ({ ...prev, bgColor: e.target.value, bgImage: null }))}
                                                style={{ height: 36, fontSize: '0.82rem' }}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: 4, display: 'block' }}>
                                            Card Text Color
                                        </label>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <input
                                                type="color"
                                                value={stampForm.textColor.startsWith('#') ? stampForm.textColor : '#FFFFFF'}
                                                onChange={(e) => setStampForm(prev => ({ ...prev, textColor: e.target.value }))}
                                                style={{ width: 40, height: 36, padding: 0, border: 'none', borderRadius: 6, cursor: 'pointer' }}
                                            />
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={stampForm.textColor}
                                                onChange={(e) => setStampForm(prev => ({ ...prev, textColor: e.target.value }))}
                                                style={{ height: 36, fontSize: '0.82rem' }}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: 4, display: 'block' }}>
                                            Card Border Color
                                        </label>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <input
                                                type="color"
                                                value={stampForm.borderColor.startsWith('#') ? stampForm.borderColor : '#00A6D6'}
                                                onChange={(e) => setStampForm(prev => ({ ...prev, borderColor: e.target.value }))}
                                                style={{ width: 40, height: 36, padding: 0, border: 'none', borderRadius: 6, cursor: 'pointer' }}
                                            />
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={stampForm.borderColor}
                                                onChange={(e) => setStampForm(prev => ({ ...prev, borderColor: e.target.value }))}
                                                style={{ height: 36, fontSize: '0.82rem' }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 3. STAMP CIRCLE COLOR PICKERS */}
                            <div style={{ paddingTop: 16, borderTop: '1px solid #F1F5F9' }}>
                                <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Stamp Circle Slot Colors
                                </h4>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 14 }}>
                                    <div>
                                        <label style={{ fontSize: '0.78rem', fontWeight: 600, marginBottom: 4, display: 'block' }}>
                                            Stamp Circle Background
                                        </label>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <input
                                                type="color"
                                                value={stampForm.stampBgColor.startsWith('#') ? stampForm.stampBgColor : '#00A6D6'}
                                                onChange={(e) => setStampForm(prev => ({ ...prev, stampBgColor: e.target.value }))}
                                                style={{ width: 38, height: 36, padding: 0, border: 'none', borderRadius: 6, cursor: 'pointer' }}
                                            />
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={stampForm.stampBgColor}
                                                onChange={(e) => setStampForm(prev => ({ ...prev, stampBgColor: e.target.value }))}
                                                style={{ height: 36, fontSize: '0.8rem' }}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label style={{ fontSize: '0.78rem', fontWeight: 600, marginBottom: 4, display: 'block' }}>
                                            Stamp Circle Border Color
                                        </label>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <input
                                                type="color"
                                                value={stampForm.stampBorderColor.startsWith('#') ? stampForm.stampBorderColor : '#FFFFFF'}
                                                onChange={(e) => setStampForm(prev => ({ ...prev, stampBorderColor: e.target.value }))}
                                                style={{ width: 38, height: 36, padding: 0, border: 'none', borderRadius: 6, cursor: 'pointer' }}
                                            />
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={stampForm.stampBorderColor}
                                                onChange={(e) => setStampForm(prev => ({ ...prev, stampBorderColor: e.target.value }))}
                                                style={{ height: 36, fontSize: '0.8rem' }}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label style={{ fontSize: '0.78rem', fontWeight: 600, marginBottom: 4, display: 'block' }}>
                                            Stamp Text / Number Color
                                        </label>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <input
                                                type="color"
                                                value={stampForm.stampTextColor.startsWith('#') ? stampForm.stampTextColor : '#FFFFFF'}
                                                onChange={(e) => setStampForm(prev => ({ ...prev, stampTextColor: e.target.value }))}
                                                style={{ width: 38, height: 36, padding: 0, border: 'none', borderRadius: 6, cursor: 'pointer' }}
                                            />
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={stampForm.stampTextColor}
                                                onChange={(e) => setStampForm(prev => ({ ...prev, stampTextColor: e.target.value }))}
                                                style={{ height: 36, fontSize: '0.8rem' }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 4. Stamp Levels Setup */}
                            <div style={{ paddingTop: 16, borderTop: '1px solid #F1F5F9' }}>
                                <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Stamp Levels Configuration ({stampForm.total_stamps} Levels)
                                </h4>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    {Array.from({ length: Number(stampForm.total_stamps) }).map((_, i) => {
                                        const reward = stampForm.levelRewards[i] || { stamp: i + 1, reward: '', type: 'Free', discountVal: 0, icon: 'fa-gift' }
                                        return (
                                            <div key={i} style={{ padding: 10, background: '#F8FAFC', borderRadius: 10, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 8 }}>
                                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                                    <span style={{ fontSize: '0.78rem', fontWeight: 700, width: 60, color: 'var(--firstloop-primary)' }}>
                                                        Stamp {i + 1}
                                                    </span>

                                                    <select
                                                        className="form-control"
                                                        value={reward.type || 'Free'}
                                                        onChange={(e) => {
                                                            const typeVal = e.target.value
                                                            setStampForm(prev => {
                                                                const updated = [...prev.levelRewards]
                                                                updated[i] = {
                                                                    ...updated[i],
                                                                    stamp: i + 1,
                                                                    type: typeVal,
                                                                    icon: typeVal === 'Free' ? 'fa-gift' : typeVal === 'Discount' ? 'fa-percent' : 'fa-coffee'
                                                                }
                                                                return { ...prev, levelRewards: updated }
                                                            })
                                                        }}
                                                        style={{ width: 110, height: 36, fontSize: '0.8rem' }}
                                                    >
                                                        <option value="Free">Free 🎁</option>
                                                        <option value="Discount">Discount %</option>
                                                        <option value="Paid">Paid Perk</option>
                                                    </select>

                                                    {reward.type === 'Discount' ? (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, width: 130 }}>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                max="100"
                                                                className="form-control"
                                                                placeholder="0-100"
                                                                value={reward.discountVal || ''}
                                                                onChange={(e) => {
                                                                    const val = Math.min(100, Math.max(0, Number(e.target.value) || 0))
                                                                    setStampForm(prev => {
                                                                        const updated = [...prev.levelRewards]
                                                                        updated[i] = { ...updated[i], discountVal: val, reward: `${val}% Discount` }
                                                                        return { ...prev, levelRewards: updated }
                                                                    })
                                                                }}
                                                                style={{ height: 36, fontSize: '0.82rem' }}
                                                            />
                                                            <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>%</span>
                                                        </div>
                                                    ) : reward.type === 'Paid' ? (
                                                        <select
                                                            className="form-control"
                                                            value={reward.icon || 'fa-coffee'}
                                                            onChange={(e) => {
                                                                const iconVal = e.target.value
                                                                setStampForm(prev => {
                                                                    const updated = [...prev.levelRewards]
                                                                    updated[i] = { ...updated[i], icon: iconVal }
                                                                    return { ...prev, levelRewards: updated }
                                                                })
                                                            }}
                                                            style={{ width: 140, height: 36, fontSize: '0.8rem' }}
                                                        >
                                                            {PAID_ICONS.map(pi => (
                                                                <option key={pi.icon} value={pi.icon}>
                                                                    {pi.label}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    ) : (
                                                        <div style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                            <i className="fas fa-gift" /> Free Reward
                                                        </div>
                                                    )}
                                                </div>

                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    placeholder="Reward description (e.g. Free Artisanal Muffin)..."
                                                    value={reward.reward || ''}
                                                    onChange={(e) => {
                                                        const val = e.target.value
                                                        setStampForm(prev => {
                                                            const updated = [...prev.levelRewards]
                                                            updated[i] = { ...updated[i], reward: val }
                                                            return { ...prev, levelRewards: updated }
                                                        })
                                                    }}
                                                    style={{ height: 34, fontSize: '0.8rem' }}
                                                />
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT PANEL: LIVE STAMP CARD PREVIEW */}
                    <div className="builder-right-panel" style={{ padding: 24, background: '#F8FAFC', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <small style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 16 }}>
                            LIVE CARD PREVIEW
                        </small>

                        <div
                            style={{
                                width: '100%',
                                maxWidth: 370,
                                borderRadius: 20,
                                ...getCardStyle(stampForm),
                                color: stampForm.textColor || '#FFFFFF',
                                padding: 22,
                                boxShadow: '0 16px 36px -8px rgba(0,0,0,0.25)',
                                position: 'relative',
                                transition: 'all 0.3s ease',
                                minHeight: 240
                            }}
                        >
                            <div style={{ position: 'relative', zIndex: 2 }}>
                                {/* ALERT NOTICE BADGE: 2 STAMPS ONLY REMAINING & EXPIRES IN 30 DAYS */}
                                <div style={{ background: 'rgba(0, 0, 0, 0.25)', backdropFilter: 'blur(4px)', padding: '5px 10px', borderRadius: 8, fontSize: '0.72rem', fontWeight: 800, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, border: '1px solid rgba(255,255,255,0.3)' }}>
                                    <i className="fas fa-exclamation-circle" style={{ color: '#FDE047', fontSize: '0.8rem' }} />
                                    <span>Alert: 2 stamps only remaining &bull; Expired in 30 days</span>
                                </div>

                                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                                    {/* Left Side */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                            <div style={{ width: 26, height: 26, borderRadius: 8, background: '#FFFFFF', padding: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}>
                                                <img src={stampForm.brandLogo || logo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                            </div>
                                            <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'inherit' }}>
                                                {stampForm.brandName || 'Elite Branch'}
                                            </span>
                                        </div>

                                        <div style={{ fontSize: '0.78rem', opacity: 0.9, marginBottom: 12 }}>
                                            <strong>{stampForm.title || 'Stamp Card Title'}</strong>
                                        </div>

                                        {/* Stamp Circles Slot Canvas */}
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10, maxWidth: 220 }}>
                                            {Array.from({ length: Number(stampForm.total_stamps) }).map((_, i) => {
                                                const r = stampForm.levelRewards[i]
                                                let iconMarkup = i + 1
                                                if (r) {
                                                    if (r.type === 'Free') {
                                                        iconMarkup = <i className="fas fa-gift" style={{ fontSize: '0.8rem' }} />
                                                    } else if (r.type === 'Discount') {
                                                        iconMarkup = <span style={{ fontSize: '0.65rem', fontWeight: 800 }}>{r.discountVal || 10}%</span>
                                                    } else if (r.type === 'Paid' && r.icon) {
                                                        iconMarkup = <i className={`fas ${r.icon}`} style={{ fontSize: '0.8rem' }} />
                                                    }
                                                }

                                                return (
                                                    <div
                                                        key={i}
                                                        style={{
                                                            width: 36,
                                                            height: 36,
                                                            borderRadius: '50%',
                                                            border: `2px solid ${stampForm.stampBorderColor || '#FFFFFF'}`,
                                                            background: stampForm.stampBgColor || 'rgba(255, 255, 255, 0.3)',
                                                            color: stampForm.stampTextColor || 'inherit',
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
                    </div>
                </div>

                {/* Modal Footer Actions */}
                <div style={{ padding: '16px 28px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                    <button
                        type="button"
                        className="btn firstloop-btn-secondary"
                        onClick={onClose}
                        style={{ padding: '9px 20px', borderRadius: 8, fontSize: '0.85rem' }}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="btn firstloop-btn-primary"
                        onClick={handleSubmit}
                        style={{ padding: '9px 22px', borderRadius: 8, fontSize: '0.85rem' }}
                    >
                        <i className="fas fa-check" style={{ marginRight: 6 }} />
                        Save Design
                    </button>
                </div>
            </div>
        </div>
    )
}
