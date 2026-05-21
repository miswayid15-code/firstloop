import { useMemo, useState } from 'react'

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

const categories = [
    'Beverages & Cafe',
    'Beauty & Wellness',
    'Fashion',
    'Electronics'
]

const branches = [
    'Downtown Branch',
    'City Mall Branch',
    'Airport Branch'
]

const genders = [
    'Male',
    'Female',
    'Other'
]

const ageRanges = [
    'Under 18',
    '18-25',
    '26-35',
    '36-45',
    '46+'
]

const dynamicFields = {
    merchant: {
        TargetCategory: categories,
        TargetGender: genders
    },
    receptionist: {
        TargetBranch: branches,
        TargetCategory: categories,
        TargetGender: genders
    },
    customer: {
        TargetCategory: categories,
        TargetGender: genders,
        TargetAge: ageRanges
    }
}

const customers = [
    {
        id: 1,
        name: 'Ayesha Khan',
        category: 'Beverages & Cafe',
        branch: 'Downtown Branch',
        gender: 'Female',
        ageRange: '26-35'
    },
    {
        id: 2,
        name: 'Ravi Patel',
        category: 'Beauty & Wellness',
        branch: 'City Mall Branch',
        gender: 'Male',
        ageRange: '36-45'
    },
    {
        id: 3,
        name: 'Sara Ali',
        category: 'Fashion',
        branch: 'Airport Branch',
        gender: 'Female',
        ageRange: '18-25'
    },
    {
        id: 4,
        name: 'Mohan Kumar',
        category: 'Electronics',
        branch: 'Downtown Branch',
        gender: 'Male',
        ageRange: '46+'
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

    const sendLogs = [
        {
            id: 1,
            title: 'Summer Promo Alert',
            recipient: 'All Customers',
            detail: 'Sent to customers with active accounts.',
            date: '2026-05-13',
            time: '10:45 AM'
        },
        {
            id: 2,
            title: 'Merchant Update',
            recipient: 'All Merchants',
            detail: 'Important policy update sent to merchant partners.',
            date: '2026-05-10',
            time: '02:20 PM'
        },
        {
            id: 3,
            title: 'Receptionist Alert',
            recipient: 'Reception Staff',
            detail: 'Shift reminders sent to all receptionists.',
            date: '2026-05-08',
            time: '08:15 AM'
        }
    ]

    const filteredSendLogs = useMemo(() => {
        return sendLogs.filter((item) => {
            if (dateFrom && item.date < dateFrom) return false
            if (dateTo && item.date > dateTo) return false
            return true
        })
    }, [dateFrom, dateTo])

    const availableRecipients = useMemo(() => {
        return customers.filter((customer) => {
            return filters.every((filter) => {
                switch (filter.type) {
                    case 'TargetCategory':
                        return customer.category === filter.value
                    case 'TargetGender':
                        return customer.gender === filter.value
                    case 'TargetBranch':
                        return customer.branch === filter.value
                    case 'TargetAge':
                        return customer.ageRange === filter.value
                    default:
                        return true
                }
            })
        })
    }, [filters])

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormValues((prev) => ({
            ...prev,
            [name]: value
        }))
    }

    const handleTargetSelect = (target) => {
        setActiveTarget(target)
        setFilters([])
        setSelectedRecipients([])
        setFormValues((prev) => ({
            ...prev,
            filterType: '',
            filterValue: ''
        }))
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

        if (
            filters.some(
                (filter) =>
                    filter.type === formValues.filterType &&
                    filter.value === formValues.filterValue
            )
        ) {
            return
        }

        setFilters((prev) => [
            ...prev,
            {
                type: formValues.filterType,
                label: formValues.filterType.replace(/([A-Z])/g, ' $1'),
                value: formValues.filterValue
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

    const handleDispatch = () => {
        if (!formValues.title || !formValues.message) {
            setStatusMessage('Please enter title and message.')
            return
        }

        if (formValues.sendMode === 'Schedule' && (!formValues.scheduleDate || !formValues.scheduleTime)) {
            setStatusMessage('Please select a schedule date and time.')
            return
        }

        const recipients = selectedRecipients.length > 0 ? selectedRecipients : availableRecipients

        if (recipients.length === 0) {
            setStatusMessage('No recipients found.')
            return
        }

        setStatusMessage(`${recipients.length} notifications queued successfully.`)
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

                    <div className="card filter-panel">
                        <div className="card-header">
                            <div>
                                <h3 className="card-title">Smart Targeting</h3>
                                <p className="card-subtitle">Add more filters to refine your audience and focus the campaign.</p>
                            </div>
                            <button className="btn btn-light-pink" type="button" onClick={handleFetchRecipients}>
                                <i className="fas fa-search" /> Fetch Recipients
                            </button>
                        </div>

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
                                    {Object.keys(dynamicFields[activeTarget]).map((item) => (
                                        <option key={item} value={item}>
                                            {item.replace(/([A-Z])/g, ' $1')}
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
                                        dynamicFields[activeTarget][formValues.filterType].map((option) => (
                                            <option key={option} value={option}>
                                                {option}
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

                        {filters.length > 0 && (
                            <div style={{ marginTop: 18, display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                                {filters.map((filter) => (
                                    <span key={filter.type} className="filter-chip">
                                        <strong>{filter.label}:</strong> {filter.value}
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
                                disabled={((selectedRecipients.length === 0 && availableRecipients.length === 0) || !formValues.title || !formValues.message)}
                            >
                                <i className="fas fa-paper-plane" /> Dispatch Notification
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

                    <div className="card">
                        <div className="card-header">
                            <div>
                                <h3 className="card-title">Recipients Preview</h3>
                                <p className="card-subtitle">Review who will receive the notification before dispatch.</p>
                            </div>
                        </div>

                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 12 }}>
                            {selectedRecipients.length === 0 ? (
                                <li className="card" style={{ padding: 20, textAlign: 'center', background: 'rgba(111, 63, 255, 0.04)' }}>
                                    <p className="card-subtitle" style={{ margin: 0 }}>
                                        No recipients selected yet — click Fetch Recipients to load the audience.
                                    </p>
                                </li>
                            ) : (
                                selectedRecipients.map((recipient) => (
                                    <li key={recipient.id} className="recipient-card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                        <div className="recipient-avatar">{recipient.name.charAt(0)}</div>
                                        <div style={{ flex: 1 }}>
                                            <h4 className="merchant-mini-name" style={{ margin: 0 }}>{recipient.name}</h4>
                                            <p className="merchant-mini-category" style={{ margin: 0 }}>{recipient.category} • {recipient.branch}</p>
                                        </div>
                                        <button
                                            className="btn btn-secondary"
                                            type="button"
                                            onClick={() => setSelectedRecipients((prev) => prev.filter((r) => r.id !== recipient.id))}
                                        >
                                            Remove
                                        </button>
                                    </li>
                                ))
                            )}
                        </ul>
                    </div>

                    <div className="card" style={{ marginTop: 20 }}>
                        <div className="card-header">
                            <div>
                                <h3 className="card-title">Sent Notification List</h3>
                                <p className="card-subtitle">Filter sends by date range and view recipients.</p>
                            </div>
                        </div>

                        <div className="form-row" style={{ gap: 16, flexWrap: 'wrap', marginBottom: 18 }}>
                            <div className="form-group-classic" style={{ minWidth: 180, flex: 1 }}>
                                <label className="form-label-classic">From</label>
                                <input
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                    className="form-control"
                                />
                            </div>
                            <div className="form-group-classic" style={{ minWidth: 180, flex: 1 }}>
                                <label className="form-label-classic">To</label>
                                <input
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                    className="form-control"
                                />
                            </div>
                        </div>

                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 14 }}>
                            {filteredSendLogs.length === 0 ? (
                                <li className="card" style={{ padding: 18, textAlign: 'center', background: 'rgba(111, 63, 255, 0.04)' }}>
                                    <p className="card-subtitle" style={{ margin: 0 }}>
                                        No sent notifications match the selected date range.
                                    </p>
                                </li>
                            ) : (
                                filteredSendLogs.map((log) => (
                                    <li key={log.id} className="card" style={{ padding: 18 }}>
                                        <div className="flex-between" style={{ gap: 12, flexWrap: 'wrap' }}>
                                            <div>
                                                <h4 style={{ margin: '0 0 6px' }}>{log.title}</h4>
                                                <p className="card-subtitle" style={{ margin: 0 }}>{log.detail}</p>
                                            </div>
                                            <div style={{ minWidth: 140, textAlign: 'right' }}>
                                                <span className="card-subtitle">{log.date}</span>
                                                <div style={{ fontWeight: 600 }}>{log.time}</div>
                                            </div>
                                        </div>
                                        <div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 }}>
                                            <span className="merchant-mini-category">{log.recipient}</span>
                                        </div>
                                    </li>
                                ))
                            )}
                        </ul>
                    </div>
                </div>

            </div>
        </>
    )
}
