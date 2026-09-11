import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import html2canvas from 'html2canvas'
import CustomerCard from '../../components/CustomerCard.jsx'
import { fetchCustomerStampLevelsApi } from '../../services/cardService.js'
import API from '../../api.js'



export default function CardPreview() {
    const navigate = useNavigate()
    const { id: paramId, type: paramType } = useParams()
    const [searchParams] = useSearchParams()

    const rawType = searchParams.get('type') || paramType || '1'
    const cardType = Number(rawType) === 2 ? 2 : 1

    const rawCusId = searchParams.get('cus_id') || searchParams.get('customer_id') || null
    const cusId = rawCusId ? Number(rawCusId) : null

    const cardId = Number(paramId || searchParams.get('id')) || (paramId ? paramId : null)

    const cardRef = useRef(null)
    const [downloading, setDownloading] = useState(false)
    const [cardData, setCardData] = useState(null)
    const [loading, setLoading] = useState(Boolean(cardId))
    const [hasStaffToken, setHasStaffToken] = useState(false)
    const [customText, setCustomText] = useState('')
    const [selectedTemplate, setSelectedTemplate] = useState('default')

    // Recipient Customer states for direct WhatsApp messaging
    const [customerPhone, setCustomerPhone] = useState(
        searchParams.get('phone') || searchParams.get('customer_phone') || searchParams.get('mobile') || searchParams.get('cus_phone') || ''
    )
    const [customerCountryCode, setCustomerCountryCode] = useState(
        searchParams.get('country_code') || searchParams.get('cc') || ''
    )
    const [customerName, setCustomerName] = useState(
        searchParams.get('customer_name') || searchParams.get('cus_name') || ''
    )

    /*
    |--------------------------------------------------------------------------
    | CLEAN PHONE NUMBER FOR WHATSAPP API (DIGITS ONLY)
    |--------------------------------------------------------------------------
    */
    const cleanPhone = (phone, countryCode = '') => {
        if (!phone) return ''
        const p = String(phone).trim()
        const cc = String(countryCode || '').replace(/\D/g, '')
        let digits = p.replace(/\D/g, '')
        if (!digits) return ''
        if (cc && !digits.startsWith(cc)) {
            digits = `${cc}${digits}`
        }
        return digits
    }

    /*
    |--------------------------------------------------------------------------
    | CHECK ADMIN / MERCHANT / RECEPTIONIST TOKEN
    |--------------------------------------------------------------------------
    */
    useEffect(() => {
        const keys = [
            'access_token',
            'admin_token',
            'mer_access_token',
            'merchant_token',
            'rec_access_token',
            'receptionist_token'
        ]
        const tokenExists = keys.some((k) => {
            const val = localStorage.getItem(k)
            return val && val !== 'null' && val !== 'undefined'
        })
        setHasStaffToken(tokenExists)
    }, [])

    /*
    |--------------------------------------------------------------------------
    | RESOLVE CUSTOMER PHONE IF CUSTOMER ID IS PRESENT
    |--------------------------------------------------------------------------
    */
    const effectiveCusId = cusId || cardData?.customer_id || cardData?.customer?.id || null

    useEffect(() => {
        const qPhone = searchParams.get('phone') || searchParams.get('customer_phone') || searchParams.get('mobile') || searchParams.get('cus_phone')
        const qCc = searchParams.get('country_code') || searchParams.get('cc')
        const qName = searchParams.get('customer_name') || searchParams.get('cus_name')
        if (qPhone) {
            setCustomerPhone(qPhone)
            if (qCc) setCustomerCountryCode(qCc)
            if (qName) setCustomerName(qName)
            return
        }

        if (cardData?.customer_phone) {
            setCustomerPhone(cardData.customer_phone)
            if (cardData.customer_country_code) setCustomerCountryCode(cardData.customer_country_code)
            if (cardData.customer_name) setCustomerName(cardData.customer_name)
            return
        }

        if (effectiveCusId && hasStaffToken) {
            let isMounted = true
            API.post('/firstloop/customer/get-customer-details', { customer_id: Number(effectiveCusId) || effectiveCusId })
                .then((res) => {
                    if (!isMounted) return
                    if (res?.data?.status == 1 && res?.data?.data) {
                        const cus = res.data.data.customer || {}
                        if (cus.phone) setCustomerPhone(cus.phone)
                        if (cus.country_code) setCustomerCountryCode(cus.country_code)
                        if (cus.name) setCustomerName(cus.name)
                    }
                })
                .catch((err) => {
                    console.warn('Could not fetch customer details for WhatsApp:', err)
                })
            return () => {
                isMounted = false
            }
        }
    }, [cardData, effectiveCusId, hasStaffToken, searchParams])

    /*
    |--------------------------------------------------------------------------
    | PARSE PARAMS AS FALLBACK CARD (For real-time preview without API save)
    |--------------------------------------------------------------------------
    */
    const getFallbackCardFromParams = () => {
        const title = searchParams.get('title') || searchParams.get('name')
        const brandName = searchParams.get('brand') || searchParams.get('brand_name') || searchParams.get('brandName')
        const bgColor = searchParams.get('bgColor') || searchParams.get('bg_color')
        const borderColor = searchParams.get('borderColor') || searchParams.get('border_color')
        const bgImage = searchParams.get('bgImage') || searchParams.get('bg_image') || searchParams.get('background_image')
        const logo = searchParams.get('logo') || searchParams.get('brand_logo') || searchParams.get('brand_image')
        const totalStamps = Number(searchParams.get('stamps') || searchParams.get('total_stamps') || searchParams.get('number_of_stamps')) || 8
        const discountVal = searchParams.get('discount') || searchParams.get('discountVal') || searchParams.get('percentage') || '10'
        const validity = searchParams.get('validity') || '12 Months'
        const description = searchParams.get('description') || ''

        if (title || brandName || bgColor || borderColor || cardId) {
            return {
                id: cardId || 1,
                title: title || (cardType === 2 ? 'VIP Membership Pass' : 'Loyalty Stamp Card'),
                brandName: brandName || 'FirstLoop',
                brand_name: brandName || 'FirstLoop',
                brandLogo: logo || '',
                bgColor: bgColor || '#0E88B8',
                bg_color: bgColor || '#0E88B8',
                borderColor: borderColor || '#FFFFFF',
                border_color: borderColor || '#FFFFFF',
                bgImage: bgImage || '',
                background_image: bgImage || '',
                totalStamps: totalStamps,
                number_of_stamps: totalStamps,
                collected: 0,
                current_stamp: 0,
                discountVal: discountVal,
                discount: discountVal,
                validity: validity,
                description: description,
                card_type: cardType,
                type: cardType,
                stamp_levels: Array.from({ length: totalStamps }, (_, i) => ({
                    id: i + 1,
                    stamp_number: i + 1,
                    stamp: i + 1,
                    type: i + 1 === totalStamps ? 'Discount' : 'Free Item',
                    reward: i + 1 === totalStamps ? `${discountVal}% OFF Reward` : 'Free Reward',
                    reward_text: i + 1 === totalStamps ? `${discountVal}% OFF Reward` : 'Free Reward',
                    status: 0
                }))
            }
        }
        return null
    }

    /*
    |--------------------------------------------------------------------------
    | FETCH CARD (TYPE 1: STAMP, TYPE 2: MEMBERSHIP)
    |--------------------------------------------------------------------------
    */

    const fetchCardDetails = async () => {
        if (!cardId) {
            const fallback = getFallbackCardFromParams()
            setCardData(fallback)
            setLoading(false)
            return
        }

        setLoading(true)

        try {
            const data = await fetchCustomerStampLevelsApi(cardId, cardType, cusId)
            if (data) {
                setCardData(data)
            } else {
                // Try fallback from URL parameters if available
                const fallback = getFallbackCardFromParams()
                setCardData(fallback)
            }
        } catch (err) {
            console.error('Error fetching card details:', err)
            const fallback = getFallbackCardFromParams()
            setCardData(fallback)
        } finally {
            setLoading(false)
        }
    }

    /*
    |--------------------------------------------------------------------------
    | LOAD CARD WHEN ID, TYPE, OR CUS_ID CHANGES
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        fetchCardDetails()
    }, [cardId, cardType, cusId])

    /*
    |--------------------------------------------------------------------------
    | BROWSER TAB TITLE
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        if (!cardData) return

        const brand = cardData.brandName || cardData.brand_name || 'Merchant'
        const title = cardData.title || (cardType === 2 ? 'Membership Pass' : 'Digital Stamp Card')

        document.title = `${brand} - ${title}`
    }, [cardData, cardType])

    /*
    |--------------------------------------------------------------------------
    | DOWNLOAD CARD AS PNG
    |--------------------------------------------------------------------------
    */

    const handleDownload = async () => {
        if (!cardRef.current || !cardData) return
        try {
            setDownloading(true)
            const canvas = await html2canvas(cardRef.current, {
                scale: 3,
                useCORS: true,
                allowTaint: true,
                backgroundColor: null,
                logging: false
            })
            const image = canvas.toDataURL('image/png')
            const rawName = cardData.title || cardData.name || (cardType === 2 ? 'membership-pass' : 'stamp-card')
            const fileName = rawName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'card-pass'
            const link = document.createElement('a')
            link.href = image
            link.download = `${fileName}.png`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
        } catch (error) {
            console.error('Error downloading card canvas:', error)
        } finally {
            setDownloading(false)
        }
    }

    /*
    |--------------------------------------------------------------------------
    | HANDLE BACK
    |--------------------------------------------------------------------------
    */
    const handleBack = () => {
        if (window.history.length > 1) {
            navigate(-1)
        } else {
            navigate('/')
        }
    }

    /*
    |--------------------------------------------------------------------------
    | LOADING STATE
    |--------------------------------------------------------------------------
    */

    if (loading) {
        return (
            <div
                style={{
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 16,
                    background: '#F8FAFC'
                }}
            >
                <div
                    className="spinner-border text-primary"
                    role="status"
                    style={{
                        width: '2.5rem',
                        height: '2.5rem',
                        color: 'var(--firstloop-primary, #0E88B8)'
                    }}
                >
                    <span className="visually-hidden">Loading...</span>
                </div>
                <div style={{ color: 'var(--text-muted, #64748B)', fontSize: '0.9rem', fontWeight: 600 }}>
                    Loading Card Preview...
                </div>
            </div>
        )
    }

    /*
    |--------------------------------------------------------------------------
    | CARD NOT FOUND
    |--------------------------------------------------------------------------
    */

    if (!cardData) {
        return (
            <div
                style={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#F8FAFC',
                    padding: 20
                }}
            >
                <div
                    style={{
                        background: '#FFFFFF',
                        padding: 32,
                        borderRadius: 20,
                        textAlign: 'center',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
                        maxWidth: 420,
                        width: '100%',
                        border: '1px solid #E2E8F0'
                    }}
                >
                    <div
                        style={{
                            width: 60,
                            height: 60,
                            borderRadius: '50%',
                            background: 'rgba(239, 68, 68, 0.1)',
                            color: '#EF4444',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 16px',
                            fontSize: '1.5rem'
                        }}
                    >
                        <i className="fas fa-id-card-alt" />
                    </div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1E293B', marginBottom: 8 }}>
                        {cardType === 2 ? 'Membership Pass Not Found' : 'Stamp Card Not Found'}
                    </h3>
                    <p style={{ marginBottom: 20, color: '#64748B', fontSize: '0.88rem', lineHeight: 1.5 }}>
                        The requested card could not be loaded. Please check the URL or card ID.
                    </p>
                    {hasStaffToken && (
                        <button
                            type="button"
                            onClick={handleBack}
                            style={{
                                padding: '10px 24px',
                                borderRadius: 12,
                                background: '#0E88B8',
                                color: '#FFFFFF',
                                fontWeight: 700,
                                fontSize: '0.88rem',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 8,
                                boxShadow: '0 4px 12px rgba(14, 136, 184, 0.25)'
                            }}
                        >
                            <i className="fas fa-arrow-left" />
                            <span>Go Back</span>
                        </button>
                    )}
                </div>
            </div>
        )
    }

    const card = cardData

    const brand = card?.brandName || card?.brand_name || 'FirstLoop'
    const title = card?.title || card?.name || (cardType === 2 ? 'Membership Pass' : 'Stamp Card')
    const defaultDesc = card?.description || card?.descption || card?.reward_text || card?.reward || (cardType === 2 ? 'Enjoy exclusive perks and privileges with our digital membership pass!' : 'Collect stamps and unlock exciting rewards on every visit!')
    const recipient = customerName ? customerName : 'Valued Customer'

    const messageTemplates = [
        {
            id: 'default',
            label: '📋 Default Card Description',
            getText: () => defaultDesc
        },
        {
            id: 'welcome',
            label: '🎉 Welcome & Card Invitation',
            getText: () => `🎉 Hello ${recipient}! Here is your digital ${cardType === 2 ? 'membership pass' : 'stamp pass'} for *${brand}* - ${title}. Collect stamps & unlock exciting rewards!`
        },
        {
            id: 'reward',
            label: '🎁 Special Reward & Perks Alert',
            getText: () => `🎁 Special Perk from *${brand}*! Check your digital card and enjoy exclusive rewards on your visits.`
        },
        {
            id: 'reminder',
            label: '⭐ Visit & Stamp Reminder',
            getText: () => `⭐ Don't forget to present your digital pass at *${brand}* during your next visit to collect your stamps and claim your rewards!`
        },
        {
            id: 'custom',
            label: '✍️ Custom Message (Type below)',
            getText: () => ''
        }
    ]

    const handleTemplateChange = (templateId) => {
        setSelectedTemplate(templateId)
        const tmpl = messageTemplates.find(t => t.id === templateId)
        if (tmpl && templateId !== 'custom') {
            setCustomText(tmpl.getText())
        }
    }

    const targetPhone = cleanPhone(customerPhone, customerCountryCode)

    const handleSendToWhatsApp = () => {
        const passUrl = window.location.href

        let descToSend = customText.trim()
        if (!descToSend) {
            const tmpl = messageTemplates.find(t => t.id === selectedTemplate)
            descToSend = tmpl && tmpl.id !== 'custom' ? tmpl.getText() : defaultDesc
        }

        const hasUrl = descToSend.includes('http://') || descToSend.includes('https://')

        let message = ''
        if (customText.trim() || selectedTemplate !== 'default') {
            message = `${descToSend}${hasUrl ? '' : `\n\n👉 *View Card:* ${passUrl}`}`
        } else {
            message = `🎉 *${brand}* - ${title}\n\n📝 *Description:*\n${descToSend}\n\n👉 *View Card:* ${passUrl}`
        }

        let whatsappUrl = ''
        if (targetPhone) {
            whatsappUrl = `https://api.whatsapp.com/send?phone=${targetPhone}&text=${encodeURIComponent(message)}`
        } else {
            whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`
        }
        window.open(whatsappUrl, '_blank')
    }

    /*
    |--------------------------------------------------------------------------
    | RENDER CARD (UNIFIED DIMENSIONS & FIXED POSITIONS)
    |--------------------------------------------------------------------------
    */

    return (
        <div
            style={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '28px 16px',
                background: '#F8FAFC',
                gap: 16
            }}
        >
            {/* TOP BAR: BACK NAVIGATION BUTTON (ONLY IF STAFF TOKEN EXISTS) */}
            {hasStaffToken && (
                <div style={{ width: '100%', maxWidth: 420, display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
                    <button
                        type="button"
                        onClick={handleBack}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '8px 16px',
                            borderRadius: 10,
                            background: '#FFFFFF',
                            border: '1px solid #E2E8F0',
                            color: '#1E293B',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                            transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#F1F5F9'
                            e.currentTarget.style.borderColor = '#CBD5E1'
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#FFFFFF'
                            e.currentTarget.style.borderColor = '#E2E8F0'
                        }}
                    >
                        <i className="fas fa-arrow-left" style={{ color: '#0E88B8' }} />
                        <span>Back</span>
                    </button>
                </div>
            )}

            {/* REUSABLE CUSTOMER CARD COMPONENT */}
            <CustomerCard
                ref={cardRef}
                card={card}
                cardType={cardType}
            />

            {/* ACTION SECTION: WHATSAPP (FOR STAFF/ADMIN/MERCHANT/RECEPTIONIST) & DOWNLOAD */}
            <div style={{ width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {hasStaffToken && (
                    <div
                        style={{
                            background: '#FFFFFF',
                            border: '1px solid #E2E8F0',
                            borderRadius: 16,
                            padding: '16px',
                            boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 12
                        }}
                    >
                        {/* CUSTOMER PHONE / RECIPIENT HEADER */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <label
                                    style={{
                                        fontSize: '0.82rem',
                                        fontWeight: 700,
                                        color: '#1E293B',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 6,
                                        margin: 0
                                    }}
                                >
                                    <i className="fab fa-whatsapp" style={{ color: '#25D366', fontSize: '1.05rem' }} />
                                    <span>Recipient WhatsApp Number</span>
                                </label>
                                {effectiveCusId && (
                                    <span style={{ fontSize: '0.72rem', background: '#F1F5F9', color: '#0E88B8', padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>
                                        Customer #{effectiveCusId}
                                    </span>
                                )}
                            </div>
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                <i className="fas fa-phone-alt" style={{ position: 'absolute', left: 12, color: '#94A3B8', fontSize: '0.8rem' }} />
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Enter phone with country code (e.g. 919876543210)"
                                    value={customerPhone}
                                    onChange={(e) => setCustomerPhone(e.target.value)}
                                    style={{
                                        paddingLeft: 34,
                                        fontSize: '0.84rem',
                                        borderRadius: 10,
                                        border: '1.5px solid #CBD5E1',
                                        background: '#FFFFFF',
                                        color: '#0F172A',
                                        height: 38
                                    }}
                                />
                            </div>
                            {customerName && (
                                <div style={{ fontSize: '0.74rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <i className="fas fa-user-check" style={{ color: '#0E88B8', fontSize: '0.75rem' }} />
                                    <span>Customer: <strong style={{ color: '#1E293B' }}>{customerName}</strong></span>
                                </div>
                            )}
                        </div>

                        {/* DESCRIPTION / MESSAGE BOX WITH DROPDOWN TEMPLATES */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <label
                                    style={{
                                        fontSize: '0.8rem',
                                        fontWeight: 700,
                                        color: '#334155',
                                        margin: 0,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 6
                                    }}
                                >
                                    <i className="fas fa-comment-alt" style={{ color: '#0E88B8', fontSize: '0.85rem' }} />
                                    <span>WhatsApp Description / Message</span>
                                </label>
                                {(customText || selectedTemplate !== 'default') && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setCustomText('')
                                            setSelectedTemplate('default')
                                        }}
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            color: '#EF4444',
                                            fontSize: '0.72rem',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            padding: 0
                                        }}
                                    >
                                        Reset to Default
                                    </button>
                                )}
                            </div>

                            {/* Dropdown list for pre-set messages */}
                            <div>
                                <label style={{ fontSize: '0.74rem', fontWeight: 600, color: '#64748B', marginBottom: 3, display: 'block' }}>
                                    Select Pre-set Template or Write Custom:
                                </label>
                                <select
                                    className="form-control"
                                    value={selectedTemplate}
                                    onChange={(e) => handleTemplateChange(e.target.value)}
                                    style={{
                                        height: 38,
                                        borderRadius: 10,
                                        border: '1.5px solid #CBD5E1',
                                        fontSize: '0.82rem',
                                        fontWeight: 600,
                                        color: '#1E293B',
                                        background: '#FFFFFF',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {messageTemplates.map(tmpl => (
                                        <option key={tmpl.id} value={tmpl.id}>
                                            {tmpl.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Text box for custom message */}
                            <div>
                                <label style={{ fontSize: '0.74rem', fontWeight: 600, color: '#64748B', marginBottom: 3, display: 'block' }}>
                                    Message Text Box:
                                </label>
                                <textarea
                                    className="form-control"
                                    rows={3}
                                    placeholder={`Type custom text here or select from dropdown above...\nDefault: "${defaultDesc}"`}
                                    value={customText}
                                    onChange={(e) => {
                                        setCustomText(e.target.value)
                                        setSelectedTemplate('custom')
                                    }}
                                    style={{
                                        width: '100%',
                                        minHeight: 70,
                                        fontSize: '0.84rem',
                                        borderRadius: 10,
                                        border: '1.5px solid #CBD5E1',
                                        background: '#FFFFFF',
                                        color: '#0F172A',
                                        colorScheme: 'light',
                                        padding: '8px 12px',
                                        resize: 'vertical'
                                    }}
                                />
                                <small style={{ fontSize: '0.71rem', color: '#94A3B8', marginTop: 2, display: 'block' }}>
                                    💡 If you don't select from the dropdown, your text above will be sent. Card link is attached automatically.
                                </small>
                            </div>
                        </div>

                        {/* SEND BUTTON */}
                        <button
                            type="button"
                            onClick={handleSendToWhatsApp}
                            className="btn"
                            style={{
                                width: '100%',
                                padding: '11px 18px',
                                borderRadius: 12,
                                background: '#25D366',
                                color: '#FFFFFF',
                                fontWeight: 700,
                                fontSize: '0.88rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 8,
                                border: 'none',
                                cursor: 'pointer',
                                boxShadow: '0 4px 14px rgba(37, 211, 102, 0.28)',
                                transition: 'all 0.15s ease'
                            }}
                        >
                            <i className="fab fa-whatsapp" style={{ fontSize: '1.15rem' }} />
                            <span>
                                {targetPhone
                                    ? `Send Direct to WhatsApp (+${targetPhone})`
                                    : 'Send to WhatsApp'}
                            </span>
                        </button>
                    </div>
                )}

                {/* DOWNLOAD BUTTON */}
                <button
                    type="button"
                    onClick={handleDownload}
                    disabled={downloading}
                    style={{
                        width: '100%',
                        padding: '12px 20px',
                        borderRadius: 14,
                        background: '#0E88B8',
                        color: '#FFFFFF',
                        fontWeight: 700,
                        fontSize: '0.92rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 10,
                        border: 'none',
                        cursor: downloading ? 'not-allowed' : 'pointer',
                        boxShadow: '0 6px 18px rgba(14, 136, 184, 0.28)',
                        opacity: downloading ? 0.75 : 1,
                        transition: 'all 0.2s ease'
                    }}
                >
                    <i className={`fas ${downloading ? 'fa-spinner fa-spin' : 'fa-download'}`} style={{ fontSize: '1rem' }} />
                    <span>{downloading ? 'Downloading...' : `Download ${card.title || (cardType === 2 ? 'Membership Pass' : 'Stamp Card')}`}</span>
                </button>
            </div>
        </div>
    )
}