import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')

  console.log('OAuth callback received:', { code: !!code, error })

  // If there's an error, redirect to home with error
  if (error) {
    console.error('OAuth error:', error)
    return NextResponse.redirect(`${requestUrl.origin}/?error=auth_error`)
  }

  // If there's a code, it means OAuth was successful
  if (code) {
    // Redirect to landing page with success parameter so the auth listener can detect it
    return NextResponse.redirect(`${requestUrl.origin}/?auth=success`)
  }

  // Default redirect to home
  return NextResponse.redirect(`${requestUrl.origin}/`)
}
