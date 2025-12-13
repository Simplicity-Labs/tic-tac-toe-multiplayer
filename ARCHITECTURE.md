# Architecture

## System Overview

```mermaid
flowchart TB
    subgraph Client["Frontend (React + Vite)"]
        UI[UI Components]
        Pages[Pages]
        Hooks[Custom Hooks]
        Context[Auth Context]
    end

    subgraph Supabase["Supabase Backend"]
        Auth[Authentication]
        DB[(PostgreSQL)]
        Realtime[Realtime Subscriptions]
        RLS[Row Level Security]
    end

    subgraph Hosting["Hosting"]
        Vercel[Vercel CDN]
    end

    User((User)) --> Vercel
    Vercel --> Client
    Client <--> Auth
    Client <--> DB
    Client <--> Realtime
    DB --> RLS
```

## Component Architecture

```mermaid
flowchart TD
    subgraph App["App.jsx"]
        Router[React Router]
    end

    subgraph Providers["Context Providers"]
        Theme[ThemeProvider]
        AuthProv[AuthProvider]
        Toast[ToastProvider]
    end

    subgraph Pages["Pages"]
        Login[Login.jsx]
        Dashboard[Dashboard.jsx]
        Game[Game.jsx]
        History[History.jsx]
    end

    subgraph Components["Shared Components"]
        Layout[Layout.jsx]
        UI[UI Components]
        GameComp[Game Components]
        DashComp[Dashboard Components]
    end

    Router --> Providers
    Providers --> Pages
    Pages --> Components
    Layout --> Pages
```

## Data Flow

```mermaid
sequenceDiagram
    participant U as User
    participant C as Client
    participant S as Supabase
    participant O as Opponent

    Note over U,O: Game Creation
    U->>C: Create Game
    C->>S: INSERT into games
    S-->>C: Game ID
    C-->>U: Navigate to /game/:id

    Note over U,O: Opponent Joins
    O->>C: Join Game
    C->>S: UPDATE games (player_o)
    S->>C: Realtime: game updated
    S->>C: Realtime: game updated
    C-->>U: Show opponent joined
    C-->>O: Game starts

    Note over U,O: Gameplay Loop
    U->>C: Click cell
    C->>S: UPDATE games (board, current_turn)
    S->>C: Realtime: game updated
    C-->>O: Board updated, your turn
    O->>C: Click cell
    C->>S: UPDATE games (board, current_turn)
    S->>C: Realtime: game updated
    C-->>U: Board updated, your turn
```

## Database Schema

```mermaid
erDiagram
    PROFILES {
        uuid id PK
        text username UK
        text avatar_url
        int wins
        int losses
        int draws
        timestamp created_at
    }

    GAMES {
        uuid id PK
        uuid player_x FK
        uuid player_o FK
        text[] board
        uuid current_turn FK
        text status
        text winner
        bool is_ai_game
        text ai_difficulty
        timestamp turn_started_at
        timestamp created_at
        timestamp completed_at
    }

    MOVES {
        uuid id PK
        uuid game_id FK
        uuid player_id FK
        int position
        timestamp created_at
    }

    PROFILES ||--o{ GAMES : "plays as X"
    PROFILES ||--o{ GAMES : "plays as O"
    GAMES ||--o{ MOVES : "contains"
    PROFILES ||--o{ MOVES : "makes"
```

## AI Decision Tree

```mermaid
flowchart TD
    Start([AI Turn]) --> Diff{Difficulty?}

    Diff -->|Easy| Random[Random Move]
    Diff -->|Medium| Med{60% Smart?}
    Diff -->|Hard| Minimax[Minimax Algorithm]

    Med -->|Yes| Smart[Smart Logic]
    Med -->|No| Random

    Smart --> Win{Can Win?}
    Win -->|Yes| WinMove[Take Winning Move]
    Win -->|No| Block{Block Player?}
    Block -->|Yes| BlockMove[Block Player Win]
    Block -->|No| Center{Center Free?}
    Center -->|Yes| TakeCenter[Take Center]
    Center -->|No| Corner[Take Corner]
    Corner --> Random

    Minimax --> Best[Best Possible Move]

    Random --> Move([Make Move])
    WinMove --> Move
    BlockMove --> Move
    TakeCenter --> Move
    Best --> Move
```

## State Management

```mermaid
flowchart LR
    subgraph Global["Global State"]
        Auth[Auth Context]
        Theme[Theme State]
    end

    subgraph Local["Local State (Hooks)"]
        useGame[useGame Hook]
        useTimer[useTimer Hook]
        useToast[Toast State]
    end

    subgraph Supabase["Server State"]
        Games[Games Table]
        Profiles[Profiles Table]
        Realtime[Realtime Channel]
    end

    Auth <--> Profiles
    useGame <--> Games
    useGame <--> Realtime
    useTimer --> useGame
```

## File Structure

```
src/
├── components/
│   ├── ui/                 # Reusable UI primitives
│   │   ├── Button.jsx
│   │   ├── Card.jsx
│   │   ├── Input.jsx
│   │   ├── Avatar.jsx
│   │   ├── Badge.jsx
│   │   ├── Timer.jsx
│   │   └── Toast.jsx
│   ├── game/               # Game-specific components
│   │   ├── Board.jsx
│   │   ├── Cell.jsx
│   │   ├── GameStatus.jsx
│   │   └── WinOverlay.jsx
│   ├── dashboard/          # Dashboard components
│   │   ├── GameList.jsx
│   │   ├── GameCard.jsx
│   │   └── StatsCard.jsx
│   ├── Layout.jsx
│   └── ThemeToggle.jsx
├── pages/
│   ├── Login.jsx
│   ├── Dashboard.jsx
│   ├── Game.jsx
│   └── History.jsx
├── hooks/
│   ├── useGame.js          # Game state & Supabase sync
│   └── useTimer.js         # Turn countdown timer
├── context/
│   └── AuthContext.jsx     # Authentication state
├── lib/
│   ├── supabase.js         # Supabase client
│   ├── gameLogic.js        # Win detection, AI algorithms
│   └── utils.js            # Utility functions (cn)
├── App.jsx                 # Routes & providers
├── main.jsx                # Entry point
└── index.css               # Tailwind & global styles
```

## Security Model

```mermaid
flowchart TD
    subgraph Client
        User[User Request]
    end

    subgraph Supabase
        Auth[Auth Check]
        RLS[Row Level Security]
        DB[(Database)]
    end

    User --> Auth
    Auth -->|Valid JWT| RLS
    Auth -->|Invalid| Reject[Reject Request]

    RLS -->|Policy Pass| DB
    RLS -->|Policy Fail| Deny[Access Denied]

    subgraph Policies["RLS Policies"]
        P1[Users can read all profiles]
        P2[Users can only update own profile]
        P3[Users can read all games]
        P4[Users can only update games they're in]
    end

    RLS --> Policies
```
