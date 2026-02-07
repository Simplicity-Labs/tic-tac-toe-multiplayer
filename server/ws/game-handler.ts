import { eq, and } from 'drizzle-orm'
import { db } from '../db'
import { games, moves, profiles } from '../db/schema'
import type { Game, Profile } from '../db/schema'
import { hub } from './hub'
import { nanoid } from '../utils'

// ─── Pure game logic imports ─────────────────────────────────────────────

// We import the game logic module. Since it's pure JS, we load it at runtime.
// The functions are the SAME as the client uses — single source of truth.
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
  // @ts-expect-error — JS module
} from '../../src/lib/gameLogic.js'

// ─── Helpers ─────────────────────────────────────────────────────────────

function broadcastGameUpdate(game: Game): void {
  hub.broadcastToChannel(`game:${game.id}`, {
    type: 'game:updated',
    channel: `game:${game.id}`,
    data: game,
  })
  // Also notify lobby/live channels
  hub.broadcastAll({ type: 'lobby:updated', data: null })
  hub.broadcastAll({ type: 'live:updated', data: null })
}

async function updatePlayerStats(
  playerId: string,
  isAi: boolean,
  difficulty: string | null,
  result: 'win' | 'loss' | 'draw',
  isForfeit: boolean
): Promise<void> {
  const [profile] = await db.select().from(profiles).where(eq(profiles.id, playerId))
  if (!profile) return

  const updates: Partial<Profile> = {}

  if (isAi) {
    const diffKey = difficulty || 'hard'
    const prefix = `ai${diffKey.charAt(0).toUpperCase()}${diffKey.slice(1)}` as
      | 'aiEasy'
      | 'aiMedium'
      | 'aiHard'

    if (result === 'win') {
      updates[`${prefix}Wins` as keyof Profile] = ((profile[`${prefix}Wins` as keyof Profile] as number) || 0) + 1
      updates.wins = (profile.wins || 0) + 1
    } else if (result === 'loss') {
      updates[`${prefix}Losses` as keyof Profile] = ((profile[`${prefix}Losses` as keyof Profile] as number) || 0) + 1
      updates.losses = (profile.losses || 0) + 1
    } else {
      updates[`${prefix}Draws` as keyof Profile] = ((profile[`${prefix}Draws` as keyof Profile] as number) || 0) + 1
      updates.draws = (profile.draws || 0) + 1
    }
  } else {
    if (result === 'win') {
      updates.pvpWins = (profile.pvpWins || 0) + 1
      updates.wins = (profile.wins || 0) + 1
    } else if (result === 'loss') {
      updates.pvpLosses = (profile.pvpLosses || 0) + 1
      updates.losses = (profile.losses || 0) + 1
    } else {
      updates.pvpDraws = (profile.pvpDraws || 0) + 1
      updates.draws = (profile.draws || 0) + 1
    }
  }

  if (isForfeit) {
    updates.forfeits = (profile.forfeits || 0) + 1
  }

  await db.update(profiles).set(updates).where(eq(profiles.id, playerId))
}

// ─── Game Move Handler ───────────────────────────────────────────────────

