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
  const isDark    = theme === 'dark'
  const [collapsed, setCollapsed] = useState(false)
  const [logoutLoading, setLogoutLoading] = useState(false)

  const sidebarW = collapsed ? '68px' : '220px'

  // Build nav items — admin gets extra Admin item
  const navItems = isAdmin ? [...NAV, ADMIN_NAV] : NAV

  // Get initials for avatar
  const name     = profile?.full_name || profile?.email || 'User'
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  const handleLogout = async () => {
    setLogoutLoading(true)
    try { await logout() }
    catch (e) { console.error('logout error:', e.message) }
    finally { setLogoutLoading(false) }
  }

  const css = {
    sidebar: {
      width: sidebarW,
      minHeight: '100vh',
      background: isDark ? '#111118' : '#ffffff',
      borderRight: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)'}`,
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)',
      overflow: 'hidden',
      flexShrink: 0,
      position: 'sticky',
      top: 0,
      zIndex: 20,
    },
    logo: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: collapsed ? '20px 0' : '20px 18px',
      justifyContent: collapsed ? 'center' : 'flex-start',
      borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'}`,
      cursor: 'pointer',
      transition: 'padding 0.25s',
    },
    logoMark: {
      width: '34px', height: '34px',
      background: isDark ? '#1a1a24' : '#f0ebe3',
      borderRadius: '10px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
      border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)'}`,
    },
    logoText: {
      fontFamily: 'Syne, sans-serif',
      fontWeight: 800, fontSize: '17px',
      color: isDark ? '#f0eff5' : '#1a1814',
      letterSpacing: '-0.03em',
      whiteSpace: 'nowrap',
      opacity: collapsed ? 0 : 1,
      transition: 'opacity 0.15s',
      overflow: 'hidden',
      maxWidth: collapsed ? '0' : '120px',
    },
    section: {
      flex: 1,
      padding: '12px 8px',
      display: 'flex',
      flexDirection: 'column',
      gap: '2px',
      overflowY: 'auto',
    },
    sectionLabel: {
      fontSize: '10px', fontWeight: 600, letterSpacing: '0.1em',
      textTransform: 'uppercase',
      color: isDark ? '#5a5968' : '#aaa9a0',
      padding: collapsed ? '10px 0 4px' : '10px 10px 4px',
      textAlign: collapsed ? 'center' : 'left',
      transition: 'all 0.2s',
      overflow: 'hidden',
    },
    navItem: (active, isAdminItem) => ({
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: collapsed ? '10px 0' : '10px 12px',
      justifyContent: collapsed ? 'center' : 'flex-start',
      borderRadius: '10px',
      cursor: 'pointer',
      transition: 'all 0.15s',
      background: active
        ? isAdminItem
          ? isDark ? 'rgba(107,127,255,0.12)' : 'rgba(61,95,206,0.08)'
          : isDark ? 'rgba(232,160,74,0.12)' : 'rgba(200,83,58,0.08)'
        : 'transparent',
      color: active
        ? isAdminItem ? '#6b7fff' : isDark ? '#e8a04a' : '#c8533a'
        : isDark ? '#8b8a9b' : '#6b6760',
      borderLeft: active
        ? `2.5px solid ${isAdminItem ? '#6b7fff' : isDark ? '#e8a04a' : '#c8533a'}`
        : '2.5px solid transparent',
      marginLeft: collapsed ? '0' : '-2px',
    }),
    navLabel: {
      fontSize: '13.5px', fontWeight: 500,
      whiteSpace: 'nowrap', overflow: 'hidden',
      opacity: collapsed ? 0 : 1,
      maxWidth: collapsed ? '0' : '140px',
      transition: 'opacity 0.15s, max-width 0.25s',
    },
    addBtn: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: collapsed ? '10px 0' : '10px 12px',
      justifyContent: collapsed ? 'center' : 'flex-start',
      margin: '8px 8px',
      borderRadius: '10px',
      cursor: 'pointer',
      background: isDark ? '#e8a04a' : '#c8533a',
      color: isDark ? '#1a1000' : '#ffffff',
      border: 'none',
      transition: 'all 0.2s',
      fontFamily: 'DM Sans, sans-serif',
      fontWeight: 600, fontSize: '13px',
    },
    bottom: {
      padding: '8px 8px',
      borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'}`,
      display: 'flex', flexDirection: 'column', gap: '2px',
    },
    bottomBtn: {
      display: 'flex', alignItems: 'center', gap: '10px',
      padding: collapsed ? '10px 0' : '10px 12px',
      justifyContent: collapsed ? 'center' : 'flex-start',
      borderRadius: '10px', cursor: 'pointer',
      background: 'transparent', border: 'none',
      color: isDark ? '#8b8a9b' : '#6b6760',
      transition: 'all 0.15s', width: '100%',
      fontFamily: 'DM Sans, sans-serif',
    },
    bottomLabel: {
      fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden',
      opacity: collapsed ? 0 : 1,
      maxWidth: collapsed ? '0' : '120px',
      transition: 'opacity 0.15s, max-width 0.25s',
    },
    avatar: {
      display: 'flex', alignItems: 'center', gap: '10px',
      padding: collapsed ? '10px 0' : '10px 12px',
      justifyContent: collapsed ? 'center' : 'flex-start',
      borderRadius: '10px', cursor: 'default',
    },
    avatarCircle: {
      width: '32px', height: '32px', borderRadius: '50%',
      background: 'linear-gradient(135deg, #6b7fff, #e8a04a)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '11px', fontWeight: 700, color: '#fff', flexShrink: 0,
    },
    avatarInfo: {
      overflow: 'hidden',
      opacity: collapsed ? 0 : 1,
      maxWidth: collapsed ? '0' : '120px',
      transition: 'opacity 0.15s, max-width 0.25s',
    },
    avatarName: {
      fontSize: '12px', fontWeight: 600,
      color: isDark ? '#f0eff5' : '#1a1814',
      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
    },
    roleBadge: {
      display: 'inline-block',
      fontSize: '9px', fontWeight: 600, letterSpacing: '0.05em',
      padding: '1px 6px', borderRadius: '20px',
      background: isAdmin ? 'rgba(107,127,255,0.15)' : 'rgba(78,203,131,0.15)',
      color: isAdmin ? '#6b7fff' : '#4ecb83',
      textTransform: 'uppercase', marginTop: '2px',
    },
    collapseBtn: {
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '8px', borderRadius: '10px', cursor: 'pointer',
      background: 'transparent',
      border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)'}`,
      color: isDark ? '#8b8a9b' : '#6b6760',
      transition: 'all 0.15s', margin: '0 auto 4px',
    },
  }

  return (
    <aside style={css.sidebar}>

      {/* Logo */}
      <div style={css.logo} onClick={() => onNavigate('Dashboard')}>
        <div style={css.logoMark}>
          <svg width="18" height="18" viewBox="0 0 22 22" fill="none">
            <rect x="1"  y="1"  width="9" height="9" rx="2" fill="#e8a04a"/>
            <rect x="12" y="1"  width="9" height="9" rx="2" fill="#e8a04a" opacity=".4"/>
            <rect x="1"  y="12" width="9" height="9" rx="2" fill="#e8a04a" opacity=".2"/>
            <rect x="12" y="12" width="9" height="9" rx="2" fill="#e8a04a" opacity=".7"/>
          </svg>
        </div>
        <span style={css.logoText}>Taskflow</span>
      </div>

      {/* Nav section */}
      <div style={css.section}>

        {/* New Task button */}
        <button
          style={css.addBtn}
          onClick={onNewTask}
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

        <div style={{ height: '6px' }} />
        {!collapsed && <div style={css.sectionLabel}>Menu</div>}

        {navItems.map(item => {
          const isAdminItem = item.id === 'Admin'
          return (
            <div
              key={item.id}
              style={css.navItem(activePage === item.id, isAdminItem)}
              onClick={() => onNavigate(item.id)}
              onMouseEnter={e => {
                if (activePage !== item.id)
                  e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'
              }}
              onMouseLeave={e => {
                if (activePage !== item.id)
                  e.currentTarget.style.background = 'transparent'
              }}
            >
              <span style={{ flexShrink: 0, display: 'flex' }}>{item.icon}</span>
              <span style={css.navLabel}>{item.id}</span>
            </div>
          )
        })}
      </div>

      {/* Bottom section */}
      <div style={css.bottom}>

        {/* Theme toggle */}
        <button
          style={css.bottomBtn}
          onClick={toggleTheme}
          onMouseEnter={e => { e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
        >
          <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
            {isDark ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <circle cx="12" cy="12" r="5"/>
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )}
          </span>
          <span style={css.bottomLabel}>{isDark ? 'Light mode' : 'Dark mode'}</span>
        </button>

        {/* Logout */}
        <button
          style={{ ...css.bottomBtn, color: '#ff5f6d' }}
          onClick={handleLogout}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,95,109,0.08)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
        >
          <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </span>
          <span style={{ ...css.bottomLabel, color: '#ff5f6d' }}>
            {logoutLoading ? 'Logging out…' : 'Log out'}
          </span>
        </button>

        {/* Collapse toggle */}
        <div
          style={css.collapseBtn}
          onClick={() => setCollapsed(p => !p)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg
            width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ transform: collapsed ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.25s' }}
          >
            <path d="M11 17l-5-5 5-5M18 17l-5-5 5-5"/>
          </svg>
        </div>

        {/* User avatar */}
        <div style={css.avatar}>
          <div style={css.avatarCircle}>{initials}</div>
          <div style={css.avatarInfo}>
            <div style={css.avatarName}>{name}</div>
            <div style={css.roleBadge}>{isAdmin ? 'Admin' : 'Employee'}</div>
          </div>
        </div>

      </div>
    </aside>
  )
}
