import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'
import { createEmptyBoard } from '../lib/gameLogic'

const INVITE_TIMEOUT = 30000 // 30 seconds

const InvitationsContext = createContext(null)

export function InvitationsProvider({ children }) {
  const { user, profile } = useAuth()
  const [pendingInvite, setPendingInvite] = useState(null)
  const [sentInvite, setSentInvite] = useState(null)
  const channelRef = useRef(null)
  const timeoutRef = useRef(null)

  // Use refs to avoid stale closures in event handlers
  const pendingInviteRef = useRef(pendingInvite)
  const sentInviteRef = useRef(sentInvite)

  // Keep refs in sync with state
  useEffect(() => {
    pendingInviteRef.current = pendingInvite
  }, [pendingInvite])

  useEffect(() => {
    sentInviteRef.current = sentInvite
  }, [sentInvite])

  // Listen for incoming invites on user-specific channel
  useEffect(() => {
    if (!user) return

    console.log('Setting up invite channel for user:', user.id)

    const channel = supabase.channel(`invites:${user.id}`, {
      config: {
        broadcast: { ack: true },
      },
    })

    channel
      .on('broadcast', { event: 'invite' }, ({ payload }) => {
        console.log('Received invite:', payload)
        if (pendingInviteRef.current) {
          console.log('Already have pending invite, ignoring')
          return
        }

        setPendingInvite({
          ...payload,
          receivedAt: Date.now(),
        })

        clearTimeout(timeoutRef.current)
        timeoutRef.current = setTimeout(() => {
          setPendingInvite(null)
        }, INVITE_TIMEOUT)
      })
      .on('broadcast', { event: 'invite-response' }, ({ payload }) => {
        console.log('Received invite-response:', payload)
        const currentSentInvite = sentInviteRef.current
        console.log('Current sent invite:', currentSentInvite)
        if (currentSentInvite && payload.gameId === currentSentInvite.gameId) {
          if (payload.accepted) {
            console.log('Invite accepted!')
            setSentInvite((prev) => (prev ? { ...prev, accepted: true } : null))
          } else {
            console.log('Invite declined!')
            setSentInvite((prev) =>
              prev ? { ...prev, declined: true } : null
            )
            setTimeout(() => setSentInvite(null), 3000)
          }
        } else {
          console.log('No matching sent invite found')
        }
      })
      .on('broadcast', { event: 'invite-cancelled' }, ({ payload }) => {
        console.log('Received invite-cancelled:', payload)
        const currentPendingInvite = pendingInviteRef.current
        if (currentPendingInvite && payload.gameId === currentPendingInvite.gameId) {
          clearTimeout(timeoutRef.current)
          setPendingInvite(null)
        }
      })
      .subscribe((status) => {
        console.log('Invite channel status:', status, 'for user:', user.id)
      })

    channelRef.current = channel

    return () => {
      console.log('Cleaning up invite channel for user:', user.id)
      clearTimeout(timeoutRef.current)
      supabase.removeChannel(channel)
    }
  }, [user])

  // Helper to send a broadcast message reliably
  const sendBroadcast = useCallback(async (targetUserId, event, payload) => {
    const channelName = `invites:${targetUserId}`
    const targetChannel = supabase.channel(channelName, {
      config: {
        broadcast: { ack: true },
      },
    })

    return new Promise((resolve, reject) => {
      let timeoutId = null
      let settled = false

      const cleanup = () => {
        if (timeoutId) clearTimeout(timeoutId)
        setTimeout(() => {
          supabase.removeChannel(targetChannel)
        }, 1000)
      }

      targetChannel.subscribe((status) => {
        if (settled) return

        if (status === 'SUBSCRIBED') {
          console.log(`Sending ${event} to ${targetUserId}`)
          targetChannel
            .send({
              type: 'broadcast',
              event,
              payload,
            })
            .then((result) => {
              if (settled) return
              settled = true
              console.log(`Broadcast ${event} result:`, result)
              cleanup()
              resolve()
            })
            .catch((err) => {
              if (settled) return
              settled = true
              console.error(`Broadcast ${event} error:`, err)
              cleanup()
              reject(err)
            })
        } else if (status === 'CHANNEL_ERROR') {
          if (settled) return
          settled = true
          cleanup()
          reject(new Error('Channel subscription failed'))
        }
      })

      timeoutId = setTimeout(() => {
        if (settled) return
        settled = true
        console.error(`Broadcast ${event} timeout`)
        supabase.removeChannel(targetChannel)
        reject(new Error('Channel subscription timeout'))
      }, 5000)
    })
  }, [])

  const sendInvite = useCallback(
    async (targetUser) => {
      if (!user || !profile) return { error: 'Not authenticated' }

      const { data: game, error: gameError } = await supabase
        .from('games')
        .insert({
          player_x: user.id,
          player_o: null,
          board: createEmptyBoard(),
          current_turn: user.id,
          status: 'waiting',
          is_ai_game: false,
          turn_started_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (gameError) {
        return { error: gameError.message }
      }

      try {
        await sendBroadcast(targetUser.id, 'invite', {
          gameId: game.id,
          from: {
            id: user.id,
            username: profile.username,
          },
        })
      } catch (err) {
        console.error('Failed to send invite broadcast:', err)
        await supabase.from('games').delete().eq('id', game.id)
        return { error: 'Failed to send invite' }
      }

      setSentInvite({
        gameId: game.id,
        to: targetUser,
        sentAt: Date.now(),
      })

      return { data: game }
    },
    [user, profile, sendBroadcast]
  )

  const acceptInvite = useCallback(async () => {
    if (!pendingInvite || !user) return { error: 'No pending invite' }

    clearTimeout(timeoutRef.current)
    const inviteToAccept = pendingInvite

    const { data, error } = await supabase
      .from('games')
      .update({
        player_o: user.id,
        status: 'in_progress',
        turn_started_at: new Date().toISOString(),
      })
      .eq('id', inviteToAccept.gameId)
      .eq('status', 'waiting')
      .select()
      .single()

    if (error) {
      setPendingInvite(null)
      return { error: error.message }
    }

    try {
      await sendBroadcast(inviteToAccept.from.id, 'invite-response', {
        gameId: inviteToAccept.gameId,
        accepted: true,
      })
    } catch (err) {
      console.error('Failed to send accept notification:', err)
    }

    const gameId = inviteToAccept.gameId
    setPendingInvite(null)

    return { data, gameId }
  }, [pendingInvite, user, sendBroadcast])

  const declineInvite = useCallback(async () => {
    if (!pendingInvite) return

    clearTimeout(timeoutRef.current)
    const inviteToDecline = pendingInvite

    setPendingInvite(null)

    await supabase.from('games').delete().eq('id', inviteToDecline.gameId)

    try {
      await sendBroadcast(inviteToDecline.from.id, 'invite-response', {
        gameId: inviteToDecline.gameId,
        accepted: false,
      })
    } catch (err) {
      console.error('Failed to send decline notification:', err)
    }
  }, [pendingInvite, sendBroadcast])

  const cancelInvite = useCallback(async () => {
    if (!sentInvite) return

    const inviteToCancel = sentInvite
    setSentInvite(null)

    await supabase.from('games').delete().eq('id', inviteToCancel.gameId)

    try {
      await sendBroadcast(inviteToCancel.to.id, 'invite-cancelled', {
        gameId: inviteToCancel.gameId,
      })
    } catch (err) {
      console.error('Failed to send cancel notification:', err)
    }
  }, [sentInvite, sendBroadcast])

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
