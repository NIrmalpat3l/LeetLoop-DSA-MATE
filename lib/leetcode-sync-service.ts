import { SimpleLeetCodeService } from '@/lib/simple-leetcode-service'
import { supabase } from '@/lib/supabase'

export class LeetCodeSyncService {
  static async syncUserData(username: string, profileId: string): Promise<any> {
    try {
      console.log('📡 Starting LeetCode data sync for username:', username, 'profile:', profileId)

      // Get the current session for authentication
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('Authentication required to sync data')
      }

      // Call our Next.js API route which handles the GraphQL requests server-side
      // Note: We don't need to pass auth to API route since we'll store data on frontend
      const response = await fetch('/api/leetcode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: username,
          profile_id: profileId
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to sync LeetCode data')
      }

      console.log('✅ LeetCode API data received, now storing in database...')
      
      // Store the data in database using the frontend client (which has proper auth)
      try {
        await SimpleLeetCodeService.storeProfileLeetCodeData(profileId, username, result.data)
        console.log('✅ Successfully stored LeetCode data in database')
      } catch (storageError) {
        console.error('❌ Failed to store data in database:', storageError)
        throw new Error(`Failed to store data: ${storageError}`)
      }

      console.log('✅ Successfully synced LeetCode data for user:', username)
      return result.data

    } catch (error) {
      console.error('❌ LeetCode sync failed:', error)
      throw error
    }
  }
}
