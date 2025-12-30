import { cn } from '../../lib/utils'

export function Timer({ timeRemaining, formattedTime, isLow, percentage, className }) {
  // Use formattedTime if provided, otherwise fall back to timeRemaining
  const displayTime = formattedTime || timeRemaining
  // Smaller text for longer formatted times
  const isLongFormat = displayTime && displayTime.toString().length > 3

  return (
    <div className={cn('flex flex-col items-center gap-1', className)}>
      <div className="relative h-12 w-12 sm:h-16 sm:w-16">
        {/* Background circle */}
        <svg className="h-12 w-12 sm:h-16 sm:w-16 -rotate-90 transform" viewBox="0 0 64 64">
          <circle
            cx="32"
            cy="32"
            r="28"
            stroke="currentColor"
            strokeWidth="5"
            fill="none"
            className="text-slate-200 dark:text-slate-700"
          />
          {/* Progress circle */}
          <circle
            cx="32"
            cy="32"
            r="28"
            stroke="currentColor"
            strokeWidth="5"
            fill="none"
            strokeDasharray={175.9}
            strokeDashoffset={175.9 * (1 - percentage / 100)}
            strokeLinecap="round"
            className={cn(
              'transition-all duration-1000',
              isLow ? 'text-rose-500' : 'text-primary-500'
            )}
          />
        </svg>
        {/* Time display */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={cn(
              'font-bold tabular-nums',
              isLongFormat ? 'text-[10px] sm:text-xs' : 'text-lg sm:text-xl',
              isLow && 'text-rose-500 animate-pulse'
            )}
          >
            {displayTime}
          </span>
        </div>
      </div>
    </div>
  )
}
