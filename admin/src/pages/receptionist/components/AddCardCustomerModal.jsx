import React, { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import API from '../../../api.js'
import PhoneNumberField from '../../../components/PhoneNumberField.jsx'
import StampCardItem from '../../../components/StampCardItem.jsx'
import MembershipCardItem from '../../../components/MembershipCardItem.jsx'
import {
    fetchStampCardsApi,
    fetchMembershipCardsApi,
    getCardStyle
} from '../../../services/cardService.js'
import { getCountries, getCountryCallingCode } from 'react-phone-number-input'
import 'react-phone-input-2/lib/style.css'

// Dynamically generate all 245+ countries worldwide with ISO-2, dial code, and official country name
const regionNames = typeof Intl !== 'undefined' && Intl.DisplayNames ? new Intl.DisplayNames(['en'], { type: 'region' }) : null

export const getCountryData = () => {
    try {
        return getCountries().map((iso) => {
            let dialCode = ''
            try {
                dialCode = getCountryCallingCode(iso)
            } catch (e) {}

            let name = iso
            try {
                if (regionNames) {
                    name = regionNames.of(iso) || iso
                }
            } catch (e) {}

            return {
                name,
                iso2: iso.toLowerCase(),
                dialCode: String(dialCode)
            }
        })
    } catch (err) {
        return [{ name: 'India', iso2: 'in', dialCode: '91' }]
    }
}

export default function AddCardCustomerModal({
    isOpen,
    onClose,
    branchId = '',
    initialCustomer = null,
    initialEmail = '',
    initialPhone = '',
    initialSearch = '',
    onSuccess,
    asTab = false
}) {
    let receptionist = {}
    try {
        const rawReceptionist = localStorage.getItem('receptionist_data') || localStorage.getItem('rec_data')
        if (rawReceptionist && rawReceptionist !== 'null' && rawReceptionist !== 'undefined') {
            const parsed = JSON.parse(rawReceptionist)
            receptionist = parsed?.data || parsed?.user || parsed || {}
        }
    } catch (e) {
        console.error('Error parsing receptionist_data in modal:', e)
    }

    const effectiveBranchId =
        branchId ||
        receptionist?.user_branch_id ||
        localStorage.getItem('rec_branch_id') ||
        ''

    const branchName =
        receptionist?.user_branch ||
        'Branch'

    const branchCode = String(
        receptionist?.user_branch_code || receptionist?.country_code || receptionist?.countryCode || 'IN'
    ).trim().toLowerCase()

    const countryData = getCountryData().find(
        country => country.iso2 === branchCode || country.dialCode === branchCode.replace('+', '')
    )

    const branchDialCode = countryData
        ? `+${countryData.dialCode}`
        : branchCode.startsWith('+')
            ? branchCode
            : /^\d+$/.test(branchCode)
                ? `+${branchCode}`
                : '+91'

    // Customer Lookup & Form State
    const [searchQuery, setSearchQuery] = useState('')
    const [isSearching, setIsSearching] = useState(false)
    const [searchResults, setSearchResults] = useState([])
    const [searchPerformed, setSearchPerformed] = useState(false)
    const [selectedCustomerObj, setSelectedCustomerObj] = useState(null)
    const [isCreatingNewCustomer, setIsCreatingNewCustomer] = useState(false)

    const [customerId, setCustomerId] = useState('')
    const [customerName, setCustomerName] = useState('')
    const [email, setEmail] = useState('')
    const [phone, setPhone] = useState('')
    const [countryCode, setCountryCode] = useState(branchDialCode)
    // console.log("Country Code:", countryCode)
    const [customerStatus, setCustomerStatus] = useState('New Customer') // 'New Customer' | 'Existing Customer'

    // Card Selection State
    const [cardType, setCardType] = useState('stamp') // 'stamp' | 'membership'
    const [selectedCardId, setSelectedCardId] = useState('')
    const [initialStamps, setInitialStamps] = useState(1)
    const [notes, setNotes] = useState('')
    const [sendNotification, setSendNotification] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Dynamic Lists State
    const [stampCardsList, setStampCardsList] = useState([])
    const [membershipCardsList, setMembershipCardsList] = useState([])
    const [loadingCards, setLoadingCards] = useState(false)

    // Load branch cards
    useEffect(() => {
        if (!isOpen) return

        const loadCards = async () => {
            setLoadingCards(true)
            try {
                const [stamps, members] = await Promise.allSettled([
                    fetchStampCardsApi({
                        branchId: effectiveBranchId,
                        fallbackBrandName: branchName
                    }),
                    fetchMembershipCardsApi({
                        branchId: effectiveBranchId,
                        fallbackBrandName: branchName
                    })
                ])

                const sList = stamps.status === 'fulfilled' && Array.isArray(stamps.value) ? stamps.value : []
                const mList = members.status === 'fulfilled' && Array.isArray(members.value) ? members.value : []

                setStampCardsList(sList)
                setMembershipCardsList(mList)

                if (cardType === 'stamp' && sList.length > 0) {
                    setSelectedCardId(String(sList[0].id || sList[0]._id || ''))
                } else if (cardType === 'membership' && mList.length > 0) {
                    setSelectedCardId(String(mList[0].id || mList[0]._id || ''))
                }
            } catch (err) {
                console.error('Error loading branch cards in modal:', err)
            } finally {
                setLoadingCards(false)
            }
        }

        loadCards()
    }, [isOpen, effectiveBranchId, branchName])

    // Update selected card when switching cardType
    useEffect(() => {
        if (cardType === 'stamp') {
            if (stampCardsList.length > 0 && (!selectedCardId || !stampCardsList.some(c => String(c.id || c._id) === String(selectedCardId)))) {
                setSelectedCardId(String(stampCardsList[0].id || stampCardsList[0]._id || ''))
            }
        } else {
            if (membershipCardsList.length > 0 && (!selectedCardId || !membershipCardsList.some(c => String(c.id || c._id) === String(selectedCardId)))) {
                setSelectedCardId(String(membershipCardsList[0].id || membershipCardsList[0]._id || ''))
            }
        }
    }, [cardType, stampCardsList, membershipCardsList])

    // Initialize or reset when modal opens / initialCustomer changes
    useEffect(() => {
        if (!isOpen) {
            handleResetCustomer()
            return
        }

        if (initialCustomer && (initialCustomer.id || initialCustomer.cus_id)) {
            handleSelectCustomer(initialCustomer)
        } else if (initialSearch || initialEmail || initialPhone) {
            const query = (initialSearch || initialPhone || initialEmail || '').trim()
            setSearchQuery(query)
            setSelectedCustomerObj(null)
            setIsCreatingNewCustomer(false)
            setSearchResults([])
            setSearchPerformed(false)
        } else {
            handleResetCustomer()
        }
    }, [isOpen, initialCustomer, initialEmail, initialPhone, initialSearch])

    // ESC key closes modal
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen && onClose && !isSubmitting) {
                onClose()
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isOpen, onClose, isSubmitting])

    const handleSearchCustomer = async (customQuery) => {
        const q = (typeof customQuery === 'string' ? customQuery : searchQuery).trim()
        if (!q) {
            toast.error('Please enter a phone, email, or name to search')
            return
        }

        setIsSearching(true)
        setSearchPerformed(true)
        setSelectedCustomerObj(null)
        setIsCreatingNewCustomer(false)

        try {
            const response = await API.post('firstloop/customer/check-customer', { search: q })
            const resData = response?.data
            const custList = Array.isArray(resData?.data)
                ? resData.data
                : (resData?.customer ? [resData.customer] : (resData?.data ? [resData.data] : []))

            if (resData?.status === 1 && custList.length > 0) {
                setSearchResults(custList)
                toast.success(`Found ${custList.length} customer profile${custList.length > 1 ? 's' : ''}`)
            } else {
                setSearchResults([])
                setSelectedCustomerObj(null)
                setIsCreatingNewCustomer(false)
                setCustomerName('')
                toast('No customer found. You can add as a new customer.', { icon: 'ℹ️' })
            }
        } catch (error) {
            console.error('Error searching customer in modal:', error)
            setSearchResults([])
            setSelectedCustomerObj(null)
            setIsCreatingNewCustomer(false)
            setCustomerName('')
            toast.error('Error searching customer')
        } finally {
            setIsSearching(false)
        }
    }

    const handleSelectCustomer = (cust) => {
        if (!cust) return
        setSelectedCustomerObj(cust)
        setIsCreatingNewCustomer(false)
        setCustomerId(cust.id || cust.cus_id || '')
        setCustomerName(cust.name || '')
        setEmail(cust.email || '')
        setPhone(cust.phone ? String(cust.phone) : '')

        const rawCC = cust.country_code ?? cust.countryCode
        if (rawCC != null && rawCC !== '') {
            const strCC = String(rawCC).trim()
            setCountryCode(strCC.startsWith('+') ? strCC : `+${strCC}`)
        } else {
            setCountryCode(branchDialCode)
        }

        setCustomerStatus('Existing Customer')
        setSearchResults([])
        setSearchPerformed(false)
    }

    const handleStartNewCustomer = () => {
        setSelectedCustomerObj(null)
        setIsCreatingNewCustomer(true)
        setCustomerId('')
        setCustomerStatus('New Customer')

        const q = searchQuery.trim()
        if (q.includes('@')) {
            setEmail(q.toLowerCase())
            setPhone('')
            setCustomerName('')
        } else if (q) {
            const cleanedDigits = q.replace(/[^\d+]/g, '')
            if (cleanedDigits) {
                setPhone(cleanedDigits.replace(/^\+/, ''))
            } else {
                setPhone(q)
            }
            setEmail('')
            setCustomerName('')
        } else {
            setEmail('')
            setPhone('')
            setCustomerName('')
        }
    }

    const handleResetCustomer = () => {
        setSelectedCustomerObj(null)
        setIsCreatingNewCustomer(false)
        setCustomerId('')
        setCustomerName('')
        setEmail('')
        setPhone('')
        setCountryCode(branchDialCode)
        setCustomerStatus('New Customer')
        setSearchQuery('')
        setSearchResults([])
        setSearchPerformed(false)
        setInitialStamps(1)
        setNotes('')
    }

    // Active Card object
    const currentCardList = cardType === 'stamp' ? stampCardsList : membershipCardsList
    const activeCard = currentCardList.find(
        (c) => String(c.id || c._id) === String(selectedCardId)
    ) || (currentCardList.length > 0 ? currentCardList[0] : null)

    const handleSubmit = async (e) => {
        e?.preventDefault()

        if (!selectedCustomerObj && !isCreatingNewCustomer) {
            toast.error('Please lookup an existing customer or click "Add New Customer"')
            return
        }

        const cleanEmail = email.trim()
        const cleanName = customerName.trim()
        const cleanPhone = phone.trim()

        if (!cleanName) {
            toast.error('Customer name is required')
            return
        }

        if (!cleanPhone) {
            toast.error('Customer phone number is required')
            return
        }

        if (!cleanEmail) {
            toast.error('Customer email address is required')
            return
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(cleanEmail)) {
            toast.error('Please enter a valid email address')
            return
        }

        if (!selectedCardId) {
            toast.error('Please select a loyalty card to issue')
            return
        }

        const normalizedCountryCode = countryCode.startsWith('+') ? countryCode : `+${countryCode}`
        const branchNum = Number(effectiveBranchId)
        const cardIdNum = Number(selectedCardId) || selectedCardId

        const payload = {
            cardType,
            cus_id: customerId ? Number(customerId) || customerId : '',
            br_id: branchNum || effectiveBranchId || 'main',
            cardId: cardIdNum,
            name: cleanName,
            email: cleanEmail,
            phone: cleanPhone,
            country_code: normalizedCountryCode,
            notes: notes.trim(),
            initial_stamps: cardType === 'stamp' ? Math.max(0, Number(initialStamps) || 1) : undefined
        }

        setIsSubmitting(true)
        try {
            const response = await API.post('firstloop/customer/link-customer', payload)
            const resStatus = response?.data?.status
            const resMsg = response?.data?.message || response?.data?.msg || ''
            const resData = response?.data?.data

            if (resStatus === 1 || resStatus === '1' || response?.data?.success) {
                toast.success(resMsg || `🎉 Card successfully issued to ${cleanName}!`, {
                    duration: 4000
                })

                const targetCusId = resData?.customer_id || customerId || payload.cus_id || 1
                const targetCardId = resData?.customer_card_id || resData?.id

                const customerForCheckIn = {
                    id: targetCusId,
                    cus_id: targetCusId,
                    name: cleanName,
                    email: cleanEmail,
                    phone: cleanPhone,
                    country_code: normalizedCountryCode,
                    cards: [
                        {
                            id: targetCardId,
                            customer_card_id: targetCardId,
                            card_id: cardIdNum,
                            card_type: resData?.card_type || (cardType === 'membership' ? 2 : 1),
                            card_name: activeCard?.title || activeCard?.name || 'Loyalty Card',
                            title: activeCard?.title || activeCard?.name || 'Loyalty Card',
                            name: activeCard?.title || activeCard?.name || 'Loyalty Card',
                            branch_id: effectiveBranchId,
                            branch_name: branchName,
                            total_stamps: activeCard?.total_stamps || 10,
                            stamps: cardType === 'stamp' ? Math.max(1, Number(initialStamps) || 1) : 0
                        }
                    ]
                }

                if (onSuccess) {
                    onSuccess(resData, customerForCheckIn)
                }

                if (onClose) {
                    onClose()
                }
            } else if (resData && (resStatus === 0 || resStatus === '0')) {
                toast(resMsg || 'Customer already has this card. Opening check-in.', {
                    icon: 'ℹ️',
                    duration: 4000
                })

                const targetCusId = resData?.customer_id || customerId || payload.cus_id || 1
                const targetCardId = resData?.id || resData?.customer_card_id

                const existingCustomerForCheckIn = {
                    id: targetCusId,
                    cus_id: targetCusId,
                    name: cleanName,
                    email: cleanEmail,
                    phone: cleanPhone,
                    country_code: normalizedCountryCode,
                    cards: [
                        {
                            id: targetCardId,
                            customer_card_id: targetCardId,
                            card_id: cardIdNum,
                            card_type: resData?.card_type || (cardType === 'membership' ? 2 : 1),
                            title: activeCard?.title || activeCard?.name || 'Loyalty Card',
                            name: activeCard?.title || activeCard?.name || 'Loyalty Card',
                            branch_id: effectiveBranchId,
                            branch_name: branchName
                        }
                    ]
                }

                if (onSuccess) {
                    onSuccess(resData, existingCustomerForCheckIn)
                }

                if (onClose) {
                    onClose()
                }
            } else {
                toast.error(resMsg || 'Failed to issue card to customer')
            }
        } catch (error) {
            console.error('Error in AddCardCustomerModal link-customer:', error)
            const errMsg = error?.response?.data?.message || error?.response?.data?.msg || error?.message || 'Failed to issue card'
            toast.error(errMsg)
        } finally {
            setIsSubmitting(false)
        }
    }

    if (!isOpen) return null

    const dialogContent = (
        <div
            className={`add-card-modal-dialog ${asTab ? 'add-card-tab-dialog' : ''}`}
            onClick={(e) => e.stopPropagation()}
            style={asTab ? {
                maxWidth: '100%',
                maxHeight: 'none',
                borderRadius: 16,
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                border: '1px solid #E2E8F0',
                margin: 0
            } : {}}
        >
            {/* MODAL HEADER */}
            <div className="add-card-modal-header" style={asTab ? { borderTopLeftRadius: 16, borderTopRightRadius: 16 } : {}}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                        style={{
                            width: 42,
                            height: 42,
                            borderRadius: 12,
                            background: 'rgba(14, 136, 184, 0.25)',
                            border: '1px solid rgba(14, 136, 184, 0.4)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.2rem',
                            color: '#38BDF8'
                        }}
                    >
                        <i className="fas fa-id-card-alt" />
                    </div>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.2px' }}>
                                Issue Card to Customer
                            </h3>
                            <span
                                style={{
                                    background: 'rgba(14, 136, 184, 0.25)',
                                    color: '#38BDF8',
                                    fontSize: '0.7rem',
                                    fontWeight: 800,
                                    padding: '2px 8px',
                                    borderRadius: 6,
                                    border: '1px solid rgba(56, 189, 248, 0.3)'
                                }}
                            >
                                {asTab ? 'Add Customer Tab' : 'Counter Popup'}
                            </span>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.78rem', color: '#94A3B8', marginTop: 2 }}>
                            Assign loyalty card & proceed directly to check-in at <strong>{branchName}</strong>
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={onClose}
                    disabled={isSubmitting}
                    style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: 'none',
                        color: '#CBD5E1',
                        borderRadius: asTab ? 8 : '50%',
                        padding: asTab ? '6px 14px' : 0,
                        width: asTab ? 'auto' : 34,
                        height: 34,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        fontSize: asTab ? '0.8rem' : '0.9rem',
                        fontWeight: asTab ? 700 : 400,
                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                        transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)'; e.currentTarget.style.color = '#FCA5A5' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'; e.currentTarget.style.color = '#CBD5E1' }}
                    title={asTab ? 'Close Add Customer Tab' : 'Close Modal'}
                >
                    <i className="fas fa-times" />
                    {asTab && <span>Close Tab</span>}
                </button>
            </div>

            {/* MODAL BODY (SCROLLABLE) */}
            <div className="add-card-modal-body">
                    <div className="add-card-modal-grid">
                        {/* LEFT COLUMN: STEPS / FORM */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {/* 1. CUSTOMER LOOKUP / SELECTION */}
                            <div
                                style={{
                                    background: '#FFFFFF',
                                    borderRadius: 14,
                                    padding: '16px 18px',
                                    border: '1px solid #E2E8F0',
                                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        Step 1: Customer Profile
                                    </span>
                                    {selectedCustomerObj ? (
                                        <span style={{ background: '#DCFCE7', color: '#059669', fontSize: '0.72rem', fontWeight: 800, padding: '2px 8px', borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                            <i className="fas fa-check-circle" /> Existing Customer (#{selectedCustomerObj.id})
                                        </span>
                                    ) : isCreatingNewCustomer ? (
                                        <span style={{ background: '#E0F2FE', color: '#0284C7', fontSize: '0.72rem', fontWeight: 800, padding: '2px 8px', borderRadius: 6 }}>
                                            New Customer Profile
                                        </span>
                                    ) : null}
                                </div>

                                {/* Search Bar + Lookup button + Add New Customer button */}
                                {!selectedCustomerObj && (
                                    <div style={{ marginBottom: 14 }}>
                                        <div className="add-card-search-container">
                                            <div className="add-card-search-input-wrap">
                                                <i className="fas fa-search" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', fontSize: '0.85rem' }} />
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    placeholder="Search by phone, email, or name..."
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault()
                                                            handleSearchCustomer()
                                                        }
                                                    }}
                                                    style={{
                                                        paddingLeft: 36,
                                                        height: 38,
                                                        borderRadius: 10,
                                                        fontSize: '0.84rem',
                                                        border: '1px solid #CBD5E1',
                                                        width: '100%'
                                                    }}
                                                />
                                            </div>
                                            <div className="add-card-search-actions">
                                                <button
                                                    type="button"
                                                    className="btn firstloop-btn-primary"
                                                    onClick={() => handleSearchCustomer()}
                                                    disabled={isSearching || !searchQuery.trim()}
                                                    style={{
                                                        padding: '0 18px',
                                                        height: 38,
                                                        borderRadius: 10,
                                                        fontSize: '0.82rem',
                                                        fontWeight: 700,
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: 6
                                                    }}
                                                >
                                                    <i className={`fas ${isSearching ? 'fa-spinner fa-spin' : 'fa-search'}`} />
                                                    <span>{isSearching ? 'Searching...' : 'Lookup'}</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Search Results List when customer(s) found - Display customer details/list */}
                                {!selectedCustomerObj && !isCreatingNewCustomer && searchPerformed && searchResults.length > 0 && (
                                    <div style={{ marginBottom: 14, background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: 12, padding: 14 }}>
                                        <div style={{ fontSize: '0.78rem', color: '#0369A1', fontWeight: 800, marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <span>
                                                <i className="fas fa-users" style={{ marginRight: 6 }} />
                                                Matching Customer{searchResults.length > 1 ? 's' : ''} Found ({searchResults.length}):
                                            </span>
                                            <button
                                                type="button"
                                                onClick={handleStartNewCustomer}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    color: '#0284C7',
                                                    fontSize: '0.74rem',
                                                    fontWeight: 700,
                                                    cursor: 'pointer',
                                                    textDecoration: 'underline'
                                                }}
                                            >
                                                + Register as new customer instead
                                            </button>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 220, overflowY: 'auto' }}>
                                            {searchResults.map((cust) => (
                                                <div
                                                    key={cust.id || cust.cus_id}
                                                    onClick={() => handleSelectCustomer(cust)}
                                                    style={{
                                                        padding: '10px 14px',
                                                        borderRadius: 10,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                        cursor: 'pointer',
                                                        background: '#FFFFFF',
                                                        border: '1.5px solid #E0F2FE',
                                                        boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                                                        transition: 'all 0.15s ease'
                                                    }}
                                                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#0E88B8'; e.currentTarget.style.background = '#F8FAFC' }}
                                                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E0F2FE'; e.currentTarget.style.background = '#FFFFFF' }}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                        <div
                                                            style={{
                                                                width: 36,
                                                                height: 36,
                                                                borderRadius: '50%',
                                                                background: 'rgba(14, 136, 184, 0.1)',
                                                                color: '#0E88B8',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                fontWeight: 800,
                                                                fontSize: '0.85rem'
                                                            }}
                                                        >
                                                            {(cust.name || 'C').charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <strong style={{ fontSize: '0.88rem', color: '#0F172A', display: 'block' }}>
                                                                {cust.name || 'Customer'}
                                                            </strong>
                                                            <div style={{ fontSize: '0.76rem', color: '#64748B', display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 2 }}>
                                                                {cust.phone && (
                                                                    <span>
                                                                        <i className="fas fa-phone-alt" style={{ marginRight: 4, fontSize: '0.7rem' }} />
                                                                        +{String(cust.country_code || '91').replace('+', '')} {cust.phone}
                                                                    </span>
                                                                )}
                                                                {cust.email && (
                                                                    <span>
                                                                        <i className="fas fa-envelope" style={{ marginRight: 4, fontSize: '0.7rem' }} />
                                                                        {cust.email}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm firstloop-btn-primary"
                                                        style={{ padding: '6px 14px', fontSize: '0.76rem', borderRadius: 8, fontWeight: 700 }}
                                                    >
                                                        Select Customer
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* No Customer Found Banner - Display Add Customer option */}
                                {!selectedCustomerObj && !isCreatingNewCustomer && searchPerformed && searchResults.length === 0 && (
                                    <div style={{ marginBottom: 14, border: '1.5px dashed #CBD5E1', borderRadius: 12, backgroundColor: '#F8FAFC', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#F1F5F9', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
                                                <i className="fas fa-user-slash" />
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#1E293B' }}>
                                                    No customer found for &quot;{searchQuery}&quot;
                                                </div>
                                                <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: 2 }}>
                                                    Click &quot;Add Customer&quot; to register this customer and issue their card.
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            className="btn firstloop-btn-primary"
                                            onClick={handleStartNewCustomer}
                                            style={{
                                                borderRadius: 10,
                                                padding: '8px 16px',
                                                fontSize: '0.82rem',
                                                fontWeight: 700,
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: 6
                                            }}
                                        >
                                            <i className="fas fa-user-plus" />
                                            <span>Add Customer</span>
                                        </button>
                                    </div>
                                )}

                                {/* Existing Customer Profile Card */}
                                {selectedCustomerObj && (
                                    <div
                                        style={{
                                            padding: '12px 14px',
                                            borderRadius: 10,
                                            background: 'rgba(14, 136, 184, 0.06)',
                                            border: '1px solid rgba(14, 136, 184, 0.18)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            gap: 12
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div
                                                style={{
                                                    width: 38,
                                                    height: 38,
                                                    borderRadius: '50%',
                                                    background: 'var(--firstloop-primary)',
                                                    color: '#FFFFFF',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontWeight: 800,
                                                    fontSize: '0.9rem'
                                                }}
                                            >
                                                {(customerName || email || 'C').charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)', display: 'block' }}>
                                                    {customerName}
                                                </strong>
                                                <div style={{ fontSize: '0.78rem', color: '#64748B', display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 2 }}>
                                                    <span><i className="fas fa-phone-alt" style={{ marginRight: 4 }} />{countryCode} {phone}</span>
                                                    {email && <span><i className="fas fa-envelope" style={{ marginRight: 4 }} />{email}</span>}
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleResetCustomer}
                                            className="btn btn-sm btn-light"
                                            style={{ padding: '4px 10px', fontSize: '0.74rem', borderRadius: 6, fontWeight: 700 }}
                                            title="Change customer"
                                        >
                                            Change
                                        </button>
                                    </div>
                                )}

                                {/* Customer Form Fields - Only shown when creating new customer */}
                                {isCreatingNewCustomer && !selectedCustomerObj && (
                                    <div style={{ border: '1px solid #BAE6FD', borderRadius: 10, padding: 14, backgroundColor: '#F0F9FF' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottom: '1px solid #E0F2FE', paddingBottom: 8 }}>
                                            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0369A1' }}>
                                                <i className="fas fa-user-plus" style={{ marginRight: 6 }} />
                                                New Customer Registration
                                            </span>
                                            <button
                                                type="button"
                                                onClick={handleResetCustomer}
                                                style={{ background: 'none', border: 'none', color: '#64748B', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                                            >
                                                <i className="fas fa-arrow-left" style={{ marginRight: 4 }} />
                                                Back to Search
                                            </button>
                                        </div>

                                        <div className="add-card-form-grid">
                                            <div>
                                                <label style={{ fontSize: '0.76rem', fontWeight: 700, color: '#475569', marginBottom: 4, display: 'block' }}>
                                                    Full Name <span style={{ color: '#EF4444' }}>*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    placeholder="e.g. John Doe"
                                                    value={customerName}
                                                    onChange={(e) => setCustomerName(e.target.value)}
                                                    style={{ height: 38, borderRadius: 8, fontSize: '0.84rem' }}
                                                    required
                                                />
                                            </div>

                                            <div>
                                                <PhoneNumberField
                                                    value={phone}
                                                    countryCode={countryCode}
                                                    onChange={(p, cc) => {
                                                        setPhone(p)
                                                        if (cc) setCountryCode(cc)
                                                    }}
                                                    label="Phone Number"
                                                    required
                                                />
                                            </div>

                                            <div style={{ gridColumn: '1 / -1' }}>
                                                <label style={{ fontSize: '0.76rem', fontWeight: 700, color: '#475569', marginBottom: 4, display: 'block' }}>
                                                    Email Address <span style={{ color: '#EF4444' }}>*</span>
                                                </label>
                                                <input
                                                    type="email"
                                                    className="form-control"
                                                    placeholder="e.g. john@example.com"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    style={{ height: 38, borderRadius: 8, fontSize: '0.84rem' }}
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* 2. CARD TYPE SELECTOR */}
                            <div
                                style={{
                                    background: '#FFFFFF',
                                    borderRadius: 14,
                                    padding: '16px 18px',
                                    border: '1px solid #E2E8F0',
                                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)'
                                }}
                            >
                                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10, display: 'block' }}>
                                    Step 2: Loyalty Program Type
                                </label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                    <div
                                        onClick={() => setCardType('stamp')}
                                        style={{
                                            border: cardType === 'stamp' ? '2px solid var(--firstloop-primary)' : '1px solid #E2E8F0',
                                            borderRadius: 10,
                                            padding: '10px 14px',
                                            cursor: 'pointer',
                                            background: cardType === 'stamp' ? 'rgba(14, 136, 184, 0.08)' : '#FFFFFF',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 10,
                                            transition: 'all 0.15s ease'
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: 34,
                                                height: 34,
                                                borderRadius: 8,
                                                background: cardType === 'stamp' ? 'var(--firstloop-primary)' : '#F1F5F9',
                                                color: cardType === 'stamp' ? '#FFFFFF' : '#64748B',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '1rem'
                                            }}
                                        >
                                            <i className="fas fa-stamp" />
                                        </div>
                                        <div>
                                            <strong style={{ fontSize: '0.85rem', color: cardType === 'stamp' ? 'var(--firstloop-primary)' : '#1E293B', display: 'block' }}>
                                                Stamp Loyalty
                                            </strong>
                                            <small style={{ color: '#64748B', fontSize: '0.72rem' }}>
                                                {stampCardsList.length} card{stampCardsList.length !== 1 ? 's' : ''} available
                                            </small>
                                        </div>
                                    </div>

                                    {/* <div
                                        onClick={() => setCardType('membership')}
                                        style={{
                                            border: cardType === 'membership' ? '2px solid #D97706' : '1px solid #E2E8F0',
                                            borderRadius: 10,
                                            padding: '10px 14px',
                                            cursor: 'pointer',
                                            background: cardType === 'membership' ? 'rgba(217, 119, 6, 0.08)' : '#FFFFFF',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 10,
                                            transition: 'all 0.15s ease'
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: 34,
                                                height: 34,
                                                borderRadius: 8,
                                                background: cardType === 'membership' ? '#D97706' : '#F1F5F9',
                                                color: cardType === 'membership' ? '#FFFFFF' : '#64748B',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '1rem'
                                            }}
                                        >
                                            <i className="fas fa-crown" />
                                        </div>
                                        <div>
                                            <strong style={{ fontSize: '0.85rem', color: cardType === 'membership' ? '#B45309' : '#1E293B', display: 'block' }}>
                                                VIP Membership
                                            </strong>
                                            <small style={{ color: '#64748B', fontSize: '0.72rem' }}>
                                                {membershipCardsList.length} tier{membershipCardsList.length !== 1 ? 's' : ''} available
                                            </small>
                                        </div>
                                    </div> */}
                                </div>
                            </div>

                            {/* 3. CARDS LIST FOR BRANCH */}
                            <div
                                style={{
                                    background: '#FFFFFF',
                                    borderRadius: 14,
                                    padding: '16px 18px',
                                    border: '1px solid #E2E8F0',
                                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>
                                        Step 3: Select Card Template <span style={{ color: '#EF4444' }}>*</span>
                                    </label>
                                    {loadingCards && (
                                        <small style={{ color: 'var(--firstloop-primary)', fontWeight: 600 }}>
                                            <i className="fas fa-spinner fa-spin" style={{ marginRight: 4 }} /> Loading cards...
                                        </small>
                                    )}
                                </div>

                                {currentCardList.length > 0 ? (
                                    <div className="add-card-templates-grid">
                                        {currentCardList.map((card) => {
                                            const cId = String(card.id || card._id)
                                            const isSelected = String(selectedCardId) === cId
                                            const cardTheme = getCardStyle(card)

                                            return (
                                                <div
                                                    key={cId}
                                                    onClick={() => setSelectedCardId(cId)}
                                                    style={{
                                                        padding: '10px 12px',
                                                        borderRadius: 10,
                                                        background: '#FFFFFF',
                                                        border: isSelected ? '2px solid var(--firstloop-primary)' : '1px solid #E2E8F0',
                                                        boxShadow: isSelected ? '0 4px 14px rgba(14, 136, 184, 0.2)' : '0 1px 3px rgba(0,0,0,0.02)',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                        gap: 10,
                                                        position: 'relative',
                                                        transition: 'all 0.15s ease'
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                                                        <div
                                                            style={{
                                                                width: 32,
                                                                height: 32,
                                                                borderRadius: 8,
                                                                background: cardTheme.background || 'var(--firstloop-primary)',
                                                                color: '#FFFFFF',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                fontSize: '0.85rem',
                                                                flexShrink: 0
                                                            }}
                                                        >
                                                            <i className={cardType === 'stamp' ? 'fas fa-stamp' : 'fas fa-crown'} />
                                                        </div>
                                                        <div style={{ minWidth: 0 }}>
                                                            <strong style={{ fontSize: '0.82rem', color: '#0F172A', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                {card.title || card.name || 'Card Pass'}
                                                            </strong>
                                                            <div style={{ fontSize: '0.7rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                                                                {cardType === 'stamp' ? (
                                                                    <span><i className="fas fa-certificate" style={{ marginRight: 3, color: '#059669' }} />{card.total_stamps || 10} stamps</span>
                                                                ) : (
                                                                    <span><i className="fas fa-tag" style={{ marginRight: 3, color: '#D97706' }} />{card.tier || 'VIP'}</span>
                                                                )}
                                                                {card.reward && <span style={{ color: 'var(--firstloop-primary)', fontWeight: 700 }}>• {card.reward}</span>}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div
                                                        style={{
                                                            width: 18,
                                                            height: 18,
                                                            borderRadius: '50%',
                                                            border: isSelected ? '5px solid var(--firstloop-primary)' : '2px solid #CBD5E1',
                                                            flexShrink: 0,
                                                            transition: 'all 0.15s'
                                                        }}
                                                    />
                                                </div>
                                            )
                                        })}
                                    </div>
                                ) : (
                                    <div
                                        style={{
                                            padding: '16px',
                                            borderRadius: 10,
                                            background: '#FFFFFF',
                                            border: '1px dashed #CBD5E1',
                                            textAlign: 'center',
                                            color: '#64748B'
                                        }}
                                    >
                                        <i className="fas fa-exclamation-circle" style={{ fontSize: '1.2rem', color: '#94A3B8', marginBottom: 4, display: 'block' }} />
                                        <strong style={{ fontSize: '0.82rem', color: '#334155', display: 'block' }}>
                                            No {cardType === 'stamp' ? 'stamp' : 'membership'} cards found for this branch
                                        </strong>
                                    </div>
                                )}
                            </div>


                        </div>

                        {/* RIGHT COLUMN: LIVE DIGITAL PASS PREVIEW (LIKE AddCardCustomer.jsx) */}
                        <div className="add-card-preview-col">
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: 380, margin: '0 auto' }}>
                                <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <i className="fas fa-mobile-alt" style={{ color: 'var(--firstloop-primary)' }} />
                                    Live Digital Pass Preview
                                </h4>
                                <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>
                                    {cardType === 'stamp' ? 'Stamp Card' : 'Membership Card'}
                                </span>
                            </div>

                            {/* Card Item Render or Empty State */}
                            <div className="add-card-preview-content">
                                {activeCard && (activeCard.id || activeCard._id || activeCard.title || activeCard.name) ? (
                                    cardType === 'stamp' ? (
                                        <StampCardItem
                                            card={{
                                                ...activeCard,
                                                brandName: branchName || activeCard.brandName || 'FirstLoop Branch',
                                                brandLogo: activeCard.brandLogo
                                            }}
                                            merchantName={branchName || 'FirstLoop Branch'}
                                        />
                                    ) : (
                                        <MembershipCardItem
                                            card={{
                                                ...activeCard,
                                                brandName: branchName || activeCard.brandName || 'FirstLoop Branch',
                                                brandLogo: activeCard.brandLogo,
                                                cardholderName: customerName || 'Member Pass'
                                            }}
                                            merchantName={branchName || 'FirstLoop Branch'}
                                        />
                                    )
                                ) : (
                                    <div
                                        style={{
                                            width: '100%',
                                            maxWidth: 380,
                                            borderRadius: 20,
                                            backgroundColor: '#FFFFFF',
                                            border: '2px dashed #CBD5E1',
                                            padding: '30px 20px',
                                            textAlign: 'center',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            minHeight: 200,
                                            boxSizing: 'border-box',
                                            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.02)'
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: 46,
                                                height: 46,
                                                borderRadius: '50%',
                                                backgroundColor: '#F1F5F9',
                                                color: '#64748B',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '1.2rem',
                                                marginBottom: 10
                                            }}
                                        >
                                            <i className="fas fa-id-card-clip" />
                                        </div>
                                        <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#1E293B', marginBottom: 4 }}>
                                            No Card Selected
                                        </div>
                                        <p style={{ fontSize: '0.78rem', color: '#64748B', margin: 0, maxWidth: 240, lineHeight: 1.4 }}>
                                            Select a card template from the list on the left to see the live mobile pass preview.
                                        </p>
                                    </div>
                                )}

                                {/* Customer Assignment Summary Card */}
                                <div
                                    style={{
                                        backgroundColor: '#FFFFFF',
                                        border: '1px solid #E2E8F0',
                                        borderRadius: 14,
                                        padding: '14px 16px',
                                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
                                        maxWidth: 380,
                                        width: '100%',
                                        boxSizing: 'border-box'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                                        <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#64748B', fontWeight: 700 }}>
                                            Assigned Pass Holder
                                        </span>
                                        <span
                                            style={{
                                                fontSize: '0.7rem',
                                                fontWeight: 700,
                                                padding: '2px 8px',
                                                borderRadius: 999,
                                                backgroundColor: selectedCustomerObj ? '#DCFCE7' : isCreatingNewCustomer ? '#E0F2FE' : '#F1F5F9',
                                                color: selectedCustomerObj ? '#15803D' : isCreatingNewCustomer ? '#0369A1' : '#64748B'
                                            }}
                                        >
                                            {selectedCustomerObj ? 'Existing Customer' : isCreatingNewCustomer ? 'New Profile' : 'Not Selected'}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#1E293B' }}>
                                        {customerName || 'Customer Name'}
                                    </div>
                                    <div style={{ fontSize: '0.76rem', color: '#64748B', marginTop: 2 }}>
                                        {email || 'customer@example.com'} • {phone ? `${countryCode ? countryCode + ' ' : ''}${phone}` : '+1 (555) 000-0000'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* MODAL FOOTER */}
                <div className="add-card-modal-footer">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="btn btn-light"
                        style={{
                            padding: '10px 18px',
                            borderRadius: 10,
                            fontWeight: 700,
                            fontSize: '0.84rem',
                            color: '#64748B'
                        }}
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isSubmitting || !selectedCardId}
                        className="btn firstloop-btn-primary"
                        style={{
                            padding: '10px 22px',
                            borderRadius: 10,
                            fontWeight: 800,
                            fontSize: '0.86rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            boxShadow: '0 4px 14px rgba(14, 136, 184, 0.3)'
                        }}
                    >
                        {isSubmitting ? (
                            <>
                                <i className="fas fa-spinner fa-spin" />
                                <span>Issuing Card...</span>
                            </>
                        ) : (
                            <>
                                <i className="fas fa-check-circle" />
                                <span>Issue Card & Proceed to Check-In &rarr;</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
    )

    return (
        <>
            <style>{`
                .add-card-modal-overlay {
                    position: fixed;
                    inset: 0;
                    background-color: rgba(15, 23, 42, 0.72);
                    backdrop-filter: blur(6px);
                    -webkit-backdrop-filter: blur(6px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 100000;
                    padding: 16px;
                    overflow-y: auto;
                    box-sizing: border-box;
                }
                .add-card-modal-dialog {
                    background-color: #FFFFFF;
                    border-radius: 20px;
                    width: 100%;
                    max-width: 1060px;
                    max-height: 92vh;
                    display: flex;
                    flex-direction: column;
                    box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.35);
                    overflow: hidden;
                    position: relative;
                    box-sizing: border-box;
                }
                .add-card-modal-header {
                    padding: 16px 24px;
                    background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%);
                    color: #FFFFFF;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                    flex-shrink: 0;
                }
                .add-card-modal-body {
                    padding: 22px 24px;
                    overflow-y: auto;
                    flex: 1;
                    background: #F8FAFC;
                    -webkit-overflow-scrolling: touch;
                }
                .add-card-modal-grid {
                    display: grid;
                    grid-template-columns: minmax(0, 1.25fr) minmax(320px, 0.95fr);
                    gap: 24px;
                    align-items: start;
                }
                .add-card-search-container {
                    display: flex;
                    gap: 12px;
                    flex-wrap: wrap;
                    align-items: center;
                }
                .add-card-search-input-wrap {
                    position: relative;
                    flex: 1 1 240px;
                    min-width: 200px;
                }
                .add-card-search-actions {
                    display: flex;
                    gap: 8px;
                    align-items: center;
                }
                .add-card-form-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
                    gap: 12px;
                }
                .add-card-templates-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
                    gap: 10px;
                    max-height: 200px;
                    overflow-y: auto;
                    padding: 2px;
                }
                .add-card-preview-col {
                    position: sticky;
                    top: 0;
                    display: flex;
                    flex-direction: column;
                    gap: 14px;
                }
                .add-card-preview-content {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    align-items: center;
                    width: 100%;
                }
                .add-card-modal-footer {
                    padding: 16px 24px;
                    background: #FFFFFF;
                    border-top: 1px solid #E2E8F0;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    flex-shrink: 0;
                    gap: 12px;
                }

                /* Breakpoint: Tablets & Small Screens (<= 880px) */
                @media (max-width: 880px) {
                    .add-card-modal-grid {
                        display: flex !important;
                        flex-direction: column !important;
                        gap: 20px !important;
                    }
                    .add-card-preview-col {
                        position: static !important;
                        width: 100% !important;
                    }
                    .add-card-preview-content {
                        align-items: center !important;
                    }
                }

                /* Breakpoint: Mobile Screens (<= 640px) */
                @media (max-width: 640px) {
                    .add-card-modal-overlay {
                        padding: 8px 6px !important;
                        align-items: flex-end !important;
                    }
                    .add-card-modal-dialog {
                        max-height: 96vh !important;
                        border-radius: 16px 16px 12px 12px !important;
                    }
                    .add-card-modal-header {
                        padding: 12px 14px !important;
                    }
                    .add-card-modal-header h3 {
                        font-size: 1rem !important;
                    }
                    .add-card-modal-header p {
                        font-size: 0.72rem !important;
                    }
                    .add-card-modal-body {
                        padding: 14px 12px !important;
                    }
                    .add-card-search-container {
                        flex-direction: column !important;
                        gap: 8px !important;
                        align-items: stretch !important;
                    }
                    .add-card-search-input-wrap {
                        width: 100% !important;
                        min-width: 100% !important;
                        flex: none !important;
                    }
                    .add-card-search-actions {
                        width: 100% !important;
                        display: flex !important;
                        gap: 8px !important;
                    }
                    .add-card-search-actions button {
                        flex: 1 !important;
                        justify-content: center !important;
                        padding: 0 8px !important;
                        font-size: 0.78rem !important;
                    }
                    .add-card-form-grid {
                        grid-template-columns: 1fr !important;
                    }
                    .add-card-templates-grid {
                        grid-template-columns: 1fr !important;
                    }
                    .add-card-modal-footer {
                        padding: 12px 14px !important;
                        flex-direction: column-reverse !important;
                        gap: 8px !important;
                    }
                    .add-card-modal-footer button {
                        width: 100% !important;
                        justify-content: center !important;
                        padding: 10px 14px !important;
                        font-size: 0.84rem !important;
                    }
                }
            `}</style>
            {asTab ? (
                <div className="add-card-tab-wrapper" style={{ width: '100%', marginBottom: 30 }}>
                    {dialogContent}
                </div>
            ) : (
                <div
                    className="add-card-modal-overlay"
                    onClick={(e) => {
                        if (e.target === e.currentTarget && onClose && !isSubmitting) {
                            onClose()
                        }
                    }}
                >
                    {dialogContent}
                </div>
            )}
        </>
    )
}
