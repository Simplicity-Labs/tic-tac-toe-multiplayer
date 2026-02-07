import { Hono } from 'hono'
import { eq, and, or, ne, isNull, desc, inArray } from 'drizzle-orm'
import { db } from '../db'
import { games, profiles } from '../db/schema'
import type { Game } from '../db/schema'
import { requireAuth, type AuthEnv } from '../middleware'
import { nanoid } from '../utils'
import { hub } from '../ws/hub'

// Import pure game logic
import {
  createEmptyBoard,
  createEmptyPlacedAt,
  createRandomStartBoard,
  DEFAULT_DECAY_TURNS,
  // @ts-expect-error — JS module
} from '../../src/lib/gameLogic.js'

const app = new Hono<AuthEnv>()

// Helper: attach creator profile to game
async function withCreatorProfile(game: Game) {
  if (!game.playerX) return { ...game, creator: null }
  const [creator] = await db
    .select({ id: profiles.id, username: profiles.username, avatar: profiles.avatar })
    .from(profiles)
    .where(eq(profiles.id, game.playerX))
  return { ...game, creator: creator || null }
}

// Helper: attach both player profiles
async function withPlayerProfiles(game: Game) {
  let playerXProfile = null
  let playerOProfile = null

  if (game.playerX) {
    const [p] = await db
      .select({ id: profiles.id, username: profiles.username, avatar: profiles.avatar })
      .from(profiles)
      .where(eq(profiles.id, game.playerX))
    playerXProfile = p || null
  }
  if (game.playerO) {
    const [p] = await db
      .select({ id: profiles.id, username: profiles.username, avatar: profiles.avatar })
      .from(profiles)
      .where(eq(profiles.id, game.playerO))
    playerOProfile = p || null
  }

  return {
    ...game,
    player_x_profile: playerXProfile,
    player_o_profile: playerOProfile,
  }
}

// POST /api/games — create a new game
app.post('/', requireAuth, async (c) => {
  const user = c.get('user')
  const body = await c.req.json<{
    isAI?: boolean
    aiDifficulty?: string
    boardSize?: number
    turnDuration?: number
    gameMode?: string
  }>()

  // Check for existing active game
  const existingGames = await db
    .select()
    .from(games)
    .where(
      and(
        or(eq(games.playerX, user.id), eq(games.playerO, user.id)),
        inArray(games.status, ['waiting', 'in_progress'])
      )
    )

  if (existingGames.length > 0) {
    return c.json(
      { error: 'You already have an active game', existingGameId: existingGames[0].id },
      409
    )
  }

  const isAI = body.isAI ?? false
  const boardSize = body.boardSize ?? 3
  const turnDuration = body.turnDuration ?? 30
  const gameMode = (body.gameMode ?? 'classic') as Game['gameMode']
  const isDecay = gameMode === 'decay'
  const isRandom = gameMode === 'random'

  const initialBoard = isRandom
    ? createRandomStartBoard(boardSize)
    : createEmptyBoard(boardSize)

  const gameId = nanoid()
  const [game] = await db
    .insert(games)
    .values({
      id: gameId,
      playerX: user.id,
      playerO: null,
      board: initialBoard,
      currentTurn: user.id,
      status: isAI ? 'in_progress' : 'waiting',
      isAiGame: isAI,
      aiDifficulty: isAI ? ((body.aiDifficulty || 'hard') as Game['aiDifficulty']) : null,
      turnStartedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      boardSize,
      turnDuration,
      gameMode,
      placedAt: isDecay ? createEmptyPlacedAt(boardSize) : null,
      decayTurns: isDecay ? DEFAULT_DECAY_TURNS : null,
      turnCount: 0,
    })
    .returning()

  // Notify lobby
  hub.broadcastAll({ type: 'lobby:updated', data: null })

  return c.json(game, 201)
})

// GET /api/games/:id — get a game by ID
app.get('/:id', async (c) => {
  const id = c.req.param('id')
  const [game] = await db.select().from(games).where(eq(games.id, id))

  if (!game) {
    return c.json({ error: 'Game not found' }, 404)
  }

  return c.json(await withPlayerProfiles(game))
})

