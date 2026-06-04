import React, { useState, useCallback, useRef } from 'react'
import { ThemeProvider } from './components/ThemeContext'
import Sidebar from './components/Sidebar'
import TaskModal from './components/TaskModal'
import TaskViewModal from './components/TaskViewModal'
import AmbientBackground from './components/AmbientBackground'
// import ConfettiCanvas from './components/ConfettiCanvas'
import DashboardPage from './pages/DashboardPage'
import BoardPage from './pages/BoardPage'
import TimelinePage from './pages/TimelinePage'
import ReportsPage from './pages/ReportsPage'
import { useTasks } from './hooks/useTasks'
import { useTheme } from './components/ThemeContext'

function AppInner() {
  const { tasks, addTask, deleteTask, editTask, moveTask, loading, error } = useTasks()
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [activePage,  setActivePage]  = useState('Dashboard')  // ← starts on Dashboard
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

  const renderPage = () => {
    switch (activePage) {
      case 'Dashboard':
        return <DashboardPage tasks={tasks} onNavigate={setActivePage} />
      case 'Timeline':
        return <TimelinePage tasks={tasks} />
      case 'Reports':
        return <ReportsPage tasks={tasks} />
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
      className="relative overflow-x-hidden font-body"
      style={{
        minHeight: '100vh',
        overflow: 'hidden',
        background: isDark ? '#0e0e12' : '#f7f3ee',
        display: 'flex',
      }}
    >
      <AmbientBackground />
      {/* <ConfettiCanvas ref={confettiRef} /> */}

      {/* ── SIDEBAR ── */}
      <div style={{ position: 'relative', zIndex: 20, flexShrink: 0 }}>
        <Sidebar
          activePage={activePage}
          onNavigate={setActivePage}
          onNewTask={() => setModalOpen(true)}
        />
      </div>

      {/* ── MAIN CONTENT ── */}
      <main
        style={{
          flex: 1,
          minWidth: 0,
          position: 'relative',
          zIndex: 10,
          overflowY: 'auto',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* page title bar */}
        <div style={{
          padding: '18px 32px',
          borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: isDark ? 'rgba(14,14,18,0.8)' : 'rgba(247,243,238,0.85)',
          backdropFilter: 'blur(16px)',
          position: 'sticky',
          top: 0,
          zIndex: 15,
        }}>
          <div>
            <div style={{
              fontFamily: 'Syne, sans-serif',
              fontWeight: 800,
              fontSize: '18px',
              letterSpacing: '-0.02em',
              color: isDark ? '#f0eff5' : '#1a1814',
            }}>
              {activePage}
            </div>
            <div style={{ fontSize: '12px', color: isDark ? '#5a5968' : '#aaa9a0', marginTop: '1px' }}>
              {activePage === 'Dashboard' && 'Your workspace at a glance'}
              {activePage === 'Board'     && 'Drag and drop tasks between columns'}
              {activePage === 'Timeline'  && 'Track task progress over time'}
              {activePage === 'Reports'   && 'Analyse your productivity'}
            </div>
          </div>

          {/* new task button in topbar only for Board */}
          {activePage === 'Board' && (
            <button
              onClick={() => setModalOpen(true)}
              style={{
                padding: '8px 18px',
                borderRadius: '10px',
                background: isDark ? '#e8a04a' : '#c8533a',
                color: isDark ? '#1a1000' : '#ffffff',
                fontWeight: 600,
                fontSize: '13px',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'DM Sans, sans-serif',
                boxShadow: isDark ? '0 4px 16px rgba(232,160,74,0.3)' : '0 4px 16px rgba(200,83,58,0.3)',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.opacity = '0.9' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.opacity = '1' }}
            >
              + New Task
            </button>
          )}
        </div>

        {/* Page content */}
<div style={{ padding: '28px 32px 60px', flex: 1, overflowY: 'auto' }}>
  {loading ? (
    // Loading state
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      height: '60vh', gap: '16px',
    }}>
      <div style={{
        width: '36px', height: '36px', borderRadius: '50%',
        border: `3px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
        borderTopColor: isDark ? '#e8a04a' : '#c8533a',
        animation: 'spin 0.7s linear infinite',
      }} />
      <span style={{ fontSize: '14px', color: isDark ? '#5a5968' : '#aaa9a0' }}>
        Loading tasks…
      </span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  ) : error ? (
    // Error state
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      height: '60vh', gap: '12px', textAlign: 'center',
    }}>
      <div style={{ fontSize: '32px' }}>⚠️</div>
      <div style={{ fontSize: '16px', fontWeight: 600, color: '#ff5f6d' }}>
        Could not connect to database
      </div>
      <div style={{ fontSize: '13px', color: isDark ? '#5a5968' : '#aaa9a0', maxWidth: '320px' }}>
        {error}
      </div>
      <button
        onClick={() => window.location.reload()}
        style={{
          marginTop: '8px', padding: '8px 20px', borderRadius: '8px',
          background: isDark ? '#e8a04a' : '#c8533a',
          color: isDark ? '#1a1000' : '#fff',
          border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
        }}
      >
        Retry
      </button>
    </div>
  ) : (
    renderPage()
  )}
</div>

      </main>

      {/* ── MODALS ── */}
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

export default function App() {
  return (
    <ThemeProvider>
      <AppInner />
    </ThemeProvider>
  )
}
