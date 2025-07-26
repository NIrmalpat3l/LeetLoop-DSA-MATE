-- Create table for storing LeetCode problem analysis
CREATE TABLE IF NOT EXISTS problem_analysis (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  problem_title TEXT NOT NULL,
  problem_slug TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  category TEXT,
  
  -- Analysis results
  concepts_analysis JSONB,
  revision_date DATE NOT NULL,
  confidence_level INTEGER CHECK (confidence_level >= 1 AND confidence_level <= 5),
  
  -- Metadata
  analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  submission_timestamp TEXT,
  
  -- Ensure unique constraint on user + problem
  UNIQUE(user_id, problem_slug)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_problem_analysis_user_id ON problem_analysis(user_id);
CREATE INDEX IF NOT EXISTS idx_problem_analysis_revision_date ON problem_analysis(revision_date);

-- Enable RLS (Row Level Security)
ALTER TABLE problem_analysis ENABLE ROW LEVEL SECURITY;

-- Create RLS policy - users can only see their own analysis
CREATE POLICY "Users can view own analysis" ON problem_analysis
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analysis" ON problem_analysis
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own analysis" ON problem_analysis
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own analysis" ON problem_analysis
  FOR DELETE USING (auth.uid() = user_id);
