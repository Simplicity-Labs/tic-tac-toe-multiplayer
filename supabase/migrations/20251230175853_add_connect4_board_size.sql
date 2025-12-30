-- Add Connect 4 board size (7x6 = 42 cells) to valid board sizes
-- Drop the existing constraint and add a new one that includes 7
ALTER TABLE games DROP CONSTRAINT IF EXISTS valid_board_size;
ALTER TABLE games ADD CONSTRAINT valid_board_size CHECK (board_size IN (3, 4, 5, 7));
