'use client'

import { useState, useEffect } from 'react'
import { Card, CardBody, CardHeader, Button, Badge, Chip, Divider, Progress } from '@nextui-org/react'
import { Brain, BookOpen, Target, TrendingUp, Code2, LinkIcon, ChevronDown, ChevronUp } from 'lucide-react'
import { analyzeConceptsAndRecall } from '@/lib/groq-api'
import { generateLeetCodeProblemUrl } from '@/lib/leetcode-api'
import { supabase } from '@/lib/supabase'

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

interface ProblemCategoryAnalysisProps {
  recentSubmissions: any[]
}

interface CategoryGroup {
  category: string
  problems: ConceptAnalysis[]
  totalProblems: number
  difficulty: {
    Easy: number
    Medium: number
    Hard: number
  }
}

export default function ProblemCategoryAnalysis({ recentSubmissions }: ProblemCategoryAnalysisProps) {
  const [categoryGroups, setCategoryGroups] = useState<CategoryGroup[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
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
      const { data, error } = await supabase
        .from('problem_analysis')
        .select('*')
        .eq('user_id', user.id)
        .order('analyzed_at', { ascending: false })

      if (error) throw error

      if (data && data.length > 0) {
        const analysisResults = data.map((item: any) => ({
          problemName: item.problem_title,
          problem: item.problem_title,
          difficulty: item.difficulty,
          category: item.category || 'Other',
          concepts: item.concepts_analysis?.concepts || [],
          revisionDate: item.revision_date,
          estimated_next_recall_date: item.revision_date,
          confidence: item.confidence_level,
          reasoning: item.concepts_analysis?.reasoning || '',
          description: item.concepts_analysis?.description || ''
        }))

        groupAnalysisData(analysisResults)
      }
    } catch (error) {
      console.error('Error loading stored analysis:', error)
    }
  }

  const groupAnalysisData = (analysisResults: ConceptAnalysis[]) => {
    // Group problems by category
    const categoryMap: { [category: string]: ConceptAnalysis[] } = {}
    
    analysisResults.forEach(result => {
      const category = result.category || 'Other'
      if (!categoryMap[category]) {
        categoryMap[category] = []
      }
      categoryMap[category].push(result)
    })

    // Convert to CategoryGroup format
    const groups: CategoryGroup[] = Object.entries(categoryMap).map(([category, problems]) => {
      const difficultyCount = { Easy: 0, Medium: 0, Hard: 0 }
      problems.forEach(p => {
        if (p.difficulty in difficultyCount) {
          difficultyCount[p.difficulty as keyof typeof difficultyCount]++
        }
      })

      return {
        category,
        problems,
        totalProblems: problems.length,
        difficulty: difficultyCount
      }
    })

    setCategoryGroups(groups)
    
    // Auto-expand top 3 categories
    const topCategories = new Set(
      groups
        .sort((a, b) => b.totalProblems - a.totalProblems)
        .slice(0, 3)
        .map(g => g.category)
    )
    setExpandedCategories(topCategories)
  }

  const handleAnalyzeAll = async () => {
    if (!recentSubmissions?.length || !user) return

    setLoading(true)
    setError('')
    
    try {
      // Create mapping of problem names to slugs
      const slugMapping: { [problemName: string]: string } = {}
      
      // Create slug mapping for URL generation
      recentSubmissions.forEach(sub => {
        const problemName = sub.title || sub.problem_name
        slugMapping[problemName] = sub.titleSlug
      })

      setProblemSlugs(slugMapping)
      
      console.log('🎯 ProblemCategoryAnalysis: Starting direct analysis for', recentSubmissions.length, 'submissions')
      
      // Analyze problems directly with Groq
      const allAnalysis = await analyzeConceptsAndRecall(recentSubmissions)
      
      console.log('✅ ProblemCategoryAnalysis: Received', allAnalysis.length, 'analysis results')

      if (allAnalysis && allAnalysis.length > 0) {
        // Store analysis results in Supabase
        for (const result of allAnalysis) {
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
                confidence_level: 3, // Default confidence
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
        const formattedResults = allAnalysis.map(result => ({
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

        groupAnalysisData(formattedResults)
      }
      
    } catch (error: any) {
      console.error('❌ ProblemCategoryAnalysis: Analysis failed:', error)
      setError(error.message || 'Failed to analyze submissions. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const toggleCategoryExpansion = (category: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(category)) {
      newExpanded.delete(category)
    } else {
      newExpanded.add(category)
    }
    setExpandedCategories(newExpanded)
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'success'
      case 'Medium': return 'warning'
      case 'Hard': return 'danger'
      default: return 'default'
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
    return 'success'
  }

  if (!recentSubmissions?.length) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              <h3 className="text-lg font-semibold">Problem Category Analysis</h3>
            </div>
          </div>
        </CardHeader>
        <CardBody>
          <p className="text-gray-600 text-center py-8">No recent submissions available for analysis.</p>
        </CardBody>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            <h3 className="text-lg font-semibold">Problem Category Analysis</h3>
          </div>
          <Button
            onPress={handleAnalyzeAll}
            color="primary"
            variant="solid"
            isLoading={loading}
            startContent={!loading && <Brain className="w-4 h-4" />}
            size="sm"
          >
            {loading ? 'Analyzing...' : 'Analyze Categories'}
          </Button>
        </div>
      </CardHeader>
      <CardBody className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
            <div className="text-red-600 text-sm">{error}</div>
          </div>
        )}

        {categoryGroups.length > 0 && (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-600">{categoryGroups.length}</div>
                <div className="text-sm text-blue-700">Categories</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-600">
                  {categoryGroups.reduce((sum, cat) => sum + cat.totalProblems, 0)}
                </div>
                <div className="text-sm text-green-700">Total Problems</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-purple-600">
                  {categoryGroups.find(cat => cat.totalProblems === Math.max(...categoryGroups.map(c => c.totalProblems)))?.category || 'N/A'}
                </div>
                <div className="text-sm text-purple-700">Top Category</div>
              </div>
            </div>

            <Divider />

            {/* Category Groups */}
            <div className="space-y-4">
              {categoryGroups.map((group) => (
                <Card key={group.category} className="shadow-sm">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          onPress={() => toggleCategoryExpansion(group.category)}
                        >
                          {expandedCategories.has(group.category) ? 
                            <ChevronUp className="w-4 h-4" /> : 
                            <ChevronDown className="w-4 h-4" />
                          }
                        </Button>
                        <div>
                          <h4 className="text-lg font-semibold">{group.category}</h4>
                          <p className="text-sm text-gray-600">{group.totalProblems} problems</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge color="success" variant="flat" size="sm">
                          Easy: {group.difficulty.Easy}
                        </Badge>
                        <Badge color="warning" variant="flat" size="sm">
                          Medium: {group.difficulty.Medium}
                        </Badge>
                        <Badge color="danger" variant="flat" size="sm">
                          Hard: {group.difficulty.Hard}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  
                  {expandedCategories.has(group.category) && (
                    <CardBody className="pt-0">
                      <div className="space-y-3">
                        {group.problems.map((problem, index) => {
                          const daysUntilRecall = getDaysUntilRecall(problem.estimated_next_recall_date)
                          
                          return (
                            <div key={index} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <div className="font-medium text-gray-900">
                                    {problemSlugs[problem.problem] ? (
                                      <a 
                                        href={generateLeetCodeProblemUrl(problemSlugs[problem.problem])}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-2 transition-colors"
                                      >
                                        {problem.problem}
                                        <LinkIcon className="w-4 h-4" />
                                      </a>
                                    ) : (
                                      problem.problem
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge 
                                      color={getDifficultyColor(problem.difficulty)}
                                      size="sm" 
                                      variant="flat"
                                    >
                                      {problem.difficulty}
                                    </Badge>
                                    <Badge 
                                      color={getUrgencyColor(daysUntilRecall)}
                                      size="sm"
                                      variant="flat"
                                    >
                                      {daysUntilRecall <= 0 ? 'Review Now' : 
                                       daysUntilRecall <= 3 ? 'Review Soon' : 
                                       `${daysUntilRecall} days`}
                                    </Badge>
                                  </div>
                                </div>
                                <div className="text-right ml-4">
                                  <div className="text-sm font-medium">Confidence: {problem.confidence}/5</div>
                                  <Progress 
                                    value={problem.confidence * 20} 
                                    className="w-16" 
                                    size="sm"
                                    color={problem.confidence >= 4 ? 'success' : problem.confidence >= 3 ? 'warning' : 'danger'}
                                  />
                                </div>
                              </div>
                              
                              {/* Concepts */}
                              <div className="mb-2">
                                <div className="flex flex-wrap gap-1">
                                  {problem.concepts.map((concept, conceptIndex) => (
                                    <Chip key={conceptIndex} size="sm" variant="flat" color="primary">
                                      {concept}
                                    </Chip>
                                  ))}
                                </div>
                              </div>
                              
                              {/* Description */}
                              {problem.description && (
                                <p className="text-sm text-gray-600">{problem.description}</p>
                              )}
                              
                              {/* Next Review Date */}
                              <div className="text-xs text-gray-500 mt-2">
                                Next Review: {new Date(problem.estimated_next_recall_date).toLocaleDateString()}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </CardBody>
                  )}
                </Card>
              ))}
            </div>
          </>
        )}

        {categoryGroups.length === 0 && !loading && (
          <div className="text-center py-8">
            <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Analysis Yet</h3>
            <p className="text-gray-600 mb-4">
              Click "Analyze Categories" to get detailed insights about your problem-solving patterns by category.
            </p>
          </div>
        )}
      </CardBody>
    </Card>
  )
}
