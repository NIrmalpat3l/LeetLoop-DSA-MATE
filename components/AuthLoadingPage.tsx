'use client'

import { motion } from 'framer-motion'
import { Brain, Shield, CheckCircle } from 'lucide-react'

export default function AuthLoadingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="bg-white rounded-3xl shadow-2xl p-10 max-w-lg w-full text-center border border-blue-100"
      >
        {/* Logo Animation */}
        <motion.div 
          className="flex justify-center mb-8"
          animate={{ 
            rotate: [0, 360],
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            rotate: { duration: 3, repeat: Infinity, ease: "linear" },
            scale: { duration: 2, repeat: Infinity }
          }}
        >
          <div className="relative">
            <Brain className="w-16 h-16 text-blue-600" />
            <motion.div
              className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5 }}
            >
              <CheckCircle className="w-4 h-4 text-white" />
            </motion.div>
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-3xl font-bold text-gray-800 mb-3"
        >
          Welcome to LeetLoop
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-gray-600 text-lg mb-8 leading-relaxed"
        >
          Setting up your personalized coding journey...
        </motion.p>

        {/* Progress Steps */}
        <div className="space-y-4 mb-8">
          {[
            { icon: Shield, text: "Authenticating your account", delay: 0.4 },
            { icon: Brain, text: "Initializing AI analysis", delay: 0.6 },
            { icon: CheckCircle, text: "Preparing your dashboard", delay: 0.8 }
          ].map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: step.delay }}
              className="flex items-center space-x-3 text-left bg-blue-50 rounded-lg p-3"
            >
              <step.icon className="w-5 h-5 text-blue-600" />
              <span className="text-gray-700">{step.text}</span>
              <motion.div
                className="ml-auto w-2 h-2 bg-blue-600 rounded-full"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </motion.div>
          ))}
        </div>

        {/* Loading Animation */}
        <div className="flex justify-center space-x-2">
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              animate={{ 
                y: [0, -10, 0],
                backgroundColor: ["#3B82F6", "#8B5CF6", "#3B82F6"]
              }}
              transition={{ 
                duration: 0.8, 
                repeat: Infinity, 
                delay: i * 0.1 
              }}
              className="w-3 h-3 bg-blue-500 rounded-full"
            />
          ))}
        </div>
      </motion.div>
    </div>
  )
}
