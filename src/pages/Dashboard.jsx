import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Bot, Users } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useAvailableGames, useCreateGame, useJoinGame } from '../hooks/useGame'
import { useToast } from '../components/ui/Toast'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { StatsCard } from '../components/dashboard/StatsCard'
import { GameList } from '../components/dashboard/GameList'

export default function Dashboard() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { games, loading: gamesLoading, refetch } = useAvailableGames()
  const { createGame, loading: createLoading } = useCreateGame()
  const { joinGame, loading: joinLoading } = useJoinGame()
  const { toast } = useToast()

  const handleCreateGame = async () => {
    const { data, error } = await createGame(false)
    if (error) {
      toast({
        title: 'Error',
        description: error,
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Game created!',
        description: 'Waiting for an opponent to join...',
        variant: 'success',
      })
      navigate(`/game/${data.id}`)
    }
  }

  const handlePlayAI = async () => {
    const { data, error } = await createGame(true)
    if (error) {
      toast({
        title: 'Error',
        description: error,
        variant: 'destructive',
      })
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
      <div className="grid sm:grid-cols-2 gap-4">
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

        <Card className="hover:shadow-md transition-shadow cursor-pointer group" onClick={handlePlayAI}>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-colors">
                <Bot className="h-5 w-5 text-amber-500 group-hover:text-white" />
              </div>
              Play vs AI
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500 mb-4">
              Challenge our unbeatable AI opponent
            </p>
            <Button variant="secondary" disabled={createLoading} className="w-full">
              <Bot className="h-4 w-4 mr-2" />
              {createLoading ? 'Starting...' : 'Play AI'}
            </Button>
          </CardContent>
        </Card>
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
