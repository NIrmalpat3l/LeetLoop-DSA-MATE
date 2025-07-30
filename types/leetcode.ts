// TypeScript interfaces for LeetCode profile data storage

export interface LeetCodeProfile {
  id: string
  user_id: string
  leetcode_username: string
  
  // Profile Stats
  total_question_beats_percentage?: number
  total_solved?: number
  
  // Difficulty-wise Accepted Questions
  easy_accepted?: number
  medium_accepted?: number
  hard_accepted?: number
  
  // Difficulty-wise Failed Questions
  easy_failed?: number
  medium_failed?: number
  hard_failed?: number
  
  // Difficulty-wise Untouched Questions
  easy_untouched?: number
  medium_untouched?: number
  hard_untouched?: number
  
  // Session Beats Percentage
  easy_beats_percentage?: number
  medium_beats_percentage?: number
  hard_beats_percentage?: number
  
  // Contest Stats
  contest_rating?: number
  contest_ranking?: number
  contests_attended?: number
  global_ranking?: number
  total_participants?: number
  top_percentage?: number
  contest_badge?: string
  
  // Streak Stats
  current_streak?: number
  max_streak?: number
  total_active_days?: number
  days_skipped?: number
  current_day_completed?: boolean
  
  // Calendar Data
  submission_calendar?: Record<string, number>
  active_years?: number[]
  dcc_badges?: Array<{
    timestamp: number
    badge: {
      name: string
      icon: string
    }
  }>
  
  // Submission Stats
  total_submissions?: number
  ac_submissions?: number
  
  // Metadata
  last_synced_at: string
  created_at: string
  updated_at: string
}

export interface LeetCodeLanguageStat {
  id: string
  profile_id: string
  language_name: string
  problems_solved: number
  created_at: string
  updated_at: string
}

export interface LeetCodeTopicStat {
  id: string
  profile_id: string
  tag_name: string
  tag_slug: string
  problems_solved: number
  skill_level: 'fundamental' | 'intermediate' | 'advanced'
  created_at: string
  updated_at: string
}

export interface LeetCodeContestHistory {
  id: string
  profile_id: string
  contest_title: string
  contest_start_time: number
  attended: boolean
  trend_direction: 'UP' | 'DOWN' | 'SAME'
  problems_solved: number
  total_problems: number
  finish_time_seconds: number
  rating: number
  ranking: number
  created_at: string
}

export interface LeetCodeSubmissionStat {
  id: string
  profile_id: string
  difficulty: 'All' | 'Easy' | 'Medium' | 'Hard'
  total_submissions: number
  accepted_submissions: number
  created_at: string
  updated_at: string
}

// Comprehensive LeetCode data interface (what we get from API)
export interface CompleteLeetCodeData {
  profile: LeetCodeProfile
  languageStats: LeetCodeLanguageStat[]
  topicStats: LeetCodeTopicStat[]
  contestHistory: LeetCodeContestHistory[]
  submissionStats: LeetCodeSubmissionStat[]
}
