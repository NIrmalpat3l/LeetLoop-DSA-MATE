// Database initialization and repair utility
// This function will check and fix the problem_analysis table structure

import { supabase } from '@/lib/supabase'

export async function checkAndFixProblemAnalysisTable() {
  try {
    console.log('🔧 Checking problem_analysis table structure...')
    
    // First, try to query the table to see if it exists and what structure it has
    const { data, error } = await supabase
      .from('problem_analysis')
      .select('*')
      .limit(1)
    
    if (error) {
      console.log('❌ Table error:', error.message)
      
      if (error.message.includes('does not exist') || error.message.includes('user_id does not exist')) {
        console.log('🛠️ Table needs to be created or fixed. Please run the SQL script manually.')
        return {
          needsFixing: true,
          error: error.message,
          suggestion: 'Run the SQL script in Supabase dashboard'
        }
      }
    } else {
      console.log('✅ Table exists and is accessible')
      return {
        needsFixing: false,
        message: 'Table structure is correct'
      }
    }
    
  } catch (error: any) {
    console.error('🔧 Error checking table:', error)
    return {
      needsFixing: true,
      error: error?.message || 'Unknown error'
    }
  }
}

export async function createProblemAnalysisTableIfNeeded() {
  try {
    console.log('🛠️ Attempting to create/fix problem_analysis table...')
    
    // Execute the SQL to create the table with correct structure
    const { error } = await supabase.rpc('create_problem_analysis_table')
    
    if (error) {
      console.error('❌ Failed to create table via RPC:', error)
      return false
    }
    
    console.log('✅ Table created successfully')
    return true
    
  } catch (error: any) {
    console.error('🛠️ Error creating table:', error)
    return false
  }
}
