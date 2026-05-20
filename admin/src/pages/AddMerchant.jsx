import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { addMerchant } from '../lib/store'

const initialForm = {
    businessName: '',
    category: 'cafe',
    email: '',
    phone: '',
    password: '',
    taxNumber: '',
    address: '',
    city: '',
    state: '',
    zipcode: ''
}

export default function AddMerchant() {
    const [form, setForm] = useState(initialForm)
    const navigate = useNavigate()

    const handleChange = (event) => {
        const { name, value } = event.target
        setForm((prev) => ({ ...prev, [name]: value }))
    }

    const handleSubmit = (event) => {
        event.preventDefault()
        const newMerchant = {
            name: form.businessName || 'New Merchant',
            subtitle: form.category === 'cafe' ? 'Cafe & Restaurants' : form.category,
            email: form.email || 'no-reply@example.com',
            phone: form.phone || '',
            status: 'Active',
            branches: '0 Branches',
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
        }
        addMerchant(newMerchant)
        navigate('/merchants')
    }

    return (
        <div className="card">
            <div className="flex-between" style={{ marginBottom: 24 }}>
                <div>
                    <h3 className="card-title">Add Merchant</h3>
                    <p className="card-subtitle">Create a new merchant account and onboard it to the Dealora network.</p>
                </div>
            </div>
            <form onSubmit={handleSubmit}>
                <div className="form-grid-2col" style={{ marginBottom: 16 }}>
                    <div className="form-group">
                        <input
                            name="businessName"
                            type="text"
                            value={form.businessName}
                            onChange={handleChange}
                            className="form-control"
                            placeholder=" "
                            required
                            autoComplete="off"
                        />
                        <label className="form-label">Business Name</label>
                    </div>
                    <div className="form-group-classic">
                        <label className="form-label-classic">Business Category</label>
                        <select name="category" value={form.category} onChange={handleChange} className="form-select" required>
                            <option value="cafe">Cafe & Restaurants</option>
                            <option value="fashion">Fashion & Retail</option>
                            <option value="travel">Hotel & Tourism</option>
                            <option value="wellness">Beauty & Wellness</option>
                        </select>
                    </div>
                </div>

                <div className="form-grid-2col">
                    <div className="form-group">
                        <input
                            name="email"
                            type="email"
                            value={form.email}
                            onChange={handleChange}
                            className="form-control"
                            placeholder=" "
                            required
                            autoComplete="off"
                        />
                        <label className="form-label">Corporate Email</label>
                    </div>
                    <div className="form-group">
                        <input
                            name="phone"
                            type="text"
                            value={form.phone}
                            onChange={handleChange}
                            className="form-control"
                            placeholder=" "
                            required
                            autoComplete="off"
                        />
                        <label className="form-label">Phone Number</label>
                    </div>
                </div>

                <div className="form-grid-2col">
                    <div className="form-group">
                        <input
                            name="password"
                            type="password"
                            value={form.password}
                            onChange={handleChange}
                            className="form-control"
                            placeholder=" "
                            required
                            autoComplete="new-password"
                        />
                        <label className="form-label">Set Password</label>
                    </div>
                    <div className="form-group">
                        <input
                            name="taxNumber"
                            type="text"
                            value={form.taxNumber}
                            onChange={handleChange}
                            className="form-control"
                            placeholder=" "
                            required
                            autoComplete="off"
                        />
                        <label className="form-label">GST / VAT Number</label>
                    </div>
                </div>

                <div className="form-group">
                    <input
                        name="address"
                        type="text"
                        value={form.address}
                        onChange={handleChange}
                        className="form-control"
                        placeholder=" "
                        required
                        autoComplete="off"
                    />
                    <label className="form-label">Business Address</label>
                </div>

                <div className="form-grid-2col" style={{ marginTop: 10 }}>
                    <div className="form-group">
                        <input
                            name="city"
                            type="text"
                            value={form.city}
                            onChange={handleChange}
                            className="form-control"
                            placeholder=" "
                            required
                            autoComplete="off"
                        />
                        <label className="form-label">City</label>
                    </div>
                    <div className="form-group">
                        <input
                            name="state"
                            type="text"
                            value={form.state}
                            onChange={handleChange}
                            className="form-control"
                            placeholder=" "
                            required
                            autoComplete="off"
                        />
                        <label className="form-label">State</label>
                    </div>
                    <div className="form-group">
                        <input
                            name="zipcode"
                            type="text"
                            value={form.zipcode}
                            onChange={handleChange}
                            className="form-control"
                            placeholder=" "
                            required
                            autoComplete="off"
                        />
                        <label className="form-label">Zipcode / PO Box</label>
                    </div>
                </div>

                <div style={{ marginTop: 30, display: 'flex', justifyContent: 'flex-end', gap: 12, borderTop: '1px solid rgba(255, 77, 128, 0.08)', paddingTop: 20 }}>
                    <button type="button" className="btn btn-secondary" onClick={() => navigate('/merchants')}>
                        Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                        Create Merchant
                    </button>
                </div>
            </form>
        </div>
    )
}
