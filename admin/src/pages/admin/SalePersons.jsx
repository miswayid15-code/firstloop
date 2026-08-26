import { useEffect, useMemo, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useJsApiLoader } from '@react-google-maps/api'
import { toast } from 'react-hot-toast'

import PhoneNumberField from '../../components/PhoneNumberField'
import CorporateAddressField from '../../components/CorporateAddressField'
import API from '../../api.js'

const formatDate = (value) => {
    if (!value) {
        return '-'
    }
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
        return value
    }
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    })
}

const libraries = ['places']

const defaultCenter = {
    lat: 13.0827,
    lng: 80.2707
}

const getGenderLabel = (gender) => {
    if (gender == 1) return 'Male'
    if (gender == 2) return 'Female'
    if (gender == 3) return 'Others'
    return gender || '-'
}

const getStatusLabel = (status) => {
    return status == 1 ? 'Active' : 'Inactive'
}

export default function SalePersons() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const salePersonIdParam = searchParams.get('id')
    const searchParam = searchParams.get('search') || ''

    const [showSalePersonView, setShowSalePersonView] = useState(false)
    const [showSalePersonEdit, setShowSalePersonEdit] = useState(false)
    const [selectedSalePerson, setSelectedSalePerson] = useState(null)

    const [salePersons, setSalePersons] = useState([])
    const [search, setSearch] = useState(searchParam)
    const [salePersonPage, setSalePersonPage] = useState(1)
    const [loading, setLoading] = useState(true)

    const [editForm, setEditForm] = useState({
        id: '',
        name: '',
        email: '',
        phone: '',
        country_code: '+91',
        code: '',
        gender: '',
        dob: '',
        address: '',
        city: '',
        state: '',
        country: '',
        latitude: '',
        longitude: '',
        password: ''
    })

    const [autocomplete, setAutocomplete] = useState(null)
    const [showSalePersonAdd, setShowSalePersonAdd] = useState(false)
    const [addingSalePerson, setAddingSalePerson] = useState(false)
    const [updatingSalePerson, setUpdatingSalePerson] = useState(false)
    const [detailsLoading, setDetailsLoading] = useState(false)
    const [generatingCode, setGeneratingCode] = useState(false)
    const [showAddPassword, setShowAddPassword] = useState(false)
    const [showEditPassword, setShowEditPassword] = useState(false)

    const handleGenerateCode = async (target) => {
        setGeneratingCode(true)
        try {
            const response = await API.post('admin/saleperson/generate-code')
            if (response.data.status === 1) {
                if (target === 'add') {
                    setAddForm(prev => ({ ...prev, code: response.data.code }))
                } else if (target === 'edit') {
                    setEditForm(prev => ({ ...prev, code: response.data.code }))
                }
                toast.success('Code generated successfully')
            } else {
                toast.error(response.data.message || 'Failed to generate code')
            }
        } catch (error) {
            toast.error('Failed to generate code')
        } finally {
            setGeneratingCode(false)
        }
    }

    const highlightFieldError = (selector) => {
        setTimeout(() => {
            const element = document.querySelector(selector)
            if (element) {
                element.focus()
                element.classList.add('error-highlight')
                setTimeout(() => {
                    element.classList.remove('error-highlight')
                }, 3000)
            }
        }, 50)
    }

    const focusFieldByErrorMessage = (message) => {
        if (!message) return
        const msg = message.toLowerCase()
        if (msg.includes('phone') || msg.includes('mobile')) {
            highlightFieldError('.modal.active input[name="phone"]')
        } else if (msg.includes('email')) {
            highlightFieldError('.modal.active input[name="email"]')
        } else if (msg.includes('name')) {
            highlightFieldError('.modal.active input[name="name"]')
        } else if (msg.includes('code')) {
            highlightFieldError('.modal.active input[name="code"]')
        } else if (msg.includes('address')) {
            highlightFieldError('.modal.active input[name="address"]')
        } else if (msg.includes('password')) {
            highlightFieldError('.modal.active input[name="password"]')
        }
    }

    const [addForm, setAddForm] = useState({
        name: '',
        email: '',
        phone: '',
        country_code: '+91',
        code: '',
        gender: '',
        dob: '',
        address: '',
        city: '',
        state: '',
        country: '',
        latitude: '',
        longitude: '',
        password: ''
    })
    const [addAutocomplete, setAddAutocomplete] = useState(null)

    const { isLoaded: isMapLoaded, loadError: mapLoadError } = useJsApiLoader({
        id: 'dealora-google-maps',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
        libraries
    })

    const mapCenter = useMemo(() => ({
        lat: Number(editForm.latitude) || defaultCenter.lat,
        lng: Number(editForm.longitude) || defaultCenter.lng
    }), [editForm.latitude, editForm.longitude])

    const addMapCenter = useMemo(() => ({
        lat: Number(addForm.latitude) || defaultCenter.lat,
        lng: Number(addForm.longitude) || defaultCenter.lng
    }), [addForm.latitude, addForm.longitude])

    const fetchSalePersonDetails = async (id) => {
        setDetailsLoading(true)
        try {
            const response = await API.post('admin/saleperson/details', { id })
            if (response.data.status === 1 && response.data.data?.length > 0) {
                setSelectedSalePerson(response.data.data[0])
            } else {
                toast.error(response.data.message || 'Failed to fetch sales person details')
            }
        } catch (error) {
            console.error('Fetch Details Error:', error)
            toast.error('Failed to fetch sales person details')
        } finally {
            setDetailsLoading(false)
        }
    }

    const fetchSalePersons = async () => {
        try {
            const response = await API.post('admin/saleperson/list')
            console.log('response', response.data)
            if (response.data.status === 1) {
                setSalePersons(response.data.data)
            } else {
                setSalePersons([])
            }
        } catch (error) {
            toast.error('Failed to fetch Sales Persons')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchSalePersons()
    }, [])

    useEffect(() => {
        if (salePersonIdParam && salePersons.length > 0) {
            const found = salePersons.find(s => String(s.id) === String(salePersonIdParam))
            if (found) {
                setSelectedSalePerson(found)
                setShowSalePersonView(true)
                fetchSalePersonDetails(found.id)
            }
        }
    }, [salePersonIdParam, salePersons])

    useEffect(() => {
        if (searchParam) {
            setSearch(searchParam)
        }
    }, [searchParam])

    const handleStatusToggle = async (id, currentStatus) => {
        const newStatus = currentStatus == 1 ? 0 : 1
        try {
            await API.post("admin/saleperson/status-update", {
                id,
                status: newStatus
            })
            setSalePersons(prev =>
                prev.map(item =>
                    item.id === id
                        ? { ...item, status: newStatus }
                        : item
                )
            )
            toast.success(
                newStatus === 1
                    ? "Sales Person Activated"
                    : "Sales Person Deactivated"
            )
        } catch (error) {
            toast.error("Failed to update status")
        }
    }

    useEffect(() => {
        if (showSalePersonEdit && selectedSalePerson) {
            setEditForm({
                id: selectedSalePerson.id,
                name: selectedSalePerson.name || '',
                email: selectedSalePerson.email || '',
                phone: selectedSalePerson.phone || '',
                country_code: selectedSalePerson.country_code ? String(selectedSalePerson.country_code) : '+91',
                code: selectedSalePerson.code || '',
                gender: selectedSalePerson.gender || '',
                dob: selectedSalePerson.dob || '',
                address: selectedSalePerson.address || '',
                city: selectedSalePerson.city || '',
                state: selectedSalePerson.state || '',
                country: selectedSalePerson.country || '',
                latitude: selectedSalePerson.lat || '',
                longitude: selectedSalePerson.lon || '',
                password: ''
            })
            setShowEditPassword(false)
        }
    }, [showSalePersonEdit, selectedSalePerson])

    useEffect(() => {
        if (!showSalePersonEdit || !selectedSalePerson || !isMapLoaded) {
            return
        }
        const lat = selectedSalePerson.lat
        const lon = selectedSalePerson.lon
        const hasLocationFields = selectedSalePerson.address || selectedSalePerson.city || selectedSalePerson.state || selectedSalePerson.country

        if (lat && lon && !hasLocationFields) {
            updateLocationDetails(Number(lat), Number(lon), selectedSalePerson.address || '', selectedSalePerson.country || '')
        }
    }, [showSalePersonEdit, selectedSalePerson, isMapLoaded])

    const handleEditChange = (event) => {
        const { name, value } = event.target
        setEditForm(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const handleEditPhoneChange = (phone, countryCode) => {
        setEditForm(prev => ({
            ...prev,
            phone,
            country_code: countryCode || prev.country_code
        }))
    }

    const handleEditAutocompleteLoad = (auto) => {
        setAutocomplete(auto)
    }

    const getAddressComponent = (components, type) => {
        const component = components.find((item) => item.types.includes(type))
        return component ? component.long_name : ''
    }

    const handlePlaceChanged = () => {
        if (!autocomplete) {
            return
        }
        const place = autocomplete.getPlace()
        if (!place || !place.geometry) {
            return
        }
        const address = place.formatted_address || ''
        const components = place.address_components || []
        const city = getAddressComponent(components, 'locality') || getAddressComponent(components, 'sublocality') || getAddressComponent(components, 'administrative_area_level_2')
        const state = getAddressComponent(components, 'administrative_area_level_1')
        const country = getAddressComponent(components, 'country')
        const latitude = place.geometry.location.lat()
        const longitude = place.geometry.location.lng()

        setEditForm(prev => ({
            ...prev,
            address,
            city,
            state,
            country,
            latitude: String(latitude),
            longitude: String(longitude)
        }))
    }

    const updateLocationDetails = (lat, lng, placeName = '', countryName = '') => {
        if (!window.google?.maps?.Geocoder) {
            setEditForm((prev) => ({
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
                setEditForm((prev) => ({
                    ...prev,
                    address: placeName || prev.address,
                    country: countryName || prev.country,
                    latitude: String(lat),
                    longitude: String(lng)
                }))
                return
            }
            const place = results[0]
            let city = ''
            let state = ''
            let country = ''
            place.address_components?.forEach((component) => {
                const types = component.types
                if (types.includes('locality')) city = component.long_name
                if (types.includes('administrative_area_level_1')) state = component.long_name
                if (types.includes('country')) country = component.long_name
            })
            setEditForm((prev) => ({
                ...prev,
                address: place.formatted_address || placeName || prev.address,
                city,
                state,
                country,
                latitude: String(lat),
                longitude: String(lng)
            }))
        })
    }

    const handleMarkerDragEnd = (event) => {
        const latLng = event?.latLng
        if (!latLng) {
            return
        }
        updateLocationDetails(latLng.lat(), latLng.lng())
    }

    const openAddModal = () => {
        setAddForm({
            name: '',
            email: '',
            phone: '',
            country_code: '+91',
            code: '',
            gender: '',
            dob: '',
            address: '',
            city: '',
            state: '',
            country: '',
            latitude: '',
            longitude: '',
            password: ''
        })
        setShowAddPassword(false)
        setShowSalePersonAdd(true)
    }

    const handleAddChange = (event) => {
        const { name, value } = event.target
        setAddForm(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const handleAddPhoneChange = (phone, countryCode) => {
        setAddForm(prev => ({
            ...prev,
            phone,
            country_code: countryCode || prev.country_code
        }))
    }

    const handleAddAutocompleteLoad = (auto) => {
        setAddAutocomplete(auto)
    }

    const handleAddPlaceChanged = () => {
        if (!addAutocomplete) {
            return
        }
        const place = addAutocomplete.getPlace()
        if (!place || !place.geometry) {
            return
        }
        const address = place.formatted_address || ''
        const components = place.address_components || []
        const city = getAddressComponent(components, 'locality') || getAddressComponent(components, 'sublocality') || getAddressComponent(components, 'administrative_area_level_2')
        const state = getAddressComponent(components, 'administrative_area_level_1')
        const country = getAddressComponent(components, 'country')
        const latitude = place.geometry.location.lat()
        const longitude = place.geometry.location.lng()

        setAddForm(prev => ({
            ...prev,
            address,
            city,
            state,
            country,
            latitude: String(latitude),
            longitude: String(longitude)
        }))
    }

    const updateAddLocationDetails = (lat, lng, placeName = '', countryName = '') => {
        if (!window.google?.maps?.Geocoder) {
            setAddForm((prev) => ({
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
                setAddForm((prev) => ({
                    ...prev,
                    address: placeName || prev.address,
                    country: countryName || prev.country,
                    latitude: String(lat),
                    longitude: String(lng)
                }))
                return
            }
            const place = results[0]
            let city = ''
            let state = ''
            let country = ''
            place.address_components?.forEach((component) => {
                const types = component.types
                if (types.includes('locality')) city = component.long_name
                if (types.includes('administrative_area_level_1')) state = component.long_name
                if (types.includes('country')) country = component.long_name
            })
            setAddForm((prev) => ({
                ...prev,
                address: place.formatted_address || placeName || prev.address,
                city,
                state,
                country,
                latitude: String(lat),
                longitude: String(lng)
            }))
        })
    }

    const handleAddMarkerDragEnd = (event) => {
        const latLng = event?.latLng
        if (!latLng) {
            return
        }
        updateAddLocationDetails(latLng.lat(), latLng.lng())
    }

    const handleCreateSalePerson = async () => {
        if (!addForm.name || addForm.name.trim().length < 3) {
            toast.error("Full Name must be at least 3 characters long")
            highlightFieldError('#add-sp-name')
            return
        }
        if (!addForm.code || addForm.code.trim().length < 2) {
            toast.error("Sales Person Code must be at least 2 characters long")
            highlightFieldError('#add-sp-code')
            return
        }
        if (!addForm.phone || !addForm.phone.trim()) {
            toast.error("Phone number is required")
            highlightFieldError('.modal.active input[name="phone"]')
            return
        }
        if (addForm.phone.trim().length < 4) {
            toast.error("Please enter a valid phone number")
            highlightFieldError('.modal.active input[name="phone"]')
            return
        }
        if (addForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addForm.email)) {
            toast.error("Please enter a valid email address")
            highlightFieldError('#add-sp-email')
            return
        }
        if (!addForm.password || !addForm.password.trim()) {
            toast.error("Password is required")
            highlightFieldError('#add-sp-password')
            return
        }
        if (addForm.password.trim().length < 6) {
            toast.error("Password must be at least 6 characters long")
            highlightFieldError('#add-sp-password')
            return
        }

        setAddingSalePerson(true)
        try {
            const response = await API.post(
                "admin/saleperson/create",
                {
                    name: addForm.name,
                    email: addForm.email ? addForm.email.trim() : null,
                    phone: addForm.phone,
                    country_code: addForm.country_code,
                    code: addForm.code,
                    dob: addForm.dob || null,
                    gender: addForm.gender || null,
                    address: addForm.address || null,
                    city: addForm.city || null,
                    state: addForm.state || null,
                    country: addForm.country || null,
                    lat: addForm.latitude || null,
                    lon: addForm.longitude || null,
                    password: addForm.password
                }
            )

            if (response.data.status === 1) {
                toast.success(response.data.message || "Sales Person Registered Successfully")
                fetchSalePersons()
                setShowSalePersonAdd(false)
            } else {
                const errMsg = response.data.message || "Failed to register sales person"
                toast.error(errMsg)
                focusFieldByErrorMessage(errMsg)
            }
        } catch (error) {
            const apiMessage = error?.response?.data?.message || "Failed to register sales person"
            console.log(error)
            toast.error(apiMessage)
            focusFieldByErrorMessage(apiMessage)
        } finally {
            setAddingSalePerson(false)
        }
    }

    const handleUpdateSalePerson = async () => {
        if (!editForm.name || editForm.name.trim().length < 3) {
            toast.error("Full Name must be at least 3 characters long")
            highlightFieldError('#edit-sp-name')
            return
        }
        if (!editForm.code || editForm.code.trim().length < 2) {
            toast.error("Sales Person Code must be at least 2 characters long")
            highlightFieldError('#edit-sp-code')
            return
        }
        if (!editForm.phone || !editForm.phone.trim()) {
            toast.error("Phone number is required")
            highlightFieldError('.modal.active input[name="phone"]')
            return
        }
        if (editForm.phone.trim().length < 4) {
            toast.error("Please enter a valid phone number")
            highlightFieldError('.modal.active input[name="phone"]')
            return
        }
        if (editForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email)) {
            toast.error("Please enter a valid email address")
            highlightFieldError('#edit-sp-email')
            return
        }
        if (editForm.password && editForm.password.trim().length > 0 && editForm.password.trim().length < 6) {
            toast.error("Password must be at least 6 characters long")
            highlightFieldError('#edit-sp-password')
            return
        }

        setUpdatingSalePerson(true)
        try {
            const response = await API.post(
                "admin/saleperson/update",
                {
                    id: editForm.id,
                    name: editForm.name,
                    email: editForm.email ? editForm.email.trim() : null,
                    phone: editForm.phone,
                    country_code: editForm.country_code,
                    code: editForm.code,
                    dob: editForm.dob || null,
                    gender: editForm.gender || null,
                    address: editForm.address || null,
                    city: editForm.city || null,
                    state: editForm.state || null,
                    country: editForm.country || null,
                    lat: editForm.latitude || null,
                    lon: editForm.longitude || null,
                    password: editForm.password && editForm.password.trim() !== '' ? editForm.password : undefined
                }
            )

            if (response.data.status === 1) {
                toast.success(response.data.message || "Sales Person Updated Successfully")
                fetchSalePersons()
                setShowSalePersonEdit(false)
            } else {
                const errMsg = response.data.message || "Failed to update sales person"
                toast.error(errMsg)
                focusFieldByErrorMessage(errMsg)
            }
        } catch (error) {
            const apiMessage = error?.response?.data?.message || "Failed to update sales person"
            console.log(error)
            toast.error(apiMessage)
            focusFieldByErrorMessage(apiMessage)
        } finally {
            setUpdatingSalePerson(false)
        }
    }

    const filteredSalePersons = salePersons.filter((sp) => {
        const searchValue = search.toLowerCase()
        return (
            (sp.name || '').toLowerCase().includes(searchValue) ||
            (sp.email || '').toLowerCase().includes(searchValue) ||
            (sp.phone || '').toLowerCase().includes(searchValue) ||
            (sp.code || '').toLowerCase().includes(searchValue)
        )
    })

    const ITEMS_PER_PAGE = 10
    const totalPages = Math.max(1, Math.ceil(filteredSalePersons.length / ITEMS_PER_PAGE))
    const safePage = Math.min(salePersonPage, totalPages)
    const startIndex = (safePage - 1) * ITEMS_PER_PAGE
    const paginatedSalePersons = filteredSalePersons.slice(startIndex, startIndex + ITEMS_PER_PAGE)
    const startCount = filteredSalePersons.length ? startIndex + 1 : 0
    const endCount = Math.min(startIndex + ITEMS_PER_PAGE, filteredSalePersons.length)
    const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1)

    useEffect(() => {
        setSalePersonPage(1)
    }, [search])

    useEffect(() => {
        if (salePersonPage > totalPages) {
            setSalePersonPage(totalPages)
        }
    }, [salePersonPage, totalPages])

    return (
        <>
            <div className="flex-between" style={{ marginBottom: 24, gap: 20, flexWrap: 'wrap' }}>
                <div className="flex-row gap-md" style={{ flex: 1, flexWrap: 'nowrap' }}>
                    <div className="search-wrapper" style={{ marginBottom: 0, maxWidth: 360, flex: 1, minWidth: 200 }}>
                        <i className="fas fa-search search-icon" />
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Search sales person name, code, email..."
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                        />
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                        Total Registered Sales Persons: <strong>{salePersons.length}</strong> Users
                    </div>
                </div>
                <div>
                    <button className="btn btn-primary" onClick={openAddModal}>
                        <i className="fas fa-plus" /> Add Sales Person
                    </button>
                </div>
            </div>

            <div className="table-wrapper">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Sales Person Name</th>
                            <th>Code</th>
                            <th>Mobile Number</th>
                            <th>Email</th>
                            <th>DOB</th>
                            <th>Joined Date</th>
                            <th>Status</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            Array.from({ length: 5 }).map((_, index) => (
                                <tr className="skeleton-row" key={`skeleton-${index}`}>
                                    <td>
                                        <div className="table-cell-profile">
                                            <div className="cell-avatar skeleton-avatar" />
                                            <div className="cell-info">
                                                <span className="skeleton-text" style={{ width: '120px' }} />
                                            </div>
                                        </div>
                                    </td>
                                    <td><span className="skeleton-text" style={{ width: '80px' }} /></td>
                                    <td><span className="skeleton-text" style={{ width: '140px' }} /></td>
                                    <td><span className="skeleton-text" style={{ width: '110px' }} /></td>
                                    <td><span className="skeleton-text" style={{ width: '80px' }} /></td>
                                    <td><span className="skeleton-text" style={{ width: '70px' }} /></td>
                                    <td><span className="skeleton-text" style={{ width: '100px' }} /></td>
                                    <td><span className="skeleton-text" style={{ width: '90px' }} /></td>
                                </tr>
                            ))
                        ) : paginatedSalePersons.length > 0 ? (
                            paginatedSalePersons.map((row, index) => (
                                <tr key={`${row.email || row.id || index}`}>
                                    <td>
                                        <div className="table-cell-profile">
                                            <div className="cell-avatar">{row.name?.charAt(0) || 'S'}</div>
                                            <div className="cell-info">
                                                <span className="cell-name">{row.name}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td><strong>{row.code}</strong></td>
                                    <td>{`${row.country_code || ''}${row.phone || ''}`}</td>
                                    <td>{row.email || '-'}</td>
                                    <td>{formatDate(row.dob)}</td>
                                    <td>{formatDate(row.createdAt)}</td>
                                    <td>
                                        <div className="merchant-status-cell">
                                            <label
                                                className={`merchant-status-toggle ${row.status == 1 ? 'is-active' : 'is-inactive'}`}
                                                title={row.status == 1 ? 'Deactivate Sales Person' : 'Activate Sales Person'}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={row.status == 1}
                                                    onChange={() => handleStatusToggle(row.id, row.status)}
                                                />
                                                <span className="merchant-status-track" aria-hidden="true">
                                                    <span className="merchant-status-knob" />
                                                </span>
                                                <span className="merchant-status-label">
                                                    {getStatusLabel(row.status)}
                                                </span>
                                            </label>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="action-group" style={{ justifyContent: 'flex-end' }}>
                                            <button
                                                className="btn-icon view"
                                                title="View Sales Person Details"
                                                onClick={() => {
                                                    setSelectedSalePerson(row)
                                                    setShowSalePersonView(true)
                                                    fetchSalePersonDetails(row.id)
                                                }}
                                            >
                                                <i className="fas fa-eye" />
                                            </button>
                                            <button
                                                className="btn-icon view"
                                                title="View Referred Merchants"
                                                onClick={() => navigate(`/salepersons/${row.id}/merchants`)}
                                                style={{ color: '#0dcaf0' }}
                                            >
                                                <i className="fas fa-store" />
                                            </button>
                                            <button
                                                className="btn-icon edit"
                                                title="Edit Sales Person Details"
                                                onClick={() => {
                                                    setSelectedSalePerson(row)
                                                    setShowSalePersonEdit(true)
                                                    fetchSalePersonDetails(row.id)
                                                }}
                                            >
                                                <i className="fas fa-edit" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={8} style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)' }}>
                                    No sales persons found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {!loading && filteredSalePersons.length > ITEMS_PER_PAGE && (
                <div className="pagination-container">
                    <span className="pagination-text">
                        Showing {startCount}-{endCount} of {filteredSalePersons.length} sales persons
                    </span>

                    <div className="pagination-controls">
                        <button
                            type="button"
                            className={`btn-page ${safePage === 1 ? 'disabled' : ''}`}
                            onClick={() => setSalePersonPage((page) => Math.max(1, page - 1))}
                            disabled={safePage === 1}
                        >
                            <i className="fas fa-chevron-left"></i>
                        </button>

                        {pageNumbers.map((page) => (
                            <button
                                type="button"
                                key={page}
                                className={`btn-page ${page === safePage ? 'active' : ''}`}
                                onClick={() => setSalePersonPage(page)}
                            >
                                {page}
                            </button>
                        ))}

                        <button
                            type="button"
                            className={`btn-page ${safePage === totalPages ? 'disabled' : ''}`}
                            onClick={() => setSalePersonPage((page) => Math.min(totalPages, page + 1))}
                            disabled={safePage === totalPages}
                        >
                            <i className="fas fa-chevron-right"></i>
                        </button>
                    </div>
                </div>
            )}

            {/* DETAILS MODAL */}
            {showSalePersonView && selectedSalePerson && (
                <div className="modal active" id="global-details-modal">
                    <div
                        className="modal-backdrop"
                        onClick={() => setShowSalePersonView(false)}
                        style={{
                            background: 'rgb(0 239 246 / 5%)',
                            backdropFilter: 'blur(10px)'
                        }}
                    ></div>

                    <div
                        className="modal-content"
                        style={{
                            maxWidth: 500,
                            animation: 'modalFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                        }}
                    >
                        <div
                            className="modal-header"
                            style={{
                                borderBottom: '1px solid rgba(255, 77, 128, 0.08)',
                                paddingBottom: 16
                            }}
                        >
                            <h3
                                className="modal-title"
                                style={{
                                    fontFamily: 'var(--font-heading)',
                                    fontWeight: 700,
                                    color: 'var(--primary)',
                                    fontSize: '1.2rem'
                                }}
                            >
                                <i className="fas fa-info-circle" style={{ marginRight: 8 }}></i>
                                Sales Person Details
                            </h3>

                            <button
                                className="modal-close"
                                type="button"
                                onClick={() => setShowSalePersonView(false)}
                                style={{
                                    cursor: 'pointer',
                                    color: 'var(--text-muted)',
                                    transition: 'var(--transition-fast)',
                                    background: 'none',
                                    border: 'none'
                                }}
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        <div
                            className="modal-body"
                            style={{
                                maxHeight: '70vh',
                                overflowY: 'auto',
                                padding: '24px 20px'
                            }}
                        >
                            {detailsLoading ? (
                                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                                    <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', color: 'var(--primary)', marginBottom: 12 }}></i>
                                    <p>Loading sales person details...</p>
                                </div>
                            ) : (
                                <>
                                    <div
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            marginBottom: 24
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: 90,
                                                height: 90,
                                                borderRadius: '50%',
                                                background: 'rgba(255,77,128,0.12)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '2rem',
                                                fontWeight: 700,
                                                color: 'var(--primary)',
                                                marginBottom: 14
                                            }}
                                        >
                                            {selectedSalePerson.name?.charAt(0)}
                                        </div>

                                        <h3 style={{ marginBottom: 6, fontSize: '1.4rem' }}>
                                            {selectedSalePerson.name}
                                        </h3>
                                        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                            Code: <strong>{selectedSalePerson.code}</strong>
                                        </span>
                                    </div>

                                    <div className="details-grid">
                                        <div className="details-item">
                                            <span className="details-label">Mobile Number</span>
                                            <span className="details-value">
                                                {selectedSalePerson.country_code || ''} {selectedSalePerson.phone}
                                            </span>
                                        </div>

                                        <div className="details-item">
                                            <span className="details-label">Email Address</span>
                                            <span className="details-value">{selectedSalePerson.email || '-'}</span>
                                        </div>

                                        <div className="details-item">
                                            <span className="details-label">Date of Birth</span>
                                            <span className="details-value">{formatDate(selectedSalePerson.dob)}</span>
                                        </div>

                                        <div className="details-item">
                                            <span className="details-label">Join Date</span>
                                            <span className="details-value">{formatDate(selectedSalePerson.createdAt)}</span>
                                        </div>

                                        <div className="details-item">
                                            <span className="details-label">Gender</span>
                                            <span className="details-value">{getGenderLabel(selectedSalePerson.gender)}</span>
                                        </div>

                                        <div className="details-item">
                                            <span className="details-label">Status</span>
                                            <span className="details-value">{getStatusLabel(selectedSalePerson.status)}</span>
                                        </div>

                                        <div className="details-item" style={{ gridColumn: 'span 2' }}>
                                            <span className="details-label">Address</span>
                                            <span className="details-value">{selectedSalePerson.address || '-'}</span>
                                        </div>
                                        <div className="details-item">
                                            <span className="details-label">City</span>
                                            <span className="details-value">{selectedSalePerson.city || '-'}</span>
                                        </div>
                                        <div className="details-item">
                                            <span className="details-label">State</span>
                                            <span className="details-value">{selectedSalePerson.state || '-'}</span>
                                        </div>
                                        <div className="details-item">
                                            <span className="details-label">Country</span>
                                            <span className="details-value">{selectedSalePerson.country || '-'}</span>
                                        </div>
                                        <div className="details-item">
                                            <span className="details-label">Lat / Lon</span>
                                            <span className="details-value">
                                                {selectedSalePerson.lat && selectedSalePerson.lon ? `${selectedSalePerson.lat}, ${selectedSalePerson.lon}` : '-'}
                                            </span>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        <div
                            className="modal-footer"
                            style={{
                                borderTop: '1px solid rgba(255, 77, 128, 0.08)',
                                paddingTop: 16,
                                display: 'flex',
                                justifyContent: 'flex-end'
                            }}
                        >
                            <button
                                className="btn btn-secondary"
                                type="button"
                                onClick={() => setShowSalePersonView(false)}
                                style={{ padding: '8px 20px' }}
                            >
                                Close Details
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* EDIT MODAL */}
            {showSalePersonEdit && selectedSalePerson && (
                <div className="modal active">
                    <div className="modal-backdrop" onClick={() => setShowSalePersonEdit(false)}></div>
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3 className="modal-title">Edit Sales Person Profile</h3>
                            <button className="modal-close" type="button" onClick={() => setShowSalePersonEdit(false)}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                            {detailsLoading ? (
                                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                                    <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', color: 'var(--primary)', marginBottom: 12 }}></i>
                                    <p>Loading sales person details...</p>
                                </div>
                            ) : (
                                <form onSubmit={(e) => e.preventDefault()}>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <input
                                                type="text"
                                                id="edit-sp-name"
                                                name="name"
                                                className="form-control"
                                                placeholder=" "
                                                value={editForm.name}
                                                onChange={handleEditChange}
                                                required
                                            />
                                            <label htmlFor="edit-sp-name" className="form-label">
                                                Full Name <span style={{ color: '#ef4444' }}>*</span>
                                            </label>
                                        </div>

                                        <div className="form-group" style={{ position: 'relative' }}>
                                            <input
                                                type="text"
                                                id="edit-sp-code"
                                                name="code"
                                                className="form-control"
                                                placeholder=" "
                                                value={editForm.code}
                                                onChange={handleEditChange}
                                                required
                                                style={{ paddingRight: '100px' }}
                                            />
                                            <label htmlFor="edit-sp-code" className="form-label">
                                                Sales Person Code <span style={{ color: '#ef4444' }}>*</span>
                                            </label>
                                            <button
                                                type="button"
                                                onClick={() => handleGenerateCode('edit')}
                                                disabled={generatingCode || detailsLoading}
                                                style={{
                                                    position: 'absolute',
                                                    right: '8px',
                                                    top: '50%',
                                                    transform: 'translateY(-50%)',
                                                    background: 'var(--primary)',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    padding: '6px 12px',
                                                    fontSize: '0.78rem',
                                                    fontWeight: 600,
                                                    cursor: 'pointer',
                                                    zIndex: 10,
                                                    transition: 'all 0.2s ease',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 4
                                                }}
                                                onMouseOver={(e) => {
                                                    e.currentTarget.style.filter = 'brightness(1.1)';
                                                }}
                                                onMouseOut={(e) => {
                                                    e.currentTarget.style.filter = 'none';
                                                }}
                                            >
                                                <i className={`fas ${generatingCode ? 'fa-spinner fa-spin' : 'fa-magic'}`}></i>
                                                {generatingCode ? '...' : 'Generate'}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="form-row">
                                        <div className="form-group">
                                            <input
                                                type="email"
                                                id="edit-sp-email"
                                                name="email"
                                                className="form-control"
                                                placeholder=" "
                                                value={editForm.email}
                                                onChange={handleEditChange}
                                            />
                                            <label htmlFor="edit-sp-email" className="form-label">Email Address</label>
                                        </div>

                                        <PhoneNumberField
                                            value={editForm.phone}
                                            countryCode={editForm.country_code ? String(editForm.country_code) : ''}
                                            onChange={handleEditPhoneChange}
                                        />
                                    </div>

                                    <div className="form-row">
                                        <div className="form-group" style={{ position: 'relative' }}>
                                            <input
                                                type={showEditPassword ? "text" : "password"}
                                                id="edit-sp-password"
                                                name="password"
                                                className="form-control"
                                                placeholder=" "
                                                value={editForm.password}
                                                onChange={handleEditChange}
                                                style={{ paddingRight: '40px' }}
                                                autoComplete="new-password"
                                            />
                                            <label htmlFor="edit-sp-password" className="form-label">
                                                Password (leave blank to keep current)
                                            </label>
                                            <button
                                                type="button"
                                                onClick={() => setShowEditPassword(!showEditPassword)}
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
                                                <i className={showEditPassword ? "fas fa-eye-slash" : "fas fa-eye"}></i>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="form-row">
                                        <div className="form-group-classic">
                                            <label className="form-label-classic">Gender</label>
                                            <select
                                                name="gender"
                                                className="form-select"
                                                value={editForm.gender}
                                                onChange={handleEditChange}
                                            >
                                                <option value="">Select gender</option>
                                                <option value="1">Male</option>
                                                <option value="2">Female</option>
                                                <option value="3">Others</option>
                                            </select>
                                        </div>

                                        <div className="form-group-classic">
                                            <label className="form-label-classic">Date of Birth</label>
                                            <input
                                                type="date"
                                                name="dob"
                                                className="form-control"
                                                value={editForm.dob}
                                                onChange={handleEditChange}
                                                style={{ padding: '8px 12px', height: 40 }}
                                            />
                                        </div>
                                    </div>

                                    <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border)', paddingBottom: 6, marginBottom: 12 }}>
                                        Address Location
                                    </div>

                                    {mapLoadError && (
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                            Failed to load Google Maps.
                                        </p>
                                    )}

                                    {!mapLoadError && !isMapLoaded && (
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                            Loading map...
                                        </p>
                                    )}

                                    {isMapLoaded && (
                                        <CorporateAddressField
                                            form={editForm}
                                            onInputChange={handleEditChange}
                                            onAutocompleteLoad={handleEditAutocompleteLoad}
                                            onPlaceChanged={handlePlaceChanged}
                                            onMapClick={(event) => {
                                                if (event.latLng) {
                                                    handleMarkerDragEnd(event)
                                                }
                                            }}
                                            onMarkerDragEnd={handleMarkerDragEnd}
                                            center={mapCenter}
                                            mapContainerStyle={{ width: '100%', height: '320px' }}
                                            required={true}
                                        />
                                    )}
                                </form>
                            )}
                        </div>

                        <div className="modal-footer">
                            <button className="btn btn-secondary" type="button" onClick={() => setShowSalePersonEdit(false)}>
                                Cancel
                            </button>
                            <button
                                className="btn btn-primary"
                                type="button"
                                onClick={handleUpdateSalePerson}
                                disabled={detailsLoading || updatingSalePerson}
                            >
                                {updatingSalePerson ? 'Updating...' : 'Update Details'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ADD MODAL */}
            {showSalePersonAdd && (
                <div className="modal active">
                    <div className="modal-backdrop" onClick={() => !addingSalePerson && setShowSalePersonAdd(false)}></div>
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3 className="modal-title">Create Sales Person Profile</h3>
                            <button className="modal-close" type="button" onClick={() => !addingSalePerson && setShowSalePersonAdd(false)} disabled={addingSalePerson}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                            <form onSubmit={(e) => e.preventDefault()}>
                                <div className="form-row">
                                    <div className="form-group">
                                        <input
                                            type="text"
                                            id="add-sp-name"
                                            name="name"
                                            className="form-control"
                                            placeholder=" "
                                            value={addForm.name}
                                            onChange={handleAddChange}
                                            disabled={addingSalePerson}
                                            required
                                        />
                                        <label htmlFor="add-sp-name" className="form-label">
                                            Full Name <span style={{ color: '#ef4444' }}>*</span>
                                        </label>
                                    </div>

                                    <div className="form-group" style={{ position: 'relative' }}>
                                        <input
                                            type="text"
                                            id="add-sp-code"
                                            name="code"
                                            className="form-control"
                                            placeholder=" "
                                            value={addForm.code}
                                            onChange={handleAddChange}
                                            disabled={addingSalePerson}
                                            required
                                            style={{ paddingRight: '100px' }}
                                        />
                                        <label htmlFor="add-sp-code" className="form-label">
                                            Sales Person Code <span style={{ color: '#ef4444' }}>*</span>
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => handleGenerateCode('add')}
                                            disabled={generatingCode || addingSalePerson}
                                            style={{
                                                position: 'absolute',
                                                right: '8px',
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                background: 'var(--primary)',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '4px',
                                                padding: '6px 12px',
                                                fontSize: '0.78rem',
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                                zIndex: 10,
                                                transition: 'all 0.2s ease',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 4
                                            }}
                                            onMouseOver={(e) => {
                                                e.currentTarget.style.filter = 'brightness(1.1)';
                                            }}
                                            onMouseOut={(e) => {
                                                e.currentTarget.style.filter = 'none';
                                            }}
                                        >
                                            <i className={`fas ${generatingCode ? 'fa-spinner fa-spin' : 'fa-magic'}`}></i>
                                            {generatingCode ? '...' : 'Generate'}
                                        </button>
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <input
                                            type="email"
                                            id="add-sp-email"
                                            name="email"
                                            className="form-control"
                                            placeholder=" "
                                            value={addForm.email}
                                            onChange={handleAddChange}
                                            disabled={addingSalePerson}
                                        />
                                        <label htmlFor="add-sp-email" className="form-label">Email Address</label>
                                    </div>

                                    <PhoneNumberField
                                        value={addForm.phone}
                                        countryCode={addForm.country_code ? String(addForm.country_code) : ''}
                                        onChange={handleAddPhoneChange}
                                        disabled={addingSalePerson}
                                    />
                                </div>

                                <div className="form-row">
                                    <div className="form-group" style={{ position: 'relative' }}>
                                        <input
                                            type={showAddPassword ? "text" : "password"}
                                            id="add-sp-password"
                                            name="password"
                                            className="form-control"
                                            placeholder=" "
                                            value={addForm.password}
                                            onChange={handleAddChange}
                                            disabled={addingSalePerson}
                                            style={{ paddingRight: '40px' }}
                                            required
                                            autoComplete="new-password"
                                        />
                                        <label htmlFor="add-sp-password" className="form-label">
                                            Password <span style={{ color: '#ef4444' }}>*</span>
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => setShowAddPassword(!showAddPassword)}
                                            disabled={addingSalePerson}
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
                                            <i className={showAddPassword ? "fas fa-eye-slash" : "fas fa-eye"}></i>
                                        </button>
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group-classic">
                                        <label className="form-label-classic">Gender</label>
                                        <select
                                            name="gender"
                                            className="form-select"
                                            value={addForm.gender}
                                            onChange={handleAddChange}
                                            disabled={addingSalePerson}
                                        >
                                            <option value="">Select gender</option>
                                            <option value="1">Male</option>
                                            <option value="2">Female</option>
                                            <option value="3">Others</option>
                                        </select>
                                    </div>

                                    <div className="form-group-classic">
                                        <label className="form-label-classic">Date of Birth</label>
                                        <input
                                            type="date"
                                            name="dob"
                                            className="form-control"
                                            value={addForm.dob}
                                            onChange={handleAddChange}
                                            disabled={addingSalePerson}
                                            style={{ padding: '8px 12px', height: 40 }}
                                        />
                                    </div>
                                </div>

                                <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border)', paddingBottom: 6, marginBottom: 12 }}>
                                    Address Location
                                </div>

                                {mapLoadError && (
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                        Failed to load Google Maps.
                                    </p>
                                )}

                                {!mapLoadError && !isMapLoaded && (
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                        Loading map...
                                    </p>
                                )}

                                {isMapLoaded && (
                                    <CorporateAddressField
                                        form={addForm}
                                        onInputChange={handleAddChange}
                                        onAutocompleteLoad={handleAddAutocompleteLoad}
                                        onPlaceChanged={handleAddPlaceChanged}
                                        onMapClick={(event) => {
                                            if (event.latLng) {
                                                handleAddMarkerDragEnd(event)
                                            }
                                        }}
                                        onMarkerDragEnd={handleAddMarkerDragEnd}
                                        center={addMapCenter}
                                        mapContainerStyle={{ width: '100%', height: '320px' }}
                                        required={true}
                                    />
                                )}
                            </form>
                        </div>

                        <div className="modal-footer">
                            <button className="btn btn-secondary" type="button" onClick={() => setShowSalePersonAdd(false)} disabled={addingSalePerson}>
                                Cancel
                            </button>
                            <button
                                className="btn btn-primary"
                                type="button"
                                onClick={handleCreateSalePerson}
                                disabled={addingSalePerson}
                            >
                                {addingSalePerson ? 'Registering...' : 'Register Sales Person'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
