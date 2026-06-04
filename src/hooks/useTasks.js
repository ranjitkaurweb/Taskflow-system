// src/hooks/useTasks.js
// ─────────────────────────────────────────────────────────────
// Drop-in replacement for the old useTasks.js
// Same API: { tasks, addTask, deleteTask, editTask, moveTask }
// But now reads from and writes to Supabase (Postgres database)
// ─────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

// ── helper: generate random 8-char ID ──
const uid = () => Math.random().toString(36).slice(2, 10)

// ── helper: Supabase row → our task object ──
// Supabase uses snake_case columns; our app uses camelCase
const fromRow = (row) => ({
  id:          row.id,
  title:       row.title,
  status:      row.status,
  priority:    row.priority,
  due:         row.due || '',
  created:     row.created,
  completedAt: row.completed_at || null,
})

// ── helper: our task object → Supabase row ──
const toRow = (task) => ({
  id:           task.id,
  title:        task.title,
  status:       task.status,
  priority:     task.priority,
  due:          task.due || null,
  created:      task.created,
  completed_at: task.completedAt || null,
})

export function useTasks() {
  const [tasks,   setTasks]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  // ── LOAD all tasks from database on mount ──
  useEffect(() => {
    let mounted = true

    async function fetchTasks() {
      setLoading(true)
      setError(null)

      const { data, error: err } = await supabase
        .from('tasks')
        .select('*')
        .order('created', { ascending: false })   // newest first

      if (!mounted) return

      if (err) {
        console.error('Error loading tasks:', err.message)
        setError(err.message)
      } else {
        setTasks(data.map(fromRow))
      }

      setLoading(false)
    }

    fetchTasks()

    // ── REAL-TIME subscription ──
    // Any change in the database instantly updates the UI
    const channel = supabase
      .channel('tasks-changes')
      .on(
        'postgres_changes',
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
  }, [])

  // ── ADD TASK ──
  const addTask = useCallback(async (title, status, priority = 'medium', due = '') => {
    if (!title?.trim()) return

    const task = {
      id:          uid(),
      title:       title.trim(),
      status,
      priority,
      due:         due || '',
      created:     Date.now(),
      completedAt: status === 'completed' ? Date.now() : null,
    }

    // Optimistic update — show immediately, don't wait for DB
    setTasks(prev => [task, ...prev])

    const { error: err } = await supabase
      .from('tasks')
      .insert(toRow(task))

    if (err) {
      console.error('Error adding task:', err.message)
      // Roll back optimistic update if DB failed
      setTasks(prev => prev.filter(t => t.id !== task.id))
    }
  }, [])

  // ── DELETE TASK ──
  const deleteTask = useCallback(async (id) => {
    // Optimistic update
    setTasks(prev => prev.filter(t => t.id !== id))

    const { error: err } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)

    if (err) {
      console.error('Error deleting task:', err.message)
      // Note: to roll back we'd need to store the deleted task;
      // for simplicity we just log the error here
    }
  }, [])

  // ── EDIT TASK TITLE ──
  const editTask = useCallback(async (id, newTitle) => {
    if (!newTitle?.trim()) return

    // Optimistic update
    setTasks(prev =>
      prev.map(t => t.id === id ? { ...t, title: newTitle.trim() } : t)
    )

    const { error: err } = await supabase
      .from('tasks')
      .update({ title: newTitle.trim() })
      .eq('id', id)

    if (err) {
      console.error('Error editing task:', err.message)
    }
  }, [])

  // ── MOVE TASK (change status / drag-drop) ──
  const moveTask = useCallback(async (id, newStatus) => {
    const task = tasks.find(t => t.id === id)
    if (!task) return

    const wasCompleted = task.status === 'completed'
    const nowCompleted = newStatus === 'completed'

    const updates = {
      status:       newStatus,
      completed_at: nowCompleted && !wasCompleted
        ? Date.now()
        : !nowCompleted
        ? null
        : task.completedAt,
    }

    // Optimistic update
    setTasks(prev =>
      prev.map(t => t.id === id ? {
        ...t,
        status:      newStatus,
        completedAt: updates.completed_at,
      } : t)
    )

    const { error: err } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)

    if (err) {
      console.error('Error moving task:', err.message)
    }
  }, [tasks])

  return { tasks, loading, error, addTask, deleteTask, editTask, moveTask }
}
