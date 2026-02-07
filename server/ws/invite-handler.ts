import { eq } from 'drizzle-orm'
import { db } from '../db'
import { games, profiles } from '../db/schema'
import { hub } from './hub'
import { nanoid } from '../utils'

// Re-use pure game logic for empty board creation
import {
  createEmptyBoard,
  // @ts-expect-error — JS module
} from '../../src/lib/gameLogic.js'

export async function handleInviteSend(
  senderId: string,
  data: { targetUserId: string; boardSize?: number; turnDuration?: number; gameMode?: string }
): Promise<void> {
  const [senderProfile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, senderId))

  if (!senderProfile) {
    hub.sendToUser(senderId, { type: 'error', data: { message: 'Profile not found' } })
    return
  }

  const boardSize = data.boardSize || 3
  const turnDuration = data.turnDuration || 30
  const gameMode = data.gameMode || 'classic'
  const gameId = nanoid()

  await db.insert(games).values({
    id: gameId,
    playerX: senderId,
    playerO: null,
    board: createEmptyBoard(boardSize),
    currentTurn: senderId,
    status: 'waiting',
    isAiGame: false,
    turnStartedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    invitedPlayerId: data.targetUserId,
    boardSize,
    turnDuration,
    gameMode: gameMode as any,
    turnCount: 0,
  })

  // Notify the target user
  hub.sendToUser(data.targetUserId, {
    type: 'invite:received',
    data: {
      gameId,
      boardSize,
      turnDuration,
      gameMode,
      from: {
        id: senderId,
        username: senderProfile.username,
        avatar: senderProfile.avatar,
      },
    },
  })

  // Confirm to sender
  hub.sendToUser(senderId, {
    type: 'invite:sent',
    data: { gameId, targetUserId: data.targetUserId },
  })
}

export async function handleInviteAccept(
  userId: string,
  gameId: string
): Promise<void> {
  const [game] = await db.select().from(games).where(eq(games.id, gameId))
  if (!game || game.status !== 'waiting') {
    hub.sendToUser(userId, { type: 'error', data: { message: 'Game not found or already started' } })
    return
  }

  await db
    .update(games)
    .set({
      playerO: userId,
      status: 'in_progress',
      turnStartedAt: new Date().toISOString(),
    })
    .where(eq(games.id, gameId))

  // Notify the game creator
  hub.sendToUser(game.playerX!, {
    type: 'invite:response',
    data: { gameId, accepted: true },
  })

  // Broadcast lobby update
  hub.broadcastAll({ type: 'lobby:updated', data: null })
  hub.broadcastAll({ type: 'live:updated', data: null })

  // Both players should subscribe to the game channel
  const [updated] = await db.select().from(games).where(eq(games.id, gameId))
  if (updated) {
    hub.broadcastToChannel(`game:${gameId}`, {
      type: 'game:updated',
      channel: `game:${gameId}`,
      data: updated,
    })
  }
}

export async function handleInviteDecline(
  userId: string,
  gameId: string,
  fromUserId: string
): Promise<void> {
  // Notify the sender
  hub.sendToUser(fromUserId, {
    type: 'invite:response',
    data: { gameId, accepted: false },
  })

  // Delete the game (created for the invite)
  await db.delete(games).where(eq(games.id, gameId))
  hub.broadcastAll({ type: 'lobby:updated', data: null })
}

export async function handleInviteCancel(
  userId: string,
  gameId: string,
  targetUserId: string
): Promise<void> {
  await db.delete(games).where(eq(games.id, gameId))

  hub.sendToUser(targetUserId, {
    type: 'invite:cancelled',
    data: { gameId },
  })

  hub.broadcastAll({ type: 'lobby:updated', data: null })
}
