# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start Vite dev server
npm run build    # Build for production
npm run lint     # Run ESLint
npm run format   # Format with Prettier
npm run preview  # Preview production build
```

## Architecture

This is a multiplayer Tic Tac Toe game built with React + Vite, using Supabase for backend (auth, database, real-time).

### Key Files

- `src/lib/supabase.js` - Supabase client initialization (requires `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` env vars)
- `src/lib/gameLogic.js` - Core game logic: win detection, draw checking, minimax AI algorithm
- `src/context/AuthContext.jsx` - Auth state management with profile handling
- `src/hooks/useGame.js` - Game state management with real-time subscriptions
- `src/hooks/useInvitations.js` - Real-time player invitations using Supabase broadcast

### Game Hooks

- `useGame(gameId)` - Manages active game state, moves, AI turns, and real-time updates
- `useCreateGame()` - Creates new games (AI or multiplayer)
- `useJoinGame()` - Joins existing waiting games
- `useAvailableGames()` - Lists joinable games with real-time updates
- `useGameHistory()` - Fetches completed games for current user
- `useInvitations()` - Handles sending/receiving game invitations via broadcast channels

### Routing

Protected routes require both auth and profile. Routes: `/login`, `/` (dashboard), `/game/:gameId`, `/history`

### UI Components

Uses Radix UI primitives with Tailwind CSS. Component structure:

- `src/components/ui/` - Reusable primitives (Button, Card, Input, Avatar, Badge, Toast, Timer)
- `src/components/game/` - Game-specific (Board, Cell, GameStatus, WinOverlay)
- `src/components/dashboard/` - Dashboard components (StatsCard, GameCard, GameList)

### Database Tables

- `profiles` - User profiles with username and stats (wins, losses, draws)
- `games` - Game state including board (9-element array), players, status, turn tracking
- `moves` - Move history

## Supabase

### CLI Commands

```bash
supabase projects list              # List all projects (shows linked project)
supabase migration new <name>       # Create new migration file
supabase db push                    # Push migrations to remote (use --include-all if needed)
supabase db pull                    # Pull schema from remote
supabase db diff                    # Show schema differences
```

**Note:** The Supabase CLI does NOT have a `--sql` flag for executing arbitrary SQL. To run SQL:
1. Create a migration file with `supabase migration new <name>`
2. Write SQL in the generated file at `supabase/migrations/<timestamp>_<name>.sql`
3. Push with `supabase db push`

### Real-time Setup

For `postgres_changes` to work, tables need:

1. **Publication membership** - Add table to real-time publication:
   ```sql
   ALTER PUBLICATION supabase_realtime ADD TABLE <table_name>;
   ```

2. **Replica identity** (for DELETE events to include row data):
   ```sql
   ALTER TABLE <table_name> REPLICA IDENTITY FULL;
   ```

### Real-time Subscriptions (postgres_changes)

```javascript
const channel = supabase
  .channel('channel-name')
  .on('postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'games' },
    (payload) => { /* payload.new contains the new row */ }
  )
  .on('postgres_changes',
    { event: 'UPDATE', schema: 'public', table: 'games' },
    (payload) => { /* payload.new and payload.old */ }
  )
  .on('postgres_changes',
    { event: 'DELETE', schema: 'public', table: 'games' },
    (payload) => { /* payload.old contains deleted row (requires REPLICA IDENTITY FULL) */ }
  )
  .subscribe()
```

**Important:** Filters like `filter: 'status=eq.waiting'` check:
- INSERT: the NEW row
- UPDATE: the NEW row (not old!) - so status changes FROM 'waiting' won't trigger
- DELETE: the OLD row

### Broadcast Channels

For ephemeral messaging between clients (not persisted):

```javascript
// Listener (stable, long-lived)
const channel = supabase.channel(`channel:${id}`, {
  config: { broadcast: { ack: true } }
})
channel
  .on('broadcast', { event: 'my-event' }, ({ payload }) => { ... })
  .subscribe()

// Sender (create, send, cleanup)
const sendChannel = supabase.channel(`channel:${targetId}`, {
  config: { broadcast: { ack: true } }
})
sendChannel.subscribe((status) => {
  if (status === 'SUBSCRIBED') {
    sendChannel.send({ type: 'broadcast', event: 'my-event', payload: {...} })
      .then(() => {
        setTimeout(() => supabase.removeChannel(sendChannel), 1000) // Delay cleanup
      })
  }
})
```

**Common pitfalls:**
- Don't put mutable state in useEffect dependencies that creates channels - causes reconnection loops
- Use refs to access current state values inside channel callbacks (stale closure problem)
- Wait for `SUBSCRIBED` status before sending broadcasts
- Delay channel removal after sending to ensure message propagates
- Broadcasts are ephemeral - if recipient isn't subscribed, message is lost

**If you keep hitting sync issues:** See [PartyKit Migration Guide](../docs/partykit-migration-guide.md) for when to consider switching from Supabase real-time to edge-based state management.

### Supabase Query Patterns

- `.single()` - Throws error if 0 or >1 rows returned (PGRST116)
- `.maybeSingle()` - Returns null for 0 rows, error for >1 rows (use when row might not exist)

## Notes
