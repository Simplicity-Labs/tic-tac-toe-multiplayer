// Board size configurations
// For rectangular boards: cols = width, rows = height
export const BOARD_SIZES = {
  3: { size: 3, cols: 3, rows: 3, winLength: 3, label: '3×3', description: 'Classic' },
  4: { size: 4, cols: 4, rows: 4, winLength: 3, label: '4×4', description: '3 in a row' },
  5: { size: 5, cols: 5, rows: 5, winLength: 4, label: '5×5', description: '4 in a row' },
  7: { size: 7, cols: 7, rows: 6, winLength: 4, label: '7×6', description: 'Connect 4' },
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

// Generate winning combinations for any board size (supports rectangular boards)
export function getWinningCombinations(boardSize = 3) {
  const config = BOARD_SIZES[boardSize] || BOARD_SIZES[3]
  const { cols, rows, winLength } = config
  const combinations = []

  // Helper to get index from row, col (row-major order)
  const getIndex = (row, col) => row * cols + col

  // Horizontal wins
  for (let row = 0; row < rows; row++) {
    for (let startCol = 0; startCol <= cols - winLength; startCol++) {
      const combo = []
      for (let i = 0; i < winLength; i++) {
        combo.push(getIndex(row, startCol + i))
      }
      combinations.push(combo)
    }
  }

  // Vertical wins
  for (let col = 0; col < cols; col++) {
    for (let startRow = 0; startRow <= rows - winLength; startRow++) {
      const combo = []
      for (let i = 0; i < winLength; i++) {
        combo.push(getIndex(startRow + i, col))
      }
      combinations.push(combo)
    }
  }

  // Diagonal wins (top-left to bottom-right)
  for (let startRow = 0; startRow <= rows - winLength; startRow++) {
    for (let startCol = 0; startCol <= cols - winLength; startCol++) {
      const combo = []
      for (let i = 0; i < winLength; i++) {
        combo.push(getIndex(startRow + i, startCol + i))
      }
      combinations.push(combo)
    }
  }

  // Diagonal wins (top-right to bottom-left)
  for (let startRow = 0; startRow <= rows - winLength; startRow++) {
    for (let startCol = winLength - 1; startCol < cols; startCol++) {
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
  if (length === 42) return 7 // 7x6 Connect 4 style
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
function getMaxDepth(boardSize, isGravityMode = false) {
  if (isGravityMode) {
    // Gravity mode has fewer branching factor (only 7 columns vs all cells)
    switch (boardSize) {
      case 7: return 6  // Connect 4 can go deeper since only 7 moves per turn
      default: return 5
    }
  }
  switch (boardSize) {
    case 3: return 9  // Full search for 3x3
    case 4: return 6  // Limited for 4x4
    case 5: return 4  // More limited for 5x5
    case 7: return 4  // Limited for 7x6 (non-gravity, unlikely)
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

// Minimax for gravity mode - only considers column moves
function minimaxGravity(board, depth, isMaximizing, alpha, beta, maxDepth, boardSize) {
  const result = checkWinner(board)

  if (result) {
    return result.winner === 'O' ? 1000 - depth : depth - 1000
  }

  if (checkDraw(board)) {
    return 0
  }

  if (depth >= maxDepth) {
    return evaluatePosition(board, boardSize)
  }

  const availableCols = getAvailableColumns(board, boardSize)

  if (isMaximizing) {
    let maxEval = -Infinity
    for (const col of availableCols) {
      const pos = getColumnPreviewPosition(board, col, boardSize)
      if (pos === null) continue
      const newBoard = [...board]
      newBoard[pos] = 'O'
      const evalScore = minimaxGravity(newBoard, depth + 1, false, alpha, beta, maxDepth, boardSize)
      maxEval = Math.max(maxEval, evalScore)
      alpha = Math.max(alpha, evalScore)
      if (beta <= alpha) break
    }
    return maxEval
  } else {
    let minEval = Infinity
    for (const col of availableCols) {
      const pos = getColumnPreviewPosition(board, col, boardSize)
      if (pos === null) continue
      const newBoard = [...board]
      newBoard[pos] = 'X'
      const evalScore = minimaxGravity(newBoard, depth + 1, true, alpha, beta, maxDepth, boardSize)
      minEval = Math.min(minEval, evalScore)
      beta = Math.min(beta, evalScore)
      if (beta <= alpha) break
    }
    return minEval
  }
}

// Get the best move for AI (O player)
export function getBestMove(board, isGravityMode = false) {
  const boardSize = getBoardSize(board)
  const maxDepth = getMaxDepth(boardSize, isGravityMode)
  let bestScore = -Infinity
  let bestMove = null

  if (isGravityMode) {
    // Gravity mode: only consider column moves
    const availableCols = getAvailableColumns(board, boardSize)
    for (const col of availableCols) {
      const pos = getColumnPreviewPosition(board, col, boardSize)
      if (pos === null) continue
      const newBoard = [...board]
      newBoard[pos] = 'O'
      const score = minimaxGravity(newBoard, 0, false, -Infinity, Infinity, maxDepth, boardSize)
      if (score > bestScore) {
        bestScore = score
        bestMove = pos
      }
    }
  } else {
    // Standard mode: consider all empty cells
    for (const move of getAvailableMoves(board)) {
      const newBoard = [...board]
      newBoard[move] = 'O'
      const score = minimax(newBoard, 0, false, -Infinity, Infinity, maxDepth, boardSize)
      if (score > bestScore) {
        bestScore = score
        bestMove = move
      }
    }
  }

  return bestMove
}

// Get a random move (easy AI)
export function getRandomMove(board, isGravityMode = false) {
  const boardSize = getBoardSize(board)
  if (isGravityMode) {
    const availableCols = getAvailableColumns(board, boardSize)
    const randomCol = availableCols[Math.floor(Math.random() * availableCols.length)]
    return getColumnPreviewPosition(board, randomCol, boardSize)
  }
  const available = getAvailableMoves(board)
  return available[Math.floor(Math.random() * available.length)]
}

// Medium AI - mix of smart and random moves
export function getMediumMove(board, isGravityMode = false) {
  const boardSize = getBoardSize(board)
  const config = BOARD_SIZES[boardSize] || BOARD_SIZES[3]
  const { cols, rows } = config

  // Get available moves based on mode
  const available = isGravityMode
    ? getAvailableColumns(board, boardSize).map(col => getColumnPreviewPosition(board, col, boardSize)).filter(p => p !== null)
    : getAvailableMoves(board)

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

    // For gravity mode, prefer center column
    if (isGravityMode) {
      const centerCol = Math.floor(cols / 2)
      const centerPos = getColumnPreviewPosition(board, centerCol, boardSize)
      if (centerPos !== null) return centerPos
    } else {
      // Take center if available (works for odd-sized boards)
      const centerCol = Math.floor(cols / 2)
      const centerRow = Math.floor(rows / 2)
      const center = centerRow * cols + centerCol
      if (isEmpty(board[center])) return center

      // Take a corner
      const corners = getCorners(boardSize).filter(i => isEmpty(board[i]))
      if (corners.length > 0) {
        return corners[Math.floor(Math.random() * corners.length)]
      }
    }
  }

  return getRandomMove(board, isGravityMode)
}

// Get corner indices for a board (supports rectangular boards)
function getCorners(boardSize) {
  const config = BOARD_SIZES[boardSize] || BOARD_SIZES[3]
  const { cols, rows } = config
  return [
    0,                           // top-left
    cols - 1,                    // top-right
    cols * (rows - 1),           // bottom-left
    cols * rows - 1              // bottom-right
  ]
}

// Get AI move based on difficulty
export function getAIMove(board, difficulty = 'hard', isGravityMode = false) {
  switch (difficulty) {
    case 'easy':
      return getRandomMove(board, isGravityMode)
    case 'medium':
      return getMediumMove(board, isGravityMode)
    case 'hard':
    default:
      return getBestMove(board, isGravityMode)
  }
}

// Create an empty board (supports rectangular boards)
export function createEmptyBoard(boardSize = 3) {
  const config = BOARD_SIZES[boardSize] || BOARD_SIZES[3]
  const totalCells = config.cols * config.rows
  return Array(totalCells).fill('')
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
  misere: {
    id: 'misere',
    name: 'Misère',
    description: 'Get 3 in a row and LOSE',
    icon: '🔄',
  },
  decay: {
    id: 'decay',
    name: 'Decay',
    description: 'Pieces fade after 4 turns',
    icon: '⏳',
  },
  gravity: {
    id: 'gravity',
    name: 'Gravity',
    description: 'Pieces fall to the bottom',
    icon: '⬇️',
  },
  random: {
    id: 'random',
    name: 'Random Start',
    description: 'Board starts with pieces',
    icon: '🎲',
  },
}

// Default decay turns before a piece disappears
export const DEFAULT_DECAY_TURNS = 4

// Create empty placed_at array for tracking piece ages (supports rectangular boards)
export function createEmptyPlacedAt(boardSize = 3) {
  const config = BOARD_SIZES[boardSize] || BOARD_SIZES[3]
  const totalCells = config.cols * config.rows
  return Array(totalCells).fill(null)
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

// ============================================
// GRAVITY MODE LOGIC
// ============================================

// Get board dimensions (cols, rows) from board size key
export function getBoardDimensions(boardSize) {
  const config = BOARD_SIZES[boardSize] || BOARD_SIZES[3]
  return { cols: config.cols, rows: config.rows }
}

// Get the column index from a board position
export function getColumn(position, boardSize) {
  const { cols } = getBoardDimensions(boardSize)
  return position % cols
}

// Get the row index from a board position
export function getRow(position, boardSize) {
  const { cols } = getBoardDimensions(boardSize)
  return Math.floor(position / cols)
}

// Get the board position from row and column
export function getPosition(row, col, boardSize) {
  const { cols } = getBoardDimensions(boardSize)
  return row * cols + col
}

// Find the lowest empty cell in a column (gravity drop position)
export function getGravityDropPosition(board, clickedPosition, boardSize) {
  const { cols, rows } = getBoardDimensions(boardSize)
  const col = getColumn(clickedPosition, boardSize)

  // Start from the bottom row and work up to find the lowest empty cell
  for (let row = rows - 1; row >= 0; row--) {
    const pos = getPosition(row, col, boardSize)
    if (isEmpty(board[pos])) {
      return pos
    }
  }

  // Column is full
  return null
}

// Check if a column is full (for gravity mode)
export function isColumnFull(board, col, boardSize) {
  // Check the top cell of the column
  const topPos = getPosition(0, col, boardSize)
  return !isEmpty(board[topPos])
}

// Get all columns that are not full (valid moves in gravity mode)
export function getAvailableColumns(board, boardSize) {
  const { cols } = getBoardDimensions(boardSize)
  const columns = []
  for (let col = 0; col < cols; col++) {
    if (!isColumnFull(board, col, boardSize)) {
      columns.push(col)
    }
  }
  return columns
}

// Get the preview position for a column (where piece would land)
export function getColumnPreviewPosition(board, col, boardSize) {
  const { rows } = getBoardDimensions(boardSize)
  for (let row = rows - 1; row >= 0; row--) {
    const pos = getPosition(row, col, boardSize)
    if (isEmpty(board[pos])) {
      return pos
    }
  }
  return null
}

// ============================================
// RANDOM START MODE LOGIC
// ============================================

// Create a board with random starting pieces (for Random Start mode)
// Places 1-2 pieces for each player, ensuring no winner yet
export function createRandomStartBoard(boardSize = 3) {
  const config = BOARD_SIZES[boardSize] || BOARD_SIZES[3]
  const totalCells = config.cols * config.rows
  const board = Array(totalCells).fill('')

  // Determine number of pieces to place (1-2 per player for small boards, 2-3 for larger)
  const piecesPerPlayer = boardSize >= 5 ? 2 + Math.floor(Math.random() * 2) : 1 + Math.floor(Math.random() * 2)

  // Get available positions
  const getAvailable = () => board.map((cell, i) => isEmpty(cell) ? i : -1).filter(i => i !== -1)

  // Place pieces alternately (X first, then O)
  for (let i = 0; i < piecesPerPlayer * 2; i++) {
    const player = i % 2 === 0 ? 'X' : 'O'
    const available = getAvailable()

    if (available.length === 0) break

    // Try to place without creating a winner
    let placed = false
    const shuffled = [...available].sort(() => Math.random() - 0.5)

    for (const pos of shuffled) {
      board[pos] = player
      if (!checkWinner(board)) {
        placed = true
        break
      }
      // Would create winner, undo and try another position
      board[pos] = ''
    }

    // If we couldn't place without winning, just skip this piece
    if (!placed) break
  }

  return board
}

// Get the Blitz timer duration
export const BLITZ_TIMER_DURATION = 5
