import { useEffect, useMemo, useState } from 'react'

import {
    NavLink,
    useNavigate,
    useParams
} from 'react-router-dom'
import { useJsApiLoader } from '@react-google-maps/api'
import { toast } from 'react-hot-toast'

import ConfirmDialog from '../components/ConfirmDialog.jsx'
import PhoneNumberField from '../components/PhoneNumberField'
import CorporateAddressField from '../components/CorporateAddressField'
import API from '../api.js';

const BRANCHES_PER_PAGE = 6
const COUPONS_PER_PAGE = 5

const libraries = ['places']

const mapContainerStyle = {
    width: '100%',
    height: '320px',
    borderRadius: '14px'
}

const defaultCenter = {
    lat: 13.0827,
    lng: 80.2707
}

const getRelativeImagePath = (value) => {
    if (!value) {
        return ''
    }

    if (!String(value).startsWith('http')) {
        return String(value).replace(/^\/+/, '')
    }

    try {
        return new URL(value).pathname.replace(/^\/+/, '')
    } catch {
        return String(value).replace(/^https?:\/\/[^/]+\//, '').replace(/^\/+/, '')
    }
}

const isSuccessResponse = (data) => {
    return data?.status === 1 || data?.status === '1' || data?.success === true || data?.success === 'true'
}

const formatDisplayDate = (value) => {
    if (!value) {
        return '-'
    }

    if (typeof value === 'string' && value.includes(' at ')) {
        return value
    }

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
        return value
    }

    const datePart = date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    })

    const timePart = date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    })

    return `${datePart} at ${timePart}`
}

const getCreatedAt = (item) => {
    return item?.createdAt || item?.created_at || item?.created_at_formatted
}

const getProfileImage = (item) => {
    return item?.profile_image || item?.profileImage || item?.image || ''
}

const getReceptionistPhone = (receptionist) => {
    if (!receptionist?.phone) {
        return '-'
    }

    return receptionist.country_code
        ? `${receptionist.country_code} ${receptionist.phone}`
        : receptionist.phone
}

const defaultBranchTimings = [
    { day: 1, open_time: '00:00', close_time: '00:00', is_closed: false },
    { day: 2, open_time: '00:00', close_time: '00:00', is_closed: false },
    { day: 3, open_time: '00:00', close_time: '00:00', is_closed: false },
    { day: 4, open_time: '00:00', close_time: '00:00', is_closed: false },
    { day: 5, open_time: '00:00', close_time: '00:00', is_closed: false },
    { day: 6, open_time: '00:00', close_time: '00:00', is_closed: false },
    { day: 7, open_time: '', close_time: '', is_closed: true }
]

const dayNamesMap = {
    1: { full: 'Monday', short: 'Mon' },
    2: { full: 'Tuesday', short: 'Tue' },
    3: { full: 'Wednesday', short: 'Wed' },
    4: { full: 'Thursday', short: 'Thu' },
    5: { full: 'Friday', short: 'Fri' },
    6: { full: 'Saturday', short: 'Sat' },
    7: { full: 'Sunday', short: 'Sun' }
}

