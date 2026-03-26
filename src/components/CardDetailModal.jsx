import { useEffect } from 'react'

const PRIORITY_MAP = {
  low: { label: 'Düşük', class: 'priority-low', icon: '🟢' },
  medium: { label: 'Orta', class: 'priority-medium', icon: '🟡' },
  high: { label: 'Yüksek', class: 'priority-high', icon: '🔴' },
}

function formatDate(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function getDueStatus(dueDate) {
  if (!dueDate) return null
  const now = new Date(); now.setHours(0, 0, 0, 0)
  const due = new Date(dueDate + 'T00:00:00'); due.setHours(0, 0, 0, 0)
  const diffDays = Math.ceil((due - now) / 86400000)
  if (diffDays < 0) return { label: 'Süresi geçti', class: 'overdue' }
  if (diffDays === 0) return { label: 'Bugün', class: 'soon' }
  if (diffDays === 1) return { label: 'Yarın', class: 'soon' }
  return { label: `${diffDays} gün kaldı`, class: '' }
}

export default function CardDetailModal({ task, columnName, onClose, onUpdate }) {
  // ESC ile kapat
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  // Body scroll kilidi
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  if (!task) return null

  const priority = PRIORITY_MAP[task.priority] || PRIORITY_MAP.medium
  const dueStatus = getDueStatus(task.dueDate)
  const formattedDate = formatDate(task.dueDate)

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div className="modal-overlay card-detail-overlay" onClick={handleOverlayClick}>
      <div className="card-detail-modal">
        {/* Header */}
        <div className="card-detail-header">
          <div className="card-detail-header-left">
            <span className="card-detail-column-badge">{columnName}</span>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {/* Başlık */}
        <div className="card-detail-title-section">
          <h2 className="card-detail-title">{task.title}</h2>
        </div>

        {/* Meta bilgiler */}
        <div className="card-detail-meta">
          {/* Öncelik */}
          <div className="card-detail-meta-item">
            <span className="card-detail-meta-label">Önem</span>
            <span className={`task-badge ${priority.class}`}>
              {priority.icon} {priority.label}
            </span>
          </div>

          {/* Tarih */}
          {task.dueDate && (
            <div className="card-detail-meta-item">
              <span className="card-detail-meta-label">Teslim Tarihi</span>
              <div className="card-detail-date-row">
                <span className={`task-due ${dueStatus?.class || ''}`}>
                  📅 {formattedDate}
                  {task.dueTime ? ` — ${task.dueTime}` : ''}
                </span>
                {dueStatus && (
                  <span className={`card-detail-due-badge ${dueStatus.class}`}>
                    {dueStatus.label}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Oluşturulma */}
          {task.createdAt && (
            <div className="card-detail-meta-item">
              <span className="card-detail-meta-label">Oluşturulma</span>
              <span className="card-detail-meta-value">
                {new Date(task.createdAt).toLocaleDateString('tr-TR', {
                  day: 'numeric', month: 'short', year: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
              </span>
            </div>
          )}
        </div>

        {/* Açıklama — tam metin, kesilmez */}
        <div className="card-detail-body">
          <h3 className="card-detail-section-title">Açıklama</h3>
          {task.description ? (
            <p className="card-detail-description">{task.description}</p>
          ) : (
            <p className="card-detail-description empty">Açıklama eklenmemiş</p>
          )}
        </div>

        {/* Alt bilgi */}
        <div className="card-detail-footer">
          <span className="card-detail-id">ID: {task.id.slice(0, 8)}</span>
        </div>
      </div>
    </div>
  )
}
