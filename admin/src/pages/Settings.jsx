import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import API from '../api.js'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import ReactQuill from 'react-quill-new'
import 'react-quill-new/dist/quill.snow.css'
import { CountrySelect, GetCountries } from 'react-country-state-city'
import 'react-country-state-city/dist/react-country-state-city.css'

const BANNERS_PER_PAGE = 5
const PAGES_PER_PAGE = 5

const PAGE_TYPE_LABELS = {
    privacy_policy: 'Privacy Policy',
    terms_conditions: 'Terms & Conditions Merchant',
    terms_conditions_customer: 'Terms & Conditions Customer'
}

const quillModules = {
    toolbar: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        ['link', 'clean']
    ]
}

export default function Settings() {
    const [activeTab, setActiveTab] = useState('banners') // 'banners' or 'pages'
    const [submitting, setSubmitting] = useState(false)
    const [detailLoading, setDetailLoading] = useState(false)

    // ==========================================
    // BANNERS STATE & HANDLERS
    // ==========================================
    const [banners, setBanners] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [currentPage, setCurrentPage] = useState(1)

    const [showAddModal, setShowAddModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [showViewModal, setShowViewModal] = useState(false)
    const [selectedBanner, setSelectedBanner] = useState(null)
    const [countriesList, setCountriesList] = useState([])

    const [newBanner, setNewBanner] = useState({
        title: '',
        status: 1,
        image: null,
        imagePreview: '',
        country_code: ''
    })

    const [editBanner, setEditBanner] = useState({
        id: '',
        title: '',
        status: 1,
        image: null,
        imagePreview: '',
        country_code: ''
    })

    // ==========================================
    // PAGES STATE & HANDLERS
    // ==========================================
    const [pages, setPages] = useState([])
    const [pagesLoading, setPagesLoading] = useState(true)
    const [pageSearchTerm, setPageSearchTerm] = useState('')
    const [pageCurrentPage, setPageCurrentPage] = useState(1)
    const [showPageModal, setShowPageModal] = useState(false)
    const [showPageViewModal, setShowPageViewModal] = useState(false)
    const [selectedPage, setSelectedPage] = useState(null)

    const [pageForm, setPageForm] = useState({
        page_type: 'terms_conditions',
        title: 'Terms & Conditions',
        content: '',
        status: 1
    })

    // ==========================================
    // APP STATUS STATE (id=1 Merchant, id=2 Customer)
    // ==========================================
    const [merchantApp, setMerchantApp] = useState({ id: 1, status: true, loading: false, submitting: false })
    const [customerApp, setCustomerApp] = useState({ id: 2, status: true, loading: false, submitting: false })
    const [appStatusLoading, setAppStatusLoading] = useState(false)

    // Confirmation Dialog State
    const [confirmDialog, setConfirmDialog] = useState({
        open: false,
        title: '',
        message: '',
        confirmText: 'Delete',
        cancelText: 'Cancel',
        onConfirm: null,
        loading: false
    })

    // Helper functions
    const isSuccessResponse = (data) => {
        return data && (data.success === true || data.status === 'success' || data.status === 1 || data.status === '1')
    }

    const getImageUrl = (imagePath) => {
        if (!imagePath) return ''
        if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('data:')) {
            return imagePath
        }
        const baseUrl = import.meta.env.VITE_API_URL || ''
        if (baseUrl && imagePath.startsWith(baseUrl)) {
            return imagePath
        }
        const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath
        return `${baseUrl}/${cleanPath}`
    }

    // Fetch Banner List
    const fetchBanners = async () => {
        setLoading(true)
        try {
            const response = await API.get('admin/banner-list')
            if (isSuccessResponse(response.data)) {
                setBanners(response.data.data || [])
            } else {
                setBanners([])
            }
        } catch (err) {
            console.error("Error fetching banners:", err)
            toast.error(err.response?.data?.message || "Failed to fetch banner list")
            setBanners([])
        } finally {
            setLoading(false)
        }
    }

    // Fetch Pages List
    const fetchPages = async () => {
        setPagesLoading(true)
        try {
            const response = await API.get('admin/page-list')
            if (isSuccessResponse(response.data)) {
                setPages(response.data.data || [])
            } else {
                setPages([])
            }
        } catch (err) {
            console.error("Error fetching pages:", err)
            toast.error(err.response?.data?.message || "Failed to fetch pages list")
            setPages([])
        } finally {
            setPagesLoading(false)
        }
    }

    const fetchAppStatus = async () => {
        setAppStatusLoading(true)
        try {
            const response = await API.get('admin/app-status')
            if (isSuccessResponse(response.data) && response.data.data) {
                const list = Array.isArray(response.data.data) ? response.data.data : [response.data.data]
                list.forEach((item) => {
                    if (Number(item.id) === 1) {
                        setMerchantApp((prev) => ({ ...prev, id: item.id, status: !!item.app_status }))
                    }
                    if (Number(item.id) === 2) {
                        setCustomerApp((prev) => ({ ...prev, id: item.id, status: !!item.app_status }))
                    }
                })
            }
        } catch (err) {
            console.error('Error fetching app status:', err)
            toast.error('Failed to fetch app status')
        } finally {
            setAppStatusLoading(false)
        }
    }

    const handleMerchantAppToggle = async () => {
        setMerchantApp((prev) => ({ ...prev, submitting: true }))
        const nextStatus = !merchantApp.status
        try {
            const response = await API.post('admin/update-app-status', {
                id: merchantApp.id,
                app_status: nextStatus
            })
            if (isSuccessResponse(response.data)) {
                setMerchantApp((prev) => ({ ...prev, status: nextStatus }))
                toast.success(response.data.message || 'Merchant app status updated')
            } else {
                toast.error(response.data.message || 'Failed to update merchant app status')
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update merchant app status')
        } finally {
            setMerchantApp((prev) => ({ ...prev, submitting: false }))
        }
    }

    const handleCustomerAppToggle = async () => {
        setCustomerApp((prev) => ({ ...prev, submitting: true }))
        const nextStatus = !customerApp.status
        try {
            const response = await API.post('admin/update-app-status', {
                id: customerApp.id,
                app_status: nextStatus
            })
            if (isSuccessResponse(response.data)) {
                setCustomerApp((prev) => ({ ...prev, status: nextStatus }))
                toast.success(response.data.message || 'Customer app status updated')
            } else {
                toast.error(response.data.message || 'Failed to update customer app status')
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update customer app status')
        } finally {
            setCustomerApp((prev) => ({ ...prev, submitting: false }))
        }
    }

    const getCountryName = (countryCode) => {
        if (!countryCode) return 'N/A'
        const cleanCode = String(countryCode).replace('+', '')
        const matches = countriesList.filter(c => String(c.phone_code) === cleanCode)
        if (matches.length === 0) return countryCode
        
        if (cleanCode === '1') {
            const us = matches.find(c => c.name.toLowerCase().includes('united states'))
            if (us) return us.name
        }
        if (cleanCode === '44') {
            const uk = matches.find(c => c.name.toLowerCase().includes('united kingdom'))
            if (uk) return uk.name
        }
        
        return matches[0].name
    }

    useEffect(() => {
        fetchBanners()
        fetchPages()
        fetchAppStatus()
        GetCountries().then((data) => {
            setCountriesList(data || [])
        })
    }, [])

    useEffect(() => {
        setCurrentPage(1)
    }, [searchTerm])

    useEffect(() => {
        setPageCurrentPage(1)
    }, [pageSearchTerm])

    // Image Upload Change Handler
    const handleImageChange = (e, isEdit = false) => {
        const file = e.target.files[0]
        if (file) {
            if (!file.type.startsWith('image/')) {
                toast.error("Please select a valid image file")
                return
            }
            const previewUrl = URL.createObjectURL(file)
            if (isEdit) {
                setEditBanner(prev => ({
                    ...prev,
                    image: file,
                    imagePreview: previewUrl
                }))
            } else {
                setNewBanner(prev => ({
                    ...prev,
                    image: file,
                    imagePreview: previewUrl
                }))
            }
        }
    }

    // ==========================================
    // BANNERS CRUD HANDLERS
    // ==========================================
    const openViewModal = (banner) => {
        setSelectedBanner(banner)
        setShowViewModal(true)
    }

    const openEditModal = async (banner) => {
        setSelectedBanner(banner)
        setEditBanner({
            id: banner.id,
            title: '',
            status: 1,
            image: null,
            imagePreview: '',
            country_code: ''
        })
        setShowEditModal(true)
        setDetailLoading(true)

        try {
            const response = await API.get(`admin/banner-details/${encodeURIComponent(banner.id)}`)
            if (isSuccessResponse(response.data)) {
                const data = response.data.data || response.data
                setEditBanner({
                    id: data.id,
                    title: data.title || '',
                    status: data.status !== undefined ? parseInt(data.status) : 1,
                    image: null,
                    imagePreview: getImageUrl(data.image) || '',
                    country_code: data.country_code || ''
                })
            } else {
                toast.error(response.data.message || "Failed to fetch banner details")
                setShowEditModal(false)
            }
        } catch (err) {
            console.error("Error fetching banner details:", err)
            toast.error(err.response?.data?.message || "Failed to fetch banner details")
            setShowEditModal(false)
        } finally {
            setDetailLoading(false)
        }
    }

    const handleCreateBanner = async (e) => {
        e.preventDefault()

        if (!newBanner.title.trim()) {
            toast.error("Title is required")
            return
        }
        if (!newBanner.country_code) {
            toast.error("Country is required")
            return
        }
        if (!newBanner.image) {
            toast.error("Banner image is required")
            return
        }

        setSubmitting(true)
        const formData = new FormData()
        formData.append('title', newBanner.title.trim())
        formData.append('status', newBanner.status)
        formData.append('image', newBanner.image)
        formData.append('country_code', newBanner.country_code)

        try {
            const response = await API.post('admin/create-banner', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
            if (isSuccessResponse(response.data)) {
                toast.success(response.data.message || "Banner created successfully")
                setShowAddModal(false)
                setNewBanner({ title: '', status: 1, image: null, imagePreview: '', country_code: '' })
                await fetchBanners()
            } else {
                toast.error(response.data.message || "Failed to create banner")
            }
        } catch (err) {
            console.error("Error creating banner:", err)
            toast.error(err.response?.data?.message || err.message || "Failed to create banner")
        } finally {
            setSubmitting(false)
        }
    }

    const handleUpdateBanner = async (e) => {
        e.preventDefault()

        if (!editBanner.title.trim()) {
            toast.error("Title is required")
            return
        }
        if (!editBanner.country_code) {
            toast.error("Country is required")
            return
        }

        setSubmitting(true)
        const formData = new FormData()
        formData.append('id', editBanner.id)
        formData.append('title', editBanner.title.trim())
        formData.append('status', editBanner.status)
        formData.append('country_code', editBanner.country_code)
        if (editBanner.image) {
            formData.append('image', editBanner.image)
        }

        try {
            const response = await API.post('admin/update-banner', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
            if (isSuccessResponse(response.data)) {
                toast.success(response.data.message || "Banner updated successfully")
                setShowEditModal(false)
                setSelectedBanner(null)
                await fetchBanners()
            } else {
                toast.error(response.data.message || "Failed to update banner")
            }
        } catch (err) {
            console.error("Error updating banner:", err)
            toast.error(err.response?.data?.message || err.message || "Failed to update banner")
        } finally {
            setSubmitting(false)
        }
    }

    const handleStatusToggle = async (banner) => {
        const newStatus = banner.status == 1 ? 0 : 1
        setSubmitting(true)
        
        const formData = new FormData()
        formData.append('id', banner.id)
        formData.append('title', banner.title)
        formData.append('status', newStatus)
        formData.append('country_code', banner.country_code || '')

        try {
            const response = await API.post('admin/update-banner', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
            if (isSuccessResponse(response.data)) {
                toast.success(response.data.message || "Status updated successfully")
                await fetchBanners()
            } else {
                toast.error(response.data.message || "Failed to update status")
            }
        } catch (err) {
            console.error("Error toggling status:", err)
            toast.error(err.response?.data?.message || "Failed to update status")
        } finally {
            setSubmitting(false)
        }
    }

    const handleDeleteClick = (banner) => {
        setConfirmDialog({
            open: true,
            title: 'Delete Banner',
            message: `Are you sure you want to delete the banner "${banner.title}"? This action cannot be undone.`,
            confirmText: 'Delete',
            cancelText: 'Cancel',
            loading: false,
            onConfirm: () => performDeleteBanner(banner.id)
        })
    }

    const performDeleteBanner = async (id) => {
        setConfirmDialog(prev => ({ ...prev, loading: true }))
        try {
            const response = await API.delete(`admin/delete-banner/${encodeURIComponent(id)}`)
            if (isSuccessResponse(response.data)) {
                toast.success(response.data.message || "Banner deleted successfully")
                await fetchBanners()
                setConfirmDialog({ open: false, title: '', message: '', loading: false, onConfirm: null })
            } else {
                toast.error(response.data.message || "Failed to delete banner")
                setConfirmDialog(prev => ({ ...prev, loading: false }))
            }
        } catch (err) {
            console.error("Error deleting banner:", err)
            toast.error(err.response?.data?.message || "Failed to delete banner")
            setConfirmDialog(prev => ({ ...prev, loading: false }))
        }
    }

    // ==========================================
    // PAGES CRUD HANDLERS
    // ==========================================
    const openPageViewModal = async (page) => {
        setSelectedPage(page)
        setShowPageViewModal(true)
        setDetailLoading(true)

        try {
            const response = await API.get(`admin/page-details/${encodeURIComponent(page.id)}`)
            if (isSuccessResponse(response.data)) {
                const data = response.data.data || response.data
                setSelectedPage(data)
            } else {
                toast.error(response.data.message || "Failed to fetch page details")
                setShowPageViewModal(false)
            }
        } catch (err) {
            console.error("Error fetching page details:", err)
            toast.error(err.response?.data?.message || "Failed to fetch page details")
            setShowPageViewModal(false)
        } finally {
            setDetailLoading(false)
        }
    }

    const handlePageTypeChange = (e) => {
        const newType = e.target.value
        setPageForm(prev => ({
            ...prev,
            page_type: newType,
            title: !selectedPage ? (PAGE_TYPE_LABELS[newType] || '') : prev.title
        }))
    }

    const openAddPageModal = () => {
        setSelectedPage(null)
        setPageForm({
            page_type: 'privacy_policy',
            title: 'Privacy Policy',
            content: '',
            status: 1
        })
        setShowPageModal(true)
    }

    const openEditPageModal = async (page) => {
        setSelectedPage(page)
        setPageForm({
            page_type: page.page_type || 'privacy_policy',
            title: page.title || '',
            content: '',
            status: page.status !== undefined ? parseInt(page.status) : 1
        })
        setShowPageModal(true)
        setDetailLoading(true)

        try {
            const response = await API.get(`admin/page-details/${encodeURIComponent(page.id)}`)
            if (isSuccessResponse(response.data)) {
                const data = response.data.data || response.data
                setPageForm({
                    id: data.id,
                    page_type: data.page_type || 'privacy_policy',
                    title: data.title || '',
                    content: data.content || '',
                    status: data.status !== undefined ? parseInt(data.status) : 1
                })
            } else {
                toast.error(response.data.message || "Failed to fetch page details")
                setShowPageModal(false)
            }
        } catch (err) {
            console.error("Error fetching page details:", err)
            toast.error(err.response?.data?.message || "Failed to fetch page details")
            setShowPageModal(false)
        } finally {
            setDetailLoading(false)
        }
    }

    const handleSavePage = async (e) => {
        e.preventDefault()

        if (!pageForm.title.trim()) {
            toast.error("Title is required")
            return
        }
        if (!pageForm.content.trim()) {
            toast.error("Content is required")
            return
        }

        setSubmitting(true)
        const isEdit = !!selectedPage
        const url = isEdit ? 'admin/update-page' : 'admin/create-page'

        const payload = {
            page_type: pageForm.page_type,
            title: pageForm.title.trim(),
            content: pageForm.content
        }

        if (isEdit) {
            payload.id = pageForm.id
            payload.status = pageForm.status
        }

        try {
            const response = await API.post(url, payload)
            if (isSuccessResponse(response.data)) {
                toast.success(response.data.message || `Page ${isEdit ? 'updated' : 'created'} successfully`)
                setShowPageModal(false)
                setSelectedPage(null)
                await fetchPages()
            } else {
                toast.error(response.data.message || "Failed to save page")
            }
        } catch (err) {
            console.error("Error saving page:", err)
            toast.error(err.response?.data?.message || err.message || "Failed to save page")
        } finally {
            setSubmitting(false)
        }
    }

    const handlePageStatusToggle = async (page) => {
        setSubmitting(true)
        const newStatus = page.status == 1 ? 0 : 1

        const payload = {
            id: page.id,
            page_type: page.page_type,
            title: page.title,
            content: page.content || '',
            status: newStatus
        }

        try {
            const response = await API.post('admin/update-page', payload)
            if (isSuccessResponse(response.data)) {
                toast.success(response.data.message || "Status updated successfully")
                await fetchPages()
            } else {
                toast.error(response.data.message || "Failed to update status")
            }
        } catch (err) {
            console.error("Error toggling page status:", err)
            toast.error(err.response?.data?.message || "Failed to update status")
        } finally {
            setSubmitting(false)
        }
    }

    const handleDeletePageClick = (page) => {
        setConfirmDialog({
            open: true,
            title: 'Delete Page',
            message: `Are you sure you want to delete the page "${page.title}"? This action cannot be undone.`,
            confirmText: 'Delete',
            cancelText: 'Cancel',
            loading: false,
            onConfirm: () => performDeletePage(page.id)
        })
    }

    const performDeletePage = async (id) => {
        setConfirmDialog(prev => ({ ...prev, loading: true }))
        try {
            const response = await API.delete(`admin/delete-page/${encodeURIComponent(id)}`)
            if (isSuccessResponse(response.data)) {
                toast.success(response.data.message || "Page deleted successfully")
                await fetchPages()
                setConfirmDialog({ open: false, title: '', message: '', loading: false, onConfirm: null })
            } else {
                toast.error(response.data.message || "Failed to delete page")
                setConfirmDialog(prev => ({ ...prev, loading: false }))
            }
        } catch (err) {
            console.error("Error deleting page:", err)
            toast.error(err.response?.data?.message || "Failed to delete page")
            setConfirmDialog(prev => ({ ...prev, loading: false }))
        }
    }

    // ==========================================
    // FILTER & PAGINATION CALCULATIONS
    // ==========================================

    // Banner calculations
    const filteredBanners = banners.filter(banner => {
        const titleMatch = banner.title?.toLowerCase().includes(searchTerm.toLowerCase())
        const countryName = getCountryName(banner.country_code)
        const countryMatch = countryName.toLowerCase().includes(searchTerm.toLowerCase())
        return titleMatch || countryMatch
    })
    const bannerTotalPages = Math.max(1, Math.ceil(filteredBanners.length / BANNERS_PER_PAGE))
    const bannerSafePage = Math.min(currentPage, bannerTotalPages)
    const bannerStartIndex = (bannerSafePage - 1) * BANNERS_PER_PAGE
    const paginatedBanners = filteredBanners.slice(bannerStartIndex, bannerStartIndex + BANNERS_PER_PAGE)
    const bannerStartCount = filteredBanners.length ? bannerStartIndex + 1 : 0
    const bannerEndCount = Math.min(bannerStartIndex + BANNERS_PER_PAGE, filteredBanners.length)
    const bannerPageNumbers = Array.from({ length: bannerTotalPages }, (_, index) => index + 1)

    // Page calculations
    const filteredPages = pages.filter(page =>
        page.title?.toLowerCase().includes(pageSearchTerm.toLowerCase()) ||
        PAGE_TYPE_LABELS[page.page_type]?.toLowerCase().includes(pageSearchTerm.toLowerCase())
    )
    const pagesTotalPages = Math.max(1, Math.ceil(filteredPages.length / PAGES_PER_PAGE))
    const pagesSafePage = Math.min(pageCurrentPage, pagesTotalPages)
    const pagesStartIndex = (pagesSafePage - 1) * PAGES_PER_PAGE
    const paginatedPages = filteredPages.slice(pagesStartIndex, pagesStartIndex + PAGES_PER_PAGE)
    const pagesStartCount = filteredPages.length ? pagesStartIndex + 1 : 0
    const pagesEndCount = Math.min(pagesStartIndex + PAGES_PER_PAGE, filteredPages.length)
    const pagesPageNumbers = Array.from({ length: pagesTotalPages }, (_, index) => index + 1)

    return (
        <>
            
            {/* Navigation Tabs */}
            <div style={{ display: 'flex', gap: 16, borderBottom: '1px solid var(--border)', marginBottom: 24 }}>
                <button
                    onClick={() => setActiveTab('banners')}
                    style={{
                        padding: '12px 20px',
                        border: 'none',
                        background: 'none',
                        borderBottom: activeTab === 'banners' ? '2px solid var(--primary)' : 'none',
                        color: activeTab === 'banners' ? 'var(--primary)' : 'var(--text-muted)',
                        fontWeight: 600,
                        cursor: 'pointer'
                    }}
                >
                    Banner Settings
                </button>
                <button
                    onClick={() => setActiveTab('pages')}
                    style={{
                        padding: '12px 20px',
                        border: 'none',
                        background: 'none',
                        borderBottom: activeTab === 'pages' ? '2px solid var(--primary)' : 'none',
                        color: activeTab === 'pages' ? 'var(--primary)' : 'var(--text-muted)',
                        fontWeight: 600,
                        cursor: 'pointer'
                    }}
                >
                    Pages Management
                </button>
                <button
                    onClick={() => setActiveTab('app_status')}
                    style={{
                        padding: '12px 20px',
                        border: 'none',
                        background: 'none',
                        borderBottom: activeTab === 'app_status' ? '2px solid var(--primary)' : 'none',
                        color: activeTab === 'app_status' ? 'var(--primary)' : 'var(--text-muted)',
                        fontWeight: 600,
                        cursor: 'pointer'
                    }}
                >
                    App Status
                </button>
            </div>

            {activeTab === 'banners' && (
                // ==========================================
                // BANNERS VIEW
                // ==========================================
                <>
                    <div className="card" style={{ marginBottom: 18 }}>
                        <div className="flex-between" style={{ gap: 12, flexWrap: 'wrap' }}>
                            <div>
                                <h3 className="card-title">Banner Settings</h3>
                                <p className="card-subtitle">Manage promotional banners displayed on the consumer app.</p>
                            </div>

                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'flex-end',
                                    gap: 12,
                                    flex: 1,
                                    minWidth: 280,
                                    flexWrap: 'wrap'
                                }}
                            >
                                <div
                                    className="search-wrapper"
                                    style={{
                                        marginBottom: 0,
                                        maxWidth: 360,
                                        flex: '1 1 280px'
                                    }}
                                >
                                    <i className="fas fa-search search-icon"></i>
                                    <input
                                        type="text"
                                        className="search-input"
                                        placeholder="Search by title or country..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>

                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={() => setShowAddModal(true)}
                                >
                                    <i className="fas fa-plus" style={{ marginRight: 6 }}></i> Add Banner
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Banner Image</th>
                                    <th>Title</th>
                                    <th>Country</th>
                                    <th>Status</th>
                                    <th>Created At</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {loading ? (
                                    Array.from({ length: 3 }).map((_, index) => (
                                        <tr className="skeleton-row" key={`skeleton-${index}`}>
                                            <td>
                                                <div className="cell-avatar skeleton-avatar" style={{ width: '80px', height: '45px', borderRadius: '5px' }} />
                                            </td>
                                            <td>
                                                <span className="skeleton-text" style={{ width: '150px' }} />
                                            </td>
                                            <td>
                                                <span className="skeleton-text" style={{ width: '100px' }} />
                                            </td>
                                            <td>
                                                <span className="skeleton-text" style={{ width: '70px' }} />
                                            </td>
                                            <td>
                                                <span className="skeleton-text" style={{ width: '90px' }} />
                                            </td>
                                            <td>
                                                <span className="skeleton-text" style={{ width: '80px' }} />
                                            </td>
                                        </tr>
                                    ))
                                ) : paginatedBanners.length > 0 ? (
                                    paginatedBanners.map((banner) => (
                                        <tr key={banner.id}>
                                            <td>
                                                {banner.image ? (
                                                    <img
                                                        src={getImageUrl(banner.image)}
                                                        alt={banner.title}
                                                        style={{
                                                            width: '80px',
                                                            height: '45px',
                                                            objectFit: 'cover',
                                                            borderRadius: '6px',
                                                            border: '1px solid var(--border)'
                                                        }}
                                                        onError={(e) => {
                                                            e.target.src = 'https://placehold.co/160x90?text=No+Image'
                                                        }}
                                                    />
                                                ) : (
                                                    <div style={{ width: '80px', height: '45px', background: '#e2e8f0', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#64748b' }}>No image</div>
                                                )}
                                            </td>
                                            <td>
                                                <strong>{banner.title}</strong>
                                            </td>
                                            <td>
                                                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                                                    {getCountryName(banner.country_code)}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="merchant-status-cell">
                                                    <label
                                                        className={`merchant-status-toggle ${banner.status == 1 ? 'is-active' : 'is-inactive'}`}
                                                        title={banner.status == 1 ? 'Deactivate banner' : 'Activate banner'}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={banner.status == 1}
                                                            disabled={submitting}
                                                            onChange={() => handleStatusToggle(banner)}
                                                        />
                                                        <span className="merchant-status-track" aria-hidden="true">
                                                            <span className="merchant-status-knob" />
                                                        </span>
                                                        <span className="merchant-status-label">
                                                            {banner.status == 1 ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </label>
                                                </div>
                                            </td>
                                            <td>
                                                {banner.created_at ? new Date(banner.created_at).toLocaleDateString() : 'N/A'}
                                            </td>
                                            <td>
                                                <div className="action-group" style={{ justifyContent: 'flex-end' }}>
                                                    <button
                                                        className="btn-icon view"
                                                        onClick={() => openViewModal(banner)}
                                                        title="View Details"
                                                    >
                                                        <i className="fas fa-eye" />
                                                    </button>
                                                    <button
                                                        className="btn-icon edit"
                                                        onClick={() => openEditModal(banner)}
                                                        title="Edit Banner"
                                                    >
                                                        <i className="fas fa-edit" />
                                                    </button>
                                                    <button
                                                        className="btn-icon delete"
                                                        onClick={() => handleDeleteClick(banner)}
                                                        title="Delete Banner"
                                                    >
                                                        <i className="fas fa-trash-alt" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" align="center" style={{ padding: '40px' }}>
                                            No Banners Found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>

                        {!loading && filteredBanners.length > BANNERS_PER_PAGE && (
                            <div className="pagination-container">
                                <span className="pagination-text">
                                    Showing {bannerStartCount}-{bannerEndCount} of {filteredBanners.length} banners
                                </span>

                                <div className="pagination-controls">
                                    <button
                                        type="button"
                                        className={`btn-page ${bannerSafePage === 1 ? 'disabled' : ''}`}
                                        onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                                        disabled={bannerSafePage === 1}
                                    >
                                        <i className="fas fa-chevron-left"></i>
                                    </button>

                                    {bannerPageNumbers.map((page) => (
                                        <button
                                            type="button"
                                            key={page}
                                            className={`btn-page ${page === bannerSafePage ? 'active' : ''}`}
                                            onClick={() => setCurrentPage(page)}
                                        >
                                            {page}
                                        </button>
                                    ))}

                                    <button
                                        type="button"
                                        className={`btn-page ${bannerSafePage === bannerTotalPages ? 'disabled' : ''}`}
                                        onClick={() => setCurrentPage((page) => Math.min(bannerTotalPages, page + 1))}
                                        disabled={bannerSafePage === bannerTotalPages}
                                    >
                                        <i className="fas fa-chevron-right"></i>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}

            {activeTab === 'pages' && (
                // ==========================================
                // PAGES VIEW
                // ==========================================
                <>
                    <div className="card" style={{ marginBottom: 18 }}>
                        <div className="flex-between" style={{ gap: 12, flexWrap: 'wrap' }}>
                            <div>
                                <h3 className="card-title">Pages Management</h3>
                                <p className="card-subtitle">Manage terms, privacy policies, about pages, and other policies.</p>
                            </div>

                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'flex-end',
                                    gap: 12,
                                    flex: 1,
                                    minWidth: 280,
                                    flexWrap: 'wrap'
                                }}
                            >
                                <div
                                    className="search-wrapper"
                                    style={{
                                        marginBottom: 0,
                                        maxWidth: 360,
                                        flex: '1 1 280px'
                                    }}
                                >
                                    <i className="fas fa-search search-icon"></i>
                                    <input
                                        type="text"
                                        className="search-input"
                                        placeholder="Search pages..."
                                        value={pageSearchTerm}
                                        onChange={(e) => setPageSearchTerm(e.target.value)}
                                    />
                                </div>

                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={openAddPageModal}
                                >
                                    <i className="fas fa-plus" style={{ marginRight: 6 }}></i> Add Page
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Page Title</th>
                                    <th>Page Type</th>
                                    <th>Status</th>
                                    <th>Created At</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {pagesLoading ? (
                                    Array.from({ length: 3 }).map((_, index) => (
                                        <tr className="skeleton-row" key={`skeleton-page-${index}`}>
                                            <td>
                                                <span className="skeleton-text" style={{ width: '180px' }} />
                                            </td>
                                            <td>
                                                <span className="skeleton-text" style={{ width: '120px' }} />
                                            </td>
                                            <td>
                                                <span className="skeleton-text" style={{ width: '70px' }} />
                                            </td>
                                            <td>
                                                <span className="skeleton-text" style={{ width: '90px' }} />
                                            </td>
                                            <td>
                                                <span className="skeleton-text" style={{ width: '80px' }} />
                                            </td>
                                        </tr>
                                    ))
                                ) : paginatedPages.length > 0 ? (
                                    paginatedPages.map((page) => (
                                        <tr key={page.id}>
                                            <td>
                                                <strong>{page.title}</strong>
                                            </td>
                                            <td>
                                                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                                                    {PAGE_TYPE_LABELS[page.page_type] || page.page_type}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="merchant-status-cell">
                                                    <label
                                                        className={`merchant-status-toggle ${page.status == 1 ? 'is-active' : 'is-inactive'}`}
                                                        title={page.status == 1 ? 'Deactivate page' : 'Activate page'}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={page.status == 1}
                                                            disabled={submitting}
                                                            onChange={() => handlePageStatusToggle(page)}
                                                        />
                                                        <span className="merchant-status-track" aria-hidden="true">
                                                            <span className="merchant-status-knob" />
                                                        </span>
                                                        <span className="merchant-status-label">
                                                            {page.status == 1 ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </label>
                                                </div>
                                            </td>
                                            <td>
                                                {page.created_at ? new Date(page.created_at).toLocaleDateString() : 'N/A'}
                                            </td>
                                            <td>
                                                <div className="action-group" style={{ justifyContent: 'flex-end' }}>
                                                    <button
                                                        className="btn-icon view"
                                                        onClick={() => openPageViewModal(page)}
                                                        title="View Page Details"
                                                    >
                                                        <i className="fas fa-eye" />
                                                    </button>
                                                    <button
                                                        className="btn-icon edit"
                                                        onClick={() => openEditPageModal(page)}
                                                        title="Edit Page"
                                                    >
                                                        <i className="fas fa-edit" />
                                                    </button>
                                                    <button
                                                        className="btn-icon delete"
                                                        onClick={() => handleDeletePageClick(page)}
                                                        title="Delete Page"
                                                    >
                                                        <i className="fas fa-trash-alt" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" align="center" style={{ padding: '40px' }}>
                                            No Pages Found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>

                        {!pagesLoading && filteredPages.length > PAGES_PER_PAGE && (
                            <div className="pagination-container">
                                <span className="pagination-text">
                                    Showing {pagesStartCount}-{pagesEndCount} of {filteredPages.length} pages
                                </span>

                                <div className="pagination-controls">
                                    <button
                                        type="button"
                                        className={`btn-page ${pagesSafePage === 1 ? 'disabled' : ''}`}
                                        onClick={() => setPageCurrentPage((page) => Math.max(1, page - 1))}
                                        disabled={pagesSafePage === 1}
                                    >
                                        <i className="fas fa-chevron-left"></i>
                                    </button>

                                    {pagesPageNumbers.map((page) => (
                                        <button
                                            type="button"
                                            key={page}
                                            className={`btn-page ${page === pagesSafePage ? 'active' : ''}`}
                                            onClick={() => setPageCurrentPage(page)}
                                        >
                                            {page}
                                        </button>
                                    ))}

                                    <button
                                        type="button"
                                        className={`btn-page ${pagesSafePage === pagesTotalPages ? 'disabled' : ''}`}
                                        onClick={() => setPageCurrentPage((page) => Math.min(pagesTotalPages, page + 1))}
                                        disabled={pagesSafePage === pagesTotalPages}
                                    >
                                        <i className="fas fa-chevron-right"></i>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}

            {activeTab === 'app_status' && (
                <>
                    <div className="card" style={{ marginBottom: 18 }}>
                        <div>
                            <h3 className="card-title">App Status Control</h3>
                            <p className="card-subtitle">Control the availability of the Merchant App and Customer App independently.</p>
                        </div>
                    </div>

                    {appStatusLoading ? (
                        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
                            <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', color: 'var(--primary)', marginBottom: 12 }}></i>
                            <p>Loading app status...</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

                            {/* Merchant App Card */}
                            <div className="card" style={{ padding: 24, borderRadius: 16 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 16 }}>
                                    <div>
                                        <h4 style={{ margin: '0 0 4px 0', fontSize: '1.05rem', fontWeight: 600 }}>
                                            <i className="fas fa-store" style={{ marginRight: 8, color: 'var(--primary)' }} />
                                            Merchant App
                                        </h4>
                                        <p className="card-subtitle" style={{ margin: 0, fontSize: '0.82rem' }}>
                                            {merchantApp.status
                                                ? 'Merchant app is ON and accessible.'
                                                : 'Merchant app is OFF (maintenance mode).'}
                                        </p>
                                    </div>
                                    <div className="merchant-status-cell">
                                        <label
                                            className={`merchant-status-toggle ${merchantApp.status ? 'is-active' : 'is-inactive'}`}
                                            style={{ cursor: merchantApp.submitting ? 'not-allowed' : 'pointer' }}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={merchantApp.status}
                                                disabled={merchantApp.submitting}
                                                onChange={handleMerchantAppToggle}
                                            />
                                            <span className="merchant-status-track" aria-hidden="true">
                                                <span className="merchant-status-knob" />
                                            </span>
                                            <span className="merchant-status-label">
                                                {merchantApp.submitting ? 'Updating...' : (merchantApp.status ? 'ON' : 'OFF')}
                                            </span>
                                        </label>
                                    </div>
                                </div>
                                <div style={{
                                    background: merchantApp.status ? 'rgba(74,222,128,0.08)' : 'rgba(239,68,68,0.08)',
                                    border: merchantApp.status ? '1px solid rgba(74,222,128,0.2)' : '1px solid rgba(239,68,68,0.2)',
                                    borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10
                                }}>
                                    <i className={`fas ${merchantApp.status ? 'fa-check-circle' : 'fa-exclamation-triangle'}`}
                                        style={{ color: merchantApp.status ? '#22c55e' : '#ef4444', fontSize: '1.1rem' }} />
                                    <span style={{ fontSize: '0.85rem', color: merchantApp.status ? '#15803d' : '#b91c1c', fontWeight: 500 }}>
                                        {merchantApp.status
                                            ? 'Merchants can log in and manage their listings.'
                                            : 'Warning: Merchant app is disabled. Merchants cannot access the platform.'}
                                    </span>
                                </div>
                            </div>

                            {/* Customer App Card */}
                            <div className="card" style={{ padding: 24, borderRadius: 16 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 16 }}>
                                    <div>
                                        <h4 style={{ margin: '0 0 4px 0', fontSize: '1.05rem', fontWeight: 600 }}>
                                            <i className="fas fa-users" style={{ marginRight: 8, color: 'var(--primary)' }} />
                                            Customer App
                                        </h4>
                                        <p className="card-subtitle" style={{ margin: 0, fontSize: '0.82rem' }}>
                                            {customerApp.status
                                                ? 'Customer app is ON and accessible.'
                                                : 'Customer app is OFF (maintenance mode).'}
                                        </p>
                                    </div>
                                    <div className="merchant-status-cell">
                                        <label
                                            className={`merchant-status-toggle ${customerApp.status ? 'is-active' : 'is-inactive'}`}
                                            style={{ cursor: customerApp.submitting ? 'not-allowed' : 'pointer' }}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={customerApp.status}
                                                disabled={customerApp.submitting}
                                                onChange={handleCustomerAppToggle}
                                            />
                                            <span className="merchant-status-track" aria-hidden="true">
                                                <span className="merchant-status-knob" />
                                            </span>
                                            <span className="merchant-status-label">
                                                {customerApp.submitting ? 'Updating...' : (customerApp.status ? 'ON' : 'OFF')}
                                            </span>
                                        </label>
                                    </div>
                                </div>
                                <div style={{
                                    background: customerApp.status ? 'rgba(74,222,128,0.08)' : 'rgba(239,68,68,0.08)',
                                    border: customerApp.status ? '1px solid rgba(74,222,128,0.2)' : '1px solid rgba(239,68,68,0.2)',
                                    borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10
                                }}>
                                    <i className={`fas ${customerApp.status ? 'fa-check-circle' : 'fa-exclamation-triangle'}`}
                                        style={{ color: customerApp.status ? '#22c55e' : '#ef4444', fontSize: '1.1rem' }} />
                                    <span style={{ fontSize: '0.85rem', color: customerApp.status ? '#15803d' : '#b91c1c', fontWeight: 500 }}>
                                        {customerApp.status
                                            ? 'Customers can browse merchants, claim coupons, and book appointments.'
                                            : 'Warning: Customer app is disabled. End users cannot access the platform.'}
                                    </span>
                                </div>
                            </div>

                        </div>
                    )}
                </>
            )}

            {/* Create Banner Modal */}
            {showAddModal && (
                <div className="modal active">
                    <div className="modal-backdrop" onClick={() => !submitting && setShowAddModal(false)}></div>
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3 className="modal-title">Create Banner</h3>
                            <i
                                className="fas fa-times modal-close"
                                onClick={() => !submitting && setShowAddModal(false)}
                            ></i>
                        </div>
                        <form onSubmit={handleCreateBanner}>
                            <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                                <div className="form-group-classic">
                                    <label className="form-label-classic">Banner Title</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="e.g. Summer Discount Campaign"
                                        value={newBanner.title}
                                        onChange={(e) => setNewBanner({ ...newBanner, title: e.target.value })}
                                        disabled={submitting}
                                        required
                                    />
                                </div>

                                <div className="form-group-classic">
                                    <label className="form-label-classic">
                                        Country <span style={{ color: '#ef4444' }}>*</span>
                                    </label>
                                    <CountrySelect
                                        onChange={(country) => {
                                            setNewBanner({ ...newBanner, country_code: country ? `+${country.phone_code}` : '' })
                                        }}
                                        placeHolder="Select Country"
                                        inputClassName="form-control"
                                    />
                                </div>

                                <div className="form-group-classic">
                                    <label className="form-label-classic">Status</label>
                                    <select
                                        className="form-select"
                                        value={newBanner.status}
                                        onChange={(e) => setNewBanner({ ...newBanner, status: parseInt(e.target.value) })}
                                        disabled={submitting}
                                    >
                                        <option value="1">Active</option>
                                        <option value="0">Inactive</option>
                                    </select>
                                </div>

                                <div className="form-group-classic">
                                    <label className="form-label-classic">Banner Image</label>
                                    <input
                                        type="file"
                                        className="form-control"
                                        accept="image/*"
                                        onChange={(e) => handleImageChange(e, false)}
                                        disabled={submitting}
                                        required
                                    />
                                    {newBanner.imagePreview && (
                                        <div style={{ marginTop: 12, position: 'relative', display: 'inline-block' }}>
                                            <img
                                                src={newBanner.imagePreview}
                                                alt="Preview"
                                                style={{ width: '100%', maxWidth: '280px', borderRadius: 8, border: '1px solid var(--border)' }}
                                            />
                                            <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: 'var(--text-muted)' }}>Selected image preview</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setShowAddModal(false)}
                                    disabled={submitting}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={submitting}>
                                    {submitting ? 'Creating...' : 'Create Banner'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Banner Modal */}
            {showEditModal && selectedBanner && (
                <div className="modal active">
                    <div className="modal-backdrop" onClick={() => !submitting && !detailLoading && setShowEditModal(false)}></div>
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3 className="modal-title">Edit Banner</h3>
                            <i
                                className="fas fa-times modal-close"
                                onClick={() => !submitting && !detailLoading && setShowEditModal(false)}
                            ></i>
                        </div>
                        {detailLoading ? (
                            <div className="modal-body" style={{ textAlign: 'center', padding: '40px' }}>
                                <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', color: 'var(--primary)', marginBottom: 12 }}></i>
                                <p>Loading banner details...</p>
                            </div>
                        ) : (
                            <form onSubmit={handleUpdateBanner}>
                                <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                                    <div className="form-group-classic">
                                        <label className="form-label-classic">Banner Title</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={editBanner.title}
                                            onChange={(e) => setEditBanner({ ...editBanner, title: e.target.value })}
                                            disabled={submitting}
                                            required
                                        />
                                    </div>

                                    <div className="form-group-classic">
                                        <label className="form-label-classic">
                                            Country <span style={{ color: '#ef4444' }}>*</span>
                                        </label>
                                        {countriesList.length > 0 && (
                                            <CountrySelect
                                                key={editBanner.id}
                                                defaultValue={countriesList.find(c => String(c.phone_code) === String(editBanner.country_code).replace('+', ''))}
                                                onChange={(country) => {
                                                    setEditBanner({ ...editBanner, country_code: country ? `+${country.phone_code}` : '' })
                                                }}
                                                placeHolder="Select Country"
                                                inputClassName="form-control"
                                            />
                                        )}
                                    </div>

                                    <div className="form-group-classic">
                                        <label className="form-label-classic">Status</label>
                                        <select
                                            className="form-select"
                                            value={editBanner.status}
                                            onChange={(e) => setEditBanner({ ...editBanner, status: parseInt(e.target.value) })}
                                            disabled={submitting}
                                        >
                                            <option value="1">Active</option>
                                            <option value="0">Inactive</option>
                                        </select>
                                    </div>

                                    <div className="form-group-classic">
                                        <label className="form-label-classic">Change Image</label>
                                        <input
                                            type="file"
                                            className="form-control"
                                            accept="image/*"
                                            onChange={(e) => handleImageChange(e, true)}
                                            disabled={submitting}
                                        />
                                        {editBanner.imagePreview && (
                                            <div style={{ marginTop: 12 }}>
                                                <img
                                                    src={editBanner.imagePreview}
                                                    alt="Current Banner"
                                                    style={{ width: '100%', maxWidth: '280px', borderRadius: 8, border: '1px solid var(--border)' }}
                                                />
                                                <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: 'var(--text-muted)' }}>
                                                    {editBanner.image ? 'Selected new image preview' : 'Current image'}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => setShowEditModal(false)}
                                        disabled={submitting}
                                    >
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary" disabled={submitting}>
                                        {submitting ? 'Updating...' : 'Update Banner'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* View Banner Modal */}
            {showViewModal && selectedBanner && (
                <div className="modal active" id="global-details-modal">
                    <div
                        className="modal-backdrop"
                        onClick={() => setShowViewModal(false)}
                        style={{
                            background: 'rgba(233, 30, 99, 0.05)',
                            backdropFilter: 'blur(10px)'
                        }}
                    ></div>
                    <div className="modal-content" style={{ maxWidth: 500 }}>
                        <div className="modal-header">
                            <h3 className="modal-title">
                                <i className="fas fa-info-circle" style={{ marginRight: 8 }}></i>
                                Banner Details
                            </h3>
                            <button
                                className="modal-close"
                                type="button"
                                onClick={() => setShowViewModal(false)}
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                            <div style={{ textAlign: 'center', marginBottom: 20 }}>
                                <div style={{ marginBottom: 16 }}>
                                    {selectedBanner.image ? (
                                        <img
                                            src={getImageUrl(selectedBanner.image)}
                                            alt={selectedBanner.title}
                                            style={{
                                                width: '100%',
                                                maxHeight: '220px',
                                                objectFit: 'cover',
                                                borderRadius: '8px',
                                                border: '1px solid var(--border)'
                                            }}
                                            onError={(e) => {
                                                e.target.src = 'https://placehold.co/160x90?text=No+Image'
                                            }}
                                        />
                                    ) : (
                                        <div style={{ width: '100%', height: '160px', background: '#e2e8f0', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>No image</div>
                                    )}
                                </div>
                                <h4 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 4px 0' }}>
                                    {selectedBanner.title}
                                </h4>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                    ID: {selectedBanner.id}
                                </span>
                            </div>

                            <div className="details-grid">
                                <div className="details-item">
                                    <span className="details-label">Country</span>
                                    <span className="details-value">
                                        {getCountryName(selectedBanner.country_code)}
                                    </span>
                                </div>
                                <div className="details-item">
                                    <span className="details-label">Status</span>
                                    <span className="details-value">
                                        <span className={`badge ${selectedBanner.status == 1 ? 'active' : 'pending'}`}>
                                            {selectedBanner.status == 1 ? 'Active' : 'Inactive'}
                                        </span>
                                    </span>
                                </div>
                                <div className="details-item">
                                    <span className="details-label">Created At</span>
                                    <span className="details-value">
                                        {selectedBanner.created_at ? new Date(selectedBanner.created_at).toLocaleString() : 'N/A'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => setShowViewModal(false)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add/Edit Page Modal */}
            {showPageModal && (
                <div className="modal active">
                    <div className="modal-backdrop" onClick={() => !submitting && !detailLoading && setShowPageModal(false)}></div>
                    <div className="modal-content" style={{ maxWidth: 700, width: '100%' }}>
                        <div className="modal-header">
                            <h3 className="modal-title">{selectedPage ? 'Edit Page' : 'Create Page'}</h3>
                            <i
                                className="fas fa-times modal-close"
                                onClick={() => !submitting && !detailLoading && setShowPageModal(false)}
                            ></i>
                        </div>
                        {detailLoading ? (
                            <div className="modal-body" style={{ textAlign: 'center', padding: '40px' }}>
                                <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', color: 'var(--primary)', marginBottom: 12 }}></i>
                                <p>Loading page details...</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSavePage}>
                                <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                                    <div className="form-group-classic">
                                        <label className="form-label-classic">Page Type</label>
                                        <select
                                            className="form-select"
                                            value={pageForm.page_type}
                                            onChange={handlePageTypeChange}
                                            disabled={submitting}
                                            required
                                        >
                                            <option value="privacy_policy">Privacy Policy</option>
                                            <option value="terms_conditions">Terms & Conditions Merchant</option>
                                            <option value="terms_conditions_customer">Terms & Conditions Customer</option>
                                        </select>
                                    </div>

                                    <div className="form-group-classic">
                                        <label className="form-label-classic">Page Title</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="e.g. Terms and Conditions"
                                            value={pageForm.title}
                                            onChange={(e) => setPageForm({ ...pageForm, title: e.target.value })}
                                            disabled={submitting}
                                            required
                                        />
                                    </div>

                                    {selectedPage && (
                                        <div className="form-group-classic">
                                            <label className="form-label-classic">Status</label>
                                            <select
                                                className="form-select"
                                                value={pageForm.status}
                                                onChange={(e) => setPageForm({ ...pageForm, status: parseInt(e.target.value) })}
                                                disabled={submitting}
                                            >
                                                <option value="1">Active</option>
                                                <option value="0">Inactive</option>
                                            </select>
                                        </div>
                                    )}

                                    <div className="form-group-classic">
                                        <label className="form-label-classic">Page Content</label>
                                        <div style={{ background: '#fff', borderRadius: '4px' }}>
                                            <ReactQuill
                                                theme="snow"
                                                value={pageForm.content}
                                                onChange={(content) => setPageForm({ ...pageForm, content })}
                                                modules={quillModules}
                                                style={{ height: '240px', marginBottom: '50px' }}
                                                readOnly={submitting}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => setShowPageModal(false)}
                                        disabled={submitting}
                                    >
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary" disabled={submitting}>
                                        {submitting ? 'Saving...' : selectedPage ? 'Update Page' : 'Create Page'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* View Page Modal */}
            {showPageViewModal && selectedPage && (
                <div className="modal active" id="global-details-modal">
                    <div
                        className="modal-backdrop"
                        onClick={() => setShowPageViewModal(false)}
                        style={{
                            background: 'rgba(233, 30, 99, 0.05)',
                            backdropFilter: 'blur(10px)'
                        }}
                    ></div>
                    <div className="modal-content" style={{ maxWidth: 700, width: '100%' }}>
                        <div className="modal-header">
                            <h3 className="modal-title">
                                <i className="fas fa-info-circle" style={{ marginRight: 8 }}></i>
                                Page Details
                            </h3>
                            <button
                                className="modal-close"
                                type="button"
                                onClick={() => setShowPageViewModal(false)}
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                            {detailLoading ? (
                                <div style={{ textAlign: 'center', padding: '40px' }}>
                                    <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', color: 'var(--primary)', marginBottom: 12 }}></i>
                                    <p>Loading page details...</p>
                                </div>
                            ) : (
                                <>
                                    <div style={{ marginBottom: 20 }}>
                                        <h4 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
                                            {selectedPage.title}
                                        </h4>
                                        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
                                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                Type: <strong>{PAGE_TYPE_LABELS[selectedPage.page_type] || selectedPage.page_type}</strong>
                                            </span>
                                            <span className={`badge ${selectedPage.status == 1 ? 'active' : 'pending'}`}>
                                                {selectedPage.status == 1 ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '16px 0' }} />

                                    <div 
                                        className="quill-content-preview text-content"
                                        style={{ 
                                            lineHeight: 1.6, 
                                            color: '#334155',
                                            fontSize: '0.95rem'
                                        }}
                                        dangerouslySetInnerHTML={{ __html: selectedPage.content || '<p style="color:var(--text-muted);">No content available.</p>' }}
                                    />
                                </>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => setShowPageViewModal(false)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation Dialog */}
            <ConfirmDialog
                open={confirmDialog.open}
                title={confirmDialog.title}
                message={confirmDialog.message}
                confirmText={confirmDialog.confirmText}
                cancelText={confirmDialog.cancelText}
                loading={confirmDialog.loading}
                onConfirm={confirmDialog.onConfirm}
                onClose={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
            />
        </>
    )
}
