import React, { useState, useRef, useCallback, useEffect } from 'react'
import { useTheme } from './ThemeContext'
import { FiEye, FiEdit2, FiTrash2 } from 'react-icons/fi'
import TaskEditModal from './TaskEditModal'
import { createPortal } from 'react-dom'
import TaskCommentsModal from './TaskCommentsModal'

const PRIORITY_META = {
  high:   { label: 'High',   color: '#ff5f6d', bg: 'rgba(255,95,109,0.13)', border: '#ff5f6d' },
  medium: { label: 'Medium', color: '#e8a04a', bg: 'rgba(232,160,74,0.13)', border: '#e8a04a' },
  low:    { label: 'Low',    color: '#4ecb83', bg: 'rgba(78,203,131,0.13)', border: '#4ecb83' },
}

const AVATAR_COLORS = [
  'linear-gradient(135deg,#6b7fff,#9b7fe8)',
  'linear-gradient(135deg,#e8a04a,#ff8c42)',
  'linear-gradient(135deg,#4ecb83,#6ddbaa)',
  'linear-gradient(135deg,#ff5f6d,#ff8c94)',
  'linear-gradient(135deg,#9b7fe8,#6b7fff)',
]

function getAvatarColor(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
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

export default function TaskCard({
  task, isDragging,
  onMouseDragStart,
  onTouchDragStart, onTouchDragEnd,
  onTouchMove, onTouchDrop,
  onDelete, onEdit, onView,
  commentCount = 0,
  onMarkCommentRead,
}) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [commentsOpen,  setCommentsOpen]  = useState(false)
  const [touching,      setTouching]      = useState(false)
  const [hovered,       setHovered]       = useState(false)
  const cardRef  = useRef(null)
  const cloneRef = useRef(null)
  const pm       = PRIORITY_META[task.priority] || PRIORITY_META.medium
  const due      = task.due
  const initial  = (task.employeeName || task.title || '?').charAt(0).toUpperCase()
  const avatarGrad = getAvatarColor(task.userId || task.id || '?')
  const [projectName, setProjectName] = useState(null)

useEffect(() => {
  if (!task.projectId) { setProjectName(null); return }
  let mounted = true
  import('../lib/supabase').then(({ supabase }) => {
    supabase.from('projects').select('title').eq('id', task.projectId).single()
      .then(({ data }) => { if (mounted && data) setProjectName(data.title) })
  })
  return () => { mounted = false }
}, [task.projectId])

  // ── Mouse drag — instant, no HTML5 drag API ──
  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0) return
    if (e.target.closest('[data-actions]')) return
    e.preventDefault()
    onMouseDragStart?.(task.id, e, cardRef.current)
  }, [task.id, onMouseDragStart])

  // ── Touch drag ──
  const handleTouchStart = useCallback((e) => {
    if (e.target.closest('[data-actions]')) return
    const touch = e.touches[0]
    const startX = touch.clientX, startY = touch.clientY
    let started = false

    const onMove = (ev) => {
      const t = ev.touches[0]
      if (!started && (Math.abs(t.clientX - startX) > 8 || Math.abs(t.clientY - startY) > 8)) {
        started = true
        setTouching(true)
        onTouchDragStart?.(task.id)
        const rect = cardRef.current.getBoundingClientRect()
        const ghost = cardRef.current.cloneNode(true)
        ghost.id = 'touch-drag-ghost'
        ghost.style.cssText = `position:fixed;left:${rect.left}px;top:${rect.top}px;width:${rect.width}px;opacity:0.88;transform:scale(1.03) rotate(1deg);pointer-events:none;z-index:9999;transition:none;border-radius:14px;box-shadow:0 20px 40px rgba(0,0,0,0.4);`
        document.body.appendChild(ghost)
        cloneRef.current = ghost
      }
      if (!started) return
      ev.preventDefault()
      const t2 = ev.touches[0]
      const rect = cardRef.current.getBoundingClientRect()
      cloneRef.current.style.left = `${t2.clientX - rect.width / 2}px`
      cloneRef.current.style.top  = `${t2.clientY - 30}px`
      onTouchMove?.(t2.clientX, t2.clientY)
    }

    const onEnd = (ev) => {
      document.removeEventListener('touchmove', onMove, { passive: false })
      document.removeEventListener('touchend', onEnd)
      if (cloneRef.current) { cloneRef.current.remove(); cloneRef.current = null }
      if (started) {
        onTouchDrop?.(ev.changedTouches[0].clientX, ev.changedTouches[0].clientY)
        onTouchDragEnd?.()
      }
      setTouching(false)
    }

    document.addEventListener('touchmove', onMove, { passive: false })
    document.addEventListener('touchend', onEnd)
  }, [task.id, onTouchDragStart, onTouchDragEnd, onTouchMove, onTouchDrop])

  const isDark_ = isDark
  const cardBg     = isDark_ ? 'rgba(22,22,29,0.65)' : '#ffffff'
  const cardBorder = isDark_ ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.09)'
  const mutedColor = isDark_ ? '#5a5968' : '#aaa9a0'

  return (
    <li
      ref={cardRef}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        listStyle: 'none',
        userSelect: 'none', WebkitUserSelect: 'none',
        background: cardBg,
        backdropFilter: isDark_ ? 'blur(16px)' : 'none',
        WebkitBackdropFilter: isDark_ ? 'blur(16px)' : 'none',
        border: `1px solid ${hovered ? pm.border + '55' : cardBorder}`,
        borderLeft: `3px solid ${pm.border}`,
        borderRadius: '14px',
        padding: '14px 14px 12px',
        position: 'relative',
        cursor: isDragging ? 'grabbing' : 'grab',
        transition: 'box-shadow 0.15s ease, border-color 0.15s ease, opacity 0.15s ease',
        opacity: (isDragging || touching) ? 0.4 : task.status === 'completed' ? 0.65 : 1,
        transform: (isDragging || touching) ? 'scale(0.96)' : hovered ? 'translateY(-2px)' : '',
        boxShadow: hovered && !isDragging && !touching
          ? isDark_ ? `0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px ${pm.border}33` : `0 6px 18px rgba(0,0,0,0.10), 0 0 0 1px ${pm.border}33`
          : isDark_ ? 'inset 0 0 0 0.5px rgba(255,255,255,0.06), 0 2px 12px rgba(0,0,0,0.35)' : '0 1px 4px rgba(0,0,0,0.06)',
      }}
    >
      {/* Glass overlay dark mode */}
      {isDark_ && (
        <div style={{ position:'absolute', inset:0, borderRadius:'14px', background:`linear-gradient(135deg, ${pm.border}12 0%, rgba(255,255,255,0.02) 50%, transparent 100%)`, pointerEvents:'none' }} />
      )}

      {/* Title */}
      <div style={{
        fontSize:'14px', fontWeight:600, lineHeight:1.45, marginBottom:'12px',
        fontFamily:'DM Sans, sans-serif',
        color: task.status === 'completed' ? mutedColor : (isDark_ ? '#f0eff5' : '#1a1814'),
        textDecoration: task.status === 'completed' ? 'line-through' : 'none',
        position: 'relative',
      }}>
        {task.title}
      </div>
      {/* Project badge */}
{projectName && (
  <div style={{
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    fontSize: '10px', fontWeight: 600,
    color: '#9b7fe8', background: 'rgba(155,127,232,0.12)',
    padding: '2px 9px', borderRadius: '20px',
    marginBottom: '10px',
    fontFamily: 'DM Sans, sans-serif',
  }}>
    🗂️ {projectName}
  </div>
)}

