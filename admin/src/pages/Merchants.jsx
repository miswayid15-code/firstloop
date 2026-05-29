import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import AppToaster from '../components/AppToaster.jsx'
import API from '../api.js';

const NEW_MERCHANT_DAYS = 7
const MS_PER_DAY = 24 * 60 * 60 * 1000

const parseMerchantDate = (dateValue) => {
    if (!dateValue) return null

    if (dateValue instanceof Date) {
        return Number.isNaN(dateValue.getTime()) ? null : dateValue
    }

    if (typeof dateValue === 'number') {
        const parsedNumberDate = new Date(dateValue)
        return Number.isNaN(parsedNumberDate.getTime()) ? null : parsedNumberDate
    }

    const normalizedDate = String(dateValue).trim()
    const parsedDate = new Date(normalizedDate)

    if (!Number.isNaN(parsedDate.getTime())) {
        return parsedDate
    }

    const dateParts = normalizedDate.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/)

    if (!dateParts) return null

    const [, day, month, year] = dateParts
    const fullYear = year.length === 2 ? `20${year}` : year
    const fallbackDate = new Date(Number(fullYear), Number(month) - 1, Number(day))

    return Number.isNaN(fallbackDate.getTime()) ? null : fallbackDate
}

const isNewMerchant = (createdAt) => {
    const createdDate = parseMerchantDate(createdAt)

    if (!createdDate) return false

    const daysSinceCreated = (Date.now() - createdDate.getTime()) / MS_PER_DAY

    return daysSinceCreated >= 0 && daysSinceCreated <= NEW_MERCHANT_DAYS
}

export default function Merchants() {

    const navigate = useNavigate()

    const [merchants, setMerchants] = useState([])

    const [loading, setLoading] = useState(true)

    const [showMerchantView, setShowMerchantView] = useState(false)

    const [selectedMerchant, setSelectedMerchant] = useState(null)


    useEffect(() => {

        fetchMerchants()

    }, [])

    const fetchMerchants = async () => {

        try {

            const response = await API.get('admin/merchant-list')

            console.log(response.data)

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

    const handleStatusToggle = async (id, currentStatus) => {

        const newStatus = currentStatus == 1 ? 0 : 1

        try {

            await API.post("admin/merchant/status-update", {
                id: id,
                status: newStatus
            })

            setMerchants(prev =>
                prev.map(item =>
                    item.id === id
                        ? { ...item, status: newStatus }
                        : item
                )
            )

            toast.success(
                newStatus === 1
                    ? "Merchant Activated"
                    : "Merchant Deactivated"
            )

        } catch (error) {

            toast.error("Failed to update status")

        }

    }
const handleDeleteAccount = async (id) => {

    try {

        const response = await API.post(
            "admin/merchant/delete-status",
            {
                id: id
            }
        );

        if (response.data.status === 1) {

            setMerchants(prev =>
                prev.filter(item => item.id !== id)
            );

            toast.success("Account Deleted Successfully");

        } else {

            toast.error(response.data.message);

        }

    } catch (err) {

        toast.error("Failed to delete account");

    }

}

    return (

        <>
            <AppToaster />

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

                            <th>Total Branches</th>
                            <th>Created Date</th>
                            <th>Status</th>
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

                                                <div className="merchant-name-line">
                                                    <span className="cell-name">
                                                        {row.name}
                                                    </span>

                                                    {isNewMerchant(row.createdAt) && (
                                                        <span className="badge merchant-new-badge">
                                                            New
                                                        </span>
                                                    )}
                                                </div>

                                            </div>

                                        </div>
                                    </td>

                                    <td>{row.email}</td>

                                    <td>{row.country_code}{row.phone}</td>



                                    <td>{row.branch_count}</td>

                                    <td>{row.createdAt}</td>
                                    <td>
                                        <div className="merchant-status-cell">
                                            <label
                                                className={`merchant-status-toggle ${row.status == 1 ? 'is-active' : 'is-inactive'}`}
                                                title={row.status == 1 ? 'Deactivate merchant' : 'Activate merchant'}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={row.status == 1}
                                                    onChange={() => handleStatusToggle(row.id, row.status)}
                                                />
                                                <span className="merchant-status-track" aria-hidden="true">
                                                    <span className="merchant-status-knob" />
                                                </span>
                                                <span className="merchant-status-label">
                                                    {row.status == 1 ? 'Active' : 'Inactive'}
                                                </span>
                                            </label>
                                        </div>
                                    </td>

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

                                            <button
                                                className="btn-icon delete"
                                                onClick={() => handleDeleteAccount(row.id)}
                                            >
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
