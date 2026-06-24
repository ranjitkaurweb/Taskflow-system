import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../components/ThemeContext'

export default function LoginPage() {
  const { login }  = useAuth()
  const { theme }  = useTheme()
  const isDark     = theme === 'dark'

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [showPass, setShowPass] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!email.trim() || !password) {
      setError('Please enter your email and password.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await login(email, password)
      // AuthContext listener will update user state automatically
    } catch (err) {
      setError(
        err.message === 'Invalid login credentials'
          ? 'Wrong email or password. Please try again.'
          : err.message
      )
    } finally {
      setLoading(false)
    }
  }
  
  React.useEffect(() => {
  document.title = 'Login — TaskFlow'
}, [])

  const c = {
    page: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: isDark ? '#0e0e12' : '#f7f3ee',
      padding: '24px',
      fontFamily: 'DM Sans, sans-serif',
    },
    card: {
      background: isDark ? '#16161d' : '#ffffff',
      border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.09)'}`,
      borderRadius: '22px',
      padding: '40px 36px',
      width: '100%',
      maxWidth: '420px',
      boxShadow: isDark
        ? '0 24px 60px rgba(0,0,0,0.5)'
        : '0 24px 60px rgba(0,0,0,0.10)',
    },
    logo: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      marginBottom: '32px',
      justifyContent: 'center',
    },
    logoMark: {
      width: '38px', height: '38px',
      background: isDark ? '#1e1e28' : '#f0ebe3',
      borderRadius: '10px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)'}`,
    },
    logoText: {
      fontFamily: 'Syne, sans-serif',
      fontWeight: 800, fontSize: '20px',
      color: isDark ? '#f0eff5' : '#1a1814',
      letterSpacing: '-0.03em',
    },
    heading: {
      fontFamily: 'Syne, sans-serif',
      fontWeight: 800, fontSize: '22px',
      color: isDark ? '#f0eff5' : '#1a1814',
      letterSpacing: '-0.02em',
      marginBottom: '6px',
      textAlign: 'center',
    },
    sub: {
      fontSize: '13px',
      color: isDark ? '#5a5968' : '#aaa9a0',
      textAlign: 'center',
      marginBottom: '28px',
    },
    label: {
      display: 'block',
      fontSize: '11px',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.07em',
      color: isDark ? '#5a5968' : '#a09c96',
      marginBottom: '7px',
    },
    input: {
      width: '100%',
      padding: '11px 14px',
      borderRadius: '10px',
      border: `1.5px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.10)'}`,
      background: isDark ? '#1e1e28' : '#f7f3ee',
      color: isDark ? '#f0eff5' : '#1a1814',
      fontSize: '14px',
      fontFamily: 'DM Sans, sans-serif',
      outline: 'none',
      boxSizing: 'border-box',
      transition: 'border-color 0.15s',
    },
    inputWrap: {
      position: 'relative',
      marginBottom: '18px',
    },
    showBtn: {
      position: 'absolute',
      right: '12px', top: '50%',
      transform: 'translateY(-50%)',
      background: 'none', border: 'none',
      cursor: 'pointer',
      color: isDark ? '#5a5968' : '#aaa9a0',
      fontSize: '13px',
      padding: '0',
      display: 'flex', alignItems: 'center',
    },
    error: {
      background: 'rgba(255,95,109,0.12)',
      border: '1px solid rgba(255,95,109,0.3)',
      borderRadius: '10px',
      padding: '10px 14px',
      color: '#ff5f6d',
      fontSize: '13px',
      marginBottom: '18px',
      lineHeight: 1.5,
    },
    btn: {
      width: '100%',
      padding: '12px',
      borderRadius: '10px',
      border: 'none',
      background: isDark ? '#e8a04a' : '#c8533a',
      color: isDark ? '#1a1000' : '#ffffff',
      fontSize: '14px',
      fontWeight: 600,
      fontFamily: 'DM Sans, sans-serif',
      cursor: loading ? 'not-allowed' : 'pointer',
      opacity: loading ? 0.7 : 1,
      transition: 'all 0.15s',
      marginTop: '6px',
    },
    divider: {
      display: 'flex', alignItems: 'center', gap: '12px',
      margin: '20px 0',
    },
    divLine: {
      flex: 1, height: '1px',
      background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)',
    },
    divText: {
      fontSize: '12px',
      color: isDark ? '#5a5968' : '#aaa9a0',
    },
    hint: {
      textAlign: 'center',
      fontSize: '12px',
      color: isDark ? '#5a5968' : '#aaa9a0',
      marginTop: '20px',
      lineHeight: 1.6,
    },
  }

  return (
    <div style={c.page}>
      <div style={c.card}>

        {/* Logo */}
        <div style={c.logo}>
          <div style={c.logoMark}>
            <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
              <rect x="1"  y="1"  width="9" height="9" rx="2" fill="#e8a04a"/>
              <rect x="12" y="1"  width="9" height="9" rx="2" fill="#e8a04a" opacity=".4"/>
              <rect x="1"  y="12" width="9" height="9" rx="2" fill="#e8a04a" opacity=".2"/>
              <rect x="12" y="12" width="9" height="9" rx="2" fill="#e8a04a" opacity=".7"/>
            </svg>
          </div>
          <span style={c.logoText}>Taskflow</span>
        </div>

        <div style={c.heading}>Welcome back</div>
        <div style={c.sub}>Sign in to your workspace</div>

        {/* Error message */}
        {error && <div style={c.error}>⚠️ {error}</div>}

        {/* Form */}
        <form onSubmit={handleLogin}>

          {/* Email */}
          <label style={c.label}>Email address</label>
          <div style={c.inputWrap}>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@company.com"
              style={c.input}
              autoComplete="email"
              onFocus={e => e.target.style.borderColor = isDark ? '#e8a04a' : '#c8533a'}
              onBlur={e => e.target.style.borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.10)'}
            />
          </div>

          {/* Password */}
          <label style={c.label}>Password</label>
          <div style={{ ...c.inputWrap }}>
            <input
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{ ...c.input, paddingRight: '44px' }}
              autoComplete="current-password"
              onFocus={e => e.target.style.borderColor = isDark ? '#e8a04a' : '#c8533a'}
              onBlur={e => e.target.style.borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.10)'}
            />
            <button
              type="button"
              style={c.showBtn}
              onClick={() => setShowPass(p => !p)}
            >
              {showPass ? '🙈' : '👁'}
            </button>
          </div>

          {/* Submit */}
          <button
            type="submit"
            style={c.btn}
            disabled={loading}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = '0.88' }}
            onMouseLeave={e => { e.currentTarget.style.opacity = loading ? '0.7' : '1' }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        {/* Hint for admin */}
        <div style={c.hint}>
          Contact your administrator if you don't have an account.<br/>
          Admin can invite you from the Admin Panel.
        </div>
      </div>
    </div>
  )
}
