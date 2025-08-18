'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { 
  User, 
  Mail, 
  Shield, 
  Bell, 
  Globe, 
  Save, 
  Upload, 
  Eye, 
  EyeOff,
  Github,
  Linkedin,
  Twitter,
  ExternalLink
} from 'lucide-react'

import { useAuthStore } from '@/lib/store'

const profileSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  skills: z.string().optional(),
  github_url: z.string().url('Invalid GitHub URL').optional().or(z.literal('')),
  linkedin_url: z.string().url('Invalid LinkedIn URL').optional().or(z.literal('')),
  twitter_url: z.string().url('Invalid Twitter URL').optional().or(z.literal('')),
  website_url: z.string().url('Invalid website URL').optional().or(z.literal('')),
})

const passwordSchema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
  new_password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string(),
}).refine(data => data.new_password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"],
})

type ProfileFormData = z.infer<typeof profileSchema>
type PasswordFormData = z.infer<typeof passwordSchema>

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [saving, setSaving] = useState(false)
  
  const { user, updateProfile } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.push('/auth/login')
      return
    }
  }, [user, router])

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
    reset: resetProfile,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: user?.full_name || '',
      bio: user?.bio || '',
      skills: user?.skills?.join(', ') || '',
      github_url: user?.social_links?.github || '',
      linkedin_url: user?.social_links?.linkedin || '',
      twitter_url: user?.social_links?.twitter || '',
      website_url: user?.social_links?.website || '',
    },
  })

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPassword,
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  })

  useEffect(() => {
    if (user) {
      resetProfile({
        full_name: user.full_name,
        bio: user.bio || '',
        skills: user.skills?.join(', ') || '',
        github_url: user.social_links?.github || '',
        linkedin_url: user.social_links?.linkedin || '',
        twitter_url: user.social_links?.twitter || '',
        website_url: user.social_links?.website || '',
      })
    }
  }, [user, resetProfile])

  const onProfileSubmit = async (data: ProfileFormData) => {
    setSaving(true)
    try {
      const updateData = {
        full_name: data.full_name,
        bio: data.bio || null,
        skills: data.skills ? data.skills.split(',').map(s => s.trim()).filter(Boolean) : [],
        social_links: {
          github: data.github_url || null,
          linkedin: data.linkedin_url || null,
          twitter: data.twitter_url || null,
          website: data.website_url || null,
        },
      }
      
      await updateProfile(updateData)
      alert('Profile updated successfully!')
    } catch (error) {
      console.error('Failed to update profile:', error)
      alert('Failed to update profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const onPasswordSubmit = async (data: PasswordFormData) => {
    setSaving(true)
    try {
      // Would connect to actual API to change password
      console.log('Changing password...', { current_password: data.current_password, new_password: data.new_password })
      alert('Password changed successfully!')
      resetPassword()
    } catch (error) {
      console.error('Failed to change password:', error)
      alert('Failed to change password. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (!user) {
    return <div>Loading...</div>
  }

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'privacy', name: 'Privacy', icon: Globe },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600">Manage your account settings and preferences</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                    activeTab === tab.id
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <tab.icon className="mr-3 h-5 w-5" />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeTab === 'profile' && (
              <ProfileSettings 
                user={user}
                register={registerProfile}
                handleSubmit={handleProfileSubmit}
                onSubmit={onProfileSubmit}
                errors={profileErrors}
                saving={saving}
              />
            )}
            {activeTab === 'security' && (
              <SecuritySettings 
                user={user}
                register={registerPassword}
                handleSubmit={handlePasswordSubmit}
                onSubmit={onPasswordSubmit}
                errors={passwordErrors}
                saving={saving}
                showCurrentPassword={showCurrentPassword}
                setShowCurrentPassword={setShowCurrentPassword}
                showNewPassword={showNewPassword}
                setShowNewPassword={setShowNewPassword}
                showConfirmPassword={showConfirmPassword}
                setShowConfirmPassword={setShowConfirmPassword}
              />
            )}
            {activeTab === 'notifications' && <NotificationSettings />}
            {activeTab === 'privacy' && <PrivacySettings />}
          </div>
        </div>
      </div>
    </div>
  )
}

