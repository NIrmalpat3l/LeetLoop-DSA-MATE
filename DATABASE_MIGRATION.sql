-- Database Migration Instructions
-- Copy and run these commands in your Supabase SQL Editor

-- Add missing columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS daily_goal INTEGER DEFAULT 1;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS difficulty_preference TEXT DEFAULT 'Mixed';

-- Add constraints
ALTER TABLE profiles ADD CONSTRAINT IF NOT EXISTS check_daily_goal 
  CHECK (daily_goal >= 1 AND daily_goal <= 20);

ALTER TABLE profiles ADD CONSTRAINT IF NOT EXISTS check_difficulty_preference 
  CHECK (difficulty_preference IN ('Easy', 'Medium', 'Hard', 'Mixed'));

-- Verify the changes
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('daily_goal', 'difficulty_preference');
