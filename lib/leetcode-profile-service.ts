import { supabase } from '@/lib/supabase'
import { 
  LeetCodeProfile, 
  LeetCodeLanguageStat, 
  LeetCodeTopicStat, 
  LeetCodeContestHistory, 
  LeetCodeSubmissionStat 
} from '@/types/leetcode'

export class LeetCodeProfileService {
  
  /**
   * Store or update complete LeetCode profile data
   */
  static async storeProfileData(userId: string, leetcodeUsername: string, apiData: any) {
    try {
      console.log('🔄 Storing LeetCode profile data for:', leetcodeUsername)
      
      // 1. Create or update main profile record
      const profileData = this.mapApiToProfile(userId, leetcodeUsername, apiData)
      
      const { data: profile, error: profileError } = await supabase
        .from('leetcode_profiles')
        .upsert(profileData, {
          onConflict: 'user_id,leetcode_username'
        })
        .select()
        .single()

      if (profileError) {
        console.error('❌ Error storing profile:', profileError)
        throw profileError
      }

      const profileId = profile.id

      // 2. Store language statistics
      if (apiData.languageStats && Array.isArray(apiData.languageStats)) {
        await this.storeLanguageStats(profileId, apiData.languageStats)
      }

      // 3. Store topic statistics
      if (apiData.tagStats) {
        await this.storeTopicStats(profileId, apiData.tagStats)
      }

      // 4. Store contest history
      if (apiData.contestHistory && Array.isArray(apiData.contestHistory)) {
        await this.storeContestHistory(profileId, apiData.contestHistory)
      }

      // 5. Store submission statistics
      if (apiData.submissionStats) {
        await this.storeSubmissionStats(profileId, apiData.submissionStats)
      }

      console.log('✅ Successfully stored complete LeetCode profile data')
      return profile

    } catch (error) {
      console.error('💥 Error storing LeetCode profile data:', error)
      throw error
    }
  }

