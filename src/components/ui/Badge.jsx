import { cva } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary-500 text-white',
        secondary:
          'border-transparent bg-slate-100 text-slate-900 dark:bg-slate-700 dark:text-slate-100',
        destructive:
          'border-transparent bg-rose-500 text-white',
        success:
          'border-transparent bg-emerald-500 text-white',
        warning:
          'border-transparent bg-amber-500 text-white',
        outline:
          'text-slate-700 border-slate-200 dark:text-slate-300 dark:border-slate-700',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

function Badge({ className, variant, ...props }) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
