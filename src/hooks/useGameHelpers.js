/**
 * Helper functions for processing game moves locally (AI games).
 * Extracted from useGame.js to keep files under 500 LOC.
 */
import { wsClient } from '../lib/ws'
import {
  checkWinner,
  checkDraw,
  isEmpty,
  applyDecay,
  DEFAULT_DECAY_TURNS,
  getGravityDropPosition,
  getBoardSize,
  bombRandomCell,
  isBombed,
  checkDrawWithBombs,
  placeRandomBlocker,
  BLOCKER_MARKER,
  checkDrawWithBlockers,
} from '../lib/gameLogic'

/** Normalize server game (camelCase) to the shape UI expects (snake_case) */
export function normalizeGame(g) {
  if (!g) return null
  if ('player_x' in g) return g
  return {
    id: g.id,
    player_x: g.playerX,
    player_o: g.playerO,
    board: g.board,
    current_turn: g.currentTurn,
    status: g.status,
    winner: g.winner,
    is_ai_game: g.isAiGame,
    ai_difficulty: g.aiDifficulty,
    board_size: g.boardSize,
    turn_duration: g.turnDuration,
    game_mode: g.gameMode,
    turn_started_at: g.turnStartedAt,
    created_at: g.createdAt,
    completed_at: g.completedAt,
    invited_player_id: g.invitedPlayerId,
    forfeit_by: g.forfeitBy,
    turn_count: g.turnCount,
    placed_at: g.placedAt,
    decay_turns: g.decayTurns,
    bombed_cells: g.bombedCells,
    creator: g.creator,
    player_x_profile: g.player_x_profile,
    player_o_profile: g.player_o_profile,
  }
}

/** Apply game mode effects (decay, bombs, blockers) after placing a piece */
function applyGameModeEffects(game, newBoard, newPlacedAt, newTurnCount, winResult, isDraw) {
  const isBombMode = game.game_mode === 'bomb'
  const isBlockerMode = game.game_mode === 'blocker'
  const isDecayMode = game.game_mode === 'decay'

  const updates = {}

  // Apply decay
  if (isDecayMode && newPlacedAt && !winResult && !isDraw) {
    const decayResult = applyDecay(newBoard, newPlacedAt, newTurnCount, game.decay_turns || DEFAULT_DECAY_TURNS)
    newBoard = decayResult.board
    newPlacedAt = decayResult.placedAt
  }

  if (isDecayMode) updates.placed_at = newPlacedAt

  // Bomb mode: bomb a random cell every 2 turns
  let newBombedCells = game.bombed_cells || []
  if (isBombMode && !winResult && !isDraw && newTurnCount >= 2 && newTurnCount % 2 === 0) {
    const bombed = bombRandomCell(newBoard, newBombedCells)
    if (bombed !== null) {
      newBombedCells = [...newBombedCells, bombed]
      updates.bombed_cells = newBombedCells
    }
  }

  // Blocker mode: place random blocker after each move
  if (isBlockerMode && !winResult && !isDraw) {
    const blockerResult = placeRandomBlocker(newBoard)
    if (blockerResult.blockerPosition !== null) {
      newBoard = blockerResult.board
      isDraw = checkDrawWithBlockers(newBoard)
      if (isDraw) {
        updates.status = 'completed'
        updates.winner = null
        updates.completed_at = new Date().toISOString()
      }
    }
  }

  return { newBoard, newPlacedAt, newBombedCells, isDraw, updates }
}

/** Validate a move position on the board */
function validatePosition(game, position) {
  const board = game.board
  const isGravity = game.game_mode === 'gravity'
  const isBombMode = game.game_mode === 'bomb'
  const isBlockerMode = game.game_mode === 'blocker'

  if (isGravity) {
    const boardSize = getBoardSize(board)
    const bombedCells = isBombMode ? (game.bombed_cells || []) : []
    const actualPosition = getGravityDropPosition(board, position, boardSize, bombedCells)
    if (actualPosition === null) return { error: 'Column is full', actualPosition: null }
    return { error: null, actualPosition }
  }

  if (!isEmpty(board[position])) return { error: 'Position already taken', actualPosition: null }
  if (isBombMode && isBombed(position, game.bombed_cells || [])) return { error: 'Cell bombed', actualPosition: null }
  if (isBlockerMode && board[position] === BLOCKER_MARKER) return { error: 'Cell blocked', actualPosition: null }

  return { error: null, actualPosition: position }
}

