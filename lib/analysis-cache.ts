import { analyzeConceptsAndRecall, ConceptAnalysis, SubmissionForAnalysis } from '@/lib/groq-api'

/**
 * Shared analysis cache to ensure each question is analyzed only once
 * This prevents duplicate analysis and ensures consistent recall dates
 * across ConceptRecallAnalysis and ProblemCategoryAnalysis components
 */
class AnalysisCache {
  private cache: Map<string, ConceptAnalysis> = new Map()
  private inProgress: Set<string> = new Set()

  async getAnalysis(submissions: any[]): Promise<ConceptAnalysis[]> {
    // Filter out submissions that are already cached or in progress
    const uncachedSubmissions: SubmissionForAnalysis[] = []
    const results: ConceptAnalysis[] = []

    for (const sub of submissions) {
      const key = this.getSubmissionKey(sub)
      
      if (this.cache.has(key)) {
        // Return cached result
        results.push(this.cache.get(key)!)
      } else if (!this.inProgress.has(key)) {
        // Need to analyze this submission
        uncachedSubmissions.push(this.transformSubmission(sub))
        this.inProgress.add(key)
      }
    }

    // Analyze uncached submissions
    if (uncachedSubmissions.length > 0) {
      try {
        console.log('🔄 Analyzing', uncachedSubmissions.length, 'new submissions...')
        const newAnalyses = await analyzeConceptsAndRecall(uncachedSubmissions)
        
        // Cache the results
        for (const analysis of newAnalyses) {
          const key = this.getAnalysisKey(analysis)
          this.cache.set(key, analysis)
          results.push(analysis)
        }
        
        // Mark as no longer in progress
        for (const sub of uncachedSubmissions) {
          this.inProgress.delete(this.getSubmissionKey(sub))
        }
        
        console.log('✅ Cached', newAnalyses.length, 'new analyses. Total cache size:', this.cache.size)
      } catch (error) {
        console.error('❌ Analysis failed:', error)
        // Mark as no longer in progress
        for (const sub of uncachedSubmissions) {
          this.inProgress.delete(this.getSubmissionKey(sub))
        }
        throw error
      }
    }

    // Sort results to match original submission order
    const orderedResults: ConceptAnalysis[] = []
    for (const sub of submissions) {
      const key = this.getSubmissionKey(sub)
      const analysis = this.cache.get(key)
      if (analysis) {
        orderedResults.push(analysis)
      }
    }

    return orderedResults
  }

  private getSubmissionKey(submission: any): string {
    return `${submission.title || submission.problem_name}_${submission.titleSlug || submission.title_slug || ''}`
  }

  private getAnalysisKey(analysis: ConceptAnalysis): string {
    return `${analysis.problem}_${analysis.category || ''}`
  }

  private transformSubmission(sub: any): SubmissionForAnalysis {
    const problemName = sub.title || sub.problem_name
    
    return {
      problem_name: problemName,
      difficulty: 'Medium' as const, // Will be determined by AI analysis
      submission_date: new Date(parseInt(sub.timestamp) * 1000).toISOString().split('T')[0],
      attempts: 1, // Default to 1 since we don't have this data from LeetCode API
    }
  }

  // Method to get cached analysis for a specific problem
  getCachedAnalysis(problemName: string): ConceptAnalysis | null {
    const entries = Array.from(this.cache.entries())
    for (const [key, analysis] of entries) {
      if (analysis.problem === problemName) {
        return analysis
      }
    }
    return null
  }

  // Method to clear cache if needed
  clearCache(): void {
    this.cache.clear()
    this.inProgress.clear()
    console.log('🗑️ Analysis cache cleared')
  }

  // Method to get cache status
  getCacheStatus(): { size: number, inProgress: number } {
    return {
      size: this.cache.size,
      inProgress: this.inProgress.size
    }
  }
}

// Global shared instance
export const sharedAnalysisCache = new AnalysisCache()
