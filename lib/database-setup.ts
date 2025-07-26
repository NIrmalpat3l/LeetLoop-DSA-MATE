// Database utilities for checking table existence and setup
import { supabase } from './supabase'

export async function checkDatabaseSetup() {
  try {
    // Try to query the problem_analysis table
    const { data, error } = await supabase
      .from('problem_analysis')
      .select('id')
      .limit(1)

    if (error) {
      if (error.code === '42P01') {
        console.log('🏗️ Table does not exist, attempting to create...')
        return await createDatabaseTable()
      }
      return {
        exists: false,
        error: error.message,
        message: 'Database connection error'
      }
    }

    console.log('✅ Database table "problem_analysis" exists and is accessible')
    return {
      exists: true,
      error: null,
      message: 'Database is ready'
    }
  } catch (error) {
    console.error('❌ Database setup check failed:', error)
    return {
      exists: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Database setup check failed'
    }
  }
}

async function createDatabaseTable() {
  try {
    console.log('🚀 Attempting to create problem_analysis table...')
    
    // Note: This will only work if the user has the proper permissions
    // In most Supabase setups, table creation requires admin access
    const { error } = await supabase.rpc('create_problem_analysis_table')
    
    if (error) {
      console.error('❌ Could not auto-create table:', error.message)
      return {
        exists: false,
        error: 'Table creation failed',
        message: 'Please create the table manually using the SQL from setup-database.md'
      }
    }

    console.log('✅ Table created successfully!')
    return {
      exists: true,
      error: null,
      message: 'Table created automatically'
    }
  } catch (error) {
    console.error('❌ Auto table creation failed:', error)
    return {
      exists: false,
      error: 'Auto-creation not available',
      message: 'Please create the table manually using the SQL from setup-database.md'
    }
  }
}

export async function initializeDatabase() {
  const setupCheck = await checkDatabaseSetup()
  
  if (!setupCheck.exists) {
    console.log(`⚠️ Database not ready: ${setupCheck.message}`)
    // Don't throw error, just log it - let the component handle gracefully
    return setupCheck
  }
  
  return setupCheck
}
