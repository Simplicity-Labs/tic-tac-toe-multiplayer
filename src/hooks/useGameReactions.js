import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'

const COOLDOWN_MS = 3000 // 3 seconds between reactions
const REACTION_DISPLAY_DURATION = 3000 // How long to keep reactions in state

export function useGameReactions(gameId, userId, profile, isAIGame = false) {
  const [reactions, setReactions] = useState([]) // Recent reactions received
  const [sentReactions, setSentReactions] = useState([]) // Reactions we sent (for display)
  const [canSend, setCanSend] = useState(true)
  const [cooldownRemaining, setCooldownRemaining] = useState(0)

  const channelRef = useRef(null)
  const cooldownTimerRef = useRef(null)
  const cooldownIntervalRef = useRef(null)

  // Subscribe to reactions channel (PvP only)
  useEffect(() => {
    if (!gameId || !userId || isAIGame) return

    const channel = supabase.channel(`reactions:${gameId}`, {
      config: { broadcast: { ack: true } },
    })

    channel
      .on('broadcast', { event: 'emoji' }, ({ payload }) => {
        // Only show reactions from other players
        if (payload.senderId !== userId) {
          const reaction = {
            ...payload,
            id: `${payload.senderId}-${payload.timestamp}`,
          }
          setReactions((prev) => [...prev, reaction])

          // Auto-remove reaction after display duration
          setTimeout(() => {
            setReactions((prev) => prev.filter((r) => r.id !== reaction.id))
          }, REACTION_DISPLAY_DURATION)
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Reactions channel subscribed')
        }
      })

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [gameId, userId, isAIGame])

  // Cleanup cooldown timers on unmount
  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current)
      if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current)
    }
  }, [])

  // Send a reaction
  const sendReaction = useCallback(
    async (emoji) => {
      if (!canSend || !gameId) return { error: 'Cannot send reaction' }

      const reaction = {
        emoji,
        senderId: userId,
        senderName: profile?.username || 'Player',
        timestamp: Date.now(),
      }

      // Start cooldown
      setCanSend(false)
      setCooldownRemaining(COOLDOWN_MS)

      // Update cooldown display
      const startTime = Date.now()
      cooldownIntervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime
        const remaining = Math.max(0, COOLDOWN_MS - elapsed)
        setCooldownRemaining(remaining)
        if (remaining <= 0) {
          clearInterval(cooldownIntervalRef.current)
        }
      }, 100)

      cooldownTimerRef.current = setTimeout(() => {
        setCanSend(true)
        setCooldownRemaining(0)
        if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current)
      }, COOLDOWN_MS)

      // Add to sent reactions for our own display
      const sentReaction = { ...reaction, id: `self-${reaction.timestamp}` }
      setSentReactions((prev) => [...prev, sentReaction])
      setTimeout(() => {
        setSentReactions((prev) => prev.filter((r) => r.id !== sentReaction.id))
      }, REACTION_DISPLAY_DURATION)

      // For AI games, don't broadcast (AI will respond separately)
      if (isAIGame) {
        return { data: reaction }
      }

      // For PvP games, broadcast to opponent
      if (channelRef.current) {
        try {
          await channelRef.current.send({
            type: 'broadcast',
            event: 'emoji',
            payload: reaction,
          })
          return { data: reaction }
        } catch (error) {
          console.error('Failed to send reaction:', error)
          return { error: error.message }
        }
      }

      return { data: reaction }
    },
    [canSend, gameId, userId, profile, isAIGame]
  )

  // Add an AI reaction (called from AI personality system)
  const addAIReaction = useCallback((emoji, delay = 0) => {
    setTimeout(() => {
      const reaction = {
        emoji,
        senderId: 'ai',
        senderName: 'AI',
        timestamp: Date.now(),
        id: `ai-${Date.now()}`,
      }
      setReactions((prev) => [...prev, reaction])

      // Auto-remove after display duration
      setTimeout(() => {
        setReactions((prev) => prev.filter((r) => r.id !== reaction.id))
      }, REACTION_DISPLAY_DURATION)
    }, delay)
  }, [])

  // Clear all reactions
  const clearReactions = useCallback(() => {
    setReactions([])
    setSentReactions([])
  }, [])

  return {
    reactions,        // Reactions from opponent/AI
    sentReactions,    // Reactions we sent
    sendReaction,
    addAIReaction,
    clearReactions,
    canSend,
    cooldownRemaining,
  }
}
