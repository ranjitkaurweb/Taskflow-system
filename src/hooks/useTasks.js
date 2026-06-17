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
  deletedAt:   row.deleted_at  || null,
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
  .is('deleted_at', null)
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
  // If soft deleted, remove from list
  if (payload.new.deleted_at) {
    setTasks(prev => prev.filter(t => t.id !== payload.new.id))
  } else {
    setTasks(prev => prev.map(t =>
      t.id === payload.new.id ? fromRow(payload.new) : t
    ))
  }
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
  // Get task details before deleting
  const task = tasks.find(t => t.id === id)

  // Optimistic update — remove from active tasks
  setTasks(prev => prev.filter(t => t.id !== id))

  // Soft delete — mark deleted_at instead of hard delete
const { data: updateData, error: err } = await supabase
  .from('tasks')
  .update({ deleted_at: Date.now() })
  .eq('id', id)
  .select()

if (err) { console.error('deleteTask error:', err.message); return }

  if (!task) return

  // Fetch all admin user ids
  const { data: admins } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'admin')

  // Build notification rows
  const notifTargets = new Set()

  // Notify task owner (employee) if exists and is not the one deleting
  if (task.user_id && task.user_id !== userId) {
    notifTargets.add(task.user_id)
  }

  // Notify all admins
  if (admins) {
    admins.forEach(a => notifTargets.add(a.id))
  }

  const notifications = Array.from(notifTargets).map(uid => ({
    user_id:    uid,
    message:    `Task "${task.title}" was deleted.`,
    task_title: task.title,
    read:       false,
  }))

  if (notifications.length > 0) {
    const { error: notifErr } = await supabase
      .from('notifications')
      .insert(notifications)
    if (notifErr) console.error('notification insert error:', notifErr.message)
  }
}, [tasks, userId])

  // ── EDIT ──
// ── EDIT ──
const editTask = useCallback(async (id, updates) => {
  // Support both old string call and new object call
  if (typeof updates === 'string') {
    updates = { title: updates }
  }
  if (!updates?.title?.trim()) return

  const cleaned = {
    title:    updates.title.trim(),
    priority: updates.priority || 'medium',
    status:   updates.status   || 'todo',
    due:      updates.due      || null,
  }

  setTasks(prev => prev.map(t =>
    t.id === id ? { ...t, ...cleaned } : t
  ))

  const { error: err } = await supabase
    .from('tasks').update(cleaned).eq('id', id)
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