export default function ViewMerchant() {

    const navigate = useNavigate()

    const { id } = useParams()

    const [search, setSearch] = useState('')

    const highlightFieldError = (selector) => {
        setTimeout(() => {
            const element = document.querySelector(selector);
            if (element) {
                element.focus();
                element.classList.add('error-highlight');
                setTimeout(() => {
                    element.classList.remove('error-highlight');
                }, 3000);
            }
        }, 50);
    }

    const focusFieldByErrorMessage = (message) => {
        if (!message) return;
        const msg = message.toLowerCase();

        if (msg.includes('phone') || msg.includes('mobile')) {
            highlightFieldError('.modal.active input[name="phone"]');
        } else if (msg.includes('email')) {
            highlightFieldError('.modal.active input[name="email"], .modal.active #add-rep-email, .modal.active #edit-rep-email');
        } else if (msg.includes('id') || msg.includes('rep_id')) {
            highlightFieldError('.modal.active #add-rep-id, .modal.active #edit-rep-id');
        } else if (msg.includes('name')) {
            highlightFieldError('.modal.active input[name="name"], .modal.active #add-rep-name, .modal.active #edit-rep-name');
        } else if (msg.includes('password')) {
            highlightFieldError('.modal.active input[type="password"], .modal.active #add-rep-password, .modal.active #edit-rep-password');
        } else if (msg.includes('address')) {
            highlightFieldError('.modal.active input[name="address"]');
        } else if (msg.includes('country')) {
            highlightFieldError('.modal.active input[name="country"]');
        }
    }

    const [branchPage, setBranchPage] = useState(1)
    const [couponPage, setCouponPage] = useState(1)

    const [showAddRepPassword, setShowAddRepPassword] = useState(false)
    const [showEditRepPassword, setShowEditRepPassword] = useState(false)

    const [merchantData, setMerchantData] = useState(null)
    const [verifyingDoc, setVerifyingDoc] = useState(false)

    const [branchesData, setBranchesData] = useState([])

    const [loading, setLoading] = useState(true)

    const [editModal, setEditModal] = useState(false)

    const [addModal, setAddModal] = useState(false)

    const [editBranchModal, setEditBranchModal] = useState(false)

    const [editBranchLoading, setEditBranchLoading] = useState(false)

    const [savingBranch, setSavingBranch] = useState(false)

    const [editBranchId, setEditBranchId] = useState(null)

    const [editBranchForm, setEditBranchForm] = useState({
        name: '',
        email: '',
        phone: '',
        country_code: '',
        country_iso: '',
        receptionist_id: '',
        address: '',
        city: '',
        state: '',
        country: '',
        zipcode: '',
        latitude: '',
        longitude: '',
        description: '',
        profile_image: null,
        profileImagePreview: '',
        timings: defaultBranchTimings
    })

    const [branchAutocomplete, setBranchAutocomplete] = useState(null)

    const { isLoaded: isBranchMapLoaded, loadError: branchMapLoadError } = useJsApiLoader({
        id: 'dealora-google-maps',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
        libraries
    })

    const branchMapCenter = useMemo(() => {
        return {
            lat: Number(editBranchForm.latitude) || defaultCenter.lat,
            lng: Number(editBranchForm.longitude) || defaultCenter.lng
        }
    }, [editBranchForm.latitude, editBranchForm.longitude])

    const initialAddBranchForm = {
        name: '',
        email: '',
        phone: '',
        country_code: '+91',
        country_iso: '',
        receptionist_id: '',
        address: '',
        city: '',
        state: '',
        country: '',
        zipcode: '',
        latitude: '',
        longitude: '',
        description: '',
        profile_image: null,
        profileImagePreview: '',
        timings: defaultBranchTimings,
        visibility: 0,
        age_group: 'All Age',
        passlock: ''
    }

    const [addBranchForm, setAddBranchForm] = useState(initialAddBranchForm)

    const [addBranchAutocomplete, setAddBranchAutocomplete] = useState(null)

    const [addingBranch, setAddingBranch] = useState(false)
    const [generatingPasslock, setGeneratingPasslock] = useState(false)

    const addBranchMapCenter = useMemo(() => {
        return {
            lat: Number(addBranchForm.latitude) || defaultCenter.lat,
            lng: Number(addBranchForm.longitude) || defaultCenter.lng
        }
    }, [addBranchForm.latitude, addBranchForm.longitude])

    const [addBranchGalleryFiles, setAddBranchGalleryFiles] = useState([])

    const [addBranchMenuFiles, setAddBranchMenuFiles] = useState([])

    const [availableReceptionists, setAvailableReceptionists] = useState([])
    const [loadingReceptionists, setLoadingReceptionists] = useState(false)

    const [branchGalleryImages, setBranchGalleryImages] = useState([])
    const [deletedImageIds, setDeletedImageIds] = useState([])

    const [branchMenuImages, setBranchMenuImages] = useState([])

    const [editBranchMenuFiles, setEditBranchMenuFiles] = useState([])

    const [newGalleryFiles, setNewGalleryFiles] = useState([])

    const initialCouponForm = {
        code: '',
        type: 1,
        description: '',
        buy_item: '',
        get_item: '',
        percentage: '',
        min_amount: '',
        usage_limit: '1',
        start_date: '',
        end_date: '',
        branch_ids: [],
        cat_id: '',
        status: 1
    }

    const [showCreateCouponModal, setShowCreateCouponModal] = useState(false)

    const [creatingCoupon, setCreatingCoupon] = useState(false)

    const [couponForm, setCouponForm] = useState(initialCouponForm)
    const [minAmountToggle, setMinAmountToggle] = useState(false)

    const [showEditCouponModal, setShowEditCouponModal] = useState(false)

    const [editingCoupon, setEditingCoupon] = useState(false)

    const [editCouponId, setEditCouponId] = useState(null)

    const [deletingCouponId, setDeletingCouponId] = useState(null)
    const [deletingBranchId, setDeletingBranchId] = useState(null)
    const [deletingReceptionistId, setDeletingReceptionistId] = useState(null)

    const [showBranchCouponsModal, setShowBranchCouponsModal] = useState(false)
    const [selectedBranchForCoupons, setSelectedBranchForCoupons] = useState(null)

    const [showViewCouponModal, setShowViewCouponModal] = useState(false)
    const [selectedCouponForView, setSelectedCouponForView] = useState(null)

    const [confirmDialog, setConfirmDialog] = useState({
        open: false,
        title: '',
        message: '',
        confirmText: 'Delete',
        cancelText: 'Cancel',
        onConfirm: null,
        loading: false
    })

    const [editCouponForm, setEditCouponForm] = useState(initialCouponForm)
    const [editMinAmountToggle, setEditMinAmountToggle] = useState(false)

    const [categories, setCategories] = useState([])
    const [couponCategories, setCouponCategories] = useState([])

    const [isEditingCategory, setIsEditingCategory] = useState(false)

    const [selectedCategoryId, setSelectedCategoryId] = useState('')

    const [savingCategory, setSavingCategory] = useState(false)

    const [selectedReceptionist, setSelectedReceptionist] = useState(null)

    const [selectedAssignBranchId, setSelectedAssignBranchId] = useState('')

    const [isEditingReceptionist, setIsEditingReceptionist] = useState(false)

    const [savingReceptionist, setSavingReceptionist] = useState(false)

    const [receptionistForm, setReceptionistForm] = useState({

        rep_id: '',

        name: '',

        ref_name: '',

        email: '',

        phone: '',

        country_code: '',

        password: '',

        profile_image: null,

        profileImagePreview: ''

    })

    const [showAddReceptionistModal, setShowAddReceptionistModal] = useState(false)

    const [addingReceptionist, setAddingReceptionist] = useState(false)

    const [generatingId, setGeneratingId] = useState(false)

    const [addReceptionistForm, setAddReceptionistForm] = useState({

        rep_id: '',

        name: '',

        ref_name: '',

        email: '',

        phone: '',

        country_code: '+91',

        password: '',

        profile_image: null,

        profileImagePreview: ''

    })

    const [selectedBranch, setSelectedBranch] = useState({

        branchName: '',

        status: '',

        address: '',

        map: '',

        contact: '',

        email: ''

    })

    useEffect(() => {

        fetchMerchant()
        fetchCategories()
        fetchCouponCategories()
        fetchReceptionists()

    }, [id])

    const fetchCategories = async () => {

        try {

            const response = await API.get(
                'api/category-list'
            )

            setCategories(
                response.data.data || response.data || []
            )

        } catch (error) {

            console.log(
                'Category Fetch Error:',
                error.response?.data || error
            )

        }

    }

    const fetchCouponCategories = async () => {
        try {
            const response = await API.get('api/coupon-categories')

            const data = response.data || {}
            if (isSuccessResponse(data)) {
                setCouponCategories(data.data || [])
            } else {
                setCouponCategories([])
            }
        } catch (error) {
            console.log(
                'Coupon Category Fetch Error:',
                error.response?.data || error
            )
            setCouponCategories([])
        }
    }

    const fetchReceptionists = async () => {
        setLoadingReceptionists(true)

        try {
            const response = await API.post('admin/receptionist/list', { merchant_id: id })
            // console.log('Receptionists Response:', response.data)
            const list = Array.isArray(response.data?.data)
                ? response.data.data
                : []
            setAvailableReceptionists(list)
        } catch (error) {
            setAvailableReceptionists([])
        } finally {
            setLoadingReceptionists(false)
        }
    }

    const fetchMerchant = async () => {

        try {

            const response = await API.post(

                'admin/merchant-fetch-id',

                {
                    id: id
                }

            )

            // console.log("merchant data", response.data)

            if (isSuccessResponse(response.data)) {

                const merchant =
                    response.data.data

                setMerchantData(merchant)

                setSelectedCategoryId(
                    merchant.cat_id?.toString() || ''
                )

                const branches = merchant.Branches || []
                const sortedBranches = [...branches].sort((a, b) => Number(b.id) - Number(a.id))
                setBranchesData(sortedBranches)

            }
            else {

                setMerchantData(null)

            }

        } catch (err) {

            console.log(
                "Error:",
                err.response?.data || err.message
            )

        } finally {

            setLoading(false)

        }

    }

    const handleVerifyDocument = async (verifyStatus) => {
        try {
            setVerifyingDoc(true)
            const response = await API.post('admin/merchant/document-verify', {
                id: id,
                doc_verify: verifyStatus
            })

            if (isSuccessResponse(response.data)) {
                toast.success(response.data.message || 'Document verification status updated successfully')
                setMerchantData(prev => prev ? { ...prev, doc_verify: verifyStatus } : null)
            } else {
                toast.error(response.data.message || 'Failed to update verification status')
            }
        } catch (error) {
            toast.error(
                error?.response?.data?.message ||
                'Failed to update verification status'
            )
        } finally {
            setVerifyingDoc(false)
        }
    }

    const filteredBranches =
        branchesData.filter((branch) => {

            const branchName = branch.name || ''
            const branchAddress = branch.address || ''
            const receptionistNames = branch.Receptionists && branch.Receptionists.length > 0
                ? branch.Receptionists.map(r => r.name || '').join(' ')
                : ''
            const searchValue = search.toLowerCase()

            return (
                branchName.toLowerCase().includes(searchValue) ||
                branchAddress.toLowerCase().includes(searchValue) ||
                receptionistNames.toLowerCase().includes(searchValue)
            )

        })

    const totalBranchPages = Math.max(
        1,
        Math.ceil(filteredBranches.length / BRANCHES_PER_PAGE)
    )

    const safeBranchPage = Math.min(
        branchPage,
        totalBranchPages
    )

    const branchPageStartIndex = (safeBranchPage - 1) * BRANCHES_PER_PAGE

    const paginatedBranches = filteredBranches.slice(
        branchPageStartIndex,
        branchPageStartIndex + BRANCHES_PER_PAGE
    )

    const branchStartCount = filteredBranches.length
        ? branchPageStartIndex + 1
        : 0

    const branchEndCount = Math.min(
        branchPageStartIndex + BRANCHES_PER_PAGE,
        filteredBranches.length
    )

    const branchPageNumbers = Array.from(
        { length: totalBranchPages },
        (_, index) => index + 1
    )

    const unassignedReceptionists = merchantData?.unassigned_receptionists || []

    const couponsList = merchantData?.coupon_list || []

    const totalCouponPages = Math.max(
        1,
        Math.ceil(couponsList.length / COUPONS_PER_PAGE)
    )

    const safeCouponPage = Math.min(
        couponPage,
        totalCouponPages
    )

    const couponPageStartIndex = (safeCouponPage - 1) * COUPONS_PER_PAGE

    const paginatedCoupons = couponsList.slice(
        couponPageStartIndex,
        couponPageStartIndex + COUPONS_PER_PAGE
    )

    const couponStartCount = couponsList.length
        ? couponPageStartIndex + 1
        : 0

    const couponEndCount = Math.min(
        couponPageStartIndex + COUPONS_PER_PAGE,
        couponsList.length
    )

    const couponPageNumbers = Array.from(
        { length: totalCouponPages },
        (_, index) => index + 1
    )

    useEffect(() => {
        if (couponPage !== safeCouponPage) {
            setCouponPage(safeCouponPage)
        }
    }, [couponPage, safeCouponPage])


    useEffect(() => {

        setBranchPage(1)

    }, [search])

    useEffect(() => {

        if (branchPage !== safeBranchPage) {

            setBranchPage(safeBranchPage)

        }

    }, [branchPage, safeBranchPage])

    const openEditModal = (branch) => {

        setSelectedBranch({

            branchName: branch.name,

            status: branch.status,

            address: branch.address,

            map: 'https://maps.google.com',

            contact: '+1 (555) 019-2831',

            email: 'branch@starbucks.com'

        })

        setEditModal(true)

    }

    const openEditBranchModal = async (branchId) => {

        setEditBranchId(branchId)

        setEditBranchModal(true)

        setEditBranchLoading(true)

        fetchReceptionists()

        setEditBranchForm({
            name: '',
            email: '',
            phone: '',
            country_code: '+91',
            receptionist_id: '',
            address: '',
            city: '',
            state: '',
            country: '',
            zipcode: '',
            latitude: '',
            longitude: '',
            description: '',
            profile_image: null,
            profileImagePreview: '',
            timings: defaultBranchTimings,
            visibility: 0,
            age_group: 'All Age'
        })

        setBranchGalleryImages([])
        setDeletedImageIds([])

        setBranchMenuImages([])

        setEditBranchMenuFiles([])

        setNewGalleryFiles([])

        try {

            const response = await API.get(`admin/branch/id/${encodeURIComponent(branchId)}`)

            const data = response.data

            if (isSuccessResponse(data)) {

                const branch = data.data

                const toTimeInput = (val) => {
                    if (!val) return ''
                    const parts = val.split(':')
                    if (parts.length >= 2) {
                        return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`
                    }
                    return val
                }

                const loadedTimings = (branch.BranchTimings || []).map((t) => ({
                    day: Number(t.day),
                    open_time: t.open_time ? toTimeInput(t.open_time) : '',
                    close_time: t.close_time ? toTimeInput(t.close_time) : '',
                    is_closed: !!t.is_closed
                }));

                const sortedTimings = Array.from({ length: 7 }, (_, i) => {
                    const dayNum = i + 1;
                    const existing = loadedTimings.find((t) => t.day === dayNum);
                    if (existing) return existing;
                    const def = defaultBranchTimings.find((t) => t.day === dayNum);
                    return { ...def };
                });

                setEditBranchForm({
                    name: branch.name || '',
                    email: branch.email || '',
                    phone: branch.phone || '',
                    country_code: branch.country_code || '+91',
                    country_iso: branch.country_iso || '',
                    receptionist_id: branch.receptionist_id || branch.Receptionists?.[0]?.id || '',
                    address: branch.address || '',
                    city: branch.city || '',
                    state: branch.state || '',
                    country: branch.country || '',
                    zipcode: branch.zip_code || branch.zipcode || '',
                    latitude: branch.lat || '',
                    longitude: branch.lon || '',
                    description: branch.description || '',
                    profile_image: null,
                    profileImagePreview: branch.profile_image || '',
                    timings: sortedTimings,
                    visibility: branch.visibility !== undefined ? Number(branch.visibility) : 0,
                    age_group: branch.age_group || 'All Age'
                })

                setBranchGalleryImages(
                    (branch.BranchImages || []).map((img) => ({
                        id: img.id,
                        image: img.image,
                        imagePath: getRelativeImagePath(img.image)
                    }))
                )

                setBranchMenuImages(
                    (branch.MenuImages || []).map((img) => ({
                        id: img.id,
                        image: img.image,
                        imagePath: getRelativeImagePath(img.image)
                    }))
                )

            } else {

                toast.error(data.message || 'Failed to load branch details')

                setEditBranchModal(false)

            }

        } catch (error) {

            const apiMessage = error?.response?.data?.message || 'Failed to load branch details'

            toast.error(apiMessage)

            setEditBranchModal(false)

        } finally {

            setEditBranchLoading(false)

        }

    }

    const closeEditBranchModal = () => {

        setEditBranchModal(false)

        setEditBranchId(null)

        setEditBranchLoading(false)

        setSavingBranch(false)

        setEditBranchForm({
            name: '',
            email: '',
            phone: '',
            country_code: '+91',
            receptionist_id: '',
            address: '',
            city: '',
            state: '',
            country: '',
            zipcode: '',
            latitude: '',
            longitude: '',
            description: '',
            profile_image: null,
            profileImagePreview: '',
            timings: defaultBranchTimings,
            visibility: 0,
            age_group: 'All Age'
        })

        setBranchGalleryImages([])
        setDeletedImageIds([])

        setBranchMenuImages([])

        setEditBranchMenuFiles([])

        setNewGalleryFiles([])

    }

    const handleEditBranchChange = (e) => {

        const { name, value } = e.target

        setEditBranchForm((prev) => ({ ...prev, [name]: value }))

    }

    const closeConfirmDialog = () => {
        setConfirmDialog((prev) => ({
            ...prev,
            open: false,
            loading: false,
            onConfirm: null
        }))
    }

    const handleConfirmDialog = async () => {
        if (!confirmDialog?.onConfirm) {
            closeConfirmDialog()
            return
        }

        setConfirmDialog((prev) => ({ ...prev, loading: true }))

        try {
            await confirmDialog.onConfirm()
        } finally {
            closeConfirmDialog()
        }
    }

    const showDeleteCouponDialog = (couponId) => {
        setConfirmDialog({
            open: true,
            title: 'Delete Coupon',
            message: 'Delete this coupon? This action cannot be undone.',
            confirmText: 'Delete',
            cancelText: 'Cancel',
            onConfirm: () => performDeleteCoupon(couponId),
            loading: false
        })
    }

    const performDeleteCoupon = async (couponId) => {
        setDeletingCouponId(couponId)

        try {
            const response = await API.post(
                'admin/coupon/delete',
                {
                    coupon_id: couponId
                }
            );

            const data = response.data || {};

            if (data.status === 1) {
                toast.success(data.message || 'Coupon deleted successfully');
                fetchMerchant();
            } else {
                toast.error(data.message || 'Failed to delete coupon');
            }
        } catch (error) {
            toast.error(
                error?.response?.data?.message ||
                'Failed to delete coupon'
            );
        } finally {
            setDeletingCouponId(null)
        }
    }


    const showDeleteBranchDialog = (branchId) => {
        setConfirmDialog({
            open: true,
            title: 'Delete Branch',
            message: 'Delete this branch? This action cannot be undone.',
            confirmText: 'Delete',
            cancelText: 'Cancel',
            onConfirm: () => performDeleteBranch(branchId),
            loading: false
        })
    }

    const performDeleteBranch = async (branchId) => {
        setDeletingBranchId(branchId)
        try {
            const response = await API.post(
                'admin/branch/delete',
                {
                    branch_id: branchId
                }
            );
            const data = response.data || {};
            if (data.status === 1) {
                toast.success(data.message || 'Branch deleted successfully');
                fetchMerchant();
            }
            else {
                toast.error(data.message || 'Failed to delete coupon');
            }
        }
        catch (err) {
            toast.error(
                err?.response?.data?.message ||
                'Failed to delete branch'
            );
        }
        finally {
            setDeletingBranchId(null)
        }
    }

    const showDeleteReceptionistDialog = (receptionistId) => {
        setConfirmDialog({
            open: true,
            title: 'Delete Receptionist',
            message: 'Delete this receptionist? This action cannot be undone.',
            confirmText: 'Delete',
            cancelText: 'Cancel',
            onConfirm: () => performDeleteReceptionist(receptionistId),
            loading: false
        })
    }

    const performDeleteReceptionist = async (receptionistId) => {
        setDeletingReceptionistId(receptionistId)
        try {
            const response = await API.post(
                'admin/receptionist/delete',
                {
                    receptionist_id: receptionistId
                }
            );
            const data = response.data || {};
            if (data.status === 1) {
                toast.success(data.message || 'Receptionist deleted successfully');
                fetchMerchant();
                fetchReceptionists();
            }
            else {
                toast.error(data.message || 'Failed to delete receptionist');
            }
        }
        catch (err) {
            toast.error(
                err?.response?.data?.message ||
                'Failed to delete receptionist'
            );
        }
        finally {
            setDeletingReceptionistId(null)
        }
    }

    const geocodeAndUpdateForm = (setForm, lat, lng, placeName = '', countryName = '', countryIso = '') => {
        if (!window.google?.maps?.Geocoder) {
            setForm((prev) => ({
                ...prev,
                latitude: String(lat),
                longitude: String(lng),
                country: countryName || prev.country,
                country_iso: countryIso || prev.country_iso
            }))
            return
        }

        const geocoder = new window.google.maps.Geocoder()

        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
            if (status !== 'OK' || !results || !results[0]) {
                setForm((prev) => ({
                    ...prev,
                    latitude: String(lat),
                    longitude: String(lng),
                    address: placeName || prev.address,
                    country: countryName || prev.country,
                    country_iso: countryIso || prev.country_iso
                }))
                return
            }

            const place = results[0]
            let city = ''
            let state = ''
            let country = ''
            let country_iso = ''
            let zipcode = ''

            place.address_components?.forEach((component) => {
                const types = component.types

                if (types.includes('locality')) city = component.long_name
                if (types.includes('administrative_area_level_1')) state = component.long_name
                if (types.includes('country')) {
                    country = component.long_name
                    country_iso = component.short_name
                }
                if (types.includes('postal_code')) zipcode = component.long_name
            })

            setForm((prev) => ({
                ...prev,
                address: place.formatted_address || placeName || prev.address,
                city,
                state,
                country,
                country_iso,
                zipcode,
                latitude: String(lat),
                longitude: String(lng)
            }))
        })
    }

    const updateBranchLocationDetails = (lat, lng, placeName = '', countryName = '', countryIso = '') => {
        geocodeAndUpdateForm(setEditBranchForm, lat, lng, placeName, countryName, countryIso)
    }

    const updateAddBranchLocationDetails = (lat, lng, placeName = '', countryName = '', countryIso = '') => {
        geocodeAndUpdateForm(setAddBranchForm, lat, lng, placeName, countryName, countryIso)
    }

    const handlePlaceChangedForAutocomplete = (autocomplete, updateLocation) => {
        if (!autocomplete) return

        const place = autocomplete.getPlace()

        if (!place.geometry || !place.geometry.location) return

        let country = ''
        let country_iso = ''

        if (place.address_components) {
            place.address_components.forEach((component) => {
                if (component.types.includes('country')) {
                    country = component.long_name
                    country_iso = component.short_name
                }
            })
        }

        const lat = place.geometry.location.lat()
        const lng = place.geometry.location.lng()

        updateLocation(lat, lng, place.formatted_address || '', country, country_iso)
    }

    const handleBranchPlaceChanged = () => {
        handlePlaceChangedForAutocomplete(branchAutocomplete, updateBranchLocationDetails)
    }

    const handleAddBranchPlaceChanged = () => {
        handlePlaceChangedForAutocomplete(addBranchAutocomplete, updateAddBranchLocationDetails)
    }

    const handleBranchMarkerDragEnd = (event) => {
        const lat = event.latLng.lat()
        const lng = event.latLng.lng()

        updateBranchLocationDetails(lat, lng)
    }

    const handleAddBranchMarkerDragEnd = (event) => {
        const lat = event.latLng.lat()
        const lng = event.latLng.lng()

        updateAddBranchLocationDetails(lat, lng)
    }

    const openAddBranchModal = () => {
        setAddBranchForm(initialAddBranchForm)
        setAddBranchAutocomplete(null)
        setAddBranchGalleryFiles([])
        setAddBranchMenuFiles([])
        setAddingBranch(false)
        setAddModal(true)
        fetchReceptionists()
    }

    const closeAddBranchModal = () => {
        setAddModal(false)
        setAddingBranch(false)
        setAddBranchForm(initialAddBranchForm)
        setAddBranchAutocomplete(null)
        setAddBranchGalleryFiles([])
        setAddBranchMenuFiles([])
    }

    const handleAddBranchChange = (e) => {
        const { name, value } = e.target

        setAddBranchForm((prev) => ({ ...prev, [name]: value }))
    }

    const toCouponApiDate = (value) => {
        if (!value) {
            return ''
        }

        if (/^\d{2}-\d{2}-\d{4}$/.test(value)) {
            return value
        }

        const parts = value.split('-')

        if (parts.length === 3 && parts[0].length === 4) {
            return `${parts[2]}-${parts[1]}-${parts[0]}`
        }

        return value
    }

    const openCreateCouponModal = () => {
        setCouponForm(initialCouponForm)
        setMinAmountToggle(false)
        setCreatingCoupon(false)
        setShowCreateCouponModal(true)
    }

    const closeCreateCouponModal = () => {
        setShowCreateCouponModal(false)
        setCreatingCoupon(false)
        setCouponForm(initialCouponForm)
        setMinAmountToggle(false)
    }

    const openBranchCouponsModal = (branch) => {
        setSelectedBranchForCoupons(branch)
        setShowBranchCouponsModal(true)
    }

    const closeBranchCouponsModal = () => {
        setShowBranchCouponsModal(false)
        setSelectedBranchForCoupons(null)
    }

    const openViewCouponModal = (coupon) => {
        setSelectedCouponForView(coupon)
        setShowViewCouponModal(true)
    }

    const closeViewCouponModal = () => {
        setShowViewCouponModal(false)
        setSelectedCouponForView(null)
    }

    const [quickOpenAdd, setQuickOpenAdd] = useState('')
    const [quickCloseAdd, setQuickCloseAdd] = useState('')
    const [selectedDaysAdd, setSelectedDaysAdd] = useState([1, 2, 3, 4, 5, 6, 7])

    const [quickOpenEdit, setQuickOpenEdit] = useState('')
    const [quickCloseEdit, setQuickCloseEdit] = useState('')
    const [selectedDaysEdit, setSelectedDaysEdit] = useState([1, 2, 3, 4, 5, 6, 7])

    const handleAddTimingDayToggle = (dayNum) => {
        setSelectedDaysAdd(prev =>
            prev.includes(dayNum) ? prev.filter(d => d !== dayNum) : [...prev, dayNum]
        )
    }

    const handleEditTimingDayToggle = (dayNum) => {
        setSelectedDaysEdit(prev =>
            prev.includes(dayNum) ? prev.filter(d => d !== dayNum) : [...prev, dayNum]
        )
    }

    const handleAddTimingAllToggle = () => {
        if (selectedDaysAdd.length === 7) {
            setSelectedDaysAdd([])
        } else {
            setSelectedDaysAdd([1, 2, 3, 4, 5, 6, 7])
        }
    }

    const handleEditTimingAllToggle = () => {
        if (selectedDaysEdit.length === 7) {
            setSelectedDaysEdit([])
        } else {
            setSelectedDaysEdit([1, 2, 3, 4, 5, 6, 7])
        }
    }

    const updateTimingField = (isEdit, dayNum, field, value) => {
        const setForm = isEdit ? setEditBranchForm : setAddBranchForm;
        setForm(prev => {
            const updated = (prev.timings || []).map(item => {
                if (item.day === dayNum) {
                    let openVal = item.open_time;
                    let closeVal = item.close_time;
                    let closedVal = item.is_closed;

                    if (field === 'open_time') openVal = value;
                    if (field === 'close_time') closeVal = value;
                    if (field === 'is_closed') {
                        closedVal = value;
                        if (value) {
                            openVal = '';
                            closeVal = '';
                        } else {
                            openVal = '00:00';
                            closeVal = '00:00';
                        }
                    }
                    return { ...item, open_time: openVal, close_time: closeVal, is_closed: closedVal };
                }
                return item;
            });
            return { ...prev, timings: updated };
        });
    }

    const applyQuickSetup = (isEdit) => {
        const openTime = isEdit ? quickOpenEdit : quickOpenAdd;
        const closeTime = isEdit ? quickCloseEdit : quickCloseAdd;
        const selected = isEdit ? selectedDaysEdit : selectedDaysAdd;
        const setForm = isEdit ? setEditBranchForm : setAddBranchForm;

        if (!openTime || !closeTime) {
            toast.error('Please specify both opening and closing times for quick setup');
            return;
        }

        setForm(prev => {
            const updated = (prev.timings || []).map(item => {
                if (selected.includes(item.day)) {
                    return { ...item, open_time: openTime, close_time: closeTime, is_closed: false };
                }
                return item;
            });
            return { ...prev, timings: updated };
        });
        toast.success('Quick setup applied to selected days');
    }

    const clearAllTimes = (isEdit) => {
        const setForm = isEdit ? setEditBranchForm : setAddBranchForm;
        setForm(prev => {
            const updated = (prev.timings || []).map(item => {
                return { ...item, open_time: '', close_time: '', is_closed: true };
            });
            return { ...prev, timings: updated };
        });
        toast.success('All times cleared and days set to closed');
    }

    const applyPreset = (isEdit, type) => {
        const setForm = isEdit ? setEditBranchForm : setAddBranchForm;
        setForm(prev => {
            const updated = (prev.timings || []).map(item => {
                const isWeekend = item.day === 6 || item.day === 7;
                if (type === 'weekdays') {
                    if (isWeekend) {
                        return { ...item, open_time: '', close_time: '', is_closed: true };
                    } else {
                        return { ...item, open_time: '09:00', close_time: '18:00', is_closed: false };
                    }
                } else if (type === 'alldays') {
                    return { ...item, open_time: '09:00', close_time: '18:00', is_closed: false };
                }
                return item;
            });
            return { ...prev, timings: updated };
        });
    }

    const copyTimeToAllSelected = (isEdit, sourceDay) => {
        const setForm = isEdit ? setEditBranchForm : setAddBranchForm;
        const selected = isEdit ? selectedDaysEdit : selectedDaysAdd;

        setForm(prev => {
            const sourceTiming = (prev.timings || []).find(item => item.day === sourceDay);
            if (!sourceTiming) return prev;
            if (sourceTiming.is_closed) {
                toast.error('Cannot copy timings from a closed day');
                return prev;
            }

            const updated = (prev.timings || []).map(item => {
                if (selected.includes(item.day) && item.day !== sourceDay) {
                    return {
                        ...item,
                        open_time: sourceTiming.open_time,
                        close_time: sourceTiming.close_time,
                        is_closed: false
                    };
                }
                return item;
            });
            return { ...prev, timings: updated };
        });
        toast.success('Timings copied to selected days');
    }

    const [generatingCode, setGeneratingCode] = useState(false)

    const generateCouponCodeForCreate = async () => {
        try {
            setGeneratingCode(true)
            const response = await API.post('admin/coupon-generate', { id: id })
            const data = response.data || {}
            if (data.status === 1 && data.data?.code) {
                setCouponForm(prev => ({
                    ...prev,
                    code: data.data.code
                }))
                toast.success(data.message || 'Coupon code generated!')
            } else {
                toast.error(data.message || 'Failed to generate code')
            }
        } catch (error) {
            console.error('Error generating coupon code:', error)
            toast.error('Failed to generate coupon code')
        } finally {
            setGeneratingCode(false)
        }
    }

    const [generatingEditCode, setGeneratingEditCode] = useState(false)

    const generateCouponCodeForEdit = async () => {
        try {
            setGeneratingEditCode(true)
            const response = await API.post('admin/coupon-generate', { id: id })
            const data = response.data || {}
            if (data.status === 1 && data.data?.code) {
                setEditCouponForm(prev => ({
                    ...prev,
                    code: data.data.code
                }))
                toast.success(data.message || 'Coupon code generated!')
            } else {
                toast.error(data.message || 'Failed to generate code')
            }
        } catch (error) {
            console.error('Error generating coupon code:', error)
            toast.error('Failed to generate coupon code')
        } finally {
            setGeneratingEditCode(false)
        }
    }

    const handleCouponChange = (e) => {
        const { name, value } = e.target

        setCouponForm((prev) => ({ ...prev, [name]: value }))
    }

    const toggleCouponBranchId = (branchId) => {
        const id = Number(branchId)

        setCouponForm((prev) => {
            const isSelected = prev.branch_ids.includes(id)

            return {
                ...prev,
                branch_ids: isSelected
                    ? prev.branch_ids.filter((item) => item !== id)
                    : [...prev.branch_ids, id]
            }
        })
    }

    const selectAllCouponBranches = () => {
        setCouponForm((prev) => ({
            ...prev,
            branch_ids: branchesData.map((branch) => Number(branch.id))
        }))
    }

    const clearCouponBranches = () => {
        setCouponForm((prev) => ({
            ...prev,
            branch_ids: []
        }))
    }

    const handleCreateCoupon = async () => {
        if (!couponForm.code.trim()) {
            toast.error('Coupon code is required')
            return
        }

        if (Number(couponForm.type) !== 3) {
            if (couponForm.percentage === '' || couponForm.percentage === null) {
                toast.error(Number(couponForm.type) === 2 ? 'Fixed Amount is required' : 'Discount percentage is required')
                return
            }
        } else {
            if (!couponForm.buy_item?.trim()) {
                toast.error('Buy Item/Service is required')
                return
            }
            if (!couponForm.get_item?.trim()) {
                toast.error('Get Item/Service is required')
                return
            }
        }

        if (!couponForm.start_date) {
            toast.error('Start date is required')
            return
        }

        if (!couponForm.end_date) {
            toast.error('End date is required')
            return
        }

        if (!couponForm.cat_id) {
            toast.error('Please select a coupon category')
            return
        }

        if (!couponForm.branch_ids.length) {
            toast.error('Please select at least one branch')
            return
        }

        try {
            setCreatingCoupon(true)

            const formData = new FormData()

            formData.append('mer_id', id)
            formData.append('code', couponForm.code.trim())
            formData.append('type', couponForm.type)
            formData.append('description', couponForm.description || '')

            if (Number(couponForm.type) === 3) {
                formData.append('percentage', '0')
                formData.append('buy_item', couponForm.buy_item.trim())
                formData.append('get_item', couponForm.get_item.trim())
            } else {
                formData.append('percentage', couponForm.percentage)
            }

            formData.append('min_amount', minAmountToggle ? (couponForm.min_amount || '0') : '0')
            formData.append('usage_limit', couponForm.usage_limit || '0')
            formData.append('start_date', toCouponApiDate(couponForm.start_date))
            formData.append('end_date', toCouponApiDate(couponForm.end_date))
            formData.append('cat_id', couponForm.cat_id)
            formData.append('branch_ids', JSON.stringify(couponForm.branch_ids))

            const response = await API.post('admin/coupon/create', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })

            const data = response.data || {}

            if (isSuccessResponse(data)) {
                toast.success(data.message || 'Coupon created successfully')
                closeCreateCouponModal()
                fetchMerchant()
            } else {
                toast.error(data.message || 'Failed to create coupon')
            }
        } catch (error) {
            const apiMessage = error?.response?.data?.message || 'Failed to create coupon'

            toast.error(apiMessage)

            console.error('Error creating coupon:', error)
        } finally {
            setCreatingCoupon(false)
        }
    }

    const openEditCouponModal = (coupon) => {
        setEditCouponId(coupon.id)

        const formatDateForInput = (dateStr) => {
            if (!dateStr) return ''
            if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
                const parts = dateStr.split('-')
                return `${parts[2]}-${parts[1]}-${parts[0]}`
            }
            const d = new Date(dateStr)
            if (isNaN(d.getTime())) {
                if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr
                return ''
            }
            return d.toISOString().split('T')[0]
        }

        const hasMinAmount = coupon.min_amount && Number(coupon.min_amount) > 0;
        setEditMinAmountToggle(!!hasMinAmount);
        setEditCouponForm({
            code: coupon.code || '',
            type: coupon.type || 1,
            description: coupon.description || '',
            buy_item: coupon.buy_item || '',
            get_item: coupon.get_item || '',
            percentage: coupon.percentage || '',
            min_amount: hasMinAmount ? coupon.min_amount : '0',
            usage_limit: coupon.usage_limit || '0',
            start_date: formatDateForInput(coupon.start_date),
            end_date: formatDateForInput(coupon.end_date),
            branch_ids: Array.isArray(coupon.branch_ids) ? coupon.branch_ids.map(Number) : [],
            cat_id: coupon.cat_id?.toString() || coupon.category_id?.toString() || '',
            status: coupon.status !== undefined ? Number(coupon.status) : 1
        })
        setEditingCoupon(false)
        setShowEditCouponModal(true)
    }

    const closeEditCouponModal = () => {
        setShowEditCouponModal(false)
        setEditingCoupon(false)
        setEditCouponForm(initialCouponForm)
        setEditCouponId(null)
        setEditMinAmountToggle(false)
    }

    const handleEditCouponChange = (e) => {
        const { name, value } = e.target
        setEditCouponForm((prev) => ({ ...prev, [name]: value }))
    }

    const toggleEditCouponBranchId = (branchId) => {
        const id = Number(branchId)
        setEditCouponForm((prev) => {
            const isSelected = prev.branch_ids.includes(id)
            return {
                ...prev,
                branch_ids: isSelected
                    ? prev.branch_ids.filter((item) => item !== id)
                    : [...prev.branch_ids, id]
            }
        })
    }

    const selectAllEditCouponBranches = () => {
        setEditCouponForm((prev) => ({
            ...prev,
            branch_ids: branchesData.map((branch) => Number(branch.id))
        }))
    }

    const clearEditCouponBranches = () => {
        setEditCouponForm((prev) => ({
            ...prev,
            branch_ids: []
        }))
    }

    const handleEditCoupon = async () => {
        if (!editCouponForm.code.trim()) {
            toast.error('Coupon code is required')
            return
        }

        if (Number(editCouponForm.type) !== 3) {
            if (editCouponForm.percentage === '' || editCouponForm.percentage === null) {
                toast.error(Number(editCouponForm.type) === 2 ? 'Fixed Amount is required' : 'Discount percentage is required')
                return
            }
        } else {
            if (!editCouponForm.buy_item?.trim()) {
                toast.error('Buy Item/Service is required')
                return
            }
            if (!editCouponForm.get_item?.trim()) {
                toast.error('Get Item/Service is required')
                return
            }
        }

        if (!editCouponForm.start_date) {
            toast.error('Start date is required')
            return
        }

        if (!editCouponForm.end_date) {
            toast.error('End date is required')
            return
        }

        if (!editCouponForm.cat_id) {
            toast.error('Please select a coupon category')
            return
        }

        if (!editCouponForm.branch_ids.length) {
            toast.error('Please select at least one branch')
            return
        }

        try {
            setEditingCoupon(true)

            const formData = new FormData()

            formData.append('coupon_id', editCouponId)
            formData.append('mer_id', id)
            formData.append('code', editCouponForm.code.trim())
            formData.append('type', editCouponForm.type)
            formData.append('description', editCouponForm.description || '')
            formData.append('status', editCouponForm.status !== undefined ? editCouponForm.status : 1)

            if (Number(editCouponForm.type) === 3) {
                formData.append('percentage', '0')
                formData.append('buy_item', editCouponForm.buy_item.trim())
                formData.append('get_item', editCouponForm.get_item.trim())
            } else {
                formData.append('percentage', editCouponForm.percentage)
            }

            formData.append('min_amount', editMinAmountToggle ? (editCouponForm.min_amount || '0') : '0')
            formData.append('usage_limit', editCouponForm.usage_limit || '0')
            formData.append('start_date', toCouponApiDate(editCouponForm.start_date))
            formData.append('end_date', toCouponApiDate(editCouponForm.end_date))
            formData.append('cat_id', editCouponForm.cat_id)
            formData.append('branch_ids', JSON.stringify(editCouponForm.branch_ids))

            const response = await API.post('admin/coupon/edit', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })

            const data = response.data || {}

            if (isSuccessResponse(data)) {
                toast.success(data.message || 'Coupon updated successfully')
                setShowEditCouponModal(false)
                fetchMerchant()
            } else {
                toast.error(data.message || 'Failed to update coupon')
            }
        } catch (error) {
            const apiMessage = error?.response?.data?.message || 'Failed to update coupon'
            toast.error(apiMessage)
            console.error('Error editing coupon:', error)
        } finally {
            setEditingCoupon(false)
        }
    }

    const handleAddBranch = async () => {
        if (!addBranchForm.profile_image) {
            toast.error('Profile image is required')
            return
        }

        if (!addBranchForm.name.trim()) {
            toast.error('Branch name is required')
            highlightFieldError('.modal.active input[name="name"]')
            return
        }



        // if (!addBranchForm.phone.trim()) {
        //     toast.error('Phone is required')
        //     highlightFieldError('.modal.active input[name="phone"]')
        //     return
        // }

        if (!addBranchForm.address.trim()) {
            toast.error('Business Address is required')
            highlightFieldError('.modal.active input[name="address"]')
            return
        }

        if (!addBranchForm.passlock || !addBranchForm.passlock.trim()) {
            toast.error('Passcode is required')
            highlightFieldError('.modal.active input[name="passlock"]')
            return
        }

        if (!addBranchForm.country || !addBranchForm.country.trim()) {
            toast.error('Country is required')
            highlightFieldError('.modal.active input[name="country"]')
            return
        }

        try {
            setAddingBranch(true)

            const formData = new FormData()

            formData.append('mer_id', id)
            formData.append('name', addBranchForm.name)
            formData.append('email', addBranchForm.email)
            formData.append('phone', addBranchForm.phone)
            formData.append('country_code', addBranchForm.country_code)
            formData.append('passlock', addBranchForm.passlock)
            formData.append('bus_name', merchantData?.bus_name || '')
            formData.append('bus_cat', merchantData?.bus_cat || '')
            formData.append('address', addBranchForm.address)
            formData.append('city', addBranchForm.city)
            formData.append('state', addBranchForm.state)
            formData.append('country', addBranchForm.country)
            formData.append('zip_code', addBranchForm.zipcode)
            formData.append('lat', addBranchForm.latitude)
            formData.append('lon', addBranchForm.longitude)
            formData.append('description', addBranchForm.description)
            formData.append('timings', JSON.stringify(addBranchForm.timings || []))
            formData.append('visibility', String(addBranchForm.visibility !== undefined ? addBranchForm.visibility : 0))
            formData.append('age_group', addBranchForm.age_group || 'All Age')
            formData.append('country_iso', addBranchForm.country_iso || '')
            formData.append('receptionist_id', addBranchForm.receptionist_id || '')

            if (addBranchForm.profile_image) {
                formData.append('profile_image', addBranchForm.profile_image)
            }

            addBranchGalleryFiles.forEach((entry) => {
                formData.append('image', entry.file)
            })

            addBranchMenuFiles.forEach((entry) => {
                formData.append('menu_images', entry.file)
            })

            const response = await API.post('admin/branch/register', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })

            const data = response.data || {}

            if (isSuccessResponse(data)) {
                toast.success(data.message || 'Branch registered successfully')
                closeAddBranchModal()
                fetchMerchant()
                fetchReceptionists()
            } else {
                const errMsg = data.message || 'Failed to register branch'
                toast.error(errMsg)
                focusFieldByErrorMessage(errMsg)
            }
        } catch (error) {
            const apiMessage = error?.response?.data?.message || 'Failed to register branch'

            toast.error(apiMessage)
            focusFieldByErrorMessage(apiMessage)

            console.error('Error registering branch:', error)
        } finally {
            setAddingBranch(false)
        }
    }

    const handleBranchProfileImageChange = (e) => {

        const file = e.target.files?.[0]

        if (!file) return

        setEditBranchForm((prev) => ({
            ...prev,
            profile_image: file,
            profileImagePreview: URL.createObjectURL(file)
        }))

    }

    const handleAddBranchProfileImageChange = (e) => {
        const file = e.target.files?.[0]

        if (!file) return

        setAddBranchForm((prev) => ({
            ...prev,
            profile_image: file,
            profileImagePreview: URL.createObjectURL(file)
        }))
    }

    const handleAddBranchMenuFilesAdd = (e) => {
        const files = Array.from(e.target.files || [])

        if (!files.length) return

        const newEntries = files.map((file) => ({
            id: `menu_add_${Date.now()}_${Math.random()}`,
            file,
            preview: URL.createObjectURL(file),
            isNew: true
        }))

        setAddBranchMenuFiles((prev) => [...prev, ...newEntries])
        e.target.value = ''
    }

    const removeAddBranchMenuFile = (id) => {
        setAddBranchMenuFiles((prev) => prev.filter((f) => f.id !== id))
    }

    const handleEditBranchMenuFilesAdd = (e) => {
        const files = Array.from(e.target.files || [])

        if (!files.length) return

        const newEntries = files.map((file) => ({
            id: `menu_edit_${Date.now()}_${Math.random()}`,
            file,
            preview: URL.createObjectURL(file),
            isNew: true
        }))

        setEditBranchMenuFiles((prev) => [...prev, ...newEntries])
        e.target.value = ''
    }

    const removeEditBranchMenuFile = (id) => {
        setEditBranchMenuFiles((prev) => prev.filter((f) => f.id !== id))
    }

    const handleGalleryFilesAdd = (e) => {

        const files = Array.from(e.target.files || [])

        if (!files.length) return

        const newEntries = files.map((file) => ({
            id: `new_${Date.now()}_${Math.random()}`,
            file,
            preview: URL.createObjectURL(file),
            isNew: true
        }))

        setNewGalleryFiles((prev) => [...prev, ...newEntries])

        // reset input so same files can be re-added if needed
        e.target.value = ''

    }

    const removeNewGalleryFile = (id) => {

        setNewGalleryFiles((prev) => prev.filter((f) => f.id !== id))

    }

    const removeExistingGalleryImage = (id) => {
        setBranchGalleryImages((prev) => prev.filter((img) => img.id !== id))
        setDeletedImageIds((prev) => [...prev, id])
    }

    const handleAddBranchGalleryFilesAdd = (e) => {
        const files = Array.from(e.target.files || [])

        if (!files.length) return

        const newEntries = files.map((file) => ({
            id: `add_${Date.now()}_${Math.random()}`,
            file,
            preview: URL.createObjectURL(file),
            isNew: true
        }))

        setAddBranchGalleryFiles((prev) => [...prev, ...newEntries])

        e.target.value = ''
    }

    const removeAddBranchGalleryFile = (id) => {
        setAddBranchGalleryFiles((prev) => prev.filter((f) => f.id !== id))
    }

    const handleSaveBranch = async () => {

        if (!editBranchForm.name.trim()) {
            toast.error('Branch name is required')
            highlightFieldError('.modal.active input[name="name"]')
            return
        }



        // if (!editBranchForm.phone.trim()) {
        //     toast.error('Phone is required')
        //     highlightFieldError('.modal.active input[name="phone"]')
        //     return
        // }

        if (!editBranchForm.address || !editBranchForm.address.trim()) {
            toast.error('Business Address is required')
            highlightFieldError('.modal.active input[name="address"]')
            return
        }

        if (!editBranchForm.country || !editBranchForm.country.trim()) {
            toast.error('Country is required')
            highlightFieldError('.modal.active input[name="country"]')
            return
        }

        if (!editBranchForm.profile_image && !editBranchForm.profileImagePreview) {
            toast.error('Profile image is required')
            return
        }

        try {

            setSavingBranch(true)

            const formData = new FormData()

            formData.append('branch_id', editBranchId)
            formData.append('name', editBranchForm.name)
            formData.append('email', editBranchForm.email)
            formData.append('phone', editBranchForm.phone)
            formData.append('country_code', editBranchForm.country_code)
            formData.append('lat', editBranchForm.latitude)
            formData.append('lon', editBranchForm.longitude)
            formData.append('address', editBranchForm.address)
            formData.append('city', editBranchForm.city)
            formData.append('state', editBranchForm.state)
            formData.append('country', editBranchForm.country)
            formData.append('zip_code', editBranchForm.zipcode)
            formData.append('description', editBranchForm.description)
            formData.append('timings', JSON.stringify(editBranchForm.timings || []))
            formData.append('visibility', String(editBranchForm.visibility !== undefined ? editBranchForm.visibility : 0))
            formData.append('age_group', editBranchForm.age_group || 'All Age')
            formData.append('country_iso', editBranchForm.country_iso || '')

            if (editBranchForm.profile_image && typeof editBranchForm.profile_image !== 'string') {
                formData.append('profile_image', editBranchForm.profile_image)
            }

            formData.append('receptionist_id', editBranchForm.receptionist_id || '')

            formData.append('deleted_images', JSON.stringify(deletedImageIds))

            branchGalleryImages.forEach((img) => {
                formData.append('existing_image_ids', String(img.id))
                formData.append('old_images', img.imagePath || getRelativeImagePath(img.image))
            })

            if (branchGalleryImages.length === 0) {
                formData.append('existing_image_ids', '')
                formData.append('old_images', '')
            }

            formData.append('gallery_sync', '1')

            branchMenuImages.forEach((img) => {
                formData.append('existing_menu_image_ids', String(img.id))
                formData.append('old_menu_images', img.imagePath || getRelativeImagePath(img.image))
            })

            if (branchMenuImages.length === 0) {
                formData.append('existing_menu_image_ids', '')
                formData.append('old_menu_images', '')
            }

            newGalleryFiles.forEach((entry) => {
                formData.append('images', entry.file)
            })

            editBranchMenuFiles.forEach((entry) => {
                formData.append('menu_images', entry.file)
            })

            const response = await API.post('admin/branch/update', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })

            const data = response.data || {}

            if (isSuccessResponse(data)) {

                toast.success(data.message || 'Branch updated successfully')

                closeEditBranchModal()

                fetchMerchant()

                fetchReceptionists()

            } else {
                const errMsg = data.message || 'Failed to update branch'
                toast.error(errMsg)
                focusFieldByErrorMessage(errMsg)
            }

        } catch (error) {

            const apiMessage = error?.response?.data?.message || 'Failed to update branch'

            toast.error(apiMessage)
            focusFieldByErrorMessage(apiMessage)

            console.error('Error updating branch:', error)

        } finally {

            setSavingBranch(false)

        }

    }

    const openAssignReceptionistModal = async (id) => {

        if (!id) {
            return;
        }

        try {

            const response = await API.post(
                'admin/receptionists-id',
                { id }
            );

            if (response.data.status === 1) {

                setSelectedReceptionist(
                    response.data.data
                );

            }

        } catch (error) {

            console.log(
                error.response?.data || error
            );

        }

    }

    const closeAssignReceptionistModal = () => {

        setSelectedReceptionist(null)

        setSelectedAssignBranchId('')

        setIsEditingReceptionist(false)

        setSavingReceptionist(false)

        setReceptionistForm({

            rep_id: '',

            name: '',

            ref_name: '',

            email: '',

            phone: '',

            country_code: '',

            password: '',

            profile_image: null,

            profileImagePreview: ''

        })

    }

    const handleStartEditReceptionist = () => {

        if (!selectedReceptionist) return;

        setReceptionistForm({

            rep_id: selectedReceptionist.rep_id || '',

            name: selectedReceptionist.name || '',

            ref_name: selectedReceptionist.ref_name || '',

            email: selectedReceptionist.email || '',

            phone: selectedReceptionist.phone || '',

            country_code: selectedReceptionist.country_code || '',

            password: '',

            profile_image: null,

            profileImagePreview: getProfileImage(selectedReceptionist) || ''

        })

        setIsEditingReceptionist(true)

    }

    const handleSaveReceptionist = async () => {

        if (!receptionistForm.name.trim() || receptionistForm.name.trim().length < 3) {
            toast.error('Full Name must be at least 3 characters long')
            highlightFieldError('#edit-rep-name')
            return
        }

        if (!receptionistForm.phone || !receptionistForm.phone.trim()) {
            toast.error('Phone number is required')
            highlightFieldError('.modal.active input[name="phone"]')
            return
        }

        if (receptionistForm.phone.trim().length < 4) {
            toast.error('Please enter a valid phone number')
            highlightFieldError('.modal.active input[name="phone"]')
            return
        }

        // if (!receptionistForm.password.trim() || receptionistForm.password.trim().length < 6) {
        //     toast.error('Password must be at least 6 characters long')
        //     highlightFieldError('#edit-rep-password')
        //     return
        // }

        try {

            setSavingReceptionist(true)

            const formData = new FormData()

            formData.append('id', selectedReceptionist.id)

            formData.append('name', receptionistForm.name)

            formData.append('email', receptionistForm.email)

            formData.append('phone', receptionistForm.phone)

            formData.append('country_code', receptionistForm.country_code)

            formData.append('ref_name', receptionistForm.ref_name || '')

            if (receptionistForm.password.trim()) {

                formData.append('password', receptionistForm.password)

            }

            if (receptionistForm.profile_image && typeof receptionistForm.profile_image !== 'string') {

                formData.append('profile_image', receptionistForm.profile_image)

            }

            const response = await API.post('/admin/receptionists/edit', formData, {

                headers: {

                    'Content-Type': 'multipart/form-data'

                }

            })

            const data = response.data || {}

            if (isSuccessResponse(data)) {

                toast.success(data.message || 'Receptionist updated successfully')

                // Determine returned or preview profile image
                const returnedProfileImage = data.data?.profile_image || data.data?.profileImage || data.data?.image || receptionistForm.profileImagePreview || selectedReceptionist.profile_image

                // Update selected receptionist details
                const updatedReceptionist = {

                    ...selectedReceptionist,

                    name: receptionistForm.name,

                    ref_name: receptionistForm.ref_name,

                    email: receptionistForm.email,

                    phone: receptionistForm.phone,

                    country_code: receptionistForm.country_code,

                    profile_image: returnedProfileImage

                }

                setSelectedReceptionist(updatedReceptionist)

                // Update branchesData list
                setBranchesData((prevBranches) =>
                    prevBranches.map((branch) => {

                        if (branch.Receptionists?.some((r) => r.id === selectedReceptionist.id)) {

                            return {

                                ...branch,

                                Receptionists: branch.Receptionists.map((r) =>
                                    r.id === selectedReceptionist.id
                                        ? {
                                            ...r,
                                            name: receptionistForm.name,
                                            ref_name: receptionistForm.ref_name || '',
                                            profile_image: returnedProfileImage
                                        }
                                        : r
                                )

                            }

                        }

                        return branch

                    })
                )

                // Update merchantData unassigned_receptionists list (if any)
                if (merchantData) {

                    setMerchantData((prevMerchant) => {

                        if (!prevMerchant) return prevMerchant

                        return {

                            ...prevMerchant,

                            unassigned_receptionists: (prevMerchant.unassigned_receptionists || []).map((r) =>
                                r.id === selectedReceptionist.id
                                    ? {
                                        ...r,
                                        name: receptionistForm.name,
                                        ref_name: receptionistForm.ref_name || '',
                                        email: receptionistForm.email,
                                        phone: receptionistForm.phone,
                                        country_code: receptionistForm.country_code,
                                        profile_image: returnedProfileImage
                                    }
                                    : r
                            )

                        }

                    })

                }

                fetchReceptionists()

                setIsEditingReceptionist(false)

            } else {
                console.log(data.message)
                const errMsg = data.message || 'Failed to update receptionist'
                toast.error(errMsg)
                focusFieldByErrorMessage(errMsg, 'edit-')
            }

        } catch (error) {

            const apiMessage = error?.response?.data?.message || 'Failed to update receptionist'

            toast.error(apiMessage)
            focusFieldByErrorMessage(apiMessage, 'edit-')

            console.error('Error updating receptionist:', error)

        } finally {

            setSavingReceptionist(false)

        }

    }

    const closeAddReceptionistModal = () => {

        setShowAddReceptionistModal(false)

        setAddingReceptionist(false)

        setAddReceptionistForm({

            rep_id: '',

            name: '',

            email: '',

            phone: '',

            country_code: '+91',

            password: '',

            profile_image: null,

            profileImagePreview: ''

        })

    }

    const generateBranchPasslock = async () => {
        try {
            setGeneratingPasslock(true)
            const response = await API.get('api/generate-branch-passlock')
            const data = response.data || {}
            if (isSuccessResponse(data)) {
                toast.success(data.message || 'Passlock generated successfully!')
                setAddBranchForm((prev) => ({
                    ...prev,
                    passlock: String(data.passlock || '')
                }))
            } else {
                toast.error(data.message || 'Failed to generate passcode')
            }
        } catch (error) {
            toast.error('Failed to generate passcode')
            console.error('Error generating passlock:', error)
        } finally {
            setGeneratingPasslock(false)
        }
    }

    const generateReceptionistId = async () => {

        try {

            setGeneratingId(true)

            const response = await API.post('admin/receptionists-id-generate', { id: id })

            const data = response.data || {}

            if (isSuccessResponse(data)) {

                toast.success(data.message || 'Receptionist ID generated!')

                setAddReceptionistForm((prev) => ({

                    ...prev,

                    rep_id: data.data?.rep_id || data.data || ''

                }))

            } else {

                toast.error(data.message || 'Failed to generate ID')

            }

        } catch (error) {

            toast.error('Failed to generate receptionist ID')

            console.error('Error generating receptionist ID:', error)

        } finally {

            setGeneratingId(false)

        }

    }

    const openAddReceptionistModal = () => {

        setShowAddReceptionistModal(true)

    }

    const handleAddReceptionist = async () => {

        if (!addReceptionistForm.rep_id.trim()) {
            toast.error('Receptionist ID is required')
            highlightFieldError('#add-rep-id')
            return
        }

        if (!addReceptionistForm.name.trim() || addReceptionistForm.name.trim().length < 3) {
            toast.error('Full Name must be at least 3 characters long')
            highlightFieldError('#add-rep-name')
            return
        }

        if (!addReceptionistForm.phone || !addReceptionistForm.phone.trim()) {
            toast.error('Phone number is required')
            highlightFieldError('.modal.active input[name="phone"]')
            return
        }

        if (addReceptionistForm.phone.trim().length < 4) {
            toast.error('Please enter a valid phone number')
            highlightFieldError('.modal.active input[name="phone"]')
            return
        }

        if (!addReceptionistForm.password.trim() || addReceptionistForm.password.trim().length < 6) {
            toast.error('Password must be at least 6 characters long')
            highlightFieldError('#add-rep-password')
            return
        }

        try {

            setAddingReceptionist(true)

            const formData = new FormData()

            formData.append('mer_id', id)

            formData.append('rep_id', addReceptionistForm.rep_id)

            formData.append('name', addReceptionistForm.name)

            formData.append('email', addReceptionistForm.email)

            formData.append('phone', addReceptionistForm.phone)

            formData.append('country_code', addReceptionistForm.country_code)

            formData.append('ref_name', addReceptionistForm.ref_name || '')

            formData.append('password', addReceptionistForm.password)

            if (addReceptionistForm.profile_image) {

                formData.append('profile_image', addReceptionistForm.profile_image)

            }

            const response = await API.post('/admin/receptionists/register', formData, {

                headers: {

                    'Content-Type': 'multipart/form-data'

                }

            })

            const data = response.data || {}

            if (isSuccessResponse(data)) {

                toast.success(data.message || 'Receptionist registered successfully')

                // Update unassigned receptionists list in merchantData
                if (merchantData) {

                    const newRec = data.data || {

                        id: data.data?.id || Math.floor(Math.random() * 10000),

                        rep_id: addReceptionistForm.rep_id,

                        name: addReceptionistForm.name,

                        ref_name: addReceptionistForm.ref_name || '',

                        email: addReceptionistForm.email,

                        phone: addReceptionistForm.phone,

                        country_code: addReceptionistForm.country_code,

                        status: 1,

                        profile_image: data.data?.profile_image || addReceptionistForm.profileImagePreview || '',

                        createdAt: new Date().toISOString()

                    }

                    setMerchantData((prev) => {

                        if (!prev) return prev

                        return {

                            ...prev,

                            unassigned_receptionists: [

                                newRec,

                                ...(prev.unassigned_receptionists || [])

                            ],

                            total_receptionists: (Number(prev.total_receptionists) || 0) + 1

                        }

                    })

                }

                fetchReceptionists()

                closeAddReceptionistModal()

            } else {
                const errMsg = data.message || 'Failed to register receptionist'
                toast.error(errMsg)
                focusFieldByErrorMessage(errMsg, 'add-')
            }

        } catch (error) {

            const apiMessage = error?.response?.data?.message || 'Failed to register receptionist'

            toast.error(apiMessage)
            focusFieldByErrorMessage(apiMessage, 'add-')

            console.error('Error registering receptionist:', error)

        } finally {

            setAddingReceptionist(false)

        }

    }

    const handleChange = (e) => {

        const { name, value } = e.target

        setSelectedBranch((prev) => ({

            ...prev,

            [name]: value

        }))

    }

    const handleCategorySave = async () => {

        if (!selectedCategoryId) {

            toast.error('Please select a category')

            return

        }

        const selectedCategory = categories.find(
            (category) => category.id?.toString() === selectedCategoryId
        )

        try {

            setSavingCategory(true)

            const response = await API.post(
                'admin/merchant/category-update',
                {
                    id,
                    cat_id: selectedCategoryId
                }
            )

            const data = response.data || {}
            console.log("Data", data)

            if (isSuccessResponse(data)) {

                setMerchantData((prev) => prev
                    ? {
                        ...prev,
                        cat_id: data.data?.cat_id?.toString() || selectedCategoryId,
                        // bus_cat: data.data?.bus_cat || data.data?.name || prev.bus_cat,
                        Category: {
                            ...prev.Category,
                            name: selectedCategory?.name || prev.Category?.name
                        },
                        category: {
                            ...prev.category,
                            name: selectedCategory?.name || prev.category?.name
                        }
                    }
                    : prev
                )

                setIsEditingCategory(false)

                toast.success(data.message || 'Category updated successfully')

            } else {

                toast.error(data.message || 'Category update failed')

            }

        } catch (error) {

            const apiMessage = error?.response?.data?.message || 'Category update failed'

            // console.log('Category Update Error:', error.response?.data || error)

            toast.error(apiMessage)

        } finally {

            setSavingCategory(false)

        }

    }

    const handleCategoryCancel = () => {

        setSelectedCategoryId(merchantData?.cat_id?.toString() || '')

        setIsEditingCategory(false)

    }

    if (!loading && !merchantData) {
        return (
            <>

                <div className="card" style={{ marginBottom: 18 }}>
                    <div className="flex-between" style={{ gap: 16, flexWrap: 'wrap' }}>
                        <div>
                            <h3 className="card-title">
                                Merchant details unavailable
                            </h3>

                            <p className="card-subtitle">
                                The merchant data could not be loaded. Please try again or return to the merchant list.
                            </p>
                        </div>

                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => navigate('/merchants')}
                        >
                            <i className="fas fa-arrow-left"></i>
                            {' '}Back to Merchants
                        </button>
                    </div>

                    {/* Coupon List Section */}
                    <div className="coupon-section" style={{ marginTop: 24 }}>
                        {loading ? (
                            <p>Loading coupons...</p>
                        ) : (
                            merchantData?.coupon_list && merchantData.coupon_list.length > 0 ? (
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Code</th>
                                            <th>Type / Deal</th>
                                            <th>Min Amount</th>
                                            <th>Usage Limit</th>
                                            <th>Start Date</th>
                                            <th>End Date</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {merchantData.coupon_list.map((coupon) => (
                                            <tr key={coupon.id}>
                                                <td>{coupon.code}</td>
                                                <td>
                                                    {Number(coupon.type) === 3
                                                        ? `Buy ${coupon.buy_item || '-'} Get ${coupon.get_item || '-'}`
                                                        : Number(coupon.type) === 2
                                                            ? `${coupon.percentage} (Fixed)`
                                                            : `${coupon.percentage}%`
                                                    }
                                                </td>
                                                <td>{coupon.min_amount}</td>
                                                {/* <td>{coupon.usage_limit}</td> */}
                                                <td>{formatDisplayDate(coupon.start_date)}</td>
                                                <td>{formatDisplayDate(coupon.end_date)}</td>
                                                <td>{coupon.status === 1 ? 'Active' : 'Inactive'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <p>No coupons available.</p>
                            )
                        )}
                    </div>
                </div>
            </>
        )
    }



    return (
        <>
            <ConfirmDialog
                open={confirmDialog.open}
                title={confirmDialog.title}
                message={confirmDialog.message}
                confirmText={confirmDialog.confirmText}
                cancelText={confirmDialog.cancelText}
                loading={confirmDialog.loading}
                onConfirm={handleConfirmDialog}
                onClose={closeConfirmDialog}
            />

            <div style={{ marginBottom: 24 }}>

                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontSize: '0.8rem',
                        color: 'var(--text-muted)',
                        fontWeight: 500,
                        marginBottom: 8
                    }}
                >

                    <NavLink
                        to="/merchants"
                        style={{ color: 'var(--primary)' }}
                    >
                        Merchants
                    </NavLink>

                    <i
                        className="fas fa-chevron-right"
                        style={{ fontSize: '0.7rem' }}
                    ></i>

                    <span> {merchantData?.bus_name}</span>

                </div>

                <div
                    className="flex-between"
                    style={{
                        gap: 20,
                        flexWrap: 'wrap'
                    }}
                >

                    <div
                        className="search-wrapper"
                        style={{
                            marginBottom: 0,
                            maxWidth: 360,
                            flex: 1,
                            minWidth: 240
                        }}
                    >

                        <i className="fas fa-search search-icon"></i>

                        <input
                            type="text"
                            className="search-input"
                            placeholder="Search branch name, address..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />

                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => navigate(`/merchant-report/${id}`)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                        >
                            <i className="fas fa-chart-line"></i> View Report
                        </button>
                        <NavLink
                            to="/merchants"
                            className="btn btn-secondary"
                        >
                            <i className="fas fa-arrow-left"></i>

                            {' '}Back to Merchants

                        </NavLink>
                    </div>

                </div>

            </div>

            <div className="card card-glass merchant-profile-card" style={{ position: 'relative' }}>
                {!loading && (
                    <NavLink
                        to={`/edit-merchant/${id}`}
                        className="merchant-inline-edit-btn"
                        title="Edit Merchant"
                        style={{
                            position: 'absolute',
                            top: '24px',
                            right: '24px',
                            zIndex: 10
                        }}
                    >
                        <i className="fas fa-edit" />
                    </NavLink>
                )}
                {loading ? (
                    <>
                        <div className="merchant-profile-info">
                            <div className="cell-avatar merchant-avatar skeleton-avatar" />
                            <div className="cell-info" style={{ width: '100%' }}>
                                <div className="merchant-title-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                                    <span className="skeleton-text" style={{ width: '220px', height: '28px', display: 'inline-block' }} />
                                    <span className="skeleton-text" style={{ width: '90px', height: '24px', display: 'inline-block' }} />
                                </div>
                                <span className="skeleton-text" style={{ width: '55%', height: '16px', marginTop: 8, display: 'inline-block' }} />
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: '14px', marginTop: '18px' }}>
                                    {Array.from({ length: 8 }).map((_, index) => (
                                        <div key={`profile-skel-${index}`}>
                                            <span className="skeleton-text" style={{ width: '90%', height: '16px', display: 'inline-block', marginBottom: 10 }} />
                                            <span className="skeleton-text" style={{ width: index % 2 === 0 ? '60%' : '80%', height: '14px', display: 'inline-block' }} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="merchant-profile-stats">
                            {Array.from({ length: 3 }).map((_, index) => (
                                <div className={`merchant-stat-item${index > 0 ? ' border-left' : ''}`} key={`stat-skel-${index}`}>
                                    <span className="skeleton-text" style={{ width: index === 0 ? '80px' : '60px', height: '30px', display: 'inline-block' }} />
                                    <span className="skeleton-text" style={{ width: '120px', height: '14px', marginTop: 10, display: 'inline-block' }} />
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <>
                        <div className="merchant-profile-info">

                            <div className="cell-avatar merchant-avatar">
                                M
                            </div>

                            <div className="cell-info" style={{ flex: 1 }}>

                                <div className="merchant-title-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>

                                    <h2>
                                        {merchantData?.name}
                                    </h2>

                                    <span
                                        className={`badge ${merchantData?.status == 1
                                            ? 'active'
                                            : 'pending'
                                            }`}
                                    >

                                        {
                                            merchantData?.status == 1
                                                ? 'Active'
                                                : 'Inactive'
                                        }

                                    </span>

                                </div>

                                <p className="merchant-subtext" style={{ marginTop: 8, maxWidth: 540 }}>
                                    {merchantData?.bus_name} • {merchantData?.email} • {merchantData?.city}, {merchantData?.state}
                                </p>

                                <div className="merchant-details-grid">

                                    <div>
                                        <small className="merchant-sub-label">
                                            Business Name
                                        </small>

                                        <p className="merchant-subtext">
                                            {merchantData?.bus_name}
                                        </p>
                                    </div>

                                    <div>
                                        <small className="merchant-sub-label">
                                            Service Provider Name
                                        </small>

                                        <p className="merchant-subtext">
                                            {merchantData?.bus_cat || '-'}
                                        </p>
                                    </div>

                                    <div>
                                        <div className="merchant-detail-label-row">
                                            <small className="merchant-sub-label">
                                                Category
                                            </small>

                                            {!isEditingCategory && (
                                                <button
                                                    type="button"
                                                    className="merchant-inline-edit-btn"
                                                    onClick={() => setIsEditingCategory(true)}
                                                    title="Edit category"
                                                >
                                                    <i className="fas fa-pen" />
                                                </button>
                                            )}
                                        </div>

                                        {isEditingCategory ? (
                                            <div className="merchant-category-editor">
                                                <div className="merchant-category-select-wrap">
                                                    <i className="fas fa-tags" />

                                                    <select
                                                        className="merchant-category-select"
                                                        value={selectedCategoryId}
                                                        onChange={(event) => setSelectedCategoryId(event.target.value)}
                                                        disabled={savingCategory}
                                                    >
                                                        <option value="">
                                                            Select Category
                                                        </option>

                                                        {categories.map((category) => (
                                                            <option
                                                                key={category.id}
                                                                value={category.id}
                                                            >
                                                                {category.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div className="merchant-category-actions">
                                                    <button
                                                        type="button"
                                                        className="merchant-category-action save"
                                                        onClick={handleCategorySave}
                                                        disabled={savingCategory}
                                                        title="Save category"
                                                    >
                                                        <i className="fas fa-check" />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="merchant-category-action cancel"
                                                        onClick={handleCategoryCancel}
                                                        disabled={savingCategory}
                                                        title="Cancel"
                                                    >
                                                        <i className="fas fa-times" />
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="merchant-subtext merchant-category-view">
                                                <i className="fas fa-tag" />
                                                <span>
                                                    {merchantData?.Category?.name || merchantData?.category?.name || 'Not assigned'}
                                                </span>
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <small className="merchant-sub-label">
                                            Email
                                        </small>

                                        <p className="merchant-subtext" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                            {merchantData?.email}
                                            <i
                                                className="fas fa-check-circle"
                                                style={{ color: '#22c55e', fontSize: '0.85rem' }}
                                                title="Verified"
                                            />
                                        </p>
                                    </div>

                                    <div>
                                        <small className="merchant-sub-label">
                                            Phone
                                        </small>

                                        <p className="merchant-subtext">
                                            {merchantData?.phone}
                                        </p>
                                    </div>

                                    <div>
                                        <small className="merchant-sub-label">
                                            City
                                        </small>

                                        <p className="merchant-subtext">
                                            {merchantData?.city}
                                        </p>
                                    </div>

                                    <div>
                                        <small className="merchant-sub-label">
                                            State
                                        </small>

                                        <p className="merchant-subtext">
                                            {merchantData?.state}
                                        </p>
                                    </div>

                                    <div>
                                        <small className="merchant-sub-label">
                                            Zip Code
                                        </small>

                                        <p className="merchant-subtext">
                                            {merchantData?.zip_code}
                                        </p>
                                    </div>

                                    <div>
                                        <small className="merchant-sub-label">
                                            Country
                                        </small>

                                        <p className="merchant-subtext">
                                            {merchantData?.country}
                                        </p>
                                    </div>

                                    <div>
                                        <small className="merchant-sub-label">
                                            Created Date
                                        </small>

                                        <p className="merchant-subtext">
                                            {formatDisplayDate(merchantData?.createdAt)}
                                        </p>
                                    </div>

                                    <div style={{ gridColumn: '1 / -1' }}>
                                        <small className="merchant-sub-label">
                                            Address
                                        </small>

                                        <p
                                            className="merchant-subtext"
                                            style={{
                                                whiteSpace: 'normal',
                                                wordBreak: 'break-word',
                                                lineHeight: '1.6',
                                                maxWidth: '100%'
                                            }}
                                        >
                                            {merchantData?.address}
                                        </p>
                                    </div>
                                    <div style={{ gridColumn: '1 / -1' }}>
                                        <small className="merchant-sub-label">
                                            Description
                                        </small>

                                        <p
                                            className="merchant-subtext"
                                            style={{
                                                whiteSpace: 'normal',
                                                wordBreak: 'break-word',
                                                lineHeight: '1.6',
                                                maxWidth: '100%'
                                            }}
                                        >
                                            {merchantData?.description}
                                        </p>
                                    </div>

                                    <div style={{ gridColumn: '1 / -1' }}>
                                        <small className="merchant-sub-label">
                                            Document
                                        </small>
                                        <div style={{ marginTop: '6px' }}>
                                            {merchantData?.document ? (
                                                <article className="upload-card upload-card--documents" style={{ maxWidth: '340px', padding: '12px', display: 'flex', alignItems: 'center', gap: '14px', borderStyle: 'dashed' }}>
                                                    <div className="upload-card-icon upload-card-icon--square" style={{ width: '42px', height: '42px', fontSize: '1.2rem', flexShrink: 0 }}>
                                                        <i className="fas fa-file-alt" />
                                                    </div>
                                                    <div className="upload-card-body" style={{ padding: 0, margin: 0 }}>
                                                        <h4 className="upload-card-title" style={{ fontSize: '0.85rem', fontWeight: '700', color: '#1f2937', marginBottom: '4px', display: 'flex', alignItems: 'center' }}>
                                                            KYC Document
                                                            {merchantData?.doc_verify == 1 && (
                                                                <i className="fas fa-check-circle" style={{ color: '#22c55e', marginLeft: '6px' }} title="Verified KYC Document" />
                                                            )}
                                                        </h4>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px', flexWrap: 'wrap' }}>
                                                            <a
                                                                href={merchantData.document}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="doc-link"
                                                                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem' }}
                                                            >
                                                                <span>View Document</span>
                                                                <i className="fas fa-external-link-alt" style={{ fontSize: '0.65rem' }} />
                                                            </a>

                                                            {merchantData.doc_verify == 1 ? (
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                                    <span style={{ fontSize: '0.78rem', color: '#22c55e', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                                        <i className="fas fa-shield-alt" /> Verified
                                                                    </span>
                                                                    <button
                                                                        type="button"
                                                                        style={{
                                                                            display: 'inline-flex',
                                                                            alignItems: 'center',
                                                                            fontSize: '0.74rem',
                                                                            background: 'none',
                                                                            border: 'none',
                                                                            color: 'var(--text-muted)',
                                                                            cursor: 'pointer',
                                                                            padding: 0,
                                                                            textDecoration: 'underline'
                                                                        }}
                                                                        onClick={() => handleVerifyDocument(0)}
                                                                        disabled={verifyingDoc}
                                                                    >
                                                                        Unverify
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <button
                                                                    type="button"
                                                                    style={{
                                                                        display: 'inline-flex',
                                                                        alignItems: 'center',
                                                                        gap: '4px',
                                                                        fontSize: '0.78rem',
                                                                        background: 'none',
                                                                        border: 'none',
                                                                        color: 'var(--primary)',
                                                                        cursor: 'pointer',
                                                                        padding: 0,
                                                                        fontWeight: '600',
                                                                        textDecoration: 'underline'
                                                                    }}
                                                                    onClick={() => handleVerifyDocument(1)}
                                                                    disabled={verifyingDoc}
                                                                >
                                                                    {verifyingDoc ? 'Verifying...' : 'Verify Document'}
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </article>
                                            ) : (
                                                <span className="merchant-subtext" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No Document Uploaded</span>
                                            )}
                                        </div>
                                    </div>

                                </div>

                            </div>

                        </div>

                        <div className="merchant-profile-stats merchant-profile-stats-grid">

                            <div className="merchant-profile-stats-avatar">
                                <div className="merchant-avatar merchant-avatar-small">
                                    {merchantData?.brand_image || merchantData?.profile_image ? (
                                        <img
                                            src={merchantData?.brand_image || merchantData?.profile_image}
                                            alt={merchantData?.name || "Merchant"}
                                        />
                                    ) : (
                                        merchantData?.name?.charAt(0)
                                    )}
                                </div>
                            </div>

                            <div className="merchant-stat-item">

                                <span className="merchant-stat-val val-primary">
                                    {merchantData?.total_branch || 0}
                                </span>

                                <span className="merchant-stat-lbl">
                                    Total Branches
                                </span>

                            </div>

                            <div className="merchant-stat-item">

                                <span className="merchant-stat-val">
                                    {merchantData?.total_receptionists || 0}
                                </span>

                                <span className="merchant-stat-lbl">
                                    Receptionists
                                </span>

                            </div>

                            <div className="merchant-stat-item">

                                <span className="merchant-stat-val">
                                    {merchantData?.total_coupon_count || 0}
                                </span>

                                <span className="merchant-stat-lbl">
                                    Active Coupons
                                </span>

                            </div>
                            <div className="merchant-stat-item">

                                <span className="merchant-stat-val">
                                    {merchantData?.total_redeem_coupon || 0}
                                </span>

                                <span className="merchant-stat-lbl">
                                    Coupons Redeemed
                                </span>

                            </div>

                        </div>
                    </>
                )}
            </div>

            <div
                className="flex-between"
                style={{ marginBottom: 20, marginTop: 24 }}
            >
                <div>
                    <h3
                        style={{
                            fontFamily: 'var(--font-heading)',
                            fontSize: '1.15rem',
                            fontWeight: 600
                        }}
                    >
                        Merchant Coupons
                    </h3>

                    <p
                        style={{
                            fontSize: '0.82rem',
                            color: 'var(--text-muted)'
                        }}
                    >
                        Create and manage discount coupons for {merchantData?.bus_name || 'this merchant'}.
                    </p>
                </div>

                <button
                    type="button"
                    className="btn btn-primary"
                    onClick={openCreateCouponModal}
                    disabled={loading || !branchesData.length}
                >
                    <i className="fas fa-ticket-alt" />
                    {' '}Create Coupon
                </button>
            </div>

            {/* Coupon List Section */}
            <div className="table-wrapper">
                {loading ? (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Code</th>
                                <th>Percentage</th>
                                <th>Min Amount</th>
                                <th>Usage Limit</th>
                                <th>Start Date</th>
                                <th>End Date</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Array.from({ length: 3 }).map((_, index) => (
                                <tr className="skeleton-row" key={`coupon-skel-${index}`}>
                                    <td><span className="skeleton-text" style={{ width: '80px', display: 'inline-block' }} /></td>
                                    <td><span className="skeleton-text" style={{ width: '50px', display: 'inline-block' }} /></td>
                                    <td><span className="skeleton-text" style={{ width: '60px', display: 'inline-block' }} /></td>
                                    <td><span className="skeleton-text" style={{ width: '40px', display: 'inline-block' }} /></td>
                                    <td><span className="skeleton-text" style={{ width: '120px', display: 'inline-block' }} /></td>
                                    <td><span className="skeleton-text" style={{ width: '120px', display: 'inline-block' }} /></td>
                                    <td><span className="skeleton-text" style={{ width: '60px', display: 'inline-block' }} /></td>
                                    <td style={{ textAlign: 'right' }}>
                                        <span className="skeleton-text" style={{ width: '32px', display: 'inline-block' }} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    merchantData?.coupon_list && merchantData.coupon_list.length > 0 ? (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Value</th>
                                    <th>Branches</th>
                                    <th>Min Amount</th>
                                    {/* <th>Usage Limit</th> */}
                                    {/* <th>Start Date</th>
                                    <th>End Date</th> */}
                                    <th>Status</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedCoupons.map((coupon) => (
                                    <tr key={coupon.id}>
                                        <td>{coupon.code}</td>
                                        <td>
                                            {Number(coupon.type) === 3
                                                ? `Buy ${coupon.buy_item || '-'} Get ${coupon.get_item || '-'}`
                                                : Number(coupon.type) === 2
                                                    ? `${coupon.percentage} (Fixed)`
                                                    : `${coupon.percentage}%`
                                            }
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                                {coupon.branch_names && coupon.branch_names.length > 0 ? (
                                                    coupon.branch_names.map((b) => (
                                                        <span
                                                            key={b.id}
                                                            style={{
                                                                padding: '2px 8px',
                                                                background: 'rgba(142,45,226,0.06)',
                                                                border: '1px solid rgba(142,45,226,0.15)',
                                                                borderRadius: '12px',
                                                                color: 'var(--primary)',
                                                                fontSize: '0.75rem',
                                                                fontWeight: 500,
                                                                whiteSpace: 'nowrap'
                                                            }}
                                                        >
                                                            {b.name}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>-</span>
                                                )}
                                            </div>
                                        </td>
                                        <td>{coupon.min_amount}</td>
                                        {/* <td>{coupon.usage_limit}</td> */}
                                        {/* <td>{formatDisplayDate(coupon.start_date)}</td>
                                        <td>{formatDisplayDate(coupon.end_date)}</td> */}
                                        <td>
                                            <span className={`badge ${coupon.status === 1 ? 'active' : 'pending'}`}>
                                                {coupon.status === 1 ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="action-group" style={{ justifyContent: 'flex-end', gap: 8 }}>
                                                <button
                                                    className="btn-icon view"
                                                    title="View Coupon Details"
                                                    onClick={() => openViewCouponModal(coupon)}
                                                    disabled={deletingCouponId === coupon.id}
                                                >
                                                    <i className="fas fa-eye"></i>
                                                </button>

                                                <button
                                                    className="btn-icon edit"
                                                    title="Edit Coupon"
                                                    onClick={() => openEditCouponModal(coupon)}
                                                    disabled={deletingCouponId === coupon.id}
                                                >
                                                    <i className="fas fa-edit"></i>
                                                </button>

                                                <button
                                                    className="btn-icon delete"
                                                    title="Delete Coupon"
                                                    onClick={() => showDeleteCouponDialog(coupon.id)}
                                                    disabled={deletingCouponId === coupon.id}
                                                >
                                                    <i className="fas fa-trash-alt"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p style={{ padding: '14px 12px', margin: 0, color: 'var(--text-muted)', fontSize: '0.82rem' }}>No coupons available.</p>
                    )
                )}
            </div>

            {!loading && couponsList.length > COUPONS_PER_PAGE && (
                <div className="pagination-container" style={{ marginTop: 16 }}>
                    <span className="pagination-text">
                        Showing {couponStartCount} to {couponEndCount} of {couponsList.length} coupons
                    </span>
                    <div className="pagination-controls">
                        <button
                            className={`btn-page ${safeCouponPage === 1 ? 'disabled' : ''}`}
                            onClick={() => setCouponPage((page) => Math.max(1, page - 1))}
                            disabled={safeCouponPage === 1}
                        >
                            <i className="fas fa-chevron-left" />
                        </button>
                        {couponPageNumbers.map((page) => (
                            <button
                                key={page}
                                className={`btn-page ${page === safeCouponPage ? 'active' : ''}`}
                                onClick={() => setCouponPage(page)}
                            >
                                {page}
                            </button>
                        ))}
                        <button
                            className={`btn-page ${safeCouponPage === totalCouponPages ? 'disabled' : ''}`}
                            onClick={() => setCouponPage((page) => Math.min(totalCouponPages, page + 1))}
                            disabled={safeCouponPage === totalCouponPages}
                        >
                            <i className="fas fa-chevron-right" />
                        </button>
                    </div>
                </div>
            )}

            <div
                className="flex-between"
                style={{ marginBottom: 20, marginTop: 28 }}
            >

                <div>

                    <h3
                        style={{
                            fontFamily: 'var(--font-heading)',
                            fontSize: '1.15rem',
                            fontWeight: 600
                        }}
                    >
                        Active Branch Outlets
                    </h3>

                    <p
                        style={{
                            fontSize: '0.82rem',
                            color: 'var(--text-muted)'
                        }}
                    >
                        Manage physical retail locations for {merchantData?.bus_name || 'this merchant'}.
                    </p>

                </div>

                <button
                    className="btn btn-primary"
                    onClick={openAddBranchModal}
                >

                    <i className="fas fa-plus"></i>

                    {' '}Add Branch

                </button>

            </div>

            <div className="table-wrapper">

                <table className="data-table">

                    <thead>

                        <tr>

                            <th>Branch Name</th>

                            <th>Store Address</th>

                            <th>Status</th>

                            <th>Receptionist </th>

                            <th>Coupons Count</th>

                            <th style={{ textAlign: 'right' }}>
                                Actions
                            </th>

                        </tr>

                    </thead>

                    <tbody>
                        {loading ? (
                            Array.from({ length: 4 }).map((_, index) => (
                                <tr className="skeleton-row" key={`branch-skel-${index}`}>
                                    <td>
                                        <div className="table-cell-profile">
                                            <div className="cell-avatar skeleton-avatar" />
                                            <div className="cell-info">
                                                <span className="skeleton-text" style={{ width: '130px', display: 'inline-block' }} />
                                                <span className="skeleton-text" style={{ width: '90px', marginTop: 8, display: 'inline-block' }} />
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="skeleton-text" style={{ width: '100%', display: 'inline-block' }} />
                                    </td>
                                    <td>
                                        <span className="skeleton-text" style={{ width: '70px', display: 'inline-block' }} />
                                    </td>
                                    <td>
                                        <span className="skeleton-text" style={{ width: '80px', display: 'inline-block' }} />
                                    </td>
                                    <td>
                                        <span className="skeleton-text" style={{ width: '90px', display: 'inline-block' }} />
                                    </td>
                                    <td>
                                        <span className="skeleton-text" style={{ width: '100px', display: 'inline-block' }} />
                                    </td>
                                </tr>
                            ))
                        ) : paginatedBranches.length ? (
                            paginatedBranches.map((branch) => (
                                <tr key={branch.id}>
                                    <td>
                                        <div className="table-cell-profile">
                                            <div className="cell-avatar">
                                                {branch.name?.charAt(0)}
                                            </div>
                                            <div className="cell-info">
                                                <strong>
                                                    {branch.name}
                                                </strong>
                                                <span className="cell-subtext">
                                                    {/* {branch.address} */}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div
                                            style={{
                                                maxWidth: '450px',
                                                whiteSpace: 'normal',
                                                wordBreak: 'break-word',
                                                lineHeight: '1.5'
                                            }}
                                        >
                                            {branch.address}
                                        </div>
                                    </td>
                                    <td>
                                        <span
                                            className={`badge ${branch.status == 1
                                                ? 'active'
                                                : 'pending'
                                                }`}
                                        >
                                            {
                                                branch.status == 1
                                                    ? 'Active'
                                                    : 'Inactive'
                                            }
                                        </span>
                                    </td>
                                    <td>
                                        <button
                                            className="btn-sm-action"
                                            onClick={() => {



                                                openAssignReceptionistModal(
                                                    branch.Receptionists?.[0]?.id

                                                );

                                            }}
                                            disabled={!branch.Receptionists?.length}
                                        >
                                            <i className="fas fa-user-shield"></i>
                                            {
                                                branch.Receptionists?.length > 0
                                                    ? branch.Receptionists.map(item => item.name).join(', ')
                                                    : 'No Staff Assigned'
                                            }
                                        </button>
                                    </td>
                                    <td>
                                        <button
                                            className="btn-sm-action-secondary"
                                            onClick={() => openBranchCouponsModal(branch)}
                                        >
                                            <i className="fas fa-ticket-alt"></i>
                                            {' '}
                                            {
                                                branch.coupon_count || 0
                                            }
                                            {' '}Coupons
                                        </button>
                                    </td>
                                    <td>
                                        <div
                                            className="action-group"
                                            style={{
                                                justifyContent: 'flex-end'
                                            }}
                                        >
                                            <button
                                                className="btn-icon view"
                                                title="View Branch"
                                                onClick={() => navigate(`/view-branch/${branch.id}`)}
                                            >
                                                <i className="fas fa-eye"></i>
                                            </button>
                                            <button
                                                className="btn-icon"
                                                title="Branch Report"
                                                onClick={() => navigate(`/branch-report/${branch.id}`)}
                                                style={{
                                                    background: 'linear-gradient(135deg, rgba(59,130,246,0.12) 0%, rgba(59,130,246,0.06) 100%)',
                                                    color: '#3b82f6',
                                                    border: '1.5px solid rgba(59,130,246,0.22)'
                                                }}
                                            >
                                                <i className="fas fa-chart-line"></i>
                                            </button>
                                            <button
                                                className="btn-icon"
                                                title="Customer Chats"
                                                onClick={() => navigate(`/branch-chat/${branch.id}`)}
                                                style={{
                                                    background: 'linear-gradient(135deg, rgba(233,30,140,0.12) 0%, rgba(233,30,140,0.06) 100%)',
                                                    color: '#e91e8c',
                                                    border: '1.5px solid rgba(233,30,140,0.22)'
                                                }}
                                            >
                                                <i className="fas fa-comments"></i>
                                            </button>
                                            <button
                                                className="btn-icon"
                                                title="Photo Verification"
                                                onClick={() => navigate(`/branch-pending-images/${branch.id}`)}
                                                style={{
                                                    background: 'linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(16,185,129,0.06) 100%)',
                                                    color: '#10b981',
                                                    border: '1.5px solid rgba(16,185,129,0.22)'
                                                }}
                                            >
                                                <i className="fas fa-camera"></i>
                                            </button>
                                            <button
                                                className="btn-icon edit"
                                                onClick={() => openEditBranchModal(branch.id)}
                                            >
                                                <i className="fas fa-edit"></i>
                                            </button>
                                            <button className="btn-icon delete" onClick={() => showDeleteBranchDialog(branch.id)}>
                                                <i className="fas fa-trash-alt"></i>
                                            </button>

                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', padding: '28px 16px' }}>
                                    No branches found.
                                </td>
                            </tr>
                        )}
                    </tbody>

                </table>

                {!loading && filteredBranches.length > BRANCHES_PER_PAGE && (
                    <div className="pagination-container">
                        <span className="pagination-text">
                            Showing {branchStartCount}-{branchEndCount} of {filteredBranches.length} branches
                        </span>

                        <div className="pagination-controls">
                            <button
                                type="button"
                                className={`btn-page ${safeBranchPage === 1 ? 'disabled' : ''}`}
                                onClick={() => setBranchPage((page) => Math.max(1, page - 1))}
                                disabled={safeBranchPage === 1}
                            >
                                <i className="fas fa-chevron-left"></i>
                            </button>

                            {branchPageNumbers.map((page) => (
                                <button
                                    type="button"
                                    key={page}
                                    className={`btn-page ${page === safeBranchPage ? 'active' : ''}`}
                                    onClick={() => setBranchPage(page)}
                                >
                                    {page}
                                </button>
                            ))}

                            <button
                                type="button"
                                className={`btn-page ${safeBranchPage === totalBranchPages ? 'disabled' : ''}`}
                                onClick={() => setBranchPage((page) => Math.min(totalBranchPages, page + 1))}
                                disabled={safeBranchPage === totalBranchPages}
                            >
                                <i className="fas fa-chevron-right"></i>
                            </button>
                        </div>
                    </div>
                )}

            </div>

            <div
                className="flex-between"
                style={{ marginTop: 28, marginBottom: 20 }}
            >

                <div>

                    <h3
                        style={{
                            fontFamily: 'var(--font-heading)',
                            fontSize: '1.15rem',
                            fontWeight: 600
                        }}
                    >
                        Unassigned Receptionists
                    </h3>

                    <p
                        style={{
                            fontSize: '0.82rem',
                            color: 'var(--text-muted)'
                        }}
                    >
                        Receptionists not yet assigned to a branch.
                    </p>

                </div>

                <button
                    className="btn btn-primary"
                    onClick={openAddReceptionistModal}
                >
                    <i className="fas fa-plus"></i>
                    {' '}Add Receptionist
                </button>

            </div>

            <div className="table-wrapper">

                <table className="data-table">

                    <thead>

                        <tr>

                            <th>Name</th>
                            <th>Receptionist Id</th>

                            <th>Email</th>

                            <th>Phone</th>

                            <th>Status</th>

                            <th style={{ textAlign: 'right' }}>
                                Action
                            </th>

                        </tr>

                    </thead>

                    <tbody>
                        {loading ? (
                            Array.from({ length: 3 }).map((_, index) => (
                                <tr className="skeleton-row" key={`unassigned-receptionist-skel-${index}`}>
                                    <td>
                                        <div className="table-cell-profile">
                                            <div className="cell-avatar skeleton-avatar" />
                                            <div className="cell-info">
                                                <span className="skeleton-text" style={{ width: '130px', display: 'inline-block' }} />
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="skeleton-text" style={{ width: '160px', display: 'inline-block' }} />
                                    </td>
                                    <td>
                                        <span className="skeleton-text" style={{ width: '110px', display: 'inline-block' }} />
                                    </td>
                                    <td>
                                        <span className="skeleton-text" style={{ width: '70px', display: 'inline-block' }} />
                                    </td>
                                    <td>
                                        <span className="skeleton-text" style={{ width: '90px', display: 'inline-block' }} />
                                    </td>
                                </tr>
                            ))
                            
                        ) : unassignedReceptionists.length ? (
                            unassignedReceptionists.map((receptionist) => (
                                
                                <tr key={receptionist.id}>
                                    
                                    <td>
                                        <div className="table-cell-profile">
                                            <div className="cell-avatar">
                                                {getProfileImage(receptionist) ? (
                                                    <img
                                                        src={getProfileImage(receptionist)}
                                                        alt={receptionist.name || 'Receptionist'}
                                                        style={{
                                                            width: '100%',
                                                            height: '100%',
                                                            objectFit: 'cover',
                                                            borderRadius: '50%'
                                                        }}
                                                    />
                                                ) : (
                                                    receptionist.name?.charAt(0) || 'R'
                                                )}
                                            </div>

                                            <div className="cell-info">
                                                <strong>
                                                    {receptionist.name || 'Unnamed'}
                                                </strong>
                                                {receptionist.ref_name ? (
                                                    <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
                                                        Ref: {receptionist.ref_name}
                                                    </span>
                                                ) : null}
                                            </div>
                                        </div>
                                    </td>

                                    <td>
                                        {receptionist.rep_id || '-'}
                                    </td>
                                    <td>
                                        {receptionist.email || '-'}
                                    </td>
                                    <td>
                                        {getReceptionistPhone(receptionist)}
                                    </td>
                                    
                                    <td>
                                        <span
                                            className={`badge ${receptionist.status == 0
                                                ? 'pending'
                                                : 'active'
                                                }`}
                                        >
                                            {
                                                receptionist.status == 0
                                                    ? 'Inactive'
                                                    : 'Active'
                                            }
                                        </span>
                                    </td>

                                    <td>
                                        <div
                                            className="action-group"
                                            style={{
                                                justifyContent: 'flex-end'
                                            }}
                                        >
                                            <button
                                                type="button"
                                                className="btn-sm-action"
                                                title="Assign receptionist"
                                                onClick={() => {



                                                    openAssignReceptionistModal(receptionist.id);

                                                }}
                                            >
                                                <i className="fas fa-user-shield"></i>
                                                {' '}View
                                            </button>
                                            <button
                                                className="btn-icon delete"
                                                title="Delete Receptionist"
                                                onClick={() => showDeleteReceptionistDialog(receptionist.id)}
                                                disabled={deletingCouponId === receptionist.id}
                                            >
                                                <i className="fas fa-trash-alt"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', padding: '28px 16px' }}>
                                    No unassigned receptionists found.
                                </td>
                            </tr>
                        )}
                    </tbody>

                </table>

            </div>

            {selectedReceptionist && (
                <div className="modal active">
                    <div className="modal-backdrop"></div>

                    <div className="modal-content">
                        <div className="modal-header">
                            <h3 className="modal-title">
                                {isEditingReceptionist ? 'Edit Receptionist' : 'Receptionist View'}
                            </h3>

                            <button
                                type="button"
                                className="modal-close"
                                onClick={closeAssignReceptionistModal}
                                disabled={savingReceptionist}
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        <div className="modal-body">
                            {isEditingReceptionist ? (
                                <form onSubmit={(e) => e.preventDefault()} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 8, gap: 12 }}>
                                        <div className="cell-avatar" style={{ width: 72, height: 72, position: 'relative', overflow: 'hidden', border: '2px solid var(--primary)', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '1.8rem', color: 'var(--primary)', background: 'var(--bg-hover)' }}>
                                            {receptionistForm.profileImagePreview ? (
                                                <img
                                                    src={receptionistForm.profileImagePreview}
                                                    alt="Preview"
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                />
                                            ) : (
                                                receptionistForm.name?.charAt(0) || 'R'
                                            )}
                                        </div>
                                        <label className="btn btn-sm-action-secondary" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, margin: 0, padding: '6px 12px', fontSize: '0.8rem', borderRadius: '6px' }}>
                                            <i className="fas fa-camera" /> Change Photo
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        setReceptionistForm({
                                                            ...receptionistForm,
                                                            profile_image: file,
                                                            profileImagePreview: URL.createObjectURL(file)
                                                        });
                                                    }
                                                }}
                                                hidden
                                            />
                                        </label>
                                    </div>

                                    <div className="form-group">
                                        <input
                                            type="text"
                                            id="edit-rep-id"
                                            className="form-control"
                                            value={receptionistForm.rep_id || ''}
                                            readOnly
                                            disabled
                                            placeholder=" "
                                            style={{ background: 'var(--bg-hover)', cursor: 'not-allowed' }}
                                        />
                                        <label className="form-label">Receptionist ID</label>
                                    </div>

                                    <div className="form-group">
                                        <input
                                            type="text"
                                            id="edit-rep-name"
                                            className="form-control"
                                            value={receptionistForm.name}
                                            onChange={(e) => setReceptionistForm({ ...receptionistForm, name: e.target.value })}
                                            placeholder=" "
                                            required
                                            autoComplete="off"
                                        />
                                        <label className="form-label">Full Name <span style={{ color: '#ef4444' }}>*</span></label>
                                    </div>

                                    <div className="form-group">
                                        <input
                                            type="text"
                                            id="edit-rep-ref-name"
                                            className="form-control"
                                            value={receptionistForm.ref_name || ''}
                                            onChange={(e) => setReceptionistForm({ ...receptionistForm, ref_name: e.target.value })}
                                            placeholder=" "
                                            autoComplete="off"
                                        />
                                        <label className="form-label">Reference Name</label>
                                    </div>

                                    <div className="form-group">
                                        <input
                                            type="email"
                                            id="edit-rep-email"
                                            className="form-control"
                                            value={receptionistForm.email}
                                            onChange={(e) => setReceptionistForm({ ...receptionistForm, email: e.target.value })}
                                            placeholder=" "

                                            autoComplete="off"
                                        />
                                        <label className="form-label">Corporate Email</label>
                                    </div>

                                    <PhoneNumberField
                                        value={receptionistForm.phone}
                                        countryCode={receptionistForm.country_code}
                                        required={true}
                                        onChange={(phoneVal, codeVal) => {
                                            setReceptionistForm({
                                                ...receptionistForm,
                                                phone: phoneVal || '',
                                                country_code: codeVal || ''
                                            });
                                        }}
                                    />

                                    <div className="form-group" style={{ position: 'relative' }}>
                                        <input
                                            type={showEditRepPassword ? "text" : "password"}
                                            id="edit-rep-password"
                                            className="form-control"
                                            value={receptionistForm.password}
                                            onChange={(e) => setReceptionistForm({ ...receptionistForm, password: e.target.value })}
                                            placeholder=" "
                                            autoComplete="new-password"
                                            style={{ paddingRight: '40px' }}
                                        />
                                        <label className="form-label">Password <span style={{ color: '#ef4444' }}>*</span></label>
                                        <button
                                            type="button"
                                            onClick={() => setShowEditRepPassword(!showEditRepPassword)}
                                            style={{
                                                position: 'absolute',
                                                right: '12px',
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                background: 'none',
                                                border: 'none',
                                                cursor: 'pointer',
                                                color: 'var(--text-secondary)',
                                                padding: 0,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                zIndex: 10
                                            }}
                                        >
                                            <i className={showEditRepPassword ? "fas fa-eye-slash" : "fas fa-eye"}></i>
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <>
                                    <div
                                        className="table-cell-profile"
                                        style={{
                                            alignItems: 'center',
                                            marginBottom: 20
                                        }}
                                    >
                                        <div className="cell-avatar" style={{ width: 52, height: 52 }}>
                                            {getProfileImage(selectedReceptionist) ? (
                                                <img
                                                    src={getProfileImage(selectedReceptionist)}
                                                    alt={selectedReceptionist.name || 'Receptionist'}
                                                    style={{
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'cover',
                                                        borderRadius: '50%'
                                                    }}
                                                />
                                            ) : (
                                                selectedReceptionist.name?.charAt(0) || 'R'
                                            )}
                                        </div>

                                        <div className="cell-info">
                                            <strong className="cell-name">
                                                {selectedReceptionist.name || 'Unnamed'}
                                            </strong>

                                            <span className="cell-subtext">
                                                {/* Receptionist ID: {selectedReceptionist.id} */}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="merchant-details-grid" style={{ marginBottom: 20 }}>
                                        <div>
                                            <small className="merchant-sub-label">
                                                Receptionist ID
                                            </small>

                                            <p className="merchant-subtext">
                                                {selectedReceptionist.rep_id || '-'}
                                            </p>
                                        </div>

                                        <div>
                                            <small className="merchant-sub-label">
                                                Reference Name
                                            </small>

                                            <p className="merchant-subtext">
                                                {selectedReceptionist.ref_name || '-'}
                                            </p>
                                        </div>

                                        <div>
                                            <small className="merchant-sub-label">
                                                Email
                                            </small>

                                            <p className="merchant-subtext">
                                                {selectedReceptionist.email || '-'}
                                            </p>
                                        </div>

                                        <div>
                                            <small className="merchant-sub-label">
                                                Phone
                                            </small>

                                            <p className="merchant-subtext">
                                                {getReceptionistPhone(selectedReceptionist)}
                                            </p>
                                        </div>
                                        <div>
                                            <small className="merchant-sub-label">
                                                Created At
                                            </small>

                                            <p className="merchant-subtext">
                                                {formatDisplayDate(getCreatedAt(selectedReceptionist))}
                                            </p>
                                        </div>

                                        <div>
                                            <small className="merchant-sub-label">
                                                Assigned Branch
                                            </small>

                                            <p className="merchant-subtext">
                                                {selectedReceptionist.branch_name || 'Not Assigned'}
                                            </p>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="modal-footer">
                            {isEditingReceptionist ? (
                                <>
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => setIsEditingReceptionist(false)}
                                        disabled={savingReceptionist}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-primary"
                                        onClick={handleSaveReceptionist}
                                        disabled={savingReceptionist}
                                    >
                                        {savingReceptionist ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={closeAssignReceptionistModal}
                                    >
                                        Close
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-primary"
                                        onClick={handleStartEditReceptionist}
                                    >
                                        Edit
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {showAddReceptionistModal && (
                <div className="modal active">
                    <div className="modal-backdrop"></div>

                    <div className="modal-content">
                        <div className="modal-header">
                            <h3 className="modal-title">
                                Add Receptionist
                            </h3>

                            <button
                                type="button"
                                className="modal-close"
                                onClick={closeAddReceptionistModal}
                                disabled={addingReceptionist}
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        <div className="modal-body">
                            <form onSubmit={(e) => e.preventDefault()} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 8, gap: 12 }}>
                                    <div className="cell-avatar" style={{ width: 72, height: 72, position: 'relative', overflow: 'hidden', border: '2px solid var(--primary)', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '1.8rem', color: 'var(--primary)', background: 'var(--bg-hover)' }}>
                                        {addReceptionistForm.profileImagePreview ? (
                                            <img
                                                src={addReceptionistForm.profileImagePreview}
                                                alt="Preview"
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            />
                                        ) : (
                                            addReceptionistForm.name?.charAt(0) || 'R'
                                        )}
                                    </div>
                                    <label className="btn btn-sm-action-secondary" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, margin: 0, padding: '6px 12px', fontSize: '0.8rem', borderRadius: '6px' }}>
                                        <i className="fas fa-camera" /> Upload Photo
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    setAddReceptionistForm({
                                                        ...addReceptionistForm,
                                                        profile_image: file,
                                                        profileImagePreview: URL.createObjectURL(file)
                                                    });
                                                }
                                            }}
                                            hidden
                                        />
                                    </label>
                                </div>

                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                                        <input
                                            type="text"
                                            id="add-rep-id"
                                            className="form-control"
                                            value={addReceptionistForm.rep_id}
                                            onChange={(e) => setAddReceptionistForm({ ...addReceptionistForm, rep_id: e.target.value })}
                                            placeholder=" "
                                            required
                                            autoComplete="off"
                                        />
                                        <label className="form-label">Receptionist ID <span style={{ color: '#ef4444' }}>*</span></label>
                                    </div>
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={generateReceptionistId}
                                        disabled={generatingId}
                                        style={{ height: '42px', padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, borderRadius: '8px', fontSize: '0.875rem' }}
                                    >
                                        {generatingId ? (
                                            <i className="fas fa-spinner fa-spin" />
                                        ) : (
                                            'Generate'
                                        )}
                                    </button>
                                </div>

                                <div className="form-group">
                                    <input
                                        type="text"
                                        id="add-rep-name"
                                        className="form-control"
                                        value={addReceptionistForm.name}
                                        onChange={(e) => setAddReceptionistForm({ ...addReceptionistForm, name: e.target.value })}
                                        placeholder=" "
                                        required
                                        autoComplete="off"
                                    />
                                    <label className="form-label">Full Name <span style={{ color: '#ef4444' }}>*</span></label>
                                </div>

                                <div className="form-group">
                                    <input
                                        type="text"
                                        id="add-rep-ref-name"
                                        className="form-control"
                                        value={addReceptionistForm.ref_name || ''}
                                        onChange={(e) => setAddReceptionistForm({ ...addReceptionistForm, ref_name: e.target.value })}
                                        placeholder=" "
                                        autoComplete="off"
                                    />
                                    <label className="form-label">Reference Name</label>
                                </div>

                                <div className="form-group">
                                    <input
                                        type="email"
                                        id="add-rep-email"
                                        className="form-control"
                                        value={addReceptionistForm.email}
                                        onChange={(e) => setAddReceptionistForm({ ...addReceptionistForm, email: e.target.value })}
                                        placeholder=" "

                                        autoComplete="off"
                                    />
                                    <label className="form-label">Corporate Email</label>
                                </div>

                                <PhoneNumberField 
                                    value={addReceptionistForm.phone}
                                    countryCode={addReceptionistForm.country_code}
                                    required={true}
                                    onChange={(phoneVal, codeVal) => {
                                        setAddReceptionistForm({
                                            ...addReceptionistForm,
                                            phone: phoneVal || '',
                                            country_code: codeVal || ''
                                        });
                                    }}
                                />

                                <div className="form-group" style={{ position: 'relative' }}>
                                    <input
                                        type={showAddRepPassword ? "text" : "password"}
                                        id="add-rep-password"
                                        className="form-control"
                                        value={addReceptionistForm.password}
                                        onChange={(e) => setAddReceptionistForm({ ...addReceptionistForm, password: e.target.value })}
                                        placeholder=" "
                                        required
                                        autoComplete="new-password"
                                        style={{ paddingRight: '40px' }}
                                    />
                                    <label className="form-label">Password <span style={{ color: '#ef4444' }}>*</span></label>
                                    <button
                                        type="button"
                                        onClick={() => setShowAddRepPassword(!showAddRepPassword)}
                                        style={{
                                            position: 'absolute',
                                            right: '12px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            color: 'var(--text-secondary)',
                                            padding: 0,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            zIndex: 10
                                        }}
                                    >
                                        <i className={showAddRepPassword ? "fas fa-eye-slash" : "fas fa-eye"}></i>
                                    </button>
                                </div>
                            </form>
                        </div>

                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={closeAddReceptionistModal}
                                disabled={addingReceptionist}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={handleAddReceptionist}
                                disabled={addingReceptionist}
                            >
                                {addingReceptionist ? 'Registering...' : 'Register'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showCreateCouponModal && (
                <div className="modal active">
                    <div className="modal-backdrop" />

                    <div className="modal-content" style={{ maxWidth: 640, width: '100%' }}>
                        <div className="modal-header">
                            <h3 className="modal-title">
                                <i className="fas fa-ticket-alt" style={{ marginRight: 8, color: 'var(--primary)' }} />
                                Create Coupon
                            </h3>

                            <button
                                type="button"
                                className="modal-close"
                                onClick={closeCreateCouponModal}
                                disabled={creatingCoupon}
                            >
                                <i className="fas fa-times" />
                            </button>
                        </div>

                        <div className="modal-body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
                            <form
                                onSubmit={(e) => { e.preventDefault(); handleCreateCoupon() }}
                                style={{ display: 'flex', flexDirection: 'column', gap: 18 }}
                            >
                                <div className="form-row" style={{ alignItems: 'flex-end' }}>
                                    <div className="form-group-classic" style={{ marginBottom: 0 }}>
                                        <label className="form-label-classic">Coupon Name</label>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <input
                                                type="text"
                                                name="code"
                                                className="form-control"
                                                placeholder="Enter the Name"
                                                value={couponForm.code}
                                                onChange={handleCouponChange}
                                                disabled={creatingCoupon}
                                                required
                                                autoComplete="off"
                                                style={{ flex: 1 }}
                                            />
                                            {/* <button
                                                type="button"
                                                className="btn btn-secondary"
                                                onClick={generateCouponCodeForCreate}
                                                disabled={creatingCoupon || generatingCode}
                                                style={{ padding: '0 14px', height: 40, flexShrink: 0, margin: 0, whiteSpace: 'nowrap' }}
                                            >
                                                {generatingCode ? (
                                                    <i className="fas fa-spinner fa-spin" />
                                                ) : (
                                                    <i className="fas fa-magic" />
                                                )}
                                                {' '}
                                            </button> */}
                                        </div>
                                    </div>

                                    <div className="form-group-classic">
                                        <label className="form-label-classic">Coupon Type</label>
                                        <select
                                            name="type"
                                            className="form-select"
                                            value={couponForm.type}
                                            onChange={handleCouponChange}
                                            disabled={creatingCoupon}
                                            required
                                        >
                                            <option value={1}>Discount (%)</option>
                                            <option value={2}>Fixed Amount</option>
                                            <option value={3}>Buy X Get Y</option>
                                        </select>
                                    </div>
                                </div>

                                {Number(couponForm.type) !== 3 ? (
                                    <>
                                        {Number(couponForm.type) === 2 && (
                                            <div className="form-group-classic" style={{ marginBottom: 12 }}>
                                                <label className="form-label-classic" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer', textTransform: 'none', fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={minAmountToggle}
                                                        onChange={(e) => {
                                                            const checked = e.target.checked
                                                            setMinAmountToggle(checked)
                                                            setCouponForm(prev => ({
                                                                ...prev,
                                                                min_amount: checked ? '' : '0'
                                                            }))
                                                        }}
                                                        disabled={creatingCoupon}
                                                        style={{ width: 16, height: 16, accentColor: 'var(--primary)', cursor: 'pointer' }}
                                                    />
                                                    <span>Minimum Amount Required</span>
                                                </label>
                                            </div>
                                        )}

                                        <div className="form-row">
                                            <div className="form-group">
                                                <input
                                                    type="number"
                                                    name="percentage"
                                                    className="form-control"
                                                    placeholder=" "
                                                    value={couponForm.percentage}
                                                    onChange={handleCouponChange}
                                                    disabled={creatingCoupon}
                                                    min="0"
                                                    max={Number(couponForm.type) === 1 ? "100" : undefined}
                                                    required
                                                />
                                                <label className="form-label">
                                                    {Number(couponForm.type) === 2 ? 'Fixed Amount' : 'Discount (%)'}
                                                </label>
                                            </div>

                                            {Number(couponForm.type) === 2 && minAmountToggle ? (
                                                <div className="form-group">
                                                    <input
                                                        type="number"
                                                        name="min_amount"
                                                        className="form-control"
                                                        placeholder=" "
                                                        value={couponForm.min_amount === '0' ? '' : couponForm.min_amount}
                                                        onChange={handleCouponChange}
                                                        disabled={creatingCoupon}
                                                        min="1"
                                                        required
                                                    />
                                                    <label className="form-label">Minimum Amount</label>
                                                </div>
                                            ) : (
                                                <div />
                                            )}
                                        </div>

                                        <div className="form-row">
                                            {/* <div className="form-group">
                                                <input
                                                    type="number"
                                                    name="usage_limit"
                                                    className="form-control"
                                                    placeholder=" "
                                                    value={couponForm.usage_limit}
                                                    onChange={handleCouponChange}
                                                    disabled={creatingCoupon}
                                                    min="0"
                                                    required
                                                />
                                                <label className="form-label">Usage Limit</label>
                                            </div> */}

                                            <div className="form-group-classic">
                                                <label className="form-label-classic">Coupon Category</label>
                                                <select
                                                    name="cat_id"
                                                    className="form-select"
                                                    value={couponForm.cat_id}
                                                    onChange={handleCouponChange}
                                                    disabled={creatingCoupon}
                                                    required
                                                >
                                                    <option value="">Select category</option>
                                                    {couponCategories.map((category) => (
                                                        <option key={category.id} value={category.id}>
                                                            {category.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="form-row">
                                            <div className="form-group">
                                                <input
                                                    type="text"
                                                    name="buy_item"
                                                    className="form-control"
                                                    placeholder=" "
                                                    value={couponForm.buy_item}
                                                    onChange={handleCouponChange}
                                                    disabled={creatingCoupon}
                                                    required
                                                />
                                                <label className="form-label">Buy Item / Service</label>
                                            </div>

                                            <div className="form-group">
                                                <input
                                                    type="text"
                                                    name="get_item"
                                                    className="form-control"
                                                    placeholder=" "
                                                    value={couponForm.get_item}
                                                    onChange={handleCouponChange}
                                                    disabled={creatingCoupon}
                                                    required
                                                />
                                                <label className="form-label">Get Item / Service</label>
                                            </div>
                                        </div>

                                        {/* No minimum amount for Buy X Get Y */}

                                        {/* <div className="form-group">
                                                <input
                                                    type="number"
                                                    name="usage_limit"
                                                    className="form-control"
                                                    placeholder=" "
                                                    value={couponForm.usage_limit}
                                                    onChange={handleCouponChange}
                                                    disabled={creatingCoupon}
                                                    min="0"
                                                    required
                                                />
                                                <label className="form-label">Usage Limit</label>
                                            </div> */}

                                        <div className="form-group-classic">
                                            <label className="form-label-classic">Coupon Category</label>
                                            <select
                                                name="cat_id"
                                                className="form-select"
                                                value={couponForm.cat_id}
                                                onChange={handleCouponChange}
                                                disabled={creatingCoupon}
                                                required
                                            >
                                                <option value="">Select category</option>
                                                {couponCategories.map((category) => (
                                                    <option key={category.id} value={category.id}>
                                                        {category.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </>
                                )}
                                <div className="form-group-classic">
                                    <label className="form-label-classic">Term and Condtions</label>
                                    <textarea
                                        name="description"
                                        className="form-control"
                                        placeholder=" "
                                        value={couponForm.description}
                                        onChange={handleCouponChange}
                                        disabled={creatingCoupon}
                                        rows="3"
                                        style={{
                                            resize: 'vertical',
                                            padding: '10px 14px',
                                            height: 'auto',
                                            borderRadius: 8,
                                            border: '1px solid var(--border)',
                                            background: 'var(--bg-surface)',
                                            color: 'var(--text-primary)'
                                        }}
                                    />
                                </div>

                                <div className="form-row">
                                    <div className="form-group-classic">
                                        <label className="form-label-classic">Start Date</label>
                                        <input
                                            type="date"
                                            name="start_date"
                                            className="form-select"
                                            value={couponForm.start_date}
                                            onChange={handleCouponChange}
                                            disabled={creatingCoupon}
                                            required
                                        />
                                    </div>

                                    <div className="form-group-classic">
                                        <label className="form-label-classic">End Date</label>
                                        <input
                                            type="date"
                                            name="end_date"
                                            className="form-select"
                                            value={couponForm.end_date}
                                            onChange={handleCouponChange}
                                            disabled={creatingCoupon}
                                            required
                                        />
                                    </div>
                                </div>



                                <div className="form-group-classic">
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            gap: 12,
                                            marginBottom: 8
                                        }}
                                    >
                                        <label className="form-label-classic" style={{ marginBottom: 0 }}>
                                            Branches
                                        </label>

                                        <div style={{ display: 'flex', gap: 10 }}>
                                            <button
                                                type="button"
                                                className="btn btn-sm-action-secondary"
                                                onClick={selectAllCouponBranches}
                                                disabled={creatingCoupon || !branchesData.length}
                                                style={{ padding: '4px 10px', fontSize: '0.76rem' }}
                                            >
                                                Select All
                                            </button>

                                            <button
                                                type="button"
                                                className="btn btn-sm-action-secondary"
                                                onClick={clearCouponBranches}
                                                disabled={creatingCoupon || !couponForm.branch_ids.length}
                                                style={{ padding: '4px 10px', fontSize: '0.76rem' }}
                                            >
                                                Clear
                                            </button>
                                        </div>
                                    </div>

                                    <div
                                        style={{
                                            border: '1px solid var(--border)',
                                            borderRadius: 10,
                                            maxHeight: 180,
                                            overflowY: 'auto',
                                            background: 'var(--bg-hover)'
                                        }}
                                    >
                                        {branchesData.length ? (
                                            branchesData.map((branch) => {
                                                const branchId = Number(branch.id)
                                                const isSelected = couponForm.branch_ids.includes(branchId)

                                                return (
                                                    <label
                                                        key={branch.id}
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'flex-start',
                                                            gap: 10,
                                                            padding: '10px 12px',
                                                            cursor: creatingCoupon ? 'not-allowed' : 'pointer',
                                                            borderBottom: '1px solid var(--border)',
                                                            background: isSelected ? 'rgba(233, 30, 99, 0.06)' : 'transparent'
                                                        }}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => toggleCouponBranchId(branch.id)}
                                                            disabled={creatingCoupon}
                                                            style={{ marginTop: 3, flexShrink: 0 }}
                                                        />

                                                        <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                            <strong style={{ fontSize: '0.88rem' }}>{branch.name}</strong>
                                                            {branch.address ? (
                                                                <small style={{ color: 'var(--text-muted)', fontSize: '0.76rem', lineHeight: 1.4 }}>
                                                                    {branch.address}
                                                                </small>
                                                            ) : null}
                                                        </span>
                                                    </label>
                                                )
                                            })
                                        ) : (
                                            <p style={{ padding: '14px 12px', margin: 0, color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                                                No branches available for this merchant.
                                            </p>
                                        )}
                                    </div>

                                    <small style={{ color: 'var(--text-muted)', fontSize: '0.74rem', marginTop: 6, display: 'block' }}>
                                        {couponForm.branch_ids.length} branch(es) selected
                                    </small>
                                </div>
                            </form>
                        </div>

                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={closeCreateCouponModal}
                                disabled={creatingCoupon}
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={handleCreateCoupon}
                                disabled={creatingCoupon}
                            >
                                {creatingCoupon ? (
                                    <><i className="fas fa-spinner fa-spin" style={{ marginRight: 6 }} />Creating...</>
                                ) : (
                                    <><i className="fas fa-check" style={{ marginRight: 6 }} />Create Coupon</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showEditCouponModal && (
                <div className="modal active">
                    <div className="modal-backdrop" />

                    <div className="modal-content" style={{ maxWidth: 640, width: '100%' }}>
                        <div className="modal-header">
                            <h3 className="modal-title">
                                <i className="fas fa-edit" style={{ marginRight: 8, color: 'var(--primary)' }} />
                                Edit Coupon
                            </h3>

                            <button
                                type="button"
                                className="modal-close"
                                onClick={closeEditCouponModal}
                                disabled={editingCoupon}
                            >
                                <i className="fas fa-times" />
                            </button>
                        </div>

                        <div className="modal-body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
                            <form
                                onSubmit={(e) => { e.preventDefault(); handleEditCoupon() }}
                                style={{ display: 'flex', flexDirection: 'column', gap: 18 }}
                            >
                                <div className="form-row" style={{ alignItems: 'flex-end' }}>
                                    <div className="form-group-classic" style={{ marginBottom: 0 }}>
                                        <label className="form-label-classic">Coupon Name</label>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <input
                                                type="text"
                                                name="code"
                                                className="form-control"
                                                placeholder="Enter or generate code"
                                                value={editCouponForm.code}
                                                onChange={handleEditCouponChange}
                                                disabled={editingCoupon}
                                                required
                                                autoComplete="off"
                                                style={{ flex: 1 }}
                                            />
                                            {/* <button
                                                type="button"
                                                className="btn btn-secondary"
                                                onClick={generateCouponCodeForEdit}
                                                disabled={editingCoupon || generatingEditCode}
                                                style={{ padding: '0 14px', height: 40, flexShrink: 0, margin: 0, whiteSpace: 'nowrap' }}
                                            >
                                                {generatingEditCode ? (
                                                    <i className="fas fa-spinner fa-spin" />
                                                ) : (
                                                    <i className="fas fa-magic" />
                                                )}
                                            </button> */}
                                        </div>
                                    </div>

                                    <div className="form-group-classic" style={{ marginBottom: 0 }}>
                                        <label className="form-label-classic">Coupon Type</label>
                                        <select
                                            name="type"
                                            className="form-select"
                                            value={editCouponForm.type}
                                            onChange={handleEditCouponChange}
                                            disabled={editingCoupon}
                                            required
                                        >
                                            <option value={1}>Discount (%)</option>
                                            <option value={2}>Fixed Amount</option>
                                            <option value={3}>Buy X Get Y</option>
                                        </select>
                                    </div>
                                </div>

                                {Number(editCouponForm.type) !== 3 ? (
                                    <>
                                        {Number(editCouponForm.type) === 2 && (
                                            <div className="form-group-classic" style={{ marginBottom: 12 }}>
                                                <label className="form-label-classic" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer', textTransform: 'none', fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={editMinAmountToggle}
                                                        onChange={(e) => {
                                                            const checked = e.target.checked
                                                            setEditMinAmountToggle(checked)
                                                            setEditCouponForm(prev => ({
                                                                ...prev,
                                                                min_amount: checked ? '' : '0'
                                                            }))
                                                        }}
                                                        disabled={editingCoupon}
                                                        style={{ width: 16, height: 16, accentColor: 'var(--primary)', cursor: 'pointer' }}
                                                    />
                                                    <span>Minimum Amount Required</span>
                                                </label>
                                            </div>
                                        )}

                                        <div className="form-row">
                                            <div className="form-group">
                                                <input
                                                    type="number"
                                                    name="percentage"
                                                    className="form-control"
                                                    placeholder=" "
                                                    value={editCouponForm.percentage}
                                                    onChange={handleEditCouponChange}
                                                    disabled={editingCoupon}
                                                    min="0"
                                                    max={Number(editCouponForm.type) === 1 ? "100" : undefined}
                                                    required
                                                />
                                                <label className="form-label">
                                                    {Number(editCouponForm.type) === 2 ? 'Fixed Amount' : 'Discount (%)'}
                                                </label>
                                            </div>

                                            {Number(editCouponForm.type) === 2 && editMinAmountToggle ? (
                                                <div className="form-group">
                                                    <input
                                                        type="number"
                                                        name="min_amount"
                                                        className="form-control"
                                                        placeholder=" "
                                                        value={editCouponForm.min_amount === '0' ? '' : editCouponForm.min_amount}
                                                        onChange={handleEditCouponChange}
                                                        disabled={editingCoupon}
                                                        min="1"
                                                        required
                                                    />
                                                    <label className="form-label">Minimum Amount</label>
                                                </div>
                                            ) : (
                                                <div />
                                            )}
                                        </div>

                                        <div className="form-row">
                                            {/* <div className="form-group">
                                                <input
                                                    type="number"
                                                    name="usage_limit"
                                                    className="form-control"
                                                    placeholder=" "
                                                    value={editCouponForm.usage_limit}
                                                    onChange={handleEditCouponChange}
                                                    disabled={editingCoupon}
                                                    min="0"
                                                    required
                                                />
                                                <label className="form-label">Usage Limit</label>
                                            </div> */}

                                            <div className="form-group-classic">
                                                <label className="form-label-classic">Coupon Category</label>
                                                <select
                                                    name="cat_id"
                                                    className="form-select"
                                                    value={editCouponForm.cat_id}
                                                    onChange={handleEditCouponChange}
                                                    disabled={editingCoupon}
                                                    required
                                                >
                                                    <option value="">Select category</option>
                                                    {couponCategories.map((category) => (
                                                        <option key={category.id} value={category.id}>
                                                            {category.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="form-row">
                                            <div className="form-group">
                                                <input
                                                    type="text"
                                                    name="buy_item"
                                                    className="form-control"
                                                    placeholder=" "
                                                    value={editCouponForm.buy_item}
                                                    onChange={handleEditCouponChange}
                                                    disabled={editingCoupon}
                                                    required
                                                />
                                                <label className="form-label">Buy Item / Service</label>
                                            </div>

                                            <div className="form-group">
                                                <input
                                                    type="text"
                                                    name="get_item"
                                                    className="form-control"
                                                    placeholder=" "
                                                    value={editCouponForm.get_item}
                                                    onChange={handleEditCouponChange}
                                                    disabled={editingCoupon}
                                                    required
                                                />
                                                <label className="form-label">Get Item / Service</label>
                                            </div>
                                        </div>

                                        {/* No minimum amount for Buy X Get Y */}
                                        {/* 
                                            <div className="form-group">
                                                <input
                                                    type="number"
                                                    name="usage_limit"
                                                    className="form-control"
                                                    placeholder=" "
                                                    value={editCouponForm.usage_limit}
                                                    onChange={handleEditCouponChange}
                                                    disabled={editingCoupon}
                                                    min="0"
                                                    required
                                                />
                                                <label className="form-label">Usage Limit</label>
                                            </div> */}

                                        <div className="form-group-classic">
                                            <label className="form-label-classic">Coupon Category</label>
                                            <select
                                                name="cat_id"
                                                className="form-select"
                                                value={editCouponForm.cat_id}
                                                onChange={handleEditCouponChange}
                                                disabled={editingCoupon}
                                                required
                                            >
                                                <option value="">Select category</option>
                                                {couponCategories.map((category) => (
                                                    <option key={category.id} value={category.id}>
                                                        {category.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </>
                                )}

                                <div className="form-row">
                                    <div className="form-group-classic">
                                        <label className="form-label-classic">Start Date</label>
                                        <input
                                            type="date"
                                            name="start_date"
                                            className="form-select"
                                            value={editCouponForm.start_date}
                                            onChange={handleEditCouponChange}
                                            disabled={editingCoupon}
                                            required
                                        />
                                    </div>

                                    <div className="form-group-classic">
                                        <label className="form-label-classic">End Date</label>
                                        <input
                                            type="date"
                                            name="end_date"
                                            className="form-select"
                                            value={editCouponForm.end_date}
                                            onChange={handleEditCouponChange}
                                            disabled={editingCoupon}
                                            required
                                        />
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)', marginBottom: 8 }}>
                                    <span style={{ fontSize: '0.94rem', fontWeight: 600, color: 'var(--text-primary)' }}>Coupon Status</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <span style={{ fontSize: '0.86rem', color: editCouponForm.status === 1 ? '#22c55e' : 'var(--text-muted)', fontWeight: 600 }}>
                                            {editCouponForm.status === 1 ? 'Active' : 'Inactive'}
                                        </span>
                                        <label className="switch">
                                            <input
                                                type="checkbox"
                                                checked={editCouponForm.status === 1}
                                                onChange={(e) => {
                                                    setEditCouponForm(prev => ({
                                                        ...prev,
                                                        status: e.target.checked ? 1 : 0
                                                    }))
                                                }}
                                                disabled={editingCoupon}
                                            />
                                            <span className="slider round"></span>
                                        </label>
                                    </div>
                                </div>

                                <div className="form-group-classic">
                                    <label className="form-label-classic">Term and Condtions</label>
                                    <textarea
                                        name="description"
                                        className="form-control"
                                        placeholder=" "
                                        value={editCouponForm.description}
                                        onChange={handleEditCouponChange}
                                        disabled={editingCoupon}
                                        rows="3"
                                        style={{
                                            resize: 'vertical',
                                            padding: '10px 14px',
                                            height: 'auto',
                                            borderRadius: 8,
                                            border: '1px solid var(--border)',
                                            background: 'var(--bg-surface)',
                                            color: 'var(--text-primary)'
                                        }}
                                    />
                                </div>

                                <div className="form-group-classic">
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            gap: 12,
                                            marginBottom: 8
                                        }}
                                    >
                                        <label className="form-label-classic" style={{ marginBottom: 0 }}>
                                            Branches
                                        </label>

                                        <div style={{ display: 'flex', gap: 10 }}>
                                            <button
                                                type="button"
                                                className="btn btn-sm-action-secondary"
                                                onClick={selectAllEditCouponBranches}
                                                disabled={editingCoupon || !branchesData.length}
                                                style={{ padding: '4px 10px', fontSize: '0.76rem' }}
                                            >
                                                Select All
                                            </button>

                                            <button
                                                type="button"
                                                className="btn btn-sm-action-secondary"
                                                onClick={clearEditCouponBranches}
                                                disabled={editingCoupon || !editCouponForm.branch_ids.length}
                                                style={{ padding: '4px 10px', fontSize: '0.76rem' }}
                                            >
                                                Clear
                                            </button>
                                        </div>
                                    </div>

                                    <div
                                        style={{
                                            border: '1px solid var(--border)',
                                            borderRadius: 10,
                                            maxHeight: 180,
                                            overflowY: 'auto',
                                            background: 'var(--bg-hover)'
                                        }}
                                    >
                                        {branchesData.length ? (
                                            branchesData.map((branch) => {
                                                const branchId = Number(branch.id)
                                                const isSelected = editCouponForm.branch_ids.includes(branchId)

                                                return (
                                                    <label
                                                        key={branch.id}
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'flex-start',
                                                            gap: 10,
                                                            padding: '10px 12px',
                                                            cursor: editingCoupon ? 'not-allowed' : 'pointer',
                                                            borderBottom: '1px solid var(--border)',
                                                            background: isSelected ? 'rgba(233, 30, 99, 0.06)' : 'transparent'
                                                        }}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => toggleEditCouponBranchId(branch.id)}
                                                            disabled={editingCoupon}
                                                            style={{ marginTop: 3, flexShrink: 0 }}
                                                        />

                                                        <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                            <strong style={{ fontSize: '0.88rem' }}>{branch.name}</strong>
                                                            {branch.address ? (
                                                                <small style={{ color: 'var(--text-muted)', fontSize: '0.76rem', lineHeight: 1.4 }}>
                                                                    {branch.address}
                                                                </small>
                                                            ) : null}
                                                        </span>
                                                    </label>
                                                )
                                            })
                                        ) : (
                                            <p style={{ padding: '14px 12px', margin: 0, color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                                                No branches available for this merchant.
                                            </p>
                                        )}
                                    </div>

                                    <small style={{ color: 'var(--text-muted)', fontSize: '0.74rem', marginTop: 6, display: 'block' }}>
                                        {editCouponForm.branch_ids.length} branch(es) selected
                                    </small>
                                </div>
                            </form>
                        </div>

                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={closeEditCouponModal}
                                disabled={editingCoupon}
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={handleEditCoupon}
                                disabled={editingCoupon}
                            >
                                {editingCoupon ? (
                                    <><i className="fas fa-spinner fa-spin" style={{ marginRight: 6 }} />Saving...</>
                                ) : (
                                    <><i className="fas fa-check" style={{ marginRight: 6 }} />Save Changes</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showBranchCouponsModal && selectedBranchForCoupons && (
                <div className="modal active">
                    <div className="modal-backdrop" />

                    <div className="modal-content" style={{ maxWidth: 800, width: '100%' }}>
                        <div className="modal-header">
                            <h3 className="modal-title">
                                <i className="fas fa-ticket-alt" style={{ marginRight: 8, color: 'var(--primary)' }} />
                                Coupons for {selectedBranchForCoupons.name}
                            </h3>

                            <button
                                type="button"
                                className="modal-close"
                                onClick={closeBranchCouponsModal}
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                            {(() => {
                                const branchCoupons = (merchantData?.coupon_list || []).filter(coupon => {
                                    const bIds = Array.isArray(coupon.branch_ids)
                                        ? coupon.branch_ids.map(Number)
                                        : [];
                                    return bIds.includes(Number(selectedBranchForCoupons.id));
                                });

                                if (branchCoupons.length === 0) {
                                    return (
                                        <p style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                                            No coupons assigned to this branch.
                                        </p>
                                    );
                                }

                                return (
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>Code</th>
                                                <th>Type / Deal</th>
                                                <th>Min Amount</th>
                                                {/* <th>Usage Limit</th> */}
                                                <th>Start Date</th>
                                                <th>End Date</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {branchCoupons.map((coupon) => (
                                                <tr key={coupon.id}>
                                                    <td style={{ fontWeight: 600 }}>{coupon.code}</td>
                                                    <td>
                                                        {Number(coupon.type) === 3
                                                            ? `Buy ${coupon.buy_item || '-'} Get ${coupon.get_item || '-'}`
                                                            : Number(coupon.type) === 2
                                                                ? `${coupon.percentage} (Fixed)`
                                                                : `${coupon.percentage}%`
                                                        }
                                                    </td>
                                                    <td>{coupon.min_amount}</td>
                                                    {/* <td>{coupon.usage_limit}</td> */}
                                                    <td>{formatDisplayDate(coupon.start_date)}</td>
                                                    <td>{formatDisplayDate(coupon.end_date)}</td>
                                                    <td>
                                                        <span className={`badge ${coupon.status === 1 ? 'active' : 'pending'}`}>
                                                            {coupon.status === 1 ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                );
                            })()}
                        </div>

                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={closeBranchCouponsModal}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showViewCouponModal && selectedCouponForView && (
                <div className="modal active">
                    <div className="modal-backdrop" />

                    <div className="modal-content" style={{ maxWidth: 600, width: '100%' }}>
                        <div className="modal-header">
                            <h3 className="modal-title">
                                <i className="fas fa-eye" style={{ marginRight: 8, color: 'var(--primary)' }} />
                                Coupon Details - {selectedCouponForView.code}
                            </h3>

                            <button
                                type="button"
                                className="modal-close"
                                onClick={closeViewCouponModal}
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                            <div className="detail-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                                <div>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', fontWeight: 600, textTransform: 'uppercase' }}>Coupon Name</span>
                                    <strong style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>{selectedCouponForView.code}</strong>
                                </div>
                                <div>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', fontWeight: 600, textTransform: 'uppercase' }}>Status</span>
                                    <span className={`badge ${selectedCouponForView.status === 1 ? 'active' : 'pending'}`} style={{ display: 'inline-block', marginTop: '4px' }}>
                                        {selectedCouponForView.status === 1 ? 'Active' : 'Inactive'}
                                    </span>
                                </div>

                                <div>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', fontWeight: 600, textTransform: 'uppercase' }}>Coupon Type</span>
                                    <span style={{ color: 'var(--text-primary)' }}>
                                        {Number(selectedCouponForView.type) === 1 && 'Discount (%)'}
                                        {Number(selectedCouponForView.type) === 2 && 'Fixed Amount'}
                                        {Number(selectedCouponForView.type) === 3 && 'Buy X Get Y'}
                                    </span>
                                </div>
                                <div>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', fontWeight: 600, textTransform: 'uppercase' }}>Deal Value</span>
                                    <strong style={{ color: 'var(--text-primary)' }}>
                                        {Number(selectedCouponForView.type) === 3
                                            ? `Buy ${selectedCouponForView.buy_item || '-'} Get ${selectedCouponForView.get_item || '-'}`
                                            : Number(selectedCouponForView.type) === 2
                                                ? `${selectedCouponForView.percentage} (Fixed)`
                                                : `${selectedCouponForView.percentage}%`
                                        }
                                    </strong>
                                </div>

                                <div>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', fontWeight: 600, textTransform: 'uppercase' }}>Minimum Spend</span>
                                    <span style={{ color: 'var(--text-primary)' }}>{selectedCouponForView.min_amount}</span>
                                </div>
                                {/* <div>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', fontWeight: 600, textTransform: 'uppercase' }}>Usage Limit</span>
                                    <span style={{ color: 'var(--text-primary)' }}>{selectedCouponForView.usage_limit}</span>
                                </div> */}

                                <div>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', fontWeight: 600, textTransform: 'uppercase' }}>Start Date</span>
                                    <span style={{ color: 'var(--text-primary)' }}>{formatDisplayDate(selectedCouponForView.start_date)}</span>
                                </div>
                                <div>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', fontWeight: 600, textTransform: 'uppercase' }}>End Date</span>
                                    <span style={{ color: 'var(--text-primary)' }}>{formatDisplayDate(selectedCouponForView.end_date)}</span>
                                </div>
                            </div>

                            <div style={{ marginBottom: '20px', padding: '12px', background: 'var(--bg-hover)', borderRadius: '8px', borderLeft: '4px solid var(--primary)' }}>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Term and Condtions </span>
                                <p style={{ margin: 0, color: 'var(--text-primary)', whiteSpace: 'pre-wrap', fontSize: '0.9rem', lineHeight: '1.4' }}>
                                    {selectedCouponForView.description || 'No description provided.'}
                                </p>
                            </div>

                            <div>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>Assigned Branches</span>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {(() => {
                                        const bIds = Array.isArray(selectedCouponForView.branch_ids)
                                            ? selectedCouponForView.branch_ids.map(Number)
                                            : [];
                                        const assigned = branchesData.filter(b => bIds.includes(Number(b.id)));

                                        if (assigned.length === 0) {
                                            return <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No branches assigned.</span>;
                                        }

                                        return assigned.map(b => (
                                            <span
                                                key={b.id}
                                                style={{
                                                    padding: '4px 10px',
                                                    background: 'rgba(142,45,226,0.08)',
                                                    border: '1px solid rgba(142,45,226,0.2)',
                                                    borderRadius: '16px',
                                                    color: 'var(--primary)',
                                                    fontSize: '0.8rem',
                                                    fontWeight: 500
                                                }}
                                            >
                                                <i className="fas fa-store" style={{ marginRight: '4px' }}></i>
                                                {b.name}
                                            </span>
                                        ));
                                    })()}
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={closeViewCouponModal}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {addModal && (
                <div className="modal active">
                    <div className="modal-backdrop" />

                    <div className="modal-content" style={{ maxWidth: 720, width: '100%' }}>
                        <div className="modal-header">
                            <h3 className="modal-title">
                                <i className="fas fa-store" style={{ marginRight: 8, color: 'var(--primary)' }} />
                                Add Branch
                            </h3>

                            <button
                                type="button"
                                className="modal-close"
                                onClick={closeAddBranchModal}
                                disabled={addingBranch}
                            >
                                <i className="fas fa-times" />
                            </button>
                        </div>

                        <div className="modal-body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
                            <form
                                onSubmit={(e) => { e.preventDefault(); handleAddBranch() }}
                                style={{ display: 'flex', flexDirection: 'column', gap: 18 }}
                            >
                                <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border)', paddingBottom: 6 }}>
                                    Basic Information
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <input
                                            type="text"
                                            name="name"
                                            className="form-control"
                                            placeholder=" "
                                            value={addBranchForm.name}
                                            onChange={handleAddBranchChange}
                                            disabled={addingBranch}
                                            required
                                            autoComplete="off"
                                        />
                                        <label className="form-label">Branch Name <span style={{ color: '#ef4444' }}>*</span></label>
                                    </div>

                                    <div className="form-group">
                                        <input
                                            type="email"
                                            name="email"
                                            className="form-control"
                                            placeholder=" "
                                            value={addBranchForm.email}
                                            onChange={handleAddBranchChange}
                                            disabled={addingBranch}
                                            autoComplete="off"
                                        />
                                        <label className="form-label">Email</label>
                                    </div>
                                </div>

                                <div className="form-row" style={{ alignItems: 'flex-end' }}>
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <input
                                            type="text"
                                            name="passlock"
                                            className="form-control"
                                            placeholder=" "
                                            value={addBranchForm.passlock || ''}
                                            onChange={handleAddBranchChange}
                                            disabled={addingBranch}
                                            required
                                            autoComplete="off"
                                        />
                                        <label className="form-label">Passcode <span style={{ color: '#ef4444' }}>*</span></label>
                                    </div>
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={generateBranchPasslock}
                                        disabled={generatingPasslock || addingBranch}
                                        style={{ height: '42px', padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, borderRadius: '8px', fontSize: '0.875rem' }}
                                    >
                                        {generatingPasslock ? (
                                            <i className="fas fa-spinner fa-spin" />
                                        ) : (
                                            'Generate'
                                        )}
                                    </button>
                                </div>

                                <PhoneNumberField
                                    value={addBranchForm.phone}
                                    countryCode={addBranchForm.country_code}
                                    onChange={(phoneVal, codeVal) =>
                                        setAddBranchForm((prev) => ({
                                            ...prev,
                                            phone: phoneVal || '',
                                            country_code: codeVal || ''
                                        }))
                                    }
                                    // required={true}
                                />

                                <div className="form-group-classic" style={{ width: '100%' }}>
                                    <label className="form-label-classic">Receptionist</label>
                                    <select
                                        name="receptionist_id"
                                        className="form-select"
                                        value={addBranchForm.receptionist_id}
                                        onChange={handleAddBranchChange}
                                        disabled={addingBranch || loadingReceptionists}
                                    >
                                        <option value="">
                                            {loadingReceptionists
                                                ? 'Loading receptionists...'
                                                : 'Select receptionist (None)'}
                                        </option>

                                        {availableReceptionists.map((receptionist) => {
                                            const assignedBranch = branchesData.find(branch =>
                                                branch.Receptionists?.some(r => r.id === receptionist.id)
                                            );
                                            const isAssigned = !!assignedBranch;

                                            return (
                                                <option
                                                    key={receptionist.id}
                                                    value={receptionist.id}
                                                    disabled={isAssigned}
                                                    style={{
                                                        color: isAssigned ? '#999' : '#000'
                                                    }}
                                                >
                                                    {receptionist.name || 'Unnamed'} {receptionist.email ? `(${receptionist.email})` : (receptionist.ref_name ? `(${receptionist.ref_name})` : '')}
                                                    {isAssigned ? ` (Assigned to ${assignedBranch.name})` : ''}
                                                </option>
                                            );
                                        })}
                                    </select>
                                    <small style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>
                                        Assign an available receptionist to this branch. Select "Select receptionist (None)" to leave empty.
                                    </small>
                                </div>

                                <div className="form-row">
                                    <div className="form-group-classic" style={{ flex: 1 }}>
                                        <label className="form-label-classic">Visibility</label>
                                        <select
                                            name="visibility"
                                            className="form-select"
                                            value={addBranchForm.visibility !== undefined ? Number(addBranchForm.visibility) : 0}
                                            onChange={handleAddBranchChange}
                                            disabled={addingBranch}
                                        >
                                            <option value={0}>All</option>
                                            <option value={1}>Male</option>
                                            <option value={2}>Female</option>
                                            <option value={3}>Others</option>
                                        </select>
                                    </div>

                                    <div className="form-group-classic" style={{ flex: 1 }}>
                                        <label className="form-label-classic">Age Group</label>
                                        <select
                                            name="age_group"
                                            className="form-select"
                                            value={addBranchForm.age_group || 'All Age'}
                                            onChange={handleAddBranchChange}
                                            disabled={addingBranch}
                                        >
                                            <option value="1">All Age</option>
                                            <option value="2">Below 18</option>
                                            <option value="3">Above 18</option>
                                        </select>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                                        Branch Profile Image <span style={{ color: '#ef4444' }}>*</span>
                                    </span>
                                    <div
                                        style={{
                                            width: 80,
                                            height: 80,
                                            borderRadius: '50%',
                                            border: '2px solid var(--primary)',
                                            overflow: 'hidden',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            background: 'var(--bg-hover)',
                                            fontSize: '2rem',
                                            color: 'var(--primary)',
                                            flexShrink: 0
                                        }}
                                    >
                                        {addBranchForm.profileImagePreview ? (
                                            <img
                                                src={addBranchForm.profileImagePreview}
                                                alt="Branch Profile"
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            />
                                        ) : (
                                            <i className="fas fa-store" />
                                        )}
                                    </div>

                                    <label
                                        className="btn btn-sm-action-secondary"
                                        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, margin: 0, padding: '6px 14px', fontSize: '0.8rem', borderRadius: 6 }}
                                    >
                                        <i className="fas fa-camera" />
                                        {addBranchForm.profile_image ? 'Change Photo' : 'Upload Profile Photo'}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleAddBranchProfileImageChange}
                                            hidden
                                        />
                                    </label>

                                    <small style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>
                                        Upload a branch profile photo. JPG, PNG supported.
                                    </small>
                                </div>

                                <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border)', paddingBottom: 6 }}>
                                    Location
                                </div>

                                {branchMapLoadError && (
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                        Failed to load Google Maps. Please check the Maps API key.
                                    </p>
                                )}

                                {!branchMapLoadError && !isBranchMapLoaded && (
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                        Loading map...
                                    </p>
                                )}

                                {isBranchMapLoaded && (
                                    <CorporateAddressField
                                        form={addBranchForm}
                                        onInputChange={handleAddBranchChange}
                                        onAutocompleteLoad={(auto) => setAddBranchAutocomplete(auto)}
                                        onPlaceChanged={handleAddBranchPlaceChanged}
                                        onMapClick={(event) => {
                                            if (event.latLng) {
                                                updateAddBranchLocationDetails(event.latLng.lat(), event.latLng.lng())
                                            }
                                        }}
                                        onMarkerDragEnd={handleAddBranchMarkerDragEnd}
                                        center={addBranchMapCenter}
                                        mapContainerStyle={mapContainerStyle}
                                        isBranch={true}
                                    />
                                )}

                                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                    <textarea
                                        name="description"
                                        className="form-control"
                                        placeholder=" "
                                        value={addBranchForm.description}
                                        onChange={handleAddBranchChange}
                                        disabled={addingBranch}
                                        rows={3}
                                        style={{ resize: 'vertical', minHeight: 80 }}
                                    />
                                    <label className="form-label">Description</label>
                                </div>

                                <div style={{ border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px', marginTop: '16px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: 8 }}>
                                        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                            <i className="far fa-clock" style={{ marginRight: '6px', color: 'var(--primary)' }}></i>
                                            Working Days & Hours
                                        </h4>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button
                                                type="button"
                                                className="btn btn-secondary btn-sm"
                                                onClick={() => applyPreset(false, 'weekdays')}
                                                style={{ fontSize: '0.75rem', height: '32px', padding: '0 12px' }}
                                            >
                                                <i className="far fa-calendar-minus" style={{ marginRight: '4px' }}></i> Weekdays Only
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-secondary btn-sm"
                                                onClick={() => applyPreset(false, 'alldays')}
                                                style={{ fontSize: '0.75rem', height: '32px', padding: '0 12px' }}
                                            >
                                                <i className="far fa-calendar-alt" style={{ marginRight: '4px' }}></i> All Days
                                            </button>
                                        </div>
                                    </div>

                                    <div style={{ background: 'rgba(142,45,226,0.03)', border: '1px solid rgba(142,45,226,0.12)', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 600, marginBottom: '8px' }}>
                                            <i className="fas fa-magic"></i>
                                            <span>Quick Setup: Apply Same Time to Multiple Days</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                                            <div style={{ flex: 1, minWidth: '120px' }}>
                                                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Opening Time</label>
                                                <input
                                                    type="time"
                                                    className="form-control"
                                                    value={quickOpenAdd}
                                                    onChange={(e) => setQuickOpenAdd(e.target.value)}
                                                    style={{ height: '36px', fontSize: '0.85rem' }}
                                                />
                                            </div>
                                            <div style={{ flex: 1, minWidth: '120px' }}>
                                                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Closing Time</label>
                                                <input
                                                    type="time"
                                                    className="form-control"
                                                    value={quickCloseAdd}
                                                    onChange={(e) => setQuickCloseAdd(e.target.value)}
                                                    style={{ height: '36px', fontSize: '0.85rem' }}
                                                />
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button
                                                    type="button"
                                                    className="btn btn-primary"
                                                    onClick={() => applyQuickSetup(false)}
                                                    style={{ height: '36px', fontSize: '0.78rem', padding: '0 12px' }}
                                                >
                                                    Apply
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn btn-secondary"
                                                    onClick={() => clearAllTimes(false)}
                                                    style={{ height: '36px', fontSize: '0.78rem', padding: '0 12px' }}
                                                >
                                                    Clear All
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ overflowX: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                            <thead>
                                                <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                                                    <th style={{ padding: '8px 4px', width: '32px' }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedDaysAdd.length === 7}
                                                            onChange={handleAddTimingAllToggle}
                                                            style={{ cursor: 'pointer' }}
                                                        />
                                                    </th>
                                                    <th style={{ padding: '8px 8px' }}>Day</th>
                                                    <th style={{ padding: '8px 8px' }}>Opening Time</th>
                                                    <th style={{ padding: '8px 8px' }}>Closing Time</th>
                                                    <th style={{ padding: '8px 8px', textAlign: 'center', width: '80px' }}>Closed</th>
                                                    {/* <th style={{ padding: '8px 4px', textAlign: 'center', width: '60px' }}>Actions</th> */}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(addBranchForm.timings || []).map((item) => {
                                                    const isSelected = selectedDaysAdd.includes(item.day);
                                                    return (
                                                        <tr key={item.day} style={{ borderBottom: '1px solid var(--bg-hover)', background: isSelected ? 'rgba(142,45,226,0.01)' : 'transparent' }}>
                                                            <td style={{ padding: '8px 4px' }}>
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isSelected}
                                                                    onChange={() => handleAddTimingDayToggle(item.day)}
                                                                    style={{ cursor: 'pointer' }}
                                                                />
                                                            </td>
                                                            <td style={{ padding: '8px 8px', fontWeight: 600 }}>
                                                                <div>{dayNamesMap[item.day].full}</div>
                                                                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{dayNamesMap[item.day].short}</span>
                                                            </td>
                                                            <td style={{ padding: '8px 8px' }}>
                                                                <input
                                                                    type="time"
                                                                    className="form-control"
                                                                    value={item.open_time || ''}
                                                                    onChange={(e) => updateTimingField(false, item.day, 'open_time', e.target.value)}
                                                                    disabled={item.is_closed || addingBranch}
                                                                    style={{ height: '32px', fontSize: '0.8rem', padding: '0 8px', background: item.is_closed ? 'rgba(235,54,54,0.03)' : 'transparent' }}
                                                                />
                                                            </td>
                                                            <td style={{ padding: '8px 8px' }}>
                                                                <input
                                                                    type="time"
                                                                    className="form-control"
                                                                    value={item.close_time || ''}
                                                                    onChange={(e) => updateTimingField(false, item.day, 'close_time', e.target.value)}
                                                                    disabled={item.is_closed || addingBranch}
                                                                    style={{ height: '32px', fontSize: '0.8rem', padding: '0 8px', background: item.is_closed ? 'rgba(235,54,54,0.03)' : 'transparent' }}
                                                                />
                                                            </td>
                                                            <td style={{ padding: '8px 8px', textAlign: 'center' }}>
                                                                <input
                                                                    type="checkbox"
                                                                    checked={item.is_closed}
                                                                    onChange={(e) => updateTimingField(false, item.day, 'is_closed', e.target.checked)}
                                                                    style={{ cursor: 'pointer' }}
                                                                />
                                                            </td>
                                                            {/* <td style={{ padding: '8px 4px', textAlign: 'center' }}>
                                                                <button
                                                                    type="button"
                                                                    className="btn-icon"
                                                                    title="Copy to all selected days"
                                                                    onClick={() => copyTimeToAllSelected(false, item.day)}
                                                                    disabled={item.is_closed}
                                                                    style={{ width: '28px', height: '28px', fontSize: '0.8rem' }}
                                                                >
                                                                    <i className="far fa-copy"></i>
                                                                </button>
                                                            </td> */}
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border)', paddingBottom: 6 }}>
                                    Gallery Images
                                </div>

                                {addBranchGalleryFiles.length > 0 && (
                                    <div>
                                        <small style={{ color: 'var(--text-muted)', fontSize: '0.78rem', display: 'block', marginBottom: 8 }}>
                                            Images to upload ({addBranchGalleryFiles.length})
                                        </small>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                                            {addBranchGalleryFiles.map((entry) => (
                                                <div
                                                    key={entry.id}
                                                    style={{
                                                        position: 'relative',
                                                        width: 80,
                                                        height: 80,
                                                        borderRadius: 8,
                                                        overflow: 'hidden',
                                                        border: '2px solid var(--primary)',
                                                        flexShrink: 0
                                                    }}
                                                >
                                                    <img
                                                        src={entry.preview}
                                                        alt="Gallery"
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeAddBranchGalleryFile(entry.id)}
                                                        disabled={addingBranch}
                                                        style={{
                                                            position: 'absolute',
                                                            top: 3,
                                                            right: 3,
                                                            width: 20,
                                                            height: 20,
                                                            borderRadius: '50%',
                                                            background: 'rgba(220,38,38,0.9)',
                                                            border: 'none',
                                                            color: '#fff',
                                                            fontSize: 10,
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            lineHeight: 1
                                                        }}
                                                    >
                                                        <i className="fas fa-times" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <label
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        padding: '10px 16px',
                                        border: '2px dashed var(--primary)',
                                        borderRadius: 10,
                                        cursor: addingBranch ? 'not-allowed' : 'pointer',
                                        color: 'var(--primary)',
                                        fontSize: '0.85rem',
                                        fontWeight: 600,
                                        opacity: addingBranch ? 0.6 : 1,
                                        transition: 'background 0.2s',
                                        background: 'var(--bg-hover)'
                                    }}
                                >
                                    <i className="fas fa-images" />
                                    Add Gallery Images
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={handleAddBranchGalleryFilesAdd}
                                        disabled={addingBranch}
                                        hidden
                                    />
                                </label>

                                <small style={{ color: 'var(--text-muted)', fontSize: '0.74rem', marginTop: -10 }}>
                                    You can upload multiple gallery images. JPG, PNG supported.
                                </small>

                                <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border)', paddingBottom: 6, marginTop: 16 }}>
                                    Menu Images
                                </div>

                                {addBranchMenuFiles.length > 0 && (
                                    <div>
                                        <small style={{ color: 'var(--text-muted)', fontSize: '0.78rem', display: 'block', marginBottom: 8 }}>
                                            Menu images to upload ({addBranchMenuFiles.length})
                                        </small>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                                            {addBranchMenuFiles.map((entry) => (
                                                <div
                                                    key={entry.id}
                                                    style={{
                                                        position: 'relative',
                                                        width: 80,
                                                        height: 80,
                                                        borderRadius: 8,
                                                        overflow: 'hidden',
                                                        border: '2px solid var(--primary)',
                                                        flexShrink: 0
                                                    }}
                                                >
                                                    <img
                                                        src={entry.preview}
                                                        alt="Menu"
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeAddBranchMenuFile(entry.id)}
                                                        disabled={addingBranch}
                                                        style={{
                                                            position: 'absolute',
                                                            top: 3,
                                                            right: 3,
                                                            width: 20,
                                                            height: 20,
                                                            borderRadius: '50%',
                                                            background: 'rgba(220,38,38,0.9)',
                                                            border: 'none',
                                                            color: '#fff',
                                                            fontSize: 10,
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            lineHeight: 1
                                                        }}
                                                    >
                                                        <i className="fas fa-times" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <label
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        padding: '10px 16px',
                                        border: '2px dashed var(--primary)',
                                        borderRadius: 10,
                                        cursor: addingBranch ? 'not-allowed' : 'pointer',
                                        color: 'var(--primary)',
                                        fontSize: '0.85rem',
                                        fontWeight: 600,
                                        opacity: addingBranch ? 0.6 : 1,
                                        transition: 'background 0.2s',
                                        background: 'var(--bg-hover)'
                                    }}
                                >
                                    <i className="fas fa-utensils" />
                                    Add Menu Images
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={handleAddBranchMenuFilesAdd}
                                        disabled={addingBranch}
                                        hidden
                                    />
                                </label>

                                <small style={{ color: 'var(--text-muted)', fontSize: '0.74rem', marginTop: -10 }}>
                                    Upload menu images for this branch. JPG, PNG supported.
                                </small>
                            </form>
                        </div>

                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={closeAddBranchModal}
                                disabled={addingBranch}
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={handleAddBranch}
                                disabled={addingBranch}
                            >
                                {addingBranch ? (
                                    <><i className="fas fa-spinner fa-spin" style={{ marginRight: 6 }} />Registering...</>
                                ) : (
                                    <><i className="fas fa-plus" style={{ marginRight: 6 }} />Register Branch</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {editBranchModal && (
                <div className="modal active">
                    <div className="modal-backdrop" />

                    <div className="modal-content" style={{ maxWidth: 720, width: '100%' }}>
                        <div className="modal-header">
                            <h3 className="modal-title">
                                <i className="fas fa-store" style={{ marginRight: 8, color: 'var(--primary)' }} />
                                Edit Branch
                            </h3>

                            <button
                                type="button"
                                className="modal-close"
                                onClick={closeEditBranchModal}
                                disabled={savingBranch}
                            >
                                <i className="fas fa-times" />
                            </button>
                        </div>

                        <div className="modal-body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
                            {editBranchLoading ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 0', gap: 14 }}>
                                    <div className="spinner" />
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Loading branch details...</p>
                                </div>
                            ) : (
                                <form
                                    onSubmit={(e) => { e.preventDefault(); handleSaveBranch() }}
                                    style={{ display: 'flex', flexDirection: 'column', gap: 18 }}
                                >
                                    {/* Profile Image */}
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                                            Branch Profile Image <span style={{ color: '#ef4444' }}>*</span>
                                        </span>
                                        <div
                                            style={{
                                                width: 80, height: 80,
                                                borderRadius: '50%',
                                                border: '2px solid var(--primary)',
                                                overflow: 'hidden',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                background: 'var(--bg-hover)',
                                                fontSize: '2rem',
                                                color: 'var(--primary)',
                                                flexShrink: 0
                                            }}
                                        >
                                            {editBranchForm.profileImagePreview ? (
                                                <img
                                                    src={editBranchForm.profileImagePreview}
                                                    alt="Branch"
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                />
                                            ) : (
                                                <i className="fas fa-store" />
                                            )}
                                        </div>

                                        <label
                                            className="btn btn-sm-action-secondary"
                                            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, margin: 0, padding: '6px 14px', fontSize: '0.8rem', borderRadius: 6 }}
                                        >
                                            <i className="fas fa-camera" />
                                            {editBranchForm.profile_image ? 'Change Photo' : 'Upload Profile Photo'}
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleBranchProfileImageChange}
                                                hidden
                                            />
                                        </label>

                                        <small style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>
                                            JPG, PNG — leave empty to keep current photo
                                        </small>
                                    </div>

                                    {/* Section: Basic Info */}
                                    <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border)', paddingBottom: 6 }}>
                                        Basic Information
                                    </div>

                                    <div className="form-row">
                                        <div className="form-group">
                                            <input
                                                type="text"
                                                name="name"
                                                className="form-control"
                                                placeholder=" "
                                                value={editBranchForm.name}
                                                onChange={handleEditBranchChange}
                                                disabled={savingBranch}
                                                required
                                            />
                                            <label className="form-label">Branch Name <span style={{ color: '#ef4444' }}>*</span></label>
                                        </div>

                                        <div className="form-group">
                                            <input
                                                type="email"
                                                name="email"
                                                className="form-control"
                                                placeholder=" "
                                                value={editBranchForm.email}
                                                onChange={handleEditBranchChange}
                                                disabled={savingBranch}
                                            />
                                            <label className="form-label">Email</label>
                                        </div>
                                    </div>

                                    <PhoneNumberField
                                        value={editBranchForm.phone}
                                        countryCode={editBranchForm.country_code}
                                        onChange={(phoneVal, codeVal) =>
                                            setEditBranchForm((prev) => ({
                                                ...prev,
                                                phone: phoneVal || '',
                                                country_code: codeVal || ''
                                            }))
                                        }
                                    // required={true}
                                    />

                                    <div className="form-group-classic" style={{ width: '100%' }}>
                                        <label className="form-label-classic">Receptionist</label>
                                        <select
                                            name="receptionist_id"
                                            className="form-select"
                                            value={editBranchForm.receptionist_id}
                                            onChange={handleEditBranchChange}
                                            disabled={savingBranch || loadingReceptionists}
                                        >
                                            <option value="">
                                                {loadingReceptionists
                                                    ? 'Loading receptionists...'
                                                    : 'Select receptionist (None)'}
                                            </option>

                                            {availableReceptionists.map((receptionist) => {
                                                const assignedBranch = branchesData.find(branch =>
                                                    branch.Receptionists?.some(r => r.id === receptionist.id)
                                                );
                                                const isAssigned = !!assignedBranch;
                                                const isCurrentBranch = isAssigned && Number(assignedBranch.id) === Number(editBranchId);

                                                return (
                                                    <option
                                                        key={receptionist.id}
                                                        value={receptionist.id}
                                                        disabled={isAssigned && !isCurrentBranch}
                                                        style={{
                                                            color: isCurrentBranch ? 'var(--primary)' : (isAssigned ? '#999' : '#000')
                                                        }}
                                                    >
                                                        {receptionist.name || 'Unnamed'} {receptionist.email ? `(${receptionist.email})` : (receptionist.ref_name ? `(${receptionist.ref_name})` : '')}
                                                        {isCurrentBranch ? ' (Current)' : (isAssigned ? ` (Assigned to ${assignedBranch.name})` : '')}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                        <small style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>
                                            Assign an available receptionist to this branch. Select "Select receptionist (None)" to unassign.
                                        </small>
                                    </div>

                                    <div className="form-row">
                                        <div className="form-group-classic" style={{ flex: 1 }}>
                                            <label className="form-label-classic">Visibility</label>
                                            <select
                                                name="visibility"
                                                className="form-select"
                                                value={editBranchForm.visibility !== undefined ? Number(editBranchForm.visibility) : 0}
                                                onChange={handleEditBranchChange}
                                                disabled={savingBranch}
                                            >
                                                <option value={0}>All</option>
                                                <option value={1}>Male</option>
                                                <option value={2}>Female</option>
                                                <option value={3}>Others</option>
                                            </select>
                                        </div>

                                        <div className="form-group-classic" style={{ flex: 1 }}>
                                            <label className="form-label-classic">Age Group</label>
                                            <select
                                                name="age_group"
                                                className="form-select"
                                                value={editBranchForm.age_group || 'All Age'}
                                                onChange={handleEditBranchChange}
                                                disabled={savingBranch}
                                            >
                                                <option value="1">All Age</option>
                                                <option value="2">Below 18</option>
                                                <option value="3">Above 18</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border)', paddingBottom: 6 }}>
                                        Location
                                    </div>

                                    {branchMapLoadError && (
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                            Failed to load Google Maps. Please check the Maps API key.
                                        </p>
                                    )}

                                    {!branchMapLoadError && !isBranchMapLoaded && (
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                            Loading map...
                                        </p>
                                    )}

                                    {isBranchMapLoaded && (
                                        <CorporateAddressField
                                            form={editBranchForm}
                                            onInputChange={handleEditBranchChange}
                                            onAutocompleteLoad={(auto) => setBranchAutocomplete(auto)}
                                            onPlaceChanged={handleBranchPlaceChanged}
                                            onMapClick={(event) => {
                                                if (event.latLng) {
                                                    updateBranchLocationDetails(event.latLng.lat(), event.latLng.lng())
                                                }
                                            }}
                                            onMarkerDragEnd={handleBranchMarkerDragEnd}
                                            center={branchMapCenter}
                                            mapContainerStyle={mapContainerStyle}
                                            isBranch={true}
                                        />
                                    )}

                                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                        <textarea
                                            name="description"
                                            className="form-control"
                                            placeholder=" "
                                            value={editBranchForm.description}
                                            onChange={handleEditBranchChange}
                                            disabled={savingBranch}
                                            rows={3}
                                            style={{ resize: 'vertical', minHeight: 80 }}
                                        />
                                        <label className="form-label">Description</label>
                                    </div>

                                    {/* Section: Hours */}
                                    <div style={{ border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px', marginTop: '16px', gridColumn: '1 / -1' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: 8 }}>
                                            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                                <i className="far fa-clock" style={{ marginRight: '6px', color: 'var(--primary)' }}></i>
                                                Working Days & Hours
                                            </h4>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button
                                                    type="button"
                                                    className="btn btn-secondary btn-sm"
                                                    onClick={() => applyPreset(true, 'weekdays')}
                                                    style={{ fontSize: '0.75rem', height: '32px', padding: '0 12px' }}
                                                >
                                                    <i className="far fa-calendar-minus" style={{ marginRight: '4px' }}></i> Weekdays Only
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn btn-secondary btn-sm"
                                                    onClick={() => applyPreset(true, 'alldays')}
                                                    style={{ fontSize: '0.75rem', height: '32px', padding: '0 12px' }}
                                                >
                                                    <i className="far fa-calendar-alt" style={{ marginRight: '4px' }}></i> All Days
                                                </button>
                                            </div>
                                        </div>

                                        <div style={{ background: 'rgba(142,45,226,0.03)', border: '1px solid rgba(142,45,226,0.12)', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 600, marginBottom: '8px' }}>
                                                <i className="fas fa-magic"></i>
                                                <span>Quick Setup: Apply Same Time to Multiple Days</span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                                                <div style={{ flex: 1, minWidth: '120px' }}>
                                                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Opening Time</label>
                                                    <input
                                                        type="time"
                                                        className="form-control"
                                                        value={quickOpenEdit}
                                                        onChange={(e) => setQuickOpenEdit(e.target.value)}
                                                        style={{ height: '36px', fontSize: '0.85rem' }}
                                                    />
                                                </div>
                                                <div style={{ flex: 1, minWidth: '120px' }}>
                                                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Closing Time</label>
                                                    <input
                                                        type="time"
                                                        className="form-control"
                                                        value={quickCloseEdit}
                                                        onChange={(e) => setQuickCloseEdit(e.target.value)}
                                                        style={{ height: '36px', fontSize: '0.85rem' }}
                                                    />
                                                </div>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button
                                                        type="button"
                                                        className="btn btn-primary"
                                                        onClick={() => applyQuickSetup(true)}
                                                        style={{ height: '36px', fontSize: '0.78rem', padding: '0 12px' }}
                                                    >
                                                        Apply
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn btn-secondary"
                                                        onClick={() => clearAllTimes(true)}
                                                        style={{ height: '36px', fontSize: '0.78rem', padding: '0 12px' }}
                                                    >
                                                        Clear All
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ overflowX: 'auto' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                                <thead>
                                                    <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                                                        <th style={{ padding: '8px 4px', width: '32px' }}>
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedDaysEdit.length === 7}
                                                                onChange={handleEditTimingAllToggle}
                                                                style={{ cursor: 'pointer' }}
                                                            />
                                                        </th>
                                                        <th style={{ padding: '8px 8px' }}>Day</th>
                                                        <th style={{ padding: '8px 8px' }}>Opening Time</th>
                                                        <th style={{ padding: '8px 8px' }}>Closing Time</th>
                                                        <th style={{ padding: '8px 8px', textAlign: 'center', width: '80px' }}>Closed</th>
                                                        {/* <th style={{ padding: '8px 4px', textAlign: 'center', width: '60px' }}>Actions</th> */}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {(editBranchForm.timings || []).map((item) => {
                                                        const isSelected = selectedDaysEdit.includes(item.day);
                                                        return (
                                                            <tr key={item.day} style={{ borderBottom: '1px solid var(--bg-hover)', background: isSelected ? 'rgba(142,45,226,0.01)' : 'transparent' }}>
                                                                <td style={{ padding: '8px 4px' }}>
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={isSelected}
                                                                        onChange={() => handleEditTimingDayToggle(item.day)}
                                                                        style={{ cursor: 'pointer' }}
                                                                    />
                                                                </td>
                                                                <td style={{ padding: '8px 8px', fontWeight: 600 }}>
                                                                    <div>{dayNamesMap[item.day].full}</div>
                                                                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{dayNamesMap[item.day].short}</span>
                                                                </td>
                                                                <td style={{ padding: '8px 8px' }}>
                                                                    <input
                                                                        type="time"
                                                                        className="form-control"
                                                                        value={item.open_time || ''}
                                                                        onChange={(e) => updateTimingField(true, item.day, 'open_time', e.target.value)}
                                                                        disabled={item.is_closed || savingBranch}
                                                                        style={{ height: '32px', fontSize: '0.8rem', padding: '0 8px', background: item.is_closed ? 'rgba(235,54,54,0.03)' : 'transparent' }}
                                                                    />
                                                                </td>
                                                                <td style={{ padding: '8px 8px' }}>
                                                                    <input
                                                                        type="time"
                                                                        className="form-control"
                                                                        value={item.close_time || ''}
                                                                        onChange={(e) => updateTimingField(true, item.day, 'close_time', e.target.value)}
                                                                        disabled={item.is_closed || savingBranch}
                                                                        style={{ height: '32px', fontSize: '0.8rem', padding: '0 8px', background: item.is_closed ? 'rgba(235,54,54,0.03)' : 'transparent' }}
                                                                    />
                                                                </td>
                                                                <td style={{ padding: '8px 8px', textAlign: 'center' }}>
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={item.is_closed}
                                                                        onChange={(e) => updateTimingField(true, item.day, 'is_closed', e.target.checked)}
                                                                        style={{ cursor: 'pointer' }}
                                                                    />
                                                                </td>
                                                                {/* <td style={{ padding: '8px 4px', textAlign: 'center' }}>
                                                                    <button
                                                                        type="button"
                                                                        className="btn-icon"
                                                                        title="Copy to all selected days"
                                                                        onClick={() => copyTimeToAllSelected(true, item.day)}
                                                                        disabled={item.is_closed}
                                                                        style={{ width: '28px', height: '28px', fontSize: '0.8rem' }}
                                                                    >
                                                                        <i className="far fa-copy"></i>
                                                                    </button>
                                                                </td> */}
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Section: Gallery Images */}
                                    <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border)', paddingBottom: 6 }}>
                                        Gallery Images
                                    </div>

                                    {branchGalleryImages.length > 0 && (
                                        <div>
                                            <small style={{ color: 'var(--text-muted)', fontSize: '0.78rem', display: 'block', marginBottom: 8 }}>
                                                Existing gallery images ({branchGalleryImages.length})
                                            </small>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                                                {branchGalleryImages.map((entry) => (
                                                    <div
                                                        key={entry.id}
                                                        style={{
                                                            position: 'relative',
                                                            width: 80,
                                                            height: 80,
                                                            borderRadius: 8,
                                                            overflow: 'hidden',
                                                            border: '2px solid var(--border)',
                                                            flexShrink: 0
                                                        }}
                                                    >
                                                        <img
                                                            src={entry.image}
                                                            alt="Gallery"
                                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => removeExistingGalleryImage(entry.id)}
                                                            disabled={savingBranch}
                                                            style={{
                                                                position: 'absolute',
                                                                top: 3,
                                                                right: 3,
                                                                width: 20,
                                                                height: 20,
                                                                borderRadius: '50%',
                                                                background: 'rgba(220,38,38,0.9)',
                                                                border: 'none',
                                                                color: '#fff',
                                                                fontSize: 10,
                                                                cursor: 'pointer',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                lineHeight: 1
                                                            }}
                                                        >
                                                            <i className="fas fa-times" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* New images to upload */}
                                    {newGalleryFiles.length > 0 && (
                                        <div>
                                            <small style={{ color: 'var(--text-muted)', fontSize: '0.78rem', display: 'block', marginBottom: 8 }}>
                                                New images to upload ({newGalleryFiles.length})
                                            </small>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                                                {newGalleryFiles.map((entry) => (
                                                    <div
                                                        key={entry.id}
                                                        style={{
                                                            position: 'relative',
                                                            width: 80,
                                                            height: 80,
                                                            borderRadius: 8,
                                                            overflow: 'hidden',
                                                            border: '2px solid var(--primary)',
                                                            flexShrink: 0
                                                        }}
                                                    >
                                                        <img
                                                            src={entry.preview}
                                                            alt="New gallery"
                                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => removeNewGalleryFile(entry.id)}
                                                            disabled={savingBranch}
                                                            style={{
                                                                position: 'absolute',
                                                                top: 3,
                                                                right: 3,
                                                                width: 20,
                                                                height: 20,
                                                                borderRadius: '50%',
                                                                background: 'rgba(220,38,38,0.9)',
                                                                border: 'none',
                                                                color: '#fff',
                                                                fontSize: 10,
                                                                cursor: 'pointer',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                lineHeight: 1
                                                            }}
                                                        >
                                                            <i className="fas fa-times" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Upload button */}
                                    <label
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 8,
                                            padding: '10px 16px',
                                            border: '2px dashed var(--primary)',
                                            borderRadius: 10,
                                            cursor: savingBranch ? 'not-allowed' : 'pointer',
                                            color: 'var(--primary)',
                                            fontSize: '0.85rem',
                                            fontWeight: 600,
                                            opacity: savingBranch ? 0.6 : 1,
                                            transition: 'background 0.2s',
                                            background: 'var(--bg-hover)'
                                        }}
                                    >
                                        <i className="fas fa-images" />
                                        Add Gallery Images
                                        <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            onChange={handleGalleryFilesAdd}
                                            disabled={savingBranch}
                                            hidden
                                        />
                                    </label>

                                    <small style={{ color: 'var(--text-muted)', fontSize: '0.74rem', marginTop: -10 }}>
                                        You can upload multiple gallery images. JPG, PNG supported.
                                    </small>

                                    <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border)', paddingBottom: 6, marginTop: 16 }}>
                                        Menu Images
                                    </div>

                                    {branchMenuImages.length > 0 && (
                                        <div>
                                            <small style={{ color: 'var(--text-muted)', fontSize: '0.78rem', display: 'block', marginBottom: 8 }}>
                                                Existing menu images ({branchMenuImages.length})
                                            </small>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                                                {branchMenuImages.map((entry) => (
                                                    <div
                                                        key={entry.id}
                                                        style={{
                                                            position: 'relative',
                                                            width: 80,
                                                            height: 80,
                                                            borderRadius: 8,
                                                            overflow: 'hidden',
                                                            border: '2px solid var(--border)',
                                                            flexShrink: 0
                                                        }}
                                                    >
                                                        <img
                                                            src={entry.image}
                                                            alt="Menu"
                                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {editBranchMenuFiles.length > 0 && (
                                        <div>
                                            <small style={{ color: 'var(--text-muted)', fontSize: '0.78rem', display: 'block', marginBottom: 8 }}>
                                                Menu images to upload ({editBranchMenuFiles.length})
                                            </small>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                                                {editBranchMenuFiles.map((entry) => (
                                                    <div
                                                        key={entry.id}
                                                        style={{
                                                            position: 'relative',
                                                            width: 80,
                                                            height: 80,
                                                            borderRadius: 8,
                                                            overflow: 'hidden',
                                                            border: '2px solid var(--primary)',
                                                            flexShrink: 0
                                                        }}
                                                    >
                                                        <img
                                                            src={entry.preview}
                                                            alt="Menu"
                                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => removeEditBranchMenuFile(entry.id)}
                                                            disabled={savingBranch}
                                                            style={{
                                                                position: 'absolute',
                                                                top: 3,
                                                                right: 3,
                                                                width: 20,
                                                                height: 20,
                                                                borderRadius: '50%',
                                                                background: 'rgba(220,38,38,0.9)',
                                                                border: 'none',
                                                                color: '#fff',
                                                                fontSize: 10,
                                                                cursor: 'pointer',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                lineHeight: 1
                                                            }}
                                                        >
                                                            <i className="fas fa-times" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <label
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 8,
                                            padding: '10px 16px',
                                            border: '2px dashed var(--primary)',
                                            borderRadius: 10,
                                            cursor: savingBranch ? 'not-allowed' : 'pointer',
                                            color: 'var(--primary)',
                                            fontSize: '0.85rem',
                                            fontWeight: 600,
                                            opacity: savingBranch ? 0.6 : 1,
                                            transition: 'background 0.2s',
                                            background: 'var(--bg-hover)'
                                        }}
                                    >
                                        <i className="fas fa-utensils" />
                                        Add Menu Images
                                        <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            onChange={handleEditBranchMenuFilesAdd}
                                            disabled={savingBranch}
                                            hidden
                                        />
                                    </label>

                                    <small style={{ color: 'var(--text-muted)', fontSize: '0.74rem', marginTop: -10 }}>
                                        Upload menu images for this branch. JPG, PNG supported.
                                    </small>
                                </form>
                            )}
                        </div>

                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={closeEditBranchModal}
                                disabled={savingBranch || editBranchLoading}
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={handleSaveBranch}
                                disabled={savingBranch || editBranchLoading}
                            >
                                {savingBranch ? (
                                    <><i className="fas fa-spinner fa-spin" style={{ marginRight: 6 }} />Saving...</>
                                ) : (
                                    <><i className="fas fa-check" style={{ marginRight: 6 }} />Save Changes</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </>
    )
}
