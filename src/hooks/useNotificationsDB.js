import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useNotificationsDB() {
  const [notifications, setNotifications] = useState([])
  const [userId, setUserId] = useState(null)

  // Get current user
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setUserId(session.user.id)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_, session) => setUserId(session?.user?.id || null)
    )
    return () => subscription.unsubscribe()
  }, [])

  // Fetch + realtime
  useEffect(() => {
    if (!userId) { setNotifications([]); return }
    let mounted = true

    async function fetchNotifications() {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(30)

      if (!mounted) return
      if (error) { console.error('fetchNotifications error:', error.message); return }
      setNotifications(data || [])
    }

    fetchNotifications()

    // Realtime subscription
    const channel = supabase
      .channel(`notifications-${userId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => {
          if (!mounted) return
          setNotifications(prev => [payload.new, ...prev])
        }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => {
          if (!mounted) return
          setNotifications(prev => prev.map(n => n.id === payload.new.id ? payload.new : n))
        }
      )
      .subscribe()

    return () => {
      mounted = false
      supabase.removeChannel(channel)
    }
  }, [userId])

  // Mark single notification as read
  const markRead = useCallback(async (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    await supabase.from('notifications').update({ read: true }).eq('id', id)
  }, [])

  // Mark all as read
  const markAllRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false)
  }, [userId])

  const unreadCount = notifications.filter(n => !n.read).length

  return { notifications, unreadCount, markRead, markAllRead }
}
