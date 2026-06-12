import React from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from './ThemeContext'
import LoginPage from '../pages/LoginPage'

// Wrap any page/component with this to require login
// If user is not logged in → show LoginPage
// If still checking session → show loading spinner
// If logged in → show the protected content

export default function ProtectedRoute({ children }) {
  const { isLoggedIn, loading } = useAuth()
  const { theme }  = useTheme()
  const isDark     = theme === 'dark'

  // Still checking if there is a saved session
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: isDark ? '#0e0e12' : '#f7f3ee',
        gap: '16px',
        fontFamily: 'DM Sans, sans-serif',
      }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{
          width: '36px', height: '36px', borderRadius: '50%',
          border: `3px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
          borderTopColor: isDark ? '#e8a04a' : '#c8533a',
          animation: 'spin 0.7s linear infinite',
        }} />
        <span style={{ fontSize: '14px', color: isDark ? '#5a5968' : '#aaa9a0' }}>
          Loading…
        </span>
      </div>
    )
  }

  // Not logged in → show login page
  if (!isLoggedIn) {
    return <LoginPage />
  }

  // Logged in → show the real app
  return children
}
