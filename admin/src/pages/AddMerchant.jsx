import { useState, useMemo, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useJsApiLoader } from '@react-google-maps/api'
import { toast } from 'react-hot-toast'

import AppToaster from '../components/AppToaster.jsx'
import PhoneNumberField from '../components/PhoneNumberField'
import CorporateAddressField from '../components/CorporateAddressField'
import API from '../api.js';

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

const initialForm = {
    profilePhoto: null,
    businessLogo: null,
    kycDocument: null,
    ownerName: '',
    businessName: '',
    serviceProvided: '',
    category: '',
    email: '',
    phone: '',
    country: '',
    password: '',
    taxNumber: '',
    address: '',
    city: '',
    state: '',
    zipcode: '',
    latitude: '',
    longitude: '', countryCode: '',
}

export default function AddMerchant() {
    const [form, setForm] = useState(initialForm)
    const [profilePreview, setProfilePreview] = useState('')
    const [logoPreview, setLogoPreview] = useState('')
    const [autocomplete, setAutocomplete] = useState(null)
    const [categories, setCategories] = useState([])

    const navigate = useNavigate()
    const { isLoaded: isMapLoaded, loadError: mapLoadError } = useJsApiLoader({
        id: 'dealora-google-maps',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
        libraries
    })

    const center = useMemo(() => {
        return {
            lat: Number(form.latitude) || defaultCenter.lat,
            lng: Number(form.longitude) || defaultCenter.lng
        }
    }, [form.latitude, form.longitude])

    const handleChange = (event) => {
        const { name, value } = event.target

        setForm((prev) => ({
            ...prev,
            [name]: value
        }))
    }

    const handleFileChange = (event) => {
        const { name, files } = event.target

        if (!files || !files[0]) return

        const file = files[0]

        setForm((prev) => ({
            ...prev,
            [name]: file
        }))

        if (name === 'profilePhoto') {
            setProfilePreview(URL.createObjectURL(file))
        }

        if (name === 'businessLogo') {
            setLogoPreview(URL.createObjectURL(file))
        }
    }

    const updateLocationDetails = (lat, lng, placeName = '', countryName = '') => {
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

    const handlePlaceChanged = () => {
        if (!autocomplete) return

        const place = autocomplete.getPlace()

        if (!place.geometry || !place.geometry.location) return

        let city = ''
        let state = ''
        let country = ''
        let zipcode = ''

        if (place.address_components) {
            place.address_components.forEach((component) => {
                const types = component.types

                if (types.includes('locality')) {
                    city = component.long_name
                }

                if (types.includes('administrative_area_level_1')) {
                    state = component.long_name
                }

                if (types.includes('country')) {
                    country = component.long_name
                }

                if (types.includes('postal_code')) {
                    zipcode = component.long_name
                }
            })
        }

        const lat = place.geometry.location.lat()
        const lng = place.geometry.location.lng()

        updateLocationDetails(lat, lng, place.formatted_address || '', country)
    }

    const handleMarkerDragEnd = (event) => {
        const lat = event.latLng.lat()
        const lng = event.latLng.lng()

        updateLocationDetails(lat, lng)
    }

    const handleSubmit = async (event) => {

        event.preventDefault()

        try {
            const formData = new FormData()

            formData.append(
                'name',
                form.ownerName
            )
            // console.log(formData);

            formData.append(
                'bus_name',
                form.businessName
            )

            formData.append(
                'bus_cat',
                form.serviceProvided
            )

            formData.append(
                'cat_id',
                form.category
            )

            formData.append(
                'email',
                form.email
            )

            formData.append(
                'phone',
                form.phone
            )

            formData.append(
                'country_code',
                form.countryCode
            )

            formData.append(
                'password',
                form.password
            )

            formData.append(
                'gst_no',
                form.taxNumber
            )

            formData.append(
                'address',
                form.address
            )

            formData.append(
                'city',
                form.city
            )
            formData.append(
                'state',
                form.state
            )

            formData.append(
                'zip_code',
                form.zipcode
            )

            formData.append(
                'lat',
                form.latitude
            )

            formData.append(
                'lon',
                form.longitude
            )

            if (form.profilePhoto) {

                formData.append(
                    'profile_image',
                    form.profilePhoto
                )

            }

            if (form.businessLogo) {

                formData.append(
                    'brand_image',
                    form.businessLogo
                )

            }

            if (form.kycDocument) {

                formData.append(
                    'document',
                    form.kycDocument
                )

            }
            console.log('PHONE:', form.phone)
            console.log('COUNTRY CODE:', form.countryCode)
            const response = await API.post(

                '/admin/merchant/register',

                formData,

                {
                    headers: {
                        'Content-Type':
                            'multipart/form-data'
                    }
                }

            )

            const data = response.data || {}

            console.log('Merchant Response:', data)

            if (data.status === 1 || data.success === true) {
                toast.success(data.message || 'Merchant added successfully')
                setTimeout(() => navigate('/merchants'), 800)
            } else {
                toast.error(data.message || 'Merchant registration failed')
            }

        } catch (error) {
            const apiMessage = error?.response?.data?.message || 'Merchant registration failed'

            console.log('Merchant Add Error:', error.response?.data || error)
            toast.error(apiMessage)

        }

    }


    useEffect(() => {

        const fetchCategories = async () => {

            try {

                const response = await API.get(
                    'api/category-list'
                )

                setCategories(
                    response.data.data || response.data
                )

            } catch (error) {

                console.log(
                    'Category Fetch Error:',
                    error.response?.data || error
                )

            }

        }

        fetchCategories()

    }, [])
    return (
        <>
            <AppToaster />

            {mapLoadError && (
                <div className="card" style={{ maxWidth: 1400, margin: '0 auto' }}>
                    Failed to load Google Maps. Please check the Maps API key.
                </div>
            )}

            {!mapLoadError && !isMapLoaded && (
                <div className="card" style={{ maxWidth: 1400, margin: '0 auto' }}>
                    Loading map...
                </div>
            )}

            {isMapLoaded && (
                <div
                    className="card"
                    style={{
                        maxWidth: 1400,
                        margin: '0 auto',
                        background: '#fff',
                        borderRadius: 16,
                        boxShadow: '0 4px 24px rgba(255,77,128,0.06)'
                    }}
                >
                    <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between' }}>
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
                            <NavLink to="/merchants" style={{ color: 'var(--primary)' }}>
                                Merchants
                            </NavLink>
                            <i className="fas fa-chevron-right" style={{ fontSize: '0.7rem' }} />
                            <span>Register New Merchant</span>
                        </div>

                        <div className="flex-between" style={{ gap: 20, flexWrap: 'wrap' }}>


                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => navigate('/merchants')}
                            >
                                <i className="fas fa-arrow-left" /> Back to Merchants
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div
                            className="form-grid-2col"
                            style={{ marginBottom: 24 }}
                        >
                            <article className="upload-card">
                                <div className="upload-card-icon">
                                    {
                                        profilePreview
                                            ? <img src={profilePreview} alt="Profile" />
                                            : <i className="fas fa-user" />
                                    }
                                </div>

                                <div className="upload-card-body">
                                    <h4 className="upload-card-title">
                                        Merchant Profile Photo
                                    </h4>

                                    <p className="upload-card-text">
                                        Use a clear portrait or logo image to help identify the merchant profile.
                                    </p>

                                    <label className="custom-file-upload">
                                        <input
                                            type="file"
                                            name="profilePhoto"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            hidden
                                        />

                                        <i className="fas fa-cloud-upload-alt" />

                                        <span>
                                            Upload Profile Photo
                                        </span>
                                    </label>

                                    <span className="upload-note">
                                        JPG, PNG up to 1MB
                                    </span>
                                </div>
                            </article>

                            <article className="upload-card">
                                <div className="upload-card-icon upload-card-icon--square">
                                    {
                                        logoPreview
                                            ? <img src={logoPreview} alt="Logo" />
                                            : <i className="fas fa-store" />
                                    }
                                </div>

                                <div className="upload-card-body">
                                    <h4 className="upload-card-title">
                                        Business Brand Logo
                                    </h4>

                                    <p className="upload-card-text">
                                        Add the brand logo that will appear on merchant-facing pages and reports.
                                    </p>

                                    <label className="custom-file-upload">
                                        <input
                                            type="file"
                                            name="businessLogo"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            hidden
                                        />

                                        <i className="fas fa-cloud-upload-alt" />

                                        <span>
                                            Upload Brand Logo
                                        </span>
                                    </label>

                                    <span className="upload-note">
                                        JPG, PNG up to 1MB
                                    </span>
                                </div>
                            </article>
                        </div>

                        <div
                            style={{
                                fontWeight: 700,
                                color: '#e91e63',
                                marginBottom: 8,
                                marginTop: 18,
                                fontSize: 16
                            }}
                        >
                            Account Information
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <input
                                    name="ownerName"
                                    type="text"
                                    value={form.ownerName}
                                    onChange={handleChange}
                                    className="form-control"
                                    placeholder=" "
                                    required
                                />

                                <label className="form-label">
                                    Business Owner Name
                                </label>
                            </div>

                            <div className="form-group">
                                <input
                                    name="email"
                                    type="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    className="form-control"
                                    placeholder=" "
                                    required
                                />

                                <label className="form-label">
                                    Email Address
                                </label>
                            </div>



                            <PhoneNumberField
                                value={form.phone}
                                countryCode={form.countryCode}

                                onChange={(value, countryCode) =>

                                    setForm((prev) => ({

                                        ...prev,

                                        phone: value || '',
                                        countryCode: countryCode || ''

                                    }))

                                }
                            />

                            <div className="form-group">
                                <input
                                    name="password"
                                    type="password"
                                    value={form.password}
                                    onChange={handleChange}
                                    className="form-control"
                                    placeholder=" "
                                    required
                                />

                                <label className="form-label">
                                    Account Password
                                </label>
                            </div>
                        </div>

                        <div
                            style={{
                                fontWeight: 700,
                                color: '#e91e63',
                                marginBottom: 8,
                                marginTop: 18,
                                fontSize: 16
                            }}
                        >
                            Business Details
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <input
                                    name="businessName"
                                    type="text"
                                    value={form.businessName}
                                    onChange={handleChange}
                                    className="form-control"
                                    placeholder=" "
                                    required
                                />

                                <label className="form-label">
                                    Business Name
                                </label>
                            </div>

                            <div className="form-group">
                                <input
                                    name="serviceProvided"
                                    type="text"
                                    value={form.serviceProvided}
                                    onChange={handleChange}
                                    className="form-control"
                                    placeholder=" "
                                    required
                                />

                                <label className="form-label">
                                    Service Provided
                                </label>
                            </div>

                            <div className="form-group-classic">

                                <label className="form-label-classic">
                                    Business Category
                                </label>

                                <select
                                    name="category"
                                    value={form.category}
                                    onChange={handleChange}
                                    className="form-select"
                                    required
                                >

                                    <option value="">
                                        Select Category
                                    </option>

                                    {categories.map((item) => (

                                        <option
                                            key={item.id}
                                            value={item.id}
                                        >
                                            {item.name}
                                        </option>

                                    ))}

                                </select>

                            </div>

                            <article className="upload-card upload-card--documents">
                                <div className="upload-card-icon upload-card-icon--square">
                                    <i className="fas fa-file-alt" />
                                </div>

                                <div className="upload-card-body">
                                    <h4 className="upload-card-title">
                                        Upload Supporting Documents
                                    </h4>

                                    <p className="upload-card-text">
                                        Upload GST certificate, business license, ID proof, or verification documents.
                                    </p>

                                    <label className="custom-file-upload">
                                        <input
                                            type="file"
                                            name="kycDocument"
                                            accept=".pdf,.jpg,.jpeg,.png"
                                            onChange={handleFileChange}
                                            hidden
                                        />

                                        <i className="fas fa-cloud-upload-alt" />

                                        <span>
                                            {
                                                form.kycDocument
                                                    ? form.kycDocument.name
                                                    : 'Choose Document'
                                            }
                                        </span>
                                    </label>

                                    {
                                        form.kycDocument && (
                                            <div className="document-upload-success">
                                                <i className="fas fa-check-circle"></i>

                                                <span>
                                                    Document uploaded successfully
                                                </span>
                                            </div>
                                        )
                                    }

                                    <span className="upload-note">
                                        PDF, JPG, PNG up to 1MB
                                    </span>
                                </div>
                            </article>
                        </div>

                        <div
                            style={{
                                fontWeight: 700,
                                color: '#e91e63',
                                marginBottom: 8,
                                marginTop: 18,
                                fontSize: 16
                            }}
                        >
                            Corporate Address
                        </div>

                        <CorporateAddressField
                            form={form}
                            onInputChange={handleChange}
                            onAutocompleteLoad={(auto) => setAutocomplete(auto)}
                            onPlaceChanged={handlePlaceChanged}
                            onMapClick={(event) => {
                                if (event.latLng) {
                                    updateLocationDetails(event.latLng.lat(), event.latLng.lng())
                                }
                            }}
                            onMarkerDragEnd={handleMarkerDragEnd}
                            center={center}
                            mapContainerStyle={mapContainerStyle}
                        />

                        <div
                            style={{
                                marginTop: 30,
                                display: 'flex',
                                justifyContent: 'flex-end',
                                gap: 12,
                                borderTop: '1px solid rgba(255,77,128,0.08)',
                                paddingTop: 20
                            }}
                        >
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => navigate('/merchants')}
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                className="btn btn-primary"
                            >
                                Save & Activate
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </>
    )
}
