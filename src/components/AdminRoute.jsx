import React from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from './ThemeContext'

// Wrap any page/component with this to require admin role
// If user is not admin → show access denied screen
// Usage: <AdminRoute><AdminPage /></AdminRoute>

export default function AdminRoute({ children }) {
  const { isAdmin, isLoggedIn } = useAuth()
  const { theme }  = useTheme()
  const isDark     = theme === 'dark'

  if (!isLoggedIn || !isAdmin) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '60vh',
        gap: '14px',
        textAlign: 'center',
        padding: '0 24px',
        fontFamily: 'DM Sans, sans-serif',
      }}>
        <div style={{ fontSize: '42px' }}>🔒</div>
        <div style={{
          fontFamily: 'Montserrat, sans-serif',
          fontWeight: 800, fontSize: '20px',
          color: isDark ? '#f0eff5' : '#1a1814',
        }}>
          Admin access only
        </div>
        <div style={{
          fontSize: '13px',
          color: isDark ? '#5a5968' : '#aaa9a0',
          maxWidth: '300px',
          lineHeight: 1.6,
        }}>
          You do not have permission to view this page.
          Please contact your administrator.
        </div>
      </div>
    )
  }

  return children
}
