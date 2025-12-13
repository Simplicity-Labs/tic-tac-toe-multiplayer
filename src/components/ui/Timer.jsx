import { cn } from '../../lib/utils'

export function Timer({ timeRemaining, isLow, percentage, className }) {
  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <div className="relative h-20 w-20">
        {/* Background circle */}
        <svg className="h-20 w-20 -rotate-90 transform">
          <circle
            cx="40"
            cy="40"
            r="36"
            stroke="currentColor"
            strokeWidth="6"
            fill="none"
            className="text-slate-200 dark:text-slate-700"
          />
          {/* Progress circle */}
          <circle
            cx="40"
            cy="40"
            r="36"
            stroke="currentColor"
            strokeWidth="6"
            fill="none"
            strokeDasharray={226.2}
            strokeDashoffset={226.2 * (1 - percentage / 100)}
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
              'text-2xl font-bold tabular-nums',
              isLow && 'text-rose-500 animate-pulse'
            )}
          >
            {timeRemaining}
          </span>
        </div>
      </div>
      <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
        seconds
      </span>
    </div>
  )
}
