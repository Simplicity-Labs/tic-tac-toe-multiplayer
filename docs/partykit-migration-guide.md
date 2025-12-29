# When to Migrate from Supabase to PartyKit

## Current Architecture (Supabase)
- Database-first: every move writes to Postgres, clients subscribe to changes
- Real-time via postgres_changes and broadcast channels
- Auth, DB, and real-time all in one service

## Migration Trigger Points

Consider migrating to PartyKit when you experience **3 or more** of these issues:

### Performance Issues
- [ ] Players consistently complaining about lag/delay between moves
- [ ] Noticeable latency (>500ms) between move submission and opponent seeing it
- [ ] Concurrent games causing performance degradation
- [ ] Real-time subscriptions dropping or becoming unreliable at scale

### Sync/State Issues
- [ ] Frequent stale closure bugs despite using refs
- [ ] Channel reconnection loops disrupting gameplay
- [ ] Race conditions with multiple updates
- [ ] Broadcast messages getting lost (invitations not received)
- [ ] Complex workarounds needed for state synchronization

### Scale Challenges
- [ ] Approaching Supabase real-time connection limits
- [ ] Database write load becoming concern
- [ ] Need for regional edge performance
- [ ] Want to support 100+ concurrent games

### Feature Limitations
- [ ] Need game room presence (who's online, typing indicators)
- [ ] Want spectator mode with live updates
- [ ] Need lower latency for interactive features
- [ ] Want collaborative features beyond turn-based

## PartyKit Migration Architecture

```
┌─────────┐                        ┌──────────────┐
│ Client  │ ←──── WebSocket ─────→ │  PartyKit    │
└─────────┘                        │  (Durable    │
                                   │   Objects)   │
                                   └──────┬───────┘
                                          │
                                   Persist on game end
                                          │
                                          ↓
                                   ┌──────────────┐
                                   │  Supabase    │
                                   │  (Auth + DB) │
                                   └──────────────┘
```

### What Changes
- **Active games**: State lives in PartyKit room (in-memory at edge)
- **Moves**: Instant broadcast to room participants (no DB write)
- **Persistence**: Write to Supabase only on game completion
- **Auth**: Keep Supabase auth, pass JWT to PartyKit

### What Stays the Same
- User profiles and authentication (Supabase)
- Game history and stats (Supabase)
- Dashboard queries (Supabase)

## Migration Checklist

### Phase 1: Setup PartyKit
- [ ] Install PartyKit: `npm install partykit`
- [ ] Create `party/` directory for server code
- [ ] Implement game room party server
- [ ] Add PartyKit deploy config

### Phase 2: Dual-Write Period
- [ ] Keep Supabase writes for active games
- [ ] Add PartyKit connection for real-time updates
- [ ] Monitor both systems in parallel
- [ ] Verify state consistency

### Phase 3: Cut Over
- [ ] Switch active games to PartyKit-first
- [ ] Keep Supabase for persistence only
- [ ] Update hooks to use PartyKit WebSocket
- [ ] Migrate invitation system to PartyKit presence

### Phase 4: Cleanup
- [ ] Remove unused real-time subscriptions
- [ ] Simplify database writes (end state only)
- [ ] Remove broadcast channel workarounds
- [ ] Update CLAUDE.md with new architecture

## Costs Comparison

**Supabase (current):**
- Free tier: 2GB database, 500k reads/month, 2 real-time connections
- Pro: $25/month (8GB, unlimited real-time)

**PartyKit:**
- Free tier: 100k requests/month, 10GB bandwidth
- Pro: $10/month (1M requests, 100GB bandwidth)

**Hybrid approach:** Use both, optimize for each strength
- PartyKit: $10/month for real-time game state
- Supabase: Free or $25/month for auth + persistence
- Total: ~$10-35/month depending on scale

## Code Examples

### Current (Supabase)
```javascript
// Write move to DB, subscribe to changes
await supabase.from('games').update({ board, current_turn })
```

### After PartyKit
```javascript
// Send move to room, instant broadcast
room.broadcast({ type: 'move', position, board })
// Persist to Supabase only on game end
```

## Decision Framework

**Stick with Supabase if:**
- Current performance is acceptable (moves feel responsive)
- You're not hitting sync/state issues regularly
- Simplicity and single-service setup is valuable
- Scale is modest (<50 concurrent games)

**Migrate to PartyKit if:**
- Latency is hurting user experience
- Fighting Supabase real-time complexity regularly
- Want snappier, more interactive gameplay
- Planning to scale or add collaborative features

## Resources

- [PartyKit Docs](https://docs.partykit.io/)
- [PartyKit + Supabase Example](https://github.com/partykit/partykit/tree/main/examples/with-supabase)
- [Multiplayer Tic-Tac-Toe Pattern](https://docs.partykit.io/examples/multiplayer-games/)

## Notes

This migration is **not urgent**. Current architecture is solid for turn-based gameplay. Only migrate when pain points become consistent and measurable.
