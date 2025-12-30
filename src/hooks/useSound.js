import { useCallback, useRef } from 'react'
import { useSettings } from '../context/SettingsContext'

// Web Audio API sound generator
const audioContext = typeof window !== 'undefined' ? new (window.AudioContext || window.webkitAudioContext)() : null

// Sound definitions using Web Audio API synthesis
const SOUNDS = {
  place: {
    // Short click/pop sound
    play: (ctx, volume) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.setValueAtTime(600, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.1)
      gain.gain.setValueAtTime(volume * 0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.1)
    }
  },
  drop: {
    // Gravity drop sound - descending tone with thud
    play: (ctx, volume) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.setValueAtTime(400, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.15)
      gain.gain.setValueAtTime(volume * 0.25, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.15)
    }
  },
  win: {
    // Victory fanfare - ascending arpeggio
    play: (ctx, volume) => {
      const notes = [523.25, 659.25, 783.99, 1046.50] // C5, E5, G5, C6
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.frequency.setValueAtTime(freq, ctx.currentTime)
        const startTime = ctx.currentTime + i * 0.1
        gain.gain.setValueAtTime(0, startTime)
        gain.gain.linearRampToValueAtTime(volume * 0.2, startTime + 0.05)
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3)
        osc.start(startTime)
        osc.stop(startTime + 0.3)
      })
    }
  },
  lose: {
    // Sad descending tone
    play: (ctx, volume) => {
      const notes = [392, 349.23, 311.13, 261.63] // G4, F4, Eb4, C4
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.frequency.setValueAtTime(freq, ctx.currentTime)
        const startTime = ctx.currentTime + i * 0.15
        gain.gain.setValueAtTime(0, startTime)
        gain.gain.linearRampToValueAtTime(volume * 0.15, startTime + 0.05)
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4)
        osc.start(startTime)
        osc.stop(startTime + 0.4)
      })
    }
  },
  draw: {
    // Neutral two-tone sound
    play: (ctx, volume) => {
      const osc1 = ctx.createOscillator()
      const osc2 = ctx.createOscillator()
      const gain = ctx.createGain()
      osc1.connect(gain)
      osc2.connect(gain)
      gain.connect(ctx.destination)
      osc1.frequency.setValueAtTime(440, ctx.currentTime)
      osc2.frequency.setValueAtTime(440, ctx.currentTime + 0.15)
      gain.gain.setValueAtTime(volume * 0.15, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4)
      osc1.start(ctx.currentTime)
      osc1.stop(ctx.currentTime + 0.15)
      osc2.start(ctx.currentTime + 0.15)
      osc2.stop(ctx.currentTime + 0.3)
    }
  },
  timerWarning: {
    // Urgent beep
    play: (ctx, volume) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'square'
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.setValueAtTime(880, ctx.currentTime)
      gain.gain.setValueAtTime(volume * 0.1, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.08)
    }
  },
  turnChange: {
    // Subtle notification
    play: (ctx, volume) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.setValueAtTime(880, ctx.currentTime)
      gain.gain.setValueAtTime(volume * 0.1, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.05)
    }
  }
}

export function useSound() {
  const { soundEnabled, soundVolume } = useSettings()
  const lastPlayedRef = useRef({})

  const playSound = useCallback((soundName, options = {}) => {
    if (!soundEnabled || !audioContext) return

    const sound = SOUNDS[soundName]
    if (!sound) {
      console.warn(`Sound "${soundName}" not found`)
      return
    }

    // Debounce to prevent rapid repeated sounds
    const now = Date.now()
    const debounceMs = options.debounce ?? 50
    if (lastPlayedRef.current[soundName] && now - lastPlayedRef.current[soundName] < debounceMs) {
      return
    }
    lastPlayedRef.current[soundName] = now

    // Resume audio context if suspended (browser autoplay policy)
    if (audioContext.state === 'suspended') {
      audioContext.resume()
    }

    try {
      sound.play(audioContext, soundVolume)
    } catch (e) {
      console.warn('Error playing sound:', e)
    }
  }, [soundEnabled, soundVolume])

  return { playSound }
}

// Export sound names for type safety
export const SOUND_NAMES = {
  PLACE: 'place',
  DROP: 'drop',
  WIN: 'win',
  LOSE: 'lose',
  DRAW: 'draw',
  TIMER_WARNING: 'timerWarning',
  TURN_CHANGE: 'turnChange',
}
