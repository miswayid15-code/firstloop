import { useState, useEffect } from 'react'
import flLogo from '../assets/img/firstloop-favicon.png'
import qrImg from '../assets/img/qr-img.png'
import axios from 'axios'
import API from '../api.js'

// Default Card Designs Fallback List
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

// Helper: Format validity months for pass display (e.g. 12 -> 12 Months)
const formatValidity = (val) => {
    if (!val) return '12 Months'
    const str = String(val).trim()
    if (/^\d+$/.test(str)) {
        return `${str} Month${Number(str) > 1 ? 's' : ''}`
    }
    return str
}

// Format Image URL helper
const formatImageUrl = (img) => {
    if (!img) return ''
    if (img.startsWith('http://') || img.startsWith('https://') || img.startsWith('data:') || img.startsWith('blob:')) {
        return img
    }
    const baseUrl = import.meta.env.VITE_API_URL || ''
    const cleanBase = baseUrl.replace(/\/+$/, '')
    const cleanImg = String(img).replace(/^\/+/, '')
    return `${cleanBase}/${cleanImg}`
}

export default function MembershipCardBuilderModal({
    isOpen,
    cardData = null,
    cardDesigns = [],
    onSave,
    onClose
}) {
    const [fetchedDesigns, setFetchedDesigns] = useState([])
    const [membershipForm, setMembershipForm] = useState({
        id: null,
        name: '',
        brandName: 'FirstLoop',
        brandLogo: flLogo,
        validityMonths: 12,
        bgColor: '#D97706',
        bgImage: null,
        cardDesignId: null,
        textColor: '#FFFFFF',
        borderColor: '#F59E0B',
        preset: 'Custom',
        isDefault: false
    })

    // Self-contained API call to fetch card designs if not provided via props
    useEffect(() => {
        if (isOpen) {
            if (!cardDesigns || cardDesigns.length === 0) {
                fetchCardDesignsFromApi()
            }
        }
    }, [isOpen, cardDesigns])

    const fetchCardDesignsFromApi = async () => {
        try {
            const adminToken = localStorage.getItem('access_token') || localStorage.getItem('admin_token')
            const role = localStorage.getItem('role') || 'firstpass'

            let response = null

            // 1. Try with Admin token
            if (adminToken && adminToken !== 'null' && adminToken !== 'undefined') {
                try {
                    response = await API.post('admin/card-design/list', {}, {
                        skipAuthRedirect: true,
                        headers: { Authorization: `Bearer ${adminToken}`, 'X-Role': role }
                    })
                } catch (e) {}
            }

            // 2. Try unauthenticated axios POST with X-Role header
            if (!response?.data || (response.data.status !== 1 && response.data.status !== "1")) {
                try {
                    response = await axios.post(`${import.meta.env.VITE_API_URL}/admin/card-design/list`, {}, {
                        headers: { 'X-Role': role, 'Content-Type': 'application/json' }
                    })
                } catch (e) {}
            }

            // 3. Try standard API.post
            if (!response?.data || (response.data.status !== 1 && response.data.status !== "1")) {
                try {
                    response = await API.post('admin/card-design/list', {}, { skipAuthRedirect: true })
                } catch (e) {}
            }

            // 4. Try firstloop merchant route
            if (!response?.data || (response.data.status !== 1 && response.data.status !== "1")) {
                try {
                    response = await API.post('firstloop/merchant/card-design/list', {}, { skipAuthRedirect: true })
                } catch (e) {}
            }

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
                    setFetchedDesigns(formattedDesigns)
                    return
                }
            }

            setFetchedDesigns(DEFAULT_CARD_DESIGNS.map(d => ({ ...d, image: formatImageUrl(d.image) })))
        } catch (err) {
            console.error('Error fetching card designs in MembershipCardBuilderModal:', err)
            setFetchedDesigns(DEFAULT_CARD_DESIGNS.map(d => ({ ...d, image: formatImageUrl(d.image) })))
        }
    }

    const availableDesigns = cardDesigns && cardDesigns.length > 0 ? cardDesigns : fetchedDesigns

    // Sync form state when modal opens or cardData changes
    useEffect(() => {
        if (!isOpen) return

        if (cardData) {
            let valMonths = 12
            if (cardData.validityMonths) {
                const parsed = parseInt(cardData.validityMonths, 10)
                if (!isNaN(parsed)) valMonths = parsed
                else valMonths = cardData.validityMonths
            }

            setMembershipForm({
                id: cardData.id || null,
                name: cardData.name || '',
                brandName: cardData.brandName || 'FirstLoop',
                brandLogo: cardData.brandLogo || flLogo,
                validityMonths: valMonths,
                bgColor: cardData.bgColor || '#D97706',
                bgImage: cardData.bgImage || null,
                cardDesignId: cardData.cardDesignId || null,
                textColor: cardData.textColor || '#FFFFFF',
                borderColor: cardData.borderColor || '#F59E0B',
                preset: cardData.preset || 'Custom',
                isDefault: cardData.isDefault || false
            })
        } else {
            setMembershipForm({
                id: null,
                name: '',
                brandName: 'FirstLoop',
                brandLogo: flLogo,
                validityMonths: 12,
                bgColor: '#D97706',
                bgImage: availableDesigns.length > 0 ? availableDesigns[0].image : null,
                cardDesignId: availableDesigns.length > 0 ? availableDesigns[0].id : null,
                textColor: '#FFFFFF',
                borderColor: '#F59E0B',
                preset: availableDesigns.length > 0 ? availableDesigns[0].name : 'Custom',
                isDefault: false
            })
        }
    }, [cardData, availableDesigns, isOpen])

    if (!isOpen) return null

    // Card Style Helper
    const getCardStyle = (form) => {
        const style = {
            border: `2px solid ${form.borderColor || 'rgba(255,255,255,0.4)'}`
        }
        const bgImg = form.bgImage || (form.cardDesignId ? availableDesigns.find(d => String(d.id) === String(form.cardDesignId))?.image : null)
        if (bgImg) {
            style.backgroundImage = `url(${formatImageUrl(bgImg)})`
            style.backgroundSize = 'cover'
            style.backgroundPosition = 'center'
            style.backgroundRepeat = 'no-repeat'
        } else {
            style.backgroundColor = form.bgColor || '#D97706'
        }
        return style
    }

    const handleMembershipLogoUpload = (e) => {
        const file = e.target.files[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                setMembershipForm(prev => ({ ...prev, brandLogo: reader.result }))
            }
            reader.readAsDataURL(file)
        }
    }

    const handleSubmit = () => {
        if (!membershipForm.name.trim()) {
            alert('Please enter a Membership Card Name')
            return
        }
        onSave && onSave(membershipForm)
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
                <div style={{ padding: '18px 20px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(217, 119, 6, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D97706', fontSize: '1.1rem' }}>
                            <i className="fas fa-id-card" />
                        </div>
                        <div>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                                {membershipForm.id ? 'Edit Membership Card' : 'Create Membership Card'} - FirstLoop
                            </h3>
                            <small style={{ color: 'var(--text-muted)' }}>
                                Set membership name, brand logo, validity duration (in months), and card colors.
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

                {/* Top Card Design API Picker */}
                <div style={{ padding: '12px 20px', background: '#FFFFFF', borderBottom: '1px solid #F1F5F9' }}>
                  
                    <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4 }}>
                        {availableDesigns.length > 0 && availableDesigns.map(design => {
                            const isSelected = membershipForm.cardDesignId === design.id || membershipForm.bgImage === design.image
                            return (
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
                                        backgroundImage: `url(${formatImageUrl(design.image)})`,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                        border: isSelected ? '3px solid #D97706' : '2px solid #E2E8F0',
                                        cursor: 'pointer',
                                        position: 'relative',
                                        boxShadow: isSelected ? '0 4px 12px rgba(217, 119, 6, 0.4)' : 'none',
                                        overflow: 'hidden'
                                    }}
                                >
                                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.65)', color: '#FFF', fontSize: '0.65rem', fontWeight: 700, padding: '2px 4px', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden', textAlign: 'center' }}>
                                        {design.name}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Modal Body Grid */}
                <div className="card-builder-modal-grid">
                    {/* LEFT PANEL: FORM CONTROLS */}
                    <div className="builder-left-panel" style={{ padding: 24, borderRight: '1px solid #F1F5F9', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            {/* 1. Membership Details */}
                            <div>
                                <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Membership Details & Brand Logo
                                </h4>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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

                                    {/* NUMBER INPUT FOR VALIDITY (MONTHS ONLY) */}
                                    <div>
                                        <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4, display: 'block' }}>
                                            Validity (in Months)
                                        </label>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <input
                                                type="number"
                                                min="1"
                                                max="120"
                                                className="form-control"
                                                placeholder="12"
                                                value={membershipForm.validityMonths}
                                                onChange={(e) => setMembershipForm(prev => ({ ...prev, validityMonths: e.target.value }))}
                                                style={{ height: 40, fontSize: '0.88rem', fontWeight: 600 }}
                                            />
                                            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', flexShrink: 0 }}>Months</span>
                                        </div>
                                        <small style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                                            Specify validity duration (e.g. 6 for 6 Months, 12 for 1 Year)
                                        </small>

                                        {/* Quick Month Selectors */}
                                        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                                            {[3, 6, 12, 24].map(m => (
                                                <button
                                                    key={m}
                                                    type="button"
                                                    className="btn btn-sm"
                                                    onClick={() => setMembershipForm(prev => ({ ...prev, validityMonths: m }))}
                                                    style={{
                                                        padding: '3px 10px',
                                                        fontSize: '0.75rem',
                                                        borderRadius: 6,
                                                        background: String(membershipForm.validityMonths) === String(m) ? '#D97706' : '#E2E8F0',
                                                        color: String(membershipForm.validityMonths) === String(m) ? '#FFFFFF' : '#334155',
                                                        fontWeight: 700,
                                                        border: 'none',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    {m} Months
                                                </button>
                                            ))}
                                        </div>
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
                                                value={String(membershipForm.bgColor).startsWith('#') ? membershipForm.bgColor : '#D97706'}
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
                                                value={String(membershipForm.textColor).startsWith('#') ? membershipForm.textColor : '#FFFFFF'}
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
                                                value={String(membershipForm.borderColor).startsWith('#') ? membershipForm.borderColor : '#F59E0B'}
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
                    <div className="builder-right-panel" style={{ padding: 24, background: '#F8FAFC', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
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
                                padding: 18,
                                boxShadow: '0 16px 36px -8px rgba(0,0,0,0.25)',
                                position: 'relative',
                                transition: 'all 0.3s ease',
                                minHeight: 220
                            }}
                        >
                            <div style={{ position: 'relative', zIndex: 2 }}>
                                {/* ALERT NOTICE BADGE: EXPIRES IN 30 DAYS */}
                            

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

                                {/* Middle Section: Left Info + Right Large Middle QR Code */}
                                <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 10 }}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'inherit' }}>
                                            {membershipForm.name || 'Membership Card'}
                                        </div>

                                        <div style={{ marginTop: 12, borderTop: '1px solid rgba(255,255,255,0.25)', paddingTop: 8 }}>
                                            <small style={{ fontSize: '0.65rem', textTransform: 'uppercase', opacity: 0.85 }}>
                                                Valid Thru
                                            </small>
                                            <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'inherit' }}>
                                                {formatValidity(membershipForm.validityMonths)}
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
                    </div>
                </div>

                {/* Builder Footer Action Bar */}
                <div style={{ padding: '16px 28px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={onClose}
                        style={{ padding: '10px 20px', borderRadius: 10, fontWeight: 600 }}
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        className="btn"
                        onClick={handleSubmit}
                        style={{ padding: '10px 24px', borderRadius: 10, background: '#D97706', color: '#FFFFFF', fontWeight: 700, border: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}
                    >
                        <i className="fas fa-save" />
                        <span>Save Membership Card</span>
                    </button>
                </div>
            </div>
        </div>
    )
}
