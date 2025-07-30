'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Card, CardBody, CardHeader, Button, Badge, Chip, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from '@nextui-org/react'
import { Calendar, Target, Sparkles, Code, Database, Layers, Zap, Hash, GitBranch, Cpu, Network, FileText, Type, Binary, Brain, Search, ArrowLeftRight, ArrowRight, Grid, RefreshCw, Clock, Shuffle, BarChart3, TrendingUp, ExternalLink } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { startOfMonth, endOfMonth, eachDayOfInterval, format, startOfWeek, endOfWeek } from 'date-fns'
import LoadingPage, { InlineLoading } from '@/components/LoadingPage'

interface AnalysisData {
  id: number
  leetcode_username: string
  problem_title: string
  problem_slug: string
  problem_url?: string
  difficulty: string
  analysis_result: {
    concepts: string[]
    algorithm: string
    approach: string
    core_concept: string
    category?: string
    estimated_next_recall_date?: string
    full_analysis?: any
  }
  analyzed_at: string
  created_at: string
  updated_at: string
}

interface Submission {
  id: string
  title: string
  titleSlug: string
  timestamp: string
  difficulty?: string
}

interface CalendarDay {
  date: string
  problems: AnalysisData[]
  categories: string[]
  difficultyCount: { easy: number; medium: number; hard: number }
}

