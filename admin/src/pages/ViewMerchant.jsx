import { useEffect, useState } from 'react'

import {
    NavLink,
    useNavigate,
    useParams
} from 'react-router-dom'

import API from '../api'

export default function ViewMerchant() {

    const navigate = useNavigate()

    const { id } = useParams()

    const [search, setSearch] = useState('')

    const [merchantData, setMerchantData] = useState(null)

    const [branchesData, setBranchesData] = useState([])

    const [editModal, setEditModal] = useState(false)

    const [addModal, setAddModal] = useState(false)

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

    }, [])
    const fetchMerchant = async () => {

        try {

            const response = await API.post(

                'merchant-fetch-id',

                {
                    id: id
                }

            )

            // console.log(response.data)

            if (response.data.status === 1) {

                const merchant =
                    response.data.data

                setMerchantData(merchant)

                setBranchesData(
                    merchant.Branches || []
                )

            }

        } catch (err) {

            console.log(
                "Error:",
                err.response?.data || err.message
            )

        }

    }

    const filteredBranches =
        branchesData.filter((branch) =>

            branch.name
                .toLowerCase()
                .includes(search.toLowerCase()) ||

            branch.address
                .toLowerCase()
                .includes(search.toLowerCase())

        )

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

    const handleChange = (e) => {

        const { name, value } = e.target

        setSelectedBranch((prev) => ({

            ...prev,

            [name]: value

        }))

    }



    return (
        <>

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

                    <span>Starbucks Coffee</span>

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

                <div className="merchant-profile-info">

                    <div className="cell-avatar merchant-avatar">
                        M
                    </div>

                    <div className="cell-info" style={{ width: '100%' }}>

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

                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))',
                                gap: '14px',
                                marginTop: '18px'
                            }}
                        >

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
                                    Category
                                </small>

                                <p className="merchant-subtext">
                                    {merchantData?.bus_cat}
                                </p>
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
                                    {merchantData?.createdAt}
                                </p>

                            </div>

                        </div>

                    </div>

                </div>

                <div className="merchant-profile-stats">

                    <div className="merchant-stat-item">

                        <span className="merchant-stat-val val-primary">
                            14
                        </span>

                        <span className="merchant-stat-lbl">
                            Total Branches
                        </span>

                    </div>

                    <div className="merchant-stat-item border-left">

                        <span className="merchant-stat-val">
                            32
                        </span>

                        <span className="merchant-stat-lbl">
                            Receptionists
                        </span>

                    </div>

                    <div className="merchant-stat-item border-left">

                        <span className="merchant-stat-val">
                            12.4k
                        </span>

                        <span className="merchant-stat-lbl">
                            Coupons Redeemed
                        </span>

                    </div>

                </div>

            </div>

            <div
                className="flex-between"
                style={{ marginBottom: 20 }}
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
                        Manage physical retail storefront locations.
                    </p>

                </div>

                <button
                    className="btn btn-primary"
                    onClick={() => setAddModal(true)}
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

                            <th>Receptionist Count</th>

                            <th>Coupons Count</th>

                            <th style={{ textAlign: 'right' }}>
                                Actions
                            </th>

                        </tr>

                    </thead>

                    <tbody>

                        {

                            filteredBranches.map((branch) => (

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

                                        <button className="btn-sm-action">

                                            <i className="fas fa-user-shield"></i>

                                            {' '}

                                            {
                                                branch.Receptionists?.length || 0
                                            }

                                            {' '}Staff

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
                                                onClick={() => navigate('/receptionists')}
                                            >

                                                <i className="fas fa-eye"></i>

                                            </button>

                                            <button
                                                className="btn-icon edit"
                                                onClick={() => openEditModal(branch)}
                                            >

                                                <i className="fas fa-edit"></i>

                                            </button>

                                            <button className="btn-icon delete">

                                                <i className="fas fa-trash-alt"></i>

                                            </button>

                                        </div>

                                    </td>

                                </tr>

                            ))

                        }

                    </tbody>

                </table>

            </div>

            {editModal && (

                <div className="modal active">

                    <div
                        className="modal-backdrop"
                        onClick={() => setEditModal(false)}
                    ></div>

                    <div className="modal-content modal-content-lg">

                        <div className="modal-header">

                            <h3 className="modal-title">
                                Edit Branch Details
                            </h3>

                            <i
                                className="fas fa-times modal-close"
                                onClick={() => setEditModal(false)}
                            ></i>

                        </div>

                        <div className="modal-body">

                            <form>

                                <div className="form-row">

                                    <div className="form-group">

                                        <input
                                            type="text"
                                            name="branchName"
                                            value={selectedBranch.branchName}
                                            onChange={handleChange}
                                            className="form-control"
                                            placeholder=" "
                                            required
                                        />

                                        <label className="form-label">
                                            Branch Store Name
                                        </label>

                                    </div>

                                    <div className="form-group-classic">

                                        <label className="form-label-classic">
                                            Activation Status
                                        </label>

                                        <select
                                            name="status"
                                            value={selectedBranch.status}
                                            onChange={handleChange}
                                            className="form-select"
                                            required
                                        >

                                            <option value="active">
                                                Active Storefront
                                            </option>

                                            <option value="pending">
                                                Pending Store Setup
                                            </option>

                                            <option value="suspended">
                                                Suspended
                                            </option>

                                        </select>

                                    </div>

                                </div>

                                <div className="form-row">

                                    <div className="form-group">

                                        <input
                                            type="text"
                                            name="address"
                                            value={selectedBranch.address}
                                            onChange={handleChange}
                                            className="form-control"
                                            placeholder=" "
                                            required
                                        />

                                        <label className="form-label">
                                            Physical Store Address
                                        </label>

                                    </div>

                                    <div className="form-group">

                                        <input
                                            type="url"
                                            name="map"
                                            value={selectedBranch.map}
                                            onChange={handleChange}
                                            className="form-control"
                                            placeholder=" "
                                        />

                                        <label className="form-label">
                                            Google Map Link
                                        </label>

                                    </div>

                                </div>

                                <div className="form-row">

                                    <div className="form-group">

                                        <input
                                            type="tel"
                                            name="contact"
                                            value={selectedBranch.contact}
                                            onChange={handleChange}
                                            className="form-control"
                                            placeholder=" "
                                            required
                                        />

                                        <label className="form-label">
                                            Contact Number
                                        </label>

                                    </div>

                                    <div className="form-group">

                                        <input
                                            type="email"
                                            name="email"
                                            value={selectedBranch.email}
                                            onChange={handleChange}
                                            className="form-control"
                                            placeholder=" "
                                            required
                                        />

                                        <label className="form-label">
                                            Branch Email Address
                                        </label>

                                    </div>

                                </div>

                                <div
                                    className="form-group-classic"
                                    style={{ marginBottom: 16 }}
                                >

                                    <label className="form-label-classic">
                                        Target Audience
                                    </label>

                                    <div className="audience-group">

                                        <input
                                            type="checkbox"
                                            id="edit-aud-male"
                                            className="audience-checkbox"
                                        />

                                        <label
                                            htmlFor="edit-aud-male"
                                            className="audience-badge-label"
                                        >
                                            <i className="fas fa-mars"></i>

                                            {' '}Male
                                        </label>

                                        <input
                                            type="checkbox"
                                            id="edit-aud-female"
                                            className="audience-checkbox"
                                        />

                                        <label
                                            htmlFor="edit-aud-female"
                                            className="audience-badge-label"
                                        >
                                            <i className="fas fa-venus"></i>

                                            {' '}Female
                                        </label>

                                        <input
                                            type="checkbox"
                                            id="edit-aud-kids"
                                            className="audience-checkbox"
                                        />

                                        <label
                                            htmlFor="edit-aud-kids"
                                            className="audience-badge-label"
                                        >
                                            <i className="fas fa-child"></i>

                                            {' '}Kids
                                        </label>

                                        <input
                                            type="checkbox"
                                            id="edit-aud-others"
                                            className="audience-checkbox"
                                        />

                                        <label
                                            htmlFor="edit-aud-others"
                                            className="audience-badge-label"
                                        >
                                            <i className="fas fa-users"></i>

                                            {' '}Others
                                        </label>

                                    </div>

                                </div>

                                <div className="form-group-classic">

                                    <label className="form-label-classic">
                                        Branch Front Image
                                    </label>

                                    <div className="image-upload-wrapper">

                                        <label className="image-upload-dropzone">

                                            <i className="fas fa-cloud-upload-alt upload-icon"></i>

                                            <span className="upload-text">
                                                Drag & drop or Click to upload front image
                                            </span>

                                            <span className="upload-hint">
                                                PNG, JPG, JPEG (Max 2MB)
                                            </span>

                                            <input
                                                type="file"
                                                accept="image/*"
                                                style={{ display: 'none' }}
                                            />

                                        </label>

                                    </div>

                                </div>

                            </form>

                        </div>

                        <div className="modal-footer">

                            <button
                                className="btn btn-secondary"
                                onClick={() => setEditModal(false)}
                            >
                                Cancel
                            </button>

                            <button className="btn btn-primary">
                                Update Details
                            </button>

                        </div>

                    </div>

                </div>

            )}

            {addModal && (

                <div className="modal active">

                    <div
                        className="modal-backdrop"
                        onClick={() => setAddModal(false)}
                    ></div>

                    <div className="modal-content modal-content-lg">

                        <div className="modal-header">

                            <h3 className="modal-title">
                                Register New Branch
                            </h3>

                            <i
                                className="fas fa-times modal-close"
                                onClick={() => setAddModal(false)}
                            ></i>

                        </div>

                        <div className="modal-body">

                            <form>

                                <div className="form-row">

                                    <div className="form-group">

                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder=" "
                                            required
                                        />

                                        <label className="form-label">
                                            Branch Store Name
                                        </label>

                                    </div>

                                    <div className="form-group-classic">

                                        <label className="form-label-classic">
                                            Activation Status
                                        </label>

                                        <select
                                            className="form-select"
                                            required
                                        >

                                            <option value="active">
                                                Active Storefront
                                            </option>

                                            <option value="pending">
                                                Pending Store Setup
                                            </option>

                                            <option value="suspended">
                                                Suspended
                                            </option>

                                        </select>

                                    </div>

                                </div>

                                <div className="form-row">

                                    <div className="form-group">

                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder=" "
                                            required
                                        />

                                        <label className="form-label">
                                            Physical Store Address
                                        </label>

                                    </div>

                                    <div className="form-group">

                                        <input
                                            type="url"
                                            className="form-control"
                                            placeholder=" "
                                        />

                                        <label className="form-label">
                                            Google Map Link
                                        </label>

                                    </div>

                                </div>

                                <div className="form-row">

                                    <div className="form-group">

                                        <input
                                            type="tel"
                                            className="form-control"
                                            placeholder=" "
                                            required
                                        />

                                        <label className="form-label">
                                            Contact Number
                                        </label>

                                    </div>

                                    <div className="form-group">

                                        <input
                                            type="email"
                                            className="form-control"
                                            placeholder=" "
                                            required
                                        />

                                        <label className="form-label">
                                            Branch Email Address
                                        </label>

                                    </div>

                                </div>

                                <div
                                    className="form-group-classic"
                                    style={{ marginBottom: 16 }}
                                >

                                    <label className="form-label-classic">
                                        Target Audience
                                    </label>

                                    <div className="audience-group">

                                        <input
                                            type="checkbox"
                                            id="aud-male"
                                            className="audience-checkbox"
                                        />

                                        <label
                                            htmlFor="aud-male"
                                            className="audience-badge-label"
                                        >
                                            <i className="fas fa-mars"></i>

                                            {' '}Male
                                        </label>

                                        <input
                                            type="checkbox"
                                            id="aud-female"
                                            className="audience-checkbox"
                                        />

                                        <label
                                            htmlFor="aud-female"
                                            className="audience-badge-label"
                                        >
                                            <i className="fas fa-venus"></i>

                                            {' '}Female
                                        </label>

                                        <input
                                            type="checkbox"
                                            id="aud-kids"
                                            className="audience-checkbox"
                                        />

                                        <label
                                            htmlFor="aud-kids"
                                            className="audience-badge-label"
                                        >
                                            <i className="fas fa-child"></i>

                                            {' '}Kids
                                        </label>

                                        <input
                                            type="checkbox"
                                            id="aud-others"
                                            className="audience-checkbox"
                                        />

                                        <label
                                            htmlFor="aud-others"
                                            className="audience-badge-label"
                                        >
                                            <i className="fas fa-users"></i>

                                            {' '}Others
                                        </label>

                                    </div>

                                </div>

                                <div className="form-group-classic">

                                    <label className="form-label-classic">
                                        Branch Front Image
                                    </label>

                                    <div className="image-upload-wrapper">

                                        <label className="image-upload-dropzone">

                                            <i className="fas fa-cloud-upload-alt upload-icon"></i>

                                            <span className="upload-text">
                                                Drag & drop or Click to upload front image
                                            </span>

                                            <span className="upload-hint">
                                                PNG, JPG, JPEG (Max 2MB)
                                            </span>

                                            <input
                                                type="file"
                                                accept="image/*"
                                                style={{ display: 'none' }}
                                            />

                                        </label>

                                    </div>

                                </div>

                            </form>

                        </div>

                        <div className="modal-footer">

                            <button
                                className="btn btn-secondary"
                                onClick={() => setAddModal(false)}
                            >
                                Cancel
                            </button>

                            <button className="btn btn-primary">
                                Save Branch
                            </button>

                        </div>

                    </div>

                </div>

            )}

        </>
    )
}