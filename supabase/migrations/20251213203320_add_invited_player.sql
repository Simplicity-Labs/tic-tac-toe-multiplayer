-- Add invited_player_id column to track direct invites
-- Games with this set should not appear in public "Available Games" list
ALTER TABLE games ADD COLUMN invited_player_id UUID REFERENCES auth.users(id);

-- Add index for faster lookups
CREATE INDEX idx_games_invited_player ON games(invited_player_id) WHERE invited_player_id IS NOT NULL;
