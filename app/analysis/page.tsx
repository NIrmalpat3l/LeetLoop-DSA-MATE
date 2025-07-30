'use client'

import { useState, useEffect } from 'react'
import { Button } from '@nextui-org/react'
import { RefreshCw } from 'lucide-react'
import { LeetCodeUserData } from '@/lib/leetcode-api'
import { SimpleLeetCodeService } from '@/lib/simple-leetcode-service'
import { LeetCodeSyncService } from '@/lib/leetcode-sync-service'
import { supabase } from '@/lib/supabase'
import Navigation from '@/components/Navigation'
import SmartAnalysisComponent from '@/components/SmartAnalysisComponent'
import LoadingPage from '@/components/LoadingPage'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default function AnalysisPage() {
  const [leetcodeData, setLeetcodeData] = useState<LeetCodeUserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState('')
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    loadAnalysisData()
  }, [])

  const loadAnalysisData = async (forceRefresh = false) => {
    try {
      setLoading(true)
      setError('')
      
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        setError('Please sign in to view your analysis')
        setLoading(false)
        return
      }

      // Get user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error('Error fetching profile:', profileError)
        setError('Error loading profile')
        setLoading(false)
        return
      }

      if (!profileData?.leetcode_username) {
        setError('Please set your LeetCode username in your profile')
        setLoading(false)
        return
      }

      setProfile(profileData)

      console.log('🎯 Loading analysis data for username:', profileData.leetcode_username)

      // Try to load stored data for this profile directly from database
      try {
        console.log('🔍 Analysis: Loading data from database for profile:', profileData.id)
        
        const storedData = await SimpleLeetCodeService.getProfileLeetCodeData(profileData.id)
        if (storedData) {
          console.log('✅ Analysis: Loaded stored data successfully for profile')
          setLeetcodeData(storedData)
        } else {
          console.log('📭 Analysis: No stored data found for profile')
          setError('No LeetCode data found for this profile. Please go to Dashboard and use the Sync button to fetch data.')
        }
      } catch (storageError) {
        console.warn('⚠️ Analysis: Error loading stored data for profile:', storageError)
        setError('Error loading data from database. Please try refreshing or sync data from Dashboard.')
      }
    } catch (error) {
      console.error('Error loading analysis:', error)
      setError('Failed to load analysis data')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    console.log('🔄 Analysis: Manual refresh triggered')
    await loadAnalysisData() // Reload data from database
  }

  const syncLeetCodeData = async () => {
    if (!profile?.leetcode_username || !profile?.id) {
      setError('Please add your LeetCode username in your profile to sync data')
      return
    }

    try {
      setSyncing(true)
      setError('')
      console.log('🔄 Analysis: Starting LeetCode data sync for username:', profile.leetcode_username, 'profile:', profile.id)

      // Use the new sync service to fetch real data from LeetCode GraphQL API
      const syncedData = await LeetCodeSyncService.syncUserData(profile.leetcode_username, profile.id)
      
      console.log('✅ Analysis: Successfully synced LeetCode data')
      setLeetcodeData(syncedData)

    } catch (error: any) {
      console.error('❌ Analysis: Error syncing LeetCode data:', error)
      setError(error.message || 'Failed to sync LeetCode data')
    } finally {
      setSyncing(false)
    }
  }

  const handleSignIn = () => {
    window.location.href = '/auth'
  }

  // Show error state
  if (error) {
    const isAuthError = error.includes('sign in') || error.includes('log in')
    
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation currentPage="analysis" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center max-w-md">
              <div className="mb-6">
                <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <RefreshCw className="w-8 h-8 text-red-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {isAuthError ? 'Authentication Required' : 'Unable to Load Analysis'}
                </h2>
                <p className="text-gray-600 mb-6">
                  {error}
                </p>
                {isAuthError ? (
                  <Button 
                    color="primary" 
                    onPress={handleSignIn}
                    className="font-medium"
                  >
                    Sign In
                  </Button>
                ) : (
                  <div className="flex gap-3 justify-center">
                    <Button 
                      color="primary" 
                      onPress={() => window.location.href = '/profile'}
                      className="font-medium"
                    >
                      Go to Profile Settings
                    </Button>
                    <Button 
                      variant="bordered"
                      onPress={handleRefresh}
                      className="font-medium"
                      isLoading={loading}
                    >
                      Try Again
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation currentPage="analysis" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <LoadingPage 
            title="Loading Your Analysis" 
            message="Fetching your LeetCode data and generating insights..." 
            size="lg" 
          />
        ) : (
          <>
            {/* Header with sync button */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Performance Analysis</h1>
                <p className="text-gray-600">
                  Insights based on your LeetCode activity
                  {profile?.leetcode_username && (
                    <span className="text-sm text-gray-500 block">
                      Profile: {profile.leetcode_username}
                    </span>
                  )}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="bordered"
                  onPress={handleRefresh}
                  isLoading={loading}
                  startContent={!loading ? <RefreshCw className="w-4 h-4" /> : undefined}
                  className="text-gray-600 hover:text-gray-900"
                >
                  Refresh
                </Button>
                {profile?.leetcode_username && (
                  <Button
                    variant="bordered"
                    onPress={syncLeetCodeData}
                    isLoading={syncing}
                    startContent={!syncing ? <RefreshCw className="w-4 h-4" /> : undefined}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    {syncing ? 'Syncing...' : 'Sync Data'}
                  </Button>
                )}
              </div>
            </div>
            
            {/* Error State */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-red-800">No Data Available</h3>
                    <p className="text-red-600 mt-1">{error}</p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    {profile?.leetcode_username ? (
                      <Button
                        variant="bordered"
                        onPress={syncLeetCodeData}
                        isLoading={syncing}
                        startContent={!syncing ? <RefreshCw className="w-4 h-4" /> : undefined}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        {syncing ? 'Syncing...' : 'Sync Data'}
                      </Button>
                    ) : (
                      <Button
                        color="primary"
                        onPress={() => window.location.href = '/profile'}
                      >
                        Set LeetCode Username
                      </Button>
                    )}
                    <Button
                      variant="bordered"
                      onPress={() => window.location.href = '/dashboard'}
                    >
                      Go to Dashboard
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Smart Analysis Component */}
            {leetcodeData && !error && (
              <SmartAnalysisComponent 
                recentSubmissions={leetcodeData?.recentSubmissions || []} 
                onRefreshRequest={handleRefresh}
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}
