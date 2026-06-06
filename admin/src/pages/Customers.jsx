import { useEffect, useMemo, useState } from 'react'

import { useJsApiLoader } from '@react-google-maps/api'
import { toast } from 'react-hot-toast'

import AppToaster from '../components/AppToaster.jsx'
import PhoneNumberField from '../components/PhoneNumberField'
import CorporateAddressField from '../components/CorporateAddressField'
import API from '../api.js';

const formatTime = (value) => {
    if (!value) {
        return '-'
    }

    const parts = String(value).split(':')

    if (parts.length < 2) {
        return value
    }

    const hour = parseInt(parts[0], 10)
    const minute = parts[1]
    const period = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12

    return `${displayHour}:${minute} ${period}`
}
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

export default function Customers() {
    const [showCustomerView, setShowCustomerView] = useState(false)
    const [showCustomerEdit, setShowCustomerEdit] = useState(false)
    const [selectedCustomer, setSelectedCustomer] = useState(null)

    const [customers, setCustomers] = useState([])
    const [search, setSearch] = useState('')
    const [customerPage, setCustomerPage] = useState(1)
    const [loading, setLoading] = useState(true)

    const [editCustomerForm, setEditCustomerForm] = useState({
        name: '',
        email: '',
        phone: '',
        country_code: '+91',
        gender: '',
        dob: '',
        address: '',
        city: '',
        state: '',
        country: '',
        zipcode: '',
        latitude: '',
        longitude: '',
        profile_image: null,
        profileImagePreview: '',
        password: ''
    })

    const [customerAutocomplete, setCustomerAutocomplete] = useState(null)
    const [editingCustomer, setEditingCustomer] = useState(false)

    const { isLoaded: isCustomerMapLoaded, loadError: customerMapLoadError } = useJsApiLoader({
        id: 'dealora-google-maps-customers',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
        libraries
    })

    const customerMapCenter = useMemo(() => ({
        lat: Number(editCustomerForm.latitude) || defaultCenter.lat,
        lng: Number(editCustomerForm.longitude) || defaultCenter.lng
    }), [editCustomerForm.latitude, editCustomerForm.longitude])





    useEffect(() => {

        fetchCustomers()

    }, [])




    const fetchCustomers = async () => {

        try {

            const response = await API.post('admin/customer/list')

            console.log(response.data)

            if (response.data.status === 1) {

                setCustomers(response.data.data)

            }

        } catch (error) {

            toast.error('Failed to fetch Customers')

        } finally {

            setLoading(false)

        }

    }

    const handleStatusToggle = async (id, currentStatus) => {

        const newStatus = currentStatus == 1 ? 0 : 1

        try {

            await API.post("admin/customer/status-update", {
                id: id,
                status: newStatus
            })

            setCustomers(prev =>
                prev.map(item =>
                    item.id === id
                        ? { ...item, status: newStatus }
                        : item
                )
            )

            toast.success(
                newStatus === 1
                    ? "Customer Activated"
                    : "Customer Deactivated"
            )

        } catch (error) {

            toast.error("Failed to update status")

        }

    }

    useEffect(() => {
        if (showCustomerEdit && selectedCustomer) {
            setEditCustomerForm({
                id: selectedCustomer.id,
                name: selectedCustomer.name || '',
                email: selectedCustomer.email || '',
                phone: selectedCustomer.phone || '',
                country_code: selectedCustomer.country_code || '+91',
                gender: selectedCustomer.gender || '',
                dob: selectedCustomer.dob || '',
                address: selectedCustomer.address || selectedCustomer.location || '',
                city: selectedCustomer.city || '',
                state: selectedCustomer.state || '',
                country: selectedCustomer.country || selectedCustomer.country_name || '',
                zipcode: selectedCustomer.zipcode || selectedCustomer.zip_code || '',
                latitude: selectedCustomer.latitude || selectedCustomer.lat || '',
                longitude: selectedCustomer.longitude || selectedCustomer.lon || '',
                profile_image: null,
                profileImagePreview: selectedCustomer.profile_image || selectedCustomer.profileImage || '',
                password: ''
            })
        }
    }, [showCustomerEdit, selectedCustomer])

    useEffect(() => {
        if (!showCustomerEdit || !selectedCustomer || !isCustomerMapLoaded) {
            return
        }

        const lat = selectedCustomer.latitude || selectedCustomer.lat
        const lon = selectedCustomer.longitude || selectedCustomer.lon
        const hasLocationFields = selectedCustomer.address || selectedCustomer.city || selectedCustomer.state || selectedCustomer.country || selectedCustomer.zipcode || selectedCustomer.zip_code

        if (lat && lon && !hasLocationFields) {
            updateCustomerLocationDetails(Number(lat), Number(lon), selectedCustomer.address || '', selectedCustomer.country || selectedCustomer.country_name || '')
        }
    }, [showCustomerEdit, selectedCustomer, isCustomerMapLoaded])

    const handleEditCustomerChange = (event) => {
        const { name, value } = event.target
        setEditCustomerForm(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const handleEditCustomerPhoneChange = (phone, countryCode) => {
        setEditCustomerForm(prev => ({
            ...prev,
            phone,
            country_code: countryCode || prev.country_code
        }))
    }

    const handleEditCustomerProfileImageChange = (event) => {
        const file = event.target.files?.[0]
        if (!file) {
            return
        }

        const reader = new FileReader()
        reader.onload = () => {
            setEditCustomerForm(prev => ({
                ...prev,
                profile_image: file,
                profileImagePreview: reader.result || ''
            }))
        }
        reader.readAsDataURL(file)
    }

    const handleEditCustomerAutocompleteLoad = (autocomplete) => {
        setCustomerAutocomplete(autocomplete)
    }

    const getAddressComponent = (components, type) => {
        const component = components.find((item) => item.types.includes(type))
        return component ? component.long_name : ''
    }

    const handleCustomerPlaceChanged = () => {
        if (!customerAutocomplete) {
            return
        }

        const place = customerAutocomplete.getPlace()
        if (!place || !place.geometry) {
            return
        }

        const address = place.formatted_address || ''
        const components = place.address_components || []
        const city = getAddressComponent(components, 'locality') || getAddressComponent(components, 'sublocality') || getAddressComponent(components, 'administrative_area_level_2')
        const state = getAddressComponent(components, 'administrative_area_level_1')
        const country = getAddressComponent(components, 'country')
        const zipcode = getAddressComponent(components, 'postal_code')
        const latitude = place.geometry.location.lat()
        const longitude = place.geometry.location.lng()

        setEditCustomerForm(prev => ({
            ...prev,
            address,
            city,
            state,
            country,
            zipcode,
            latitude,
            longitude
        }))
    }

    const updateCustomerLocationDetails = (lat, lng, placeName = '', countryName = '') => {
        if (!window.google?.maps?.Geocoder) {
            setEditCustomerForm((prev) => ({
                ...prev,
                latitude: lat,
                longitude: lng,
                country: countryName || prev.country
            }))
            return
        }

        const geocoder = new window.google.maps.Geocoder()

        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
            if (status !== 'OK' || !results || !results[0]) {
                setEditCustomerForm((prev) => ({
                    ...prev,
                    address: placeName || prev.address,
                    country: countryName || prev.country,
                    latitude: lat,
                    longitude: lng
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

            setEditCustomerForm((prev) => ({
                ...prev,
                address: place.formatted_address || placeName || prev.address,
                city,
                state,
                country,
                zipcode,
                latitude: lat,
                longitude: lng
            }))
        })
    }

    const handleCustomerMarkerDragEnd = (event) => {
        const latLng = event?.latLng
        if (!latLng) {
            return
        }

        updateCustomerLocationDetails(latLng.lat(), latLng.lng())
    }

    const handleUpdateCustomer = async () => {

        try {

            const formData = new FormData();

            formData.append("id", selectedCustomer.id);
            formData.append("name", editCustomerForm.name);
            formData.append("email", editCustomerForm.email);
            formData.append("phone", editCustomerForm.phone);
            formData.append("password", editCustomerForm.password);
            formData.append("dob", editCustomerForm.dob);
            formData.append("gender", editCustomerForm.gender);
            formData.append("address", editCustomerForm.address);
            formData.append("city", editCustomerForm.city);
            formData.append("state", editCustomerForm.state);
            formData.append("country", editCustomerForm.country);
            formData.append("zipcode", editCustomerForm.zipcode);
            formData.append("lat", editCustomerForm.latitude);
            formData.append("lon", editCustomerForm.longitude);
            formData.append("country_code", editCustomerForm.country_code);

            if (editCustomerForm.profile_image) {
                formData.append(
                    "profile_image",
                    editCustomerForm.profile_image
                );
            }

            const response = await API.post(
                "admin/customer/update",
                formData
            );

            if (response.data.status === 1) {

                toast.success(response.data.message);

                fetchCustomers();

                setShowCustomerEdit(false);

            } else {

                toast.error(response.data.message);

            }

        } catch (error) {

            console.log(error);

            toast.error("Failed to update customer");

        }

    };

    const filteredCustomers = customers.filter((customer) => {
        const searchValue = search.toLowerCase()

        return (
            (customer.name || '').toLowerCase().includes(searchValue) ||
            (customer.email || '').toLowerCase().includes(searchValue) ||
            (customer.phone || '').toLowerCase().includes(searchValue)
        )
    })

    const CUSTOMERS_PER_PAGE = 10

    const totalCustomerPages = Math.max(
        1,
        Math.ceil(filteredCustomers.length / CUSTOMERS_PER_PAGE)
    )

    const safeCustomerPage = Math.min(
        customerPage,
        totalCustomerPages
    )

    const customerPageStartIndex =
        (safeCustomerPage - 1) * CUSTOMERS_PER_PAGE

    const paginatedCustomers =
        filteredCustomers.slice(
            customerPageStartIndex,
            customerPageStartIndex + CUSTOMERS_PER_PAGE
        )

    const customerStartCount = filteredCustomers.length
        ? customerPageStartIndex + 1
        : 0

    const customerEndCount = Math.min(
        customerPageStartIndex + CUSTOMERS_PER_PAGE,
        filteredCustomers.length
    )

    const customerPageNumbers = Array.from(
        { length: totalCustomerPages },
        (_, index) => index + 1
    )

    useEffect(() => {
        setCustomerPage(1)
    }, [search])

    useEffect(() => {
        if (customerPage > totalCustomerPages) {
            setCustomerPage(totalCustomerPages)
        }
    }, [customerPage, totalCustomerPages])



    return (
        <>
            <AppToaster />

            <div className="flex-between" style={{ marginBottom: 24, gap: 20, flexWrap: 'wrap' }}>
                <div className="flex-row gap-md" style={{ flex: 1, flexWrap: 'nowrap' }}>
                    <div className="search-wrapper" style={{ marginBottom: 0, maxWidth: 360, flex: 1, minWidth: 200 }}>
                        <i className="fas fa-search search-icon" />
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Search customer name, email, phone..."
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                        />
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                        Total Registered Customers: <strong>{customers.length}</strong> Users
                    </div>
                </div>
                <div>
                    <button className="btn btn-primary">
                        <i className="fas fa-plus" /> Add Customer
                    </button>
                </div>
            </div>

            <div className="table-wrapper">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Customer Name</th>
                            <th>Mobile Number</th>
                            <th>Email</th>
                            <th>Date of Birth</th>
                            <th>Joiner Dealora Date</th>
                            <th>Status</th>
                            {/* <th>Assigned Branch</th> */}
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
                                    <td>
                                        <span className="skeleton-text" style={{ width: '140px' }} />
                                    </td>
                                    <td>
                                        <span className="skeleton-text" style={{ width: '110px' }} />
                                    </td>
                                    <td>
                                        <span className="skeleton-text" style={{ width: '80px' }} />
                                    </td>
                                    <td>
                                        <span className="skeleton-text" style={{ width: '70px' }} />
                                    </td>
                                    <td>
                                        <span className="skeleton-text" style={{ width: '100px' }} />
                                    </td>
                                    <td>
                                        <span className="skeleton-text" style={{ width: '90px' }} />
                                    </td>
                                </tr>
                            ))
                        ) : paginatedCustomers.length > 0 ? (
                            paginatedCustomers.map((row, index) => (
                                <tr key={`${row.email || row.id || index}`}>
                                    <td>
                                        <div className="table-cell-profile">
                                            <div className="cell-avatar">{row.name?.charAt(0) || 'C'}</div>
                                            <div className="cell-info">
                                                <span className="cell-name">{row.name}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>{`${row.country_code || ''}${row.phone || ''}`}</td>
                                    <td>{row.email}</td>
                                    <td>{formatDate(row.dob)}</td>
                                    <td>{formatDate(row.createdAt)}</td>
                                    <td>
                                        <div className="merchant-status-cell">
                                            <label
                                                className={`merchant-status-toggle ${row.status == 1 ? 'is-active' : 'is-inactive'}`}
                                                title={row.status == 1 ? 'Deactivate merchant' : 'Activate merchant'}
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
                                                title="View Customer Details"
                                                onClick={() => {
                                                    setSelectedCustomer(row)
                                                    setShowCustomerView(true)
                                                }}
                                            >
                                                <i className="fas fa-eye" />
                                            </button>
                                            <button
                                                className="btn-icon edit"
                                                title="Edit Customer Details"
                                                onClick={() => {
                                                    setSelectedCustomer(row)
                                                    setShowCustomerEdit(true)
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
                                <td colSpan={7} style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)' }}>
                                    No customers found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {!loading && filteredCustomers.length > CUSTOMERS_PER_PAGE && (
                <div className="pagination-container">
                    <span className="pagination-text">
                        Showing {customerStartCount}-{customerEndCount} of {filteredCustomers.length} customers
                    </span>

                    <div className="pagination-controls">
                        <button
                            type="button"
                            className={`btn-page ${safeCustomerPage === 1 ? 'disabled' : ''}`}
                            onClick={() => setCustomerPage((page) => Math.max(1, page - 1))}
                            disabled={safeCustomerPage === 1}
                        >
                            <i className="fas fa-chevron-left"></i>
                        </button>

                        {customerPageNumbers.map((page) => (
                            <button
                                type="button"
                                key={page}
                                className={`btn-page ${page === safeCustomerPage ? 'active' : ''}`}
                                onClick={() => setCustomerPage(page)}
                            >
                                {page}
                            </button>
                        ))}

                        <button
                            type="button"
                            className={`btn-page ${safeCustomerPage === totalCustomerPages ? 'disabled' : ''}`}
                            onClick={() => setCustomerPage((page) => Math.min(totalCustomerPages, page + 1))}
                            disabled={safeCustomerPage === totalCustomerPages}
                        >
                            <i className="fas fa-chevron-right"></i>
                        </button>
                    </div>
                </div>
            )}

            {
                showCustomerView && selectedCustomer && (

                    <div
                        className="modal active"
                        id="global-details-modal"
                    >

                        <div
                            className="modal-backdrop"
                            onClick={() => setShowCustomerView(false)}
                            style={{
                                background: 'rgba(233, 30, 99, 0.05)',
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

                                    <i
                                        className="fas fa-info-circle"
                                        style={{ marginRight: 8 }}
                                    ></i>

                                    Customer Profile Details

                                </h3>

                                <button
                                    className="modal-close"
                                    type="button"
                                    onClick={() => setShowCustomerView(false)}
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
                                    padding: '24px 0'
                                }}
                            >

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
                                        {selectedCustomer.name?.charAt(0)}
                                    </div>

                                    <h3
                                        style={{
                                            marginBottom: 6,
                                            fontSize: '1.4rem'
                                        }}
                                    >
                                        {selectedCustomer.name}
                                    </h3>

                                    <span
                                        style={{
                                            color: 'var(--text-muted)',
                                            fontSize: '0.9rem'
                                        }}
                                    >
                                        Premium Club Member
                                    </span>

                                </div>

                                <div className="details-grid">

                                    <div className="details-item">

                                        <span className="details-label">
                                            Mobile Number
                                        </span>

                                        <span className="details-value">
                                            {selectedCustomer.phone}
                                        </span>

                                    </div>

                                    <div className="details-item">

                                        <span className="details-label">
                                            Email Address
                                        </span>

                                        <span className="details-value">
                                            {selectedCustomer.email}
                                        </span>

                                    </div>

                                    <div className="details-item">

                                        <span className="details-label">
                                            Date of Birth
                                        </span>

                                        <span className="details-value">
                                            {formatDate(selectedCustomer.dob)}
                                        </span>

                                    </div>

                                    <div className="details-item">

                                        <span className="details-label">
                                            Join Date
                                        </span>

                                        <span className="details-value">
                                            {formatDate(selectedCustomer.createdAt)}
                                        </span>

                                    </div>

                                    <div className="details-item">

                                        <span className="details-label">
                                            Gender
                                        </span>

                                        <span className="details-value">
                                            {getGenderLabel(selectedCustomer.gender)}
                                        </span>

                                    </div>
                                    <div className="details-item">

                                        <span className="details-label">
                                            Status
                                        </span>

                                        <span className="details-value">
                                            {getStatusLabel(selectedCustomer.status)}
                                        </span>

                                    </div>

                                </div>

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
                                    onClick={() => setShowCustomerView(false)}
                                    style={{
                                        padding: '8px 20px'
                                    }}
                                >
                                    Close Details
                                </button>

                            </div>

                        </div>

                    </div>

                )
            }

            {
                showCustomerEdit && selectedCustomer && (

                    <div className="modal active">

                        <div
                            className="modal-backdrop"
                            onClick={() => setShowCustomerEdit(false)}
                        ></div>

                        <div className="modal-content">

                            <div className="modal-header">

                                <h3 className="modal-title">
                                    Edit Customer Profile
                                </h3>

                                <button
                                    className="modal-close"
                                    type="button"
                                    onClick={() => setShowCustomerEdit(false)}
                                >
                                    <i className="fas fa-times"></i>
                                </button>

                            </div>

                            <div className="modal-body">

                                <form>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                                        <div
                                            style={{
                                                width: 90,
                                                height: 90,
                                                borderRadius: '50%',
                                                border: '2px solid var(--primary)',
                                                overflow: 'hidden',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                background: 'var(--bg-hover)',
                                                fontSize: '2rem',
                                                color: 'var(--primary)'
                                            }}
                                        >
                                            {editCustomerForm.profileImagePreview ? (
                                                <img
                                                    src={editCustomerForm.profileImagePreview}
                                                    alt="Profile"
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                />
                                            ) : (
                                                <i className="fas fa-user" />
                                            )}
                                        </div>

                                        <label className="btn btn-sm-action-secondary" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', fontSize: '0.85rem' }}>
                                            <i className="fas fa-camera" />
                                            {editCustomerForm.profile_image ? 'Change Photo' : 'Upload Profile Photo'}
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleEditCustomerProfileImageChange}
                                                hidden
                                            />
                                        </label>

                                        <small style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>
                                            Upload a profile image for the customer. JPG, PNG supported.
                                        </small>
                                    </div>

                                    <div className="form-row">
                                        <div className="form-group">
                                            <input
                                                type="text"
                                                id="edit-cust-name"
                                                name="name"
                                                className="form-control"
                                                placeholder=" "
                                                value={editCustomerForm.name}
                                                onChange={handleEditCustomerChange}
                                                required
                                            />
                                            <label htmlFor="edit-cust-name" className="form-label">
                                                Full Name
                                            </label>
                                        </div>

                                        <div className="form-group">
                                            <input
                                                type="email"
                                                id="edit-cust-email"
                                                name="email"
                                                className="form-control"
                                                placeholder=" "
                                                value={editCustomerForm.email}
                                                onChange={handleEditCustomerChange}
                                                required
                                            />
                                            <label htmlFor="edit-cust-email" className="form-label">
                                                Email Address
                                            </label>
                                        </div>
                                    </div>

                                    <div className="form-row">
                                        <PhoneNumberField
                                            value={editCustomerForm.phone}
                                            countryCode={editCustomerForm.country_code}
                                            onChange={handleEditCustomerPhoneChange}
                                        />

                                        <div className="form-group-classic">
                                            <label className="form-label-classic">Gender</label>
                                            <select
                                                name="gender"
                                                className="form-select"
                                                value={editCustomerForm.gender}
                                                onChange={handleEditCustomerChange}
                                            >
                                                <option value="">Select gender</option>
                                                <option value="1">Male</option>
                                                <option value="2">Female</option>
                                                <option value="3">Others</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="form-row">
                                        <div className="form-group">
                                            <input
                                                type="password"
                                                name="password"
                                                className="form-control"
                                                placeholder=" "
                                                value={editCustomerForm.password}
                                                onChange={handleEditCustomerChange}
                                            />
                                            <label className="form-label">Password</label>
                                        </div>

                                        <div className="form-group-classic">
                                            <label className="form-label-classic">Date of Birth</label>
                                            <input
                                                type="date"
                                                name="dob"
                                                className="form-control"
                                                value={editCustomerForm.dob || selectedCustomer.dob || ''}
                                                onChange={handleEditCustomerChange}
                                                required
                                                style={{ padding: '8px 12px', height: 40 }}
                                            />
                                        </div>
                                    </div>

                                    <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border)', paddingBottom: 6, marginBottom: 12 }}>
                                        Address
                                    </div>

                                    {customerMapLoadError && (
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                            Failed to load Google Maps. Please check the Maps API key.
                                        </p>
                                    )}

                                    {!customerMapLoadError && !isCustomerMapLoaded && (
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                            Loading map...
                                        </p>
                                    )}

                                    {isCustomerMapLoaded && (
                                        <CorporateAddressField
                                            form={editCustomerForm}
                                            onInputChange={handleEditCustomerChange}
                                            onAutocompleteLoad={handleEditCustomerAutocompleteLoad}
                                            onPlaceChanged={handleCustomerPlaceChanged}
                                            onMapClick={(event) => {
                                                if (event.latLng) {
                                                    handleCustomerMarkerDragEnd(event)
                                                }
                                            }}
                                            onMarkerDragEnd={handleCustomerMarkerDragEnd}
                                            center={customerMapCenter}
                                            mapContainerStyle={{ width: '100%', height: '320px' }}
                                        />
                                    )}

                                </form>

                            </div>

                            <div className="modal-footer">

                                <button
                                    className="btn btn-secondary"
                                    type="button"
                                    onClick={() => setShowCustomerEdit(false)}
                                >
                                    Cancel
                                </button>

                                <button
                                    className="btn btn-primary"
                                    type="button"
                                    onClick={handleUpdateCustomer}
                                >
                                    Update Details
                                </button>

                            </div>

                        </div>

                    </div>

                )
            }
        </>
    )
}
