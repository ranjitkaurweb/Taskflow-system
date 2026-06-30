import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../lib/supabase'

const STATUS_META = {
  todo:      { label: 'To Do',     color: '#6b7fff', bg: 'rgba(107,127,255,0.12)' },
  working:   { label: 'Working',   color: '#e8a04a', bg: 'rgba(232,160,74,0.12)'  },
  completed: { label: 'Completed', color: '#4ecb83', bg: 'rgba(78,203,131,0.12)'  },
  onhold:    { label: 'On Hold',   color: '#9b7fe8', bg: 'rgba(155,127,232,0.12)' },
}
const PRIORITY_META = {
  high:   { label: 'High',   color: '#ff5f6d' },
  medium: { label: 'Medium', color: '#e8a04a' },
  low:    { label: 'Low',    color: '#4ecb83' },
}

function fmtDate(ts) {
  if (!ts) return '—'
  return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export default function ProjectDetailModal({
  project, allTasks, isAdmin, currentUserId,
  open, onClose, onOpenChat,
  onAddTask, onRemoveMember, onAddMember, employees = [],
  isDark = true,
}) {
  const [showManage,   setShowManage]   = useState(false)
  const [showAddTask,  setShowAddTask]  = useState(false)
  const [removeWarn,   setRemoveWarn]   = useState(null) // { memberId, name, taskCount }
  const [addMemberId,  setAddMemberId]  = useState('')

  // New task form
  const [taskTitle,    setTaskTitle]    = useState('')
  const [taskAssignee, setTaskAssignee] = useState('')
  const [taskPriority, setTaskPriority] = useState('medium')
  const [taskDue,      setTaskDue]      = useState('')
  const [taskSaving,   setTaskSaving]   = useState(false)

  useEffect(() => {
    if (open) {
      setShowManage(false)
      setShowAddTask(false)
      setRemoveWarn(null)
      setTaskTitle(''); setTaskAssignee(''); setTaskPriority('medium'); setTaskDue('')
    }
  }, [open, project?.id])

  if (!open || !project) return null

  const members = project.project_members || []
  const projectTasks = (allTasks || []).filter(t => t.projectId === project.id)

  const bg          = isDark ? '#111118' : '#ffffff'
  const cardBg      = isDark ? '#16161d' : '#f7f3ee'
  const border      = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.09)'
  const textPrimary = isDark ? '#f0eff5' : '#1a1814'
  const textMuted   = isDark ? '#5a5968' : '#aaa9a0'

  const handleAddTaskSubmit = async (e) => {
    e.preventDefault()
    if (!taskTitle.trim() || !taskAssignee) return
    setTaskSaving(true)
    await onAddTask?.({
      title: taskTitle.trim(),
      priority: taskPriority,
      due: taskDue,
      assignToUserId: taskAssignee,
      projectId: project.id,
    })
    setTaskSaving(false)
    setShowAddTask(false)
    setTaskTitle(''); setTaskAssignee(''); setTaskPriority('medium'); setTaskDue('')
  }

  const handleRemoveClick = (memberId, name) => {
    const taskCount = projectTasks.filter(t => t.userId === memberId).length
    if (taskCount > 0) {
      setRemoveWarn({ memberId, name, taskCount })
    } else {
      onRemoveMember?.(project.id, memberId)
    }
  }

  const availableToAdd = employees.filter(e => e.role === 'employee' && !members.find(m => m.user_id === e.id))

  const modal = (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', zIndex: 350, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', animation: 'pd-fade 0.15s ease' }}
    >
      <style>{`
        @keyframes pd-fade { from { opacity:0 } to { opacity:1 } }
        @keyframes pd-slideup { from { opacity:0; transform:translateY(14px) } to { opacity:1; transform:translateY(0) } }
        .pd-close:hover { background: rgba(255,255,255,0.09) !important; }
        .pd-member-row:hover .pd-remove-btn { opacity: 1 !important; }
      `}</style>

      <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: '22px', width: '100%', maxWidth: '600px', maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: isDark ? '0 24px 64px rgba(0,0,0,0.7)' : '0 12px 40px rgba(0,0,0,0.15)', animation: 'pd-slideup 0.2s ease', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '20px 22px 16px', borderBottom: `1px solid ${border}`, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '18px' }}>🗂️</span>
                <span style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '17px', color: textPrimary, letterSpacing: '-0.02em' }}>{project.title}</span>
              </div>
              {project.description && <div style={{ fontSize: '12px', color: textMuted, marginLeft: '26px' }}>{project.description}</div>}
              {project.due && <div style={{ fontSize: '11px', color: textMuted, marginLeft: '26px', marginTop: '4px' }}>📅 Due {fmtDate(new Date(project.due).getTime())}</div>}
            </div>
            <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
              <button onClick={() => onOpenChat?.(project)} style={{ padding: '7px 12px', borderRadius: '9px', border: 'none', background: 'rgba(107,127,255,0.12)', color: '#6b7fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontFamily: 'DM Sans, sans-serif' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                Chat
              </button>
              <button className="pd-close" onClick={onClose} style={{ width: '32px', height: '32px', borderRadius: '9px', border: `1px solid ${border}`, background: 'transparent', color: textMuted, cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>
          </div>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 22px' }}>

          {/* TEAM SECTION */}
          <div style={{ marginBottom: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: textMuted }}>Team ({members.length})</span>
              {isAdmin && (
                <button onClick={() => setShowManage(p => !p)} style={{ fontSize: '11px', color: '#e8a04a', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                  {showManage ? 'Done' : 'Manage'}
                </button>
              )}
            </div>

            {!showManage ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {members.map(m => {
                  const name = m.profiles?.full_name || m.profiles?.email || '?'
                  return (
                    <div key={m.user_id} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 10px 5px 5px', borderRadius: '20px', background: cardBg, border: `1px solid ${border}` }}>
                      <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: `hsl(${(name.charCodeAt(0) * 37) % 360}, 60%, 55%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 700, color: '#fff' }}>{name.charAt(0).toUpperCase()}</div>
                      <span style={{ fontSize: '12px', color: textPrimary, fontFamily: 'DM Sans, sans-serif' }}>{name}</span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div>
                {members.map(m => {
                  const name = m.profiles?.full_name || m.profiles?.email || '?'
                  const taskCount = projectTasks.filter(t => t.userId === m.user_id).length
                  return (
                    <div key={m.user_id} className="pd-member-row" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: `1px solid ${border}` }}>
                      <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: `hsl(${(name.charCodeAt(0) * 37) % 360}, 60%, 55%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 700, color: '#fff', flexShrink: 0 }}>{name.charAt(0).toUpperCase()}</div>
                      <span style={{ flex: 1, fontSize: '13px', color: textPrimary, fontFamily: 'DM Sans, sans-serif' }}>{name}</span>
                      {taskCount > 0 && <span style={{ fontSize: '10px', color: textMuted }}>{taskCount} task{taskCount > 1 ? 's' : ''}</span>}
                      <button className="pd-remove-btn" onClick={() => handleRemoveClick(m.user_id, name)}
                        style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '7px', border: 'none', background: 'rgba(255,95,109,0.12)', color: '#ff5f6d', cursor: 'pointer', fontWeight: 600, opacity: 0.7, transition: 'opacity 0.15s' }}>
                        ✕ Remove
                      </button>
                    </div>
                  )
                })}

                {/* Add member */}
                {availableToAdd.length > 0 && (
                  <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
                    <select value={addMemberId} onChange={e => setAddMemberId(e.target.value)}
                      style={{ flex: 1, padding: '6px 10px', borderRadius: '8px', border: `1px solid ${border}`, background: cardBg, color: textPrimary, fontSize: '12px', fontFamily: 'DM Sans, sans-serif' }}>
                      <option value="">+ Add member…</option>
                      {availableToAdd.map(e => <option key={e.id} value={e.id}>{e.full_name || e.email}</option>)}
                    </select>
                    <button onClick={() => { if (addMemberId) { onAddMember?.(project.id, addMemberId); setAddMemberId('') } }}
                      disabled={!addMemberId}
                      style={{ padding: '6px 14px', borderRadius: '8px', border: 'none', background: '#4ecb83', color: '#fff', fontSize: '12px', fontWeight: 600, cursor: addMemberId ? 'pointer' : 'not-allowed', opacity: addMemberId ? 1 : 0.5 }}>
                      Add
                    </button>
                  </div>
                )}

                {/* Remove warning */}
                {removeWarn && (
                  <div style={{ marginTop: '10px', padding: '10px', borderRadius: '10px', background: 'rgba(255,95,109,0.08)', border: '1px solid rgba(255,95,109,0.2)' }}>
                    <div style={{ fontSize: '12px', color: '#ff5f6d', marginBottom: '8px', lineHeight: 1.5 }}>
                      {removeWarn.name} has {removeWarn.taskCount} task{removeWarn.taskCount > 1 ? 's' : ''} in this project. Reassign or remove their tasks before removing them.
                    </div>
                    <button onClick={() => setRemoveWarn(null)} style={{ fontSize: '11px', padding: '5px 12px', borderRadius: '7px', border: `1px solid ${border}`, background: 'transparent', color: textMuted, cursor: 'pointer' }}>Got it</button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* TASKS SECTION */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: textMuted }}>Tasks ({projectTasks.length})</span>
              <button onClick={() => setShowAddTask(p => !p)} style={{ fontSize: '11px', color: '#e8a04a', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                {showAddTask ? 'Cancel' : '+ Add Task'}
              </button>
            </div>

            {/* Add task form */}
            {showAddTask && (
              <form onSubmit={handleAddTaskSubmit} style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: '12px', padding: '14px', marginBottom: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input type="text" value={taskTitle} onChange={e => setTaskTitle(e.target.value)} placeholder="Task title…"
                  style={{ padding: '8px 11px', borderRadius: '8px', border: `1px solid ${border}`, background: bg, color: textPrimary, fontSize: '12px', fontFamily: 'DM Sans, sans-serif', outline: 'none' }} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <select value={taskAssignee} onChange={e => setTaskAssignee(e.target.value)}
                    style={{ padding: '8px 11px', borderRadius: '8px', border: `1px solid ${border}`, background: bg, color: textPrimary, fontSize: '12px', fontFamily: 'DM Sans, sans-serif' }}>
                    <option value="">Assign to…</option>
                    {members.map(m => <option key={m.user_id} value={m.user_id}>{m.profiles?.full_name || m.profiles?.email}</option>)}
                  </select>
                  <select value={taskPriority} onChange={e => setTaskPriority(e.target.value)}
                    style={{ padding: '8px 11px', borderRadius: '8px', border: `1px solid ${border}`, background: bg, color: textPrimary, fontSize: '12px', fontFamily: 'DM Sans, sans-serif' }}>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <input type="date" value={taskDue} onChange={e => setTaskDue(e.target.value)}
                  style={{ padding: '8px 11px', borderRadius: '8px', border: `1px solid ${border}`, background: bg, color: textPrimary, fontSize: '12px', fontFamily: 'DM Sans, sans-serif' }} />
                <button type="submit" disabled={!taskTitle.trim() || !taskAssignee || taskSaving}
                  style={{ padding: '8px', borderRadius: '8px', border: 'none', background: '#e8a04a', color: '#1a1000', fontSize: '12px', fontWeight: 600, cursor: 'pointer', opacity: (!taskTitle.trim() || !taskAssignee || taskSaving) ? 0.5 : 1 }}>
                  {taskSaving ? 'Adding…' : 'Add Task'}
                </button>
              </form>
            )}

            {/* Task list */}
            {projectTasks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: textMuted, fontSize: '13px' }}>No tasks in this project yet</div>
            ) : (
              projectTasks.map(t => {
                const sm = STATUS_META[t.status] || STATUS_META.todo
                const pm = PRIORITY_META[t.priority] || PRIORITY_META.medium
                const member = members.find(m => m.user_id === t.userId)
                const name = member?.profiles?.full_name || member?.profiles?.email || 'Unassigned'
                return (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 0', borderBottom: `1px solid ${border}` }}>
                    <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: sm.color, flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: '13px', color: t.status === 'completed' ? textMuted : textPrimary, textDecoration: t.status === 'completed' ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</span>
                    <span style={{ fontSize: '11px', color: textMuted, flexShrink: 0 }}>{name}</span>
                    <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '20px', background: sm.bg, color: sm.color, flexShrink: 0 }}>{sm.label}</span>
                  </div>
                )
              })
            )}
          </div>

        </div>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}
