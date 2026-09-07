import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

const notifications = [
    {
        id: 1,
        title: 'Loyalty Offer Sent',
        message: 'A special reward campaign was sent to all premium members.',
        recipient: 'Premium Members',
        date: '2026-05-17',
        time: '09:30 AM',
        status: 'Delivered'
    },
    {
        id: 2,
        title: 'New Branch Launch',
        message: 'Promotion sent to nearby customers for the new airport branch.',
        recipient: 'Airport Branch Customers',
        date: '2026-05-14',
        time: '11:10 AM',
        status: 'Delivered'
    },
    {
        id: 3,
        title: 'Feature Update Alert',
        message: 'Notification about the new dashboard analytics release.',
        recipient: 'All Users',
        date: '2026-05-09',
        time: '03:25 PM',
        status: 'Delivered'
    }
]

export default function NotificationList() {
    const [dateFrom, setDateFrom] = useState('')
    const [dateTo, setDateTo] = useState('')

    const filteredNotifications = useMemo(() => {
        return notifications.filter((notification) => {
            if (dateFrom && notification.date < dateFrom) {
                return false
            }
            if (dateTo && notification.date > dateTo) {
                return false
            }
            return true
        })
    }, [dateFrom, dateTo])

    return (
        <div>
            <div className="flex-between" style={{ marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
                <div>
                    <h2 className="card-title" style={{ fontSize: '1.4rem', marginBottom: 6 }}>
                        Notification History
                    </h2>
                    <p className="card-subtitle">
                        Browse past sends by recipient group and date range.
                    </p>
                </div>
                <Link to="/notifications" className="btn btn-secondary" style={{ minWidth: 170 }}>
                    <i className="fas fa-bell" /> Create Notification
                </Link>
            </div>

            <div className="card" style={{ padding: 24 }}>
                <div className="card-header" style={{ padding: 0, marginBottom: 20 }}>
                    <div>
                        <h3 className="card-title">Send History</h3>
                        <p className="card-subtitle">Filter notification sends by date range.</p>
                    </div>
                </div>

                <div className="form-row" style={{ gap: 20, marginBottom: 24, flexWrap: 'wrap' }}>
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

                <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 16 }}>
                    {filteredNotifications.length === 0 ? (
                        <li className="card" style={{ padding: 20, textAlign: 'center', background: 'rgba(111, 63, 255, 0.04)' }}>
                            <p className="card-subtitle" style={{ margin: 0 }}>
                                No notifications found for the selected date range.
                            </p>
                        </li>
                    ) : (
                        filteredNotifications.map((item) => (
                            <li key={item.id} className="card" style={{ padding: 18 }}>
                                <div className="flex-between" style={{ gap: 12, flexWrap: 'wrap' }}>
                                    <div>
                                        <h4 style={{ margin: '0 0 8px' }}>{item.title}</h4>
                                        <p className="card-subtitle" style={{ margin: 0 }}>{item.message}</p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <span className="card-subtitle" style={{ display: 'block' }}>{item.date} • {item.time}</span>
                                        <strong style={{ display: 'block', marginTop: 6 }}>{item.status}</strong>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
                                    <span className="merchant-mini-category">Recipient: {item.recipient}</span>
                                </div>
                            </li>
                        ))
                    )}
                </ul>
            </div>
        </div>
    )
}