export async function handleGameMove(
  userId: string,
  gameId: string,
  position: number
): Promise<void> {
  const [game] = await db.select().from(games).where(eq(games.id, gameId))
  if (!game) {
    hub.sendToUser(userId, { type: 'error', data: { message: 'Game not found' } })
    return
  }

  if (game.status !== 'in_progress') {
    hub.sendToUser(userId, { type: 'error', data: { message: 'Game is not in progress' } })
    return
  }

  if (game.currentTurn !== userId) {
    hub.sendToUser(userId, { type: 'error', data: { message: "It's not your turn" } })
    return
  }

  const board = game.board as string[]
  const isGravity = game.gameMode === 'gravity'
  const isBombMode = game.gameMode === 'bomb'
  const isBlockerMode = game.gameMode === 'blocker'
  const isDecayMode = game.gameMode === 'decay'

  let actualPosition = position

  // Validate position
  if (isGravity) {
    const boardSize = getBoardSize(board)
    const bombedCells = isBombMode ? (game.bombedCells || []) : []
    actualPosition = getGravityDropPosition(board, position, boardSize, bombedCells)
    if (actualPosition === null) {
      hub.sendToUser(userId, { type: 'error', data: { message: 'Column is full' } })
      return
    }
  } else {
    if (!isEmpty(board[position])) {
      hub.sendToUser(userId, { type: 'error', data: { message: 'Position already taken' } })
      return
    }
    if (isBombMode && isBombed(position, game.bombedCells || [])) {
      hub.sendToUser(userId, { type: 'error', data: { message: 'Cell is bombed' } })
      return
    }
    if (isBlockerMode && board[position] === BLOCKER_MARKER) {
      hub.sendToUser(userId, { type: 'error', data: { message: 'Cell is blocked' } })
      return
    }
  }

  const symbol = game.playerX === userId ? 'X' : 'O'
  let newBoard = [...board]
  newBoard[actualPosition] = symbol

  let newPlacedAt = game.placedAt ? [...game.placedAt] : null
  let newTurnCount = (game.turnCount || 0) + 1

  if (isDecayMode && newPlacedAt) {
    newPlacedAt[actualPosition] = newTurnCount
  }

  // Check for winner BEFORE applying decay
  let winResult = checkWinner(newBoard)
  let isDraw = false
  if (!winResult) {
    if (isBombMode) isDraw = checkDrawWithBombs(newBoard, game.bombedCells || [])
    else if (isBlockerMode) isDraw = checkDrawWithBlockers(newBoard)
    else isDraw = checkDraw(newBoard)
  }

  // Apply decay AFTER checking for win
  if (isDecayMode && newPlacedAt && !winResult && !isDraw) {
    const decayResult = applyDecay(
      newBoard,
      newPlacedAt,
      newTurnCount,
      game.decayTurns || DEFAULT_DECAY_TURNS
    )
    newBoard = decayResult.board
    newPlacedAt = decayResult.placedAt
  }

  const updates: Partial<Game> = {
    board: newBoard,
    turnStartedAt: new Date().toISOString(),
    turnCount: newTurnCount,
  }

  if (isDecayMode) updates.placedAt = newPlacedAt

  // Bomb mode: bomb a random cell every 2 turns
  let newBombedCells = game.bombedCells || []
  if (isBombMode && !winResult && !isDraw && newTurnCount >= 2 && newTurnCount % 2 === 0) {
    const bombed = bombRandomCell(newBoard, newBombedCells)
    if (bombed !== null) {
      newBombedCells = [...newBombedCells, bombed]
      updates.bombedCells = newBombedCells
    }
  }

  // Blocker mode: place random blocker after each move
  if (isBlockerMode && !winResult && !isDraw) {
    const blockerResult = placeRandomBlocker(newBoard)
    if (blockerResult.blockerPosition !== null) {
      newBoard = blockerResult.board
      updates.board = newBoard
      isDraw = checkDrawWithBlockers(newBoard)
      if (isDraw) {
        updates.status = 'completed'
        updates.winner = null
        updates.completedAt = new Date().toISOString()
      }
    }
  }

  if (winResult) {
    updates.status = 'completed'
    if (game.gameMode === 'misere') {
      updates.winner = game.isAiGame
        ? 'ai'
        : game.playerX === userId
          ? game.playerO
          : game.playerX
    } else {
      updates.winner = userId
    }
    updates.completedAt = new Date().toISOString()
  } else if (isDraw) {
    updates.status = 'completed'
    updates.winner = null
    updates.completedAt = new Date().toISOString()
  } else {
    if (game.isAiGame) {
      updates.currentTurn = null // null = AI's turn
    } else {
      updates.currentTurn = game.playerX === userId ? game.playerO : game.playerX
    }
  }

  await db.update(games).set(updates).where(eq(games.id, gameId))

  // Record the move
  await db.insert(moves).values({
    id: nanoid(),
    gameId: game.id,
    playerId: userId,
    position,
    createdAt: new Date().toISOString(),
  })

  // Update stats if game completed
  if (updates.status === 'completed') {
    await updateStatsForCompletion(game, userId, winResult, isDraw)
  }

  // Re-fetch to get clean object
  const [updated] = await db.select().from(games).where(eq(games.id, gameId))
  if (updated) broadcastGameUpdate(updated)
}

