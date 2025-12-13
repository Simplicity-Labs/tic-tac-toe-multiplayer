-- Add board_size column to games table
-- Default to 3 for existing games (classic 3x3 board)
ALTER TABLE games ADD COLUMN IF NOT EXISTS board_size integer DEFAULT 3;

-- Add check constraint to ensure valid board sizes
ALTER TABLE games ADD CONSTRAINT valid_board_size CHECK (board_size IN (3, 4, 5));

-- Create index for filtering by board size
CREATE INDEX IF NOT EXISTS idx_games_board_size ON games(board_size);

-- Update existing games to have board_size based on their board array length
-- 9 cells = 3x3, 16 cells = 4x4, 25 cells = 5x5
UPDATE games
SET board_size = CASE
  WHEN array_length(board, 1) = 9 THEN 3
  WHEN array_length(board, 1) = 16 THEN 4
  WHEN array_length(board, 1) = 25 THEN 5
  ELSE 3
END
WHERE board_size IS NULL OR board_size = 3;