/** Process a human move in an AI game locally, then sync to server */
export async function makeLocalMove(game, user, position, setGame) {
  const { error, actualPosition } = validatePosition(game, position)
  if (error) return { error }

  const symbol = game.player_x === user.id ? 'X' : 'O'
  let newBoard = [...game.board]
  newBoard[actualPosition] = symbol

  let newPlacedAt = game.placed_at ? [...game.placed_at] : null
  let newTurnCount = (game.turn_count || 0) + 1
  const isDecayMode = game.game_mode === 'decay'

  if (isDecayMode && newPlacedAt) {
    newPlacedAt[actualPosition] = newTurnCount
  }

  let winResult = checkWinner(newBoard)
  let isDraw = false
  if (!winResult) {
    const isBombMode = game.game_mode === 'bomb'
    const isBlockerMode = game.game_mode === 'blocker'
    if (isBombMode) isDraw = checkDrawWithBombs(newBoard, game.bombed_cells || [])
    else if (isBlockerMode) isDraw = checkDrawWithBlockers(newBoard)
    else isDraw = checkDraw(newBoard)
  }

  const effects = applyGameModeEffects(game, newBoard, newPlacedAt, newTurnCount, winResult, isDraw)
  newBoard = effects.newBoard
  newPlacedAt = effects.newPlacedAt
  isDraw = effects.isDraw

  const updates = {
    board: newBoard,
    turn_started_at: new Date().toISOString(),
    turn_count: newTurnCount,
    ...effects.updates,
  }

  if (winResult) {
    updates.status = 'completed'
    if (game.game_mode === 'misere') {
      updates.winner = game.is_ai_game ? 'ai' : (game.player_x === user.id ? game.player_o : game.player_x)
    } else {
      updates.winner = user.id
    }
    updates.completed_at = new Date().toISOString()
  } else if (isDraw) {
    updates.status = 'completed'
    updates.winner = null
    updates.completed_at = new Date().toISOString()
  } else {
    updates.current_turn = game.is_ai_game ? null : (game.player_x === user.id ? game.player_o : game.player_x)
  }

  wsClient.gameMove(game.id, position)
  setGame((prev) => prev ? { ...prev, ...updates } : prev)
  return { data: updates }
}

/** Process an AI move locally and sync to server */
export async function makeLocalAIMove(game, aiPosition, difficulty, setGame) {
  const isDecayMode = game.game_mode === 'decay'

  let newBoard = [...game.board]
  newBoard[aiPosition] = 'O'

  let newPlacedAt = game.placed_at ? [...game.placed_at] : null
  let newTurnCount = (game.turn_count || 0) + 1

  if (isDecayMode && newPlacedAt) {
    newPlacedAt[aiPosition] = newTurnCount
  }

  let winResult = checkWinner(newBoard)
  let isDraw = false
  if (!winResult) {
    const isBombMode = game.game_mode === 'bomb'
    const isBlockerMode = game.game_mode === 'blocker'
    if (isBombMode) isDraw = checkDrawWithBombs(newBoard, game.bombed_cells || [])
    else if (isBlockerMode) isDraw = checkDrawWithBlockers(newBoard)
    else isDraw = checkDraw(newBoard)
  }

  const effects = applyGameModeEffects(game, newBoard, newPlacedAt, newTurnCount, winResult, isDraw)
  newBoard = effects.newBoard
  isDraw = effects.isDraw

  const updates = {
    board: newBoard,
    turn_started_at: new Date().toISOString(),
    turn_count: newTurnCount,
    ...effects.updates,
  }

  if (winResult) {
    updates.status = 'completed'
    updates.winner = game.game_mode === 'misere' ? game.player_x : 'ai'
    updates.completed_at = new Date().toISOString()
  } else if (isDraw) {
    updates.status = 'completed'
    updates.winner = null
    updates.completed_at = new Date().toISOString()
  } else {
    updates.current_turn = game.player_x
  }

  wsClient.gameMove(game.id, aiPosition)
  setGame((prev) => prev ? { ...prev, ...updates } : prev)
}
