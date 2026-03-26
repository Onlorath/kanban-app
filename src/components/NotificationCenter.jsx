export default function NotificationCenter({ notifications, onDismiss }) {
  if (!notifications || notifications.length === 0) return null

  return (
    <div className="notification-center">
      {notifications.map((n) => (
        <div key={n.id} className={`toast toast-${n.type}`}>
          <span className="toast-icon">
            {n.type === 'danger' ? '⚠️' : n.type === 'warning' ? '⏰' : '📌'}
          </span>
          <div className="toast-content">
            <div className="toast-title">{n.title}</div>
            <div className="toast-message">{n.message}</div>
          </div>
          <button className="toast-close" onClick={() => onDismiss(n.id)}>×</button>
        </div>
      ))}
    </div>
  )
}
