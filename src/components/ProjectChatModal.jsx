import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { createPortal } from 'react-dom'

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

export default function ProjectChatModal({ project, open, onClose, isDark = true }) {
  const [messages,  setMessages]  = useState([])
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

  // Fetch messages + realtime
  useEffect(() => {
    if (!open || !project) return
    let mounted = true

    async function fetchMessages() {
      const { data, error } = await supabase
        .from('project_messages')
        .select('*, profiles(full_name, email, role)')
        .eq('project_id', project.id)
        .order('created_at', { ascending: true })
      if (!mounted) return
      if (error) { console.error('fetchMessages error:', error.message); return }
      setMessages(data || [])
    }

    fetchMessages()

    const channel = supabase
      .channel(`project-chat-${project.id}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'project_messages', filter: `project_id=eq.${project.id}` },
        async (payload) => {
          if (!mounted) return
          const { data } = await supabase
            .from('project_messages')
            .select('*, profiles(full_name, email, role)')
            .eq('id', payload.new.id)
            .single()
          if (data) setMessages(prev => {
            if (prev.find(m => m.id === data.id)) return prev
            return [...prev, data]
          })
        }
      )
      .subscribe()

    return () => {
      mounted = false
      supabase.removeChannel(channel)
    }
  }, [open, project])

  // Scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input when modal opens
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100)
    else setMessage('')
  }, [open])

  const handleSend = async () => {
    if (!message.trim() || !profile || sending) return
    setSending(true)

    // Optimistic
    const optimistic = {
      id: 'temp-' + Date.now(),
      project_id: project.id,
      user_id: profile.id,
      message: message.trim(),
      created_at: new Date().toISOString(),
      profiles: { full_name: profile.full_name, email: profile.email, role: profile.role },
      _optimistic: true,
    }
    setMessages(prev => [...prev, optimistic])
    setMessage('')

    const { data: inserted, error } = await supabase
      .from('project_messages')
      .insert({ project_id: project.id, user_id: profile.id, message: optimistic.message })
      .select('*, profiles(full_name, email, role)')
      .single()

    if (error) {
      console.error('send error:', error.message)
      setMessages(prev => prev.filter(m => m.id !== optimistic.id))
      setSending(false)
      return
    }

    setMessages(prev => prev.map(m => m.id === optimistic.id ? inserted : m))
    setSending(false)
  }

  if (!open || !project) return null

  // Members list
  const members = project.project_members || []

  // Styles
  const bg          = isDark ? '#111118' : '#ffffff'
  const bgCard      = isDark ? '#16161d' : '#f7f3ee'
  const border      = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.09)'
  const textPrimary = isDark ? '#f0eff5' : '#1a1814'
  const textMuted   = isDark ? '#5a5968' : '#aaa9a0'
  const inputBg     = isDark ? '#1e1e28' : '#f0ebe3'
  const accent      = isDark ? '#e8a04a' : '#c8533a'
  const accentText  = isDark ? '#1a1000' : '#ffffff'

  const modal = (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.72)',
        backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        zIndex: 400,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
        animation: 'pc-fade 0.15s ease',
      }}
    >
      <style>{`
        @keyframes pc-fade    { from { opacity:0 } to { opacity:1 } }
        @keyframes pc-slideup { from { opacity:0; transform:translateY(14px) } to { opacity:1; transform:translateY(0) } }
        .pc-input:focus { border-color: ${accent} !important; box-shadow: 0 0 0 3px ${isDark ? 'rgba(232,160,74,0.12)' : 'rgba(200,83,58,0.12)'}; }
        .pc-input::placeholder { color: ${isDark ? '#3a3948' : '#bbb8b0'}; }
        .pc-close:hover { background: rgba(255,255,255,0.09) !important; }
      `}</style>

      <div style={{
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: '22px',
        width: '100%', maxWidth: '540px',
        maxHeight: '90vh',
        display: 'flex', flexDirection: 'column',
        boxShadow: isDark ? '0 24px 64px rgba(0,0,0,0.7)' : '0 12px 40px rgba(0,0,0,0.15)',
        animation: 'pc-slideup 0.2s ease',
        overflow: 'hidden',
      }}>

        {/* Header */}
        <div style={{ padding: '20px 22px 16px', borderBottom: `1px solid ${border}`, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '18px' }}>🗂️</span>
                <span style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '16px', color: textPrimary, letterSpacing: '-0.02em' }}>
                  {project.title}
                </span>
              </div>
              {project.description && (
                <div style={{ fontSize: '12px', color: textMuted, marginLeft: '26px' }}>{project.description}</div>
              )}
            </div>
            <button className="pc-close" onClick={onClose}
              style={{ width: '32px', height: '32px', borderRadius: '9px', border: `1px solid ${border}`, background: 'transparent', color: textMuted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s', flexShrink: 0, fontSize: '14px' }}>
              ✕
            </button>
          </div>

          {/* Members avatars */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', color: textMuted, marginRight: '2px' }}>Team:</span>
            <div style={{ display: 'flex' }}>
              {members.slice(0, 6).map((m, i) => {
                const name = m.profiles?.full_name || m.profiles?.email || '?'
                return (
                  <div key={m.user_id} title={name} style={{
                    width: '24px', height: '24px', borderRadius: '50%',
                    background: `hsl(${(name.charCodeAt(0) * 37) % 360}, 60%, 55%)`,
                    border: `2px solid ${bg}`,
                    marginLeft: i === 0 ? '0' : '-6px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '9px', fontWeight: 700, color: '#fff',
                    zIndex: members.length - i,
                  }}>
                    {name.charAt(0).toUpperCase()}
                  </div>
                )
              })}
              {members.length > 6 && (
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: isDark ? '#252532' : '#e5dfd6', border: `2px solid ${bg}`, marginLeft: '-6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', color: textMuted, fontWeight: 600 }}>
                  +{members.length - 6}
                </div>
              )}
            </div>
            <span style={{ fontSize: '11px', color: textMuted }}>{members.length} member{members.length !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 22px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {messages.length === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '140px', gap: '10px' }}>
              <div style={{ fontSize: '32px', opacity: 0.4 }}>💬</div>
              <div style={{ fontSize: '13px', color: textMuted, fontFamily: 'DM Sans, sans-serif' }}>No messages yet — start the conversation!</div>
            </div>
          )}

          {messages.map(m => {
            const isMe = m.user_id === profile?.id
            const name = m.profiles?.full_name || m.profiles?.email || 'Unknown'
            const initial = name.charAt(0).toUpperCase()
            const isAdmin = m.profiles?.role === 'admin'
            const avatarColor = `hsl(${(name.charCodeAt(0) * 37) % 360}, 60%, 55%)`

            return (
              <div key={m.id} style={{ display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row', gap: '8px', alignItems: 'flex-end' }}>
                {/* Avatar */}
                <div style={{ width: '26px', height: '26px', borderRadius: '50%', flexShrink: 0, background: avatarColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: '#fff' }}>
                  {initial}
                </div>

                <div style={{ maxWidth: '72%' }}>
                  {/* Name + time */}
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '4px', flexDirection: isMe ? 'row-reverse' : 'row' }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: textPrimary, fontFamily: 'DM Sans, sans-serif' }}>
                      {isMe ? 'You' : name}
                    </span>
                    {isAdmin && (
                      <span style={{ fontSize: '9px', padding: '1px 5px', borderRadius: '20px', background: 'rgba(107,127,255,0.15)', color: '#6b7fff', fontWeight: 600 }}>Admin</span>
                    )}
                    <span style={{ fontSize: '10px', color: textMuted }}>{timeAgo(m.created_at)}</span>
                  </div>

                  {/* Bubble */}
                  <div style={{
                    padding: '9px 13px',
                    borderRadius: isMe ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                    background: isMe ? accent : bgCard,
                    color: isMe ? accentText : textPrimary,
                    fontSize: '13px', lineHeight: 1.5,
                    fontFamily: 'DM Sans, sans-serif',
                    border: isMe ? 'none' : `1px solid ${border}`,
                    wordBreak: 'break-word',
                  }}>
                    {m.message}
                  </div>
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ padding: '14px 22px 18px', borderTop: `1px solid ${border}`, flexShrink: 0, display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
          {/* Avatar */}
          <div style={{ width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0, background: `hsl(${((profile?.full_name || profile?.email || '?').charCodeAt(0) * 37) % 360}, 60%, 55%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#fff', marginBottom: '2px' }}>
            {(profile?.full_name || profile?.email || '?').charAt(0).toUpperCase()}
          </div>

          <textarea
            ref={inputRef}
            className="pc-input"
            value={message}
            onChange={e => setMessage(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
            placeholder="Write a message… (Enter to send)"
            rows={1}
            style={{ flex: 1, padding: '9px 13px', borderRadius: '12px', border: `1px solid ${border}`, background: inputBg, color: textPrimary, fontSize: '13px', fontFamily: 'DM Sans, sans-serif', outline: 'none', resize: 'none', lineHeight: 1.5, transition: 'border-color 0.15s, box-shadow 0.15s', maxHeight: '100px', overflowY: 'auto' }}
          />

          <button onClick={handleSend} disabled={!message.trim() || sending}
            style={{ padding: '9px 16px', borderRadius: '12px', border: 'none', background: (!message.trim() || sending) ? (isDark ? '#2a2a38' : '#e0dbd4') : accent, color: (!message.trim() || sending) ? textMuted : accentText, fontSize: '13px', fontWeight: 600, cursor: (!message.trim() || sending) ? 'not-allowed' : 'pointer', fontFamily: 'DM Sans, sans-serif', transition: 'all 0.15s', flexShrink: 0, marginBottom: '2px' }}>
            {sending ? '…' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}
