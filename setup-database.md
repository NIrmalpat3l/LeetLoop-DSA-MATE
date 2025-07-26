# Database Setup Instructions

## � Quick Setup

The new Smart Analysis System will automatically attempt to create the database table when you first use it. However, if auto-creation fails, follow the manual setup below.

## Manual Setup (If Needed)

### Step 1: Create the Table in Supabase Dashboard

1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/wzkarkntsufqbaawobxs
2. Click on "SQL Editor" in the left sidebar
3. Click "New Query" 
4. Copy and paste this SQL code:

```sql
-- Create table for storing LeetCode problem analysis
CREATE TABLE problem_analysis (
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

-- Create indexes for faster queries
CREATE INDEX idx_problem_analysis_user_id ON problem_analysis(user_id);
CREATE INDEX idx_problem_analysis_revision_date ON problem_analysis(revision_date);

-- Enable Row Level Security
ALTER TABLE problem_analysis ENABLE ROW LEVEL SECURITY;

-- Create RLS policies - users can only see their own analysis
CREATE POLICY "Users can view own analysis" ON problem_analysis
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analysis" ON problem_analysis
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own analysis" ON problem_analysis
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own analysis" ON problem_analysis
  FOR DELETE USING (auth.uid() = user_id);
```

5. Click "Run" to execute the SQL
6. You should see "Success. No rows returned" message

### Step 2: Verify the Table

After running the SQL:

1. Go to "Table Editor" in the left sidebar
2. You should see `problem_analysis` in the list of tables
3. Click on it to see the table structure

## ✨ New Features

The Smart Analysis System includes:

- **Intelligent Detection**: Only analyzes new submissions that haven't been processed
- **Calendar View**: Visual timeline of revision dates with color coding
- **Dual View Modes**: Switch between question-based and concept-based analysis
- **Detailed Analysis**: Rich LLM insights stored in database
- **Revision Scheduling**: Smart spaced repetition based on difficulty and confidence
- **Interactive Calendar**: Click dates to see problems due for review
- **Detailed Modal**: View comprehensive analysis for each problem

## How It Works

1. **First Time**: Click "Analyze All Problems" to process all submissions
2. **Updates**: System detects new submissions and shows "Update Analysis" button
3. **Calendar**: View problems by revision date with color-coded urgency
4. **Review**: Click calendar dates to see problems due for review
5. **Details**: Click "View Details" to see comprehensive LLM analysis

## Troubleshooting

If you see errors:
1. Check that you're logged into Supabase
2. Verify the table exists in Table Editor
3. Refresh your browser
4. Check browser console for detailed error messages
