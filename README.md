# Tic Tac Toe Multiplayer

A modern, real-time multiplayer Tic Tac Toe game built with React and Supabase.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react)
![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?logo=supabase)
![Tailwind](https://img.shields.io/badge/Tailwind-3.4-38B2AC?logo=tailwindcss)

## Features

### Multiplayer
- **Create Games** - Start a new game and share the link with friends
- **Join Games** - Browse and join available games from other players
- **Real-time Sync** - Instant updates using Supabase Realtime subscriptions
- **Turn Timer** - 10-second countdown per turn with auto-forfeit

### AI Opponent
- **Easy Mode** - Random moves, perfect for beginners
- **Medium Mode** - Smart but beatable, blocks obvious wins
- **Hard Mode** - Unbeatable AI using the Minimax algorithm

### User Experience
- **Authentication** - Secure email/password login with Supabase Auth
- **Player Stats** - Track your wins, losses, draws, and win rate
- **Game History** - View all your past games with outcomes
- **Dark Mode** - Automatic system theme detection + manual toggle
- **Responsive Design** - Works beautifully on desktop and mobile

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite |
| Styling | Tailwind CSS, class-variance-authority |
| Icons | Lucide React |
| Backend | Supabase (Auth, Database, Realtime) |
| Hosting | Vercel |

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

### 1. Clone the repository

```bash
git clone https://github.com/Simplicity-Labs/tic-tac-toe-multiplayer.git
cd tic-tac-toe-multiplayer
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the schema from `supabase/schema.sql`
3. Copy your project URL and anon key from Settings > API

### 4. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 5. Start the development server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # Reusable UI primitives
│   ├── game/           # Game board & status
│   └── dashboard/      # Dashboard widgets
├── pages/              # Route pages
├── hooks/              # Custom React hooks
├── context/            # React context providers
├── lib/                # Utilities & Supabase client
└── index.css           # Global styles
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed diagrams.

## Database Schema

### Tables

**profiles**
- User profile linked to Supabase Auth
- Tracks username, avatar, and game statistics

**games**
- Game state including board, players, status
- Supports both multiplayer and AI games

**moves**
- Game move history for replay/analysis

### Row Level Security

All tables have RLS policies ensuring:
- Users can only modify their own data
- Players can only update games they're participating in
- Public read access for profiles and games

## AI Algorithms

### Easy Mode
Pure random move selection from available positions.

### Medium Mode
60% chance of making a strategic move:
1. Win if possible
2. Block opponent's winning move
3. Take center if available
4. Take a corner
5. Otherwise random

### Hard Mode (Minimax)
Classic minimax algorithm with alpha-beta pruning for optimal play. This AI is mathematically unbeatable - the best you can achieve is a draw.

```javascript
// Simplified minimax
function minimax(board, isMaximizing) {
  if (winner) return score
  if (draw) return 0

  if (isMaximizing) {
    return max(minimax(children))
  } else {
    return min(minimax(children))
  }
}
```

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Manual Build

```bash
npm run build
# Output in dist/
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run format` | Format with Prettier |

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](./LICENSE) for details.

## Acknowledgments

- Built with [Claude Code](https://claude.ai/claude-code)
- Icons by [Lucide](https://lucide.dev)
- UI inspiration from [shadcn/ui](https://ui.shadcn.com)
