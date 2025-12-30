import { useEffect, useState } from 'react'
import { cn } from '../../lib/utils'

const BUBBLE_DURATION = 3000 // How long the bubble stays visible

export function ReactionBubble({ reaction, position = 'left', onComplete }) {
  const [visible, setVisible] = useState(true)
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    // Start exit animation before removing
    const exitTimer = setTimeout(() => {
      setExiting(true)
    }, BUBBLE_DURATION - 300)

    // Remove after animation completes
    const removeTimer = setTimeout(() => {
      setVisible(false)
      onComplete?.()
    }, BUBBLE_DURATION)

    return () => {
      clearTimeout(exitTimer)
      clearTimeout(removeTimer)
    }
  }, [onComplete])

  if (!visible || !reaction) return null

  const isTextReaction = reaction.emoji === 'GG'

  return (
    <div
      className={cn(
        'absolute z-20 pointer-events-none',
        position === 'left' ? 'left-0' : 'right-0',
        '-top-2 -translate-y-full'
      )}
    >
      <div
        className={cn(
          'px-3 py-2 rounded-xl shadow-lg',
          'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700',
          'animate-in zoom-in-50 duration-200',
          exiting && 'animate-out fade-out zoom-out-50 duration-300'
        )}
      >
        <div className="flex items-center gap-2">
          {/* Sender name */}
          {reaction.senderName && (
            <span className="text-xs text-slate-500 font-medium">
              {reaction.senderName}
            </span>
          )}
          {/* Emoji */}
          <span className={cn(
            isTextReaction ? 'text-sm font-bold text-primary-500' : 'text-2xl',
            'animate-bounce-once'
          )}>
            {reaction.emoji}
          </span>
        </div>
      </div>
    </div>
  )
}

// Container for multiple reaction bubbles
export function ReactionBubbleContainer({ reactions, position = 'left', onReactionComplete }) {
  if (!reactions || reactions.length === 0) return null

  // Only show the most recent reaction
  const latestReaction = reactions[reactions.length - 1]

  return (
    <ReactionBubble
      key={latestReaction.id || latestReaction.timestamp}
      reaction={latestReaction}
      position={position}
      onComplete={() => onReactionComplete?.(latestReaction)}
    />
  )
}
