import { useState } from 'react'

const notificationRows = [
    { title: 'New merchant approved', message: 'Starbucks Coffee has been activated.', time: '5 mins ago', type: 'success' },
    { title: 'Coupon campaign live', message: 'SBUX50 is now running at Downtown Starbucks.', time: '22 mins ago', type: 'info' },
    { title: 'Appointment confirmed', message: 'Booking at City Mall Store is confirmed.', time: '1 hour ago', type: 'success' },
    { title: 'Pending verification', message: 'Beauty & Wellness category needs approval.', time: '2 hours ago', type: 'pending' }
]

export default function Notifications() {
    const [showUnreadOnly, setShowUnreadOnly] = useState(false)

    const filteredNotifications = showUnreadOnly ? notificationRows.slice(0, 2) : notificationRows

    return (
        <>
            <div className="flex-between" style={{ marginBottom: 24, gap: 20, flexWrap: 'wrap' }}>
                <div>
                    <h3 className="card-title">Notifications</h3>
                    <p className="card-subtitle">Review system alerts and communication updates.</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowUnreadOnly((prev) => !prev)}>
                    {showUnreadOnly ? 'Show All' : 'Show Unread'}
                </button>
            </div>

            <div className="card">
                <div className="activity-list">
                    {filteredNotifications.map((notification) => (
                        <div key={notification.title} className="activity-item" style={{ alignItems: 'flex-start', padding: '18px 20px' }}>
                            <div className="activity-icon" style={{ marginTop: 4, color: notification.type === 'success' ? 'var(--status-success)' : notification.type === 'pending' ? 'var(--status-warning)' : 'var(--status-info)' }}>
                                <i className={`fas ${notification.type === 'success' ? 'fa-check-circle' : notification.type === 'pending' ? 'fa-exclamation-circle' : 'fa-bell'}`} />
                            </div>
                            <div className="activity-details" style={{ width: '100%' }}>
                                <p className="activity-text"><strong>{notification.title}</strong> — {notification.message}</p>
                                <span className="activity-time">{notification.time}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    )
}
