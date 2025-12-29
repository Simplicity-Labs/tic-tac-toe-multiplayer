import { useEffect, useState } from 'react'
import { X, Gamepad2, Check, Loader2, Grid3X3 } from 'lucide-react'
import { Button } from './ui/Button'
import { Badge } from './ui/Badge'
import { BOARD_SIZES } from '../lib/gameLogic'

const INVITE_TIMEOUT = 30000 // 30 seconds

export function InviteNotification({ invite, onAccept, onDecline }) {
  const boardSize = invite?.boardSize || 3
  const boardConfig = BOARD_SIZES[boardSize] || BOARD_SIZES[3]
  const [timeLeft, setTimeLeft] = useState(30)
  const [isAccepting, setIsAccepting] = useState(false)

  useEffect(() => {
    if (!invite) {
      setTimeLeft(30)
      setIsAccepting(false)
      return
    }

    const elapsed = Date.now() - invite.receivedAt
    const remaining = Math.max(0, Math.ceil((INVITE_TIMEOUT - elapsed) / 1000))
    setTimeLeft(remaining)

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [invite])

  if (!invite) return null

  const handleAccept = async () => {
    setIsAccepting(true)
    await onAccept()
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 p-4 w-80">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <Gamepad2 className="h-5 w-5 text-primary-500" />
            </div>
            <div>
              <p className="font-semibold text-sm">Game Invite</p>
              <p className="text-xs text-slate-500">Expires in {timeLeft}s</p>
            </div>
          </div>
          <button
            onClick={onDecline}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Invite content */}
        <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50">
          <div className="h-12 w-12 flex items-center justify-center text-3xl">
            {invite.from.avatar || '😀'}
          </div>
          <div>
            <p className="font-semibold">{invite.from.username}</p>
            <p className="text-sm text-slate-500">wants to play Tic Tac Toe!</p>
            <Badge variant="outline" className="mt-1 gap-1">
              <Grid3X3 className="h-3 w-3" />
              {boardConfig.label}
            </Badge>
          </div>
        </div>

        {/* Timer bar */}
        <div className="h-1 bg-slate-200 dark:bg-slate-700 rounded-full mb-4 overflow-hidden">
          <div
            className="h-full bg-primary-500 transition-all duration-1000 ease-linear"
            style={{ width: `${(timeLeft / 30) * 100}%` }}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onDecline}
            disabled={isAccepting}
          >
            Decline
          </Button>
          <Button
            variant="success"
            className="flex-1"
            onClick={handleAccept}
            disabled={isAccepting}
          >
            {isAccepting ? (
              <>
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                Joining...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-1" />
                Accept
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
