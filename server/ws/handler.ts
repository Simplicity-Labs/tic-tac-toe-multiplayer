import type { WSMessage } from './types'
import { hub } from './hub'
import { handleGameMove, handleGameForfeit, handleGameTimeout } from './game-handler'
import {
  handleInviteSend,
  handleInviteAccept,
  handleInviteDecline,
  handleInviteCancel,
} from './invite-handler'

/**
 * Routes inbound WS messages to the appropriate handler.
 */
export function handleWSMessage(clientId: string, raw: string): void {
  let msg: WSMessage
  try {
    msg = JSON.parse(raw)
  } catch {
    hub.sendToClient(clientId, { type: 'error', data: { message: 'Invalid JSON' } })
    return
  }

  const client = hub.getClient(clientId)
  if (!client) return

  switch (msg.type) {
    // ─── Subscriptions ─────────────────────────────────────────────────
    case 'subscribe': {
      const channel = msg.channel
      if (!channel) break
      hub.subscribe(clientId, channel)
      hub.sendToClient(clientId, { type: 'subscribed', channel })
      break
    }
    case 'unsubscribe': {
      const channel = msg.channel
      if (!channel) break
      hub.unsubscribe(clientId, channel)
      hub.sendToClient(clientId, { type: 'unsubscribed', channel })
      break
    }

    // ─── Presence ──────────────────────────────────────────────────────
    case 'presence:join': {
      const d = msg.data as { userId: string; username: string; avatar: string } | undefined
      if (!d?.userId || !d?.username) break
      hub.setClientUser(clientId, d.userId)
      hub.presenceJoin(d.userId, d.username, d.avatar || '😀')
      break
    }
    case 'presence:heartbeat': {
      if (client.userId) hub.presenceHeartbeat(client.userId)
      break
    }
    case 'presence:set-game': {
      const d = msg.data as { gameId: string | null } | undefined
      if (client.userId) hub.presenceSetGame(client.userId, d?.gameId ?? null)
      break
    }

    // ─── Game Actions ──────────────────────────────────────────────────
    case 'game:move': {
      if (!client.userId) break
      const d = msg.data as { gameId: string; position: number } | undefined
      if (!d?.gameId || d.position == null) break
      handleGameMove(client.userId, d.gameId, d.position).catch(console.error)
      break
    }
    case 'game:forfeit': {
      if (!client.userId) break
      const d = msg.data as { gameId: string } | undefined
      if (!d?.gameId) break
      handleGameForfeit(client.userId, d.gameId).catch(console.error)
      break
    }
    case 'game:timeout': {
      if (!client.userId) break
      const d = msg.data as { gameId: string } | undefined
      if (!d?.gameId) break
      handleGameTimeout(client.userId, d.gameId).catch(console.error)
      break
    }

    // ─── Invitations ───────────────────────────────────────────────────
    case 'invite:send': {
      if (!client.userId) break
      const d = msg.data as {
        targetUserId: string
        boardSize?: number
        turnDuration?: number
        gameMode?: string
      } | undefined
      if (!d?.targetUserId) break
      handleInviteSend(client.userId, d).catch(console.error)
      break
    }
    case 'invite:accept': {
      if (!client.userId) break
      const d = msg.data as { gameId: string } | undefined
      if (!d?.gameId) break
      handleInviteAccept(client.userId, d.gameId).catch(console.error)
      break
    }
    case 'invite:decline': {
      if (!client.userId) break
      const d = msg.data as { gameId: string; fromUserId: string } | undefined
      if (!d?.gameId || !d?.fromUserId) break
      handleInviteDecline(client.userId, d.gameId, d.fromUserId).catch(console.error)
      break
    }
    case 'invite:cancel': {
      if (!client.userId) break
      const d = msg.data as { gameId: string; targetUserId: string } | undefined
      if (!d?.gameId || !d?.targetUserId) break
      handleInviteCancel(client.userId, d.gameId, d.targetUserId).catch(console.error)
      break
    }

    // ─── Reactions ─────────────────────────────────────────────────────
    case 'reaction:send': {
      if (!client.userId) break
      const d = msg.data as { gameId: string; emoji: string; senderName: string } | undefined
      if (!d?.gameId || !d?.emoji) break
      // Broadcast to all subscribers of this game except sender
      hub.broadcastToChannel(`game:${d.gameId}`, {
        type: 'reaction:received',
        data: {
          emoji: d.emoji,
          senderId: client.userId,
          senderName: d.senderName || 'Player',
          timestamp: Date.now(),
        },
      }, clientId)
      break
    }

    // ─── Ping/Pong ─────────────────────────────────────────────────────
    case 'ping': {
      hub.sendToClient(clientId, { type: 'pong' })
      break
    }

    default:
      hub.sendToClient(clientId, {
        type: 'error',
        data: { message: `Unknown message type: ${msg.type}` },
      })
  }
}
