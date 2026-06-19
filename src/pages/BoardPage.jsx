import React, { useState, useEffect } from 'react'
import Board from '../components/Board'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function BoardPage({ tasks, onAdd, onDelete, onEdit, onMove, onComplete, onView }) {
  const [commentCounts, setCommentCounts] = useState({})
  const { profile } = useAuth()
const [unreadCounts, setUnreadCounts] = useState({})

const getLastRead = (taskId) => {
  const key = `lastRead_${taskId}`
  return parseInt(localStorage.getItem(key) || '0')
}

const markAsRead = (taskId) => {
  localStorage.setItem(`lastRead_${taskId}`, Date.now().toString())
  setUnreadCounts(prev => ({ ...prev, [taskId]: 0 }))
}

  useEffect(() => {
   async function fetchCounts() {
  const { data } = await supabase
    .from('task_comments')
    .select('task_id, created_at')
  if (data) {
    const counts = {}
    const unread = {}
    data.forEach(c => {
      counts[c.task_id] = (counts[c.task_id] || 0) + 1
      const lastRead = getLastRead(c.task_id)
      const commentTime = new Date(c.created_at).getTime()
      if (commentTime > lastRead) {
        unread[c.task_id] = (unread[c.task_id] || 0) + 1
      }
    })
    setCommentCounts(counts)
    setUnreadCounts(unread)
  }
}
    fetchCounts()

    const channel = supabase
      .channel('comment-counts')
     .on('postgres_changes',
  { event: 'INSERT', schema: 'public', table: 'task_comments' },
  (payload) => {
    const taskId = payload.new.task_id
    setCommentCounts(prev => ({
      ...prev,
      [taskId]: (prev[taskId] || 0) + 1,
    }))
    // Only increment unread if user hasn't opened this chat recently
    const lastRead = getLastRead(taskId)
    const commentTime = new Date(payload.new.created_at).getTime()
    if (commentTime > lastRead) {
      setUnreadCounts(prev => ({
        ...prev,
        [taskId]: (prev[taskId] || 0) + 1,
      }))
    }
  }
)
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  return (
 <Board
  tasks={tasks}
  onAdd={onAdd}
  onDelete={onDelete}
  onEdit={onEdit}
  onMove={onMove}
  onComplete={onComplete}
  onView={onView}
  commentCounts={unreadCounts}
  onMarkCommentRead={markAsRead}
/>
  )
}
