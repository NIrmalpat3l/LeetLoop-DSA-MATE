-- Add submit_stats_global column to user_progress table
ALTER TABLE user_progress 
ADD COLUMN submit_stats_global JSONB;

-- Update the column comment
COMMENT ON COLUMN user_progress.submit_stats_global IS 'Stores the raw submitStatsGlobal data from LeetCode API';
