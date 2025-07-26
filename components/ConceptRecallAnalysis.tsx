'use client'

import { useState, useEffect } from 'react'
import { Card, CardBody, CardHeader, Button, Badge, Chip, Divider } from '@nextui-org/react'
import { Brain, Calendar, Clock, Lightbulb, ArrowRight, Sparkles, LinkIcon, ChevronDown, ChevronUp } from 'lucide-react'
import { analyzeConceptsAndRecall } from '@/lib/groq-api'
import { generateLeetCodeProblemUrl } from '@/lib/leetcode-api'
import { supabase } from '@/lib/supabase'
import { checkDatabaseSetup } from '@/lib/database-setup'

interface ConceptAnalysis {
  problemName: string
  problem: string
  difficulty: string
  category: string
  concepts: string[]
  revisionDate: string
  estimated_next_recall_date: string
  confidence: number
  reasoning: string
  description: string
}

interface ConceptRecallProps {
  recentSubmissions: any[]
}

export default function ConceptRecallAnalysis({ recentSubmissions }: ConceptRecallProps) {
  const [analysis, setAnalysis] = useState<ConceptAnalysis[]>([])
  const [loading, setLoading] = useState(false)
  const [showAnalysis, setShowAnalysis] = useState(false)
  const [isExpanded, setIsExpanded] = useState(true)
  const [error, setError] = useState<string>('')
  const [problemSlugs, setProblemSlugs] = useState<{ [problemName: string]: string }>({})
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    loadUser()
  }, [])

  useEffect(() => {
    if (user) {
      loadStoredAnalysis()
    }
  }, [user])

  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  const loadStoredAnalysis = async () => {
    if (!user) return
    
    try {
      // Check if database is properly set up
      const dbCheck = await checkDatabaseSetup()
      if (!dbCheck.exists) {
        console.error('Database setup error:', dbCheck.message)
        setError(`Database not ready: ${dbCheck.message}`)
        return
      }

      const { data, error } = await supabase
        .from('problem_analysis')
        .select('*')
        .eq('user_id', user.id)
        .order('analyzed_at', { ascending: false })

      if (error) throw error

      if (data && data.length > 0) {
        const storedAnalysis = data.map(item => ({
          problemName: item.problem_title,
          problem: item.problem_title,
          difficulty: item.difficulty,
          category: item.category || '',
          concepts: item.concepts_analysis?.concepts || [],
          revisionDate: item.revision_date,
          estimated_next_recall_date: item.revision_date,
          confidence: item.confidence_level,
          reasoning: item.concepts_analysis?.reasoning || '',
          description: item.concepts_analysis?.description || ''
        }))
        setAnalysis(storedAnalysis)
        setShowAnalysis(true)
      }
    } catch (error) {
      console.error('Error loading stored analysis:', error)
      setError('Failed to load stored analysis. Please check database setup.')
    }
  }

  const handleAnalyze = async () => {
    if (!recentSubmissions?.length || !user) return

    setLoading(true)
    setError('')
    try {
      // Check if database is properly set up
      const dbCheck = await checkDatabaseSetup()
      if (!dbCheck.exists) {
        setError(`Database not ready: ${dbCheck.message}`)
        setLoading(false)
        return
      }

      // Create mapping of problem names to slugs
      const slugMapping: { [problemName: string]: string } = {}
      
      // Create slug mapping for URL generation
      recentSubmissions.forEach(sub => {
        const problemName = sub.title || sub.problem_name
        slugMapping[problemName] = sub.titleSlug
      })

      setProblemSlugs(slugMapping)
      
      console.log('🎯 ConceptRecallAnalysis: Starting direct analysis for', recentSubmissions.length, 'submissions')
      
      // Analyze problems directly with Groq
      const analysisResults = await analyzeConceptsAndRecall(recentSubmissions)
      
      console.log('✅ ConceptRecallAnalysis: Received', analysisResults.length, 'analysis results')
      
      if (analysisResults && analysisResults.length > 0) {
        // Store analysis results in Supabase
        for (const result of analysisResults) {
          try {
            const { error: insertError } = await supabase
              .from('problem_analysis')
              .upsert({
                user_id: user.id,
                problem_title: result.problem,
                problem_slug: result.problem.toLowerCase().replace(/\s+/g, '-'),
                difficulty: result.difficulty,
                category: result.category,
                concepts_analysis: {
                  concepts: result.concepts,
                  reasoning: result.reasoning,
                  description: result.description
                },
                revision_date: result.estimated_next_recall_date,
                confidence_level: 3, // Default confidence since it's not in the Groq response
                submission_timestamp: Date.now().toString()
              }, {
                onConflict: 'user_id,problem_slug'
              })

            if (insertError) {
              console.error('Error storing analysis:', insertError)
            }
          } catch (storeError) {
            console.error('Error storing individual analysis:', storeError)
          }
        }

        // Convert to component's expected format
        const formattedResults = analysisResults.map(result => ({
          problemName: result.problem,
          problem: result.problem,
          difficulty: result.difficulty,
          category: result.category,
          concepts: result.concepts,
          revisionDate: result.estimated_next_recall_date,
          estimated_next_recall_date: result.estimated_next_recall_date,
          confidence: 3, // Default confidence
          reasoning: result.reasoning,
          description: result.description
        }))

        setAnalysis(formattedResults)
        setShowAnalysis(true)
      }
      
    } catch (error: any) {
      console.error('❌ ConceptRecallAnalysis: Analysis failed:', error)
      setError(error.message || 'Failed to analyze submissions. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getDaysUntilRecall = (recallDate: string) => {
    const today = new Date()
    const recall = new Date(recallDate)
    const diffTime = recall.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getUrgencyColor = (days: number) => {
    if (days <= 0) return 'danger'
    if (days <= 3) return 'warning'
    if (days <= 7) return 'primary'
    return 'success'
  }

  const getUrgencyText = (days: number) => {
    if (days <= 0) return 'Review Now!'
    if (days <= 3) return 'Soon'
    if (days <= 7) return 'This Week'
    return 'Scheduled'
  }

  if (!recentSubmissions?.length) {
    return (
      <Card>
        <CardBody className="text-center py-8">
          <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No Recent Submissions</h3>
          <p className="text-gray-500">Submit some problems to see concept analysis!</p>
        </CardBody>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Analysis Trigger */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg">
                <Sparkles className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold">AI Concept Analysis</h3>
                <p className="text-gray-600">Get personalized recall recommendations for ALL submissions</p>
              </div>
            </div>
            <Button
              color="primary"
              onPress={handleAnalyze}
              isLoading={loading}
              startContent={!loading ? <Brain className="w-4 h-4" /> : null}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold"
            >
              {loading ? `Analyzing ${recentSubmissions?.length || 0} problems...` : `Analyze All ${recentSubmissions?.length || 0} Problems`}
            </Button>
          </div>
        </CardHeader>
        {error && (
          <CardBody>
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">⚠️ {error}</p>
            </div>
          </CardBody>
        )}
        {!showAnalysis && !error && (
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-blue-50 rounded-lg">
                <Lightbulb className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <h4 className="font-semibold text-blue-900">Concept Identification</h4>
                <p className="text-sm text-blue-700">AI identifies key DSA concepts used</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <Calendar className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <h4 className="font-semibold text-green-900">Spaced Repetition</h4>
                <p className="text-sm text-green-700">Optimal review timing based on difficulty</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <Clock className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <h4 className="font-semibold text-purple-900">Personalized Schedule</h4>
                <p className="text-sm text-purple-700">Tailored to your learning patterns</p>
              </div>
            </div>
          </CardBody>
        )}
      </Card>

      {/* Analysis Results */}
      {showAnalysis && analysis.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-semibold">Concept Analysis & Recall Schedule</h3>
                <Badge color="primary" variant="flat">{analysis.length} Problems Analyzed</Badge>
              </div>
              <Button
                variant="light"
                isIconOnly
                onPress={() => setIsExpanded(!isExpanded)}
                className="text-gray-600 hover:text-gray-800"
              >
                {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </Button>
            </div>
          </CardHeader>
          {isExpanded && (
            <CardBody className="space-y-4">
            {analysis.map((item, index) => {
              const daysUntilRecall = getDaysUntilRecall(item.estimated_next_recall_date)
              const urgencyColor = getUrgencyColor(daysUntilRecall)
              const urgencyText = getUrgencyText(daysUntilRecall)

              return (
                <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  {/* Problem Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg text-gray-900">
                        {problemSlugs[item.problem] ? (
                          <a 
                            href={generateLeetCodeProblemUrl(problemSlugs[item.problem])}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-2 transition-colors"
                          >
                            {item.problem}
                            <LinkIcon className="w-4 h-4" />
                          </a>
                        ) : (
                          item.problem
                        )}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge 
                          color={item.difficulty === 'Easy' ? 'success' : item.difficulty === 'Medium' ? 'warning' : 'danger'} 
                          variant="flat" 
                          size="sm"
                        >
                          {item.difficulty}
                        </Badge>
                        <span className="text-gray-500 text-sm">{item.category}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge color={urgencyColor} variant="flat" className="mb-1">
                        {urgencyText}
                      </Badge>
                      <div className="text-sm text-gray-600">
                        {daysUntilRecall > 0 ? `${daysUntilRecall} days` : 'Overdue'}
                      </div>
                    </div>
                  </div>

                  {/* Concepts */}
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-700 mb-2">Key Concepts:</p>
                    <div className="flex flex-wrap gap-2">
                      {item.concepts.map((concept, idx) => (
                        <Chip key={idx} size="sm" variant="flat" color="primary">
                          {concept}
                        </Chip>
                      ))}
                    </div>
                  </div>

                  {/* Description */}
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-700 mb-1">Solution Approach:</p>
                    <p className="text-sm text-gray-600 leading-relaxed">{item.description}</p>
                  </div>

                  {/* Reasoning */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs font-medium text-gray-700 mb-1">Recall Reasoning:</p>
                    <p className="text-xs text-gray-600">{item.reasoning}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Calendar className="w-3 h-3 text-gray-500" />
                      <span className="text-xs text-gray-600">
                        Next Review: {new Date(item.estimated_next_recall_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Summary Stats */}
            <Divider />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center pt-4">
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {analysis.filter(item => getDaysUntilRecall(item.estimated_next_recall_date) <= 0).length}
                </div>
                <div className="text-sm text-gray-600">Need Review Now</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {analysis.filter(item => {
                    const days = getDaysUntilRecall(item.estimated_next_recall_date)
                    return days > 0 && days <= 3
                  }).length}
                </div>
                <div className="text-sm text-gray-600">Due Soon</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {analysis.filter(item => {
                    const days = getDaysUntilRecall(item.estimated_next_recall_date)
                    return days > 3 && days <= 7
                  }).length}
                </div>
                <div className="text-sm text-gray-600">This Week</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {analysis.filter(item => getDaysUntilRecall(item.estimated_next_recall_date) > 7).length}
                </div>
                <div className="text-sm text-gray-600">Future</div>
              </div>
            </div>
          </CardBody>
          )}
        </Card>
      )}
    </div>
  )
}