  /**
   * Get complete LeetCode profile data for a user
   */
  static async getProfileData(userId: string, leetcodeUsername?: string) {
    try {
      let query = supabase
        .from('leetcode_profiles')
        .select(`
          *,
          leetcode_language_stats(*),
          leetcode_topic_stats(*),
          leetcode_contest_history(*),
          leetcode_submission_stats(*)
        `)
        .eq('user_id', userId)

      if (leetcodeUsername) {
        query = query.eq('leetcode_username', leetcodeUsername)
      }

      const { data, error } = await query.order('last_synced_at', { ascending: false })

      if (error) {
        console.error('❌ Error fetching profile data:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('💥 Error getting profile data:', error)
      throw error
    }
  }

  /**
   * Map API response to profile database format
   */
  private static mapApiToProfile(userId: string, leetcodeUsername: string, apiData: any): Partial<LeetCodeProfile> {
    const userProfile = apiData.userProfile || {}
    const contestRanking = apiData.contestRanking || {}
    const streakCounter = apiData.streakCounter || {}
    const userCalendar = apiData.userCalendar || {}

    return {
      user_id: userId,
      leetcode_username: leetcodeUsername,
      
      // Profile Stats
      total_question_beats_percentage: userProfile.totalQuestionBeatsPercentage,
      
      // Difficulty stats from numAcceptedQuestions
      easy_accepted: userProfile.numAcceptedQuestions?.find((q: any) => q.difficulty === 'Easy')?.count || 0,
      medium_accepted: userProfile.numAcceptedQuestions?.find((q: any) => q.difficulty === 'Medium')?.count || 0,
      hard_accepted: userProfile.numAcceptedQuestions?.find((q: any) => q.difficulty === 'Hard')?.count || 0,
      
      // Failed questions
      easy_failed: userProfile.numFailedQuestions?.find((q: any) => q.difficulty === 'Easy')?.count || 0,
      medium_failed: userProfile.numFailedQuestions?.find((q: any) => q.difficulty === 'Medium')?.count || 0,
      hard_failed: userProfile.numFailedQuestions?.find((q: any) => q.difficulty === 'Hard')?.count || 0,
      
      // Untouched questions
      easy_untouched: userProfile.numUntouchedQuestions?.find((q: any) => q.difficulty === 'Easy')?.count || 0,
      medium_untouched: userProfile.numUntouchedQuestions?.find((q: any) => q.difficulty === 'Medium')?.count || 0,
      hard_untouched: userProfile.numUntouchedQuestions?.find((q: any) => q.difficulty === 'Hard')?.count || 0,
      
      // Beats percentage
      easy_beats_percentage: userProfile.userSessionBeatsPercentage?.find((b: any) => b.difficulty === 'Easy')?.percentage,
      medium_beats_percentage: userProfile.userSessionBeatsPercentage?.find((b: any) => b.difficulty === 'Medium')?.percentage,
      hard_beats_percentage: userProfile.userSessionBeatsPercentage?.find((b: any) => b.difficulty === 'Hard')?.percentage,
      
      // Contest Stats
      contest_rating: contestRanking.rating,
      contest_ranking: contestRanking.globalRanking,
      contests_attended: contestRanking.attendedContestsCount,
      global_ranking: contestRanking.globalRanking,
      total_participants: contestRanking.totalParticipants,
      top_percentage: contestRanking.topPercentage,
      contest_badge: contestRanking.badge,
      
      // Streak Stats
      current_streak: streakCounter.streakCount || userCalendar.streak,
      total_active_days: userCalendar.totalActiveDays,
      days_skipped: streakCounter.daysSkipped,
      current_day_completed: streakCounter.currentDayCompleted,
      
      // Calendar Data
      submission_calendar: userCalendar.submissionCalendar ? JSON.parse(userCalendar.submissionCalendar) : {},
      active_years: userCalendar.activeYears || [],
      dcc_badges: userCalendar.dccBadges || [],
      
      last_synced_at: new Date().toISOString()
    }
  }

  /**
   * Store language statistics
   */
  private static async storeLanguageStats(profileId: string, languageStats: any[]) {
    if (!languageStats || !Array.isArray(languageStats)) return

    // Delete existing language stats for this profile
    await supabase
      .from('leetcode_language_stats')
      .delete()
      .eq('profile_id', profileId)

    // Insert new language stats
    const languageData = languageStats.map(lang => ({
      profile_id: profileId,
      language_name: lang.languageName,
      problems_solved: lang.problemsSolved || 0
    }))

    if (languageData.length > 0) {
      const { error } = await supabase
        .from('leetcode_language_stats')
        .insert(languageData)

      if (error) {
        console.error('❌ Error storing language stats:', error)
        throw error
      }
    }
  }

  /**
   * Store topic/tag statistics
   */
  private static async storeTopicStats(profileId: string, tagStats: any) {
    if (!tagStats) return

    // Delete existing topic stats for this profile
    await supabase
      .from('leetcode_topic_stats')
      .delete()
      .eq('profile_id', profileId)

    const topicData: any[] = []

    // Process all skill levels
    const skillLevels = ['fundamental', 'intermediate', 'advanced'] as const
    
    skillLevels.forEach(level => {
      if (tagStats[level] && Array.isArray(tagStats[level])) {
        tagStats[level].forEach((tag: any) => {
          topicData.push({
            profile_id: profileId,
            tag_name: tag.tagName,
            tag_slug: tag.tagSlug,
            problems_solved: tag.problemsSolved || 0,
            skill_level: level
          })
        })
      }
    })

    if (topicData.length > 0) {
      const { error } = await supabase
        .from('leetcode_topic_stats')
        .insert(topicData)

      if (error) {
        console.error('❌ Error storing topic stats:', error)
        throw error
      }
    }
  }

  /**
   * Store contest history
   */
  private static async storeContestHistory(profileId: string, contestHistory: any[]) {
    if (!contestHistory || !Array.isArray(contestHistory)) return

    // Delete existing contest history for this profile
    await supabase
      .from('leetcode_contest_history')
      .delete()
      .eq('profile_id', profileId)

    const contestData = contestHistory.map(contest => ({
      profile_id: profileId,
      contest_title: contest.contest?.title || '',
      contest_start_time: contest.contest?.startTime || 0,
      attended: contest.attended || false,
      trend_direction: contest.trendDirection || 'SAME',
      problems_solved: contest.problemsSolved || 0,
      total_problems: contest.totalProblems || 0,
      finish_time_seconds: contest.finishTimeInSeconds || 0,
      rating: contest.rating || 0,
      ranking: contest.ranking || 0
    }))

    if (contestData.length > 0) {
      const { error } = await supabase
        .from('leetcode_contest_history')
        .insert(contestData)

      if (error) {
        console.error('❌ Error storing contest history:', error)
        throw error
      }
    }
  }

  /**
   * Store submission statistics
   */
  private static async storeSubmissionStats(profileId: string, submissionStats: any) {
    if (!submissionStats) return

    // Delete existing submission stats for this profile
    await supabase
      .from('leetcode_submission_stats')
      .delete()
      .eq('profile_id', profileId)

    const submissionData: any[] = []

    // Process total submissions
    if (submissionStats.totalSubmissionNum && Array.isArray(submissionStats.totalSubmissionNum)) {
      submissionStats.totalSubmissionNum.forEach((stat: any) => {
        submissionData.push({
          profile_id: profileId,
          difficulty: stat.difficulty,
          total_submissions: stat.count || 0,
          accepted_submissions: 0 // Will be updated with AC data
        })
      })
    }

    // Update with accepted submissions
    if (submissionStats.acSubmissionNum && Array.isArray(submissionStats.acSubmissionNum)) {
      submissionStats.acSubmissionNum.forEach((stat: any) => {
        const existingIndex = submissionData.findIndex(s => s.difficulty === stat.difficulty)
        if (existingIndex >= 0) {
          submissionData[existingIndex].accepted_submissions = stat.count || 0
        } else {
          submissionData.push({
            profile_id: profileId,
            difficulty: stat.difficulty,
            total_submissions: 0,
            accepted_submissions: stat.count || 0
          })
        }
      })
    }

    if (submissionData.length > 0) {
      const { error } = await supabase
        .from('leetcode_submission_stats')
        .insert(submissionData)

      if (error) {
        console.error('❌ Error storing submission stats:', error)
        throw error
      }
    }
  }

  /**
   * Get the most recent profile for a user
   */
  static async getCurrentProfile(userId: string) {
    const { data, error } = await supabase
      .from('leetcode_profiles')
      .select('*')
      .eq('user_id', userId)
      .order('last_synced_at', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      throw error
    }

    return data
  }

  /**
   * Get all LeetCode usernames for a user
   */
  static async getUserLeetCodeProfiles(userId: string) {
    const { data, error } = await supabase
      .from('leetcode_profiles')
      .select('leetcode_username, last_synced_at, total_solved')
      .eq('user_id', userId)
      .order('last_synced_at', { ascending: false })

    if (error) {
      throw error
    }

    return data || []
  }
}
