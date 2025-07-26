// 'use client'

// import { useState, useEffect } from 'react'
// import { Card, CardBody, CardHeader, Button, Progress, Badge, Spinner, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, Chip } from '@nextui-org/react'
// import { Calendar, Brain, Clock, Target, ArrowRight, CheckCircle, AlertTriangle, TrendingUp, Filter, Eye, BookOpen, RefreshCw, Code, Database, Layers, Zap, Hash, GitBranch, Cpu, Network, FileText, Type, Binary, Search, ArrowLeftRight, Grid, Shuffle, TreePine, Route, MapPin, Lock, Key, Puzzle, Settings, Gauge } from 'lucide-react'
// import { supabase } from '@/lib/supabase'
// import { analyzeConceptsAndRecall } from '@/lib/groq-api-new'
// import { suggestIconForCategory } from '@/lib/icon-suggestion'

// interface AnalysisData {
//   id: number
//   problem_title: string
//   problem_slug: string
//   difficulty: string
//   category: string
//   concepts_analysis: {
//     concepts: string[]
//     reasoning: string
//     description: string
//   }
//   revision_date: string
//   confidence_level: number
//   analyzed_at: string
// }

// interface Submission {
//   id: string
//   title: string
//   titleSlug: string
//   timestamp: string
//   difficulty?: string
// }

// interface CalendarDay {
//   date: string
//   problems: AnalysisData[]
//   conceptCategories: string[]
// }

// export default function SmartAnalysisComponent({ recentSubmissions = [] }: { recentSubmissions: Submission[] }) {
//   const [analysisData, setAnalysisData] = useState<AnalysisData[]>([])
//   const [loading, setLoading] = useState(true)
//   const [analyzing, setAnalyzing] = useState(false)
//   const [error, setError] = useState('')
//   const [user, setUser] = useState<any>(null)
//   const [viewMode, setViewMode] = useState<'questions' | 'concepts'>('questions')
//   const [selectedDate, setSelectedDate] = useState<string | null>(null)
//   const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisData | null>(null)
//   const [calendarData, setCalendarData] = useState<CalendarDay[]>([])
//   const [categoryIcons, setCategoryIcons] = useState<Record<string, any>>({})
//   const [loadingIcons, setLoadingIcons] = useState<Set<string>>(new Set())
//   const { isOpen, onOpen, onClose } = useDisclosure()

//   useEffect(() => {
//     initializeAnalysis()
//   }, [])

//   const initializeAnalysis = async () => {
//     try {
//       const { data: { user } } = await supabase.auth.getUser()
//       if (!user) {
//         setError('Please sign in to access analysis features')
//         setLoading(false)
//         return
//       }
//       setUser(user)
//       await loadStoredAnalysis()
//     } catch (error) {
//       console.error('Error initializing analysis:', error)
//       setError('Failed to initialize analysis system')
//     } finally {
//       setLoading(false)
//     }
//   }

//   const loadStoredAnalysis = async () => {
//     if (!user) return

//     try {
//       console.log('📊 Loading stored analysis from database...')
//       const { data, error } = await supabase
//         .from('problem_analysis')
//         .select('*')
//         .eq('user_id', user.id)
//         .order('analyzed_at', { ascending: false })

//       if (error) {
//         console.error('❌ Error loading analysis:', error)
//         setError(`Database error: ${error.message}`)
//         return
//       }

//       console.log(`✅ Loaded ${data?.length || 0} existing analysis records`)
//       setAnalysisData(data || [])
//       generateCalendarData(data || [])
      
//       // Preload LLM-suggested icons for all categories
//       if (data && data.length > 0) {
//         preloadCategoryIcons(data)
//       }
//     } catch (error) {
//       console.error('❌ Error in loadStoredAnalysis:', error)
//       setError('Failed to load analysis data')
//     }
//   }

//   const getUnanalyzedSubmissions = () => {
//     if (!recentSubmissions || recentSubmissions.length === 0) {
//       console.log('📝 No recent submissions provided')
//       return []
//     }

//     const analyzedSlugs = new Set(analysisData.map(item => item.problem_slug))
//     const unanalyzed = recentSubmissions.filter(submission => {
//       const slug = submission.titleSlug || submission.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
//       return !analyzedSlugs.has(slug)
//     })

