-- Create leetcode_data table to store LeetCode API responses
CREATE TABLE leetcode_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  leetcode_username TEXT NOT NULL,
  user_profile JSONB,
  user_calendar JSONB,
  contest_ranking JSONB,
  contest_history JSONB,
  language_stats JSONB,
  tag_stats JSONB,
  submission_stats JSONB,
  submit_stats_global JSONB,
  recent_submissions JSONB,
  all_questions_count JSONB,
  streak_counter JSONB,
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create problem_analysis table to store AI analysis results
CREATE TABLE problem_analysis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  problem_title TEXT NOT NULL,
  problem_url TEXT NOT NULL,
  difficulty TEXT CHECK (difficulty IN ('Easy', 'Medium', 'Hard')) NOT NULL,
  analysis_result JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profile_id, problem_title)
);

-- Enable Row Level Security
ALTER TABLE leetcode_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE problem_analysis ENABLE ROW LEVEL SECURITY;

-- Create policies for leetcode_data
CREATE POLICY "Users can view own leetcode data" ON leetcode_data
  FOR SELECT USING (profile_id IN (SELECT id FROM profiles WHERE auth.uid() = id));

CREATE POLICY "Users can insert own leetcode data" ON leetcode_data
  FOR INSERT WITH CHECK (profile_id IN (SELECT id FROM profiles WHERE auth.uid() = id));

CREATE POLICY "Users can update own leetcode data" ON leetcode_data
  FOR UPDATE USING (profile_id IN (SELECT id FROM profiles WHERE auth.uid() = id));

CREATE POLICY "Users can delete own leetcode data" ON leetcode_data
  FOR DELETE USING (profile_id IN (SELECT id FROM profiles WHERE auth.uid() = id));

-- Create policies for problem_analysis
CREATE POLICY "Users can view own problem analysis" ON problem_analysis
  FOR SELECT USING (profile_id IN (SELECT id FROM profiles WHERE auth.uid() = id));

CREATE POLICY "Users can insert own problem analysis" ON problem_analysis
  FOR INSERT WITH CHECK (profile_id IN (SELECT id FROM profiles WHERE auth.uid() = id));

CREATE POLICY "Users can update own problem analysis" ON problem_analysis
  FOR UPDATE USING (profile_id IN (SELECT id FROM profiles WHERE auth.uid() = id));

CREATE POLICY "Users can delete own problem analysis" ON problem_analysis
  FOR DELETE USING (profile_id IN (SELECT id FROM profiles WHERE auth.uid() = id));

-- Create indexes for better performance
CREATE INDEX leetcode_data_profile_id_idx ON leetcode_data(profile_id);
CREATE INDEX leetcode_data_leetcode_username_idx ON leetcode_data(leetcode_username);
CREATE INDEX problem_analysis_profile_id_idx ON problem_analysis(profile_id);
CREATE INDEX problem_analysis_problem_title_idx ON problem_analysis(problem_title);
