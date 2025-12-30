-- Add turn_duration column to games table
-- Stores turn duration in seconds, NULL means no timer (unlimited time)
ALTER TABLE games ADD COLUMN turn_duration INTEGER DEFAULT 30;

-- Add comment for documentation
COMMENT ON COLUMN games.turn_duration IS 'Turn duration in seconds. NULL means no timer (unlimited time).';
