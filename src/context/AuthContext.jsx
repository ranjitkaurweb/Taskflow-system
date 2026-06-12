import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // ── Load profile — always fetch fresh from DB ──
  async function loadProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, department, joined_at')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('loadProfile error:', error.message)

      // If profile doesn't exist yet — create it
      if (error.code === 'PGRST116') {
        const { data: userData } = await supabase.auth.getUser()
        const newProfile = {
  id: userId,
  email: userData?.user?.email || '',
  full_name: userData?.user?.user_metadata?.full_name || '',
  role: 'employee',
  joined_at: new Date().toISOString(),
}
        const { data: inserted } = await supabase
          .from('profiles')
          .insert(newProfile)
          .select()
          .single()
        return inserted
      }
      return null
    }

    console.log('Profile loaded:', data?.email, '| role:', data?.role)
    return data
  }

  // ── Check session on app load ──
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        const p = await loadProfile(session.user.id)
        setProfile(p)
      }
      setLoading(false)
    })

    // Listen for login / logout / token refresh events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth event:', event)

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session?.user) {
            setUser(session.user)
            // Always fetch fresh profile on login — never use cached version
            const p = await loadProfile(session.user.id)
            setProfile(p)
          }
        }

        if (event === 'SIGNED_OUT') {
          setUser(null)
          setProfile(null)
        }

        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // ── Login ──
  async function login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    if (error) throw error
    return data
  }

  // ── Logout ──
  async function logout() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  // ── Force refresh profile from DB ──
  async function refreshProfile() {
    if (!user?.id) return
    const p = await loadProfile(user.id)
    setProfile(p)
  }

  const isAdmin    = profile?.role === 'admin'
  const isEmployee = profile?.role === 'employee'
  const isLoggedIn = !!user

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      isAdmin,
      isEmployee,
      isLoggedIn,
      login,
      logout,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
