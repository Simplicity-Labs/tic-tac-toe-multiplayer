-- Add 'bomb', 'blocker', and 'fog' to the valid game modes
ALTER TABLE games DROP CONSTRAINT IF EXISTS games_game_mode_check;

ALTER TABLE games ADD CONSTRAINT games_game_mode_check
  CHECK (game_mode IN ('classic', 'decay', 'gravity', 'misere', 'random', 'bomb', 'blocker', 'fog'));

-- Add bombed_cells column for bomb mode (stores array of bombed cell indices)
ALTER TABLE games ADD COLUMN IF NOT EXISTS bombed_cells integer[] DEFAULT '{}';
