import { X, Circle } from 'lucide-react'
import { cn } from '../../lib/utils'
import { useSettings } from '../../context/SettingsContext'

export function Cell({ value, onClick, disabled, isWinningCell, currentPlayer, boardSize = 3, decayStatus }) {
  const { currentTheme } = useSettings()
  const isClassic = currentTheme.id === 'classic'

  // Decay mode visual properties
  const hasDecay = decayStatus && decayStatus.turnsRemaining !== null
  const decayOpacity = hasDecay ? decayStatus.opacity : 1
  const isAboutToDecay = hasDecay && decayStatus.isAboutToDecay

  // Adjust sizes based on board size
  const getSizeClasses = (isPreview = false) => {
    if (isPreview) {
      return {
        x: boardSize >= 5 ? 'w-6 h-6 sm:w-8 sm:h-8' : boardSize === 4 ? 'w-8 h-8 sm:w-10 sm:h-10' : 'w-10 h-10 sm:w-12 sm:h-12',
        o: boardSize >= 5 ? 'w-5 h-5 sm:w-7 sm:h-7' : boardSize === 4 ? 'w-6 h-6 sm:w-8 sm:h-8' : 'w-8 h-8 sm:w-10 sm:h-10',
        emoji: boardSize >= 5 ? 'text-xl sm:text-2xl' : boardSize === 4 ? 'text-2xl sm:text-3xl' : 'text-3xl sm:text-4xl',
      }
    }
    return {
      x: boardSize >= 5 ? 'w-8 h-8 sm:w-10 sm:h-10' : boardSize === 4 ? 'w-10 h-10 sm:w-12 sm:h-12' : 'w-12 h-12 sm:w-16 sm:h-16',
      o: boardSize >= 5 ? 'w-7 h-7 sm:w-9 sm:h-9' : boardSize === 4 ? 'w-8 h-8 sm:w-10 sm:h-10' : 'w-10 h-10 sm:w-14 sm:h-14',
      emoji: boardSize >= 5 ? 'text-2xl sm:text-3xl' : boardSize === 4 ? 'text-3xl sm:text-4xl' : 'text-4xl sm:text-5xl',
    }
  }

  const renderSymbol = (player, isPreview = false) => {
    const config = player === 'X' ? currentTheme.x : currentTheme.o
    const sizes = getSizeClasses(isPreview)

    if (isClassic) {
      // Use lucide icons for classic theme
      if (player === 'X') {
        return (
          <X
            className={cn(
              sizes.x,
              isPreview ? '' : 'cell-enter',
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
            isPreview ? '' : 'cell-enter',
            isPreview ? '' : isWinningCell ? config.winColor : config.color
          )}
          strokeWidth={isPreview ? 2 : 3}
        />
      )
    }

    // Emoji themes
    return (
      <span
        className={cn(
          sizes.emoji,
          !isPreview && 'cell-enter'
        )}
      >
        {config.symbol}
      </span>
    )
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'aspect-square w-full flex items-center justify-center relative group',
        'bg-white dark:bg-slate-900 rounded-xl',
        'transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
        !disabled && !value && 'hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer',
        disabled && !value && 'cursor-not-allowed',
        isWinningCell && 'bg-primary-50 dark:bg-primary-900/30 ring-2 ring-primary-500',
        isAboutToDecay && !isWinningCell && 'animate-pulse ring-2 ring-amber-400'
      )}
    >
      {/* Main symbol with decay opacity */}
      <div style={{ opacity: decayOpacity }} className="transition-opacity duration-300">
        {value === 'X' && renderSymbol('X')}
        {value === 'O' && renderSymbol('O')}
      </div>

      {/* Decay turns remaining indicator */}
      {hasDecay && value && (
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

      {/* Hover preview for empty cells */}
      {!value && !disabled && (
        <span className="absolute inset-0 flex items-center justify-center text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
          {renderSymbol(currentPlayer, true)}
        </span>
      )}
    </button>
  )
}
