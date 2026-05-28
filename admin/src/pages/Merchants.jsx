import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Toaster, toast } from 'react-hot-toast'
import API from '../api.js';

export default function Merchants() {

    const navigate = useNavigate()

    const [merchants, setMerchants] = useState([])

    const [loading, setLoading] = useState(true)

    const [showMerchantView, setShowMerchantView] = useState(false)

    const [selectedMerchant, setSelectedMerchant] = useState(null)

    // ✅ Fetch Merchant List
    useEffect(() => {

        fetchMerchants()

    }, [])

    const fetchMerchants = async () => {

        try {

            const response = await API.get('admin/merchant-list')

            // console.log(response.data)

            if (response.data.status === 1) {

                setMerchants(response.data.data)

            }

        } catch (error) {

            // console.log(error)
            toast.error('Failed to fetch merchants')

        } finally {

            setLoading(false)

        }

    }

    const openView = (merchant) => {

        setSelectedMerchant(merchant)

        setShowMerchantView(true)

    }

    const closeView = () => {

        setSelectedMerchant(null)

        setShowMerchantView(false)

    }

    return (

        <>
            <Toaster position="top-right" reverseOrder={false} />

            <div className="card" style={{ marginBottom: 18 }}>
                <div className="flex-between" style={{ gap: 12 }}>
                    <div>
                        <h3 className="card-title">Merchants</h3>
                        <p className="card-subtitle">Manage merchant accounts and view branch activity.</p>
                    </div>
                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => navigate('/add-merchant')}
                    >
                        + Add Merchant
                    </button>
                </div>
            </div>

            <div className="table-wrapper">

                <table className="data-table">

                    <thead>
                        <tr>
                            <th>Merchant Name</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>Status</th>
                            <th>Total Branches</th>
                            <th>Created Date</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>

                    <tbody>

                        {loading ? (

                            Array.from({ length: 5 }).map((_, index) => (
                                <tr className="skeleton-row" key={`skeleton-${index}`}>
                                    <td>
                                        <div className="table-cell-profile">
                                            <div className="cell-avatar skeleton-avatar" />
                                            <div className="cell-info">
                                                <span className="skeleton-text" style={{ width: '120px' }} />
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="skeleton-text" style={{ width: '140px' }} />
                                    </td>
                                    <td>
                                        <span className="skeleton-text" style={{ width: '110px' }} />
                                    </td>
                                    <td>
                                        <span className="skeleton-text" style={{ width: '80px' }} />
                                    </td>
                                    <td>
                                        <span className="skeleton-text" style={{ width: '70px' }} />
                                    </td>
                                    <td>
                                        <span className="skeleton-text" style={{ width: '100px' }} />
                                    </td>
                                    <td>
                                        <span className="skeleton-text" style={{ width: '90px' }} />
                                    </td>
                                </tr>
                            ))

                        ) : merchants.length > 0 ? (

                            merchants.map((row) => (

                                <tr key={row.id}>

                                    <td>
                                        <div className="table-cell-profile">

                                            <div className="cell-avatar">
                                                {row.name?.charAt(0)}
                                            </div>

                                            <div className="cell-info">

                                                <span className="cell-name">
                                                    {row.name}
                                                </span>

                                            </div>

                                        </div>
                                    </td>

                                    <td>{row.email}</td>

                                    <td>{row.phone}</td>

                                    <td>
                                        <span className="badge active">
                                            {row.status == 1 ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>

                                    <td>{row.branch_count}</td>

                                    <td>{row.createdAt}</td>

                                    <td>

                                        <div
                                            className="action-group"
                                            style={{ justifyContent: 'flex-end' }}
                                        >

                                            <button
                                                className="btn-icon view"
                                                onClick={() => navigate(`/view-merchant/${row.id}`)}
                                            >
                                                <i className="fas fa-eye" />
                                            </button>

                                            <button
                                                className="btn-icon edit"
                                                onClick={() => navigate(`/edit-merchant/${row.id}`)}
                                            >
                                                <i className="fas fa-edit" />
                                            </button>

                                            <button className="btn-icon delete">
                                                <i className="fas fa-trash-alt" />
                                            </button>

                                        </div>

                                    </td>

                                </tr>

                            ))

                        ) : (

                            <tr>
                                <td colSpan="7" align="center">
                                    No Merchants Found
                                </td>
                            </tr>

                        )}

                    </tbody>

                </table>

            </div>
        </>

    )

}