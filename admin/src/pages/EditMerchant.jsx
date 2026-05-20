import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const initialData = {
    email: 'partner@starbucks.com',
    phone: '+1 (555) 019-2831',
    password: '••••••••',
    status: 'active',
    businessName: 'Starbucks Coffee',
    category: 'cafe',
    taxNumber: 'US-GST-8291823',
    address: '2401 Utah Ave S',
    city: 'Seattle',
    state: 'Washington',
    zipcode: '98134'
}

export default function EditMerchant() {
    const [form, setForm] = useState(initialData)
    const navigate = useNavigate()

    const handleChange = (event) => {
        const { name, value } = event.target
        setForm((prev) => ({ ...prev, [name]: value }))
    }

    const handleSubmit = (event) => {
        event.preventDefault()
        navigate('/merchants')
    }

    return (
        <>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 16 }}>
                <a href="/merchants" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
                    Merchants
                </a>{' '}
                &gt; <span>Edit Merchant Details</span>
            </div>

            <div style={{ background: 'var(--bg-surface)', border: 'var(--border-glass)', borderRadius: 'var(--border-radius-lg)', padding: 36, boxShadow: 'var(--shadow-md)' }}>
                <form onSubmit={handleSubmit}>
                    <div className="form-grid-2col" style={{ marginBottom: 14 }}>
                        <div>
                            <label className="form-label-classic" style={{ marginBottom: 8, display: 'block' }}>
                                Merchant Profile Photo
                            </label>
                            <div className="upload-zone-wrapper">
                                <div className="upload-preview-circle">
                                    <img src="https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80" alt="Avatar" />
                                </div>
                                <div>
                                    <input type="file" className="form-control" style={{ fontSize: '0.82rem' }} accept="image/*" />
                                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                                        Change photo (JPG, PNG up to 2MB).
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="form-label-classic" style={{ marginBottom: 8, display: 'block' }}>
                                Business Brand Logo
                            </label>
                            <div className="upload-zone-wrapper">
                                <div className="upload-preview-circle" style={{ borderRadius: 12, borderStyle: 'solid', borderColor: 'rgba(255, 77, 128, 0.2)' }}>
                                    <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.8rem', color: 'var(--primary)' }}>
                                        S
                                    </span>
                                </div>
                                <div>
                                    <input type="file" className="form-control" style={{ fontSize: '0.82rem' }} accept="image/*" />
                                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                                        Change business logo.
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.05rem', fontWeight: 600, color: 'var(--primary)', marginBottom: 20, borderBottom: '1px dashed rgba(255, 77, 128, 0.1)', paddingBottom: 8 }}>
                        Account Information
                    </h3>

                    <div className="form-grid-2col">
                        <div className="form-group">
                            <input name="email" type="email" value={form.email} onChange={handleChange} id="email" className="form-control" placeholder=" " required autoComplete="off" />
                            <label htmlFor="email" className="form-label">
                                Email Address
                            </label>
                        </div>
                        <div className="form-group">
                            <input name="phone" type="text" value={form.phone} onChange={handleChange} id="phone" className="form-control" placeholder=" " required autoComplete="off" />
                            <label htmlFor="phone" className="form-label">
                                Phone Number
                            </label>
                        </div>
                        <div className="form-group">
                            <input name="password" type="password" value={form.password} onChange={handleChange} id="password" className="form-control" placeholder=" " required autoComplete="new-password" />
                            <label htmlFor="password" className="form-label">
                                Account Password
                            </label>
                        </div>
                        <div className="form-group-classic">
                            <label className="form-label-classic">Merchant Account Status</label>
                            <select name="status" value={form.status} onChange={handleChange} className="form-select" required style={{ marginTop: 5 }}>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                    </div>

                    <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.05rem', fontWeight: 600, color: 'var(--primary)', marginTop: 24, marginBottom: 20, borderBottom: '1px dashed rgba(255, 77, 128, 0.1)', paddingBottom: 8 }}>
                        Business Details
                    </h3>

                    <div className="form-grid-2col">
                        <div className="form-group">
                            <input name="businessName" type="text" value={form.businessName} onChange={handleChange} id="biz-name" className="form-control" placeholder=" " required autoComplete="off" />
                            <label htmlFor="biz-name" className="form-label">
                                Business Name
                            </label>
                        </div>
                        <div className="form-group-classic">
                            <label className="form-label-classic">Business Category</label>
                            <select name="category" value={form.category} onChange={handleChange} className="form-select" required>
                                <option value="cafe">Cafe & Restaurants</option>
                                <option value="fashion">Fashion & Retail</option>
                                <option value="travel">Hotel & Tourism</option>
                                <option value="beauty">Beauty & Wellness</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <input name="taxNumber" type="text" value={form.taxNumber} onChange={handleChange} id="tax-number" className="form-control" placeholder=" " required autoComplete="off" />
                            <label htmlFor="tax-number" className="form-label">
                                GST / VAT Number
                            </label>
                        </div>
                        <div className="form-group-classic">
                            <label className="form-label-classic">Verification Documents (KYC/Licensing)</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6 }}>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                    <i className="fas fa-file-pdf" style={{ color: '#F40F02', marginRight: 6 }} /> starbucks_license.pdf
                                </span>
                                <input type="file" className="form-control" style={{ fontSize: '0.82rem', maxWidth: 220 }} />
                            </div>
                        </div>
                    </div>

                    <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.05rem', fontWeight: 600, color: 'var(--primary)', marginTop: 24, marginBottom: 20, borderBottom: '1px dashed rgba(255, 77, 128, 0.1)', paddingBottom: 8 }}>
                        Corporate Address
                    </h3>

                    <div className="form-group">
                        <input name="address" type="text" value={form.address} onChange={handleChange} id="biz-address" className="form-control" placeholder=" " required autoComplete="off" />
                        <label htmlFor="biz-address" className="form-label">
                            Business Address
                        </label>
                    </div>

                    <div className="form-grid-2col" style={{ marginTop: 10 }}>
                        <div className="form-group">
                            <input name="city" type="text" value={form.city} onChange={handleChange} id="city" className="form-control" placeholder=" " required autoComplete="off" />
                            <label htmlFor="city" className="form-label">
                                City
                            </label>
                        </div>
                        <div className="form-group">
                            <input name="state" type="text" value={form.state} onChange={handleChange} id="state" className="form-control" placeholder=" " required autoComplete="off" />
                            <label htmlFor="state" className="form-label">
                                State
                            </label>
                        </div>
                        <div className="form-group">
                            <input name="zipcode" type="text" value={form.zipcode} onChange={handleChange} id="zipcode" className="form-control" placeholder=" " required autoComplete="off" />
                            <label htmlFor="zipcode" className="form-label">
                                Zipcode / PO Box Code
                            </label>
                        </div>
                    </div>

                    <div style={{ marginTop: 30, display: 'flex', justifyContent: 'flex-end', gap: 12, borderTop: '1px solid rgba(255, 77, 128, 0.05)', paddingTop: 20 }}>
                        <button type="button" className="btn btn-secondary" onClick={() => navigate('/merchants')}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary">
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </>
    )
}