// Profile Settings Component
function ProfileSettings({ user, register, handleSubmit, onSubmit, errors, saving }: any) {
  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Profile Information</h3>
        <p className="mt-1 text-sm text-gray-500">Update your personal information and social links.</p>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
        {/* Profile Picture */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Profile Picture
          </label>
          <div className="flex items-center space-x-4">
            <div className="h-20 w-20 bg-primary-600 rounded-full flex items-center justify-center text-white text-2xl font-medium">
              {user.full_name.charAt(0).toUpperCase()}
            </div>
            <button
              type="button"
              className="btn-secondary flex items-center space-x-2"
            >
              <Upload className="h-4 w-4" />
              <span>Change Photo</span>
            </button>
          </div>
        </div>

        {/* Full Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Full Name
          </label>
          <input
            {...register('full_name')}
            type="text"
            className="input-field"
          />
          {errors.full_name && (
            <p className="mt-1 text-sm text-red-600">{errors.full_name.message}</p>
          )}
        </div>

        {/* Bio */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bio
          </label>
          <textarea
            {...register('bio')}
            rows={4}
            className="input-field"
            placeholder="Tell others about yourself..."
          />
          {errors.bio && (
            <p className="mt-1 text-sm text-red-600">{errors.bio.message}</p>
          )}
        </div>

        {/* Skills */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Skills
          </label>
          <input
            {...register('skills')}
            type="text"
            className="input-field"
            placeholder="JavaScript, Python, React, etc. (comma-separated)"
          />
          <p className="mt-1 text-sm text-gray-500">Enter your skills separated by commas</p>
        </div>

        {/* Social Links */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-4">
            Social Links
          </label>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">GitHub</label>
              <div className="relative">
                <Github className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  {...register('github_url')}
                  type="url"
                  className="input-field pl-10"
                  placeholder="https://github.com/username"
                />
              </div>
              {errors.github_url && (
                <p className="mt-1 text-sm text-red-600">{errors.github_url.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">LinkedIn</label>
              <div className="relative">
                <Linkedin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  {...register('linkedin_url')}
                  type="url"
                  className="input-field pl-10"
                  placeholder="https://linkedin.com/in/username"
                />
              </div>
              {errors.linkedin_url && (
                <p className="mt-1 text-sm text-red-600">{errors.linkedin_url.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Twitter</label>
              <div className="relative">
                <Twitter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  {...register('twitter_url')}
                  type="url"
                  className="input-field pl-10"
                  placeholder="https://twitter.com/username"
                />
              </div>
              {errors.twitter_url && (
                <p className="mt-1 text-sm text-red-600">{errors.twitter_url.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Website</label>
              <div className="relative">
                <ExternalLink className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  {...register('website_url')}
                  type="url"
                  className="input-field pl-10"
                  placeholder="https://yourwebsite.com"
                />
              </div>
              {errors.website_url && (
                <p className="mt-1 text-sm text-red-600">{errors.website_url.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-6 border-t">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary flex items-center space-x-2"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  )
}

// Security Settings Component
function SecuritySettings({ 
  user,
  register, 
  handleSubmit, 
  onSubmit, 
  errors, 
  saving,
  showCurrentPassword,
  setShowCurrentPassword,
  showNewPassword,
  setShowNewPassword,
  showConfirmPassword,
  setShowConfirmPassword
}: any) {
  return (
    <div className="space-y-6">
      {/* Change Password */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Change Password</h3>
          <p className="mt-1 text-sm text-gray-500">Update your password to keep your account secure.</p>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Password
            </label>
            <div className="relative">
              <input
                {...register('current_password')}
                type={showCurrentPassword ? 'text' : 'password'}
                className="input-field pr-10"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showCurrentPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
            {errors.current_password && (
              <p className="mt-1 text-sm text-red-600">{errors.current_password.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Password
            </label>
            <div className="relative">
              <input
                {...register('new_password')}
                type={showNewPassword ? 'text' : 'password'}
                className="input-field pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showNewPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
            {errors.new_password && (
              <p className="mt-1 text-sm text-red-600">{errors.new_password.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                {...register('confirm_password')}
                type={showConfirmPassword ? 'text' : 'password'}
                className="input-field pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
            {errors.confirm_password && (
              <p className="mt-1 text-sm text-red-600">{errors.confirm_password.message}</p>
            )}
          </div>

          <div className="flex justify-end pt-6 border-t">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary"
            >
              {saving ? 'Changing Password...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>

      {/* Account Information */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Account Information</h3>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-sm font-medium text-gray-900">Email Address</div>
              <div className="text-sm text-gray-500">{user.email}</div>
            </div>
            <button className="btn-secondary text-sm">Change Email</button>
          </div>
          
          <div className="flex justify-between items-center">
            <div>
              <div className="text-sm font-medium text-gray-900">Account Role</div>
              <div className="text-sm text-gray-500 capitalize">{user.role}</div>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <div>
              <div className="text-sm font-medium text-gray-900">Member Since</div>
              <div className="text-sm text-gray-500">{new Date(user.created_at).toLocaleDateString()}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Notification Settings Component
function NotificationSettings() {
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(false)
  const [eventReminders, setEventReminders] = useState(true)
  const [teamInvites, setTeamInvites] = useState(true)

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Notification Preferences</h3>
        <p className="mt-1 text-sm text-gray-500">Manage how you receive notifications.</p>
      </div>
      
      <div className="p-6 space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-900">Email Notifications</div>
              <div className="text-sm text-gray-500">Receive notifications via email</div>
            </div>
            <input
              type="checkbox"
              checked={emailNotifications}
              onChange={(e) => setEmailNotifications(e.target.checked)}
              className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-900">Push Notifications</div>
              <div className="text-sm text-gray-500">Receive browser push notifications</div>
            </div>
            <input
              type="checkbox"
              checked={pushNotifications}
              onChange={(e) => setPushNotifications(e.target.checked)}
              className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-900">Event Reminders</div>
              <div className="text-sm text-gray-500">Get reminders about upcoming events</div>
            </div>
            <input
              type="checkbox"
              checked={eventReminders}
              onChange={(e) => setEventReminders(e.target.checked)}
              className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-900">Team Invitations</div>
              <div className="text-sm text-gray-500">Get notified when invited to teams</div>
            </div>
            <input
              type="checkbox"
              checked={teamInvites}
              onChange={(e) => setTeamInvites(e.target.checked)}
              className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
          </div>
        </div>

        <div className="flex justify-end pt-6 border-t">
          <button className="btn-primary">Save Preferences</button>
        </div>
      </div>
    </div>
  )
}

// Privacy Settings Component
function PrivacySettings() {
  const [profileVisibility, setProfileVisibility] = useState('public')
  const [showEmail, setShowEmail] = useState(false)
  const [allowMessaging, setAllowMessaging] = useState(true)

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Privacy Settings</h3>
        <p className="mt-1 text-sm text-gray-500">Control who can see your information.</p>
      </div>
      
      <div className="p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Profile Visibility
          </label>
          <select
            value={profileVisibility}
            onChange={(e) => setProfileVisibility(e.target.value)}
            className="input-field"
          >
            <option value="public">Public - Anyone can see your profile</option>
            <option value="participants">Participants Only - Only event participants can see</option>
            <option value="private">Private - Only you can see your profile</option>
          </select>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-900">Show Email Address</div>
              <div className="text-sm text-gray-500">Allow others to see your email address</div>
            </div>
            <input
              type="checkbox"
              checked={showEmail}
              onChange={(e) => setShowEmail(e.target.checked)}
              className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-900">Allow Direct Messages</div>
              <div className="text-sm text-gray-500">Let other users send you direct messages</div>
            </div>
            <input
              type="checkbox"
              checked={allowMessaging}
              onChange={(e) => setAllowMessaging(e.target.checked)}
              className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
          </div>
        </div>

        <div className="flex justify-end pt-6 border-t">
          <button className="btn-primary">Save Privacy Settings</button>
        </div>
      </div>
    </div>
  )
}
