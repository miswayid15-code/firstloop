export default function GenericPage({ title, description }) {
    return (
        <div className="card">
            <div className="flex-between" style={{ marginBottom: 24 }}>
                <div>
                    <h3 className="card-title">{title}</h3>
                    <p className="card-subtitle">{description}</p>
                </div>
            </div>
            <div style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                This section has been converted to React and is ready for data binding.
            </div>
        </div>
    )
}
