import { useState } from 'react'

const categoryRows = [
    {
        id: 1,
        name: 'Cafe & Restaurants',
        icon: 'fa-utensils',
        merchants: 5,
        description: 'Dining outlets, bakeries, coffee shops, and fast food chains.',
        status: 'Active'
    },
    {
        id: 2,
        name: 'Fashion & Retail',
        icon: 'fa-tshirt',
        merchants: 3,
        description: 'Clothing stores, footwear brands, boutiques, and malls.',
        status: 'Active'
    },
    {
        id: 3,
        name: 'Hotel & Tourism',
        icon: 'fa-hotel',
        merchants: 2,
        description: 'Resorts, budget hostels, boutique stays, and tour agencies.',
        status: 'Pending'
    },
    {
        id: 4,
        name: 'Beauty & Wellness',
        icon: 'fa-spa',
        merchants: 0,
        description: 'Spa lounges, massage parlors, saloons, and fitness gyms.',
        status: 'Active'
    }
]

export default function Categories() {

    const [showAddModal, setShowAddModal] = useState(false)

    const [showEditModal, setShowEditModal] = useState(false)

    const [showCategoryView, setShowCategoryView] = useState(false)

    const [selectedCategory, setSelectedCategory] = useState(null)

    const openEditModal = (category) => {

        setSelectedCategory(category)

        setShowEditModal(true)
    }

    const openViewModal = (category) => {

        setSelectedCategory(category)

        setShowCategoryView(true)
    }

    return (
        <>

            <div
                className="flex-between"
                style={{
                    marginBottom: 24,
                    gap: 20,
                    flexWrap: 'wrap'
                }}
            >

                <div
                    className="flex-row gap-md"
                    style={{
                        flex: 1,
                        flexWrap: 'nowrap'
                    }}
                >

                    <div
                        className="search-wrapper"
                        style={{
                            marginBottom: 0,
                            maxWidth: 360,
                            flex: 1,
                            minWidth: 200
                        }}
                    >

                        <i className="fas fa-search search-icon"></i>

                        <input
                            type="text"
                            className="search-input"
                            placeholder="Search categories..."
                        />

                    </div>

                    <div
                        style={{
                            fontSize: '0.82rem',
                            color: 'var(--text-secondary)',
                            fontWeight: 500,
                            display: 'flex',
                            alignItems: 'center'
                        }}
                    >

                        Total Category Segments:

                        <strong style={{ marginLeft: 6 }}>
                            4 Categories
                        </strong>

                    </div>

                </div>

                <div>

                    <button
                        className="btn btn-primary"
                        onClick={() => setShowAddModal(true)}
                    >

                        <i className="fas fa-plus"></i>

                        {' '}Add Category

                    </button>

                </div>

            </div>

            <div className="table-wrapper">

                <table className="data-table">

                    <thead>

                        <tr>

                            <th>Category Name</th>

                            <th>System Icon</th>

                            <th>Merchants Linked</th>

                            <th>Description</th>

                            <th>Status</th>

                            <th style={{ textAlign: 'right' }}>
                                Actions
                            </th>

                        </tr>

                    </thead>

                    <tbody>

                        {categoryRows.map((category) => (

                            <tr key={category.id}>

                                <td>
                                    <strong>{category.name}</strong>
                                </td>

                                <td>

                                    <span
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            width: 36,
                                            height: 36,
                                            borderRadius: 10,
                                            background: 'rgba(255, 77, 128, 0.08)',
                                            color: 'var(--primary)',
                                            fontSize: '1.05rem'
                                        }}
                                    >

                                        <i className={`fas ${category.icon}`}></i>

                                    </span>

                                </td>

                                <td>

                                    <strong
                                        style={{
                                            color: 'var(--text-primary)'
                                        }}
                                    >
                                        {category.merchants} Brands
                                    </strong>

                                </td>

                                <td>{category.description}</td>

                                <td>

                                    <span
                                        className={`badge ${category.status === 'Active'
                                            ? 'active'
                                            : 'pending'
                                            }`}
                                    >
                                        {category.status}
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
                                            className="btn-icon view"
                                            title="View Category Details"
                                            onClick={() => openViewModal(category)}
                                        >
                                            <i className="fas fa-eye"></i>
                                        </button>

                                        <button
                                            className="btn-icon edit"
                                            title="Edit Category"
                                            onClick={() => openEditModal(category)}
                                        >
                                            <i className="fas fa-edit"></i>
                                        </button>

                                        <button
                                            className="btn-icon delete"
                                            title="Delete Category"
                                        >
                                            <i className="fas fa-trash-alt"></i>
                                        </button>

                                    </div>

                                </td>

                            </tr>

                        ))}

                    </tbody>

                </table>

            </div>

            {
                showAddModal && (

                    <div className="modal active">

                        <div
                            className="modal-backdrop"
                            onClick={() => setShowAddModal(false)}
                        ></div>

                        <div className="modal-content">

                            <div className="modal-header">

                                <h3 className="modal-title">
                                    Create Category Segment
                                </h3>

                                <i
                                    className="fas fa-times modal-close"
                                    onClick={() => setShowAddModal(false)}
                                ></i>

                            </div>

                            <div className="modal-body">

                                <form>

                                    <div className="form-group-classic">

                                        <label className="form-label-classic">
                                            Category Name
                                        </label>

                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="e.g. Cafe & Restaurants"
                                        />

                                    </div>

                                    <div className="form-group-classic">

                                        <label className="form-label-classic">
                                            Description / Summary
                                        </label>

                                        <textarea
                                            className="form-control"
                                            style={{
                                                height: 70,
                                                resize: 'none',
                                                padding: '10px 12px'
                                            }}
                                            placeholder="Provide a brief description..."
                                        ></textarea>

                                    </div>

                                </form>

                            </div>

                            <div className="modal-footer">

                                <button
                                    className="btn btn-secondary"
                                    onClick={() => setShowAddModal(false)}
                                >
                                    Cancel
                                </button>

                                <button className="btn btn-primary">
                                    Save Category
                                </button>

                            </div>

                        </div>

                    </div>

                )
            }

            {
                showEditModal && selectedCategory && (

                    <div className="modal active">

                        <div
                            className="modal-backdrop"
                            onClick={() => setShowEditModal(false)}
                        ></div>

                        <div className="modal-content">

                            <div className="modal-header">

                                <h3 className="modal-title">
                                    Edit Category Segment
                                </h3>

                                <i
                                    className="fas fa-times modal-close"
                                    onClick={() => setShowEditModal(false)}
                                ></i>

                            </div>

                            <div className="modal-body">

                                <form>

                                    <div className="form-group-classic">

                                        <label className="form-label-classic">
                                            Category Name
                                        </label>

                                        <input
                                            type="text"
                                            className="form-control"
                                            defaultValue={selectedCategory.name}
                                        />

                                    </div>

                                    <div className="form-group-classic">

                                        <label className="form-label-classic">
                                            Description / Summary
                                        </label>

                                        <textarea
                                            className="form-control"
                                            defaultValue={selectedCategory.description}
                                            style={{
                                                height: 70,
                                                resize: 'none',
                                                padding: '10px 12px'
                                            }}
                                        ></textarea>

                                    </div>

                                    <div className="form-group-classic">

                                        <label className="form-label-classic">
                                            Category Status
                                        </label>

                                        <select
                                            className="form-select"
                                            defaultValue={selectedCategory.status}
                                        >

                                            <option value="Active">
                                                Active
                                            </option>

                                            <option value="Pending">
                                                Pending
                                            </option>

                                        </select>

                                    </div>

                                </form>

                            </div>

                            <div className="modal-footer">

                                <button
                                    className="btn btn-secondary"
                                    onClick={() => setShowEditModal(false)}
                                >
                                    Cancel
                                </button>

                                <button className="btn btn-primary">
                                    Update Category
                                </button>

                            </div>

                        </div>

                    </div>

                )
            }

            {
                showCategoryView && selectedCategory && (

                    <div
                        className="modal active"
                        id="global-details-modal"
                    >

                        <div
                            className="modal-backdrop"
                            onClick={() => setShowCategoryView(false)}
                            style={{
                                background: 'rgba(233, 30, 99, 0.05)',
                                backdropFilter: 'blur(10px)'
                            }}
                        ></div>

                        <div
                            className="modal-content"
                            style={{
                                maxWidth: 500
                            }}
                        >

                            <div className="modal-header">

                                <h3 className="modal-title">

                                    <i
                                        className="fas fa-info-circle"
                                        style={{ marginRight: 8 }}
                                    ></i>

                                    Category Details

                                </h3>

                                <button
                                    className="modal-close"
                                    type="button"
                                    onClick={() => setShowCategoryView(false)}
                                >

                                    <i className="fas fa-times"></i>

                                </button>

                            </div>

                            <div className="modal-body">

                                <div
                                    style={{
                                        textAlign: 'center',
                                        marginBottom: 20
                                    }}
                                >

                                    <div
                                        style={{
                                            marginBottom: 12,
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            width: 60,
                                            height: 60,
                                            borderRadius: 14,
                                            background: 'var(--primary-light)',
                                            color: 'var(--primary)',
                                            fontSize: '1.6rem'
                                        }}
                                    >

                                        <i className={`fas ${selectedCategory.icon}`}></i>

                                    </div>

                                    <h4
                                        style={{
                                            fontSize: '1.15rem',
                                            fontWeight: 700,
                                            margin: 0
                                        }}
                                    >
                                        {selectedCategory.name}
                                    </h4>

                                    <span
                                        style={{
                                            fontSize: '0.8rem',
                                            color: 'var(--text-muted)'
                                        }}
                                    >
                                        {selectedCategory.merchants} Brands Linked
                                    </span>

                                </div>

                                <div className="details-grid">

                                    <div
                                        className="details-item"
                                        style={{
                                            flexDirection: 'column',
                                            alignItems: 'flex-start',
                                            gap: 4
                                        }}
                                    >

                                        <span className="details-label">
                                            Description
                                        </span>

                                        <span
                                            className="details-value"
                                            style={{
                                                fontWeight: 500,
                                                color: 'var(--text-secondary)',
                                                textAlign: 'left',
                                                lineHeight: 1.4
                                            }}
                                        >
                                            {selectedCategory.description}
                                        </span>

                                    </div>

                                    <div className="details-item">

                                        <span className="details-label">
                                            Category Status
                                        </span>

                                        <span className="details-value">

                                            <span
                                                className={`badge ${selectedCategory.status === 'Active'
                                                    ? 'active'
                                                    : 'pending'
                                                    }`}
                                            >
                                                {selectedCategory.status}
                                            </span>

                                        </span>

                                    </div>

                                </div>

                            </div>

                            <div className="modal-footer">

                                <button
                                    className="btn btn-secondary"
                                    type="button"
                                    onClick={() => setShowCategoryView(false)}
                                >
                                    Close Details
                                </button>

                            </div>

                        </div>

                    </div>

                )
            }

        </>
    )
}