//     console.log(`🔍 Total submissions: ${recentSubmissions.length}`)
//     console.log(`📊 Already analyzed: ${analysisData.length}`)
//     console.log(`🆕 Unanalyzed submissions: ${unanalyzed.length}`)
    
//     return unanalyzed
//   }

//   const analyzeNewSubmissions = async () => {
//     if (!user) return

//     setAnalyzing(true)
//     setError('')

//     try {
//       const unanalyzedSubmissions = getUnanalyzedSubmissions()
      
//       if (unanalyzedSubmissions.length === 0) {
//         setError('No new submissions to analyze. All problems have been processed.')
//         setAnalyzing(false)
//         return
//       }

//       console.log(`🎯 Starting LLM analysis for ${unanalyzedSubmissions.length} new submissions...`)
//       unanalyzedSubmissions.forEach((sub, idx) => {
//         console.log(`   ${idx + 1}. ${sub.title} (${sub.titleSlug})`)
//       })

//       // Step 1: Analyze with LLM
//       const analysisResults = await analyzeConceptsAndRecall(unanalyzedSubmissions)

//       if (!analysisResults || analysisResults.length === 0) {
//         setError('LLM analysis failed to return results')
//         setAnalyzing(false)
//         return
//       }

//       console.log(`✅ LLM returned ${analysisResults.length} analysis results`)

//       // Step 2: Save to database
//       let successCount = 0
//       for (const result of analysisResults) {
//         try {
//           const analysisRecord = {
//             user_id: user.id,
//             problem_title: result.problem,
//             problem_slug: result.problem.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
//             difficulty: result.difficulty || 'Medium',
//             category: result.category || 'General',
//             concepts_analysis: {
//               concepts: result.concepts || [],
//               reasoning: result.reasoning || '',
//               description: result.description || ''
//             },
//             revision_date: result.estimated_next_recall_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
//             confidence_level: 3,
//             submission_timestamp: Date.now().toString()
//           }

//           console.log(`💾 Storing analysis for: ${result.problem}`)
//           const { error: insertError } = await supabase
//             .from('problem_analysis')
//             .upsert(analysisRecord, {
//               onConflict: 'user_id,problem_slug'
//             })

//           if (insertError) {
//             console.error('❌ Error storing analysis:', insertError)
//           } else {
//             successCount++
//             console.log(`✅ Stored: ${result.problem}`)
//           }
//         } catch (storeError) {
//           console.error('❌ Error storing individual analysis:', storeError)
//         }
//       }

//       console.log(`🎉 Successfully stored ${successCount}/${analysisResults.length} analysis records`)

//       // Step 3: Reload data to show in UI
//       await loadStoredAnalysis()

//     } catch (error) {
//       console.error('❌ Error during analysis:', error)
//       setError(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
//     }

//     setAnalyzing(false)
//   }

//   const generateCalendarData = (data: AnalysisData[]) => {
//     const calendar: CalendarDay[] = []
//     const groupedByDate = data.reduce((acc, item) => {
//       const date = item.revision_date
//       if (!acc[date]) {
//         acc[date] = []
//       }
//       acc[date].push(item)
//       return acc
//     }, {} as Record<string, AnalysisData[]>)

//     for (const [date, problems] of Object.entries(groupedByDate)) {
//       const conceptCategories = Array.from(new Set(problems.map(p => p.category)))
//       calendar.push({
//         date,
//         problems,
//         conceptCategories
//       })
//     }

//     calendar.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
//     setCalendarData(calendar)
//   }

//   const handleDateClick = (day: CalendarDay) => {
//     setSelectedDate(day.date)
//     setSelectedAnalysis(day.problems[0])
//     onOpen()
//   }

//   const getDifficultyColor = (difficulty: string) => {
//     switch (difficulty?.toLowerCase()) {
//       case 'easy': return 'success'
//       case 'medium': return 'warning'
//       case 'hard': return 'danger'
//       default: return 'default'
//     }
//   }

//   const getCategoryColor = (category: string): "primary" | "secondary" | "success" | "warning" | "danger" => {
//     const colors: ("primary" | "secondary" | "success" | "warning" | "danger")[] = ['primary', 'secondary', 'success', 'warning', 'danger']
//     const hash = category.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
//     return colors[hash % colors.length]
//   }