// PATCH /api/games/:id — update game (join as player_o)
app.patch('/:id', requireAuth, async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')
  const body = await c.req.json<{ action: string }>()

  if (body.action === 'join') {
    const [game] = await db.select().from(games).where(eq(games.id, id))
    if (!game || game.status !== 'waiting') {
      return c.json({ error: 'Game not available' }, 400)
    }

    const [updated] = await db
      .update(games)
      .set({
        playerO: user.id,
        status: 'in_progress',
        turnStartedAt: new Date().toISOString(),
      })
      .where(and(eq(games.id, id), eq(games.status, 'waiting')))
      .returning()

    if (!updated) {
      return c.json({ error: 'Game already taken' }, 409)
    }

    // Notify game subscribers and lobby
    hub.broadcastToChannel(`game:${id}`, {
      type: 'game:updated',
      channel: `game:${id}`,
      data: updated,
    })
    hub.broadcastAll({ type: 'lobby:updated', data: null })
    hub.broadcastAll({ type: 'live:updated', data: null })

    return c.json(updated)
  }

  return c.json({ error: 'Unknown action' }, 400)
})

// DELETE /api/games/:id — cancel a waiting game
app.delete('/:id', requireAuth, async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')

  const [game] = await db.select().from(games).where(eq(games.id, id))
  if (!game) {
    return c.json({ error: 'Game not found' }, 404)
  }
  if (game.playerX !== user.id) {
    return c.json({ error: 'Forbidden' }, 403)
  }
  if (game.status !== 'waiting') {
    return c.json({ error: 'Can only delete waiting games' }, 400)
  }

  await db.delete(games).where(eq(games.id, id))

  hub.broadcastToChannel(`game:${id}`, {
    type: 'game:deleted',
    channel: `game:${id}`,
    data: { gameId: id },
  })
  hub.broadcastAll({ type: 'lobby:updated', data: null })

  return c.json({ success: true })
})

// GET /api/games — list games (with query filters)
app.get('/', requireAuth, async (c) => {
  const user = c.get('user')
  const filter = c.req.query('filter') // 'available', 'live', 'history', 'active'

  if (filter === 'available') {
    const allWaiting = await db
      .select()
      .from(games)
      .where(
        and(
          eq(games.status, 'waiting'),
          ne(games.playerX, user.id),
          isNull(games.invitedPlayerId)
        )
      )
    // Attach creator profiles
    const withProfiles = await Promise.all(allWaiting.map(withCreatorProfile))
    return c.json(withProfiles)
  }

  if (filter === 'live') {
    const liveGames = await db
      .select()
      .from(games)
      .where(
        and(
          eq(games.status, 'in_progress'),
          eq(games.isAiGame, false),
          ne(games.playerX, user.id)
        )
      )
    // Filter out games where user is player_o (can't do ne on nullable in single query)
    const filtered = liveGames.filter((g) => g.playerO !== user.id)
    const withProfiles = await Promise.all(filtered.map(withPlayerProfiles))
    return c.json(withProfiles)
  }

  if (filter === 'history') {
    const limit = parseInt(c.req.query('limit') || '50')
    const history = await db
      .select()
      .from(games)
      .where(
        and(
          eq(games.status, 'completed'),
          or(eq(games.playerX, user.id), eq(games.playerO, user.id))
        )
      )
    // Sort by completedAt descending
    history.sort((a, b) => {
      const da = a.completedAt ? new Date(a.completedAt).getTime() : 0
      const db_ = b.completedAt ? new Date(b.completedAt).getTime() : 0
      return db_ - da
    })
    const sliced = history.slice(0, limit)
    const withProfiles = await Promise.all(sliced.map(withPlayerProfiles))
    return c.json(withProfiles)
  }

  if (filter === 'active') {
    const active = await db
      .select()
      .from(games)
      .where(
        and(
          or(eq(games.playerX, user.id), eq(games.playerO, user.id)),
          inArray(games.status, ['waiting', 'in_progress'])
        )
      )
    return c.json(active.length > 0 ? active[0] : null)
  }

  // Default: return completed PvP games for leaderboard calculation
  if (filter === 'leaderboard') {
    const period = c.req.query('period') || 'all-time'
    let completedGames = await db
      .select()
      .from(games)
      .where(and(eq(games.status, 'completed'), eq(games.isAiGame, false)))

    if (period === 'this-month') {
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)
      completedGames = completedGames.filter(
        (g) => g.completedAt && new Date(g.completedAt) >= startOfMonth
      )
    }

    const withProfiles = await Promise.all(completedGames.map(withPlayerProfiles))
    return c.json(withProfiles)
  }

  return c.json({ error: 'Provide a filter query param: available|live|history|active|leaderboard' }, 400)
})

export default app
