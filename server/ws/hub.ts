import type { ServerWebSocket } from 'bun'
import type { WSClient, WSData, WSMessage, PresenceUser } from './types'

/**
 * WebSocket hub: manages client connections, channel subscriptions,
 * and presence tracking. All game-specific logic lives in handlers.
 */
class WebSocketHub {
  private clients = new Map<string, WSClient>()
  private presenceUsers = new Map<string, PresenceUser>()
  private heartbeatTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

  private static HEARTBEAT_TIMEOUT = 45_000 // 45s — expect heartbeat every 30s

  // ─── Connection Lifecycle ──────────────────────────────────────────────

  addClient(clientId: string, ws: ServerWebSocket<WSData>): WSClient {
    const client: WSClient = { ws, userId: null, channels: new Set() }
    this.clients.set(clientId, client)
    return client
  }

  removeClient(clientId: string): void {
    const client = this.clients.get(clientId)
    if (!client) return

    // Clean up presence
    if (client.userId) {
      this.presenceUsers.delete(client.userId)
      this.clearHeartbeatTimeout(client.userId)
      this.broadcastPresenceSync()
    }

    this.clients.delete(clientId)
  }

  getClient(clientId: string): WSClient | undefined {
    return this.clients.get(clientId)
  }

  setClientUser(clientId: string, userId: string): void {
    const client = this.clients.get(clientId)
    if (client) {
      client.userId = userId
    }
  }

  // ─── Channel Management ────────────────────────────────────────────────

  subscribe(clientId: string, channel: string): void {
    const client = this.clients.get(clientId)
    if (!client) return
    client.channels.add(channel)
  }

  unsubscribe(clientId: string, channel: string): void {
    const client = this.clients.get(clientId)
    if (!client) return
    client.channels.delete(channel)
  }

  /** Send a message to all clients subscribed to a channel */
  broadcastToChannel(channel: string, message: WSMessage, excludeClientId?: string): void {
    const payload = JSON.stringify(message)
    for (const [id, client] of this.clients) {
      if (id === excludeClientId) continue
      if (client.channels.has(channel)) {
        try {
          client.ws.send(payload)
        } catch {
          // Client disconnected — will be cleaned up
        }
      }
    }
  }

  /** Send a message to a specific user (by userId) */
  sendToUser(userId: string, message: WSMessage): void {
    const payload = JSON.stringify(message)
    for (const [, client] of this.clients) {
      if (client.userId === userId) {
        try {
          client.ws.send(payload)
        } catch {
          // Client disconnected
        }
      }
    }
  }

  /** Send a message to a specific client */
  sendToClient(clientId: string, message: WSMessage): void {
    const client = this.clients.get(clientId)
    if (!client) return
    try {
      client.ws.send(JSON.stringify(message))
    } catch {
      // Client disconnected
    }
  }

  /** Broadcast to ALL connected clients */
  broadcastAll(message: WSMessage, excludeClientId?: string): void {
    const payload = JSON.stringify(message)
    for (const [id, client] of this.clients) {
      if (id === excludeClientId) continue
      try {
        client.ws.send(payload)
      } catch {
        // Client disconnected
      }
    }
  }

  // ─── Presence ──────────────────────────────────────────────────────────

  presenceJoin(userId: string, username: string, avatar: string): void {
    this.presenceUsers.set(userId, {
      id: userId,
      username,
      avatar,
      onlineAt: new Date().toISOString(),
      currentGameId: null,
    })
    this.resetHeartbeatTimeout(userId)
    this.broadcastPresenceSync()
  }

  presenceHeartbeat(userId: string): void {
    const u = this.presenceUsers.get(userId)
    if (u) {
      this.resetHeartbeatTimeout(userId)
    }
  }

  presenceSetGame(userId: string, gameId: string | null): void {
    const u = this.presenceUsers.get(userId)
    if (u) {
      u.currentGameId = gameId
      this.broadcastPresenceSync()
    }
  }

  getOnlineUsers(): PresenceUser[] {
    return Array.from(this.presenceUsers.values())
  }

  private resetHeartbeatTimeout(userId: string): void {
    this.clearHeartbeatTimeout(userId)
    this.heartbeatTimeouts.set(
      userId,
      setTimeout(() => {
        this.presenceUsers.delete(userId)
        this.heartbeatTimeouts.delete(userId)
        this.broadcastPresenceSync()
      }, WebSocketHub.HEARTBEAT_TIMEOUT)
    )
  }

  private clearHeartbeatTimeout(userId: string): void {
    const t = this.heartbeatTimeouts.get(userId)
    if (t) {
      clearTimeout(t)
      this.heartbeatTimeouts.delete(userId)
    }
  }

  private broadcastPresenceSync(): void {
    this.broadcastAll({
      type: 'presence:sync',
      data: { users: this.getOnlineUsers() },
    })
  }
}

export const hub = new WebSocketHub()
