import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useNavigate } from 'react-router-dom';

const branchesData = [
    {
        id: 1,
        name: 'Downtown Starbucks',
        address: '410 Broadway Ave, Downtown City',
        status: 'active',
        staff: 6,
        coupons: 4
    },
    {
        id: 2,
        name: 'City Mall Store',
        address: 'Level 2, City Galleria Shopping Mall',
        status: 'active',
        staff: 4,
        coupons: 3
    },
    {
        id: 3,
        name: 'Starbucks Drive-Thru',
        address: '82 North Highway Road, Exit 12',
        status: 'active',
        staff: 8,
        coupons: 5
    },
    {
        id: 4,
        name: 'Financial District Outlet',
        address: 'Exchange Towers Lobby, Financial Rd',
        status: 'pending',
        staff: 0,
        coupons: 0
    }
]

export default function ViewMerchant() {

    const navigate = useNavigate()

    const [search, setSearch] = useState('')

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

    const filteredBranches = branchesData.filter((branch) =>
        branch.name.toLowerCase().includes(search.toLowerCase()) ||
        branch.address.toLowerCase().includes(search.toLowerCase())
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
                        S
                    </div>

                    <div className="cell-info">

                        <div className="merchant-title-row">

                            <h2>Starbucks Coffee</h2>

                            <span className="badge active">
                                Active
                            </span>

                        </div>

                        <p className="merchant-subtext">
                            Beverages & Cafe Franchise • partner@starbucks.com
                        </p>

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

                        {filteredBranches.map((branch) => (

                            <tr key={branch.id}>

                                <td>
                                    <strong>{branch.name}</strong>
                                </td>

                                <td>{branch.address}</td>

                                <td>

                                    <span className={`badge ${branch.status}`}>
                                        {branch.status}
                                    </span>

                                </td>

                                <td>

                                    <button className="btn-sm-action">

                                        <i className="fas fa-user-shield"></i>

                                        {' '}
                                        {branch.staff} Staff

                                    </button>

                                </td>

                                <td>

                                    <button className="btn-sm-action-secondary">

                                        <i className="fas fa-ticket-alt"></i>

                                        {' '}
                                        {branch.coupons} Coupons

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

                        ))}

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