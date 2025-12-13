import { useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Share2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useGame, useCreateGame } from '../hooks/useGame'
import { useTimer } from '../hooks/useTimer'
import { useToast } from '../components/ui/Toast'
import { Button } from '../components/ui/Button'
import { Board } from '../components/game/Board'
import { GameStatus } from '../components/game/GameStatus'
import { WinOverlay } from '../components/game/WinOverlay'

export default function Game() {
  const { gameId } = useParams()
  const navigate = useNavigate()
  const { user, refreshProfile } = useAuth()
  const { toast } = useToast()
  const { createGame } = useCreateGame()

  const {
    game,
    loading,
    error,
    playerX,
    playerO,
    makeMove,
    makeAIMove,
    handleTimeout,
    getPlayerSymbol,
    isMyTurn,
  } = useGame(gameId)

  // Timer for the current turn
  const { timeRemaining, isLow, percentage } = useTimer(
    game?.turn_started_at,
    game?.status === 'in_progress' && isMyTurn(),
    () => {
      if (isMyTurn()) {
        handleTimeout()
        toast({
          title: 'Time out!',
          description: 'You ran out of time and lost the game.',
          variant: 'destructive',
        })
      }
    }
  )

  // Handle AI move
  useEffect(() => {
    if (!game || !game.is_ai_game || game.status !== 'in_progress') return

    // It's AI's turn when current_turn is null (not player's turn)
    const isAITurn = game.current_turn === null || game.current_turn !== game.player_x

    if (isAITurn) {
      const timeout = setTimeout(() => {
        makeAIMove()
      }, 800) // Slight delay for better UX
      return () => clearTimeout(timeout)
    }
  }, [game?.board, game?.status, game?.current_turn, game?.is_ai_game, game?.player_x, makeAIMove])

  // Refresh profile when game ends
  useEffect(() => {
    if (game?.status === 'completed') {
      refreshProfile()
    }
  }, [game?.status, refreshProfile])

  const handleCellClick = async (position) => {
    if (!isMyTurn() || game?.status !== 'in_progress') return

    const { error } = await makeMove(position)
    if (error) {
      toast({
        title: 'Invalid move',
        description: error,
        variant: 'destructive',
      })
    }
  }

  const handlePlayAgain = async () => {
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

  const handleShare = () => {
    const url = window.location.href
    navigator.clipboard.writeText(url)
    toast({
      title: 'Link copied!',
      description: 'Share this link with a friend to play.',
      variant: 'success',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (error || !game) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h2 className="text-xl font-semibold mb-2">Game not found</h2>
        <p className="text-slate-500 mb-4">
          This game may have been deleted or doesn't exist.
        </p>
        <Button onClick={() => navigate('/')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>
    )
  }

  const currentPlayer = getPlayerSymbol()
  const isDisabled = !isMyTurn() || game.status !== 'in_progress'

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate('/')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        {game.status === 'waiting' && (
          <Button variant="outline" onClick={handleShare}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        )}
      </div>

      {/* Game status */}
      <GameStatus
        game={game}
        playerX={playerX}
        playerO={playerO}
        currentUserId={user?.id}
        timeRemaining={timeRemaining}
        isLow={isLow}
        percentage={percentage}
      />

      {/* Game board */}
      <Board
        board={game.board}
        onCellClick={handleCellClick}
        disabled={isDisabled}
        currentPlayer={currentPlayer}
      />

      {/* Game info */}
      {game.status === 'in_progress' && (
        <p className="text-center text-sm text-slate-500">
          You are playing as{' '}
          <span className={currentPlayer === 'X' ? 'text-primary-500 font-semibold' : 'text-rose-500 font-semibold'}>
            {currentPlayer}
          </span>
        </p>
      )}

      {/* Win overlay */}
      <WinOverlay
        game={game}
        currentUserId={user?.id}
        onPlayAgain={handlePlayAgain}
      />
    </div>
  )
}
