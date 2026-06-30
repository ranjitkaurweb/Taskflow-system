import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useProjects() {
  const [projects,  setProjects]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null)
  const [userId,    setUserId]    = useState(null)
  const [userRole,  setUserRole]  = useState(null)
  const [authReady, setAuthReady] = useState(false)

  // ── Get current user + role ──
  useEffect(() => {
    async function getUser() {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUserId(session.user.id)
        const { data } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single()
        setUserRole(data?.role || 'employee')
      }
      setAuthReady(true)
    }
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_, session) => {
      if (session?.user) {
        setUserId(session.user.id)
        const { data } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single()
        setUserRole(data?.role || 'employee')
      } else {
        setUserId(null)
        setUserRole(null)
      }
      setAuthReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  // ── Fetch projects ──
  useEffect(() => {
    if (!authReady || !userId) {
      if (authReady) { setProjects([]); setLoading(false) }
      return
    }

    let mounted = true

    async function fetchProjects() {
      setLoading(true)
      setError(null)

      // Fetch projects with members (profiles joined)
      const { data, error: err } = await supabase
        .from('projects')
        .select(`
          *,
          project_members (
            user_id,
            profiles ( id, full_name, email )
          )
        `)
        .order('created_at', { ascending: false })

      if (!mounted) return
      if (err) { setError(err.message); setLoading(false); return }
      setProjects(data || [])
      setLoading(false)
    }

    fetchProjects()

    // Realtime — projects
    const channel = supabase
      .channel(`projects-${userId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'projects' },
        () => { if (mounted) fetchProjects() }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'project_members' },
        () => { if (mounted) fetchProjects() }
      )
      .subscribe()

    return () => {
      mounted = false
      supabase.removeChannel(channel)
    }
  }, [userId, authReady])

  // ── Create project (admin only) ──
  const createProject = useCallback(async ({ title, description, priority, due, memberIds }) => {
  if (!userId) return { error: 'Not logged in' }

  const { data: project, error: err } = await supabase
    .from('projects')
    .insert({
      title:       title.trim(),
      description: description?.trim() || null,
      priority:    priority || 'medium',
      due:         due || null,
      status:      'active',
      created_by:  userId,
    })
    .select()
    .single()

  if (err) return { error: err.message }

  // Add members
  if (memberIds?.length) {
    const rows = memberIds.map(uid => ({ project_id: project.id, user_id: uid }))
    const { error: memberErr } = await supabase.from('project_members').insert(rows)
    if (memberErr) return { error: memberErr.message }

    // ── Send notifications to all assigned members ──
    const notifications = memberIds.map(uid => ({
      user_id:    uid,
      message:    `🗂️ You've been added to project "${project.title}"`,
      task_title: project.title,
      read:       false,
    }))
    if (notifications.length > 0) {
      const { error: notifErr } = await supabase.from('notifications').insert(notifications)
      if (notifErr) console.error('project notification error:', notifErr.message)
    }
  }

  // Also add admin as member
  await supabase.from('project_members').insert({ project_id: project.id, user_id: userId })

  return { project }
}, [userId])

  // ── Update project status ──
  const updateProject = useCallback(async (id, updates) => {
    const { error: err } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
    if (err) return { error: err.message }
    return { success: true }
  }, [])

  // ── Delete project ──
  const deleteProject = useCallback(async (id) => {
    const { error: err } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)
    if (err) return { error: err.message }
    setProjects(prev => prev.filter(p => p.id !== id))
    return { success: true }
  }, [])

  // ── Add member ──
  const addMember = useCallback(async (projectId, memberId) => {
    const { error: err } = await supabase
      .from('project_members')
      .insert({ project_id: projectId, user_id: memberId })
    if (err) return { error: err.message }
    return { success: true }
  }, [])

  // ── Remove member ──
  const removeMember = useCallback(async (projectId, memberId) => {
    const { error: err } = await supabase
      .from('project_members')
      .delete()
      .eq('project_id', projectId)
      .eq('user_id', memberId)
    if (err) return { error: err.message }
    return { success: true }
  }, [])

  return {
    projects, loading, error,
    userId, userRole,
    createProject, updateProject, deleteProject,
    addMember, removeMember,
  }
}
