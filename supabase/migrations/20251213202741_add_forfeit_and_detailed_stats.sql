-- Add forfeit_by column to games table
ALTER TABLE games ADD COLUMN IF NOT EXISTS forfeit_by UUID REFERENCES profiles(id);

-- Add separate stats columns to profiles for PvP and AI games
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS pvp_wins INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pvp_losses INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pvp_draws INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_easy_wins INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_easy_losses INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_easy_draws INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_medium_wins INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_medium_losses INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_medium_draws INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_hard_wins INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_hard_losses INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_hard_draws INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS forfeits INTEGER DEFAULT 0;

-- Migrate existing stats to pvp stats (assuming most were PvP)
-- You may want to adjust this based on your actual data
UPDATE profiles SET
  pvp_wins = COALESCE(wins, 0),
  pvp_losses = COALESCE(losses, 0),
  pvp_draws = COALESCE(draws, 0)
WHERE pvp_wins = 0 AND pvp_losses = 0 AND pvp_draws = 0;
