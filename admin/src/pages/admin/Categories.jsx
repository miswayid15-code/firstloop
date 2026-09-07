import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import API from '../../api.js';

export default function Categories() {

    const [categoryData, setCategoryData] = useState([])
    const [couponCategoryData, setCouponCategoryData] = useState([])
    const [loading, setLoading] = useState(true)
    const [couponLoading, setCouponLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [activeTab, setActiveTab] = useState('merchant')
    const [showAddModal, setShowAddModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [showCategoryView, setShowCategoryView] = useState(false)
    const [selectedCategory, setSelectedCategory] = useState(null)
    const [searchTerm, setSearchTerm] = useState('')

    // Form states for add/edit
    const [newCategory, setNewCategory] = useState({
        name: '',
        image: null
    })

    const [editCategory, setEditCategory] = useState({
        id: '',
        name: '',
        status: 1,
        image: null
    })

    const highlightFieldError = (selector) => {
        const element = document.querySelector(selector);
        if (element) {
            element.focus();
            element.classList.add('error-highlight');
            setTimeout(() => {
                element.classList.remove('error-highlight');
            }, 3000);
        }
    }

    // Helper function to check if response is successful
    const isSuccessResponse = (data) => {
        return data && (data.success === true || data.status === 'success' || data.status === 1 || data.status === '1')
    }

    const getImageUrl = (imagePath) => {
        if (!imagePath) return '';
        if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('data:')) {
            return imagePath;
        }
        const baseUrl = import.meta.env.VITE_API_URL || '';
        if (baseUrl && imagePath.startsWith(baseUrl)) {
            return imagePath;
        }
        const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
        return `${baseUrl}/${cleanPath}`;
    }

    const fetchCat = async () => {
        setLoading(true)
        try {
            const response = await API.get('admin/category-list')
            // console.log("Log", response.data)

            if (isSuccessResponse(response.data)) {
                setCategoryData(response.data.data || [])
            } else {
                setCategoryData([])
            }
        } catch (err) {
            console.log("Error:", err.response?.data || err.message)
            setCategoryData([])
        } finally {
            setLoading(false)
        }
    }

    const fetchCouponCat = async () => {
        setCouponLoading(true)
        try {
            const response = await API.get('admin/coupon-category-list')
            // console.log("Coupon Log", response.data)

            if (isSuccessResponse(response.data)) {
                setCouponCategoryData(response.data.data || [])
            } else {
                setCouponCategoryData([])
            }
        } catch (err) {
            console.log("Error fetching coupon categories:", err.response?.data || err.message)
            setCouponCategoryData([])
        } finally {
            setCouponLoading(false)
        }
    }

    const openViewModal = (category) => {
        setSelectedCategory(category)
        setShowCategoryView(true)
    }

    const openEditModal = (category) => {
        setSelectedCategory(category)
        setEditCategory({
            id: category.id,
            name: category.name,
            status: category.status,
            image: null
        })
        setShowEditModal(true)
    }

    const handleAddCategory = async (e) => {
        e.preventDefault()
        if (!newCategory.name || newCategory.name.trim().length < 2) {
            toast.error("Category segment name must be at least 2 characters long")
            highlightFieldError('#add-category-name')
            return
        }
        setSubmitting(true)
        try {
            if (activeTab === 'coupon') {
                const response = await API.post('admin/create-coupon-category', {
                    name: newCategory.name
                })
                if (isSuccessResponse(response.data)) {
                    toast.success(response.data.message || "Coupon category created successfully")
                    await fetchCouponCat()
                    setShowAddModal(false)
                    setNewCategory({ name: '', image: null })
                } else {
                    toast.error(response.data.message || "Failed to create coupon category")
                }
            } else {
                const formData = new FormData()
                formData.append('name', newCategory.name)
                if (newCategory.image) {
                    formData.append('image', newCategory.image)
                } else {
                    formData.append('image', '')
                }

                const response = await API.post('admin/create-category', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                })
                if (isSuccessResponse(response.data)) {
                    toast.success(response.data.message || "Category created successfully")
                    await fetchCat()
                    setShowAddModal(false)
                    setNewCategory({ name: '', image: null })
                } else {
                    toast.error(response.data.message || "Failed to create category")
                }
            }
        } catch (err) {
            const apiMessage = err.response?.data?.message || err.message
            toast.error(apiMessage)
            console.log("Error adding category:", apiMessage)
        } finally {
            setSubmitting(false)
        }
    }

    const handleUpdateCategory = async (e) => {
        e.preventDefault()
        if (!editCategory.name || editCategory.name.trim().length < 2) {
            toast.error("Category segment name must be at least 2 characters long")
            highlightFieldError('#edit-category-name')
            return
        }
        setSubmitting(true)
        try {
            if (activeTab === 'coupon') {
                const response = await API.put('admin/update-coupon-category', {
                    id: editCategory.id,
                    name: editCategory.name,
                    status: editCategory.status
                })
                if (isSuccessResponse(response.data)) {
                    toast.success(response.data.message || "Coupon category updated successfully")
                    await fetchCouponCat()
                    setShowEditModal(false)
                    setSelectedCategory(null)
                } else {
                    toast.error(response.data.message || "Failed to update coupon category")
                }
            } else {
                const formData = new FormData()
                formData.append('id', editCategory.id)
                formData.append('name', editCategory.name)
                formData.append('status', editCategory.status)
                if (editCategory.image) {
                    formData.append('image', editCategory.image)
                } else {
                    formData.append('image', '')
                }

                const response = await API.post('admin/update-category', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                })
                if (isSuccessResponse(response.data)) {
                    toast.success(response.data.message || "Category updated successfully")
                    await fetchCat()
                    setShowEditModal(false)
                    setSelectedCategory(null)
                } else {
                    toast.error(response.data.message || "Failed to update category")
                }
            }
        } catch (err) {
            const apiMessage = err.response?.data?.message || err.message
            toast.error(apiMessage)
            console.log("Error updating category:", apiMessage)
        } finally {
            setSubmitting(false)
        }
    }

    const handleDeleteCategory = async (id) => {
        if (!window.confirm(`Are you sure you want to delete this ${activeTab === 'coupon' ? 'coupon ' : ''}category?`)) {
            return
        }

        try {
            const endpoint = activeTab === 'coupon'
                ? `admin/delete-coupon-category/${id}`
                : `admin/delete-category/${id}`;
            const response = await API.delete(endpoint)
            if (isSuccessResponse(response.data)) {
                toast.success(response.data.message || "Category deleted successfully")
                if (activeTab === 'coupon') {
                    await fetchCouponCat()
                } else {
                    await fetchCat()
                }
            } else {
                toast.error(response.data.message || "Failed to delete category")
            }
        } catch (err) {
            const apiMessage = err.response?.data?.message || err.message
            toast.error(apiMessage)
            console.log("Error deleting category:", apiMessage)
        }
    }

    const handleImageChange = (e, isEdit = false) => {
        const file = e.target.files[0]
        if (file) {
            if (isEdit) {
                setEditCategory({ ...editCategory, image: file })
            } else {
                setNewCategory({ ...newCategory, image: file })
            }
        }
    }

    // Filter categories based on search term
    const filteredCategories = categoryData.filter(category =>
        category.name?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const filteredCouponCategories = couponCategoryData.filter(category =>
        category.name?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    useEffect(() => {
        fetchCat()
        fetchCouponCat()
    }, [])



    return (
        <>

            {/* Tabs for Merchant Categories vs Coupon Categories */}
            <div style={{ display: 'flex', gap: 16, borderBottom: '1px solid var(--border)', marginBottom: 24 }}>
                <button
                    onClick={() => setActiveTab('merchant')}
                    style={{
                        padding: '12px 20px',
                        border: 'none',
                        background: 'none',
                        borderBottom: activeTab === 'merchant' ? '2px solid var(--primary)' : 'none',
                        color: activeTab === 'merchant' ? 'var(--primary)' : 'var(--text-muted)',
                        fontWeight: 600,
                        cursor: 'pointer'
                    }}
                >
                    Merchant Categories
                </button>
                <button
                    onClick={() => setActiveTab('coupon')}
                    style={{
                        padding: '12px 20px',
                        border: 'none',
                        background: 'none',
                        borderBottom: activeTab === 'coupon' ? '2px solid var(--primary)' : 'none',
                        color: activeTab === 'coupon' ? 'var(--primary)' : 'var(--text-muted)',
                        fontWeight: 600,
                        cursor: 'pointer'
                    }}
                >
                    Coupon Categories
                </button>
            </div>

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
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
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
                            {activeTab === 'coupon' ? (
                                couponLoading ? (
                                    <span className="skeleton-text" style={{ width: '60px', display: 'inline-block', height: '14px', marginLeft: 6 }} />
                                ) : (
                                    `${filteredCouponCategories.length} Categories`
                                )
                            ) : (
                                loading ? (
                                    <span className="skeleton-text" style={{ width: '60px', display: 'inline-block', height: '14px', marginLeft: 6 }} />
                                ) : (
                                    `${filteredCategories.length} Categories`
                                )
                            )}
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
                        {activeTab === 'coupon' ? (
                            <tr>
                                <th>Category Name</th>
                                <th>Status</th>
                                <th>Created At</th>
                                <th style={{ textAlign: 'right' }}>
                                    Actions
                                </th>
                            </tr>
                        ) : (
                            <tr>
                                <th>Category Name</th>
                                <th>Image</th>
                                <th>Status</th>
                                <th>Created At</th>
                                <th style={{ textAlign: 'right' }}>
                                    Actions
                                </th>
                            </tr>
                        )}
                    </thead>
                    <tbody>
                        {activeTab === 'coupon' ? (
                            couponLoading ? (
                                Array.from({ length: 5 }).map((_, index) => (
                                    <tr className="skeleton-row" key={`skeleton-coupon-${index}`}>
                                        <td>
                                            <span className="skeleton-text" style={{ width: '120px', display: 'inline-block', height: '14px' }} />
                                        </td>
                                        <td>
                                            <span className="skeleton-text" style={{ width: '70px', display: 'inline-block', height: '14px' }} />
                                        </td>
                                        <td>
                                            <span className="skeleton-text" style={{ width: '90px', display: 'inline-block', height: '14px' }} />
                                        </td>
                                        <td>
                                            <span className="skeleton-text" style={{ width: '80px', display: 'inline-block', height: '14px' }} />
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                filteredCouponCategories?.map((category) => (
                                    <tr key={category.id}>
                                        <td>
                                            <strong>{category.name}</strong>
                                        </td>
                                        <td>
                                            <span
                                                className={`badge ${category.status === 1
                                                    ? "active"
                                                    : "pending"
                                                    }`}
                                            >
                                                {category.status === 1 ? "Active" : "Inactive"}
                                            </span>
                                        </td>
                                        <td>
                                            {new Date(category.created_at).toLocaleDateString()}
                                        </td>
                                        <td>
                                            <div
                                                className="action-group"
                                                style={{
                                                    justifyContent: "flex-end"
                                                }}
                                            >
                                                <button
                                                    className="btn-icon view"
                                                    onClick={() => openViewModal(category)}
                                                >
                                                    <i className="fas fa-eye"></i>
                                                </button>
                                                <button
                                                    className="btn-icon edit"
                                                    onClick={() => openEditModal(category)}
                                                >
                                                    <i className="fas fa-edit"></i>
                                                </button>
                                                <button
                                                    className="btn-icon delete"
                                                    onClick={() => handleDeleteCategory(category.id)}
                                                    style={{ color: 'var(--danger, #dc3545)' }}
                                                    title="Delete Category"
                                                >
                                                    <i className="fas fa-trash-alt"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )
                        ) : (
                            loading ? (
                                Array.from({ length: 5 }).map((_, index) => (
                                    <tr className="skeleton-row" key={`skeleton-${index}`}>
                                        <td>
                                            <span className="skeleton-text" style={{ width: '120px', display: 'inline-block', height: '14px' }} />
                                        </td>
                                        <td>
                                            <div className="cell-avatar skeleton-avatar" style={{ width: '50px', height: '50px', borderRadius: '5px' }} />
                                        </td>
                                        <td>
                                            <span className="skeleton-text" style={{ width: '70px', display: 'inline-block', height: '14px' }} />
                                        </td>
                                        <td>
                                            <span className="skeleton-text" style={{ width: '90px', display: 'inline-block', height: '14px' }} />
                                        </td>
                                        <td>
                                            <span className="skeleton-text" style={{ width: '80px', display: 'inline-block', height: '14px' }} />
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                filteredCategories?.map((category) => (
                                    <tr key={category.id}>
                                        <td>
                                            <strong>{category.name}</strong>
                                        </td>
                                        <td>
                                            {category.image ? (
                                                <img
                                                    src={getImageUrl(category.image)}
                                                    alt={category.name}
                                                    width="50"
                                                    height="50"
                                                    style={{
                                                        objectFit: "cover",
                                                        borderRadius: "5px"
                                                    }}
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                    }}
                                                />
                                            ) : (
                                                ''
                                            )}
                                        </td>
                                        <td>
                                            <span
                                                className={`badge ${category.status === 1
                                                    ? "active"
                                                    : "pending"
                                                    }`}
                                            >
                                                {category.status === 1 ? "Active" : "Inactive"}
                                            </span>
                                        </td>
                                        <td>
                                            {new Date(category.created_at).toLocaleDateString()}
                                        </td>
                                        <td>
                                            <div
                                                className="action-group"
                                                style={{
                                                    justifyContent: "flex-end"
                                                }}
                                            >
                                                <button
                                                    className="btn-icon view"
                                                    onClick={() => openViewModal(category)}
                                                >
                                                    <i className="fas fa-eye"></i>
                                                </button>
                                                <button
                                                    className="btn-icon edit"
                                                    onClick={() => openEditModal(category)}
                                                >
                                                    <i className="fas fa-edit"></i>
                                                </button>
                                                <button
                                                    className="btn-icon delete"
                                                    onClick={() => handleDeleteCategory(category.id)}
                                                    style={{ color: 'var(--danger, #dc3545)' }}
                                                    title="Delete Category"
                                                >
                                                    <i className="fas fa-trash-alt"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )
                        )}
                    </tbody>
                </table>
                {activeTab === 'coupon' ? (
                    !couponLoading && filteredCouponCategories.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '40px' }}>
                            <p>No coupon categories found</p>
                        </div>
                    )
                ) : (
                    !loading && filteredCategories.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '40px' }}>
                            <p>No categories found</p>
                        </div>
                    )
                )}
            </div>

            {/* Add Category Modal */}
            {showAddModal && (
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
                        <form onSubmit={handleAddCategory}>
                            <div className="modal-body">
                                <div className="form-group-classic">
                                    <label className="form-label-classic">
                                        Category Name
                                    </label>
                                    <input
                                        type="text"
                                        id="add-category-name"
                                        className="form-control"
                                        placeholder="e.g. Goods"
                                        value={newCategory.name}
                                        onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                                        required
                                    />
                                </div>

                                {activeTab !== 'coupon' && (
                                    <div className="form-group-classic">
                                        <label className="form-label-classic">
                                            Category Image
                                        </label>
                                        <input
                                            type="file"
                                            className="form-control"
                                            accept="image/*"
                                            onChange={(e) => handleImageChange(e, false)}
                                        />
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setShowAddModal(false)}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={submitting}>
                                    {submitting ? 'Saving...' : 'Save Category'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Category Modal */}
            {showEditModal && selectedCategory && (
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
                        <form onSubmit={handleUpdateCategory}>
                            <div className="modal-body">
                                <div className="form-group-classic">
                                    <label className="form-label-classic">
                                        Category Name
                                    </label>
                                    <input
                                        type="text"
                                        id="edit-category-name"
                                        className="form-control"
                                        value={editCategory.name}
                                        onChange={(e) => setEditCategory({ ...editCategory, name: e.target.value })}
                                        required
                                    />
                                </div>
                                {activeTab !== 'coupon' && (
                                    <div className="form-group-classic">
                                        <label className="form-label-classic">
                                            Category Image
                                        </label>
                                        <input
                                            type="file"
                                            className="form-control"
                                            accept="image/*"
                                            onChange={(e) => handleImageChange(e, true)}
                                        />
                                        {selectedCategory.image && !editCategory.image && getImageUrl(selectedCategory.image) && (
                                            <div style={{ marginTop: 8 }}>
                                                <img
                                                    src={getImageUrl(selectedCategory.image)}
                                                    alt="Current"
                                                    style={{ width: 50, height: 50, borderRadius: 5 }}
                                                />
                                                <small style={{ display: 'block', color: 'var(--text-muted)' }}>
                                                    Current image
                                                </small>
                                            </div>
                                        )}
                                    </div>
                                )}
                                <div className="form-group-classic">
                                    <label className="form-label-classic">
                                        Category Status
                                    </label>
                                    <select
                                        className="form-select"
                                        value={editCategory.status}
                                        onChange={(e) => setEditCategory({ ...editCategory, status: parseInt(e.target.value) })}
                                    >
                                        <option value="1">Active</option>
                                        <option value="0">Inactive</option>
                                    </select>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setShowEditModal(false)}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={submitting}>
                                    {submitting ? 'Saving...' : 'Update Category'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* View Category Modal */}
            {showCategoryView && selectedCategory && (
                <div className="modal active" id="global-details-modal">
                    <div
                        className="modal-backdrop"
                        onClick={() => setShowCategoryView(false)}
                        style={{
                            background: 'rgba(233, 30, 99, 0.05)',
                            backdropFilter: 'blur(10px)'
                        }}
                    ></div>
                    <div className="modal-content" style={{ maxWidth: 500 }}>
                        <div className="modal-header">
                            <h3 className="modal-title">
                                <i className="fas fa-info-circle" style={{ marginRight: 8 }}></i>
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
                            <div style={{ textAlign: 'center', marginBottom: 20 }}>
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
                                    {activeTab !== 'coupon' && selectedCategory.image && getImageUrl(selectedCategory.image) ? (
                                        <img
                                            src={getImageUrl(selectedCategory.image)}
                                            alt={selectedCategory.name}
                                            style={{ width: 50, height: 50, borderRadius: 8 }}
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                            }}
                                        />
                                    ) : (
                                        ''
                                    )}
                                </div>
                                <h4 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>
                                    {selectedCategory.name}
                                </h4>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                    Created: {new Date(selectedCategory.created_at).toLocaleDateString()}
                                </span>
                            </div>
                            <div className="details-grid">
                                <div className="details-item">
                                    <span className="details-label">Category Status</span>
                                    <span className="details-value">
                                        <span className={`badge ${selectedCategory.status === 1 ? 'active' : 'pending'}`}>
                                            {selectedCategory.status === 1 ? 'Active' : 'Inactive'}
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
            )}
        </>
    )
}