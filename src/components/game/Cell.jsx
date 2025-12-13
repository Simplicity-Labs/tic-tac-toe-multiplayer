import { X, Circle } from 'lucide-react'
import { cn } from '../../lib/utils'
import { useSettings } from '../../context/SettingsContext'

export function Cell({ value, onClick, disabled, isWinningCell, currentPlayer }) {
  const { currentTheme } = useSettings()
  const isClassic = currentTheme.id === 'classic'

  const renderSymbol = (player, isPreview = false) => {
    const config = player === 'X' ? currentTheme.x : currentTheme.o

    if (isClassic) {
      // Use lucide icons for classic theme
      if (player === 'X') {
        return (
          <X
            className={cn(
              isPreview ? 'w-10 h-10 sm:w-12 sm:h-12' : 'w-12 h-12 sm:w-16 sm:h-16',
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
            isPreview ? 'w-8 h-8 sm:w-10 sm:h-10' : 'w-10 h-10 sm:w-14 sm:h-14',
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
          isPreview ? 'text-3xl sm:text-4xl' : 'text-4xl sm:text-5xl',
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
        'aspect-square w-full flex items-center justify-center',
        'bg-white dark:bg-slate-900 rounded-xl',
        'transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
        !disabled && !value && 'hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer',
        disabled && !value && 'cursor-not-allowed',
        isWinningCell && 'bg-primary-50 dark:bg-primary-900/30 ring-2 ring-primary-500'
      )}
    >
      {value === 'X' && renderSymbol('X')}
      {value === 'O' && renderSymbol('O')}
      {!value && !disabled && (
        <span className="text-slate-300 dark:text-slate-600 opacity-0 hover:opacity-100 transition-opacity">
          {renderSymbol(currentPlayer, true)}
        </span>
      )}
    </button>
  )
}
