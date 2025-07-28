'use client'

import { NextUIProvider } from '@nextui-org/react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { useRouter } from 'next/navigation'
import { AuthProvider } from '@/lib/auth-context'
import { ClientEnvProvider } from '@/lib/client-env'

export function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  return (
    <NextUIProvider navigate={router.push}>
      <NextThemesProvider attribute="class" defaultTheme="light" enableSystem>
        <ClientEnvProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ClientEnvProvider>
      </NextThemesProvider>
    </NextUIProvider>
  )
}
