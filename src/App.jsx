import React, { useState, useCallback, useRef } from 'react'
import { ThemeProvider } from './components/ThemeContext'
import { AuthProvider }  from './context/AuthContext'
import ProtectedRoute    from './components/ProtectedRoute'
import AdminRoute        from './components/AdminRoute'
import Sidebar           from './components/Sidebar'
import TaskModal         from './components/TaskModal'
import TaskViewModal     from './components/TaskViewModal'
import AmbientBackground from './components/AmbientBackground'
// import ConfettiCanvas from './components/ConfettiCanvas'
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
  const { theme }    = useTheme()
  const { isAdmin }  = useAuth()
  const isDark       = theme === 'dark'

  const [activePage,  setActivePage]  = useState('Dashboard')
  const [modalOpen,   setModalOpen]   = useState(false)
  const [viewingTask, setViewingTask] = useState(null)
  const confettiRef = useRef(null)

  const handleAddTask = useCallback((title, status, priority, due) => {
    addTask(title, status, priority, due)
    if (status === 'completed') confettiRef.current?.burst()
    setModalOpen(false)
  }, [addTask])

  const handleMoveTask = useCallback((id, newStatus) => {
    const prevTask = tasks.find(t => t.id === id)
    if (prevTask && prevTask.status !== 'completed' && newStatus === 'completed') {
      confettiRef.current?.burst()
    }
    moveTask(id, newStatus)
  }, [tasks, moveTask])

  const handleViewTask = useCallback((task) => {
    setViewingTask(task)
  }, [])

  // Page subtitles
  const subtitles = {
    Dashboard: 'Your workspace at a glance',
    Board:     'Drag and drop tasks between columns',
    Timeline:  'Track task progress over time',
    Reports:   'Analyse your productivity',
    Admin:     'Manage employees and all tasks',
  }

  // Loading spinner component
  const Spinner = () => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '16px' }}>
      <style>{`@keyframes tf-spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: `3px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`, borderTopColor: isDark ? '#e8a04a' : '#c8533a', animation: 'tf-spin 0.7s linear infinite' }} />
      <span style={{ fontSize: '14px', color: isDark ? '#5a5968' : '#aaa9a0', fontFamily: 'DM Sans, sans-serif' }}>Loading tasks…</span>
    </div>
  )

  // Error screen component
  const ErrorScreen = () => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '12px', textAlign: 'center', padding: '0 24px' }}>
      <div style={{ fontSize: '36px' }}>⚠️</div>
      <div style={{ fontSize: '16px', fontWeight: 600, color: '#ff5f6d', fontFamily: 'Syne, sans-serif' }}>Could not connect to database</div>
      <div style={{ fontSize: '13px', color: isDark ? '#5a5968' : '#aaa9a0', maxWidth: '320px', lineHeight: 1.6, fontFamily: 'DM Sans, sans-serif' }}>{error}</div>
      <button
        onClick={() => window.location.reload()}
        style={{ marginTop: '8px', padding: '9px 22px', borderRadius: '10px', background: isDark ? '#e8a04a' : '#c8533a', color: isDark ? '#1a1000' : '#fff', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, fontFamily: 'DM Sans, sans-serif' }}
      >
        Retry
      </button>
    </div>
  )

  const renderPage = () => {
    if (loading) return <Spinner />
    if (error)   return <ErrorScreen />

    switch (activePage) {
      case 'Dashboard': return <DashboardPage tasks={tasks} onNavigate={setActivePage} />
      case 'Timeline':  return <TimelinePage  tasks={tasks} />
      case 'Reports':   return <ReportsPage   tasks={tasks} />
      case 'Admin':
        return (
          <AdminRoute>
            <AdminPage />
          </AdminRoute>
        )
      case 'Board':
      default:
        return (
          <BoardPage
            tasks={tasks}
            onAdd={addTask}
            onDelete={deleteTask}
            onEdit={editTask}
            onMove={handleMoveTask}
            onComplete={() => confettiRef.current?.burst()}
            onView={handleViewTask}
          />
        )
    }
  }

  return (
    <div
      className="relative font-body"
      style={{ height: '100vh', overflow: 'hidden', background: isDark ? '#0e0e12' : '#f7f3ee', display: 'flex' }}
    >
      <AmbientBackground />
      {/* <ConfettiCanvas ref={confettiRef} /> */}

      {/* Sidebar */}
      <div style={{ position: 'relative', zIndex: 20, flexShrink: 0 }}>
        <Sidebar
          activePage={activePage}
          onNavigate={setActivePage}
          onNewTask={() => setModalOpen(true)}
        />
      </div>

      {/* Main content */}
      <main style={{ flex: 1, minWidth: 0, position: 'relative', zIndex: 10, overflowY: 'auto', height: '100vh', display: 'flex', flexDirection: 'column' }}>

        {/* Sticky top bar */}
        <div style={{
          padding: '18px 32px',
          borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: isDark ? 'rgba(14,14,18,0.85)' : 'rgba(247,243,238,0.88)',
          backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
          position: 'sticky', top: 0, zIndex: 15, flexShrink: 0,
        }}>
          <div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '18px', letterSpacing: '-0.02em', color: isDark ? '#f0eff5' : '#1a1814' }}>
              {activePage}
            </div>
            <div style={{ fontSize: '12px', color: isDark ? '#5a5968' : '#aaa9a0', marginTop: '2px' }}>
              {subtitles[activePage]}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Notification Bell */}
           <NotificationBell isDark={isDark} />
            {/* DB status dot */}
            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: isDark ? '#8b8a9b' : '#aaa9a0' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', border: `2px solid ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'}`, borderTopColor: isDark ? '#e8a04a' : '#c8533a', animation: 'tf-spin 0.7s linear infinite' }} />
                Syncing…
              </div>
            )}
            {error && !loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#ff5f6d' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff5f6d' }} />
                DB offline
              </div>
            )}
            {!loading && !error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: isDark ? '#4ecb83' : '#3a8c6e' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4ecb83' }} />
                Connected
              </div>
            )}

            {/* New Task button — Board page only */}
            {activePage === 'Board' && (
              <button
                onClick={() => setModalOpen(true)}
                style={{
                  padding: '8px 18px', borderRadius: '10px', border: 'none',
                  background: isDark ? '#e8a04a' : '#c8533a',
                  color: isDark ? '#1a1000' : '#ffffff',
                  fontWeight: 600, fontSize: '13px', cursor: 'pointer',
                  fontFamily: 'DM Sans, sans-serif',
                  boxShadow: isDark ? '0 4px 16px rgba(232,160,74,0.3)' : '0 4px 16px rgba(200,83,58,0.3)',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.opacity = '0.9' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)';    e.currentTarget.style.opacity = '1'   }}
              >
                + New Task
              </button>
            )}
          </div>
        </div>

        {/* Page content */}
        <div style={{ padding: '28px 32px 60px', flex: 1, overflowY: 'auto' }}>
          {renderPage()}
        </div>
      </main>

      {/* Modals */}
      <TaskModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleAddTask}
      />
      {viewingTask && (
        <TaskViewModal
          task={viewingTask}
          onClose={() => setViewingTask(null)}
        />
      )}
    </div>
  )
}

// Wrap order matters:
// ThemeProvider → AuthProvider → ProtectedRoute → AppInner
// ProtectedRoute shows LoginPage if not logged in
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
