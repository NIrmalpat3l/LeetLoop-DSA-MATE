# 🔐 Google OAuth Configuration Fix for Vercel Deployment

## Issue Analysis

The error `NS_ERROR_CONNECTION_REFUSED` occurs because:
1. Google OAuth is redirecting to `http://localhost:3000/`
2. This URL is not accessible when deployed on Vercel
3. Your Google Cloud Console project needs updated redirect URIs

## Solution Steps

### 1. Update Google Cloud Console Settings

#### Go to Google Cloud Console:
1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or the one with client ID: `391865297216-e79ng63jpo5qtar2bmtkfuemfh9hsdd1.apps.googleusercontent.com`)
3. Navigate to **APIs & Services** → **Credentials**

#### Update OAuth 2.0 Client:
1. Click on your OAuth 2.0 Client ID
2. In **Authorized redirect URIs**, add your Vercel URLs:

```
# For development (keep this)
http://localhost:3000/auth/callback

# For production (add these)
https://your-app-name.vercel.app/auth/callback
https://leetloop.vercel.app/auth/callback

# Supabase callback URLs
https://wzkarkntsufqbaawobxs.supabase.co/auth/v1/callback
```

#### Update Authorized JavaScript Origins:
```
# For development
http://localhost:3000

# For production
https://your-app-name.vercel.app
https://leetloop.vercel.app
```

### 2. Update Supabase Authentication Settings

#### In Supabase Dashboard:
1. Go to **Authentication** → **URL Configuration**
2. Update **Site URL**:
   ```
   Production: https://your-app-name.vercel.app
   Development: http://localhost:3000
   ```

3. Update **Redirect URLs**:
   ```
   https://your-app-name.vercel.app/**
   http://localhost:3000/**
   ```

### 3. Environment Variables Configuration

#### For Vercel Deployment:
Add these environment variables in your Vercel dashboard:

```env
# Supabase (already have these)
NEXT_PUBLIC_SUPABASE_URL=https://wzkarkntsufqbaawobxs.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6a2Fya250c3VmcWJhYXdvYnhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzOTAwMTQsImV4cCI6MjA2ODk2NjAxNH0.rXAIpK6R5sfJD0UQnFaUPgIi7vH7pYd5lkXBBdKQfUc

# Groq API (already have this)
GROQ_API_KEY=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

# Add these for production
NEXTAUTH_URL=https://your-app-name.vercel.app
NEXTAUTH_SECRET=your-secure-secret-here
```

### 4. Update Your Authentication Code

#### Check your authentication configuration:

Create or update `lib/auth.ts`:

```typescript
// lib/auth.ts
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export const supabase = createClientComponentClient({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
})

// For production, ensure correct redirect URL
export const getAuthRedirectUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    return `${process.env.NEXTAUTH_URL || 'https://your-app-name.vercel.app'}/auth/callback`
  }
  return 'http://localhost:3000/auth/callback'
}
```

### 5. Deployment Steps

#### Option A: Quick Fix (Redeploy)
```bash
# If you haven't deployed yet
vercel

# If already deployed, redeploy with new env vars
vercel --prod
```

#### Option B: Update Existing Deployment
1. Go to Vercel Dashboard
2. Navigate to your project
3. Go to **Settings** → **Environment Variables**
4. Add the missing variables
5. Go to **Deployments** tab
6. Click **Redeploy** on latest deployment

### 6. Testing the Fix

#### Local Testing:
```bash
# Test locally first
npm run dev
# Try Google OAuth at http://localhost:3000
```

#### Production Testing:
1. Visit your Vercel URL
2. Try Google OAuth login
3. Should redirect properly to your app

### 7. Common Issues and Solutions

#### Issue: Still getting localhost redirect
**Solution**: Clear browser cache and cookies for Google accounts

#### Issue: Supabase callback fails
**Solution**: Ensure Supabase redirect URLs include your Vercel domain

#### Issue: Invalid client error
**Solution**: Double-check Google Client ID and Secret in environment variables

### 8. Security Checklist

- [ ] Updated Google Cloud Console redirect URIs
- [ ] Updated Supabase redirect URLs
- [ ] Added production environment variables
- [ ] Removed any hardcoded localhost URLs
- [ ] Verified NEXTAUTH_SECRET is set for production

### 9. Environment Variables Summary

#### Required for Production:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Groq
GROQ_API_KEY=your_groq_api_key

# Auth
NEXTAUTH_URL=https://your-vercel-app.vercel.app
NEXTAUTH_SECRET=your-secure-random-string

# Google OAuth (if using NextAuth)
GOOGLE_CLIENT_ID=391865297216-e79ng63jpo5qtar2bmtkfuemfh9hsdd1.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### 10. Verification Steps

After making these changes:

1. **Test locally**: `npm run dev` and try OAuth
2. **Deploy to Vercel**: `vercel --prod`
3. **Test production**: Visit your Vercel URL and try OAuth
4. **Check logs**: Monitor Vercel function logs for any errors

## Quick Commands

```bash
# Set Vercel environment variables
vercel env add NEXTAUTH_URL
vercel env add NEXTAUTH_SECRET
vercel env add GOOGLE_CLIENT_ID
vercel env add GOOGLE_CLIENT_SECRET

# Redeploy with new variables
vercel --prod
```

This should resolve your OAuth redirect issue! The key is ensuring all redirect URLs point to your actual deployment URL instead of localhost.
