'use client'

import { Button } from '@nextui-org/react'
import { Brain, User, LogOut, Menu } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'

interface NavigationProps {
  currentPage?: 'landing' | 'dashboard' | 'analysis' | 'profile'
}

export default function Navigation({ currentPage = 'landing' }: NavigationProps) {
  const { user } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <nav className="border-b border-white/20 backdrop-blur-sm bg-white/10 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div 
            className="flex items-center space-x-2 cursor-pointer"
            onClick={() => router.push('/')}
          >
            <Brain className="w-8 h-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">LeetLoop</span>
          </div>

          {/* Navigation Links */}
          {user && (
            <div className="hidden md:flex items-center space-x-6">
              <Button
                variant="light"
                className={`text-gray-700 hover:text-blue-600 ${
                  currentPage === 'dashboard' ? 'text-blue-600 font-semibold' : ''
                }`}
                onPress={() => router.push('/dashboard')}
              >
                Dashboard
              </Button>
              <Button
                variant="light"
                className={`text-gray-700 hover:text-blue-600 ${
                  currentPage === 'analysis' ? 'text-blue-600 font-semibold' : ''
                }`}
                onPress={() => router.push('/analysis')}
              >
                Analysis
              </Button>
              <Button
                variant="light"
                className={`text-gray-700 hover:text-blue-600 ${
                  currentPage === 'profile' ? 'text-blue-600 font-semibold' : ''
                }`}
                onPress={() => router.push('/profile')}
              >
                Profile
              </Button>
            </div>
          )}

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Button
                  variant="ghost"
                  className="text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                  onPress={() => router.push('/profile')}
                >
                  <User className="w-4 h-4 mr-2" />
                  {user.email?.split('@')[0] || 'Profile'}
                </Button>
                <Button
                  variant="ghost"
                  className="text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                  onPress={handleSignOut}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </>
            ) : (
              <div className="text-gray-600">
                Welcome! Please sign in to access your dashboard.
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
