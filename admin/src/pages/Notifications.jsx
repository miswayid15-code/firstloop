import { useMemo, useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import API from '../api.js'

const targetGroups = [
    {
        id: 'merchant',
        title: 'All Merchants',
        desc: 'Merchant Partners',
        icon: 'fa-store'
    },
    {
        id: 'receptionist',
        title: 'All Receptionists',
        desc: 'Reception Staff',
        icon: 'fa-user-tie'
    },
    {
        id: 'customer',
        title: 'All Customers',
        desc: 'Registered Customers',
        icon: 'fa-users'
    }
]

export default function Notifications() {
    const [activeTarget, setActiveTarget] = useState('merchant')
    const [statusMessage, setStatusMessage] = useState('')
    const [selectedRecipients, setSelectedRecipients] = useState([])
    const [filters, setFilters] = useState([])
    const [formValues, setFormValues] = useState({
        title: '',
        notificationType: 'General',
        sendMode: 'Send Now',
        scheduleDate: '',
        scheduleTime: '',
        birthdayDate: '',
        message: '',
        filterType: '',
        filterValue: ''
    })
    const [dateFrom, setDateFrom] = useState('')
    const [dateTo, setDateTo] = useState('')

    const [categoriesList, setCategoriesList] = useState([])
    const [rawRecipients, setRawRecipients] = useState([])
    const [loadingRecipients, setLoadingRecipients] = useState(false)
    const [loadingCategories, setLoadingCategories] = useState(false)
    const [isDispatching, setIsDispatching] = useState(false)

    const fetchCategories = async () => {
        setLoadingCategories(true)
        try {
            const response = await API.get('api/category-list')
            if (response.data.status === 1) {
                setCategoriesList(response.data.data || [])
            } else {
                setCategoriesList([])
            }
        } catch (error) {
            console.error('Error fetching categories:', error)
            toast.error('Failed to load categories')
            setCategoriesList([])
        } finally {
            setLoadingCategories(false)
        }
    }

    const fetchRecipientsData = async (target) => {
        setLoadingRecipients(true)
        try {
            let endpoint = ''
            if (target === 'customer') {
                endpoint = 'admin/customer-list'
            } else if (target === 'merchant') {
                endpoint = 'admin/merchant-lists'
            } else if (target === 'receptionist') {
                endpoint = 'admin/receptionist-list'
            }

            if (!endpoint) return

            const response = await API.get(endpoint)
            if (response.data.status === 1) {
                if (target === 'customer') {
                    setRawRecipients(response.data.customers || [])
                } else if (target === 'merchant') {
                    setRawRecipients(response.data.merchants || [])
                } else if (target === 'receptionist') {
                    setRawRecipients(response.data.receptionists || [])
                }
            } else {
                setRawRecipients([])
            }
        } catch (error) {
            console.error('Error fetching recipients:', error)
            toast.error('Failed to load recipients')
            setRawRecipients([])
        } finally {
            setLoadingRecipients(false)
        }
    }

    useEffect(() => {
        fetchCategories()
    }, [])

    useEffect(() => {
        fetchRecipientsData(activeTarget)
        setFilters([])
        setSelectedRecipients([])
        setFormValues((prev) => ({
            ...prev,
            filterType: '',
            filterValue: ''
        }))
    }, [activeTarget])

    const getAvailableFiltersForTarget = () => {
        if (activeTarget === 'merchant') {
            return {
                category: {
                    label: 'Category',
                    options: categoriesList.map((cat) => ({
                        label: cat.name,
                        value: String(cat.id)
                    }))
                }
            }
        } else if (activeTarget === 'customer') {
            return {
                gender: {
                    label: 'Gender',
                    options: [
                        { label: 'Male', value: '1' },
                        { label: 'Female', value: '2' },
                        { label: 'Others', value: '3' }
                    ]
                },
                age: {
                    label: 'Age',
                    options: [
                        { label: 'Under 18', value: 'Under 18' },
                        { label: '18-25', value: '18-25' },
                        { label: '26-35', value: '26-35' },
                        { label: '36-45', value: '36-45' },
                        { label: '46+', value: '46+' }
                    ]
                }
            }
        } else {
            return {}
        }
    }

    const availableRecipients = useMemo(() => {
        return rawRecipients.filter((item) => {
            return filters.every((filter) => {
                if (activeTarget === 'merchant') {
                    if (filter.type === 'category') {
                        return String(item.cat_id) === String(filter.value)
                    }
                } else if (activeTarget === 'customer') {
                    if (filter.type === 'gender') {
                        return String(item.gender) === String(filter.value)
                    }
                    if (filter.type === 'age') {
                        if (item.age === null || item.age === undefined) return false
                        const ageNum = Number(item.age)
                        switch (filter.value) {
                            case 'Under 18':
                                return ageNum < 18
                            case '18-25':
                                return ageNum >= 18 && ageNum <= 25
                            case '26-35':
                                return ageNum >= 26 && ageNum <= 35
                            case '36-45':
                                return ageNum >= 36 && ageNum <= 45
                            case '46+':
                                return ageNum >= 46
                            default:
                                return true
                        }
                    }
                }
                return true
            })
        })
    }, [rawRecipients, filters, activeTarget])

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormValues((prev) => ({
            ...prev,
            [name]: value
        }))
    }

    const handleTargetSelect = (target) => {
        setActiveTarget(target)
    }

    const handleFilterValue = (value) => {
        setFormValues((prev) => ({
            ...prev,
            filterValue: value
        }))
    }

    const handleAddFilter = () => {
        if (!formValues.filterType || !formValues.filterValue) {
            return
        }

        const availableFilters = getAvailableFiltersForTarget()
        const currentFilterInfo = availableFilters[formValues.filterType]
        if (!currentFilterInfo) return

        const selectedOption = currentFilterInfo.options.find(
            (opt) => String(opt.value) === String(formValues.filterValue)
        )
        if (!selectedOption) return

        if (filters.some((filter) => filter.type === formValues.filterType)) {
            return
        }

        setFilters((prev) => [
            ...prev,
            {
                type: formValues.filterType,
                label: currentFilterInfo.label,
                value: formValues.filterValue,
                valueLabel: selectedOption.label
            }
        ])

        setFormValues((prev) => ({
            ...prev,
            filterType: '',
            filterValue: ''
        }))
    }

    const handleRemoveFilter = (type) => {
        setFilters((prev) => prev.filter((filter) => filter.type !== type))
    }

    const handleFetchRecipients = () => {
        setSelectedRecipients(availableRecipients)
        setStatusMessage(`${availableRecipients.length} recipients selected.`)
    }

    const handleDispatch = async () => {
        if (!formValues.title || !formValues.message) {
            setStatusMessage('Please enter title and message.')
            toast.error('Please enter title and message.')
            return
        }

        if (formValues.sendMode === 'Schedule' && (!formValues.scheduleDate || !formValues.scheduleTime)) {
            setStatusMessage('Please select a schedule date and time.')
            toast.error('Please select a schedule date and time.')
            return
        }

        const recipients = selectedRecipients.length > 0 ? selectedRecipients : availableRecipients

        if (recipients.length === 0) {
            setStatusMessage('No recipients found.')
            toast.error('No recipients found.')
            return
        }

        setIsDispatching(true)
        setStatusMessage('Sending notifications...')
        try {
            const usersPayload = recipients.map((r) => ({
                user_id: Number(r.id),
                user_type: activeTarget
            }))

            const payload = {
                users: usersPayload,
                title: formValues.title,
                body: formValues.message,
                data: {
                    screen: 'offers',
                    offer_id: 101
                }
            }

            const response = await API.post('admin/send-notification', payload)

            if (response.data.success === 1 || response.data.status === 1) {
                toast.success(response.data.message || 'Notifications sent successfully!')
                setStatusMessage(response.data.message || 'Notifications sent successfully!')
                setFormValues((prev) => ({
                    ...prev,
                    title: '',
                    message: ''
                }))
                setSelectedRecipients([])
            } else {
                toast.error(response.data.message || 'Failed to send notifications.')
                setStatusMessage(response.data.message || 'Failed to send notifications.')
            }
        } catch (error) {
            console.error('Dispatch Error:', error)
            const errMsg = error.response?.data?.message || 'Failed to send notifications.'
            toast.error(errMsg)
            setStatusMessage(errMsg)
        } finally {
            setIsDispatching(false)
        }
    }

    return (
        <>
            <div className="flex-between" style={{ marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
                <div>
                    <h2 className="card-title" style={{ fontSize: '1.4rem', marginBottom: 6 }}>
                        Send Push Notifications
                    </h2>
                    <p className="card-subtitle">
                        Build campaigns with rich targeting, scheduling, and recipient preview.
                    </p>
                </div>
            </div>

            <div className="reports-grid">
                <div className="reports-main-content">
                    <div className="card" style={{ borderRadius: 24 }}>
                        <div className="card-header">
                            <div>
                                <h3 className="card-title">Audience Builder</h3>
                                <p className="card-subtitle">Choose your target group and apply smart filters.</p>
                            </div>
                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                <span className="filter-chip">{activeTarget.replace(/([A-Z])/g, ' $1')}</span>
                                <span className="filter-chip">{filters.length} active filters</span>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
                            {targetGroups.map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => handleTargetSelect(item.id)}
                                    className={`target-card ${activeTarget === item.id ? 'active' : ''}`}
                                    style={{ borderRadius: 18 }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                                        <div className="sidebar-stat-icon" style={{ background: 'rgba(111, 63, 255, 0.12)', color: 'var(--primary)' }}>
                                            <i className={`fas ${item.icon}`} />
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <h4 style={{ margin: '0 0 8px', fontSize: '1rem' }}>{item.title}</h4>
                                        <p className="card-subtitle" style={{ margin: 0 }}>{item.desc}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>



                    <div className="card filter-panel">
                        <div className="card-header">
                            <div>
                                <h3 className="card-title">Smart Targeting</h3>
                                <p className="card-subtitle">Add more filters to refine your audience and focus the campaign.</p>
                            </div>
                            <button className="btn btn-light-pink" type="button" onClick={handleFetchRecipients} disabled={loadingRecipients}>
                                <i className="fas fa-search" /> Fetch Recipients
                            </button>
                        </div>

                        {Object.keys(getAvailableFiltersForTarget()).length === 0 ? (
                            <p className="card-subtitle" style={{ padding: '10px 0', margin: 0 }}>
                                No targeting filters available for {activeTarget.replace(/([A-Z])/g, ' $1')}s.
                            </p>
                        ) : (
                            <div className="filter-grid">
                                <div className="form-group-classic">
                                    <label className="form-label-classic">Filter Type</label>
                                    <select
                                        className="form-select"
                                        value={formValues.filterType}
                                        onChange={(e) =>
                                            setFormValues((prev) => ({
                                                ...prev,
                                                filterType: e.target.value,
                                                filterValue: ''
                                            }))
                                        }
                                    >
                                        <option value="">Choose a filter</option>
                                        {Object.entries(getAvailableFiltersForTarget()).map(([key, info]) => (
                                            <option key={key} value={key}>
                                                {info.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group-classic">
                                    <label className="form-label-classic">Filter Value</label>
                                    <select
                                        className="form-select"
                                        value={formValues.filterValue}
                                        onChange={(e) => handleFilterValue(e.target.value)}
                                        disabled={!formValues.filterType}
                                    >
                                        <option value="">Pick a value</option>
                                        {formValues.filterType &&
                                            getAvailableFiltersForTarget()[formValues.filterType]?.options.map((option) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                    </select>
                                </div>

                                <div className="form-group-classic" style={{ alignSelf: 'end' }}>
                                    <button className="btn btn-primary" type="button" onClick={handleAddFilter}>
                                        <i className="fas fa-plus" /> Add Filter
                                    </button>
                                </div>
                            </div>
                        )}

                        {filters.length > 0 && (
                            <div style={{ marginTop: 18, display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                                {filters.map((filter) => (
                                    <span key={filter.type} className="filter-chip">
                                        <strong>{filter.label}:</strong> {filter.valueLabel}
                                        <i
                                            className="fas fa-times"
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => handleRemoveFilter(filter.type)}
                                        />
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="dashboard-stats-grid">
                        <div className="card stat-card">
                            <div className="stat-header">
                                <div>
                                    <span className="stat-title">Matched Recipients</span>
                                    <p className="card-subtitle">Live count based on active filters</p>
                                </div>
                                <div className="stat-icon green">
                                    <i className="fas fa-users" />
                                </div>
                            </div>
                            <div className="stat-value">{availableRecipients.length}</div>
                        </div>
                        <div className="card stat-card">
                            <div className="stat-header">
                                <div>
                                    <span className="stat-title">Selected to Send</span>
                                    <p className="card-subtitle">Recipients locked for this campaign</p>
                                </div>
                                <div className="stat-icon purple">
                                    <i className="fas fa-check-circle" />
                                </div>
                            </div>
                            <div className="stat-value">{selectedRecipients.length}</div>
                        </div>
                        <div className="card stat-card">
                            <div className="stat-header">
                                <div>
                                    <span className="stat-title">Active Filters</span>
                                    <p className="card-subtitle">Applied targeting rules</p>
                                </div>
                                <div className="stat-icon blue">
                                    <i className="fas fa-filter" />
                                </div>
                            </div>
                            <div className="stat-value">{filters.length}</div>
                        </div>
                    </div>
                    <div className="card">
                        <div className="card-header">
                            <div>
                                <h3 className="card-title">Message & Schedule</h3>
                                <p className="card-subtitle">Choose your notification type and send timing.</p>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group-classic">
                                <label className="form-label-classic">Notification Type</label>
                                <select
                                    name="notificationType"
                                    value={formValues.notificationType}
                                    onChange={handleInputChange}
                                    className="form-select"
                                >
                                    <option value="General">General</option>
                                    <option value="Promotion">Promotion</option>
                                    <option value="Alert">Alert</option>
                                    <option value="Reminder">Reminder</option>
                                </select>
                            </div>
                            <div className="form-group-classic">
                                <label className="form-label-classic">Send Mode</label>
                                <select
                                    name="sendMode"
                                    value={formValues.sendMode}
                                    onChange={handleInputChange}
                                    className="form-select"
                                >
                                    <option value="Send Now">Send Now</option>
                                    <option value="Schedule">Schedule</option>
                                </select>
                            </div>
                        </div>

                        {formValues.sendMode === 'Schedule' && (
                            <div className="form-row">
                                <div className="form-group-classic">
                                    <label className="form-label-classic">Schedule Date</label>
                                    <input
                                        type="date"
                                        name="scheduleDate"
                                        value={formValues.scheduleDate}
                                        onChange={handleInputChange}
                                        className="form-control"
                                    />
                                </div>
                                <div className="form-group-classic">
                                    <label className="form-label-classic">Schedule Time</label>
                                    <input
                                        type="time"
                                        name="scheduleTime"
                                        value={formValues.scheduleTime}
                                        onChange={handleInputChange}
                                        className="form-control"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="form-group-classic">
                            <label className="form-label-classic">Notification Title</label>
                            <input
                                type="text"
                                name="title"
                                value={formValues.title}
                                onChange={handleInputChange}
                                placeholder="Enter campaign title"
                                className="form-control"
                            />
                        </div>

                        <div className="form-group-classic">
                            <label className="form-label-classic">Description / Message</label>
                            <textarea
                                name="message"
                                value={formValues.message}
                                onChange={handleInputChange}
                                placeholder="Write the notification message here"
                                className="form-control"
                                rows={7}
                            />
                        </div>

                        <div className="flex-between" style={{ gap: 14, flexWrap: 'wrap', marginTop: 18 }}>
                            <button
                                className="btn btn-primary"
                                type="button"
                                onClick={handleDispatch}
                                disabled={isDispatching || ((selectedRecipients.length === 0 && availableRecipients.length === 0) || !formValues.title || !formValues.message)}
                            >
                                <i className="fas fa-paper-plane" /> {isDispatching ? 'Dispatching...' : 'Dispatch Notification'}
                            </button>
                            <button className="btn btn-secondary" type="button">
                                <i className="fas fa-save" /> Save Draft
                            </button>
                        </div>

                        {statusMessage && (
                            <p style={{ marginTop: 16, color: 'var(--primary)', fontWeight: 600 }}>
                                {statusMessage}
                            </p>
                        )}
                    </div>




                </div>

            </div>
        </>
    )
}
