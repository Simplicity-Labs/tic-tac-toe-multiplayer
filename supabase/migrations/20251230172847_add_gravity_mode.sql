-- Add 'gravity' to the valid game modes
-- First drop the existing constraint, then add the updated one
ALTER TABLE games DROP CONSTRAINT IF EXISTS games_game_mode_check;

ALTER TABLE games ADD CONSTRAINT games_game_mode_check
  CHECK (game_mode IN ('classic', 'decay', 'gravity'));
