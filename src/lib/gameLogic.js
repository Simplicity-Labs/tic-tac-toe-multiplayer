// Winning combinations (indices of the board array)
export const WINNING_COMBINATIONS = [
  [0, 1, 2], // Top row
  [3, 4, 5], // Middle row
  [6, 7, 8], // Bottom row
  [0, 3, 6], // Left column
  [1, 4, 7], // Middle column
  [2, 5, 8], // Right column
  [0, 4, 8], // Diagonal top-left to bottom-right
  [2, 4, 6], // Diagonal top-right to bottom-left
]

// Check if there's a winner
export function checkWinner(board) {
  for (const [a, b, c] of WINNING_COMBINATIONS) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return {
        winner: board[a],
        line: [a, b, c],
      }
    }
  }
  return null
}

// Helper to check if a cell is empty (handles null from Supabase)
export function isEmpty(cell) {
  return !cell || cell === ''
}

// Check if the game is a draw (all cells filled, no winner)
export function checkDraw(board) {
  const allFilled = board.every((cell) => cell === 'X' || cell === 'O')
  return allFilled && !checkWinner(board)
}

// Check if the game is over
export function isGameOver(board) {
  return checkWinner(board) !== null || checkDraw(board)
}

// Get available moves
export function getAvailableMoves(board) {
  return board
    .map((cell, index) => (isEmpty(cell) ? index : null))
    .filter((index) => index !== null)
}

// Minimax algorithm for AI
function minimax(board, depth, isMaximizing, alpha, beta) {
  const result = checkWinner(board)

  if (result) {
    return result.winner === 'O' ? 10 - depth : depth - 10
  }

  if (checkDraw(board)) {
    return 0
  }

  if (isMaximizing) {
    let maxEval = -Infinity
    for (const move of getAvailableMoves(board)) {
      const newBoard = [...board]
      newBoard[move] = 'O'
      const evalScore = minimax(newBoard, depth + 1, false, alpha, beta)
      maxEval = Math.max(maxEval, evalScore)
      alpha = Math.max(alpha, evalScore)
      if (beta <= alpha) break
    }
    return maxEval
  } else {
    let minEval = Infinity
    for (const move of getAvailableMoves(board)) {
      const newBoard = [...board]
      newBoard[move] = 'X'
      const evalScore = minimax(newBoard, depth + 1, true, alpha, beta)
      minEval = Math.min(minEval, evalScore)
      beta = Math.min(beta, evalScore)
      if (beta <= alpha) break
    }
    return minEval
  }
}

// Get the best move for AI (O player)
export function getBestMove(board) {
  let bestScore = -Infinity
  let bestMove = null

  for (const move of getAvailableMoves(board)) {
    const newBoard = [...board]
    newBoard[move] = 'O'
    const score = minimax(newBoard, 0, false, -Infinity, Infinity)
    if (score > bestScore) {
      bestScore = score
      bestMove = move
    }
  }

  return bestMove
}

// Get a random move (easy AI)
export function getRandomMove(board) {
  const available = getAvailableMoves(board)
  return available[Math.floor(Math.random() * available.length)]
}

// Medium AI - mix of smart and random moves
export function getMediumMove(board) {
  const available = getAvailableMoves(board)

  // 60% chance to make a smart move, 40% random
  if (Math.random() < 0.6) {
    // Check if AI can win
    for (const move of available) {
      const testBoard = [...board]
      testBoard[move] = 'O'
      if (checkWinner(testBoard)) return move
    }

    // Block player from winning
    for (const move of available) {
      const testBoard = [...board]
      testBoard[move] = 'X'
      if (checkWinner(testBoard)) return move
    }

    // Take center if available
    if (isEmpty(board[4])) return 4

    // Take a corner
    const corners = [0, 2, 6, 8].filter(i => isEmpty(board[i]))
    if (corners.length > 0) {
      return corners[Math.floor(Math.random() * corners.length)]
    }
  }

  return getRandomMove(board)
}

// Get AI move based on difficulty
export function getAIMove(board, difficulty = 'hard') {
  switch (difficulty) {
    case 'easy':
      return getRandomMove(board)
    case 'medium':
      return getMediumMove(board)
    case 'hard':
    default:
      return getBestMove(board)
  }
}

// Create an empty board
export function createEmptyBoard() {
  return Array(9).fill('')
}

// Format time remaining for display
export function formatTime(seconds) {
  if (seconds <= 0) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
