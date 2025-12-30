import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trophy, Frown, Handshake, Home, RotateCcw, TreePine, Gift, Heart, Clover, Egg, Ghost, Eye, X } from 'lucide-react'
import confetti from 'canvas-confetti'
import { cn } from '../../lib/utils'
import { Button } from '../ui/Button'
import { useSettings } from '../../context/SettingsContext'

const OVERLAY_DELAY_MS = 1200

// Holiday-specific configurations
const HOLIDAY_CONFIG = {
  newyear: {
    confettiColors: ['#fbbf24', '#a855f7', '#3b82f6', '#ffffff'],
    WinIcon: Trophy,
    DrawIcon: Gift,
    bgGradient: 'bg-gradient-to-b from-slate-900 to-purple-900',
    borderColor: 'border-amber-500/30',
    winTitle: 'New Year Victory!',
    drawTitle: 'New Year Draw!',
    lossTitle: 'Better Luck This Year!',
    winSubtitle: 'Starting the year with a win!',
    drawSubtitle: 'A tie to start the new year!',
    lossSubtitle: 'The new year brings new chances!',
    accentColor: 'text-amber-400',
    secondaryColor: 'text-purple-400',
  },
  valentine: {
    confettiColors: ['#ec4899', '#f43f5e', '#ffffff', '#fda4af'],
    WinIcon: Heart,
    DrawIcon: Heart,
    bgGradient: 'bg-gradient-to-b from-slate-900 to-pink-900',
    borderColor: 'border-pink-500/30',
    winTitle: 'Love Wins!',
    drawTitle: 'Lovely Draw!',
    lossTitle: 'Heartbreak!',
    winSubtitle: 'Your heart is victorious!',
    drawSubtitle: 'Love shared by both players!',
    lossSubtitle: "Don't lose heart, try again!",
    accentColor: 'text-pink-400',
    secondaryColor: 'text-rose-400',
  },
  stpatricks: {
    confettiColors: ['#22c55e', '#16a34a', '#fbbf24', '#ffffff'],
    WinIcon: Clover,
    DrawIcon: Clover,
    bgGradient: 'bg-gradient-to-b from-slate-900 to-green-900',
    borderColor: 'border-green-500/30',
    winTitle: 'Lucky Victory!',
    drawTitle: 'Lucky Draw!',
    lossTitle: 'Out of Luck!',
    winSubtitle: "The luck o' the Irish is with you!",
    drawSubtitle: 'Luck shared all around!',
    lossSubtitle: 'Find your lucky charm!',
    accentColor: 'text-green-400',
    secondaryColor: 'text-emerald-400',
  },
  easter: {
    confettiColors: ['#f472b6', '#a78bfa', '#fcd34d', '#86efac'],
    WinIcon: Egg,
    DrawIcon: Egg,
    bgGradient: 'bg-gradient-to-b from-slate-900 to-pink-900',
    borderColor: 'border-pink-500/30',
    winTitle: 'Egg-cellent Victory!',
    drawTitle: 'Egg-citing Draw!',
    lossTitle: 'Cracked!',
    winSubtitle: 'You found the golden egg!',
    drawSubtitle: 'A basket full of ties!',
    lossSubtitle: 'Hop back and try again!',
    accentColor: 'text-pink-400',
    secondaryColor: 'text-purple-400',
  },
  halloween: {
    confettiColors: ['#f97316', '#a855f7', '#000000', '#ffffff'],
    WinIcon: Ghost,
    DrawIcon: Ghost,
    bgGradient: 'bg-gradient-to-b from-slate-900 to-orange-900',
    borderColor: 'border-orange-500/30',
    winTitle: 'Spooky Victory!',
    drawTitle: 'Ghostly Draw!',
    lossTitle: 'Spooked!',
    winSubtitle: 'You scared off the competition!',
    drawSubtitle: 'A haunted tie!',
    lossSubtitle: 'Boo! Better luck next time!',
    accentColor: 'text-orange-400',
    secondaryColor: 'text-purple-400',
  },
  christmas: {
    confettiColors: ['#ef4444', '#22c55e', '#fbbf24', '#ffffff'],
    WinIcon: TreePine,
    DrawIcon: Gift,
    bgGradient: 'bg-gradient-to-b from-slate-900 to-slate-800',
    borderColor: 'border-red-500/30',
    winTitle: 'Holiday Victory!',
    drawTitle: 'Holiday Draw!',
    lossTitle: 'Coal for You!',
    winSubtitle: 'Ho ho ho! You won the game!',
    drawSubtitle: 'A festive tie! Both played well.',
    lossSubtitle: 'Better luck next Christmas!',
    accentColor: 'text-green-400',
    secondaryColor: 'text-red-400',
  },
}

