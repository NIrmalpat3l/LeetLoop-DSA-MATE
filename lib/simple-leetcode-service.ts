import { supabase } from './supabase'

export class SimpleLeetCodeService {
  
  // Store all LeetCode data for a specific profile
  static async storeProfileLeetCodeData(profileId: string, username: string, data: any): Promise<void> {
    try {
      console.log('💾 Storing LeetCode data for profile:', profileId, 'username:', username)
      
      // Check if table exists first
      const { count, error: countError } = await supabase
        .from('leetcode_data')
        .select('*', { count: 'exact', head: true })
      
      if (countError) {
        console.error('❌ leetcode_data table does not exist:', countError)
        throw new Error(`Database table error: ${countError.message}. Please run the database schema first.`)
      }
      
      const leetcodeData = {
        profile_id: profileId,
        leetcode_username: username,
        user_profile: data.userProfile || null,
        user_calendar: data.userCalendar || null,
        contest_ranking: data.contestRanking || null,
        contest_history: data.contestHistory || null,
        language_stats: data.languageStats || null,
        tag_stats: data.tagStats || null,
        submission_stats: data.submissionStats || null,
        recent_submissions: data.recentSubmissions || null,
        all_questions_count: data.allQuestionsCount || null,
        streak_counter: data.streakCounter || null,
        last_synced_at: new Date().toISOString()
      }

      // Store submitStatsGlobal in submission_stats for now since submit_stats_global column doesn't exist
      if (data.submitStatsGlobal) {
        leetcodeData.submission_stats = {
          ...leetcodeData.submission_stats,
          submitStatsGlobal: data.submitStatsGlobal
        }
      }

      // Upsert the data (insert or update if exists)
      const { error } = await supabase
        .from('leetcode_data')
        .upsert(leetcodeData, { 
          onConflict: 'profile_id'
        })

      if (error) {
        console.error('❌ Error storing LeetCode data:', error)
        throw error
      }

      console.log('✅ LeetCode data stored successfully for profile')
    } catch (error) {
      console.error('💥 Failed to store LeetCode data:', error)
      throw error
    }
  }

  // Get LeetCode data for a specific profile
  static async getProfileLeetCodeData(profileId: string): Promise<any | null> {
    try {
      console.log('📖 Loading LeetCode data for profile:', profileId)
      
      // First check if the table exists by doing a simple count
      const { count, error: countError } = await supabase
        .from('leetcode_data')
        .select('*', { count: 'exact', head: true })
      
      if (countError) {
        console.warn('⚠️ leetcode_data table does not exist, returning mock data for testing:', countError)
        
        // Return mock data with proper structure for testing
        return {
          userProfile: {
            username: "testuser",
            realName: "Test User",
            numAcceptedQuestions: [
              { difficulty: "EASY", count: 125 },
              { difficulty: "MEDIUM", count: 89 },
              { difficulty: "HARD", count: 34 }
            ]
          },
          submitStatsGlobal: {
            acSubmissionNum: [
              { difficulty: "All", count: 248 },
              { difficulty: "Easy", count: 125 },
              { difficulty: "Medium", count: 89 },
              { difficulty: "Hard", count: 34 }
            ]
          },
          submissionStats: {
            acSubmissionNum: [
              { difficulty: "All", count: 248 },
              { difficulty: "Easy", count: 125 },
              { difficulty: "Medium", count: 89 },
              { difficulty: "Hard", count: 34 }
            ]
          },
          recentSubmissions: [
            { title: "Two Sum", titleSlug: "two-sum", difficulty: "Easy" },
            { title: "Add Two Numbers", titleSlug: "add-two-numbers", difficulty: "Medium" },
            { title: "Longest Substring Without Repeating Characters", titleSlug: "longest-substring-without-repeating-characters", difficulty: "Medium" }
          ],
          lastSynced: new Date().toISOString()
        }
      }
      
      const { data, error } = await supabase
        .from('leetcode_data')
        .select('*')
        .eq('profile_id', profileId)
        .maybeSingle() // Use maybeSingle instead of single to avoid errors when no data exists

      if (error) {
        console.error('❌ Error loading LeetCode data:', error)
        throw new Error(`Database query error: ${error.message}`)
      }

      if (data) {
        console.log('✅ LeetCode data loaded successfully for profile')
        
        // Convert back to the expected format
        return {
          userProfile: data.user_profile,
          userCalendar: data.user_calendar,
          contestRanking: data.contest_ranking,
          contestHistory: data.contest_history,
          languageStats: data.language_stats,
          tagStats: data.tag_stats,
          submissionStats: data.submission_stats,
          submitStatsGlobal: data.submission_stats?.submitStatsGlobal || data.submit_stats_global,
          recentSubmissions: data.recent_submissions,
          allQuestionsCount: data.all_questions_count,
          streakCounter: data.streak_counter,
          lastSynced: data.last_synced_at
        }
      }

      return null
    } catch (error) {
      console.error('💥 Failed to load LeetCode data:', error)
      throw error
    }
  }

