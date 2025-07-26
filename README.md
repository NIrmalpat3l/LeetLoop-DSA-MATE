# 🚀 LeetLoop - Smart LeetCode Progress Tracker

<div align="center">

![LeetLoop Logo](https://img.shields.io/badge/LeetLoop-Smart%20Progress%20Tracker-blue?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgOUwxMC45MSA4LjI2TDEyIDJaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K)

[![Next.js](https://img.shields.io/badge/Next.js-14.0+-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18.0+-61DAFB?style=flat&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=flat&logo=supabase)](https://supabase.com/)
[![Vercel](https://img.shields.io/badge/Vercel-Deployed-000000?style=flat&logo=vercel)](https://vercel.com/)

**AI-powered LeetCode progress tracking with spaced repetition for optimal coding skill retention**

[Live Demo](https://leetloop.vercel.app) • [Features](#features) • [Installation](#installation) • [Contributing](#contributing)

</div>

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Screenshots](#screenshots)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Environment Setup](#environment-setup)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Overview

LeetLoop revolutionizes how developers track and improve their coding skills. By combining LeetCode integration with AI-powered analysis and spaced repetition algorithms, it ensures you never forget what you've learned and continuously strengthen weak areas.

### 🧠 Why Spaced Repetition?

Research shows that spaced repetition is the most effective way to move information from short-term to long-term memory. LeetLoop applies this scientifically-proven method to coding practice, ensuring you maintain and improve your algorithmic thinking skills over time.

## ✨ Features

### 📊 **Smart Analytics Dashboard**
- Real-time LeetCode progress synchronization
- Comprehensive difficulty and topic analysis
- Contest performance tracking
- Language usage statistics
- Visual progress charts and insights

### 🤖 **AI-Powered Analysis**
- **Groq LLM Integration**: Advanced problem categorization
- Concept difficulty assessment and weak point identification
- Personalized revision recommendations
- Smart tagging system for better organization

### 📅 **Intelligent Revision Calendar**
- **Spaced Repetition Algorithm**: Optimized recall intervals
- Category-based icon system for visual organization
- Interactive calendar with difficulty indicators
- Automated scheduling for maximum retention

### 🔄 **Seamless Integration**
- Direct LeetCode API integration
- Automatic submission tracking
- Real-time data synchronization
- GitHub and Google OAuth authentication

### 🎨 **Modern UI/UX**
- Responsive design with NextUI components
- Dark/light theme support
- Smooth animations with Framer Motion
- Intuitive navigation and user experience

## 📸 Screenshots

### Dashboard Overview
![Dashboard](https://via.placeholder.com/800x400/0070f3/ffffff?text=Dashboard+Screenshot)

### AI Analysis View
![Analysis](https://via.placeholder.com/800x400/7c3aed/ffffff?text=AI+Analysis+Screenshot)

### Revision Calendar
![Calendar](https://via.placeholder.com/800x400/059669/ffffff?text=Calendar+Screenshot)

## 🛠 Tech Stack

### **Frontend**
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + NextUI
- **Animations**: Framer Motion
- **Charts**: Recharts
- **Icons**: Lucide React

### **Backend & Database**
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **API**: Next.js API Routes
- **AI**: Groq LLM API

### **External APIs**
- **LeetCode**: Custom GraphQL integration
- **Date Handling**: date-fns

### **Deployment**
- **Platform**: Vercel
- **Domain**: Custom domain support
- **CI/CD**: Automatic deployment on push

## 🚀 Installation

### Prerequisites

- Node.js 18.0 or later
- npm/yarn/pnpm
- Supabase account
- Groq API key

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/leetloop.git
   cd leetloop
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open browser**
   Navigate to `http://localhost:3000`

## 🔧 Environment Setup

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Groq API Configuration
GROQ_API_KEY=your_groq_api_key

# LeetCode API (Optional - for enhanced features)
LEETCODE_API_KEY=your_leetcode_api_key

# Authentication (Optional - for OAuth)
NEXTAUTH_SECRET=your_nextauth_secret
GITHUB_ID=your_github_oauth_id
GITHUB_SECRET=your_github_oauth_secret
GOOGLE_ID=your_google_oauth_id
GOOGLE_SECRET=your_google_oauth_secret
```

### Supabase Database Schema

Run these SQL commands in your Supabase SQL editor:

```sql
-- Create profiles table
create table profiles (
  id uuid references auth.users on delete cascade,
  full_name text,
  leetcode_username text,
  email text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (id)
);

-- Create problem_analysis table
create table problem_analysis (
  id bigint generated by default as identity,
  user_id uuid references auth.users on delete cascade not null,
  problem_title text not null,
  problem_slug text not null,
  difficulty text not null,
  category text not null,
  concepts_analysis jsonb,
  revision_date date not null,
  analyzed_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (id),
  unique(user_id, problem_slug)
);

-- Enable Row Level Security
alter table profiles enable row level security;
alter table problem_analysis enable row level security;

-- Create policies
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = id);

create policy "Users can view own analysis" on problem_analysis for select using (auth.uid() = user_id);
create policy "Users can insert own analysis" on problem_analysis for insert with check (auth.uid() = user_id);
create policy "Users can update own analysis" on problem_analysis for update using (auth.uid() = user_id);
```

## 📖 Usage

### 1. **Account Setup**
- Sign up using email, GitHub, or Google
- Add your LeetCode username in profile settings
- System automatically syncs your submissions

### 2. **Dashboard Features**
- View comprehensive progress statistics
- Track contest performance and ratings
- Monitor language usage and preferences
- Analyze problem-solving patterns

### 3. **AI Analysis**
- Click "Sync & Analyze" to process submissions
- Get AI-powered categorization and difficulty assessment
- Receive personalized study recommendations
- Track concept mastery over time

### 4. **Revision Calendar**
- Switch between difficulty and concept views
- Click calendar days to see scheduled problems
- Follow spaced repetition recommendations
- Track completion and progress

## 🔗 API Documentation

### LeetCode Integration Endpoints

```typescript
// Get user profile and statistics
GET /api/leetcode/user/${username}

// Analyze submissions with AI
POST /api/analyze-submissions
Body: { submissions: Submission[] }
```

### Database Schemas

```typescript
interface Profile {
  id: string
  full_name: string
  leetcode_username: string
  email: string
  avatar_url?: string
}

interface ProblemAnalysis {
  id: number
  user_id: string
  problem_title: string
  problem_slug: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  category: string
  concepts_analysis: {
    concepts: string[]
    algorithm: string
    approach: string
    core_concept: string
  }
  revision_date: string
}
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Code Style

- Use TypeScript for type safety
- Follow ESLint and Prettier configurations
- Write meaningful commit messages
- Add tests for new features

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **LeetCode** for providing the platform and inspiration
- **Supabase** for excellent backend infrastructure
- **Groq** for powerful AI capabilities
- **Next.js** team for the amazing framework
- **Vercel** for seamless deployment

## 📞 Support

- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/yourusername/leetloop/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/yourusername/leetloop/discussions)
- 📧 **Email**: support@leetloop.dev

---

<div align="center">

**[⭐ Star this repo](https://github.com/yourusername/leetloop)** if you find it helpful!

Made with ❤️ by [Your Name](https://github.com/yourusername)

</div>

A comprehensive web application for tracking LeetCode progress with spaced repetition notifications to help maintain and improve coding skills.

## Features

- **Progress Dashboard**: Visual charts showing problem-solving statistics by category
- **Spaced Repetition**: Smart notifications to revisit topics based on forgetting curve
- **LeetCode Integration**: Direct API integration for real-time progress tracking
- **Performance Analytics**: Detailed insights into solving patterns and accuracy
- **Concept Review System**: Organized approach to revisiting weak areas

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **UI Components**: NextUI, Tailwind CSS
- **Charts**: Recharts
- **Authentication**: NextAuth.js
- **API Integration**: LeetCode GraphQL API

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── pages/              # Next.js pages
├── components/         # Reusable components
├── lib/               # Utility functions and API calls
├── types/             # TypeScript type definitions
├── styles/            # Global styles
└── public/            # Static assets
```

## API Integration

The application integrates with LeetCode's GraphQL API to fetch:
- User statistics
- Problem submissions
- Contest performance
- Topic-wise progress

## Spaced Repetition Algorithm

The tool implements a spaced repetition system based on:
- Time since last practice
- Topic difficulty
- Personal success rate
- Forgetting curve principles
