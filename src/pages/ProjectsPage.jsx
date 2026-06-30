import React, { useState, useEffect } from 'react'
import { useProjects } from '../hooks/useProjects'
import { useAuth } from '../context/AuthContext'
import ProjectChatModal from '../components/ProjectChatModal'
import ProjectDetailModal from '../components/ProjectDetailModal'
import { useTheme } from '../components/ThemeContext'

const STATUS_META = {
  active: { label: 'Active', color: '#e8a04a', bg: 'rgba(232,160,74,0.12)' },
  completed: { label: 'Completed', color: '#4ecb83', bg: 'rgba(78,203,131,0.12)' },
  onhold: { label: 'On Hold', color: '#9b7fe8', bg: 'rgba(155,127,232,0.12)' },
}

const PRIORITY_META = {
  high: { label: 'High', color: '#ff5f6d', bg: 'rgba(255,95,109,0.12)' },
  medium: { label: 'Medium', color: '#e8a04a', bg: 'rgba(232,160,74,0.12)' },
  low: { label: 'Low', color: '#4ecb83', bg: 'rgba(78,203,131,0.12)' },
}

function fmtDate(d) {
  if (!d) return null
  return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function isOverdue(due) {
  if (!due) return false
  return new Date(due) < new Date(new Date().toDateString())
}

export default function ProjectsPage({ tasks: allTasks, addTask }) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const { profile, isAdmin } = useAuth()
  const { projects, loading, error, userId, addMember, removeMember } = useProjects()
  // tasks and addTask now come from props
const [chatProject,   setChatProject]   = useState(null)
const [detailProject, setDetailProject] = useState(null)
const [unreadProjectMsgs, setUnreadProjectMsgs] = useState({})

const getLastReadProject = (projectId) => parseInt(localStorage.getItem(`lastReadProject_${projectId}`) || '0')
const markProjectRead = (projectId) => {
  localStorage.setItem(`lastReadProject_${projectId}`, Date.now().toString())
  setUnreadProjectMsgs(prev => ({ ...prev, [projectId]: 0 }))
}
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const handleAddProjectTask = async ({ title, priority, due, assignToUserId, projectId }) => {
    await addTask(title, 'todo', priority, due, projectId, assignToUserId)
  }
  // Fetch unread message counts for all projects
useEffect(() => {
  if (!projects.length) return
  async function fetchUnread() {
    const { supabase } = await import('../lib/supabase')
    const ids = projects.map(p => p.id)
    const { data } = await supabase
      .from('project_messages')
      .select('project_id, created_at, user_id')
      .in('project_id', ids)
    if (!data) return
    const unread = {}
    data.forEach(m => {
      if (m.user_id === userId) return // skip own messages
      const lastRead = getLastReadProject(m.project_id)
      if (new Date(m.created_at).getTime() > lastRead) {
        unread[m.project_id] = (unread[m.project_id] || 0) + 1
      }
    })
    setUnreadProjectMsgs(unread)
  }
  fetchUnread()
}, [projects, userId])

  const bg = isDark ? '#16161d' : '#ffffff'
  const border = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)'
  const textPrimary = isDark ? '#f0eff5' : '#1a1814'
  const textMuted = isDark ? '#5a5968' : '#aaa9a0'
  const pageBg = isDark ? '#0e0e12' : '#f7f3ee'

  const filtered = projects
    .filter(p => statusFilter === 'all' || p.status === statusFilter)
    .filter(p => !search.trim() || p.title.toLowerCase().includes(search.toLowerCase()))

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '12px' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ width: '28px', height: '28px', borderRadius: '50%', border: `2.5px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`, borderTopColor: '#e8a04a', animation: 'spin 0.7s linear infinite' }} />
      <span style={{ color: textMuted, fontSize: '13px', fontFamily: 'DM Sans, sans-serif' }}>Loading projects…</span>
    </div>
  )

  if (error) return (
    <div style={{ textAlign: 'center', padding: '40px', color: '#ff5f6d', fontFamily: 'DM Sans, sans-serif' }}>
      Error loading projects: {error}
    </div>
  )

  return (
    <div style={{ color: textPrimary, fontFamily: 'DM Sans, sans-serif' }}>
      <style>{`
        .proj-card:hover { transform: translateY(-2px); box-shadow: ${isDark ? '0 8px 24px rgba(0,0,0,0.4)' : '0 6px 18px rgba(0,0,0,0.10)'} !important; }
        .proj-chat-btn:hover { opacity: 0.85; }
        @media (max-width: 768px) {
          .proj-grid { grid-template-columns: 1fr !important; }
          .proj-filters { flex-wrap: wrap; }
        }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '22px', letterSpacing: '-0.02em', marginBottom: '4px' }}>
          🗂️ My Projects
        </div>
        <div style={{ fontSize: '13px', color: textMuted }}>
          Group projects you're assigned to
        </div>
      </div>

      {/* Filters */}
      <div className="proj-filters" style={{ display: 'flex', gap: '10px', marginBottom: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search projects…"
          style={{ padding: '8px 12px', borderRadius: '9px', border: `1px solid ${border}`, background: isDark ? '#1e1e28' : '#f7f3ee', color: textPrimary, fontSize: '13px', fontFamily: 'DM Sans, sans-serif', outline: 'none', width: '200px' }}
        />
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {['all', 'active', 'completed', 'onhold'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              style={{ padding: '6px 14px', borderRadius: '20px', border: `1px solid ${statusFilter === s ? '#e8a04a' : border}`, background: statusFilter === s ? 'rgba(232,160,74,0.12)' : 'transparent', color: statusFilter === s ? '#e8a04a' : textMuted, fontSize: '12px', fontWeight: statusFilter === s ? 600 : 400, cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'DM Sans, sans-serif', whiteSpace: 'nowrap' }}>
              {s === 'all' ? 'All' : s === 'onhold' ? 'On Hold' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: bg, border: `1.5px dashed ${border}`, borderRadius: '20px' }}>
          <div style={{ fontSize: '36px', marginBottom: '12px', opacity: 0.4 }}>🗂️</div>
          <div style={{ fontSize: '15px', fontWeight: 600, color: textPrimary, marginBottom: '6px' }}>
            {search || statusFilter !== 'all' ? 'No projects match' : 'No projects yet'}
          </div>
          <div style={{ fontSize: '13px', color: textMuted }}>
            {search || statusFilter !== 'all' ? 'Try adjusting your filters' : 'Your admin will assign you to group projects'}
          </div>
        </div>
      )}

      {/* Project cards grid */}
      <div className="proj-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
        {filtered.map(project => {
          const sm = STATUS_META[project.status] || STATUS_META.active
          const pm = PRIORITY_META[project.priority] || PRIORITY_META.medium
          const members = project.project_members || []
          const overdue = isOverdue(project.due)

          return (
            <div
              key={project.id}
              className="proj-card"
              style={{
                background: bg,
                border: `1px solid ${border}`,
                borderTop: `3px solid ${sm.color}`,
                borderRadius: '16px',
                padding: '20px',
                transition: 'all 0.2s ease',
                cursor: 'default',
                backdropFilter: isDark ? 'blur(16px)' : 'none',
                WebkitBackdropFilter: isDark ? 'blur(16px)' : 'none',
                backgroundColor: isDark ? 'rgba(22,22,29,0.8)' : '#ffffff',
              }}
            >
              {/* Top row — title + status */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px', marginBottom: '10px' }}>
                <div style={{ fontSize: '15px', fontWeight: 700, color: textPrimary, lineHeight: 1.4, flex: 1 }}>
                  {project.title}
                </div>
                <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '20px', background: sm.bg, color: sm.color, fontWeight: 600, flexShrink: 0 }}>
                  {sm.label}
                </span>
              </div>

              {/* Description */}
              {project.description && (
                <div style={{ fontSize: '12px', color: textMuted, lineHeight: 1.6, marginBottom: '12px' }}>
                  {project.description}
                </div>
              )}

              {/* Priority + Due */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', padding: '2px 9px', borderRadius: '20px', background: pm.bg, color: pm.color, fontWeight: 600 }}>
                  {pm.label}
                </span>
                {project.due && (
                  <span style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '3px', color: overdue ? '#ff5f6d' : textMuted, fontWeight: overdue ? 600 : 400 }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    {overdue ? '🚨 ' : ''}{fmtDate(project.due)}
                  </span>
                )}
              </div>

              {/* Divider */}
              <div style={{ height: '1px', background: border, marginBottom: '14px' }} />

              {/* Bottom row — members + chat button */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                {/* Member avatars */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ display: 'flex' }}>
                    {members.slice(0, 5).map((m, i) => {
                      const name = m.profiles?.full_name || m.profiles?.email || '?'
                      return (
                        <div key={m.user_id} title={name}
                          style={{ width: '26px', height: '26px', borderRadius: '50%', background: `hsl(${(name.charCodeAt(0) * 37) % 360}, 60%, 55%)`, border: `2px solid ${bg}`, marginLeft: i === 0 ? '0' : '-7px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 700, color: '#fff', zIndex: members.length - i, position: 'relative' }}>
                          {name.charAt(0).toUpperCase()}
                        </div>
                      )
                    })}
                    {members.length > 5 && (
                      <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: isDark ? '#252532' : '#e5dfd6', border: `2px solid ${bg}`, marginLeft: '-7px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', color: textMuted, fontWeight: 600, position: 'relative' }}>
                        +{members.length - 5}
                      </div>
                    )}
                  </div>
                  <span style={{ fontSize: '11px', color: textMuted }}>{members.length} member{members.length !== 1 ? 's' : ''}</span>
                </div>


                {/* Chat button */}
               <button
  className="proj-chat-btn"
  onClick={() => { setDetailProject(project); markProjectRead(project.id) }}
  style={{
    display: 'flex', alignItems: 'center', gap: '6px',
    padding: '7px 14px', borderRadius: '10px', border: 'none',
    background: isDark ? 'rgba(107,127,255,0.12)' : 'rgba(107,127,255,0.10)',
    color: '#6b7fff', fontSize: '12px', fontWeight: 600,
    cursor: 'pointer', transition: 'all 0.15s',
    fontFamily: 'DM Sans, sans-serif',
  }}
>
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
  Group Chat
  {unreadProjectMsgs[project.id] > 0 && (
    <span style={{ background: '#6b7fff', color: '#fff', borderRadius: '20px', fontSize: '10px', fontWeight: 700, padding: '1px 6px' }}>
      {unreadProjectMsgs[project.id]}
    </span>
  )}
</button>
              </div>
            </div>
          )
        })}
      </div>

      <ProjectChatModal
  project={chatProject}
  open={!!chatProject}
  onClose={() => setChatProject(null)}
  isDark={isDark}
/>
<ProjectDetailModal
  project={detailProject}
  allTasks={allTasks}
  isAdmin={isAdmin}
  currentUserId={userId}
  open={!!detailProject}
  onClose={() => setDetailProject(null)}
 onOpenChat={(p) => { setDetailProject(null); setChatProject(p); markProjectRead(p.id) }}
  onAddTask={handleAddProjectTask}
  onRemoveMember={removeMember}
  onAddMember={addMember}
  employees={[]}
  isDark={isDark}
/>
    </div>
  )
}
