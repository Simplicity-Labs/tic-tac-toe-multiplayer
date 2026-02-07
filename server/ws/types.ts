import type { ServerWebSocket } from 'bun'

export interface WSMessage {
  type: string
  channel?: string
  data?: unknown
}

export interface WSClient {
  ws: ServerWebSocket<WSData>
  userId: string | null
  channels: Set<string>
}

export interface WSData {
  clientId: string
}

// Inbound message types (client → server)
export type WSInboundType =
  | 'subscribe'
  | 'unsubscribe'
  | 'presence:join'
  | 'presence:heartbeat'
  | 'presence:set-game'
  | 'invite:send'
  | 'invite:accept'
  | 'invite:decline'
  | 'invite:cancel'
  | 'reaction:send'
  | 'game:move'
  | 'game:forfeit'
  | 'game:timeout'
  | 'ping'

// Outbound message types (server → client)
export type WSOutboundType =
  | 'subscribed'
  | 'unsubscribed'
  | 'error'
  | 'game:updated'
  | 'game:player-joined'
  | 'game:deleted'
  | 'lobby:updated'
  | 'live:updated'
  | 'presence:sync'
  | 'invite:received'
  | 'invite:response'
  | 'invite:cancelled'
  | 'reaction:received'
  | 'pong'

export interface PresenceUser {
  id: string
  username: string
  avatar: string
  onlineAt: string
  currentGameId: string | null
}
