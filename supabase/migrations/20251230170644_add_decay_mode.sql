-- Add game_mode column to games table for supporting different game modes
ALTER TABLE games ADD COLUMN IF NOT EXISTS game_mode TEXT DEFAULT 'classic';

-- Add placed_at array to track when each piece was placed (turn number)
-- This is used for decay mode to know when pieces should disappear
ALTER TABLE games ADD COLUMN IF NOT EXISTS placed_at integer[];

-- Add decay_turns column to configure how many turns before pieces decay (default 4)
ALTER TABLE games ADD COLUMN IF NOT EXISTS decay_turns integer DEFAULT 4;

-- Add turn_count to track the current turn number (for decay calculations)
ALTER TABLE games ADD COLUMN IF NOT EXISTS turn_count integer DEFAULT 0;

-- Add check constraint for valid game mode values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'games_game_mode_check'
  ) THEN
    ALTER TABLE games ADD CONSTRAINT games_game_mode_check
      CHECK (game_mode IN ('classic', 'decay'));
  END IF;
END $$;
