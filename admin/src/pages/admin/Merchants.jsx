import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import API from '../../api.js';

const NEW_MERCHANT_DAYS = 7
const MERCHANTS_PER_PAGE = 10
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

    const [search, setSearch] = useState('')

    const [merchantPage, setMerchantPage] = useState(1)

    const [loading, setLoading] = useState(true)

    const [showMerchantView, setShowMerchantView] = useState(false)

    const [selectedMerchant, setSelectedMerchant] = useState(null)

    const filteredMerchants = merchants.filter((merchant) => {

        const searchValue = search.toLowerCase()
        const merchantName = merchant.name || ''
        const merchantEmail = merchant.email || ''
        const merchantPhone = `${merchant.country_code || ''}${merchant.phone || ''}`
        const merchantBusinessName = merchant.bus_name || ''

        return (
            merchantName.toLowerCase().includes(searchValue) ||
            merchantEmail.toLowerCase().includes(searchValue) ||
            merchantPhone.toLowerCase().includes(searchValue) ||
            merchantBusinessName.toLowerCase().includes(searchValue)
        )

    })

    const totalMerchantPages = Math.max(
        1,
        Math.ceil(filteredMerchants.length / MERCHANTS_PER_PAGE)
    )

    const safeMerchantPage = Math.min(
        merchantPage,
        totalMerchantPages
    )

    const merchantPageStartIndex = (safeMerchantPage - 1) * MERCHANTS_PER_PAGE

    const paginatedMerchants = filteredMerchants.slice(
        merchantPageStartIndex,
        merchantPageStartIndex + MERCHANTS_PER_PAGE
    )

    const merchantStartCount = filteredMerchants.length
        ? merchantPageStartIndex + 1
        : 0

    const merchantEndCount = Math.min(
        merchantPageStartIndex + MERCHANTS_PER_PAGE,
        filteredMerchants.length
    )

    const merchantPageNumbers = Array.from(
        { length: totalMerchantPages },
        (_, index) => index + 1
    )


    useEffect(() => {

        fetchMerchants()

    }, [])

    useEffect(() => {

        setMerchantPage(1)

    }, [search])

    useEffect(() => {

        if (merchantPage !== safeMerchantPage) {

            setMerchantPage(safeMerchantPage)

        }

    }, [merchantPage, safeMerchantPage])

    const fetchMerchants = async () => {
        try {
            setLoading(true)
            let response
            try {
                response = await API.get('admin/merchant-list')
            } catch (getErr) {
                try {
                    response = await API.post('admin/merchant-list')
                } catch (postErr) {
                    response = await API.get('admin/merchant-lists')
                }
            }

            // console.log('Merchants Response:', response?.data)

            if (response?.data && (response.data.status === 1 || response.data.status === "1" || response.data.success)) {
                const list = response.data.data || response.data.merchants || response.data.merchant || []
                setMerchants(Array.isArray(list) ? list : [])
            } else if (Array.isArray(response?.data)) {
                setMerchants(response.data)
            } else {
                setMerchants([])
                toast.error(response?.data?.message || 'Failed to fetch merchants')
            }
        } catch (error) {
            console.log("Merchant Data:", error.response.data)
            console.error('Fetch Merchants Error:', error)
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

            <div className="card" style={{ marginBottom: 18 }}>
                <div className="flex-between" style={{ gap: 12, flexWrap: 'wrap' }}>
                    <div>
                        <h3 className="card-title">Merchants</h3>
                        <p className="card-subtitle">Manage merchant accounts and view branch activity.</p>
                    </div>

                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            gap: 12,
                            flex: 1,
                            minWidth: 280,
                            flexWrap: 'wrap'
                        }}
                    >
                        <div
                            className="search-wrapper"
                            style={{
                                marginBottom: 0,
                                maxWidth: 360,
                                flex: '1 1 280px'
                            }}
                        >
                            <i className="fas fa-search search-icon"></i>

                            <input
                                type="text"
                                className="search-input"
                                placeholder="Search merchant name, email, phone..."
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                            />
                        </div>

                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => navigate('/deleted-merchants')}
                            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                        >
                            <i className="fas fa-trash-alt" /> Deleted Merchants
                        </button>

                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => navigate('/add-merchant')}
                        >
                            + Add Merchant
                        </button>
                    </div>
                </div>
            </div>

            <div className="table-wrapper">

                <table className="data-table">

                    <thead>
                        <tr>
                            <th>Merchant Name</th>
                            <th>Business Name</th>
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
                                        <span className="skeleton-text" style={{ width: '130px' }} />
                                    </td>
                                    <td>
                                        <span className="skeleton-text" style={{ width: '90px' }} />
                                    </td>
                                    <td>
                                        <span className="skeleton-text" style={{ width: '60px' }} />
                                    </td>
                                    <td>
                                        <span className="skeleton-text" style={{ width: '95px' }} />
                                    </td>
                                    <td>
                                        <span className="skeleton-text" style={{ width: '75px', height: '24px', borderRadius: '12px', display: 'inline-block' }} />
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                            <span className="skeleton-text" style={{ width: '28px', height: '28px', borderRadius: '8px', display: 'inline-block' }} />
                                            <span className="skeleton-text" style={{ width: '28px', height: '28px', borderRadius: '8px', display: 'inline-block' }} />
                                        </div>
                                    </td>
                                </tr>
                            ))

                        ) : paginatedMerchants.length > 0 ? (

                            paginatedMerchants.map((row) => (

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

                                    <td>{row.bus_name}</td>

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

                {!loading && filteredMerchants.length > MERCHANTS_PER_PAGE && (
                    <div className="pagination-container">
                        <span className="pagination-text">
                            Showing {merchantStartCount}-{merchantEndCount} of {filteredMerchants.length} merchants
                        </span>

                        <div className="pagination-controls">
                            <button
                                type="button"
                                className={`btn-page ${safeMerchantPage === 1 ? 'disabled' : ''}`}
                                onClick={() => setMerchantPage((page) => Math.max(1, page - 1))}
                                disabled={safeMerchantPage === 1}
                            >
                                <i className="fas fa-chevron-left"></i>
                            </button>

                            {merchantPageNumbers.map((page) => (
                                <button
                                    type="button"
                                    key={page}
                                    className={`btn-page ${page === safeMerchantPage ? 'active' : ''}`}
                                    onClick={() => setMerchantPage(page)}
                                >
                                    {page}
                                </button>
                            ))}

                            <button
                                type="button"
                                className={`btn-page ${safeMerchantPage === totalMerchantPages ? 'disabled' : ''}`}
                                onClick={() => setMerchantPage((page) => Math.min(totalMerchantPages, page + 1))}
                                disabled={safeMerchantPage === totalMerchantPages}
                            >
                                <i className="fas fa-chevron-right"></i>
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </>

    )

}
