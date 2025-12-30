import { useState, useEffect, useCallback } from 'react'

const DEFAULT_TURN_DURATION = 30 // seconds

// Timer duration options (in seconds)
export const TIMER_OPTIONS = [
  { value: null, label: 'No Timer', shortLabel: 'Off' },
  { value: 10, label: '10 seconds', shortLabel: '10s' },
  { value: 30, label: '30 seconds', shortLabel: '30s' },
  { value: 60, label: '1 minute', shortLabel: '1m' },
  { value: 300, label: '5 minutes', shortLabel: '5m' },
  { value: 600, label: '10 minutes', shortLabel: '10m' },
  { value: 3600, label: '1 hour', shortLabel: '1h' },
  { value: 86400, label: '24 hours', shortLabel: '24h' },
]

export function useTimer(turnStartedAt, isActive, onTimeout, turnDuration = DEFAULT_TURN_DURATION) {
  // If no timer (null/0), return disabled state
  const timerEnabled = turnDuration !== null && turnDuration > 0
  const duration = timerEnabled ? turnDuration : DEFAULT_TURN_DURATION

  const [timeRemaining, setTimeRemaining] = useState(duration)

  const calculateTimeRemaining = useCallback(() => {
    if (!turnStartedAt) return duration

    const startTime = new Date(turnStartedAt).getTime()
    const now = Date.now()
    const elapsed = Math.floor((now - startTime) / 1000)
    const remaining = Math.max(0, duration - elapsed)

    return remaining
  }, [turnStartedAt, duration])

  useEffect(() => {
    // If timer is disabled, don't run
    if (!timerEnabled) {
      setTimeRemaining(duration)
      return
    }

    if (!isActive || !turnStartedAt) {
      setTimeRemaining(duration)
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
  }, [turnStartedAt, isActive, calculateTimeRemaining, onTimeout, timerEnabled, duration])

  // Format time for display (handles longer durations)
  const formatTime = (seconds) => {
    if (seconds >= 3600) {
      const hours = Math.floor(seconds / 3600)
      const mins = Math.floor((seconds % 3600) / 60)
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
    }
    if (seconds >= 60) {
      const mins = Math.floor(seconds / 60)
      const secs = seconds % 60
      return secs > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${mins}m`
    }
    return seconds.toString()
  }

  return {
    timeRemaining,
    formattedTime: formatTime(timeRemaining),
    isLow: timerEnabled && timeRemaining <= Math.min(10, duration * 0.2), // Low when ≤10s or ≤20% of duration
    percentage: timerEnabled ? (timeRemaining / duration) * 100 : 100,
    timerEnabled,
  }
}
