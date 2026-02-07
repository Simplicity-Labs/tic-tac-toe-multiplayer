import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/bun'
import { existsSync } from 'fs'
import type { ServerWebSocket } from 'bun'

import authRoutes from './routes/auth'
import profileRoutes from './routes/profiles'
import gameRoutes from './routes/games'
import { hub } from './ws/hub'
import { handleWSMessage } from './ws/handler'
import type { WSData } from './ws/types'

const app = new Hono()

// ─── CORS ────────────────────────────────────────────────────────────────

app.use(
  '/api/*',
  cors({
    origin: [
      'http://localhost:5173',
      'http://localhost:3100',
      process.env.APP_URL || 'http://localhost:3100',
    ],
    credentials: true,
  })
)

// ─── API Routes ──────────────────────────────────────────────────────────

app.route('/api/auth', authRoutes)
app.route('/api/profiles', profileRoutes)
app.route('/api/games', gameRoutes)

// ─── Health Check ────────────────────────────────────────────────────────

app.get('/api/health', (c) => c.json({ status: 'ok', timestamp: Date.now() }))

// ─── Static Files (production) ───────────────────────────────────────────

const distPath = './dist'
if (existsSync(distPath)) {
  app.use('/*', serveStatic({ root: distPath }))
  // SPA fallback — serve index.html for non-API, non-asset routes
  app.get('*', serveStatic({ path: `${distPath}/index.html` }))
}

// ─── Server ──────────────────────────────────────────────────────────────

const PORT = parseInt(process.env.PORT || '3100')
let clientCounter = 0

console.log(`🎮 Tic-Tac-Toe server starting on port ${PORT}...`)

const server = Bun.serve<WSData>({
  port: PORT,
  fetch(req, server) {
    const url = new URL(req.url)

    // WebSocket upgrade
    if (url.pathname === '/ws') {
      const clientId = `client_${++clientCounter}_${Date.now()}`
      const success = server.upgrade(req, { data: { clientId } })
      if (success) return undefined
      return new Response('WebSocket upgrade failed', { status: 400 })
    }

    // Hono handles everything else
    return app.fetch(req)
  },
  websocket: {
    open(ws: ServerWebSocket<WSData>) {
      const { clientId } = ws.data
      hub.addClient(clientId, ws)
      console.log(`[WS] Client connected: ${clientId}`)
    },
    message(ws: ServerWebSocket<WSData>, message: string | Buffer) {
      const { clientId } = ws.data
      const raw = typeof message === 'string' ? message : message.toString()
      handleWSMessage(clientId, raw)
    },
    close(ws: ServerWebSocket<WSData>) {
      const { clientId } = ws.data
      hub.removeClient(clientId)
      console.log(`[WS] Client disconnected: ${clientId}`)
    },
  },
})

console.log(`✅ Server running at http://localhost:${PORT}`)
console.log(`   WebSocket: ws://localhost:${PORT}/ws`)
