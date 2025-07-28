'use client'

import { useState, useEffect } from 'react'
import { Card, CardBody, CardHeader, Button, Badge, Chip, Divider } from '@nextui-org/react'
import { Calendar, Clock, Lightbulb, ArrowRight, Sparkles, LinkIcon, ChevronDown, ChevronUp, Target, RefreshCw } from 'lucide-react'
import { fetchLeetCodeUserData, LeetCodeUserData, getMockLeetCodeData } from '@/lib/leetcode-api'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import Navigation from '@/components/Navigation'
import SmartAnalysisComponent from '@/components/SmartAnalysisComponent'
import LoadingPage from '@/components/LoadingPage'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

function AnalysisPage() {
  const { user, loading: authLoading } = useAuth()
  const [leetcodeData, setLeetcodeData] = useState<LeetCodeUserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [profile, setProfile] = useState<any>(null)
  const [dataLoaded, setDataLoaded] = useState(false)

  useEffect(() => {
    // Only load once when auth state is resolved and we haven't loaded data yet
    if (!authLoading && !dataLoaded) {
      loadAnalysisData()
    }
  }, [authLoading, dataLoaded])

  const loadAnalysisData = async () => {
    try {
      setLoading(true)
      setError('')
      
      // Check if user is authenticated
      if (!user) {
        setError('Please log in to view your analysis')
        return
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      setProfile(profileData)

      // If LeetCode username is not set, don't try to fetch data
      if (!profileData?.leetcode_username) {
        setError('Please add your LeetCode username in your profile to see analysis data')
        return
      }

      // Fetch LeetCode data
      try {
        console.log('🎯 Analysis: Attempting to fetch LeetCode data for:', profileData.leetcode_username)
        const data = await fetchLeetCodeUserData(profileData.leetcode_username)
        
        if (!data) {
          throw new Error('No data returned from API')
        }
        
        console.log('🎉 Analysis: Successfully received LeetCode data:', data)
        console.log('📊 Analysis: Recent submissions count:', data?.recentSubmissions?.length || 0)
        console.log('📝 Analysis: Recent submissions sample:', data?.recentSubmissions?.slice(0, 3))
        
        setLeetcodeData(data)
        setDataLoaded(true) // Mark data as loaded
      } catch (leetCodeError: any) {
        console.error('❌ Analysis: LeetCode API error:', leetCodeError)
        setError(`Failed to fetch LeetCode data: ${leetCodeError.message}. Please check your username and try again.`)
      }
    } catch (error) {
      console.error('Error loading analysis:', error)
      setError('Failed to load analysis data')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    console.log('🔄 Manual refresh triggered')
    setDataLoaded(false) // Reset data loaded flag
    await loadAnalysisData()
  }

  const handleRefreshAndAnalyze = async () => {
    console.log('🔄 Comprehensive refresh and analysis triggered')
    setDataLoaded(false) // Reset data loaded flag
    await loadAnalysisData()
  }

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      window.location.href = '/'
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const handleSignIn = () => {
    window.location.href = '/'
  }

  if (loading) {
    return (
      <LoadingPage 
        title="Loading Analysis"
        message="Please wait while we process your LeetCode data and generate AI-powered insights..."
        size="lg"
      />
    )
  }

  if (error || !leetcodeData) {
    const isAuthError = error === 'Please log in to view your analysis'
    
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation currentPage="analysis" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {isAuthError ? 'Please log in to view your analysis' : (error || 'Please Add Your LeetCode Username')}
              </h3>
              <p className="text-gray-600 mb-6">
                {isAuthError 
                  ? 'Sign in to your account to access your LeetCode analysis.'
                  : (error ? 'There was an issue loading your data.' : 'Connect your LeetCode account to see your detailed analysis.')
                }
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
                <div className="flex gap-3">
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
            {/* Header with refresh button */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Performance Analysis</h1>
                <p className="text-gray-600">Insights based on your LeetCode activity</p>
              </div>
              <Button
                variant="bordered"
                onPress={handleRefreshAndAnalyze}
                isLoading={loading}
                startContent={!loading ? <RefreshCw className="w-4 h-4" /> : undefined}
                className="text-gray-600 hover:text-gray-900"
              >
                Sync LeetCode Data
              </Button>
            </div>
            
            {/* Smart Analysis Component */}
            <SmartAnalysisComponent 
              recentSubmissions={leetcodeData?.recentSubmissions || []} 
              onRefreshRequest={handleRefreshAndAnalyze}
            />
          </>
        )}
      </div>
    </div>
  )
}

export default AnalysisPage
