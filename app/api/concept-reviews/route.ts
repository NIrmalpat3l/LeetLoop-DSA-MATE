import { NextRequest, NextResponse } from 'next/server'

// Mock concept reviews for demonstration
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const username = searchParams.get('username')

  if (!username) {
    return NextResponse.json({ error: 'Username is required' }, { status: 400 })
  }

  // In a real app, this would fetch from your database
  const mockConceptReviews = [
    {
      id: '1',
      conceptName: 'Dynamic Programming',
      tagSlug: 'dynamic-programming',
      lastSolvedDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
      nextReviewDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago (overdue)
      difficulty: 'Hard',
      repetitionCount: 3,
      interval: 7,
      easeFactor: 2.5,
      isOverdue: true
    },
    {
      id: '2',
      conceptName: 'Binary Search',
      tagSlug: 'binary-search',
      lastSolvedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      nextReviewDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      difficulty: 'Medium',
      repetitionCount: 2,
      interval: 7,
      easeFactor: 2.5,
      isOverdue: false
    },
    {
      id: '3',
      conceptName: 'Graph Algorithms',
      tagSlug: 'graph',
      lastSolvedDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000), // 12 days ago
      nextReviewDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago (overdue)
      difficulty: 'Hard',
      repetitionCount: 1,
      interval: 7,
      easeFactor: 2.5,
      isOverdue: true
    }
  ]

  return NextResponse.json(mockConceptReviews)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { conceptId, rating } = body

  // In a real app, update the concept review based on the rating
  // Calculate new interval and ease factor using spaced repetition algorithm
  
  return NextResponse.json({ 
    success: true, 
    message: 'Concept review updated successfully' 
  })
}
