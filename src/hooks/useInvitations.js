import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { createEmptyBoard } from '../lib/gameLogic'

const INVITE_TIMEOUT = 30000 // 30 seconds

export function useInvitations() {
  const { user, profile } = useAuth()
  const [pendingInvite, setPendingInvite] = useState(null)
  const [sentInvite, setSentInvite] = useState(null)
  const channelRef = useRef(null)
  const timeoutRef = useRef(null)

  // Listen for incoming invites on user-specific channel
  useEffect(() => {
    if (!user) return

    const channel = supabase.channel(`invites:${user.id}`)

    channel
      .on('broadcast', { event: 'invite' }, ({ payload }) => {
        // Don't show invite if we already have one pending
        if (pendingInvite) return

        setPendingInvite({
          ...payload,
          receivedAt: Date.now(),
        })

        // Auto-dismiss after timeout
        timeoutRef.current = setTimeout(() => {
          setPendingInvite(null)
        }, INVITE_TIMEOUT)
      })
      .on('broadcast', { event: 'invite-response' }, ({ payload }) => {
        // Handle response to our sent invite
        if (sentInvite && payload.gameId === sentInvite.gameId) {
          if (payload.accepted) {
            // They accepted - we can navigate to game
            setSentInvite((prev) => (prev ? { ...prev, accepted: true } : null))
          } else {
            // They declined
            setSentInvite((prev) =>
              prev ? { ...prev, declined: true } : null
            )
            // Clear after showing declined message
            setTimeout(() => setSentInvite(null), 3000)
          }
        }
      })
      .on('broadcast', { event: 'invite-cancelled' }, ({ payload }) => {
        // Invite was cancelled by sender
        if (pendingInvite && payload.gameId === pendingInvite.gameId) {
          clearTimeout(timeoutRef.current)
          setPendingInvite(null)
        }
      })
      .subscribe()

    channelRef.current = channel

    return () => {
      clearTimeout(timeoutRef.current)
      supabase.removeChannel(channel)
    }
  }, [user, pendingInvite, sentInvite])

  // Send an invite to another user
  const sendInvite = useCallback(
    async (targetUser) => {
      if (!user || !profile) return { error: 'Not authenticated' }

      // Create a game first
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

      // Broadcast invite to target user's channel
      const targetChannel = supabase.channel(`invites:${targetUser.id}`)

      await targetChannel.subscribe()
      await targetChannel.send({
        type: 'broadcast',
        event: 'invite',
        payload: {
          gameId: game.id,
          from: {
            id: user.id,
            username: profile.username,
          },
        },
      })

      supabase.removeChannel(targetChannel)

      setSentInvite({
        gameId: game.id,
        to: targetUser,
        sentAt: Date.now(),
      })

      return { data: game }
    },
    [user, profile]
  )

  // Accept an incoming invite
  const acceptInvite = useCallback(async () => {
    if (!pendingInvite || !user) return { error: 'No pending invite' }

    clearTimeout(timeoutRef.current)

    // Join the game
    const { data, error } = await supabase
      .from('games')
      .update({
        player_o: user.id,
        status: 'in_progress',
        turn_started_at: new Date().toISOString(),
      })
      .eq('id', pendingInvite.gameId)
      .eq('status', 'waiting')
      .select()
      .single()

    if (error) {
      setPendingInvite(null)
      return { error: error.message }
    }

    // Notify the sender that we accepted
    const senderChannel = supabase.channel(`invites:${pendingInvite.from.id}`)
    await senderChannel.subscribe()
    await senderChannel.send({
      type: 'broadcast',
      event: 'invite-response',
      payload: {
        gameId: pendingInvite.gameId,
        accepted: true,
      },
    })
    supabase.removeChannel(senderChannel)

    const gameId = pendingInvite.gameId
    setPendingInvite(null)

    return { data, gameId }
  }, [pendingInvite, user])

  // Decline an incoming invite
  const declineInvite = useCallback(async () => {
    if (!pendingInvite) return

    clearTimeout(timeoutRef.current)

    // Delete the game since invite was declined
    await supabase.from('games').delete().eq('id', pendingInvite.gameId)

    // Notify the sender that we declined
    const senderChannel = supabase.channel(`invites:${pendingInvite.from.id}`)
    await senderChannel.subscribe()
    await senderChannel.send({
      type: 'broadcast',
      event: 'invite-response',
      payload: {
        gameId: pendingInvite.gameId,
        accepted: false,
      },
    })
    supabase.removeChannel(senderChannel)

    setPendingInvite(null)
  }, [pendingInvite])

  // Cancel a sent invite
  const cancelInvite = useCallback(async () => {
    if (!sentInvite) return

    // Delete the game
    await supabase.from('games').delete().eq('id', sentInvite.gameId)

    // Notify the target user
    const targetChannel = supabase.channel(`invites:${sentInvite.to.id}`)
    await targetChannel.subscribe()
    await targetChannel.send({
      type: 'broadcast',
      event: 'invite-cancelled',
      payload: {
        gameId: sentInvite.gameId,
      },
    })
    supabase.removeChannel(targetChannel)

    setSentInvite(null)
  }, [sentInvite])

  // Clear sent invite state
  const clearSentInvite = useCallback(() => {
    setSentInvite(null)
  }, [])

  return {
    pendingInvite,
    sentInvite,
    sendInvite,
    acceptInvite,
    declineInvite,
    cancelInvite,
    clearSentInvite,
  }
}
