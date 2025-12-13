-- Set REPLICA IDENTITY FULL for games table
-- This ensures DELETE events include full row data for real-time subscriptions
ALTER TABLE games REPLICA IDENTITY FULL;
