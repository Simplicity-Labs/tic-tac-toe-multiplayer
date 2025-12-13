import { useNavigate } from 'react-router-dom'
import { Trophy, Frown, Handshake, Home, RotateCcw } from 'lucide-react'
import { cn } from '../../lib/utils'
import { Button } from '../ui/Button'

export function WinOverlay({ game, currentUserId, onPlayAgain }) {
  const navigate = useNavigate()

  if (game?.status !== 'completed') return null

  const isWinner = game.winner === currentUserId
  const isDraw = game.winner === null
  const isAIWin = game.winner === 'ai'

  let title, subtitle, Icon, colorClass

  if (isDraw) {
    title = "It's a Draw!"
    subtitle = "Great match! Neither player could claim victory."
    Icon = Handshake
    colorClass = 'text-amber-500'
  } else if (isWinner) {
    title = 'Victory!'
    subtitle = 'Congratulations! You won the game!'
    Icon = Trophy
    colorClass = 'text-emerald-500'
  } else {
    title = isAIWin ? 'AI Wins!' : 'Defeat'
    subtitle = isAIWin
      ? 'The AI proved unbeatable this time.'
      : 'Better luck next time!'
    Icon = Frown
    colorClass = 'text-rose-500'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Content */}
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-8 mx-4 max-w-md w-full animate-bounce-in">
        {/* Icon */}
        <div className={cn(
          'mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-6',
          isDraw ? 'bg-amber-100 dark:bg-amber-900/30' :
          isWinner ? 'bg-emerald-100 dark:bg-emerald-900/30' :
          'bg-rose-100 dark:bg-rose-900/30'
        )}>
          <Icon className={cn('w-10 h-10', colorClass)} />
        </div>

        {/* Text */}
        <h2 className={cn(
          'text-3xl font-bold text-center mb-2',
          colorClass
        )}>
          {title}
        </h2>
        <p className="text-center text-slate-600 dark:text-slate-400 mb-8">
          {subtitle}
        </p>

        {/* Stats */}
        <div className="flex justify-center gap-8 mb-8">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-500">
              {game.board.filter(c => c === 'X').length}
            </div>
            <div className="text-xs text-slate-500 uppercase">X Moves</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-rose-500">
              {game.board.filter(c => c === 'O').length}
            </div>
            <div className="text-xs text-slate-500 uppercase">O Moves</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => navigate('/')}
          >
            <Home className="w-4 h-4 mr-2" />
            Dashboard
          </Button>
          {game.is_ai_game && onPlayAgain && (
            <Button
              className="flex-1"
              onClick={onPlayAgain}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Play Again
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
