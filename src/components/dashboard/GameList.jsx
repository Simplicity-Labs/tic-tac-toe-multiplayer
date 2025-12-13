import { Gamepad2, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { Button } from '../ui/Button'
import { GameCard } from './GameCard'

export function GameList({ games, loading, onJoin, joinLoading, onRefresh }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Gamepad2 className="h-5 w-5 text-primary-500" />
          Available Games
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : games.length === 0 ? (
          <div className="text-center py-8">
            <Gamepad2 className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-slate-500">No games available</p>
            <p className="text-sm text-slate-400">Create one or wait for others to join!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {games.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                onJoin={onJoin}
                loading={joinLoading}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
