import { Users, UserPlus, Loader2, Gamepad2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { useAuth } from '../../context/AuthContext'

export function OnlineUsersCard({ onlineUsers, isConnected, onInvite, sentInvite, disabled }) {
  const { user } = useAuth()

  const otherUsers = onlineUsers.filter((u) => u.id !== user?.id)

  return (
    <Card className={`hover:shadow-md transition-shadow ${disabled ? 'opacity-60' : ''}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <Users className="h-5 w-5 text-emerald-500" />
            </div>
            Online Players
          </div>
          {isConnected ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              {otherUsers.length} online
            </span>
          ) : (
            <Badge variant="secondary" className="ml-2">
              Connecting...
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!isConnected ? (
          <div className="flex items-center justify-center py-6 text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Connecting...
          </div>
        ) : otherUsers.length === 0 ? (
          <div className="text-center py-6 text-slate-500">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No other players online</p>
            <p className="text-xs mt-1">Invite a friend to play!</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {otherUsers.map((onlineUser) => {
              const isInviting = sentInvite?.to?.id === onlineUser.id
              const wasDeclined = isInviting && sentInvite?.declined
              const isInGame = !!onlineUser.current_game_id

              return (
                <div
                  key={onlineUser.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50"
                >
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 flex items-center justify-center text-xl">
                      {onlineUser.avatar || '😀'}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{onlineUser.username}</p>
                      {isInGame ? (
                        <p className="text-xs text-amber-500 flex items-center">
                          <Gamepad2 className="w-3 h-3 mr-1" />
                          In Game
                        </p>
                      ) : (
                        <p className="text-xs text-emerald-500 flex items-center">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1" />
                          Online
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={wasDeclined ? 'destructive' : 'outline'}
                    onClick={() => onInvite(onlineUser)}
                    disabled={disabled || isInGame || (isInviting && !wasDeclined)}
                    className="h-8"
                  >
                    {isInviting && !wasDeclined ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        Sent
                      </>
                    ) : wasDeclined ? (
                      'Declined'
                    ) : isInGame ? (
                      'In Game'
                    ) : (
                      <>
                        <UserPlus className="h-3 w-3 mr-1" />
                        Invite
                      </>
                    )}
                  </Button>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
