import { X, Circle, Bot, User } from 'lucide-react'
import { cn } from '../../lib/utils'
import { Avatar, AvatarFallback } from '../ui/Avatar'
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
      />
    </div>
  )
}

function PlayerCard({ player, symbol, isCurrentTurn, isCurrentUser, isAI }) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg transition-all',
        isCurrentTurn && 'bg-slate-50 dark:bg-slate-800 ring-2 ring-primary-500'
      )}
    >
      <div className="relative">
        <Avatar className="h-12 w-12">
          <AvatarFallback className={cn(
            symbol === 'X'
              ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
              : 'bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300'
          )}>
            {isAI ? (
              <Bot className="h-6 w-6" />
            ) : player?.username ? (
              player.username.charAt(0).toUpperCase()
            ) : (
              <User className="h-6 w-6" />
            )}
          </AvatarFallback>
        </Avatar>
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
          {isAI ? 'AI Bot' : player?.username || 'Waiting...'}
        </span>
        <span className="text-xs text-slate-500">
          {isCurrentUser && '(You)'}
          {isAI && 'Unbeatable'}
        </span>
      </div>
    </div>
  )
}
