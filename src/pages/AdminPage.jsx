import React, { useState, useEffect, useMemo, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { createClient } from '@supabase/supabase-js'
import { useTheme } from '../components/ThemeContext'
import { useAuth } from '../context/AuthContext'
import TaskCommentsModal from '../components/TaskCommentsModal'
import { createPortal } from 'react-dom'

const supabaseAdmin = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
)

const STATUS_COLOR = {
  todo: '#6b7fff', working: '#e8a04a', completed: '#4ecb83', onhold: '#9b7fe8',
}
const PRIORITY_COLOR = {
  high: '#ff5f6d', medium: '#e8a04a', low: '#4ecb83',
}

function fmtDate(ts) {
  if (!ts) return '—'
  return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function StatCard({ icon, label, value, color, isDark }) {
  return (
    <div style={{
      background: isDark ? '#16161d' : '#ffffff',
      border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)'}`,
      borderRadius: '16px', padding: '18px 20px',
    }}>
      <div style={{ fontSize: '22px', marginBottom: '10px' }}>{icon}</div>
      <div style={{ fontSize: '28px', fontWeight: 800, fontFamily: 'Syne, sans-serif', color: color || (isDark ? '#f0eff5' : '#1a1814'), lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '12px', color: isDark ? '#5a5968' : '#aaa9a0', marginTop: '4px' }}>{label}</div>
    </div>
  )
}

