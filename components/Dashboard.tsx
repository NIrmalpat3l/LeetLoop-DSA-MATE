'use client'

import { useState, useEffect } from 'react'
import { Card, CardBody, CardHeader, Button, Progress, Badge, Divider, Chip, User as UserIcon } from '@nextui-org/react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer, LabelList } from 'recharts'
import { Bell, Calendar, TrendingUp, Target, Brain, AlertTriangle, CheckCircle, Clock, LinkIcon, User, LogOut, Code, Trophy, Flame, ArrowRight } from 'lucide-react'
import { fetchLeetCodeUserData, LeetCodeUserData, generateLeetCodeProblemUrl } from '@/lib/leetcode-api'
import { supabase } from '@/lib/supabase'

function Dashboard() {
  const [leetcodeData, setLeetcodeData] = useState<LeetCodeUserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [profile, setProfile] = useState<any>(null)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    // Handle OAuth session on mount
    const handleAuthSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        // If we have a session, load dashboard data
        loadDashboardData()
      }
    }

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email)
        if (event === 'SIGNED_IN' && session) {
          // User just signed in, load dashboard data
          await loadDashboardData()
        } else if (event === 'SIGNED_OUT') {
          // User signed out, redirect to home
          window.location.href = '/'
        }
      }
    )

    // Initial load
    handleAuthSession()

    // Cleanup subscription
    return () => subscription.unsubscribe()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError('')
      
      // Load user profile first
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user) // Update user state
      if (!user) {
        setError('Please log in to view your dashboard')
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
        setError('Please add your LeetCode username in your profile to see dashboard data')
        return
      }

      // Fetch LeetCode data - with detailed error logging
      try {
        console.log('🎯 Dashboard: Attempting to fetch LeetCode data for:', profileData.leetcode_username)
        const data = await fetchLeetCodeUserData(profileData.leetcode_username)
        
        // Verify the data structure
        if (!data) {
          throw new Error('No data returned from API')
        }
        
        console.log('🎉 Dashboard: Successfully received LeetCode data:', data)
        console.log('📊 Dashboard: Recent submissions count:', data?.recentSubmissions?.length || 0)
        console.log('📊 Dashboard: Data source:', data?.source || 'unknown')
        console.log('📊 Dashboard: First submission:', data?.recentSubmissions?.[0] || 'none')
        
        setLeetcodeData(data)
      } catch (leetCodeError: any) {
        console.error('❌ Dashboard: LeetCode API error:', leetCodeError)
        console.error('❌ Dashboard: Error details:', {
          message: leetCodeError?.message || 'Unknown error',
          stack: leetCodeError?.stack || 'No stack trace',
          name: leetCodeError?.name || 'Unknown error type'
        })
        setError(`Failed to load LeetCode data: ${leetCodeError?.message || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error loading dashboard:', error)
      setError('Failed to load dashboard data')
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your LeetCode data...</p>
        </div>
      </div>
    )
  }

  if (error || !leetcodeData) {
    const isAuthError = error === 'Please log in to view your dashboard'
    
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
                  <a href="/dashboard" className="text-blue-600 font-medium">Dashboard</a>
                  <a href="/analysis" className="text-gray-600 hover:text-gray-900">Analysis</a>
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
              <LinkIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {isAuthError ? 'Please log in to view your dashboard' : (error || 'Please Add Your LeetCode Username')}
              </h3>
              <p className="text-gray-600 mb-6">
                {isAuthError 
                  ? 'Sign in to your account to access your LeetCode dashboard and analytics.'
                  : (error ? 'There was an issue loading your data.' : 'Connect your LeetCode account to see your progress and analytics.')
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

  // Calculate stats from LeetCode data
  const totalSolved = leetcodeData.userProfile?.numAcceptedQuestions?.reduce((sum: number, item: any) => sum + item.count, 0) || 0
  const easyStats = leetcodeData.userProfile?.numAcceptedQuestions?.find((item: any) => item.difficulty === 'EASY') || { count: 0 }
  const mediumStats = leetcodeData.userProfile?.numAcceptedQuestions?.find((item: any) => item.difficulty === 'MEDIUM') || { count: 0 }
  const hardStats = leetcodeData.userProfile?.numAcceptedQuestions?.find((item: any) => item.difficulty === 'HARD') || { count: 0 }

  // Prepare chart data
  const difficultyData = [
    { name: 'Easy', value: easyStats.count, color: '#10B981' },
    { name: 'Medium', value: mediumStats.count, color: '#F59E0B' },
    { name: 'Hard', value: hardStats.count, color: '#EF4444' }
  ]

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
                <a href="/dashboard" className="text-blue-600 font-medium">Dashboard</a>
                <a href="/analysis" className="text-gray-600 hover:text-gray-900">Analysis</a>
                <a href="/profile" className="text-gray-600 hover:text-gray-900">Profile</a>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {profile && (
                <>
                  <span className="text-sm text-gray-600">Welcome back, {profile?.full_name || 'User'}!</span>
                  <Button 
                    variant="ghost" 
                    onPress={loadDashboardData}
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

        {/* Analysis Link Card */}
        <div className="mb-8">
          <Card>
            <CardBody className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Brain className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">AI-Powered Analysis</h3>
                    <p className="text-gray-600">Get detailed concept analysis and spaced repetition recommendations</p>
                    <p className="text-sm text-blue-600 mt-1">
                      Analyze all {leetcodeData?.recentSubmissions?.length || 0} recent submissions with consistent recall dates
                    </p>
                  </div>
                </div>
                <Button 
                  color="primary"
                  variant="solid"
                  onPress={() => window.location.href = '/analysis'}
                  className="font-medium"
                  startContent={<ArrowRight className="w-4 h-4" />}
                >
                  View Analysis
                </Button>
              </div>
            </CardBody>
          </Card>
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