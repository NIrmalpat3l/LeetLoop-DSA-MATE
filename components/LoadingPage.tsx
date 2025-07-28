'use client'

import { motion } from 'framer-motion'

interface LoadingPageProps {
  title?: string
  message?: string
  size?: 'sm' | 'md' | 'lg'
  fullScreen?: boolean
}

export default function LoadingPage({ 
  title = 'Loading', 
  message = 'Please wait while we fetch your data...',
  size = 'md',
  fullScreen = true
}: LoadingPageProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12', 
    lg: 'w-16 h-16'
  }

  const containerClasses = fullScreen 
    ? 'min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100'
    : 'w-full h-64 bg-white'

  return (
    <div className={`${containerClasses} flex items-center justify-center p-4`}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center"
      >
        {/* Animated Loading Spinner */}
        <div className="flex justify-center mb-6">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className={`${sizeClasses[size]} rounded-full border-4 border-gray-200 border-t-blue-500`}
          />
        </div>

        {/* Loading Text */}
        <motion.h2 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-2xl font-bold text-gray-800 mb-3"
        >
          {title}
        </motion.h2>
        
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-gray-600 text-sm leading-relaxed"
        >
          {message}
        </motion.p>

        {/* Animated Dots */}
        <div className="flex justify-center space-x-1 mt-4">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.7, 1, 0.7] 
              }}
              transition={{ 
                duration: 0.8, 
                repeat: Infinity, 
                delay: i * 0.2 
              }}
              className="w-2 h-2 bg-blue-500 rounded-full"
            />
          ))}
        </div>
      </motion.div>
    </div>
  )
}

// Compact inline loading component
export function InlineLoading({ 
  message = 'Loading...',
  size = 'sm' 
}: Pick<LoadingPageProps, 'message' | 'size'>) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8'
  }

  return (
    <div className="flex items-center justify-center space-x-3 py-4">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className={`${sizeClasses[size]} rounded-full border-2 border-gray-300 border-t-blue-500`}
      />
      <span className="text-gray-600 text-sm">{message}</span>
    </div>
  )
}

// Data loading skeleton
export function DataLoadingSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
      <div className="animate-pulse space-y-3">
        {/* Header skeleton */}
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        <div className="h-6 bg-gray-200 rounded w-3/4"></div>
        
        {/* Content skeleton */}
        <div className="space-y-2 pt-4">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          <div className="h-4 bg-gray-200 rounded w-4/6"></div>
        </div>
        
        {/* Button skeleton */}
        <div className="pt-4">
          <div className="h-10 bg-gray-200 rounded w-32"></div>
        </div>
      </div>
    </div>
  )
}
