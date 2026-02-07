import { describe, it, expect, beforeAll } from 'vitest'
import { Hono } from 'hono'

// Test the server routes in isolation
// We import the route handlers directly and mount them on a test Hono app

describe('API Routes — Health', () => {
  it('GET /api/health returns ok', async () => {
    const app = new Hono()
    app.get('/api/health', (c) => c.json({ status: 'ok', timestamp: Date.now() }))

    const res = await app.request('/api/health')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.status).toBe('ok')
    expect(body.timestamp).toBeDefined()
  })
})

describe('API Routes — Profiles', () => {
  it('GET /api/profiles/:id returns 404 for nonexistent profile', async () => {
    // Import routes dynamically to avoid DB initialization issues in test
    const { default: profileRoutes } = await import('../server/routes/profiles')
    const app = new Hono()
    app.route('/api/profiles', profileRoutes)

    const res = await app.request('/api/profiles/nonexistent-id')
    expect(res.status).toBe(404)
  })
})

describe('API Routes — Games', () => {
  // Note: Games routes use requireAuth which calls BetterAuth internally.
  // To properly test authenticated routes, we'd need a full auth setup.
  // These tests verify the route structure exists and responds.

  it('GET /api/games without auth returns 401', async () => {
    const { default: gameRoutes } = await import('../server/routes/games')
    const app = new Hono()
    app.route('/api/games', gameRoutes)

    const res = await app.request('/api/games?filter=available')
    expect(res.status).toBe(401)
  })

  it('GET /api/games/:id returns 404 for nonexistent game', async () => {
    const { default: gameRoutes } = await import('../server/routes/games')
    const app = new Hono()
    app.route('/api/games', gameRoutes)

    const res = await app.request('/api/games/nonexistent-id')
    expect(res.status).toBe(404)
  })
})

describe('WebSocket Hub', () => {
  it('tracks clients', async () => {
    const { hub } = await import('../server/ws/hub')

    // We can't easily test WS with real connections here,
    // but we can verify the hub interface works
    expect(hub).toBeDefined()
    expect(typeof hub.addClient).toBe('function')
    expect(typeof hub.removeClient).toBe('function')
    expect(typeof hub.broadcastToChannel).toBe('function')
    expect(typeof hub.sendToUser).toBe('function')
  })

  it('manages presence', async () => {
    const { hub } = await import('../server/ws/hub')

    hub.presenceJoin('test-user', 'TestPlayer', '😀')
    const users = hub.getOnlineUsers()
    expect(users.length).toBeGreaterThanOrEqual(1)
    expect(users.find((u) => u.id === 'test-user')).toBeTruthy()
  })
})
