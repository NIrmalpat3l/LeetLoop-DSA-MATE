interface LeetCodeUserProfile {
  totalQuestionBeatsPercentage: number;
  numAcceptedQuestions: {
    count: number;
    difficulty: string;
  }[];
  numFailedQuestions: {
    count: number;
    difficulty: string;
  }[];
  numUntouchedQuestions: {
    count: number;
    difficulty: string;
  }[];
  userSessionBeatsPercentage: {
    difficulty: string;
    percentage: number;
  }[];
}

interface LeetCodeUserCalendar {
  streak: number;
  totalActiveDays: number;
  dccBadges: any[];
  submissionCalendar: string;
  activeYears: number[];
}

interface LeetCodeSubmissionStats {
  totalSubmissionNum: {
    difficulty: string;
    count: number;
    submissions: number;
  }[];
  acSubmissionNum: {
    difficulty: string;
    count: number;
    submissions: number;
  }[];
}

interface LeetCodeTagStats {
  advanced: {
    tagName: string;
    tagSlug: string;
    problemsSolved: number;
  }[];
  intermediate: {
    tagName: string;
    tagSlug: string;
    problemsSolved: number;
  }[];
  fundamental: {
    tagName: string;
    tagSlug: string;
    problemsSolved: number;
  }[];
}

interface LeetCodeLanguageStats {
  languageName: string;
  problemsSolved: number;
}

interface LeetCodeAllQuestionsCount {
  difficulty: string;
  count: number;
}

interface LeetCodeContestRanking {
  attendedContestsCount: number;
  rating: number;
  globalRanking: number;
  totalParticipants: number;
  topPercentage: number;
  badge: any;
}

interface LeetCodeContestHistory {
  attended: boolean;
  trendDirection: string;
  problemsSolved: number;
  totalProblems: number;
  finishTimeInSeconds: number;
  rating: number;
  ranking: number;
  contest: {
    title: string;
    startTime: number;
  };
}

interface LeetCodeRecentSubmission {
  id: string;
  title: string;
  titleSlug: string;
  timestamp: string;
  difficulty?: string;
  category?: string;
}

interface LeetCodeStreakCounter {
  streakCount: number;
  daysSkipped: number;
  currentDayCompleted: boolean;
}

export interface LeetCodeUserData {
  userProfile: LeetCodeUserProfile | null;
  userCalendar: LeetCodeUserCalendar | null;
  submissionStats: LeetCodeSubmissionStats | null;
  submitStatsGlobal: LeetCodeSubmissionStats | null;
  tagStats: LeetCodeTagStats | null;
  languageStats: LeetCodeLanguageStats[];
  allQuestionsCount: LeetCodeAllQuestionsCount[];
  contestRanking: LeetCodeContestRanking | null;
  contestHistory: LeetCodeContestHistory[];
  recentSubmissions: LeetCodeRecentSubmission[];
  streakCounter: LeetCodeStreakCounter | null;
  source?: string;
}