export default function SmartAnalysisComponent({ 
  recentSubmissions = [], 
  onRefreshRequest 
}: { 
  recentSubmissions: Submission[]
  onRefreshRequest?: () => Promise<void>
}) {
  const [analysisData, setAnalysisData] = useState<AnalysisData[]>([])
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [dbError, setDbError] = useState<string | null>(null)
  const { user, profile } = useAuth()
  const [viewMode, setViewMode] = useState<'difficulty' | 'concept'>('concept')
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null)
  const [selectedProblem, setSelectedProblem] = useState<AnalysisData | null>(null)
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState(new Date())
  const { isOpen, onOpen, onClose } = useDisclosure()

  useEffect(() => {
    if (profile?.leetcode_username) {
      // Clear previous profile's data first
      setAnalysisData([])
      setSelectedDay(null)
      setSelectedProblem(null)
      setDbError(null)
      // Initialize for new profile
      initializeSystem()
    } else {
      // Clear all data when profile is not available
      setAnalysisData([])
      setSelectedDay(null)
      setSelectedProblem(null)
      setDbError(null)
      setLoading(false)
    }
  }, [profile?.leetcode_username])

  const initializeSystem = async () => {
    try {
      if (!profile?.leetcode_username) return
      
      console.log('🔍 SmartAnalysis: Using LeetCode username:', profile.leetcode_username)
      
      // Try to load existing analyzed problems using leetcode_username
      const { data, error } = await supabase
        .from('problem_analysis')
        .select('*')
        .eq('leetcode_username', profile.leetcode_username)
        .order('analyzed_at', { ascending: false })

      if (error) {
        console.error('Error loading analyzed problems:', error)
        
        // Check if it's a table structure issue
        if (error.message.includes('leetcode_username does not exist') || 
            error.message.includes('analyzed_at') || 
            error.message.includes('does not exist')) {
          setDbError(`Database table needs setup. Error: ${error.message}`)
        } else {
          setDbError(`Database error: ${error.message}`)
        }
      } else {
        console.log(`📚 Loaded ${data?.length || 0} existing analyzed problems for ${profile.leetcode_username}`)
        // Additional debug: check if data contains correct leetcode_username
        if (data?.length) {
          const profileProblems = data.filter(item => item.leetcode_username === profile.leetcode_username)
          console.log(`🔍 Filtered to ${profileProblems.length} problems for current profile`)
        }
        setAnalysisData(data || [])
        setDbError(null)
      }
    } catch (error: any) {
      console.error('Initialization error:', error)
      setDbError(`Initialization error: ${error?.message || 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const loadAnalyzedProblems = async () => {
    if (!profile?.leetcode_username) return

    try {
      const { data, error } = await supabase
        .from('problem_analysis')
        .select('*')
        .eq('leetcode_username', profile.leetcode_username)
        .order('analyzed_at', { ascending: false })

      if (error) {
        console.error('Error loading analyzed problems:', error)
        setDbError(`Error loading data: ${error.message}`)
        return
      }

      setAnalysisData(data || [])
      setDbError(null)
    } catch (error: any) {
      console.error('Error loading analyzed problems:', error)
      setDbError(`Loading error: ${error?.message || 'Unknown error'}`)
    }
  }

  const compareAndAnalyze = async () => {
    if (!profile?.leetcode_username) return

    setAnalyzing(true)

    try {
      // First refresh the data if callback is provided
      if (onRefreshRequest) {
        console.log('🔄 Refreshing LeetCode data first...')
        await onRefreshRequest()
      }

      // Step 1: Get fresh recent submissions from parent component or API
      if (!recentSubmissions.length) {
        console.log('No recent submissions available for sync')
        setAnalyzing(false)
        return
      }

      // Step 2: Compare recent submissions with database
      const analyzedSlugs = new Set(analysisData.map(item => item.problem_slug))
      const unanalyzedSubmissions = recentSubmissions.filter(submission => {
        // Use the actual titleSlug from LeetCode, or create it from title if not available
        const slug = submission.titleSlug || submission.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
        return !analyzedSlugs.has(slug)
      })

      console.log(`🔄 Sync found ${unanalyzedSubmissions.length} new problems to analyze`)

      if (unanalyzedSubmissions.length === 0) {
        console.log('✅ All submissions already analyzed - database is up to date')
        setAnalyzing(false)
        return
      }

      // Step 3: Analyze unanalyzed submissions with LLM
      console.log('🤖 Starting analysis of new problems...')
      const response = await fetch('/api/analyze-submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissions: unanalyzedSubmissions })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Analysis API failed:', errorText)
        throw new Error(`Analysis failed: ${response.status} ${response.statusText}`)
      }
      
      const { results } = await response.json()
      console.log('✅ LLM analysis completed successfully')

      // Step 4: Add to database
      for (let i = 0; i < results.length; i++) {
        const result = results[i]
        const originalSubmission = unanalyzedSubmissions[i]
        
        const record = {
          leetcode_username: profile.leetcode_username,
          problem_title: result.problem,
          problem_slug: originalSubmission?.titleSlug || result.problem.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, ''),
          problem_url: `https://leetcode.com/problems/${originalSubmission?.titleSlug || result.problem.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')}/`,
          difficulty: result.difficulty,
          analysis_result: {
            concepts: result.concepts || ['Problem Solving'],
            algorithm: result.category || 'General Algorithm',
            approach: result.description || 'Solve using appropriate algorithm and data structure.',
            core_concept: result.concepts?.[0] || 'Problem Solving',
            category: result.category,
            estimated_next_recall_date: result.estimated_next_recall_date,
            full_analysis: result
          },
          analyzed_at: new Date().toISOString()
        }

        const { error } = await supabase.from('problem_analysis').upsert(record, {
          onConflict: 'leetcode_username,problem_slug'
        })
        
        if (error) {
          console.error('❌ Error inserting analysis:', error)
          setDbError(`Error saving analysis: ${error.message}`)
        }
      }

      // Step 5: Reload and show updated list
      await loadAnalyzedProblems()
      console.log(`✅ Successfully synced and analyzed ${results.length} new problems`)

    } catch (error) {
      console.error('❌ Sync and analysis error:', error)
    } finally {
      setAnalyzing(false)
    }
  }

  // Memoize calendar data generation
  const calendarData = useMemo(() => {
    if (!analysisData.length || !profile?.leetcode_username) return []
    
    // Additional filter to ensure we only show current profile's data
    const profileAnalysisData = analysisData.filter(item => item.leetcode_username === profile.leetcode_username)
    
    if (!profileAnalysisData.length) return []
    
    // Get the start and end of the month we want to display
    const monthStart = startOfMonth(currentCalendarMonth)
    const monthEnd = endOfMonth(currentCalendarMonth)
    
    // Get all days to display in the calendar (including empty cells)
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 })
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
    const allCalendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })
    
    // Group revision data by date string - only for current profile
    const groupedByDate = profileAnalysisData.reduce((acc, item) => {
      const date = item.analysis_result.estimated_next_recall_date || item.analyzed_at.split('T')[0]
      if (!acc[date]) acc[date] = []
      acc[date].push(item)
      return acc
    }, {} as Record<string, AnalysisData[]>)

    // Generate calendar data
    const calendar: CalendarDay[] = allCalendarDays.map(day => {
      const dateString = format(day, 'yyyy-MM-dd')
      const isCurrentMonth = day >= monthStart && day <= monthEnd
      
      if (!isCurrentMonth) {
        return {
          date: '',
          problems: [],
          categories: [],
          difficultyCount: { easy: 0, medium: 0, hard: 0 }
        }
      }
      
      const problems = groupedByDate[dateString] || []
      const categories = Array.from(new Set(problems.map(p => {
        return viewMode === 'difficulty' ? p.difficulty : (p.analysis_result.category || 'General')
      })))
      
      const difficultyCount = problems.reduce((acc, p) => {
        const diff = p.difficulty.toLowerCase()
        if (diff === 'easy') acc.easy++
        else if (diff === 'medium') acc.medium++
        else if (diff === 'hard') acc.hard++
        return acc
      }, { easy: 0, medium: 0, hard: 0 })

      return { date: dateString, problems, categories, difficultyCount }
    })

    return calendar
  }, [analysisData, currentCalendarMonth, viewMode, profile?.leetcode_username])

  const generateCalendarData = (data: AnalysisData[], monthDate = currentCalendarMonth, useViewMode = viewMode) => {
    // This function is now mainly for external calls - internal state is handled by useMemo
    setCurrentCalendarMonth(monthDate)
  }

  const handleDayClick = (day: CalendarDay) => {
    setSelectedDay(day)
  }

  const handleProblemClick = (problem: AnalysisData) => {
    setSelectedProblem(problem)
    onOpen()
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'success'
      case 'medium': return 'warning' 
      case 'hard': return 'danger'
      default: return 'default'
    }
  }

  const normalizeCategory = (category: string) => {
    // Normalize category to title case for consistent display
    return category.toLowerCase().trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const getCategoryColor = (category: string) => {
    // Normalize category name for consistent hashing
    const normalizedCategory = category.toLowerCase().trim()
    const colors = ['primary', 'secondary', 'success', 'warning', 'danger']
    const hash = normalizedCategory.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return colors[hash % colors.length] as any
  }

  const getCategoryIcon = useCallback((concept: string) => {
    // Normalize concept name for consistent matching
    const conceptLower = concept.toLowerCase().trim()
    
    // Use a more efficient lookup approach
    if (conceptLower.includes('string') || conceptLower.includes('substring') || conceptLower.includes('palindrome')) return Type
    if (conceptLower.includes('array') || conceptLower.includes('subarray') || conceptLower.includes('matrix')) return Code
    if (conceptLower.includes('tree') || conceptLower.includes('binary tree') || conceptLower.includes('bst') || conceptLower.includes('trie')) return GitBranch
    if (conceptLower.includes('graph') || conceptLower.includes('dfs') || conceptLower.includes('bfs') || conceptLower.includes('traversal')) return Layers
    if (conceptLower.includes('dynamic') || conceptLower.includes('dp') || conceptLower.includes('memoization') || conceptLower.includes('optimization')) return Zap
    if (conceptLower.includes('hash') || conceptLower.includes('map') || conceptLower.includes('dictionary') || conceptLower.includes('frequency')) return Database
    if (conceptLower.includes('sort') || conceptLower.includes('merge sort') || conceptLower.includes('quick sort')) return Shuffle
    if (conceptLower.includes('search') || conceptLower.includes('binary search') || conceptLower.includes('find')) return Search
    if (conceptLower.includes('greedy') || conceptLower.includes('interval') || conceptLower.includes('scheduling')) return Target
    if (conceptLower.includes('pointer') || conceptLower.includes('two pointer') || conceptLower.includes('fast') || conceptLower.includes('slow')) return ArrowLeftRight
    if (conceptLower.includes('sliding') || conceptLower.includes('window') || conceptLower.includes('subarray sum')) return Grid
    if (conceptLower.includes('backtrack') || conceptLower.includes('recursion') || conceptLower.includes('permutation') || conceptLower.includes('combination')) return RefreshCw
    if (conceptLower.includes('math') || conceptLower.includes('number') || conceptLower.includes('bit') || conceptLower.includes('calculation')) return Binary
    if (conceptLower.includes('linked') || conceptLower.includes('list') || conceptLower.includes('node')) return GitBranch
    if (conceptLower.includes('stack') || conceptLower.includes('lifo') || conceptLower.includes('parentheses')) return Layers
    if (conceptLower.includes('queue') || conceptLower.includes('fifo') || conceptLower.includes('level order')) return ArrowRight
    if (conceptLower.includes('heap') || conceptLower.includes('priority') || conceptLower.includes('kth')) return TrendingUp
    if (conceptLower.includes('union') || conceptLower.includes('disjoint') || conceptLower.includes('component')) return Network
    if (conceptLower.includes('simulation') || conceptLower.includes('implementation') || conceptLower.includes('game')) return Cpu
    
    return Brain // Default icon
  }, [])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatDayNumber = (dateString: string) => {
    return format(new Date(dateString), 'd')
  }

  const getCurrentMonthName = () => {
    return format(currentCalendarMonth, 'MMMM yyyy')
  }

  // Memoize unique categories for better performance
  const uniqueCategories = useMemo(() => {
    if (!profile?.leetcode_username) return []
    
    // Filter by current profile and get categories
    const profileAnalysisData = analysisData.filter(item => item.leetcode_username === profile.leetcode_username)
    
    return Array.from(new Set(
      profileAnalysisData.map(p => p.analysis_result.category).filter(Boolean)
    ))
  }, [analysisData, profile?.leetcode_username])

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentCalendarMonth)
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1)
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1)
    }
    setCurrentCalendarMonth(newMonth)
  }

  if (loading) {
    return (
      <LoadingPage 
        title="Smart Analysis System"
        message="Initializing AI-powered problem analysis and spaced repetition calendar..."
        size="md"
        fullScreen={false}
      />
    )
  }

  // Show database error if there's one
  if (dbError) {
    return (
      <div className="space-y-6">
        <Card className="shadow-lg border-red-200">
          <CardHeader className="pb-6">
            <div className="flex items-center gap-3 mb-3">
              <Sparkles className="h-8 w-8 text-red-600" />
              <h1 className="text-3xl font-bold text-red-600">
                Database Setup Required
              </h1>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-semibold text-red-800 mb-2">Database Error:</h3>
              <p className="text-red-700 mb-4">{dbError}</p>
              
              <div className="bg-white border border-red-200 rounded p-4">
                <h4 className="font-semibold text-gray-800 mb-2">🛠️ Fix Instructions:</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                  <li>Go to your Supabase Dashboard</li>
                  <li>Navigate to SQL Editor</li>
                  <li>Run the SQL script from: <code>d:\reviser\sql\fix_problem_analysis_table.sql</code></li>
                  <li>Refresh this page after running the script</li>
                </ol>
              </div>
              
              <button
                onClick={() => window.location.reload()}
                className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-200"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry Connection
              </button>
            </div>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="shadow-lg">
        <CardHeader className="pb-6">
          <div className="flex items-center justify-between w-full">
            {/* Left Side - Title and Description */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="relative">
                  <Sparkles className="h-8 w-8 text-blue-600 animate-pulse" />
                  <div className="absolute inset-0 h-8 w-8 bg-blue-600 rounded-full opacity-20 animate-ping"></div>
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent animate-pulse">
                  Smart Analysis System
                </h1>
                <div className="flex space-x-1 ml-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse animation-delay-200"></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse animation-delay-400"></div>
                </div>
              </div>
              
              <p className="text-lg text-gray-600 mb-4">
                🤖 AI-powered DSA preparation insights with advanced analytics and performance tracking
              </p>
              
              {/* Feature Indicators */}
              <div className="flex items-center flex-wrap gap-6">
                <div className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition-colors group">
                  <BarChart3 className="h-4 w-4 group-hover:animate-pulse" />
                  <span>Analytics Dashboard</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 hover:text-green-600 transition-colors group">
                  <TrendingUp className="h-4 w-4 group-hover:animate-bounce" />
                  <span>Progress Tracking</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 hover:text-purple-600 transition-colors group">
                  <Brain className="h-4 w-4 group-hover:animate-pulse" />
                  <span>🧠 AI Insights</span>
                </div>
              </div>
            </div>
            
            {/* Right Side - Action Button */}
            <div className="flex-shrink-0 ml-8">
              <div className="relative group">
                {/* Outer glow effect */}
                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-400 via-purple-500 to-blue-600 opacity-60 blur-lg group-hover:opacity-90 transition-all duration-500 glow-pulse"></div>
                
                {/* Main button */}
                <button
                  onClick={compareAndAnalyze}
                  disabled={analyzing}
                  className={`relative inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 hover:from-blue-700 hover:via-purple-700 hover:to-blue-800 disabled:from-gray-500 disabled:via-gray-600 disabled:to-gray-700 text-white font-bold rounded-lg transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-xl overflow-hidden ${
                    !analyzing ? 'animate-pulse' : ''
                  }`}
                  style={{
                    background: analyzing 
                      ? 'linear-gradient(45deg, #3b82f6, #8b5cf6, #06b6d4, #3b82f6)' 
                      : undefined,
                    backgroundSize: analyzing ? '400% 400%' : undefined,
                    animation: analyzing ? 'gradient-shift 3s ease infinite' : undefined
                  }}
                >
                  {/* Floating sparkles */}
                  {!analyzing && (
                    <>
                      <Sparkles className="absolute -top-1 -right-1 w-3 h-3 text-yellow-300 float-sparkle" />
                      <Sparkles className="absolute top-1 left-2 w-2 h-2 text-blue-200 animate-ping animation-delay-500" />
                      <Sparkles className="absolute -bottom-1 -left-1 w-2 h-2 text-purple-300 float-sparkle animation-delay-200" />
                    </>
                  )}
                  
                  {/* Animated icon with enhanced effects */}
                  <div className="relative mr-3">
                    {analyzing ? (
                      <Brain className="w-5 h-5 animate-bounce text-white" />
                    ) : (
                      <>
                        <Brain className="w-5 h-5 text-white animate-pulse" />
                        <div className="absolute inset-0 w-5 h-5 bg-white rounded-full opacity-30 animate-ping"></div>
                        <div className="absolute inset-0 w-5 h-5 bg-yellow-300 rounded-full opacity-20 animate-ping animation-delay-200"></div>
                      </>
                    )}
                  </div>
                  
                  {/* Enhanced text with gradient effect */}
                  <span className={`relative z-10 ${analyzing ? 'animate-pulse' : ''}`}>
                    {analyzing ? (
                      <span className="bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
                        🤖 AI Analyzing...
                      </span>
                    ) : (
                      'Analyze New Problems'
                    )}
                  </span>
                  
                  {/* Loading dots with enhanced animation */}
                  {analyzing && (
                    <div className="ml-2 flex space-x-1">
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-yellow-300 rounded-full animate-bounce animation-delay-200"></div>
                      <div className="w-2 h-2 bg-blue-300 rounded-full animate-bounce animation-delay-400"></div>
                    </div>
                  )}
                  
                  {/* Enhanced shimmer effect */}
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-transparent via-white to-transparent opacity-0 hover:opacity-30 transform -skew-x-12 transition-all duration-1000 hover:animate-pulse shimmer"></div>
                  
                  {/* Neural network pattern overlay */}
                  {!analyzing && (
                    <div className="absolute inset-0 opacity-10">
                      <div className="absolute top-2 left-4 w-1 h-1 bg-white rounded-full animate-ping animation-delay-500"></div>
                      <div className="absolute bottom-3 right-6 w-1 h-1 bg-white rounded-full animate-ping"></div>
                      <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-white rounded-full animate-ping animation-delay-200"></div>
                    </div>
                  )}
                </button>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Calendar View */}
      {calendarData.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                <h3 className="text-lg font-semibold">Revision Calendar - {getCurrentMonthName()}</h3>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onPress={() => navigateMonth('prev')}
                >
                  ←
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onPress={() => navigateMonth('next')}
                >
                  →
                </Button>
                {analysisData.length > 0 && (
                  <Button 
                    size="sm" 
                    variant="bordered"
                    color="primary"
                    onPress={() => {
                      setViewMode(viewMode === 'difficulty' ? 'concept' : 'difficulty')
                    }}
                    className="ml-2"
                    startContent={<ArrowLeftRight className="h-3 w-3" />}
                    title={`Switch to ${viewMode === 'difficulty' ? 'category view' : 'difficulty view'}`}
                  >
                    {viewMode === 'concept' ? 'View by Difficulty' : 'View by Category'}
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-7 gap-2">
              {/* Week day headers */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-center text-sm font-semibold text-default-500 p-2">
                  {day}
                </div>
              ))}
              
              {/* Calendar days */}
              {calendarData.map((day, index) => (
                <Card 
                  key={day.date || `empty-${index}`}
                  isPressable={day.problems.length > 0}
                  onPress={() => day.problems.length > 0 && handleDayClick(day)}
                  className={`transition-transform min-h-[80px] ${
                    day.date === '' ? 'invisible pointer-events-none' : // Completely hide empty cells
                    day.problems.length === 0 ? 'opacity-40 cursor-default hover:scale-100' : 'cursor-pointer hover:scale-105'
                  }`}
                >
                  <CardBody className="p-2">
                    {day.date && (
                      <>
                        <div className="text-center">
                          <p className="font-semibold text-lg">{formatDayNumber(day.date)}</p>
                          {day.problems.length > 0 && (
                            <Badge color="primary" variant="flat" size="sm">
                              {day.problems.length}
                            </Badge>
                          )}
                        </div>
                        
                        {/* Only show dots if there are problems */}
                        {day.problems.length > 0 && (
                          <div className="flex justify-center gap-1 mt-1">
                            {viewMode === 'difficulty' ? (
                              <>
                                {day.difficultyCount.easy > 0 && (
                                  <div className="w-2 h-2 bg-green-500 rounded-full" title={`${day.difficultyCount.easy} Easy`} />
                                )}
                                {day.difficultyCount.medium > 0 && (
                                  <div className="w-2 h-2 bg-yellow-500 rounded-full" title={`${day.difficultyCount.medium} Medium`} />
                                )}
                                {day.difficultyCount.hard > 0 && (
                                  <div className="w-2 h-2 bg-red-500 rounded-full" title={`${day.difficultyCount.hard} Hard`} />
                                )}
                              </>
                            ) : (
                              day.categories.map((category, idx) => {
                                const IconComponent = getCategoryIcon(category)
                                
                                return (
                                  <div 
                                    key={idx}
                                    className="p-1 bg-primary/10 rounded-full border border-primary/20"
                                    title={category}
                                  >
                                    <IconComponent className="h-3 w-3 text-primary" />
                                  </div>
                                )
                              })
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </CardBody>
                </Card>
              ))}
            </div>
            
            {/* Color Legend */}
            <div className="mt-6 pt-4 border-t">
              <h4 className="text-sm font-semibold mb-3 text-center">
                {viewMode === 'difficulty' ? 'Difficulty' : 'Categories'}
              </h4>
              <div className="flex justify-center gap-6">
                {viewMode === 'difficulty' ? (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full" />
                      <span className="text-sm">Easy</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                      <span className="text-sm">Medium</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full" />
                      <span className="text-sm">Hard</span>
                    </div>
                  </>
                ) : (
                  // Show actual problem categories, not difficulty levels
                  uniqueCategories.map((category) => {
                    const IconComponent = getCategoryIcon(category || 'General')
                    return (
                      <div key={category} className="flex items-center gap-2">
                        <IconComponent className="h-3 w-3 text-primary" />
                        <span className="text-sm">{category}</span>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Selected Day Problems */}
      {selectedDay && (
        <Card className="relative">
          <CardHeader>
            <h3 className="text-lg font-semibold">
              Problems for {formatDate(selectedDay.date)}
            </h3>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedDay.problems.map((problem) => (
                <Card 
                  key={problem.id}
                  isPressable
                  onPress={() => handleProblemClick(problem)}
                  className="hover:scale-105 transition-transform cursor-pointer"
                >
                  <CardBody className="p-4">
                    <p className="font-medium truncate">{problem.problem_title}</p>
                    <div className="flex gap-2 mt-2">
                      <Chip size="sm" color={getDifficultyColor(problem.difficulty)}>
                        {problem.difficulty}
                      </Chip>
                      <Chip size="sm" variant="flat">
                        {problem.analysis_result.category}
                      </Chip>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Problem Detail Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="2xl">
        <ModalContent>
          <ModalHeader>
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              {selectedProblem?.problem_title}
            </div>
          </ModalHeader>
          <ModalBody>
            {selectedProblem && (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Chip color={getDifficultyColor(selectedProblem.difficulty)}>
                    {selectedProblem.difficulty}
                  </Chip>
                  <Chip variant="flat">
                    {selectedProblem.analysis_result.category}
                  </Chip>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Core Concept</h4>
                  <p className="text-default-700">{selectedProblem.analysis_result.core_concept}</p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Algorithm</h4>
                  <p className="text-default-700">{selectedProblem.analysis_result.algorithm}</p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Approach</h4>
                  <p className="text-default-700">{selectedProblem.analysis_result.approach}</p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Concepts</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedProblem.analysis_result.concepts.map((concept: string, idx: number) => (
                      <Chip key={idx} size="sm" variant="flat" color="secondary">
                        {concept}
                      </Chip>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Revision Date</h4>
                  <p className="text-default-700">{formatDate(selectedProblem.analysis_result.estimated_next_recall_date || selectedProblem.analyzed_at)}</p>
                </div>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose}>
              Close
            </Button>
            {selectedProblem && (
              <Button 
                color="primary"
                onPress={() => window.open(`https://leetcode.com/problems/${selectedProblem.problem_slug}/`, '_blank')}
                startContent={<ExternalLink className="h-4 w-4" />}
              >
                Open in LeetCode
              </Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  )
}
