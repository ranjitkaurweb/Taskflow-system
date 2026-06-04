import React from 'react'
import { useTheme } from './ThemeContext'

/* ─── helpers ── */
const fmtDate = (ts) => {
  if (!ts) return '—'
  const d = new Date(typeof ts === 'number' ? ts : ts + 'T00:00:00')
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}
const fmtTime = (ts) => {
  if (!ts) return ''
  return new Date(ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}
const daysBetween = (a, b) => Math.floor((b - a) / 86400000)

/* ─── colour maps ── */
const STATUS_MAP = {
  todo:      { label: 'To Do',     color: '#6b7fff', bg: 'rgba(107,127,255,0.15)' },
  working:   { label: 'Working',   color: '#e8a04a', bg: 'rgba(232,160,74,0.15)'  },
  completed: { label: 'Completed', color: '#4ecb83', bg: 'rgba(78,203,131,0.15)'  },
  onhold:    { label: 'On Hold',   color: '#9b7fe8', bg: 'rgba(155,127,232,0.15)' },
}
const PRIORITY_MAP = {
  high:   { label: 'High',   color: '#ff5f6d', bg: 'rgba(255,95,109,0.15)',  arrow: '↑' },
  medium: { label: 'Medium', color: '#e8a04a', bg: 'rgba(232,160,74,0.15)',  arrow: '–' },
  low:    { label: 'Low',    color: '#4ecb83', bg: 'rgba(78,203,131,0.15)',  arrow: '↓' },
}

/* ─── Row sub-component — receives theme colours as props ── */
function Row({ icon, label, value, sub, color, isDark }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: '14px',
      padding: '14px 0',
      borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)'}`,
    }}>
      <span style={{ fontSize: '18px', width: '24px', flexShrink: 0, marginTop: '2px' }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{
          fontSize: '10px', letterSpacing: '0.08em', textTransform: 'uppercase',
          color: isDark ? '#5a5968' : '#a09c96',
          fontWeight: 600, marginBottom: '4px',
        }}>
          {label}
        </div>
        <div style={{
          fontSize: '14px', fontWeight: 500, lineHeight: 1.4,
          color: color || (isDark ? '#f0eff5' : '#1a1814'),
        }}>
          {value}
        </div>
        {sub && (
          <div style={{ fontSize: '11px', color: isDark ? '#5a5968' : '#a09c96', marginTop: '3px' }}>
            {sub}
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Badge ── */
function Badge({ label, color, bg, dot }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '6px',
      padding: '4px 12px', borderRadius: '100px',
      fontSize: '11px', fontWeight: 600,
      background: bg, color,
    }}>
      {dot && (
        <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: color, flexShrink: 0 }} />
      )}
      {label}
    </span>
  )
}

/* ─── Progress bar ── */
function ProgressBar({ pct, color, isDark }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
        <span style={{
          fontSize: '10px',
          color: isDark ? '#5a5968' : '#a09c96',
          textTransform: 'uppercase', letterSpacing: '0.08em',
        }}>
          Time elapsed
        </span>
        <span style={{ fontSize: '11px', fontWeight: 700, color }}>{pct}%</span>
      </div>
      <div style={{
        height: '6px', borderRadius: '6px',
        background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', borderRadius: '6px',
          width: `${pct}%`, background: color,
          transition: 'width 0.8s ease',
        }} />
      </div>
    </div>
  )
}

