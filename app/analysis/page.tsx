'use client'

import { useState, useEffect } from 'react'
import { Card, CardBody, CardHeader, Button, Badge, Chip, Divider } from '@nextui-org/react'
import { Brain, Calendar, Clock, Lightbulb, ArrowRight, Sparkles, LinkIcon, ChevronDown, ChevronUp, User, LogOut, Target } from 'lucide-react'
import { fetchLeetCodeUserData, LeetCodeUserData, getMockLeetCodeData } from '@/lib/leetcode-api'
import { supabase } from '@/lib/supabase'
import SmartAnalysisComponent from '@/components/SmartAnalysisComponent'

function AnalysisPage() {
  const [leetcodeData, setLeetcodeData] = useState<LeetCodeUserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [profile, setProfile] = useState<any>(null)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    loadAnalysisData()
  }, [])

  const loadAnalysisData = async () => {
    try {
      setLoading(true)
      setError('')
      
      // Load user profile first
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your analysis data...</p>
        </div>
      </div>
    )
  }

  if (error || !leetcodeData) {
    const isAuthError = error === 'Please log in to view your analysis'
    
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Simple Navigation */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Brain className="w-8 h-8 text-blue-600" />
                  <span className="text-xl font-bold text-gray-900">LeetLoop</span>
                </div>
                <div className="hidden md:flex items-center space-x-6 ml-8">
                  <a href="/dashboard" className="text-gray-600 hover:text-gray-900">Dashboard</a>
                  <a href="/analysis" className="text-blue-600 font-medium">Analysis</a>
                  <a href="/profile" className="text-gray-600 hover:text-gray-900">Profile</a>
                </div>
              </div>
              {isAuthError ? (
                <Button 
                  color="primary"
                  onPress={handleSignIn}
                  startContent={<User className="w-4 h-4" />}
                  size="sm"
                >
                  Sign In
                </Button>
              ) : (
                <Button 
                  variant="ghost" 
                  onPress={handleSignOut}
                  startContent={<LogOut className="w-4 h-4" />}
                  size="sm"
                >
                  Sign Out
                </Button>
              )}
            </div>
          </div>
        </div>

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
                  startContent={<User className="w-4 h-4" />}
                >
                  Sign In
                </Button>
              ) : (
                <Button 
                  color="primary" 
                  onPress={() => window.location.href = '/profile'}
                  className="font-medium"
                >
                  Go to Profile Settings
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Login/Logout button in top-left corner */}
              {user ? (
                <Button 
                  variant="ghost" 
                  onPress={handleSignOut}
                  startContent={<LogOut className="w-4 h-4" />}
                  size="sm"
                  className="text-gray-600 hover:text-gray-900"
                >
                  Sign Out
                </Button>
              ) : (
                <Button 
                  color="primary"
                  onPress={handleSignIn}
                  startContent={<User className="w-4 h-4" />}
                  size="sm"
                >
                  Sign In
                </Button>
              )}
              
              <div className="flex items-center space-x-2">
                <Brain className="w-8 h-8 text-blue-600" />
                <span className="text-xl font-bold text-gray-900">LeetLoop</span>
              </div>
              <div className="hidden md:flex items-center space-x-6 ml-8">
                <a href="/dashboard" className="text-gray-600 hover:text-gray-900">Dashboard</a>
                <a href="/analysis" className="text-blue-600 font-medium">Analysis</a>
                <a href="/profile" className="text-gray-600 hover:text-gray-900">Profile</a>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {profile && (
                <>
                  <span className="text-sm text-gray-600">Welcome back, {profile?.full_name || 'User'}!</span>
                  <Button 
                    variant="ghost" 
                    onPress={loadAnalysisData}
                    isLoading={loading}
                    size="sm"
                  >
                    Refresh
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Smart Analysis Component */}
        <SmartAnalysisComponent recentSubmissions={leetcodeData?.recentSubmissions || []} />
      </div>
    </div>
  )
}

export default AnalysisPage
