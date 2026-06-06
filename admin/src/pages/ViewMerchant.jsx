import { useEffect, useMemo, useState } from 'react'

import {
    NavLink,
    useNavigate,
    useParams
} from 'react-router-dom'
import { useJsApiLoader } from '@react-google-maps/api'
import { toast } from 'react-hot-toast'

import AppToaster from '../components/AppToaster.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import PhoneNumberField from '../components/PhoneNumberField'
import CorporateAddressField from '../components/CorporateAddressField'
import API from '../api.js';

const BRANCHES_PER_PAGE = 6

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
        ? `${receptionist.country_code}${receptionist.phone}`
        : receptionist.phone
}

export default function ViewMerchant() {

    const navigate = useNavigate()

    const { id } = useParams()

    const [search, setSearch] = useState('')

    const [branchPage, setBranchPage] = useState(1)

    const [merchantData, setMerchantData] = useState(null)

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
        receptionist_id: '',
        address: '',
        city: '',
        state: '',
        country: '',
        zipcode: '',
        latitude: '',
        longitude: '',
        description: '',
        open_time: '',
        close_time: '',
        profile_image: null,
        profileImagePreview: ''
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
        password: '',
        address: '',
        city: '',
        state: '',
        country: '',
        zipcode: '',
        latitude: '',
        longitude: '',
        description: '',
        receptionist_id: '',
        open_time: '',
        close_time: '',
        profile_image: null,
        profileImagePreview: ''
    }

    const [addBranchForm, setAddBranchForm] = useState(initialAddBranchForm)

    const [addBranchAutocomplete, setAddBranchAutocomplete] = useState(null)

    const [addingBranch, setAddingBranch] = useState(false)

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

    const [branchMenuImages, setBranchMenuImages] = useState([])

    const [editBranchMenuFiles, setEditBranchMenuFiles] = useState([])

    const [newGalleryFiles, setNewGalleryFiles] = useState([])

    const initialCouponForm = {
        code: '',
        percentage: '',
        min_amount: '',
        usage_limit: '1',
        start_date: '',
        end_date: '',
        branch_ids: [],
        cat_id: '',
        banner_image: null,
        bannerImagePreview: ''
    }

    const [showCreateCouponModal, setShowCreateCouponModal] = useState(false)

    const [creatingCoupon, setCreatingCoupon] = useState(false)

    const [couponForm, setCouponForm] = useState(initialCouponForm)

    const [showEditCouponModal, setShowEditCouponModal] = useState(false)

    const [editingCoupon, setEditingCoupon] = useState(false)

    const [editCouponId, setEditCouponId] = useState(null)

    const [deletingCouponId, setDeletingCouponId] = useState(null)
    const [deletingBranchId, setDeletingBranchId] = useState(null)
    const [deletingReceptionistId, setDeletingReceptionistId] = useState(null)

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

        name: '',

        email: '',

        phone: '',

        country_code: '',

        password: '',

        profile_image: null,

        profileImagePreview: ''

    })

    const [showAddReceptionistModal, setShowAddReceptionistModal] = useState(false)

    const [addingReceptionist, setAddingReceptionist] = useState(false)

    const [addReceptionistForm, setAddReceptionistForm] = useState({

        name: '',

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
            console.log('Receptionists Response:', response.data)
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

            // console.log(response.data)

            if (isSuccessResponse(response.data)) {

                const merchant =
                    response.data.data

                setMerchantData(merchant)

                setSelectedCategoryId(
                    merchant.cat_id?.toString() || ''
                )

                setBranchesData(
                    merchant.Branches || []
                )

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

    const filteredBranches =
        branchesData.filter((branch) => {

            const branchName = branch.name || ''
            const branchAddress = branch.address || ''
            const searchValue = search.toLowerCase()

            return (
                branchName.toLowerCase().includes(searchValue) ||
                branchAddress.toLowerCase().includes(searchValue)
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
            open_time: '',
            close_time: '',
            profile_image: null,
            profileImagePreview: ''
        })

        setBranchGalleryImages([])

        setBranchMenuImages([])

        setEditBranchMenuFiles([])

        setNewGalleryFiles([])

        try {

            const response = await API.get(`admin/branch/id/${branchId}`)

            const data = response.data

            if (isSuccessResponse(data)) {

                const branch = data.data

                const rawOpen = branch.open_time || ''
                const rawClose = branch.close_time || ''

                const toTimeInput = (val) => {
                    if (!val) return ''
                    // Already HH:MM or HH:MM:SS
                    const parts = val.split(':')
                    if (parts.length >= 2) {
                        return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`
                    }
                    return val
                }

                setEditBranchForm({
                    name: branch.name || '',
                    email: branch.email || '',
                    phone: branch.phone || '',
                    country_code: branch.country_code || '+91',
                    receptionist_id: branch.receptionist_id || branch.Receptionists?.[0]?.id || '',
                    address: branch.address || '',
                    city: branch.city || '',
                    state: branch.state || '',
                    country: branch.country || '',
                    zipcode: branch.zip_code || branch.zipcode || '',
                    latitude: branch.lat || '',
                    longitude: branch.lon || '',
                    description: branch.description || '',
                    open_time: toTimeInput(rawOpen),
                    close_time: toTimeInput(rawClose),
                    profile_image: null,
                    profileImagePreview: branch.profile_image || ''
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
            open_time: '',
            close_time: '',
            profile_image: null,
            profileImagePreview: ''
        })

        setBranchGalleryImages([])

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

    const geocodeAndUpdateForm = (setForm, lat, lng, placeName = '', countryName = '') => {
        if (!window.google?.maps?.Geocoder) {
            setForm((prev) => ({
                ...prev,
                latitude: String(lat),
                longitude: String(lng),
                country: countryName || prev.country
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
                    country: countryName || prev.country
                }))
                return
            }

            const place = results[0]
            let city = ''
            let state = ''
            let country = ''
            let zipcode = ''

            place.address_components?.forEach((component) => {
                const types = component.types

                if (types.includes('locality')) city = component.long_name
                if (types.includes('administrative_area_level_1')) state = component.long_name
                if (types.includes('country')) country = component.long_name
                if (types.includes('postal_code')) zipcode = component.long_name
            })

            setForm((prev) => ({
                ...prev,
                address: place.formatted_address || placeName || prev.address,
                city,
                state,
                country,
                zipcode,
                latitude: String(lat),
                longitude: String(lng)
            }))
        })
    }

    const updateBranchLocationDetails = (lat, lng, placeName = '', countryName = '') => {
        geocodeAndUpdateForm(setEditBranchForm, lat, lng, placeName, countryName)
    }

    const updateAddBranchLocationDetails = (lat, lng, placeName = '', countryName = '') => {
        geocodeAndUpdateForm(setAddBranchForm, lat, lng, placeName, countryName)
    }

    const handlePlaceChangedForAutocomplete = (autocomplete, updateLocation) => {
        if (!autocomplete) return

        const place = autocomplete.getPlace()

        if (!place.geometry || !place.geometry.location) return

        let country = ''

        if (place.address_components) {
            place.address_components.forEach((component) => {
                if (component.types.includes('country')) {
                    country = component.long_name
                }
            })
        }

        const lat = place.geometry.location.lat()
        const lng = place.geometry.location.lng()

        updateLocation(lat, lng, place.formatted_address || '', country)
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
        setCreatingCoupon(false)
        setShowCreateCouponModal(true)
    }

    const closeCreateCouponModal = () => {
        setShowCreateCouponModal(false)
        setCreatingCoupon(false)
        setCouponForm(initialCouponForm)
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

    const handleCouponBannerChange = (e) => {
        const file = e.target.files?.[0]

        if (!file) return

        setCouponForm((prev) => ({
            ...prev,
            banner_image: file,
            bannerImagePreview: URL.createObjectURL(file)
        }))
    }

    const handleCreateCoupon = async () => {
        if (!couponForm.code.trim()) {
            toast.error('Coupon code is required')
            return
        }

        if (couponForm.percentage === '' || couponForm.percentage === null) {
            toast.error('Percentage is required')
            return
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
            formData.append('percentage', couponForm.percentage)
            formData.append('min_amount', couponForm.min_amount || '0')
            formData.append('usage_limit', couponForm.usage_limit || '0')
            formData.append('start_date', toCouponApiDate(couponForm.start_date))
            formData.append('end_date', toCouponApiDate(couponForm.end_date))
            formData.append('cat_id', couponForm.cat_id)
            formData.append('branch_ids', JSON.stringify(couponForm.branch_ids))

            if (couponForm.banner_image) {
                formData.append('banner_image', couponForm.banner_image)
            }

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

        setEditCouponForm({
            code: coupon.code || '',
            percentage: coupon.percentage || '',
            min_amount: coupon.min_amount || '',
            usage_limit: coupon.usage_limit || '1',
            start_date: formatDateForInput(coupon.start_date),
            end_date: formatDateForInput(coupon.end_date),
            branch_ids: Array.isArray(coupon.branch_ids) ? coupon.branch_ids.map(Number) : [],
            cat_id: coupon.cat_id?.toString() || coupon.category_id?.toString() || '',
            banner_image: null,
            bannerImagePreview: coupon.banner_image || ''
        })
        setEditingCoupon(false)
        setShowEditCouponModal(true)
    }

    const closeEditCouponModal = () => {
        setShowEditCouponModal(false)
        setEditingCoupon(false)
        setEditCouponForm(initialCouponForm)
        setEditCouponId(null)
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

    const handleEditCouponBannerChange = (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        setEditCouponForm((prev) => ({
            ...prev,
            banner_image: file,
            bannerImagePreview: URL.createObjectURL(file)
        }))
    }

    const handleEditCoupon = async () => {
        if (!editCouponForm.code.trim()) {
            toast.error('Coupon code is required')
            return
        }

        if (editCouponForm.percentage === '' || editCouponForm.percentage === null) {
            toast.error('Percentage is required')
            return
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
            formData.append('percentage', editCouponForm.percentage)
            formData.append('min_amount', editCouponForm.min_amount || '0')
            formData.append('usage_limit', editCouponForm.usage_limit || '0')
            formData.append('start_date', toCouponApiDate(editCouponForm.start_date))
            formData.append('end_date', toCouponApiDate(editCouponForm.end_date))
            formData.append('cat_id', editCouponForm.cat_id)
            formData.append('branch_ids', JSON.stringify(editCouponForm.branch_ids))

            if (editCouponForm.banner_image) {
                formData.append('banner_image', editCouponForm.banner_image)
            }

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
        if (!addBranchForm.name.trim()) {
            toast.error('Branch name is required')
            return
        }

        if (!addBranchForm.email.trim()) {
            toast.error('Email is required')
            return
        }

        if (!addBranchForm.phone.trim()) {
            toast.error('Phone is required')
            return
        }



        if (!addBranchForm.address.trim()) {
            toast.error('Address is required')
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
            formData.append('password', addBranchForm.password)
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
            formData.append('open_time', addBranchForm.open_time)
            formData.append('close_time', addBranchForm.close_time)
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
            } else {
                toast.error(data.message || 'Failed to register branch')
            }
        } catch (error) {
            const apiMessage = error?.response?.data?.message || 'Failed to register branch'

            toast.error(apiMessage)

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
            return
        }

        if (!editBranchForm.email.trim()) {
            toast.error('Email is required')
            return
        }

        if (!editBranchForm.phone.trim()) {
            toast.error('Phone is required')
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
            formData.append('open_time', editBranchForm.open_time)
            formData.append('close_time', editBranchForm.close_time)

            if (editBranchForm.profile_image && typeof editBranchForm.profile_image !== 'string') {
                formData.append('profile_image', editBranchForm.profile_image)
            }

            formData.append('receptionist_id', editBranchForm.receptionist_id || '')

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

            } else {

                toast.error(data.message || 'Failed to update branch')

            }

        } catch (error) {

            const apiMessage = error?.response?.data?.message || 'Failed to update branch'

            toast.error(apiMessage)

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

            name: '',

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

            name: selectedReceptionist.name || '',

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

        if (!receptionistForm.name.trim()) {

            toast.error('Name is required')

            return

        }

        if (!receptionistForm.email.trim()) {

            toast.error('Email is required')

            return

        }

        if (!receptionistForm.phone.trim()) {

            toast.error('Phone number is required')

            return

        }

        try {

            setSavingReceptionist(true)

            const formData = new FormData()

            formData.append('id', selectedReceptionist.id)

            formData.append('name', receptionistForm.name)

            formData.append('email', receptionistForm.email)

            formData.append('phone', receptionistForm.phone)

            formData.append('country_code', receptionistForm.country_code)

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

                setIsEditingReceptionist(false)

            } else {
                console.log(data.message)

                toast.error(data.message || 'Failed to update receptionist')

            }

        } catch (error) {

            const apiMessage = error?.response?.data?.message || 'Failed to update receptionist'

            toast.error(apiMessage)

            console.error('Error updating receptionist:', error)

        } finally {

            setSavingReceptionist(false)

        }

    }

    const closeAddReceptionistModal = () => {

        setShowAddReceptionistModal(false)

        setAddingReceptionist(false)

        setAddReceptionistForm({

            name: '',

            email: '',

            phone: '',

            country_code: '+91',

            password: '',

            profile_image: null,

            profileImagePreview: ''

        })

    }

    const handleAddReceptionist = async () => {

        if (!addReceptionistForm.name.trim()) {

            toast.error('Name is required')

            return

        }

        if (!addReceptionistForm.email.trim()) {

            toast.error('Email is required')

            return

        }

        if (!addReceptionistForm.phone.trim()) {

            toast.error('Phone number is required')

            return

        }

        if (!addReceptionistForm.password.trim()) {

            toast.error('Password is required')

            return

        }

        try {

            setAddingReceptionist(true)

            const formData = new FormData()

            formData.append('mer_id', id)

            formData.append('name', addReceptionistForm.name)

            formData.append('email', addReceptionistForm.email)

            formData.append('phone', addReceptionistForm.phone)

            formData.append('country_code', addReceptionistForm.country_code)

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

                        name: addReceptionistForm.name,

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

                closeAddReceptionistModal()

            } else {

                toast.error(data.message || 'Failed to register receptionist')

            }

        } catch (error) {

            const apiMessage = error?.response?.data?.message || 'Failed to register receptionist'

            toast.error(apiMessage)

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

            if (isSuccessResponse(data)) {

                setMerchantData((prev) => prev
                    ? {
                        ...prev,
                        cat_id: data.data?.cat_id?.toString() || selectedCategoryId,
                        bus_cat: data.data?.bus_cat || data.data?.name || selectedCategory?.name || prev.bus_cat
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
                <AppToaster />

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
                                            <th>Percentage</th>
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
                                                <td>{coupon.percentage}%</td>
                                                <td>{coupon.min_amount}</td>
                                                <td>{coupon.usage_limit}</td>
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
            <AppToaster />
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

                    <NavLink
                        to="/merchants"
                        className="btn btn-secondary"
                    >
                        <i className="fas fa-arrow-left"></i>

                        {' '}Back to Merchants

                    </NavLink>

                </div>

            </div>

            <div className="card card-glass merchant-profile-card">
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
                                                    {merchantData?.bus_cat || 'Not assigned'}
                                                </span>
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <small className="merchant-sub-label">
                                            Email
                                        </small>

                                        <p className="merchant-subtext">
                                            {merchantData?.email}
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

                                    <div>

                                        <small className="merchant-sub-label">
                                            Document
                                        </small>

                                        <p>
                                            <a
                                                href={merchantData?.document}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="doc-link"
                                            >
                                                View Document
                                            </a>
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

                                </div>

                            </div>

                        </div>

                        <div className="merchant-profile-stats merchant-profile-stats-grid">

                            <div className="merchant-profile-stats-avatar">
                                <div className="merchant-avatar merchant-avatar-small">
                                    {merchantData?.profile_image ? (
                                        <img
                                            src={merchantData.profile_image}
                                            alt={merchantData?.name || 'Merchant'}
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
                                {merchantData.coupon_list.map((coupon) => (
                                    <tr key={coupon.id}>
                                        <td>{coupon.code}</td>
                                        <td>{coupon.percentage}%</td>
                                        <td>{coupon.min_amount}</td>
                                        <td>{coupon.usage_limit}</td>
                                        <td>{formatDisplayDate(coupon.start_date)}</td>
                                        <td>{formatDisplayDate(coupon.end_date)}</td>
                                        <td>
                                            <span className={`badge ${coupon.status === 1 ? 'active' : 'pending'}`}>
                                                {coupon.status === 1 ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="action-group" style={{ justifyContent: 'flex-end', gap: 8 }}>
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
                                        <button className="btn-sm-action-secondary">
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
                    onClick={() => setShowAddReceptionistModal(true)}
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
                                            </div>
                                        </div>
                                    </td>

                                    <td>
                                        {receptionist.email || '-'}
                                    </td>

                                    <td>
                                        {getReceptionistPhone(receptionist)}
                                    </td>

                                    <td>
                                        <span
                                            className={`badge ${receptionist.status == 1
                                                ? 'active'
                                                : 'pending'
                                                }`}
                                        >
                                            {
                                                receptionist.status == 1
                                                    ? 'Active'
                                                    : 'Inactive'
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
                    <div
                        className="modal-backdrop"
                        onClick={closeAssignReceptionistModal}
                    ></div>

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
                                            className="form-control"
                                            value={receptionistForm.name}
                                            onChange={(e) => setReceptionistForm({ ...receptionistForm, name: e.target.value })}
                                            placeholder=" "
                                            required
                                            autoComplete="off"
                                        />
                                        <label className="form-label">Full Name</label>
                                    </div>

                                    <div className="form-group">
                                        <input
                                            type="email"
                                            className="form-control"
                                            value={receptionistForm.email}
                                            onChange={(e) => setReceptionistForm({ ...receptionistForm, email: e.target.value })}
                                            placeholder=" "
                                            required
                                            autoComplete="off"
                                        />
                                        <label className="form-label">Corporate Email</label>
                                    </div>

                                    <PhoneNumberField
                                        value={receptionistForm.phone}
                                        countryCode={receptionistForm.country_code}
                                        onChange={(phoneVal, codeVal) => {
                                            setReceptionistForm({
                                                ...receptionistForm,
                                                phone: phoneVal || '',
                                                country_code: codeVal || ''
                                            });
                                        }}
                                    />

                                    <div className="form-group">
                                        <input
                                            type="password"
                                            className="form-control"
                                            value={receptionistForm.password}
                                            onChange={(e) => setReceptionistForm({ ...receptionistForm, password: e.target.value })}
                                            placeholder=" "
                                            autoComplete="new-password"
                                        />
                                        <label className="form-label">Password</label>
                                        <small style={{ color: 'var(--text-muted)', fontSize: '0.74rem', marginTop: '4px', display: 'block' }}>
                                            Leave blank to keep the current password.
                                        </small>
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
                    <div
                        className="modal-backdrop"
                        onClick={closeAddReceptionistModal}
                    ></div>

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

                                <div className="form-group">
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={addReceptionistForm.name}
                                        onChange={(e) => setAddReceptionistForm({ ...addReceptionistForm, name: e.target.value })}
                                        placeholder=" "
                                        required
                                        autoComplete="off"
                                    />
                                    <label className="form-label">Full Name</label>
                                </div>

                                <div className="form-group">
                                    <input
                                        type="email"
                                        className="form-control"
                                        value={addReceptionistForm.email}
                                        onChange={(e) => setAddReceptionistForm({ ...addReceptionistForm, email: e.target.value })}
                                        placeholder=" "
                                        required
                                        autoComplete="off"
                                    />
                                    <label className="form-label">Corporate Email</label>
                                </div>

                                <PhoneNumberField
                                    value={addReceptionistForm.phone}
                                    countryCode={addReceptionistForm.country_code}
                                    onChange={(phoneVal, codeVal) => {
                                        setAddReceptionistForm({
                                            ...addReceptionistForm,
                                            phone: phoneVal || '',
                                            country_code: codeVal || ''
                                        });
                                    }}
                                />

                                <div className="form-group">
                                    <input
                                        type="password"
                                        className="form-control"
                                        value={addReceptionistForm.password}
                                        onChange={(e) => setAddReceptionistForm({ ...addReceptionistForm, password: e.target.value })}
                                        placeholder=" "
                                        required
                                        autoComplete="new-password"
                                    />
                                    <label className="form-label">Password</label>
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
                    <div
                        className="modal-backdrop"
                        onClick={() => { if (!creatingCoupon) closeCreateCouponModal() }}
                    />

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
                                <div className="form-row">
                                    <div className="form-group">
                                        <input
                                            type="text"
                                            name="code"
                                            className="form-control"
                                            placeholder=" "
                                            value={couponForm.code}
                                            onChange={handleCouponChange}
                                            disabled={creatingCoupon}
                                            required
                                            autoComplete="off"
                                        />
                                        <label className="form-label">Coupon Code</label>
                                    </div>

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
                                            max="100"
                                            required
                                        />
                                        <label className="form-label">Discount (%)</label>
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <input
                                            type="number"
                                            name="min_amount"
                                            className="form-control"
                                            placeholder=" "
                                            value={couponForm.min_amount}
                                            onChange={handleCouponChange}
                                            disabled={creatingCoupon}
                                            min="0"
                                        />
                                        <label className="form-label">Minimum Amount</label>
                                    </div>

                                    <div className="form-group">
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
                                    </div>
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

                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                                    {couponForm.bannerImagePreview ? (
                                        <img
                                            src={couponForm.bannerImagePreview}
                                            alt="Coupon banner preview"
                                            style={{
                                                width: '100%',
                                                maxWidth: 320,
                                                height: 120,
                                                objectFit: 'cover',
                                                borderRadius: 10,
                                                border: '1px solid var(--border)'
                                            }}
                                        />
                                    ) : null}

                                    <label
                                        className="btn btn-sm-action-secondary"
                                        style={{ cursor: creatingCoupon ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6, margin: 0 }}
                                    >
                                        <i className="fas fa-image" />
                                        {couponForm.banner_image ? 'Change Banner Image' : 'Upload Banner Image'}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleCouponBannerChange}
                                            disabled={creatingCoupon}
                                            hidden
                                        />
                                    </label>

                                    <small style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>
                                        Optional banner image for the coupon.
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
                    <div
                        className="modal-backdrop"
                        onClick={() => { if (!editingCoupon) closeEditCouponModal() }}
                    />

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
                                <div className="form-row">
                                    <div className="form-group">
                                        <input
                                            type="text"
                                            name="code"
                                            className="form-control"
                                            placeholder=" "
                                            value={editCouponForm.code}
                                            onChange={handleEditCouponChange}
                                            disabled={editingCoupon}
                                            required
                                            autoComplete="off"
                                        />
                                        <label className="form-label">Coupon Code</label>
                                    </div>

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
                                            max="100"
                                            required
                                        />
                                        <label className="form-label">Discount (%)</label>
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <input
                                            type="number"
                                            name="min_amount"
                                            className="form-control"
                                            placeholder=" "
                                            value={editCouponForm.min_amount}
                                            onChange={handleEditCouponChange}
                                            disabled={editingCoupon}
                                            min="0"
                                        />
                                        <label className="form-label">Minimum Amount</label>
                                    </div>

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
                                    </div>
                                </div>

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

                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                                    {editCouponForm.bannerImagePreview ? (
                                        <img
                                            src={editCouponForm.bannerImagePreview}
                                            alt="Coupon banner preview"
                                            style={{
                                                width: '100%',
                                                maxWidth: 320,
                                                height: 120,
                                                objectFit: 'cover',
                                                borderRadius: 10,
                                                border: '1px solid var(--border)'
                                            }}
                                        />
                                    ) : null}

                                    <label
                                        className="btn btn-sm-action-secondary"
                                        style={{ cursor: editingCoupon ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6, margin: 0 }}
                                    >
                                        <i className="fas fa-image" />
                                        {editCouponForm.banner_image ? 'Change Banner Image' : 'Upload Banner Image'}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleEditCouponBannerChange}
                                            disabled={editingCoupon}
                                            hidden
                                        />
                                    </label>

                                    <small style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>
                                        Optional banner image for the coupon.
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

            {addModal && (
                <div className="modal active">
                    <div
                        className="modal-backdrop"
                        onClick={() => { if (!addingBranch) closeAddBranchModal() }}
                    />

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
                                        <label className="form-label">Branch Name</label>
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
                                            required
                                            autoComplete="off"
                                        />
                                        <label className="form-label">Email</label>
                                    </div>
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
                                                    {receptionist.name || 'Unnamed'} {receptionist.email ? `(${receptionist.email})` : (receptionist.phone ? `(${receptionist.phone})` : '')}
                                                    {isAssigned ? ` (Assigned to ${assignedBranch.name})` : ''}
                                                </option>
                                            );
                                        })}
                                    </select>
                                    <small style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>
                                        Assign an available receptionist to this branch. Select "Select receptionist (None)" to leave empty.
                                    </small>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginBottom: 4 }}>
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

                                <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border)', paddingBottom: 6 }}>
                                    Operating Hours
                                </div>

                                <div className="form-row">
                                    <div className="form-group-classic">
                                        <label className="form-label-classic">Open Time</label>
                                        <input
                                            type="time"
                                            name="open_time"
                                            className="form-select"
                                            value={addBranchForm.open_time}
                                            onChange={handleAddBranchChange}
                                            disabled={addingBranch}
                                        />
                                    </div>

                                    <div className="form-group-classic">
                                        <label className="form-label-classic">Close Time</label>
                                        <input
                                            type="time"
                                            name="close_time"
                                            className="form-select"
                                            value={addBranchForm.close_time}
                                            onChange={handleAddBranchChange}
                                            disabled={addingBranch}
                                        />
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
                    <div
                        className="modal-backdrop"
                        onClick={() => { if (!savingBranch) closeEditBranchModal() }}
                    />

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
                                            <label className="form-label">Branch Name</label>
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
                                                required
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
                                                        {receptionist.name || 'Unnamed'} {receptionist.email ? `(${receptionist.email})` : (receptionist.phone ? `(${receptionist.phone})` : '')}
                                                        {isCurrentBranch ? ' (Current)' : (isAssigned ? ` (Assigned to ${assignedBranch.name})` : '')}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                        <small style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>
                                            Assign an available receptionist to this branch. Select "Select receptionist (None)" to unassign.
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
                                    <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border)', paddingBottom: 6 }}>
                                        Operating Hours
                                    </div>

                                    <div className="form-row">
                                        <div className="form-group-classic">
                                            <label className="form-label-classic">Open Time</label>
                                            <input
                                                type="time"
                                                name="open_time"
                                                className="form-select"
                                                value={editBranchForm.open_time}
                                                onChange={handleEditBranchChange}
                                                disabled={savingBranch}
                                            />
                                        </div>

                                        <div className="form-group-classic">
                                            <label className="form-label-classic">Close Time</label>
                                            <input
                                                type="time"
                                                name="close_time"
                                                className="form-select"
                                                value={editBranchForm.close_time}
                                                onChange={handleEditBranchChange}
                                                disabled={savingBranch}
                                            />
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
