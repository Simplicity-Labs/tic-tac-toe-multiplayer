import { useNavigate } from 'react-router-dom'
import { Plus, Bot, Users, Zap, Brain, Sparkles, Play, Clock } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useAvailableGames, useCreateGame, useJoinGame, useActiveGame } from '../hooks/useGame'
import { usePresence } from '../hooks/usePresence'
import { useInvitations } from '../context/InvitationsContext'
import { useToast } from '../components/ui/Toast'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { StatsCard } from '../components/dashboard/StatsCard'
import { GameList } from '../components/dashboard/GameList'
import { OnlineUsersCard } from '../components/dashboard/OnlineUsersCard'
import { cn } from '../lib/utils'

const DIFFICULTIES = [
  {
    id: 'easy',
    name: 'Easy',
    description: 'Random moves, great for beginners',
    icon: Sparkles,
    color: 'text-emerald-500',
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    hoverBg: 'hover:bg-emerald-500',
  },
  {
    id: 'medium',
    name: 'Medium',
    description: 'Smart but beatable',
    icon: Zap,
    color: 'text-amber-500',
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    hoverBg: 'hover:bg-amber-500',
  },
  {
    id: 'hard',
    name: 'Hard',
    description: 'Unbeatable AI (minimax)',
    icon: Brain,
    color: 'text-rose-500',
    bg: 'bg-rose-100 dark:bg-rose-900/30',
    hoverBg: 'hover:bg-rose-500',
  },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { games, loading: gamesLoading, refetch } = useAvailableGames()
  const { createGame, loading: createLoading } = useCreateGame()
  const { joinGame, loading: joinLoading } = useJoinGame()
  const { activeGame, refetch: refetchActiveGame } = useActiveGame()
  const { onlineUsers, isConnected } = usePresence()
  const { sendInvite, sentInvite } = useInvitations()
  const { toast } = useToast()

  const handleCreateGame = async () => {
    const { data, error, existingGameId } = await createGame(false)
    if (error) {
      if (existingGameId) {
        toast({
          title: 'Active game exists',
          description: 'Redirecting to your current game...',
          variant: 'warning',
        })
        navigate(`/game/${existingGameId}`)
      } else {
        toast({
          title: 'Error',
          description: error,
          variant: 'destructive',
        })
      }
    } else {
      toast({
        title: 'Game created!',
        description: 'Waiting for an opponent to join...',
        variant: 'success',
      })
      navigate(`/game/${data.id}`)
    }
  }

  const handlePlayAI = async (difficulty) => {
    const { data, error, existingGameId } = await createGame(true, difficulty)
    if (error) {
      if (existingGameId) {
        toast({
          title: 'Active game exists',
          description: 'Redirecting to your current game...',
          variant: 'warning',
        })
        navigate(`/game/${existingGameId}`)
      } else {
        toast({
          title: 'Error',
          description: error,
          variant: 'destructive',
        })
      }
    } else {
      navigate(`/game/${data.id}`)
    }
  }

  const handleJoinGame = async (gameId) => {
    const { data, error } = await joinGame(gameId)
    if (error) {
      toast({
        title: 'Error',
        description: error,
        variant: 'destructive',
      })
      refetch()
    } else {
      navigate(`/game/${data.id}`)
    }
  }

  const handleInvite = async (targetUser) => {
    const { data, error } = await sendInvite(targetUser)
    if (error) {
      toast({
        title: 'Error',
        description: error,
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Invite sent!',
        description: `Waiting for ${targetUser.username} to respond...`,
        variant: 'success',
      })
      navigate(`/game/${data.id}`)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Welcome header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            Welcome back, {profile?.username}!
          </h1>
          <p className="text-slate-500">Ready for a game?</p>
        </div>
      </div>

      {/* Stats */}
      <StatsCard profile={profile} />

      {/* Action cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeGame ? (
          <Card className="hover:shadow-md transition-shadow cursor-pointer group border-2 border-primary-500" onClick={() => navigate(`/game/${activeGame.id}`)}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-primary-500 flex items-center justify-center">
                  <Play className="h-5 w-5 text-white" />
                </div>
                Active Game
                <Badge variant={activeGame.status === 'waiting' ? 'warning' : 'success'} className="ml-auto">
                  {activeGame.status === 'waiting' ? (
                    <>
                      <Clock className="h-3 w-3 mr-1" />
                      Waiting
                    </>
                  ) : (
                    'In Progress'
                  )}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500 mb-4">
                {activeGame.status === 'waiting'
                  ? 'Waiting for an opponent to join your game'
                  : activeGame.is_ai_game
                    ? `Playing against AI (${activeGame.ai_difficulty})`
                    : 'Game in progress with another player'}
              </p>
              <Button className="w-full">
                <Play className="h-4 w-4 mr-2" />
                Continue Game
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="hover:shadow-md transition-shadow cursor-pointer group" onClick={handleCreateGame}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center group-hover:bg-primary-500 group-hover:text-white transition-colors">
                  <Plus className="h-5 w-5 text-primary-500 group-hover:text-white" />
                </div>
                Create New Game
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500 mb-4">
                Start a new game and wait for someone to join
              </p>
              <Button disabled={createLoading} className="w-full">
                <Users className="h-4 w-4 mr-2" />
                {createLoading ? 'Creating...' : 'Create Game'}
              </Button>
            </CardContent>
          </Card>
        )}

        <Card className={cn("hover:shadow-md transition-shadow", activeGame && "opacity-60")}>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Bot className="h-5 w-5 text-amber-500" />
              </div>
              Play vs AI
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500 mb-4">
              {activeGame ? 'Finish your current game first' : 'Choose your difficulty level'}
            </p>

            {/* Difficulty buttons */}
            <div className="grid grid-cols-3 gap-2">
              {DIFFICULTIES.map((diff) => (
                <button
                  key={diff.id}
                  onClick={() => handlePlayAI(diff.id)}
                  disabled={createLoading || activeGame}
                  className={cn(
                    'flex flex-col items-center gap-1 p-3 rounded-lg transition-all',
                    'border-2 border-transparent',
                    diff.bg,
                    'hover:border-current hover:scale-105',
                    'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
                    diff.color
                  )}
                >
                  <diff.icon className="h-5 w-5" />
                  <span className="text-xs font-semibold">{diff.name}</span>
                </button>
              ))}
            </div>

            {/* Difficulty descriptions */}
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              {DIFFICULTIES.map((diff) => (
                <p key={diff.id} className="text-[10px] text-slate-400 leading-tight">
                  {diff.description}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>

        <OnlineUsersCard
          onlineUsers={onlineUsers}
          isConnected={isConnected}
          onInvite={handleInvite}
          sentInvite={sentInvite}
          disabled={!!activeGame}
        />
      </div>

      {/* Available games */}
      <GameList
        games={games}
        loading={gamesLoading}
        onJoin={handleJoinGame}
        joinLoading={joinLoading}
        onRefresh={refetch}
      />
    </div>
  )
}