//   const formatDate = (dateString: string) => {
//     return new Date(dateString).toLocaleDateString('en-US', { 
//       month: 'short', 
//       day: 'numeric' 
//     })
//   }

//   // Icon mapping using LLM suggestions with fallback
//   const iconMap = {
//     // Core icons
//     Calendar, Brain, Clock, Target, ArrowRight, CheckCircle, AlertTriangle, TrendingUp, 
//     Filter, Eye, BookOpen, RefreshCw, Code, Database, Layers, Zap, Hash, GitBranch, 
//     Cpu, Network, FileText, Type, Binary, Search, ArrowLeftRight, Grid, Shuffle, 
//     TreePine, Route, MapPin, Lock, Key, Puzzle, Settings, Gauge
//   }

//   const getCategoryIcon = (category: string) => {
//     const categoryLower = category.toLowerCase().trim()
    
//     // Direct icon mapping
//     if (categoryLower.includes('array')) return Code
//     if (categoryLower.includes('string')) return Type
//     if (categoryLower.includes('tree')) return TreePine
//     if (categoryLower.includes('graph')) return Network
//     if (categoryLower.includes('hash') || categoryLower.includes('map')) return Database
//     if (categoryLower.includes('search')) return Search
//     if (categoryLower.includes('dynamic') || categoryLower.includes('dp')) return Zap
//     if (categoryLower.includes('sort')) return Shuffle
//     if (categoryLower.includes('greedy')) return Target
//     if (categoryLower.includes('pointer')) return ArrowLeftRight
//     if (categoryLower.includes('sliding') || categoryLower.includes('window')) return Grid
//     if (categoryLower.includes('backtrack')) return RefreshCw
//     if (categoryLower.includes('math') || categoryLower.includes('number')) return Binary
//     if (categoryLower.includes('time') || categoryLower.includes('interval')) return Clock
//     if (categoryLower.includes('two')) return ArrowLeftRight
//     if (categoryLower.includes('binary')) return Binary
//     if (categoryLower.includes('linked')) return GitBranch
//     if (categoryLower.includes('stack')) return Layers
//     if (categoryLower.includes('queue')) return ArrowRight
//     if (categoryLower.includes('heap')) return TrendingUp
    
//     return Brain // Default
//   }

//   // Preload icons for all unique categories
//   const preloadCategoryIcons = async (data: AnalysisData[]) => {
//     const uniqueCategories = Array.from(new Set(data.map(item => item.category)))
//     const newLoadingIcons = new Set(loadingIcons)
    
//     for (const category of uniqueCategories) {
//       if (!categoryIcons[category] && !newLoadingIcons.has(category)) {
//         newLoadingIcons.add(category)
//         setLoadingIcons(new Set(newLoadingIcons))
        
//         try {
//           const IconComponent = await getCategoryIcon(category)
//           setCategoryIcons(prev => ({
//             ...prev,
//             [category]: IconComponent
//           }))
//         } catch (error) {
//           console.error(`Failed to get icon for category ${category}:`, error)
//           setCategoryIcons(prev => ({
//             ...prev,
//             [category]: Brain
//           }))
//         } finally {
//           newLoadingIcons.delete(category)
//           setLoadingIcons(new Set(newLoadingIcons))
//         }
//       }
//     }
//   }

//   // Simple Category Icon component
//   const CategoryIcon = ({ category, className = "h-4 w-4" }: { 
//     category: string, 
//     className?: string 
//   }) => {
//     const IconComponent = getCategoryIcon(category)
//     return <IconComponent className={className} />
//   }

//   if (loading) {
//     return (
//       <Card className="w-full">
//         <CardBody className="text-center p-8">
//           <Spinner size="lg" />
//           <p className="mt-4">Loading Smart Analysis System...</p>
//         </CardBody>
//       </Card>
//     )
//   }

//   if (error) {
//     return (
//       <Card className="w-full">
//         <CardBody className="text-center p-8">
//           <AlertTriangle className="h-12 w-12 text-danger mx-auto mb-4" />
//           <h3 className="text-lg font-semibold mb-2">Analysis System Error</h3>
//           <p className="text-default-600 mb-4">{error}</p>
//           <Button color="primary" onPress={() => window.location.reload()}>
//             Reload Page
//           </Button>
//         </CardBody>
//       </Card>
//     )
//   }