{/* Priority + Due */}
<div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px' }}></div>

      {/* Priority + Due */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px' }}>
        <span style={{ display:'inline-flex', alignItems:'center', padding:'3px 12px', borderRadius:'20px', fontSize:'12px', fontWeight:600, background:pm.bg, color:pm.color, fontFamily:'DM Sans, sans-serif' }}>
          {pm.label}
        </span>
        {due && (
          <span style={{ display:'inline-flex', alignItems:'center', gap:'4px', fontSize:'12px', fontWeight:400, fontFamily:'DM Sans, sans-serif', color: isOverdue(due) ? '#ff5f6d' : isDueSoon(due) ? '#e8a04a' : (isDark_ ? '#5a5968' : '#9a9890') }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            {formatDue(due)}
          </span>
        )}
      </div>

      {/* Divider */}
      <div style={{ height:'1px', background: isDark_ ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)', marginBottom:'10px' }} />

      {/* Bottom row */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        {/* Avatar */}
        <div style={{ width:'28px', height:'28px', borderRadius:'50%', background:avatarGrad, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:700, color:'#fff', flexShrink:0 }}>
          {initial}
        </div>

        {/* Actions + comment */}
        <div style={{ display:'flex', alignItems:'center', gap:'4px' }} data-actions="true">
          {hovered && (
            <div style={{ display:'flex', gap:'2px' }} data-actions="true">
              <button type="button" data-actions="true"
                onClick={(e) => { e.stopPropagation(); onView?.(task) }} title="View"
                style={{ width:'26px', height:'26px', borderRadius:'7px', border:'none', background:'transparent', color:mutedColor, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.12s' }}
                onMouseEnter={e => { e.currentTarget.style.background='rgba(107,127,255,0.15)'; e.currentTarget.style.color='#6b7fff' }}
                onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color=mutedColor }}
              ><FiEye size={13} /></button>

              <button type="button" data-actions="true"
                onClick={() => setEditModalOpen(true)} title="Edit"
                style={{ width:'26px', height:'26px', borderRadius:'7px', border:'none', background:'transparent', color:mutedColor, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.12s' }}
                onMouseEnter={e => { e.currentTarget.style.background=isDark_?'rgba(255,255,255,0.07)':'rgba(0,0,0,0.06)'; e.currentTarget.style.color=isDark_?'#f0eff5':'#1a1814' }}
                onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color=mutedColor }}
              ><FiEdit2 size={13} /></button>

              <button type="button" data-actions="true"
                onClick={() => onDelete?.()} title="Delete"
                style={{ width:'26px', height:'26px', borderRadius:'7px', border:'none', background:'transparent', color:mutedColor, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.12s' }}
                onMouseEnter={e => { e.currentTarget.style.background='rgba(255,95,109,0.15)'; e.currentTarget.style.color='#ff5f6d' }}
                onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color=mutedColor }}
              ><FiTrash2 size={13} /></button>
            </div>
          )}

          {/* Comment */}
          <button type="button" data-actions="true"
            onClick={() => { setCommentsOpen(true); onMarkCommentRead?.(task.id) }} title="Comments"
            style={{ display:'flex', alignItems:'center', gap:'5px', padding:'0', border:'none', background:'transparent', color:mutedColor, cursor:'pointer', transition:'color 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.color='#6b7fff' }}
            onMouseLeave={e => { e.currentTarget.style.color=mutedColor }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            {commentCount > 0 && (
              <span style={{ background:'#6b7fff', color:'#fff', borderRadius:'20px', fontSize:'11px', fontWeight:700, padding:'1px 8px', lineHeight:1.5, fontFamily:'DM Sans, sans-serif' }}>
                {commentCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {createPortal(
        <TaskEditModal task={task} open={editModalOpen} onClose={() => setEditModalOpen(false)} onSave={(_id, updates) => onEdit(updates)} isDark={isDark} />,
        document.body
      )}
      {createPortal(
        <TaskCommentsModal task={task} open={commentsOpen} onClose={() => setCommentsOpen(false)} isDark={isDark} />,
        document.body
      )}
    </li>
  )
}