/* ─── MAIN MODAL ── */
export default function TaskViewModal({ task, onClose }) {
  const { theme } = useTheme()
  const isDark    = theme === 'dark'

  if (!task) return null

  /* ── computed stats ── */
  const now         = Date.now()
  const sm          = STATUS_MAP[task.status]    || STATUS_MAP.todo
  const pm          = PRIORITY_MAP[task.priority] || PRIORITY_MAP.medium
  const createdTs   = task.created    || now
  const completedTs = task.completedAt || null
  const dueTs       = task.due ? new Date(task.due + 'T23:59:59').getTime() : null

  const ageDays        = daysBetween(createdTs, now)
  const daysToComplete = completedTs ? daysBetween(createdTs, completedTs) : null
  const daysUntilDue   = dueTs ? daysBetween(now, dueTs) : null
  const isOverdue      = dueTs && now > dueTs && task.status !== 'completed'
  const isDueSoon      = dueTs && daysUntilDue !== null && daysUntilDue >= 0 && daysUntilDue <= 2
  const pendingDays    = task.status !== 'completed' ? ageDays : null

  const totalSpan   = dueTs ? daysBetween(createdTs, dueTs) : 0
  const progressPct = totalSpan > 0 ? Math.min(100, Math.round((ageDays / totalSpan) * 100)) : 0
  const progressColor = isOverdue ? '#ff5f6d' : isDueSoon ? '#e8a04a' : '#4ecb83'

  /* due date string */
  let dueDisplay = 'No due date set'
  let dueColor   = isDark ? '#8b8a9b' : '#a09c96'
  if (dueTs) {
    if (isOverdue) {
      dueDisplay = `${fmtDate(task.due)}  •  ${Math.abs(daysUntilDue)} day${Math.abs(daysUntilDue) !== 1 ? 's' : ''} overdue`
      dueColor   = '#ff5f6d'
    } else if (isDueSoon) {
      dueDisplay = `${fmtDate(task.due)}  •  due ${daysUntilDue === 0 ? 'today' : `in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}`}`
      dueColor   = '#e8a04a'
    } else {
      dueDisplay = `${fmtDate(task.due)}  •  ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''} left`
      dueColor   = '#4ecb83'
    }
  }

  /* pending string */
  let pendingDisplay = null
  let pendingColor   = isDark ? '#f0eff5' : '#1a1814'
  if (pendingDays !== null) {
    pendingDisplay = pendingDays === 0
      ? 'Created today — not yet pending'
      : `${pendingDays} day${pendingDays !== 1 ? 's' : ''} since task was created`
    pendingColor = pendingDays > 7 ? '#ff5f6d' : pendingDays > 3 ? '#e8a04a' : pendingColor
  }

  /* ── theme-aware colours ── */
  const modalBg        = isDark ? '#16161d'                      : '#ffffff'
  const modalBorder    = isDark ? 'rgba(255,255,255,0.12)'        : 'rgba(0,0,0,0.10)'
  const headerBorder   = isDark ? 'rgba(255,255,255,0.06)'        : 'rgba(0,0,0,0.07)'
  const titleColor     = isDark ? '#f0eff5'                      : '#1a1814'
  const closeBtnBg     = isDark ? 'rgba(255,255,255,0.06)'        : 'rgba(0,0,0,0.05)'
  const closeBtnBorder = isDark ? 'rgba(255,255,255,0.08)'        : 'rgba(0,0,0,0.10)'
  const closeBtnColor  = isDark ? '#8b8a9b'                      : '#6b6760'
  const footerBg       = isDark ? 'rgba(255,255,255,0.04)'        : 'rgba(0,0,0,0.03)'
  const footerBtnBg    = isDark ? 'rgba(255,255,255,0.06)'        : 'rgba(0,0,0,0.05)'
  const footerBtnBorder= isDark ? 'rgba(255,255,255,0.10)'        : 'rgba(0,0,0,0.10)'
  const footerBtnColor = isDark ? '#8b8a9b'                      : '#6b6760'
  const backdropColor  = isDark ? 'rgba(0,0,0,0.75)'             : 'rgba(0,0,0,0.45)'

  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed', inset: 0,
        background: backdropColor,
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
        animation: 'tfFadeIn 0.18s ease both',
      }}
    >
      <style>{`
        @keyframes tfFadeIn  { from { opacity:0 } to { opacity:1 } }
        @keyframes tfSlideUp { from { opacity:0; transform:translateY(28px) scale(0.96) } to { opacity:1; transform:translateY(0) scale(1) } }
        .tf-modal-scroll::-webkit-scrollbar { width: 4px; }
        .tf-modal-scroll::-webkit-scrollbar-thumb {
          background: ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'};
          border-radius: 4px;
        }
      `}</style>

      <div
        role="dialog" aria-modal="true"
        style={{
          background: modalBg,
          border: `1px solid ${modalBorder}`,
          borderRadius: '22px',
          width: '100%', maxWidth: '480px',
          boxShadow: isDark
            ? '0 32px 80px rgba(0,0,0,0.7)'
            : '0 32px 80px rgba(0,0,0,0.18)',
          overflow: 'hidden',
          animation: 'tfSlideUp 0.28s cubic-bezier(0.34,1.56,0.64,1) both',
        }}
      >

        {/* Top colour bar */}
        <div style={{ height: '3px', background: `linear-gradient(90deg, ${sm.color}, ${pm.color})` }} />

        {/* Header */}
        <div style={{ padding: '22px 24px 18px', borderBottom: `1px solid ${headerBorder}` }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '14px' }}>
            <h2 style={{
              fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '17px',
              color: titleColor, lineHeight: 1.35, flex: 1, margin: 0,
            }}>
              {task.title}
            </h2>
            <button
              onClick={onClose}
              style={{
                width: '30px', height: '30px', borderRadius: '50%',
                background: closeBtnBg,
                border: `1px solid ${closeBtnBorder}`,
                color: closeBtnColor,
                fontSize: '13px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, transition: 'all 0.15s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(255,95,109,0.15)'
                e.currentTarget.style.color = '#ff5f6d'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = closeBtnBg
                e.currentTarget.style.color = closeBtnColor
              }}
            >✕</button>
          </div>

          {/* Status + Priority badges */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Badge label={sm.label}                        color={sm.color} bg={sm.bg} dot />
            <Badge label={`${pm.arrow} ${pm.label} Priority`} color={pm.color} bg={pm.bg} />
          </div>
        </div>

        {/* Body */}
        <div
          className="tf-modal-scroll"
          style={{ padding: '6px 24px 4px', maxHeight: '420px', overflowY: 'auto' }}
        >
          {/* Progress bar */}
          {dueTs && task.status !== 'completed' && (
            <div style={{ padding: '16px 0', borderBottom: `1px solid ${headerBorder}` }}>
              <ProgressBar pct={progressPct} color={progressColor} isDark={isDark} />
            </div>
          )}

          <Row icon="🗓️" label="Assigned / Created on" value={fmtDate(createdTs)}    sub={`at ${fmtTime(createdTs)}`}      isDark={isDark} />
          <Row icon="⏰" label="Due Date"               value={dueDisplay}             color={dueTs ? dueColor : undefined}  isDark={isDark} />

          {task.status === 'completed' && completedTs && (
            <Row icon="✅" label="Completed On" value={fmtDate(completedTs)} sub={`at ${fmtTime(completedTs)}`} color="#4ecb83" isDark={isDark} />
          )}

          {task.status === 'completed' && daysToComplete !== null && (
            <Row
              icon="⚡" label="Time to Complete"
              value={daysToComplete === 0
                ? 'Completed on the same day it was created'
                : `${daysToComplete} day${daysToComplete !== 1 ? 's' : ''} from creation to completion`}
              color="#4ecb83" isDark={isDark}
            />
          )}

          {pendingDisplay && (
            <Row icon="⏳" label="Days Pending" value={pendingDisplay} color={pendingColor} isDark={isDark} />
          )}

          {isOverdue && (
            <Row icon="🚨" label="Overdue By"
              value={`${Math.abs(daysUntilDue)} day${Math.abs(daysUntilDue) !== 1 ? 's' : ''} past the deadline`}
              color="#ff5f6d" isDark={isDark}
            />
          )}

          <Row icon="📋" label="Current Column" value={sm.label} color={sm.color} isDark={isDark} />

          <Row icon="🔖" label="Task ID" value={`# ${task.id.toUpperCase()}`}
            color={isDark ? '#5a5968' : '#a09c96'} isDark={isDark}
          />
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 24px',
          borderTop: `1px solid ${headerBorder}`,
          background: footerBg,
          display: 'flex', justifyContent: 'flex-end',
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 22px', borderRadius: '10px',
              background: footerBtnBg,
              border: `1px solid ${footerBtnBorder}`,
              color: footerBtnColor,
              fontSize: '13px', fontWeight: 500,
              cursor: 'pointer', transition: 'all 0.15s',
              fontFamily: 'DM Sans, sans-serif',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)'
              e.currentTarget.style.color = isDark ? '#f0eff5' : '#1a1814'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = footerBtnBg
              e.currentTarget.style.color = footerBtnColor
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