export function WinOverlay({ game, currentUserId, onPlayAgain, playerX, playerO }) {
  const navigate = useNavigate()
  const { currentTheme, isHolidaySeason, currentHolidayTheme } = useSettings()
  const [visible, setVisible] = useState(false)
  const [viewingBoard, setViewingBoard] = useState(false)

  const isCompleted = game?.status === 'completed'
  const isPlayer = currentUserId === game?.player_x || currentUserId === game?.player_o
  const isWinner = game?.winner === currentUserId
  const isDraw = game?.winner === null
  const isAIWin = game?.winner === 'ai'
  const isSpectator = !isPlayer

  // Check if current theme is a holiday theme
  const isHolidayTheme = currentTheme.seasonal
  const holidayConfig = isHolidayTheme ? HOLIDAY_CONFIG[currentTheme.id] : null

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
        const colors = holidayConfig?.confettiColors
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          ...(colors && { colors }),
        })
        setTimeout(() => {
          confetti({
            particleCount: 50,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            ...(colors && { colors }),
          })
          confetti({
            particleCount: 50,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            ...(colors && { colors }),
          })
        }, 200)
      }
    }, OVERLAY_DELAY_MS)

    return () => clearTimeout(timer)
  }, [isCompleted, isWinner, isSpectator, isDraw, holidayConfig])

  if (!isCompleted || !visible) return null

  // When viewing board, show a floating button to bring overlay back
  if (viewingBoard) {
    return (
      <button
        onClick={() => setViewingBoard(false)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-slate-900/90 hover:bg-slate-800 text-white rounded-full shadow-lg transition-all hover:scale-105"
      >
        <X className="w-4 h-4" />
        <span className="text-sm font-medium">Show Results</span>
      </button>
    )
  }

  let title, subtitle, Icon, colorClass

  if (isDraw) {
    title = holidayConfig ? holidayConfig.drawTitle : "It's a Draw!"
    subtitle = isSpectator
      ? "Neither player could claim victory."
      : holidayConfig
        ? holidayConfig.drawSubtitle
        : "Great match! Neither player could claim victory."
    Icon = holidayConfig ? holidayConfig.DrawIcon : Handshake
    colorClass = 'text-amber-500'
  } else if (isSpectator) {
    title = `${winnerName || (winnerIsX ? 'X' : 'O')} Wins!`
    subtitle = holidayConfig
      ? `A ${currentTheme.name.toLowerCase()} victory for ${winnerIsX ? 'X' : 'O'}!`
      : `${winnerIsX ? 'X' : 'O'} claimed victory in this match.`
    Icon = holidayConfig ? holidayConfig.WinIcon : Trophy
    colorClass = 'text-emerald-500'
  } else if (isWinner) {
    title = holidayConfig ? holidayConfig.winTitle : 'Victory!'
    subtitle = holidayConfig
      ? holidayConfig.winSubtitle
      : 'Congratulations! You won the game!'
    Icon = holidayConfig ? holidayConfig.WinIcon : Trophy
    colorClass = 'text-emerald-500'
  } else {
    title = isAIWin
      ? (holidayConfig ? `Bot ${currentTheme.name} Win!` : 'Bot Wins!')
      : (holidayConfig ? holidayConfig.lossTitle : 'Defeat')
    subtitle = isAIWin
      ? (holidayConfig ? `The Bot got a ${currentTheme.name.toLowerCase()} win!` : 'The Bot proved unbeatable this time.')
      : (holidayConfig ? holidayConfig.lossSubtitle : 'Better luck next time!')
    Icon = Frown
    colorClass = 'text-rose-500'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in !mt-0">
      {/* Backdrop */}
      <div className={cn(
        "absolute inset-0 backdrop-blur-sm",
        holidayConfig ? "bg-black/60" : "bg-black/50"
      )} />

      {/* Floating particles for holiday themes */}
      {holidayConfig && (
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
              {currentTheme.x.symbol}
            </div>
          ))}
        </div>
      )}

      {/* Content */}
      <div className={cn(
        "relative rounded-2xl shadow-2xl p-8 mx-4 max-w-md w-full animate-bounce-in",
        holidayConfig
          ? `${holidayConfig.bgGradient} border-2 ${holidayConfig.borderColor}`
          : "bg-white dark:bg-slate-900"
      )}>
        {/* Holiday decorations */}
        {holidayConfig && (
          <>
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-2xl">
              {currentTheme.x.symbol}
            </div>
            <div className={cn("absolute top-2 left-4 text-lg", holidayConfig.accentColor)}>
              {currentTheme.o.symbol}
            </div>
            <div className={cn("absolute top-2 right-4 text-lg", holidayConfig.secondaryColor)}>
              {currentTheme.x.symbol}
            </div>
          </>
        )}

        {/* Icon */}
        <div className={cn(
          'mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-6',
          isDraw ? 'bg-amber-100 dark:bg-amber-900/30' :
          isWinner || (isSpectator && !isDraw)
            ? (holidayConfig ? 'bg-emerald-900/50 border-2 border-emerald-500/50' : 'bg-emerald-100 dark:bg-emerald-900/30')
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
          holidayConfig ? "text-slate-300" : "text-slate-600 dark:text-slate-400"
        )}>
          {subtitle}
        </p>

        {/* Stats */}
        <div className="flex justify-center gap-8 mb-8">
          <div className="text-center">
            <div className={cn(
              "text-2xl font-bold",
              holidayConfig ? holidayConfig.accentColor : "text-primary-500"
            )}>
              {game.board.filter(c => c === 'X').length}
            </div>
            <div className={cn(
              "text-xs uppercase",
              holidayConfig ? "text-slate-400" : "text-slate-500"
            )}>
              {holidayConfig ? currentTheme.x.symbol : 'X'} Moves
            </div>
          </div>
          <div className="text-center">
            <div className={cn(
              "text-2xl font-bold",
              holidayConfig ? holidayConfig.secondaryColor : "text-rose-500"
            )}>
              {game.board.filter(c => c === 'O').length}
            </div>
            <div className={cn(
              "text-xs uppercase",
              holidayConfig ? "text-slate-400" : "text-slate-500"
            )}>
              {holidayConfig ? currentTheme.o.symbol : 'O'} Moves
            </div>
          </div>
        </div>

        {/* View Board button */}
        <button
          onClick={() => setViewingBoard(true)}
          className={cn(
            "w-full mb-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2",
            holidayConfig
              ? "text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
              : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          )}
        >
          <Eye className="w-4 h-4" />
          View Board
        </button>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            className={cn(
              "flex-1",
              holidayConfig && "border-slate-600 hover:bg-slate-700"
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
                holidayConfig && "bg-primary-600 hover:bg-primary-700"
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
