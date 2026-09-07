import { useState, useEffect } from 'react'
import flLogo from '../assets/img/firstloop-favicon.png'
import qrImg from '../assets/img/qr-img.png'
import API from '../api.js'
import { toast } from 'react-hot-toast'


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
import {
    getRelativeImagePath,
    formatImageUrl,
    formatValidity,
    getCardStyle
} from '../services/cardService.js'

const EMPTY_ARRAY = []

export default function MembershipCardBuilderModal({
    isOpen,
    cardData = null,
    cardDesigns = EMPTY_ARRAY,
    merchantId = null,
    merchantData = null,
    brandName = '',
    brandImage = null,
    brandLogo = null,
    branches = EMPTY_ARRAY,
    onSave,
    onClose
}) {
    const fallbackBrandName = brandName || merchantData?.bus_name || 'Elite Branch'
    const fallbackBrandLogo = brandImage || brandLogo || merchantData?.brand_image || flLogo
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
        branch_ids: (branches || []).map(b => Number(b.id)),
        preset: 'Custom',
        isDefault: false
    })
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Self-contained API call to fetch card designs if not provided via props
    useEffect(() => {
        if (isOpen && (!cardDesigns || cardDesigns.length === 0)) {
            fetchCardDesignsFromApi()
        }
    }, [isOpen, cardDesigns?.length])

    const fetchCardDesignsFromApi = async () => {
        try {
            const response = await API.post('admin/card-design/list')
            console.log("response", response)

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
        } catch (err) {
            console.error('Error fetching card designs in MembershipCardBuilderModal:', err)
        }
    }
    const membership_cards = async () => {
        if (isSubmitting) return
        setIsSubmitting(true)
        try {
            let localMerchantId = null

            try {
                const rawMerchant = localStorage.getItem("merchant_data")
                if (rawMerchant && rawMerchant !== "null" && rawMerchant !== "undefined") {
                    const parsed = JSON.parse(rawMerchant)
                    localMerchantId = parsed?.id || parsed?.merchant_id || parsed?.mer_id
                }

            } catch (e) {
                console.error('Error getting merchant id:', e);
            }
            const targetMerchantId =
                merchantId ||
                membershipForm.merchant_id ||
                cardData?.merchant_id ||
                merchantData?.id ||
                localMerchantId;

            const cardTitle = (membershipForm.name || membershipForm.title || '').trim();
            if (!cardTitle) {
                toast.error('Please enter a Membership Card Name');
                return;
            }

            if (!targetMerchantId) {
                toast.error('Merchant ID is missing');
                return;
            }

            const formData = new FormData();
            const isNumericId = membershipForm.id && !isNaN(Number(membershipForm.id)) && !String(membershipForm.id).startsWith('mc-');
            if (isNumericId) {
                formData.append('id', Number(membershipForm.id));
            }
            formData.append('merchant_id', Number(targetMerchantId));
            formData.append('branch_ids', JSON.stringify(membershipForm.branch_ids || []));
            formData.append('title', cardTitle);
            formData.append('brand_name', membershipForm.brandName || fallbackBrandName);
            formData.append('month', Number(membershipForm.validityMonths) || 12);
            formData.append('background_color', membershipForm.bgColor || '#D97706');
            formData.append('text_color', membershipForm.textColor || '#FFFFFF');
            formData.append('border_color', membershipForm.borderColor || '#F59E0B');
            if (membershipForm.brandLogoFile) {
                formData.append('brand_image', membershipForm.brandLogoFile);
            } else if (membershipForm.brandLogo && typeof membershipForm.brandLogo === 'string' && !membershipForm.brandLogo.startsWith('blob:') && !membershipForm.brandLogo.startsWith('data:')) {
                const relBrandLogo = getRelativeImagePath(membershipForm.brandLogo);
                if (relBrandLogo) {
                    formData.append('brand_image', relBrandLogo);
                }
            }

            // Background & style fields
            if (membershipForm.bgImage) {
                const relBgImage = getRelativeImagePath(membershipForm.bgImage);
                formData.append('background_image', relBgImage || membershipForm.bgImage);
            }

            // Optional Card Design ID
            if (membershipForm.cardDesignId && !isNaN(Number(membershipForm.cardDesignId))) {
                formData.append('card_design_id', Number(membershipForm.cardDesignId));
            }

            console.log("Submitting Membership Card FormData entries:");
            for (let [key, val] of formData.entries()) {
                console.log(`  ${key}:`, val);
            }

            const response = await API.post('firstloop/merchant/create_membership_card', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            console.log("Membership card save response:", response?.data);

            if (response?.data?.status === 1 || response?.data?.status === '1' || response?.data?.success) {
                toast.success(response?.data?.message || 'Membership Card saved successfully!');
                if (onSave) {
                    onSave({
                        ...membershipForm,
                        name: cardTitle,
                        title: cardTitle
                    });
                }
                onClose();
            } else {
                toast.error(
                    response?.data?.message ||
                    response?.data?.msg ||
                    'Failed to save Membership Card'
                );
            }
        }
        catch (err) {
            console.error('Error creating membership card:', err);
            console.error('Backend 400 Error Details:', err?.response?.data);

            const serverMsg =
                err?.response?.data?.message ||
                err?.response?.data?.msg ||
                err?.response?.data?.error ||
                (typeof err?.response?.data === 'string' ? err.response.data : null) ||
                err?.message ||
                'Server error while saving Membership Card';

            toast.error(serverMsg);
        }
        finally {
            setIsSubmitting(false)
        }
    }
    const availableDesigns = (cardDesigns && cardDesigns.length > 0) ? cardDesigns : fetchedDesigns

    // Sync form state when modal opens or cardData changes
    useEffect(() => {
        if (!isOpen) return

        if (cardData) {
            let valMonths = 12
            if (cardData.validityMonths || cardData.month || cardData.totalMonth) {
                const parsed = parseInt(cardData.validityMonths || cardData.month || cardData.totalMonth, 10)
                if (!isNaN(parsed)) valMonths = parsed
            }

            setMembershipForm({
                id: cardData.id || null,
                name: cardData.name || cardData.title || '',
                brandName: cardData.brandName || cardData.brand_name || fallbackBrandName,
                brandLogo: cardData.brandLogo || (cardData.brand_image ? formatImageUrl(cardData.brand_image) : fallbackBrandLogo),
                validityMonths: valMonths,
                bgColor: cardData.bgColor || cardData.background_color || '#D97706',
                bgImage: cardData.bgImage || (cardData.background_image ? formatImageUrl(cardData.background_image) : null),
                cardDesignId: cardData.cardDesignId || cardData.card_design_id || null,
                textColor: cardData.textColor || cardData.text_color || '#FFFFFF',
                borderColor: cardData.borderColor || cardData.border_color || '#F59E0B',
                branch_ids: Array.isArray(cardData.branch_ids)
                    ? cardData.branch_ids.map(Number)
                    : (cardData.branch_id ? [Number(cardData.branch_id)] : (branches || []).map(b => Number(b.id))),
                preset: cardData.preset || 'Custom',
                isDefault: cardData.isDefault || false
            })
        } else {
            const initialDesign = (cardDesigns && cardDesigns.length > 0) ? cardDesigns[0] : (fetchedDesigns.length > 0 ? fetchedDesigns[0] : null)

            setMembershipForm({
                id: null,
                name: '',
                brandName: fallbackBrandName,
                brandLogo: fallbackBrandLogo,
                validityMonths: 12,
                bgColor: '#D97706',
                bgImage: initialDesign ? initialDesign.image : null,
                cardDesignId: initialDesign ? initialDesign.id : null,
                textColor: '#FFFFFF',
                borderColor: '#F59E0B',
                branch_ids: (branches || []).map(b => Number(b.id)),
                preset: initialDesign ? initialDesign.name : 'Custom',
                isDefault: false
            })
        }
    }, [isOpen, cardData, fallbackBrandName, fallbackBrandLogo])

    // Update background image if card designs load asynchronously for a new card
    useEffect(() => {
        if (!isOpen || cardData) return
        if (availableDesigns.length > 0) {
            setMembershipForm(prev => {
                if (prev.cardDesignId || prev.bgImage) return prev
                return {
                    ...prev,
                    bgImage: availableDesigns[0].image,
                    cardDesignId: availableDesigns[0].id,
                    preset: availableDesigns[0].name
                }
            })
        }
    }, [isOpen, cardData, availableDesigns.length])

    if (!isOpen) return null



    const handleMembershipLogoUpload = (e) => {
        const file = e.target.files[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                const previewUrl = URL.createObjectURL(file)
                setMembershipForm(prev => ({
                    ...prev,
                    brandLogoFile: file,
                    brandLogo: previewUrl
                }))
            }
            reader.readAsDataURL(file)
        }
    }

    const handleSubmit = (e) => {
        if (e) {
            e.preventDefault()
            e.stopPropagation()
        }
        if (isSubmitting) return
        membership_cards()
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


                            </div>

                            <div style={{ paddingTop: 16, borderTop: '1px solid #F1F5F9' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <h4 style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        Applicable Branches <span style={{ color: '#EF4444' }}>*</span>
                                    </h4>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-outline-primary"
                                            onClick={() => setMembershipForm(prev => ({ ...prev, branch_ids: (branches || []).map(b => Number(b.id)) }))}
                                            style={{ padding: '2px 8px', fontSize: '0.72rem' }}
                                        >
                                            Select All
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-outline-secondary"
                                            onClick={() => setMembershipForm(prev => ({ ...prev, branch_ids: [] }))}
                                            style={{ padding: '2px 8px', fontSize: '0.72rem' }}
                                        >
                                            Clear
                                        </button>
                                    </div>
                                </div>

                                <div
                                    style={{
                                        border: '1px solid #E2E8F0',
                                        borderRadius: 8,
                                        maxHeight: 140,
                                        overflowY: 'auto',
                                        background: '#F8FAFC'
                                    }}
                                >
                                    {branches && branches.length > 0 ? (
                                        branches.map((b) => {
                                            const bId = Number(b.id);
                                            const isSelected = (membershipForm.branch_ids || []).includes(bId);
                                            return (
                                                <label
                                                    key={b.id}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 8,
                                                        padding: '6px 10px',
                                                        cursor: 'pointer',
                                                        borderBottom: '1px solid #F1F5F9',
                                                        fontSize: '0.8rem',
                                                        background: isSelected ? 'rgba(14, 136, 184, 0.08)' : 'transparent',
                                                        margin: 0
                                                    }}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => {
                                                            setMembershipForm(prev => {
                                                                const current = prev.branch_ids || [];
                                                                const exists = current.includes(bId);
                                                                const updated = exists
                                                                    ? current.filter(x => x !== bId)
                                                                    : [...current, bId];
                                                                return { ...prev, branch_ids: updated };
                                                            });
                                                        }}
                                                    />
                                                    <span style={{ fontWeight: 600 }}>{b.name || b.branch_name || `Branch #${b.id}`}</span>
                                                </label>
                                            );
                                        })
                                    ) : (
                                        <p style={{ padding: 8, margin: 0, fontSize: '0.76rem', color: '#94A3B8' }}>
                                            No branches available for this merchant.
                                        </p>
                                    )}
                                </div>
                                <small style={{ color: '#64748B', fontSize: '0.72rem', marginTop: 4, display: 'block' }}>
                                    {(membershipForm.branch_ids || []).length} branch(es) selected
                                </small>
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
                        disabled={isSubmitting}
                        style={{ padding: '10px 24px', borderRadius: 10, background: '#D97706', color: '#FFFFFF', fontWeight: 700, border: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, opacity: isSubmitting ? 0.7 : 1 }}
                    >
                        {isSubmitting ? (
                            <>
                                <i className="fas fa-spinner fa-spin" />
                                <span>Saving...</span>
                            </>
                        ) : (
                            <>
                                <i className="fas fa-save" />
                                <span>Save Membership Card</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
