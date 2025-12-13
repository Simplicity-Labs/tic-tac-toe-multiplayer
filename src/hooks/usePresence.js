import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const PRESENCE_CHANNEL = 'online-users'

export function usePresence() {
  const { user, profile } = useAuth()
  const [onlineUsers, setOnlineUsers] = useState([])
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (!user || !profile) return

    const channel = supabase.channel(PRESENCE_CHANNEL, {
      config: {
        presence: {
          key: user.id,
        },
      },
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const users = []

        for (const [userId, presences] of Object.entries(state)) {
          if (presences.length > 0) {
            users.push({
              id: userId,
              ...presences[0],
            })
          }
        }

        setOnlineUsers(users)
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences)
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: user.id,
            username: profile.username,
            online_at: new Date().toISOString(),
          })
          setIsConnected(true)
        }
      })

    return () => {
      channel.untrack()
      supabase.removeChannel(channel)
      setIsConnected(false)
    }
  }, [user, profile])

  const getOtherUsers = useCallback(() => {
    if (!user) return onlineUsers
    return onlineUsers.filter((u) => u.id !== user.id)
  }, [onlineUsers, user])

  return {
    onlineUsers,
    otherUsers: getOtherUsers(),
    onlineCount: onlineUsers.length,
    isConnected,
  }
}
