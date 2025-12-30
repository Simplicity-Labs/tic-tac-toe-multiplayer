import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X } from 'lucide-react'
import { cn } from '../../lib/utils'

const REACTIONS = [
  { emoji: '👍', label: 'Nice' },
  { emoji: '😄', label: 'Happy' },
  { emoji: '😢', label: 'Sad' },
  { emoji: '😤', label: 'Frustrated' },
  { emoji: '🎉', label: 'Celebrate' },
  { emoji: '👏', label: 'Well played' },
  { emoji: '🤔', label: 'Thinking' },
  { emoji: '😱', label: 'Shocked' },
  { emoji: '🔥', label: 'Fire' },
  { emoji: 'GG', label: 'Good game', isText: true },
]

export function ReactionPicker({ onReact, disabled, canSend = true, cooldownRemaining = 0 }) {
  const [isOpen, setIsOpen] = useState(false)
  const pickerRef = useRef(null)

  // Close picker when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleReact = (reaction) => {
    if (!canSend || disabled) return
    onReact(reaction.emoji)
    setIsOpen(false)
  }

  return (
    <div ref={pickerRef} className="relative">
      {/* Emoji Grid Popup */}
      {isOpen && (
        <div className="fixed bottom-20 left-4 animate-in fade-in slide-in-from-bottom-2 duration-200 z-40">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-3">
            <div className="grid grid-cols-5 gap-1.5">
              {REACTIONS.map((reaction) => (
                <button
                  key={reaction.emoji}
                  onClick={() => handleReact(reaction)}
                  disabled={!canSend || disabled}
                  className={cn(
                    'w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center',
                    'bg-slate-100 dark:bg-slate-800',
                    'transition-all hover:scale-110 hover:bg-slate-200 dark:hover:bg-slate-700',
                    'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
                    reaction.isText ? 'text-xs sm:text-sm font-bold text-primary-500' : 'text-xl sm:text-2xl'
                  )}
                  title={reaction.label}
                >
                  {reaction.emoji}
                </button>
              ))}
            </div>
            {!canSend && cooldownRemaining > 0 && (
              <div className="text-xs text-center text-slate-500 mt-1 pt-1 border-t border-slate-200 dark:border-slate-700">
                Wait {Math.ceil(cooldownRemaining / 1000)}s
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'w-12 h-12 rounded-full shadow-lg flex items-center justify-center',
          'transition-all hover:scale-105 active:scale-95',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          isOpen
            ? 'bg-slate-200 dark:bg-slate-700'
            : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
        )}
      >
        {isOpen ? (
          <X className="h-5 w-5 text-slate-500" />
        ) : (
          <MessageCircle className="h-5 w-5 text-slate-500" />
        )}
      </button>
    </div>
  )
}

export { REACTIONS }
