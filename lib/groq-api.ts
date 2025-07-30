import Groq from 'groq-sdk';
import { format } from 'date-fns';

// Initialize Groq client with defensive environment variable access
const getApiKey = () => {
  if (typeof window === 'undefined') {
    // Server-side: can access process.env directly
    return process.env.NEXT_PUBLIC_GROQ_API_KEY || '';
  } else {
    // Client-side: use window global or fallback
    return (window as any).__NEXT_PUBLIC_GROQ_API_KEY__ || process.env.NEXT_PUBLIC_GROQ_API_KEY || '';
  }
};

const groq = new Groq({
  apiKey: getApiKey(),
  dangerouslyAllowBrowser: true // Enable client-side usage
});

// Check API key validity
export async function validateApiKey(): Promise<{ valid: boolean; error?: string }> {
  try {
    const apiKey = getApiKey();
    if (!apiKey) {
      return { valid: false, error: 'No API key found in environment variables' };
    }
    
    // Test with a simple API call
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: 'Test' }],
      model: 'llama-3.1-8b-instant',
      max_tokens: 10,
    });
    
    return { valid: true };
  } catch (error: any) {
    if (error?.status === 401) {
      return { valid: false, error: 'API key is invalid or expired' };
    }
    return { valid: false, error: `API connection failed: ${error?.message || 'Unknown error'}` };
  }
}

export interface ConceptAnalysis {
  problem: string;
  concepts: string[];
  description: string;
  estimated_next_recall_date: string;
  reasoning: string;
  difficulty: string;
  category: string;
}

export interface SubmissionForAnalysis {
  problem_name: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  concepts?: string[];
  submission_date: string; // format: YYYY-MM-DD
  attempts?: number;
  hints_used?: boolean;
  concept_reused_recently?: boolean;
  user_hints_used?: boolean;
  similar_concepts_used_recently?: boolean;
  submission_attempts?: number;
}

// Enhanced prompt generator based on your approach
const generateEnhancedPrompt = (sub: SubmissionForAnalysis): string => {
  const attempts = sub.attempts || sub.submission_attempts || 1;
  const hintsUsed = sub.hints_used || sub.user_hints_used || false;
  const conceptReusedRecently = sub.concept_reused_recently || sub.similar_concepts_used_recently || false;

  return `
You are a LeetCode spaced repetition assistant. For the problem "${sub.problem_name}", provide:
1. A brief explanation of the solution logic.
2. List of core concepts (like DP, sliding window, graphs, two pointers, etc).
3. **Determine the actual difficulty** (Easy/Medium/Hard) based on the problem name and your knowledge.
4. Estimate the number of days after which the user should review the concept again using spaced repetition, taking into account:
   - Actual Problem Difficulty: (determine from problem knowledge)
   - Submission Date: ${sub.submission_date}
   - Attempts: ${attempts}
   - User Performance: ${hintsUsed ? 'Struggled (hints used)' : 'Solved independently'}
   - Pattern Recognition: ${conceptReusedRecently ? 'Recently practiced similar' : 'Less recent practice'}

Use the spaced repetition baseline:
Easy: 7 days, Medium: 14 days, Hard: 30 days.
Modify based on user's effort, concept frequency, and time since submission.

ADJUSTMENTS:
- Recently practiced similar concept: +7 days
- Concept dormant >14 days: "Urgent Review"
- Strong mastery (few attempts, no hints): +5 days  
- Struggled (hints/multiple attempts): -5 days
- Core fundamental concept: -2 days
- Advanced/compound pattern: +3 days

Current date: ${format(new Date(), 'yyyy-MM-dd')}

Return a JSON object in this format (NO markdown, pure JSON only):
{
  "problem": "<problem name>",
  "concepts": ["<concept1>", "<concept2>", ...],
  "description": "<short 2-3 sentence explanation>",
  "estimated_next_recall_date": "<YYYY-MM-DD>",
  "reasoning": "<explain why you chose that recall date>",
  "difficulty": "<Easy|Medium|Hard - determined by you based on problem knowledge>",
  "category": "<primary algorithm category>"
}
`;
};

