import { useState, useEffect, useRef } from 'react'
import { X, Circle } from 'lucide-react'
import { cn } from '../../lib/utils'
import { useSettings, SYMBOL_THEMES } from '../../context/SettingsContext'
import { useSound, SOUND_NAMES } from '../../hooks/useSound'
import { BLOCKER_MARKER } from '../../lib/gameLogic'

export function Cell({
  value,
  onClick,
  onHover,
  disabled,
  isWinningCell,
  currentPlayer,
  boardSize = 3,
  decayStatus,
  isGravityPreview,
  isGravityMode,
  index = 0,
  isBombed = false,
  isFogged = false,
}) {
  const { currentTheme } = useSettings()
  const { playSound } = useSound()

  // Use Connect 4 theme automatically for 7x6 board, otherwise use user's selected theme
  const effectiveTheme = boardSize === 7 ? SYMBOL_THEMES.connect4 : currentTheme
  const isClassic = effectiveTheme.id === 'classic'

  // Track when a piece is newly placed to trigger animation
  const [animationKey, setAnimationKey] = useState(0)
  const prevValueRef = useRef(value)

  useEffect(() => {
    // If value changed from null/undefined to X or O, trigger animation and sound
    if (!prevValueRef.current && value) {
      setAnimationKey(k => k + 1)
      // Play appropriate sound for the game mode
      playSound(isGravityMode ? SOUND_NAMES.DROP : SOUND_NAMES.PLACE)
    }
    prevValueRef.current = value
  }, [value, isGravityMode, playSound])

  // Calculate row for gravity animation (how far to fall from top)
  const cols = boardSize === 7 ? 7 : boardSize
  const row = Math.floor(index / cols)

  // Decay mode visual properties
  const hasDecay = decayStatus && decayStatus.turnsRemaining !== null
  const decayOpacity = hasDecay ? decayStatus.opacity : 1
  const isAboutToDecay = hasDecay && decayStatus.isAboutToDecay

  // Check if cell has a blocker
  const isBlocker = value === BLOCKER_MARKER

  // Adjust sizes based on board size
  const getSizeClasses = (isPreview = false) => {
    if (isPreview) {
      return {
        x: boardSize >= 7 ? 'w-5 h-5 sm:w-6 sm:h-6' : boardSize >= 5 ? 'w-6 h-6 sm:w-8 sm:h-8' : boardSize === 4 ? 'w-8 h-8 sm:w-10 sm:h-10' : 'w-10 h-10 sm:w-12 sm:h-12',
        o: boardSize >= 7 ? 'w-4 h-4 sm:w-5 sm:h-5' : boardSize >= 5 ? 'w-5 h-5 sm:w-7 sm:h-7' : boardSize === 4 ? 'w-6 h-6 sm:w-8 sm:h-8' : 'w-8 h-8 sm:w-10 sm:h-10',
        emoji: boardSize >= 7 ? 'text-lg sm:text-xl' : boardSize >= 5 ? 'text-xl sm:text-2xl' : boardSize === 4 ? 'text-2xl sm:text-3xl' : 'text-3xl sm:text-4xl',
      }
    }
    return {
      x: boardSize >= 7 ? 'w-6 h-6 sm:w-8 sm:h-8' : boardSize >= 5 ? 'w-8 h-8 sm:w-10 sm:h-10' : boardSize === 4 ? 'w-10 h-10 sm:w-12 sm:h-12' : 'w-12 h-12 sm:w-16 sm:h-16',
      o: boardSize >= 7 ? 'w-5 h-5 sm:w-7 sm:h-7' : boardSize >= 5 ? 'w-7 h-7 sm:w-9 sm:h-9' : boardSize === 4 ? 'w-8 h-8 sm:w-10 sm:h-10' : 'w-10 h-10 sm:w-14 sm:h-14',
      emoji: boardSize >= 7 ? 'text-xl sm:text-2xl' : boardSize >= 5 ? 'text-2xl sm:text-3xl' : boardSize === 4 ? 'text-3xl sm:text-4xl' : 'text-4xl sm:text-5xl',
    }
  }

  const renderSymbol = (player, isPreview = false) => {
    const config = player === 'X' ? effectiveTheme.x : effectiveTheme.o
    const sizes = getSizeClasses(isPreview)

    if (isClassic) {
      // Use lucide icons for classic theme
      if (player === 'X') {
        return (
          <X
            className={cn(
              sizes.x,
              isPreview ? '' : isWinningCell ? config.winColor : config.color
            )}
            strokeWidth={isPreview ? 2 : 3}
          />
        )
      }
      return (
        <Circle
          className={cn(
            sizes.o,
            isPreview ? '' : isWinningCell ? config.winColor : config.color
          )}
          strokeWidth={isPreview ? 2 : 3}
        />
      )
    }

    // Connect 4 disc theme - render colored filled circles
    if (config.isDisc) {
      return (
        <span
          className={cn(
            sizes.emoji,
            isPreview ? 'opacity-40' : '',
            isPreview ? config.color : isWinningCell ? config.winColor : config.color
          )}
          style={{ textShadow: !isPreview ? '0 2px 4px rgba(0,0,0,0.2)' : 'none' }}
        >
          {config.symbol}
        </span>
      )
    }

    // Emoji themes
    return (
      <span className={sizes.emoji}>
        {config.symbol}
      </span>
    )
  }

  // In gravity mode, show preview only on the landing cell
  // Don't show preview on bombed or blocked cells
  const showHoverPreview = !isBombed && !isBlocker && !isFogged && (
    isGravityMode
      ? isGravityPreview && !value
      : !value && !disabled
  )

  return (
    <button
      onClick={onClick}
      onMouseEnter={onHover}
      disabled={(disabled && !isGravityMode) || isBombed || isBlocker}
      className={cn(
        'aspect-square w-full flex items-center justify-center relative group',
        'bg-white dark:bg-slate-900 rounded-xl overflow-visible',
        'transition-all duration-200',
        'focus:outline-none',
        // Bombed cell styling
        isBombed && 'bg-rose-100 dark:bg-rose-900/30 cursor-not-allowed',
        // Blocker cell styling
        isBlocker && 'bg-amber-100 dark:bg-amber-900/30 cursor-not-allowed',
        // Fog of war styling
        isFogged && 'bg-slate-300 dark:bg-slate-700 cursor-pointer',
        // Normal hover for non-gravity mode
        !isBombed && !isBlocker && !isFogged && !isGravityMode && !disabled && !value && 'hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer',
        // Gravity mode - all cells in column are clickable
        !isBombed && !isBlocker && !isFogged && isGravityMode && !disabled && 'cursor-pointer',
        !isBombed && !isBlocker && !isFogged && isGravityMode && isGravityPreview && !value && 'bg-slate-50 dark:bg-slate-800',
        !isBombed && !isBlocker && !isFogged && disabled && !value && !isGravityMode && 'cursor-not-allowed',
        isWinningCell && 'bg-primary-50 dark:bg-primary-900/30 ring-2 ring-primary-500',
        isAboutToDecay && !isWinningCell && 'animate-pulse ring-2 ring-amber-400'
      )}
    >
      {/* Bombed cell indicator */}
      {isBombed && (
        <div className="flex items-center justify-center">
          <span className="text-2xl sm:text-3xl animate-pulse">💣</span>
        </div>
      )}

      {/* Blocker cell indicator */}
      {isBlocker && (
        <div className="flex items-center justify-center cell-enter">
          <span className="text-2xl sm:text-3xl">🚧</span>
        </div>
      )}

      {/* Fog of war overlay - shows on all fogged cells including hidden opponent pieces */}
      {isFogged && (
        <div className="flex items-center justify-center">
          <span className="text-2xl sm:text-3xl opacity-60">🌫️</span>
        </div>
      )}

      {/* Main symbol with decay opacity (hidden if fogged and not player's piece) */}
      {value && !isBlocker && !isFogged && (
        <div
          key={`${value}-${animationKey}`}
          style={{
            opacity: decayOpacity,
            // For gravity mode, set CSS variable for dynamic fall distance from top
            ...(isGravityMode && { '--fall-distance': `${(row + 1) * -70}px` })
          }}
          className={cn(
            "transition-opacity duration-300",
            isGravityMode ? "cell-fall" : "cell-enter"
          )}
        >
          {renderSymbol(value)}
        </div>
      )}

      {/* Decay turns remaining indicator */}
      {hasDecay && value && !isBlocker && !isFogged && (
        <span
          className={cn(
            'absolute top-1 right-1 text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center',
            isAboutToDecay
              ? 'bg-amber-500 text-white'
              : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
          )}
        >
          {decayStatus.turnsRemaining}
        </span>
      )}

      {/* Hover preview - gravity mode shows on landing cell, classic shows on hovered cell */}
      {showHoverPreview && (
        <span className={cn(
          "absolute inset-0 flex items-center justify-center text-slate-300 dark:text-slate-600 transition-opacity",
          isGravityMode ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        )}>
          {renderSymbol(currentPlayer, true)}
        </span>
      )}
    </button>
  )
}
