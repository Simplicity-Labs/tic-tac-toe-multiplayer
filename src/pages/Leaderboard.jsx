import { Trophy, Medal, Award, RefreshCw, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useLeaderboard } from '../hooks/useGame'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Avatar, AvatarFallback } from '../components/ui/Avatar'
import { Button } from '../components/ui/Button'
import { cn } from '../lib/utils'

export default function Leaderboard() {
  const { user } = useAuth()
  const { players, loading, refetch } = useLeaderboard()

  const getRankIcon = (rank) => {
    if (rank === 1) return <Trophy className="h-5 w-5 text-amber-500" />
    if (rank === 2) return <Medal className="h-5 w-5 text-slate-400" />
    if (rank === 3) return <Award className="h-5 w-5 text-amber-700" />
    return <span className="text-sm font-medium text-slate-500 w-5 text-center">{rank}</span>
  }

  const getRankStyle = (rank) => {
    if (rank === 1) return 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
    if (rank === 2) return 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
    if (rank === 3) return 'bg-amber-50/50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900'
    return ''
  }

  const calculateWinRate = (wins, losses, draws) => {
    const total = wins + losses + draws
    if (total === 0) return 0
    return Math.round((wins / total) * 100)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="h-6 w-6 text-amber-500" />
            Leaderboard
          </h1>
          <p className="text-slate-500">Top players ranked by wins</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refetch}
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-16 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse"
            />
          ))}
        </div>
      ) : players.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Trophy className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-slate-500">No players yet</p>
            <p className="text-sm text-slate-400">Be the first to play!</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <div className="grid grid-cols-12 text-xs font-medium text-slate-500 uppercase tracking-wider px-2">
              <div className="col-span-1">Rank</div>
              <div className="col-span-5">Player</div>
              <div className="col-span-2 text-center">Wins</div>
              <div className="col-span-2 text-center">W/L/D</div>
              <div className="col-span-2 text-center">Win %</div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {players.map((player, index) => {
              const rank = index + 1
              const isCurrentUser = player.id === user?.id
              const winRate = calculateWinRate(player.wins, player.losses, player.draws)

              return (
                <div
                  key={player.id}
                  className={cn(
                    'grid grid-cols-12 items-center p-3 rounded-lg border transition-colors',
                    getRankStyle(rank),
                    isCurrentUser && 'ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-slate-900',
                    !getRankStyle(rank) && 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  )}
                >
                  <div className="col-span-1 flex items-center">
                    {getRankIcon(rank)}
                  </div>
                  <div className="col-span-5 flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback
                        className={cn(
                          'text-sm',
                          rank === 1 && 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
                          rank === 2 && 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
                          rank === 3 && 'bg-amber-100/70 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400'
                        )}
                      >
                        {player.username ? (
                          player.username.charAt(0).toUpperCase()
                        ) : (
                          <User className="h-4 w-4" />
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <span className={cn('font-medium truncate', isCurrentUser && 'text-primary-600 dark:text-primary-400')}>
                      {player.username || 'Unknown'}
                      {isCurrentUser && <span className="ml-2 text-xs">(You)</span>}
                    </span>
                  </div>
                  <div className="col-span-2 text-center">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {player.wins || 0}
                    </span>
                  </div>
                  <div className="col-span-2 text-center text-sm text-slate-500">
                    {player.wins || 0}/{player.losses || 0}/{player.draws || 0}
                  </div>
                  <div className="col-span-2 text-center">
                    <span
                      className={cn(
                        'text-sm font-medium',
                        winRate >= 60 && 'text-emerald-600 dark:text-emerald-400',
                        winRate >= 40 && winRate < 60 && 'text-amber-600 dark:text-amber-400',
                        winRate < 40 && 'text-slate-500'
                      )}
                    >
                      {winRate}%
                    </span>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