// Single problem analysis using your enhanced approach
export async function getRevisionDetails(sub: SubmissionForAnalysis): Promise<ConceptAnalysis> {
  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: generateEnhancedPrompt(sub)
        }
      ],
      model: "llama-3.3-70b-versatile", // Updated to latest supported model
      temperature: 0.5,
      max_tokens: 1000,
    });

    const output = completion.choices[0]?.message?.content;
    
    if (!output) {
      throw new Error('No output received from Groq API');
    }

    try {
      return JSON.parse(output);
    } catch (parseError) {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = output.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[1].trim());
        } catch (secondParseError) {
          console.error('Failed to parse extracted JSON:', jsonMatch[1]);
          throw new Error('Invalid JSON returned from Groq');
        }
      }
      console.error('Failed to parse LLM response:', output);
      throw new Error('Invalid JSON returned from Groq');
    }
  } catch (error) {
    console.error('Error calling Groq API:', error);
    throw error;
  }
}

// Enhanced batch analysis function - combines your individual approach with batching
export async function analyzeConceptsAndRecall(submissions: SubmissionForAnalysis[]): Promise<ConceptAnalysis[]> {
  try {
    console.log('Starting enhanced concept analysis for', submissions.length, 'submissions');
    
    // Option 1: Use individual analysis for better accuracy (your approach)
    if (submissions.length <= 5) {
      const results: ConceptAnalysis[] = [];
      
      for (const submission of submissions) {
        try {
          const result = await getRevisionDetails(submission);
          results.push(result);
          console.log('Analyzed:', result.problem);
        } catch (error) {
          console.error('Failed to analyze:', submission.problem_name, error);
        }
      }
      
      return results;
    }

    // Option 2: Batch analysis for larger sets (existing approach with enhancements)
    const uniqueSubmissions = submissions
      .filter((sub, index, self) => 
        index === self.findIndex(s => s.problem_name === sub.problem_name)
      )
      .slice(0, 25); // Increased limit to handle all 25 submissions

    const enhancedPrompt = `
You are a DSA learning assistant. Analyze these LeetCode submissions for spaced repetition.

CRITICAL: Return EXACTLY ${uniqueSubmissions.length} analyses as a clean JSON array. Keep reasoning field under 50 words.

BASE INTERVALS: Easy(7d), Medium(14d), Hard(30d)
ADJUSTMENTS: Recent similar (+7d), Clean solve (+5d), Fundamental (-2d), Advanced (+3d), Recent submit (-2d)

Current date: ${format(new Date(), 'yyyy-MM-dd')}

Submissions:
${JSON.stringify(uniqueSubmissions.map(s => ({
  problem_name: s.problem_name,
  submission_date: s.submission_date
})), null, 2)}

Return JSON array (NO markdown):
[
  {
    "problem": "Exact Name",
    "concepts": ["Primary", "Secondary"],
    "description": "Brief 1-2 sentence solution approach.",
    "estimated_next_recall_date": "YYYY-MM-DD", 
    "reasoning": "Difficulty: X. Base: X days. Adjustments applied. Final: X days.",
    "difficulty": "Easy/Medium/Hard",
    "category": "Primary Category"
  }
]
`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: enhancedPrompt
        }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.1, // Lower for more consistent, concise output
      max_tokens: 3000, // Increased to ensure complete responses
    });

    const output = completion.choices[0]?.message?.content;
    
    if (!output) {
      throw new Error('No output received from Groq API');
    }

    try {
      const parsed = JSON.parse(output);
      const results = Array.isArray(parsed) ? parsed : [parsed];
      console.log('Successfully analyzed', results.length, 'problems');
      return results;
    } catch (parseError) {
      console.log('First JSON parse attempt failed, trying to clean and parse again...');
      
      // Try to clean up the JSON response
      let cleanedOutput = output.trim();
      
      // Remove any trailing incomplete text after the last complete JSON object
      const lastCompleteObjectIndex = cleanedOutput.lastIndexOf('}');
      if (lastCompleteObjectIndex > -1) {
        // Find the matching array closing bracket
        let bracketCount = 0;
        let inString = false;
        let escape = false;
        
        for (let i = lastCompleteObjectIndex; i < cleanedOutput.length; i++) {
          const char = cleanedOutput[i];
          
          if (escape) {
            escape = false;
            continue;
          }
          
          if (char === '\\') {
            escape = true;
            continue;
          }
          
          if (char === '"') {
            inString = !inString;
            continue;
          }
          
          if (!inString) {
            if (char === '{') bracketCount++;
            if (char === '}') bracketCount--;
            if (char === ']' && bracketCount === 0) {
              cleanedOutput = cleanedOutput.substring(0, i + 1);
              break;
            }
          }
        }
      }
      
      try {
        const parsed = JSON.parse(cleanedOutput);
        const results = Array.isArray(parsed) ? parsed : [parsed];
        console.log('Successfully analyzed', results.length, 'problems (after cleanup)');
        return results;
      } catch (secondParseError) {
        console.log('Cleanup failed, trying markdown extraction...');
        
        // Try to extract JSON from markdown code blocks
        const jsonMatch = output.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[1].trim());
            const results = Array.isArray(parsed) ? parsed : [parsed];
            console.log('Successfully analyzed', results.length, 'problems (extracted from markdown)');
            return results;
          } catch (thirdParseError) {
            console.error('Failed to parse extracted JSON:', jsonMatch[1]);
            console.error('Original output length:', output.length);
            console.error('Cleaned output length:', cleanedOutput.length);
            throw new Error('Invalid JSON returned from Groq batch analysis');
          }
        }
        
        console.error('Failed to parse batch response - no valid JSON found');
        console.error('Original output:', output.substring(0, 500) + '...');
        throw new Error('Invalid JSON returned from Groq batch analysis');
      }
    }

  } catch (error: any) {
    console.error('Error in batch analysis:', error);
    
    // Better error handling - check if it's an authentication issue
    if (error?.status === 401 || error?.message?.includes('Invalid API Key')) {
      console.error('🔑 API Key Authentication Failed - Using Enhanced Fallback Analysis');
    } else {
      console.error('🔧 API Connection Failed - Using Enhanced Fallback Analysis');
    }
    
    // Fallback to individual analysis
    console.log('Falling back to individual analysis...');
    try {
      const results: ConceptAnalysis[] = [];
      for (const submission of submissions.slice(0, 10)) { // Increased from 3 to 10
        const result = await getRevisionDetails(submission);
        results.push(result);
      }
      return results;
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
      // Enhanced fallback: provide meaningful analysis based on problem names
      const results: ConceptAnalysis[] = submissions.slice(0, 25).map((sub, index) => {
        const analysis = getEnhancedFallbackAnalysis(sub);
        return {
          problem: sub.problem_name,
          concepts: analysis.concepts,
          description: analysis.description,
          estimated_next_recall_date: format(new Date(Date.now() + (7 + index) * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
          reasoning: analysis.reasoning,
          difficulty: sub.difficulty || 'Medium',
          category: analysis.category
        };
      });
      console.log('Returning enhanced fallback analysis for', results.length, 'problems');
      return results;
    }
  }
}

// Enhanced fallback analysis based on problem name patterns
function getEnhancedFallbackAnalysis(submission: SubmissionForAnalysis): {
  concepts: string[]
  description: string
  reasoning: string
  category: string
} {
  const problemName = submission.problem_name.toLowerCase();
  
  // Pattern matching for better categorization
  if (problemName.includes('tree') || problemName.includes('binary tree') || problemName.includes('bst')) {
    return {
      concepts: ['Binary Tree', 'Tree Traversal', 'Recursion'],
      description: `Binary tree problem focusing on tree structure manipulation and traversal techniques. Key concepts include understanding tree properties and recursive thinking.`,
      reasoning: `Pattern-based analysis: Tree-related keywords detected. ${submission.difficulty} difficulty suggests ${submission.difficulty === 'Easy' ? 'basic tree operations' : 'advanced tree algorithms'}.`,
      category: 'Tree'
    };
  }
  
  if (problemName.includes('array') || problemName.includes('subarray') || problemName.includes('matrix')) {
    return {
      concepts: ['Array Manipulation', 'Two Pointers', 'Sliding Window'],
      description: `Array-based problem requiring efficient manipulation and traversal strategies. Focus on optimizing time and space complexity.`,
      reasoning: `Pattern-based analysis: Array/Matrix keywords detected. ${submission.difficulty} difficulty suggests ${submission.difficulty === 'Easy' ? 'basic array operations' : 'advanced array algorithms'}.`,
      category: 'Array'
    };
  }
  
  if (problemName.includes('string') || problemName.includes('substring') || problemName.includes('palindrome')) {
    return {
      concepts: ['String Processing', 'Pattern Matching', 'Dynamic Programming'],
      description: `String manipulation problem focusing on character analysis and pattern recognition. Important for developing text processing skills.`,
      reasoning: `Pattern-based analysis: String-related keywords detected. ${submission.difficulty} difficulty suggests ${submission.difficulty === 'Easy' ? 'basic string operations' : 'complex string algorithms'}.`,
      category: 'String'
    };
  }
  
  if (problemName.includes('graph') || problemName.includes('dfs') || problemName.includes('bfs') || problemName.includes('node')) {
    return {
      concepts: ['Graph Theory', 'DFS', 'BFS', 'Graph Traversal'],
      description: `Graph-based problem requiring understanding of graph structures and traversal algorithms. Essential for network and connectivity problems.`,
      reasoning: `Pattern-based analysis: Graph-related keywords detected. ${submission.difficulty} difficulty suggests ${submission.difficulty === 'Easy' ? 'basic graph traversal' : 'complex graph algorithms'}.`,
      category: 'Graph'
    };
  }
  
  if (problemName.includes('dynamic') || problemName.includes('dp') || problemName.includes('optimization')) {
    return {
      concepts: ['Dynamic Programming', 'Optimization', 'Memoization'],
      description: `Dynamic programming problem focusing on optimal substructure and overlapping subproblems. Key to solving complex optimization challenges.`,
      reasoning: `Pattern-based analysis: DP-related keywords detected. ${submission.difficulty} difficulty suggests ${submission.difficulty === 'Easy' ? 'basic DP concepts' : 'advanced DP patterns'}.`,
      category: 'Dynamic Programming'
    };
  }
  
  if (problemName.includes('sort') || problemName.includes('merge') || problemName.includes('quick')) {
    return {
      concepts: ['Sorting Algorithms', 'Merge Sort', 'Quick Sort', 'Divide and Conquer'],
      description: `Sorting-based problem focusing on efficient ordering algorithms and divide-and-conquer strategies.`,
      reasoning: `Pattern-based analysis: Sorting keywords detected. ${submission.difficulty} difficulty suggests ${submission.difficulty === 'Easy' ? 'basic sorting concepts' : 'advanced sorting techniques'}.`,
      category: 'Sorting'
    };
  }
  
  if (problemName.includes('hash') || problemName.includes('map') || problemName.includes('frequency')) {
    return {
      concepts: ['Hash Tables', 'HashMap', 'Frequency Counting'],
      description: `Hash-based problem focusing on efficient lookup and frequency analysis. Important for optimization and counting problems.`,
      reasoning: `Pattern-based analysis: Hash/Map keywords detected. ${submission.difficulty} difficulty suggests ${submission.difficulty === 'Easy' ? 'basic hashing' : 'advanced hash techniques'}.`,
      category: 'Hash Table'
    };
  }
  
  if (problemName.includes('linked') || problemName.includes('list')) {
    return {
      concepts: ['Linked Lists', 'Pointer Manipulation', 'List Traversal'],
      description: `Linked list problem focusing on pointer manipulation and list operations. Essential for understanding dynamic data structures.`,
      reasoning: `Pattern-based analysis: Linked list keywords detected. ${submission.difficulty} difficulty suggests ${submission.difficulty === 'Easy' ? 'basic list operations' : 'complex list algorithms'}.`,
      category: 'Linked List'
    };
  }
  
  // Default analysis for unrecognized patterns
  return {
    concepts: ['Problem Solving', 'Algorithm Design', 'Data Structures'],
    description: `General problem-solving challenge requiring algorithmic thinking and appropriate data structure selection. Focus on understanding the problem constraints and optimizing the solution approach.`,
    reasoning: `Pattern-based analysis: General problem detected. ${submission.difficulty} difficulty suggests ${submission.difficulty === 'Easy' ? 'fundamental programming concepts' : 'advanced algorithmic techniques'}.`,
    category: 'General Algorithm'
  };
}

export default groq;
