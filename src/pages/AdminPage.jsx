import React, { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { createClient } from '@supabase/supabase-js'
import { useTheme } from '../components/ThemeContext'
import { useAuth } from '../context/AuthContext'

// ── Second Supabase client just for creating employees ──
// This is a completely separate connection — uses same project
// but has its OWN session so admin session is never touched
const supabaseAdmin = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: false,   // ← key: don't save this session to localStorage
      autoRefreshToken: false,
    },
  }
)

const STATUS_COLOR = {
  todo:      '#6b7fff',
  working:   '#e8a04a',
  completed: '#4ecb83',
  onhold:    '#9b7fe8',
}

const PRIORITY_COLOR = {
  high:   '#ff5f6d',
  medium: '#e8a04a',
  low:    '#4ecb83',
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
      borderRadius: '16px',
      padding: '18px 20px',
    }}>
      <div style={{ fontSize: '22px', marginBottom: '10px' }}>{icon}</div>
      <div style={{ fontSize: '28px', fontWeight: 800, fontFamily: 'Syne, sans-serif', color: color || (isDark ? '#f0eff5' : '#1a1814'), lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '12px', color: isDark ? '#5a5968' : '#aaa9a0', marginTop: '4px' }}>{label}</div>
    </div>
  )
}

export default function AdminPage() {
  const { theme }   = useTheme()
  const { profile } = useAuth()
  const isDark      = theme === 'dark'

  const [tab,           setTab]           = useState('overview')
  const [employees,     setEmployees]     = useState([])
  const [allTasks,      setAllTasks]      = useState([])
  const [loading,       setLoading]       = useState(true)
  const [inviteEmail,   setInviteEmail]   = useState('')
  const [inviteName,    setInviteName]    = useState('')
  const [inviteRole,    setInviteRole]    = useState('employee')
  const [invitePwd,     setInvitePwd]     = useState('')
  const [inviteMsg,     setInviteMsg]     = useState({ type: '', text: '' })
  const [inviteLoading, setInviteLoading] = useState(false)
  const [empSearch,     setEmpSearch]     = useState('')
  const [taskFilter,    setTaskFilter]    = useState('all')

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      const [empRes, taskRes] = await Promise.all([
  supabase.from('profiles').select('*').order('joined_at', { ascending: false }),
  supabase.from('tasks').select('*, profiles!tasks_user_id_fkey(full_name, email)').order('created', { ascending: false }),
  
      ])
      console.log("Employees:", empRes.data)
console.log("Tasks:", taskRes.data)
console.log("Employee Error:", empRes.error)
console.log("Task Error:", taskRes.error)
      if (empRes.data)  setEmployees(empRes.data)
      if (taskRes.data) setAllTasks(taskRes.data)
      setLoading(false)
    }
    loadData()
  }, [])

  // ── ADD EMPLOYEE ──
  // Uses a separate Supabase client so admin stays logged in
  const handleInvite = async (e) => {
    e.preventDefault()

    if (!inviteEmail.trim() || !invitePwd.trim() || !inviteName.trim()) {
      setInviteMsg({ type: 'error', text: 'Please fill in all fields.' })
      return
    }

    if (invitePwd.length < 6) {
      setInviteMsg({ type: 'error', text: 'Password must be at least 6 characters.' })
      return
    }

    setInviteLoading(true)
    setInviteMsg({ type: '', text: '' })

    try {
      // Step 1: Sign up using the SEPARATE client (admin session untouched)
    const { data, error } = await supabaseAdmin.auth.signUp({
  email: inviteEmail.trim(),
  password: invitePwd,
  options: {
    data: { full_name: inviteName.trim() },
  },
})

console.log("SIGNUP DATA:", data)
console.log("SIGNUP ERROR:", error)

      if (error) throw error

      const userId = data?.user?.id
      if (!userId) throw new Error('User ID not returned. Email may already be registered.')

      // Step 2: Sign out from the temp client immediately
      await supabaseAdmin.auth.signOut()

      // Step 3: Update the profile with correct name and role
      // (the trigger auto-creates the profile, we just update it)
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id:        userId,
          email:     inviteEmail.trim(),
          full_name: inviteName.trim(),
          role:      inviteRole,
        })

      if (profileError) throw profileError

      setInviteMsg({
        type: 'success',
        text: `✅ ${inviteName} added! They can log in with ${inviteEmail.trim()}`,
      })

      setInviteEmail('')
      setInviteName('')
      setInvitePwd('')
      setInviteRole('employee')

      // Reload employees list
      const { data: empData } = await supabase
        .from('profiles')
        .select('*')
        .order('joined_at', { ascending: false })

      if (empData) setEmployees(empData)

    } catch (err) {
      // Give a clear message for the most common errors
      let msg = err.message
      if (msg.includes('already registered') || msg.includes('already exists')) {
        msg = 'This email is already registered.'
      } else if (msg.includes('Password should be')) {
        msg = 'Password must be at least 6 characters.'
      }
      setInviteMsg({ type: 'error', text: `Error: ${msg}` })
    } finally {
      setInviteLoading(false)
    }
  }

  const handleRoleChange = async (empId, newRole) => {
    await supabase.from('profiles').update({ role: newRole }).eq('id', empId)
    setEmployees(prev => prev.map(e => e.id === empId ? { ...e, role: newRole } : e))
  }

  const stats = useMemo(() => ({
    totalEmployees: employees.filter(e => e.role === 'employee').length,
    totalAdmins:    employees.filter(e => e.role === 'admin').length,
    totalTasks:     allTasks.length,
    completedTasks: allTasks.filter(t => t.status === 'completed').length,
    pendingTasks:   allTasks.filter(t => t.status !== 'completed').length,
    overdueTasks:   allTasks.filter(t => t.due && new Date(t.due) < new Date() && t.status !== 'completed').length,
  }), [employees, allTasks])

  const filteredEmp = useMemo(() =>
    employees.filter(e =>
      e.full_name?.toLowerCase().includes(empSearch.toLowerCase()) ||
      e.email?.toLowerCase().includes(empSearch.toLowerCase())
    ), [employees, empSearch])

  const filteredTasks = useMemo(() =>
    taskFilter === 'all' ? allTasks : allTasks.filter(t => t.status === taskFilter),
    [allTasks, taskFilter])

  const v = {
    page: { color: isDark ? '#f0eff5' : '#1a1814', fontFamily: 'DM Sans, sans-serif' },
    card: {
      background: isDark ? '#16161d' : '#ffffff',
      border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)'}`,
      borderRadius: '18px', padding: '22px 24px', marginBottom: '16px',
    },
    cardTitle: { fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: isDark ? '#5a5968' : '#aaa9a0', marginBottom: '16px' },
    tabBtn: (active) => ({
      padding: '8px 18px', borderRadius: '10px', border: 'none', cursor: 'pointer',
      background: active ? (isDark ? '#e8a04a' : '#c8533a') : (isDark ? '#1e1e28' : '#f0ebe3'),
      color: active ? (isDark ? '#1a1000' : '#fff') : (isDark ? '#8b8a9b' : '#6b6760'),
      fontSize: '13px', fontWeight: active ? 600 : 400,
      fontFamily: 'DM Sans, sans-serif', transition: 'all 0.15s',
    }),
    input: {
      width: '100%', padding: '10px 13px', borderRadius: '9px', boxSizing: 'border-box',
      border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.10)'}`,
      background: isDark ? '#1e1e28' : '#f7f3ee',
      color: isDark ? '#f0eff5' : '#1a1814',
      fontSize: '13px', fontFamily: 'DM Sans, sans-serif', outline: 'none',
    },
    select: {
      padding: '10px 13px', borderRadius: '9px',
      border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.10)'}`,
      background: isDark ? '#1e1e28' : '#f7f3ee',
      color: isDark ? '#f0eff5' : '#1a1814',
      fontSize: '13px', fontFamily: 'DM Sans, sans-serif',
    },
    row: {
      display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 0',
      borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'}`,
    },
    submitBtn: {
      padding: '10px 24px', borderRadius: '10px', border: 'none',
      background: isDark ? '#e8a04a' : '#c8533a',
      color: isDark ? '#1a1000' : '#fff',
      fontSize: '13px', fontWeight: 600, cursor: 'pointer',
      fontFamily: 'DM Sans, sans-serif',
      opacity: inviteLoading ? 0.7 : 1,
    },
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '12px' }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ width: '28px', height: '28px', borderRadius: '50%', border: '2.5px solid rgba(255,255,255,0.08)', borderTopColor: '#e8a04a', animation: 'spin 0.7s linear infinite' }} />
        <span style={{ color: isDark ? '#5a5968' : '#aaa9a0', fontSize: '13px' }}>Loading admin data…</span>
      </div>
    )
  }

  return (
    <div style={v.page}>

      {/* Tab nav */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
        {['overview', 'employees', 'tasks', 'invite'].map(t => (
          <button key={t} style={v.tabBtn(tab === t)} onClick={() => setTab(t)}>
            {t === 'overview' ? '📊 Overview' : t === 'employees' ? '👥 Employees' : t === 'tasks' ? '📋 All Tasks' : '➕ Add Employee'}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {tab === 'overview' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px,1fr))', gap: '12px', marginBottom: '20px' }}>
            <StatCard icon="👥" label="Employees"   value={stats.totalEmployees} isDark={isDark} />
            <StatCard icon="🛡️" label="Admins"       value={stats.totalAdmins}    isDark={isDark} color="#6b7fff" />
            <StatCard icon="📋" label="Total tasks"  value={stats.totalTasks}     isDark={isDark} />
            <StatCard icon="✅" label="Completed"    value={stats.completedTasks} isDark={isDark} color="#4ecb83" />
            <StatCard icon="⏳" label="Pending"      value={stats.pendingTasks}   isDark={isDark} color="#e8a04a" />
            <StatCard icon="🚨" label="Overdue"      value={stats.overdueTasks}   isDark={isDark} color={stats.overdueTasks > 0 ? '#ff5f6d' : '#4ecb83'} />
          </div>
          <div style={v.card}>
            <div style={v.cardTitle}>Tasks per employee</div>
            {employees.filter(e => e.role === 'employee').map(emp => {
              const empTasks = allTasks.filter(t => t.user_id === emp.id)
              const done     = empTasks.filter(t => t.status === 'completed').length
              const pct      = empTasks.length ? Math.round((done / empTasks.length) * 100) : 0
              return (
                <div key={emp.id} style={v.row}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg,#6b7fff,#e8a04a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                    {(emp.full_name || emp.email || '?').charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: isDark ? '#f0eff5' : '#1a1814', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{emp.full_name || emp.email}</div>
                    <div style={{ fontSize: '11px', color: isDark ? '#5a5968' : '#aaa9a0' }}>{empTasks.length} tasks • {done} done</div>
                  </div>
                  <div style={{ width: '100px', flexShrink: 0 }}>
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
        <div style={v.card}>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={v.cardTitle}>All employees ({employees.length})</div>
            <input type="text" value={empSearch} onChange={e => setEmpSearch(e.target.value)}
              placeholder="Search by name or email…"
              style={{ ...v.input, maxWidth: '240px', marginBottom: 0 }} />
          </div>
          {filteredEmp.map(emp => (
            <div key={emp.id} style={v.row}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg,#6b7fff,#e8a04a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                {(emp.full_name || emp.email || '?').charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 500, color: isDark ? '#f0eff5' : '#1a1814' }}>{emp.full_name || '—'}</div>
                <div style={{ fontSize: '11px', color: isDark ? '#5a5968' : '#aaa9a0' }}>{emp.email}</div>
              </div>
              <div style={{ fontSize: '11px', color: isDark ? '#5a5968' : '#aaa9a0', flexShrink: 0 }}>Joined {fmtDate(emp.joined_at)}</div>
              <select value={emp.role} onChange={e => handleRoleChange(emp.id, e.target.value)}
                style={{ ...v.select, fontSize: '12px', padding: '5px 10px' }}
                disabled={emp.id === profile?.id}>
                <option value="employee">Employee</option>
                <option value="admin">Admin</option>
              </select>
              <div style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '20px', flexShrink: 0, fontWeight: 600,
                background: emp.role === 'admin' ? 'rgba(107,127,255,0.15)' : 'rgba(78,203,131,0.15)',
                color: emp.role === 'admin' ? '#6b7fff' : '#4ecb83' }}>
                {emp.role === 'admin' ? 'Admin' : 'Employee'}
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
        <div style={v.card}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '16px' }}>
            <div style={v.cardTitle}>All tasks ({filteredTasks.length})</div>
            <select value={taskFilter} onChange={e => setTaskFilter(e.target.value)} style={{ ...v.select, fontSize: '12px', padding: '5px 10px' }}>
              <option value="all">All status</option>
              <option value="todo">To Do</option>
              <option value="working">Working</option>
              <option value="completed">Completed</option>
              <option value="onhold">On Hold</option>
            </select>
          </div>
          {filteredTasks.map(t => (
            <div key={t.id} style={v.row}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: STATUS_COLOR[t.status], flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: '13px', color: isDark ? '#f0eff5' : '#1a1814', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</span>
              <span style={{ fontSize: '11px', color: isDark ? '#5a5968' : '#aaa9a0', whiteSpace: 'nowrap', flexShrink: 0 }}>
                {t.profiles?.full_name || t.profiles?.email || 'Unknown'}
              </span>
              <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', flexShrink: 0, background: `${PRIORITY_COLOR[t.priority]}20`, color: PRIORITY_COLOR[t.priority], fontWeight: 600 }}>{t.priority}</span>
              <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', flexShrink: 0, background: `${STATUS_COLOR[t.status]}20`, color: STATUS_COLOR[t.status] }}>{t.status}</span>
            </div>
          ))}
        </div>
      )}

      {/* ADD EMPLOYEE */}
      {tab === 'invite' && (
        <div style={{ maxWidth: '480px' }}>
          <div style={v.card}>
            <div style={v.cardTitle}>Add new employee</div>

            {inviteMsg.text && (
              <div style={{
                padding: '10px 14px', borderRadius: '10px', marginBottom: '16px',
                fontSize: '13px', lineHeight: 1.5,
                background: inviteMsg.type === 'success' ? 'rgba(78,203,131,0.12)' : 'rgba(255,95,109,0.12)',
                border: `1px solid ${inviteMsg.type === 'success' ? 'rgba(78,203,131,0.3)' : 'rgba(255,95,109,0.3)'}`,
                color: inviteMsg.type === 'success' ? '#4ecb83' : '#ff5f6d',
              }}>
                {inviteMsg.text}
              </div>
            )}

            <form onSubmit={handleInvite} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: isDark ? '#5a5968' : '#aaa9a0', marginBottom: '6px' }}>Full name</label>
                <input type="text" value={inviteName} onChange={e => setInviteName(e.target.value)} placeholder="John Smith" style={v.input} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: isDark ? '#5a5968' : '#aaa9a0', marginBottom: '6px' }}>Email address</label>
                <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="john@company.com" style={v.input} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: isDark ? '#5a5968' : '#aaa9a0', marginBottom: '6px' }}>
                  Password <span style={{ textTransform: 'none', fontWeight: 400 }}>(min 6 characters)</span>
                </label>
                <input type="password" value={invitePwd} onChange={e => setInvitePwd(e.target.value)} placeholder="Minimum 6 characters" style={v.input} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: isDark ? '#5a5968' : '#aaa9a0', marginBottom: '6px' }}>Role</label>
                <select value={inviteRole} onChange={e => setInviteRole(e.target.value)} style={{ ...v.select, width: '100%' }}>
                  <option value="employee">Employee</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <button type="submit" style={v.submitBtn} disabled={inviteLoading}>
                {inviteLoading ? 'Adding…' : '+ Add Employee'}
              </button>
            </form>
          </div>

          <div style={{ ...v.card, fontSize: '13px', color: isDark ? '#5a5968' : '#aaa9a0', lineHeight: 1.7 }}>
            <div style={v.cardTitle}>How it works</div>
            Employee can log in immediately with the email and password you set here.
            Admin sees all tasks. Employees only see their own tasks.
            You can change anyone's role from the Employees tab at any time.
          </div>
        </div>
      )}
    </div>
  )
}
