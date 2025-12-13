import { useState, useEffect, useCallback } from 'react'

const TURN_DURATION = 30 // seconds

export function useTimer(turnStartedAt, isActive, onTimeout) {
  const [timeRemaining, setTimeRemaining] = useState(TURN_DURATION)

  const calculateTimeRemaining = useCallback(() => {
    if (!turnStartedAt) return TURN_DURATION

    const startTime = new Date(turnStartedAt).getTime()
    const now = Date.now()
    const elapsed = Math.floor((now - startTime) / 1000)
    const remaining = Math.max(0, TURN_DURATION - elapsed)

    return remaining
  }, [turnStartedAt])

  useEffect(() => {
    if (!isActive || !turnStartedAt) {
      setTimeRemaining(TURN_DURATION)
      return
    }

    // Calculate initial time
    setTimeRemaining(calculateTimeRemaining())

    // Update every second
    const interval = setInterval(() => {
      const remaining = calculateTimeRemaining()
      setTimeRemaining(remaining)

      if (remaining <= 0) {
        clearInterval(interval)
        onTimeout?.()
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [turnStartedAt, isActive, calculateTimeRemaining, onTimeout])

  return {
    timeRemaining,
    isLow: timeRemaining <= 3,
    percentage: (timeRemaining / TURN_DURATION) * 100,
  }
}
