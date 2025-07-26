'use client'

import { useState } from 'react'
import { Button, Card, CardBody, Divider, Input, Modal, ModalContent, ModalHeader, ModalBody, useDisclosure } from '@nextui-org/react'
import { motion } from 'framer-motion'
import { BarChart3, Brain, Calendar, Github, Mail, Target, TrendingUp, Zap } from 'lucide-react'
import { signUp, signIn, signInWithGitHub, signInWithGoogle } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LandingPage() {
  const {isOpen, onOpen, onOpenChange} = useDisclosure()
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: ''
  })
  const router = useRouter()

  const handleAuth = async () => {
    setLoading(true)
    try {
      if (isLogin) {
        const { data, error } = await signIn(formData.email, formData.password)
        if (error) throw error
        if (data.user) {
          // Use window.location for safer redirect
          window.location.href = '/dashboard'
        }
      } else {
        const { data, error } = await signUp(formData.email, formData.password, formData.fullName)
        if (error) throw error
        alert('Please check your email to verify your account!')
        onOpenChange()
      }
    } catch (error: any) {
      console.error('Auth error:', error)
      alert(error.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  const handleOAuthSignIn = async (provider: 'github' | 'google') => {
    setLoading(true)
    try {
      if (provider === 'github') {
        const { error } = await signInWithGitHub()
        if (error) throw error
      } else {
        const { error } = await signInWithGoogle()
        if (error) throw error
      }
    } catch (error: any) {
      console.error('OAuth error:', error)
      alert(error.message || 'OAuth authentication failed')
    } finally {
      setLoading(false)
    }
  }

  const features = [
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: "Progress Analytics",
      description: "Visual charts showing your problem-solving statistics by category and difficulty"
    },
    {
      icon: <Brain className="w-8 h-8" />,
      title: "Spaced Repetition",
      description: "Smart notifications to revisit topics based on forgetting curve principles"
    },
    {
      icon: <Target className="w-8 h-8" />,
      title: "Concept Tracking",
      description: "Track weak areas and get reminders to practice specific topics"
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Performance Insights",
      description: "Detailed analytics on solving patterns, accuracy, and improvement trends"
    },
    {
      icon: <Calendar className="w-8 h-8" />,
      title: "Review Schedule",
      description: "Automated scheduling system to ensure consistent practice and retention"
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "LeetCode Integration",
      description: "Direct API integration for real-time progress tracking and statistics"
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Navigation */}
      <nav className="border-b border-white/20 backdrop-blur-sm bg-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Brain className="w-8 h-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">LeetLoop</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                className="text-gray-700 hover:text-gray-900 hover:bg-gray-100 border-gray-300"
                onPress={() => {
                  setIsLogin(true)
                  onOpen()
                }}
              >
                Log In
              </Button>
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
                onPress={() => {
                  setIsLogin(false)
                  onOpen()
                }}
              >
                Sign Up
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Master LeetCode with
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                {" "}Smart Repetition
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Track your coding progress, get intelligent reminders to revisit concepts, 
              and maintain peak performance with our spaced repetition system.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="text-lg px-8 py-6 text-white bg-blue-600 hover:bg-blue-700 font-medium"
                onPress={() => {
                  setIsLogin(false)
                  onOpen()
                }}
              >
                Get Started Free
              </Button>
              <Button
                size="lg"
                variant="bordered"
                className="text-lg px-8 py-6 border-gray-300 text-gray-700 hover:bg-gray-50 font-medium"
                onPress={() => window.open('/dashboard', '_blank')}
              >
                <Github className="w-5 h-5 mr-2" />
                View Demo
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything you need to excel
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our comprehensive toolkit helps you maintain and improve your coding skills systematically.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardBody className="p-6">
                    <div className="text-blue-600 mb-4">
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600">
                      {feature.description}
                    </p>
                  </CardBody>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Simple steps to transform your coding practice
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Connect Your Account</h3>
              <p className="text-gray-600">Link your LeetCode profile to automatically sync your progress and statistics.</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-purple-600">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Track Progress</h3>
              <p className="text-gray-600">Monitor your solving patterns, accuracy, and identify areas that need attention.</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Get Smart Reminders</h3>
              <p className="text-gray-600">Receive notifications to revisit concepts at optimal intervals for maximum retention.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Ready to level up your coding skills?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of developers who are already using smart repetition to master algorithms.
          </p>
          <Button
            size="lg"
            className="text-lg px-8 py-6 bg-blue-600 hover:bg-blue-700 text-white font-medium"
            onPress={() => {
              setIsLogin(false)
              onOpen()
            }}
          >
            Start Your Journey
          </Button>
        </div>
      </section>

      {/* Auth Modal */}
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="lg">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                {isLogin ? 'Welcome Back' : 'Create Account'}
              </ModalHeader>
              <ModalBody className="pb-6">
                <div className="space-y-4">
                  {!isLogin && (
                    <Input
                      label="Full Name"
                      placeholder="Enter your full name"
                      variant="bordered"
                      value={formData.fullName}
                      onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                      classNames={{
                        input: "text-gray-900",
                        label: "text-gray-700",
                        inputWrapper: "border-gray-300"
                      }}
                    />
                  )}
                  <Input
                    label="Email"
                    placeholder="Enter your email"
                    type="email"
                    variant="bordered"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    classNames={{
                      input: "text-gray-900",
                      label: "text-gray-700",
                      inputWrapper: "border-gray-300"
                    }}
                  />
                  <Input
                    label="Password"
                    placeholder="Enter your password"
                    type="password"
                    variant="bordered"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    classNames={{
                      input: "text-gray-900",
                      label: "text-gray-700",
                      inputWrapper: "border-gray-300"
                    }}
                  />
                  
                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium" 
                    onPress={handleAuth}
                    isLoading={loading}
                  >
                    {isLogin ? 'Sign In' : 'Create Account'}
                  </Button>
                  
                  <div className="relative">
                    <Divider />
                    <span className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-sm text-gray-500">
                      or
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <Button 
                      variant="bordered" 
                      className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 font-medium"
                      onPress={() => handleOAuthSignIn('github')}
                      isLoading={loading}
                    >
                      <Github className="w-4 h-4 mr-2" />
                      Continue with GitHub
                    </Button>
                    <Button 
                      variant="bordered" 
                      className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 font-medium"
                      onPress={() => handleOAuthSignIn('google')}
                      isLoading={loading}
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Continue with Google
                    </Button>
                  </div>
                  
                  <div className="text-center">
                    <Button
                      variant="light"
                      className="text-blue-600 hover:text-blue-800"
                      onPress={() => setIsLogin(!isLogin)}
                    >
                      {isLogin 
                        ? "Don't have an account? Sign up" 
                        : "Already have an account? Sign in"
                      }
                    </Button>
                  </div>
                </div>
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  )
}
