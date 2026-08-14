import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { INITIAL_BRANCHES, INITIAL_RECEPTIONISTS } from './mockMerchantData'

export default function BranchList() {
    const navigate = useNavigate()
    const [branches, setBranches] = useState(INITIAL_BRANCHES)
    const [receptionists] = useState(INITIAL_RECEPTIONISTS)
    const [search, setSearch] = useState('')

    // Receptionist Details Modal State
    const [selectedReceptionistModal, setSelectedReceptionistModal] = useState(null)

    const filteredBranches = useMemo(() => {
        return branches.filter(b =>
            b.name.toLowerCase().includes(search.toLowerCase()) ||
            b.city.toLowerCase().includes(search.toLowerCase()) ||
            b.manager.toLowerCase().includes(search.toLowerCase())
        )
    }, [branches, search])

    // Helper: Get assigned receptionist for a branch (1 per branch)
    const getPrimaryReceptionist = (branchId) => {
        return receptionists.find(r => r.branchId === branchId) || receptionists[0]
    }

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this branch location?')) {
            setBranches(prev => prev.filter(b => b.id !== id))
        }
    }

    return (
        <div style={{ paddingBottom: 40 }}>
            {/* Header */}
            <div className="flex-between mb-4" style={{ flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                        Merchant Branch Locations
                    </h2>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>
                        Store outlets data table with 1 assigned receptionist per branch and direct `view-fl-branch` studio access.
                    </p>
                </div>
            </div>

            {/* Search Bar & Stats */}
            <div className="card mb-4" style={{ padding: 18, borderRadius: 16, background: '#FFFFFF' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                    <div style={{ position: 'relative', width: 340 }}>
                        <i className="fas fa-search" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Search branches by name, city or manager..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ paddingLeft: 40, height: 42, borderRadius: 10, fontSize: '0.88rem' }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: 12 }}>
                        <div style={{ padding: '8px 16px', background: 'var(--firstloop-primary-light)', borderRadius: 10, border: '1px solid rgba(14,136,184,0.2)', fontSize: '0.8rem', fontWeight: 700, color: 'var(--firstloop-primary)' }}>
                            <i className="fas fa-store" style={{ marginRight: 6 }} />
                            {branches.length} Total Outlets
                        </div>
                        <div style={{ padding: '8px 16px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: 10, border: '1px solid rgba(16,185,129,0.2)', fontSize: '0.8rem', fontWeight: 700, color: '#059669' }}>
                            <i className="fas fa-user-check" style={{ marginRight: 6 }} />
                            1 Receptionist Per Branch
                        </div>
                    </div>
                </div>
            </div>

            {/* DATA TABLE FOR MERCHANT BRANCH LOCATIONS */}
            <div className="card" style={{ padding: 0, overflow: 'hidden', borderRadius: 16, border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                            <tr>
                                <th style={{ padding: '14px 18px', fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                    Branch Location
                                </th>
                                <th style={{ padding: '14px 18px', fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                    Manager Details
                                </th>
                                <th style={{ padding: '14px 18px', fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                    Assigned Receptionist Name
                                </th>
                                <th style={{ padding: '14px 18px', fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                    Status
                                </th>
                                <th style={{ padding: '14px 18px', fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>
                                    Actions & Studio View
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredBranches.length > 0 ? (
                                filteredBranches.map((branch) => {
                                    const receptionist = getPrimaryReceptionist(branch.id)
                                    return (
                                        <tr key={branch.id}>
                                            {/* Branch Details */}
                                            <td style={{ padding: '16px 18px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                    <div style={{ width: 42, height: 42, borderRadius: 10, background: 'var(--firstloop-primary-light)', color: 'var(--firstloop-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0 }}>
                                                        <i className="fas fa-store" style={{ fontSize: '1.1rem' }} />
                                                    </div>
                                                    <div>
                                                        <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)', display: 'block' }}>
                                                            {branch.name}
                                                        </strong>
                                                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                                            <i className="fas fa-map-marker-alt" style={{ marginRight: 4, color: 'var(--firstloop-primary)' }} />
                                                            {branch.address}, {branch.city} ({branch.zip_code})
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Manager Details */}
                                            <td style={{ padding: '16px 18px' }}>
                                                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                                    {branch.manager}
                                                </div>
                                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                                    {branch.email}
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                    <i className="fas fa-phone-alt" style={{ marginRight: 4, color: 'var(--firstloop-primary)' }} />
                                                    {branch.phone}
                                                </div>
                                            </td>

                                            {/* 1 Assigned Receptionist Name Per Branch */}
                                            <td style={{ padding: '16px 18px' }}>
                                                <div
                                                    onClick={() => setSelectedReceptionistModal(receptionist)}
                                                    style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
                                                    title="Click to view full Receptionist details"
                                                >
                                                    <img
                                                        src={receptionist.avatar}
                                                        alt={receptionist.name}
                                                        style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--firstloop-primary)' }}
                                                    />
                                                    <div>
                                                        <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--firstloop-primary)' }}>
                                                            {receptionist.name}
                                                        </div>
                                                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                                                            Receptionist ID: <strong>{receptionist.staffId || 'STF-DT-01'}</strong>
                                                        </div>
                                                        <div style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 700 }}>
                                                            {receptionist.phone}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Status */}
                                            <td style={{ padding: '16px 18px' }}>
                                                <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#059669', fontWeight: 800, padding: '6px 12px', borderRadius: 8 }}>
                                                    {branch.status}
                                                </span>
                                            </td>

                                            {/* Actions */}
                                            <td style={{ padding: '16px 18px', textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                                    {/* View Branch Button -> ViewFlBranch */}
                                                    <button
                                                        type="button"
                                                        className="btn firstloop-btn-primary btn-sm"
                                                        onClick={() => navigate(`/merchant/branches/${branch.id}`)}
                                                        style={{ padding: '7px 12px', fontSize: '0.78rem', borderRadius: 8, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                                    >
                                                        <i className="fas fa-eye" />
                                                        <span>View Branch</span>
                                                    </button>

                                                    {/* Receptionist Popup Button */}
                                                    <button
                                                        type="button"
                                                        className="btn firstloop-btn-secondary btn-sm"
                                                        onClick={() => setSelectedReceptionistModal(receptionist)}
                                                        style={{ padding: '7px 12px', fontSize: '0.78rem', borderRadius: 8, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                                    >
                                                        <i className="fas fa-id-badge" />
                                                        <span>Receptionist Info</span>
                                                    </button>

                                                    {/* Delete Button */}
                                                 
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })
                            ) : (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>
                                        No branch locations found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* RECEPTIONIST DETAILS POPUP MODAL */}
            {selectedReceptionistModal && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(15, 23, 42, 0.75)',
                        backdropFilter: 'blur(6px)',
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
                            borderRadius: 24,
                            maxWidth: 480,
                            width: '100%',
                            overflow: 'hidden',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
                            position: 'relative'
                        }}
                    >
                        {/* Header Banner */}
                        <div style={{ background: 'var(--firstloop-gradient-primary)', padding: '24px 28px', color: '#FFFFFF', position: 'relative' }}>
                            <button
                                type="button"
                                onClick={() => setSelectedReceptionistModal(null)}
                                style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.2)', border: 'none', color: '#FFF', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                &times;
                            </button>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                <img
                                    src={selectedReceptionistModal.avatar}
                                    alt={selectedReceptionistModal.name}
                                    style={{ width: 68, height: 68, borderRadius: '50%', border: '3px solid #FFFFFF', objectFit: 'cover', boxShadow: '0 4px 14px rgba(0,0,0,0.2)' }}
                                />
                                <div>
                                    <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.9, fontWeight: 700 }}>
                                        BRANCH RECEPTIONIST PROFILE
                                    </span>
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '2px 0 0 0', color: '#FFFFFF' }}>
                                        {selectedReceptionistModal.name}
                                    </h3>
                                    <span style={{ display: 'inline-block', marginTop: 6, fontSize: '0.7rem', fontWeight: 800, padding: '3px 10px', borderRadius: 10, background: '#FFFFFF', color: 'var(--firstloop-primary)' }}>
                                        ID: {selectedReceptionistModal.staffId || selectedReceptionistModal.receptionistId || 'STF-DT-01'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Modal Content Fields */}
                        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {/* 1. Name */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 12, background: '#F8FAFC', borderRadius: 12, border: '1px solid #E2E8F0' }}>
                                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--firstloop-primary-light)', color: 'var(--firstloop-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                                    <i className="fas fa-user" />
                                </div>
                                <div>
                                    <small style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>
                                        Receptionist Name
                                    </small>
                                    <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                                        {selectedReceptionistModal.name}
                                    </strong>
                                </div>
                            </div>

                            {/* 2. Receptionist ID */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 12, background: '#F8FAFC', borderRadius: 12, border: '1px solid #E2E8F0' }}>
                                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(245, 158, 11, 0.12)', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                                    <i className="fas fa-id-card" />
                                </div>
                                <div>
                                    <small style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>
                                        Receptionist ID
                                    </small>
                                    <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                                        {selectedReceptionistModal.staffId || selectedReceptionistModal.receptionistId || 'STF-DT-01'}
                                    </strong>
                                </div>
                            </div>

                            {/* 3. Email */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 12, background: '#F8FAFC', borderRadius: 12, border: '1px solid #E2E8F0' }}>
                                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(2, 132, 199, 0.12)', color: '#0284C7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                                    <i className="fas fa-envelope" />
                                </div>
                                <div>
                                    <small style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>
                                        Email Address
                                    </small>
                                    <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                                        {selectedReceptionistModal.email}
                                    </strong>
                                </div>
                            </div>

                            {/* 4. Phone */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 12, background: '#F8FAFC', borderRadius: 12, border: '1px solid #E2E8F0' }}>
                                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(16, 185, 129, 0.12)', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                                    <i className="fas fa-phone-alt" />
                                </div>
                                <div>
                                    <small style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>
                                        Phone Number
                                    </small>
                                    <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                                        {selectedReceptionistModal.phone}
                                    </strong>
                                </div>
                            </div>

                            {/* 5. Reference Name */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 12, background: '#FFFBEB', borderRadius: 12, border: '1px solid #FDE68A' }}>
                                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#F59E0B', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                                    <i className="fas fa-user-tag" />
                                </div>
                                <div>
                                    <small style={{ fontSize: '0.7rem', color: '#B45309', textTransform: 'uppercase', fontWeight: 800, display: 'block' }}>
                                        Reference Name
                                    </small>
                                    <strong style={{ fontSize: '0.92rem', color: '#B45309' }}>
                                        {selectedReceptionistModal.referenceName || 'Alex Thompson (Sales Representative)'}
                                    </strong>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div style={{ padding: '16px 24px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', textAlign: 'right' }}>
                            <button
                                type="button"
                                className="btn firstloop-btn-primary"
                                onClick={() => setSelectedReceptionistModal(null)}
                                style={{ padding: '8px 22px', borderRadius: 10, fontSize: '0.85rem' }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
