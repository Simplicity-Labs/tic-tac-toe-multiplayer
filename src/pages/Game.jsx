import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Share2, Flag, X, Eye } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useInvitations } from '../context/InvitationsContext'
import { usePresence } from '../hooks/usePresence'
import { useGame, useCreateGame } from '../hooks/useGame'
import { useTimer } from '../hooks/useTimer'
import { useGameReactions } from '../hooks/useGameReactions'
import { useToast } from '../components/ui/Toast'
import { Button } from '../components/ui/Button'
import { Board } from '../components/game/Board'
import { GameStatus } from '../components/game/GameStatus'
import { WinOverlay } from '../components/game/WinOverlay'
import { GameClosedOverlay } from '../components/game/GameClosedOverlay'
import { ReactionPicker } from '../components/game/ReactionPicker'
import { ReactionBubbleContainer } from '../components/game/ReactionBubble'
import {
  getAIReactionToPlayerMove,
  getAIReactionToOwnMove,
  getAIReactionToPlayerEmoji,
  getAIReactionToGameEnd,
} from '../lib/aiPersonality'

export default function Game() {
  const { gameId } = useParams()
  const navigate = useNavigate()
  const { user, profile, refreshProfile } = useAuth()
  const { sentInvite } = useInvitations()
  const { setCurrentGame } = usePresence()
  const { toast } = useToast()
  const { createGame } = useCreateGame()
  const [showForfeitModal, setShowForfeitModal] = useState(false)
  const [gameClosed, setGameClosed] = useState({ show: false, reason: 'deleted' })
  const pendingNavigationRef = useRef(null)
  const prevBoardRef = useRef(null)

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

  // Reaction system
  const {
    reactions,
    sentReactions,
    sendReaction,
    addAIReaction,
    canSend,
    cooldownRemaining,
  } = useGameReactions(gameId, user?.id, profile, game?.is_ai_game)

  // Check if game is active (can be forfeited)
  const isGameActive = game?.status === 'in_progress' || game?.status === 'waiting'
  const isPlayer = game && user && (game.player_x === user.id || game.player_o === user.id)

  // Update presence when entering/leaving a game
  const inGameRef = useRef(false)
  useEffect(() => {
    const shouldBeInGame = isPlayer && isGameActive

    // Only update if state actually changed
    if (shouldBeInGame && !inGameRef.current) {
      inGameRef.current = true
      setCurrentGame(gameId)
    } else if (!shouldBeInGame && inGameRef.current) {
      inGameRef.current = false
      setCurrentGame(null)
    }
  }, [isPlayer, isGameActive, gameId, setCurrentGame])

  // Clear presence on unmount
  useEffect(() => {
    return () => {
      if (inGameRef.current) {
        setCurrentGame(null)
      }
    }
  }, [setCurrentGame])

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

  // AI reactions to board changes (for AI games)
  useEffect(() => {
    if (!game?.is_ai_game || !game?.board || game.status !== 'in_progress') {
      prevBoardRef.current = game?.board || null
      return
    }

    const prevBoard = prevBoardRef.current
    const currentBoard = game.board

    // Skip if no previous board (initial load)
    if (!prevBoard) {
      prevBoardRef.current = currentBoard
      return
    }

    // Find what changed
    const changedIndex = currentBoard.findIndex((cell, i) => cell !== prevBoard[i])
    if (changedIndex === -1) {
      prevBoardRef.current = currentBoard
      return
    }

    const newSymbol = currentBoard[changedIndex]
    const isPlayerMove = newSymbol === 'X' // Player is always X in AI games
    const isAIMove = newSymbol === 'O'

    if (isPlayerMove) {
      // Player just moved - AI might react
      const reaction = getAIReactionToPlayerMove({
        boardBefore: prevBoard,
        boardAfter: currentBoard,
        difficulty: game.ai_difficulty || 'hard',
        playerSymbol: 'X',
      })
      if (reaction) {
        addAIReaction(reaction.emoji, reaction.delay)
      }
    } else if (isAIMove) {
      // AI just moved - might taunt
      const reaction = getAIReactionToOwnMove({
        boardAfter: currentBoard,
        difficulty: game.ai_difficulty || 'hard',
        isWinningMove: game.status === 'completed' && game.winner === 'ai',
        isBlockingMove: false, // Could calculate this but keeping simple for now
      })
      if (reaction) {
        addAIReaction(reaction.emoji, reaction.delay)
      }
    }

    prevBoardRef.current = currentBoard
  }, [game?.board, game?.is_ai_game, game?.status, game?.ai_difficulty, game?.winner, addAIReaction])

  // AI reaction to game end
  useEffect(() => {
    if (!game?.is_ai_game || game?.status !== 'completed') return

    const reaction = getAIReactionToGameEnd({
      winner: game.winner,
      difficulty: game.ai_difficulty || 'hard',
      isAIWinner: game.winner === 'ai',
    })
    if (reaction) {
      addAIReaction(reaction.emoji, reaction.delay + 500) // Extra delay after game ends
    }
  }, [game?.status, game?.winner, game?.is_ai_game, game?.ai_difficulty, addAIReaction])

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

  // Handle sending a reaction
  const handleReaction = async (emoji) => {
    await sendReaction(emoji)

    // If AI game, trigger AI response to player emoji
    if (game?.is_ai_game) {
      const reaction = getAIReactionToPlayerEmoji({
        playerEmoji: emoji,
        difficulty: game.ai_difficulty || 'hard',
        isAIWinning: false, // Could calculate game advantage
        isPlayerWinning: false,
        gameOver: game.status === 'completed',
      })
      if (reaction) {
        addAIReaction(reaction.emoji, reaction.delay)
      }
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

      {/* Game status with reaction bubbles */}
      <div className="relative">
        <GameStatus
          game={game}
          playerX={playerX}
          playerO={playerO}
          currentUserId={user?.id}
          timeRemaining={timeRemaining}
          isLow={isLow}
          percentage={percentage}
        />
        {/* Reaction bubbles from opponent/AI */}
        <div className="absolute right-2 top-0">
          <ReactionBubbleContainer
            reactions={reactions}
            position="right"
            onReactionComplete={() => {}}
          />
        </div>
        {/* Our sent reactions (visual feedback) */}
        <div className="absolute left-2 top-0">
          <ReactionBubbleContainer
            reactions={sentReactions}
            position="left"
            onReactionComplete={() => {}}
          />
        </div>
      </div>

      {/* Game board */}
      <Board
        board={game.board}
        onCellClick={handleCellClick}
        disabled={isDisabled}
        currentPlayer={currentPlayer}
      />

      {/* Game info */}
      {game.status === 'in_progress' && (
        isPlayer ? (
          <p className="text-center text-sm text-slate-500">
            You are playing as{' '}
            <span className={currentPlayer === 'X' ? 'text-primary-500 font-semibold' : 'text-rose-500 font-semibold'}>
              {currentPlayer}
            </span>
          </p>
        ) : (
          <p className="text-center text-sm text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-2">
            <Eye className="h-4 w-4" />
            You are spectating this game
          </p>
        )
      )}

      {/* Floating reaction picker */}
      {isPlayer && game?.status === 'in_progress' && (
        <div className="fixed bottom-6 left-6 z-30">
          <ReactionPicker
            onReact={handleReaction}
            disabled={false}
            canSend={canSend}
            cooldownRemaining={cooldownRemaining}
          />
        </div>
      )}

      {/* Win overlay */}
      <WinOverlay
        game={game}
        currentUserId={user?.id}
        onPlayAgain={handlePlayAgain}
        playerX={playerX}
        playerO={playerO}
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
