/**
 * WebSocket client: single multiplexed connection with channel-based messaging.
 * Provides subscribe/unsubscribe, event listeners, and auto-reconnect.
 */

type MessageHandler = (data: any) => void

interface WSMessage {
  type: string
  channel?: string
  data?: unknown
}

class WebSocketClient {
  private ws: WebSocket | null = null
  private url: string
  private handlers = new Map<string, Set<MessageHandler>>()
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private reconnectDelay = 1000
  private maxReconnectDelay = 30000
  private subscribedChannels = new Set<string>()
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null
  private isDestroyed = false

  constructor() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = import.meta.env.VITE_WS_URL || `${protocol}//${window.location.host}`
    this.url = `${host}/ws`
  }

  connect(): void {
    if (this.isDestroyed) return
    if (this.ws?.readyState === WebSocket.OPEN) return

    try {
      this.ws = new WebSocket(this.url)

      this.ws.onopen = () => {
        console.log('[WS] Connected')
        this.reconnectDelay = 1000

        // Re-subscribe to channels
        for (const channel of this.subscribedChannels) {
          this.send({ type: 'subscribe', channel })
        }

        // Start heartbeat
        this.startHeartbeat()

        this.emit('connected', null)
      }

      this.ws.onmessage = (event) => {
        try {
          const msg: WSMessage = JSON.parse(event.data)
          this.emit(msg.type, msg.data)

          // Also emit on the channel-specific key if present
          if (msg.channel) {
            this.emit(`${msg.type}:${msg.channel}`, msg.data)
          }
        } catch {
          console.warn('[WS] Invalid message:', event.data)
        }
      }

      this.ws.onclose = () => {
        console.log('[WS] Disconnected')
        this.stopHeartbeat()
        this.emit('disconnected', null)
        this.scheduleReconnect()
      }

      this.ws.onerror = (error) => {
        console.error('[WS] Error:', error)
      }
    } catch (err) {
      console.error('[WS] Connection error:', err)
      this.scheduleReconnect()
    }
  }

  disconnect(): void {
    this.isDestroyed = true
    this.stopHeartbeat()
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  // ─── Channel Management ──────────────────────────────────────────────

  subscribe(channel: string): void {
    this.subscribedChannels.add(channel)
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.send({ type: 'subscribe', channel })
    }
  }

  unsubscribe(channel: string): void {
    this.subscribedChannels.delete(channel)
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.send({ type: 'unsubscribe', channel })
    }
  }

  // ─── Messaging ───────────────────────────────────────────────────────

  send(msg: WSMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg))
    }
  }

  // ─── Event Handling ──────────────────────────────────────────────────

  on(event: string, handler: MessageHandler): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set())
    }
    this.handlers.get(event)!.add(handler)

    // Return unsubscribe function
    return () => {
      this.handlers.get(event)?.delete(handler)
    }
  }

  off(event: string, handler: MessageHandler): void {
    this.handlers.get(event)?.delete(handler)
  }

  private emit(event: string, data: any): void {
    const handlers = this.handlers.get(event)
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(data)
        } catch (err) {
          console.error(`[WS] Handler error for ${event}:`, err)
        }
      }
    }
  }

  // ─── Presence Helpers ────────────────────────────────────────────────

  joinPresence(userId: string, username: string, avatar: string): void {
    this.send({
      type: 'presence:join',
      data: { userId, username, avatar },
    })
  }

  heartbeat(): void {
    this.send({ type: 'presence:heartbeat' })
  }

  setCurrentGame(gameId: string | null): void {
    this.send({ type: 'presence:set-game', data: { gameId } })
  }

  // ─── Game Action Helpers ─────────────────────────────────────────────

  gameMove(gameId: string, position: number): void {
    this.send({ type: 'game:move', data: { gameId, position } })
  }

  gameForfeit(gameId: string): void {
    this.send({ type: 'game:forfeit', data: { gameId } })
  }

  gameTimeout(gameId: string): void {
    this.send({ type: 'game:timeout', data: { gameId } })
  }

  // ─── Invite Helpers ──────────────────────────────────────────────────

  sendInvite(targetUserId: string, boardSize?: number, turnDuration?: number, gameMode?: string): void {
    this.send({
      type: 'invite:send',
      data: { targetUserId, boardSize, turnDuration, gameMode },
    })
  }

  acceptInvite(gameId: string): void {
    this.send({ type: 'invite:accept', data: { gameId } })
  }

  declineInvite(gameId: string, fromUserId: string): void {
    this.send({ type: 'invite:decline', data: { gameId, fromUserId } })
  }

  cancelInvite(gameId: string, targetUserId: string): void {
    this.send({ type: 'invite:cancel', data: { gameId, targetUserId } })
  }

  // ─── Reaction Helpers ────────────────────────────────────────────────

  sendReaction(gameId: string, emoji: string, senderName: string): void {
    this.send({ type: 'reaction:send', data: { gameId, emoji, senderName } })
  }

  // ─── Internal ────────────────────────────────────────────────────────

  private startHeartbeat(): void {
    this.stopHeartbeat()
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send({ type: 'ping' })
        this.send({ type: 'presence:heartbeat' })
      }
    }, 25000) // Every 25s
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  private scheduleReconnect(): void {
    if (this.isDestroyed) return
    if (this.reconnectTimer) return

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      this.connect()
    }, this.reconnectDelay)

    this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay)
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }
}

// Singleton instance
export const wsClient = new WebSocketClient()
