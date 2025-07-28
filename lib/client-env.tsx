'use client'

import { createContext, useContext } from 'react'

// Client-side environment configuration
const ClientEnvContext = createContext<{
  GROQ_API_KEY?: string
}>({})

export function ClientEnvProvider({ children }: { children: React.ReactNode }) {
  // Make environment variables available on client-side
  if (typeof window !== 'undefined') {
    (window as any).__NEXT_PUBLIC_GROQ_API_KEY__ = process.env.NEXT_PUBLIC_GROQ_API_KEY;
    (window as any).__NEXT_PUBLIC_SUPABASE_URL__ = process.env.NEXT_PUBLIC_SUPABASE_URL;
    (window as any).__NEXT_PUBLIC_SUPABASE_ANON_KEY__ = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  }

  return (
    <ClientEnvContext.Provider value={{
      GROQ_API_KEY: process.env.NEXT_PUBLIC_GROQ_API_KEY
    }}>
      {children}
    </ClientEnvContext.Provider>
  )
}

export const useClientEnv = () => useContext(ClientEnvContext)