export default function AdminPage() {
  const { theme } = useTheme()
  const { profile } = useAuth()
  const isDark = theme === 'dark'
  const hasFetched = useRef(false)

  const [tab, setTab] = useState('overview')
  const [employees, setEmployees] = useState([])
  const [allTasks, setAllTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteName, setInviteName] = useState('')
  const [inviteRole, setInviteRole] = useState('employee')
  const [invitePwd, setInvitePwd] = useState('')
  const [inviteMsg, setInviteMsg] = useState({ type: '', text: '' })
  const [inviteLoading, setInviteLoading] = useState(false)
  const [empSearch, setEmpSearch] = useState('')
  const [taskFilter, setTaskFilter] = useState('all')
  const [empFilter, setEmpFilter] = useState('all')
  const [commentTask, setCommentTask] = useState(null)
  const [reassignTaskId, setReassignTaskId] = useState(null)
  const [reassignEmpId, setReassignEmpId] = useState('')
  const [reassignLoading, setReassignLoading] = useState(false)
  const [deletedTasks, setDeletedTasks] = useState([])
  const [commentCounts, setCommentCounts] = useState({})
  const [unreadCommentCounts, setUnreadCommentCounts] = useState({})
  const [assignEmp, setAssignEmp] = useState('')
  const [assignTitle, setAssignTitle] = useState('')
  const [assignPriority, setAssignPriority] = useState('medium')
  const [assignDue, setAssignDue] = useState('')
  const [assignStatus, setAssignStatus] = useState('todo')
  const [assignMsg, setAssignMsg] = useState({ type: '', text: '' })
  const [assignLoading, setAssignLoading] = useState(false)

  const getLastRead = (taskId) => parseInt(localStorage.getItem(`lastRead_${taskId}`) || '0')
  const markCommentRead = (taskId) => {
    localStorage.setItem(`lastRead_${taskId}`, Date.now().toString())
    setUnreadCommentCounts(prev => ({ ...prev, [taskId]: 0 }))
  }

  async function loadData() {
    if (hasFetched.current) return
    hasFetched.current = true
    setLoading(true)
    const [empRes, taskRes, deletedRes] = await Promise.all([
      supabase.from('profiles').select('*').order('joined_at', { ascending: false }),
      supabase.from('tasks').select('*').is('deleted_at', null).order('created', { ascending: false }),
      supabase.from('tasks').select('*').not('deleted_at', 'is', null).order('deleted_at', { ascending: false }),
    ])
    if (empRes.data) setEmployees(empRes.data)
    if (taskRes.data) setAllTasks(taskRes.data)
    if (deletedRes.data) setDeletedTasks(deletedRes.data)
    const { data: commentData } = await supabase.from('task_comments').select('task_id, created_at')
    if (commentData) {
      const counts = {}, unread = {}
      commentData.forEach(c => {
        counts[c.task_id] = (counts[c.task_id] || 0) + 1
        const lastRead = getLastRead(c.task_id)
        if (new Date(c.created_at).getTime() > lastRead) {
          unread[c.task_id] = (unread[c.task_id] || 0) + 1
        }
      })
      setCommentCounts(counts)
      setUnreadCommentCounts(unread)
    }
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  const handleRefresh = async () => {
    setRefreshing(true)
    hasFetched.current = false
    await loadData()
    setRefreshing(false)
  }

  const handleReassign = async (taskId) => {
    if (!reassignEmpId) return
    setReassignLoading(true)
    const task = allTasks.find(t => t.id === taskId)
    const oldOwnerId = task?.user_id
    const newEmp = employees.find(e => e.id === reassignEmpId)
    const { error } = await supabase.from('tasks').update({ user_id: reassignEmpId, assigned_to: reassignEmpId }).eq('id', taskId)
    if (error) { console.error('reassign error:', error.message); setReassignLoading(false); return }
    setAllTasks(prev => prev.map(t => t.id === taskId ? { ...t, user_id: reassignEmpId, assigned_to: reassignEmpId } : t))
    const notifications = []
    if (reassignEmpId) notifications.push({ user_id: reassignEmpId, message: `📌 Task "${task?.title}" has been assigned to you by Admin`, task_title: task?.title, read: false })
    if (oldOwnerId && oldOwnerId !== reassignEmpId) notifications.push({ user_id: oldOwnerId, message: `🔄 Task "${task?.title}" has been reassigned to ${newEmp?.full_name || newEmp?.email}`, task_title: task?.title, read: false })
    if (notifications.length > 0) await supabase.from('notifications').insert(notifications)
    setReassignTaskId(null)
    setReassignEmpId('')
    setReassignLoading(false)
  }

  const handleAssignTask = async (e) => {
    e.preventDefault()
    if (!assignEmp || !assignTitle.trim()) { setAssignMsg({ type: 'error', text: 'Please select an employee and enter a task title.' }); return }
    setAssignLoading(true)
    setAssignMsg({ type: '', text: '' })
    try {
      const newTask = { id: Math.random().toString(36).slice(2, 10), title: assignTitle.trim(), status: assignStatus, priority: assignPriority, due: assignDue || null, created: Date.now(), user_id: assignEmp, assigned_to: assignEmp }
      const { error } = await supabase.from('tasks').insert(newTask)
      if (error) throw error
      const emp = employees.find(e => e.id === assignEmp)
      setAssignMsg({ type: 'success', text: `✅ Task assigned to ${emp?.full_name || emp?.email}!` })
      setAssignTitle(''); setAssignDue(''); setAssignPriority('medium'); setAssignStatus('todo'); setAssignEmp('')
      const { data } = await supabase.from('tasks').select('*').is('deleted_at', null).order('created', { ascending: false })
      if (data) setAllTasks(data)
    } catch (err) { setAssignMsg({ type: 'error', text: `Error: ${err.message}` }) }
    finally { setAssignLoading(false) }
  }

  const handleInvite = async (e) => {
    e.preventDefault()
    if (!inviteEmail.trim() || !invitePwd.trim() || !inviteName.trim()) { setInviteMsg({ type: 'error', text: 'Please fill in all fields.' }); return }
    if (invitePwd.length < 6) { setInviteMsg({ type: 'error', text: 'Password must be at least 6 characters.' }); return }
    setInviteLoading(true); setInviteMsg({ type: '', text: '' })
    try {
      const { data, error } = await supabaseAdmin.auth.signUp({ email: inviteEmail.trim(), password: invitePwd, options: { data: { full_name: inviteName.trim() } } })
      if (error) throw error
      const userId = data?.user?.id
      if (!userId) throw new Error('User ID not returned. Email may already be registered.')
      await supabaseAdmin.auth.signOut()
      const { error: profileError } = await supabase.from('profiles').upsert({ id: userId, email: inviteEmail.trim(), full_name: inviteName.trim(), role: inviteRole })
      if (profileError) throw profileError
      setInviteMsg({ type: 'success', text: `✅ ${inviteName} added! They can log in with ${inviteEmail.trim()}` })
      setInviteEmail(''); setInviteName(''); setInvitePwd(''); setInviteRole('employee')
      const { data: empData } = await supabase.from('profiles').select('*').order('joined_at', { ascending: false })
      if (empData) setEmployees(empData)
    } catch (err) {
      let msg = err.message
      if (msg.includes('already registered') || msg.includes('already exists')) msg = 'This email is already registered.'
      else if (msg.includes('Password should be')) msg = 'Password must be at least 6 characters.'
      setInviteMsg({ type: 'error', text: `Error: ${msg}` })
    } finally { setInviteLoading(false) }
  }

  const handleRoleChange = async (empId, newRole) => {
    await supabase.from('profiles').update({ role: newRole }).eq('id', empId)
    setEmployees(prev => prev.map(e => e.id === empId ? { ...e, role: newRole } : e))
  }

  const stats = useMemo(() => ({
    totalEmployees: employees.filter(e => e.role === 'employee').length,
    totalAdmins: employees.filter(e => e.role === 'admin').length,
    totalTasks: allTasks.length,
    completedTasks: allTasks.filter(t => t.status === 'completed').length,
    pendingTasks: allTasks.filter(t => t.status !== 'completed').length,
    overdueTasks: allTasks.filter(t => t.due && new Date(t.due) < new Date() && t.status !== 'completed').length,
  }), [employees, allTasks])

  const filteredEmp = useMemo(() =>
    employees.filter(e => e.full_name?.toLowerCase().includes(empSearch.toLowerCase()) || e.email?.toLowerCase().includes(empSearch.toLowerCase())),
    [employees, empSearch])

  const filteredTasks = useMemo(() =>
    allTasks.filter(t => taskFilter === 'all' || t.status === taskFilter).filter(t => empFilter === 'all' || t.user_id === empFilter),
    [allTasks, taskFilter, empFilter])

  const v = {
    page: { color: isDark ? '#f0eff5' : '#1a1814', fontFamily: 'DM Sans, sans-serif' },
    card: { background: isDark ? '#16161d' : '#ffffff', border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)'}`, borderRadius: '18px', padding: '18px 16px', marginBottom: '16px' },
    cardTitle: { fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: isDark ? '#5a5968' : '#aaa9a0', marginBottom: '16px' },
    tabBtn: (active) => ({
      padding: '7px 14px', borderRadius: '10px', border: 'none', cursor: 'pointer',
      background: active ? (isDark ? '#e8a04a' : '#c8533a') : (isDark ? '#1e1e28' : '#f0ebe3'),
      color: active ? (isDark ? '#1a1000' : '#fff') : (isDark ? '#8b8a9b' : '#6b6760'),
      fontSize: '12px', fontWeight: active ? 600 : 400,
      fontFamily: 'DM Sans, sans-serif', transition: 'all 0.15s', whiteSpace: 'nowrap',
    }),
    input: { width: '100%', padding: '10px 13px', borderRadius: '9px', boxSizing: 'border-box', border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.10)'}`, background: isDark ? '#1e1e28' : '#f7f3ee', color: isDark ? '#f0eff5' : '#1a1814', fontSize: '13px', fontFamily: 'DM Sans, sans-serif', outline: 'none' },
    select: { padding: '10px 13px', borderRadius: '9px', border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.10)'}`, background: isDark ? '#1e1e28' : '#f7f3ee', color: isDark ? '#f0eff5' : '#1a1814', fontSize: '13px', fontFamily: 'DM Sans, sans-serif' },
    row: { display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 0', borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'}` },
    submitBtn: { padding: '10px 24px', borderRadius: '10px', border: 'none', background: isDark ? '#e8a04a' : '#c8533a', color: isDark ? '#1a1000' : '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', width: '100%' },
    label: { display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: isDark ? '#5a5968' : '#aaa9a0', marginBottom: '6px' },
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '12px' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ width: '28px', height: '28px', borderRadius: '50%', border: '2.5px solid rgba(255,255,255,0.08)', borderTopColor: '#e8a04a', animation: 'spin 0.7s linear infinite' }} />
      <span style={{ color: isDark ? '#5a5968' : '#aaa9a0', fontSize: '13px' }}>Loading admin data…</span>
    </div>
  )

  return (
    <div style={v.page}>
      <style>{`
        @media (max-width: 768px) {
          .admin-tab-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; padding-bottom: 4px; }
          .admin-tab-scroll::-webkit-scrollbar { display: none; }
          .emp-row { flex-wrap: wrap !important; }
          .emp-row-right { flex-wrap: wrap; gap: 6px !important; }
          .task-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
          .task-table-inner { min-width: 700px; }
          .deleted-table-inner { min-width: 500px; }
          .assign-form { max-width: 100% !important; }
          .overview-progress { width: 70px !important; }
        }
        @media (max-width: 480px) {
          .admin-card { padding: 14px 12px !important; }
          .stat-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>

      {/* Tab nav */}
      <div className="admin-tab-scroll" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', width: 'max-content' }}>
          {['overview', 'employees', 'tasks', 'assign', 'invite'].map(t => (
            <button key={t} style={v.tabBtn(tab === t)} onClick={() => setTab(t)}>
              {t === 'overview' ? '📊 Overview'
                : t === 'employees' ? '👥 Employees'
                : t === 'tasks' ? '📋 All Tasks'
                : t === 'assign' ? '📌 Assign Task'
                : '➕ Add Employee'}
            </button>
          ))}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            style={{ padding: '7px 12px', borderRadius: '10px', border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.09)'}`, background: 'transparent', color: isDark ? '#5a5968' : '#aaa9a0', fontSize: '12px', cursor: refreshing ? 'not-allowed' : 'pointer', fontFamily: 'DM Sans, sans-serif', display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap', opacity: refreshing ? 0.6 : 1 }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: refreshing ? 'spin 0.7s linear infinite' : 'none' }}>
              <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* OVERVIEW */}
      {tab === 'overview' && (
        <>
          <div className="stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px,1fr))', gap: '10px', marginBottom: '20px' }}>
            <StatCard icon="👥" label="Employees"  value={stats.totalEmployees} isDark={isDark} />
            <StatCard icon="🛡️" label="Admins"      value={stats.totalAdmins}    isDark={isDark} color="#6b7fff" />
            <StatCard icon="📋" label="Total tasks" value={stats.totalTasks}     isDark={isDark} />
            <StatCard icon="✅" label="Completed"   value={stats.completedTasks} isDark={isDark} color="#4ecb83" />
            <StatCard icon="⏳" label="Pending"     value={stats.pendingTasks}   isDark={isDark} color="#e8a04a" />
            <StatCard icon="🚨" label="Overdue"     value={stats.overdueTasks}   isDark={isDark} color={stats.overdueTasks > 0 ? '#ff5f6d' : '#4ecb83'} />
          </div>
          <div className="admin-card" style={v.card}>
            <div style={v.cardTitle}>Tasks per employee</div>
            {employees.filter(e => e.role === 'employee').map(emp => {
              const empTasks = allTasks.filter(t => t.user_id === emp.id)
              const done = empTasks.filter(t => t.status === 'completed').length
              const pct = empTasks.length ? Math.round((done / empTasks.length) * 100) : 0
              return (
                <div key={emp.id} style={v.row}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg,#6b7fff,#e8a04a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                    {(emp.full_name || emp.email || '?').charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: isDark ? '#f0eff5' : '#1a1814', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{emp.full_name || emp.email}</div>
                    <div style={{ fontSize: '11px', color: isDark ? '#5a5968' : '#aaa9a0' }}>{empTasks.length} tasks • {done} done</div>
                  </div>
                  <div className="overview-progress" style={{ width: '90px', flexShrink: 0 }}>
                    <div style={{ height: '5px', borderRadius: '5px', background: isDark ? '#252532' : '#e5dfd6', overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: '5px', background: '#4ecb83', width: `${pct}%`, transition: 'width 0.5s' }} />
                    </div>
                    <div style={{ fontSize: '10px', color: isDark ? '#5a5968' : '#aaa9a0', marginTop: '3px', textAlign: 'right' }}>{pct}%</div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* EMPLOYEES */}
      {tab === 'employees' && (
        <div className="admin-card" style={v.card}>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={v.cardTitle}>All employees ({employees.length})</div>
            <input type="text" value={empSearch} onChange={e => setEmpSearch(e.target.value)}
              placeholder="Search by name or email…"
              style={{ ...v.input, maxWidth: '240px', marginBottom: 0 }} />
          </div>
          {filteredEmp.map(emp => (
            <div key={emp.id} className="emp-row" style={v.row}>
              {/* Avatar */}
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg,#6b7fff,#e8a04a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                {(emp.full_name || emp.email || '?').charAt(0).toUpperCase()}
              </div>
              {/* Name + email */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 500, color: isDark ? '#f0eff5' : '#1a1814', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{emp.full_name || '—'}</div>
                <div style={{ fontSize: '11px', color: isDark ? '#5a5968' : '#aaa9a0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{emp.email}</div>
              </div>
              {/* Right side — joined + role dropdown + badge */}
              <div className="emp-row-right" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, flexWrap: 'wrap' }}>
                <div style={{ fontSize: '11px', color: isDark ? '#5a5968' : '#aaa9a0' }}>
                  Joined {fmtDate(emp.joined_at)}
                </div>
                <select value={emp.role} onChange={e => handleRoleChange(emp.id, e.target.value)}
                  style={{ ...v.select, fontSize: '12px', padding: '5px 10px' }}
                  disabled={emp.id === profile?.id}>
                  <option value="employee">Employee</option>
                  <option value="admin">Admin</option>
                </select>
                <div style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '20px', fontWeight: 600,
                  background: emp.role === 'admin' ? 'rgba(107,127,255,0.15)' : 'rgba(78,203,131,0.15)',
                  color: emp.role === 'admin' ? '#6b7fff' : '#4ecb83' }}>
                  {emp.role === 'admin' ? 'Admin' : 'Employee'}
                </div>
              </div>
            </div>
          ))}
          {filteredEmp.length === 0 && (
            <div style={{ color: isDark ? '#5a5968' : '#aaa9a0', fontSize: '13px', padding: '16px 0' }}>No employees found.</div>
          )}
        </div>
      )}

      {/* ALL TASKS */}
      {tab === 'tasks' && (
        <div className="admin-card" style={v.card}>
          {/* Filters */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '16px' }}>
            <div style={v.cardTitle}>All tasks ({filteredTasks.length})</div>
            <select value={taskFilter} onChange={e => setTaskFilter(e.target.value)} style={{ ...v.select, fontSize: '12px', padding: '5px 10px' }}>
              <option value="all">All status</option>
              <option value="todo">To Do</option>
              <option value="working">Working</option>
              <option value="completed">Completed</option>
              <option value="onhold">On Hold</option>
            </select>
            <select value={empFilter} onChange={e => setEmpFilter(e.target.value)} style={{ ...v.select, fontSize: '12px', padding: '5px 10px' }}>
              <option value="all">All employees</option>
              {employees.filter(e => e.role === 'employee').map(e => (
                <option key={e.id} value={e.id}>{e.full_name || e.email}</option>
              ))}
            </select>
          </div>

          {/* Scrollable table */}
          <div className="task-table-wrap">
            <div className="task-table-inner">
              {/* Column headers */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 130px 90px 90px 75px 85px 65px 90px', gap: '8px', padding: '6px 0 10px', borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)'}`, marginBottom: '4px' }}>
                {['Task', 'Employee', 'Created', 'Due', 'Priority', 'Status', '', ''].map((col, i) => (
                  <div key={i} style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: isDark ? '#5a5968' : '#aaa9a0' }}>{col}</div>
                ))}
              </div>

              {filteredTasks.length === 0 && (
                <div style={{ color: isDark ? '#5a5968' : '#aaa9a0', fontSize: '13px', padding: '20px 0', textAlign: 'center' }}>No tasks found.</div>
              )}

              {filteredTasks.map(t => {
                const emp = employees.find(e => e.id === t.user_id)
                const empName = emp?.full_name || emp?.email || 'Unknown'
                const empInitial = empName.charAt(0).toUpperCase()
                const isOverdue = t.due && new Date(t.due) < new Date() && t.status !== 'completed'
                return (
                  <div key={t.id} style={{ display: 'grid', gridTemplateColumns: '1fr 130px 90px 90px 75px 85px 65px 90px', gap: '8px', alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'}` }}>
                    {/* Title */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                      <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: STATUS_COLOR[t.status], flexShrink: 0 }} />
                      <span style={{ fontSize: '13px', fontWeight: 500, color: isDark ? '#f0eff5' : '#1a1814', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</span>
                    </div>
                    {/* Employee */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                      {emp ? (
                        <>
                          <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'linear-gradient(135deg,#6b7fff,#e8a04a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 700, color: '#fff', flexShrink: 0 }}>{empInitial}</div>
                          <span style={{ fontSize: '12px', color: isDark ? '#c8c7d4' : '#3a3832', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{empName}</span>
                        </>
                      ) : (
                        <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: 'rgba(255,95,109,0.10)', color: '#ff5f6d', fontWeight: 600 }}>Unassigned</span>
                      )}
                    </div>
                    {/* Created */}
                    <span style={{ fontSize: '11px', color: isDark ? '#5a5968' : '#aaa9a0' }}>{fmtDate(t.created)}</span>
                    {/* Due */}
                    <span style={{ fontSize: '11px', color: isOverdue ? '#ff5f6d' : isDark ? '#5a5968' : '#aaa9a0', fontWeight: isOverdue ? 600 : 400 }}>
                      {t.due ? fmtDate(new Date(t.due).getTime()) : '—'}
                    </span>
                    {/* Priority */}
                    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', textAlign: 'center', background: `${PRIORITY_COLOR[t.priority]}20`, color: PRIORITY_COLOR[t.priority], fontWeight: 600, textTransform: 'capitalize' }}>
                      {t.priority || '—'}
                    </span>
                    {/* Status */}
                    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', textAlign: 'center', background: `${STATUS_COLOR[t.status]}20`, color: STATUS_COLOR[t.status], textTransform: 'capitalize' }}>
                      {t.status}
                    </span>
                    {/* Chat */}
                    <button onClick={() => { setCommentTask(t); markCommentRead(t.id) }}
                      style={{ background: 'rgba(107,127,255,0.12)', border: 'none', borderRadius: '8px', padding: '4px 8px', color: '#6b7fff', fontSize: '11px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'DM Sans, sans-serif', whiteSpace: 'nowrap' }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                      Chat
                      {unreadCommentCounts[t.id] > 0 && (
                        <span style={{ background: '#6b7fff', color: '#fff', borderRadius: '20px', fontSize: '9px', fontWeight: 700, padding: '1px 5px' }}>{unreadCommentCounts[t.id]}</span>
                      )}
                    </button>
                    {/* Reassign */}
                    <div style={{ position: 'relative' }}>
                      {reassignTaskId === t.id ? (
                        <div style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: '4px', background: isDark ? '#1e1e28' : '#ffffff', border: `1px solid ${isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)'}`, borderRadius: '10px', padding: '8px', boxShadow: isDark ? '0 8px 24px rgba(0,0,0,0.4)' : '0 4px 16px rgba(0,0,0,0.12)', zIndex: 50, minWidth: '160px' }}>
                          <select value={reassignEmpId} onChange={e => setReassignEmpId(e.target.value)} style={{ ...v.select, fontSize: '11px', padding: '5px 8px', width: '100%' }} autoFocus>
                            <option value="">Pick employee…</option>
                            {employees.filter(e => e.role === 'employee').map(e => (
                              <option key={e.id} value={e.id}>{e.full_name || e.email}</option>
                            ))}
                          </select>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button onClick={() => handleReassign(t.id)} disabled={!reassignEmpId || reassignLoading} style={{ flex: 1, padding: '5px 8px', borderRadius: '7px', border: 'none', background: '#4ecb83', color: '#fff', fontSize: '11px', fontWeight: 600, cursor: 'pointer', opacity: !reassignEmpId || reassignLoading ? 0.5 : 1, fontFamily: 'DM Sans, sans-serif' }}>
                              {reassignLoading ? '…' : '✓ Confirm'}
                            </button>
                            <button onClick={() => { setReassignTaskId(null); setReassignEmpId('') }} style={{ padding: '5px 8px', borderRadius: '7px', border: 'none', background: 'rgba(255,95,109,0.15)', color: '#ff5f6d', fontSize: '11px', fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>✕</button>
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => { setReassignTaskId(t.id); setReassignEmpId(t.user_id || '') }}
                          style={{ background: 'rgba(78,203,131,0.10)', border: 'none', borderRadius: '8px', padding: '4px 8px', color: '#4ecb83', fontSize: '11px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'DM Sans, sans-serif', whiteSpace: 'nowrap' }}>
                          👤 {t.user_id ? 'Reassign' : 'Assign'}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}

              {/* Deleted Tasks */}
              {deletedTasks.length > 0 && (
                <div style={{ marginTop: '28px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <div style={{ height: '1px', flex: 1, background: 'rgba(255,95,109,0.15)' }} />
                    <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#ff5f6d' }}>🗑️ Deleted Tasks ({deletedTasks.length})</span>
                    <div style={{ height: '1px', flex: 1, background: 'rgba(255,95,109,0.15)' }} />
                  </div>
                  <div className="deleted-table-inner">
                    {deletedTasks.map(t => {
                      const emp = employees.find(e => e.id === (t.user_id || t.userId))
                      const empName = emp?.full_name || emp?.email || 'Unknown'
                      const empInitial = empName.charAt(0).toUpperCase()
                      return (
                        <div key={t.id} style={{ display: 'grid', gridTemplateColumns: '1fr 130px 80px 90px', gap: '8px', alignItems: 'center', padding: '10px 12px', marginBottom: '4px', borderRadius: '10px', background: 'rgba(255,95,109,0.05)', border: '1px solid rgba(255,95,109,0.12)', opacity: 0.8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#ff5f6d', flexShrink: 0 }} />
                            <span style={{ fontSize: '13px', fontWeight: 500, color: isDark ? '#5a5968' : '#aaa9a0', textDecoration: 'line-through', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                            <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'linear-gradient(135deg,#ff5f6d,#ff8c94)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 700, color: '#fff', flexShrink: 0 }}>{empInitial}</div>
                            <span style={{ fontSize: '12px', color: isDark ? '#5a5968' : '#aaa9a0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{empName}</span>
                          </div>
                          <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', textAlign: 'center', background: `${PRIORITY_COLOR[t.priority]}15`, color: isDark ? '#5a5968' : '#aaa9a0', textTransform: 'capitalize' }}>{t.priority || '—'}</span>
                          <span style={{ fontSize: '11px', color: '#ff5f6d' }}>🗑️ {fmtDate(t.deleted_at)}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ASSIGN TASK */}
      {tab === 'assign' && (
        <div className="assign-form" style={{ maxWidth: '480px' }}>
          <div className="admin-card" style={v.card}>
            <div style={v.cardTitle}>Assign task to employee</div>
            {assignMsg.text && (
              <div style={{ padding: '10px 14px', borderRadius: '10px', marginBottom: '16px', fontSize: '13px', lineHeight: 1.5, background: assignMsg.type === 'success' ? 'rgba(78,203,131,0.12)' : 'rgba(255,95,109,0.12)', border: `1px solid ${assignMsg.type === 'success' ? 'rgba(78,203,131,0.3)' : 'rgba(255,95,109,0.3)'}`, color: assignMsg.type === 'success' ? '#4ecb83' : '#ff5f6d' }}>
                {assignMsg.text}
              </div>
            )}
            <form onSubmit={handleAssignTask} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div><label style={v.label}>Select Employee</label><select value={assignEmp} onChange={e => setAssignEmp(e.target.value)} style={{ ...v.select, width: '100%' }}><option value="">— Pick an employee —</option>{employees.filter(e => e.role === 'employee').map(e => (<option key={e.id} value={e.id}>{e.full_name || e.email}</option>))}</select></div>
              <div><label style={v.label}>Task Title</label><input type="text" value={assignTitle} onChange={e => setAssignTitle(e.target.value)} placeholder="What needs to be done?" style={v.input} /></div>
              <div><label style={v.label}>Priority</label><select value={assignPriority} onChange={e => setAssignPriority(e.target.value)} style={{ ...v.select, width: '100%' }}><option value="high">🔴 High</option><option value="medium">🟡 Medium</option><option value="low">🟢 Low</option></select></div>
              <div><label style={v.label}>Status</label><select value={assignStatus} onChange={e => setAssignStatus(e.target.value)} style={{ ...v.select, width: '100%' }}><option value="todo">To Do</option><option value="working">Working</option><option value="onhold">On Hold</option><option value="completed">Completed</option></select></div>
              <div><label style={v.label}>Due Date <span style={{ textTransform: 'none', fontWeight: 400 }}>(optional)</span></label><input type="date" value={assignDue} onChange={e => setAssignDue(e.target.value)} style={v.input} /></div>
              <button type="submit" style={{ ...v.submitBtn, opacity: assignLoading ? 0.7 : 1 }} disabled={assignLoading}>{assignLoading ? 'Assigning…' : '📌 Assign Task'}</button>
            </form>
          </div>
        </div>
      )}

      {/* ADD EMPLOYEE */}
      {tab === 'invite' && (
        <div className="assign-form" style={{ maxWidth: '480px' }}>
          <div className="admin-card" style={v.card}>
            <div style={v.cardTitle}>Add new employee</div>
            {inviteMsg.text && (
              <div style={{ padding: '10px 14px', borderRadius: '10px', marginBottom: '16px', fontSize: '13px', lineHeight: 1.5, background: inviteMsg.type === 'success' ? 'rgba(78,203,131,0.12)' : 'rgba(255,95,109,0.12)', border: `1px solid ${inviteMsg.type === 'success' ? 'rgba(78,203,131,0.3)' : 'rgba(255,95,109,0.3)'}`, color: inviteMsg.type === 'success' ? '#4ecb83' : '#ff5f6d' }}>
                {inviteMsg.text}
              </div>
            )}
            <form onSubmit={handleInvite} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div><label style={v.label}>Full name</label><input type="text" value={inviteName} onChange={e => setInviteName(e.target.value)} placeholder="John Smith" style={v.input} /></div>
              <div><label style={v.label}>Email address</label><input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="john@company.com" style={v.input} /></div>
              <div><label style={v.label}>Password <span style={{ textTransform: 'none', fontWeight: 400 }}>(min 6 characters)</span></label><input type="password" value={invitePwd} onChange={e => setInvitePwd(e.target.value)} placeholder="Minimum 6 characters" style={v.input} /></div>
              <div><label style={v.label}>Role</label><select value={inviteRole} onChange={e => setInviteRole(e.target.value)} style={{ ...v.select, width: '100%' }}><option value="employee">Employee</option><option value="admin">Admin</option></select></div>
              <button type="submit" style={{ ...v.submitBtn, opacity: inviteLoading ? 0.7 : 1 }} disabled={inviteLoading}>{inviteLoading ? 'Adding…' : '+ Add Employee'}</button>
            </form>
          </div>
          <div className="admin-card" style={{ ...v.card, fontSize: '13px', color: isDark ? '#5a5968' : '#aaa9a0', lineHeight: 1.7 }}>
            <div style={v.cardTitle}>How it works</div>
            Employee can log in immediately with the email and password you set here. Admin sees all tasks. Employees only see their own tasks. You can change anyone's role from the Employees tab at any time.
          </div>
        </div>
      )}

      {createPortal(
        <TaskCommentsModal task={commentTask} open={!!commentTask} onClose={() => setCommentTask(null)} isDark={isDark} employees={employees} />,
        document.body
      )}
    </div>
  )
}
