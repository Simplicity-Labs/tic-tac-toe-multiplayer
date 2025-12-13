-- Tic Tac Toe Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES TABLE
-- ============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  draws INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- ============================================
-- GAMES TABLE
-- ============================================
CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_x UUID REFERENCES profiles(id) ON DELETE SET NULL,
  player_o UUID REFERENCES profiles(id) ON DELETE SET NULL,
  board TEXT[] DEFAULT ARRAY['', '', '', '', '', '', '', '', ''],
  current_turn UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'in_progress', 'completed')),
  winner TEXT, -- Can be UUID of winner, 'ai', or NULL for draw
  is_ai_game BOOLEAN DEFAULT FALSE,
  ai_difficulty TEXT DEFAULT 'hard' CHECK (ai_difficulty IN ('easy', 'medium', 'hard')),
  turn_started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE games ENABLE ROW LEVEL SECURITY;

-- Policies for games
CREATE POLICY "Games are viewable by everyone"
  ON games FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create games"
  ON games FOR INSERT
  WITH CHECK (auth.uid() = player_x);

CREATE POLICY "Players can update their games"
  ON games FOR UPDATE
  USING (
    auth.uid() = player_x OR
    auth.uid() = player_o OR
    (status = 'waiting' AND player_o IS NULL)
  );

-- ============================================
-- MOVES TABLE (for game history/replay)
-- ============================================
CREATE TABLE moves (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  player_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  position INTEGER CHECK (position >= 0 AND position <= 8),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE moves ENABLE ROW LEVEL SECURITY;

-- Policies for moves
CREATE POLICY "Moves are viewable by everyone"
  ON moves FOR SELECT
  USING (true);

CREATE POLICY "Players can insert moves for their games"
  ON moves FOR INSERT
  WITH CHECK (auth.uid() = player_id);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_games_status ON games(status);
CREATE INDEX idx_games_player_x ON games(player_x);
CREATE INDEX idx_games_player_o ON games(player_o);
CREATE INDEX idx_games_created_at ON games(created_at DESC);
CREATE INDEX idx_moves_game_id ON moves(game_id);

-- ============================================
-- REALTIME
-- ============================================
-- Enable realtime for games table
ALTER PUBLICATION supabase_realtime ADD TABLE games;

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to handle new user creation (auto-create profile trigger is optional)
-- Users will create their profile manually after signing up

-- Function to clean up old waiting games (optional, can be called periodically)
CREATE OR REPLACE FUNCTION cleanup_stale_games()
RETURNS void AS $$
BEGIN
  DELETE FROM games
  WHERE status = 'waiting'
  AND created_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
