import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for our database tables
export interface Profile {
  id: string
  email: string
  full_name: string | null
  username: string | null
  avatar_url: string | null
  leetcode_username: string | null
  github_url: string | null
  twitter_url: string | null
  linkedin_url: string | null
  notification_settings: NotificationSettings | null
  created_at: string
  updated_at: string
}

export interface NotificationSettings {
  email_notifications: boolean
  browser_notifications: boolean
  daily_reminder: boolean
  weekly_report: boolean
  overdue_alerts: boolean
}

export interface ConceptReviewDB {
  id: string
  user_id: string
  concept_name: string
  tag_slug: string
  last_solved_date: string
  next_review_date: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  repetition_count: number
  interval: number
  ease_factor: number
  created_at: string
  updated_at: string
}

export interface UserProgress {
  id: string
  user_id: string
  total_solved: number
  easy_solved: number
  medium_solved: number
  hard_solved: number
  acceptance_rate: number
  global_ranking: number
  last_synced: string
  created_at: string
  updated_at: string
}

// Auth helpers
export const signUp = async (email: string, password: string, fullName: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      }
    }
  })
  return { data, error }
}

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

export const signInWithGitHub = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`
    }
  })
  return { data, error }
}

export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`
    }
  })
  return { data, error }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  return { user, error }
}

// Profile helpers
export const getProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  return { data, error }
}

export const updateProfile = async (userId: string, updates: Partial<Profile>) => {
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single()
  return { data, error }
}

// Concept review helpers
export const getConceptReviews = async (userId: string) => {
  const { data, error } = await supabase
    .from('concept_reviews')
    .select('*')
    .eq('user_id', userId)
    .order('next_review_date', { ascending: true })
  return { data, error }
}

export const createConceptReview = async (conceptReview: Omit<ConceptReviewDB, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('concept_reviews')
    .insert({
      ...conceptReview,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single()
  return { data, error }
}

export const updateConceptReview = async (id: string, updates: Partial<ConceptReviewDB>) => {
  const { data, error } = await supabase
    .from('concept_reviews')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  return { data, error }
}

// User progress helpers
export const getUserProgress = async (userId: string) => {
  const { data, error } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId)
    .single()
  return { data, error }
}

export const updateUserProgress = async (userId: string, progress: Omit<UserProgress, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('user_progress')
    .upsert({
      user_id: userId,
      ...progress,
      last_synced: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single()
  return { data, error }
}
