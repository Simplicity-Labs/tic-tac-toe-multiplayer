import { describe, it, expect } from 'vitest'
import {
  checkWinner,
  checkDraw,
  createEmptyBoard,
  isEmpty,
  getAIMove,
  getBoardSize,
  BOARD_SIZES,
  getWinningCombinations,
  applyDecay,
  DEFAULT_DECAY_TURNS,
  bombRandomCell,
  isBombed,
  checkDrawWithBombs,
  placeRandomBlocker,
  BLOCKER_MARKER,
  checkDrawWithBlockers,
  getGravityDropPosition,
  createRandomStartBoard,
  createEmptyPlacedAt,
} from '../src/lib/gameLogic.js'

describe('gameLogic — core', () => {
  it('createEmptyBoard creates correct size', () => {
    const board3 = createEmptyBoard(3)
    expect(board3).toHaveLength(9)
    expect(board3.every((c) => c === '')).toBe(true)

    const board5 = createEmptyBoard(5)
    expect(board5).toHaveLength(25)
  })

  it('checkWinner detects row win', () => {
    const board = ['X', 'X', 'X', '', '', '', '', '', '']
    expect(checkWinner(board)).toBeTruthy()
  })

  it('checkWinner detects column win', () => {
    const board = ['O', '', '', 'O', '', '', 'O', '', '']
    expect(checkWinner(board)).toBeTruthy()
  })

  it('checkWinner detects diagonal win', () => {
    const board = ['X', '', '', '', 'X', '', '', '', 'X']
    expect(checkWinner(board)).toBeTruthy()
  })

  it('checkWinner returns null for no winner', () => {
    const board = ['X', 'O', 'X', '', '', '', '', '', '']
    expect(checkWinner(board)).toBeNull()
  })

  it('checkDraw detects full board with no winner', () => {
    const board = ['X', 'O', 'X', 'X', 'O', 'O', 'O', 'X', 'X']
    // This is a known draw board
    expect(checkDraw(board)).toBe(true)
  })

  it('checkDraw returns false for incomplete board', () => {
    const board = ['X', 'O', '', '', '', '', '', '', '']
    expect(checkDraw(board)).toBe(false)
  })

  it('isEmpty correctly checks cells', () => {
    expect(isEmpty('')).toBe(true)
    expect(isEmpty('X')).toBe(false)
    expect(isEmpty('O')).toBe(false)
    expect(isEmpty(null)).toBe(true)
    expect(isEmpty(undefined)).toBe(true)
  })

  it('getBoardSize extracts the correct board size', () => {
    const board3 = createEmptyBoard(3)
    expect(getBoardSize(board3)).toBe(3)

    const board5 = createEmptyBoard(5)
    expect(getBoardSize(board5)).toBe(5)
  })
})

describe('gameLogic — AI', () => {
  it('getAIMove returns a valid move (easy)', () => {
    const board = ['X', '', '', '', '', '', '', '', '']
    const move = getAIMove(board, 'easy')
    expect(move).toBeGreaterThanOrEqual(1)
    expect(move).toBeLessThanOrEqual(8)
    expect(board[move]).toBe('')
  })

  it('getAIMove returns null for full board', () => {
    const board = ['X', 'O', 'X', 'X', 'O', 'O', 'O', 'X', 'X']
    const move = getAIMove(board, 'hard')
    expect(move).toBeNull()
  })

  it('getAIMove blocks winning move (hard)', () => {
    // X has two in a row — hard AI should block
    const board = ['X', 'X', '', '', 'O', '', '', '', '']
    const move = getAIMove(board, 'hard')
    // AI should place at position 2 to block
    expect(move).toBe(2)
  })
})

describe('gameLogic — board sizes', () => {
  it('BOARD_SIZES has correct configurations', () => {
    expect(BOARD_SIZES[3].winLength).toBe(3)
    expect(BOARD_SIZES[4].winLength).toBe(3)
    expect(BOARD_SIZES[5].winLength).toBe(4)
    expect(BOARD_SIZES[7].cols).toBe(7)
    expect(BOARD_SIZES[7].rows).toBe(6)
  })

  it('getWinningCombinations generates combos for 3x3', () => {
    const combos = getWinningCombinations(3)
    expect(combos.length).toBeGreaterThan(0)
    // 3 rows + 3 cols + 2 diags = 8
    expect(combos.length).toBe(8)
  })
})

describe('gameLogic — gravity mode', () => {
  it('getGravityDropPosition drops piece to bottom', () => {
    const board = createEmptyBoard(3)
    const boardSize = getBoardSize(board)
    // Clicking top-left (0) should drop to bottom-left (6)
    const pos = getGravityDropPosition(board, 0, boardSize, [])
    expect(pos).toBe(6)
  })

  it('getGravityDropPosition stacks pieces', () => {
    const board = ['', '', '', '', '', '', 'X', '', '']
    const boardSize = getBoardSize(board)
    // Column 0 already has X at position 6, should drop to 3
    const pos = getGravityDropPosition(board, 0, boardSize, [])
    expect(pos).toBe(3)
  })
})

describe('gameLogic — bomb mode', () => {
  it('bombRandomCell returns a valid position', () => {
    const board = ['X', 'O', '', 'X', '', '', '', '', '']
    const result = bombRandomCell(board, [])
    expect(result).not.toBeNull()
    expect(board[result]).toBe('')
  })

  it('isBombed correctly identifies bombed cells', () => {
    expect(isBombed(3, [1, 3, 5])).toBe(true)
    expect(isBombed(2, [1, 3, 5])).toBe(false)
  })
})

describe('gameLogic — blocker mode', () => {
  it('placeRandomBlocker places a blocker', () => {
    const board = ['X', '', '', '', '', '', '', '', '']
    const result = placeRandomBlocker(board)
    expect(result.blockerPosition).not.toBeNull()
    expect(result.board[result.blockerPosition]).toBe(BLOCKER_MARKER)
  })
})

describe('gameLogic — decay mode', () => {
  it('createEmptyPlacedAt creates correct size', () => {
    const placedAt = createEmptyPlacedAt(3)
    expect(placedAt).toHaveLength(9)
    expect(placedAt.every((v) => v === null)).toBe(true)
  })

  it('applyDecay removes expired pieces', () => {
    const board = ['X', '', '', '', '', '', '', '', '']
    const placedAt = [1, null, null, null, null, null, null, null, null]
    // With DEFAULT_DECAY_TURNS, piece placed at turn 1 should decay after enough turns
    const result = applyDecay(board, placedAt, 1 + DEFAULT_DECAY_TURNS + 1, DEFAULT_DECAY_TURNS)
    expect(result.board[0]).toBe('')
    expect(result.placedAt[0]).toBeNull()
  })
})

describe('gameLogic — random start mode', () => {
  it('createRandomStartBoard returns board with some pieces', () => {
    const board = createRandomStartBoard(3)
    expect(board).toHaveLength(9)
    // Should have some non-empty cells
    const filled = board.filter((c) => c !== '')
    expect(filled.length).toBeGreaterThan(0)
  })
})
