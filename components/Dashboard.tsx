'use client'

import { useState, useEffect } from 'react'
import { Card, CardBody, CardHeader, Button, Progress, Badge, Divider, Chip, User as UserIcon } from '@nextui-org/react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer, LabelList } from 'recharts'
import { Bell, Calendar, TrendingUp, Target, Brain, AlertTriangle, CheckCircle, Clock, LinkIcon, User, LogOut, Code, Trophy, Flame, ArrowRight, RefreshCw } from 'lucide-react'
import { LeetCodeUserData, generateLeetCodeProblemUrl } from '@/lib/leetcode-api'
import { SimpleLeetCodeService } from '@/lib/simple-leetcode-service'
import { LeetCodeSyncService } from '@/lib/leetcode-sync-service'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import LoadingPage from '@/components/LoadingPage'
import Navigation from '@/components/Navigation'

function Dashboard() {
  const { user, profile: authProfile, loading: authLoading } = useAuth()
  const [leetcodeData, setLeetcodeData] = useState<LeetCodeUserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    // Only load dashboard data when auth state is resolved and we have a profile
    if (!authLoading && user && authProfile) {
      loadDashboardData()
    } else if (!authLoading) {
      setLoading(false)
    }
  }, [user, authProfile, authLoading])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError('')
      
      console.log('🔍 Dashboard: Loading data for profile:', authProfile?.id, 'leetcode_username:', authProfile?.leetcode_username)

      // If LeetCode username is not set, don't try to fetch data
      if (!authProfile?.leetcode_username) {
        console.log('📝 Dashboard: No LeetCode username set in profile')
        return // Don't set error here, let the UI handle it
      }

      // Fetch LeetCode data from database
      try {
        console.log('🔍 Dashboard: Loading LeetCode data from database for profile:', authProfile.id)
        
        const data = await SimpleLeetCodeService.getProfileLeetCodeData(authProfile.id)
        
        // Check if we got stored data
        if (data) {
          console.log('✅ Dashboard: Loaded stored LeetCode data for profile')
          console.log('📊 Dashboard: Data structure inspection:', {
            hasUserProfile: !!data.userProfile,
            hasSubmissionStats: !!data.submissionStats,
            userProfileKeys: data.userProfile ? Object.keys(data.userProfile) : [],
            submissionStatsKeys: data.submissionStats ? Object.keys(data.submissionStats) : [],
            numAcceptedQuestions: data.userProfile?.numAcceptedQuestions,
            acSubmissionNum: data.submissionStats?.acSubmissionNum,
            fullUserProfile: data.userProfile,
            fullSubmissionStats: data.submissionStats
          })
          setLeetcodeData(data)
        } else {
          console.log('� Dashboard: No stored data found for profile')
          setError('No LeetCode data found for this profile. Use the sync button to fetch data from LeetCode.')
        }
      } catch (storageError: any) {
        console.error('❌ Dashboard: Error loading stored data:', storageError)
        setError('Error loading data from database. Please try refreshing the page.')
      }
    } catch (error: any) {
      console.error('Error loading dashboard:', error)
      setError(`Failed to load dashboard data: ${error.message || 'Unknown error'}`)
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

  const syncLeetCodeData = async () => {
    console.log('🔍 Dashboard: syncLeetCodeData called with authProfile:', authProfile)
    console.log('🔍 Dashboard: authProfile?.leetcode_username:', authProfile?.leetcode_username)
    console.log('🔍 Dashboard: authProfile?.id:', authProfile?.id)
    
    if (!authProfile?.leetcode_username || !authProfile?.id) {
      setError('Please add your LeetCode username in your profile to sync data')
      return
    }

    try {
      setSyncing(true)
      setError('')
      setSuccessMessage('')
      console.log('🔄 Dashboard: Starting LeetCode data sync for username:', authProfile.leetcode_username, 'profile:', authProfile.id)

      // Use the new sync service to fetch real data from LeetCode GraphQL API
      const syncedData = await LeetCodeSyncService.syncUserData(authProfile.leetcode_username, authProfile.id)
      
      console.log('✅ Dashboard: Successfully synced LeetCode data')
      setLeetcodeData(syncedData)
      setSuccessMessage('LeetCode data synced successfully!')

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000)

    } catch (error: any) {
      console.error('❌ Dashboard: Error syncing LeetCode data:', error)
      setError(error.message || 'Failed to sync LeetCode data')
    } finally {
      setSyncing(false)
    }
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(parseInt(timestamp) * 1000).toLocaleDateString()
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'success'
      case 'medium': return 'warning' 
      case 'hard': return 'danger'
      default: return 'default'
    }
  }

  const renderLanguageChart = () => {
    if (!leetcodeData?.languageStats?.length) return null

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Code className="w-5 h-5" />
            <h3 className="text-lg font-semibold">Languages</h3>
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          {leetcodeData.languageStats.map((lang, index) => (
            <div key={lang.languageName} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-6 bg-gray-700 text-white text-xs rounded flex items-center justify-center font-mono font-medium">
                  {lang.languageName === 'C++' ? 'C++' : 
                   lang.languageName === 'JavaScript' ? 'JS' : 
                   lang.languageName === 'Java' ? 'Java' :
                   lang.languageName.slice(0, 3)}
                </div>
                <span className="text-gray-700 font-medium">{lang.languageName}</span>
              </div>
              <div className="text-right">
                <span className="text-gray-900 font-semibold text-lg">{lang.problemsSolved}</span>
                <span className="text-gray-500 ml-2 text-sm">problems solved</span>
              </div>
            </div>
          ))}
        </CardBody>
      </Card>
    )
  }

  const [showAllTopics, setShowAllTopics] = useState(false)

  const renderTopicAnalysis = () => {
    if (!leetcodeData?.tagStats) return null

    const allTopics = [
      ...(leetcodeData.tagStats.fundamental || []),
      ...(leetcodeData.tagStats.intermediate || []), 
      ...(leetcodeData.tagStats.advanced || [])
    ].sort((a, b) => b.problemsSolved - a.problemsSolved)

    const displayedTopics = showAllTopics ? allTopics : allTopics.slice(0, 7)

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            <h3 className="text-lg font-semibold">DSA Topic Analysis</h3>
          </div>
        </CardHeader>
        <CardBody>
          <ResponsiveContainer width="100%" height={Math.max(300, displayedTopics.length * 40)}>
            <BarChart data={displayedTopics} layout="vertical" margin={{ top: 5, right: 80, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="tagName" type="category" width={120} />
              <Tooltip />
              <Bar dataKey="problemsSolved" fill="#0070f3">
                <LabelList dataKey="problemsSolved" position="right" style={{ fill: '#374151', fontSize: '12px', fontWeight: '500' }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {allTopics.length > 7 && (
            <div className="flex justify-center mt-4">
              <Button
                size="sm"
                variant="light"
                onPress={() => setShowAllTopics(!showAllTopics)}
                className="text-blue-600 hover:text-blue-800 underline decoration-blue-600 hover:decoration-blue-800 border-none shadow-none bg-transparent"
              >
                {showAllTopics ? 'Show Less' : `Show More (${allTopics.length - 7})`}
              </Button>
            </div>
          )}
        </CardBody>
      </Card>
    )
  }

  const renderContestStats = () => {
    if (!leetcodeData?.contestRanking) return null

    const { contestRanking } = leetcodeData

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            <h3 className="text-lg font-semibold">Contest Performance</h3>
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{contestRanking.attendedContestsCount}</div>
              <div className="text-sm text-gray-600">Contests Attended</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{contestRanking.rating.toFixed(0)}</div>
              <div className="text-sm text-gray-600">Current Rating</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{contestRanking.globalRanking.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Global Ranking</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{contestRanking.topPercentage.toFixed(1)}%</div>
              <div className="text-sm text-gray-600">Top Percentile</div>
            </div>
          </div>
        </CardBody>
      </Card>
    )
  }

  const renderRecentSubmissions = () => {
    if (!leetcodeData?.recentSubmissions?.length) return null

    // Console log the full recent submissions list before truncation
    console.log('📋 Full Recent Submissions List (before slice):', {
      totalCount: leetcodeData.recentSubmissions.length,
      submissions: leetcodeData.recentSubmissions
    })

    return (
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Recent Submissions</h3>
        </CardHeader>
        <CardBody>
          <div className="space-y-3">
            {leetcodeData.recentSubmissions.slice(0, 10).map((submission) => (
              <div key={submission.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex-1">
                  <div className="font-medium">
                    <a 
                      href={generateLeetCodeProblemUrl(submission.titleSlug)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-2 transition-colors"
                    >
                      {submission.title}
                      <LinkIcon className="w-4 h-4" />
                    </a>
                  </div>
                  <div className="text-sm text-gray-600 flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    {formatTimestamp(submission.timestamp)}
                    {submission.difficulty && (
                      <Badge 
                        color={submission.difficulty === 'Easy' ? 'success' : submission.difficulty === 'Medium' ? 'warning' : 'danger'} 
                        size="sm" 
                        variant="flat"
                      >
                        {submission.difficulty}
                      </Badge>
                    )}
                    {submission.category && (
                      <Chip size="sm" variant="flat" color="primary">
                        {submission.category}
                      </Chip>
                    )}
                  </div>
                </div>
                <Badge color="success" variant="flat" className="bg-green-100 text-green-700">
                  <div className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-green-700" />
                    <span>Accepted</span>
                  </div>
                </Badge>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    )
  }

  // Show loading state
  if (authLoading || loading) {
    return (
      <LoadingPage 
        title="Loading Dashboard"
        message="Please wait while we fetch your LeetCode progress and analytics..."
        size="lg"
      />
    )
  }

  // Show sign in if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Brain className="w-8 h-8 text-blue-600" />
                <span className="text-xl font-bold text-gray-900">LeetLoop</span>
              </div>
              <Navigation />
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Please log in to view your dashboard</h3>
              <p className="text-gray-600 mb-6">Sign in to your account to access your LeetCode dashboard and analytics.</p>
              <Button color="primary" onPress={handleSignIn} className="font-medium" startContent={<User className="w-4 h-4" />}>
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show profile setup if no LeetCode username
  if (!authProfile?.leetcode_username) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Brain className="w-8 h-8 text-blue-600" />
                <span className="text-xl font-bold text-gray-900">LeetLoop</span>
              </div>
              <div className="flex items-center space-x-4">
                <Navigation />
                <Button variant="ghost" onPress={handleSignOut} startContent={<LogOut className="w-4 h-4" />} size="sm">
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <LinkIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Add Your LeetCode Username</h3>
              <p className="text-gray-600 mb-6">Connect your LeetCode account to see your progress and analytics.</p>
              <Button color="primary" onPress={() => window.location.href = '/profile'} className="font-medium" startContent={<User className="w-4 h-4" />}>
                Go to Profile Settings
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show sync button if no LeetCode data
  if (!leetcodeData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Brain className="w-8 h-8 text-blue-600" />
                <span className="text-xl font-bold text-gray-900">LeetLoop</span>
              </div>
              <div className="flex items-center space-x-4">
                <Navigation />
                <Button variant="ghost" onPress={handleSignOut} startContent={<LogOut className="w-4 h-4" />} size="sm">
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <RefreshCw className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Sync Your LeetCode Data</h3>
              <p className="text-gray-600 mb-6">
                No data found for <strong>{authProfile.leetcode_username}</strong>. Click below to fetch your latest LeetCode progress and statistics.
              </p>
              {successMessage && (
                <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
                  {successMessage}
                </div>
              )}
              {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  {error}
                </div>
              )}
              <div className="space-y-3">
                <Button
                  color="primary"
                  variant="solid"
                  onPress={syncLeetCodeData}
                  startContent={<RefreshCw className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />}
                  isLoading={syncing}
                  isDisabled={syncing}
                  size="lg"
                  className="font-semibold"
                >
                  {syncing ? 'Syncing Data...' : 'Sync LeetCode Data'}
                </Button>
                <br />
                <Button 
                  color="default" 
                  variant="bordered"
                  onPress={() => window.location.href = '/profile'}
                  className="font-medium"
                  size="sm"
                >
                  Update Profile Settings
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Calculate stats from LeetCode data - Fixed to use correct data structure
  const calculateProblemStats = () => {
    // First try to get data from submitStatsGlobal.acSubmissionNum (most accurate for accepted problems)
    if (leetcodeData?.submitStatsGlobal?.acSubmissionNum?.length) {
      const acSubmissions = leetcodeData.submitStatsGlobal.acSubmissionNum
      const totalSolved = acSubmissions.find((item: any) => item.difficulty === 'All')?.count || 0
      const easyStats = acSubmissions.find((item: any) => item.difficulty === 'Easy') || { count: 0 }
      const mediumStats = acSubmissions.find((item: any) => item.difficulty === 'Medium') || { count: 0 }
      const hardStats = acSubmissions.find((item: any) => item.difficulty === 'Hard') || { count: 0 }
      
      console.log('📊 Using submitStatsGlobal data:', { totalSolved, easy: easyStats.count, medium: mediumStats.count, hard: hardStats.count })
      return { totalSolved, easyStats, mediumStats, hardStats }
    }
    
    // Second fallback: try submissionStats if it exists
    if (leetcodeData?.submissionStats?.acSubmissionNum?.length) {
      const acSubmissions = leetcodeData.submissionStats.acSubmissionNum
      const totalSolved = acSubmissions.find((item: any) => item.difficulty === 'All')?.count || 0
      const easyStats = acSubmissions.find((item: any) => item.difficulty === 'Easy') || { count: 0 }
      const mediumStats = acSubmissions.find((item: any) => item.difficulty === 'Medium') || { count: 0 }
      const hardStats = acSubmissions.find((item: any) => item.difficulty === 'Hard') || { count: 0 }
      
      console.log('📊 Using submissionStats data:', { totalSolved, easy: easyStats.count, medium: mediumStats.count, hard: hardStats.count })
      return { totalSolved, easyStats, mediumStats, hardStats }
    }
    
    // Third fallback to userProfile.numAcceptedQuestions if available
    if (leetcodeData?.userProfile?.numAcceptedQuestions?.length) {
      const numAccepted = leetcodeData.userProfile.numAcceptedQuestions
      const totalSolved = numAccepted.reduce((sum: number, item: any) => sum + item.count, 0) || 0
      const easyStats = numAccepted.find((item: any) => item.difficulty === 'EASY') || { count: 0 }
      const mediumStats = numAccepted.find((item: any) => item.difficulty === 'MEDIUM') || { count: 0 }
      const hardStats = numAccepted.find((item: any) => item.difficulty === 'HARD') || { count: 0 }
      
      console.log('📊 Using userProfile data:', { totalSolved, easy: easyStats.count, medium: mediumStats.count, hard: hardStats.count })
      return { totalSolved, easyStats, mediumStats, hardStats }
    }
    
    // Fourth fallback: calculate from recent submissions
    if (leetcodeData?.recentSubmissions?.length) {
      const uniqueProblems = new Set()
      let easy = 0, medium = 0, hard = 0
      
      leetcodeData.recentSubmissions.forEach(submission => {
        const key = submission.titleSlug || submission.title
        if (!uniqueProblems.has(key)) {
          uniqueProblems.add(key)
          const difficulty = submission.difficulty?.toLowerCase()
          if (difficulty === 'easy') easy++
          else if (difficulty === 'medium') medium++
          else if (difficulty === 'hard') hard++
        }
      })
      
      const totalSolved = easy + medium + hard
      console.log('📊 Calculated from recent submissions:', { totalSolved, easy, medium, hard })
      return {
        totalSolved,
        easyStats: { count: easy },
        mediumStats: { count: medium },
        hardStats: { count: hard }
      }
    }
    
    // Final fallback - zero values
    console.log('📊 No valid data found, using zero values')
    return {
      totalSolved: 0,
      easyStats: { count: 0 },
      mediumStats: { count: 0 },
      hardStats: { count: 0 }
    }
  }

  const { totalSolved, easyStats, mediumStats, hardStats } = calculateProblemStats()

  // Prepare chart data
  const difficultyData = [
    { name: 'Easy', value: easyStats.count, color: '#10B981' },
    { name: 'Medium', value: mediumStats.count, color: '#F59E0B' },
    { name: 'Hard', value: hardStats.count, color: '#EF4444' }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation currentPage="dashboard" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header with Sync Button */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Your LeetCode performance overview
              {authProfile?.leetcode_username && (
                <span className="text-sm text-gray-500 block">
                  Profile: {authProfile.leetcode_username}
                </span>
              )}
            </p>
          </div>
          {authProfile?.leetcode_username && (
            <div className="flex gap-3">
              <Button
                color="default"
                variant="bordered"
                onPress={() => loadDashboardData()}
                startContent={<RefreshCw className="w-4 h-4" />}
                isLoading={loading}
                isDisabled={loading || syncing}
              >
                Refresh
              </Button>
              <Button
                color="default"
                variant="bordered"
                onPress={syncLeetCodeData}
                startContent={<RefreshCw className="w-4 h-4" />}
                isLoading={syncing}
                isDisabled={loading || syncing}
              >
                {syncing ? 'Syncing...' : 'Sync Data'}
              </Button>
            </div>
          )}
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
              <span className="text-green-800">{successMessage}</span>
            </div>
          </div>
        )}
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardBody className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-600">Total Solved</p>
                  <p className="text-3xl font-bold text-gray-900">{totalSolved}</p>
                  <p className="text-sm text-gray-500">
                    Easy: {easyStats.count} | Medium: {mediumStats.count} | Hard: {hardStats.count}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Target className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-600">Active Days</p>
                  <p className="text-3xl font-bold text-gray-900">{leetcodeData.userCalendar?.totalActiveDays || 0}</p>
                  <p className="text-sm text-gray-500">Total Active Days</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-600">Current Streak</p>
                  <p className="text-3xl font-bold text-gray-900">{leetcodeData.streakCounter?.streakCount || leetcodeData.userCalendar?.streak || 0}</p>
                  <p className="text-sm text-gray-500">Day Streak</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Flame className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-600">Contest Rating</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {leetcodeData.contestRanking?.rating?.toFixed(0) || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {leetcodeData.contestRanking?.attendedContestsCount || 0} contests
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Trophy className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Contest Statistics */}
        {renderContestStats()}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 my-8">
          {/* Difficulty Distribution */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Problems by Difficulty</h3>
            </CardHeader>
            <CardBody>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={difficultyData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({name, value}) => `${name}: ${value}`}
                    >
                      {difficultyData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardBody>
          </Card>

          {/* Language Chart */}
          {renderLanguageChart()}
        </div>

        {/* Topic Analysis */}
        <div className="mb-8">
          {renderTopicAnalysis()}
        </div>

        {/* Recent Submissions */}
        <div className="mb-8">
          {renderRecentSubmissions()}
        </div>
      </div>
    </div>
  )
}

export default Dashboard