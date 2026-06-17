import React, { useState, useEffect, useRef } from 'react'

const STATUSES = [
  { value: 'todo',      label: 'To Do' },
  { value: 'working',   label: 'Working' },
  { value: 'completed', label: 'Completed' },
  { value: 'onhold',    label: 'On Hold' },
]

const PRIORITIES = [
  { value: 'high',   label: '🔴 High' },
  { value: 'medium', label: '🟡 Medium' },
  { value: 'low',    label: '🟢 Low' },
]

export default function TaskEditModal({ task, open, onClose, onSave }) {
  const [title,    setTitle]    = useState('')
  const [status,   setStatus]   = useState('todo')
  const [priority, setPriority] = useState('medium')
  const [due,      setDue]      = useState('')
  const titleRef = useRef(null)

  // Pre-fill with current task values when modal opens
  useEffect(() => {
    if (open && task) {
      setTitle(task.title || '')
      setStatus(task.status || 'todo')
      setPriority(task.priority || 'medium')
      setDue(task.due || '')
      setTimeout(() => titleRef.current?.focus(), 80)
    }
  }, [open, task])

  const handleSave = () => {
    if (!title.trim()) { titleRef.current?.focus(); return }
    onSave(task.id, {
      title:    title.trim(),
      status,
      priority,
      due,
    })
    onClose()
  }

  if (!open || !task) return null

  const inputStyle = {
    width: '100%', padding: '10px 13px', borderRadius: '9px',
    boxSizing: 'border-box',
    border: '1px solid rgba(255,255,255,0.08)',
    background: '#1e1e28',
    color: '#f0eff5',
    fontSize: '13px', fontFamily: 'DM Sans, sans-serif', outline: 'none',
  }

  const labelStyle = {
    display: 'block', fontSize: '11px', fontWeight: 600,
    textTransform: 'uppercase', letterSpacing: '0.07em',
    color: '#5a5968', marginBottom: '6px',
  }

  const selectStyle = {
    ...inputStyle,
    cursor: 'pointer',
    appearance: 'none', WebkitAppearance: 'none',
  }

  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.72)',
        backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        zIndex: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
        animation: 'tf-fade-in 0.15s ease',
      }}
    >
      <style>{`
        @keyframes tf-fade-in  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes tf-slide-up { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: translateY(0) } }
        .tf-edit-input:focus { border-color: #e8a04a !important; box-shadow: 0 0 0 3px rgba(232,160,74,0.12); }
        .tf-edit-input::placeholder { color: #3a3948; }
      `}</style>

      <div
        style={{
          background: '#111118',
          border: '1px solid rgba(255,255,255,0.10)',
          borderRadius: '20px',
          padding: '28px',
          width: '100%', maxWidth: '460px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
          animation: 'tf-slide-up 0.18s ease',
          display: 'flex', flexDirection: 'column', gap: '18px',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '17px', color: '#f0eff5', letterSpacing: '-0.02em' }}>
              Edit Task
            </div>
            <div style={{ fontSize: '12px', color: '#5a5968', marginTop: '2px' }}>
              Update any field below
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '8px', width: '32px', height: '32px',
              color: '#8b8a9b', cursor: 'pointer', fontSize: '15px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; e.currentTarget.style.color = '#f0eff5' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#8b8a9b' }}
          >
            ✕
          </button>
        </div>

        {/* Task Title */}
        <div>
          <label style={labelStyle}>Task Title</label>
          <input
            ref={titleRef}
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') onClose() }}
            placeholder="What needs to be done?"
            className="tf-edit-input"
            style={inputStyle}
          />
        </div>

        {/* Priority + Status side by side */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={labelStyle}>Priority</label>
            <select
              value={priority}
              onChange={e => setPriority(e.target.value)}
              className="tf-edit-input"
              style={selectStyle}
            >
              {PRIORITIES.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Status</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              className="tf-edit-input"
              style={selectStyle}
            >
              {STATUSES.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Due Date */}
        <div>
          <label style={labelStyle}>
            Due Date <span style={{ textTransform: 'none', fontWeight: 400, color: '#3a3948' }}>(optional)</span>
          </label>
          <input
            type="date"
            value={due}
            onChange={e => setDue(e.target.value)}
            className="tf-edit-input"
            style={{ ...inputStyle, colorScheme: 'dark' }}
          />
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '10px', borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'transparent', color: '#8b8a9b',
              fontSize: '13px', fontWeight: 500, cursor: 'pointer',
              fontFamily: 'DM Sans, sans-serif', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#f0eff5' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#8b8a9b' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{
              flex: 2, padding: '10px', borderRadius: '10px',
              border: 'none',
              background: '#e8a04a', color: '#1a1000',
              fontSize: '13px', fontWeight: 700, cursor: 'pointer',
              fontFamily: 'DM Sans, sans-serif', transition: 'all 0.15s',
              boxShadow: '0 4px 16px rgba(232,160,74,0.25)',
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)' }}
          >
            Save Changes
          </button>
        </div>

      </div>
    </div>
  )
}
