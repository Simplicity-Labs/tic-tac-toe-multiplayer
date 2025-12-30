import { X, Circle, Bot } from 'lucide-react'
import { cn } from '../../lib/utils'
import { Timer } from '../ui/Timer'

export function GameStatus({
  game,
  playerX,
  playerO,
  currentUserId,
  timeRemaining,
  isLow,
  percentage,
}) {
  const isMyTurn = game?.current_turn === currentUserId
  const isPlayerX = game?.player_x === currentUserId
  const currentTurnIsX = game?.current_turn === game?.player_x

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
      {/* Player X */}
      <PlayerCard
        player={playerX}
        symbol="X"
        isCurrentTurn={currentTurnIsX}
        isCurrentUser={isPlayerX}
        isAI={false}
      />

      {/* Timer / Status */}
      <div className="flex flex-col items-center">
        {game?.status === 'in_progress' && (
          <>
            <Timer
              timeRemaining={timeRemaining}
              isLow={isLow}
              percentage={percentage}
            />
            <p className={cn(
              'mt-2 text-sm font-medium',
              isMyTurn ? 'text-primary-500' : 'text-slate-500'
            )}>
              {isMyTurn ? "Your turn!" : "Opponent's turn"}
            </p>
          </>
        )}
        {game?.status === 'waiting' && (
          <div className="text-center">
            <div className="animate-pulse flex space-x-1 justify-center mb-2">
              <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
              <div className="w-2 h-2 bg-primary-500 rounded-full animation-delay-200"></div>
              <div className="w-2 h-2 bg-primary-500 rounded-full animation-delay-400"></div>
            </div>
            <p className="text-sm text-slate-500">Waiting for opponent...</p>
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
  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg transition-all',
        isCurrentTurn && 'bg-slate-50 dark:bg-slate-800 ring-2 ring-primary-500'
      )}
    >
      <div className="relative">
        {isAI ? (
          <div className="h-12 w-12 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-full">
            <Bot className="h-6 w-6" />
          </div>
        ) : (
          <div className="h-12 w-12 flex items-center justify-center text-3xl">
            {player?.avatar || '😀'}
          </div>
        )}
        <div className={cn(
          'absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center',
          symbol === 'X'
            ? 'bg-primary-500 text-white'
            : 'bg-rose-500 text-white'
        )}>
          {symbol === 'X' ? (
            <X className="h-4 w-4" strokeWidth={3} />
          ) : (
            <Circle className="h-3 w-3" strokeWidth={3} />
          )}
        </div>
      </div>
      <div className="flex flex-col">
        <span className="font-semibold text-sm">
          {isAI ? 'AI' : player?.username || 'Waiting...'}
        </span>
        <span className="text-xs text-slate-500">
          {isCurrentUser && '(You)'}
          {isAI && (DIFFICULTY_LABELS[aiDifficulty] || 'Unbeatable')}
        </span>
      </div>
    </div>
  )
}
