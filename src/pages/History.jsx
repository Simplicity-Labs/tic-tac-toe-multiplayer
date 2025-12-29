import { History as HistoryIcon, Trophy, X as XIcon, Handshake, Bot, Grid3X3 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useGameHistory } from '../hooks/useGame'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { cn } from '../lib/utils'
import { getBoardSize, BOARD_SIZES } from '../lib/gameLogic'

export default function History() {
  const { user } = useAuth()
  const { games, loading } = useGameHistory()

  const getOutcome = (game) => {
    if (game.winner === null) return 'draw'
    if (game.winner === user?.id) return 'win'
    return 'loss'
  }

  const getOpponent = (game) => {
    if (game.is_ai_game) return { username: 'AI Bot', isAI: true }
    if (game.player_x === user?.id) {
      return game.player_o_profile || { username: 'Unknown' }
    }
    return game.player_x_profile || { username: 'Unknown' }
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <HistoryIcon className="h-6 w-6 text-primary-500" />
          Game History
        </h1>
        <p className="text-slate-500">Your recent games and outcomes</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-20 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse"
            />
          ))}
        </div>
      ) : games.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <HistoryIcon className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-slate-500">No games played yet</p>
            <p className="text-sm text-slate-400">Start a game to see your history here</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {games.map((game) => {
            const outcome = getOutcome(game)
            const opponent = getOpponent(game)
            const boardSize = game.board_size || getBoardSize(game.board)
            const boardConfig = BOARD_SIZES[boardSize] || BOARD_SIZES[3]

            return (
              <Card key={game.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* Outcome icon */}
                      <div
                        className={cn(
                          'w-12 h-12 rounded-full flex items-center justify-center',
                          outcome === 'win' && 'bg-emerald-100 dark:bg-emerald-900/30',
                          outcome === 'loss' && 'bg-rose-100 dark:bg-rose-900/30',
                          outcome === 'draw' && 'bg-amber-100 dark:bg-amber-900/30'
                        )}
                      >
                        {outcome === 'win' && (
                          <Trophy className="h-6 w-6 text-emerald-500" />
                        )}
                        {outcome === 'loss' && (
                          <XIcon className="h-6 w-6 text-rose-500" />
                        )}
                        {outcome === 'draw' && (
                          <Handshake className="h-6 w-6 text-amber-500" />
                        )}
                      </div>

                      {/* Opponent */}
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">vs</span>
                        {opponent.isAI ? (
                          <div className="h-8 w-8 flex items-center justify-center">
                            <Bot className="h-5 w-5" />
                          </div>
                        ) : (
                          <div className="h-8 w-8 flex items-center justify-center text-xl">
                            {opponent.avatar || '😀'}
                          </div>
                        )}
                        <span className="font-medium">{opponent.username}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3">
                      {/* Board size badge */}
                      <Badge variant="outline" className="gap-1 hidden sm:flex">
                        <Grid3X3 className="h-3 w-3" />
                        {boardConfig.label}
                      </Badge>

                      {/* Outcome Badge */}
                      <Badge
                        variant={
                          outcome === 'win'
                            ? 'success'
                            : outcome === 'loss'
                            ? 'destructive'
                            : 'warning'
                        }
                      >
                        {outcome === 'win' ? 'Won' : outcome === 'loss' ? 'Lost' : 'Draw'}
                      </Badge>

                      {/* Date */}
                      <span className="text-sm text-slate-500 hidden sm:block">
                        {formatDate(game.completed_at)}
                      </span>
                    </div>
                  </div>

                  {/* Mini board preview */}
                  <div className="mt-3 flex items-center gap-4">
                    <MiniBoard board={game.board} boardSize={boardSize} />
                    <div className="flex flex-col gap-1 sm:hidden">
                      <Badge variant="outline" className="gap-1 w-fit">
                        <Grid3X3 className="h-3 w-3" />
                        {boardConfig.label}
                      </Badge>
                      <span className="text-xs text-slate-400">
                        {formatDate(game.completed_at)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

function MiniBoard({ board, boardSize = 3 }) {
  return (
    <div
      className={cn(
        'grid gap-0.5 bg-slate-200 dark:bg-slate-700 rounded p-0.5',
        boardSize === 3 && 'grid-cols-3 w-12 h-12',
        boardSize === 4 && 'grid-cols-4 w-14 h-14',
        boardSize === 5 && 'grid-cols-5 w-16 h-16'
      )}
    >
      {board.map((cell, i) => (
        <div
          key={i}
          className={cn(
            'flex items-center justify-center font-bold rounded-sm',
            'bg-white dark:bg-slate-800',
            cell === 'X' && 'text-primary-500',
            cell === 'O' && 'text-rose-500',
            boardSize === 3 && 'text-[8px]',
            boardSize === 4 && 'text-[6px]',
            boardSize === 5 && 'text-[5px]'
          )}
        >
          {cell}
        </div>
      ))}
    </div>
  )
}
