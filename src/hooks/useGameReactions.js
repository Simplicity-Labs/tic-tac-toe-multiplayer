import { useState, useEffect, useCallback, useRef } from 'react'
import { wsClient } from '../lib/ws'

const COOLDOWN_MS = 3000 // 3 seconds between reactions
const REACTION_DISPLAY_DURATION = 3000 // How long to keep reactions in state

export function useGameReactions(gameId, userId, profile, isAIGame = false) {
  const [reactions, setReactions] = useState([]) // Recent reactions received
  const [sentReactions, setSentReactions] = useState([]) // Reactions we sent (for display)
  const [canSend, setCanSend] = useState(true)
  const [cooldownRemaining, setCooldownRemaining] = useState(0)

  const cooldownTimerRef = useRef(null)
  const cooldownIntervalRef = useRef(null)

  // Subscribe to reaction events via WebSocket (PvP only)
  useEffect(() => {
    if (!gameId || !userId || isAIGame) return

    // The game channel subscription is already managed by useGame
    // We just listen for reaction events
    const unsub = wsClient.on('reaction:received', (payload) => {
      if (payload.senderId !== userId) {
        const reaction = {
          ...payload,
          id: `${payload.senderId}-${payload.timestamp}`,
        }
        setReactions((prev) => [...prev, reaction])

        setTimeout(() => {
          setReactions((prev) => prev.filter((r) => r.id !== reaction.id))
        }, REACTION_DISPLAY_DURATION)
      }
    })

    return () => unsub()
  }, [gameId, userId, isAIGame])

  // Cleanup cooldown timers on unmount
  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current)
      if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current)
    }
  }, [])

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

      // For AI games, don't broadcast
      if (isAIGame) {
        return { data: reaction }
      }

      // For PvP, send via WebSocket
      wsClient.sendReaction(gameId, emoji, profile?.username || 'Player')
      return { data: reaction }
    },
    [canSend, gameId, userId, profile, isAIGame]
  )

  const addAIReaction = useCallback((emoji, delay = 0) => {
    setTimeout(() => {
      const reaction = {
        emoji,
        senderId: 'ai',
        senderName: 'Bot',
        timestamp: Date.now(),
        id: `ai-${Date.now()}`,
      }
      setReactions((prev) => [...prev, reaction])

      setTimeout(() => {
        setReactions((prev) => prev.filter((r) => r.id !== reaction.id))
      }, REACTION_DISPLAY_DURATION)
    }, delay)
  }, [])

  const clearReactions = useCallback(() => {
    setReactions([])
    setSentReactions([])
  }, [])

  return {
    reactions,
    sentReactions,
    sendReaction,
    addAIReaction,
    clearReactions,
    canSend,
    cooldownRemaining,
  }
}
