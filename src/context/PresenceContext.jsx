import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

const PRESENCE_CHANNEL = 'online-users'

const PresenceContext = createContext(null)

export function PresenceProvider({ children }) {
  const { user, profile } = useAuth()
  const [onlineUsers, setOnlineUsers] = useState([])
  const [isConnected, setIsConnected] = useState(false)
  const channelRef = useRef(null)
  const currentGameIdRef = useRef(null)
  const usernameRef = useRef(null)
  const avatarRef = useRef(null)

  // Keep username and avatar refs updated
  useEffect(() => {
    usernameRef.current = profile?.username
    avatarRef.current = profile?.avatar
  }, [profile?.username, profile?.avatar])

  // Only depend on user.id, not the whole user/profile objects
  const userId = user?.id
  const username = profile?.username
  const avatar = profile?.avatar

  useEffect(() => {
    if (!userId || !username) return

    const channel = supabase.channel(PRESENCE_CHANNEL, {
      config: {
        presence: {
          key: userId,
        },
      },
    })

    channelRef.current = channel

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const users = []

        for (const [odlUserId, presences] of Object.entries(state)) {
          if (presences.length > 0) {
            users.push({
              id: odlUserId,
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
            user_id: userId,
            username: usernameRef.current,
            avatar: avatarRef.current,
            online_at: new Date().toISOString(),
            current_game_id: currentGameIdRef.current,
          })
          setIsConnected(true)
        }
      })

    return () => {
      channel.untrack()
      supabase.removeChannel(channel)
      channelRef.current = null
      setIsConnected(false)
    }
  }, [userId, username, avatar])

  // Update presence with current game status
  const setCurrentGame = useCallback(async (gameId) => {
    if (!channelRef.current || !userId) return

    currentGameIdRef.current = gameId

    await channelRef.current.track({
      user_id: userId,
      username: usernameRef.current,
      online_at: new Date().toISOString(),
      current_game_id: gameId,
    })
  }, [userId])

  const getOtherUsers = useCallback(() => {
    if (!userId) return onlineUsers
    return onlineUsers.filter((u) => u.id !== userId)
  }, [onlineUsers, userId])

  const value = {
    onlineUsers,
    otherUsers: getOtherUsers(),
    onlineCount: onlineUsers.length,
    isConnected,
    setCurrentGame,
  }

  return (
    <PresenceContext.Provider value={value}>
      {children}
    </PresenceContext.Provider>
  )
}

export function usePresence() {
  const context = useContext(PresenceContext)
  if (!context) {
    throw new Error('usePresence must be used within a PresenceProvider')
  }
  return context
}
