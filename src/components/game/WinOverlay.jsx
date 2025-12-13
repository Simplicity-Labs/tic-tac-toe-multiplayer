import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trophy, Frown, Handshake, Home, RotateCcw, TreePine, Gift } from 'lucide-react'
import confetti from 'canvas-confetti'
import { cn } from '../../lib/utils'
import { Button } from '../ui/Button'
import { useSettings } from '../../context/SettingsContext'

const OVERLAY_DELAY_MS = 1500

export function WinOverlay({ game, currentUserId, onPlayAgain, playerX, playerO }) {
  const navigate = useNavigate()
  const { currentTheme } = useSettings()
  const [visible, setVisible] = useState(false)

  const isCompleted = game?.status === 'completed'
  const isPlayer = currentUserId === game?.player_x || currentUserId === game?.player_o
  const isWinner = game?.winner === currentUserId
  const isDraw = game?.winner === null
  const isAIWin = game?.winner === 'ai'
  const isSpectator = !isPlayer
  const isChristmas = currentTheme.id === 'christmas'

  // Get winner info for spectators
  const winnerIsX = game?.winner === game?.player_x
  const winnerName = winnerIsX ? playerX?.username : playerO?.username

  // Delay showing the overlay and trigger confetti
  useEffect(() => {
    if (!isCompleted) {
      setVisible(false)
      return
    }

    const timer = setTimeout(() => {
      setVisible(true)

      // Fire confetti on win (not draw or loss)
      if (isWinner || (isSpectator && !isDraw)) {
        if (isChristmas) {
          // Christmas confetti - red and green
          const colors = ['#ef4444', '#22c55e', '#fbbf24', '#ffffff']
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors,
          })
          setTimeout(() => {
            confetti({
              particleCount: 50,
              angle: 60,
              spread: 55,
              origin: { x: 0 },
              colors,
            })
            confetti({
              particleCount: 50,
              angle: 120,
              spread: 55,
              origin: { x: 1 },
              colors,
            })
          }, 200)
        } else {
          // Standard confetti
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          })
          setTimeout(() => {
            confetti({
              particleCount: 50,
              angle: 60,
              spread: 55,
              origin: { x: 0 },
            })
            confetti({
              particleCount: 50,
              angle: 120,
              spread: 55,
              origin: { x: 1 },
            })
          }, 200)
        }
      }
    }, OVERLAY_DELAY_MS)

    return () => clearTimeout(timer)
  }, [isCompleted, isWinner, isSpectator, isDraw, isChristmas])

  if (!isCompleted || !visible) return null

  let title, subtitle, Icon, colorClass

  if (isDraw) {
    title = isChristmas ? "Holiday Draw!" : "It's a Draw!"
    subtitle = isSpectator
      ? "Neither player could claim victory."
      : isChristmas
        ? "A festive tie! Both players played well."
        : "Great match! Neither player could claim victory."
    Icon = isChristmas ? Gift : Handshake
    colorClass = isChristmas ? 'text-amber-500' : 'text-amber-500'
  } else if (isSpectator) {
    title = isChristmas
      ? `${winnerName || (winnerIsX ? 'X' : 'O')} Wins!`
      : `${winnerName || (winnerIsX ? 'X' : 'O')} Wins!`
    subtitle = isChristmas
      ? `A holiday victory for ${winnerIsX ? 'X' : 'O'}!`
      : `${winnerIsX ? 'X' : 'O'} claimed victory in this match.`
    Icon = isChristmas ? TreePine : Trophy
    colorClass = 'text-emerald-500'
  } else if (isWinner) {
    title = isChristmas ? 'Holiday Victory!' : 'Victory!'
    subtitle = isChristmas
      ? 'Ho ho ho! You won the game!'
      : 'Congratulations! You won the game!'
    Icon = isChristmas ? TreePine : Trophy
    colorClass = 'text-emerald-500'
  } else {
    title = isAIWin
      ? (isChristmas ? 'Frosty Wins!' : 'AI Wins!')
      : (isChristmas ? 'Coal for You!' : 'Defeat')
    subtitle = isAIWin
      ? (isChristmas ? 'The AI got a holiday win!' : 'The AI proved unbeatable this time.')
      : (isChristmas ? 'Better luck next Christmas!' : 'Better luck next time!')
    Icon = Frown
    colorClass = 'text-rose-500'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in">
      {/* Backdrop */}
      <div className={cn(
        "absolute inset-0 backdrop-blur-sm",
        isChristmas ? "bg-black/60" : "bg-black/50"
      )} />

      {/* Snowflakes for Christmas */}
      {isChristmas && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute text-white/40 animate-fall"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 2}s`,
                fontSize: `${10 + Math.random() * 15}px`,
              }}
            >
              *
            </div>
          ))}
        </div>
      )}

      {/* Content */}
      <div className={cn(
        "relative rounded-2xl shadow-2xl p-8 mx-4 max-w-md w-full animate-bounce-in",
        isChristmas
          ? "bg-gradient-to-b from-slate-900 to-slate-800 border-2 border-red-500/30"
          : "bg-white dark:bg-slate-900"
      )}>
        {/* Christmas decorations */}
        {isChristmas && (
          <>
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-2xl">
              *
            </div>
            <div className="absolute top-2 left-4 text-red-500 text-lg">*</div>
            <div className="absolute top-2 right-4 text-green-500 text-lg">*</div>
          </>
        )}

        {/* Icon */}
        <div className={cn(
          'mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-6',
          isDraw ? 'bg-amber-100 dark:bg-amber-900/30' :
          isWinner || (isSpectator && !isDraw)
            ? (isChristmas ? 'bg-green-900/50 border-2 border-green-500/50' : 'bg-emerald-100 dark:bg-emerald-900/30')
            : 'bg-rose-100 dark:bg-rose-900/30'
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
        <p className={cn(
          "text-center mb-8",
          isChristmas ? "text-slate-300" : "text-slate-600 dark:text-slate-400"
        )}>
          {subtitle}
        </p>

        {/* Stats */}
        <div className="flex justify-center gap-8 mb-8">
          <div className="text-center">
            <div className={cn(
              "text-2xl font-bold",
              isChristmas ? "text-green-400" : "text-primary-500"
            )}>
              {game.board.filter(c => c === 'X').length}
            </div>
            <div className={cn(
              "text-xs uppercase",
              isChristmas ? "text-slate-400" : "text-slate-500"
            )}>
              {isChristmas ? currentTheme.x.symbol : 'X'} Moves
            </div>
          </div>
          <div className="text-center">
            <div className={cn(
              "text-2xl font-bold",
              isChristmas ? "text-red-400" : "text-rose-500"
            )}>
              {game.board.filter(c => c === 'O').length}
            </div>
            <div className={cn(
              "text-xs uppercase",
              isChristmas ? "text-slate-400" : "text-slate-500"
            )}>
              {isChristmas ? currentTheme.o.symbol : 'O'} Moves
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            className={cn(
              "flex-1",
              isChristmas && "border-slate-600 hover:bg-slate-700"
            )}
            onClick={() => navigate('/')}
          >
            <Home className="w-4 h-4 mr-2" />
            Dashboard
          </Button>
          {game.is_ai_game && onPlayAgain && (
            <Button
              className={cn(
                "flex-1",
                isChristmas && "bg-red-600 hover:bg-red-700"
              )}
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
