-- Add avatar field to profiles table
ALTER TABLE profiles ADD COLUMN avatar text DEFAULT '😀';

-- Update existing profiles to have a default avatar
UPDATE profiles SET avatar = '😀' WHERE avatar IS NULL;
