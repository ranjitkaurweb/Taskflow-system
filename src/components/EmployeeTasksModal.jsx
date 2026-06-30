import React from 'react'
import { createPortal } from 'react-dom'

const STATUS_META = {
  todo:      { label: 'To Do',      color: '#6b7fff', bg: 'rgba(107,127,255,0.12)' },
  working:   { label: 'Working',    color: '#e8a04a', bg: 'rgba(232,160,74,0.12)'  },
  completed: { label: 'Completed',  color: '#4ecb83', bg: 'rgba(78,203,131,0.12)'  },
  onhold:    { label: 'On Hold',    color: '#9b7fe8', bg: 'rgba(155,127,232,0.12)' },
}
const PRIORITY_META = {
  high:   { label: 'High',   color: '#ff5f6d', bg: 'rgba(255,95,109,0.12)'  },
  medium: { label: 'Medium', color: '#e8a04a', bg: 'rgba(232,160,74,0.12)'  },
  low:    { label: 'Low',    color: '#4ecb83', bg: 'rgba(78,203,131,0.12)'  },
}

function fmtDate(ts) {
  if (!ts) return '—'
  return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function EmployeeTasksModal({ employee, tasks, open, onClose, isDark = true }) {
  if (!open || !employee) return null

  const empTasks   = tasks.filter(t => t.user_id === employee.id)
  const completed  = empTasks.filter(t => t.status === 'completed')
  const pending    = empTasks.filter(t => t.status !== 'completed')
  const overdue    = empTasks.filter(t => t.due && new Date(t.due) < new Date() && t.status !== 'completed')
  const pct        = empTasks.length ? Math.round((completed.length / empTasks.length) * 100) : 0
  const name       = employee.full_name || employee.email || 'Unknown'
  const initial    = name.charAt(0).toUpperCase()

  const bg          = isDark ? '#111118' : '#ffffff'
  const cardBg      = isDark ? '#16161d' : '#f7f3ee'
  const border      = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.09)'
  const textPrimary = isDark ? '#f0eff5' : '#1a1814'
  const textMuted   = isDark ? '#5a5968' : '#aaa9a0'
  const rowBorder   = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'

  const modal = (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.72)',
        backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        zIndex: 300,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
        animation: 'emp-fade 0.15s ease',
      }}
    >
      <style>{`
        @keyframes emp-fade    { from { opacity:0 } to { opacity:1 } }
        @keyframes emp-slideup { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
        .emp-close:hover { background: rgba(255,255,255,0.09) !important; color: ${textPrimary} !important; }
        .emp-task-row:hover { background: ${isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'} !important; }
      `}</style>

      <div style={{
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: '22px',
        width: '100%', maxWidth: '560px',
        maxHeight: '88vh',
        display: 'flex', flexDirection: 'column',
        boxShadow: isDark ? '0 24px 64px rgba(0,0,0,0.7)' : '0 12px 40px rgba(0,0,0,0.15)',
        animation: 'emp-slideup 0.2s ease',
        overflow: 'hidden',
      }}>

        {/* ── Header ── */}
        <div style={{
          padding: '22px 24px 18px',
          borderBottom: `1px solid ${border}`,
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {/* Avatar */}
            <div style={{
              width: '52px', height: '52px', borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg,#6b7fff,#e8a04a)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '20px', fontWeight: 700, color: '#fff',
              boxShadow: '0 4px 16px rgba(107,127,255,0.3)',
            }}>
              {initial}
            </div>
            {/* Info */}
            <div>
              <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '18px', color: textPrimary, letterSpacing: '-0.02em', marginBottom: '4px' }}>
                {name}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: 'rgba(78,203,131,0.12)', color: '#4ecb83', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Employee
                </span>
                {employee.email && (
                  <span style={{ fontSize: '12px', color: textMuted }}>{employee.email}</span>
                )}
                {employee.joined_at && (
                  <span style={{ fontSize: '12px', color: textMuted }}>Joined {fmtDate(employee.joined_at)}</span>
                )}
              </div>
            </div>
          </div>

          {/* Close */}
          <button
            className="emp-close"
            onClick={onClose}
            style={{
              width: '32px', height: '32px', borderRadius: '9px', flexShrink: 0,
              border: `1px solid ${border}`,
              background: 'transparent', color: textMuted,
              cursor: 'pointer', fontSize: '14px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s',
            }}
          >✕</button>
        </div>

        {/* ── Stat chips ── */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '10px', padding: '18px 24px',
          borderBottom: `1px solid ${border}`,
          flexShrink: 0,
        }}>
          {[
            { icon: '📋', val: empTasks.length,   label: 'Total',     color: null },
            { icon: '✅', val: completed.length,  label: 'Completed', color: '#4ecb83' },
            { icon: '⏳', val: pending.length,    label: 'Pending',   color: '#e8a04a' },
            { icon: '🚨', val: overdue.length,    label: 'Overdue',   color: overdue.length > 0 ? '#ff5f6d' : '#4ecb83' },
          ].map((s, i) => (
            <div key={i} style={{
              background: cardBg,
              border: `1px solid ${border}`,
              borderRadius: '14px', padding: '14px 12px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '18px', marginBottom: '6px' }}>{s.icon}</div>
              <div style={{ fontSize: '22px', fontWeight: 800, fontFamily: 'Montserrat, sans-serif', color: s.color || textPrimary, lineHeight: 1 }}>{s.val}</div>
              <div style={{ fontSize: '11px', color: textMuted, marginTop: '4px' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Progress bar ── */}
        <div style={{ padding: '16px 24px', borderBottom: `1px solid ${border}`, flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Overall Progress</span>
            <span style={{ fontSize: '13px', fontWeight: 700, color: pct === 100 ? '#4ecb83' : pct >= 50 ? '#e8a04a' : textPrimary }}>{pct}%</span>
          </div>
          <div style={{ height: '8px', borderRadius: '8px', background: isDark ? '#252532' : '#e5dfd6', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: '8px',
              background: pct === 100 ? '#4ecb83' : pct >= 50 ? 'linear-gradient(90deg,#e8a04a,#4ecb83)' : 'linear-gradient(90deg,#6b7fff,#e8a04a)',
              width: `${pct}%`, transition: 'width 0.6s ease',
              boxShadow: pct > 0 ? '0 0 8px rgba(78,203,131,0.4)' : 'none',
            }} />
          </div>
        </div>

        {/* ── Task list ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 20px' }}>
          {/* Section label */}
          <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: textMuted, padding: '16px 0 10px' }}>
            Tasks ({empTasks.length})
          </div>

          {empTasks.length === 0 && (
            <div style={{ textAlign: 'center', padding: '32px 0', color: textMuted, fontSize: '13px' }}>
              <div style={{ fontSize: '28px', marginBottom: '8px', opacity: 0.4 }}>📋</div>
              No tasks assigned yet
            </div>
          )}

          {empTasks.map(t => {
            const sm = STATUS_META[t.status] || STATUS_META.todo
            const pm = PRIORITY_META[t.priority] || PRIORITY_META.medium
            const isOver = t.due && new Date(t.due) < new Date() && t.status !== 'completed'
            return (
              <div
                key={t.id}
                className="emp-task-row"
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '10px 8px', borderRadius: '10px',
                  borderBottom: `1px solid ${rowBorder}`,
                  transition: 'background 0.12s', cursor: 'default',
                }}
              >
                {/* Status dot */}
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: isOver ? '#ff5f6d' : sm.color, flexShrink: 0, boxShadow: `0 0 5px ${isOver ? '#ff5f6d' : sm.color}66` }} />

                {/* Title */}
                <span style={{
                  flex: 1, fontSize: '13px', fontWeight: 500,
                  color: t.status === 'completed' ? textMuted : textPrimary,
                  textDecoration: t.status === 'completed' ? 'line-through' : 'none',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  fontFamily: 'DM Sans, sans-serif',
                }}>
                  {t.title}
                </span>

                {/* Due date */}
                {t.due && (
                  <span style={{ fontSize: '11px', color: isOver ? '#ff5f6d' : textMuted, flexShrink: 0, fontFamily: 'DM Sans, sans-serif' }}>
                    {isOver ? '🚨 ' : '📅 '}{fmtDate(new Date(t.due).getTime())}
                  </span>
                )}

                {/* Priority */}
                <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '20px', background: pm.bg, color: pm.color, fontWeight: 600, flexShrink: 0, textTransform: 'capitalize' }}>
                  {pm.label}
                </span>

                {/* Status */}
                <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '20px', background: sm.bg, color: sm.color, flexShrink: 0, textTransform: 'capitalize' }}>
                  {sm.label}
                </span>
              </div>
            )
          })}
        </div>

      </div>
    </div>
  )

  return createPortal(modal, document.body)
}
