import React, { useState, useRef, useEffect, useCallback } from 'react'
import { FiEye, FiEdit2, FiTrash2 } from 'react-icons/fi'


const PRIORITY_META = {
  high: { label: 'High', icon: '↑', bg: 'bg-[rgba(255,95,109,0.15)]', text: 'text-[#ff5f6d]', stripe: 'border-l-[3px] border-l-[#ff5f6d]' },
  medium: { label: 'Medium', icon: '–', bg: 'bg-[rgba(232,160,74,0.15)]', text: 'text-[#e8a04a]', stripe: 'border-l-[3px] border-l-[#e8a04a]' },
  low: { label: 'Low', icon: '↓', bg: 'bg-[rgba(78,203,131,0.15)]', text: 'text-[#4ecb83]', stripe: 'border-l-[3px] border-l-[#4ecb83]' },
}

function formatDue(dateStr) {
  if (!dateStr) return null
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}
const isOverdue = (d) => d && new Date(d) < new Date(new Date().toDateString())
const isDueSoon = (d) => {
  if (!d) return false
  const diff = (new Date(d) - new Date(new Date().toDateString())) / 86400000
  return diff >= 0 && diff <= 2
}

function EyeIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

export default function TaskCard({
  task, isDragging,
  onDragStart, onDragEnd,
  onTouchMove, onTouchDrop,
  onDelete, onEdit, onView,

}) {
  // console.log(task);
  const [editing, setEditing] = useState(false)
  const [editVal, setEditVal] = useState(task.title)
  const [touching, setTouching] = useState(false)
  const cardRef = useRef(null)
  const cloneRef = useRef(null)
  const isDraggingFromCard = useRef(false)
  const pm = PRIORITY_META[task.priority] || PRIORITY_META.medium

  useEffect(() => {
    if (editing) { cardRef.current?.querySelector('input')?.focus() }
  }, [editing])

  const confirmEdit = () => {
    setEditing(false)
    if (editVal.trim() && editVal.trim() !== task.title) onEdit(editVal.trim())
    else setEditVal(task.title)
  }

  /* ── MOUSE drag — only starts from the card body, never from buttons ── */
  const handleMouseDown = useCallback((e) => {
    // If the click target is a button or inside the actions div, do nothing
    if (e.target.closest('[data-actions]')) return
    isDraggingFromCard.current = true
  }, [])

  const handleDragStart = useCallback((e) => {
    if (!isDraggingFromCard.current) {
      e.preventDefault()
      return
    }
    isDraggingFromCard.current = false
    onDragStart?.()
  }, [onDragStart])

  const handleDragEnd = useCallback(() => {
    isDraggingFromCard.current = false
    onDragEnd?.()
  }, [onDragEnd])

  /* ── TOUCH drag ── */
  const handleTouchStart = useCallback((e) => {
    if (editing) return
    if (e.target.closest('[data-actions]')) return   // touches on buttons → don't drag

    const touch = e.touches[0]
    const startX = touch.clientX
    const startY = touch.clientY
    let started = false

    const onMove = (ev) => {
      const t = ev.touches[0]
      if (!started && (Math.abs(t.clientX - startX) > 6 || Math.abs(t.clientY - startY) > 6)) {
        started = true
        setTouching(true)
        onDragStart?.()
        const rect = cardRef.current.getBoundingClientRect()
        const ghost = cardRef.current.cloneNode(true)
        ghost.id = 'touch-drag-ghost'
        ghost.style.cssText = `position:fixed;left:${rect.left}px;top:${rect.top}px;width:${rect.width}px;opacity:0.85;transform:scale(1.04) rotate(1.5deg);pointer-events:none;z-index:9999;transition:none;border-radius:16px;box-shadow:0 20px 40px rgba(0,0,0,0.4);`
        document.body.appendChild(ghost)
        cloneRef.current = ghost
      }
      if (!started) return
      ev.preventDefault()
      const t2 = ev.touches[0], rect = cardRef.current.getBoundingClientRect()
      cloneRef.current.style.left = `${t2.clientX - rect.width / 2}px`
      cloneRef.current.style.top = `${t2.clientY - 30}px`
      onTouchMove?.(t2.clientX, t2.clientY)
    }

    const onEnd = (ev) => {
      document.removeEventListener('touchmove', onMove, { passive: false })
      document.removeEventListener('touchend', onEnd)
      if (cloneRef.current) { cloneRef.current.remove(); cloneRef.current = null }
      if (started) { onTouchDrop?.(ev.changedTouches[0].clientX, ev.changedTouches[0].clientY); onDragEnd?.() }
      setTouching(false)
    }

    document.addEventListener('touchmove', onMove, { passive: false })
    document.addEventListener('touchend', onEnd)
  }, [editing, onDragStart, onDragEnd, onTouchMove, onTouchDrop])

  const due = task.due
  const dueCls = isOverdue(due)
    ? 'text-[#ff5f6d] bg-[rgba(255,95,109,0.12)]'
    : isDueSoon(due)
      ? 'text-[#e8a04a] bg-[rgba(232,160,74,0.12)]'
      : 'text-text3 bg-surface3'

  // const [viewingTask, setViewingTask] = useState(null)

  return (
    <li
      ref={cardRef}
      draggable={!editing}
      onMouseDown={handleMouseDown}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onTouchStart={handleTouchStart}
      style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
      className={`
        bg-surface2 border border-white/[0.07] rounded-2xl p-3.5 relative group
        cursor-grab active:cursor-grabbing
        animate-card-in transition-all duration-200
        ${pm.stripe}
        ${isDragging || touching
          ? 'opacity-40 scale-[0.96]'
          : 'hover:-translate-y-0.5 hover:border-white/[0.14] hover:shadow-card'}
        ${task.status === 'completed' ? 'opacity-70' : ''}
      `}
    >
      {/* Title row */}
      <div className="flex items-start gap-2 mb-2.5">
        {editing ? (
          <input
            type="text"
            value={editVal}
            onChange={e => setEditVal(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') confirmEdit()
              if (e.key === 'Escape') { setEditing(false); setEditVal(task.title) }
            }}
            onBlur={confirmEdit}
            style={{ userSelect: 'text', WebkitUserSelect: 'text' }}
            className="flex-1 bg-surface3 border border-accent rounded-md px-2.5 py-1.5
              text-text1 text-[0.88rem] font-body outline-none
              shadow-[0_0_0_3px_rgba(232,160,74,0.15)]"
          />
        ) : (
          <span className={`flex-1 text-[0.88rem] font-medium leading-[1.4] ${task.status === 'completed' ? 'line-through text-text3' : 'text-text1'
            }`}>
            {task.title}
          </span>
        )}

        {/* ── ACTION BUTTONS
             data-actions marks this zone — drag handlers check for it
             and bail out so buttons always receive clicks normally      ── */}
        {!editing && (
          <div
            data-actions="true"
            className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200 flex-shrink-0"
          >
            {/* 👁 VIEW */}
            <button
              type="button"
              data-actions="true"
              onClick={(e) => {
                e.stopPropagation()
                e.preventDefault()
                onView?.(task)
              }}
              className="w-[26px] h-[26px] rounded-md border border-transparent
                text-text3 flex items-center justify-center
                hover:bg-[rgba(107,127,255,0.15)]
                hover:border-[rgba(107,127,255,0.3)]
                hover:text-[#6b7fff]
                transition-all duration-200"
              style={{ cursor: 'pointer', background: 'transparent' }}
              title="View details"
            >
              <FiEye size={14} />
            </button>

            {/* ✎ EDIT */}
            <button
              type="button"
              data-actions="true"
              onClick={() => setEditing(true)}
              className="w-[26px] h-[26px] rounded-md border border-transparent
              text-text3 flex items-center justify-center
              hover:bg-surface3 hover:border-white/[0.14] hover:text-text1
              transition-all duration-200"
              style={{ cursor: 'pointer', background: 'transparent' }}
              title="Edit"
            >
              <FiEdit2 size={14} />
            </button>

            {/* ✕ DELETE */}
            <button
              type="button"
              data-actions="true"
              onClick={() => onDelete?.()}
              className="w-[30px] h-[30px] rounded-md border border-transparent
                text-text3 flex items-center justify-center
                hover:bg-[rgba(255,95,109,0.15)]
                hover:border-[rgba(255,95,109,0.3)]
                hover:text-[#ff5f6d]
                transition-all duration-200"
              style={{ cursor: 'pointer', background: 'transparent' }}
              title="Delete"
            >
              <FiTrash2 size={15} />
            </button>
          </div>
        )}
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.68rem] font-semibold ${pm.bg} ${pm.text}`}>
          {pm.icon} {pm.label}
        </span>
        {due && (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.68rem] ${dueCls}`}>
            📅 {formatDue(due)}
          </span>
        )}
      </div>
    </li>
  )
}
