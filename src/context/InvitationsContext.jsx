import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from './AuthContext'
import { wsClient } from '../lib/ws'

const INVITE_TIMEOUT = 30000 // 30 seconds

const InvitationsContext = createContext(null)

export function InvitationsProvider({ children }) {
  const { user, profile } = useAuth()
  const [pendingInvite, setPendingInvite] = useState(null)
  const [sentInvite, setSentInvite] = useState(null)
  const timeoutRef = useRef(null)

  const pendingInviteRef = useRef(pendingInvite)
  const sentInviteRef = useRef(sentInvite)

  useEffect(() => {
    pendingInviteRef.current = pendingInvite
  }, [pendingInvite])

  useEffect(() => {
    sentInviteRef.current = sentInvite
  }, [sentInvite])

  // Listen for incoming invites via WebSocket
  useEffect(() => {
    if (!user) return

    const unsubReceived = wsClient.on('invite:received', (payload) => {
      if (pendingInviteRef.current) return // Already have a pending invite

      setPendingInvite({
        ...payload,
        receivedAt: Date.now(),
      })

      clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => {
        setPendingInvite(null)
      }, INVITE_TIMEOUT)
    })

    const unsubResponse = wsClient.on('invite:response', (payload) => {
      const currentSentInvite = sentInviteRef.current
      if (currentSentInvite && payload.gameId === currentSentInvite.gameId) {
        if (payload.accepted) {
          setSentInvite((prev) => (prev ? { ...prev, accepted: true } : null))
        } else {
          setSentInvite((prev) => (prev ? { ...prev, declined: true } : null))
          setTimeout(() => setSentInvite(null), 3000)
        }
      }
    })

    const unsubCancelled = wsClient.on('invite:cancelled', (payload) => {
      const currentPendingInvite = pendingInviteRef.current
      if (currentPendingInvite && payload.gameId === currentPendingInvite.gameId) {
        clearTimeout(timeoutRef.current)
        setPendingInvite(null)
      }
    })

    // Also listen for invite:sent confirmation
    const unsubSent = wsClient.on('invite:sent', (payload) => {
      // The sent invite state is already set by sendInvite below
    })

    return () => {
      clearTimeout(timeoutRef.current)
      unsubReceived()
      unsubResponse()
      unsubCancelled()
      unsubSent()
    }
  }, [user])

  const sendInvite = useCallback(
    async (targetUser, boardSize = 3, turnDuration = 30, gameMode = 'classic') => {
      if (!user || !profile) return { error: 'Not authenticated' }

      wsClient.sendInvite(targetUser.id, boardSize, turnDuration, gameMode)

      // Set a temporary sent invite - the server will confirm with invite:sent
      // We track it optimistically
      setSentInvite({
        gameId: null, // Will be set by server response or handled by gameId from accept
        boardSize,
        turnDuration,
        to: targetUser,
        sentAt: Date.now(),
      })

      // Listen for the sent confirmation to get the gameId
      const unsub = wsClient.on('invite:sent', (payload) => {
        setSentInvite((prev) =>
          prev ? { ...prev, gameId: payload.gameId } : null
        )
        unsub()
      })

      return { data: true }
    },
    [user, profile]
  )

  const acceptInvite = useCallback(async () => {
    if (!pendingInvite || !user) return { error: 'No pending invite' }

    clearTimeout(timeoutRef.current)
    const inviteToAccept = pendingInvite

    wsClient.acceptInvite(inviteToAccept.gameId)

    const gameId = inviteToAccept.gameId
    setPendingInvite(null)

    return { data: true, gameId }
  }, [pendingInvite, user])

  const declineInvite = useCallback(async () => {
    if (!pendingInvite) return

    clearTimeout(timeoutRef.current)
    const inviteToDecline = pendingInvite
    setPendingInvite(null)

    wsClient.declineInvite(inviteToDecline.gameId, inviteToDecline.from.id)
  }, [pendingInvite])

  const cancelInvite = useCallback(async () => {
    if (!sentInvite) return

    const inviteToCancel = sentInvite
    setSentInvite(null)

    if (inviteToCancel.gameId) {
      wsClient.cancelInvite(inviteToCancel.gameId, inviteToCancel.to.id)
    }
  }, [sentInvite])

  const clearSentInvite = useCallback(() => {
    setSentInvite(null)
  }, [])

  const value = {
    pendingInvite,
    sentInvite,
    sendInvite,
    acceptInvite,
    declineInvite,
    cancelInvite,
    clearSentInvite,
  }

  return (
    <InvitationsContext.Provider value={value}>
      {children}
    </InvitationsContext.Provider>
  )
}

export function useInvitations() {
  const context = useContext(InvitationsContext)
  if (!context) {
    throw new Error('useInvitations must be used within an InvitationsProvider')
  }
  return context
}
