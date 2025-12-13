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

### Game Hooks

- `useGame(gameId)` - Manages active game state, moves, AI turns, and real-time updates
- `useCreateGame()` - Creates new games (AI or multiplayer)
- `useJoinGame()` - Joins existing waiting games
- `useAvailableGames()` - Lists joinable games with real-time updates
- `useGameHistory()` - Fetches completed games for current user

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

### Real-time

Uses Supabase channels to subscribe to game updates via `postgres_changes` events.