// ─── Stats Completion Helper ─────────────────────────────────────────────

async function updateStatsForCompletion(
  game: Game,
  movingUserId: string,
  winResult: boolean,
  isDraw: boolean
): Promise<void> {
  const isMisere = game.gameMode === 'misere'

  if (game.isAiGame) {
    if (winResult) {
      const playerWon = isMisere ? false : true
      await updatePlayerStats(
        game.playerX!,
        true,
        game.aiDifficulty,
        playerWon ? 'win' : 'loss',
        false
      )
    } else if (isDraw) {
      await updatePlayerStats(game.playerX!, true, game.aiDifficulty, 'draw', false)
    }
  } else {
    const players = [game.playerX, game.playerO].filter(Boolean) as string[]
    for (const pid of players) {
      let result: 'win' | 'loss' | 'draw'
      if (isDraw) {
        result = 'draw'
      } else if (winResult) {
        // In misere, the person who made the line LOSES
        if (isMisere) {
          result = pid === movingUserId ? 'loss' : 'win'
        } else {
          result = pid === movingUserId ? 'win' : 'loss'
        }
      } else {
        result = 'draw'
      }
      await updatePlayerStats(pid, false, null, result, false)
    }
  }
}

// ─── Forfeit Handler ─────────────────────────────────────────────────────

export async function handleGameForfeit(userId: string, gameId: string): Promise<void> {
  const [game] = await db.select().from(games).where(eq(games.id, gameId))
  if (!game) return

  // If waiting, delete the game
  if (game.status === 'waiting') {
    await db.delete(games).where(eq(games.id, gameId))
    hub.broadcastToChannel(`game:${gameId}`, {
      type: 'game:deleted',
      channel: `game:${gameId}`,
      data: { gameId },
    })
    hub.broadcastAll({ type: 'lobby:updated', data: null })
    return
  }

  if (game.status !== 'in_progress') return

  const winner = game.isAiGame
    ? 'ai'
    : game.playerX === userId
      ? game.playerO
      : game.playerX

  await db
    .update(games)
    .set({
      status: 'completed',
      winner,
      forfeitBy: userId,
      completedAt: new Date().toISOString(),
    })
    .where(eq(games.id, gameId))

  // Update stats
  await updatePlayerStats(userId, game.isAiGame, game.aiDifficulty, 'loss', true)
  if (!game.isAiGame && winner) {
    await updatePlayerStats(winner, false, null, 'win', false)
  }

  const [updated] = await db.select().from(games).where(eq(games.id, gameId))
  if (updated) broadcastGameUpdate(updated)
}

// ─── Timeout Handler ─────────────────────────────────────────────────────

export async function handleGameTimeout(userId: string, gameId: string): Promise<void> {
  const [game] = await db.select().from(games).where(eq(games.id, gameId))
  if (!game || game.status !== 'in_progress') return

  const forfeiterId = game.currentTurn
  if (!forfeiterId) return

  const winner = game.isAiGame
    ? forfeiterId === game.playerX ? 'ai' : game.playerX
    : forfeiterId === game.playerX ? game.playerO : game.playerX

  await db
    .update(games)
    .set({
      status: 'completed',
      winner,
      forfeitBy: forfeiterId,
      completedAt: new Date().toISOString(),
    })
    .where(eq(games.id, gameId))

  // Update stats
  await updatePlayerStats(forfeiterId, game.isAiGame, game.aiDifficulty, 'loss', true)
  if (!game.isAiGame && winner && winner !== 'ai') {
    await updatePlayerStats(winner, false, null, 'win', false)
  }

  const [updated] = await db.select().from(games).where(eq(games.id, gameId))
  if (updated) broadcastGameUpdate(updated)
}
