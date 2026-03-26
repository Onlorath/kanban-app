import { useState, useRef } from 'react'
import DatePicker from './DatePicker'

const CLICK_THRESHOLD = 5 // px

export default function TaskCard({ task, columnId, onUpdate, onDelete, onClick }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(task)
  const pointerStart = useRef(null)
  const wasDragged = useRef(false)

  // Click/Drag ayrımı
  const handlePointerDown = (e) => {
    pointerStart.current = { x: e.clientX, y: e.clientY }
    wasDragged.current = false
  }

  const handlePointerMove = (e) => {
    if (!pointerStart.current) return
    const dx = Math.abs(e.clientX - pointerStart.current.x)
    const dy = Math.abs(e.clientY - pointerStart.current.y)
    if (dx > CLICK_THRESHOLD || dy > CLICK_THRESHOLD) {
      wasDragged.current = true
    }
  }

  const handlePointerUp = () => {
    // Sürüklenmediyse click olarak kabul et
    if (!wasDragged.current && pointerStart.current) {
      onClick?.(task)
    }
    pointerStart.current = null
    wasDragged.current = false
  }

  const handleDragStart = (e) => {
    wasDragged.current = true
    e.dataTransfer.setData('application/kanban', JSON.stringify({ taskId: task.id, fromColId: columnId }))
    e.dataTransfer.effectAllowed = 'move'
    requestAnimationFrame(() => {
      e.currentTarget.classList.add('dragging')
    })
  }

  const handleDragEnd = (e) => {
    e.currentTarget.classList.remove('dragging')
    pointerStart.current = null
    wasDragged.current = false
  }

  const handleSave = () => {
    if (!draft.title.trim()) return
    onUpdate(task.id, { ...draft, title: draft.title.trim() })
    setEditing(false)
  }

  const handleCancel = () => { setDraft(task); setEditing(false) }

  const getDueStatus = () => {
    if (!task.dueDate) return null
    const now = new Date(); now.setHours(0, 0, 0, 0)
    const due = new Date(task.dueDate + 'T00:00:00'); due.setHours(0, 0, 0, 0)
    const diffDays = Math.ceil((due - now) / 86400000)
    if (diffDays < 0) return 'overdue'
    if (diffDays <= 1) return 'soon'
    return null
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
  }

  const dueStatus = getDueStatus()

  if (editing) {
    return (
      <div className="task-card" draggable={false}>
        <div className="task-edit-form">
          <input
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            placeholder="Görev başlığı"
            autoFocus
          />
          <textarea
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            placeholder="Açıklama"
            rows={2}
          />
          <div style={{ display: 'flex', gap: '8px' }}>
            <select
              value={draft.priority}
              onChange={(e) => setDraft({ ...draft, priority: e.target.value })}
              style={{ flex: 1 }}
            >
              <option value="low">Düşük</option>
              <option value="medium">Orta</option>
              <option value="high">Yüksek</option>
            </select>
          </div>
          <DatePicker
            value={draft.dueDate || ''}
            onChange={(date) => setDraft({ ...draft, dueDate: date })}
            timeValue={draft.dueTime || ''}
            onTimeChange={(time) => setDraft({ ...draft, dueTime: time })}
          />
          <div className="edit-actions">
            <button className="btn btn-sm" onClick={handleCancel}>İptal</button>
            <button className="btn btn-sm btn-primary" onClick={handleSave}>Kaydet</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="task-card"
      draggable
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="task-card-header">
        <span className="task-title">{task.title}</span>
        <div className="task-actions" onPointerDown={(e) => e.stopPropagation()}>
          <button
            onClick={(e) => { e.stopPropagation(); setDraft(task); setEditing(true) }}
            title="Düzenle"
          >✏️</button>
          <button
            className="delete"
            onClick={(e) => { e.stopPropagation(); onDelete(task.id) }}
            title="Sil"
          >🗑️</button>
        </div>
      </div>
      {task.description && (
        <div className="task-description">{task.description}</div>
      )}
      <div className="task-footer">
        <span className={`task-badge priority-${task.priority}`}>
          {task.priority === 'low' ? 'Düşük' : task.priority === 'medium' ? 'Orta' : 'Yüksek'}
        </span>
        {task.dueDate && (
          <span className={`task-due ${dueStatus || ''}`}>
            📅 {formatDate(task.dueDate)}{task.dueTime ? ` ${task.dueTime}` : ''}
          </span>
        )}
      </div>
    </div>
  )
}
