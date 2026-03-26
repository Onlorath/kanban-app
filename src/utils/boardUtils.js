const STORAGE_KEY = 'kanban_board_v1'

export function loadBoard() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return createDefaultBoard()
}

export function saveBoard(board) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(board))
  } catch { /* ignore */ }
}

export function createDefaultBoard() {
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)

  return {
    columns: [
      {
        id: 'col-todo',
        title: 'Yapılacak',
        tasks: [
          {
            id: crypto.randomUUID(),
            title: 'Proje planını oluştur',
            description: 'Kanban uygulaması için gereksinimleri belirle',
            priority: 'high',
            dueDate: tomorrow.toISOString().split('T')[0],
            createdAt: now.toISOString(),
          },
          {
            id: crypto.randomUUID(),
            title: 'Tasarım mockupları',
            description: 'Figma üzerinde UI tasarımlarını hazırla',
            priority: 'medium',
            dueDate: '',
            createdAt: now.toISOString(),
          },
        ],
      },
      {
        id: 'col-progress',
        title: 'Devam Ediyor',
        tasks: [
          {
            id: crypto.randomUUID(),
            title: 'Component yapısını kur',
            description: 'React bileşenlerini oluştur',
            priority: 'high',
            dueDate: yesterday.toISOString().split('T')[0],
            createdAt: now.toISOString(),
          },
        ],
      },
      {
        id: 'col-done',
        title: 'Tamamlandı',
        tasks: [],
      },
    ],
  }
}

export function addColumn(board, title) {
  return {
    ...board,
    columns: [
      ...board.columns,
      { id: crypto.randomUUID(), title, tasks: [] },
    ],
  }
}

export function deleteColumn(board, columnId) {
  return {
    ...board,
    columns: board.columns.filter((c) => c.id !== columnId),
  }
}

export function renameColumn(board, columnId, newTitle) {
  return {
    ...board,
    columns: board.columns.map((c) =>
      c.id === columnId ? { ...c, title: newTitle } : c
    ),
  }
}

export function addTaskToColumn(board, columnId, task) {
  return {
    ...board,
    columns: board.columns.map((c) =>
      c.id === columnId
        ? { ...c, tasks: [...c.tasks, task] }
        : c
    ),
  }
}

export function moveTask(board, taskId, fromColId, toColId, toIndex) {
  let task = null
  const columns = board.columns.map((col) => {
    if (col.id === fromColId) {
      const found = col.tasks.find((t) => t.id === taskId)
      if (found) task = found
      return { ...col, tasks: col.tasks.filter((t) => t.id !== taskId) }
    }
    return col
  })

  if (!task) return board

  return {
    ...board,
    columns: columns.map((col) => {
      if (col.id === toColId) {
        const newTasks = [...col.tasks]
        const idx = toIndex >= 0 ? toIndex : newTasks.length
        newTasks.splice(idx, 0, task)
        return { ...col, tasks: newTasks }
      }
      return col
    }),
  }
}

export function updateTask(board, taskId, updates) {
  return {
    ...board,
    columns: board.columns.map((col) => ({
      ...col,
      tasks: col.tasks.map((t) =>
        t.id === taskId ? { ...t, ...updates } : t
      ),
    })),
  }
}

export function deleteTask(board, taskId) {
  return {
    ...board,
    columns: board.columns.map((col) => ({
      ...col,
      tasks: col.tasks.filter((t) => t.id !== taskId),
    })),
  }
}

export function getAllTasks(board) {
  const tasks = []
  for (const col of board.columns) {
    for (const task of col.tasks) {
      tasks.push({ ...task, columnId: col.id, columnTitle: col.title })
    }
  }
  return tasks
}
