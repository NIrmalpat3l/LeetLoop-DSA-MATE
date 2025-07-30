import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('🛠️ Creating problem_analysis table...')
    
    // SQL to create the table with correct structure
    const createTableSQL = `
      -- Create or recreate the table with the correct structure
      DROP TABLE IF EXISTS problem_analysis CASCADE;

      CREATE TABLE problem_analysis (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          
          -- Problem information
          problem_title TEXT NOT NULL,
          problem_slug TEXT NOT NULL,
          problem_url TEXT,
          difficulty TEXT,
          
          -- Analysis data
          analysis_result JSONB DEFAULT '{}',
          
          -- Timestamps
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          analyzed_at TIMESTAMPTZ DEFAULT NOW(),
          
          -- Ensure uniqueness per user per problem
          UNIQUE(user_id, problem_slug)
      );

      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_problem_analysis_user_id ON problem_analysis(user_id);
      CREATE INDEX IF NOT EXISTS idx_problem_analysis_difficulty ON problem_analysis(difficulty);
      CREATE INDEX IF NOT EXISTS idx_problem_analysis_analyzed_at ON problem_analysis(analyzed_at);

      -- Enable Row Level Security
      ALTER TABLE problem_analysis ENABLE ROW LEVEL SECURITY;

      -- Create RLS policy so users can only access their own data
      DROP POLICY IF EXISTS "Users can only access their own problem analysis" ON problem_analysis;

      CREATE POLICY "Users can only access their own problem analysis" ON problem_analysis
          FOR ALL USING (user_id = auth.uid());

      -- Grant necessary permissions
      GRANT ALL ON problem_analysis TO authenticated;
    `
    
    const { error } = await supabase.rpc('exec_sql', { sql: createTableSQL })
    
    if (error) {
      console.error('❌ Failed to create table:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    console.log('✅ Table created successfully')
    return NextResponse.json({ message: 'Table created successfully' })
    
  } catch (error: any) {
    console.error('🛠️ Error in table creation API:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
