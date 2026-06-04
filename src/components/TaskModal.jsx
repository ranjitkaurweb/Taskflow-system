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

const inputCls = `
  w-full bg-surface2 border border-white/[0.07] rounded-lg
  text-text1 text-[0.9rem] font-body px-3.5 py-2.5 mb-[18px] outline-none
  placeholder:text-text3 appearance-none
  focus:border-accent focus:shadow-[0_0_0_3px_rgba(232,160,74,0.12)]
  transition-all duration-200
`

const optCls= `
  bg-surface2
`

export default function TaskModal({ open, onClose, onSubmit }) {
  const [title,    setTitle]    = useState('')
  const [status,   setStatus]   = useState('todo')
  const [priority, setPriority] = useState('medium')
  const [due,      setDue]      = useState('')
  const titleRef = useRef(null)

  useEffect(() => {
    if (open) setTimeout(() => titleRef.current?.focus(), 100)
    else { setTitle(''); setDue(''); setStatus('todo'); setPriority('medium') }
  }, [open])

  const handleSubmit = () => {
    if (!title.trim()) { titleRef.current?.focus(); return }
    onSubmit(title.trim(), status, priority, due)
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-lg z-[100] flex items-center justify-center p-4 animate-fade-in"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bg-surface border border-white/[0.14] rounded-[20px] p-7 w-full max-w-[460px] shadow-card-lg animate-slide-up"
        role="dialog" aria-modal="true" aria-label="New Task"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display font-bold text-[1.15rem] text-text1">New Task</h3>
          <button
            onClick={onClose}
            className="bg-transparent border-none text-text2 text-base cursor-pointer
              px-2 py-1 rounded-md hover:bg-surface2 hover:text-text1 transition-all duration-200"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <label className="block text-[0.72rem] font-medium text-text2 mb-1.5 uppercase tracking-widest">
          Task title
        </label>
        <input
          ref={titleRef}
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          placeholder="What needs to be done?"
          className={inputCls}
        />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[0.72rem] font-medium text-text2 mb-1.5 uppercase tracking-widest">
              Column
            </label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              className={`${inputCls} bg-white text-black dark:bg-black dark:text-white`}
            >
              {STATUSES.map(s => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[0.72rem] font-medium text-text2 mb-1.5 uppercase tracking-widest">
              Priority
            </label>
            <select value={priority} onChange={e => setPriority(e.target.value)} className={inputCls}>
              {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
        </div>

        <label className="block text-[0.72rem] font-medium text-text2 mb-1.5 uppercase tracking-widest">
          Due date <span className="normal-case">(optional)</span>
        </label>
        <input
          type="date"
          value={due}
          onChange={e => setDue(e.target.value)}
          className={inputCls}
        />

        {/* Footer */}
        <div className="flex justify-end gap-2.5 pt-5 border-t border-white/[0.07]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-white/[0.07] bg-transparent
              text-text2 text-sm font-body cursor-pointer
              hover:border-white/[0.14] hover:text-text1 hover:bg-surface2 transition-all duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-5 py-2 rounded-lg bg-[#f0b060] border-none text-[#1a1000] font-semibold text-sm font-body
              shadow-accent cursor-pointer
              hover:bg-[#f0b060] hover:-translate-y-px hover:shadow-lg
              active:translate-y-0 transition-all duration-200"
          >
            Create Task
          </button>
        </div>
      </div>
    </div>
  )
}
