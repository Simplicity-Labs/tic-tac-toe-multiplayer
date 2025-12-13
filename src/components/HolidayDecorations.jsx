import { useSettings } from '../context/SettingsContext'
import { cn } from '../lib/utils'

// Holiday-specific configurations for decorations
const HOLIDAY_DECORATIONS = {
  newyear: {
    particles: ['🎆', '🎇', '✨', '🥳', '🎊'],
    bgGradient: 'from-purple-500/5 via-transparent to-amber-500/5',
    accentColor: 'amber',
  },
  valentine: {
    particles: ['💕', '💗', '💖', '💘', '🌹'],
    bgGradient: 'from-pink-500/5 via-transparent to-rose-500/5',
    accentColor: 'pink',
  },
  stpatricks: {
    particles: ['☘️', '🍀', '🌈', '💚', '🪙'],
    bgGradient: 'from-green-500/5 via-transparent to-emerald-500/5',
    accentColor: 'green',
  },
  easter: {
    particles: ['🐰', '🥚', '🐣', '🌸', '🌷'],
    bgGradient: 'from-pink-500/5 via-transparent to-purple-500/5',
    accentColor: 'pink',
  },
  halloween: {
    particles: ['🎃', '👻', '🦇', '🕷️', '🕸️'],
    bgGradient: 'from-orange-500/5 via-transparent to-purple-500/5',
    accentColor: 'orange',
  },
  christmas: {
    particles: ['❄️', '🎄', '🎁', '⭐', '🔔'],
    bgGradient: 'from-red-500/5 via-transparent to-green-500/5',
    accentColor: 'red',
  },
}

export function HolidayDecorations() {
  const { currentTheme } = useSettings()

  // Only show decorations for holiday themes
  if (!currentTheme.seasonal) return null

  const config = HOLIDAY_DECORATIONS[currentTheme.id]
  if (!config) return null

  return (
    <>
      {/* Background gradient overlay - very subtle */}
      <div
        className={cn(
          'fixed inset-0 pointer-events-none bg-gradient-to-br opacity-30 dark:opacity-20 -z-10',
          config.bgGradient
        )}
      />

      {/* Floating particles - behind content */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-float-slow"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${15 + Math.random() * 10}s`,
              fontSize: `${14 + Math.random() * 12}px`,
              opacity: 0.15,
            }}
          >
            {config.particles[Math.floor(Math.random() * config.particles.length)]}
          </div>
        ))}
      </div>
    </>
  )
}

// Get holiday accent colors for components
export function getHolidayAccent(themeId) {
  const config = HOLIDAY_DECORATIONS[themeId]
  if (!config) return null

  const accents = {
    amber: {
      bg: 'bg-amber-500',
      text: 'text-amber-500',
      border: 'border-amber-500',
      hover: 'hover:bg-amber-600',
      light: 'bg-amber-100 dark:bg-amber-900/30',
    },
    pink: {
      bg: 'bg-pink-500',
      text: 'text-pink-500',
      border: 'border-pink-500',
      hover: 'hover:bg-pink-600',
      light: 'bg-pink-100 dark:bg-pink-900/30',
    },
    green: {
      bg: 'bg-green-500',
      text: 'text-green-500',
      border: 'border-green-500',
      hover: 'hover:bg-green-600',
      light: 'bg-green-100 dark:bg-green-900/30',
    },
    orange: {
      bg: 'bg-orange-500',
      text: 'text-orange-500',
      border: 'border-orange-500',
      hover: 'hover:bg-orange-600',
      light: 'bg-orange-100 dark:bg-orange-900/30',
    },
    red: {
      bg: 'bg-red-500',
      text: 'text-red-500',
      border: 'border-red-500',
      hover: 'hover:bg-red-600',
      light: 'bg-red-100 dark:bg-red-900/30',
    },
  }

  return accents[config.accentColor]
}

// Holiday-themed header bar
export function HolidayHeaderBar() {
  const { currentTheme } = useSettings()

  if (!currentTheme.seasonal) return null

  const config = HOLIDAY_DECORATIONS[currentTheme.id]
  if (!config) return null

  return (
    <div className="h-1 w-full bg-gradient-to-r from-transparent via-current to-transparent opacity-50">
      <div
        className={cn(
          'h-full bg-gradient-to-r',
          currentTheme.id === 'christmas' && 'from-red-500 via-green-500 to-red-500',
          currentTheme.id === 'valentine' && 'from-pink-500 via-rose-500 to-pink-500',
          currentTheme.id === 'stpatricks' && 'from-green-500 via-emerald-500 to-green-500',
          currentTheme.id === 'easter' && 'from-pink-500 via-purple-500 to-pink-500',
          currentTheme.id === 'halloween' && 'from-orange-500 via-purple-500 to-orange-500',
          currentTheme.id === 'newyear' && 'from-amber-500 via-purple-500 to-amber-500'
        )}
      />
    </div>
  )
}
