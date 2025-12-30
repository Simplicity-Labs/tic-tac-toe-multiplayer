// Board size configurations
export const BOARD_SIZES = {
  3: { size: 3, winLength: 3, label: '3x3', description: 'Classic' },
  4: { size: 4, winLength: 3, label: '4x4', description: '3 in a row' },
  5: { size: 5, winLength: 4, label: '5x5', description: '4 in a row' },
}

// Legacy 3x3 winning combinations for backwards compatibility
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

// Generate winning combinations for any board size
export function getWinningCombinations(boardSize = 3) {
  const config = BOARD_SIZES[boardSize] || BOARD_SIZES[3]
  const { size, winLength } = config
  const combinations = []

  // Helper to get index from row, col
  const getIndex = (row, col) => row * size + col

  // Horizontal wins
  for (let row = 0; row < size; row++) {
    for (let startCol = 0; startCol <= size - winLength; startCol++) {
      const combo = []
      for (let i = 0; i < winLength; i++) {
        combo.push(getIndex(row, startCol + i))
      }
      combinations.push(combo)
    }
  }

  // Vertical wins
  for (let col = 0; col < size; col++) {
    for (let startRow = 0; startRow <= size - winLength; startRow++) {
      const combo = []
      for (let i = 0; i < winLength; i++) {
        combo.push(getIndex(startRow + i, col))
      }
      combinations.push(combo)
    }
  }

  // Diagonal wins (top-left to bottom-right)
  for (let startRow = 0; startRow <= size - winLength; startRow++) {
    for (let startCol = 0; startCol <= size - winLength; startCol++) {
      const combo = []
      for (let i = 0; i < winLength; i++) {
        combo.push(getIndex(startRow + i, startCol + i))
      }
      combinations.push(combo)
    }
  }

  // Diagonal wins (top-right to bottom-left)
  for (let startRow = 0; startRow <= size - winLength; startRow++) {
    for (let startCol = winLength - 1; startCol < size; startCol++) {
      const combo = []
      for (let i = 0; i < winLength; i++) {
        combo.push(getIndex(startRow + i, startCol - i))
      }
      combinations.push(combo)
    }
  }

  return combinations
}

// Get board size from board array length
export function getBoardSize(board) {
  if (!board) return 3
  const length = board.length
  if (length === 9) return 3
  if (length === 16) return 4
  if (length === 25) return 5
  return 3
}

