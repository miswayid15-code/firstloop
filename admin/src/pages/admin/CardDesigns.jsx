import { useState, useEffect, useMemo } from 'react'
import { toast } from 'react-hot-toast'
import API from '../../api.js'

export default function CardDesigns() {
    const [cardDesigns, setCardDesigns] = useState([])
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')

    // Modal States
    const [showAddModal, setShowAddModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [selectedCard, setSelectedCard] = useState(null)

    // Form States
    const [addForm, setAddForm] = useState({
        name: '',
        image: null,
        imagePreview: null
    })

    const [editForm, setEditForm] = useState({
        id: '',
        name: '',
        status: 1,
        image: null,
        imagePreview: null
    })

    // Fetch Card Designs List (POST admin/card-design/list)
    const fetchCardDesigns = async () => {
        setLoading(true)
        try {
            const response = await API.post('admin/card-design/list')
            if (response.data && response.data.status === 1) {
                setCardDesigns(response.data.data || [])
            } else {
                setCardDesigns([])
            }
        } catch (err) {
            console.error('Fetch Card Designs Error:', err.response?.data || err.message)
            toast.error(err.response?.data?.message || 'Failed to load card designs')
            setCardDesigns([])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchCardDesigns()
    }, [])

    // Filtered Card Designs
    const filteredDesigns = useMemo(() => {
        return cardDesigns.filter(card => {
            const matchesSearch = card.name ? card.name.toLowerCase().includes(searchTerm.toLowerCase()) : true
            const matchesStatus =
                statusFilter === 'all' ||
                (statusFilter === 'active' && Number(card.status) === 1) ||
                (statusFilter === 'inactive' && Number(card.status) === 0)
            return matchesSearch && matchesStatus
        })
    }, [cardDesigns, searchTerm, statusFilter])

    // Image File Handlers
    const handleAddImageChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            setAddForm(prev => ({
                ...prev,
                image: file,
                imagePreview: URL.createObjectURL(file)
            }))
        }
    }

    const handleEditImageChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            setEditForm(prev => ({
                ...prev,
                image: file,
                imagePreview: URL.createObjectURL(file)
            }))
        }
    }

    // Submit Add Card Design (POST admin/card-design/create)
    const handleCreateCardDesign = async (e) => {
        e.preventDefault()

        if (!addForm.name || !addForm.name.trim()) {
            toast.error('Card design name is required')
            return
        }

        setSubmitting(true)
        try {
            const formData = new FormData()
            formData.append('name', addForm.name.trim())
            if (addForm.image) {
                formData.append('image', addForm.image)
            }


            
            const response = await API.post('admin/card-design/create', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            })

            if (response.data && response.data.status === 1) {
                toast.success(response.data.message || 'Card design created successfully')
                setShowAddModal(false)
                setAddForm({ name: '', image: null, imagePreview: null })
                fetchCardDesigns()
            } else {
                toast.error(response.data?.message || 'Failed to create card design')
            }
        } catch (err) {
            console.error('Create Card Design Error:', err.response?.data || err.message)
            toast.error(err.response?.data?.message || 'Something went wrong while creating card design')
        } finally {
            setSubmitting(false)
        }
    }

    // Open Edit Modal
    const handleOpenEditModal = (card) => {
        setSelectedCard(card)
        setEditForm({
            id: card.id,
            name: card.name || '',
            status: card.status,
            image: null,
            imagePreview: card.image || null
        })
        setShowEditModal(true)
    }

    // Submit Update Card Design (POST admin/card-design/update)
    const handleUpdateCardDesign = async (e) => {
        e.preventDefault()

        if (!editForm.id) {
            toast.error('Card design ID is required')
            return
        }

        if (!editForm.name || !editForm.name.trim()) {
            toast.error('Card design name is required')
            return
        }

        setSubmitting(true)
        try {
            const formData = new FormData()
            formData.append('id', editForm.id)
            formData.append('name', editForm.name.trim())

            if (editForm.image) {
                formData.append('image', editForm.image)
            }

            const response = await API.post('admin/card-design/update', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            })

            if (response.data && response.data.status === 1) {
                toast.success(response.data.message || 'Card design updated successfully')
                setShowEditModal(false)
                setEditForm({ id: '', name: '', status: 1, image: null, imagePreview: null })
                fetchCardDesigns()
            } else {
                toast.error(response.data?.message || 'Failed to update card design')
            }
        } catch (err) {
            console.error('Update Card Design Error:', err.response?.data || err.message)
            toast.error(err.response?.data?.message || 'Something went wrong while updating card design')
        } finally {
            setSubmitting(false)
        }
    }

    // Toggle Status (POST admin/card-design/status-update)
    const handleToggleStatus = async (card) => {
        const newStatus = Number(card.status) === 1 ? 0 : 1
        try {
            const response = await API.post('admin/card-design/status-update', {
                id: card.id,
                status: newStatus
            })

            if (response.data && response.data.status === 1) {
                toast.success(response.data.message || 'Status updated successfully')
                setCardDesigns(prev =>
                    prev.map(item => item.id === card.id ? { ...item, status: newStatus } : item)
                )
            } else {
                toast.error(response.data?.message || 'Failed to update status')
            }
        } catch (err) {
            console.error('Status Update Error:', err.response?.data || err.message)
            toast.error(err.response?.data?.message || 'Error updating card design status')
        }
    }

    // Delete Card Design (POST admin/card-design/delete)
    const handleDeleteCardDesign = async (id, name) => {
        if (!window.confirm(`Are you sure you want to delete card design "${name}"?`)) {
            return
        }

        try {
            const response = await API.post('admin/card-design/delete', { id })

            if (response.data && response.data.status === 1) {
                toast.success(response.data.message || 'Card design deleted successfully')
                setCardDesigns(prev => prev.filter(item => item.id !== id))
            } else {
                toast.error(response.data?.message || 'Failed to delete card design')
            }
        } catch (err) {
            console.error('Delete Card Design Error:', err.response?.data || err.message)
            toast.error(err.response?.data?.message || 'Error deleting card design')
        }
    }

    return (
        <div style={{ paddingBottom: 40 }}>
            {/* Header Area */}
            <div className="flex-between" style={{ gap: 20, flexWrap: 'wrap', marginBottom: 24 }}>
                <div>
                    <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                        Card Designs Management
                    </h2>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>
                        Create, update, toggle status, and manage digital card design templates.
                    </p>
                </div>

                <button
                    type="button"
                    className="btn firstloop-btn-primary"
                    onClick={() => {
                        setAddForm({ name: '', image: null, imagePreview: null })
                        setShowAddModal(true)
                    }}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: '10px' }}
                >
                    <i className="fas fa-plus-circle" />
                    <span>+ Add Card Design</span>
                </button>
            </div>

            {/* Quick Metrics Bar */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: 16,
                    marginBottom: 24
                }}
            >
            </div>

            {/* Filter & Search Controls */}
            <div className="card" style={{ padding: 20, marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                    <div style={{ position: 'relative', width: 280 }}>
                        <i className="fas fa-search" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.8rem' }} />
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Search card designs by name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ paddingLeft: 34, height: 38, fontSize: '0.85rem', borderRadius: 8 }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <select
                            className="form-control"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            style={{ height: 38, fontSize: '0.85rem', borderRadius: 8, width: 160 }}
                        >
                            <option value="all">All Statuses</option>
                            <option value="active">Active Only</option>
                            <option value="inactive">Inactive Only</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Card Designs Table / Grid */}
            <div className="card" style={{ padding: 24 }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                        <i className="fas fa-spinner fa-spin" style={{ fontSize: '1.5rem', marginBottom: 10, display: 'block', color: 'var(--firstloop-primary)' }} />
                        Loading Card Designs...
                    </div>
                ) : filteredDesigns.length > 0 ? (
                    <div className="table-responsive" style={{ border: '1px solid #E2E8F0', borderRadius: 12 }}>
                        <table className="table" style={{ margin: 0 }}>
                            <thead>
                                <tr style={{ background: '#F8FAFC' }}>
                                    <th style={{ padding: '12px 16px', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>SL NO</th>
                                    <th style={{ padding: '12px 16px', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>DESIGN NAME</th>
                                    <th style={{ padding: '12px 16px', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>PREVIEW IMAGE</th>

                                    <th style={{ padding: '12px 16px', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>CREATED DATE</th>
                                    <th style={{ padding: '12px 16px', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>STATUS</th>
                                    <th style={{ padding: '12px 16px', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textAlign: 'right' }}>ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredDesigns.map((card,index) => (
                                    <tr key={card.id} style={{ verticalAlign: 'middle' }}>
                                         <td style={{ padding: '14px 16px' }}>
                                            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                                                {index + 1}
                                            </div>

                                        </td>
                                      
                                        <td style={{ padding: '14px 16px' }}>
                                            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                                                {card.name}
                                            </div>

                                        </td>
                                          <td style={{ padding: '14px 16px' }}>
                                            {card.image ? (
                                                <img
                                                    src={card.image}
                                                    alt={card.name}
                                                    style={{
                                                        width: 72,
                                                        height: 46,
                                                        borderRadius: 8,
                                                        objectFit: 'cover',
                                                        border: '1px solid #E2E8F0',
                                                        boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                                                    }}
                                                />
                                            ) : (
                                                <div
                                                    style={{
                                                        width: 72,
                                                        height: 46,
                                                        borderRadius: 8,
                                                        background: '#F1F5F9',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        color: '#94A3B8',
                                                        fontSize: '1.2rem'
                                                    }}
                                                >
                                                    <i className="fas fa-id-card" />
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ padding: '14px 16px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                                            {card.createdAt ? new Date(card.createdAt).toLocaleDateString() : 'N/A'}
                                        </td>
                                        <td style={{ padding: '14px 16px' }}>
                                            <button
                                                type="button"
                                                onClick={() => handleToggleStatus(card)}
                                                style={{
                                                    background: Number(card.status) === 1 ? '#DEF7EC' : '#FDE8E8',
                                                    color: Number(card.status) === 1 ? '#03543F' : '#9B1C1C',
                                                    border: 'none',
                                                    padding: '4px 12px',
                                                    borderRadius: 12,
                                                    fontSize: '0.75rem',
                                                    fontWeight: 700,
                                                    cursor: 'pointer',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: 6
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        width: 6,
                                                        height: 6,
                                                        borderRadius: '50%',
                                                        background: Number(card.status) === 1 ? '#0E9F6E' : '#F05252'
                                                    }}
                                                />
                                                {Number(card.status) === 1 ? 'Active' : 'Inactive'}
                                            </button>
                                        </td>
                                        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                                <button
                                                    type="button"
                                                    className="btn firstloop-btn-primary"
                                                    onClick={() => handleOpenEditModal(card)}
                                                    style={{ padding: '6px 12px', fontSize: '0.78rem', borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                                >
                                                    <i className="fas fa-edit" />
                                                    Edit
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteCardDesign(card.id, card.name)}
                                                    style={{
                                                        padding: '6px 12px',
                                                        fontSize: '0.78rem',
                                                        borderRadius: 6,
                                                        background: '#FEE2E2',
                                                        color: '#DC2626',
                                                        border: 'none',
                                                        fontWeight: 600,
                                                        cursor: 'pointer',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: 4
                                                    }}
                                                >
                                                    <i className="fas fa-trash-alt" />
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                        <i className="fas fa-folder-open" style={{ fontSize: '2rem', marginBottom: 10, display: 'block', opacity: 0.5 }} />
                        No Card Designs found.
                    </div>
                )}
            </div>

            {/* CREATE CARD DESIGN MODAL (admin/card-design/create) */}
            {showAddModal && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(15, 23, 42, 0.65)',
                        backdropFilter: 'blur(4px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 9999,
                        padding: 20
                    }}
                >
                    <div
                        style={{
                            background: '#FFFFFF',
                            borderRadius: 20,
                            maxWidth: 480,
                            width: '100%',
                            overflow: 'hidden',
                            boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
                            animation: 'fadeIn 0.2s ease'
                        }}
                    >
                        <div style={{ padding: '18px 24px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                                Add New Card Design
                            </h3>
                            <button
                                type="button"
                                onClick={() => setShowAddModal(false)}
                                style={{ background: 'none', border: 'none', fontSize: '1.1rem', color: 'var(--text-muted)', cursor: 'pointer' }}
                            >
                                <i className="fas fa-times" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateCardDesign}>
                            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <div>
                                    <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6, display: 'block' }}>
                                        Card Design Name <span style={{ color: '#EF4444' }}>*</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="e.g. First Design / Wave Floral"
                                        value={addForm.name}
                                        onChange={(e) => setAddForm(prev => ({ ...prev, name: e.target.value }))}
                                        required
                                        style={{ height: 40, fontSize: '0.88rem' }}
                                    />
                                </div>

                                <div>
                                    <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6, display: 'block' }}>
                                        Upload Card Design Image
                                    </label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleAddImageChange}
                                        className="form-control"
                                        style={{ height: 40, fontSize: '0.82rem' }}
                                    />
                                </div>

                                {addForm.imagePreview && (
                                    <div style={{ textAlign: 'center', paddingTop: 8 }}>
                                        <small style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                                            Selected Image Preview
                                        </small>
                                        <img
                                            src={addForm.imagePreview}
                                            alt="Preview"
                                            style={{ maxWidth: '100%', maxHeight: 140, borderRadius: 10, objectFit: 'cover', border: '1px solid #CBD5E1' }}
                                        />
                                    </div>
                                )}
                            </div>

                            <div style={{ padding: '16px 24px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                                <button
                                    type="button"
                                    className="btn firstloop-btn-secondary"
                                    onClick={() => setShowAddModal(false)}
                                    style={{ padding: '8px 18px', borderRadius: 8, fontSize: '0.85rem' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn firstloop-btn-primary"
                                    disabled={submitting}
                                    style={{ padding: '8px 22px', borderRadius: 8, fontSize: '0.85rem' }}
                                >
                                    {submitting ? 'Creating...' : 'Create Card Design'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* EDIT CARD DESIGN MODAL (admin/card-design/update) */}
            {showEditModal && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(15, 23, 42, 0.65)',
                        backdropFilter: 'blur(4px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 9999,
                        padding: 20
                    }}
                >
                    <div
                        style={{
                            background: '#FFFFFF',
                            borderRadius: 20,
                            maxWidth: 480,
                            width: '100%',
                            overflow: 'hidden',
                            boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
                            animation: 'fadeIn 0.2s ease'
                        }}
                    >
                        <div style={{ padding: '18px 24px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                                Edit Card Design #{editForm.id}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setShowEditModal(false)}
                                style={{ background: 'none', border: 'none', fontSize: '1.1rem', color: 'var(--text-muted)', cursor: 'pointer' }}
                            >
                                <i className="fas fa-times" />
                            </button>
                        </div>

                        <form onSubmit={handleUpdateCardDesign}>
                            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <div>
                                    <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6, display: 'block' }}>
                                        Card Design Name <span style={{ color: '#EF4444' }}>*</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Card design name"
                                        value={editForm.name}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                                        required
                                        style={{ height: 40, fontSize: '0.88rem' }}
                                    />
                                </div>

                                <div>
                                    <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6, display: 'block' }}>
                                        Update Image (Optional)
                                    </label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleEditImageChange}
                                        className="form-control"
                                        style={{ height: 40, fontSize: '0.82rem' }}
                                    />
                                </div>

                                {editForm.imagePreview && (
                                    <div style={{ textAlign: 'center', paddingTop: 8 }}>
                                        <small style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                                            Current / New Image Preview
                                        </small>
                                        <img
                                            src={editForm.imagePreview}
                                            alt="Preview"
                                            style={{ maxWidth: '100%', maxHeight: 140, borderRadius: 10, objectFit: 'cover', border: '1px solid #CBD5E1' }}
                                        />
                                    </div>
                                )}
                            </div>

                            <div style={{ padding: '16px 24px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                                <button
                                    type="button"
                                    className="btn firstloop-btn-secondary"
                                    onClick={() => setShowEditModal(false)}
                                    style={{ padding: '8px 18px', borderRadius: 8, fontSize: '0.85rem' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn firstloop-btn-primary"
                                    disabled={submitting}
                                    style={{ padding: '8px 22px', borderRadius: 8, fontSize: '0.85rem' }}
                                >
                                    {submitting ? 'Updating...' : 'Update Card Design'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
