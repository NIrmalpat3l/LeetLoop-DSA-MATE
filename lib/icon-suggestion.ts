import Groq from 'groq-sdk'

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
})

// Available Lucide React icons for problem categories
const AVAILABLE_ICONS = [
  // Data Structures
  'Code', 'Database', 'Layers', 'Hash', 'TreePine', 'GitBranch', 'Network', 'Grid',
  
  // Algorithms  
  'Zap', 'Target', 'Search', 'ArrowLeftRight', 'RefreshCw', 'Route', 'Shuffle',
  
  // Programming Concepts
  'Type', 'Binary', 'FileText', 'Cpu', 'Settings', 'Lock', 'Key',
  
  // Problem Types
  'Puzzle', 'Gauge', 'MapPin', 'Clock', 'Brain',
  
  // Actions/Operations
  'Filter', 'Eye', 'BookOpen', 'Calendar', 'CheckCircle'
]

interface IconSuggestion {
  category: string
  suggestedIcon: string
  reasoning: string
  confidence: number
}

export async function suggestIconForCategory(category: string, concepts: string[] = []): Promise<IconSuggestion> {
  try {
    const prompt = `
You are an expert UI/UX designer specializing in icon selection for programming problem categories.

Given a problem category and its related concepts, suggest the most appropriate icon from the available Lucide React icons.

Category: "${category}"
Related Concepts: ${concepts.length > 0 ? concepts.join(', ') : 'None provided'}

Available Icons:
${AVAILABLE_ICONS.map(icon => `- ${icon}`).join('\n')}

Consider:
1. Visual metaphor appropriateness (how well the icon represents the concept)
2. User recognition (how quickly users will understand the connection)
3. Distinctiveness (how unique the icon is compared to other categories)

Return your response as JSON with this exact structure:
{
  "category": "${category}",
  "suggestedIcon": "IconName",
  "reasoning": "Brief explanation of why this icon fits best",
  "confidence": 0.95
}

Choose the most semantically appropriate icon. For example:
- Tree problems → TreePine or GitBranch
- Graph problems → Network or Layers  
- Array problems → Code or Grid
- String problems → Type or FileText
- Hash/Map problems → Database or Hash
- Search problems → Search or Target
- Dynamic Programming → Zap or Settings
- Math problems → Binary or Gauge
- Sorting → Shuffle or ArrowLeftRight
- Time complexity → Clock or Gauge

Respond with valid JSON only.`

    console.log(`🎨 Requesting icon suggestion for category: ${category}`)
    
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'mixtral-8x7b-32768',
      temperature: 0.3,
      max_tokens: 300
    })

    const response = completion.choices[0]?.message?.content
    if (!response) {
      throw new Error('No response from LLM')
    }

    console.log(`🤖 LLM Response: ${response}`)
    
    // Parse JSON response
    const suggestion: IconSuggestion = JSON.parse(response.trim())
    
    // Validate suggested icon exists in our available set
    if (!AVAILABLE_ICONS.includes(suggestion.suggestedIcon)) {
      console.warn(`⚠️ Suggested icon "${suggestion.suggestedIcon}" not available, falling back to Brain`)
      suggestion.suggestedIcon = 'Brain'
      suggestion.confidence = 0.5
      suggestion.reasoning += ' (Fallback due to unavailable icon)'
    }

    console.log(`✅ Icon suggestion: ${suggestion.suggestedIcon} for ${category} (confidence: ${suggestion.confidence})`)
    return suggestion

  } catch (error) {
    console.error('❌ Error getting icon suggestion:', error)
    
    // Fallback to rule-based suggestions
    return getFallbackIconSuggestion(category, concepts)
  }
}

function getFallbackIconSuggestion(category: string, concepts: string[]): IconSuggestion {
  const categoryLower = category.toLowerCase().trim()
  
  // Rule-based fallback logic
  let suggestedIcon = 'Brain' // default
  let reasoning = 'Fallback suggestion based on category keywords'
  
  if (categoryLower.includes('tree')) {
    suggestedIcon = 'TreePine'
    reasoning = 'Tree structure representation'
  } else if (categoryLower.includes('graph')) {
    suggestedIcon = 'Network'
    reasoning = 'Network/graph visualization'
  } else if (categoryLower.includes('array')) {
    suggestedIcon = 'Grid'
    reasoning = 'Grid-like array structure'
  } else if (categoryLower.includes('string')) {
    suggestedIcon = 'Type'
    reasoning = 'Text/string manipulation'
  } else if (categoryLower.includes('hash') || categoryLower.includes('map')) {
    suggestedIcon = 'Database'
    reasoning = 'Key-value storage concept'
  } else if (categoryLower.includes('search')) {
    suggestedIcon = 'Search'
    reasoning = 'Search operation visualization'
  } else if (categoryLower.includes('dynamic') || categoryLower.includes('dp')) {
    suggestedIcon = 'Zap'
    reasoning = 'Dynamic/optimization concept'
  } else if (categoryLower.includes('sort')) {
    suggestedIcon = 'Shuffle'
    reasoning = 'Sorting/rearrangement operation'
  } else if (categoryLower.includes('greedy')) {
    suggestedIcon = 'Target'
    reasoning = 'Goal-oriented optimization'
  } else if (categoryLower.includes('math') || categoryLower.includes('number')) {
    suggestedIcon = 'Binary'
    reasoning = 'Mathematical computation'
  }

  return {
    category,
    suggestedIcon,
    reasoning: `${reasoning} (rule-based fallback)`,
    confidence: 0.7
  }
}

// Batch suggestion for multiple categories
export async function suggestIconsForCategories(categories: string[]): Promise<IconSuggestion[]> {
  const suggestions: IconSuggestion[] = []
  
  // Process in parallel but limit concurrent requests
  const batchSize = 3
  for (let i = 0; i < categories.length; i += batchSize) {
    const batch = categories.slice(i, i + batchSize)
    const batchPromises = batch.map(category => suggestIconForCategory(category))
    const batchResults = await Promise.all(batchPromises)
    suggestions.push(...batchResults)
  }
  
  return suggestions
}
