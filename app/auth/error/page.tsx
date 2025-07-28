'use client'

import { Button } from '@nextui-org/react'
import { useRouter } from 'next/navigation'

export default function AuthError() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="text-red-500 text-6xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Authentication Error
        </h1>
        <p className="text-gray-600 mb-6">
          Something went wrong during sign in. Please try again.
        </p>
        <div className="space-y-3">
          <Button 
            color="primary" 
            className="w-full"
            onPress={() => router.push('/')}
          >
            Try Again
          </Button>
          <Button 
            variant="light" 
            className="w-full"
            onPress={() => router.push('/dashboard')}
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}
