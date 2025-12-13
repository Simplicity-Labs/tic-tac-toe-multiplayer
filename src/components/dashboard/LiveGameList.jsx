import { Radio, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { Button } from '../ui/Button'
import { LiveGameCard } from './LiveGameCard'

export function LiveGameList({ games, loading, onRefresh }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Radio className="h-5 w-5 text-emerald-500" />
          Live Games
          {games.length > 0 && (
            <span className="text-sm font-normal text-slate-500">({games.length})</span>
          )}
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
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-16 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : games.length === 0 ? (
          <div className="text-center py-6">
            <Radio className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">No live games right now</p>
          </div>
        ) : (
          <div className="space-y-3">
            {games.map((game) => (
              <LiveGameCard key={game.id} game={game} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
