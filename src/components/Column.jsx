import { useState } from 'react'
import TaskCard from './TaskCard'

export default function Column({
  column,
  onRename,
  onDelete,
  onUpdateTask,
  onDeleteTask,
  onMoveTask,
  onCardClick,
}) {
  const [dragOver, setDragOver] = useState(false)

  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (!dragOver) setDragOver(true)
  }

  const handleDragLeave = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOver(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)

    let data
    try {
      data = JSON.parse(e.dataTransfer.getData('application/kanban'))
    } catch {
      return
    }
    if (!data?.taskId) return

    const taskCards = [...e.currentTarget.querySelectorAll('.task-card:not(.dragging)')]
    let insertIndex = column.tasks.length

    for (let i = 0; i < taskCards.length; i++) {
      const rect = taskCards[i].getBoundingClientRect()
      const midY = rect.top + rect.height / 2
      if (e.clientY < midY) {
        insertIndex = i
        break
      }
    }

    onMoveTask(data.taskId, data.fromColId, column.id, insertIndex)
  }

  return (
    <div className={`kanban-column ${dragOver ? 'drop-active' : ''}`}>
      <div className="column-header">
        <div className="column-header-left">
          <input
            className="column-title"
            value={column.title}
            onChange={(e) => onRename(column.id, e.target.value)}
            onBlur={(e) => {
              if (!e.target.value.trim()) onRename(column.id, 'Adsız')
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.target.blur()
            }}
          />
          <span className="column-count">{column.tasks.length}</span>
        </div>
        <div className="column-header-right">
          <button
            className="btn btn-icon btn-danger"
            onClick={() => onDelete(column.id)}
            title="Kolonu Sil"
          >
            🗑️
          </button>
        </div>
      </div>

      <div
        className="column-body"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {column.tasks.length === 0 ? (
          <div className="column-empty">
            Görev sürükleyin veya ekleyin
          </div>
        ) : (
          column.tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              columnId={column.id}
              onUpdate={onUpdateTask}
              onDelete={onDeleteTask}
              onClick={onCardClick}
            />
          ))
        )}
      </div>
    </div>
  )
}
