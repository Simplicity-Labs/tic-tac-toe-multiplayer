import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from './AuthContext'
import { wsClient } from '../lib/ws'

const PresenceContext = createContext(null)

export function PresenceProvider({ children }) {
  const { user, profile } = useAuth()
  const [onlineUsers, setOnlineUsers] = useState([])
  const [isConnected, setIsConnected] = useState(false)
  const currentGameIdRef = useRef(null)

  const userId = user?.id
  const username = profile?.username
  const avatar = profile?.avatar

  useEffect(() => {
    if (!userId || !username) return

    // Connect WebSocket and join presence
    wsClient.connect()
    wsClient.joinPresence(userId, username, avatar || '😀')

    const unsubSync = wsClient.on('presence:sync', (data) => {
      if (data?.users) {
        setOnlineUsers(data.users)
      }
    })

    const unsubConnected = wsClient.on('connected', () => {
      setIsConnected(true)
      // Re-join presence on reconnect
      wsClient.joinPresence(userId, username, avatar || '😀')
      if (currentGameIdRef.current) {
        wsClient.setCurrentGame(currentGameIdRef.current)
      }
    })

    const unsubDisconnected = wsClient.on('disconnected', () => {
      setIsConnected(false)
    })

    return () => {
      unsubSync()
      unsubConnected()
      unsubDisconnected()
    }
  }, [userId, username, avatar])

  const setCurrentGame = useCallback(async (gameId) => {
    currentGameIdRef.current = gameId
    wsClient.setCurrentGame(gameId)
  }, [])

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
