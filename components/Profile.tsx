'use client'

import { useState, useEffect } from 'react'
import { 
  Card, 
  CardBody, 
  CardHeader, 
  Button, 
  Input, 
  Select, 
  SelectItem, 
  Divider, 
  Avatar,
  Chip,
  Spacer,
  Tabs,
  Tab,
  Badge,
  Tooltip
} from '@nextui-org/react'
import { 
  User, 
  Settings, 
  Save, 
  ArrowLeft, 
  LogOut, 
  Shield,
  Clock,
  Target,
  Mail,
  Calendar,
  Activity,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import LoadingPage from '@/components/LoadingPage'
import Navigation from '@/components/Navigation'
import { useAuth } from '@/lib/auth-context'

interface UserProfile {
  id: string
  email: string
  full_name: string
  leetcode_username: string
  difficulty_preference: string
  daily_goal: number
  created_at: string
  updated_at: string
}

export default function Profile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [originalProfile, setOriginalProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [hasChanges, setHasChanges] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    loadProfile()
  }, [])

  // Check for changes whenever profile updates
  useEffect(() => {
    if (profile && originalProfile) {
      const changes = (
        profile.full_name !== originalProfile.full_name ||
        profile.leetcode_username !== originalProfile.leetcode_username
        // Temporarily disabled until migration is applied
        // || profile.difficulty_preference !== originalProfile.difficulty_preference ||
        // profile.daily_goal !== originalProfile.daily_goal
      )
      setHasChanges(changes)
      console.log('🔄 Profile changes detected:', changes)
      if (changes) {
        console.log('📝 Changed fields:', {
          full_name: profile.full_name !== originalProfile.full_name ? { old: originalProfile.full_name, new: profile.full_name } : null,
          leetcode_username: profile.leetcode_username !== originalProfile.leetcode_username ? { old: originalProfile.leetcode_username, new: profile.leetcode_username } : null,
          // difficulty_preference: profile.difficulty_preference !== originalProfile.difficulty_preference ? { old: originalProfile.difficulty_preference, new: profile.difficulty_preference } : null,
          // daily_goal: profile.daily_goal !== originalProfile.daily_goal ? { old: originalProfile.daily_goal, new: profile.daily_goal } : null,
        })
      }
    }
  }, [profile, originalProfile])

  const loadProfile = async () => {
    console.log('🔍 Starting profile data fetch...')
    try {
      setLoading(true)
      setError('')
      
      console.log('🔐 Getting authenticated user...')
      const { data: { user: authUser }, error: userError } = await supabase.auth.getUser()
      
      if (userError) {
        console.error('❌ Auth error:', userError)
        setError('Authentication error')
        return
      }
      
      if (!authUser) {
        console.error('❌ No authenticated user found')
        setError('Please log in to view your profile')
        return
      }

      console.log('✅ User authenticated:', {
        id: authUser.id,
        email: authUser.email,
        created_at: authUser.created_at
      })

      console.log('📊 Fetching profile data from database...')
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (error) {
        console.error('❌ Database error loading profile:', error)
        console.error('Error details:', {
          message: error.message,
          code: error.code,
          hint: error.hint
        })
        
        if (error.code === 'PGRST116') {
          console.log('ℹ️  Profile not found, this might be a new user')
          setError('Profile not found. You may need to complete your initial setup.')
        } else {
          setError('Failed to load profile data')
        }
      } else {
        console.log('✅ Profile data loaded successfully:', data)
        console.log('📋 Profile details:', {
          id: data.id,
          email: data.email,
          full_name: data.full_name || 'Not set',
          leetcode_username: data.leetcode_username || 'Not set',
          difficulty_preference: data.difficulty_preference || 'Not set',
          daily_goal: data.daily_goal || 'Not set',
          created_at: data.created_at,
          updated_at: data.updated_at
        })
        setProfile(data)
        setOriginalProfile(data)
      }
    } catch (error) {
      console.error('💥 Unexpected error loading profile:', error)
      setError('An unexpected error occurred while loading your profile')
    } finally {
      setLoading(false)
      console.log('🏁 Profile loading completed')
    }
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}
    
    if (!profile?.full_name?.trim()) {
      errors.full_name = 'Full name is required'
    }
    
    if (!profile?.leetcode_username?.trim()) {
      errors.leetcode_username = 'LeetCode username is required'
    } else if (!/^[a-zA-Z0-9_-]+$/.test(profile.leetcode_username)) {
      errors.leetcode_username = 'Username can only contain letters, numbers, hyphens, and underscores'
    }
    
    // Temporarily disabled until migration is applied
    // if (!profile?.difficulty_preference) {
    //   errors.difficulty_preference = 'Please select a difficulty preference'
    // }
    
    // if (!profile?.daily_goal || profile.daily_goal < 1 || profile.daily_goal > 20) {
    //   errors.daily_goal = 'Daily goal must be between 1 and 20 problems'
    // }
    
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSave = async () => {
    if (!profile) return

    console.log('💾 Starting profile save process...')
    console.log('📝 Data to save:', {
      full_name: profile.full_name,
      leetcode_username: profile.leetcode_username,
      difficulty_preference: profile.difficulty_preference,
      daily_goal: profile.daily_goal
    })

    if (!validateForm()) {
      console.log('❌ Validation failed:', validationErrors)
      setError('Please fix the validation errors before saving')
      return
    }

    try {
      setSaving(true)
      setError('')
      setSuccess('')
      
      console.log('🔄 Updating profile in database...')
      const updateData = {
        full_name: profile.full_name,
        leetcode_username: profile.leetcode_username,
        // difficulty_preference: profile.difficulty_preference, // Temporarily disabled until migration
        // daily_goal: profile.daily_goal, // Temporarily disabled until migration
        updated_at: new Date().toISOString()
      }
      
      console.log('📤 Sending update request:', updateData)

      const { error, data } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', profile.id)
        .select()

      if (error) {
        console.error('❌ Database error saving profile:', error)
        console.error('Error details:', {
          message: error.message,
          code: error.code,
          hint: error.hint
        })
        setError('Failed to save profile. Please try again.')
      } else {
        console.log('✅ Profile saved successfully!')
        console.log('📊 Updated profile data:', data)
        setSuccess('Profile saved successfully!')
        setOriginalProfile(profile) // Update original to reset change detection
        setHasChanges(false)
        setTimeout(() => setSuccess(''), 5000)
      }
    } catch (error) {
      console.error('💥 Unexpected error saving profile:', error)
      setError('An unexpected error occurred while saving')
    } finally {
      setSaving(false)
      console.log('🏁 Profile save process completed')
    }
  }

  const resetChanges = () => {
    console.log('🔄 Resetting profile changes...')
    if (originalProfile) {
      setProfile(originalProfile)
      setValidationErrors({})
      setError('')
    }
  }

  if (loading) {
    return (
      <LoadingPage 
        title="Loading Profile"
        message="Please wait while we fetch your account settings and preferences..."
        size="lg"
      />
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Navigation currentPage="profile" />
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Unsaved Changes Indicator */}
        {hasChanges && (
          <div className="mb-4 flex justify-center">
            <Tooltip content="You have unsaved changes">
              <Chip color="warning" variant="flat" size="lg">
                Unsaved Changes
              </Chip>
            </Tooltip>
          </div>
        )}

        {/* Profile Header Card */}
        <Card className="mb-8 shadow-xl border-0 bg-gradient-to-r from-blue-600 to-indigo-600">
          <CardBody className="p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="relative">
                <Badge
                  color="success"
                  content=""
                  placement="bottom-right"
                  className="w-6 h-6"
                >
                  <Avatar
                    icon={<User className="w-8 h-8" />}
                    size="lg"
                    className="w-20 h-20 bg-white/20 text-white border-4 border-white/30"
                  />
                </Badge>
              </div>
              <div className="text-white">
                <h1 className="text-3xl font-bold mb-2">
                  {profile?.full_name || 'Welcome'}
                </h1>
                <p className="text-blue-100 text-lg mb-2">
                  {profile?.email}
                </p>
                <div className="flex flex-wrap gap-3">
                  <Chip 
                    startContent={<Target className="w-3 h-3" />}
                    variant="flat" 
                    className="bg-white/20 text-white"
                    size="sm"
                  >
                    Goal: {profile?.daily_goal || 0} problems/day
                  </Chip>
                  <Chip 
                    startContent={<Activity className="w-3 h-3" />}
                    variant="flat" 
                    className="bg-white/20 text-white"
                    size="sm"
                  >
                    {profile?.difficulty_preference || 'No preference set'}
                  </Chip>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Alert Messages */}
        <div className="space-y-4 mb-8">
          {error && (
            <Card className="border-danger-200 bg-danger-50 shadow-lg">
              <CardBody className="flex flex-row items-center gap-3 p-4">
                <AlertCircle className="w-5 h-5 text-danger-600 flex-shrink-0" />
                <p className="text-danger-700 font-medium">{error}</p>
              </CardBody>
            </Card>
          )}

          {success && (
            <Card className="border-success-200 bg-success-50 shadow-lg">
              <CardBody className="flex flex-row items-center gap-3 p-4">
                <CheckCircle className="w-5 h-5 text-success-600 flex-shrink-0" />
                <p className="text-success-700 font-medium">{success}</p>
              </CardBody>
            </Card>
          )}
        </div>

        {/* Main Content */}
        {profile && (
          <Tabs
            aria-label="Profile sections"
            color="primary"
            variant="underlined"
            classNames={{
              tabList: "gap-6 w-full relative rounded-none p-0 border-b border-divider",
              cursor: "w-full bg-primary",
              tab: "max-w-fit px-0 h-12",
              tabContent: "group-data-[selected=true]:text-primary"
            }}
          >
            <Tab
              key="profile"
              title={
                <div className="flex items-center space-x-2">
                  <Settings className="w-4 h-4" />
                  <span>Profile Settings</span>
                </div>
              }
            >
              <div className="grid lg:grid-cols-3 gap-8 mt-8">
                {/* Main Form */}
                <div className="lg:col-span-2">
                  <Card className="shadow-xl border-0">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between w-full">
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                          <User className="w-5 h-5 text-primary" />
                          Personal Information
                        </h2>
                        {hasChanges && (
                          <Button
                            variant="light"
                            size="sm"
                            onPress={resetChanges}
                            className="text-gray-500"
                          >
                            Reset Changes
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <Divider />
                    <CardBody className="space-y-6 pt-6">
                      <div className="grid gap-6">
                        <Input
                          label="Email Address"
                          value={profile.email || ''}
                          isReadOnly
                          variant="bordered"
                          startContent={<Mail className="w-4 h-4 text-gray-400" />}
                          description="Your email address cannot be changed"
                          className="pointer-events-none"
                        />
                        
                        <Input
                          label="Full Name"
                          value={profile.full_name || ''}
                          onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                          variant="bordered"
                          placeholder="Enter your full name"
                          startContent={<User className="w-4 h-4 text-gray-400" />}
                          isInvalid={!!validationErrors.full_name}
                          errorMessage={validationErrors.full_name}
                          isRequired
                        />
                        
                        <Input
                          label="LeetCode Username"
                          value={profile.leetcode_username || ''}
                          onChange={(e) => setProfile({ ...profile, leetcode_username: e.target.value })}
                          variant="bordered"
                          placeholder="Your LeetCode username"
                          description="This is used to fetch your LeetCode progress and statistics"
                          startContent={
                            <div className="text-gray-400 text-sm font-mono">@</div>
                          }
                          isInvalid={!!validationErrors.leetcode_username}
                          errorMessage={validationErrors.leetcode_username}
                          isRequired
                        />
                      </div>

                      <Divider className="my-6" />

                      <div className="grid sm:grid-cols-2 gap-6">
                        <Select
                          label="Preferred Difficulty"
                          selectedKeys={profile.difficulty_preference ? [profile.difficulty_preference] : []}
                          onSelectionChange={(keys) => {
                            const selectedKey = Array.from(keys)[0] as string
                            setProfile({ ...profile, difficulty_preference: selectedKey })
                          }}
                          variant="bordered"
                          placeholder="Select difficulty level"
                          startContent={<Target className="w-4 h-4 text-gray-400" />}
                          isInvalid={!!validationErrors.difficulty_preference}
                          errorMessage={validationErrors.difficulty_preference}
                          isRequired
                        >
                          <SelectItem key="Easy" startContent="🟢">Easy</SelectItem>
                          <SelectItem key="Medium" startContent="🟡">Medium</SelectItem>
                          <SelectItem key="Hard" startContent="🔴">Hard</SelectItem>
                          <SelectItem key="Mixed" startContent="🎯">Mixed</SelectItem>
                        </Select>
                        
                        <Input
                          label="Daily Goal"
                          type="number"
                          value={profile.daily_goal?.toString() || '1'}
                          onChange={(e) => setProfile({ ...profile, daily_goal: parseInt(e.target.value) || 1 })}
                          variant="bordered"
                          min="1"
                          max="20"
                          placeholder="Problems per day"
                          startContent={<Activity className="w-4 h-4 text-gray-400" />}
                          endContent={<span className="text-gray-400 text-sm">per day</span>}
                          isInvalid={!!validationErrors.daily_goal}
                          errorMessage={validationErrors.daily_goal}
                          isRequired
                        />
                      </div>

                      {/* Save Actions */}
                      <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
                        <Button
                          color="primary"
                          startContent={<Save className="w-4 h-4" />}
                          onPress={handleSave}
                          isLoading={saving}
                          size="lg"
                          className="font-semibold px-8 text-white bg-blue-600 hover:bg-blue-700"
                          isDisabled={!hasChanges}
                        >
                          {saving ? 'Saving Changes...' : 'Save Changes'}
                        </Button>
                        <Button
                          variant="light"
                          onPress={resetChanges}
                          isDisabled={!hasChanges}
                          size="lg"
                          className="text-gray-600 hover:text-gray-800"
                        >
                          Discard Changes
                        </Button>
                      </div>
                    </CardBody>
                  </Card>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                  {/* Account Stats */}
                  <Card className="shadow-xl border-0">
                    <CardHeader>
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Info className="w-4 h-4 text-primary" />
                        Account Information
                      </h3>
                    </CardHeader>
                    <Divider />
                    <CardBody className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span className="text-sm">Member Since</span>
                        </div>
                        <span className="font-semibold text-sm">
                          {profile.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          }) : 'Unknown'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span className="text-sm">Last Updated</span>
                        </div>
                        <span className="font-semibold text-sm">
                          {profile.updated_at ? new Date(profile.updated_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          }) : 'Never'}
                        </span>
                      </div>
                    </CardBody>
                  </Card>

                  {/* Security */}
                  <Card className="shadow-xl border-0">
                    <CardHeader>
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Shield className="w-4 h-4 text-primary" />
                        Security
                      </h3>
                    </CardHeader>
                    <Divider />
                    <CardBody>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-success" />
                          <span className="text-sm text-gray-600">Email verified</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-success" />
                          <span className="text-sm text-gray-600">Secure authentication</span>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </div>
              </div>
            </Tab>
          </Tabs>
        )}
      </div>
    </div>
  )
}
