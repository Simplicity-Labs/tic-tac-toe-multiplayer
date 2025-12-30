import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Bot, Users, Zap, Brain, Sparkles, Play, Clock, Grid3X3, X, Timer } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useAvailableGames, useLiveGames, useCreateGame, useJoinGame, useActiveGame } from '../hooks/useGame'
import { usePresence } from '../hooks/usePresence'
import { useInvitations } from '../context/InvitationsContext'
import { useSettings } from '../context/SettingsContext'
import { useToast } from '../components/ui/Toast'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { StatsCard } from '../components/dashboard/StatsCard'
import { GameList } from '../components/dashboard/GameList'
import { LiveGameList } from '../components/dashboard/LiveGameList'
import { OnlineUsersCard } from '../components/dashboard/OnlineUsersCard'
import { cn } from '../lib/utils'
import { BOARD_SIZES } from '../lib/gameLogic'
import { TIMER_OPTIONS } from '../hooks/useTimer'

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
  const { games: liveGames, loading: liveGamesLoading, refetch: refetchLiveGames } = useLiveGames()
  const { createGame, loading: createLoading } = useCreateGame()
  const { joinGame, loading: joinLoading } = useJoinGame()
  const { activeGame, refetch: refetchActiveGame, forfeitGame, forfeitLoading } = useActiveGame()
  const { onlineUsers, isConnected } = usePresence()
  const { sendInvite, sentInvite } = useInvitations()
  const { boardSize: selectedBoardSize, setBoardSize: setSelectedBoardSize, turnDuration, setTurnDuration } = useSettings()
  const { toast } = useToast()

  const handleCreateGame = async () => {
    const { data, error, existingGameId } = await createGame(false, 'hard', selectedBoardSize, turnDuration)
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
      const timerLabel = turnDuration ? TIMER_OPTIONS.find(t => t.value === turnDuration)?.shortLabel : 'No timer'
      toast({
        title: 'Game created!',
        description: `${BOARD_SIZES[selectedBoardSize].label} game (${timerLabel}) - Waiting for an opponent...`,
        variant: 'success',
      })
      navigate(`/game/${data.id}`)
    }
  }

  const handlePlayAI = async (difficulty) => {
    const { data, error, existingGameId } = await createGame(true, difficulty, selectedBoardSize, turnDuration)
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
    const { data, error } = await sendInvite(targetUser, selectedBoardSize, turnDuration)
    if (error) {
      toast({
        title: 'Error',
        description: error,
        variant: 'destructive',
      })
    } else {
      const timerLabel = turnDuration ? TIMER_OPTIONS.find(t => t.value === turnDuration)?.shortLabel : 'No timer'
      toast({
        title: 'Invite sent!',
        description: `${BOARD_SIZES[selectedBoardSize].label} game (${timerLabel}) - Waiting for ${targetUser.username}...`,
        variant: 'success',
      })
      navigate(`/game/${data.id}`)
    }
  }

  const handleForfeit = async (e) => {
    e.stopPropagation() // Prevent card click navigation
    const { error, cancelled } = await forfeitGame()
    if (error) {
      toast({
        title: 'Error',
        description: error,
        variant: 'destructive',
      })
    } else {
      toast({
        title: cancelled ? 'Game cancelled' : 'Game forfeited',
        description: cancelled ? 'Your game has been cancelled.' : 'You have forfeited the game.',
        variant: 'default',
      })
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
                    ? `Playing against Bot (${activeGame.ai_difficulty})`
                    : 'Game in progress with another player'}
              </p>
              <div className="flex gap-2">
                <Button className="flex-1">
                  <Play className="h-4 w-4 mr-2" />
                  Continue
                </Button>
                <Button
                  variant="outline"
                  onClick={handleForfeit}
                  disabled={forfeitLoading}
                  className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950"
                >
                  <X className="h-4 w-4" />
                  <span className="ml-1 hidden sm:inline">
                    {activeGame.status === 'waiting' ? 'Cancel' : 'Forfeit'}
                  </span>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                  <Plus className="h-5 w-5 text-primary-500" />
                </div>
                Create New Game
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500 mb-3">
                Start a new game and wait for someone to join
              </p>

              {/* Board Size Selector */}
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <Grid3X3 className="h-4 w-4 text-slate-500" />
                  <span className="text-sm font-medium">Board Size</span>
                </div>
                <div className="flex gap-2">
                  {[3, 4, 5].map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedBoardSize(size)}
                      className={cn(
                        'flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                        selectedBoardSize === size
                          ? 'bg-primary-500 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'
                      )}
                    >
                      {BOARD_SIZES[size].label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {selectedBoardSize === 5 ? '4 in a row' : '3 in a row'} to win
                </p>
              </div>

              {/* Timer Selector */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Timer className="h-4 w-4 text-slate-500" />
                  <span className="text-sm font-medium">Turn Timer</span>
                </div>
                <select
                  value={turnDuration === null ? 'null' : turnDuration}
                  onChange={(e) => setTurnDuration(e.target.value === 'null' ? null : parseInt(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg text-sm font-medium bg-slate-100 dark:bg-slate-800 border-0 focus:ring-2 focus:ring-primary-500"
                >
                  {TIMER_OPTIONS.map((option) => (
                    <option key={option.value ?? 'null'} value={option.value ?? 'null'}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <Button disabled={createLoading} className="w-full" onClick={handleCreateGame}>
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
              Play vs Bot
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500 mb-3">
              {activeGame ? 'Finish your current game first' : 'Choose difficulty and board size'}
            </p>

            {/* Board Size & Timer for AI - compact version */}
            {!activeGame && (
              <div className="space-y-2 mb-3">
                <div className="flex items-center gap-2">
                  <Grid3X3 className="h-4 w-4 text-slate-400" />
                  <div className="flex gap-1 flex-1">
                    {[3, 4, 5].map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedBoardSize(size)}
                        className={cn(
                          'flex-1 px-2 py-1 rounded text-xs font-medium transition-all',
                          selectedBoardSize === size
                            ? 'bg-amber-500 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'
                        )}
                      >
                        {BOARD_SIZES[size].label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Timer className="h-4 w-4 text-slate-400" />
                  <select
                    value={turnDuration === null ? 'null' : turnDuration}
                    onChange={(e) => setTurnDuration(e.target.value === 'null' ? null : parseInt(e.target.value))}
                    className="flex-1 px-2 py-1 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800 border-0 focus:ring-2 focus:ring-amber-500"
                  >
                    {TIMER_OPTIONS.map((option) => (
                      <option key={option.value ?? 'null'} value={option.value ?? 'null'}>
                        {option.shortLabel}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

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

      {/* Live games to spectate */}
      <LiveGameList
        games={liveGames}
        loading={liveGamesLoading}
        onRefresh={refetchLiveGames}
      />
    </div>
  )
}
