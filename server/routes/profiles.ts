import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import { db } from '../db'
import { profiles } from '../db/schema'
import { requireAuth, type AuthEnv } from '../middleware'

const app = new Hono<AuthEnv>()

// GET /api/profiles/:id - get a profile by ID
app.get('/:id', async (c) => {
  const id = c.req.param('id')
  const [profile] = await db.select().from(profiles).where(eq(profiles.id, id))

  if (!profile) {
    return c.json({ error: 'Profile not found' }, 404)
  }

  return c.json(profile)
})

// POST /api/profiles - create profile for current user
app.post('/', requireAuth, async (c) => {
  const user = c.get('user')
  const body = await c.req.json<{ username: string; avatar?: string }>()

  if (!body.username || body.username.trim().length < 3) {
    return c.json({ error: 'Username must be at least 3 characters' }, 400)
  }

  if (body.username.trim().length > 20) {
    return c.json({ error: 'Username must be at most 20 characters' }, 400)
  }

  // Check if profile already exists
  const [existing] = await db.select().from(profiles).where(eq(profiles.id, user.id))
  if (existing) {
    return c.json({ error: 'Profile already exists' }, 409)
  }

  // Check username uniqueness
  const [nameConflict] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.username, body.username.trim()))
  if (nameConflict) {
    return c.json({ error: 'Username already taken' }, 409)
  }

  const now = new Date()
  const [profile] = await db
    .insert(profiles)
    .values({
      id: user.id,
      username: body.username.trim(),
      avatar: body.avatar || '😀',
      isGuest: user.email.includes('@anonymous.'),
      createdAt: now,
    })
    .returning()

  return c.json(profile, 201)
})

// PATCH /api/profiles/:id - update own profile
app.patch('/:id', requireAuth, async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')

  if (id !== user.id) {
    return c.json({ error: 'Forbidden' }, 403)
  }

  const body = await c.req.json<{ username?: string; avatar?: string }>()
  const updates: Partial<{ username: string; avatar: string }> = {}

  if (body.username !== undefined) {
    if (body.username.trim().length < 3) {
      return c.json({ error: 'Username must be at least 3 characters' }, 400)
    }
    if (body.username.trim().length > 20) {
      return c.json({ error: 'Username must be at most 20 characters' }, 400)
    }
    // Check uniqueness
    const [conflict] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.username, body.username.trim()))
    if (conflict && conflict.id !== user.id) {
      return c.json({ error: 'Username already taken' }, 409)
    }
    updates.username = body.username.trim()
  }

  if (body.avatar !== undefined) {
    updates.avatar = body.avatar
  }

  if (Object.keys(updates).length === 0) {
    return c.json({ error: 'No fields to update' }, 400)
  }

  const [updated] = await db
    .update(profiles)
    .set(updates)
    .where(eq(profiles.id, user.id))
    .returning()

  return c.json(updated)
})

// GET /api/profiles - leaderboard (sorted by pvp_wins desc)
app.get('/', async (c) => {
  const limit = parseInt(c.req.query('limit') || '50')
  const allProfiles = await db.select().from(profiles)

  // Sort by pvp_wins descending
  allProfiles.sort((a, b) => (b.pvpWins || 0) - (a.pvpWins || 0))

  return c.json(allProfiles.slice(0, limit))
})

export default app
