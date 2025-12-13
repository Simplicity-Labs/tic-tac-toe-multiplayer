import { User, Clock } from 'lucide-react'
import { Card, CardContent } from '../ui/Card'
import { Button } from '../ui/Button'
import { Avatar, AvatarFallback } from '../ui/Avatar'
import { Badge } from '../ui/Badge'

export function GameCard({ game, onJoin, loading }) {
  const creator = game.creator

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000)
    if (seconds < 60) return 'Just now'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback className="bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300">
                {creator?.username ? creator.username.charAt(0).toUpperCase() : <User className="h-4 w-4" />}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{creator?.username || 'Unknown'}</p>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Clock className="h-3 w-3" />
                <span>{getTimeAgo(game.created_at)}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary">Waiting</Badge>
            <Button
              size="sm"
              onClick={() => onJoin(game.id)}
              disabled={loading}
            >
              {loading ? 'Joining...' : 'Join Game'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
