import { useState, useEffect, useRef } from 'react'
import Board from './components/Board'
import NotificationCenter from './components/NotificationCenter'
import Settings from './components/Settings'
import DatePicker from './components/DatePicker'
import CardDetailModal from './components/CardDetailModal'
import {
  loadBoard,
  saveBoard,
  addColumn,
  deleteColumn,
  renameColumn,
  addTaskToColumn,
  moveTask,
  updateTask,
  deleteTask,
  getAllTasks,
  archiveTasks,
} from './utils/boardUtils'

const SETTINGS_KEY = 'kanban_settings'

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* */ }
  return {
    theme: 'dark',
    background: null,
    backgroundUrl: '',
    backgroundImage: '',
    boardOpacity: 95,
    notificationsEnabled: true,
  }
}

function sendNativeNotification(title, body) {
  if (window.electronAPI) {
    window.electronAPI.sendNotification(title, body)
    return
  }
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body })
  }
}

function formatDateTR(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('tr-TR', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

function App() {
  const [board, setBoard] = useState(null)
  const [settings, setSettings] = useState(loadSettings)
  const [notifications, setNotifications] = useState([])
  const [selectedTask, setSelectedTask] = useState(null)

  // Bildirim takibi için REF — sonsuz döngüyü kırar
  const notifiedRef = useRef(new Set())

  // Ref'i ilk yüklemede localStorage'dan doldur
  const notifiedLoaded = useRef(false)
  if (!notifiedLoaded.current) {
    notifiedLoaded.current = true
    try {
      const raw = localStorage.getItem('kanban_notified')
      if (raw) {
        const arr = JSON.parse(raw)
        arr.forEach((k) => notifiedRef.current.add(k))
      }
    } catch { /* */ }
  }

  // Modals
  const [showAddTaskModal, setShowAddTaskModal] = useState(false)
  const [showAddColModal, setShowAddColModal] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [confirmModal, setConfirmModal] = useState(null)

  // Sayfa
  const [view, setView] = useState('board')

  // Görev draft
  const [taskDraft, setTaskDraft] = useState({
    title: '', description: '', priority: 'medium', dueDate: '', dueTime: '', columnId: '',
  })

  // Kolon draft
  const [colName, setColName] = useState('')

  useEffect(() => { setBoard(loadBoard()) }, [])
  useEffect(() => { if (board) saveBoard(board) }, [board])
  useEffect(() => { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)) }, [settings])

  // Otomatik arşivleme: uygulama açıldığında ve her dakika kontrol
  const lastArchiveCheck = useRef(null)
  useEffect(() => {
    if (!board) return

    const doArchive = () => {
      const now = new Date().toISOString().split('T')[0]
      // Aynı gün içinde tekrar çalıştırma (performans için)
      if (lastArchiveCheck.current === now) return
      lastArchiveCheck.current = now
      setBoard((b) => archiveTasks(b))
    }

    const timer = setTimeout(doArchive, 1000)
    const interval = setInterval(doArchive, 60000) // her dakika kontrol
    return () => { clearTimeout(timer); clearInterval(interval) }
  }, [board?.archived?.length]) // eslint-disable-line react-hooks/exhaustive-deps

  // Tema
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme)
  }, [settings.theme])

  // Arka plan
  useEffect(() => {
    const body = document.body
    if (settings.backgroundImage) {
      body.style.background = `url(${settings.backgroundImage}) center/cover no-repeat fixed`
    } else if (settings.backgroundUrl) {
      body.style.background = `url(${settings.backgroundUrl}) center/cover no-repeat fixed`
    } else if (settings.background) {
      body.style.background = settings.background
    } else {
      body.style.background = ''
    }
    document.documentElement.style.setProperty('--board-opacity', `${(settings.boardOpacity ?? 95) / 100}`)
  }, [settings.background, settings.backgroundUrl, settings.backgroundImage, settings.boardOpacity])

  // Bildirim izni (browser)
  useEffect(() => {
    if (!window.electronAPI && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  // Bildirim kontrolü — stabilized: notifiedRef dependency YOK
  useEffect(() => {
    if (!board || settings.notificationsEnabled === false) return

    const check = () => {
      const tasks = getAllTasks(board)
      const now = new Date()
      const nowDate = new Date(now)
      nowDate.setHours(0, 0, 0, 0)
      const newNotifs = []
      const notified = notifiedRef.current

      for (const task of tasks) {
        if (!task.dueDate) continue
        if (task.columnId === 'col-done') continue
        const dueDate = new Date(task.dueDate + 'T00:00:00')
        const diffDays = Math.ceil((dueDate - nowDate) / 86400000)

        if (task.dueTime && diffDays === 0) {
          const [h, m] = task.dueTime.split(':').map(Number)
          const dueDateTime = new Date(dueDate)
          dueDateTime.setHours(h, m, 0, 0)
          const diffMinutes = Math.floor((dueDateTime - now) / 60000)

          if (diffMinutes >= 0 && diffMinutes <= 15) {
            const key = `time-${task.id}-${task.dueDate}-${task.dueTime}`
            if (!notified.has(key)) {
              const msg = `"${task.title}" görevinin süresi ${diffMinutes === 0 ? 'şimdi doluyor' : `${diffMinutes} dk sonra`}!`
              sendNativeNotification('Kanban - Görev Yaklaşıyor', msg)
              newNotifs.push({ id: key, type: 'warning', title: 'Görev Zamanı Yaklaşıyor', message: msg })
              notified.add(key)
            }
          }
          if (diffMinutes < 0) {
            const key = `time-overdue-${task.id}-${task.dueDate}-${task.dueTime}`
            if (!notified.has(key)) {
              const msg = `"${task.title}" görevinin süresi geçti (${task.dueDate} ${task.dueTime})`
              sendNativeNotification('Kanban - Süresi Geçmiş', msg)
              newNotifs.push({ id: key, type: 'danger', title: 'Süresi Geçmiş', message: msg })
              notified.add(key)
            }
          }
        } else {
          if (diffDays < 0) {
            const key = `overdue-${task.id}-${task.dueDate}`
            if (!notified.has(key)) {
              const msg = `"${task.title}" görevinin süresi geçti (${formatDateTR(task.dueDate)})`
              sendNativeNotification('Kanban - Süresi Geçmiş', msg)
              newNotifs.push({ id: key, type: 'danger', title: 'Süresi Geçmiş', message: msg })
              notified.add(key)
            }
          } else if (diffDays === 0) {
            const key = `today-${task.id}-${task.dueDate}`
            if (!notified.has(key)) {
              const msg = `"${task.title}" görevi bugün teslim edilmeli`
              sendNativeNotification('Kanban - Bugün Teslim', msg)
              newNotifs.push({ id: key, type: 'warning', title: 'Bugün Teslim', message: msg })
              notified.add(key)
            }
          } else if (diffDays === 1) {
            const key = `tomorrow-${task.id}-${task.dueDate}`
            if (!notified.has(key)) {
              const msg = `"${task.title}" görevi yarın teslim edilmeli`
              sendNativeNotification('Kanban - Yarın Teslim', msg)
              newNotifs.push({ id: key, type: 'info', title: 'Yarın Teslim', message: msg })
              notified.add(key)
            }
          }
        }
      }

      if (newNotifs.length > 0) {
        setNotifications((prev) => {
          const prevIds = new Set(prev.map((n) => n.id))
          return [...prev, ...newNotifs.filter((n) => !prevIds.has(n.id))]
        })
        localStorage.setItem('kanban_notified', JSON.stringify([...notified]))
      }
    }

    const timer = setTimeout(check, 2000)
    const interval = setInterval(check, 30000)
    return () => { clearTimeout(timer); clearInterval(interval) }
    // board ve settings.notificationsEnabled değişirse yeniden kurulur
    // notifiedRef dependency YOK — bu yüzden döngü oluşmaz
  }, [board, settings.notificationsEnabled])

  // Handlers
  const openAddTaskModal = () => {
    const firstColId = board?.columns?.[0]?.id || ''
    setTaskDraft({ title: '', description: '', priority: 'medium', dueDate: '', dueTime: '', columnId: firstColId })
    setShowAddTaskModal(true)
  }

  const handleAddTask = () => {
    if (!taskDraft.title.trim() || !taskDraft.columnId) return
    const task = {
      id: crypto.randomUUID(),
      title: taskDraft.title.trim(),
      description: taskDraft.description.trim(),
      priority: taskDraft.priority,
      dueDate: taskDraft.dueDate,
      dueTime: taskDraft.dueTime || '',
      createdAt: new Date().toISOString(),
    }
    setBoard((b) => addTaskToColumn(b, taskDraft.columnId, task))
    setShowAddTaskModal(false)
  }

  const openAddColModal = () => { setColName(''); setShowAddColModal(true) }
  const handleAddColumn = () => {
    if (!colName.trim()) return
    setBoard((b) => addColumn(b, colName.trim()))
    setShowAddColModal(false)
  }

  const handleDeleteColumn = (id) => {
    setConfirmModal({ message: 'Bu kolonu silmek istediğinize emin misiniz?', onConfirm: () => setBoard((b) => deleteColumn(b, id)) })
  }
  const handleDeleteTask = (taskId) => {
    setConfirmModal({ message: 'Bu görevi silmek istediğinize emin misiniz?', onConfirm: () => setBoard((b) => deleteTask(b, taskId)) })
  }
  const handleRenameColumn = (id, title) => setBoard((b) => renameColumn(b, id, title))
  const handleUpdateTask = (taskId, updates) => setBoard((b) => updateTask(b, taskId, updates))
  const handleMoveTask = (taskId, fromColId, toColId, toIndex) => setBoard((b) => moveTask(b, taskId, fromColId, toColId, toIndex))
  const toggleTheme = () => setSettings((s) => ({ ...s, theme: s.theme === 'dark' ? 'light' : 'dark' }))

  // Kart detay modalı
  const handleCardClick = (task) => {
    setSelectedTask(task)
  }
  const handleCloseCardDetail = () => {
    setSelectedTask(null)
  }

  // Platform algılama
  const isMac = window.electronAPI
    ? navigator.platform.toUpperCase().indexOf('MAC') >= 0
    : false

  if (!board) return <div className="loading">Yükleniyor...</div>

  return (
    <div className={`app-wrapper ${isMac ? 'platform-mac' : 'platform-win'}`}>
      <header className="kanban-header">
        {isMac ? (
          <div className="header-left">
            <span className="logo">📋</span>
            <h1>Kanban</h1>
          </div>
        ) : (
          <div className="header-left">
            <span className="logo">📋</span>
            <h1>Kanban</h1>
          </div>
        )}
        <div className="header-right">
          <button className={`btn ${view === 'archive' ? 'btn-active' : ''}`} onClick={() => setView(view === 'archive' ? 'board' : 'archive')}>📁 Arşiv{board?.archived?.length > 0 ? ` (${board.archived.reduce((sum, g) => sum + g.tasks.length, 0)})` : ''}</button>
          <button className="btn btn-icon" onClick={() => setShowSettings(true)} title="Ayarlar">⚙️</button>
          <button className="btn" onClick={toggleTheme}>
            {settings.theme === 'dark' ? '☀️ Açık Mod' : '🌙 Koyu Mod'}
          </button>
          <button className="btn" onClick={openAddColModal}>➕ Kolon Ekle</button>
          <button className="btn btn-primary" onClick={openAddTaskModal}>➕ Görev Ekle</button>
        </div>
      </header>

      {view === 'board' ? (
        <Board
          board={board}
          onRenameColumn={handleRenameColumn}
          onDeleteColumn={handleDeleteColumn}
          onUpdateTask={handleUpdateTask}
          onDeleteTask={handleDeleteTask}
          onMoveTask={handleMoveTask}
          onCardClick={handleCardClick}
        />
      ) : (
        <div className="archive-page">
          <div className="archive-page-header">
            <h2>📁 Arşiv ({board?.archived?.reduce((sum, g) => sum + g.tasks.length, 0) || 0} görev)</h2>
            <button className="btn" onClick={() => setView('board')}>⬅ Geri</button>
          </div>
          <div className="archive-page-body">
            {(!board?.archived || board.archived.length === 0) ? (
              <p className="archive-empty">Henüz arşivlenmiş görev yok.</p>
            ) : (
              board.archived.map((group) => (
                <div key={group.date} className="archive-group">
                  <h3 className="archive-date-title">{group.label}</h3>
                  <div className="archive-tasks">
                    {group.tasks.map((task) => (
                      <div key={task.id} className="archive-task">
                        <span className={`archive-task-priority priority-${task.priority}`}>{task.priority === 'high' ? '🔴' : task.priority === 'medium' ? '🟡' : '🟢'}</span>
                        <span className="archive-task-title">{task.title}</span>
                        {task.description && <span className="archive-task-desc">{task.description}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Görev Ekleme Modalı */}
      {showAddTaskModal && (
        <div className="modal-overlay" onClick={() => setShowAddTaskModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Yeni Görev Ekle</h2>
              <button className="modal-close" onClick={() => setShowAddTaskModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Başlık *</label>
                <input
                  value={taskDraft.title}
                  onChange={(e) => setTaskDraft({ ...taskDraft, title: e.target.value })}
                  placeholder="Görev başlığını yazın"
                  autoFocus
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddTask() }}
                />
              </div>
              <div className="form-group">
                <label>Açıklama</label>
                <textarea
                  value={taskDraft.description}
                  onChange={(e) => setTaskDraft({ ...taskDraft, description: e.target.value })}
                  placeholder="Görev açıklaması (isteğe bağlı)"
                  rows={3}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Kolon</label>
                  <select value={taskDraft.columnId} onChange={(e) => setTaskDraft({ ...taskDraft, columnId: e.target.value })}>
                    {board.columns.map((col) => <option key={col.id} value={col.id}>{col.title}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Önem Derecesi</label>
                  <select value={taskDraft.priority} onChange={(e) => setTaskDraft({ ...taskDraft, priority: e.target.value })}>
                    <option value="low">Düşük</option>
                    <option value="medium">Orta</option>
                    <option value="high">Yüksek</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Teslim Tarihi ve Saati</label>
                <DatePicker
                  value={taskDraft.dueDate}
                  onChange={(date) => setTaskDraft({ ...taskDraft, dueDate: date })}
                  timeValue={taskDraft.dueTime}
                  onTimeChange={(time) => setTaskDraft({ ...taskDraft, dueTime: time })}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setShowAddTaskModal(false)}>İptal</button>
              <button className="btn btn-primary" onClick={handleAddTask}>Görevi Ekle</button>
            </div>
          </div>
        </div>
      )}

      {/* Kolon Ekleme Modalı */}
      {showAddColModal && (
        <div className="modal-overlay" onClick={() => setShowAddColModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Yeni Kolon Ekle</h2>
              <button className="modal-close" onClick={() => setShowAddColModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Kolon Adı *</label>
                <input
                  value={colName}
                  onChange={(e) => setColName(e.target.value)}
                  placeholder="Kolon adını yazın"
                  autoFocus
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddColumn() }}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setShowAddColModal(false)}>İptal</button>
              <button className="btn btn-primary" onClick={handleAddColumn}>Kolon Ekle</button>
            </div>
          </div>
        </div>
      )}

      {/* Onay Modalı */}
      {confirmModal && (
        <div className="modal-overlay" onClick={() => setConfirmModal(null)}>
          <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h2>Onay</h2><button className="modal-close" onClick={() => setConfirmModal(null)}>×</button></div>
            <div className="modal-body"><p>{confirmModal.message}</p></div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setConfirmModal(null)}>İptal</button>
              <button className="btn btn-danger-solid" onClick={() => { confirmModal.onConfirm(); setConfirmModal(null) }}>Sil</button>
            </div>
          </div>
        </div>
      )}

      {/* Ayarlar Modalı */}
      {showSettings && (
        <Settings
          settings={settings}
          onUpdate={setSettings}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Kart Detay Modalı */}
      {selectedTask && (() => {
        const col = board.columns.find((c) => c.tasks.some((t) => t.id === selectedTask.id))
        const freshTask = col?.tasks.find((t) => t.id === selectedTask.id)
        if (!freshTask) return null
        return (
          <CardDetailModal
            task={freshTask}
            columnName={col?.title || ''}
            onClose={handleCloseCardDetail}
            onUpdate={(id, updates) => { setBoard((b) => updateTask(b, id, updates)); setSelectedTask({ ...freshTask, ...updates }) }}
          />
        )
      })()}

      <NotificationCenter
        notifications={notifications}
        onDismiss={(id) => setNotifications((prev) => prev.filter((n) => n.id !== id))}
      />
    </div>
  )
}

export default App
