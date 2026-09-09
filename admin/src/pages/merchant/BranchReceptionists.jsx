import { useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
// import { INITIAL_BRANCHES, INITIAL_RECEPTIONISTS } from './mockMerchantData'

export default function BranchReceptionists() {
    const { branchId } = useParams()
    const [receptionists, setReceptionists] = useState('')
    const [search, setSearch] = useState('')

    // Identify target branch
    // const targetBranch = INITIAL_BRANCHES.find(b => b.id === branchId) || INITIAL_BRANCHES[0]

    // Modal State
    const [modalOpen, setModalOpen] = useState(false)
    const [form, setForm] = useState({
        id: null,
        name: '',
        email: '',
        phone: '',
        staffId: '',
        shift: 'Morning (08:00 AM - 04:00 PM)',
        status: 'Active'
    })

    const branchReceptionists = useMemo(() => {
        return receptionists.filter(r => r.branchId === targetBranch.id)
            .filter(r =>
                r.name.toLowerCase().includes(search.toLowerCase()) ||
                r.email.toLowerCase().includes(search.toLowerCase()) ||
                r.staffId.toLowerCase().includes(search.toLowerCase())
            )
    }, [receptionists, targetBranch.id, search])

    const handleOpenCreate = () => {
        setForm({
            id: null,
            name: '',
            email: '',
            phone: '',
            staffId: `STF-BR-${Math.floor(10 + Math.random() * 90)}`,
            shift: 'Morning (08:00 AM - 04:00 PM)',
            status: 'Active'
        })
        setModalOpen(true)
    }

    const handleOpenEdit = (staff) => {
        setForm({
            id: staff.id,
            name: staff.name,
            email: staff.email,
            phone: staff.phone,
            staffId: staff.staffId,
            shift: staff.shift,
            status: staff.status
        })
        setModalOpen(true)
    }

    const handleSave = (e) => {
        e.preventDefault()
        if (!form.name.trim() || !form.email.trim()) {
            alert('Please provide name and email')
            return
        }

        if (form.id) {
            setReceptionists(prev => prev.map(item => item.id === form.id ? {
                ...item,
                name: form.name,
                email: form.email,
                phone: form.phone,
                staffId: form.staffId,
                shift: form.shift,
                status: form.status
            } : item))
        } else {
            const newStaff = {
                id: `rec-${Date.now()}`,
                branchId: targetBranch.id,
                branchName: targetBranch.name,
                name: form.name,
                email: form.email,
                phone: form.phone || '+1 (555) 000-0000',
                avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120',
                staffId: form.staffId,
                shift: form.shift,
                status: form.status,
                joinedDate: new Date().toISOString().split('T')[0]
            }
            setReceptionists(prev => [newStaff, ...prev])
        }
        setModalOpen(false)
    }

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to remove this receptionist from the branch staff?')) {
            setReceptionists(prev => prev.filter(r => r.id !== id))
        }
    }

    return (
        <div style={{ paddingBottom: 40 }}>
            {/* Breadcrumbs */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 500, marginBottom: 12 }}>
                <Link to="/merchant/branches" style={{ color: 'var(--firstloop-primary)', textDecoration: 'none', fontWeight: 600 }}>
                    Branch List
                </Link>
                <i className="fas fa-chevron-right" style={{ fontSize: '0.7rem' }} />
                <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{targetBranch.name}</span>
                <i className="fas fa-chevron-right" style={{ fontSize: '0.7rem' }} />
                <span>Receptionists</span>
            </div>

            {/* Branch Header Banner */}
            <div
                className="card mb-4"
                style={{
                    padding: 20,
                    borderRadius: 18,
                    background: 'var(--firstloop-primary-light)',
                    border: '1px solid rgba(14, 136, 184, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 16
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 50, height: 50, borderRadius: 14, background: 'var(--firstloop-primary)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                        <i className="fas fa-user-friends" style={{ fontSize: '1.3rem' }} />
                    </div>
                    <div>
                        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                            Receptionists for {targetBranch.name}
                        </h2>
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 2, margin: 0 }}>
                            Location: {targetBranch.address}, {targetBranch.city} &bull; Manager: {targetBranch.manager}
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    className="btn firstloop-btn-primary"
                    onClick={handleOpenCreate}
                    style={{ padding: '10px 18px', borderRadius: 10, display: 'inline-flex', alignItems: 'center', gap: 8 }}
                >
                    <i className="fas fa-user-plus" />
                    <span>+ Add Receptionist Staff</span>
                </button>
            </div>

            {/* Search Bar */}
            <div className="card mb-4" style={{ padding: 16, borderRadius: 14 }}>
                <div style={{ position: 'relative', maxWidth: 400 }}>
                    <i className="fas fa-search" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Search receptionists by name, email or Staff ID..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ paddingLeft: 40, height: 42, borderRadius: 10, fontSize: '0.88rem' }}
                    />
                </div>
            </div>

            {/* Receptionists Table */}
            <div className="card" style={{ borderRadius: 16, overflow: 'hidden' }}>
                <div className="table-responsive">
                    <table className="table table-custom align-middle mb-0" style={{ fontSize: '0.85rem' }}>
                        <thead>
                            <tr style={{ background: 'rgba(14, 136, 184, 0.05)' }}>
                                <th>Receptionist Staff</th>
                                <th>Staff ID</th>
                                <th>Contact Information</th>
                                <th>Assigned Shift</th>
                                <th>Joined Date</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {branchReceptionists.length > 0 ? (
                                branchReceptionists.map((rec) => (
                                    <tr key={rec.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                <img
                                                    src={rec.avatar}
                                                    alt={rec.name}
                                                    style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--firstloop-primary)' }}
                                                />
                                                <div>
                                                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{rec.name}</div>
                                                    <small style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Front Desk Staff</small>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ fontWeight: 700, color: 'var(--firstloop-primary)' }}>{rec.staffId}</td>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>{rec.email}</div>
                                            <small style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{rec.phone}</small>
                                        </td>
                                        <td style={{ fontWeight: 600 }}>{rec.shift}</td>
                                        <td style={{ color: 'var(--text-muted)' }}>{rec.joinedDate}</td>
                                        <td>
                                            <span className="badge" style={{ background: rec.status === 'Active' ? 'var(--status-success-bg)' : 'var(--status-warning-bg)', color: rec.status === 'Active' ? 'var(--status-success)' : 'var(--status-warning)', fontWeight: 800 }}>
                                                {rec.status}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 8 }}>
                                                <button
                                                    type="button"
                                                    className="btn btn-sm"
                                                    onClick={() => handleOpenEdit(rec)}
                                                    style={{ background: '#F1F5F9', color: 'var(--text-primary)', fontWeight: 700, borderRadius: 8, fontSize: '0.78rem' }}
                                                >
                                                    <i className="fas fa-edit" />
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn btn-sm"
                                                    onClick={() => handleDelete(rec.id)}
                                                    style={{ background: 'var(--status-danger-bg)', color: 'var(--status-danger)', borderRadius: 8, fontSize: '0.78rem' }}
                                                >
                                                    <i className="fas fa-trash-alt" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>
                                        No receptionists found for this branch. Click <strong>+ Add Receptionist Staff</strong> to assign staff.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ADD / EDIT RECEPTIONIST MODAL */}
            {modalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                    <div style={{ width: '100%', maxWidth: 460, background: '#FFFFFF', borderRadius: 20, padding: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
                                {form.id ? 'Edit Receptionist Staff' : 'Add Receptionist Staff'}
                            </h3>
                            <button type="button" onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', color: 'var(--text-muted)', cursor: 'pointer' }}>&times;</button>
                        </div>

                        <form onSubmit={handleSave}>
                            <div className="form-group mb-3">
                                <label style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: 4 }}>Staff Name</label>
                                <input type="text" className="form-control" placeholder="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                            </div>

                            <div className="form-group mb-3">
                                <label style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: 4 }}>Staff ID Code</label>
                                <input type="text" className="form-control" value={form.staffId} onChange={(e) => setForm({ ...form, staffId: e.target.value })} required />
                            </div>

                            <div className="form-group mb-3">
                                <label style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: 4 }}>Email Address</label>
                                <input type="email" className="form-control" placeholder="staff@dealora.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                            </div>

                            <div className="form-group mb-3">
                                <label style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: 4 }}>Phone Number</label>
                                <input type="text" className="form-control" placeholder="+1 (555) 000-0000" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
                            </div>

                            <div className="form-group mb-4">
                                <label style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: 4 }}>Work Shift Schedule</label>
                                <select className="form-select" value={form.shift} onChange={(e) => setForm({ ...form, shift: e.target.value })}>
                                    <option value="Morning (08:00 AM - 04:00 PM)">Morning Shift (08:00 AM - 04:00 PM)</option>
                                    <option value="Evening (12:00 PM - 08:00 PM)">Evening Shift (12:00 PM - 08:00 PM)</option>
                                    <option value="Full Day (09:00 AM - 06:00 PM)">Full Day (09:00 AM - 06:00 PM)</option>
                                    <option value="Weekend Shift">Weekend Shift</option>
                                </select>
                            </div>

                            <button type="submit" className="btn firstloop-btn-primary" style={{ width: '100%', height: 44, borderRadius: 10, fontWeight: 700 }}>
                                Save Receptionist Record
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