// Check if there's a winner
export function checkWinner(board) {
  const boardSize = getBoardSize(board)
  const combinations = getWinningCombinations(boardSize)
  const config = BOARD_SIZES[boardSize] || BOARD_SIZES[3]

  for (const combo of combinations) {
    const first = board[combo[0]]
    if (first && combo.every(idx => board[idx] === first)) {
      return {
        winner: first,
        line: combo,
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

// Get max search depth based on board size
function getMaxDepth(boardSize) {
  switch (boardSize) {
    case 3: return 9  // Full search for 3x3
    case 4: return 6  // Limited for 4x4
    case 5: return 4  // More limited for 5x5
    default: return 4
  }
}

// Heuristic evaluation for non-terminal positions
function evaluatePosition(board, boardSize) {
  const combinations = getWinningCombinations(boardSize)
  let score = 0

  for (const combo of combinations) {
    const cells = combo.map(i => board[i])
    const oCount = cells.filter(c => c === 'O').length
    const xCount = cells.filter(c => c === 'X').length

    // Only score lines that aren't blocked
    if (oCount > 0 && xCount === 0) {
      // AI has pieces, player doesn't - good for AI
      score += Math.pow(10, oCount)
    } else if (xCount > 0 && oCount === 0) {
      // Player has pieces, AI doesn't - bad for AI
      score -= Math.pow(10, xCount)
    }
  }

  return score
}

// Minimax algorithm for AI with depth limiting
function minimax(board, depth, isMaximizing, alpha, beta, maxDepth, boardSize) {
  const result = checkWinner(board)

  if (result) {
    return result.winner === 'O' ? 1000 - depth : depth - 1000
  }

  if (checkDraw(board)) {
    return 0
  }

  // Depth limit reached - use heuristic evaluation
  if (depth >= maxDepth) {
    return evaluatePosition(board, boardSize)
  }

  if (isMaximizing) {
    let maxEval = -Infinity
    for (const move of getAvailableMoves(board)) {
      const newBoard = [...board]
      newBoard[move] = 'O'
      const evalScore = minimax(newBoard, depth + 1, false, alpha, beta, maxDepth, boardSize)
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
      const evalScore = minimax(newBoard, depth + 1, true, alpha, beta, maxDepth, boardSize)
      minEval = Math.min(minEval, evalScore)
      beta = Math.min(beta, evalScore)
      if (beta <= alpha) break
    }
    return minEval
  }
}

// Get the best move for AI (O player)
export function getBestMove(board) {
  const boardSize = getBoardSize(board)
  const maxDepth = getMaxDepth(boardSize)
  let bestScore = -Infinity
  let bestMove = null

  for (const move of getAvailableMoves(board)) {
    const newBoard = [...board]
    newBoard[move] = 'O'
    const score = minimax(newBoard, 0, false, -Infinity, Infinity, maxDepth, boardSize)
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
  const boardSize = getBoardSize(board)

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

    // Take center if available (works for odd-sized boards)
    const center = Math.floor(board.length / 2)
    if (boardSize % 2 === 1 && isEmpty(board[center])) return center

    // Take a corner
    const corners = getCorners(boardSize).filter(i => isEmpty(board[i]))
    if (corners.length > 0) {
      return corners[Math.floor(Math.random() * corners.length)]
    }
  }

  return getRandomMove(board)
}

// Get corner indices for a board
function getCorners(boardSize) {
  const size = boardSize
  return [0, size - 1, size * (size - 1), size * size - 1]
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
export function createEmptyBoard(boardSize = 3) {
  const size = boardSize * boardSize
  return Array(size).fill('')
}

// Format time remaining for display
export function formatTime(seconds) {
  if (seconds <= 0) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// ============================================
// DECAY MODE LOGIC
// ============================================

// Game mode configurations
export const GAME_MODES = {
  classic: {
    id: 'classic',
    name: 'Classic',
    description: 'Standard Tic Tac Toe',
    icon: '🎮',
  },
  decay: {
    id: 'decay',
    name: 'Decay',
    description: 'Pieces fade after 4 turns',
    icon: '⏳',
  },
}

// Default decay turns before a piece disappears
export const DEFAULT_DECAY_TURNS = 4

// Create empty placed_at array for tracking piece ages
export function createEmptyPlacedAt(boardSize = 3) {
  const size = boardSize * boardSize
  return Array(size).fill(null)
}

// Apply decay to the board - removes pieces that have exceeded their lifespan
export function applyDecay(board, placedAt, currentTurn, decayAfter = DEFAULT_DECAY_TURNS) {
  if (!placedAt) return { board, placedAt }

  const newBoard = [...board]
  const newPlacedAt = [...placedAt]

  for (let i = 0; i < board.length; i++) {
    if (placedAt[i] !== null && currentTurn - placedAt[i] >= decayAfter) {
      // Piece has decayed
      newBoard[i] = ''
      newPlacedAt[i] = null
    }
  }

  return { board: newBoard, placedAt: newPlacedAt }
}

// Get turns remaining before a piece decays
export function getTurnsRemaining(placedAt, index, currentTurn, decayAfter = DEFAULT_DECAY_TURNS) {
  if (!placedAt || placedAt[index] === null) return null
  const remaining = decayAfter - (currentTurn - placedAt[index])
  return Math.max(0, remaining)
}

// Check if a piece is about to decay (1 turn remaining)
export function isAboutToDecay(placedAt, index, currentTurn, decayAfter = DEFAULT_DECAY_TURNS) {
  const remaining = getTurnsRemaining(placedAt, index, currentTurn, decayAfter)
  return remaining === 1
}

// Get decay status for all cells (for UI rendering)
export function getDecayStatus(board, placedAt, currentTurn, decayAfter = DEFAULT_DECAY_TURNS) {
  if (!placedAt) return null

  return board.map((cell, index) => {
    if (!cell || placedAt[index] === null) return null

    const turnsRemaining = getTurnsRemaining(placedAt, index, currentTurn, decayAfter)
    return {
      turnsRemaining,
      isAboutToDecay: turnsRemaining === 1,
      opacity: Math.min(1, (turnsRemaining / decayAfter) * 0.6 + 0.4), // 40% to 100% opacity
    }
  })
}
