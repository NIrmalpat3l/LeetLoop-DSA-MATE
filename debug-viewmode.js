// Debug script to test the calendar view mode logic
console.log('🧪 Testing Calendar View Mode Logic...')

// Sample data structure like what should come from the database
const sampleAnalysisData = [
  {
    id: 1,
    problem_title: "Two Sum",
    problem_slug: "two-sum",
    difficulty: "Easy",
    category: "Array",
    concepts_analysis: {
      concepts: ["Hash Table", "Array"],
      reasoning: "Use hash map for O(1) lookup",
      description: "Find two numbers that add up to target"
    },
    revision_date: "2025-01-28",
    confidence_level: 4,
    analyzed_at: "2025-01-27T10:00:00Z"
  },
  {
    id: 2,
    problem_title: "Valid Parentheses",
    problem_slug: "valid-parentheses",
    difficulty: "Easy", 
    category: "String Manipulation",
    concepts_analysis: {
      concepts: ["Stack", "String"],
      reasoning: "Use stack to track opening brackets",
      description: "Check if brackets are properly matched"
    },
    revision_date: "2025-01-28",
    confidence_level: 3,
    analyzed_at: "2025-01-27T11:00:00Z"
  },
  {
    id: 3,
    problem_title: "Binary Tree Inorder Traversal",
    problem_slug: "binary-tree-inorder-traversal", 
    difficulty: "Medium",
    category: "Tree",
    concepts_analysis: {
      concepts: ["Binary Tree", "DFS", "Recursion"],
      reasoning: "Traverse left, root, right recursively",
      description: "Return inorder traversal of binary tree"
    },
    revision_date: "2025-01-29",
    confidence_level: 2,
    analyzed_at: "2025-01-27T12:00:00Z"
  }
]

// Test the calendar data generation logic
function generateCalendarData(data) {
  const calendar = []
  const groupedByDate = data.reduce((acc, item) => {
    const date = item.revision_date
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(item)
    return acc
  }, {})

  for (const [date, problems] of Object.entries(groupedByDate)) {
    const conceptCategories = Array.from(new Set(problems.map(p => p.category)))
    calendar.push({
      date,
      problems,
      conceptCategories
    })
  }

  calendar.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  return calendar
}

// Test the icon mapping logic
function getCategoryIcon(category) {
  const categoryLower = category.toLowerCase().trim()
  
  // Direct icon mapping (simplified for testing)
  if (categoryLower.includes('array')) return 'Code'
  if (categoryLower.includes('string')) return 'Type'
  if (categoryLower.includes('tree')) return 'TreePine'
  if (categoryLower.includes('graph')) return 'Network'
  if (categoryLower.includes('hash')) return 'Database'
  if (categoryLower.includes('search')) return 'Search'
  if (categoryLower.includes('dynamic')) return 'Zap'
  
  return 'Brain' // Default
}

// Run the tests
console.log('📊 Testing calendar data generation...')
const calendarData = generateCalendarData(sampleAnalysisData)
console.log('Generated calendar data:', calendarData)

console.log('\n🎨 Testing icon mapping...')
calendarData.forEach(day => {
  console.log(`\nDate: ${day.date}`)
  console.log(`Problems: ${day.problems.length}`)
  console.log(`Categories: ${day.conceptCategories.join(', ')}`)
  
  day.conceptCategories.forEach(category => {
    const icon = getCategoryIcon(category)
    console.log(`  ${category} → ${icon}`)
  })
})

// Test view mode logic
console.log('\n🔄 Testing view mode logic...')
const testViewModes = ['questions', 'concepts']

testViewModes.forEach(viewMode => {
  console.log(`\n--- ViewMode: ${viewMode} ---`)
  
  calendarData.forEach(day => {
    console.log(`Date: ${day.date}`)
    
    if (viewMode === 'concepts') {
      console.log('  CONCEPTS MODE:')
      if (day.conceptCategories.length > 0) {
        day.conceptCategories.forEach(category => {
          const icon = getCategoryIcon(category)
          console.log(`    Icon: ${icon} for ${category}`)
        })
      } else {
        console.log('    No categories found!')
      }
    } else {
      console.log(`  QUESTIONS MODE: ${day.problems.length} problems`)
    }
  })
})

console.log('\n✅ Debug complete!')
