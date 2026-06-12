// src/hooks/useTasks.js
// Phase 2 version — reads user from Supabase Auth
// Admin sees ALL tasks, employee sees only their own

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const uid = () => Math.random().toString(36).slice(2, 10)

// Supabase row → our app's task object
const fromRow = (row) => ({
  id:          row.id,
  title:       row.title,
  status:      row.status,
  priority:    row.priority,
  due:         row.due || '',
  created:     row.created,
  completedAt: row.completed_at || null,
  userId:      row.user_id || null,
  assignedTo:  row.assigned_to || null,
})

// Our task object → Supabase row
const toRow = (task, userId) => ({
  id:           task.id,
  title:        task.title,
  status:       task.status,
  priority:     task.priority,
  due:          task.due || null,
  created:      task.created,
  completed_at: task.completedAt || null,
  user_id:      userId,
})

export function useTasks() {
  const [tasks,   setTasks]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const [userId,  setUserId]  = useState(null)

  // ── Get current user on mount ──
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setUserId(session.user.id)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_, session) => setUserId(session?.user?.id || null)
    )
    return () => subscription.unsubscribe()
  }, [])

  // ── Load tasks when userId is known ──
  useEffect(() => {
    if (!userId) {
      setTasks([])
      setLoading(false)
      return
    }

    let mounted = true

    async function fetchTasks() {
      setLoading(true)
      setError(null)

      // Supabase RLS handles filtering automatically:
      // admin → gets all rows, employee → gets only their rows
      const { data, error: err } = await supabase
        .from('tasks')
        .select('*')
        .order('created', { ascending: false })

      if (!mounted) return
      if (err) { setError(err.message); setLoading(false); return }
      setTasks(data.map(fromRow))
      setLoading(false)
    }

    fetchTasks()

    // ── Real-time updates ──
    const channel = supabase
      .channel(`tasks-${userId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        (payload) => {
          if (!mounted) return
          if (payload.eventType === 'INSERT') {
            setTasks(prev => [fromRow(payload.new), ...prev])
          }
          if (payload.eventType === 'UPDATE') {
            setTasks(prev => prev.map(t =>
              t.id === payload.new.id ? fromRow(payload.new) : t
            ))
          }
          if (payload.eventType === 'DELETE') {
            setTasks(prev => prev.filter(t => t.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      mounted = false
      supabase.removeChannel(channel)
    }
  }, [userId])

  // ── ADD ──
  const addTask = useCallback(async (title, status, priority = 'medium', due = '') => {
    if (!title?.trim() || !userId) return
    const task = {
      id:          uid(),
      title:       title.trim(),
      status,
      priority,
      due:         due || '',
      created:     Date.now(),
      completedAt: status === 'completed' ? Date.now() : null,
    }
    setTasks(prev => [task, ...prev])
    const { error: err } = await supabase
      .from('tasks')
      .insert(toRow(task, userId))
    if (err) {
      console.error('addTask error:', err.message)
      setTasks(prev => prev.filter(t => t.id !== task.id))
    }
  }, [userId])

  // ── DELETE ──
  const deleteTask = useCallback(async (id) => {
    setTasks(prev => prev.filter(t => t.id !== id))
    const { error: err } = await supabase
      .from('tasks').delete().eq('id', id)
    if (err) console.error('deleteTask error:', err.message)
  }, [])

  // ── EDIT ──
  const editTask = useCallback(async (id, newTitle) => {
    if (!newTitle?.trim()) return
    setTasks(prev => prev.map(t =>
      t.id === id ? { ...t, title: newTitle.trim() } : t
    ))
    const { error: err } = await supabase
      .from('tasks').update({ title: newTitle.trim() }).eq('id', id)
    if (err) console.error('editTask error:', err.message)
  }, [])

  // ── MOVE (drag-drop / status change) ──
  const moveTask = useCallback(async (id, newStatus) => {
    const task = tasks.find(t => t.id === id)
    if (!task) return

    const nowCompleted = newStatus === 'completed'
    const wasCompleted = task.status === 'completed'

    const updates = {
      status:       newStatus,
      completed_at: nowCompleted && !wasCompleted
        ? Date.now()
        : !nowCompleted
        ? null
        : task.completedAt,
    }

    setTasks(prev => prev.map(t =>
      t.id === id ? { ...t, status: newStatus, completedAt: updates.completed_at } : t
    ))

    const { error: err } = await supabase
      .from('tasks').update(updates).eq('id', id)
    if (err) console.error('moveTask error:', err.message)
  }, [tasks])

  return { tasks, loading, error, addTask, deleteTask, editTask, moveTask }
}
