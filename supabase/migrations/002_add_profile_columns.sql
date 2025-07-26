-- Add missing columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS daily_goal INTEGER DEFAULT 1;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS difficulty_preference TEXT DEFAULT 'Mixed';

-- Add constraint to daily_goal
ALTER TABLE profiles ADD CONSTRAINT check_daily_goal CHECK (daily_goal >= 1 AND daily_goal <= 20);

-- Add constraint to difficulty_preference
ALTER TABLE profiles ADD CONSTRAINT check_difficulty_preference CHECK (difficulty_preference IN ('Easy', 'Medium', 'Hard', 'Mixed'));

-- Update the updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger for profiles table
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
