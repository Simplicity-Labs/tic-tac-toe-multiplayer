import { useNavigate } from 'react-router-dom'
import { Eye } from 'lucide-react'
import { Card, CardContent } from '../ui/Card'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'

export function LiveGameCard({ game }) {
  const navigate = useNavigate()
  const playerX = game.player_x_profile
  const playerO = game.player_o_profile

  // Determine whose turn it is
  const isXTurn = game.current_turn === game.player_x
  const currentTurnName = isXTurn ? playerX?.username : playerO?.username

  return (
    <Card className="hover:shadow-md transition-shadow border-emerald-200 dark:border-emerald-800">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Player X */}
            <div className="flex items-center gap-2">
              <div className={`h-10 w-10 flex items-center justify-center text-2xl ${isXTurn ? 'ring-2 ring-primary-500 rounded-full' : ''}`}>
                {playerX?.avatar || '😀'}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium">{playerX?.username || 'Player X'}</p>
                <p className="text-xs text-primary-500">X</p>
              </div>
            </div>

            <span className="text-slate-400 font-bold">vs</span>

            {/* Player O */}
            <div className="flex items-center gap-2">
              <div className={`h-10 w-10 flex items-center justify-center text-2xl ${!isXTurn ? 'ring-2 ring-rose-500 rounded-full' : ''}`}>
                {playerO?.avatar || '😀'}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium">{playerO?.username || 'Player O'}</p>
                <p className="text-xs text-rose-500">O</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="outline" className="border-emerald-500 text-emerald-600 dark:text-emerald-400">
              {currentTurnName}'s turn
            </Badge>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(`/game/${game.id}`)}
            >
              <Eye className="h-4 w-4 mr-1" />
              Spectate
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
