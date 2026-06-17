import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

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

export default function TaskCommentsModal({ task, open, onClose, isDark = true }) {
  const [comments,  setComments]  = useState([])
  const [message,   setMessage]   = useState('')
  const [sending,   setSending]   = useState(false)
  const [profile,   setProfile]   = useState(null)
  const bottomRef = useRef(null)
  const inputRef  = useRef(null)

  // Get current user profile
  useEffect(() => {
    async function getProfile() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, email, role')
        .eq('id', session.user.id)
        .single()
      if (data) setProfile(data)
    }
    getProfile()
  }, [])

  // Fetch comments + realtime
  useEffect(() => {
    if (!open || !task) return
    let mounted = true

    async function fetchComments() {
      const { data, error } = await supabase
        .from('task_comments')
        .select('*, profiles(full_name, email, role)')
        .eq('task_id', task.id)
        .order('created_at', { ascending: true })
      if (!mounted) return
      if (error) { console.error('fetchComments error:', error.message); return }
      setComments(data || [])
    }

    fetchComments()

    // Realtime
    const channel = supabase
      .channel(`comments-${task.id}`)
.on('postgres_changes',
  { event: 'INSERT', schema: 'public', table: 'task_comments', filter: `task_id=eq.${task.id}` },
  async (payload) => {
    if (!mounted) return
    // Skip if already in list (our own optimistic)
    setComments(prev => {
      if (prev.find(c => c.id === payload.new.id)) return prev
      return prev // will be updated by fetch below
    })
    const { data } = await supabase
      .from('task_comments')
      .select('*, profiles(full_name, email, role)')
      .eq('id', payload.new.id)
      .single()
    if (!data || !mounted) return
    setComments(prev => {
      // Replace any optimistic OR add if from another user
      if (prev.find(c => c.id === data.id)) return prev
      // Remove any temp optimistic from same user+message if exists
      const filtered = prev.filter(c => !c._optimistic)
      return [...filtered, data]
    })
  }
)
      .subscribe()

    return () => {
      mounted = false
      supabase.removeChannel(channel)
    }
  }, [open, task])

  // Scroll to bottom on new comment
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [comments])

  // Focus input when modal opens
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100)
    else setMessage('')
  }, [open])

