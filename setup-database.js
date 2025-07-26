// Script to set up the database table in Supabase
import { supabase } from './lib/supabase'

const createAnalysisTable = async () => {
  console.log('🚀 Setting up problem_analysis table in Supabase...')

  try {
    // First, try to drop the table if it exists (for clean setup)
    console.log('🔄 Dropping existing table if present...')
    const { error: dropError } = await supabase.rpc('execute_sql', {
      sql: 'DROP TABLE IF EXISTS problem_analysis CASCADE;'
    })

    if (dropError) {
      console.log('ℹ️ Drop table result:', dropError.message)
    }

    // Create the table
    console.log('🏗️ Creating problem_analysis table...')
    const createTableSQL = `
      -- Create table for storing LeetCode problem analysis
      CREATE TABLE problem_analysis (
        id SERIAL PRIMARY KEY,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        problem_title TEXT NOT NULL,
        problem_slug TEXT NOT NULL,
        difficulty TEXT NOT NULL,
        category TEXT,
        
        -- Analysis results
        concepts_analysis JSONB,
        revision_date DATE NOT NULL,
        confidence_level INTEGER CHECK (confidence_level >= 1 AND confidence_level <= 5),
        
        -- Metadata
        analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        submission_timestamp TEXT,
        
        -- Ensure unique constraint on user + problem
        UNIQUE(user_id, problem_slug)
      );
    `

    const { error: createError } = await supabase.rpc('execute_sql', { sql: createTableSQL })
    
    if (createError) {
      console.error('❌ Error creating table:', createError)
      return false
    }

    console.log('✅ Table created successfully!')

    // Create indexes
    console.log('🔄 Creating indexes...')
    const indexSQL = `
      CREATE INDEX IF NOT EXISTS idx_problem_analysis_user_id ON problem_analysis(user_id);
      CREATE INDEX IF NOT EXISTS idx_problem_analysis_revision_date ON problem_analysis(revision_date);
    `

    const { error: indexError } = await supabase.rpc('execute_sql', { sql: indexSQL })
    
    if (indexError) {
      console.error('❌ Error creating indexes:', indexError)
    } else {
      console.log('✅ Indexes created successfully!')
    }

    // Enable RLS
    console.log('🔒 Setting up Row Level Security...')
    const rlsSQL = `
      ALTER TABLE problem_analysis ENABLE ROW LEVEL SECURITY;
    `

    const { error: rlsError } = await supabase.rpc('execute_sql', { sql: rlsSQL })
    
    if (rlsError) {
      console.error('❌ Error enabling RLS:', rlsError)
    } else {
      console.log('✅ RLS enabled successfully!')
    }

    // Create policies
    console.log('🛡️ Creating RLS policies...')
    const policiesSQL = `
      CREATE POLICY "Users can view own analysis" ON problem_analysis
        FOR SELECT USING (auth.uid() = user_id);

      CREATE POLICY "Users can insert own analysis" ON problem_analysis
        FOR INSERT WITH CHECK (auth.uid() = user_id);

      CREATE POLICY "Users can update own analysis" ON problem_analysis
        FOR UPDATE USING (auth.uid() = user_id);

      CREATE POLICY "Users can delete own analysis" ON problem_analysis
        FOR DELETE USING (auth.uid() = user_id);
    `

    const { error: policiesError } = await supabase.rpc('execute_sql', { sql: policiesSQL })
    
    if (policiesError) {
      console.error('❌ Error creating policies:', policiesError)
    } else {
      console.log('✅ Policies created successfully!')
    }

    console.log('🎉 Database setup completed successfully!')
    return true

  } catch (error) {
    console.error('💥 Setup failed:', error)
    return false
  }
}

// Run the setup
createAnalysisTable().then(success => {
  if (success) {
    console.log('✅ All done! You can now use the analysis features.')
  } else {
    console.log('❌ Setup failed. Please check the errors above.')
  }
  process.exit(success ? 0 : 1)
})
