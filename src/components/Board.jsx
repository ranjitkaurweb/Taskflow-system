import React, { useState, useCallback, useRef, useEffect } from 'react'
import Column from './Column'

export const STATUSES = ['todo', 'working', 'completed', 'onhold']

export const COLUMN_META = {
  todo:      { label: 'To Do',     emoji: '📝', dot: 'bg-[#6b7fff] shadow-[0_0_8px_#6b7fff]' },
  working:   { label: 'Working',   emoji: '⚡', dot: 'bg-[#e8a04a] shadow-[0_0_8px_#e8a04a]' },
  completed: { label: 'Completed', emoji: '✓',  dot: 'bg-[#4ecb83] shadow-[0_0_8px_#4ecb83]' },
  onhold:    { label: 'On Hold',   emoji: '⏸',  dot: 'bg-[#9b7fe8] shadow-[0_0_8px_#9b7fe8]' },
}

function getStatusAtPoint(x, y, ghostId) {
  const ghost = document.getElementById(ghostId)
  if (ghost) ghost.style.display = 'none'
  const el = document.elementFromPoint(x, y)
  if (ghost) ghost.style.display = ''
  if (!el) return null
  const col = el.closest('[data-status]')
  return col ? col.getAttribute('data-status') : null
}

export default function Board({
  tasks, onAdd, onDelete, onEdit, onMove, onComplete, onView,
  commentCounts = {}, onMarkCommentRead,
}) {
  const [draggingId,     setDraggingId]     = useState(null)
  const [dragOverStatus, setDragOverStatus] = useState(null)
  const draggingIdRef    = useRef(null)

  // ── Mouse drag state ──
  const mouseDragRef = useRef({
    active:  false,
    taskId:  null,
    ghost:   null,
    offsetX: 0,
    offsetY: 0,
  })

  // ── Start mouse drag ──
  const handleMouseDragStart = useCallback((id, e, cardEl) => {
    if (e.button !== 0) return
    const rect = cardEl.getBoundingClientRect()

    // Create ghost clone
    const ghost = cardEl.cloneNode(true)
    ghost.id = 'mouse-drag-ghost'
    ghost.style.cssText = `
      position: fixed;
      left: ${rect.left}px;
      top: ${rect.top}px;
      width: ${rect.width}px;
      opacity: 0.88;
      transform: scale(1.03) rotate(1deg);
      pointer-events: none;
      z-index: 9999;
      transition: none;
      border-radius: 14px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.35);
    `
    document.body.appendChild(ghost)

    mouseDragRef.current = {
      active:  true,
      taskId:  id,
      ghost,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
    }

    draggingIdRef.current = id
    setDraggingId(id)
    document.body.style.cursor = 'grabbing'
    document.body.style.userSelect = 'none'
  }, [])

  // ── Global mousemove + mouseup ──
  useEffect(() => {
    const onMouseMove = (e) => {
      const d = mouseDragRef.current
      if (!d.active || !d.ghost) return

      d.ghost.style.left = `${e.clientX - d.offsetX}px`
      d.ghost.style.top  = `${e.clientY - d.offsetY}px`

      // Find which column we're over
      d.ghost.style.display = 'none'
      const el = document.elementFromPoint(e.clientX, e.clientY)
      d.ghost.style.display = ''
      const col = el?.closest('[data-status]')
      const status = col ? col.getAttribute('data-status') : null
      setDragOverStatus(status)
    }

    const onMouseUp = (e) => {
      const d = mouseDragRef.current
      if (!d.active) return

      // Find drop target
      if (d.ghost) d.ghost.style.display = 'none'
      const el = document.elementFromPoint(e.clientX, e.clientY)
      if (d.ghost) d.ghost.style.display = ''

      const col = el?.closest('[data-status]')
      const newStatus = col ? col.getAttribute('data-status') : null

      if (newStatus && d.taskId) {
        const task = tasks.find(t => t.id === d.taskId)
        if (task && task.status !== 'completed' && newStatus === 'completed') {
          onComplete?.()
        }
        if (task && task.status !== newStatus) {
          onMove(d.taskId, newStatus)
        }
      }

      // Cleanup
      if (d.ghost) { d.ghost.remove() }
      mouseDragRef.current = { active: false, taskId: null, ghost: null, offsetX: 0, offsetY: 0 }
      draggingIdRef.current = null
      setDraggingId(null)
      setDragOverStatus(null)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup',   onMouseUp)
    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup',   onMouseUp)
    }
  }, [tasks, onMove, onComplete])

  // ── Touch handlers (unchanged) ──
  const handleTouchMove = useCallback((x, y) => {
    setDragOverStatus(getStatusAtPoint(x, y, 'touch-drag-ghost'))
  }, [])

  const handleTouchDrop = useCallback((x, y) => {
    const status = getStatusAtPoint(x, y, 'touch-drag-ghost')
    if (!status) { setDragOverStatus(null); return }
    const id   = draggingIdRef.current
    const task = tasks.find(t => t.id === id)
    if (task && task.status !== 'completed' && status === 'completed') onComplete?.()
    onMove(id, status)
    draggingIdRef.current = null
    setDraggingId(null)
    setDragOverStatus(null)
  }, [tasks, onMove, onComplete])

  const handleTouchDragStart = useCallback((id) => {
    draggingIdRef.current = id
    setDraggingId(id)
  }, [])

  const handleTouchDragEnd = useCallback(() => {
    draggingIdRef.current = null
    setDraggingId(null)
    setDragOverStatus(null)
  }, [])

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
          onMouseDragStart={handleMouseDragStart}
          onTouchDragStart={handleTouchDragStart}
          onTouchDragEnd={handleTouchDragEnd}
          onTouchMove={handleTouchMove}
          onTouchDrop={handleTouchDrop}
          onAdd={(title) => onAdd(title, status)}
          onDelete={onDelete}
          onEdit={onEdit}
          commentCounts={commentCounts}
          onMarkCommentRead={onMarkCommentRead}
          onView={onView}
        />
      ))}
    </main>
  )
}
