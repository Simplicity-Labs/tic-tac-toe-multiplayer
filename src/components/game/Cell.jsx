import { X, Circle } from 'lucide-react'
import { cn } from '../../lib/utils'

export function Cell({ value, onClick, disabled, isWinningCell, currentPlayer }) {
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
      {value === 'X' && (
        <X
          className={cn(
            'w-12 h-12 sm:w-16 sm:h-16 text-primary-500 cell-enter',
            isWinningCell && 'text-primary-600'
          )}
          strokeWidth={3}
        />
      )}
      {value === 'O' && (
        <Circle
          className={cn(
            'w-10 h-10 sm:w-14 sm:h-14 text-rose-500 cell-enter',
            isWinningCell && 'text-rose-600'
          )}
          strokeWidth={3}
        />
      )}
      {!value && !disabled && (
        <span className="text-slate-300 dark:text-slate-600 opacity-0 hover:opacity-100 transition-opacity">
          {currentPlayer === 'X' ? (
            <X className="w-10 h-10 sm:w-12 sm:h-12" strokeWidth={2} />
          ) : (
            <Circle className="w-8 h-8 sm:w-10 sm:h-10" strokeWidth={2} />
          )}
        </span>
      )}
    </button>
  )
}
