import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  console.log('🔍 Auth callback triggered')
  try {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const error = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')
    
    console.log('📝 Callback params:', { 
      code: !!code, 
      error, 
      errorDescription, 
      origin 
    })

    // Handle OAuth errors
    if (error) {
      console.error('❌ OAuth error in callback:', error, errorDescription)
      return NextResponse.redirect(`${origin}/?error=${encodeURIComponent(error)}`)
    }

    if (code) {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      
      console.log('🔑 Exchanging code for session...')
      
      // Add timeout to prevent hanging
      const exchangePromise = supabase.auth.exchangeCodeForSession(code)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Session exchange timeout')), 10000)
      )
      
      const { error: exchangeError } = await Promise.race([
        exchangePromise,
        timeoutPromise
      ]) as any
      
      if (exchangeError) {
        console.error('❌ Auth exchange error:', exchangeError)
        return NextResponse.redirect(`${origin}/?error=${encodeURIComponent('auth_exchange_failed')}`)
      }
      console.log('✅ Session exchange successful')
    }

    // Always redirect to landing page after auth
    // Landing page will detect auth state and redirect to dashboard
    console.log(`🚀 Redirecting to landing page`)
    return NextResponse.redirect(`${origin}/`)
  } catch (error: any) {
    console.error('💥 Callback error:', error)
    const errorParam = encodeURIComponent(error.message || 'callback_error')
    return NextResponse.redirect(`${request.nextUrl.origin}/?error=${errorParam}`)
  }
}