export async function fetchLeetCodeUserData(username: string): Promise<LeetCodeUserData> {
  console.log('🎯 Fetching LeetCode data for user:', username)
  
  // Check cache first
  const { getCachedLeetCodeData, cacheLeetCodeData } = await import('./cache');
  const cachedData = getCachedLeetCodeData(username);
  
  if (cachedData) {
    console.log('📦 Using cached LeetCode data for:', username);
    return cachedData;
  }
  
  try {
    console.log('📡 Making API request to /api/leetcode...')
    
    // Get the current session for authentication
    const { supabase } = await import('./supabase')
    const { data: { session } } = await supabase.auth.getSession()
    
    // Add retry logic for network errors
    let lastError: Error | null = null
    const maxRetries = 3
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`📡 API request attempt ${attempt}/${maxRetries}`)
        
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout
        
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        }
        
        // Add authorization header if we have a session
        if (session?.access_token) {
          headers['authorization'] = `Bearer ${session.access_token}`
        }
        
        const response = await fetch('/api/leetcode', {
          method: 'POST',
          headers,
          body: JSON.stringify({ username }),
          signal: controller.signal,
        })
        
        clearTimeout(timeoutId)
        
        console.log('📡 API response status:', response.status, response.statusText)

        if (!response.ok) {
          const errorText = await response.text()
          console.error('❌ API response error:', errorText)
          throw new Error(`API request failed: ${response.status} ${response.statusText}`)
        }

        const result = await response.json()
        console.log('✅ API response received:', result)

        if (!result.success) {
          console.error('❌ API returned error:', result.error)
          throw new Error(result.error || 'API returned error')
        }

        if (!result.data) {
          console.error('❌ No data in API response')
          throw new Error('No data received from API')
        }

        console.log('🎉 Successfully fetched LeetCode data for:', username)
        console.log('📊 Data summary:', {
          hasUserProfile: !!result.data.userProfile,
          hasUserCalendar: !!result.data.userCalendar,
          hasSubmissionStats: !!result.data.submissionStats,
          hasTagStats: !!result.data.tagStats,
          languageStatsCount: result.data.languageStats?.length || 0,
          allQuestionsCount: result.data.allQuestionsCount?.length || 0,
          source: result.source
        })

        // Add the source field to the data before returning
        const userData = result.data as LeetCodeUserData
        userData.source = result.source
        
        // Cache the successful result (15 minute TTL)
        cacheLeetCodeData(username, userData, 15);
        
        return userData
        
      } catch (error: any) {
        lastError = error
        console.error(`❌ API request attempt ${attempt} failed:`, error.message)
        
        // Don't retry on certain errors
        if (error.name === 'AbortError') {
          throw new Error('Request timed out. Please check your internet connection.')
        }
        
        if (attempt === maxRetries) {
          break // Don't retry on last attempt
        }
        
        // Wait before retrying (exponential backoff)
        const delay = Math.pow(2, attempt) * 1000
        console.log(`⏳ Waiting ${delay}ms before retry...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
    
    // If we get here, all retries failed
    throw new Error(`Failed to fetch LeetCode data after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`)

  } catch (error: any) {
    console.error('💥 Error fetching LeetCode user data:', error)
    
    // Provide more specific error messages based on error type
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Network error: Unable to connect to the server. Please check your internet connection.')
    }
    
    if (error.message.includes('timeout') || error.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.')
    }
    
    throw new Error(`Failed to fetch LeetCode data: ${error.message || 'Unknown error'}`)
  }
}

// Mock data for development/testing when LeetCode API is unavailable
export function getMockLeetCodeData(username: string): LeetCodeUserData {
  console.log('🧪 Using mock LeetCode data for:', username)
  
  return {
    userProfile: {
      totalQuestionBeatsPercentage: 75.5,
      numAcceptedQuestions: [
        { count: 150, difficulty: "EASY" },
        { count: 75, difficulty: "MEDIUM" },
        { count: 25, difficulty: "HARD" }
      ],
      numFailedQuestions: [
        { count: 45, difficulty: "EASY" },
        { count: 89, difficulty: "MEDIUM" },
        { count: 67, difficulty: "HARD" }
      ],
      numUntouchedQuestions: [
        { count: 500, difficulty: "EASY" },
        { count: 1200, difficulty: "MEDIUM" },
        { count: 600, difficulty: "HARD" }
      ],
      userSessionBeatsPercentage: [
        { difficulty: "EASY", percentage: 85.2 },
        { difficulty: "MEDIUM", percentage: 72.8 },
        { difficulty: "HARD", percentage: 45.9 }
      ]
    },
    userCalendar: {
      streak: 15,
      totalActiveDays: 180,
      dccBadges: [],
      submissionCalendar: JSON.stringify({
        // January 2025 - Starting the year strong  
        "1735689600": 2, "1735776000": 3, "1735862400": 1, "1735948800": 4, "1736035200": 2,
        "1736121600": 5, "1736208000": 1, "1736294400": 3, "1736380800": 2, "1736467200": 4,
        "1736553600": 1, "1736640000": 2, "1736726400": 4, "1736812800": 1, "1736899200": 3,
        "1736985600": 2, "1737072000": 6, "1737158400": 5, "1737244800": 3, "1737331200": 2,
        "1737417600": 4, "1737504000": 1, "1737590400": 2, "1737676800": 3, "1737763200": 5,
        "1737849600": 1, "1737936000": 2, "1738022400": 4, "1738108800": 3, "1738195200": 2,
        
        // February 2025 - Consistent practice
        "1738281600": 4, "1738368000": 1, "1738454400": 3, "1738540800": 2, "1738627200": 5,
        "1738713600": 1, "1738800000": 2, "1738886400": 3, "1738972800": 4, "1739059200": 1,
        "1739145600": 6, "1739232000": 2, "1739318400": 3, "1739404800": 4, "1739491200": 1,
        "1739577600": 2, "1739664000": 5, "1739750400": 3, "1739836800": 1, "1739923200": 4,
        "1740009600": 2, "1740096000": 3, "1740182400": 1, "1740268800": 2, "1740355200": 4,
        "1740441600": 3, "1740528000": 2, "1740614400": 5,
        
        // March 2025 - Ramping up
        "1740700800": 1, "1740787200": 3, "1740873600": 2, "1740960000": 4, "1741046400": 6,
        "1741132800": 2, "1741219200": 3, "1741305600": 1, "1741392000": 4, "1741478400": 2,
        "1741564800": 5, "1741651200": 3, "1741737600": 1, "1741824000": 2, "1741910400": 4,
        "1741996800": 3, "1742083200": 6, "1742169600": 2, "1742256000": 1, "1742342400": 3,
        "1742428800": 4, "1742515200": 2, "1742601600": 5, "1742688000": 1, "1742774400": 3,
        "1742860800": 2, "1742947200": 4, "1743033600": 1, "1743120000": 3, "1743206400": 2,
        "1743292800": 5,
        
        // April 2025 - Contest season
        "1743379200": 3, "1743465600": 1, "1743552000": 4, "1743638400": 2, "1743724800": 6,
        "1743811200": 3, "1743897600": 2, "1743984000": 5, "1744070400": 1, "1744156800": 3,
        "1744243200": 4, "1744329600": 2, "1744416000": 1, "1744502400": 3, "1744588800": 5,
        "1744675200": 2, "1744761600": 4, "1744848000": 1, "1744934400": 3, "1745020800": 6,
        "1745107200": 2, "1745193600": 3, "1745280000": 1, "1745366400": 4, "1745452800": 2,
        "1745539200": 5, "1745625600": 3, "1745712000": 1, "1745798400": 2, "1745884800": 4,
        
        // May 2025 - Steady progress
        "1745971200": 3, "1746057600": 2, "1746144000": 5, "1746230400": 1, "1746316800": 4,
        "1746403200": 2, "1746489600": 3, "1746576000": 6, "1746662400": 1, "1746748800": 2,
        "1746835200": 4, "1746921600": 3, "1747008000": 5, "1747094400": 2, "1747180800": 1,
        "1747267200": 3, "1747353600": 4, "1747440000": 2, "1747526400": 6, "1747612800": 1,
        "1747699200": 3, "1747785600": 2, "1747872000": 4, "1747958400": 5, "1748044800": 1,
        "1748131200": 2, "1748217600": 3, "1748304000": 4, "1748390400": 1, "1748476800": 6,
        "1748563200": 2,
        
        // June 2025 - Summer coding
        "1748649600": 3, "1748736000": 1, "1748822400": 4, "1748908800": 2, "1748995200": 5,
        "1749081600": 3, "1749168000": 1, "1749254400": 2, "1749340800": 4, "1749427200": 6,
        "1749513600": 2, "1749600000": 3, "1749686400": 1, "1749772800": 4, "1749859200": 2,
        "1749945600": 5, "1750032000": 3, "1750118400": 1, "1750204800": 2, "1750291200": 4,
        "1750377600": 6, "1750464000": 3, "1750550400": 2, "1750636800": 1, "1750723200": 4,
        "1750809600": 2, "1750896000": 5, "1750982400": 3, "1751068800": 1, "1751155200": 2,
        
        // July 2025 - Current month with high activity
        "1751241600": 4, "1751328000": 6, "1751414400": 3, "1751500800": 5, "1751587200": 2,
        "1751673600": 7, "1751760000": 4, "1751846400": 8, "1751932800": 3, "1752019200": 6,
        "1752105600": 2, "1752192000": 5, "1752278400": 4, "1752364800": 7, "1752451200": 3,
        "1752537600": 6, "1752624000": 2, "1752710400": 4, "1752796800": 5, "1752883200": 8,
        "1752969600": 3, "1753056000": 7, "1753142400": 2, "1753228800": 4, "1753315200": 6,
        "1753401600": 5, "1753488000": 3
      }),
      activeYears: [2023, 2024, 2025]
    },
    submissionStats: {
      totalSubmissionNum: [
        { difficulty: "All", count: 501, submissions: 501 },
        { difficulty: "Easy", count: 195, submissions: 195 },
        { difficulty: "Medium", count: 164, submissions: 164 },
        { difficulty: "Hard", count: 92, submissions: 92 }
      ],
      acSubmissionNum: [
        { difficulty: "All", count: 250, submissions: 250 },
        { difficulty: "Easy", count: 150, submissions: 150 },
        { difficulty: "Medium", count: 75, submissions: 75 },
        { difficulty: "Hard", count: 25, submissions: 25 }
      ]
    },
    submitStatsGlobal: {
      totalSubmissionNum: [
        { difficulty: "All", count: 501, submissions: 501 },
        { difficulty: "Easy", count: 195, submissions: 195 },
        { difficulty: "Medium", count: 164, submissions: 164 },
        { difficulty: "Hard", count: 92, submissions: 92 }
      ],
      acSubmissionNum: [
        { difficulty: "All", count: 250, submissions: 250 },
        { difficulty: "Easy", count: 150, submissions: 150 },
        { difficulty: "Medium", count: 75, submissions: 75 },
        { difficulty: "Hard", count: 25, submissions: 25 }
      ]
    },
    tagStats: {
      advanced: [
        { tagName: "Dynamic Programming", tagSlug: "dynamic-programming", problemsSolved: 27 },
        { tagName: "Backtracking", tagSlug: "backtracking", problemsSolved: 11 },
        { tagName: "Bitmask", tagSlug: "bitmask", problemsSolved: 1 },
        { tagName: "Quickselect", tagSlug: "quickselect", problemsSolved: 2 },
        { tagName: "Divide and Conquer", tagSlug: "divide-and-conquer", problemsSolved: 12 },
        { tagName: "Trie", tagSlug: "trie", problemsSolved: 3 },
        { tagName: "Union Find", tagSlug: "union-find", problemsSolved: 3 },
        { tagName: "Binary Indexed Tree", tagSlug: "binary-indexed-tree", problemsSolved: 2 },
        { tagName: "Segment Tree", tagSlug: "segment-tree", problemsSolved: 2 },
        { tagName: "Monotonic Stack", tagSlug: "monotonic-stack", problemsSolved: 5 },
        { tagName: "Monotonic Queue", tagSlug: "monotonic-queue", problemsSolved: 1 }
      ],
      intermediate: [
        { tagName: "Tree", tagSlug: "tree", problemsSolved: 21 },
        { tagName: "Binary Tree", tagSlug: "binary-tree", problemsSolved: 21 },
        { tagName: "Hash Table", tagSlug: "hash-table", problemsSolved: 39 },
        { tagName: "Ordered Set", tagSlug: "ordered-set", problemsSolved: 1 },
        { tagName: "Graph", tagSlug: "graph", problemsSolved: 5 },
        { tagName: "Greedy", tagSlug: "greedy", problemsSolved: 21 },
        { tagName: "Binary Search", tagSlug: "binary-search", problemsSolved: 32 },
        { tagName: "Depth-First Search", tagSlug: "depth-first-search", problemsSolved: 18 },
        { tagName: "Breadth-First Search", tagSlug: "breadth-first-search", problemsSolved: 9 },
        { tagName: "Recursion", tagSlug: "recursion", problemsSolved: 11 },
        { tagName: "Sliding Window", tagSlug: "sliding-window", problemsSolved: 10 },
        { tagName: "Bit Manipulation", tagSlug: "bit-manipulation", problemsSolved: 10 },
        { tagName: "Math", tagSlug: "math", problemsSolved: 28 },
        { tagName: "Design", tagSlug: "design", problemsSolved: 4 }
      ],
      fundamental: [
        { tagName: "Array", tagSlug: "array", problemsSolved: 111 },
        { tagName: "Matrix", tagSlug: "matrix", problemsSolved: 15 },
        { tagName: "String", tagSlug: "string", problemsSolved: 39 },
        { tagName: "Simulation", tagSlug: "simulation", problemsSolved: 6 },
        { tagName: "Enumeration", tagSlug: "enumeration", problemsSolved: 1 },
        { tagName: "Sorting", tagSlug: "sorting", problemsSolved: 32 },
        { tagName: "Stack", tagSlug: "stack", problemsSolved: 21 },
        { tagName: "Queue", tagSlug: "queue", problemsSolved: 3 },
        { tagName: "Linked List", tagSlug: "linked-list", problemsSolved: 23 },
        { tagName: "Two Pointers", tagSlug: "two-pointers", problemsSolved: 30 }
      ]
    },
    languageStats: [
      { languageName: "C++", problemsSolved: 207 },
      { languageName: "Java", problemsSolved: 2 },
      { languageName: "JavaScript", problemsSolved: 1 }
    ],
    allQuestionsCount: [
      { difficulty: "Easy", count: 695 },
      { difficulty: "Medium", count: 1464 },
      { difficulty: "Hard", count: 625 }
    ],
    contestRanking: {
      attendedContestsCount: 3,
      rating: 1512.562,
      globalRanking: 288981,
      totalParticipants: 725492,
      topPercentage: 40.35,
      badge: null
    },
    contestHistory: [
      {
        attended: true,
        trendDirection: "DOWN",
        problemsSolved: 2,
        totalProblems: 4,
        finishTimeInSeconds: 6775,
        rating: 1472.906,
        ranking: 14899,
        contest: {
          title: "Weekly Contest 360",
          startTime: 1693103400
        }
      },
      {
        attended: true,
        trendDirection: "DOWN",
        problemsSolved: 0,
        totalProblems: 4,
        finishTimeInSeconds: 0,
        rating: 1410.617,
        ranking: 30037,
        contest: {
          title: "Biweekly Contest 138",
          startTime: 1725114600
        }
      },
      {
        attended: true,
        trendDirection: "UP",
        problemsSolved: 2,
        totalProblems: 4,
        finishTimeInSeconds: 899,
        rating: 1512.562,
        ranking: 3537,
        contest: {
          title: "Weekly Contest 413",
          startTime: 1725157800
        }
      }
    ],
    recentSubmissions: [
      {
        id: "1708699674",
        title: "Two Sum",
        titleSlug: "two-sum",
        timestamp: "1753286737",
        difficulty: "Easy",
        category: "Hash Table"
      },
      {
        id: "1708412744",
        title: "Longest Substring Without Repeating Characters",
        titleSlug: "longest-substring-without-repeating-characters",
        timestamp: "1753270157",
        difficulty: "Medium",
        category: "Sliding Window"
      },
      {
        id: "1708387514",
        title: "Merge Intervals",
        titleSlug: "merge-intervals",
        timestamp: "1753268423",
        difficulty: "Medium",
        category: "Sorting"
      },
      {
        id: "1708372072",
        title: "Word Ladder",
        titleSlug: "word-ladder",
        timestamp: "1753267414",
        difficulty: "Hard",
        category: "Graph/BFS"
      },
      {
        id: "1708355617",
        title: "Maximum Subarray",
        titleSlug: "maximum-subarray",
        timestamp: "1753266377",
        difficulty: "Medium",
        category: "Dynamic Programming"
      },
      {
        id: "1707739649",
        title: "Valid Parentheses",
        titleSlug: "valid-parentheses",
        timestamp: "1753215187",
        difficulty: "Easy",
        category: "Stack"
      },
      {
        id: "1707728338",
        title: "Binary Tree Inorder Traversal",
        titleSlug: "binary-tree-inorder-traversal",
        timestamp: "1753214238"
      },
      {
        id: "1706289938",
        title: "Climbing Stairs",
        titleSlug: "climbing-stairs",
        timestamp: "1753119585"
      },
      {
        id: "1700573515",
        title: "Minimum Add to Make Parentheses Valid",
        titleSlug: "minimum-add-to-make-parentheses-valid",
        timestamp: "1752698211"
      },
      {
        id: "1700552200",
        title: "Non-overlapping Intervals",
        titleSlug: "non-overlapping-intervals",
        timestamp: "1752696302"
      }
    ],
    streakCounter: {
      streakCount: 7,
      daysSkipped: 0,
      currentDayCompleted: true
    },
    source: 'mock-fallback'
  }
}

export async function validateLeetCodeUsername(username: string): Promise<boolean> {
  try {
    const data = await fetchLeetCodeUserData(username);
    return !!data.userProfile;
  } catch (error) {
    return false;
  }
}

// Simple Spaced Repetition class for concept reviews
export class SpacedRepetition {
  static calculateNextReview(interval: number, easeFactor: number, rating: number): { newInterval: number, newEaseFactor: number } {
    // SM-2 algorithm implementation
    let newEaseFactor = easeFactor;
    let newInterval = interval;

    if (rating >= 3) {
      // Correct response
      if (interval === 0) {
        newInterval = 1;
      } else if (interval === 1) {
        newInterval = 6;
      } else {
        newInterval = Math.round(interval * easeFactor);
      }
    } else {
      // Incorrect response
      newInterval = 1;
    }

    // Update ease factor
    newEaseFactor = easeFactor + (0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02));
    newEaseFactor = Math.max(1.3, newEaseFactor);

    return { newInterval, newEaseFactor };
  }

  static updateDifficulty(currentDifficulty: number, wasCorrect: boolean): number {
    if (wasCorrect) {
      return Math.min(currentDifficulty + 1, 5);
    } else {
      return Math.max(currentDifficulty - 1, 0);
    }
  }
}

// Utility function to generate LeetCode problem URLs
export function generateLeetCodeProblemUrl(titleSlug: string): string {
  return `https://leetcode.com/problems/${titleSlug}/`
}

export async function fetchStoredLeetCodeData(profileId: string): Promise<LeetCodeUserData | null> {
  try {
    console.log('📖 Fetching stored LeetCode data for profile:', profileId)
    
    // Get the current session for authentication
    const { supabase } = await import('./supabase')
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.access_token) {
      console.log('⚠️ No authentication session found')
      return null
    }
    
    const headers: HeadersInit = {
      'authorization': `Bearer ${session.access_token}`
    }
    
    const response = await fetch(`/api/leetcode?profile_id=${encodeURIComponent(profileId)}`, {
      method: 'GET',
      headers,
    })
    
    if (!response.ok) {
      if (response.status === 404) {
        console.log('📭 No stored data found for profile:', profileId)
        return null
      }
      throw new Error(`Failed to fetch stored data: ${response.status}`)
    }
    
    const result = await response.json()
    
    if (result.success && result.data) {
      console.log('✅ Successfully loaded stored data for profile:', profileId)
      return result.data
    }
    
    return null
  } catch (error) {
    console.error('❌ Error fetching stored data:', error)
    return null
  }
}
