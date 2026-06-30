import React, { useState, useRef, useEffect } from 'react'
import { useNotificationsDB } from '../hooks/useNotificationsDB'

function timeAgo(ts) {
  if (!ts) return ''
  const diff = Date.now() - new Date(ts).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 1)   return 'just now'
  if (mins < 60)  return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

function isToday(ts) {
  if (!ts) return false
  const d = new Date(ts)
  const now = new Date()
  return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
}

function getNotifMeta(message) {
  if (!message) return { icon: '🔔', iconBg: 'rgba(107,127,255,0.12)', iconColor: '#6b7fff' }
  if (message.includes('deleted') || message.includes('Delete'))
    return { icon: '🗑️', iconBg: 'rgba(255,95,109,0.12)', iconColor: '#ff5f6d' }
  if (message.includes('commented') || message.includes('comment'))
    return { icon: '💬', iconBg: 'rgba(107,127,255,0.12)', iconColor: '#6b7fff' }
  if (message.includes('assigned') || message.includes('Assign'))
    return { icon: '📌', iconBg: 'rgba(232,160,74,0.12)', iconColor: '#e8a04a' }
  return { icon: '🔔', iconBg: 'rgba(78,203,131,0.12)', iconColor: '#4ecb83' }
}

export default function NotificationBell({ isDark }) {
  const { notifications, unreadCount, markRead, markAllRead } = useNotificationsDB()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const bg          = isDark ? '#111118' : '#ffffff'
  const border      = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.09)'
  const textPrimary = isDark ? '#f0eff5' : '#1a1814'
  const textMuted   = isDark ? '#5a5968' : '#aaa9a0'
  const hoverBg     = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'
  const unreadBg    = isDark ? 'rgba(232,160,74,0.06)' : 'rgba(107,127,255,0.04)'
  const groupLabelColor = isDark ? '#3a3948' : '#c8c7c0'

  // Split into today / earlier
  const todayNotifs   = notifications.filter(n => isToday(n.created_at))
  const earlierNotifs = notifications.filter(n => !isToday(n.created_at))

  const renderNotif = (n) => {
    const meta = getNotifMeta(n.message)
    return (
      <div
        key={n.id}
        onClick={() => markRead(n.id)}
        style={{
          display: 'flex', alignItems: 'flex-start', gap: '10px',
          padding: '11px 16px',
          background: !n.read ? unreadBg : 'transparent',
          borderBottom: `1px solid ${border}`,
          cursor: 'pointer',
          transition: 'background 0.12s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = hoverBg }}
        onMouseLeave={e => { e.currentTarget.style.background = !n.read ? unreadBg : 'transparent' }}
      >
        {/* Colored icon */}
        <div style={{
          width: '32px', height: '32px', borderRadius: '10px', flexShrink: 0,
          background: meta.iconBg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '15px',
        }}>
          {meta.icon}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: '12px', color: textPrimary,
            fontFamily: 'DM Sans, sans-serif', lineHeight: 1.5,
            fontWeight: !n.read ? 500 : 400,
          }}>
            {n.message}
          </div>
          <div style={{
            fontSize: '11px', color: meta.iconColor,
            marginTop: '3px', fontFamily: 'DM Sans, sans-serif',
            fontWeight: 500,
          }}>
            {timeAgo(n.created_at)}
          </div>
        </div>

        {/* Unread dot */}
        {!n.read && (
          <div style={{
            width: '7px', height: '7px', borderRadius: '50%',
            background: meta.iconColor, flexShrink: 0, marginTop: '5px',
          }} />
        )}
      </div>
    )
  }

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-flex' }}>
      <style>{`@keyframes notif-drop { from { opacity:0; transform:translateY(-6px) } to { opacity:1; transform:translateY(0) } }`}</style>

      {/* Bell Button */}
      <button
        onClick={() => setOpen(p => !p)}
        style={{
          position: 'relative',
          width: '36px', height: '36px',
          borderRadius: '10px',
          border: `1px solid ${border}`,
          background: open
            ? (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)')
            : 'transparent',
          color: isDark ? '#8b8a9b' : '#6b6760',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = hoverBg; e.currentTarget.style.color = textPrimary }}
        onMouseLeave={e => { if (!open) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = isDark ? '#8b8a9b' : '#6b6760' } }}
        title="Notifications"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {unreadCount > 0 && (
          <div style={{
            position: 'absolute', top: '4px', right: '4px',
            width: '16px', height: '16px', borderRadius: '50%',
            background: '#ff5f6d', color: '#fff',
            fontSize: '9px', fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'DM Sans, sans-serif',
            boxShadow: '0 0 0 2px ' + bg,
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </div>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0,
          width: '320px',
          background: bg,
          border: `1px solid ${border}`,
          borderRadius: '16px',
          boxShadow: isDark ? '0 20px 48px rgba(0,0,0,0.6)' : '0 12px 32px rgba(0,0,0,0.14)',
          zIndex: 999,
          overflow: 'hidden',
          animation: 'notif-drop 0.15s ease',
        }}>

          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 16px 12px',
            borderBottom: `1px solid ${border}`,
          }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: textPrimary, fontFamily: 'Montserrat, sans-serif' }}>
              Notifications{unreadCount > 0 && <span style={{ color: '#ff5f6d', marginLeft: '5px' }}>({unreadCount})</span>}
            </div>
            {unreadCount > 0 && (
              <button onClick={markAllRead} style={{
                fontSize: '11px', color: isDark ? '#e8a04a' : '#c8533a',
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: 'DM Sans, sans-serif', fontWeight: 600,
                padding: '2px 6px', borderRadius: '6px',
              }}>
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ maxHeight: '360px', overflowY: 'auto' }}>

            {notifications.length === 0 && (
              <div style={{ padding: '32px 16px', textAlign: 'center' }}>
                <div style={{ fontSize: '28px', marginBottom: '8px', opacity: 0.4 }}>🔔</div>
                <div style={{ fontSize: '13px', color: textMuted, fontFamily: 'DM Sans, sans-serif' }}>No notifications yet</div>
              </div>
            )}

            {/* Today group */}
            {todayNotifs.length > 0 && (
              <>
                <div style={{
                  padding: '8px 16px 4px',
                  fontSize: '10px', fontWeight: 600,
                  textTransform: 'uppercase', letterSpacing: '0.07em',
                  color: groupLabelColor,
                  fontFamily: 'DM Sans, sans-serif',
                }}>
                  Today
                </div>
                {todayNotifs.map(renderNotif)}
              </>
            )}

            {/* Earlier group */}
            {earlierNotifs.length > 0 && (
              <>
                <div style={{
                  padding: '8px 16px 4px',
                  fontSize: '10px', fontWeight: 600,
                  textTransform: 'uppercase', letterSpacing: '0.07em',
                  color: groupLabelColor,
                  fontFamily: 'DM Sans, sans-serif',
                }}>
                  Earlier
                </div>
                {earlierNotifs.map(renderNotif)}
              </>
            )}

          </div>
        </div>
      )}
    </div>
  )
}
