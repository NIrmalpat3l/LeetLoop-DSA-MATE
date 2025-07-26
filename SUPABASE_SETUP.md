# Supabase Setup Guide

## 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in to your account
3. Click "New Project"
4. Choose your organization
5. Enter project details:
   - **Name**: leetcode-reviser
   - **Database Password**: Choose a strong password
   - **Region**: Choose the closest region to your users
6. Click "Create new project"

## 2. Get Your Project Credentials

Once your project is created:

1. Go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (something like `https://xxxxx.supabase.co`)
   - **Anon/Public Key** (starts with `eyJhbGciOi...`)

## 3. Set Up Environment Variables

1. In your project root (`d:\reviser`), create a `.env.local` file
2. Add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 4. Run Database Migrations

1. In your Supabase dashboard, go to **SQL Editor**
2. Copy the contents of `supabase/migrations/001_initial_schema.sql`
3. Paste it into the SQL Editor and click "Run"

This will create all the necessary tables:
- `profiles` - User profile information
- `concept_reviews` - Spaced repetition data
- `user_progress` - LeetCode progress tracking

## 5. Configure Authentication Providers (Optional)

To enable OAuth login:

### GitHub OAuth:
1. Go to **Authentication** → **Providers** → **GitHub**
2. Enable GitHub provider
3. Add your GitHub OAuth app credentials
4. Set redirect URL to: `https://your-project-id.supabase.co/auth/v1/callback`

### Google OAuth:
1. Go to **Authentication** → **Providers** → **Google**
2. Enable Google provider
3. Add your Google OAuth credentials
4. Set redirect URL to: `https://your-project-id.supabase.co/auth/v1/callback`

## 6. Test Your Setup

1. Start your development server: `npm run dev`
2. Open [http://localhost:3000](http://localhost:3000)
3. Try signing up with email/password
4. Check your Supabase dashboard **Authentication** → **Users** to see new users

## Database Schema Overview

### Tables:
- **profiles**: User information and settings
- **concept_reviews**: Spaced repetition learning data
- **user_progress**: LeetCode statistics and progress

### Security:
- Row Level Security (RLS) is enabled
- Users can only access their own data
- Automatic profile creation on signup

## Next Steps

After setup:
1. Test user registration and login
2. Connect your LeetCode account in the profile page
3. Start tracking your progress!

## Troubleshooting

**Common issues:**
- Make sure `.env.local` is in the project root
- Verify your Supabase URL and keys are correct
- Check that migrations ran successfully in SQL Editor
- Ensure your local development server is running on the correct port
