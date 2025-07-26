// LeetCode API Types
export interface UserStats {
  totalSolved: number;
  totalQuestions: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  acceptanceRate: number;
  ranking: number;
}

export interface ProblemCount {
  difficulty: 'Easy' | 'Medium' | 'Hard';
  count: number;
  submissions: number;
}

export interface LanguageStats {
  languageName: string;
  problemsSolved: number;
}

export interface TagProblemCount {
  tagName: string;
  tagSlug: string;
  problemsSolved: number;
}

export interface UserProfile {
  username: string;
  name: string;
  avatar: string;
  ranking: number;
  reputation: number;
  gitHubUrl?: string;
  twitterUrl?: string;
  linkedInUrl?: string;
}

export interface RecentSubmission {
  title: string;
  titleSlug: string;
  timestamp: string;
  statusDisplay: string;
  lang: string;
}

export interface ContestRanking {
  attendedContestsCount: number;
  rating: number;
  globalRanking: number;
  totalParticipants: number;
  topPercentage: number;
}

// Spaced Repetition Types
export interface ConceptReview {
  id: string;
  conceptName: string;
  tagSlug: string;
  lastSolvedDate: Date;
  nextReviewDate: Date;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  repetitionCount: number;
  interval: number; // days
  easeFactor: number;
  isOverdue: boolean;
}

export interface NotificationSettings {
  emailNotifications: boolean;
  browserNotifications: boolean;
  dailyReminder: boolean;
  weeklyReport: boolean;
  overdueAlerts: boolean;
}

// Dashboard Types
export interface DashboardData {
  userStats: UserStats;
  problemCounts: ProblemCount[];
  languageStats: LanguageStats[];
  tagStats: TagProblemCount[];
  recentSubmissions: RecentSubmission[];
  conceptReviews: ConceptReview[];
  contestRanking?: ContestRanking;
}

// Chart Data Types
export interface ChartDataPoint {
  name: string;
  value: number;
  percentage?: number;
  submissions?: number;
}
