import { NextRequest, NextResponse } from 'next/server'
import { analyzeConceptsAndRecall, SubmissionForAnalysis } from '@/lib/groq-api'

interface LeetCodeSubmission {
  id: string
  title: string
  titleSlug: string
  timestamp: string
  difficulty?: string
}

export async function POST(request: NextRequest) {
  try {
    const { submissions }: { submissions: LeetCodeSubmission[] } = await request.json()
    
    if (!submissions || submissions.length === 0) {
      return NextResponse.json({ error: 'No submissions provided' }, { status: 400 })
    }

    console.log(`🤖 Starting LLM analysis for ${submissions.length} problems...`)
    
    // Convert to the format expected by groq-api
    const submissionsForAnalysis: SubmissionForAnalysis[] = submissions.map(sub => ({
      problem_name: sub.title,
      difficulty: (sub.difficulty as 'Easy' | 'Medium' | 'Hard') || 'Medium',
      submission_date: new Date(parseInt(sub.timestamp) * 1000).toISOString().split('T')[0],
      attempts: 1,
      hints_used: false
    }))

    // Use the existing Groq API configuration
    const results = await analyzeConceptsAndRecall(submissionsForAnalysis)
    
    console.log(`✅ Completed LLM analysis for ${results.length} problems`)
    return NextResponse.json({ results })

  } catch (error) {
    console.error('❌ Error in analyze-submissions API:', error)
    return NextResponse.json(
      { error: 'Failed to analyze submissions', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