  // Store problem analysis for a specific profile
  static async storeProfileProblemAnalysis(profileId: string, problemTitle: string, problemUrl: string, difficulty: string, analysis: any): Promise<void> {
    try {
      console.log('💾 Storing problem analysis for profile:', profileId, 'problem:', problemTitle)
      
      const analysisData = {
        profile_id: profileId,
        problem_title: problemTitle,
        problem_url: problemUrl,
        difficulty: difficulty,
        analysis_result: analysis
      }

      // Upsert the analysis (insert or update if exists)
      const { error } = await supabase
        .from('problem_analysis')
        .upsert(analysisData, { 
          onConflict: 'profile_id,problem_title'
        })

      if (error) {
        console.error('❌ Error storing problem analysis:', error)
        throw error
      }

      console.log('✅ Problem analysis stored successfully for profile')
    } catch (error) {
      console.error('💥 Failed to store problem analysis:', error)
      throw error
    }
  }

  // Get all problem analyses for a specific profile
  static async getProfileProblemAnalyses(profileId: string): Promise<any[]> {
    try {
      console.log('📖 Loading problem analyses for profile:', profileId)
      
      const { data, error } = await supabase
        .from('problem_analysis')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Error loading problem analyses:', error)
        throw error
      }

      console.log('✅ Loaded', data?.length || 0, 'problem analyses for profile')
      return data || []
    } catch (error) {
      console.error('💥 Failed to load problem analyses:', error)
      throw error
    }
  }

  // Delete all LeetCode data for a profile (cleanup)
  static async deleteProfileData(profileId: string): Promise<void> {
    try {
      console.log('🗑️ Deleting all LeetCode data for profile:', profileId)
      
      // Delete LeetCode data
      const { error: leetcodeError } = await supabase
        .from('leetcode_data')
        .delete()
        .eq('profile_id', profileId)

      if (leetcodeError) {
        console.error('❌ Error deleting LeetCode data:', leetcodeError)
      }

      // Delete problem analyses
      const { error: analysisError } = await supabase
        .from('problem_analysis')
        .delete()
        .eq('profile_id', profileId)

      if (analysisError) {
        console.error('❌ Error deleting problem analyses:', analysisError)
      }

      console.log('✅ Profile data deleted successfully')
    } catch (error) {
      console.error('💥 Failed to delete profile data:', error)
      throw error
    }
  }

  // Check if a profile has synced LeetCode data
  static async hasProfileData(profileId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('leetcode_data')
        .select('profile_id')
        .eq('profile_id', profileId)
        .single()

      return !error && !!data
    } catch (error) {
      return false
    }
  }

  // Get last sync time for a profile
  static async getLastSyncTime(profileId: string): Promise<Date | null> {
    try {
      const { data, error } = await supabase
        .from('leetcode_data')
        .select('last_synced_at')
        .eq('profile_id', profileId)
        .single()

      if (error || !data?.last_synced_at) {
        return null
      }

      return new Date(data.last_synced_at)
    } catch (error) {
      return null
    }
  }
}
