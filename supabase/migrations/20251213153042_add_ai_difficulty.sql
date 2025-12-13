-- Add ai_difficulty column to games table for supporting different AI difficulty levels
ALTER TABLE games ADD COLUMN IF NOT EXISTS ai_difficulty TEXT DEFAULT 'hard';

-- Add check constraint for valid difficulty values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'games_ai_difficulty_check'
  ) THEN
    ALTER TABLE games ADD CONSTRAINT games_ai_difficulty_check
      CHECK (ai_difficulty IN ('easy', 'medium', 'hard'));
  END IF;
END $$;
