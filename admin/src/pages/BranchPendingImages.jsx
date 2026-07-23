import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import API from '../api.js';

export default function BranchPendingImages() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [branchData, setBranchData] = useState(null);
    const [verifyingId, setVerifyingId] = useState(null); // tracking current loading action

    // Modal state for rejection reason
    const [rejectModal, setRejectModal] = useState({
        open: false,
        type: '',
        imageId: null,
        reason: ''
    });

    useEffect(() => {
        fetchPendingImages();
    }, [id]);

    const isSuccessResponse = (data) => {
        return data?.status === 1 || data?.status === '1' || data?.success === true || data?.success === 'true';
    };

    const fetchPendingImages = async () => {
        try {
            setLoading(true);
            const response = await API.get(`admin/branch-pending-images/${id}`);
            if (isSuccessResponse(response.data)) {
                setBranchData(response.data.data || null);
            } else {
                toast.error(response.data?.message || 'Failed to fetch pending images');
            }
        } catch (error) {
            console.error('Fetch pending images error:', error);
            toast.error('Error fetching pending images');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyAction = async (type, imageId, status, reason = '') => {
        try {
            const actionKey = `${type}-${imageId || 'profile'}`;
            setVerifyingId(actionKey);

            const payload = {
                branch_id: id,
                type,
                status,
                image_id: imageId
            };

            if (status === 2) {
                payload.rejected_reason = reason;
            }

            const response = await API.post('admin/branch-pending-images/verify', payload);

            if (isSuccessResponse(response.data)) {
                toast.success(response.data?.message || 'Action completed successfully');
                fetchPendingImages();
                // Close modal if open
                setRejectModal({ open: false, type: '', imageId: null, reason: '' });
            } else {
                toast.error(response.data?.message || 'Verification update failed');
            }
        } catch (error) {
            console.error('Verification status update error:', error);
            toast.error('Error updating verification status');
        } finally {
            setVerifyingId(null);
        }
    };

    const openRejectModal = (type, imageId) => {
        setRejectModal({
            open: true,
            type,
            imageId,
            reason: ''
        });
    };

    const submitRejection = () => {
        if (!rejectModal.reason.trim()) {
            toast.error('Please provide a rejection reason');
            return;
        }
        handleVerifyAction(rejectModal.type, rejectModal.imageId, 2, rejectModal.reason);
    };

    const hasPendingProfile = branchData?.pending_profile_image && (branchData?.profile_image_status === 0 || branchData?.profile_image_status === 2);
    const pendingBranchImages = (branchData?.BranchImages || []).filter(img => img.image_status === 0 || img.image_status === 2);
    const pendingMenuImages = (branchData?.MenuImages || []).filter(img => img.image_status === 0 || img.image_status === 2);
    const hasAnyPending = hasPendingProfile || pendingBranchImages.length > 0 || pendingMenuImages.length > 0;

    const getStatusBadgeClass = (status) => {
        if (status === 0) return 'badge pending';
        if (status === 2) return 'badge danger';
        return 'badge';
    };

    const getStatusLabel = (status) => {
        if (status === 0) return 'Pending Verification';
        if (status === 2) return 'Rejected';
        return '';
    };

    const getRejectTitle = () => {
        if (rejectModal.type === 'profile') return 'Profile Image';
        if (rejectModal.type === 'branch_image') return 'Gallery Image';
        if (rejectModal.type === 'menu_image') return 'Menu Image';
        return 'Submission';
    };

    if (loading) {
        return (
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="skeleton-text" style={{ width: '200px', height: '32px' }}></div>
                <div className="card skeleton-card" style={{ height: '200px' }}></div>
                <div className="card skeleton-card" style={{ height: '200px' }}></div>
            </div>
        );
    }

    return (
        <div style={{  margin: '0 auto' }}>
            {/* Header section */}
            <div className="flex-between" style={{ marginBottom: '24px', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button 
                        className="btn-icon" 
                        onClick={() => {
                            if (branchData?.merchant_id) {
                                navigate(`/view-merchant/${branchData.merchant_id}`);
                            } else {
                                window.history.back();
                            }
                        }}
                        style={{
                            background: 'var(--bg-surface)',
                            border: 'var(--border-light)',
                            boxShadow: 'var(--shadow-sm)'
                        }}
                    >
                        <i className="fas fa-arrow-left"></i>
                    </button>
                    <div>
                        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
                            Photo Verification
                        </h2>
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                            Verify uploaded images for <strong style={{ color: 'var(--primary)' }}>{branchData?.name || 'Branch'}</strong>.
                        </p>
                    </div>
                </div>
            </div>

            {!hasAnyPending ? (
                <div className="card flex-column" style={{ 
                    padding: '48px 24px', 
                    textAlign: 'center', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    background: 'var(--bg-surface)',
                    borderRadius: 'var(--border-radius-md)',
                    border: 'var(--border-light)',
                    boxShadow: 'var(--shadow-md)'
                }}>
                    <div style={{ 
                        width: '64px', 
                        height: '64px', 
                        borderRadius: '50%', 
                        background: 'var(--status-success-bg)', 
                        color: 'var(--status-success)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.8rem',
                        marginBottom: '16px'
                    }}>
                        <i className="fas fa-check-circle"></i>
                    </div>
                    <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
                        All Images Verified!
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '400px', margin: '0 0 24px 0' }}>
                        This branch has no pending profile, gallery, or menu images awaiting verification.
                    </p>
                    <button 
                        className="btn btn-primary" 
                        onClick={() => {
                            if (branchData?.merchant_id) {
                                navigate(`/view-merchant/${branchData.merchant_id}`);
                            } else {
                                window.history.back();
                            }
                        }}
                    >
                        Go Back
                    </button>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                    
                    {/* Section 1: Profile Image */}
                    {hasPendingProfile && (
                        <div className="card" style={{ 
                            padding: '24px',
                            background: 'var(--bg-surface)',
                            borderRadius: 'var(--border-radius-md)',
                            border: 'var(--border-light)',
                            boxShadow: 'var(--shadow-sm)'
                        }}>
                            <div className="flex-between" style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '12px', marginBottom: '20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                                        Pending Profile Image
                                    </h3>
                                    <span style={{ background: '#dbeafe', color: '#1e40af', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                                        Profile Image
                                    </span>
                                </div>
                                <span className={getStatusBadgeClass(branchData.profile_image_status)}>
                                    {getStatusLabel(branchData.profile_image_status)}
                                </span>
                            </div>

                            {branchData.profile_image_status === 2 && branchData.rejected_reason && (
                                <div style={{ 
                                    background: 'var(--status-warning-bg)', 
                                    color: 'var(--status-warning)', 
                                    padding: '10px 14px', 
                                    borderRadius: 'var(--border-radius-sm)', 
                                    fontSize: '0.8rem',
                                    marginBottom: '16px',
                                    fontWeight: 500
                                }}>
                                    <i className="fas fa-exclamation-triangle" style={{ marginRight: '8px' }}></i>
                                    Rejection Reason: {branchData.rejected_reason}
                                </div>
                            )}

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
                                {/* Current Image */}
                                <div>
                                    <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '10px', fontWeight: 600 }}>
                                        Current Approved Image
                                    </h4>
                                    {branchData.profile_image ? (
                                        <div style={{ width: '100%', aspectRatio: '1/1', borderRadius: 'var(--border-radius-sm)', overflow: 'hidden', border: '1px solid var(--border-light)' }}>
                                            <img src={branchData.profile_image} alt="Current profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </div>
                                    ) : (
                                        <div style={{ 
                                            width: '100%', 
                                            aspectRatio: '1/1', 
                                            borderRadius: 'var(--border-radius-sm)', 
                                            border: '2px dashed var(--border-light)', 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'center',
                                            color: 'var(--text-muted)',
                                            fontSize: '0.82rem',
                                            background: 'var(--bg-primary)'
                                        }}>
                                            No Current Image
                                        </div>
                                    )}
                                </div>

                                {/* Pending Image */}
                                <div>
                                    <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '10px', fontWeight: 600 }}>
                                        New Pending Image
                                    </h4>
                                    <div style={{ width: '100%', aspectRatio: '1/1', borderRadius: 'var(--border-radius-sm)', overflow: 'hidden', border: '1px solid var(--border-light)' }}>
                                        <img src={branchData.pending_profile_image} alt="Pending profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px', borderTop: '1px solid var(--border-light)', paddingTop: '16px' }}>
                                <button 
                                    className="btn btn-outline-danger"
                                    onClick={() => openRejectModal('profile', null)}
                                    disabled={verifyingId !== null}
                                    style={{
                                        borderColor: 'var(--status-danger)',
                                        color: 'var(--status-danger)',
                                        padding: '8px 16px',
                                        fontSize: '0.82rem'
                                    }}
                                >
                                    <i className="fas fa-times" style={{ marginRight: '6px' }}></i> Reject
                                </button>
                                <button 
                                    className="btn btn-primary"
                                    onClick={() => handleVerifyAction('profile', null, 1)}
                                    disabled={verifyingId !== null}
                                    style={{
                                        background: 'var(--status-success)',
                                        borderColor: 'var(--status-success)',
                                        padding: '8px 16px',
                                        fontSize: '0.82rem'
                                    }}
                                >
                                    {verifyingId === 'profile-profile' ? (
                                        <i className="fas fa-spinner fa-spin" style={{ marginRight: '6px' }}></i>
                                    ) : (
                                        <i className="fas fa-check" style={{ marginRight: '6px' }}></i>
                                    )}
                                    Approve
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Section 2: Gallery Images */}
                    {pendingBranchImages.length > 0 && (
                        <div className="card" style={{ 
                            padding: '24px',
                            background: 'var(--bg-surface)',
                            borderRadius: 'var(--border-radius-md)',
                            border: 'var(--border-light)',
                            boxShadow: 'var(--shadow-sm)'
                        }}>
                            <div style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '12px', marginBottom: '20px' }}>
                                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                                    Pending Gallery Images ({pendingBranchImages.length})
                                </h3>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                                {pendingBranchImages.map((img) => {
                                    const actionKey = `branch_image-${img.id}`;
                                    return (
                                        <div key={img.id} style={{ 
                                            padding: '16px', 
                                            background: 'var(--bg-primary)', 
                                            borderRadius: 'var(--border-radius-md)', 
                                            border: '1px solid var(--border-light)' 
                                        }}>
                                            <div className="flex-between" style={{ marginBottom: '14px', alignItems: 'center' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                                                        Gallery Image #{img.id}
                                                    </span>
                                                    <span style={{ background: '#f3e8ff', color: '#6b21a8', padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600 }}>
                                                        Gallery Image
                                                    </span>
                                                </div>
                                                <span className={getStatusBadgeClass(img.image_status)}>
                                                    {getStatusLabel(img.image_status)}
                                                </span>
                                            </div>

                                            {img.image_status === 2 && img.rejected_reason && (
                                                <div style={{ 
                                                    background: 'var(--status-warning-bg)', 
                                                    color: 'var(--status-warning)', 
                                                    padding: '8px 12px', 
                                                    borderRadius: 'var(--border-radius-sm)', 
                                                    fontSize: '0.78rem',
                                                    marginBottom: '12px',
                                                    fontWeight: 500
                                                }}>
                                                    <i className="fas fa-exclamation-triangle" style={{ marginRight: '8px' }}></i>
                                                    Previous Rejection Reason: {img.rejected_reason}
                                                </div>
                                            )}

                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                                                <div>
                                                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Current</span>
                                                    {img.image ? (
                                                        <div style={{ width: '100%', aspectRatio: '1/1', borderRadius: 'var(--border-radius-sm)', overflow: 'hidden', border: '1px solid var(--border-light)' }}>
                                                            <img src={img.image} alt="Current gallery" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        </div>
                                                    ) : (
                                                        <div style={{ 
                                                            width: '100%', 
                                                            aspectRatio: '1/1', 
                                                            borderRadius: 'var(--border-radius-sm)', 
                                                            border: '2px dashed var(--border-light)', 
                                                            display: 'flex', 
                                                            alignItems: 'center', 
                                                            justifyContent: 'center',
                                                            color: 'var(--text-muted)',
                                                            fontSize: '0.8rem',
                                                            background: 'var(--bg-surface)'
                                                        }}>
                                                            [New Image Submission]
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Pending Approval</span>
                                                    <div style={{ width: '100%', aspectRatio: '1/1', borderRadius: 'var(--border-radius-sm)', overflow: 'hidden', border: '1px solid var(--border-light)' }}>
                                                        <img src={img.pending_image} alt="Pending gallery" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    </div>
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                                                <button 
                                                    className="btn btn-outline-danger btn-sm"
                                                    onClick={() => openRejectModal('branch_image', img.id)}
                                                    disabled={verifyingId !== null}
                                                    style={{ borderColor: 'var(--status-danger)', color: 'var(--status-danger)', fontSize: '0.78rem', padding: '6px 12px' }}
                                                >
                                                    <i className="fas fa-times"></i> Reject
                                                </button>
                                                <button 
                                                    className="btn btn-primary btn-sm"
                                                    onClick={() => handleVerifyAction('branch_image', img.id, 1)}
                                                    disabled={verifyingId !== null}
                                                    style={{ background: 'var(--status-success)', borderColor: 'var(--status-success)', fontSize: '0.78rem', padding: '6px 12px' }}
                                                >
                                                    {verifyingId === actionKey ? (
                                                        <i className="fas fa-spinner fa-spin"></i>
                                                    ) : (
                                                        <i className="fas fa-check"></i>
                                                    )} Approve
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Section 3: Menu Images */}
                    {pendingMenuImages.length > 0 && (
                        <div className="card" style={{ 
                            padding: '24px',
                            background: 'var(--bg-surface)',
                            borderRadius: 'var(--border-radius-md)',
                            border: 'var(--border-light)',
                            boxShadow: 'var(--shadow-sm)'
                        }}>
                            <div style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '12px', marginBottom: '20px' }}>
                                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                                    Pending Menu Images ({pendingMenuImages.length})
                                </h3>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                                {pendingMenuImages.map((img) => {
                                    const actionKey = `menu_image-${img.id}`;
                                    return (
                                        <div key={img.id} style={{ 
                                            padding: '16px', 
                                            background: 'var(--bg-primary)', 
                                            borderRadius: 'var(--border-radius-md)', 
                                            border: '1px solid var(--border-light)' 
                                        }}>
                                            <div className="flex-between" style={{ marginBottom: '14px', alignItems: 'center' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                                                        Menu Image #{img.id}
                                                    </span>
                                                    <span style={{ background: '#fef3c7', color: '#92400e', padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600 }}>
                                                        Menu Image
                                                    </span>
                                                </div>
                                                <span className={getStatusBadgeClass(img.image_status)}>
                                                    {getStatusLabel(img.image_status)}
                                                </span>
                                            </div>

                                            {img.image_status === 2 && img.rejected_reason && (
                                                <div style={{ 
                                                    background: 'var(--status-warning-bg)', 
                                                    color: 'var(--status-warning)', 
                                                    padding: '8px 12px', 
                                                    borderRadius: 'var(--border-radius-sm)', 
                                                    fontSize: '0.78rem',
                                                    marginBottom: '12px',
                                                    fontWeight: 500
                                                }}>
                                                    <i className="fas fa-exclamation-triangle" style={{ marginRight: '8px' }}></i>
                                                    Previous Rejection Reason: {img.rejected_reason}
                                                </div>
                                            )}

                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                                                <div>
                                                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Current</span>
                                                    {img.image ? (
                                                        <div style={{ width: '100%', aspectRatio: '1/1', borderRadius: 'var(--border-radius-sm)', overflow: 'hidden', border: '1px solid var(--border-light)' }}>
                                                            <img src={img.image} alt="Current menu" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        </div>
                                                    ) : (
                                                        <div style={{ 
                                                            width: '100%', 
                                                            aspectRatio: '1/1', 
                                                            borderRadius: 'var(--border-radius-sm)', 
                                                            border: '2px dashed var(--border-light)', 
                                                            display: 'flex', 
                                                            alignItems: 'center', 
                                                            justifyContent: 'center',
                                                            color: 'var(--text-muted)',
                                                            fontSize: '0.8rem',
                                                            background: 'var(--bg-surface)'
                                                        }}>
                                                            [New Image Submission]
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Pending Approval</span>
                                                    <div style={{ width: '100%', aspectRatio: '1/1', borderRadius: 'var(--border-radius-sm)', overflow: 'hidden', border: '1px solid var(--border-light)' }}>
                                                        <img src={img.pending_image} alt="Pending menu" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    </div>
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                                                <button 
                                                    className="btn btn-outline-danger btn-sm"
                                                    onClick={() => openRejectModal('menu_image', img.id)}
                                                    disabled={verifyingId !== null}
                                                    style={{ borderColor: 'var(--status-danger)', color: 'var(--status-danger)', fontSize: '0.78rem', padding: '6px 12px' }}
                                                >
                                                    <i className="fas fa-times"></i> Reject
                                                </button>
                                                <button 
                                                    className="btn btn-primary btn-sm"
                                                    onClick={() => handleVerifyAction('menu_image', img.id, 1)}
                                                    disabled={verifyingId !== null}
                                                    style={{ background: 'var(--status-success)', borderColor: 'var(--status-success)', fontSize: '0.78rem', padding: '6px 12px' }}
                                                >
                                                    {verifyingId === actionKey ? (
                                                        <i className="fas fa-spinner fa-spin"></i>
                                                    ) : (
                                                        <i className="fas fa-check"></i>
                                                    )} Approve
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Rejection Reason Modal */}
            {rejectModal.open && (
                <div className="modal-backdrop" style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.4)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1050
                }}>
                    <div className="card" style={{
                        width: '100%',
                        maxWidth: '450px',
                        padding: '24px',
                        background: 'var(--bg-surface)',
                        borderRadius: 'var(--border-radius-md)',
                        boxShadow: 'var(--shadow-premium)',
                        animation: 'modalFadeIn 0.2s ease-out'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                                Reject {getRejectTitle()}
                            </h3>
                            <button 
                                className="btn-icon" 
                                onClick={() => setRejectModal({ open: false, type: '', imageId: null, reason: '' })}
                                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)' }}
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        <div className="form-group" style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                                Reason for Rejection <span style={{ color: 'var(--status-danger)' }}>*</span>
                            </label>
                            <textarea
                                value={rejectModal.reason}
                                onChange={(e) => setRejectModal(prev => ({ ...prev, reason: e.target.value }))}
                                placeholder="Provide specific feedback on why this image is being rejected (e.g. Blurry, contains invalid details, duplicate, etc.)"
                                style={{
                                    width: '100%',
                                    minHeight: '100px',
                                    padding: '10px 12px',
                                    borderRadius: 'var(--border-radius-sm)',
                                    border: '1px solid var(--border-light)',
                                    fontFamily: 'var(--font-primary)',
                                    fontSize: '0.85rem',
                                    resize: 'vertical',
                                    outline: 'none'
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button 
                                className="btn btn-outline" 
                                onClick={() => setRejectModal({ open: false, type: '', imageId: null, reason: '' })}
                                style={{ padding: '8px 16px', fontSize: '0.82rem' }}
                            >
                                Cancel
                            </button>
                            <button 
                                className="btn btn-primary" 
                                onClick={submitRejection}
                                style={{ background: 'var(--status-danger)', borderColor: 'var(--status-danger)', padding: '8px 16px', fontSize: '0.82rem' }}
                            >
                                Submit Rejection
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
