import { useNavigate } from 'react-router-dom'
import { Plus, Bot, Users, Zap, Brain, Sparkles, Play, Clock, Grid3X3, X, Timer, Gamepad2 } from 'lucide-react'
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
  const { boardSize: selectedBoardSize, setBoardSize: setSelectedBoardSize, turnDuration, setTurnDuration, gameMode, setGameMode, gameModeOptions, opponentType, setOpponentType, botDifficulty: selectedDifficulty, setBotDifficulty: setSelectedDifficulty } = useSettings()
  const { toast } = useToast()

  const handleCreateGame = async () => {
    const { data, error, existingGameId } = await createGame(false, 'hard', selectedBoardSize, turnDuration, gameMode)
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
      const modeLabel = gameMode !== 'classic' ? ` [${gameModeOptions.find(m => m.id === gameMode)?.name}]` : ''
      toast({
        title: 'Game created!',
        description: `${BOARD_SIZES[selectedBoardSize].label}${modeLabel} game (${timerLabel}) - Waiting for an opponent...`,
        variant: 'success',
      })
      navigate(`/game/${data.id}`)
    }
  }

  const handlePlayAI = async (difficulty) => {
    const { data, error, existingGameId } = await createGame(true, difficulty, selectedBoardSize, turnDuration, gameMode)
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

  const handleStartGame = async () => {
    if (opponentType === 'bot') {
      await handlePlayAI(selectedDifficulty)
    } else {
      await handleCreateGame()
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
          <Card className="hover:shadow-md transition-shadow sm:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                  <Plus className="h-5 w-5 text-primary-500" />
                </div>
                New Game
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Opponent Type Toggle */}
              <div className="mb-4">
                <div className="flex rounded-lg bg-slate-100 dark:bg-slate-800 p-1">
                  <button
                    onClick={() => setOpponentType('human')}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all',
                      opponentType === 'human'
                        ? 'bg-white dark:bg-slate-700 shadow-sm text-primary-600 dark:text-primary-400'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    )}
                  >
                    <Users className="h-4 w-4" />
                    <span>vs Human</span>
                  </button>
                  <button
                    onClick={() => setOpponentType('bot')}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all',
                      opponentType === 'bot'
                        ? 'bg-white dark:bg-slate-700 shadow-sm text-amber-600 dark:text-amber-400'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    )}
                  >
                    <Bot className="h-4 w-4" />
                    <span>vs Bot</span>
                  </button>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {/* Left column - Game Settings */}
                <div className="space-y-3">
                  {/* Board Size Selector */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Grid3X3 className="h-4 w-4 text-slate-500" />
                      <span className="text-sm font-medium">Board Size</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1">
                      {[3, 4, 5, 7].map((size) => (
                        <button
                          key={size}
                          onClick={() => {
                            setSelectedBoardSize(size)
                            // Auto-enable gravity mode for Connect 4 board
                            if (size === 7) {
                              setGameMode('gravity')
                            }
                          }}
                          title={BOARD_SIZES[size].description}
                          className={cn(
                            'px-2 py-2 rounded-lg text-xs font-medium transition-all',
                            size === 7
                              ? selectedBoardSize === 7
                                ? 'bg-gradient-to-r from-red-500 to-yellow-500 text-white shadow-md'
                                : 'bg-gradient-to-r from-red-100 to-yellow-100 dark:from-red-900/40 dark:to-yellow-900/40 text-red-700 dark:text-red-300 hover:from-red-200 hover:to-yellow-200 dark:hover:from-red-800/40 dark:hover:to-yellow-800/40'
                              : selectedBoardSize === size
                                ? 'bg-primary-500 text-white'
                                : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'
                          )}
                        >
                          {size === 7 ? 'C4' : BOARD_SIZES[size].label}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {selectedBoardSize >= 5 ? '4 in a row' : '3 in a row'} to win
                      {selectedBoardSize === 7 && ' • Connect 4 style'}
                    </p>
                  </div>

                  {/* Timer Selector */}
                  <div>
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
                </div>

                {/* Right column - Mode & Difficulty */}
                <div className="space-y-3">
                  {/* Game Mode Selector */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Gamepad2 className="h-4 w-4 text-slate-500" />
                      <span className="text-sm font-medium">Game Mode</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {gameModeOptions.map((mode) => (
                        <button
                          key={mode.id}
                          onClick={() => setGameMode(mode.id)}
                          title={`${mode.name}: ${mode.description}`}
                          className={cn(
                            'px-2 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1',
                            gameMode === mode.id
                              ? 'bg-primary-500 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'
                          )}
                        >
                          <span>{mode.icon}</span>
                          <span className="hidden sm:inline">{mode.name}</span>
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {gameModeOptions.find(m => m.id === gameMode)?.description}
                    </p>
                  </div>

                  {/* Difficulty selector - only for bot */}
                  {opponentType === 'bot' && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Brain className="h-4 w-4 text-slate-500" />
                        <span className="text-sm font-medium">Difficulty</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        {DIFFICULTIES.map((diff) => (
                          <button
                            key={diff.id}
                            onClick={() => setSelectedDifficulty(diff.id)}
                            className={cn(
                              'flex items-center justify-center gap-1 px-2 py-2 rounded-lg transition-all text-xs font-medium',
                              selectedDifficulty === diff.id
                                ? `${diff.bg} ${diff.color} ring-2 ring-current`
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                            )}
                          >
                            <diff.icon className="h-3 w-3" />
                            <span>{diff.name}</span>
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {DIFFICULTIES.find(d => d.id === selectedDifficulty)?.description}
                      </p>
                    </div>
                  )}

                  {/* Placeholder for human mode to maintain layout */}
                  {opponentType === 'human' && (
                    <div className="flex items-center justify-center h-[76px] text-slate-400 dark:text-slate-600 text-sm">
                      <p className="text-center">Wait for someone to join<br />or invite from Online Users</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Start button */}
              <Button
                onClick={handleStartGame}
                disabled={createLoading}
                className={cn(
                  'w-full mt-4',
                  opponentType === 'bot' && 'bg-amber-500 hover:bg-amber-600'
                )}
              >
                {opponentType === 'bot' ? (
                  <>
                    <Bot className="h-4 w-4 mr-2" />
                    {createLoading ? 'Starting...' : 'Start Game'}
                  </>
                ) : (
                  <>
                    <Users className="h-4 w-4 mr-2" />
                    {createLoading ? 'Creating...' : 'Create Game'}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

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
