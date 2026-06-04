import React from 'react'
import Dashboard from '../components/Dashboard'
import Board from '../components/Board'

export default function BoardPage({
  tasks, onAdd, onDelete, onEdit, onMove, onComplete, onView
}) {
  return (
    <div>
      <Dashboard tasks={tasks} />
      <Board
        tasks={tasks}
        onAdd={onAdd}
        onDelete={onDelete}
        onEdit={onEdit}
        onMove={onMove}
        onComplete={onComplete}
        onView={onView}
      />
    </div>
  )
}
