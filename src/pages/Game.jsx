import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Share2, Flag, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useInvitations } from '../context/InvitationsContext'
import { useGame, useCreateGame } from '../hooks/useGame'
import { useTimer } from '../hooks/useTimer'
import { useToast } from '../components/ui/Toast'
import { Button } from '../components/ui/Button'
import { Board } from '../components/game/Board'
import { GameStatus } from '../components/game/GameStatus'
import { WinOverlay } from '../components/game/WinOverlay'
import { GameClosedOverlay } from '../components/game/GameClosedOverlay'

export default function Game() {
  const { gameId } = useParams()
  const navigate = useNavigate()
  const { user, refreshProfile } = useAuth()
  const { sentInvite } = useInvitations()
  const { toast } = useToast()
  const { createGame } = useCreateGame()
  const [showForfeitModal, setShowForfeitModal] = useState(false)
  const [gameClosed, setGameClosed] = useState({ show: false, reason: 'deleted' })
  const pendingNavigationRef = useRef(null)

  const {
    game,
    loading,
    error,
    playerX,
    playerO,
    makeMove,
    makeAIMove,
    handleTimeout,
    forfeit,
    getPlayerSymbol,
    isMyTurn,
  } = useGame(gameId)

  // Check if game is active (can be forfeited)
  const isGameActive = game?.status === 'in_progress' || game?.status === 'waiting'
  const isPlayer = game && user && (game.player_x === user.id || game.player_o === user.id)

  // Show overlay if invite was declined
  useEffect(() => {
    if (sentInvite?.declined && sentInvite?.gameId === gameId) {
      setGameClosed({ show: true, reason: 'declined' })
    }
  }, [sentInvite?.declined, sentInvite?.gameId, gameId])

  // Show overlay if game is deleted/not found (after initial load)
  useEffect(() => {
    if (!loading && (error || !game) && !gameClosed.show) {
      setGameClosed({ show: true, reason: 'deleted' })
    }
  }, [loading, error, game, gameClosed.show])

  // Warn on browser close/refresh when game is active
  useEffect(() => {
    if (!isGameActive || !isPlayer) return

    const handleBeforeUnload = (e) => {
      e.preventDefault()
      e.returnValue = ''
      return ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isGameActive, isPlayer])

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
    const difficulty = game?.ai_difficulty || 'hard'
    const { data, error } = await createGame(true, difficulty)
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

  const handleForfeit = async () => {
    const { error, cancelled } = await forfeit()
    if (error) {
      toast({
        title: 'Error',
        description: error,
        variant: 'destructive',
      })
    } else {
      if (cancelled) {
        toast({
          title: 'Game cancelled',
          description: 'The game has been cancelled.',
        })
      } else {
        toast({
          title: 'Game forfeited',
          description: 'You have forfeited the game.',
          variant: 'destructive',
        })
      }
      setShowForfeitModal(false)
      // Navigate to dashboard or pending location
      const destination = pendingNavigationRef.current || '/'
      pendingNavigationRef.current = null
      navigate(destination)
    }
  }

  const handleCancelForfeit = () => {
    setShowForfeitModal(false)
    pendingNavigationRef.current = null
  }

  const handleNavigateAway = (path) => {
    if (isGameActive && isPlayer) {
      pendingNavigationRef.current = path
      setShowForfeitModal(true)
    } else {
      navigate(path)
    }
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
        <Button
          variant="ghost"
          onClick={() => handleNavigateAway('/')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex items-center gap-2">
          {game.status === 'waiting' && (
            <Button variant="outline" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          )}
          {isGameActive && isPlayer && (
            <Button variant="destructive" onClick={() => setShowForfeitModal(true)}>
              <Flag className="h-4 w-4 mr-2" />
              Forfeit
            </Button>
          )}
        </div>
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

      {/* Game closed overlay (invite declined, game deleted, etc.) */}
      <GameClosedOverlay
        show={gameClosed.show}
        reason={gameClosed.reason}
      />

      {/* Forfeit/Cancel confirmation modal */}
      {showForfeitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-sm w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-rose-600 dark:text-rose-400">
                {game?.status === 'waiting' ? 'Cancel Game?' : 'Forfeit Game?'}
              </h2>
              <button
                onClick={handleCancelForfeit}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-slate-600 dark:text-slate-300 mb-6">
              {game?.status === 'waiting'
                ? 'Are you sure you want to cancel this game? The game will be deleted.'
                : 'Are you sure you want to forfeit? This will count as a loss.'}
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleCancelForfeit}
              >
                {game?.status === 'waiting' ? 'Keep Waiting' : 'Keep Playing'}
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleForfeit}
              >
                <Flag className="h-4 w-4 mr-2" />
                {game?.status === 'waiting' ? 'Cancel Game' : 'Forfeit'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
