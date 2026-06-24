import React, { useState, useCallback, useRef } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { ThemeProvider } from './components/ThemeContext'
import { AuthProvider }  from './context/AuthContext'
import ProtectedRoute    from './components/ProtectedRoute'
import AdminRoute        from './components/AdminRoute'
import Sidebar           from './components/Sidebar'
import TaskModal         from './components/TaskModal'
import TaskViewModal     from './components/TaskViewModal'
import AmbientBackground from './components/AmbientBackground'
import DashboardPage     from './pages/DashboardPage'
import BoardPage         from './pages/BoardPage'
import TimelinePage      from './pages/TimelinePage'
import ReportsPage       from './pages/ReportsPage'
import AdminPage         from './pages/AdminPage'
import { useTasks }      from './hooks/useTasks'
import { useTheme }      from './components/ThemeContext'
import { useAuth }       from './context/AuthContext'
import NotificationBell  from './components/NotificationBell'

function AppInner() {
  const { tasks, addTask, deleteTask, editTask, moveTask, loading, error } = useTasks()
  const { theme }            = useTheme()
  const { isAdmin, profile } = useAuth()
  const isDark               = theme === 'dark'

 const navigate   = useNavigate()
const location   = useLocation()

const pathToPage = {
  '/':          'Dashboard',
  '/board':     'Board',
  '/timeline':  'Timeline',
  '/reports':   'Reports',
  '/admin':     'Admin',
  '/login':     'Login',
}
const pageToPath = {
  'Dashboard': '/',
  'Board':     '/board',
  'Timeline':  '/timeline',
  'Reports':   '/reports',
  'Admin':     '/admin',
}

const activePage  = pathToPage[location.pathname] || 'Dashboard'
const setActivePage = (page) => navigate(pageToPath[page] || '/')
// Update browser tab title
React.useEffect(() => {
  const titles = {
    Dashboard: 'Dashboard — TaskFlow',
    Board:     'Board — TaskFlow',
    Timeline:  'Timeline — TaskFlow',
    Reports:   'Reports — TaskFlow',
    Admin:     'Admin — TaskFlow',
      Login:    'Login — TaskFlow',
  }
  document.title = titles[activePage] || 'TaskFlow'
}, [activePage])
  const [modalOpen,   setModalOpen]   = useState(false)
  const [viewingTask, setViewingTask] = useState(null)
  const confettiRef = useRef(null)

  const handleAddTask = useCallback((title, status, priority, due) => {
    addTask(title, status, priority, due)
    setModalOpen(false)
  }, [addTask])

  const handleMoveTask = useCallback((id, newStatus) => {
    moveTask(id, newStatus)
  }, [moveTask])

  const handleViewTask = useCallback((task) => {
    setViewingTask(task)
  }, [])

  const subtitles = {
    Dashboard: 'Your workspace at a glance',
    Board:     'Drag and drop tasks',
    Timeline:  'Track task progress',
    Reports:   'Analyse productivity',
    Admin:     'Manage employees & tasks',
  }

  const Spinner = () => (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'60vh', gap:'16px' }}>
      <style>{`@keyframes tf-spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ width:'36px', height:'36px', borderRadius:'50%', border:`3px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`, borderTopColor: isDark ? '#e8a04a' : '#c8533a', animation:'tf-spin 0.7s linear infinite' }} />
      <span style={{ fontSize:'14px', color: isDark ? '#5a5968' : '#aaa9a0', fontFamily:'DM Sans, sans-serif' }}>Loading tasks…</span>
    </div>
  )

  const ErrorScreen = () => (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'60vh', gap:'12px', textAlign:'center', padding:'0 24px' }}>
      <div style={{ fontSize:'36px' }}>⚠️</div>
      <div style={{ fontSize:'16px', fontWeight:600, color:'#ff5f6d', fontFamily:'Syne, sans-serif' }}>Could not connect to database</div>
      <div style={{ fontSize:'13px', color: isDark ? '#5a5968' : '#aaa9a0', maxWidth:'320px', lineHeight:1.6, fontFamily:'DM Sans, sans-serif' }}>{error}</div>
      <button onClick={() => window.location.reload()} style={{ marginTop:'8px', padding:'9px 22px', borderRadius:'10px', background: isDark ? '#e8a04a' : '#c8533a', color: isDark ? '#1a1000' : '#fff', border:'none', cursor:'pointer', fontSize:'13px', fontWeight:600, fontFamily:'DM Sans, sans-serif' }}>Retry</button>
    </div>
  )

const renderPage = () => {
  if (loading) return <Spinner />
  if (error)   return <ErrorScreen />
  return (
    <Routes>
      <Route path="/"         element={<DashboardPage tasks={tasks} profile={profile} onNavigate={setActivePage} />} />
      <Route path="/board"    element={<BoardPage tasks={tasks} onAdd={addTask} onDelete={deleteTask} onEdit={editTask} onMove={handleMoveTask} onComplete={() => {}} onView={handleViewTask} />} />
      <Route path="/timeline" element={<TimelinePage tasks={tasks} />} />
      <Route path="/reports"  element={<ReportsPage  tasks={tasks} />} />
      <Route path="/admin"    element={<AdminRoute><AdminPage /></AdminRoute>} />
      <Route path="*"         element={<DashboardPage tasks={tasks} profile={profile} onNavigate={setActivePage} />} />
    </Routes>
  )
}

  return (
    <div
      className="relative font-body"
      style={{ height: '100svh', overflow:'hidden', background: isDark ? '#0e0e12' : '#f7f3ee', display:'flex' }}
    >
      <style>{`
        @keyframes tf-spin { to { transform: rotate(360deg); } }

        /* ── Topbar ── */
        .app-topbar {
          padding: 16px 28px;
          border-bottom: 1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)'};
          display: flex; align-items: center; justify-content: space-between;
          background: ${isDark ? 'rgba(14,14,18,0.90)' : 'rgba(247,243,238,0.92)'};
          backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
          position: sticky; top: 0; z-index: 15; flex-shrink: 0;
          gap: 12px;
        }
        .app-topbar-title {
          font-family: 'Syne', sans-serif; font-weight: 800;
          font-size: 18px; letter-spacing: -0.02em;
          color: ${isDark ? '#f0eff5' : '#1a1814'};
          white-space: nowrap;
        }
        .app-topbar-sub {
          font-size: 12px; color: ${isDark ? '#5a5968' : '#aaa9a0'}; margin-top: 2px;
        }
        .app-topbar-right {
          display: flex; align-items: center; gap: 10px; flex-shrink: 0;
        }
        .app-status-text { font-size: 12px; white-space: nowrap; }
        .app-new-task-btn {
          padding: 8px 16px; border-radius: 10px; border: none;
          background: ${isDark ? '#e8a04a' : '#c8533a'};
          color: ${isDark ? '#1a1000' : '#ffffff'};
          font-weight: 600; font-size: 13px; cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          box-shadow: ${isDark ? '0 4px 16px rgba(232,160,74,0.3)' : '0 4px 16px rgba(200,83,58,0.3)'};
          transition: all 0.15s; white-space: nowrap;
        }

        /* ── Page content ── */
        .app-page-content {
          padding: 28px 28px 60px;
          flex: 1; overflow-y: auto;
        }

        /* ── Mobile overrides ── */
        @media (max-width: 768px) {
          .app-topbar { padding: 12px 14px; }
          .app-topbar-title { font-size: 15px; }
          .app-topbar-sub { display: none; }
          .app-status-text { display: none; }
          .app-status-dot-only { display: flex !important; }
          .app-new-task-btn { padding: 7px 12px; font-size: 12px; }
          .app-page-content { padding: 14px 12px 80px; }
        }
        @media (max-width: 480px) {
          .app-topbar { padding: 10px 12px; }
          .app-topbar-title { font-size: 14px; }
          .app-page-content { padding: 12px 10px 80px; }
        }
      `}</style>

      <AmbientBackground />

      {/* Sidebar */}
      <div style={{ position:'relative', zIndex:20, flexShrink:0 }}>
        <Sidebar activePage={activePage} onNavigate={setActivePage} onNewTask={() => setModalOpen(true)} />
      </div>

      {/* Main content */}
      <main style={{ flex:1, minWidth:0, position:'relative', zIndex:10, overflowY:'auto', height:'100svh', display:'flex', flexDirection:'column' }}>

        {/* Topbar */}
        <div className="app-topbar">
          {/* Left — page title */}
          <div style={{ minWidth:0 }}>
            <div className="app-topbar-title">{activePage}</div>
            <div className="app-topbar-sub">{subtitles[activePage]}</div>
          </div>

          {/* Right — bell + status + button */}
          <div className="app-topbar-right">
            <NotificationBell isDark={isDark} />

            {/* Loading */}
            {loading && (
              <div style={{ display:'flex', alignItems:'center', gap:'6px', color: isDark ? '#8b8a9b' : '#aaa9a0' }}>
                <div style={{ width:'8px', height:'8px', borderRadius:'50%', border:`2px solid ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'}`, borderTopColor: isDark ? '#e8a04a' : '#c8533a', animation:'tf-spin 0.7s linear infinite', flexShrink:0 }} />
                <span className="app-status-text">Syncing…</span>
              </div>
            )}

            {/* Error */}
            {error && !loading && (
              <div style={{ display:'flex', alignItems:'center', gap:'6px', color:'#ff5f6d' }}>
                <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:'#ff5f6d', flexShrink:0 }} />
                <span className="app-status-text">DB offline</span>
              </div>
            )}

            {/* Connected */}
            {!loading && !error && (
              <div style={{ display:'flex', alignItems:'center', gap:'6px', color: isDark ? '#4ecb83' : '#3a8c6e' }}>
                <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:'#4ecb83', flexShrink:0 }} />
                <span className="app-status-text">Connected</span>
              </div>
            )}

            {/* New Task — Board only */}
            {activePage === 'Board' && (
              <button
                className="app-new-task-btn"
                onClick={() => setModalOpen(true)}
                onMouseEnter={e => { e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.opacity='0.9' }}
                onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)';    e.currentTarget.style.opacity='1' }}
              >
                + New Task
              </button>
            )}
          </div>
        </div>

        {/* Page content */}
        <div className="app-page-content">
          {renderPage()}
        </div>
      </main>

      <TaskModal open={modalOpen} onClose={() => setModalOpen(false)} onSubmit={handleAddTask} />
      {viewingTask && <TaskViewModal task={viewingTask} onClose={() => setViewingTask(null)} />}
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ProtectedRoute>
          <AppInner />
        </ProtectedRoute>
      </AuthProvider>
    </ThemeProvider>
  )
}
