import { suggestIconForCategory, suggestIconsForCategories } from './lib/icon-suggestion'

// Test the LLM icon suggestion system
async function testIconSuggestions() {
  console.log('🎨 Testing LLM Icon Suggestion System...\n')

  const testCategories = [
    'Dynamic Programming',
    'Binary Tree', 
    'Graph Theory',
    'String Manipulation',
    'Hash Table',
    'Greedy Algorithm',
    'Two Pointers',
    'Sliding Window',
    'Backtracking',
    'Math & Number Theory'
  ]

  console.log('Testing individual suggestions:')
  for (const category of testCategories) {
    try {
      const suggestion = await suggestIconForCategory(category)
      console.log(`${category.padEnd(20)} → ${suggestion.suggestedIcon.padEnd(15)} (${suggestion.confidence}) - ${suggestion.reasoning}`)
    } catch (error) {
      console.error(`Failed for ${category}:`, error)
    }
  }

  console.log('\nTesting batch suggestions:')
  try {
    const batchSuggestions = await suggestIconsForCategories(testCategories)
    batchSuggestions.forEach(suggestion => {
      console.log(`${suggestion.category.padEnd(20)} → ${suggestion.suggestedIcon.padEnd(15)} (${suggestion.confidence})`)
    })
  } catch (error) {
    console.error('Batch suggestions failed:', error)
  }
}

// Run the test
testIconSuggestions()
