import { History as HistoryIcon, Trophy, X as XIcon, Handshake, Bot, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useGameHistory } from '../hooks/useGame'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Avatar, AvatarFallback } from '../components/ui/Avatar'
import { Badge } from '../components/ui/Badge'
import { cn } from '../lib/utils'

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
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {opponent.isAI ? (
                              <Bot className="h-4 w-4" />
                            ) : opponent.username ? (
                              opponent.username.charAt(0).toUpperCase()
                            ) : (
                              <User className="h-4 w-4" />
                            )}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{opponent.username}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Badge */}
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
                    <MiniBoard board={game.board} />
                    <span className="text-xs text-slate-400 sm:hidden">
                      {formatDate(game.completed_at)}
                    </span>
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

function MiniBoard({ board }) {
  return (
    <div className="grid grid-cols-3 gap-0.5 w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded p-0.5">
      {board.map((cell, i) => (
        <div
          key={i}
          className={cn(
            'flex items-center justify-center text-[8px] font-bold rounded-sm',
            'bg-white dark:bg-slate-800',
            cell === 'X' && 'text-primary-500',
            cell === 'O' && 'text-rose-500'
          )}
        >
          {cell}
        </div>
      ))}
    </div>
  )
}
