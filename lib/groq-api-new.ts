import Groq from 'groq-sdk'

const groq = new Groq({
  apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY
})

interface LeetCodeSubmission {
  id: string
  title: string
  titleSlug: string
  timestamp: string
  difficulty?: string
}

interface AnalysisResult {
  problem: string
  difficulty: string
  category: string
  concepts: string[]
  reasoning: string
  description: string
  estimated_next_recall_date: string
}

export async function analyzeConceptsAndRecall(submissions: LeetCodeSubmission[]): Promise<AnalysisResult[]> {
  try {
    console.log(`🤖 Starting LLM analysis for ${submissions.length} problems...`)
    
    const analysisPrompt = `
You are an expert LeetCode problem analyzer. Analyze each of the following LeetCode problems and provide detailed analysis.

For each problem, provide:
1. Problem difficulty (Easy/Medium/Hard)
2. Main category (e.g., "Array", "Dynamic Programming", "Tree", "Graph", etc.)
3. Key concepts used (3-5 specific algorithms/data structures/techniques)
4. Reasoning about the solution approach
5. Brief description of what the problem asks
6. Estimated revision date (1-14 days from now based on difficulty: Easy=3-5 days, Medium=5-9 days, Hard=7-14 days)

Problems to analyze:
${submissions.map((sub, idx) => `${idx + 1}. ${sub.title} (${sub.titleSlug})`).join('\n')}

Return your response as a JSON array with this exact structure:
[
  {
    "problem": "Problem Title",
    "difficulty": "Easy|Medium|Hard",
    "category": "Main Category",
    "concepts": ["concept1", "concept2", "concept3"],
    "reasoning": "Detailed explanation of solution approach and key insights",
    "description": "Brief description of what the problem asks for",
    "estimated_next_recall_date": "YYYY-MM-DD"
  }
]

Ensure the response is valid JSON only, no additional text.`

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: analysisPrompt
        }
      ],
      model: "llama-3.1-70b-versatile",
      temperature: 0.3,
      max_tokens: 4000
    })

    const response = completion.choices[0]?.message?.content
    if (!response) {
      throw new Error('Empty response from Groq API')
    }

    console.log('🤖 Raw LLM Response received')
    
    try {
      // Clean up the response to ensure it's valid JSON
      let cleanResponse = response.trim()
      
      // Remove any markdown code block markers
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '')
      } else if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '')
      }
      
      const results = JSON.parse(cleanResponse) as AnalysisResult[]
      
      console.log(`✅ Successfully parsed ${results.length} analysis results`)
      
      // Validate and enhance results
      return results.map((result, idx) => ({
        problem: result.problem || submissions[idx]?.title || 'Unknown Problem',
        difficulty: result.difficulty || 'Medium',
        category: result.category || 'General',
        concepts: Array.isArray(result.concepts) ? result.concepts : ['Problem Solving'],
        reasoning: result.reasoning || 'Analysis pending',
        description: result.description || 'Problem description pending',
        estimated_next_recall_date: result.estimated_next_recall_date || getDefaultRevisionDate()
      }))
      
    } catch (parseError) {
      console.error('❌ JSON parsing error:', parseError)
      console.log('Raw response:', response)
      
      // Fallback: create basic analysis for each submission
      return submissions.map(sub => ({
        problem: sub.title,
        difficulty: sub.difficulty || 'Medium',
        category: 'General',
        concepts: ['Problem Solving', 'Algorithms'],
        reasoning: 'Automated analysis - please review manually',
        description: `Analysis for ${sub.title}`,
        estimated_next_recall_date: getDefaultRevisionDate()
      }))
    }
    
  } catch (error) {
    console.error('❌ Error in LLM analysis:', error)
    
    // Fallback: create basic analysis for each submission
    return submissions.map(sub => ({
      problem: sub.title,
      difficulty: sub.difficulty || 'Medium',
      category: 'General',
      concepts: ['Problem Solving'],
      reasoning: 'LLM analysis failed - please review manually',
      description: `Problem: ${sub.title}`,
      estimated_next_recall_date: getDefaultRevisionDate()
    }))
  }
}

function getDefaultRevisionDate(): string {
  const date = new Date()
  date.setDate(date.getDate() + 7) // Default to 7 days from now
  return date.toISOString().split('T')[0]
}