//   const unanalyzedCount = getUnanalyzedSubmissions().length

//   return (
//     <div className="space-y-6">
//       {/* Header Stats */}
//       <Card>
//         <CardHeader className="pb-2">
//           <div className="flex items-center gap-2">
//             <Brain className="h-6 w-6 text-primary" />
//             <h2 className="text-xl font-bold">Smart Analysis System</h2>
//           </div>
//         </CardHeader>
//         <CardBody className="pt-2">
//           <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//             <div className="text-center">
//               <p className="text-2xl font-bold text-primary">{recentSubmissions.length}</p>
//               <p className="text-sm text-default-600">Recent Submissions</p>
//             </div>
//             <div className="text-center">
//               <p className="text-2xl font-bold text-success">{analysisData.length}</p>
//               <p className="text-sm text-default-600">Analyzed Problems</p>
//             </div>
//             <div className="text-center">
//               <p className="text-2xl font-bold text-warning">{unanalyzedCount}</p>
//               <p className="text-sm text-default-600">Pending Analysis</p>
//             </div>
//             <div className="text-center">
//               <p className="text-2xl font-bold text-secondary">{calendarData.length}</p>
//               <p className="text-sm text-default-600">Revision Days</p>
//             </div>
//           </div>
//         </CardBody>
//       </Card>

//       {/* Action Buttons */}
//       <div className="flex flex-wrap gap-4">
//         <Button 
//           color="primary" 
//           size="lg"
//           onPress={analyzeNewSubmissions}
//           isLoading={analyzing}
//           disabled={unanalyzedCount === 0}
//           startContent={<Brain className="h-5 w-5" />}
//         >
//           {unanalyzedCount > 0 ? `Analyze ${unanalyzedCount} New Problems` : 'All Problems Analyzed'}
//         </Button>
        
//         <Button 
//           variant="bordered"
//           onPress={() => loadStoredAnalysis()}
//           startContent={<RefreshCw className="h-5 w-5" />}
//         >
//           Refresh Data
//         </Button>
//       </div>

//       {/* Calendar View */}
//       {analysisData.length > 0 && (
//         <Card>
//           <CardHeader>
//             <div className="flex items-center justify-between">
//               <div className="flex items-center gap-2">
//                 <Calendar className="h-5 w-5" />
//                 <h3 className="text-lg font-semibold">Revision Calendar</h3>
//               </div>
//             </div>
//           </CardHeader>
//           <CardBody>
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
//               {calendarData.map((day) => (
//                 <Card 
//                   key={day.date}
//                   isPressable
//                   onPress={() => handleDateClick(day)}
//                   className="hover:scale-105 transition-transform"
//                 >
//                   <CardBody className="p-4">
//                     <div className="text-center mb-3">
//                       <p className="font-semibold">{formatDate(day.date)}</p>
//                       <div className="mt-2">
//                         <Badge color="primary" variant="flat">
//                           {day.problems.length} problem{day.problems.length !== 1 ? 's' : ''}
//                         </Badge>
//                         {day.conceptCategories.length > 0 && (
//                           <div className="flex justify-center gap-1.5 flex-wrap mt-2">
//                             {day.conceptCategories.map((category, idx) => {
//                               const IconComponent = getCategoryIcon(category)
//                               return (
//                                 <div key={idx} className="p-1.5 bg-primary/10 rounded-full border border-primary/20" title={category}>
//                                   <IconComponent className="h-4 w-4 text-primary" />
//                                 </div>
//                               )
//                             })}
//                           </div>
//                         )}
//                       </div>
//                     </div>
                    
//                     <div className="space-y-2">
//                       {day.problems.slice(0, 2).map((problem) => (
//                         <div key={problem.id} className="p-2 bg-default-100 rounded-lg">
//                           <div className="flex items-center gap-2 mb-1">
//                             <CategoryIcon 
//                               category={problem.category} 
//                               className="h-3 w-3 flex-shrink-0" 
//                             />
//                             <p className="text-sm font-medium truncate">{problem.problem_title}</p>
//                           </div>
//                           <div className="flex gap-1 mt-1">
//                             <Chip size="sm" color={getDifficultyColor(problem.difficulty)}>
//                               {problem.difficulty}
//                             </Chip>
//                             <Chip size="sm" variant="flat">
//                               {problem.concepts_analysis.concepts.length} concepts
//                             </Chip>
//                           </div>
//                         </div>
//                       ))}
                      
