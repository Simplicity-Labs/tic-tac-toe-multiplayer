import { Check } from 'lucide-react'
import { cn } from '../lib/utils'

// Fun avatar options for users to choose from
export const AVATARS = [
  '😀', // Grinning Face
  '😎', // Smiling Face with Sunglasses
  '🤓', // Nerd Face
  '🥳', // Partying Face
  '😺', // Grinning Cat
  '🤖', // Robot
  '👽', // Alien
  '🦄', // Unicorn
  '🐶', // Dog Face
  '🐼', // Panda
  '🦊', // Fox
  '🐸', // Frog
]

export function AvatarPicker({ value, onChange, className }) {
  return (
    <div className={cn('space-y-2', className)}>
      <label className="text-sm font-medium">Choose your avatar</label>
      <div className="grid grid-cols-6 gap-2">
        {AVATARS.map((avatar) => {
          const isSelected = value === avatar
          return (
            <button
              key={avatar}
              type="button"
              onClick={() => onChange(avatar)}
              className={cn(
                'relative aspect-square rounded-lg border-2 transition-all flex items-center justify-center text-2xl hover:scale-110',
                isSelected
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
              )}
            >
              {avatar}
              {isSelected && (
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center">
                  <Check className="h-3 w-3 text-white" />
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
