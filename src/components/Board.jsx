// Board.jsx

import React, { useState, useCallback, useRef } from 'react'
import Column from './Column'


export const STATUSES = ['todo', 'working', 'completed', 'onhold']

export const COLUMN_META = {
  todo: {
    label: 'To Do',
    emoji: '📝',
    dot: 'bg-[#6b7fff] shadow-[0_0_8px_#6b7fff]'
  },

  working: {
    label: 'Working',
    emoji: '⚡',
    dot: 'bg-[#e8a04a] shadow-[0_0_8px_#e8a04a]'
  },

  completed: {
    label: 'Completed',
    emoji: '✓',
    dot: 'bg-[#4ecb83] shadow-[0_0_8px_#4ecb83]'
  },

  onhold: {
    label: 'On Hold',
    emoji: '⏸',
    dot: 'bg-[#9b7fe8] shadow-[0_0_8px_#9b7fe8]'
  },
}

function getStatusAtPoint(x, y) {

  const ghost = document.getElementById('touch-drag-ghost')

  if (ghost) ghost.style.display = 'none'

  const el = document.elementFromPoint(x, y)

  if (ghost) ghost.style.display = ''

  if (!el) return null

  const col = el.closest('[data-status]')

  return col ? col.getAttribute('data-status') : null
}

export default function Board({
  tasks,
  onAdd,
  onDelete,
  onEdit,
  onMove,
  onComplete,
  onView,
  commentCounts = {},
  onMarkCommentRead,
}) {

  const [draggingId, setDraggingId] = useState(null)
  const [dragOverStatus, setDragOverStatus] = useState(null)

  const draggingIdRef = useRef(null)

 const handleDragStart = useCallback((id) => {
  // Use requestAnimationFrame for instant visual feedback
  requestAnimationFrame(() => {
    setDraggingId(id)
  })
  draggingIdRef.current = id
}, [])

  const handleDragEnd = useCallback(() => {
    setDraggingId(null)
    draggingIdRef.current = null
    setDragOverStatus(null)
  }, [])

  const handleDrop = useCallback((newStatus) => {

    const id = draggingIdRef.current

    if (!id) return

    const task = tasks.find(t => t.id === id)

    if (
      task &&
      task.status !== 'completed' &&
      newStatus === 'completed'
    ) {
      onComplete?.()
    }

    onMove(id, newStatus)

    setDraggingId(null)
    draggingIdRef.current = null
    setDragOverStatus(null)

  }, [tasks, onMove, onComplete])

  const handleTouchMove = useCallback((x, y) => {
    setDragOverStatus(getStatusAtPoint(x, y))
  }, [])

  const handleTouchDrop = useCallback((x, y) => {

    const status = getStatusAtPoint(x, y)

    if (!status) {
      setDragOverStatus(null)
      return
    }

    const id = draggingIdRef.current

    const task = tasks.find(t => t.id === id)

    if (
      task &&
      task.status !== 'completed' &&
      status === 'completed'
    ) {
      onComplete?.()
    }

    onMove(id, status)

    setDragOverStatus(null)

  }, [tasks, onMove, onComplete])

  return (
    <main className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

      {STATUSES.map(status => (

        <Column
          key={status}

          status={status}

          meta={COLUMN_META[status]}

          tasks={tasks.filter(t => t.status === status)}

          draggingId={draggingId}

          isDragOver={dragOverStatus === status}

          onDragStart={handleDragStart}

          onDragEnd={handleDragEnd}

          onDragOver={() => setDragOverStatus(status)}

          onDragLeave={() =>
            setDragOverStatus(s => s === status ? null : s)
          }

          onDrop={() => handleDrop(status)}

          onTouchMove={handleTouchMove}

          onTouchDrop={handleTouchDrop}

          onAdd={(title) => onAdd(title, status)}

          onDelete={onDelete}
onEdit={onEdit}
commentCounts={commentCounts}
onMarkCommentRead={onMarkCommentRead}

          // ✅ PASS VIEW
          onView={onView}
        />

      ))}

    </main>
  )
}