//                       {day.problems.length > 2 && (
//                         <p className="text-xs text-default-500 text-center">
//                           +{day.problems.length - 2} more...
//                         </p>
//                       )}
//                     </div>
//                   </CardBody>
//                 </Card>
//               ))}
//             </div>
//           </CardBody>
//         </Card>
//       )}

//       {/* Analysis Results */}
//       {analysisData.length === 0 && unanalyzedCount > 0 && (
//         <Card>
//           <CardBody className="text-center p-8">
//             <Target className="h-12 w-12 text-primary mx-auto mb-4" />
//             <h3 className="text-xl font-semibold mb-2">Ready to Analyze</h3>
//             <p className="text-default-600 mb-4">
//               You have {unanalyzedCount} new submissions ready for AI analysis.
//             </p>
//             <Button 
//               color="primary" 
//               size="lg"
//               onPress={analyzeNewSubmissions}
//               isLoading={analyzing}
//               startContent={<Brain className="h-5 w-5" />}
//             >
//               Start Analysis
//             </Button>
//           </CardBody>
//         </Card>
//       )}

//       {/* Detail Modal */}
//       <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
//         <ModalContent>
//           <ModalHeader>
//             <div className="flex items-center gap-2">
//               <BookOpen className="h-5 w-5" />
//               {selectedAnalysis?.problem_title}
//             </div>
//           </ModalHeader>
//           <ModalBody>
//             {selectedAnalysis && (
//               <div className="space-y-4">
//                 <div className="flex gap-2">
//                   <Chip color={getDifficultyColor(selectedAnalysis.difficulty)}>
//                     {selectedAnalysis.difficulty}
//                   </Chip>
//                   <Chip 
//                     color={getCategoryColor(selectedAnalysis.category)}
//                     startContent={
//                       <CategoryIcon 
//                         category={selectedAnalysis.category} 
//                         className="h-3 w-3" 
//                       />
//                     }
//                   >
//                     {selectedAnalysis.category}
//                   </Chip>
//                   <Chip variant="flat">
//                     Revision: {formatDate(selectedAnalysis.revision_date)}
//                   </Chip>
//                 </div>

//                 <div>
//                   <h4 className="font-semibold mb-2">Key Concepts</h4>
//                   <div className="flex flex-wrap gap-2">
//                     {selectedAnalysis.concepts_analysis.concepts.map((concept, idx) => (
//                       <Chip key={idx} size="sm" variant="flat" color="secondary">
//                         {concept}
//                       </Chip>
//                     ))}
//                   </div>
//                 </div>

//                 <div>
//                   <h4 className="font-semibold mb-2">Problem Description</h4>
//                   <p className="text-default-700">{selectedAnalysis.concepts_analysis.description}</p>
//                 </div>

//                 <div>
//                   <h4 className="font-semibold mb-2">Solution Reasoning</h4>
//                   <p className="text-default-700">{selectedAnalysis.concepts_analysis.reasoning}</p>
//                 </div>

//                 <div className="grid grid-cols-2 gap-4 p-4 bg-default-100 rounded-lg">
//                   <div>
//                     <p className="text-sm text-default-600">Confidence Level</p>
//                     <p className="font-semibold">{selectedAnalysis.confidence_level}/5</p>
//                   </div>
//                   <div>
//                     <p className="text-sm text-default-600">Analyzed</p>
//                     <p className="font-semibold">{new Date(selectedAnalysis.analyzed_at).toLocaleDateString()}</p>
//                   </div>
//                 </div>
//               </div>
//             )}
//           </ModalBody>
//           <ModalFooter>
//             <Button variant="light" onPress={onClose}>
//               Close
//             </Button>
//             {selectedAnalysis && (
//               <Button 
//                 color="primary"
//                 onPress={() => window.open(`https://leetcode.com/problems/${selectedAnalysis.problem_slug}/`, '_blank')}
//               >
//                 View Problem
//               </Button>
//             )}
//           </ModalFooter>
//         </ModalContent>
//       </Modal>
//     </div>
//   )
// }
