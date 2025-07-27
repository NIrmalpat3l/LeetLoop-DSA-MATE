# 🚀 LeetLoop Vercel Deployment Guide

## Prerequisites

- [Vercel Account](https://vercel.com/signup) (free tier available)
- [GitHub Account](https://github.com) with your LeetLoop repository
- Supabase project set up
- Groq API key

## Quick Deployment (Recommended)

### Method 1: Deploy from GitHub (One-Click)

1. **Push your code to GitHub** (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit: LeetLoop project"
   git branch -M main
   git remote add origin https://github.com/yourusername/leetloop.git
   git push -u origin main
   ```

2. **Deploy to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will automatically detect it's a Next.js project
   - Click "Deploy"

### Method 2: Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy from project directory**:
   ```bash
   vercel
   ```

4. **Follow the prompts**:
   - Link to existing project? → No
   - Project name → leetloop (or your preferred name)
   - Directory → ./
   - Override settings? → No

## Environment Variables Setup

### Required Environment Variables

After deployment, add these environment variables in your Vercel dashboard:

1. **Go to your project in Vercel Dashboard**
2. **Navigate to Settings → Environment Variables**
3. **Add the following variables**:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Groq API Configuration
GROQ_API_KEY=your_groq_api_key

# LeetCode API (Optional)
LEETCODE_API_KEY=your_leetcode_api_key

# Authentication (Optional)
NEXTAUTH_SECRET=your_nextauth_secret
GITHUB_ID=your_github_oauth_id
GITHUB_SECRET=your_github_oauth_secret
GOOGLE_ID=your_google_oauth_id
GOOGLE_SECRET=your_google_oauth_secret
```

### Setting Environment Variables via CLI

```bash
# Add environment variables via CLI
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add GROQ_API_KEY
```

## Domain Configuration

### Custom Domain (Optional)

1. **In Vercel Dashboard**:
   - Go to Settings → Domains
   - Add your custom domain
   - Follow DNS configuration instructions

2. **Free Vercel Domain**:
   - Your app will be available at: `https://your-project-name.vercel.app`
   - You can change the project name in Settings → General

## Build Configuration

Vercel automatically detects Next.js projects, but you can customize the build process:

### vercel.json (Optional)

Create a `vercel.json` file in your project root for custom configuration:

```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "functions": {
    "app/api/**.ts": {
      "maxDuration": 30
    }
  },
  "regions": ["iad1"],
  "env": {
    "NODE_ENV": "production"
  }
}
```

### Build Optimization

1. **Optimize your build**:
   ```json
   // next.config.js
   /** @type {import('next').NextConfig} */
   const nextConfig = {
     experimental: {
       serverComponentsExternalPackages: []
     },
     images: {
       domains: ['avatars.githubusercontent.com', 'lh3.googleusercontent.com']
     }
   }
   
   module.exports = nextConfig
   ```

## Database Setup for Production

### Supabase Production Configuration

1. **Set up Row Level Security**:
   ```sql
   -- Ensure RLS is enabled
   ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
   ALTER TABLE problem_analysis ENABLE ROW LEVEL SECURITY;
   ```

2. **Configure CORS in Supabase**:
   - Go to Settings → API
   - Add your Vercel domain to allowed origins

3. **Update authentication settings**:
   - Add your Vercel domain to Site URL
   - Add to redirect URLs for OAuth

## Deployment Commands

### Development Commands
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Deploy to Vercel
vercel --prod
```

### Useful Vercel CLI Commands
```bash
# Check deployment status
vercel ls

# View deployment logs
vercel logs your-deployment-url

# Remove a deployment
vercel rm deployment-url

# Link local project to Vercel project
vercel link

# Pull environment variables from Vercel
vercel env pull .env.local
```

## Troubleshooting

### Common Issues and Solutions

1. **Build Failures**:
   ```bash
   # Check build logs in Vercel dashboard
   # Common fixes:
   npm run build  # Test locally first
   ```

2. **Environment Variables Not Working**:
   - Ensure variables are added in Vercel dashboard
   - Restart deployment after adding variables
   - Check variable names match exactly

3. **Supabase Connection Issues**:
   - Verify Supabase URL and anon key
   - Check RLS policies
   - Ensure CORS is configured

4. **API Route Timeouts**:
   ```json
   // vercel.json
   {
     "functions": {
       "app/api/**.ts": {
         "maxDuration": 30
       }
     }
   }
   ```

### Debug Mode

Enable debug mode for more detailed logs:

```bash
# Deploy with debug mode
vercel --debug

# Or set environment variable
DEBUG=1 vercel
```

## Performance Optimization

### 1. Enable Analytics
```bash
# Install Vercel Analytics
npm install @vercel/analytics

# Add to your app/layout.tsx
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

### 2. Edge Functions (Optional)
For better performance, consider using Edge Runtime for API routes:

```typescript
// app/api/example/route.ts
export const runtime = 'edge'

export async function GET() {
  return new Response('Hello from Edge!')
}
```

## Monitoring and Maintenance

### 1. Check Deployment Health
- Monitor function execution time
- Check error rates in Vercel dashboard
- Set up alerts for failures

### 2. Automatic Deployments
- Connected GitHub repos auto-deploy on push
- Use branch deployments for testing
- Set up preview deployments for PRs

### 3. Rollbacks
```bash
# Rollback to previous deployment
vercel rollback deployment-url
```

## Security Checklist

- [ ] All environment variables are set
- [ ] Supabase RLS is enabled
- [ ] OAuth redirect URLs are configured
- [ ] API keys are not exposed in client code
- [ ] CORS is properly configured
- [ ] Production URLs are updated in all services

## Post-Deployment

### 1. Update Repository Links
Update your GitHub repository with the live URL:

```markdown
[Live Demo](https://your-project.vercel.app)
```

### 2. Test All Features
- [ ] Authentication works
- [ ] LeetCode data syncing
- [ ] AI analysis functionality
- [ ] Calendar interactions
- [ ] Database operations

### 3. Monitor Performance
- Check Vercel Analytics
- Monitor Supabase usage
- Watch for any API rate limits

## Support

- **Vercel Documentation**: [vercel.com/docs](https://vercel.com/docs)
- **Next.js Deployment**: [nextjs.org/docs/deployment](https://nextjs.org/docs/deployment)
- **Vercel Community**: [github.com/vercel/vercel/discussions](https://github.com/vercel/vercel/discussions)

---

Your LeetLoop app is now ready for production! 🎉
