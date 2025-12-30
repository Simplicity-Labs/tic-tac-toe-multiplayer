import { X, Circle, Bot } from 'lucide-react'
import { cn } from '../../lib/utils'
import { Timer } from '../ui/Timer'
import { useSettings } from '../../context/SettingsContext'

export function GameStatus({
  game,
  playerX,
  playerO,
  currentUserId,
  timeRemaining,
  formattedTime,
  isLow,
  percentage,
  timerEnabled = true,
}) {
  const isMyTurn = game?.current_turn === currentUserId
  const isPlayerX = game?.player_x === currentUserId
  const currentTurnIsX = game?.current_turn === game?.player_x

  return (
    <div className="flex items-center justify-between gap-2 sm:gap-4 p-2 sm:p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
      {/* Player X */}
      <PlayerCard
        player={playerX}
        symbol="X"
        isCurrentTurn={currentTurnIsX}
        isCurrentUser={isPlayerX}
        isAI={false}
      />

      {/* Timer / Status */}
      <div className="flex flex-col items-center flex-shrink-0">
        {game?.status === 'in_progress' && (
          <>
            {timerEnabled ? (
              <Timer
                timeRemaining={timeRemaining}
                formattedTime={formattedTime}
                isLow={isLow}
                percentage={percentage}
              />
            ) : (
              <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <span className="text-[10px] sm:text-xs text-slate-500 font-medium">No Timer</span>
              </div>
            )}
            <p className={cn(
              'mt-1 text-[10px] sm:text-xs font-medium',
              isMyTurn ? 'text-primary-500' : 'text-slate-500'
            )}>
              {isMyTurn ? "Your turn" : "Waiting..."}
            </p>
          </>
        )}
        {game?.status === 'waiting' && (
          <div className="text-center">
            <div className="animate-pulse flex space-x-1 justify-center mb-1">
              <div className="w-1.5 h-1.5 bg-primary-500 rounded-full"></div>
              <div className="w-1.5 h-1.5 bg-primary-500 rounded-full animation-delay-200"></div>
              <div className="w-1.5 h-1.5 bg-primary-500 rounded-full animation-delay-400"></div>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-500">Waiting...</p>
          </div>
        )}
      </div>

      {/* Player O */}
      <PlayerCard
        player={playerO}
        symbol="O"
        isCurrentTurn={!currentTurnIsX && game?.status === 'in_progress'}
        isCurrentUser={!isPlayerX}
        isAI={game?.is_ai_game}
        aiDifficulty={game?.ai_difficulty}
      />
    </div>
  )
}

const DIFFICULTY_LABELS = {
  easy: 'Easy Mode',
  medium: 'Medium Mode',
  hard: 'Unbeatable',
}

function PlayerCard({ player, symbol, isCurrentTurn, isCurrentUser, isAI, aiDifficulty }) {
  const { currentTheme } = useSettings()
  const isClassic = currentTheme.id === 'classic'
  const themeSymbol = symbol === 'X' ? currentTheme.x.symbol : currentTheme.o.symbol

  return (
    <div
      className={cn(
        'flex items-center gap-2 sm:gap-3 p-1.5 sm:p-3 rounded-lg transition-all',
        isCurrentTurn && 'bg-slate-50 dark:bg-slate-800 ring-2 ring-primary-500'
      )}
    >
      <div className="relative">
        {isAI ? (
          <div className="h-9 w-9 sm:h-12 sm:w-12 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-full">
            <Bot className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
        ) : (
          <div className="h-9 w-9 sm:h-12 sm:w-12 flex items-center justify-center text-2xl sm:text-3xl">
            {player?.avatar || '😀'}
          </div>
        )}
        <div className={cn(
          'absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center',
          symbol === 'X'
            ? 'bg-primary-500 text-white'
            : 'bg-rose-500 text-white'
        )}>
          {isClassic ? (
            symbol === 'X' ? (
              <X className="h-3 w-3 sm:h-4 sm:w-4" strokeWidth={3} />
            ) : (
              <Circle className="h-2.5 w-2.5 sm:h-3 sm:w-3" strokeWidth={3} />
            )
          ) : (
            <span className="text-xs sm:text-sm">{themeSymbol}</span>
          )}
        </div>
      </div>
      <div className="flex flex-col">
        <span className="font-semibold text-xs sm:text-sm">
          {isAI ? 'Bot' : player?.username || 'Waiting...'}
        </span>
        <span className="text-[10px] sm:text-xs text-slate-500">
          {isCurrentUser && '(You)'}
          {isAI && (DIFFICULTY_LABELS[aiDifficulty] || 'Unbeatable')}
        </span>
      </div>
    </div>
  )
}
