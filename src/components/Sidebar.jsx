import React, { useState } from 'react'
import { useTheme } from './ThemeContext'
import { useAuth } from '../context/AuthContext'

const NAV = [
  {
    id: 'Dashboard',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
        <rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>
      </svg>
    ),
  },
  {
    id: 'Board',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="5" height="18" rx="1.5"/><rect x="10" y="3" width="5" height="12" rx="1.5"/><rect x="17" y="3" width="5" height="15" rx="1.5"/>
      </svg>
    ),
  },
  {
    id: 'Timeline',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
        <circle cx="7" cy="6" r="2.5" fill="currentColor" stroke="none"/>
        <circle cx="15" cy="12" r="2.5" fill="currentColor" stroke="none"/>
        <circle cx="10" cy="18" r="2.5" fill="currentColor" stroke="none"/>
      </svg>
    ),
  },
  {
    id: 'Reports',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 20V10M12 20V4M6 20v-6"/>
      </svg>
    ),
  },
]

const ADMIN_NAV = {
  id: 'Admin',
  icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
}

export default function Sidebar({ activePage, onNavigate, onNewTask }) {
  const { theme, toggleTheme } = useTheme()
  const { profile, isAdmin, logout } = useAuth()
  const isDark = theme === 'dark'
  const [collapsed, setCollapsed] = useState(false)
  const [logoutLoading, setLogoutLoading] = useState(false)

  const sidebarW = collapsed ? '64px' : '220px'
  const navItems = isAdmin ? [...NAV, ADMIN_NAV] : NAV
  const name     = profile?.full_name || profile?.email || 'User'
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const firstName = name.split(' ')[0]

  const handleLogout = async () => {
    setLogoutLoading(true)
    try { await logout() }
    catch (e) { console.error('logout error:', e.message) }
    finally { setLogoutLoading(false) }
  }

  const bg       = isDark ? '#111118' : '#ffffff'
  const border   = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)'
  const mutedCol = isDark ? '#8b8a9b' : '#6b6760'
  const textCol  = isDark ? '#f0eff5' : '#1a1814'

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .sidebar-full { display: none !important; }
          .sidebar-mobile { display: flex !important; }
        }
        @media (min-width: 769px) {
          .sidebar-mobile { display: none !important; }
        }
        .sidebar-full { display: flex; }
        .sidebar-mobile { display: none; }
        .nav-item-btn:hover { background: ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'} !important; }
        .bottom-btn:hover { background: ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'} !important; }
      `}</style>

      {/* ── DESKTOP SIDEBAR ── */}
      <aside
        className="sidebar-full"
        style={{
          width: sidebarW,
          minHeight: '100vh',
          background: bg,
          borderRight: `1px solid ${border}`,
          flexDirection: 'column',
          transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)',
          overflow: 'hidden',
          flexShrink: 0,
          position: 'sticky',
          top: 0,
          zIndex: 20,
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: collapsed ? '20px 0' : '20px 18px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            borderBottom: `1px solid ${border}`,
            cursor: 'pointer', transition: 'padding 0.25s',
          }}
          onClick={() => onNavigate('Dashboard')}
        >
          <div style={{
            width: '34px', height: '34px',
            background: isDark ? '#1a1a24' : '#f0ebe3',
            borderRadius: '10px', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)'}`,
          }}>
            <svg width="18" height="18" viewBox="0 0 22 22" fill="none">
              <rect x="1"  y="1"  width="9" height="9" rx="2" fill="#e8a04a"/>
              <rect x="12" y="1"  width="9" height="9" rx="2" fill="#e8a04a" opacity=".4"/>
              <rect x="1"  y="12" width="9" height="9" rx="2" fill="#e8a04a" opacity=".2"/>
              <rect x="12" y="12" width="9" height="9" rx="2" fill="#e8a04a" opacity=".7"/>
            </svg>
          </div>
          <span style={{
            fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '17px',
            color: textCol, letterSpacing: '-0.03em', whiteSpace: 'nowrap',
            opacity: collapsed ? 0 : 1, transition: 'opacity 0.15s',
            overflow: 'hidden', maxWidth: collapsed ? '0' : '120px',
          }}>
            Taskflow
          </span>
        </div>

        {/* Nav */}
        <div style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: '2px', overflowY: 'auto' }}>

          {/* New Task button */}
          <button
            onClick={onNewTask}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: collapsed ? '10px 0' : '10px 12px',
              justifyContent: collapsed ? 'center' : 'flex-start',
              margin: '0 0 6px',
              borderRadius: '10px', cursor: 'pointer',
              background: isDark ? '#e8a04a' : '#c8533a',
              color: isDark ? '#1a1000' : '#ffffff',
              border: 'none', transition: 'all 0.2s',
              fontFamily: 'DM Sans, sans-serif', fontWeight: 600, fontSize: '13px',
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.85' }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', opacity: collapsed ? 0 : 1, maxWidth: collapsed ? '0' : '100px', transition: 'opacity 0.15s, max-width 0.25s' }}>
              New Task
            </span>
          </button>

          {!collapsed && (
            <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: isDark ? '#5a5968' : '#aaa9a0', padding: '10px 10px 4px' }}>
              Menu
            </div>
          )}

          {navItems.map(item => {
            const isAdminItem = item.id === 'Admin'
            const active = activePage === item.id
            return (
              <div
                key={item.id}
                className="nav-item-btn"
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: collapsed ? '10px 0' : '10px 12px',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  borderRadius: '10px', cursor: 'pointer', transition: 'all 0.15s',
                  background: active
                    ? isAdminItem
                      ? isDark ? 'rgba(107,127,255,0.12)' : 'rgba(61,95,206,0.08)'
                      : isDark ? 'rgba(232,160,74,0.12)' : 'rgba(200,83,58,0.08)'
                    : 'transparent',
                  color: active
                    ? isAdminItem ? '#6b7fff' : isDark ? '#e8a04a' : '#c8533a'
                    : mutedCol,
                  borderLeft: active
                    ? `2.5px solid ${isAdminItem ? '#6b7fff' : isDark ? '#e8a04a' : '#c8533a'}`
                    : '2.5px solid transparent',
                  marginLeft: collapsed ? '0' : '-2px',
                }}
                onClick={() => onNavigate(item.id)}
              >
                <span style={{ flexShrink: 0, display: 'flex' }}>{item.icon}</span>
                <span style={{ fontSize: '13.5px', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', opacity: collapsed ? 0 : 1, maxWidth: collapsed ? '0' : '140px', transition: 'opacity 0.15s, max-width 0.25s' }}>
                  {item.id}
                </span>
              </div>
            )
          })}
        </div>

        {/* Bottom section */}
        <div style={{ padding: '8px 8px', borderTop: `1px solid ${border}`, display: 'flex', flexDirection: 'column', gap: '2px' }}>

          {/* Theme toggle */}
          <button
            className="bottom-btn"
            style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: collapsed ? '10px 0' : '10px 12px', justifyContent: collapsed ? 'center' : 'flex-start', borderRadius: '10px', cursor: 'pointer', background: 'transparent', border: 'none', color: mutedCol, transition: 'all 0.15s', width: '100%', fontFamily: 'DM Sans, sans-serif' }}
            onClick={toggleTheme}
          >
            <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
              {isDark ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              )}
            </span>
            <span style={{ fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', opacity: collapsed ? 0 : 1, maxWidth: collapsed ? '0' : '120px', transition: 'opacity 0.15s, max-width 0.25s' }}>
              {isDark ? 'Light mode' : 'Dark mode'}
            </span>
          </button>

          {/* Logout */}
          <button
            className="bottom-btn"
            style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: collapsed ? '10px 0' : '10px 12px', justifyContent: collapsed ? 'center' : 'flex-start', borderRadius: '10px', cursor: 'pointer', background: 'transparent', border: 'none', color: '#ff5f6d', transition: 'all 0.15s', width: '100%', fontFamily: 'DM Sans, sans-serif' }}
            onClick={handleLogout}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,95,109,0.08)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
          >
            <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </span>
            <span style={{ fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', opacity: collapsed ? 0 : 1, maxWidth: collapsed ? '0' : '120px', transition: 'opacity 0.15s, max-width 0.25s', color: '#ff5f6d' }}>
              {logoutLoading ? 'Logging out…' : 'Log out'}
            </span>
          </button>

          {/* ── User row with collapse button ── */}
          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'space-between',
            padding: collapsed ? '10px 0' : '10px 12px',
            borderRadius: '10px',
            marginTop: '2px',
            background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
            border: `1px solid ${border}`,
          }}>

            {/* Avatar + name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
              <div style={{
                width: '30px', height: '30px', borderRadius: '50%', flexShrink: 0,
                background: 'linear-gradient(135deg, #6b7fff, #e8a04a)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '11px', fontWeight: 700, color: '#fff',
              }}>
                {initials}
              </div>

              {/* Name + role — hidden when collapsed */}
              {!collapsed && (
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: textCol, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100px' }}>
                    {firstName}
                  </div>
                  <div style={{
                    display: 'inline-block', fontSize: '9px', fontWeight: 600,
                    padding: '1px 6px', borderRadius: '20px', marginTop: '2px',
                    background: isAdmin ? 'rgba(107,127,255,0.15)' : 'rgba(78,203,131,0.15)',
                    color: isAdmin ? '#6b7fff' : '#4ecb83',
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                  }}>
                    {isAdmin ? 'Admin' : 'Employee'}
                  </div>
                </div>
              )}
            </div>

            {/* Collapse button */}
            <button
              onClick={() => setCollapsed(p => !p)}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              style={{
                width: '26px', height: '26px', borderRadius: '8px', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'transparent',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.09)'}`,
                color: mutedCol, cursor: 'pointer', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'; e.currentTarget.style.color = textCol }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = mutedCol }}
            >
              <svg
                width="13" height="13" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                style={{ transform: collapsed ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.25s' }}
              >
                <path d="M11 17l-5-5 5-5M18 17l-5-5 5-5"/>
              </svg>
            </button>
          </div>

        </div>
      </aside>

      {/* ── MOBILE SIDEBAR — icons only ── */}
      <aside
        className="sidebar-mobile"
        style={{
          width: '64px', minHeight: '100vh',
          background: bg,
          borderRight: `1px solid ${border}`,
          flexDirection: 'column',
          flexShrink: 0, position: 'sticky', top: 0, zIndex: 20,
          overflow: 'hidden',
        }}
      >
        {/* Logo icon */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0', borderBottom: `1px solid ${border}` }} onClick={() => onNavigate('Dashboard')}>
          <div style={{ width: '32px', height: '32px', background: isDark ? '#1a1a24' : '#f0ebe3', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)'}`, cursor: 'pointer' }}>
            <svg width="16" height="16" viewBox="0 0 22 22" fill="none">
              <rect x="1"  y="1"  width="9" height="9" rx="2" fill="#e8a04a"/>
              <rect x="12" y="1"  width="9" height="9" rx="2" fill="#e8a04a" opacity=".4"/>
              <rect x="1"  y="12" width="9" height="9" rx="2" fill="#e8a04a" opacity=".2"/>
              <rect x="12" y="12" width="9" height="9" rx="2" fill="#e8a04a" opacity=".7"/>
            </svg>
          </div>
        </div>

        {/* Nav icons */}
        <div style={{ flex: 1, padding: '10px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <button onClick={onNewTask} style={{ width: '40px', height: '40px', borderRadius: '10px', border: 'none', background: isDark ? '#e8a04a' : '#c8533a', color: isDark ? '#1a1000' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginBottom: '6px' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>
          </button>

          {navItems.map(item => {
            const isAdminItem = item.id === 'Admin'
            const active = activePage === item.id
            return (
              <div
                key={item.id}
                onClick={() => onNavigate(item.id)}
                title={item.id}
                style={{
                  width: '40px', height: '40px', borderRadius: '10px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', transition: 'all 0.15s',
                  background: active
                    ? isAdminItem ? 'rgba(107,127,255,0.12)' : isDark ? 'rgba(232,160,74,0.12)' : 'rgba(200,83,58,0.08)'
                    : 'transparent',
                  color: active
                    ? isAdminItem ? '#6b7fff' : isDark ? '#e8a04a' : '#c8533a'
                    : mutedCol,
                }}
              >
                {item.icon}
              </div>
            )
          })}
        </div>

        {/* Bottom icons */}
        <div style={{ padding: '8px 0', borderTop: `1px solid ${border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <button onClick={toggleTheme} style={{ width: '40px', height: '40px', borderRadius: '10px', border: 'none', background: 'transparent', color: mutedCol, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            {isDark ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            )}
          </button>

          <button onClick={handleLogout} style={{ width: '40px', height: '40px', borderRadius: '10px', border: 'none', background: 'transparent', color: '#ff5f6d', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>

          {/* Avatar */}
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg,#6b7fff,#e8a04a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: '#fff', margin: '4px 0' }}>
            {initials}
          </div>
        </div>
      </aside>
    </>
  )
}
