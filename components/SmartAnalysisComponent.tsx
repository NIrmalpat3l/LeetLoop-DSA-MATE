'use client'

import { useState, useEffect } from 'react'
import { Card, CardBody, CardHeader, Button, Badge, Chip, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from '@nextui-org/react'
import { Calendar, Target, Sparkles, Code, Database, Layers, Zap, Hash, GitBranch, Cpu, Network, FileText, Type, Binary, Brain, Search, ArrowLeftRight, ArrowRight, Grid, RefreshCw, Clock, Shuffle, BarChart3, TrendingUp, ExternalLink } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { startOfMonth, endOfMonth, eachDayOfInterval, format, getDay, startOfWeek, endOfWeek } from 'date-fns'

interface AnalysisData {
  id: number
  problem_title: string
  problem_slug: string
  difficulty: string
  category: string
  concepts_analysis: {
    concepts: string[]
    algorithm: string
    approach: string
    core_concept: string
  }
  revision_date: string
  analyzed_at: string
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

export default function SmartAnalysisComponent({ recentSubmissions = [] }: { recentSubmissions: Submission[] }) {
  const [analysisData, setAnalysisData] = useState<AnalysisData[]>([])
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [viewMode, setViewMode] = useState<'difficulty' | 'concept'>('difficulty')
  const [calendarData, setCalendarData] = useState<CalendarDay[]>([])
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null)
  const [selectedProblem, setSelectedProblem] = useState<AnalysisData | null>(null)
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState(new Date())
  const { isOpen, onOpen, onClose } = useDisclosure()

  useEffect(() => {
    initializeSystem()
  }, [])

  // Regenerate calendar when viewMode changes
  useEffect(() => {
    if (analysisData.length > 0) {
      generateCalendarData(analysisData, currentCalendarMonth)
    }
  }, [viewMode])

  const initializeSystem = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      setUser(user)
      
      // Load existing analyzed problems immediately after setting user
      const { data, error } = await supabase
        .from('problem_analysis')
        .select('*')
        .eq('user_id', user.id)
        .order('analyzed_at', { ascending: false })

      if (error) {
        console.error('Error loading analyzed problems:', error)
      } else {
        console.log(`📚 Loaded ${data?.length || 0} existing analyzed problems`)
        setAnalysisData(data || [])
        generateCalendarData(data || [])
      }
    } catch (error) {
      console.error('Initialization error:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAnalyzedProblems = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('problem_analysis')
        .select('*')
        .eq('user_id', user.id)
        .order('analyzed_at', { ascending: false })

      if (error) throw error

      setAnalysisData(data || [])
      generateCalendarData(data || [])
    } catch (error) {
      console.error('Error loading analyzed problems:', error)
    }
  }

  const compareAndAnalyze = async () => {
    if (!user) return

    setAnalyzing(true)

    try {
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
      const response = await fetch('/api/analyze-submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissions: unanalyzedSubmissions })
      })

      if (!response.ok) throw new Error('Analysis failed')
      const { results } = await response.json()

      // Step 4: Add to database
      for (let i = 0; i < results.length; i++) {
        const result = results[i]
        const originalSubmission = unanalyzedSubmissions[i]
        
        const record = {
          user_id: user.id,
          problem_title: result.problem, // Fixed: use result.problem instead of result.problem_name
          problem_slug: originalSubmission?.titleSlug || result.problem.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, ''),
          difficulty: result.difficulty,
          category: result.category,
          concepts_analysis: {
            concepts: result.concepts || ['Problem Solving'],
            algorithm: result.category || 'General Algorithm',
            approach: result.description || 'Solve using appropriate algorithm and data structure.',
            core_concept: result.concepts?.[0] || 'Problem Solving'
          },
          revision_date: result.estimated_next_recall_date
        }

        await supabase.from('problem_analysis').upsert(record, {
          onConflict: 'user_id,problem_slug'
        })
      }

      // Step 5: Reload and show updated list
      await loadAnalyzedProblems()
      // Also regenerate calendar with current month
      generateCalendarData(analysisData, currentCalendarMonth)
      console.log(`✅ Successfully synced and analyzed ${results.length} new problems`)

    } catch (error) {
      console.error('❌ Sync and analysis error:', error)
    } finally {
      setAnalyzing(false)
    }
  }

  const generateCalendarData = (data: AnalysisData[], monthDate = currentCalendarMonth) => {
    // Get the start and end of the month we want to display
    const monthStart = startOfMonth(monthDate)
    const monthEnd = endOfMonth(monthDate)
    
    // Get all days in the month
    const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })
    
    // Get the start and end of the calendar week view (to fill complete weeks)
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 }) // Sunday = 0
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
    
    // Get all days to display in the calendar (including empty cells)
    const allCalendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })
    
    // Group revision data by date string
    const groupedByDate = data.reduce((acc, item) => {
      const date = item.revision_date
      if (!acc[date]) {
        acc[date] = []
      }
      acc[date].push(item)
      return acc
    }, {} as Record<string, AnalysisData[]>)

    // Generate calendar data
    const calendar: CalendarDay[] = allCalendarDays.map(day => {
      const dateString = format(day, 'yyyy-MM-dd')
      const isCurrentMonth = day >= monthStart && day <= monthEnd
      
      // Only show data for current month days
      if (!isCurrentMonth) {
        return {
          date: '', // Empty for days outside current month
          problems: [],
          categories: [],
          difficultyCount: { easy: 0, medium: 0, hard: 0 }
        }
      }
      
      const problems = groupedByDate[dateString] || []
      
      // Categories logic - get current viewMode at render time
      let categories: string[] = []
      if (problems.length > 0) {
        if (viewMode === 'difficulty') {
          categories = Array.from(new Set(problems.map(p => p.difficulty)))
        } else {
          // concept mode - use categories
          categories = Array.from(new Set(problems.map(p => p.category || 'General')))
        }
      }
      
      const difficultyCount = problems.reduce((acc, p) => {
        const diff = p.difficulty.toLowerCase()
        if (diff === 'easy') acc.easy++
        else if (diff === 'medium') acc.medium++
        else if (diff === 'hard') acc.hard++
        return acc
      }, { easy: 0, medium: 0, hard: 0 })

      return { date: dateString, problems, categories, difficultyCount }
    })

    setCalendarData(calendar)
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

  const getCategoryIcon = (concept: string) => {
    // Normalize concept name for consistent matching
    const conceptLower = concept.toLowerCase().trim()
    
    // String manipulation
    if (conceptLower.includes('string') || conceptLower.includes('substring') || conceptLower.includes('palindrome')) {
      return Type
    }
    
    // Array operations
    if (conceptLower.includes('array') || conceptLower.includes('subarray') || conceptLower.includes('matrix')) {
      return Code
    }
    
    // Tree structures
    if (conceptLower.includes('tree') || conceptLower.includes('binary tree') || conceptLower.includes('bst') || conceptLower.includes('trie')) {
      return GitBranch
    }
    
    // Graph algorithms
    if (conceptLower.includes('graph') || conceptLower.includes('dfs') || conceptLower.includes('bfs') || conceptLower.includes('traversal')) {
      return Layers
    }
    
    // Dynamic Programming
    if (conceptLower.includes('dynamic') || conceptLower.includes('dp') || conceptLower.includes('memoization') || conceptLower.includes('optimization')) {
      return Zap
    }
    
    // Hash tables and maps
    if (conceptLower.includes('hash') || conceptLower.includes('map') || conceptLower.includes('dictionary') || conceptLower.includes('frequency')) {
      return Database
    }
    
    // Sorting algorithms
    if (conceptLower.includes('sort') || conceptLower.includes('merge sort') || conceptLower.includes('quick sort')) {
      return Shuffle
    }
    
    // Search algorithms
    if (conceptLower.includes('search') || conceptLower.includes('binary search') || conceptLower.includes('find')) {
      return Search
    }
    
    // Greedy algorithms
    if (conceptLower.includes('greedy') || conceptLower.includes('interval') || conceptLower.includes('scheduling')) {
      return Target
    }
    
    // Two Pointers technique
    if (conceptLower.includes('pointer') || conceptLower.includes('two pointer') || conceptLower.includes('fast') || conceptLower.includes('slow')) {
      return ArrowLeftRight
    }
    
    // Sliding Window
    if (conceptLower.includes('sliding') || conceptLower.includes('window') || conceptLower.includes('subarray sum')) {
      return Grid
    }
    
    // Backtracking
    if (conceptLower.includes('backtrack') || conceptLower.includes('recursion') || conceptLower.includes('permutation') || conceptLower.includes('combination')) {
      return RefreshCw
    }
    
    // Mathematical problems
    if (conceptLower.includes('math') || conceptLower.includes('number') || conceptLower.includes('bit') || conceptLower.includes('calculation')) {
      return Binary
    }
    
    // Linked List
    if (conceptLower.includes('linked') || conceptLower.includes('list') || conceptLower.includes('node')) {
      return GitBranch
    }
    
    // Stack operations
    if (conceptLower.includes('stack') || conceptLower.includes('lifo') || conceptLower.includes('parentheses')) {
      return Layers
    }
    
    // Queue operations
    if (conceptLower.includes('queue') || conceptLower.includes('fifo') || conceptLower.includes('level order')) {
      return ArrowRight
    }
    
    // Heap/Priority Queue
    if (conceptLower.includes('heap') || conceptLower.includes('priority') || conceptLower.includes('kth')) {
      return TrendingUp
    }
    
    // Union Find / Disjoint Set
    if (conceptLower.includes('union') || conceptLower.includes('disjoint') || conceptLower.includes('component')) {
      return Network
    }
    
    // Simulation or Implementation
    if (conceptLower.includes('simulation') || conceptLower.includes('implementation') || conceptLower.includes('game')) {
      return Cpu
    }
    
    // Default icon for unmatched concepts
    return Brain
  }

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

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentCalendarMonth)
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1)
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1)
    }
    setCurrentCalendarMonth(newMonth)
    generateCalendarData(analysisData, newMonth)
  }

  if (loading) {
    return (
      <Card>
        <CardBody className="text-center p-8">
          <Brain className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <p>Loading Smart Analysis System...</p>
        </CardBody>
      </Card>
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
                <Sparkles className="h-8 w-8 text-blue-600" />
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Smart Analysis System
                </h1>
              </div>
              
              <p className="text-lg text-gray-600 mb-4">
                AI-powered DSA preparation insights with advanced analytics and performance tracking
              </p>
              
              {/* Feature Indicators */}
              <div className="flex items-center flex-wrap gap-6">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <BarChart3 className="h-4 w-4" />
                  <span>Analytics Dashboard</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <TrendingUp className="h-4 w-4" />
                  <span>Progress Tracking</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Brain className="h-4 w-4" />
                  <span>AI Insights</span>
                </div>
              </div>
            </div>
            
            {/* Right Side - Action Button */}
            <div className="flex-shrink-0 ml-8">
              <Button 
                color="primary" 
                size="lg"
                onPress={compareAndAnalyze}
                isLoading={analyzing}
                startContent={<RefreshCw className="h-4 w-4" />}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg px-8 py-3"
              >
                {analyzing ? 'Analyzing...' : 'Sync & Analyze'}
              </Button>
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
                      const newMode = viewMode === 'difficulty' ? 'concept' : 'difficulty'
                      setViewMode(newMode)
                    }}
                    className="ml-2"
                    startContent={<ArrowLeftRight className="h-3 w-3" />}
                  >
                    {viewMode === 'difficulty' ? 'Switch to Concepts' : 'Switch to Difficulty'}
                  
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
                              day.categories.slice(0, 3).map((category, idx) => {
                                const IconComponent = getCategoryIcon(category)
                                
                                return (
                                  <div key={idx} title={category}>
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
                  Array.from(new Set(
                    analysisData.map(p => p.category).filter(Boolean)
                  )).slice(0, 8).map((category) => {
                    const IconComponent = getCategoryIcon(category)
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
                        {problem.category}
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
                    {selectedProblem.category}
                  </Chip>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Core Concept</h4>
                  <p className="text-default-700">{selectedProblem.concepts_analysis.core_concept}</p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Algorithm</h4>
                  <p className="text-default-700">{selectedProblem.concepts_analysis.algorithm}</p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Approach</h4>
                  <p className="text-default-700">{selectedProblem.concepts_analysis.approach}</p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Concepts</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedProblem.concepts_analysis.concepts.map((concept, idx) => (
                      <Chip key={idx} size="sm" variant="flat" color="secondary">
                        {concept}
                      </Chip>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Revision Date</h4>
                  <p className="text-default-700">{formatDate(selectedProblem.revision_date)}</p>
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
