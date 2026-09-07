import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-hot-toast'
import API from '../../api.js'

const STATUS_MAP = {
    0: { label: 'Open', badge: 'pending' },
    1: { label: 'Resolved', badge: 'active' },
    2: { label: 'Rejected', badge: 'declined' },
}

const TYPE_MAP = {
    1: 'Merchant',
    2: 'Reception',
    3: 'Customer',
}

const SUBMIT_TYPE_MAP = {
    1: 'Website',
    2: 'App',
}

const getStatusInfo = (status) =>
    STATUS_MAP[Number(status)] ?? { label: 'Open', badge: 'pending' }

const formatDate = (value) => {
    if (!value) return '-'
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return value
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function Support() {
    const [tickets, setTickets] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [page, setPage] = useState(1)
    const PAGE_SIZE = 10

    // View drawer
    const [selected, setSelected] = useState(null)

    // Update status dialog
    const [updatingId, setUpdatingId] = useState(null)

    // Reply state
    const [reply, setReply] = useState('')
    const [modalStatus, setModalStatus] = useState(0)

    useEffect(() => {
        if (selected) {
            setReply(selected.reply || '')
            setModalStatus(Number(selected.status) === 0 ? 1 : Number(selected.status))
        } else {
            setReply('')
            setModalStatus(1)
        }
    }, [selected])

    useEffect(() => {
        fetchTickets()
    }, [])

    const fetchTickets = async () => {
        try {
            setLoading(true)
            const response = await API.get('admin/support/list')
            const data = response.data || {}
            if (data.status === 1 || data.success) {
                setTickets(Array.isArray(data.data) ? data.data : [])
            } else {
                toast.error(data.message || 'Failed to load support tickets')
            }
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to load support tickets')
        } finally {
            setLoading(false)
        }
    }

    const handleStatusUpdate = async (id, newStatus, currentReply = reply) => {
        try {
            setUpdatingId(id)
            const response = await API.post('admin/support/update-status', {
                support_id: id,
                status: newStatus,
                reply: currentReply,
            })
            const data = response.data || {}
            if (data.status === 1 || data.success) {
                toast.success(data.message || 'Status updated')
                setTickets((prev) =>
                    prev.map((t) => (t.id === id ? { ...t, status: newStatus, reply: currentReply } : t))
                )
                if (selected?.id === id) setSelected((prev) => ({ ...prev, status: newStatus, reply: currentReply }))
            } else {
                toast.error(data.message || 'Failed to update status')
            }
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to update status')
        } finally {
            setUpdatingId(null)
        }
    }

    // Filter & paginate
    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase()
        return tickets.filter((t) => {
            const matchStatus =
                statusFilter === 'all' || Number(t.status) === Number(statusFilter)
            const matchSearch =
                !q ||
                (t.name || '').toLowerCase().includes(q) ||
                (t.email || '').toLowerCase().includes(q) ||
                (t.phone || '').toLowerCase().includes(q) ||
                (t.description || '').toLowerCase().includes(q)
            return matchStatus && matchSearch
        })
    }, [tickets, search, statusFilter])

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

    const startCount = filtered.length ? (page - 1) * PAGE_SIZE + 1 : 0
    const endCount = Math.min(page * PAGE_SIZE, filtered.length)
    const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1)

    const openTickets = tickets.filter((t) => Number(t.status) === 0).length
    const resolvedTickets = tickets.filter((t) => Number(t.status) === 1).length
    const closedTickets = tickets.filter((t) => Number(t.status) === 2).length

    return (
        <>
            {/* Page header */}
            <div style={{ marginBottom: 24 }}>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', fontWeight: 600, margin: 0 }}>
                    Support Tickets
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 6 }}>
                    Manage and respond to customer support requests.
                </p>
            </div>

            {/* Stats strip */}
            <div className="card card-glass merchant-profile-stats merchant-profile-stats-grid" style={{ marginBottom: 20 }}>
                <div className="merchant-stat-item">
                    <span className="merchant-stat-val val-primary">{loading ? '—' : tickets.length}</span>
                    <span className="merchant-stat-lbl">Total Tickets</span>
                </div>
                <div className="merchant-stat-item border-left">
                    <span className="merchant-stat-val" style={{ color: '#f59e0b' }}>{loading ? '—' : openTickets}</span>
                    <span className="merchant-stat-lbl">Open</span>
                </div>
                <div className="merchant-stat-item border-left">
                    <span className="merchant-stat-val" style={{ color: '#10b981' }}>{loading ? '—' : resolvedTickets}</span>
                    <span className="merchant-stat-lbl">Resolved</span>
                </div>
                <div className="merchant-stat-item border-left">
                    <span className="merchant-stat-val" style={{ color: 'var(--text-muted)' }}>{loading ? '—' : closedTickets}</span>
                    <span className="merchant-stat-lbl">Closed</span>
                </div>
            </div>

            {/* Table card */}
            <div className="card">
                {/* Toolbar */}
                <div className="flex-between" style={{ gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
                    <div>
                        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.05rem', fontWeight: 600, margin: 0 }}>
                            All Requests
                        </h3>
                    </div>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <div className="search-wrapper" style={{ marginBottom: 0, minWidth: 220 }}>
                            <i className="fas fa-search search-icon" />
                            <input
                                type="text"
                                className="search-input"
                                placeholder="Search name, email, phone..."
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                            />
                        </div>
                        <select
                            className="form-select"
                            value={statusFilter}
                            onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
                            style={{ minWidth: 140 }}
                        >
                            <option value="all">All Status</option>
                            <option value="0">Open</option>
                            <option value="1">Resolved</option>
                            <option value="2">Closed</option>
                        </select>
                        <button className="btn btn-secondary" onClick={fetchTickets} disabled={loading}>
                            <i className="fas fa-sync-alt" />
                            {' '}Refresh
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Si No</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Type</th>
                                <th>Submit On</th>
                                <th>Description</th>
                                <th>Reply</th>
                                <th>Status</th>
                                <th>Date</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr className="skeleton-row" key={`skel-${i}`}>
                                        {Array.from({ length: 11 }).map((__, ci) => (
                                            <td key={ci}>
                                                <span className="skeleton-text" style={{ width: '80%', display: 'inline-block' }} />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : paginated.length ? (
                                paginated.map((ticket, idx) => {
                                    const statusInfo = getStatusInfo(ticket.status)
                                    const isUpdating = updatingId === ticket.id
                                    return (
                                        <tr key={ticket.id}>
                                            <td><strong>{(page - 1) * PAGE_SIZE + idx + 1}</strong></td>
                                            <td>
                                                <div className="table-cell-profile">
                                                    <div
                                                        className="cell-avatar"
                                                        style={{ width: 32, height: 32, fontSize: '0.75rem', flexShrink: 0 }}
                                                    >
                                                        {(ticket.name || '?').charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="cell-info">
                                                        <span className="cell-name">{ticket.name || '-'}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>{ticket.email || '-'}</td>
                                            <td>{ticket.phone || '-'}</td>
                                            <td>{TYPE_MAP[Number(ticket.type)] || ticket.type || '-'}</td>
                                            <td>{SUBMIT_TYPE_MAP[Number(ticket.submit_type)] || ticket.submit_type || '-'}</td>
                                            <td>
                                                <span
                                                    style={{
                                                        display: 'block',
                                                        maxWidth: 180,
                                                        whiteSpace: 'normal',
                                                        wordBreak: 'break-word',
                                                        cursor: 'pointer',
                                                        color: 'var(--text-muted)',
                                                        fontSize: '0.82rem',
                                                    }}
                                                    title={ticket.description}
                                                    onClick={() => setSelected(ticket)}
                                                >
                                                    {ticket.description || '-'}
                                                </span>
                                            </td>
                                            <td>
                                                <span
                                                    style={{
                                                        display: 'block',
                                                        maxWidth: 180,
                                                        whiteSpace: 'normal',
                                                        wordBreak: 'break-word',
                                                        cursor: 'pointer',
                                                        color: 'var(--text-muted)',
                                                        fontSize: '0.82rem',
                                                    }}
                                                    title={ticket.reply || ''}
                                                    onClick={() => setSelected(ticket)}
                                                >
                                                    {ticket.reply || '-'}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`badge ${statusInfo.badge}`}>
                                                    {statusInfo.label}
                                                </span>
                                            </td>
                                            <td>{formatDate(ticket.created_at)}</td>
                                            <td>
                                                <div className="action-group" style={{ justifyContent: 'flex-end', gap: 6 }}>
                                                    {/* View */}
                                                    <button
                                                        className="btn-icon edit"
                                                        title="View details"
                                                        onClick={() => setSelected(ticket)}
                                                    >
                                                        <i className="fas fa-eye" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })
                            ) : (
                                <tr>
                                    <td colSpan={11} style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-muted)' }}>
                                        <i className="fas fa-headset" style={{ fontSize: 28, marginBottom: 10, display: 'block', opacity: 0.3 }} />
                                        No support tickets found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {!loading && filtered.length > PAGE_SIZE && (
                    <div className="pagination-container">
                        <span className="pagination-text">
                            Showing {startCount}-{endCount} of {filtered.length} results
                        </span>

                        <div className="pagination-controls">
                            <button
                                type="button"
                                className={`btn-page ${page === 1 ? 'disabled' : ''}`}
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                            >
                                <i className="fas fa-chevron-left"></i>
                            </button>

                            {pageNumbers.map((pNum) => (
                                <button
                                    type="button"
                                    key={pNum}
                                    className={`btn-page ${pNum === page ? 'active' : ''}`}
                                    onClick={() => setPage(pNum)}
                                >
                                    {pNum}
                                </button>
                            ))}

                            <button
                                type="button"
                                className={`btn-page ${page === totalPages ? 'disabled' : ''}`}
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                            >
                                <i className="fas fa-chevron-right"></i>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Detail drawer / modal */}
            {selected && (
                <div className="modal active">
                    <div className="modal-backdrop" onClick={() => setSelected(null)} />
                    <div className="modal-content" style={{ maxWidth: 520, width: '100%' }}>
                        <div className="modal-header">
                            <h3 className="modal-title">
                                <i className="fas fa-ticket-alt" style={{ marginRight: 8, color: 'var(--primary)' }} />
                                Ticket #{selected.id}
                            </h3>
                            <button type="button" className="modal-close" onClick={() => setSelected(null)}>
                                <i className="fas fa-times" />
                            </button>
                        </div>

                        <div className="modal-body">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                {/* Status badge */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <span className={`badge ${getStatusInfo(selected.status).badge}`}>
                                        {getStatusInfo(selected.status).label}
                                    </span>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                        {formatDate(selected.created_at)}
                                    </span>
                                </div>

                                {/* Info grid */}
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: '14px 20px',
                                    background: 'var(--bg-secondary, #f8fafc)',
                                    borderRadius: 10,
                                    padding: 16,
                                }}>
                                    <div>
                                        <small className="merchant-sub-label">Name</small>
                                        <p className="merchant-subtext">{selected.name || '-'}</p>
                                    </div>
                                    <div>
                                        <small className="merchant-sub-label">Phone</small>
                                        <p className="merchant-subtext">{selected.phone || '-'}</p>
                                    </div>
                                    <div>
                                        <small className="merchant-sub-label">Email</small>
                                        <p className="merchant-subtext">{selected.email || '-'}</p>
                                    </div>
                                    <div>
                                        <small className="merchant-sub-label">Type</small>
                                        <p className="merchant-subtext">{TYPE_MAP[Number(selected.type)] || selected.type || '-'}</p>
                                    </div>
                                    <div>
                                        <small className="merchant-sub-label">Submit On</small>
                                        <p className="merchant-subtext">{SUBMIT_TYPE_MAP[Number(selected.submit_type)] || selected.submit_type || '-'}</p>
                                    </div>
                                </div>

                                {/* Description */}
                                <div>
                                    <small className="merchant-sub-label">Description</small>
                                    <p className="merchant-subtext" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: '1.65', marginTop: 6 }}>
                                        {selected.description || '-'}
                                    </p>
                                </div>

                                {/* Reply Section */}
                                {Number(selected.status) === 0 ? (
                                    <div>
                                        <small className="merchant-sub-label">Reply</small>
                                        <textarea
                                            id="reply"
                                            name="reply"
                                            className="form-control textarea-field"
                                            placeholder="Type your reply here..."
                                            value={reply}
                                            onChange={(e) => setReply(e.target.value)}
                                            style={{ marginTop: 6 }}
                                        />
                                    </div>
                                ) : (
                                    <div>
                                        <small className="merchant-sub-label">Reply</small>
                                        <p className="merchant-subtext" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: '1.65', marginTop: 6 }}>
                                            {selected.reply || '-'}
                                        </p>
                                    </div>
                                )}

                                {/* Status Section */}
                                {Number(selected.status) === 0 && (
                                    <div>
                                        <small className="merchant-sub-label">Status</small>
                                        <select
                                            className="form-select"
                                            value={modalStatus}
                                            onChange={(e) => setModalStatus(Number(e.target.value))}
                                            style={{ marginTop: 6, width: '100%', height: 40 }}
                                        >
                                            <option value={1}>Resolve</option>
                                            <option value={2}>Reject</option>
                                        </select>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="modal-footer" style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                            {Number(selected.status) === 0 && (
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    disabled={updatingId === selected.id}
                                    onClick={() => handleStatusUpdate(selected.id, modalStatus)}
                                >
                                    {updatingId === selected.id
                                        ? <><i className="fas fa-spinner fa-spin" style={{ marginRight: 6 }} />Submitting...</>
                                        : <><i className="fas fa-check" style={{ marginRight: 6 }} />Submit</>}
                                </button>
                            )}
                            <button type="button" className="btn btn-secondary" onClick={() => setSelected(null)}>
                                Dismiss
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
