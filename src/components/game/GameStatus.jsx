import { X, Circle, Bot } from 'lucide-react'
import { cn } from '../../lib/utils'
import { Timer } from '../ui/Timer'
import { useSettings, SYMBOL_THEMES } from '../../context/SettingsContext'

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
  boardSize = 3,
  layout = 'horizontal', // 'horizontal' | 'sidebar-left' | 'sidebar-right'
}) {
  const isMyTurn = game?.current_turn === currentUserId
  const isPlayerX = game?.player_x === currentUserId
  const currentTurnIsX = game?.current_turn === game?.player_x

  const isDecayMode = game?.game_mode === 'decay'
  const isGravityMode = game?.game_mode === 'gravity'
  const isMisereMode = game?.game_mode === 'misere'
  const isRandomMode = game?.game_mode === 'random'
  const isBombMode = game?.game_mode === 'bomb'
  const isBlockerMode = game?.game_mode === 'blocker'
  const isFogMode = game?.game_mode === 'fog'

  // Get game mode badge info
  const getModeBadge = () => {
    if (isMisereMode) return { icon: '🔄', text: 'MISÈRE', color: 'bg-rose-500' }
    if (isDecayMode) return { icon: '⏳', text: 'DECAY', color: 'bg-amber-500' }
    if (isGravityMode) return { icon: '⬇️', text: 'GRAVITY', color: 'bg-blue-500' }
    if (isRandomMode) return { icon: '🎲', text: 'RANDOM START', color: 'bg-purple-500' }
    if (isBombMode) return { icon: '💣', text: 'BOMB', color: 'bg-rose-600' }
    if (isBlockerMode) return { icon: '🚧', text: 'BLOCKER', color: 'bg-amber-600' }
    if (isFogMode) return { icon: '🌫️', text: 'FOG OF WAR', color: 'bg-slate-600' }
    return null
  }

  const modeBadge = getModeBadge()

  // Sidebar layout for desktop - shows only one player + timer
  if (layout === 'sidebar-left') {
    return (
      <div className="flex flex-col items-center gap-4 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
        {/* Game mode badge */}
        {modeBadge && (
          <div className={cn(
            "px-3 py-1 text-white text-xs font-bold rounded-full whitespace-nowrap",
            modeBadge.color
          )}>
            {modeBadge.icon} {modeBadge.text}
          </div>
        )}

        {/* Player X */}
        <PlayerCard
          player={playerX}
          symbol="X"
          isCurrentTurn={currentTurnIsX}
          isCurrentUser={isPlayerX}
          isAI={false}
          boardSize={boardSize}
          vertical
        />

        {/* Timer / Status */}
        <div className="flex flex-col items-center">
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
                <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <span className="text-xs text-slate-500 font-medium">No Timer</span>
                </div>
              )}
              <p className={cn(
                'mt-2 text-sm font-medium',
                isMyTurn ? 'text-primary-500' : 'text-slate-500'
              )}>
                {isMyTurn ? "Your turn" : "Waiting..."}
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
      </div>
    )
  }

  if (layout === 'sidebar-right') {
    return (
      <div className="flex flex-col items-center gap-4 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
        {/* Player O */}
        <PlayerCard
          player={playerO}
          symbol="O"
          isCurrentTurn={!currentTurnIsX && game?.status === 'in_progress'}
          isCurrentUser={!isPlayerX}
          isAI={game?.is_ai_game}
          aiDifficulty={game?.ai_difficulty}
          boardSize={boardSize}
          vertical
        />
      </div>
    )
  }

  // Default horizontal layout (mobile)
  return (
    <div className="relative flex items-center justify-between gap-2 sm:gap-4 p-2 sm:p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
      {/* Game mode badge */}
      {modeBadge && (
        <div className={cn(
          "absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 text-white text-[10px] font-bold rounded-full whitespace-nowrap",
          modeBadge.color
        )}>
          {modeBadge.icon} {modeBadge.text}
        </div>
      )}

      {/* Player X */}
      <PlayerCard
        player={playerX}
        symbol="X"
        isCurrentTurn={currentTurnIsX}
        isCurrentUser={isPlayerX}
        isAI={false}
        boardSize={boardSize}
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
        boardSize={boardSize}
      />
    </div>
  )
}

const DIFFICULTY_LABELS = {
  easy: 'Easy Mode',
  medium: 'Medium Mode',
  hard: 'Unbeatable',
}

function PlayerCard({ player, symbol, isCurrentTurn, isCurrentUser, isAI, aiDifficulty, boardSize = 3, vertical = false }) {
  const { currentTheme } = useSettings()
  // Use Connect 4 theme automatically for 7x6 board
  const effectiveTheme = boardSize === 7 ? SYMBOL_THEMES.connect4 : currentTheme
  const isClassic = effectiveTheme.id === 'classic'
  const themeSymbol = symbol === 'X' ? effectiveTheme.x.symbol : effectiveTheme.o.symbol

  return (
    <div
      className={cn(
        'flex items-center gap-2 sm:gap-3 p-1.5 sm:p-3 rounded-lg transition-all',
        vertical && 'flex-col text-center p-4',
        isCurrentTurn && 'bg-slate-50 dark:bg-slate-800 ring-2 ring-primary-500'
      )}
    >
      <div className="relative">
        {isAI ? (
          <div className={cn(
            "flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-full",
            vertical ? "h-16 w-16" : "h-9 w-9 sm:h-12 sm:w-12"
          )}>
            <Bot className={vertical ? "h-8 w-8" : "h-5 w-5 sm:h-6 sm:w-6"} />
          </div>
        ) : (
          <div className={cn(
            "flex items-center justify-center",
            vertical ? "h-16 w-16 text-4xl" : "h-9 w-9 sm:h-12 sm:w-12 text-2xl sm:text-3xl"
          )}>
            {player?.avatar || '😀'}
          </div>
        )}
        <div className={cn(
          'absolute -bottom-1 -right-1 rounded-full flex items-center justify-center',
          vertical ? 'w-7 h-7' : 'w-5 h-5 sm:w-6 sm:h-6',
          symbol === 'X'
            ? 'bg-primary-500 text-white'
            : 'bg-rose-500 text-white'
        )}>
          {isClassic ? (
            symbol === 'X' ? (
              <X className={vertical ? "h-4 w-4" : "h-3 w-3 sm:h-4 sm:w-4"} strokeWidth={3} />
            ) : (
              <Circle className={vertical ? "h-3.5 w-3.5" : "h-2.5 w-2.5 sm:h-3 sm:h-3"} strokeWidth={3} />
            )
          ) : (
            <span className={vertical ? "text-sm" : "text-xs sm:text-sm"}>{themeSymbol}</span>
          )}
        </div>
      </div>
      <div className="flex flex-col">
        <span className={cn(
          "font-semibold",
          vertical ? "text-base" : "text-xs sm:text-sm"
        )}>
          {isAI ? 'Bot' : player?.username || 'Waiting...'}
        </span>
        <span className={cn(
          "text-slate-500",
          vertical ? "text-sm" : "text-[10px] sm:text-xs"
        )}>
          {isCurrentUser && '(You)'}
          {isAI && (DIFFICULTY_LABELS[aiDifficulty] || 'Unbeatable')}
        </span>
      </div>
    </div>
  )
}
