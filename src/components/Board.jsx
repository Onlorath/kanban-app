import Column from './Column'

export default function Board({
  board,
  onRenameColumn,
  onDeleteColumn,
  onUpdateTask,
  onDeleteTask,
  onMoveTask,
  onCardClick,
}) {
  return (
    <div className="kanban-board">
      {board.columns.map((column) => (
        <Column
          key={column.id}
          column={column}
          onRename={onRenameColumn}
          onDelete={onDeleteColumn}
          onUpdateTask={onUpdateTask}
          onDeleteTask={onDeleteTask}
          onMoveTask={onMoveTask}
          onCardClick={onCardClick}
        />
      ))}
    </div>
  )
}