const handleSend = async () => {
  if (!message.trim() || !profile || sending) return
  setSending(true)

  const optimistic = {
    id:         'temp-' + Date.now(),
    task_id:    task.id,
    user_id:    profile.id,
    message:    message.trim(),
    created_at: new Date().toISOString(),
    profiles:   { full_name: profile.full_name, email: profile.email, role: profile.role },
    _optimistic: true,
  }

  // Add optimistically immediately
  setComments(prev => [...prev, optimistic])
  setMessage('')

  const { data: inserted, error } = await supabase
    .from('task_comments')
    .insert({
      task_id:  task.id,
      user_id:  profile.id,
      message:  optimistic.message,
    })
    .select('*, profiles(full_name, email, role)')
    .single()

  if (error) {
    console.error('send comment error:', error.message)
    // Remove optimistic on error
    setComments(prev => prev.filter(c => c.id !== optimistic.id))
    setSending(false)
    return
  }

  // Replace optimistic with real data
  setComments(prev => prev.map(c => c.id === optimistic.id ? inserted : c))

// ── Send notifications ──
try {
  const notifTargets = new Set()
  const senderName = profile.full_name || profile.email || 'Someone'

// Always notify task owner if they are not the sender
const taskOwnerId = task.user_id || task.userId || task.assigned_to || task.assignedTo
if (taskOwnerId && taskOwnerId !== profile.id) {
  notifTargets.add(taskOwnerId)
}

// If employee commented → also notify all admins
if (profile.role === 'employee') {
  const { data: admins } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'admin')
  if (admins) {
    admins.forEach(a => {
      if (a.id !== profile.id) notifTargets.add(a.id)
    })
  }
}

// Fallback — if role not loaded, notify task owner anyway
if (!profile.role && task.user_id && task.user_id !== profile.id) {
  notifTargets.add(task.user_id)
}

  const notifications = Array.from(notifTargets).map(uid => ({
    user_id:    uid,
    message:    profile.role === 'admin'
      ? `💬 Admin ${senderName} commented on your task "${task.title}"`
      : `💬 ${senderName} commented on task "${task.title}"`,
    task_title: task.title,
    read:       false,
  }))

  if (notifications.length > 0) {
    const { error: notifErr } = await supabase
      .from('notifications')
      .insert(notifications)
    if (notifErr) console.error('comment notification error:', notifErr.message)
  }
} catch (err) {
  console.error('notification error:', err.message)
}

  setSending(false)
}

  if (!open || !task) return null

  // Style tokens
  const bg          = isDark ? '#111118' : '#ffffff'
  const bgCard      = isDark ? '#16161d' : '#f7f3ee'
  const border      = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.09)'
  const textPrimary = isDark ? '#f0eff5' : '#1a1814'
  const textMuted   = isDark ? '#5a5968' : '#aaa9a0'
  const inputBg     = isDark ? '#1e1e28' : '#f0ebe3'
  const accent      = isDark ? '#e8a04a' : '#c8533a'
  const accentText  = isDark ? '#1a1000' : '#ffffff'

  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.72)',
        backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        zIndex: 300,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
        animation: 'cm-fade 0.15s ease',
      }}
    >
      <style>{`
        @keyframes cm-fade    { from { opacity:0 } to { opacity:1 } }
        @keyframes cm-slideup { from { opacity:0; transform:translateY(14px) } to { opacity:1; transform:translateY(0) } }
        .cm-input:focus { border-color: ${accent} !important; box-shadow: 0 0 0 3px ${isDark ? 'rgba(232,160,74,0.12)' : 'rgba(200,83,58,0.12)'}; }
        .cm-input::placeholder { color: ${isDark ? '#3a3948' : '#bbb8b0'}; }
        .cm-send:hover { opacity: 0.88; transform: translateY(-1px); }
        .cm-close:hover { background: rgba(255,255,255,0.09) !important; color: ${textPrimary} !important; }
      `}</style>

      <div style={{
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: '20px',
        width: '100%', maxWidth: '500px',
        maxHeight: '90vh',
        display: 'flex', flexDirection: 'column',
        boxShadow: isDark ? '0 24px 64px rgba(0,0,0,0.6)' : '0 12px 40px rgba(0,0,0,0.15)',
        animation: 'cm-slideup 0.18s ease',
        overflow: 'hidden',
      }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          padding: '22px 22px 16px',
          borderBottom: `1px solid ${border}`,
          flexShrink: 0,
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '16px' }}>💬</span>
              <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '16px', color: textPrimary, letterSpacing: '-0.02em' }}>
                Comments
              </span>
              <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)', color: textMuted, fontFamily: 'DM Sans, sans-serif' }}>
                {comments.length}
              </span>
            </div>
            <div style={{ fontSize: '12px', color: textMuted, fontFamily: 'DM Sans, sans-serif', maxWidth: '340px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {task.title}
            </div>
          </div>
          <button
            className="cm-close"
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.05)', border: `1px solid ${border}`,
              borderRadius: '8px', width: '32px', height: '32px',
              color: textMuted, cursor: 'pointer', fontSize: '14px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s', flexShrink: 0,
            }}
          >
            ✕
          </button>
        </div>

        {/* Comments list */}
        <div style={{
          flex: 1, overflowY: 'auto', padding: '16px 22px',
          display: 'flex', flexDirection: 'column', gap: '12px',
        }}>
          {comments.length === 0 && (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', height: '160px', gap: '10px',
            }}>
              <div style={{ fontSize: '32px' }}>💬</div>
              <div style={{ fontSize: '13px', color: textMuted, fontFamily: 'DM Sans, sans-serif' }}>
                No comments yet — be the first!
              </div>
            </div>
          )}

          {comments.map(c => {
            const isMe = c.user_id === profile?.id
            const name = c.profiles?.full_name || c.profiles?.email || 'Unknown'
            const initial = name.charAt(0).toUpperCase()
            const isAdmin = c.profiles?.role === 'admin'

            return (
              <div
                key={c.id}
                style={{
                  display: 'flex',
                  flexDirection: isMe ? 'row-reverse' : 'row',
                  gap: '10px',
                  alignItems: 'flex-end',
                }}
              >
                {/* Avatar */}
                <div style={{
                  width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                  background: isAdmin
                    ? 'linear-gradient(135deg,#6b7fff,#9b7fe8)'
                    : 'linear-gradient(135deg,#e8a04a,#ff8c42)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '11px', fontWeight: 700, color: '#fff',
                }}>
                  {initial}
                </div>

                {/* Bubble */}
                <div style={{ maxWidth: '75%' }}>
                  {/* Name + time */}
                  <div style={{
                    display: 'flex', gap: '6px', alignItems: 'center',
                    marginBottom: '4px',
                    flexDirection: isMe ? 'row-reverse' : 'row',
                  }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: textPrimary, fontFamily: 'DM Sans, sans-serif' }}>
                      {isMe ? 'You' : name}
                    </span>
                    {isAdmin && (
                      <span style={{ fontSize: '9px', padding: '1px 6px', borderRadius: '20px', background: 'rgba(107,127,255,0.15)', color: '#6b7fff', fontWeight: 600, fontFamily: 'DM Sans, sans-serif' }}>
                        Admin
                      </span>
                    )}
                    <span style={{ fontSize: '10px', color: textMuted, fontFamily: 'DM Sans, sans-serif' }}>
                      {timeAgo(c.created_at)}
                    </span>
                  </div>

                  {/* Message bubble */}
                  <div style={{
                    padding: '9px 13px',
                    borderRadius: isMe ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                    background: isMe
                      ? (isDark ? accent : accent)
                      : bgCard,
                    color: isMe ? accentText : textPrimary,
                    fontSize: '13px', lineHeight: 1.5,
                    fontFamily: 'DM Sans, sans-serif',
                    border: isMe ? 'none' : `1px solid ${border}`,
                    wordBreak: 'break-word',
                  }}>
                    {c.message}
                  </div>
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div style={{
          padding: '14px 22px 18px',
          borderTop: `1px solid ${border}`,
          flexShrink: 0,
          display: 'flex', gap: '10px', alignItems: 'flex-end',
        }}>
          {/* Current user avatar */}
          <div style={{
            width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
            background: profile?.role === 'admin'
              ? 'linear-gradient(135deg,#6b7fff,#9b7fe8)'
              : 'linear-gradient(135deg,#e8a04a,#ff8c42)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '11px', fontWeight: 700, color: '#fff', marginBottom: '2px',
          }}>
            {(profile?.full_name || profile?.email || '?').charAt(0).toUpperCase()}
          </div>

          <textarea
            ref={inputRef}
            className="cm-input"
            value={message}
            onChange={e => setMessage(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder="Write a comment… (Enter to send)"
            rows={1}
            style={{
              flex: 1,
              padding: '9px 13px',
              borderRadius: '12px',
              border: `1px solid ${border}`,
              background: inputBg,
              color: textPrimary,
              fontSize: '13px', fontFamily: 'DM Sans, sans-serif',
              outline: 'none', resize: 'none',
              lineHeight: 1.5,
              transition: 'border-color 0.15s, box-shadow 0.15s',
              maxHeight: '100px', overflowY: 'auto',
            }}
          />

          <button
            className="cm-send"
            onClick={handleSend}
            disabled={!message.trim() || sending}
            style={{
              padding: '9px 16px',
              borderRadius: '12px', border: 'none',
              background: (!message.trim() || sending) ? (isDark ? '#2a2a38' : '#e0dbd4') : accent,
              color: (!message.trim() || sending) ? textMuted : accentText,
              fontSize: '13px', fontWeight: 600,
              cursor: (!message.trim() || sending) ? 'not-allowed' : 'pointer',
              fontFamily: 'DM Sans, sans-serif',
              transition: 'all 0.15s',
              flexShrink: 0, marginBottom: '2px',
            }}
          >
            {sending ? '…' : 'Send'}
          </button>
        </div>

      </div>
    </div>
  )
}
